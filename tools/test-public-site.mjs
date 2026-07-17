#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import { auditPublicSite, PUBLIC_MARKERS } from './check-public-site.mjs';

const revision = 'a'.repeat(40);
const version = '2026.07';

function fixtureFetch(overrides = {}) {
  const bodies = {
    '/book/build-info.json': JSON.stringify({
      schemaVersion: 1,
      revision,
      version,
      markers: { day08: PUBLIC_MARKERS.day08 }
    }),
    '/book/': `<meta name="book-version" content="${version}"><meta name="build-revision" content="${revision}">${PUBLIC_MARKERS.home}`,
    '/book/CHANGELOG/': `release ${PUBLIC_MARKERS.changelog}`,
    '/book/curriculum/Day08_L2_Rollups/': PUBLIC_MARKERS.day08,
    ...overrides
  };
  return async (url) => {
    const pathname = new URL(url).pathname;
    const body = bodies[pathname];
    return {
      ok: body !== undefined,
      status: body === undefined ? 404 : 200,
      text: async () => body ?? ''
    };
  };
}

test('accepts a current publication', async () => {
  const result = await auditPublicSite({
    baseUrl: 'https://example.invalid/book/',
    expectedRevision: revision,
    expectedVersion: version,
    fetchImpl: fixtureFetch()
  });
  assert.equal(result.checkedUrls, 4);
});

test('fails when HTTP is 200 but the deployed revision is stale', async () => {
  const stale = JSON.stringify({
    schemaVersion: 1,
    revision: 'b'.repeat(40),
    version,
    markers: { day08: PUBLIC_MARKERS.day08 }
  });
  await assert.rejects(
    auditPublicSite({
      baseUrl: 'https://example.invalid/book/',
      expectedRevision: revision,
      expectedVersion: version,
      fetchImpl: fixtureFetch({ '/book/build-info.json': stale })
    }),
    /revision expected/u
  );
});

test('fails when HTTP is 200 but the deployed book version is stale', async () => {
  const stale = JSON.stringify({
    schemaVersion: 1,
    revision,
    version: '2026.05',
    markers: { day08: PUBLIC_MARKERS.day08 }
  });
  await assert.rejects(
    auditPublicSite({
      baseUrl: 'https://example.invalid/book/',
      expectedRevision: revision,
      expectedVersion: version,
      fetchImpl: fixtureFetch({ '/book/build-info.json': stale })
    }),
    /version expected/u
  );
});

test('fails when a content marker is stale', async () => {
  await assert.rejects(
    auditPublicSite({
      baseUrl: 'https://example.invalid/book/',
      expectedRevision: revision,
      expectedVersion: version,
      fetchImpl: fixtureFetch({ '/book/curriculum/Day08_L2_Rollups/': 'old content' })
    }),
    /Day08 current-review marker/u
  );
});
