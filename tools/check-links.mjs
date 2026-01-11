#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function listMarkdownFiles() {
  const out = execSync('git ls-files -- "*.md"', { encoding: 'utf8' });
  return out
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('<')) {
    const end = trimmed.indexOf('>');
    if (end !== -1) return trimmed.slice(1, end);
  }

  // Support the common pattern: (url "optional title")
  return trimmed.split(/\s+/)[0];
}

function shouldIgnoreUrl(url) {
  if (!url) return true;
  if (url.startsWith('#')) return true;
  if (url.startsWith('/')) return true; // site-relative (Pages/Jekyll) links
  if (url.startsWith('{{') || url.startsWith('{%')) return true; // Liquid

  // Any scheme (http:, https:, ipfs:, mailto:, etc)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return true;

  return false;
}

function formatProblem({ file, line, url }) {
  return `${file}:${line}: missing link target: ${url}`;
}

const markdownFiles = listMarkdownFiles();
const checkedFiles = [];
const problems = [];

for (const file of markdownFiles) {
  if (path.basename(file).startsWith('_')) continue; // templates / internal files
  const absPath = path.resolve(process.cwd(), file);
  const content = fs.readFileSync(absPath, 'utf8');
  const lines = content.split(/\r?\n/);
  checkedFiles.push(file);

  let inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const regex = /\[[^\]]*\]\(([^)]+)\)/g;
    for (const match of line.matchAll(regex)) {
      const raw = match[1] ?? '';
      const url = extractUrl(raw);
      if (shouldIgnoreUrl(url)) continue;

      const urlNoAnchor = url.split('#')[0];
      if (!urlNoAnchor) continue;

      const resolved = path.resolve(path.dirname(absPath), urlNoAnchor);
      if (fs.existsSync(resolved)) continue;

      problems.push({ file, line: i + 1, url });
    }
  }
}

if (problems.length > 0) {
  console.error('Broken relative links found:\n');
  for (const problem of problems) console.error(formatProblem(problem));
  console.error(`\nTotal: ${problems.length}`);
  process.exit(1);
}

console.log(`OK: ${checkedFiles.length} markdown files checked`);
