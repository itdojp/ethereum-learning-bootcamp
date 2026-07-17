#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function check(condition, message) {
  if (!condition) errors.push(message);
}

function numberedHeadings(relative) {
  const headings = [];
  let fence = null;
  const lines = read(relative).split(/\r?\n/u);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = line.match(/^\s*(```+|~~~+)/u);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      fence = fence === null ? marker : fence === marker ? null : fence;
      continue;
    }
    if (fence !== null) continue;
    const match = line.match(/^(#{2,6})\s+(\d+(?:\.\d+)*)(?:\.)?(?:\s|$)/u);
    if (match) {
      headings.push({
        line: index + 1,
        level: match[1].length,
        parts: match[2].split('.').map(Number),
        number: match[2]
      });
    }
  }
  return headings;
}

for (const filename of fs.readdirSync(path.join(root, 'docs/curriculum')).sort()) {
  if (!/^Day\d+.*\.md$/u.test(filename)) continue;
  const relative = `docs/curriculum/${filename}`;
  const headings = numberedHeadings(relative);
  check(headings.length > 0, `${relative}: no numbered headings detected`);
  const latest = new Map();
  const previousByParent = new Map();

  for (const heading of headings) {
    const expectedParts = heading.level - 1;
    if (heading.parts.length !== expectedParts) {
      errors.push(`${relative}:${heading.line}: heading ${heading.number} does not match Markdown level ${heading.level}`);
      continue;
    }

    if (heading.parts.length > 1) {
      const parent = heading.parts.slice(0, -1).join('.');
      const parentLevel = heading.level - 1;
      if (latest.get(parentLevel) !== parent) {
        errors.push(`${relative}:${heading.line}: heading ${heading.number} does not match current parent ${latest.get(parentLevel) ?? '(none)'}`);
      }
    }

    const parentKey = heading.parts.slice(0, -1).join('.');
    const orderKey = `${heading.level}:${parentKey}`;
    const current = heading.parts.at(-1);
    const previous = previousByParent.get(orderKey);
    if (previous !== undefined && current <= previous) {
      errors.push(`${relative}:${heading.line}: heading ${heading.number} duplicates or reverses a previous sibling`);
    }
    previousByParent.set(orderKey, current);

    latest.set(heading.level, heading.number);
    for (const level of [...latest.keys()]) {
      if (level > heading.level) latest.delete(level);
    }
  }
}

const readme = read('README.md');
const oldQuickStart = ['`npm ci` → `', '.env.example', '` をコピー → `npm test`'].join('');
check(!readme.includes(oldQuickStart), 'README must not require copying .env before local npm test');
check(
  readme.includes('`MAINNET_RPC_URL` / `PRIVATE_KEY`'),
  'README external-network setup must include the Mainnet RPC and private-key variables'
);

const day08 = read('docs/curriculum/Day08_L2_Rollups.md');
const changelog = read('docs/CHANGELOG.md');
const home = read('docs/index.md');
const buildInfo = read('docs/build-info.json');
const jekyllConfig = read('docs/_config.yml');
const bookLayout = read('docs/_layouts/book.html');
check(day08.includes('ethereum-roadmap-reviewed-2026-07-11'), 'Day08 current-review marker is missing');
check(changelog.includes('## 2026.07'), 'CHANGELOG latest 2026.07 section is missing');
check(home.includes('version: "2026.07"'), 'Home front matter version must be 2026.07');
check(buildInfo.includes('ethereum-roadmap-reviewed-2026-07-11'), 'build-info must expose the Day08 marker');
check(buildInfo.includes('site.github.build_revision'), 'build-info must expose the Pages build revision');
check(jekyllConfig.includes('jekyll-github-metadata'), 'Jekyll must load GitHub metadata for build_revision');
check(bookLayout.includes('name="book-version"'), 'book layout must expose book-version meta');
check(bookLayout.includes('name="build-revision"'), 'book layout must expose build-revision meta');

if (errors.length) {
  console.error('Documentation consistency check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Documentation consistency check passed.');
console.log('Checked numbered headings for Day01-Day14 and publication markers for version 2026.07.');
