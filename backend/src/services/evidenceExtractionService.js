const crypto = require('crypto');
const path = require('path');
const logger = require('../utils/logger');

const MAX_TEXT_CHARS = 45000;
const MAX_LINKS = 50;
const URL_FETCH_TIMEOUT_MS = 12000;

function stableId(prefix, value) {
  return `${prefix}_${crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 12)}`;
}

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [value];
}

function cleanText(value) {
  return String(value || '')
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function getMetaContent(html, name) {
  const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i');
  const reversed = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["'][^>]*>`, 'i');
  return decodeHtmlEntities((html.match(pattern) || html.match(reversed) || [])[1] || '');
}

function extractLinks(html, baseUrl) {
  const links = [];
  const seen = new Set();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(html)) && links.length < MAX_LINKS) {
    try {
      const href = new URL(decodeHtmlEntities(match[1]), baseUrl).toString();
      if (seen.has(href)) continue;
      seen.add(href);
      links.push({
        href,
        text: cleanText(match[2].replace(/<[^>]*>/g, ' ')).slice(0, 140),
      });
    } catch {
      // Ignore malformed links.
    }
  }

  return links;
}

function extractHtml(html, url, responseMeta = {}) {
  const title = decodeHtmlEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || url);
  const description = getMetaContent(html, 'description') || getMetaContent(html, 'og:description');
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  return {
    title: cleanText(title).slice(0, 220),
    description: cleanText(description).slice(0, 500),
    links: extractLinks(html, url),
    text: cleanText(decodeHtmlEntities(stripped)),
    metadata: responseMeta,
  };
}

async function fetchUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), URL_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(parsed.toString(), {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'EcosystemOS-Hackathon-Ingestion/1.0',
        Accept: 'text/html,text/plain,application/xhtml+xml',
      },
    });
    const contentType = response.headers.get('content-type') || '';
    const html = await response.text();
    const extracted = extractHtml(html, response.url, {
      submittedUrl: parsed.toString(),
      finalUrl: response.url,
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
      contentType,
    });

    return {
      id: stableId('url', parsed.toString()),
      sourceType: 'url',
      title: extracted.title || parsed.hostname,
      description: extracted.description,
      url: parsed.toString(),
      uploadedAt: new Date().toISOString(),
      extractionStatus: response.ok ? 'extracted' : 'fetch_failed',
      text: extracted.text,
      metadata: {
        ...extracted.metadata,
        links: extracted.links,
      },
      errors: response.ok ? [] : [`Fetch returned HTTP ${response.status}`],
    };
  } finally {
    clearTimeout(timeout);
  }
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(text) {
  const rows = cleanText(text).split('\n').filter((line) => line.trim().length > 0);
  if (rows.length === 0) return { headers: [], records: [], missingFields: [] };

  const headers = parseCsvLine(rows[0]).map((header) => header.trim());
  const records = rows.slice(1).map((line, rowIndex) => {
    const cells = parseCsvLine(line);
    return headers.reduce((record, header, cellIndex) => {
      record[header] = cells[cellIndex] || '';
      record.row_number = rowIndex + 2;
      return record;
    }, {});
  });
  const expectedFields = [
    'mentor_id',
    'startup_id',
    'hours_synced',
    'milestones_completed',
    'blockers_identified',
    'founder_confidence_score',
    'mentor_confidence_score',
  ];
  const missingFields = expectedFields.filter((field) => !headers.includes(field));

  return { headers, records, missingFields };
}

function extractCsvEvidence(text, title = 'Programme cohort CSV', sourceIdSeed = text) {
  const parsed = parseCsv(text);
  const rowSummaries = parsed.records.map((row) => (
    `Row ${row.row_number}: mentor ${row.mentor_id || 'unknown'} with startup ${row.startup_id || 'unknown'}; ` +
    `${row.hours_synced || '0'} hours; milestones: ${row.milestones_completed || 'none'}; ` +
    `blockers: ${row.blockers_identified || 'none'}; confidence founder/mentor: ` +
    `${row.founder_confidence_score || 'n/a'}/${row.mentor_confidence_score || 'n/a'}`
  ));

  return {
    id: stableId('csv', sourceIdSeed),
    sourceType: 'csv',
    title,
    description: `${parsed.records.length} programme/cohort rows parsed`,
    uploadedAt: new Date().toISOString(),
    extractionStatus: parsed.missingFields.length ? 'extracted_with_warnings' : 'extracted',
    text: cleanText(rowSummaries.join('\n')),
    metadata: {
      headers: parsed.headers,
      rowCount: parsed.records.length,
      missingFields: parsed.missingFields,
      records: parsed.records,
    },
    errors: parsed.missingFields.map((field) => `Missing expected CSV field: ${field}`),
  };
}

function parseWhatsAppText(text) {
  const messages = [];
  const participants = new Set();
  const followUps = [];
  const unresolvedAsks = [];
  const blockers = [];
  const warmth = [];
  const lines = cleanText(text).split('\n');
  const messagePattern = /^\[?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]?\s[-–]\s([^:]+):\s([\s\S]*)$/i;

  for (const line of lines) {
    const match = line.match(messagePattern);
    if (!match) {
      if (messages.length > 0) {
        messages[messages.length - 1].message += `\n${line}`;
      }
      continue;
    }

    const [, date, time, sender, message] = match;
    const entry = {
      date,
      time,
      sender: sender.trim(),
      message: message.trim(),
    };
    messages.push(entry);
    participants.add(entry.sender);

    const lowered = entry.message.toLowerCase();
    if (/(follow up|next step|send|share|intro|introduce|circle back|schedule|book)/.test(lowered)) {
      followUps.push(entry);
    }
    if (/\?|can you|could you|please|waiting for|need you to/.test(lowered)) {
      unresolvedAsks.push(entry);
    }
    if (/(blocker|blocked|stuck|delay|risk|issue|concern|cannot|can't|waiting)/.test(lowered)) {
      blockers.push(entry);
    }
    if (/(thanks|thank you|great|helpful|excited|appreciate|love|good progress)/.test(lowered)) {
      warmth.push(entry);
    }
  }

  const messageCounts = messages.reduce((counts, message) => {
    counts[message.sender] = (counts[message.sender] || 0) + 1;
    return counts;
  }, {});

  return {
    participants: [...participants],
    firstDate: messages[0]?.date || null,
    lastDate: messages[messages.length - 1]?.date || null,
    messageCount: messages.length,
    messageCounts,
    followUps: followUps.slice(0, 12),
    unresolvedAsks: unresolvedAsks.slice(-12),
    blockers: blockers.slice(-12),
    warmthScore: messages.length ? Math.round((warmth.length / messages.length) * 100) : 0,
    mentorResponsiveness: messages.length > 5 ? 'enough_messages_to_assess' : 'insufficient_messages',
  };
}

function extractWhatsAppEvidence(text, title = 'WhatsApp mentor export', sourceIdSeed = text) {
  const parsed = parseWhatsAppText(text);
  const summary = [
    `Participants: ${parsed.participants.join(', ') || 'unknown'}`,
    `Dates: ${parsed.firstDate || 'unknown'} to ${parsed.lastDate || 'unknown'}`,
    `Messages: ${parsed.messageCount}`,
    `Warmth score: ${parsed.warmthScore}`,
    `Follow-ups: ${parsed.followUps.map((item) => `${item.sender}: ${item.message}`).join(' | ') || 'none'}`,
    `Unresolved asks: ${parsed.unresolvedAsks.map((item) => `${item.sender}: ${item.message}`).join(' | ') || 'none'}`,
    `Blockers: ${parsed.blockers.map((item) => `${item.sender}: ${item.message}`).join(' | ') || 'none'}`,
  ];

  return {
    id: stableId('whatsapp', sourceIdSeed),
    sourceType: 'whatsapp',
    title,
    description: `${parsed.messageCount} messages across ${parsed.participants.length} participants`,
    uploadedAt: new Date().toISOString(),
    extractionStatus: 'extracted',
    text: cleanText(summary.join('\n\n')),
    metadata: parsed,
    errors: [],
  };
}

function extractDocxText(buffer) {
  try {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(buffer);
    const documentXml = zip.getEntry('word/document.xml');
    if (!documentXml) return '';
    return cleanText(
      documentXml
        .getData()
        .toString('utf8')
        .replace(/<w:tab\/>/g, ' ')
        .replace(/<\/w:p>/g, '\n')
        .replace(/<[^>]+>/g, ' '),
    );
  } catch (err) {
    logger.warn(`DOCX extraction fallback used: ${err.message}`);
    return '';
  }
}

function extractZipWhatsAppText(buffer) {
  try {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(buffer);
    const txtEntry = zip.getEntries().find((entry) => !entry.isDirectory && entry.entryName.toLowerCase().endsWith('.txt'));
    return txtEntry ? txtEntry.getData().toString('utf8') : '';
  } catch (err) {
    logger.warn(`WhatsApp zip extraction failed: ${err.message}`);
    return '';
  }
}

function extractPdfText(buffer) {
  const raw = buffer.toString('latin1');
  const textOperators = [...raw.matchAll(/\(([^()]{2,})\)\s*Tj/g)].map((match) => match[1]);
  const fallback = buffer.toString('utf8').replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ');
  return cleanText(textOperators.length ? textOperators.join(' ') : fallback);
}

function extractFileEvidence(file) {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const filename = file.originalname || `upload-${Date.now()}`;
  const seed = `${filename}:${file.size}:${Date.now()}`;
  let sourceType = 'document';
  let text = '';
  const errors = [];

  if (extension === '.csv') {
    return {
      ...extractCsvEvidence(file.buffer.toString('utf8'), filename, seed),
      filename,
      mimeType: file.mimetype,
    };
  }

  if (extension === '.zip') {
    const chatText = extractZipWhatsAppText(file.buffer);
    if (chatText) {
      return {
        ...extractWhatsAppEvidence(chatText, filename, seed),
        filename,
        mimeType: file.mimetype,
      };
    }
    errors.push('ZIP did not contain a readable WhatsApp .txt export.');
  }

  if (extension === '.pdf') {
    sourceType = 'pdf';
    text = extractPdfText(file.buffer);
  } else if (extension === '.docx') {
    sourceType = 'docx';
    text = extractDocxText(file.buffer);
    if (!text) errors.push('DOCX text extraction returned no readable text.');
  } else {
    sourceType = ['.txt', '.md', '.note', '.notes'].includes(extension) ? 'note' : 'document';
    text = file.buffer.toString('utf8');
  }

  return {
    id: stableId(sourceType, seed),
    sourceType,
    title: filename,
    description: `${sourceType.toUpperCase()} upload`,
    filename,
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString(),
    extractionStatus: text ? (errors.length ? 'extracted_with_warnings' : 'extracted') : 'extraction_failed',
    text: cleanText(text),
    metadata: {
      size: file.size,
      extension,
    },
    errors,
  };
}

async function extractEvidenceFromRequest({ body = {}, files = [] }) {
  const evidence = [];
  const urls = asArray(body.urls || body.url);
  const notes = asArray(body.notes || body.note);

  for (const url of urls) {
    try {
      evidence.push(await fetchUrl(url));
    } catch (err) {
      evidence.push({
        id: stableId('url', url),
        sourceType: 'url',
        title: url,
        description: 'URL fetch failed',
        url,
        uploadedAt: new Date().toISOString(),
        extractionStatus: 'fetch_failed',
        text: '',
        metadata: { submittedUrl: url },
        errors: [err.message],
      });
    }
  }

  if (body.csvText) {
    evidence.push(extractCsvEvidence(body.csvText, body.csvTitle || 'Inline cohort CSV', body.csvText));
  }

  if (body.whatsappText) {
    evidence.push(extractWhatsAppEvidence(body.whatsappText, body.whatsappTitle || 'Inline WhatsApp export', body.whatsappText));
  }

  notes.forEach((note, index) => {
    evidence.push({
      id: stableId('note', `${index}:${note}`),
      sourceType: 'note',
      title: `Operator note ${index + 1}`,
      description: 'Inline note submitted by operator',
      uploadedAt: new Date().toISOString(),
      extractionStatus: 'extracted',
      text: cleanText(note),
      metadata: {},
      errors: [],
    });
  });

  files.forEach((file) => evidence.push(extractFileEvidence(file)));

  return evidence;
}

module.exports = {
  cleanText,
  extractEvidenceFromRequest,
  extractCsvEvidence,
  extractWhatsAppEvidence,
  parseCsv,
  parseWhatsAppText,
};
