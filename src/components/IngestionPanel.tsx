import { FileUp, Play, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { parseCohortCsv } from '../domain/csv';
import type { CohortSyncRow } from '../domain/types';

type IngestionPanelProps = {
  onRows: (rows: CohortSyncRow[]) => void;
  onError: (message: string) => void;
};

function parseAndSend(csvText: string, onRows: (rows: CohortSyncRow[]) => void, onError: (message: string) => void) {
  const parsed = parseCohortCsv(csvText);
  if (!parsed.ok) {
    onError(parsed.message);
    return;
  }
  onRows(parsed.rows);
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17211c]';

export function IngestionPanel({ onRows, onError }: IngestionPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  async function processSampleCsv() {
    setIsLoadingSample(true);
    try {
      const response = await fetch('/monthly-sync-sample.csv');
      if (!response.ok) throw new Error('Sample CSV request failed.');
      parseAndSend(await response.text(), onRows, onError);
    } catch {
      onError('Sample CSV could not be loaded.');
    } finally {
      setIsLoadingSample(false);
    }
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    try {
      parseAndSend(await file.text(), onRows, onError);
    } catch {
      onError('CSV file could not be read.');
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0] ?? null);
    event.target.value = '';
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files[0] ?? null);
  }

  return (
    <section className="transition-surface border border-[#9d8f77] bg-[#fffaf0] p-5">
      <div className="mb-5">
        <div>
          <p className="ui-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#6c715f]">
            Monthly ingestion
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-none">Refresh cohort evidence</h2>
        </div>
        <button
          type="button"
          onClick={() => void processSampleCsv()}
          disabled={isLoadingSample}
          className={`ui-sans mt-5 inline-flex w-full items-center justify-center gap-2 border border-[#17211c] bg-[#17211c] px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#f7f1e5] transition hover:bg-[#2b382f] disabled:cursor-wait disabled:opacity-60 ${focusRing}`}
        >
          <Play size={16} strokeWidth={2.2} aria-hidden="true" />
          Process Raw Information
        </button>
        <button
          type="button"
          onClick={() => void processSampleCsv()}
          disabled={isLoadingSample}
          className={`ui-sans mt-3 inline-flex w-full items-center justify-center gap-2 border border-[#9d8f77] bg-[#f7f1e5] px-3 py-2 text-sm font-semibold text-[#17211c] transition hover:bg-[#ede4d1] disabled:cursor-wait disabled:opacity-60 ${focusRing}`}
        >
          <Upload size={16} strokeWidth={2} aria-hidden="true" />
          {isLoadingSample ? 'Loading sample' : 'Use sample CSV'}
        </button>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex min-h-48 flex-col items-center justify-center border border-dashed p-6 text-center transition ${
          isDragging ? 'border-[#17211c] bg-[#ede4d1]' : 'border-[#9d8f77] bg-[#f7f1e5]'
        }`}
      >
        <FileUp size={30} strokeWidth={1.8} className="text-[#4d5d53]" aria-hidden="true" />
        <p className="mt-4 text-2xl font-semibold leading-tight">Drop monthly sync CSV</p>
        <p className="ui-sans mt-2 max-w-sm text-sm leading-6 text-[#59675e]">
          Or drop a CSV here. Every path runs the same raw-information processor.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`ui-sans mt-5 border border-[#17211c] bg-[#f7f1e5] px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#17211c] transition hover:bg-[#ede4d1] ${focusRing}`}
        >
          Choose CSV
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          tabIndex={-1}
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    </section>
  );
}
