import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const forbidden = [
  /skipSsl/i,
  /rejectUnauthorized\s*:\s*false/,
  /console\.log\([^)]*(token|secret|code|state|nonce)/i,
  /Math\.random\s*\(/,
];

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    return stat.isDirectory() ? walk(path) : [path];
  });
}

const files = walk('src').filter((file) => /\.[cm]?[tj]sx?$/.test(file));
const violations = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(content)) {
      violations.push(`${file}: ${pattern}`);
    }
  }
}

if (violations.length > 0) {
  console.error('Security check failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Security check passed');
