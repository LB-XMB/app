#!/usr/bin/env node
/**
 * Upserts an IPA version into store/sidestore.json (newest first).
 *
 * Usage:
 *   node tools/update-sidestore.cjs --version 1.0.6 --ipa path/to.ipa [--notes "..."]
 *   node tools/update-sidestore.cjs --version 1.0.6 --size 19368461 [--date ISO] [--notes "..."]
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const STORE_PATH = path.join(ROOT, 'store/sidestore.json');
const DOWNLOAD_BASE = 'https://git.lbxmb.fr/lbxmb/app/releases/download';
const MAX_VERSIONS = 12;

function arg(name, fallback = undefined) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function usage() {
  console.error(
    'Usage: node tools/update-sidestore.cjs --version X.Y.Z (--ipa FILE | --size N) [--notes TEXT] [--date ISO]'
  );
  process.exit(2);
}

const version = arg('version', process.env.APP_VERSION);
const ipaPath = arg('ipa');
const notes =
  (arg('notes', process.env.RELEASE_NOTES) || '').trim() || `Version ${version}.`;
const date = arg('date', new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'));

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) usage();

let size = Number.parseInt(arg('size', ''), 10);
if (ipaPath) {
  size = fs.statSync(ipaPath).size;
}
if (!Number.isFinite(size) || size <= 0) usage();

const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
const app = store.apps?.[0];
if (!app) {
  console.error('store/sidestore.json: missing apps[0]');
  process.exit(1);
}

const entry = {
  version,
  date,
  localizedDescription: notes,
  downloadURL: `${DOWNLOAD_BASE}/v${version}/lbxmb_${version}_ios-unsigned.ipa`,
  size,
  minOSVersion: '16.4',
};

const versions = Array.isArray(app.versions) ? app.versions : [];
const without = versions.filter((v) => v.version !== version);
app.versions = [entry, ...without].slice(0, MAX_VERSIONS);

fs.writeFileSync(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`);
console.log(`SideStore: ${version} (${size} bytes) → ${STORE_PATH}`);
