import assert from 'node:assert/strict';
import test from 'node:test';

import { auditWorkflowDirectory, classifyUsesReference } from './check-action-pins.mjs';

test('active workflows use full commit SHA pins', async () => {
  const result = await auditWorkflowDirectory('.github/workflows');

  assert.deepEqual(result.workflowFiles, [
    'book-qa.yml',
    'deploy.yml',
    'docs-forbidden-check.yml',
    'nav-link-check.yml',
    'test.yml',
  ]);
  assert.equal(result.references.length, 18);
  assert.equal(result.references.filter(({ kind }) => kind === 'external-action').length, 18);
});

test('mutable tag fixture fails closed', async () => {
  await assert.rejects(
    auditWorkflowDirectory('tools/fixtures/action-pins/mutable-tag'),
    /not pinned to a full commit SHA: actions\/checkout@v6/,
  );
});

test('local, Docker, and reusable workflow references are classified explicitly', () => {
  assert.equal(classifyUsesReference('./.github/actions/local').kind, 'local');
  assert.equal(classifyUsesReference('docker://alpine:3.22').kind, 'docker');
  assert.equal(
    classifyUsesReference(
      'example/repository/.github/workflows/reusable.yml@0123456789abcdef0123456789abcdef01234567',
    ).kind,
    'reusable-workflow',
  );
});
