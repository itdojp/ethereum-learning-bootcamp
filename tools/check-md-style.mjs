#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function listTargetMarkdownFiles() {
  const out = execSync(
    [
      'git ls-files --',
      '"docs/curriculum/*.md"',
      '"docs/reports/*.md"',
      '"docs/appendix/*.md"',
    ].join(' '),
    { encoding: 'utf8' }
  );
  return out
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function scanInlineCodeTrailingSpace(line) {
  const problems = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] !== '`') {
      i++;
      continue;
    }

    let j = i;
    while (j < line.length && line[j] === '`') j++;
    const delim = line.slice(i, j);
    const k = line.indexOf(delim, j);
    if (k === -1) break;

    const content = line.slice(j, k);
    if (content.endsWith(' ') || content.endsWith('\t')) {
      problems.push({ column: i + 1, content });
    }

    i = k + delim.length;
  }
  return problems;
}

function isBadNvmInitLine(line) {
  // Copy/paste trap in bash: `\\.` becomes the command `\.` and can fail with `\.: command not found`.
  // Intended forms:
  // - `[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"`
  // - `[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`
  return line.includes('nvm.sh') && line.includes('&&') && line.includes('\\\\.');
}

function formatProblem({ file, line, message }) {
  return `${file}:${line}: ${message}`;
}

const markdownFiles = listTargetMarkdownFiles();
const problems = [];

for (const file of markdownFiles) {
  const absPath = path.resolve(process.cwd(), file);
  const content = fs.readFileSync(absPath, 'utf8');
  const lines = content.split(/\r?\n/);

  let inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      // Some bash typos live inside code fences and won't be caught by prose/table rules.
      if (isBadNvmInitLine(line)) {
        problems.push({
          file,
          line: i + 1,
          message: 'contains bad nvm init pattern `\\\\.` (use `\\.` or `.` instead)',
        });
      }
      continue;
    }

    // Prevent invalid-looking table separators from being rendered as text.
    // These typically show up on Pages as `|—|—|—|` when the table block isn't parsed.
    if (/\|[—–]/.test(line)) {
      problems.push({
        file,
        line: i + 1,
        message: 'contains em/en dash inside a pipe-table (likely broken table parsing)',
      });
    }

    // Tables in kramdown are sensitive to paragraph boundaries.
    // A table block should be preceded and followed by a blank line.
    const prev = i > 0 ? lines[i - 1] : '';
    if (line.startsWith('|') && prev.trim() && !prev.trimStart().startsWith('|')) {
      problems.push({
        file,
        line: i + 1,
        message: 'table line must be preceded by a blank line (kramdown/GFM stability)',
      });
    }
    if (!line.startsWith('|') && line.trim() && prev.trimStart().startsWith('|')) {
      // If the previous line was a table row and current is a new block, enforce a blank line.
      problems.push({
        file,
        line: i + 1,
        message: 'table block must be followed by a blank line (kramdown/GFM stability)',
      });
    }

    // Common anti-pattern: header row and separator row on the same line.
    // Example: `| A | B | |---|---|`
    if (/\|\s*\|---/.test(line)) {
      problems.push({
        file,
        line: i + 1,
        message: 'looks like a one-line table (missing newline between header and separator)',
      });
    }

    const inlineCode = scanInlineCodeTrailingSpace(line);
    for (const hit of inlineCode) {
      problems.push({
        file,
        line: i + 1,
        message: `inline code has trailing whitespace before closing backtick (column ${hit.column})`,
      });
    }
  }
}

if (problems.length > 0) {
  console.error('Markdown style problems found:\n');
  for (const p of problems) console.error(formatProblem(p));
  console.error(`\nTotal: ${problems.length}`);
  process.exit(1);
}

console.log(`OK: ${markdownFiles.length} markdown files checked`);
