#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function readText(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function unquote(value) {
  const trimmed = String(value ?? '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseYamlScalars(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const match = line.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (!match) continue;
    values[match[1]] = unquote(match[2]);
  }
  return values;
}

function parseFrontMatter(file) {
  const text = readText(file);
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    errors.push(`${file}: front matter is missing`);
    return {};
  }
  return parseYamlScalars(match[1]);
}

function parseGitHubRepositoryUrl(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${label}: expected a non-empty GitHub repository URL`);
    return null;
  }

  try {
    const parsed = new URL(value.trim().replace(/\.git$/, ''));
    const [owner, repo, ...rest] = parsed.pathname.replace(/^\//, '').split('/');
    if (parsed.hostname !== 'github.com' || !owner || !repo || rest.length) {
      errors.push(`${label}: expected https://github.com/<owner>/<repo>[.git], got ${JSON.stringify(value)}`);
      return null;
    }
    return {
      owner,
      repo,
      slug: `${owner}/${repo}`,
      url: `https://github.com/${owner}/${repo}`,
      gitUrl: `https://github.com/${owner}/${repo}.git`,
    };
  } catch (error) {
    errors.push(`${label}: expected a valid URL, got ${JSON.stringify(value)} (${error.message})`);
    return null;
  }
}

function expectEqual(label, actual, expected) {
  if (actual !== expected) {
    errors.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function expectTruthy(label, actual) {
  if (!actual) {
    errors.push(`${label}: expected a non-empty value`);
  }
}

const bookConfig = readJson('book-config.json');
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const docsConfig = parseYamlScalars(readText('docs/_config.yml'));
const docsIndex = parseFrontMatter('docs/index.md');
const repository = parseGitHubRepositoryUrl(bookConfig.repository && bookConfig.repository.url, 'book-config.json repository.url');

const owner = repository ? repository.owner : 'itdojp';
const repo = repository ? repository.repo : 'ethereum-learning-bootcamp';
const repoSlug = `${owner}/${repo}`;
const repoUrl = `https://github.com/${repoSlug}`;
const repoGitUrl = `${repoUrl}.git`;
const pagesBaseUrl = `https://${owner}.github.io`;
const pagesUrl = `${pagesBaseUrl}/${repo}/`;
const issuesUrl = `${repoUrl}/issues`;

expectEqual('book-config.json title', bookConfig.title, 'Ethereum Learning Bootcamp');
expectTruthy('book-config.json description', bookConfig.description);
expectEqual('book-config.json language', bookConfig.language, 'ja');
expectEqual('book-config.json license', bookConfig.license, 'CC-BY-NC-SA-4.0');
expectEqual('book-config.json repository.branch', bookConfig.repository && bookConfig.repository.branch, 'main');

expectEqual('package.json name', pkg.name, repo);
expectEqual('package.json description', pkg.description, bookConfig.description);
expectEqual('package.json author', pkg.author, bookConfig.author);
expectEqual('package.json license', pkg.license, bookConfig.license);
expectEqual('package.json repository.url', pkg.repository && pkg.repository.url, repoGitUrl);
expectEqual('package.json homepage', pkg.homepage, pagesUrl);
expectEqual('package.json bugs.url', pkg.bugs && pkg.bugs.url, issuesUrl);
expectEqual('package.json scripts.check:metadata', pkg.scripts && pkg.scripts['check:metadata'], 'node tools/check-metadata.mjs');

expectEqual('package-lock.json name', lock.name, repo);
expectEqual('package-lock.json packages[""].name', lock.packages && lock.packages[''] && lock.packages[''].name, repo);
expectEqual('package-lock.json packages[""].license', lock.packages && lock.packages[''] && lock.packages[''].license, bookConfig.license);

expectEqual('docs/_config.yml title', docsConfig.title, bookConfig.title);
expectEqual('docs/_config.yml description', docsConfig.description, bookConfig.description);
expectEqual('docs/_config.yml author', docsConfig.author, bookConfig.author);
expectEqual('docs/_config.yml version', docsConfig.version, bookConfig.version);
expectEqual('docs/_config.yml lang', docsConfig.lang, bookConfig.language);
expectEqual('docs/_config.yml url', docsConfig.url, pagesBaseUrl);
expectEqual('docs/_config.yml baseurl', docsConfig.baseurl, `/${repo}`);
expectEqual('docs/_config.yml repository', docsConfig.repository, repoSlug);

expectEqual('docs/index.md front matter title', docsIndex.title, bookConfig.title);
expectEqual('docs/index.md front matter description', docsIndex.description, bookConfig.description);
expectEqual('docs/index.md front matter author', docsIndex.author, bookConfig.author);
expectEqual('docs/index.md front matter version', docsIndex.version, bookConfig.version);

if (errors.length) {
  console.error('Metadata consistency check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Metadata consistency check passed.');
console.log(`Repository: ${repoSlug}`);
console.log(`Book version: ${bookConfig.version}`);
console.log(`Pages: ${pagesUrl}`);
