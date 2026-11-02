// The Iteration Lab - files Worker (middle man between the site and GitHub Releases)
//
// Folder-style links (what the website uses):
//   /papers/<user-id>/ILR0004.pdf            /papers/<user-id>/ILR0004_cover_image.webp
//   /softwares/<user-id>/ILS0002.pdf         /softwares/<user-id>/ILS0002_cover_image.webp
//   /profiles/<user-id>/profile_image.webp
//   /events/<event-id>/event_image1.webp     /events/<event-id>/event_video1.mp4
//   /institutes/<eiin>/profile_image.webp    /institutes/<eiin>/cover_image.webp
//
// GitHub Releases have no folders, so the Worker stores each file in the release named
// after the category, with the folder joined into the file name:
//   release "papers"  ->  <user-id>__ILR0004.pdf
//
// This Worker does NOT serve files. Browsers read files directly from GitHub:
//   https://github.com/<GH_OWNER>/<GH_REPO>/releases/download/<category>/<user-id>__<file name>
// (the Worker returns that exact link as "url" after every upload)
//
// Owner only:       POST    <link above>   raw body (application/pdf, image/webp or video/mp4)
//                   DELETE  <link above>
// Owner only means: header  Authorization: Bearer <Supabase access_token>
//
// COMMENTS (reviews) - stored as JSON files in the repo (not in releases, because browsers
// cannot fetch() release files; they CAN fetch raw.githubusercontent.com):
//   POST   /comments/papers/ILR0004/t     body {"comment":"..."}   teachers' review (verified type T)
//   POST   /comments/papers/ILR0004/p     body {"comment":"..."}   peers' review (verified type S)
//   DELETE /comments/papers/ILR0004/t?id=<comment id>              commenter deletes own comment
//   same for /comments/softwares/ILS0002/t and /p
// Read (browser, no Worker):
//   https://raw.githubusercontent.com/<GH_OWNER>/<GH_REPO>/<branch>/comments/papers/ILR0004/t_comments.json

// Settings (Cloudflare dashboard -> Worker -> Settings -> Variables and Secrets)
//   Secret: GITHUB_TOKEN
//   Text:   GH_OWNER, GH_REPO, SUPABASE_URL, SUPABASE_ANON_KEY, ALLOWED_ORIGIN
//   Text (optional): GH_BRANCH (default main), SITE_URL (default = ALLOWED_ORIGIN)
//   Text (only if your events table differs from the defaults below):
//           EVENTS_TABLE (events), EVENTS_ID_COL (event_id), EVENTS_OWNER_COL (cid),
//           EVENTS_OWNER_OP (eq; use cs if the owner column is an array)
// GitHub release tags must be exactly: papers, softwares, profiles, events, institutes

const MAX_BYTES = { pdf: 25 * 1024 * 1024, img: 2 * 1024 * 1024, video: 25 * 1024 * 1024 };
const CONTENT_TYPE = { pdf: 'application/pdf', img: 'image/webp', video: 'video/mp4' };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GH = 'https://api.github.com';

// owner = what the first folder after the category is
const CATEGORIES = {
  papers: { owner: 'user', idPrefix: 'ILR', table: 'researches', col: 'ilrid' },
  softwares: { owner: 'user', idPrefix: 'ILS', table: 'software', col: 'ilsid' },
  profiles: { owner: 'user' },
  events: { owner: 'event' },
  institutes: { owner: 'eiin' }
};

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      const url = new URL(request.url);

      const cm = url.pathname.match(/^\/comments\/(papers|softwares)\/([A-Z]{3}\d{4,})\/([tp])$/);
      if (cm) return await handleComments(request, env, url, cm, cors);

      const m = url.pathname.match(/^\/([a-z]+)\/([A-Za-z0-9_-]{1,40})\/([A-Za-z0-9_.-]+)$/);
      if (!m) return json({ error: 'Not found' }, 404, cors);

      const cat = m[1];
      const c = CATEGORIES[cat];
      if (!c) return json({ error: 'Not found' }, 404, cors);

      let owner = m[2];
      if (c.owner === 'user') {
        owner = owner.toLowerCase();
        if (!UUID_RE.test(owner)) return json({ error: 'Bad user id' }, 400, cors);
      } else if (c.owner === 'eiin' && !/^\d{4,10}$/.test(owner)) {
        return json({ error: 'Bad EIIN' }, 400, cors);
      }

      const filename = m[3];
      const file = parseFile(cat, filename, c);
      if (!file) return json({ error: 'Bad file name' }, 400, cors);

      const tag = cat;
      const assetName = `${owner}__${filename}`;

      // ---------- Everything below needs a logged-in owner ----------
      if (request.method !== 'POST' && request.method !== 'DELETE') {
        return json({ error: 'Method not allowed' }, 405, cors);
      }

      const user = await getUser(request, env);
      if (!user) return json({ error: 'Not signed in' }, 401, cors);
      if (!(await isAllowed(env, user, cat, c, owner, file))) {
        return json({ error: 'You do not own this item' }, 403, cors);
      }

      if (request.method === 'DELETE') {
        const releaseId = await getReleaseId(env, tag);
        const old = await findAsset(env, releaseId, assetName);
        if (old) await deleteAsset(env, old.id);
        return json({ ok: true, deleted: !!old }, 200, cors);
      }

      // POST: upload or replace
      const max = MAX_BYTES[file.type];
      const declared = Number(request.headers.get('Content-Length') || 0);
      if (declared > max) return json({ error: 'File too large' }, 413, cors);

      const buf = await request.arrayBuffer();
      if (buf.byteLength === 0) return json({ error: 'Empty file' }, 400, cors);
      if (buf.byteLength > max) return json({ error: 'File too large' }, 413, cors);
      if (!looksRight(file.type, buf)) {
        return json({ error: 'File content does not match its type' }, 415, cors);
      }

      await replaceAsset(env, tag, assetName, buf, CONTENT_TYPE[file.type]);
      return json({ ok: true, url: githubUrl(env, tag, assetName) }, 200, cors);
    } catch (err) {
      const status = err && err.status ? err.status : 500;
      return json({ error: String(err && err.message ? err.message : err) }, status, cors);
    }
  }
};

/* ---------- helpers ---------- */

function parseFile(cat, filename, c) {
  if (cat === 'profiles') {
    return filename === 'profile_image.webp' ? { type: 'img', id: null } : null;
  }
  if (cat === 'institutes') {
    return filename === 'profile_image.webp' || filename === 'cover_image.webp'
      ? { type: 'img', id: null }
      : null;
  }
  if (cat === 'events') {
    if (/^event_image[1-9]\d?\.webp$/.test(filename)) return { type: 'img', id: null };
    if (/^event_video[1-9]\d?\.mp4$/.test(filename)) return { type: 'video', id: null };
    return null;
  }
  const re = new RegExp(`^(${c.idPrefix}\\d{4,})(\\.pdf|_cover_image\\.webp)$`);
  const m = filename.match(re);
  if (!m) return null;
  return { type: m[2] === '.pdf' ? 'pdf' : 'img', id: m[1] };
}

function looksRight(type, buf) {
  if (type === 'pdf') {
    return String.fromCharCode(...new Uint8Array(buf.slice(0, 5))) === '%PDF-';
  }
  if (type === 'img') {
    const s = String.fromCharCode(...new Uint8Array(buf.slice(0, 12)));
    return s.slice(0, 4) === 'RIFF' && s.slice(8, 12) === 'WEBP';
  }
  if (type === 'video') {
    return String.fromCharCode(...new Uint8Array(buf.slice(4, 8))) === 'ftyp';
  }
  return false;
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || 'https://iterationlab.l.cd',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}

function githubUrl(env, tag, assetName) {
  return `https://github.com/${env.GH_OWNER}/${env.GH_REPO}/releases/download/${tag}/${assetName}`;
}

/* ---------- Supabase checks ---------- */

async function getUser(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;
  const r = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? { id: String(u.id), token } : null;
}

async function sbRows(env, user, query) {
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${user.token}` }
  });
  if (!r.ok) return [];
  const rows = await r.json();
  return Array.isArray(rows) ? rows : [];
}

async function isAllowed(env, user, cat, c, owner, file) {
  const me = user.id.toLowerCase();

  if (cat === 'profiles') return me === owner;

  if (cat === 'papers' || cat === 'softwares') {
    // folder must be my own id, and I must be listed in uid of that research / software
    if (me !== owner) return false;
    const rows = await sbRows(
      env, user,
      `${c.table}?select=${c.col}&${c.col}=eq.${file.id}&uid=cs.{${user.id}}&limit=1`
    );
    return rows.length === 1;
  }

  if (cat === 'institutes') {
    // my institute account (type I) owns the row with this EIIN
    const rows = await sbRows(
      env, user,
      `institutes?select=eiin&eiin=eq.${owner}&cid=eq.${user.id}&limit=1`
    );
    return rows.length === 1;
  }

  if (cat === 'events') {
    const table = env.EVENTS_TABLE || 'events';
    const idCol = env.EVENTS_ID_COL || 'event_id';
    const ownerCol = env.EVENTS_OWNER_COL || 'cid';
    const op = env.EVENTS_OWNER_OP || 'eq';
    const value = op === 'cs' ? `{${user.id}}` : user.id;
    const rows = await sbRows(
      env, user,
      `${table}?select=${idCol}&${idCol}=eq.${encodeURIComponent(owner)}&${ownerCol}=${op}.${value}&limit=1`
    );
    return rows.length === 1;
  }

  return false;
}

/* ---------- GitHub Releases ---------- */

function ghHeaders(env, extra = {}) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'til-files-worker',
    ...extra
  };
}

async function getReleaseId(env, tag) {
  const r = await fetch(`${GH}/repos/${env.GH_OWNER}/${env.GH_REPO}/releases/tags/${tag}`, {
    headers: ghHeaders(env)
  });
  if (!r.ok) throw new Error(`GitHub release "${tag}" not found (${r.status})`);
  return (await r.json()).id;
}

async function findAsset(env, releaseId, name) {
  for (let page = 1; page <= 10; page++) {
    const r = await fetch(
      `${GH}/repos/${env.GH_OWNER}/${env.GH_REPO}/releases/${releaseId}/assets?per_page=100&page=${page}`,
      { headers: ghHeaders(env) }
    );
    if (!r.ok) throw new Error(`Could not list release files (${r.status})`);
    const list = await r.json();
    const hit = list.find((a) => a.name === name);
    if (hit) return hit;
    if (list.length < 100) return null;
  }
  return null;
}

async function deleteAsset(env, assetId) {
  const r = await fetch(`${GH}/repos/${env.GH_OWNER}/${env.GH_REPO}/releases/assets/${assetId}`, {
    method: 'DELETE',
    headers: ghHeaders(env)
  });
  if (!r.ok && r.status !== 404) throw new Error(`Could not delete old file (${r.status})`);
}

// Safe replace: upload under a temp name, delete the old file, rename the new one.
// If the upload fails, the old file is still there.
async function replaceAsset(env, tag, name, body, contentType) {
  const releaseId = await getReleaseId(env, tag);
  const tmpName = `tmp-${Date.now()}-${name}`;

  const up = await fetch(
    `https://uploads.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(tmpName)}`,
    { method: 'POST', headers: ghHeaders(env, { 'Content-Type': contentType }), body }
  );
  if (!up.ok) throw new Error(`GitHub upload failed (${up.status})`);
  const created = await up.json();

  const old = await findAsset(env, releaseId, name);
  if (old) await deleteAsset(env, old.id);

  const ren = await fetch(
    `${GH}/repos/${env.GH_OWNER}/${env.GH_REPO}/releases/assets/${created.id}`,
    {
      method: 'PATCH',
      headers: ghHeaders(env, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name })
    }
  );
  if (!ren.ok) throw new Error(`GitHub rename failed (${ren.status})`);
}


/* ---------- Comments (JSON files in the repo) ---------- */

const MAX_COMMENT_CHARS = 1000;
const MAX_COMMENTS = 300;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function handleComments(request, env, url, cm, cors) {
  const [, cat, id, side] = cm;
  const c = CATEGORIES[cat];
  if (!id.startsWith(c.idPrefix)) return json({ error: 'Bad id' }, 400, cors);
  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return json({ error: 'Method not allowed' }, 405, cors);
  }

  const user = await getUser(request, env);
  if (!user) return json({ error: 'Not signed in' }, 401, cors);

  const rows = await sbRows(env, user, `profiles?select=type,slug,name,verified&cid=eq.${user.id}&limit=1`);
  const profile = rows[0];
  if (!profile) return json({ error: 'No profile found for this account' }, 403, cors);

  const path = `comments/${cat}/${id}/${side}_comments.json`;
  const branch = env.GH_BRANCH || 'main';
  const readUrl = `https://raw.githubusercontent.com/${env.GH_OWNER}/${env.GH_REPO}/${branch}/${path}`;

  if (request.method === 'POST') {
    const needType = side === 't' ? 'T' : 'S';
    const verified = profile.verified === 1 || profile.verified === true || profile.verified === '1';
    if (String(profile.type).toUpperCase() !== needType || !verified) {
      return json({
        error: side === 't'
          ? 'Only verified teachers can write in Teachers\' Reviews'
          : 'Only verified students can write in Peers\' Reviews'
      }, 403, cors);
    }

    const items = await sbRows(env, user, `${c.table}?select=${c.col},uid&${c.col}=eq.${id}&limit=1`);
    if (!items.length) return json({ error: 'This item does not exist' }, 404, cors);
    const authors = (items[0].uid || []).map((x) => String(x).toLowerCase());
    if (authors.includes(user.id.toLowerCase())) {
      return json({ error: 'Authors cannot review their own work' }, 403, cors);
    }

    let body = null;
    try { body = await request.json(); } catch (e) { body = null; }
    const text = cleanComment(body && body.comment);
    if (text.length < 2) return json({ error: 'Comment is too short' }, 400, cors);
    if (text.length > MAX_COMMENT_CHARS) {
      return json({ error: `Comment is too long (max ${MAX_COMMENT_CHARS} characters)` }, 413, cors);
    }

    const site = (env.SITE_URL || env.ALLOWED_ORIGIN || 'https://iterationlab.l.cd').replace(/\/$/, '');
    const entry = {
      id: crypto.randomUUID(),
      uid: user.id,
      name: profile.name || '',
      comment: text,
      at: new Date().toISOString(),
      profile_link: profile.slug ? `${site}/profile/${profile.type}/${profile.slug}` : ''
    };

    await editJsonFile(env, path, `New ${side === 't' ? 'teacher' : 'peer'} review on ${id}`, (list) => {
      const mine = list.filter((x) => x.uid === user.id).pop();
      if (mine && Date.now() - Date.parse(mine.at) < 30000) {
        throw new HttpError(429, 'Please wait a few seconds before commenting again');
      }
      if (list.length >= MAX_COMMENTS) throw new HttpError(409, 'Comment limit reached for this item');
      return [...list, entry];
    });
    return json({ ok: true, comment: entry, url: readUrl }, 200, cors);
  }

  // DELETE: a commenter can remove only their own comment
  const commentId = url.searchParams.get('id') || '';
  if (!commentId) return json({ error: 'Missing comment id' }, 400, cors);
  await editJsonFile(env, path, `Delete a review on ${id}`, (list) => {
    const hit = list.find((x) => x.id === commentId);
    if (!hit) throw new HttpError(404, 'Comment not found');
    if (hit.uid !== user.id) throw new HttpError(403, 'You can only delete your own comment');
    return list.filter((x) => x.id !== commentId);
  });
  return json({ ok: true, url: readUrl }, 200, cors);
}

function cleanComment(v) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

// Read the JSON list, let mutate() return the new list, write it back.
// GitHub rejects the write if someone changed the file in between (sha mismatch), then we retry.
async function editJsonFile(env, path, message, mutate) {
  const branch = env.GH_BRANCH || 'main';
  const api = `${GH}/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${path}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers: ghHeaders(env) });
    let list = [];
    let sha;
    if (r.status === 200) {
      const f = await r.json();
      sha = f.sha;
      try { list = JSON.parse(fromBase64(f.content)); } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
    } else if (r.status !== 404) {
      throw new Error(`GitHub read failed (${r.status})`);
    }

    const next = mutate(list);
    const payload = { message, branch, content: toBase64(JSON.stringify(next, null, 1)) };
    if (sha) payload.sha = sha;

    const w = await fetch(api, {
      method: 'PUT',
      headers: ghHeaders(env, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    if (w.ok) return;
    if (w.status === 409 || w.status === 422) continue; // changed at the same moment, try again
    throw new Error(`GitHub write failed (${w.status})`);
  }
  throw new HttpError(409, 'Many people are commenting at once, please try again');
}

function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function fromBase64(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
}
