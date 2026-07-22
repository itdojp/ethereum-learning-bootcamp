#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FULL_COMMIT_SHA = /^[0-9a-f]{40}$/;
const WORKFLOW_EXTENSIONS = new Set(['.yml', '.yaml']);

function parseUsesScalar(rawValue, file, lineNumber) {
  const raw = rawValue.trim();
  if (!raw) {
    throw new Error(`${file}:${lineNumber}: uses must not be empty`);
  }

  if (raw.startsWith("'") || raw.startsWith('"')) {
    const quote = raw[0];
    const closing = raw.indexOf(quote, 1);
    if (closing === -1) {
      throw new Error(`${file}:${lineNumber}: unterminated quoted uses value`);
    }
    const remainder = raw.slice(closing + 1).trim();
    if (remainder && !remainder.startsWith('#')) {
      throw new Error(`${file}:${lineNumber}: unsupported content after uses value`);
    }
    return raw.slice(1, closing);
  }

  return raw.replace(/\s+#.*$/, '').trim();
}

export function classifyUsesReference(reference) {
  if (reference.startsWith('./')) {
    return { kind: 'local', reference };
  }
  if (reference.startsWith('docker://')) {
    return { kind: 'docker', reference };
  }

  const separator = reference.lastIndexOf('@');
  if (separator <= 0 || separator === reference.length - 1) {
    throw new Error(`external uses reference must include @<40-character commit SHA>: ${reference}`);
  }

  const target = reference.slice(0, separator);
  const revision = reference.slice(separator + 1);
  if (target.split('/').length < 2) {
    throw new Error(`external uses target must include owner/repository: ${reference}`);
  }
  if (!FULL_COMMIT_SHA.test(revision)) {
    throw new Error(`external uses reference is not pinned to a full commit SHA: ${reference}`);
  }

  return {
    kind: target.includes('/.github/workflows/') ? 'reusable-workflow' : 'external-action',
    reference,
    revision,
  };
}

export function extractUsesReferences(content, file) {
  const references = [];
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    const match = line.match(/^\s*(?:-\s*)?uses\s*:\s*(.*)$/);
    if (!match) continue;

    const lineNumber = index + 1;
    const reference = parseUsesScalar(match[1], file, lineNumber);
    try {
      references.push({ file, line: lineNumber, ...classifyUsesReference(reference) });
    } catch (error) {
      throw new Error(`${file}:${lineNumber}: ${error.message}`);
    }
  }
  return references;
}

export async function auditWorkflowDirectory(workflowDirectory = '.github/workflows') {
  const root = resolve(workflowDirectory);
  const entries = await readdir(root, { withFileTypes: true });
  const workflowEntries = entries
    .filter((entry) => WORKFLOW_EXTENSIONS.has(extname(entry.name)))
    .sort((left, right) => left.name.localeCompare(right.name));

  if (workflowEntries.length === 0) {
    throw new Error(`no active workflow YAML files found in ${workflowDirectory}`);
  }

  const references = [];
  for (const entry of workflowEntries) {
    if (!entry.isFile()) {
      throw new Error(`active workflow entry must be a regular file: ${entry.name}`);
    }
    const absolutePath = resolve(root, entry.name);
    const displayPath = relative(process.cwd(), absolutePath) || entry.name;
    references.push(...extractUsesReferences(await readFile(absolutePath, 'utf8'), displayPath));
  }

  return {
    workflowFiles: workflowEntries.map((entry) => entry.name),
    references,
  };
}

async function main() {
  const workflowDirectory = process.argv[2] || '.github/workflows';
  const result = await auditWorkflowDirectory(workflowDirectory);
  const counts = new Map();
  for (const item of result.references) {
    counts.set(item.kind, (counts.get(item.kind) || 0) + 1);
    console.log(`${item.file}:${item.line}: ${item.kind}: ${item.reference}`);
  }
  const summary = [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([kind, count]) => `${kind}=${count}`)
    .join(', ');
  console.log(
    `GitHub Actions pin check passed: workflows=${result.workflowFiles.length}, references=${result.references.length}${summary ? `, ${summary}` : ''}`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`GitHub Actions pin check failed: ${error.message}`);
    process.exitCode = 1;
  });
}
