import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src', 'public'];
const FORBIDDEN = [
  'linear-gradient',
  'radial-gradient',
  'conic-gradient',
  'repeating-linear-gradient',
  'repeating-radial-gradient',
  'background-clip: text',
];

function filesUnder(dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return filesUnder(path);
    return [path];
  });
}

const files = ROOTS.flatMap(filesUnder).filter((file) => /\.(css|tsx|ts|html|svg)$/.test(file));
const failures = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const token of FORBIDDEN) {
    if (content.includes(token)) {
      failures.push(`${file}: contains ${token}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`No gradient usage found across ${files.length} files.`);
