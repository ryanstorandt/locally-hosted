#!/usr/bin/env node
// Build (and optionally append) an episodes.json record from a YouTube video URL.
//
// No API key and no dependencies — it scrapes the public watch page for the
// embedded `ytInitialPlayerResponse` JSON (title, description, keywords, publish
// date), cleans it the same way the catalog was originally built, assigns the
// next episode id, and prepends the record to episodes.json (newest-first).
//
// Usage:
//   node scripts/add-episode.mjs <youtube_url|videoId> [options]
//
// Options:
//   --short <url>     YouTube Shorts URL for this episode (the short is a
//                     separate video, so it can't be derived from the long URL)
//   --spotify <url>   Spotify episode URL
//   --source <url>    Override the auto-detected source_url
//   --dry             Print the record as JSON, do NOT write episodes.json
//   --json <path>     Path to episodes.json (default: ../episodes.json)
//
// Examples:
//   node scripts/add-episode.mjs https://www.youtube.com/watch?v=_ll7_UoUauc
//   node scripts/add-episode.mjs _ll7_UoUauc --short https://youtube.com/shorts/WeHrJjSKb2Y
//   node scripts/add-episode.mjs <url> --dry

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- CLI parsing ----------
const argv = process.argv.slice(2);
const positional = [];
const opts = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--short') opts.short = argv[++i];
  else if (a === '--spotify') opts.spotify = argv[++i];
  else if (a === '--source') opts.source = argv[++i];
  else if (a === '--json') opts.json = argv[++i];
  else if (a === '--dry') opts.dry = true;
  else if (a === '-h' || a === '--help') opts.help = true;
  else positional.push(a);
}

if (opts.help || positional.length === 0) {
  console.log(`Usage: node scripts/add-episode.mjs <youtube_url|videoId> [--short <url>] [--spotify <url>] [--source <url>] [--json <path>] [--dry]`);
  process.exit(opts.help ? 0 : 1);
}

const EPISODES = path.resolve(opts.json || path.join(__dirname, '..', 'episodes.json'));

function parseVideoId(input) {
  const m = String(input).match(/(?:v=|\/shorts\/|youtu\.be\/|\/embed\/|\/live\/)([\w-]{11})/);
  if (m) return m[1];
  if (/^[\w-]{11}$/.test(input)) return input;
  return null;
}

// ---------- YouTube scraping ----------
function extractBalancedJson(html, varName) {
  const marker = `${varName} = `;
  const at = html.indexOf(marker);
  if (at === -1) return null;
  let i = at + marker.length;
  while (i < html.length && html[i] !== '{') i++;
  const begin = i;
  let depth = 0, inStr = false, esc = false;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  try { return JSON.parse(html.slice(begin, i)); } catch { return null; }
}

async function fetchPlayerResponse(videoId) {
  // Scrape the public watch page for the embedded ytInitialPlayerResponse.
  // `bpctr` + a consent cookie skip the EU/consent interstitial. This works fine
  // from a normal (residential) IP; YouTube bot-blocks datacenter IPs, which is
  // why this is a local script rather than a CI job.
  const url = `https://www.youtube.com/watch?v=${videoId}&hl=en&gl=US&bpctr=9999999999&has_verified=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': 'CONSENT=YES+1; SOCS=CAI',
    },
  });
  if (!res.ok) throw new Error(`YouTube returned HTTP ${res.status} for ${videoId}`);
  const html = await res.text();
  const pr = extractBalancedJson(html, 'ytInitialPlayerResponse');
  if (!pr || !pr.videoDetails) {
    if (/confirm you[’']?re not a bot|consent\.youtube/i.test(html)) {
      throw new Error('YouTube returned a bot/consent check for this connection. Run this from your normal network (not a VPN/datacenter IP) and try again.');
    }
    throw new Error('Could not read video metadata — is the video private, age-restricted, or unavailable?');
  }
  return pr;
}

async function fetchMeta(videoId) {
  const pr = await fetchPlayerResponse(videoId);
  const vd = pr.videoDetails;
  const mf = (pr.microformat && pr.microformat.playerMicroformatRenderer) || {};

  // Prefer the richest timestamp available.
  const liveStart = pr.microformat?.playerMicroformatRenderer?.liveBroadcastDetails?.startTimestamp;
  const publishDate = liveStart || mf.publishDate || mf.uploadDate || null;

  return {
    id: videoId,
    title: vd.title || '',
    description: vd.shortDescription || (mf.description && mf.description.simpleText) || '',
    keywords: vd.keywords || [],
    publishDate,
  };
}

// ---------- Cleaning (ported from the original catalog build) ----------
const GENERIC_TAGS = new Set([
  'locally hosted', 'ai podcast', 'ai generated podcast', 'tech news', 'tech breakdown',
  'developer news', 'podcast', 'ai', 'machine learning', 'technology', 'tech',
]);

function cleanTitle(t) {
  return (t || '').replace(/\s*\|\s*Locally Hosted\s*$/i, '').trim();
}

function firstSourceUrl(desc) {
  if (!desc) return '';
  for (const line of desc.split(/\n+/)) {
    if (/source/i.test(line)) {
      const u = line.match(/https?:\/\/[^\s)]+/);
      if (u) return u[0].replace(/[.,)]+$/, '');
    }
  }
  for (const u of (desc.match(/https?:\/\/[^\s)]+/g) || [])) {
    if (!/youtube\.com|youtu\.be|spotify\.com|tiktok\.com|instagram\.com|twitter\.com|x\.com|facebook\.com/i.test(u)) {
      return u.replace(/[.,)]+$/, '');
    }
  }
  return '';
}

function shortDescription(desc) {
  if (!desc) return '';
  let intro = desc;

  const emojiCls = '[\\u{1F300}-\\u{1FAFF}\\u2600-\\u27BF\\u2B00-\\u2BFF]';
  const allRe = new RegExp(emojiCls, 'gu');
  const allPositions = [];
  let em;
  while ((em = allRe.exec(intro)) !== null) allPositions.push(em.index);
  const isBulletMarker = (idx) => {
    const prev = intro[idx - 1];
    if (prev === '.' || prev === '!' || prev === '?') return true;
    let j = idx - 1;
    while (j >= 0 && (intro[j] === ' ' || intro[j] === '\t')) j--;
    return j >= 0 && intro[j] === '\n';
  };
  let listEmojiAt = -1;
  for (let i = 0; i < allPositions.length; i++) {
    const p = allPositions[i];
    if (!isBulletMarker(p)) continue;
    if (allPositions.some(q => q > p && q - p <= 200)) { listEmojiAt = p; break; }
  }

  const cutSignals = [
    /\n\s*[•\-\*]/,
    /\bwhat\b[^.!?]*\byou['’]?ll learn\b/i,
    /\byou['’]?ll learn\b\s*:?/i,
    /\byou['’]?ll discover\b/i,
    /\bwhat we(?:['’]?ll)? cover\b/i,
    /\bhere['’]?s what\b/i,
    /\bin this (?:episode|video)[^.!?]*:/i,
    /\btopics covered\b/i,
    /\btimestamps?\b/i,
    /\bkey takeaways\b/i,
    /\bchapters\b/i,
    /\n\s*Source/i,
    /\n\s*#/,
  ];
  let cutAt = intro.length;
  if (listEmojiAt >= 0) cutAt = listEmojiAt;
  for (const re of cutSignals) {
    const mm = intro.match(re);
    if (mm && mm.index < cutAt) cutAt = mm.index;
  }
  intro = intro.slice(0, cutAt);

  intro = intro.replace(/[\u{1F000}-\u{1FAFF}\u2600-\u27BF\u2300-\u23FF\u2B00-\u2BFF\u2190-\u21FF\uFE0F\u200D]/gu, '');
  intro = intro.replace(/\s+/g, ' ').replace(/[\s,;:–—-]+$/u, '').trim();

  if (intro.length > 360) {
    const cut = intro.slice(0, 360);
    const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    intro = stop > 140 ? cut.slice(0, stop + 1).trim() : cut.replace(/[\s,;:]+$/, '').trim() + '…';
  }
  if (!/[.!?…]$/.test(intro)) {
    const stop = Math.max(intro.lastIndexOf('. '), intro.lastIndexOf('! '), intro.lastIndexOf('? '));
    if (stop > 50) intro = intro.slice(0, stop + 1).trim();
  }
  return intro;
}

function pickTags(keywords) {
  const out = [];
  const seen = new Set();
  for (const k of (keywords || [])) {
    const key = k.toLowerCase().trim();
    if (!key || GENERIC_TAGS.has(key) || key.length > 28 || seen.has(key)) continue;
    seen.add(key);
    out.push(k.trim());
    if (out.length >= 5) break;
  }
  return out;
}

function nextEpisodeId(episodes) {
  let max = 0;
  for (const e of episodes) {
    const n = parseInt(String(e.id || '').replace(/\D/g, ''), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `ep${String(max + 1).padStart(3, '0')}`;
}

// ---------- Main ----------
const videoId = parseVideoId(positional[0]);
if (!videoId) {
  console.error('Could not parse a YouTube video id from:', positional[0]);
  process.exit(1);
}

const meta = await fetchMeta(videoId);

let episodes = [];
if (fs.existsSync(EPISODES)) {
  episodes = JSON.parse(fs.readFileSync(EPISODES, 'utf8'));
}

const youtube_url = `https://www.youtube.com/watch?v=${videoId}`;
const dup = episodes.find(e => e.youtube_url === youtube_url || parseVideoId(e.youtube_url || '') === videoId);
if (dup && !opts.dry) {
  console.error(`⚠️  ${dup.id} already references this video (${youtube_url}). Nothing to do.`);
  process.exit(2);
}

const record = {
  id: nextEpisodeId(episodes),
  title: cleanTitle(meta.title),
  description: shortDescription(meta.description),
  source_url: opts.source || firstSourceUrl(meta.description),
  youtube_short_url: opts.short || '',
  youtube_url,
  spotify_url: opts.spotify || '',
  tags: pickTags(meta.keywords),
  published_at: meta.publishDate ? new Date(meta.publishDate).toISOString() : null,
};

if (opts.dry) {
  console.log(JSON.stringify(record, null, 2));
  if (!record.source_url) console.error('\nNote: no source_url detected — pass --source <url> if you want one.');
  process.exit(0);
}

episodes.unshift(record); // newest-first
fs.writeFileSync(EPISODES, JSON.stringify(episodes, null, 2) + '\n');
console.log(`✅ Added ${record.id}: "${record.title}"`);
console.log(`   ${EPISODES} now has ${episodes.length} episodes.`);
if (!record.source_url) console.log('   (no source_url detected — re-run with --source <url> or edit the record.)');
if (!record.youtube_short_url) console.log('   (no Shorts URL — pass --short <url> to fill the "YouTube Short" column.)');
