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
  readme.includes('`MAINNET_RPC_URL`: Mainnet の read / Verify') &&
    readme.includes('GitHub Actions から本番 network へ deploy しない'),
  'README must keep production RPC read-only and deploy automation testnet-only'
);

const day08 = read('docs/curriculum/Day08_L2_Rollups.md');
const changelog = read('docs/CHANGELOG.md');
const home = read('docs/index.md');
const buildInfo = read('docs/build-info.json');
const jekyllConfig = read('docs/_config.yml');
const bookLayout = read('docs/_layouts/book.html');
const packageJson = JSON.parse(read('package.json'));
const curriculumIndex = read('docs/curriculum/index.md');
const day03 = read('docs/curriculum/Day03_Env_Setup.md');
const day08Current = read('docs/curriculum/Day08_L2_Rollups.md');
const testWorkflow = read('.github/workflows/test.yml');
const deployWorkflow = read('.github/workflows/deploy.yml');
const bookQaWorkflow = read('.github/workflows/book-qa.yml');
const navWorkflow = read('.github/workflows/nav-link-check.yml');
check(day08.includes('ethereum-roadmap-reviewed-2026-07-11'), 'Day08 current-review marker is missing');
check(changelog.includes('## 2026.07'), 'CHANGELOG latest 2026.07 section is missing');
check(home.includes('version: "2026.07"'), 'Home front matter version must be 2026.07');
check(buildInfo.includes('ethereum-roadmap-reviewed-2026-07-11'), 'build-info must expose the Day08 marker');
check(buildInfo.includes('site.github.build_revision'), 'build-info must expose the Pages build revision');
check(jekyllConfig.includes('jekyll-github-metadata'), 'Jekyll must load GitHub metadata for build_revision');
check(bookLayout.includes('name="book-version"'), 'book layout must expose book-version meta');
check(bookLayout.includes('name="build-revision"'), 'book layout must expose build-revision meta');
check(packageJson.engines?.node === '>=22.13.0', 'package.json Node.js minimum must be >=22.13.0');
for (const [relative, content] of [
  ['README.md', readme],
  ['docs/index.md', home],
  ['docs/curriculum/index.md', curriculumIndex],
  ['docs/curriculum/Day03_Env_Setup.md', day03]
]) {
  check(content.includes('Node.js 22.13.0'), `${relative}: Node.js minimum must be 22.13.0`);
  check(content.includes('Hardhat 3.11.0'), `${relative}: audited Hardhat version must be 3.11.0`);
}
check(
  !curriculumIndex.includes('Hardhat: 2.x') && !curriculumIndex.includes('Hardhat toolbox'),
  'curriculum index must not retain the pre-migration Hardhat 2 toolchain'
);
check(home.includes('確認日: **2026-07-22（Asia/Tokyo）**'), 'Home toolchain review date must be 2026-07-22');
check(
  curriculumIndex.includes('2026-07-22（Asia/Tokyo）時点'),
  'Curriculum toolchain review date must be 2026-07-22'
);
for (const [relative, content] of [
  ['README.md', readme],
  ['docs/index.md', home],
  ['docs/curriculum/index.md', curriculumIndex],
  ['docs/curriculum/Day03_Env_Setup.md', day03]
]) {
  check(content.includes('npm run install:reviewed'), `${relative}: reviewed local install command is missing`);
}
check(
  day08Current.includes('chainType: "generic", chainId: 1101') &&
    day08Current.includes('configVariable("POLYGON_ZKEVM_RPC_URL")'),
  'Day08 Polygon zkEVM example must match the Hardhat 3 chain descriptor'
);
check(
  /permissions:\s*\n\s*contents:\s*read/u.test(testWorkflow),
  'test workflow must keep GITHUB_TOKEN contents read-only'
);
check(
  testWorkflow.includes("node-version: ['22.13.0', '24']") &&
    testWorkflow.includes('node-version: ${{ matrix.node-version }}'),
  'test workflow must exercise both the exact minimum Node.js version and Node.js 24'
);
check(
  (deployWorkflow.match(/node-version:\s*['"]22\.13\.0['"]/gu) ?? []).length === 2,
  'deploy workflow must use the audited minimum Node.js version in both jobs'
);
for (const [relative, content] of [
  ['.github/workflows/test.yml', testWorkflow],
  ['.github/workflows/deploy.yml', deployWorkflow],
  ['.github/workflows/book-qa.yml', bookQaWorkflow],
  ['.github/workflows/nav-link-check.yml', navWorkflow]
]) {
  check(!/node-version:\s*['"]?20['"]?/u.test(content), `${relative}: Node.js 20 setup remains`);
}

if (errors.length) {
  console.error('Documentation consistency check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Documentation consistency check passed.');
console.log('Checked numbered headings for Day01-Day14 and publication markers for version 2026.07.');
