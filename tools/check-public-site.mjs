#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

export const PUBLIC_MARKERS = Object.freeze({
  day08: 'ethereum-roadmap-reviewed-2026-07-11',
  changelog: '2026.07',
  home: 'Ethereum Learning Bootcamp'
});

async function fetchText(url, fetchImpl) {
  const response = await fetchImpl(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
    headers: { 'cache-control': 'no-cache' }
  });
  if (!response.ok) throw new Error(`${url}: expected HTTP 200, got ${response.status}`);
  return response.text();
}

function cacheBusted(relative, base, revision) {
  const url = new URL(relative, base);
  url.searchParams.set('revision', revision);
  return url;
}

export async function auditPublicSite({
  baseUrl,
  expectedRevision,
  expectedVersion,
  fetchImpl = fetch
}) {
  if (!/^[0-9a-f]{40}$/u.test(expectedRevision)) {
    throw new Error('expected revision must be a full 40-character lowercase commit SHA');
  }
  if (!/^\d{4}\.\d{2}$/u.test(expectedVersion)) {
    throw new Error('expected version must use YYYY.MM');
  }

  const normalizedBase = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  const [buildText, home, changelog, day08] = await Promise.all([
    fetchText(cacheBusted('build-info.json', normalizedBase, expectedRevision), fetchImpl),
    fetchText(cacheBusted('', normalizedBase, expectedRevision), fetchImpl),
    fetchText(cacheBusted('CHANGELOG/', normalizedBase, expectedRevision), fetchImpl),
    fetchText(cacheBusted('curriculum/Day08_L2_Rollups/', normalizedBase, expectedRevision), fetchImpl)
  ]);

  let build;
  try {
    build = JSON.parse(buildText);
  } catch (error) {
    throw new Error(`build-info.json is not valid JSON: ${error.message}`);
  }

  const failures = [];
  if (build.revision !== expectedRevision) failures.push(`revision expected ${expectedRevision}, got ${build.revision}`);
  if (build.version !== expectedVersion) failures.push(`version expected ${expectedVersion}, got ${build.version}`);
  if (build.markers?.day08 !== PUBLIC_MARKERS.day08) failures.push('build-info Day08 marker is stale');
  if (!home.includes(`name="book-version" content="${expectedVersion}"`)) failures.push('Home book-version meta is stale');
  if (!home.includes(`name="build-revision" content="${expectedRevision}"`)) failures.push('Home build-revision meta is stale');
  if (!home.includes(PUBLIC_MARKERS.home)) failures.push('Home content marker is missing');
  if (!changelog.includes(PUBLIC_MARKERS.changelog)) failures.push('CHANGELOG latest version marker is missing');
  if (!day08.includes(PUBLIC_MARKERS.day08)) failures.push('Day08 current-review marker is missing');

  if (failures.length) throw new Error(`public site is stale:\n- ${failures.join('\n- ')}`);
  return {
    revision: build.revision,
    version: build.version,
    checkedUrls: 4
  };
}

function argument(name, fallback) {
  const prefix = `--${name}=`;
  const entry = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : fallback;
}

async function main() {
  const baseUrl = argument('base-url', 'https://itdojp.github.io/ethereum-learning-bootcamp/');
  const expectedRevision = argument('expected-revision', process.env.EXPECTED_REVISION);
  const expectedVersion = argument('expected-version', process.env.EXPECTED_VERSION || '2026.07');
  const result = await auditPublicSite({ baseUrl, expectedRevision, expectedVersion });
  console.log(`Public site is current: revision=${result.revision}, version=${result.version}, URLs=${result.checkedUrls}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
