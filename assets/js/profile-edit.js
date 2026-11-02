// ==========================================================================
// The Iteration Lab — Owner "Edit Profile" Controller (/assets/js/profile-edit.js)
// Plain ES-module JS (no build step required).
//
// Security & Data Rules:
//  - Uses client.auth.getSession(); redirects to /login.html if unauthenticated.
//  - Owner's auth.users.id === public.profiles.cid.
//  - Never uses a service key; every write filters by cid (or uid @> [cid]) + RLS.
//  - Client-side WebP conversion (max 800px, quality ~0.85, max 2 MB) & PDF check
//    (max 25 MB) with automatic MOCK mode while UPLOAD_WORKER_URL is empty.
// ==========================================================================

const UPLOAD_WORKER_URL = 'https://red-math-923c.mdikramdr.workers.dev'; // no trailing slash
const GH_OWNER = 'TheIterationLab';
const GH_REPO = 'papers';
const GITHUB_BASE = `https://github.com/${GH_OWNER}/${GH_REPO}/releases/download`;

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  IMAGE_DIRS
} from '../../js/config.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB
const WEBP_MAX_EDGE = 800;
const WEBP_QUALITY = 0.85;

/* ==========================================================================
   1. Field Specifications (Matching profile.js clampStr & Live Schema)
   ========================================================================== */
const LEGAL_PROMPT_COLS = {
  name: 'Full Legal Name',
  father_name: 'Father’s Full Legal Name',
  mother_name: 'Mother’s Full Legal Name',
  registration: 'Registration Number'
};

const BASICS_CORE_SPECS = {
  name: { max: 120, required: true, label: 'Full Legal Name' },
  slug: { max: 60, required: false, type: 'slug', label: 'Profile URL Slug' },
  profession: { max: 80, required: false, label: 'Profession' },
  institution_override: { max: 160, required: false, label: 'Institution Override' },
  location: { max: 120, required: false, label: 'Location' },
  q1: { max: 140, required: false, label: 'Hero Headline' },
  research_interests: { max: 500, required: false, label: 'Research Interests' },
  public_email: { max: 160, required: false, type: 'email', label: 'Public Email' },
  statement_kicker: { max: 60, required: false, label: 'Statement Kicker' },
  q2: { max: 260, required: false, label: 'Statement Quote' },
  bio: { max: 800, required: false, label: 'Biography' }
};

const WHATSAPP_SPEC = {
  max: 24,
  required: false,
  type: 'whatsapp',
  label: 'WhatsApp Number'
};

const BASICS_EXTRA_SCALAR_SPECS = {
  father_name: { max: 120, required: false, label: 'Father’s Full Legal Name' },
  mother_name: { max: 120, required: false, label: 'Mother’s Full Legal Name' },
  registration: { max: 30, required: false, type: 'digits', label: 'Registration Number' }
};

const METRIC_BATCH_COLS = ['ssc_batch', 'hsc_batch'];
const METRIC_GPA_COLS = ['ssc_gpa', 'hsc_gpa', 'ug_cgpa', 'grad_cgpa'];
const METRIC_SUB_COLS = ['ssc_sub', 'hsc_sub', 'ug_sub', 'grad_sub', 'research_metric_sub'];

/* ==========================================================================
   2. State & Supabase Client
   ========================================================================== */
let sbClient = null;
let statusResetTimer = null;

const state = {
  session: null,
  ownerCid: null,
  profile: null,
  roleRow: null,
  teacherLiveReviewedCount: 0,
  instituteLiveStats: {
    memberStudents: 0,
    studentResearches: 0,
    studentSoftwares: 0,
    memberTeachers: 0,
    teacherResearches: 0
  },
  leaderFallbackPhoto: '',
  education: [],
  experience: [],
  skills: [],
  cocurriculars: [],
  researches: [],
  softwares: [],
  inFlightSaves: 0,
  dirtyKeys: new Set(),
  modalDirty: false,
  pendingAvatarBlob: null,
  pendingAvatarObjectUrl: '',
  pendingInstCoverObjectUrl: ''
};

function getSupabaseClient() {
  if (sbClient) return sbClient;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return sbClient;
  }
  return null;
}

async function getAccessToken() {
  const client = getSupabaseClient();
  if (!client) return '';
  const { data } = await client.auth.getSession();
  if (data?.session) {
    state.session = data.session;
  }
  return data?.session?.access_token || state.session?.access_token || '';
}

/* ==========================================================================
   3. Normalization & Validation Helpers (Same Rules as profile.js)
   ========================================================================== */
function cleanText(val) {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return '';
  return s;
}

function clampStr(val, maxLen) {
  const cleaned = cleanText(val);
  if (!cleaned) return '';
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen).trim() : cleaned;
}

function normalizeAccountType(rawType) {
  const t = cleanText(rawType).toUpperCase();
  if (t === 'S' || t === 'T' || t === 'R' || t === 'I') return t;
  return 'S';
}

function formatAccountTypeLabel(rawType) {
  const t = normalizeAccountType(rawType);
  const map = {
    S: 'S · Student',
    T: 'T · Teacher / Mentor',
    R: 'R · Independent Publisher',
    I: 'I · Partner Institution'
  };
  return map[t] || t;
}

function isHttpUrl(val) {
  const s = cleanText(val);
  return /^https?:\/\/\S+$/i.test(s);
}

function isValidPublicEmail(rawEmail) {
  const cleaned = cleanText(rawEmail);
  if (!cleaned || cleaned === '0') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
}

function normalizeOwnerWhatsAppTarget(rawWhatsapp) {
  if (rawWhatsapp === null || rawWhatsapp === undefined) return null;
  let cleaned = String(rawWhatsapp).trim();
  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();
  if (lower === '0' || lower === 'null' || lower === 'none' || lower === '-') {
    return null;
  }

  cleaned = cleaned
    .replace(/^https?:\/\/(www\.)?wa\.me\//i, '')
    .replace(/^wa\.me\//i, '')
    .replace(/\?.*$/, '')
    .trim();

  if (!cleaned) return null;

  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length >= 7) {
    if (digitsOnly.startsWith('00')) {
      return digitsOnly.slice(2);
    }
    if (digitsOnly.length === 11 && digitsOnly.startsWith('01')) {
      return `88${digitsOnly}`;
    }
    return digitsOnly;
  }

  const handle = cleaned.replace(/[^a-zA-Z0-9_]/g, '');
  return handle || null;
}

function parseStringArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((v) => cleanText(v)).filter(Boolean);
  if (typeof val === 'string') {
    const t = val.trim();
    if (!t) return [];
    if (t.startsWith('[')) {
      try {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed)) return parsed.map((v) => cleanText(v)).filter(Boolean);
      } catch (_) {
        // Fallback below
      }
    }
    return t.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function arraysEqual(a, b) {
  const arrA = Array.isArray(a) ? a : [];
  const arrB = Array.isArray(b) ? b : [];
  if (arrA.length !== arrB.length) return false;
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i] !== arrB[i]) return false;
  }
  return true;
}

function resolveDefaultImageDirForType(accountType) {
  const t = normalizeAccountType(accountType);
  if (t === 'T') return IMAGE_DIRS.teachers;
  if (t === 'I') return IMAGE_DIRS.institutes;
  return IMAGE_DIRS.students;
}

function resolveImageSrc(val, defaultDir = IMAGE_DIRS.students) {
  const raw = cleanText(val).replace(/\\/g, '/');
  if (!raw) return '';
  if (/^blob:|^data:image\//i.test(raw)) return raw;
  if (/^https?:\/\/\S+$/i.test(raw)) return raw;
  if (raw.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return '';

  const fixedRaw = raw.replace(/\/leaders\/ing\//gi, '/leaders/img/');
  const trimmed = fixedRaw.replace(/^\.?\/+/, '');
  if (!trimmed) return '';

  const normDir = defaultDir
    ? `/${defaultDir.replace(/^\/+|\/+$/g, '')}/`
    : '/';

  if (!trimmed.includes('/')) {
    return `${normDir}${trimmed}`;
  }
  if (/^img\/[^/]+$/i.test(trimmed) && defaultDir) {
    return `${normDir}${trimmed.slice(4)}`;
  }
  return `/${trimmed}`;
}

function getInitials(name) {
  const parts = cleanText(name).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'IL';
  if (parts.length === 1) return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();
  return (Array.from(parts[0])[0] + Array.from(parts[parts.length - 1])[0]).toUpperCase();
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatGpaInput(val) {
  if (val === null || val === undefined || val === '') return '0.00';
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return '0.00';
  return Math.min(5, Math.max(0, num)).toFixed(2);
}

function normalizeSlugCandidate(rawSlug) {
  const s = cleanText(rawSlug).toLowerCase();
  if (!s) return '';
  return s
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildViewProfileHref(profRow) {
  if (!profRow) return '/profile/';
  const type = normalizeAccountType(profRow.type);
  const slug = cleanText(profRow.slug);
  if (slug) {
    return `/profile/${type}/${encodeURIComponent(slug)}`;
  }
  return `/profile/?cid=${encodeURIComponent(profRow.cid)}`;
}

async function checkSlugAvailability(candidateSlug) {
  if (!candidateSlug) return { ok: true };
  const client = getSupabaseClient();
  if (!client || !state.ownerCid) {
    return { ok: false, error: 'Database connection is unavailable right now.' };
  }

  const { data, error } = await client
    .from('profiles')
    .select('cid')
    .eq('slug', candidateSlug)
    .neq('cid', state.ownerCid)
    .limit(1);

  if (error) {
    return {
      ok: false,
      error: 'Could not verify slug availability right now. Please try again.'
    };
  }
  if (Array.isArray(data) && data.length > 0) {
    return {
      ok: false,
      error: `The slug "${candidateSlug}" is already taken by another member.`
    };
  }
  return { ok: true };
}

/* ==========================================================================
   4. Top Save Status, Section Messages & Unsaved-Changes Guard
   ========================================================================== */
function setTopSaveStatus(kind, customLabel) {
  const wrap = document.getElementById('pe-save-status');
  const txt = document.getElementById('pe-save-status-text');
  if (!wrap || !txt) return;

  if (statusResetTimer) {
    clearTimeout(statusResetTimer);
    statusResetTimer = null;
  }

  wrap.dataset.state = kind || 'idle';
  if (kind === 'saving') {
    txt.textContent = customLabel || 'Saving…';
  } else if (kind === 'saved') {
    txt.textContent = customLabel || 'Saved';
    statusResetTimer = setTimeout(() => {
      if (state.inFlightSaves === 0 && state.dirtyKeys.size === 0) {
        wrap.dataset.state = 'idle';
        txt.textContent = 'Saved';
      }
    }, 3500);
  } else if (kind === 'error') {
    txt.textContent = customLabel || 'Could not save';
  } else if (kind === 'dirty') {
    txt.textContent = customLabel || 'Unsaved changes';
  } else {
    txt.textContent = customLabel || 'Saved';
  }
}

function markDirty(key, isDirty) {
  if (isDirty) {
    state.dirtyKeys.add(key);
    if (state.inFlightSaves === 0) {
      setTopSaveStatus('dirty', 'Unsaved changes');
    }
  } else {
    state.dirtyKeys.delete(key);
    if (state.dirtyKeys.size === 0 && state.inFlightSaves === 0) {
      setTopSaveStatus('idle', 'Saved');
    }
  }
}

function beginFlight(statusLabel = 'Saving…') {
  state.inFlightSaves += 1;
  setTopSaveStatus('saving', statusLabel);
}

function endFlight(ok, savedLabel = 'Saved', errorLabel = 'Could not save') {
  state.inFlightSaves = Math.max(0, state.inFlightSaves - 1);
  if (!ok) {
    setTopSaveStatus('error', errorLabel);
    return;
  }
  if (state.inFlightSaves > 0) {
    setTopSaveStatus('saving', 'Saving…');
  } else if (state.dirtyKeys.size > 0) {
    setTopSaveStatus('dirty', 'Unsaved changes');
  } else {
    setTopSaveStatus('saved', savedLabel);
  }
}

function setSectionMessage(msgId, kind, text) {
  const el = document.getElementById(msgId);
  if (!el) return;
  el.className = 'pe-section-msg' + (kind ? ` is-${kind}` : '');
  el.textContent = text || '';
}

function setFieldError(colOrId, message) {
  const errEl = document.getElementById(`err-${colOrId}`);
  const inputEl = document.getElementById(`f-${colOrId}`);
  if (errEl) {
    errEl.textContent = message || '';
  }
  if (inputEl) {
    if (message) {
      inputEl.setAttribute('aria-invalid', 'true');
    } else {
      inputEl.removeAttribute('aria-invalid');
    }
  }
}

function updateCharCounterForInput(inputEl) {
  if (!inputEl || !inputEl.id) return;
  const max = Number(inputEl.getAttribute('maxlength') || 0);
  if (!max) return;
  const badge = document.querySelector(`.pe-char-count[data-for="${inputEl.id}"]`);
  if (!badge) return;
  const len = (inputEl.value || '').length;
  badge.textContent = `${len} / ${max}`;
  badge.classList.toggle('is-near', len >= Math.floor(max * 0.9));
}

function isMissingColumnError(err) {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || err.details || '');
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    /Could not find the .* column|column .* does not exist/i.test(msg)
  );
}

function isMissingIdDefaultError(err, colName) {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || err.details || '');
  return code === '23502' && new RegExp(`\\b${colName}\\b`, 'i').test(msg);
}

async function computeNextArchiveId(client, tableName, idCol, prefix) {
  const { data } = await client.from(tableName).select(idCol);
  let maxNum = 0;
  const re = new RegExp(`^${prefix}(\\d+)$`, 'i');
  if (Array.isArray(data)) {
    data.forEach((row) => {
      const raw = cleanText(row?.[idCol]);
      const m = raw.match(re);
      if (m) {
        const n = parseInt(m[1], 10);
        if (Number.isFinite(n) && n > maxNum) maxNum = n;
      }
    });
  }
  const next = maxNum + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

async function insertArchiveRowWithFallbacks(client, tableName, idCol, prefix, extendedPayload, corePayload) {
  let activePayload = { ...extendedPayload };
  let { data, error } = await client.from(tableName).insert(activePayload).select('*').single();

  if (error && isMissingColumnError(error)) {
    activePayload = { ...corePayload };
    const retryCore = await client.from(tableName).insert(activePayload).select('*').single();
    data = retryCore.data;
    error = retryCore.error;
  }

  if (error && isMissingIdDefaultError(error, idCol)) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const nextId = await computeNextArchiveId(client, tableName, idCol, prefix);
      const withIdPayload = { [idCol]: nextId, ...activePayload };
      const retryId = await client.from(tableName).insert(withIdPayload).select('*').single();
      if (retryId.error && isMissingColumnError(retryId.error)) {
        activePayload = { ...corePayload };
        const retryCoreWithId = await client
          .from(tableName)
          .insert({ [idCol]: nextId, ...activePayload })
          .select('*')
          .single();
        data = retryCoreWithId.data;
        error = retryCoreWithId.error;
      } else {
        data = retryId.data;
        error = retryId.error;
      }
      if (!error || String(error.code || '') !== '23505') break;
    }
  }

  return { data, error };
}

function formatSupabaseError(err, fallbackMsg) {
  if (!err) return fallbackMsg;
  const code = String(err.code || '');
  const msg = String(err.message || err.details || '');
  if (code === '42501' || /row-level security|permission denied/i.test(msg)) {
    return 'Permission denied by database RLS policy (42501). Verify owner RLS policies are installed.';
  }
  if (code === '23505') {
    if (/slug/i.test(msg)) {
      return 'That profile URL slug is already taken by another member. Choose a different slug.';
    }
    if (/eiin/i.test(msg)) {
      return 'That EIIN is already registered to another institute account.';
    }
    return 'That value is already registered to another record in the database.';
  }
  if (code === '23514') {
    return `Supabase check constraint error (23514): ${msg}`;
  }
  if (code === '23502' && /ilrid/i.test(msg)) {
    return 'Database column researches.ilrid has no DEFAULT generator yet. Run the SQL migration to add the ILR sequence default.';
  }
  if (code === '23502' && /ilsid/i.test(msg)) {
    return 'Database column software.ilsid has no DEFAULT generator yet. Run the SQL migration to add the ILS sequence default.';
  }
  return msg ? `${fallbackMsg}: ${msg}` : fallbackMsg;
}

/* ==========================================================================
   5. Interactive Chip Input Builder (Reusable for Arrays)
   ========================================================================== */
function createChipEditor(containerEl, initialItems, options = {}) {
  const maxItems = options.maxItems || 24;
  const maxChipLen = options.maxChipLen || 60;
  const placeholder = options.placeholder || 'Type & press Enter…';
  const inputId = options.inputId || '';
  const onChange = typeof options.onChange === 'function' ? options.onChange : null;

  let items = parseStringArray(initialItems).slice(0, maxItems);

  containerEl.textContent = '';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'pe-chip-input';
  input.maxLength = maxChipLen;
  input.placeholder = items.length ? '' : placeholder;
  if (inputId) input.id = inputId;

  function renderChips() {
    Array.from(containerEl.querySelectorAll('.pe-chip')).forEach((n) => n.remove());
    items.forEach((tag, idx) => {
      const chip = document.createElement('span');
      chip.className = 'pe-chip';

      const textSpan = document.createElement('span');
      textSpan.textContent = tag;

      const rmBtn = document.createElement('button');
      rmBtn.type = 'button';
      rmBtn.className = 'pe-chip-remove';
      rmBtn.setAttribute('aria-label', `Remove ${tag}`);
      rmBtn.textContent = '×';
      rmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        items.splice(idx, 1);
        renderChips();
        if (onChange) onChange([...items], 'remove');
      });

      chip.appendChild(textSpan);
      chip.appendChild(rmBtn);
      containerEl.insertBefore(chip, input);
    });
    input.placeholder = items.length ? '' : placeholder;
  }

  function commitPendingInput(triggerChange = true) {
    const raw = input.value;
    if (!raw || !raw.trim()) {
      input.value = '';
      return false;
    }
    const candidates = raw
      .split(',')
      .map((s) => clampStr(s, maxChipLen))
      .filter(Boolean);

    let added = false;
    candidates.forEach((c) => {
      if (items.length >= maxItems) return;
      if (!items.some((existing) => existing.toLowerCase() === c.toLowerCase())) {
        items.push(c);
        added = true;
      }
    });
    input.value = '';
    if (added) {
      renderChips();
      if (triggerChange && onChange) onChange([...items], 'add');
    }
    return added;
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitPendingInput(true);
    } else if (e.key === 'Backspace' && !input.value && items.length > 0) {
      items.pop();
      renderChips();
      if (onChange) onChange([...items], 'remove');
    }
  });

  input.addEventListener('blur', () => {
    const added = commitPendingInput(false);
    if (onChange) onChange([...items], added ? 'blur-add' : 'blur');
  });

  containerEl.addEventListener('click', () => {
    input.focus();
  });

  containerEl.appendChild(input);
  renderChips();

  return {
    getItems: () => {
      commitPendingInput(false);
      return [...items];
    },
    setItems: (nextArr) => {
      items = parseStringArray(nextArr).slice(0, maxItems);
      input.value = '';
      renderChips();
    }
  };
}

/* ==========================================================================
   6. Client-Side Image -> WebP Converter & Worker / MOCK Uploader
   ========================================================================== */
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode the selected image file.'));
    };
    img.src = url;
  });
}

async function convertImageFileToWebP(file, maxEdge = WEBP_MAX_EDGE, quality = WEBP_QUALITY) {
  if (!file) throw new Error('No file selected.');
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (JPEG, PNG, or WebP).');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Image file exceeds the 2 MB limit (${formatBytes(file.size)}).`);
  }

  const img = await loadImageFromFile(file);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) {
    throw new Error('Invalid image dimensions.');
  }

  let targetW = srcW;
  let targetH = srcH;
  if (srcW > maxEdge || srcH > maxEdge) {
    if (srcW >= srcH) {
      targetW = maxEdge;
      targetH = Math.max(1, Math.round((srcH * maxEdge) / srcW));
    } else {
      targetH = maxEdge;
      targetW = Math.max(1, Math.round((srcW * maxEdge) / srcH));
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Browser canvas 2D context is unavailable.');

  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) {
          reject(new Error('Failed to encode WebP image.'));
          return;
        }
        resolve(b);
      },
      'image/webp',
      quality
    );
  });

  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error(`Converted WebP image still exceeds 2 MB (${formatBytes(blob.size)}).`);
  }

  return {
    blob,
    srcW,
    srcH,
    width: targetW,
    height: targetH
  };
}

function validatePdfFile(file) {
  if (!file) throw new Error('No PDF selected.');
  const isPdfMime = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  if (!isPdfMime) {
    throw new Error('Please select a valid PDF document (.pdf).');
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(`PDF exceeds the 25 MB limit (${formatBytes(file.size)}).`);
  }
}

function resolveWorkerEndpoint({ kind, id = '', objectKey = '' }) {
  if (!UPLOAD_WORKER_URL) return { url: '', contentType: '' };
  const uid = cleanText(state.ownerCid).toLowerCase();

  switch (kind) {
    case 'avatar':
    case 'profile-picture':
      if (state.profile?.type === 'I' && state.ownerEiin) {
        return {
          url: `${UPLOAD_WORKER_URL}/institutes/${encodeURIComponent(cleanText(state.ownerEiin))}/profile_image.webp`,
          contentType: 'image/webp'
        };
      }
      return {
        url: `${UPLOAD_WORKER_URL}/profiles/${uid}/profile_image.webp`,
        contentType: 'image/webp'
      };

    case 'research-pdf':
      return {
        url: `${UPLOAD_WORKER_URL}/papers/${uid}/${id}.pdf`,
        contentType: 'application/pdf'
      };

    case 'research-cover':
      return {
        url: `${UPLOAD_WORKER_URL}/papers/${uid}/${id}_cover_image.webp`,
        contentType: 'image/webp'
      };

    case 'software-pdf':
      return {
        url: `${UPLOAD_WORKER_URL}/softwares/${uid}/${id}.pdf`,
        contentType: 'application/pdf'
      };

    case 'software-image':
    case 'software-cover':
      return {
        url: `${UPLOAD_WORKER_URL}/softwares/${uid}/${id}_cover_image.webp`,
        contentType: 'image/webp'
      };

    case 'institute-cover':
      const eiin = cleanText(id || state.ownerEiin);
      return {
        url: `${UPLOAD_WORKER_URL}/institutes/${encodeURIComponent(eiin)}/cover_image.webp`,
        contentType: 'image/webp'
      };

    case 'institute-profile':
      const instEiin = cleanText(id || state.ownerEiin);
      return {
        url: `${UPLOAD_WORKER_URL}/institutes/${encodeURIComponent(instEiin)}/profile_image.webp`,
        contentType: 'image/webp'
      };

    default:
      if (objectKey && /^https?:\/\//i.test(objectKey)) {
        return { url: objectKey, contentType: 'application/octet-stream' };
      }
      return { url: `${UPLOAD_WORKER_URL}/uploads/${uid}`, contentType: 'application/octet-stream' };
  }
}

async function uploadBlobToWorker({ blob, filename, kind, id = '', objectKey = '', contentType = '' }) {
  const vTs = Date.now();
  if (!UPLOAD_WORKER_URL) {
    return {
      mock: true,
      timestamp: vTs,
      localUrl: URL.createObjectURL(blob),
      url: ''
    };
  }

  const token = await getAccessToken();
  if (!token) {
    throw new Error('Your Supabase session expired. Please sign in again.');
  }

  const resolved = resolveWorkerEndpoint({ kind, id, objectKey });
  const targetUrl = resolved.url;
  const finalContentType = contentType || resolved.contentType || 'application/octet-stream';

  if (!targetUrl) {
    throw new Error('Could not resolve upload endpoint link.');
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': finalContentType
    },
    body: blob
  });

  if (!response.ok) {
    let detail = `Upload failed (HTTP ${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.error || errJson?.message) {
        detail = errJson.error || errJson.message;
      }
    } catch (_) {}
    throw new Error(detail);
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch (_) {
    payload = {};
  }

  return {
    mock: false,
    timestamp: vTs,
    localUrl: '',
    url: cleanText(payload.url || payload.publicUrl || payload.path || '')
  };
}

async function deleteBlobFromWorker({ kind, id = '', objectKey = '' }) {
  if (!UPLOAD_WORKER_URL) return true;
  const token = await getAccessToken();
  if (!token) return false;

  const resolved = resolveWorkerEndpoint({ kind, id, objectKey });
  if (!resolved.url) return false;

  try {
    const response = await fetch(resolved.url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.ok;
  } catch (_) {
    return false;
  }
}

/* ==========================================================================
   7. Load Owner Data from Supabase
   ========================================================================== */
async function loadOwnerWorkspace() {
  const client = getSupabaseClient();
  const gate = document.getElementById('pe-gate');
  const gateKicker = document.getElementById('pe-gate-kicker');
  const gateTitle = document.getElementById('pe-gate-title');
  const gateDesc = document.getElementById('pe-gate-desc');
  const gateActions = document.getElementById('pe-gate-actions');
  const mainEl = document.getElementById('pe-main');

  if (!client) {
    if (gateKicker) gateKicker.textContent = 'CONNECTION ERROR';
    if (gateTitle) gateTitle.textContent = 'Supabase client could not load';
    if (gateDesc) gateDesc.textContent = 'Please check your internet connection and reload this page.';
    if (gateActions) gateActions.hidden = false;
    return;
  }

  const { data: sessionData, error: sessionErr } = await client.auth.getSession();
  const session = sessionData?.session || null;
  if (sessionErr || !session || !session.user?.id || !UUID_RE.test(session.user.id)) {
    window.location.replace('/login.html');
    return;
  }

  state.session = session;
  state.ownerCid = session.user.id;

  const [profRes, cvRes, cardsRes, resRes, swRes, leaderRes] = await Promise.all([
    client.from('profiles').select('*').eq('cid', state.ownerCid).maybeSingle(),
    client
      .from('profile_cv_entries')
      .select('*')
      .eq('cid', state.ownerCid)
      .order('entry_type', { ascending: true })
      .order('sort_order', { ascending: true }),
    client
      .from('profile_custom_cards')
      .select('*')
      .eq('cid', state.ownerCid)
      .order('deck_type', { ascending: true })
      .order('sort_order', { ascending: true }),
    client
      .from('researches')
      .select('*')
      .contains('uid', [state.ownerCid])
      .order('publish_date', { ascending: false, nullsFirst: false })
      .order('ilrid', { ascending: true }),
    client
      .from('software')
      .select('*')
      .contains('uid', [state.ownerCid])
      .order('publish_date', { ascending: false, nullsFirst: false })
      .order('ilsid', { ascending: true }),
    client.from('leaders').select('profile_i').eq('cid', state.ownerCid).maybeSingle()
  ]);

  if (profRes.error || !profRes.data) {
    if (gateKicker) gateKicker.textContent = 'PROFILE RECORD NOT FOUND';
    if (gateTitle) gateTitle.textContent = 'No public.profiles row found for your account';
    if (gateDesc) {
      gateDesc.textContent = profRes.error
        ? `Could not load your profile (${profRes.error.message}).`
        : `Authenticated as ${state.ownerCid}, but no matching row exists in public.profiles yet.`;
    }
    if (gateActions) gateActions.hidden = false;
    return;
  }

  state.profile = profRes.data;
  state.leaderFallbackPhoto = resolveImageSrc(leaderRes?.data?.profile_i, IMAGE_DIRS.leaders);

  const accType = normalizeAccountType(state.profile.type);
  if (accType === 'S') {
    const stRes = await client.from('students').select('*').eq('cid', state.ownerCid).maybeSingle();
    state.roleRow = stRes?.data || { cid: state.ownerCid, eiin: '' };
  } else if (accType === 'T') {
    const [tcRes, revRes] = await Promise.all([
      client.from('teachers').select('*').eq('cid', state.ownerCid).maybeSingle(),
      client.from('researches').select('ilrid').contains('reviewers', [state.ownerCid])
    ]);
    state.roleRow = tcRes?.data || { cid: state.ownerCid, eiin: '' };
    state.teacherLiveReviewedCount = Array.isArray(revRes?.data) ? revRes.data.length : 0;
  } else if (accType === 'I') {
    const inRes = await client.from('institutes').select('*').eq('cid', state.ownerCid).maybeSingle();
    state.roleRow = inRes?.data || { cid: state.ownerCid, eiin: '' };
  } else {
    state.roleRow = null;
  }

  const allCv = Array.isArray(cvRes.data) ? cvRes.data : [];
  state.education = allCv
    .filter((r) => r.entry_type === 'education')
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  state.experience = allCv
    .filter((r) => r.entry_type === 'experience')
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));

  const allCards = Array.isArray(cardsRes.data) ? cardsRes.data : [];
  state.skills = allCards
    .filter((r) => r.deck_type === 'skills')
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  state.cocurriculars = allCards
    .filter((r) => r.deck_type === 'cocurriculars')
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));

  state.researches = Array.isArray(resRes.data) ? resRes.data : [];
  state.softwares = Array.isArray(swRes.data) ? swRes.data : [];

  if (accType === 'I' && cleanText(state.roleRow?.eiin)) {
    await refreshInstituteLiveStats(cleanText(state.roleRow.eiin));
  }

  if (gate) gate.hidden = true;
  if (mainEl) mainEl.hidden = false;

  populateAllSections();
  setTopSaveStatus('idle', 'Saved');
}

async function lookupEiinAffiliationHint(rawEiin) {
  const hintEl = document.getElementById('hint-aff-eiin');
  if (!hintEl || !state.profile) return;
  const accType = normalizeAccountType(state.profile.type);
  const eiin = cleanText(rawEiin);

  if (accType === 'I') {
    hintEl.classList.remove('is-ok');
    hintEl.textContent = eiin
      ? `Active EIIN ${eiin} — students and teachers with this EIIN are counted under your campus.`
      : 'Enter your official 6-digit EIIN code so member students and faculty link automatically.';
    return;
  }

  if (!eiin) {
    hintEl.classList.remove('is-ok');
    hintEl.textContent =
      'Enter your college’s official EIIN to link your profile automatically to its institute page.';
    return;
  }

  const client = getSupabaseClient();
  if (!client) return;

  const { data: instRow } = await client
    .from('institutes')
    .select('cid,eiin')
    .eq('eiin', eiin)
    .limit(1)
    .maybeSingle();

  if (!instRow?.cid) {
    hintEl.classList.remove('is-ok');
    hintEl.textContent = `EIIN ${eiin} saved — no registered Institute profile claims this EIIN yet.`;
    return;
  }

  const { data: instProf } = await client
    .from('profiles')
    .select('cid,name,slug,type')
    .eq('cid', instRow.cid)
    .maybeSingle();

  if (instProf) {
    const instHref = buildViewProfileHref(instProf);
    hintEl.classList.add('is-ok');
    hintEl.textContent = `Linked Institute: ${cleanText(instProf.name) || 'Registered Institute'} (${instHref})`;
  }
}

async function refreshInstituteLiveStats(rawEiin) {
  const eiin = cleanText(rawEiin);
  const zero = {
    memberStudents: 0,
    studentResearches: 0,
    studentSoftwares: 0,
    memberTeachers: 0,
    teacherResearches: 0
  };
  if (!eiin) {
    state.instituteLiveStats = zero;
    renderInstituteLiveStatsDom();
    return;
  }

  const client = getSupabaseClient();
  if (!client) return;

  const [stRes, tcRes] = await Promise.all([
    client.from('students').select('cid').eq('eiin', eiin),
    client.from('teachers').select('cid').eq('eiin', eiin)
  ]);

  const studentCids = Array.isArray(stRes?.data)
    ? stRes.data.map((r) => cleanText(r.cid)).filter(Boolean)
    : [];
  const teacherCids = Array.isArray(tcRes?.data)
    ? tcRes.data.map((r) => cleanText(r.cid)).filter(Boolean)
    : [];

  let studentResearches = 0;
  let studentSoftwares = 0;
  let teacherResearches = 0;

  const [sResRows, sSwRows, tResRows] = await Promise.all([
    studentCids.length > 0
      ? client.from('researches').select('ilrid').overlaps('uid', studentCids)
      : Promise.resolve({ data: [] }),
    studentCids.length > 0
      ? client.from('software').select('ilsid').overlaps('uid', studentCids)
      : Promise.resolve({ data: [] }),
    teacherCids.length > 0
      ? client.from('researches').select('ilrid').overlaps('uid', teacherCids)
      : Promise.resolve({ data: [] })
  ]);

  studentResearches = Array.isArray(sResRows?.data) ? sResRows.data.length : 0;
  studentSoftwares = Array.isArray(sSwRows?.data) ? sSwRows.data.length : 0;
  teacherResearches = Array.isArray(tResRows?.data) ? tResRows.data.length : 0;

  state.instituteLiveStats = {
    memberStudents: studentCids.length,
    studentResearches,
    studentSoftwares,
    memberTeachers: teacherCids.length,
    teacherResearches
  };
  renderInstituteLiveStatsDom();
}

function renderInstituteLiveStatsDom() {
  const s = state.instituteLiveStats;
  const map = {
    'ro-i-member-students': s.memberStudents,
    'ro-i-student-researches': s.studentResearches,
    'ro-i-student-softwares': s.studentSoftwares,
    'ro-i-member-teachers': s.memberTeachers,
    'ro-i-teacher-researches': s.teacherResearches
  };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(Number(val ?? 0));
  });
}

/* ==========================================================================
   8. Populate & Bind Sections 1–5 (Profiles Table, Array Lists & Portrait)
   ========================================================================== */
function updateHeaderAndHeading() {
  const p = state.profile;
  if (!p) return;

  const publicHref = buildViewProfileHref(p);
  const viewLink = document.getElementById('pe-view-profile-link');
  if (viewLink) {
    viewLink.href = publicHref;
  }

  const heading = document.getElementById('pe-owner-heading');
  const displayName = cleanText(p.name) || 'Member';
  if (heading) {
    heading.textContent = `Edit Profile · ${displayName}`;
  }
  document.title = `Edit Profile · ${displayName} · The Iteration Lab`;

  const roCid = document.getElementById('ro-cid');
  const roType = document.getElementById('ro-type');
  const roSlug = document.getElementById('ro-slug');
  const roVerified = document.getElementById('ro-verified');

  if (roCid) roCid.textContent = p.cid || '—';
  if (roType) roType.textContent = formatAccountTypeLabel(p.type);
  if (roSlug) roSlug.textContent = publicHref;
  if (roVerified) {
    const isVer = p.verified === 1 || p.verified === true;
    roVerified.textContent = isVer ? '1 · Verified' : `${p.verified ?? 0} · Unverified`;
  }
}

function syncLegalNullPrompts() {
  const p = state.profile;
  if (!p) return;

  const isInst = normalizeAccountType(p.type) === 'I';
  const colsToCheck = isInst
    ? { name: 'College / Institute Name' }
    : LEGAL_PROMPT_COLS;

  const missingInDbLabels = [];

  Object.entries(LEGAL_PROMPT_COLS).forEach(([col, defaultLabel]) => {
    const activeLabel = colsToCheck[col];
    const inputEl = document.getElementById(`f-${col}`);
    const promptEl = document.getElementById(`null-${col}`);

    if (!activeLabel) {
      if (promptEl) promptEl.hidden = true;
      if (inputEl) inputEl.classList.remove('is-null-needed');
      return;
    }

    const isMissingInDb = !cleanText(p[col]);
    if (isMissingInDb) {
      missingInDbLabels.push(activeLabel || defaultLabel);
    }

    const hasDraftValue = Boolean(cleanText(inputEl?.value));
    const showPrompt = isMissingInDb && !hasDraftValue;

    if (promptEl) {
      promptEl.textContent = isInst
        ? 'Database value is empty — please enter the official college / institute name.'
        : `Database value is empty — please enter your ${defaultLabel.toLowerCase()}.`;
      promptEl.hidden = !showPrompt;
    }
    if (inputEl) {
      inputEl.classList.toggle('is-null-needed', showPrompt);
    }
  });

  const bannerEl = document.getElementById('pe-legal-missing-banner');
  const bannerTitleEl = document.getElementById('pe-legal-missing-title');
  const bannerTextEl = document.getElementById('pe-legal-missing-text');
  if (bannerEl && bannerTextEl) {
    if (missingInDbLabels.length > 0) {
      bannerEl.hidden = false;
      if (bannerTitleEl) {
        bannerTitleEl.textContent = isInst
          ? 'Complete your institute identity record'
          : 'Complete your legal & registration record';
      }
      bannerTextEl.textContent = `Currently empty in database: ${missingInDbLabels.join(', ')}. Please enter your official record below — all fields remain editable anytime.`;
    } else {
      bannerEl.hidden = true;
      bannerTextEl.textContent = '';
    }
  }
}

function updateSlugPreviewHint(rawInputVal, statusMode = '') {
  const hintEl = document.getElementById('hint-slug-preview');
  if (!hintEl || !state.profile) return;

  const type = normalizeAccountType(state.profile.type);
  const candidate = normalizeSlugCandidate(rawInputVal);

  hintEl.classList.toggle('is-ok', statusMode === 'available' || statusMode === 'current');

  if (!candidate) {
    hintEl.textContent = `No custom slug — public URL uses /profile/?cid=${state.ownerCid || ''}`;
    return;
  }

  if (statusMode === 'available') {
    hintEl.textContent = `Available — Public URL will be /profile/${type}/${candidate}`;
  } else if (statusMode === 'current') {
    hintEl.textContent = `Active URL: /profile/${type}/${candidate} (editable anytime)`;
  } else {
    hintEl.textContent = `URL preview: /profile/${type}/${candidate} — checked for uniqueness on save`;
  }
}

function updateDerivedResearchCount() {
  const el = document.getElementById('ro-research-count');
  if (!el) return;
  const count = state.researches.length;
  el.textContent = `${String(count).padStart(2, '0')} ${count === 1 ? 'work' : 'works'}`;
}

function populateBasicsSection() {
  const p = state.profile;
  const allScalarSpecs = { ...BASICS_CORE_SPECS, ...BASICS_EXTRA_SCALAR_SPECS };

  Object.keys(allScalarSpecs).forEach((col) => {
    const input = document.getElementById(`f-${col}`);
    if (!input) return;
    input.value = cleanText(p[col]);
    setFieldError(col, '');
    updateCharCounterForInput(input);
  });

  syncLegalNullPrompts();
  const savedSlug = cleanText(p.slug);
  updateSlugPreviewHint(savedSlug, savedSlug ? 'current' : '');
}

function populateMetricsSection() {
  const p = state.profile;

  METRIC_BATCH_COLS.forEach((col) => {
    const input = document.getElementById(`f-${col}`);
    if (!input) return;
    input.value = cleanText(p[col]);
    setFieldError(col, '');
    updateCharCounterForInput(input);
  });

  METRIC_GPA_COLS.forEach((col) => {
    const input = document.getElementById(`f-${col}`);
    if (!input) return;
    input.value = formatGpaInput(p[col]);
    setFieldError(col, '');
  });

  METRIC_SUB_COLS.forEach((col) => {
    const input = document.getElementById(`f-${col}`);
    if (!input) return;
    input.value = cleanText(p[col]);
    setFieldError(col, '');
    updateCharCounterForInput(input);
  });

  updateDerivedResearchCount();
}

// Automatically syncs owned record IDs into public.profiles.{researches,softwares,certificates,others}
async function syncProfileIdArray(profileCol, rawId, action = 'add') {
  const client = getSupabaseClient();
  if (!client || !state.profile || !state.ownerCid) return;
  if (!Object.prototype.hasOwnProperty.call(state.profile, profileCol)) return;

  const itemId = cleanText(rawId);
  if (!itemId) return;

  const current = parseStringArray(state.profile[profileCol]);
  let nextArr;
  if (action === 'remove') {
    nextArr = current.filter((id) => id !== itemId);
  } else {
    nextArr = current.includes(itemId) ? current : [...current, itemId];
  }

  if (arraysEqual(current, nextArr)) return;

  const prevArr = state.profile[profileCol];
  state.profile[profileCol] = nextArr;

  const { error } = await client
    .from('profiles')
    .update({ [profileCol]: nextArr })
    .eq('cid', state.ownerCid);

  if (error) {
    console.warn(`Automatic ID sync to profiles.${profileCol} skipped:`, error);
    state.profile[profileCol] = prevArr;
  }
}

function normalizeHeroButtonVal(rawVal) {
  const num = Number(rawVal ?? 1);
  if (num === 0) return 0;
  if (num === 2) return 2;
  return 1;
}

function syncHeroSwitchUi(heroVal) {
  const mode = normalizeHeroButtonVal(heroVal);
  const resBtn = document.getElementById('sw-hero-researches');
  const swBtn = document.getElementById('sw-hero-software');
  const bothBtn = document.getElementById('sw-hero-both');

  if (resBtn) {
    const active = mode === 1;
    resBtn.classList.toggle('is-active', active);
    resBtn.setAttribute('aria-checked', active ? 'true' : 'false');
  }
  if (swBtn) {
    const active = mode === 0;
    swBtn.classList.toggle('is-active', active);
    swBtn.setAttribute('aria-checked', active ? 'true' : 'false');
  }
  if (bothBtn) {
    const active = mode === 2;
    bothBtn.classList.toggle('is-active', active);
    bothBtn.setAttribute('aria-checked', active ? 'true' : 'false');
  }
}

function getSelectedHeroButtonFromUi() {
  if (document.getElementById('sw-hero-both')?.getAttribute('aria-checked') === 'true') {
    return 2;
  }
  if (document.getElementById('sw-hero-software')?.getAttribute('aria-checked') === 'true') {
    return 0;
  }
  return 1;
}

function syncWhatsappConsentUi(rawVal) {
  const statusEl = document.getElementById('wa-status-badge');
  const clearBtn = document.getElementById('clear-whatsapp-btn');
  const hasValidTarget = Boolean(normalizeOwnerWhatsAppTarget(rawVal));

  if (statusEl) {
    statusEl.dataset.active = hasValidTarget ? 'true' : 'false';
    statusEl.textContent = hasValidTarget
      ? 'Shared · WhatsApp button active'
      : 'Not shared · Button hidden';
  }
  if (clearBtn) {
    clearBtn.hidden = !cleanText(rawVal);
  }
}

function populateSwitchesSection() {
  const p = state.profile;
  if (!p) return;

  syncHeroSwitchUi(p.hero_button);

  const waInput = document.getElementById('f-whatsapp');
  const savedWa = cleanText(p.whatsapp);
  if (waInput) {
    waInput.value = savedWa;
    setFieldError('whatsapp', '');
    updateCharCounterForInput(waInput);
  }
  syncWhatsappConsentUi(savedWa);
}

function populatePhotoSection(cacheBustTs = 0) {
  const p = state.profile;
  const mockBanner = document.getElementById('pe-photo-mock-banner');
  if (mockBanner) {
    mockBanner.hidden = Boolean(UPLOAD_WORKER_URL);
  }

  const keyEl = document.getElementById('ro-photo-key');
  const rawPhoto = cleanText(p.photo);
  if (keyEl) {
    keyEl.textContent = rawPhoto || '(empty — uses initials / leader fallback)';
  }

  const initialsEl = document.getElementById('pe-avatar-initials');
  if (initialsEl) {
    initialsEl.textContent = getInitials(p.name);
  }

  const imgEl = document.getElementById('pe-avatar-img');
  const fbEl = document.getElementById('pe-avatar-fallback');
  if (!imgEl || !fbEl) return;

  const memberDir = resolveDefaultImageDirForType(p.type);
  const baseSrc = resolveImageSrc(rawPhoto, memberDir) || state.leaderFallbackPhoto;

  if (!baseSrc) {
    imgEl.hidden = true;
    imgEl.removeAttribute('src');
    fbEl.hidden = false;
    return;
  }

  const finalSrc = cacheBustTs
    ? `${baseSrc}${baseSrc.includes('?') ? '&' : '?'}v=${cacheBustTs}`
    : baseSrc;

  imgEl.onload = () => {
    imgEl.hidden = false;
    fbEl.hidden = true;
  };
  imgEl.onerror = () => {
    imgEl.hidden = true;
    fbEl.hidden = false;
  };
  imgEl.src = finalSrc;
}

function updateTeacherLiveScholarshipDom() {
  if (!state.profile || normalizeAccountType(state.profile.type) !== 'T') return;
  const revInput = document.getElementById('f-t-researches_reviewed');
  const manualVal = Math.max(0, parseInt(cleanText(revInput?.value ?? state.roleRow?.researches_reviewed), 10) || 0);
  const liveRev = Number(state.teacherLiveReviewedCount ?? 0);
  const displayedTotal = Math.max(manualVal, liveRev);
  const pubCount = state.researches.length;

  const liveEl = document.getElementById('ro-t-live-reviewed');
  const totalEl = document.getElementById('ro-t-total-reviewed');
  const pubEl = document.getElementById('ro-t-published');

  if (liveEl) liveEl.textContent = String(liveRev).padStart(2, '0');
  if (totalEl) totalEl.textContent = String(displayedTotal).padStart(2, '0');
  if (pubEl) pubEl.textContent = String(pubCount).padStart(2, '0');
}

function updateInstituteCoverPreview(overrideSrc = '') {
  if (!state.profile || normalizeAccountType(state.profile.type) !== 'I') return;

  const coverImg = document.getElementById('pe-inst-cover-img');
  const coverFb = document.getElementById('pe-inst-cover-fallback');
  const crestMini = document.getElementById('pe-inst-crest-mini');
  const previewType = document.getElementById('pe-inst-preview-type');
  const previewName = document.getElementById('pe-inst-preview-name');
  const coverInput = document.getElementById('f-i-cover_url');
  const typeInput = document.getElementById('f-i-institute_type');
  const nameInput = document.getElementById('f-name');

  const displayName = cleanText(nameInput?.value) || cleanText(state.profile.name) || 'Institute Name';
  const displayType = cleanText(typeInput?.value) || cleanText(state.roleRow?.institute_type) || 'Partner Institution';

  if (crestMini) crestMini.textContent = getInitials(displayName);
  if (previewType) previewType.textContent = displayType;
  if (previewName) previewName.textContent = displayName;

  if (!coverImg || !coverFb) return;

  const rawCover = overrideSrc || cleanText(coverInput?.value);
  const resolved = resolveImageSrc(rawCover, IMAGE_DIRS.institutes);
  if (!resolved) {
    coverImg.hidden = true;
    coverImg.removeAttribute('src');
    coverFb.hidden = false;
    return;
  }

  coverImg.onload = () => {
    coverImg.hidden = false;
    coverFb.hidden = true;
  };
  coverImg.onerror = () => {
    coverImg.hidden = true;
    coverFb.hidden = false;
  };
  coverImg.src = resolved;
}

function applyAccountTypeLayout() {
  if (!state.profile) return;
  const accType = normalizeAccountType(state.profile.type);
  const isStudent = accType === 'S';
  const isReader = accType === 'R';
  const isTeacher = accType === 'T';
  const isInst = accType === 'I';

  const setHidden = (id, hidden) => {
    const el = document.getElementById(id);
    if (el) el.hidden = Boolean(hidden);
  };

  // Section-level visibility by account type (S / R / T / I)
  setHidden('sec-basics', false);
  setHidden('sec-affiliation', isReader); // S, T, I use role tables; R uses standard individual sections
  setHidden('sec-metrics', isInst);
  setHidden('sec-switches', false);
  setHidden('sec-photo', false);
  setHidden('sec-cv', isInst);
  setHidden('sec-cards', isInst);
  setHidden('sec-researches', isInst);
  setHidden('sec-softwares', isInst || isTeacher); // Teachers & Institutes have no software section

  // Basics section adaptation for Institute (I) vs Individuals (S / R / T)
  setHidden('group-registration', isInst);
  setHidden('group-father_name', isInst);
  setHidden('group-mother_name', isInst);
  setHidden('group-profession', isInst);
  setHidden('group-institution_override', isInst);
  setHidden('group-research_interests', isInst);
  setHidden('group-statement_kicker', isInst);
  setHidden('group-q2', isInst);

  const basicsTitle = document.getElementById('sec-basics-title');
  const basicsSummary = document.getElementById('sec-basics-summary');
  const legalTitle = document.getElementById('block-legal-title');
  const legalDesc = document.getElementById('block-legal-desc');
  const lblName = document.getElementById('lbl-f-name');
  const fName = document.getElementById('f-name');
  const lblLoc = document.getElementById('lbl-f-location');
  const lblQ1 = document.getElementById('lbl-f-q1');
  const fQ1 = document.getElementById('f-q1');
  const lblEmail = document.getElementById('lbl-f-public_email');
  const philTitle = document.getElementById('block-philosophy-title');
  const philDesc = document.getElementById('block-philosophy-desc');
  const lblBio = document.getElementById('lbl-f-bio');
  const fBio = document.getElementById('f-bio');

  if (isInst) {
    if (basicsTitle) basicsTitle.textContent = 'College / Institute Identity, URL Slug & Overview';
    if (basicsSummary) {
      basicsSummary.textContent =
        'Official college name, public URL slug (/profile/I/<username>), motto, correspondence email, and institutional overview.';
    }
    if (legalTitle) legalTitle.textContent = 'Official College / Institute Name';
    if (legalDesc) {
      legalDesc.textContent =
        'Displayed as the primary title on your Institute profile and linked across affiliated student and faculty portfolios.';
    }
    if (lblName) lblName.textContent = 'College / Institute Name (name) *';
    if (fName) fName.placeholder = 'e.g. Notre Dame College, Dhaka';
    if (lblLoc) lblLoc.textContent = 'City / Region (location)';
    if (lblQ1) lblQ1.textContent = 'Institutional Motto / Tagline (q1)';
    if (fQ1) fQ1.placeholder = 'e.g. Advancing Collegiate Discovery & Open Scholarship';
    if (lblEmail) lblEmail.textContent = 'Official Registry Email (public_email)';
    if (philTitle) philTitle.textContent = 'Institutional Overview';
    if (philDesc) philDesc.textContent = 'Displayed in the Institutional Overview card on your public profile.';
    if (lblBio) lblBio.textContent = 'About the Institution (bio)';
    if (fBio) fBio.placeholder = 'Summarize academic heritage, laboratories, departments, and research culture...';
  } else {
    if (basicsTitle) basicsTitle.textContent = 'Legal Identity, URL Slug & Portfolio Basics';
    if (basicsSummary) {
      basicsSummary.textContent =
        'Full legal names, numeric registration, custom profile slug, hero headline, contact details, statement quote, and biography.';
    }
    if (legalTitle) legalTitle.textContent = 'Legal Identity & Registration';
    if (legalDesc) {
      legalDesc.textContent =
        'Shows your saved database values. Any field currently empty in the database prompts for your official legal record and remains editable anytime.';
    }
    if (lblName) lblName.textContent = 'Full Legal Name (name) *';
    if (fName) fName.placeholder = 'Enter your full legal name';
    if (lblLoc) lblLoc.textContent = 'Location (location)';
    if (lblQ1) lblQ1.textContent = 'Hero Headline (q1)';
    if (fQ1) fQ1.placeholder = 'e.g. Turning curiosity into precision, one machined part at a time.';
    if (lblEmail) lblEmail.textContent = 'Public Correspondence Email (public_email)';
    if (philTitle) philTitle.textContent = 'Philosophy Statement & Biography';
    if (philDesc) philDesc.textContent = 'Displayed in the editorial statement section of your public portfolio.';
    if (lblBio) lblBio.textContent = 'Biography / Statement Description (bio)';
    if (fBio) fBio.placeholder = 'Write your full academic and engineering biography...';
  }

  // Affiliation section adaptation (S / T / I)
  setHidden('panel-inst-cover', !isInst);
  setHidden('group-t-designation', !isTeacher);
  setHidden('group-i-institute_type', !isInst);
  setHidden('panel-aff-teacher', !isTeacher);
  setHidden('panel-aff-institute', !isInst);

  const affTitle = document.getElementById('sec-affiliation-title');
  const affSummary = document.getElementById('sec-affiliation-summary');
  const lblAffEiin = document.getElementById('lbl-aff-eiin');
  const affJump = document.querySelector('.pe-jump-link[data-jump-target="sec-affiliation"]');

  if (isStudent) {
    if (affTitle) affTitle.textContent = 'Affiliated College EIIN (public.students)';
    if (affSummary) {
      affSummary.textContent =
        'Connect your student portfolio to your college’s EIIN so your profile links to the institute and counts toward campus publications.';
    }
    if (lblAffEiin) lblAffEiin.textContent = 'Affiliated College EIIN (students.eiin)';
    if (affJump) affJump.dataset.jumpLabel = 'College EIIN';
  } else if (isTeacher) {
    if (affTitle) affTitle.textContent = 'Faculty Affiliation & Peer-Review Record (public.teachers)';
    if (affSummary) {
      affSummary.textContent =
        'Set your affiliated institute EIIN, faculty designation, department, and peer-reviewed research count.';
    }
    if (lblAffEiin) lblAffEiin.textContent = 'Affiliated Institute EIIN (teachers.eiin)';
    if (affJump) affJump.dataset.jumpLabel = 'Institute & Review';
  } else if (isInst) {
    if (affTitle) affTitle.textContent = 'Cover Banner, EIIN Registry & Campus Totals (public.institutes)';
    if (affSummary) {
      affSummary.textContent =
        'Configure your Facebook-style cover banner, EIIN, address, website, total students, and total teachers.';
    }
    if (lblAffEiin) lblAffEiin.textContent = 'Official Institute EIIN (institutes.eiin)';
    if (affJump) affJump.dataset.jumpLabel = 'Cover & Registry';
  }

  // Switches section adaptation: Teachers & Institutes have no Software hero toggle
  setHidden('sw-hero-row', isTeacher || isInst);
  const swTitle = document.getElementById('sec-switches-title');
  const swSummary = document.getElementById('sec-switches-summary');
  const swJump = document.querySelector('.pe-jump-link[data-jump-target="sec-switches"]');
  if (isTeacher || isInst) {
    if (swTitle) swTitle.textContent = 'Public WhatsApp Contact';
    if (swSummary) {
      swSummary.textContent = isInst
        ? 'Share an official coordination WhatsApp number (profiles.whatsapp) on your Institute header.'
        : 'Share your WhatsApp number (profiles.whatsapp) to display a direct contact button on your Teacher hero.';
    }
    if (swJump) swJump.dataset.jumpLabel = 'WhatsApp Contact';
  } else {
    if (swTitle) swTitle.textContent = 'Hero Buttons & WhatsApp Contact';
    if (swSummary) {
      swSummary.textContent =
        'Display Researches, Software, or Both in your hero (hero_button), and share your WhatsApp number (whatsapp) to enable direct contact.';
    }
    if (swJump) swJump.dataset.jumpLabel = 'Hero & WhatsApp';
  }

  // Photo / Crest section adaptation
  const photoTitle = document.getElementById('sec-photo-title');
  const photoSummary = document.getElementById('sec-photo-summary');
  const photoJump = document.querySelector('.pe-jump-link[data-jump-target="sec-photo"]');
  if (isInst) {
    if (photoTitle) photoTitle.textContent = 'Institute Crest / Official Logo (profiles.photo)';
    if (photoSummary) {
      photoSummary.textContent =
        'Displayed overlapping your campus cover banner at /profile/I/<username>. Preview 800px WebP conversion locally.';
    }
    if (photoJump) photoJump.dataset.jumpLabel = 'Institute Crest';
  } else {
    if (photoTitle) photoTitle.textContent = 'Profile Picture (profiles.photo)';
    if (photoSummary) {
      photoSummary.textContent =
        'Frontend-only portrait preview and 800px WebP compression prepared for upcoming Cloudflare storage integration.';
    }
    if (photoJump) photoJump.dataset.jumpLabel = 'Portrait';
  }

  renumberVisibleSectionsAndJumps();
}

function renumberVisibleSectionsAndJumps() {
  const sections = Array.from(document.querySelectorAll('.pe-section[data-collapsible]'));
  let num = 0;

  sections.forEach((sec) => {
    const jump = document.querySelector(`.pe-jump-link[data-jump-target="${sec.id}"]`);
    if (sec.hidden) {
      if (jump) jump.hidden = true;
      return;
    }
    num += 1;
    const numStr = String(num).padStart(2, '0');
    const numBadge = sec.querySelector('.pe-section-num');
    if (numBadge) numBadge.textContent = numStr;
    if (jump) {
      jump.hidden = false;
      const baseLabel = jump.dataset.jumpLabel || jump.textContent.replace(/^\d+\.\s*/, '');
      jump.textContent = `${numStr}. ${baseLabel}`;
    }
  });
}

function populateAffiliationSection() {
  if (!state.profile) return;
  const accType = normalizeAccountType(state.profile.type);
  if (accType === 'R') return;

  const r = state.roleRow || {};
  const eiinInput = document.getElementById('f-aff-eiin');
  if (eiinInput) {
    eiinInput.value = cleanText(r.eiin);
    setFieldError('aff-eiin', '');
    updateCharCounterForInput(eiinInput);
    lookupEiinAffiliationHint(r.eiin);
  }

  if (accType === 'T') {
    const desigEl = document.getElementById('f-t-designation');
    const deptEl = document.getElementById('f-t-department');
    const revEl = document.getElementById('f-t-researches_reviewed');

    if (desigEl) {
      desigEl.value = cleanText(r.designation);
      updateCharCounterForInput(desigEl);
    }
    if (deptEl) {
      deptEl.value = cleanText(r.department);
      updateCharCounterForInput(deptEl);
    }
    if (revEl) {
      revEl.value = r.researches_reviewed !== undefined && r.researches_reviewed !== null
        ? String(Math.max(0, Number(r.researches_reviewed) || 0))
        : '0';
    }
    updateTeacherLiveScholarshipDom();
  } else if (accType === 'I') {
    const fields = [
      ['i-cover_url', cleanText(r.cover_url)],
      ['i-institute_type', cleanText(r.institute_type)],
      ['i-established_year', cleanText(r.established_year)],
      ['i-website', cleanText(r.website)],
      ['i-address', cleanText(r.address)],
      [
        'i-total_students',
        r.total_students !== undefined && r.total_students !== null && Number(r.total_students) > 0
          ? String(Number(r.total_students))
          : ''
      ],
      [
        'i-total_teachers',
        r.total_teachers !== undefined && r.total_teachers !== null && Number(r.total_teachers) > 0
          ? String(Number(r.total_teachers))
          : ''
      ]
    ];

    fields.forEach(([key, val]) => {
      const el = document.getElementById(`f-${key}`);
      if (!el) return;
      el.value = val;
      setFieldError(key, '');
      updateCharCounterForInput(el);
    });

    updateInstituteCoverPreview();
    renderInstituteLiveStatsDom();
  }
}

async function handleSaveAffiliationForm(e) {
  if (e) e.preventDefault();
  if (!state.profile || !state.ownerCid) return;

  const accType = normalizeAccountType(state.profile.type);
  if (accType === 'R') return;

  const client = getSupabaseClient();
  if (!client) return;

  const eiinInput = document.getElementById('f-aff-eiin');
  const eiinVal = clampStr(eiinInput?.value, 20) || null;
  if (eiinVal && !/^[A-Za-z0-9-]+$/.test(eiinVal)) {
    setFieldError('aff-eiin', 'EIIN may only contain letters, digits, or hyphens.');
    setSectionMessage('msg-affiliation', 'error', 'Please enter a valid EIIN code.');
    return;
  }
  setFieldError('aff-eiin', '');

  let tableName = 'students';
  let fullPayload = { cid: state.ownerCid, eiin: eiinVal };
  const corePayload = { cid: state.ownerCid, eiin: eiinVal };
  let hasExtendedValues = false;

  if (accType === 'T') {
    tableName = 'teachers';
    const designation = clampStr(document.getElementById('f-t-designation')?.value, 120) || null;
    const department = clampStr(document.getElementById('f-t-department')?.value, 120) || null;
    const rawRev = cleanText(document.getElementById('f-t-researches_reviewed')?.value);
    if (rawRev && !/^\d+$/.test(rawRev)) {
      setFieldError('t-researches_reviewed', 'Enter a whole number (0 or greater).');
      setSectionMessage('msg-affiliation', 'error', 'Please fix the highlighted fields above.');
      return;
    }
    setFieldError('t-researches_reviewed', '');
    const researchesReviewed = rawRev ? Math.max(0, parseInt(rawRev, 10) || 0) : 0;

    fullPayload = {
      cid: state.ownerCid,
      eiin: eiinVal,
      designation,
      department,
      researches_reviewed: researchesReviewed
    };
    hasExtendedValues = Boolean(designation || department || researchesReviewed > 0);
  } else if (accType === 'I') {
    tableName = 'institutes';
    const coverUrl = clampStr(document.getElementById('f-i-cover_url')?.value, 1000) || null;
    const instituteType = clampStr(document.getElementById('f-i-institute_type')?.value, 80) || null;
    const estYear = cleanText(document.getElementById('f-i-established_year')?.value) || null;
    const website = clampStr(document.getElementById('f-i-website')?.value, 300) || null;
    const address = clampStr(document.getElementById('f-i-address')?.value, 240) || null;
    const rawTotalStudents = cleanText(document.getElementById('f-i-total_students')?.value);
    const rawTotalTeachers = cleanText(document.getElementById('f-i-total_teachers')?.value);

    let invalid = false;
    if (coverUrl && !isHttpUrl(coverUrl) && !coverUrl.startsWith('/')) {
      setFieldError('i-cover_url', 'Cover URL must start with https://, http://, or /');
      invalid = true;
    } else {
      setFieldError('i-cover_url', '');
    }

    if (estYear && !/^\d{3,4}$/.test(estYear)) {
      setFieldError('i-established_year', 'Enter a 4-digit year (e.g. 1949).');
      invalid = true;
    } else {
      setFieldError('i-established_year', '');
    }

    if (website && !isHttpUrl(website)) {
      setFieldError('i-website', 'Website must begin with https:// or http://');
      invalid = true;
    } else {
      setFieldError('i-website', '');
    }

    if (rawTotalStudents && !/^\d+$/.test(rawTotalStudents)) {
      setFieldError('i-total_students', 'Digits (0–9) only.');
      invalid = true;
    } else {
      setFieldError('i-total_students', '');
    }

    if (rawTotalTeachers && !/^\d+$/.test(rawTotalTeachers)) {
      setFieldError('i-total_teachers', 'Digits (0–9) only.');
      invalid = true;
    } else {
      setFieldError('i-total_teachers', '');
    }

    if (invalid) {
      setSectionMessage('msg-affiliation', 'error', 'Please fix the highlighted fields above.');
      return;
    }

    const totalStudents = rawTotalStudents ? parseInt(rawTotalStudents, 10) : null;
    const totalTeachers = rawTotalTeachers ? parseInt(rawTotalTeachers, 10) : null;

    fullPayload = {
      cid: state.ownerCid,
      eiin: eiinVal,
      cover_url: coverUrl,
      institute_type: instituteType,
      established_year: estYear,
      website,
      address,
      total_students: totalStudents,
      total_teachers: totalTeachers
    };
    hasExtendedValues = Boolean(
      coverUrl || instituteType || estYear || website || address || totalStudents !== null || totalTeachers !== null
    );
  }

  beginFlight('Saving…');
  setSectionMessage('msg-affiliation', '', 'Saving institutional record…');

  let { data, error } = await client
    .from(tableName)
    .upsert(fullPayload, { onConflict: 'cid' })
    .select('*')
    .maybeSingle();

  let usedCoreFallback = false;
  if (error && accType !== 'S' && isMissingColumnError(error)) {
    usedCoreFallback = true;
    const retryRes = await client
      .from(tableName)
      .upsert(corePayload, { onConflict: 'cid' })
      .select('*')
      .maybeSingle();
    data = retryRes.data;
    error = retryRes.error;
  }

  if (error) {
    const msg = formatSupabaseError(error, `Could not save ${tableName} record`);
    setSectionMessage('msg-affiliation', 'error', msg);
    endFlight(false, 'Saved', 'Could not save');
    return;
  }

  state.roleRow = { ...(state.roleRow || {}), ...(data || fullPayload) };
  markDirty('affiliation.form', false);
  await lookupEiinAffiliationHint(eiinVal);

  if (accType === 'T') {
    updateTeacherLiveScholarshipDom();
  } else if (accType === 'I') {
    updateInstituteCoverPreview();
    await refreshInstituteLiveStats(eiinVal);
  }

  if (usedCoreFallback && hasExtendedValues) {
    setSectionMessage(
      'msg-affiliation',
      'ok',
      `EIIN saved to public.${tableName}. Run the ALTER TABLE SQL migration in Supabase to persist the extended ${tableName} columns.`
    );
  } else {
    setSectionMessage('msg-affiliation', 'ok', 'Institutional record saved.');
  }
  endFlight(true, 'Saved', 'Could not save');
}

function populateAllSections() {
  applyAccountTypeLayout();
  updateHeaderAndHeading();
  populateBasicsSection();
  populateAffiliationSection();
  populateMetricsSection();
  populateSwitchesSection();
  populatePhotoSection();
  renderCvList('education');
  renderCvList('experience');
  renderCustomCardsList('skills');
  renderCustomCardsList('cocurriculars');
  renderResearchesList();
  renderSoftwaresList();
}

/* ==========================================================================
   9. Optimistic public.profiles Scalar & Metric Persistence
   ========================================================================== */
function validateAndNormalizeBasicsCol(col, rawValue) {
  const spec =
    BASICS_CORE_SPECS[col] ||
    BASICS_EXTRA_SCALAR_SPECS[col] ||
    (col === 'whatsapp' ? WHATSAPP_SPEC : null);
  if (!spec) return { ok: true, dbVal: null };

  if (spec.type === 'digits') {
    const trimmed = cleanText(rawValue);
    if (!trimmed) return { ok: true, dbVal: null };
    if (!/^\d+$/.test(trimmed)) {
      return { ok: false, error: 'Registration number must contain digits (0–9) only.' };
    }
    if (trimmed.length > spec.max) {
      return { ok: false, error: `Registration number must be at most ${spec.max} digits.` };
    }
    return { ok: true, dbVal: trimmed };
  }

  if (spec.type === 'slug') {
    const rawTrimmed = cleanText(rawValue);
    if (!rawTrimmed) return { ok: true, dbVal: null };
    const candidate = normalizeSlugCandidate(rawTrimmed);
    if (!candidate) {
      return { ok: false, error: 'Slug must contain lowercase letters or numbers.' };
    }
    if (candidate.length < 2 || candidate.length > spec.max) {
      return { ok: false, error: `Slug must be between 2 and ${spec.max} characters.` };
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate)) {
      return {
        ok: false,
        error: 'Use only lowercase letters (a–z), numbers (0–9), and hyphens (-).'
      };
    }
    if (['s', 't', 'r', 'i', 'edit', 'index'].includes(candidate) || UUID_RE.test(candidate)) {
      return {
        ok: false,
        error: 'That slug is reserved by portfolio routing. Please choose a different slug.'
      };
    }
    return { ok: true, dbVal: candidate };
  }

  const clamped = clampStr(rawValue, spec.max);

  if (spec.required && !clamped) {
    return { ok: false, error: `${spec.label} cannot be empty.` };
  }

  if (spec.type === 'email') {
    if (!clamped || clamped === '0') return { ok: true, dbVal: null };
    if (!isValidPublicEmail(clamped)) {
      return { ok: false, error: 'Enter a valid email address (or leave blank to hide).' };
    }
    return { ok: true, dbVal: clamped };
  }

  if (spec.type === 'whatsapp') {
    if (!clamped || clamped === '0') return { ok: true, dbVal: null };
    const normalized = normalizeOwnerWhatsAppTarget(clamped);
    if (!normalized) {
      return {
        ok: false,
        error: 'Enter a valid phone number (at least 7 digits, e.g. +8801890803091) or leave blank.'
      };
    }
    return { ok: true, dbVal: clamped };
  }

  return { ok: true, dbVal: spec.required ? clamped : (clamped || null) };
}

function validateAndNormalizeMetricCol(col, rawValue) {
  if (METRIC_BATCH_COLS.includes(col)) {
    const trimmed = cleanText(rawValue);
    if (!trimmed) return { ok: true, dbVal: null };
    if (!/^\d{2,4}$/.test(trimmed)) {
      return {
        ok: false,
        error: 'Enter a 2 to 4 digit batch year (e.g. 23 or 2023).'
      };
    }
    return { ok: true, dbVal: trimmed };
  }

  if (METRIC_GPA_COLS.includes(col)) {
    const trimmed = String(rawValue ?? '').trim();
    if (trimmed === '') {
      return { ok: true, dbVal: 0 };
    }
    if (!/^\d+(\.\d{1,4})?$/.test(trimmed)) {
      return {
        ok: false,
        error: 'Enter a decimal GPA between 0.00 and 5.00 (whole numbers like 5 format to 5.00).'
      };
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num < 0 || num > 5) {
      return { ok: false, error: 'GPA must be between 0.00 and 5.00.' };
    }
    const rounded = Number(num.toFixed(2));
    return { ok: true, dbVal: rounded };
  }

  if (METRIC_SUB_COLS.includes(col)) {
    const clamped = clampStr(rawValue, 60);
    return { ok: true, dbVal: clamped || null };
  }

  return { ok: true, dbVal: null };
}

async function saveProfilePatchOptimistic(patchObj, dirtyKeyPrefix, sectionMsgId, onRollbackUi) {
  const client = getSupabaseClient();
  if (!client || !state.profile) return false;

  const keys = Object.keys(patchObj);
  if (keys.length === 0) return true;

  const prevSnapshot = {};
  keys.forEach((k) => {
    prevSnapshot[k] = Array.isArray(state.profile[k])
      ? [...state.profile[k]]
      : state.profile[k];
    state.profile[k] = Array.isArray(patchObj[k])
      ? [...patchObj[k]]
      : patchObj[k];
  });

  if (patchObj.name !== undefined || patchObj.slug !== undefined) {
    updateHeaderAndHeading();
    if (patchObj.name !== undefined) {
      const initialsEl = document.getElementById('pe-avatar-initials');
      if (initialsEl) initialsEl.textContent = getInitials(state.profile.name);
    }
  }
  syncLegalNullPrompts();

  beginFlight('Saving…');
  setSectionMessage(sectionMsgId, '', 'Saving…');

  const { error } = await client
    .from('profiles')
    .update(patchObj)
    .eq('cid', state.ownerCid);

  if (error) {
    console.error('Failed to update public.profiles:', error, patchObj);
    keys.forEach((k) => {
      state.profile[k] = prevSnapshot[k];
    });
    if (patchObj.name !== undefined || patchObj.slug !== undefined) {
      updateHeaderAndHeading();
    }
    if (typeof onRollbackUi === 'function') {
      onRollbackUi(prevSnapshot);
    }
    syncLegalNullPrompts();
    const msg = formatSupabaseError(error, 'Could not save changes');
    setSectionMessage(sectionMsgId, 'error', msg);
    endFlight(false, 'Saved', 'Could not save');
    return false;
  }

  if (dirtyKeyPrefix) {
    keys.forEach((k) => markDirty(`profiles.${k}`, false));
    markDirty(dirtyKeyPrefix, false);
  }
  syncLegalNullPrompts();
  setSectionMessage(sectionMsgId, 'ok', 'Saved.');
  endFlight(true, 'Saved', 'Could not save');
  return true;
}

async function handleBasicsFieldBlur(col) {
  const input = document.getElementById(`f-${col}`);
  if (!input || !state.profile) return;

  const check = validateAndNormalizeBasicsCol(col, input.value);
  if (!check.ok) {
    setFieldError(col, check.error);
    syncLegalNullPrompts();
    return;
  }
  setFieldError(col, '');

  const normalizedUi = check.dbVal ?? '';
  if (input.value !== normalizedUi) {
    input.value = normalizedUi;
    updateCharCounterForInput(input);
  }

  const currentVal = cleanText(state.profile[col]) || null;
  if (check.dbVal === currentVal) {
    markDirty(`profiles.${col}`, false);
    if (col === 'slug') {
      updateSlugPreviewHint(normalizedUi, normalizedUi ? 'current' : '');
    }
    syncLegalNullPrompts();
    return;
  }

  if (col === 'slug' && check.dbVal) {
    setSectionMessage('msg-basics', '', 'Checking slug availability…');
    const avail = await checkSlugAvailability(check.dbVal);
    if (!avail.ok) {
      setFieldError('slug', avail.error);
      setSectionMessage('msg-basics', 'error', avail.error);
      updateSlugPreviewHint(check.dbVal, '');
      return;
    }
    updateSlugPreviewHint(check.dbVal, 'available');
  }

  const saved = await saveProfilePatchOptimistic(
    { [col]: check.dbVal },
    `profiles.${col}`,
    'msg-basics',
    (prev) => {
      input.value = cleanText(prev[col]);
      updateCharCounterForInput(input);
      if (col === 'slug') {
        const revSlug = cleanText(prev.slug);
        updateSlugPreviewHint(revSlug, revSlug ? 'current' : '');
      }
    }
  );

  if (saved && col === 'slug') {
    updateSlugPreviewHint(normalizedUi, normalizedUi ? 'current' : '');
  }
}

async function handleSaveBasicsForm(e) {
  if (e) e.preventDefault();
  if (!state.profile) return;

  let hasValidationError = false;
  const corePatch = {};
  const extraPatch = {};

  Object.keys(BASICS_CORE_SPECS).forEach((col) => {
    const input = document.getElementById(`f-${col}`);
    if (!input) return;
    const res = validateAndNormalizeBasicsCol(col, input.value);
    if (!res.ok) {
      setFieldError(col, res.error);
      hasValidationError = true;
      return;
    }
    setFieldError(col, '');
    input.value = res.dbVal ?? '';
    updateCharCounterForInput(input);
    const cur = cleanText(state.profile[col]) || null;
    if (res.dbVal !== cur) {
      corePatch[col] = res.dbVal;
    }
  });

  Object.keys(BASICS_EXTRA_SCALAR_SPECS).forEach((col) => {
    const input = document.getElementById(`f-${col}`);
    if (!input) return;
    const res = validateAndNormalizeBasicsCol(col, input.value);
    if (!res.ok) {
      setFieldError(col, res.error);
      hasValidationError = true;
      return;
    }
    setFieldError(col, '');
    input.value = res.dbVal ?? '';
    updateCharCounterForInput(input);
    const cur = cleanText(state.profile[col]) || null;
    if (res.dbVal !== cur) {
      extraPatch[col] = res.dbVal;
    }
  });

  if (hasValidationError) {
    syncLegalNullPrompts();
    setSectionMessage('msg-basics', 'error', 'Please fix the highlighted validation errors above.');
    setTopSaveStatus('error', 'Could not save');
    return;
  }

  if (corePatch.slug) {
    setSectionMessage('msg-basics', '', 'Checking slug availability…');
    const avail = await checkSlugAvailability(corePatch.slug);
    if (!avail.ok) {
      setFieldError('slug', avail.error);
      setSectionMessage('msg-basics', 'error', avail.error);
      setTopSaveStatus('error', 'Could not save');
      return;
    }
  }

  const coreKeys = Object.keys(corePatch);
  const extraKeys = Object.keys(extraPatch);

  if (coreKeys.length === 0 && extraKeys.length === 0) {
    setSectionMessage('msg-basics', 'ok', 'All Legal & Basics fields are already up to date.');
    setTopSaveStatus('saved', 'Saved');
    return;
  }

  let ok = true;
  if (coreKeys.length > 0) {
    ok = await saveProfilePatchOptimistic(corePatch, 'basics.core', 'msg-basics', () => {
      populateBasicsSection();
    });
  }
  if (ok && extraKeys.length > 0) {
    ok = await saveProfilePatchOptimistic(extraPatch, 'basics.extra', 'msg-basics', () => {
      populateBasicsSection();
    });
  }
  if (ok) {
    const activeSlug = cleanText(state.profile.slug);
    updateSlugPreviewHint(activeSlug, activeSlug ? 'current' : '');
  }
}

async function handleMetricFieldBlur(col) {
  const input = document.getElementById(`f-${col}`);
  if (!input || !state.profile) return;

  const res = validateAndNormalizeMetricCol(col, input.value);
  if (!res.ok) {
    setFieldError(col, res.error);
    return;
  }
  setFieldError(col, '');

  const patch = { [col]: res.dbVal };

  if (METRIC_GPA_COLS.includes(col)) {
    input.value = formatGpaInput(res.dbVal);
    // Exact profile.js rule: setting ug_cgpa or grad_cgpa to 0 clears its _sub
    if (col === 'ug_cgpa' && res.dbVal <= 0) {
      patch.ug_sub = null;
      const ugSubEl = document.getElementById('f-ug_sub');
      if (ugSubEl) {
        ugSubEl.value = '';
        updateCharCounterForInput(ugSubEl);
      }
      markDirty('profiles.ug_sub', false);
    } else if (col === 'grad_cgpa' && res.dbVal <= 0) {
      patch.grad_sub = null;
      const gradSubEl = document.getElementById('f-grad_sub');
      if (gradSubEl) {
        gradSubEl.value = '';
        updateCharCounterForInput(gradSubEl);
      }
      markDirty('profiles.grad_sub', false);
    }
  } else {
    input.value = res.dbVal ?? '';
    updateCharCounterForInput(input);
  }

  const changedCols = Object.keys(patch).filter((k) => {
    if (METRIC_GPA_COLS.includes(k)) {
      const curNum = Number(Number(state.profile[k] ?? 0).toFixed(2));
      return curNum !== patch[k];
    }
    const curStr = cleanText(state.profile[k]) || null;
    return curStr !== patch[k];
  });

  if (changedCols.length === 0) {
    markDirty(`profiles.${col}`, false);
    return;
  }

  await saveProfilePatchOptimistic(patch, `profiles.${col}`, 'msg-metrics', () => {
    populateMetricsSection();
  });
}

async function handleSaveMetricsForm(e) {
  if (e) e.preventDefault();
  if (!state.profile) return;

  let hasErr = false;
  const patch = {};

  METRIC_BATCH_COLS.forEach((col) => {
    const input = document.getElementById(`f-${col}`);
    if (!input) return;
    const res = validateAndNormalizeMetricCol(col, input.value);
    if (!res.ok) {
      setFieldError(col, res.error);
      hasErr = true;
      return;
    }
    setFieldError(col, '');
    input.value = res.dbVal ?? '';
    updateCharCounterForInput(input);
    patch[col] = res.dbVal;
  });

  METRIC_GPA_COLS.forEach((col) => {
    const input = document.getElementById(`f-${col}`);
    if (!input) return;
    const res = validateAndNormalizeMetricCol(col, input.value);
    if (!res.ok) {
      setFieldError(col, res.error);
      hasErr = true;
      return;
    }
    setFieldError(col, '');
    input.value = formatGpaInput(res.dbVal);
    patch[col] = res.dbVal;
  });

  METRIC_SUB_COLS.forEach((col) => {
    const input = document.getElementById(`f-${col}`);
    if (!input) return;
    const res = validateAndNormalizeMetricCol(col, input.value);
    if (!res.ok) {
      setFieldError(col, res.error);
      hasErr = true;
      return;
    }
    setFieldError(col, '');
    input.value = res.dbVal ?? '';
    updateCharCounterForInput(input);
    patch[col] = res.dbVal;
  });

  if (hasErr) {
    setSectionMessage('msg-metrics', 'error', 'Please fix the highlighted batch or GPA errors above.');
    setTopSaveStatus('error', 'Could not save');
    return;
  }

  if (patch.ug_cgpa <= 0) {
    patch.ug_sub = null;
    const ugSubEl = document.getElementById('f-ug_sub');
    if (ugSubEl) {
      ugSubEl.value = '';
      updateCharCounterForInput(ugSubEl);
    }
  }
  if (patch.grad_cgpa <= 0) {
    patch.grad_sub = null;
    const gradSubEl = document.getElementById('f-grad_sub');
    if (gradSubEl) {
      gradSubEl.value = '';
      updateCharCounterForInput(gradSubEl);
    }
  }

  const diffPatch = {};
  Object.keys(patch).forEach((k) => {
    if (METRIC_GPA_COLS.includes(k)) {
      const curNum = Number(Number(state.profile[k] ?? 0).toFixed(2));
      if (curNum !== patch[k]) diffPatch[k] = patch[k];
    } else {
      const curStr = cleanText(state.profile[k]) || null;
      if (curStr !== patch[k]) diffPatch[k] = patch[k];
    }
  });

  if (Object.keys(diffPatch).length === 0) {
    setSectionMessage('msg-metrics', 'ok', 'Academic batches and GPAs are already saved.');
    setTopSaveStatus('saved', 'Saved');
    return;
  }

  await saveProfilePatchOptimistic(diffPatch, 'metrics.all', 'msg-metrics', () => {
    populateMetricsSection();
  });
}

/* ==========================================================================
   10. Section 3 — Hero Buttons & WhatsApp Contact + Section 4 — Portrait
   ========================================================================== */
async function setHeroButtonValue(nextVal) {
  if (!state.profile) return;
  const normalized = normalizeHeroButtonVal(nextVal);
  syncHeroSwitchUi(normalized);

  if (normalizeHeroButtonVal(state.profile.hero_button) === normalized) return;

  await saveProfilePatchOptimistic(
    { hero_button: normalized },
    'profiles.hero_button',
    'msg-switches',
    (prev) => {
      syncHeroSwitchUi(prev.hero_button);
    }
  );
}

async function handleWhatsappFieldBlur() {
  const input = document.getElementById('f-whatsapp');
  if (!input || !state.profile) return;

  const check = validateAndNormalizeBasicsCol('whatsapp', input.value);
  if (!check.ok) {
    setFieldError('whatsapp', check.error);
    return;
  }
  setFieldError('whatsapp', '');

  const normalizedUi = check.dbVal ?? '';
  if (input.value !== normalizedUi) {
    input.value = normalizedUi;
    updateCharCounterForInput(input);
  }
  syncWhatsappConsentUi(normalizedUi);

  const currentVal = cleanText(state.profile.whatsapp) || null;
  if (check.dbVal === currentVal) {
    markDirty('profiles.whatsapp', false);
    return;
  }

  await saveProfilePatchOptimistic(
    { whatsapp: check.dbVal },
    'profiles.whatsapp',
    'msg-switches',
    (prev) => {
      const prevWa = cleanText(prev.whatsapp);
      input.value = prevWa;
      updateCharCounterForInput(input);
      syncWhatsappConsentUi(prevWa);
    }
  );
}

async function handleClearWhatsappClick() {
  const input = document.getElementById('f-whatsapp');
  if (!input || !state.profile) return;

  input.value = '';
  setFieldError('whatsapp', '');
  updateCharCounterForInput(input);
  syncWhatsappConsentUi('');

  const currentVal = cleanText(state.profile.whatsapp) || null;
  if (!currentVal) {
    markDirty('profiles.whatsapp', false);
    setSectionMessage('msg-switches', 'ok', 'WhatsApp number cleared — button is hidden.');
    return;
  }

  await saveProfilePatchOptimistic(
    { whatsapp: null },
    'profiles.whatsapp',
    'msg-switches',
    (prev) => {
      const prevWa = cleanText(prev.whatsapp);
      input.value = prevWa;
      updateCharCounterForInput(input);
      syncWhatsappConsentUi(prevWa);
    }
  );
}

async function handleSaveSwitchesSection() {
  if (!state.profile) return;

  const accType = normalizeAccountType(state.profile.type);
  const hideHeroRow = accType === 'T' || accType === 'I';
  const heroVal = getSelectedHeroButtonFromUi();
  const waInput = document.getElementById('f-whatsapp');
  const waCheck = validateAndNormalizeBasicsCol('whatsapp', waInput ? waInput.value : '');
  if (!waCheck.ok) {
    setFieldError('whatsapp', waCheck.error);
    setSectionMessage('msg-switches', 'error', waCheck.error);
    setTopSaveStatus('error', 'Could not save');
    return;
  }
  setFieldError('whatsapp', '');

  const normalizedWaUi = waCheck.dbVal ?? '';
  if (waInput && waInput.value !== normalizedWaUi) {
    waInput.value = normalizedWaUi;
    updateCharCounterForInput(waInput);
  }
  syncWhatsappConsentUi(normalizedWaUi);

  const patch = {};
  if (!hideHeroRow && normalizeHeroButtonVal(state.profile.hero_button) !== heroVal) {
    patch.hero_button = heroVal;
  }
  const curWa = cleanText(state.profile.whatsapp) || null;
  if (waCheck.dbVal !== curWa) {
    patch.whatsapp = waCheck.dbVal;
  }

  if (Object.keys(patch).length === 0) {
    markDirty('profiles.whatsapp', false);
    setSectionMessage('msg-switches', 'ok', 'Contact settings are already saved.');
    setTopSaveStatus('saved', 'Saved');
    return;
  }

  await saveProfilePatchOptimistic(patch, 'switches.save', 'msg-switches', () => {
    populateSwitchesSection();
  });
}

async function handleAvatarFileSelected(e) {
  const file = e.target?.files?.[0];
  const metaEl = document.getElementById('pe-avatar-meta');
  const uploadBtn = document.getElementById('pe-avatar-upload-btn');
  const resetBtn = document.getElementById('pe-avatar-reset-btn');
  setFieldError('avatar', '');
  setSectionMessage('msg-avatar', '', '');

  if (!file) return;

  try {
    const converted = await convertImageFileToWebP(file, WEBP_MAX_EDGE, WEBP_QUALITY);

    if (state.pendingAvatarObjectUrl) {
      URL.revokeObjectURL(state.pendingAvatarObjectUrl);
    }
    state.pendingAvatarBlob = converted.blob;
    state.pendingAvatarObjectUrl = URL.createObjectURL(converted.blob);
    markDirty('avatar.upload', true);

    const imgEl = document.getElementById('pe-avatar-img');
    const fbEl = document.getElementById('pe-avatar-fallback');
    if (imgEl && fbEl) {
      imgEl.src = state.pendingAvatarObjectUrl;
      imgEl.hidden = false;
      fbEl.hidden = true;
    }

    if (metaEl) {
      metaEl.hidden = false;
      metaEl.textContent = `Ready: ${converted.srcW}×${converted.srcH} (${formatBytes(file.size)}) → WebP ${converted.width}×${converted.height} (${formatBytes(converted.blob.size)})`;
    }
    if (uploadBtn) {
      uploadBtn.disabled = false;
      uploadBtn.textContent = UPLOAD_WORKER_URL
        ? 'Upload WebP to Cloudflare'
        : 'Apply Frontend Preview';
    }
    if (resetBtn) resetBtn.hidden = false;
  } catch (err) {
    state.pendingAvatarBlob = null;
    if (metaEl) metaEl.hidden = true;
    if (uploadBtn) uploadBtn.disabled = true;
    setFieldError('avatar', err.message || 'Could not process image.');
  }
}

function resetPendingAvatarPreview() {
  if (state.pendingAvatarObjectUrl) {
    URL.revokeObjectURL(state.pendingAvatarObjectUrl);
    state.pendingAvatarObjectUrl = '';
  }
  state.pendingAvatarBlob = null;
  markDirty('avatar.upload', false);

  const fileInput = document.getElementById('pe-avatar-file');
  const metaEl = document.getElementById('pe-avatar-meta');
  const uploadBtn = document.getElementById('pe-avatar-upload-btn');
  const resetBtn = document.getElementById('pe-avatar-reset-btn');

  if (fileInput) fileInput.value = '';
  if (metaEl) metaEl.hidden = true;
  if (uploadBtn) {
    uploadBtn.disabled = true;
    uploadBtn.textContent = UPLOAD_WORKER_URL
      ? 'Upload WebP to Cloudflare'
      : 'Apply Frontend Preview';
  }
  if (resetBtn) resetBtn.hidden = true;
  setFieldError('avatar', '');
  setSectionMessage('msg-avatar', '', '');
  populatePhotoSection();
}

async function handleAvatarUploadClick() {
  if (!state.pendingAvatarBlob || !state.profile) return;

  const uploadBtn = document.getElementById('pe-avatar-upload-btn');
  const resetBtn = document.getElementById('pe-avatar-reset-btn');
  setFieldError('avatar', '');

  if (uploadBtn) uploadBtn.disabled = true;
  beginFlight(UPLOAD_WORKER_URL ? 'Uploading portrait…' : 'Applying preview…');
  setSectionMessage('msg-avatar', '', UPLOAD_WORKER_URL ? 'Uploading WebP…' : 'Applying frontend preview…');

  try {
    const res = await uploadBlobToWorker({
      blob: state.pendingAvatarBlob,
      filename: 'portrait.webp',
      kind: 'avatar',
      objectKey: cleanText(state.profile.photo)
    });

    markDirty('avatar.upload', false);

    if (res.mock) {
      // Keep local converted WebP preview visible; no network call and no DB write
      const imgEl = document.getElementById('pe-avatar-img');
      const fbEl = document.getElementById('pe-avatar-fallback');
      if (imgEl && fbEl) {
        imgEl.src = res.localUrl;
        imgEl.hidden = false;
        fbEl.hidden = true;
      }
      setSectionMessage(
        'msg-avatar',
        'ok',
        `Frontend preview active: 800px WebP portrait displayed locally (?v=${res.timestamp}). Cloudflare storage upload will be connected separately.`
      );
      endFlight(true, 'Saved (Preview)', 'Could not save');
    } else {
      // Live Cloudflare upload returned url
      if (res.url && res.url !== cleanText(state.profile.photo)) {
        const client = getSupabaseClient();
        await client
          .from('profiles')
          .update({ photo: res.url, updated_at: new Date().toISOString() })
          .eq('cid', state.ownerCid);
        state.profile.photo = res.url;
      }
      populatePhotoSection(res.timestamp);
      if (resetBtn) resetBtn.hidden = true;
      setSectionMessage('msg-avatar', 'ok', `Portrait uploaded to Cloudflare (preview refreshed ?v=${res.timestamp}).`);
      endFlight(true, 'Saved', 'Could not save');
    }
  } catch (err) {
    setFieldError('avatar', err.message || 'Portrait upload failed.');
    setSectionMessage('msg-avatar', 'error', 'Could not upload portrait.');
    endFlight(false, 'Saved', 'Could not save');
  } finally {
    if (uploadBtn && state.pendingAvatarBlob) {
      uploadBtn.disabled = false;
    }
  }
}

/* ==========================================================================
   11. Accessible Modals (Editor Form Modal & Delete Confirm Modal)
   ========================================================================== */
let lastFocusedBeforeModal = null;
let confirmAcceptCallback = null;

function openEditorModal(titleText, buildBodyFn) {
  const backdrop = document.getElementById('pe-editor-modal');
  const titleEl = document.getElementById('pe-editor-modal-title');
  const bodyEl = document.getElementById('pe-editor-modal-body');
  if (!backdrop || !titleEl || !bodyEl) return;

  lastFocusedBeforeModal = document.activeElement;
  state.modalDirty = false;
  titleEl.textContent = titleText;
  bodyEl.textContent = '';

  buildBodyFn(bodyEl, closeEditorModal);

  backdrop.classList.add('open');
  const firstInput = bodyEl.querySelector('input, textarea, select, button');
  if (firstInput) firstInput.focus();
}

function closeEditorModal() {
  const backdrop = document.getElementById('pe-editor-modal');
  const bodyEl = document.getElementById('pe-editor-modal-body');
  if (!backdrop) return;
  backdrop.classList.remove('open');
  state.modalDirty = false;
  if (bodyEl) bodyEl.textContent = '';
  if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
    lastFocusedBeforeModal.focus();
    lastFocusedBeforeModal = null;
  }
}

function openConfirmDeleteModal(titleText, descriptionText, onAccept) {
  const backdrop = document.getElementById('pe-confirm-modal');
  const titleEl = document.getElementById('pe-confirm-title');
  const descEl = document.getElementById('pe-confirm-desc');
  const cancelBtn = document.getElementById('pe-confirm-cancel');
  if (!backdrop || !titleEl || !descEl) return;

  lastFocusedBeforeModal = document.activeElement;
  confirmAcceptCallback = onAccept;
  titleEl.textContent = titleText;
  descEl.textContent = descriptionText;
  backdrop.classList.add('open');
  if (cancelBtn) cancelBtn.focus();
}

function closeConfirmDeleteModal() {
  const backdrop = document.getElementById('pe-confirm-modal');
  if (!backdrop) return;
  backdrop.classList.remove('open');
  confirmAcceptCallback = null;
  if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
    lastFocusedBeforeModal.focus();
    lastFocusedBeforeModal = null;
  }
}

function createModalField({ label, id, required = false, maxLen = 0, hint = '', inputEl }) {
  const group = document.createElement('div');
  group.className = 'input-group';

  const labelRow = document.createElement('div');
  labelRow.className = 'pe-label-row';

  const lbl = document.createElement('label');
  lbl.className = 'input-label';
  if (id) lbl.setAttribute('for', id);
  lbl.textContent = label;
  if (required) {
    const req = document.createElement('span');
    req.className = 'pe-req';
    req.textContent = ' *';
    lbl.appendChild(req);
  }
  labelRow.appendChild(lbl);

  let countEl = null;
  if (maxLen > 0) {
    countEl = document.createElement('span');
    countEl.className = 'pe-char-count';
    const curLen = (inputEl.value || '').length;
    countEl.textContent = `${curLen} / ${maxLen}`;
    labelRow.appendChild(countEl);

    inputEl.maxLength = maxLen;
    inputEl.addEventListener('input', () => {
      state.modalDirty = true;
      const len = (inputEl.value || '').length;
      countEl.textContent = `${len} / ${maxLen}`;
      countEl.classList.toggle('is-near', len >= Math.floor(maxLen * 0.9));
    });
  } else {
    inputEl.addEventListener('input', () => {
      state.modalDirty = true;
    });
  }

  if (id) inputEl.id = id;

  const errEl = document.createElement('div');
  errEl.className = 'pe-field-error';
  errEl.setAttribute('role', 'alert');

  group.appendChild(labelRow);
  group.appendChild(inputEl);
  if (hint) {
    const h = document.createElement('div');
    h.className = 'pe-field-hint';
    h.textContent = hint;
    group.appendChild(h);
  }
  group.appendChild(errEl);

  return {
    group,
    input: inputEl,
    setError: (msg) => {
      errEl.textContent = msg || '';
      if (msg) inputEl.setAttribute('aria-invalid', 'true');
      else inputEl.removeAttribute('aria-invalid');
    }
  };
}

/* ==========================================================================
   12. Section 5 — Education & Experiences (public.profile_cv_entries)
   ========================================================================== */
function renderCvList(entryType) {
  const isEdu = entryType === 'education';
  const listEl = document.getElementById(isEdu ? 'list-education' : 'list-experience');
  if (!listEl) return;
  listEl.textContent = '';

  const rows = state[entryType] || [];
  if (rows.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'pe-empty-state';
    empty.textContent = isEdu
      ? 'No education entries yet. Click "+ Add Education" to add your degrees, schools, or training.'
      : 'No experience entries yet. Click "+ Add Experience" to add lab roles, projects, or work.';
    listEl.appendChild(empty);
    return;
  }

  rows.forEach((row, idx) => {
    const item = document.createElement('article');
    item.className = 'pe-record-item';

    const main = document.createElement('div');
    main.className = 'pe-record-main';

    const eyebrow = document.createElement('div');
    eyebrow.className = 'pe-record-eyebrow';

    const orderSpan = document.createElement('span');
    orderSpan.className = 'pe-record-code';
    orderSpan.textContent = `#${String(row.sort_order ?? idx).padStart(2, '0')}`;

    const periodSpan = document.createElement('span');
    periodSpan.textContent = cleanText(row.period) || '—';

    eyebrow.appendChild(orderSpan);
    eyebrow.appendChild(periodSpan);

    const title = document.createElement('div');
    title.className = 'pe-record-title';
    title.textContent = cleanText(row.core_title) || 'Untitled Entry';

    const sub = document.createElement('div');
    sub.className = 'pe-record-sub';
    sub.textContent = cleanText(row.organization_name) || '';

    main.appendChild(eyebrow);
    main.appendChild(title);
    main.appendChild(sub);

    if (cleanText(row.detail)) {
      const desc = document.createElement('p');
      desc.className = 'pe-record-desc';
      desc.textContent = cleanText(row.detail);
      main.appendChild(desc);
    }

    const actions = document.createElement('div');
    actions.className = 'pe-record-actions';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'pe-act-btn';
    upBtn.textContent = '↑ Up';
    upBtn.disabled = idx === 0;
    upBtn.setAttribute('aria-label', `Move ${row.core_title} up`);
    upBtn.addEventListener('click', () => moveCvEntry(entryType, idx, -1));

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'pe-act-btn';
    downBtn.textContent = '↓ Down';
    downBtn.disabled = idx === rows.length - 1;
    downBtn.setAttribute('aria-label', `Move ${row.core_title} down`);
    downBtn.addEventListener('click', () => moveCvEntry(entryType, idx, 1));

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'pe-act-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openCvModal(entryType, row));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'pe-act-btn pe-act-btn-danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      openConfirmDeleteModal(
        isEdu ? 'Delete Education Entry' : 'Delete Experience Entry',
        `Permanently remove "${cleanText(row.core_title)}" at "${cleanText(row.organization_name)}"?`,
        () => deleteCvEntry(entryType, row.id)
      );
    });

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    item.appendChild(main);
    item.appendChild(actions);
    listEl.appendChild(item);
  });
}

async function moveCvEntry(entryType, index, delta) {
  const list = state[entryType];
  const targetIdx = index + delta;
  if (!list || targetIdx < 0 || targetIdx >= list.length) return;

  const prevSnapshot = list.map((r) => ({ ...r }));

  // Optimistic swap + sequential sort_order
  const swapped = [...list];
  const temp = swapped[index];
  swapped[index] = swapped[targetIdx];
  swapped[targetIdx] = temp;
  swapped.forEach((item, i) => {
    item.sort_order = i;
  });

  state[entryType] = swapped;
  renderCvList(entryType);

  const client = getSupabaseClient();
  beginFlight('Saving order…');

  const updates = swapped.map((r) =>
    client
      .from('profile_cv_entries')
      .update({ sort_order: r.sort_order })
      .eq('id', r.id)
      .eq('cid', state.ownerCid)
  );
  const results = await Promise.all(updates);
  const failed = results.find((res) => res.error);

  if (failed) {
    console.error('Failed to reorder CV entries:', failed.error);
    state[entryType] = prevSnapshot;
    renderCvList(entryType);
    endFlight(false, 'Saved', 'Could not save');
    return;
  }

  endFlight(true, 'Saved', 'Could not save');
}

async function deleteCvEntry(entryType, rowId) {
  closeConfirmDeleteModal();
  const prevSnapshot = state[entryType].map((r) => ({ ...r }));

  // Optimistic delete + re-number sort_order
  state[entryType] = state[entryType]
    .filter((r) => r.id !== rowId)
    .map((r, i) => ({ ...r, sort_order: i }));
  renderCvList(entryType);

  const client = getSupabaseClient();
  beginFlight('Deleting…');

  const { error } = await client
    .from('profile_cv_entries')
    .delete()
    .eq('id', rowId)
    .eq('cid', state.ownerCid);

  if (error) {
    console.error('Failed to delete CV entry:', error);
    state[entryType] = prevSnapshot;
    renderCvList(entryType);
    endFlight(false, 'Saved', 'Could not save');
    return;
  }

  // Keep sort_order sequential
  await Promise.all(
    state[entryType].map((r) =>
      client
        .from('profile_cv_entries')
        .update({ sort_order: r.sort_order })
        .eq('id', r.id)
        .eq('cid', state.ownerCid)
    )
  );

  endFlight(true, 'Saved', 'Could not save');
}

function openCvModal(entryType, existingRow = null) {
  const isEdu = entryType === 'education';
  const isEdit = Boolean(existingRow);
  const nextOrder = isEdit ? Number(existingRow.sort_order ?? 0) : state[entryType].length;

  openEditorModal(
    isEdit
      ? `Edit ${isEdu ? 'Education' : 'Experience'} Entry`
      : `Add ${isEdu ? 'Education' : 'Experience'} Entry`,
    (bodyEl, closeFn) => {
      const form = document.createElement('form');
      form.className = 'pe-form';
      form.noValidate = true;

      const rowTop = document.createElement('div');
      rowTop.className = 'pe-grid-2';

      const periodInput = document.createElement('input');
      periodInput.type = 'text';
      periodInput.className = 'input-field';
      periodInput.placeholder = 'e.g. 2024 — 2026';
      periodInput.value = isEdit ? cleanText(existingRow.period) : '';
      const fPeriod = createModalField({
        label: 'Period',
        id: 'm-cv-period',
        required: true,
        maxLen: 50,
        inputEl: periodInput
      });

      const orderInput = document.createElement('input');
      orderInput.type = 'number';
      orderInput.className = 'input-field pe-num-input';
      orderInput.min = '0';
      orderInput.step = '1';
      orderInput.value = String(nextOrder);
      const fOrder = createModalField({
        label: 'Sort Order',
        id: 'm-cv-order',
        required: true,
        hint: '0 appears first (newest at top).',
        inputEl: orderInput
      });

      rowTop.appendChild(fPeriod.group);
      rowTop.appendChild(fOrder.group);

      const coreInput = document.createElement('input');
      coreInput.type = 'text';
      coreInput.className = 'input-field';
      coreInput.placeholder = isEdu
        ? 'e.g. Higher Secondary Certificate (HSC) in Science'
        : 'e.g. Lead Student Investigator';
      coreInput.value = isEdit ? cleanText(existingRow.core_title) : '';
      const fCore = createModalField({
        label: isEdu ? 'Degree / Qualification (core_title)' : 'Role / Position (core_title)',
        id: 'm-cv-core',
        required: true,
        maxLen: 160,
        inputEl: coreInput
      });

      const orgInput = document.createElement('input');
      orgInput.type = 'text';
      orgInput.className = 'input-field';
      orgInput.placeholder = 'e.g. BKTTC Chittagong';
      orgInput.value = isEdit ? cleanText(existingRow.organization_name) : '';
      const fOrg = createModalField({
        label: 'Institution / Organization (organization_name)',
        id: 'm-cv-org',
        required: true,
        maxLen: 180,
        inputEl: orgInput
      });

      const detailInput = document.createElement('textarea');
      detailInput.className = 'input-field pe-textarea';
      detailInput.rows = 3;
      detailInput.placeholder = 'Optional coursework, tools, experimental methods, or distinctions...';
      detailInput.value = isEdit ? cleanText(existingRow.detail) : '';
      const fDetail = createModalField({
        label: 'Detail / Description',
        id: 'm-cv-detail',
        required: false,
        maxLen: 600,
        inputEl: detailInput
      });

      const feedback = document.createElement('div');
      feedback.className = 'form-feedback error';
      feedback.hidden = true;

      const actions = document.createElement('div');
      actions.className = 'pe-modal-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', closeFn);

      const saveBtn = document.createElement('button');
      saveBtn.type = 'submit';
      saveBtn.className = 'btn btn-orange';
      saveBtn.textContent = isEdit ? 'Save Entry' : 'Add Entry';

      actions.appendChild(cancelBtn);
      actions.appendChild(saveBtn);

      form.appendChild(rowTop);
      form.appendChild(fCore.group);
      form.appendChild(fOrg.group);
      form.appendChild(fDetail.group);
      form.appendChild(feedback);
      form.appendChild(actions);

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        feedback.hidden = true;

        const period = clampStr(periodInput.value, 50);
        const coreTitle = clampStr(coreInput.value, 160);
        const orgName = clampStr(orgInput.value, 180);
        const detail = clampStr(detailInput.value, 600) || null;
        const sortOrder = Math.max(0, parseInt(orderInput.value, 10) || 0);

        let invalid = false;
        fPeriod.setError(period ? '' : 'Period is required.');
        if (!period) invalid = true;
        fCore.setError(coreTitle ? '' : 'Title is required.');
        if (!coreTitle) invalid = true;
        fOrg.setError(orgName ? '' : 'Organization is required.');
        if (!orgName) invalid = true;
        if (invalid) return;

        const client = getSupabaseClient();
        const prevSnapshot = state[entryType].map((r) => ({ ...r }));
        saveBtn.disabled = true;
        beginFlight('Saving…');

        if (isEdit) {
          const patch = {
            period,
            core_title: coreTitle,
            organization_name: orgName,
            detail,
            sort_order: sortOrder
          };
          state[entryType] = state[entryType]
            .map((r) => (r.id === existingRow.id ? { ...r, ...patch } : r))
            .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
          renderCvList(entryType);

          const { error } = await client
            .from('profile_cv_entries')
            .update(patch)
            .eq('id', existingRow.id)
            .eq('cid', state.ownerCid);

          if (error) {
            state[entryType] = prevSnapshot;
            renderCvList(entryType);
            saveBtn.disabled = false;
            feedback.hidden = false;
            feedback.textContent = formatSupabaseError(error, 'Could not update entry');
            endFlight(false, 'Saved', 'Could not save');
            return;
          }
          endFlight(true, 'Saved', 'Could not save');
          closeFn();
        } else {
          const tempId = `temp-${Date.now()}`;
          const payload = {
            cid: state.ownerCid,
            entry_type: entryType,
            sort_order: sortOrder,
            period,
            core_title: coreTitle,
            organization_name: orgName,
            detail
          };
          state[entryType] = [...state[entryType], { id: tempId, ...payload }].sort(
            (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
          );
          renderCvList(entryType);

          const { data, error } = await client
            .from('profile_cv_entries')
            .insert(payload)
            .select('*')
            .single();

          if (error || !data) {
            state[entryType] = prevSnapshot;
            renderCvList(entryType);
            saveBtn.disabled = false;
            feedback.hidden = false;
            feedback.textContent = formatSupabaseError(error, 'Could not add entry');
            endFlight(false, 'Saved', 'Could not save');
            return;
          }

          state[entryType] = state[entryType]
            .map((r) => (r.id === tempId ? data : r))
            .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
          renderCvList(entryType);
          endFlight(true, 'Saved', 'Could not save');
          closeFn();
        }
      });

      bodyEl.appendChild(form);
    }
  );
}

/* ==========================================================================
   13. Section 6 — Skills & Co-Curriculars (public.profile_custom_cards)
   ========================================================================== */
function renderCustomCardsList(deckType) {
  const isSkills = deckType === 'skills';
  const listEl = document.getElementById(isSkills ? 'list-skills' : 'list-cocurriculars');
  if (!listEl) return;
  listEl.textContent = '';

  const rows = state[deckType] || [];
  if (rows.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'pe-empty-state';
    empty.textContent = isSkills
      ? 'No skills, badges, or certifications listed yet. Click "+ Add Skill / Badge" to create your first card.'
      : 'No co-curricular cards listed yet. Click "+ Add Co-Curricular" to create your first card.';
    listEl.appendChild(empty);
    return;
  }

  rows.forEach((row, idx) => {
    const item = document.createElement('article');
    item.className = 'pe-record-item';

    const main = document.createElement('div');
    main.className = 'pe-record-main';

    const eyebrow = document.createElement('div');
    eyebrow.className = 'pe-record-eyebrow';

    const orderSpan = document.createElement('span');
    orderSpan.className = 'pe-record-code';
    orderSpan.textContent = `#${String(row.sort_order ?? idx).padStart(2, '0')}`;
    eyebrow.appendChild(orderSpan);

    if (cleanText(row.spine_label)) {
      const spineSpan = document.createElement('span');
      spineSpan.textContent = `[${cleanText(row.spine_label)}]`;
      eyebrow.appendChild(spineSpan);
    }

    const catSpan = document.createElement('span');
    catSpan.textContent = [cleanText(row.category), cleanText(row.meta_badge)].filter(Boolean).join(' · ');
    eyebrow.appendChild(catSpan);

    const title = document.createElement('div');
    title.className = 'pe-record-title';
    title.textContent = cleanText(row.title) || 'Untitled Card';

    main.appendChild(eyebrow);
    main.appendChild(title);

    if (cleanText(row.subtitle)) {
      const sub = document.createElement('div');
      sub.className = 'pe-record-sub';
      sub.textContent = cleanText(row.subtitle);
      main.appendChild(sub);
    }

    if (cleanText(row.description)) {
      const desc = document.createElement('p');
      desc.className = 'pe-record-desc';
      desc.textContent = cleanText(row.description);
      main.appendChild(desc);
    }

    if (cleanText(row.footer_meta) || cleanText(row.link_url)) {
      const stats = document.createElement('div');
      stats.className = 'pe-record-stats';
      if (cleanText(row.footer_meta)) {
        const fm = document.createElement('span');
        fm.textContent = cleanText(row.footer_meta);
        stats.appendChild(fm);
      }
      if (cleanText(row.link_url)) {
        const lnk = document.createElement('span');
        lnk.textContent = `${cleanText(row.link_label) || 'Link'} → ${cleanText(row.link_url)}`;
        stats.appendChild(lnk);
      }
      main.appendChild(stats);
    }

    const actions = document.createElement('div');
    actions.className = 'pe-record-actions';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'pe-act-btn';
    upBtn.textContent = '↑ Up';
    upBtn.disabled = idx === 0;
    upBtn.setAttribute('aria-label', `Move ${row.title} up`);
    upBtn.addEventListener('click', () => moveCustomCard(deckType, idx, -1));

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'pe-act-btn';
    downBtn.textContent = '↓ Down';
    downBtn.disabled = idx === rows.length - 1;
    downBtn.setAttribute('aria-label', `Move ${row.title} down`);
    downBtn.addEventListener('click', () => moveCustomCard(deckType, idx, 1));

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'pe-act-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openCustomCardModal(deckType, row));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'pe-act-btn pe-act-btn-danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      openConfirmDeleteModal(
        isSkills ? 'Delete Skill / Badge Card' : 'Delete Co-Curricular Card',
        `Permanently remove "${cleanText(row.title)}"?`,
        () => deleteCustomCardRow(deckType, row.id)
      );
    });

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    item.appendChild(main);
    item.appendChild(actions);
    listEl.appendChild(item);
  });
}

async function moveCustomCard(deckType, index, delta) {
  const list = state[deckType];
  const targetIdx = index + delta;
  if (!list || targetIdx < 0 || targetIdx >= list.length) return;

  const prevSnapshot = list.map((r) => ({ ...r }));
  const swapped = [...list];
  const tmp = swapped[index];
  swapped[index] = swapped[targetIdx];
  swapped[targetIdx] = tmp;
  swapped.forEach((item, i) => {
    item.sort_order = i;
  });

  state[deckType] = swapped;
  renderCustomCardsList(deckType);

  const client = getSupabaseClient();
  beginFlight('Saving order…');

  const results = await Promise.all(
    swapped.map((r) =>
      client
        .from('profile_custom_cards')
        .update({ sort_order: r.sort_order })
        .eq('id', r.id)
        .eq('cid', state.ownerCid)
    )
  );
  const failed = results.find((res) => res.error);
  if (failed) {
    state[deckType] = prevSnapshot;
    renderCustomCardsList(deckType);
    endFlight(false, 'Saved', 'Could not save');
    return;
  }
  endFlight(true, 'Saved', 'Could not save');
}

async function deleteCustomCardRow(deckType, rowId) {
  closeConfirmDeleteModal();
  const prevSnapshot = state[deckType].map((r) => ({ ...r }));

  state[deckType] = state[deckType]
    .filter((r) => r.id !== rowId)
    .map((r, i) => ({ ...r, sort_order: i }));
  renderCustomCardsList(deckType);

  const client = getSupabaseClient();
  beginFlight('Deleting…');

  const { error } = await client
    .from('profile_custom_cards')
    .delete()
    .eq('id', rowId)
    .eq('cid', state.ownerCid);

  if (error) {
    state[deckType] = prevSnapshot;
    renderCustomCardsList(deckType);
    endFlight(false, 'Saved', 'Could not save');
    return;
  }

  await Promise.all(
    state[deckType].map((r) =>
      client
        .from('profile_custom_cards')
        .update({ sort_order: r.sort_order })
        .eq('id', r.id)
        .eq('cid', state.ownerCid)
    )
  );

  await syncProfileIdArray(deckType === 'skills' ? 'certificates' : 'others', rowId, 'remove');

  endFlight(true, 'Saved', 'Could not save');
}

function openCustomCardModal(deckType, existingRow = null) {
  const isSkills = deckType === 'skills';
  const isEdit = Boolean(existingRow);
  const nextOrder = isEdit ? Number(existingRow.sort_order ?? 0) : state[deckType].length;

  openEditorModal(
    isEdit
      ? `Edit ${isSkills ? 'Skill / Certification' : 'Co-Curricular'} Card`
      : `Add ${isSkills ? 'Skill / Certification' : 'Co-Curricular'} Card`,
    (bodyEl, closeFn) => {
      const form = document.createElement('form');
      form.className = 'pe-form';
      form.noValidate = true;

      const g1 = document.createElement('div');
      g1.className = 'pe-grid-3';

      const spineInput = document.createElement('input');
      spineInput.type = 'text';
      spineInput.className = 'input-field';
      spineInput.placeholder = isSkills ? 'e.g. CAD / CAM' : 'e.g. Science Club';
      spineInput.value = isEdit ? cleanText(existingRow.spine_label) : '';
      const fSpine = createModalField({
        label: 'Spine Label',
        id: 'm-cc-spine',
        maxLen: 28,
        inputEl: spineInput
      });

      const catInput = document.createElement('input');
      catInput.type = 'text';
      catInput.className = 'input-field';
      catInput.placeholder = isSkills ? 'Technical Competency' : 'Collegiate Leadership';
      catInput.value = isEdit ? cleanText(existingRow.category) : '';
      const fCat = createModalField({
        label: 'Category',
        id: 'm-cc-cat',
        required: true,
        maxLen: 60,
        inputEl: catInput
      });

      const orderInput = document.createElement('input');
      orderInput.type = 'number';
      orderInput.className = 'input-field pe-num-input';
      orderInput.min = '0';
      orderInput.step = '1';
      orderInput.value = String(nextOrder);
      const fOrder = createModalField({
        label: 'Sort Order',
        id: 'm-cc-order',
        required: true,
        inputEl: orderInput
      });

      g1.appendChild(fSpine.group);
      g1.appendChild(fCat.group);
      g1.appendChild(fOrder.group);

      const g2 = document.createElement('div');
      g2.className = 'pe-grid-2';

      const metaInput = document.createElement('input');
      metaInput.type = 'text';
      metaInput.className = 'input-field';
      metaInput.placeholder = 'e.g. SolidWorks · Onshape · 2026';
      metaInput.value = isEdit ? cleanText(existingRow.meta_badge) : '';
      const fMeta = createModalField({
        label: 'Meta Badge',
        id: 'm-cc-meta',
        maxLen: 60,
        inputEl: metaInput
      });

      const footerInput = document.createElement('input');
      footerInput.type = 'text';
      footerInput.className = 'input-field';
      footerInput.placeholder = 'e.g. Issued Oct 2026 · Verified';
      footerInput.value = isEdit ? cleanText(existingRow.footer_meta) : '';
      const fFooter = createModalField({
        label: 'Footer Meta',
        id: 'm-cc-footer',
        maxLen: 100,
        inputEl: footerInput
      });

      g2.appendChild(fMeta.group);
      g2.appendChild(fFooter.group);

      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.className = 'input-field';
      titleInput.placeholder = 'Card headline';
      titleInput.value = isEdit ? cleanText(existingRow.title) : '';
      const fTitle = createModalField({
        label: 'Title',
        id: 'm-cc-title',
        required: true,
        maxLen: 140,
        inputEl: titleInput
      });

      const subInput = document.createElement('input');
      subInput.type = 'text';
      subInput.className = 'input-field';
      subInput.placeholder = 'Issuing institution, cohort, or subtitle';
      subInput.value = isEdit ? cleanText(existingRow.subtitle) : '';
      const fSub = createModalField({
        label: 'Subtitle',
        id: 'm-cc-sub',
        maxLen: 180,
        inputEl: subInput
      });

      const descInput = document.createElement('textarea');
      descInput.className = 'input-field pe-textarea';
      descInput.rows = 3;
      descInput.placeholder = 'Describe competencies, methodology, or impact...';
      descInput.value = isEdit ? cleanText(existingRow.description) : '';
      const fDesc = createModalField({
        label: 'Description',
        id: 'm-cc-desc',
        maxLen: 700,
        inputEl: descInput
      });

      const g3 = document.createElement('div');
      g3.className = 'pe-grid-2';

      const linkLblInput = document.createElement('input');
      linkLblInput.type = 'text';
      linkLblInput.className = 'input-field';
      linkLblInput.placeholder = 'e.g. Verify Credential ↗';
      linkLblInput.value = isEdit ? cleanText(existingRow.link_label) : '';
      const fLinkLbl = createModalField({
        label: 'Link Button Label',
        id: 'm-cc-linklbl',
        maxLen: 40,
        inputEl: linkLblInput
      });

      const linkUrlInput = document.createElement('input');
      linkUrlInput.type = 'url';
      linkUrlInput.className = 'input-field';
      linkUrlInput.placeholder = 'https://...';
      linkUrlInput.value = isEdit ? cleanText(existingRow.link_url) : '';
      const fLinkUrl = createModalField({
        label: 'Link URL (http/https only)',
        id: 'm-cc-linkurl',
        maxLen: 500,
        inputEl: linkUrlInput
      });

      g3.appendChild(fLinkLbl.group);
      g3.appendChild(fLinkUrl.group);

      const feedback = document.createElement('div');
      feedback.className = 'form-feedback error';
      feedback.hidden = true;

      const actions = document.createElement('div');
      actions.className = 'pe-modal-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', closeFn);

      const saveBtn = document.createElement('button');
      saveBtn.type = 'submit';
      saveBtn.className = 'btn btn-orange';
      saveBtn.textContent = isEdit ? 'Save Card' : 'Add Card';

      actions.appendChild(cancelBtn);
      actions.appendChild(saveBtn);

      form.appendChild(g1);
      form.appendChild(titleInput ? fTitle.group : document.createDocumentFragment());
      form.appendChild(fSub.group);
      form.appendChild(g2);
      form.appendChild(fDesc.group);
      form.appendChild(g3);
      form.appendChild(feedback);
      form.appendChild(actions);

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        feedback.hidden = true;

        const category = clampStr(catInput.value, 60);
        const title = clampStr(titleInput.value, 140);
        const spineLabel = clampStr(spineInput.value, 28) || null;
        const metaBadge = clampStr(metaInput.value, 60) || null;
        const subtitle = clampStr(subInput.value, 180) || null;
        const description = clampStr(descInput.value, 700) || null;
        const footerMeta = clampStr(footerInput.value, 100) || null;
        const linkUrl = clampStr(linkUrlInput.value, 500) || null;
        const linkLabel = linkUrl ? (clampStr(linkLblInput.value, 40) || 'Open Link ↗') : null;
        const sortOrder = Math.max(0, parseInt(orderInput.value, 10) || 0);

        let invalid = false;
        fCat.setError(category ? '' : 'Category is required.');
        if (!category) invalid = true;
        fTitle.setError(title ? '' : 'Title is required.');
        if (!title) invalid = true;

        if (linkUrl && !isHttpUrl(linkUrl)) {
          fLinkUrl.setError('Link URL must begin with https:// or http://');
          invalid = true;
        } else {
          fLinkUrl.setError('');
        }
        if (invalid) return;

        const client = getSupabaseClient();
        const prevSnapshot = state[deckType].map((r) => ({ ...r }));
        saveBtn.disabled = true;
        beginFlight('Saving…');

        const fields = {
          spine_label: spineLabel,
          category,
          meta_badge: metaBadge,
          title,
          subtitle,
          description,
          footer_meta: footerMeta,
          link_label: linkLabel,
          link_url: linkUrl,
          sort_order: sortOrder
        };

        if (isEdit) {
          state[deckType] = state[deckType]
            .map((r) => (r.id === existingRow.id ? { ...r, ...fields } : r))
            .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
          renderCustomCardsList(deckType);

          const { error } = await client
            .from('profile_custom_cards')
            .update(fields)
            .eq('id', existingRow.id)
            .eq('cid', state.ownerCid);

          if (error) {
            state[deckType] = prevSnapshot;
            renderCustomCardsList(deckType);
            saveBtn.disabled = false;
            feedback.hidden = false;
            feedback.textContent = formatSupabaseError(error, 'Could not update card');
            endFlight(false, 'Saved', 'Could not save');
            return;
          }
          endFlight(true, 'Saved', 'Could not save');
          closeFn();
        } else {
          const tempId = `temp-${Date.now()}`;
          const payload = {
            cid: state.ownerCid,
            deck_type: deckType,
            ...fields
          };
          state[deckType] = [...state[deckType], { id: tempId, ...payload }].sort(
            (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
          );
          renderCustomCardsList(deckType);

          const { data, error } = await client
            .from('profile_custom_cards')
            .insert(payload)
            .select('*')
            .single();

          if (error || !data) {
            state[deckType] = prevSnapshot;
            renderCustomCardsList(deckType);
            saveBtn.disabled = false;
            feedback.hidden = false;
            feedback.textContent = formatSupabaseError(error, 'Could not add card');
            endFlight(false, 'Saved', 'Could not save');
            return;
          }

          state[deckType] = state[deckType]
            .map((r) => (r.id === tempId ? data : r))
            .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
          renderCustomCardsList(deckType);
          await syncProfileIdArray(deckType === 'skills' ? 'certificates' : 'others', data.id, 'add');
          endFlight(true, 'Saved', 'Could not save');
          closeFn();
        }
      });

      bodyEl.appendChild(form);
    }
  );
}

/* ==========================================================================
   14. Section 7 — Researches (public.researches where uid @> [ownerCid])
   ========================================================================== */
function renderResearchesList() {
  const listEl = document.getElementById('list-researches');
  if (!listEl) return;
  listEl.textContent = '';

  updateDerivedResearchCount();
  updateTeacherLiveScholarshipDom();

  const rows = state.researches || [];
  if (rows.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'pe-empty-state';
    empty.textContent = 'No research papers indexed under your account yet. Click "+ Add Research" to publish one.';
    listEl.appendChild(empty);
    return;
  }

  rows.forEach((row) => {
    const item = document.createElement('article');
    item.className = 'pe-record-item';

    const main = document.createElement('div');
    main.className = 'pe-record-main';

    const eyebrow = document.createElement('div');
    eyebrow.className = 'pe-record-eyebrow';

    const idSpan = document.createElement('span');
    idSpan.className = 'pe-record-code';
    idSpan.textContent = cleanText(row.ilrid) || 'PENDING';
    eyebrow.appendChild(idSpan);

    const catSpan = document.createElement('span');
    catSpan.textContent = [cleanText(row.category), cleanText(row.publish_date)].filter(Boolean).join(' · ');
    eyebrow.appendChild(catSpan);

    if (row.is_sample === true) {
      const sampleSpan = document.createElement('span');
      sampleSpan.textContent = 'SAMPLE';
      eyebrow.appendChild(sampleSpan);
    }

    const title = document.createElement('div');
    title.className = 'pe-record-title';
    title.textContent = cleanText(row.title) || 'Untitled Research';

    const desc = document.createElement('p');
    desc.className = 'pe-record-desc';
    desc.textContent = cleanText(row.abstract || row.details);

    const stats = document.createElement('div');
    stats.className = 'pe-record-stats';
    const kw = parseStringArray(row.keywords);
    const revCount = Array.isArray(row.reviewers) ? row.reviewers.length : 0;

    const s1 = document.createElement('span');
    s1.textContent = `Likes: ${Number(row.likes ?? 0)} · Comments: ${Number(row.comments ?? 0)} · Reviewers: ${revCount}`;
    stats.appendChild(s1);

    if (kw.length > 0) {
      const s2 = document.createElement('span');
      s2.textContent = `Keywords: ${kw.join(', ')}`;
      stats.appendChild(s2);
    }

    main.appendChild(eyebrow);
    main.appendChild(title);
    main.appendChild(desc);
    main.appendChild(stats);

    const actions = document.createElement('div');
    actions.className = 'pe-record-actions';

    const cleanIlrid = cleanText(row.ilrid);
    if (cleanIlrid && cleanIlrid !== 'SAVING…') {
      const viewLink = document.createElement('a');
      viewLink.className = 'pe-act-btn';
      viewLink.href = `/researches/${encodeURIComponent(cleanIlrid)}`;
      viewLink.textContent = 'View Page ↗';
      actions.appendChild(viewLink);
    }

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'pe-act-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openResearchModal(row));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'pe-act-btn pe-act-btn-danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      openConfirmDeleteModal(
        'Delete Research Paper',
        `Permanently delete [${cleanText(row.ilrid)}] "${cleanText(row.title)}"?`,
        () => deleteResearchRow(row.ilrid)
      );
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    item.appendChild(main);
    item.appendChild(actions);
    listEl.appendChild(item);
  });
}

async function deleteResearchRow(ilrid) {
  closeConfirmDeleteModal();
  const prevSnapshot = state.researches.map((r) => ({ ...r }));

  state.researches = state.researches.filter((r) => r.ilrid !== ilrid);
  renderResearchesList();

  const client = getSupabaseClient();
  beginFlight('Deleting…');

  // Rule 31: Call DELETE on Worker for PDF and cover links first while DB row still exists
  if (UPLOAD_WORKER_URL && ilrid) {
    try {
      await deleteBlobFromWorker({ kind: 'research-pdf', id: ilrid });
      await deleteBlobFromWorker({ kind: 'research-cover', id: ilrid });
    } catch (_) {}
  }

  const { error } = await client
    .from('researches')
    .delete()
    .eq('ilrid', ilrid)
    .contains('uid', [state.ownerCid]);

  if (error) {
    state.researches = prevSnapshot;
    renderResearchesList();
    endFlight(false, 'Saved', 'Could not save');
    return;
  }

  await syncProfileIdArray('researches', ilrid, 'remove');
  endFlight(true, 'Saved', 'Could not save');
}

function openResearchModal(existingRow = null) {
  const isEdit = Boolean(existingRow);

  openEditorModal(
    isEdit ? `Edit Research · ${cleanText(existingRow.ilrid)}` : 'Add New Research Paper',
    (bodyEl, closeFn) => {
      let pendingPdfFile = null;
      let pendingCoverBlob = null;

      if (isEdit) {
        const roStrip = document.createElement('div');
        roStrip.className = 'pe-readonly-strip';
        const revLen = Array.isArray(existingRow.reviewers) ? existingRow.reviewers.length : 0;
        const roCells = [
          ['ILRID', cleanText(existingRow.ilrid)],
          ['Engagement', `${Number(existingRow.likes ?? 0)} likes · ${Number(existingRow.comments ?? 0)} comments`],
          ['Reviewers', `${revLen} verified`],
          ['Sample Flag', String(Boolean(existingRow.is_sample))]
        ];
        roCells.forEach(([lbl, val]) => {
          const c = document.createElement('div');
          c.className = 'pe-readonly-cell';
          const l = document.createElement('span');
          l.className = 'pe-readonly-label';
          l.textContent = lbl;
          const v = document.createElement('code');
          v.className = 'pe-readonly-val';
          v.textContent = val;
          c.appendChild(l);
          c.appendChild(v);
          roStrip.appendChild(c);
        });
        bodyEl.appendChild(roStrip);
      }

      const form = document.createElement('form');
      form.className = 'pe-form';
      form.noValidate = true;

      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.className = 'input-field';
      titleInput.placeholder = 'Full paper or monograph title';
      titleInput.value = isEdit ? cleanText(existingRow.title) : '';
      const fTitle = createModalField({
        label: 'Title',
        id: 'm-res-title',
        required: true,
        maxLen: 200,
        inputEl: titleInput
      });

      const g1 = document.createElement('div');
      g1.className = 'pe-grid-2';

      const catInput = document.createElement('input');
      catInput.type = 'text';
      catInput.className = 'input-field';
      catInput.placeholder = 'e.g. Mechanical Engineering';
      catInput.value = isEdit ? cleanText(existingRow.category) : '';
      const fCat = createModalField({
        label: 'Category',
        id: 'm-res-cat',
        maxLen: 80,
        inputEl: catInput
      });

      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.className = 'input-field pe-num-input';
      dateInput.value = isEdit
        ? cleanText(existingRow.publish_date).slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const fDate = createModalField({
        label: 'Publish Date',
        id: 'm-res-date',
        inputEl: dateInput
      });

      g1.appendChild(fCat.group);
      g1.appendChild(fDate.group);

      const kwGroup = document.createElement('div');
      kwGroup.className = 'input-group';
      const kwLabel = document.createElement('label');
      kwLabel.className = 'input-label';
      kwLabel.setAttribute('for', 'm-res-kw-input');
      kwLabel.textContent = 'Keywords (text[])';
      const kwBox = document.createElement('div');
      kwBox.className = 'pe-chip-box';
      const kwEditor = createChipEditor(kwBox, isEdit ? existingRow.keywords : [], {
        inputId: 'm-res-kw-input',
        maxItems: 16,
        maxChipLen: 50,
        placeholder: 'Type keyword & press Enter…',
        onChange: () => {
          state.modalDirty = true;
        }
      });
      kwGroup.appendChild(kwLabel);
      kwGroup.appendChild(kwBox);

      const absInput = document.createElement('textarea');
      absInput.className = 'input-field pe-textarea';
      absInput.rows = 4;
      absInput.placeholder = 'Summarize methodology, measurements, and findings...';
      absInput.value = isEdit ? cleanText(existingRow.abstract) : '';
      const fAbs = createModalField({
        label: 'Abstract',
        id: 'm-res-abs',
        maxLen: 2000,
        inputEl: absInput
      });

      // Paper URL + Optional PDF Upload (<= 25 MB)
      const paperUrlInput = document.createElement('input');
      paperUrlInput.type = 'url';
      paperUrlInput.className = 'input-field';
      paperUrlInput.placeholder = 'https://... (PDF link, Zenodo, DOI, Drive)';
      paperUrlInput.value = isEdit ? cleanText(existingRow.paper_url) : '';
      const fPaper = createModalField({
        label: 'External Paper URL (paper_url)',
        id: 'm-res-paperurl',
        maxLen: 500,
        hint: 'Provide a full http/https link, or upload a PDF (max 25 MB) below.',
        inputEl: paperUrlInput
      });

      const pdfUploadWrap = document.createElement('div');
      pdfUploadWrap.className = 'pe-modal-upload-inline';
      const pdfLbl = document.createElement('label');
      pdfLbl.className = 'input-label';
      pdfLbl.textContent = UPLOAD_WORKER_URL
        ? 'Or Upload Manuscript PDF (max 25 MB)'
        : 'Or Validate Manuscript PDF (max 25 MB · MOCK mode while UPLOAD_WORKER_URL is empty)';
      const pdfInput = document.createElement('input');
      pdfInput.type = 'file';
      pdfInput.accept = 'application/pdf,.pdf';
      pdfInput.className = 'pe-file-input';
      const pdfStatus = document.createElement('div');
      pdfStatus.className = 'pe-field-hint';
      pdfInput.addEventListener('change', async () => {
        const file = pdfInput.files?.[0];
        if (!file) return;
        try {
          validatePdfFile(file);
          if (isEdit) {
            pdfStatus.textContent = 'Uploading PDF…';
            saveBtn.disabled = true;
            const up = await uploadBlobToWorker({
              blob: file,
              filename: file.name || 'manuscript.pdf',
              kind: 'research-pdf',
              id: cleanText(existingRow.ilrid)
            });
            saveBtn.disabled = false;
            if (up.url) {
              paperUrlInput.value = up.url;
              pdfStatus.textContent = `Uploaded PDF → ${up.url}`;
            } else if (up.mock) {
              pdfStatus.textContent = `MOCK mode: validated "${file.name}" (${formatBytes(file.size)}).`;
            }
          } else {
            pendingPdfFile = file;
            pdfStatus.textContent = `Selected "${file.name}" (${formatBytes(file.size)}). Will upload automatically once record is published.`;
          }
          fPaper.setError('');
        } catch (err) {
          saveBtn.disabled = false;
          fPaper.setError(err.message || 'Invalid PDF.');
        }
      });
      pdfUploadWrap.appendChild(pdfLbl);
      pdfUploadWrap.appendChild(pdfInput);
      pdfUploadWrap.appendChild(pdfStatus);
      fPaper.group.appendChild(pdfUploadWrap);

      // Cover URL + Optional WebP Upload (<= 2 MB)
      const coverUrlInput = document.createElement('input');
      coverUrlInput.type = 'text';
      coverUrlInput.className = 'input-field';
      coverUrlInput.placeholder = 'https://... or cover filename in /researches/img/';
      coverUrlInput.value = isEdit ? cleanText(existingRow.cover_url) : '';
      const fCover = createModalField({
        label: 'Cover Image (cover_url)',
        id: 'm-res-coverurl',
        maxLen: 500,
        inputEl: coverUrlInput
      });

      const coverUploadWrap = document.createElement('div');
      coverUploadWrap.className = 'pe-modal-upload-inline';
      const coverFileInput = document.createElement('input');
      coverFileInput.type = 'file';
      coverFileInput.accept = 'image/jpeg,image/png,image/webp,image/gif,image/avif';
      coverFileInput.className = 'pe-file-input';
      const coverPreview = document.createElement('img');
      coverPreview.className = 'pe-modal-thumb-preview';
      coverPreview.alt = 'Cover preview';
      coverPreview.hidden = true;
      const coverStatus = document.createElement('div');
      coverStatus.className = 'pe-field-hint';
      coverStatus.textContent = UPLOAD_WORKER_URL
        ? 'Choose an image to convert to WebP (max 800px, <= 2 MB) and upload.'
        : 'MOCK mode: choose an image to test 800px WebP conversion & preview locally.';

      coverFileInput.addEventListener('change', async () => {
        const file = coverFileInput.files?.[0];
        if (!file) return;
        try {
          const conv = await convertImageFileToWebP(file);
          if (isEdit) {
            coverStatus.textContent = 'Uploading cover image…';
            saveBtn.disabled = true;
            const up = await uploadBlobToWorker({
              blob: conv.blob,
              filename: 'cover.webp',
              kind: 'research-cover',
              id: cleanText(existingRow.ilrid)
            });
            saveBtn.disabled = false;
            coverPreview.src = up.mock ? up.localUrl : `${up.url || resolveImageSrc(coverUrlInput.value, IMAGE_DIRS.researches)}?v=${up.timestamp}`;
            coverPreview.hidden = false;
            if (!up.mock && up.url) {
              coverUrlInput.value = up.url;
              coverStatus.textContent = `Uploaded WebP (${conv.width}×${conv.height}, ${formatBytes(conv.blob.size)}).`;
            } else {
              coverStatus.textContent = `MOCK preview: WebP ${conv.width}×${conv.height} (${formatBytes(conv.blob.size)}).`;
            }
          } else {
            pendingCoverBlob = conv.blob;
            coverPreview.src = URL.createObjectURL(conv.blob);
            coverPreview.hidden = false;
            coverStatus.textContent = `Converted WebP (${conv.width}×${conv.height}, ${formatBytes(conv.blob.size)}). Will upload automatically once record is published.`;
          }
          fCover.setError('');
        } catch (err) {
          saveBtn.disabled = false;
          fCover.setError(err.message || 'Cover conversion failed.');
        }
      });
      coverUploadWrap.appendChild(coverFileInput);
      coverUploadWrap.appendChild(coverPreview);
      coverUploadWrap.appendChild(coverStatus);
      fCover.group.appendChild(coverUploadWrap);

      // Monograph Dossier Sections (Displayed on /researches/<ILR_Id>)
      const dossierHead = document.createElement('div');
      dossierHead.className = 'pe-modal-section-head';
      const dossierTitle = document.createElement('div');
      dossierTitle.className = 'pe-modal-section-title';
      dossierTitle.textContent = 'Research Dossier Sections (/researches/ILR_Id)';
      const dossierSub = document.createElement('div');
      dossierSub.className = 'pe-modal-section-sub';
      dossierSub.textContent =
        'Displayed on the dedicated research page: Core Question Solved, Details, Purpose, Goals, Inspiration, Work Processes, and Effects.';
      dossierHead.appendChild(dossierTitle);
      dossierHead.appendChild(dossierSub);

      const qSolvedInput = document.createElement('textarea');
      qSolvedInput.className = 'input-field pe-textarea';
      qSolvedInput.rows = 2;
      qSolvedInput.placeholder = 'What central scientific or engineering question does this research solve?';
      qSolvedInput.value = isEdit ? cleanText(existingRow.question_solved) : '';
      const fQSolved = createModalField({
        label: 'Question Solved (question_solved)',
        id: 'm-res-qsolved',
        maxLen: 600,
        inputEl: qSolvedInput
      });

      const detailsInput = document.createElement('textarea');
      detailsInput.className = 'input-field pe-textarea';
      detailsInput.rows = 4;
      detailsInput.placeholder = 'Full technical details, experimental setup, derivations, or extended findings...';
      detailsInput.value = isEdit ? cleanText(existingRow.details) : '';
      const fDetails = createModalField({
        label: 'Full Details (details)',
        id: 'm-res-details',
        maxLen: 6000,
        inputEl: detailsInput
      });

      const purposeInput = document.createElement('textarea');
      purposeInput.className = 'input-field pe-textarea';
      purposeInput.rows = 3;
      purposeInput.placeholder = 'Why this investigation was undertaken...';
      purposeInput.value = isEdit ? cleanText(existingRow.purpose) : '';
      const fPurpose = createModalField({
        label: 'Purpose (purpose)',
        id: 'm-res-purpose',
        maxLen: 2000,
        inputEl: purposeInput
      });

      const goalsInput = document.createElement('textarea');
      goalsInput.className = 'input-field pe-textarea';
      goalsInput.rows = 3;
      goalsInput.placeholder = 'Primary measurable objectives and target benchmarks...';
      goalsInput.value = isEdit ? cleanText(existingRow.goals) : '';
      const fGoals = createModalField({
        label: 'Goals (goals)',
        id: 'm-res-goals',
        maxLen: 2000,
        inputEl: goalsInput
      });

      const inspirationInput = document.createElement('textarea');
      inspirationInput.className = 'input-field pe-textarea';
      inspirationInput.rows = 3;
      inspirationInput.placeholder = 'Real-world observation, prior literature, or classroom challenge that sparked this work...';
      inspirationInput.value = isEdit ? cleanText(existingRow.inspiration) : '';
      const fInspiration = createModalField({
        label: 'Inspiration (inspiration)',
        id: 'm-res-inspiration',
        maxLen: 2000,
        inputEl: inspirationInput
      });

      const workProcInput = document.createElement('textarea');
      workProcInput.className = 'input-field pe-textarea';
      workProcInput.rows = 3;
      workProcInput.placeholder = 'Step-by-step methodology, instrumentation, data collection, and validation workflow...';
      workProcInput.value = isEdit ? cleanText(existingRow.work_processes) : '';
      const fWorkProc = createModalField({
        label: 'Work Processes (work_processes)',
        id: 'm-res-workproc',
        maxLen: 3000,
        inputEl: workProcInput
      });

      const effectsInput = document.createElement('textarea');
      effectsInput.className = 'input-field pe-textarea';
      effectsInput.rows = 3;
      effectsInput.placeholder = 'Practical applications, outcomes, and academic or community impact...';
      effectsInput.value = isEdit ? cleanText(existingRow.effects) : '';
      const fEffects = createModalField({
        label: 'Effects & Impact (effects)',
        id: 'm-res-effects',
        maxLen: 2000,
        inputEl: effectsInput
      });

      const feedback = document.createElement('div');
      feedback.className = 'form-feedback error';
      feedback.hidden = true;

      const actions = document.createElement('div');
      actions.className = 'pe-modal-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', closeFn);

      const saveBtn = document.createElement('button');
      saveBtn.type = 'submit';
      saveBtn.className = 'btn btn-orange';
      saveBtn.textContent = isEdit ? 'Save Research' : 'Publish Research';

      actions.appendChild(cancelBtn);
      actions.appendChild(saveBtn);

      form.appendChild(fTitle.group);
      form.appendChild(g1);
      form.appendChild(kwGroup);
      form.appendChild(fAbs.group);
      form.appendChild(dossierHead);
      form.appendChild(fQSolved.group);
      form.appendChild(fDetails.group);
      form.appendChild(fPurpose.group);
      form.appendChild(fGoals.group);
      form.appendChild(fInspiration.group);
      form.appendChild(fWorkProc.group);
      form.appendChild(fEffects.group);
      form.appendChild(fPaper.group);
      form.appendChild(fCover.group);
      form.appendChild(feedback);
      form.appendChild(actions);

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        feedback.hidden = true;

        const title = clampStr(titleInput.value, 200);
        const category = clampStr(catInput.value, 80) || null;
        const abstract = clampStr(absInput.value, 2000) || null;
        const publishDate = cleanText(dateInput.value) || null;
        const rawKeywords = kwEditor.getItems();
        const keywords = Array.isArray(rawKeywords) ? rawKeywords : [];
        const paperUrl = clampStr(paperUrlInput.value, 500) || null;
        const coverUrl = clampStr(coverUrlInput.value, 500) || null;

        const questionSolved = clampStr(qSolvedInput.value, 600) || null;
        const details = clampStr(detailsInput.value, 6000) || null;
        const purpose = clampStr(purposeInput.value, 2000) || null;
        const goals = clampStr(goalsInput.value, 2000) || null;
        const inspiration = clampStr(inspirationInput.value, 2000) || null;
        const workProcesses = clampStr(workProcInput.value, 3000) || null;
        const effects = clampStr(effectsInput.value, 2000) || null;

        let invalid = false;
        fTitle.setError(title ? '' : 'Title is required.');
        if (!title) invalid = true;
        fCat.setError('');
        fAbs.setError('');

        if (paperUrl && !isHttpUrl(paperUrl)) {
          fPaper.setError('Paper URL must begin with https:// or http://');
          invalid = true;
        } else {
          fPaper.setError('');
        }
        if (invalid) return;

        const client = getSupabaseClient();
        const prevSnapshot = state.researches.map((r) => ({ ...r }));
        saveBtn.disabled = true;
        beginFlight('Saving…');

        const coreEditableFields = {
          title,
          abstract,
          category,
          keywords,
          paper_url: paperUrl,
          cover_url: coverUrl,
          publish_date: publishDate
        };

        const extendedEditableFields = {
          ...coreEditableFields,
          question_solved: questionSolved,
          details,
          purpose,
          goals,
          inspiration,
          work_processes: workProcesses,
          effects
        };

        if (isEdit) {
          state.researches = state.researches.map((r) =>
            r.ilrid === existingRow.ilrid ? { ...r, ...extendedEditableFields } : r
          );
          renderResearchesList();

          let { error } = await client
            .from('researches')
            .update(extendedEditableFields)
            .eq('ilrid', existingRow.ilrid)
            .contains('uid', [state.ownerCid]);

          if (error && isMissingColumnError(error)) {
            const retryRes = await client
              .from('researches')
              .update(coreEditableFields)
              .eq('ilrid', existingRow.ilrid)
              .contains('uid', [state.ownerCid]);
            error = retryRes.error;
          }

          if (error) {
            state.researches = prevSnapshot;
            renderResearchesList();
            saveBtn.disabled = false;
            feedback.hidden = false;
            feedback.textContent = formatSupabaseError(error, 'Could not update research');
            endFlight(false, 'Saved', 'Could not save');
            return;
          }
          await syncProfileIdArray('researches', existingRow.ilrid, 'add');
          endFlight(true, 'Saved', 'Could not save');
          closeFn();
        } else {
          const notNullDefaults = {
            uid: [state.ownerCid],
            comments: 0,
            likes: 0,
            reviewers: [],
            is_sample: false
          };
          const insertPayload = {
            ...notNullDefaults,
            ...extendedEditableFields
          };
          const coreInsertPayload = {
            ...notNullDefaults,
            ...coreEditableFields
          };

          const tempRow = {
            ilrid: 'SAVING…',
            ...insertPayload
          };
          state.researches = [tempRow, ...state.researches];
          renderResearchesList();

          const { data, error } = await insertArchiveRowWithFallbacks(
            client,
            'researches',
            'ilrid',
            'ILR',
            insertPayload,
            coreInsertPayload
          );

          if (error || !data) {
            state.researches = prevSnapshot;
            renderResearchesList();
            saveBtn.disabled = false;
            feedback.hidden = false;
            feedback.textContent = formatSupabaseError(error, 'Could not publish research');
            endFlight(false, 'Saved', 'Could not save');
            return;
          }

          // Rule 30: The row now exists in database. Upload files to worker and update URLs.
          let uploadedPaperUrl = null;
          let uploadedCoverUrl = null;

          if (pendingPdfFile && UPLOAD_WORKER_URL) {
            beginFlight('Uploading manuscript PDF…');
            try {
              const upPdf = await uploadBlobToWorker({
                blob: pendingPdfFile,
                filename: pendingPdfFile.name || 'manuscript.pdf',
                kind: 'research-pdf',
                id: data.ilrid
              });
              if (upPdf.url) uploadedPaperUrl = upPdf.url;
            } catch (uErr) {
              console.warn('PDF upload error:', uErr);
            }
          }

          if (pendingCoverBlob && UPLOAD_WORKER_URL) {
            beginFlight('Uploading cover image…');
            try {
              const upCover = await uploadBlobToWorker({
                blob: pendingCoverBlob,
                filename: 'cover.webp',
                kind: 'research-cover',
                id: data.ilrid
              });
              if (upCover.url) uploadedCoverUrl = upCover.url;
            } catch (cErr) {
              console.warn('Cover upload error:', cErr);
            }
          }

          if (uploadedPaperUrl || uploadedCoverUrl) {
            const fileUpdates = {};
            if (uploadedPaperUrl) {
              fileUpdates.paper_url = uploadedPaperUrl;
              data.paper_url = uploadedPaperUrl;
            }
            if (uploadedCoverUrl) {
              fileUpdates.cover_url = uploadedCoverUrl;
              data.cover_url = uploadedCoverUrl;
            }
            await client
              .from('researches')
              .update(fileUpdates)
              .eq('ilrid', data.ilrid)
              .contains('uid', [state.ownerCid]);
          }

          state.researches = state.researches.map((r) => (r === tempRow ? data : r));
          renderResearchesList();
          await syncProfileIdArray('researches', data.ilrid, 'add');
          endFlight(true, 'Saved', 'Could not save');
          closeFn();
        }
      });

      bodyEl.appendChild(form);
    }
  );
}

/* ==========================================================================
   15. Section 8 — Softwares (public.software where uid @> [ownerCid])
   ========================================================================== */
function renderSoftwaresList() {
  const listEl = document.getElementById('list-softwares');
  if (!listEl) return;
  listEl.textContent = '';

  const rows = state.softwares || [];
  if (rows.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'pe-empty-state';
    empty.textContent = 'No software builds published under your account yet. Click "+ Publish Software" to add one.';
    listEl.appendChild(empty);
    return;
  }

  rows.forEach((row) => {
    const item = document.createElement('article');
    item.className = 'pe-record-item';

    const main = document.createElement('div');
    main.className = 'pe-record-main';

    const eyebrow = document.createElement('div');
    eyebrow.className = 'pe-record-eyebrow';

    const idSpan = document.createElement('span');
    idSpan.className = 'pe-record-code';
    idSpan.textContent = cleanText(row.ilsid) || 'PENDING';
    eyebrow.appendChild(idSpan);

    const catSpan = document.createElement('span');
    catSpan.textContent = [
      cleanText(row.category),
      cleanText(row.status),
      cleanText(row.publish_date)
    ]
      .filter(Boolean)
      .join(' · ');
    eyebrow.appendChild(catSpan);

    if (row.is_sample === true) {
      const sampleSpan = document.createElement('span');
      sampleSpan.textContent = 'SAMPLE';
      eyebrow.appendChild(sampleSpan);
    }

    const title = document.createElement('div');
    title.className = 'pe-record-title';
    title.textContent = cleanText(row.name) || 'Untitled Software';

    main.appendChild(eyebrow);
    main.appendChild(title);

    if (cleanText(row.tagline)) {
      const sub = document.createElement('div');
      sub.className = 'pe-record-sub';
      sub.textContent = cleanText(row.tagline);
      main.appendChild(sub);
    }

    if (cleanText(row.description)) {
      const desc = document.createElement('p');
      desc.className = 'pe-record-desc';
      desc.textContent = cleanText(row.description);
      main.appendChild(desc);
    }

    const stats = document.createElement('div');
    stats.className = 'pe-record-stats';
    const tech = parseStringArray(row.tech);
    const revCount = Array.isArray(row.reviewers) ? row.reviewers.length : 0;

    const s1 = document.createElement('span');
    s1.textContent = `Likes: ${Number(row.likes ?? 0)} · Comments: ${Number(row.comments ?? 0)} · Reviewers: ${revCount}`;
    stats.appendChild(s1);

    if (tech.length > 0) {
      const s2 = document.createElement('span');
      s2.textContent = `Tech: ${tech.join(', ')}`;
      stats.appendChild(s2);
    }
    main.appendChild(stats);

    const actions = document.createElement('div');
    actions.className = 'pe-record-actions';

    const cleanIlsid = cleanText(row.ilsid);
    if (cleanIlsid && cleanIlsid !== 'SAVING…') {
      const viewLink = document.createElement('a');
      viewLink.className = 'pe-act-btn';
      viewLink.href = `/softwares/${encodeURIComponent(cleanIlsid)}`;
      viewLink.textContent = 'View Page ↗';
      actions.appendChild(viewLink);
    }

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'pe-act-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openSoftwareModal(row));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'pe-act-btn pe-act-btn-danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      openConfirmDeleteModal(
        'Delete Software Build',
        `Permanently delete [${cleanText(row.ilsid)}] "${cleanText(row.name)}"?`,
        () => deleteSoftwareRow(row.ilsid)
      );
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    item.appendChild(main);
    item.appendChild(actions);
    listEl.appendChild(item);
  });
}

async function deleteSoftwareRow(ilsid) {
  closeConfirmDeleteModal();
  const prevSnapshot = state.softwares.map((r) => ({ ...r }));

  state.softwares = state.softwares.filter((r) => r.ilsid !== ilsid);
  renderSoftwaresList();

  const client = getSupabaseClient();
  beginFlight('Deleting…');

  // Rule 31: Call DELETE on Worker for PDF and cover links first while DB row still exists
  if (UPLOAD_WORKER_URL && ilsid) {
    try {
      await deleteBlobFromWorker({ kind: 'software-pdf', id: ilsid });
      await deleteBlobFromWorker({ kind: 'software-image', id: ilsid });
    } catch (_) {}
  }

  const { error } = await client
    .from('software')
    .delete()
    .eq('ilsid', ilsid)
    .contains('uid', [state.ownerCid]);

  if (error) {
    state.softwares = prevSnapshot;
    renderSoftwaresList();
    endFlight(false, 'Saved', 'Could not save');
    return;
  }

  await syncProfileIdArray('softwares', ilsid, 'remove');
  endFlight(true, 'Saved', 'Could not save');
}

function openSoftwareModal(existingRow = null) {
  const isEdit = Boolean(existingRow);

  openEditorModal(
    isEdit ? `Edit Software · ${cleanText(existingRow.ilsid)}` : 'Publish New Software',
    (bodyEl, closeFn) => {
      let pendingImgBlob = null;

      if (isEdit) {
        const roStrip = document.createElement('div');
        roStrip.className = 'pe-readonly-strip';
        const revLen = Array.isArray(existingRow.reviewers) ? existingRow.reviewers.length : 0;
        const roCells = [
          ['ILSID', cleanText(existingRow.ilsid)],
          ['Engagement', `${Number(existingRow.likes ?? 0)} likes · ${Number(existingRow.comments ?? 0)} comments`],
          ['Reviewers', `${revLen} verified`],
          ['Sample Flag', String(Boolean(existingRow.is_sample))]
        ];
        roCells.forEach(([lbl, val]) => {
          const c = document.createElement('div');
          c.className = 'pe-readonly-cell';
          const l = document.createElement('span');
          l.className = 'pe-readonly-label';
          l.textContent = lbl;
          const v = document.createElement('code');
          v.className = 'pe-readonly-val';
          v.textContent = val;
          c.appendChild(l);
          c.appendChild(v);
          roStrip.appendChild(c);
        });
        bodyEl.appendChild(roStrip);
      }

      const form = document.createElement('form');
      form.className = 'pe-form';
      form.noValidate = true;

      const gTop = document.createElement('div');
      gTop.className = 'pe-grid-2';

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'input-field';
      nameInput.placeholder = 'e.g. Fanuc G-Code Toolpath Simulator';
      nameInput.value = isEdit ? cleanText(existingRow.name) : '';
      const fName = createModalField({
        label: 'Software Name',
        id: 'm-sw-name',
        required: true,
        maxLen: 140,
        inputEl: nameInput
      });

      const taglineInput = document.createElement('input');
      taglineInput.type = 'text';
      taglineInput.className = 'input-field';
      taglineInput.placeholder = 'Short one-line summary';
      taglineInput.value = isEdit ? cleanText(existingRow.tagline) : '';
      const fTagline = createModalField({
        label: 'Tagline',
        id: 'm-sw-tagline',
        maxLen: 180,
        inputEl: taglineInput
      });

      gTop.appendChild(fName.group);
      gTop.appendChild(fTagline.group);

      const gMeta = document.createElement('div');
      gMeta.className = 'pe-grid-3';

      const catInput = document.createElement('input');
      catInput.type = 'text';
      catInput.className = 'input-field';
      catInput.placeholder = 'e.g. Engineering, CAD/CAM';
      catInput.value = isEdit ? cleanText(existingRow.category) : '';
      const fCat = createModalField({
        label: 'Category',
        id: 'm-sw-cat',
        maxLen: 80,
        inputEl: catInput
      });

      const statusSelect = document.createElement('select');
      statusSelect.className = 'input-field';
      const curStatus = isEdit ? cleanText(existingRow.status) : 'Live';
      const statusOptions = ['Live', 'Beta', 'Prototype', 'Planned', 'Archived'];
      if (curStatus && !statusOptions.includes(curStatus)) {
        statusOptions.unshift(curStatus);
      }
      statusOptions.forEach((st) => {
        const opt = document.createElement('option');
        opt.value = st;
        opt.textContent = st;
        if (st === (curStatus || 'Live')) opt.selected = true;
        statusSelect.appendChild(opt);
      });
      const fStatus = createModalField({
        label: 'Status',
        id: 'm-sw-status',
        inputEl: statusSelect
      });

      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.className = 'input-field pe-num-input';
      dateInput.value = isEdit
        ? cleanText(existingRow.publish_date).slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const fDate = createModalField({
        label: 'Publish Date',
        id: 'm-sw-date',
        inputEl: dateInput
      });

      gMeta.appendChild(fCat.group);
      gMeta.appendChild(fStatus.group);
      gMeta.appendChild(fDate.group);

      const techGroup = document.createElement('div');
      techGroup.className = 'input-group';
      const techLbl = document.createElement('label');
      techLbl.className = 'input-label';
      techLbl.setAttribute('for', 'm-sw-tech-input');
      techLbl.textContent = 'Tech Stack (text[])';
      const techBox = document.createElement('div');
      techBox.className = 'pe-chip-box';
      const techEditor = createChipEditor(techBox, isEdit ? existingRow.tech : [], {
        inputId: 'm-sw-tech-input',
        maxItems: 16,
        maxChipLen: 50,
        placeholder: 'e.g. TypeScript, WebAssembly…',
        onChange: () => {
          state.modalDirty = true;
        }
      });
      techGroup.appendChild(techLbl);
      techGroup.appendChild(techBox);

      const descInput = document.createElement('textarea');
      descInput.className = 'input-field pe-textarea';
      descInput.rows = 4;
      descInput.placeholder = 'Describe architecture, features, and engineering purpose...';
      descInput.value = isEdit ? cleanText(existingRow.description) : '';
      const fDesc = createModalField({
        label: 'Description',
        id: 'm-sw-desc',
        maxLen: 2000,
        inputEl: descInput
      });

      const gLinks = document.createElement('div');
      gLinks.className = 'pe-grid-2';

      const urlInput = document.createElement('input');
      urlInput.type = 'url';
      urlInput.className = 'input-field';
      urlInput.placeholder = 'https://...';
      urlInput.value = isEdit ? cleanText(existingRow.url) : '';
      const fUrl = createModalField({
        label: 'Live Launch URL (url)',
        id: 'm-sw-url',
        maxLen: 500,
        inputEl: urlInput
      });

      const repoInput = document.createElement('input');
      repoInput.type = 'url';
      repoInput.className = 'input-field';
      repoInput.placeholder = 'https://github.com/...';
      repoInput.value = isEdit ? cleanText(existingRow.repo_url) : '';
      const fRepo = createModalField({
        label: 'Source Repository URL (repo_url)',
        id: 'm-sw-repo',
        maxLen: 500,
        inputEl: repoInput
      });

      gLinks.appendChild(fUrl.group);
      gLinks.appendChild(fRepo.group);

      const imgUrlInput = document.createElement('input');
      imgUrlInput.type = 'text';
      imgUrlInput.className = 'input-field';
      imgUrlInput.placeholder = 'https://... or screenshot filename in /softwares/img/';
      imgUrlInput.value = isEdit ? cleanText(existingRow.image_url) : '';
      const fImg = createModalField({
        label: 'Preview Image (image_url)',
        id: 'm-sw-imgurl',
        maxLen: 500,
        inputEl: imgUrlInput
      });

      const imgUploadWrap = document.createElement('div');
      imgUploadWrap.className = 'pe-modal-upload-inline';
      const imgFileInput = document.createElement('input');
      imgFileInput.type = 'file';
      imgFileInput.accept = 'image/jpeg,image/png,image/webp,image/gif,image/avif';
      imgFileInput.className = 'pe-file-input';
      const imgPreview = document.createElement('img');
      imgPreview.className = 'pe-modal-thumb-preview';
      imgPreview.alt = 'Software preview';
      imgPreview.hidden = true;
      const imgStatus = document.createElement('div');
      imgStatus.className = 'pe-field-hint';
      imgStatus.textContent = UPLOAD_WORKER_URL
        ? 'Choose a screenshot to convert to WebP (max 800px, <= 2 MB) and upload.'
        : 'MOCK mode: choose a screenshot to test 800px WebP conversion & preview locally.';

      imgFileInput.addEventListener('change', async () => {
        const file = imgFileInput.files?.[0];
        if (!file) return;
        try {
          const conv = await convertImageFileToWebP(file);
          if (isEdit) {
            imgStatus.textContent = 'Uploading preview image…';
            saveBtn.disabled = true;
            const up = await uploadBlobToWorker({
              blob: conv.blob,
              filename: 'software.webp',
              kind: 'software-image',
              id: cleanText(existingRow.ilsid)
            });
            saveBtn.disabled = false;
            imgPreview.src = up.mock ? up.localUrl : `${up.url || resolveImageSrc(imgUrlInput.value, IMAGE_DIRS.softwares)}?v=${up.timestamp}`;
            imgPreview.hidden = false;
            if (!up.mock && up.url) {
              imgUrlInput.value = up.url;
              imgStatus.textContent = `Uploaded WebP (${conv.width}×${conv.height}, ${formatBytes(conv.blob.size)}).`;
            } else {
              imgStatus.textContent = `MOCK preview: WebP ${conv.width}×${conv.height} (${formatBytes(conv.blob.size)}).`;
            }
          } else {
            pendingImgBlob = conv.blob;
            imgPreview.src = URL.createObjectURL(conv.blob);
            imgPreview.hidden = false;
            imgStatus.textContent = `Converted WebP (${conv.width}×${conv.height}, ${formatBytes(conv.blob.size)}). Will upload automatically once record is published.`;
          }
          fImg.setError('');
        } catch (err) {
          saveBtn.disabled = false;
          fImg.setError(err.message || 'Image conversion failed.');
        }
      });
      imgUploadWrap.appendChild(imgFileInput);
      imgUploadWrap.appendChild(imgPreview);
      imgUploadWrap.appendChild(imgStatus);
      fImg.group.appendChild(imgUploadWrap);

      // Software Engineering Dossier (Displayed on /softwares/<ILS_Id>)
      const dossierHead = document.createElement('div');
      dossierHead.className = 'pe-modal-section-head';
      const dossierTitle = document.createElement('div');
      dossierTitle.className = 'pe-modal-section-title';
      dossierTitle.textContent = 'Software Dossier Sections (/softwares/ILS_Id)';
      const dossierSub = document.createElement('div');
      dossierSub.className = 'pe-modal-section-sub';
      dossierSub.textContent =
        'Displayed on the dedicated software page: Details, Purpose, Goals, Inspiration, Work Processes, and Effects.';
      dossierHead.appendChild(dossierTitle);
      dossierHead.appendChild(dossierSub);

      const detailsInput = document.createElement('textarea');
      detailsInput.className = 'input-field pe-textarea';
      detailsInput.rows = 4;
      detailsInput.placeholder = 'System architecture, core modules, performance benchmarks, and technical details...';
      detailsInput.value = isEdit ? cleanText(existingRow.details) : '';
      const fDetails = createModalField({
        label: 'Technical Details (details)',
        id: 'm-sw-details',
        maxLen: 6000,
        inputEl: detailsInput
      });

      const purposeInput = document.createElement('textarea');
      purposeInput.className = 'input-field pe-textarea';
      purposeInput.rows = 3;
      purposeInput.placeholder = 'What workflow bottleneck or user problem this software solves...';
      purposeInput.value = isEdit ? cleanText(existingRow.purpose) : '';
      const fPurpose = createModalField({
        label: 'Purpose (purpose)',
        id: 'm-sw-purpose',
        maxLen: 2000,
        inputEl: purposeInput
      });

      const goalsInput = document.createElement('textarea');
      goalsInput.className = 'input-field pe-textarea';
      goalsInput.rows = 3;
      goalsInput.placeholder = 'Engineering targets, reliability goals, and accessibility aims...';
      goalsInput.value = isEdit ? cleanText(existingRow.goals) : '';
      const fGoals = createModalField({
        label: 'Goals (goals)',
        id: 'm-sw-goals',
        maxLen: 2000,
        inputEl: goalsInput
      });

      const inspirationInput = document.createElement('textarea');
      inspirationInput.className = 'input-field pe-textarea';
      inspirationInput.rows = 3;
      inspirationInput.placeholder = 'What inspired the team or developer to build this tool...';
      inspirationInput.value = isEdit ? cleanText(existingRow.inspiration) : '';
      const fInspiration = createModalField({
        label: 'Inspiration (inspiration)',
        id: 'm-sw-inspiration',
        maxLen: 2000,
        inputEl: inspirationInput
      });

      const workProcInput = document.createElement('textarea');
      workProcInput.className = 'input-field pe-textarea';
      workProcInput.rows = 3;
      workProcInput.placeholder = 'Design iterations, implementation pipeline, testing, and deployment process...';
      workProcInput.value = isEdit ? cleanText(existingRow.work_processes) : '';
      const fWorkProc = createModalField({
        label: 'Work Processes (work_processes)',
        id: 'm-sw-workproc',
        maxLen: 3000,
        inputEl: workProcInput
      });

      const effectsInput = document.createElement('textarea');
      effectsInput.className = 'input-field pe-textarea';
      effectsInput.rows = 3;
      effectsInput.placeholder = 'Measured outcomes, adoption, speedups, and practical impact...';
      effectsInput.value = isEdit ? cleanText(existingRow.effects) : '';
      const fEffects = createModalField({
        label: 'Effects & Impact (effects)',
        id: 'm-sw-effects',
        maxLen: 2000,
        inputEl: effectsInput
      });

      const feedback = document.createElement('div');
      feedback.className = 'form-feedback error';
      feedback.hidden = true;

      const actions = document.createElement('div');
      actions.className = 'pe-modal-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', closeFn);

      const saveBtn = document.createElement('button');
      saveBtn.type = 'submit';
      saveBtn.className = 'btn btn-orange';
      saveBtn.textContent = isEdit ? 'Save Software' : 'Publish Software';

      actions.appendChild(cancelBtn);
      actions.appendChild(saveBtn);

      form.appendChild(gTop);
      form.appendChild(gMeta);
      form.appendChild(techGroup);
      form.appendChild(fDesc.group);
      form.appendChild(dossierHead);
      form.appendChild(fDetails.group);
      form.appendChild(fPurpose.group);
      form.appendChild(fGoals.group);
      form.appendChild(fInspiration.group);
      form.appendChild(fWorkProc.group);
      form.appendChild(fEffects.group);
      form.appendChild(gLinks);
      form.appendChild(fImg.group);
      form.appendChild(feedback);
      form.appendChild(actions);

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        feedback.hidden = true;

        const name = clampStr(nameInput.value, 140);
        const tagline = clampStr(taglineInput.value, 180) || null;
        const category = clampStr(catInput.value, 80) || null;
        const status = clampStr(statusSelect.value, 40) || null;
        const publishDate = cleanText(dateInput.value) || null;
        const description = clampStr(descInput.value, 2000) || null;
        const rawTech = techEditor.getItems();
        const tech = Array.isArray(rawTech) ? rawTech : [];
        const url = clampStr(urlInput.value, 500) || null;
        const repoUrl = clampStr(repoInput.value, 500) || null;
        const imageUrl = clampStr(imgUrlInput.value, 500) || null;

        const details = clampStr(detailsInput.value, 6000) || null;
        const purpose = clampStr(purposeInput.value, 2000) || null;
        const goals = clampStr(goalsInput.value, 2000) || null;
        const inspiration = clampStr(inspirationInput.value, 2000) || null;
        const workProcesses = clampStr(workProcInput.value, 3000) || null;
        const effects = clampStr(effectsInput.value, 2000) || null;

        let invalid = false;
        fName.setError(name ? '' : 'Software name is required.');
        if (!name) invalid = true;
        fCat.setError('');
        fDesc.setError('');

        if (url && !isHttpUrl(url)) {
          fUrl.setError('Launch URL must begin with https:// or http://');
          invalid = true;
        } else {
          fUrl.setError('');
        }

        if (repoUrl && !isHttpUrl(repoUrl)) {
          fRepo.setError('Repository URL must begin with https:// or http://');
          invalid = true;
        } else {
          fRepo.setError('');
        }
        if (invalid) return;

        const client = getSupabaseClient();
        const prevSnapshot = state.softwares.map((r) => ({ ...r }));
        saveBtn.disabled = true;
        beginFlight('Saving…');

        const coreEditableFields = {
          name,
          tagline,
          description,
          category,
          tech,
          url,
          repo_url: repoUrl,
          image_url: imageUrl,
          status,
          publish_date: publishDate
        };

        const extendedEditableFields = {
          ...coreEditableFields,
          details,
          purpose,
          goals,
          inspiration,
          work_processes: workProcesses,
          effects
        };

        if (isEdit) {
          state.softwares = state.softwares.map((r) =>
            r.ilsid === existingRow.ilsid ? { ...r, ...extendedEditableFields } : r
          );
          renderSoftwaresList();

          let { error } = await client
            .from('software')
            .update(extendedEditableFields)
            .eq('ilsid', existingRow.ilsid)
            .contains('uid', [state.ownerCid]);

          if (error && isMissingColumnError(error)) {
            const retryRes = await client
              .from('software')
              .update(coreEditableFields)
              .eq('ilsid', existingRow.ilsid)
              .contains('uid', [state.ownerCid]);
            error = retryRes.error;
          }

          if (error) {
            state.softwares = prevSnapshot;
            renderSoftwaresList();
            saveBtn.disabled = false;
            feedback.hidden = false;
            feedback.textContent = formatSupabaseError(error, 'Could not update software');
            endFlight(false, 'Saved', 'Could not save');
            return;
          }
          await syncProfileIdArray('softwares', existingRow.ilsid, 'add');
          endFlight(true, 'Saved', 'Could not save');
          closeFn();
        } else {
          const notNullDefaults = {
            uid: [state.ownerCid],
            comments: 0,
            likes: 0,
            reviewers: [],
            is_sample: false
          };
          const insertPayload = {
            ...notNullDefaults,
            ...extendedEditableFields
          };
          const coreInsertPayload = {
            ...notNullDefaults,
            ...coreEditableFields
          };

          const tempRow = {
            ilsid: 'SAVING…',
            ...insertPayload
          };
          state.softwares = [tempRow, ...state.softwares];
          renderSoftwaresList();

          const { data, error } = await insertArchiveRowWithFallbacks(
            client,
            'software',
            'ilsid',
            'ILS',
            insertPayload,
            coreInsertPayload
          );

          if (error || !data) {
            state.softwares = prevSnapshot;
            renderSoftwaresList();
            saveBtn.disabled = false;
            feedback.hidden = false;
            feedback.textContent = formatSupabaseError(error, 'Could not publish software');
            endFlight(false, 'Saved', 'Could not save');
            return;
          }

          // Rule 30: Software row now exists in database. Upload preview image to worker and update URL.
          if (pendingImgBlob && UPLOAD_WORKER_URL) {
            beginFlight('Uploading software preview image…');
            try {
              const upImg = await uploadBlobToWorker({
                blob: pendingImgBlob,
                filename: 'software.webp',
                kind: 'software-image',
                id: data.ilsid
              });
              if (upImg.url) {
                await client
                  .from('software')
                  .update({ image_url: upImg.url })
                  .eq('ilsid', data.ilsid)
                  .contains('uid', [state.ownerCid]);
                data.image_url = upImg.url;
              }
            } catch (iErr) {
              console.warn('Software image upload error:', iErr);
            }
          }

          state.softwares = state.softwares.map((r) => (r === tempRow ? data : r));
          renderSoftwaresList();
          await syncProfileIdArray('softwares', data.ilsid, 'add');
          endFlight(true, 'Saved', 'Could not save');
          closeFn();
        }
      });

      bodyEl.appendChild(form);
    }
  );
}

/* ==========================================================================
   16. Wire DOM Listeners & Initialize
   ========================================================================== */
function setSectionExpanded(sectionEl, expanded) {
  const headerBtn = sectionEl.querySelector('.pe-section-header');
  const bodyEl = sectionEl.querySelector('.pe-section-body');
  if (!headerBtn || !bodyEl) return;
  headerBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  bodyEl.hidden = !expanded;
}

function initDomEvents() {
  // Collapsible section toggles
  document.querySelectorAll('.pe-section[data-collapsible]').forEach((sec) => {
    const headerBtn = sec.querySelector('.pe-section-header');
    if (!headerBtn) return;
    headerBtn.addEventListener('click', () => {
      const isExpanded = headerBtn.getAttribute('aria-expanded') === 'true';
      setSectionExpanded(sec, !isExpanded);
    });
  });

  document.getElementById('pe-expand-all-btn')?.addEventListener('click', () => {
    document.querySelectorAll('.pe-section[data-collapsible]').forEach((s) => setSectionExpanded(s, true));
  });

  document.getElementById('pe-collapse-all-btn')?.addEventListener('click', () => {
    document.querySelectorAll('.pe-section[data-collapsible]').forEach((s) => setSectionExpanded(s, false));
  });

  // Jump links auto-expand target section
  document.querySelectorAll('.pe-jump-link').forEach((link) => {
    link.addEventListener('click', () => {
      const targetId = (link.getAttribute('href') || '').replace(/^#/, '');
      const sec = targetId ? document.getElementById(targetId) : null;
      if (sec) setSectionExpanded(sec, true);
    });
  });

  // Section 1: Legal Identity, Slug & Basics inputs (live validation + counter + dirty flag + blur save)
  document.querySelectorAll('[data-profile-col]').forEach((input) => {
    const col = input.getAttribute('data-profile-col');
    if (!col) return;
    input.addEventListener('input', () => {
      if (col === 'registration') {
        const digitsOnly = input.value.replace(/\D+/g, '');
        if (digitsOnly !== input.value) {
          input.value = digitsOnly;
          setFieldError('registration', 'Numbers (0–9) only.');
        } else {
          setFieldError('registration', '');
        }
      } else if (col === 'slug') {
        setFieldError('slug', '');
        updateSlugPreviewHint(input.value, '');
      }

      if (Object.prototype.hasOwnProperty.call(LEGAL_PROMPT_COLS, col)) {
        syncLegalNullPrompts();
      }

      if (col === 'name' && state.profile && normalizeAccountType(state.profile.type) === 'I') {
        updateInstituteCoverPreview();
      }

      updateCharCounterForInput(input);
      if (state.profile) {
        const cur = cleanText(state.profile[col]);
        markDirty(`profiles.${col}`, input.value.trim() !== cur);
      }
    });
    input.addEventListener('blur', () => {
      handleBasicsFieldBlur(col);
    });
  });

  document.getElementById('form-basics')?.addEventListener('submit', handleSaveBasicsForm);

  // Section 1B: Role & Institutional Affiliation (students / teachers / institutes)
  document.getElementById('form-affiliation')?.addEventListener('submit', handleSaveAffiliationForm);

  const affInputs = [
    'f-aff-eiin',
    'f-t-designation',
    'f-t-department',
    'f-t-researches_reviewed',
    'f-i-cover_url',
    'f-i-institute_type',
    'f-i-established_year',
    'f-i-website',
    'f-i-address',
    'f-i-total_students',
    'f-i-total_teachers'
  ];
  affInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      if (
        id === 'f-t-researches_reviewed' ||
        id === 'f-i-established_year' ||
        id === 'f-i-total_students' ||
        id === 'f-i-total_teachers'
      ) {
        el.value = el.value.replace(/\D+/g, '');
      }
      updateCharCounterForInput(el);
      markDirty('affiliation.form', true);
      if (id === 'f-t-researches_reviewed') {
        updateTeacherLiveScholarshipDom();
      } else if (id === 'f-i-cover_url' || id === 'f-i-institute_type') {
        updateInstituteCoverPreview();
      }
    });
    if (id === 'f-aff-eiin') {
      el.addEventListener('blur', () => {
        lookupEiinAffiliationHint(el.value);
      });
    }
  });

  document.getElementById('pe-inst-cover-file')?.addEventListener('change', async (e) => {
    const file = e.target?.files?.[0];
    const statusEl = document.getElementById('pe-inst-cover-status');
    const coverInput = document.getElementById('f-i-cover_url');
    if (!file) return;
    try {
      const conv = await convertImageFileToWebP(file, 1280, WEBP_QUALITY);
      const up = await uploadBlobToWorker({
        blob: conv.blob,
        filename: 'campus-cover.webp',
        kind: 'institute-cover',
        id: cleanText(state.ownerEiin),
        objectKey: cleanText(coverInput?.value)
      });
      if (state.pendingInstCoverObjectUrl) {
        URL.revokeObjectURL(state.pendingInstCoverObjectUrl);
      }
      if (up.mock) {
        state.pendingInstCoverObjectUrl = up.localUrl;
        updateInstituteCoverPreview(up.localUrl);
        if (statusEl) {
          statusEl.textContent = `Frontend preview active: WebP ${conv.width}×${conv.height} (${formatBytes(conv.blob.size)}). Paste an https:// cover URL above to persist before Cloudflare storage is connected.`;
        }
      } else if (up.url && coverInput) {
        coverInput.value = up.url;
        updateCharCounterForInput(coverInput);
        markDirty('affiliation.form', true);
        updateInstituteCoverPreview(up.url);
        if (statusEl) {
          statusEl.textContent = `Uploaded cover WebP (${conv.width}×${conv.height}, ${formatBytes(conv.blob.size)}). Click Save Institutional Record to persist.`;
        }
      }
      setFieldError('i-cover_url', '');
    } catch (err) {
      setFieldError('i-cover_url', err.message || 'Cover image conversion failed.');
    }
  });

  // Section 2: Academic batches & GPA inputs (live numeric filter + counter + dirty flag + blur save)
  document.querySelectorAll('[data-metric-col]').forEach((input) => {
    const col = input.getAttribute('data-metric-col');
    if (!col) return;
    input.addEventListener('input', () => {
      if (METRIC_BATCH_COLS.includes(col)) {
        const digitsOnly = input.value.replace(/\D+/g, '').slice(0, 4);
        if (digitsOnly !== input.value) {
          input.value = digitsOnly;
          setFieldError(col, 'Digits (0–9) only.');
        } else {
          setFieldError(col, '');
        }
      } else if (METRIC_GPA_COLS.includes(col)) {
        setFieldError(col, '');
      }
      updateCharCounterForInput(input);
      markDirty(`profiles.${col}`, true);
    });
    input.addEventListener('blur', () => {
      handleMetricFieldBlur(col);
    });
  });

  document.getElementById('form-metrics')?.addEventListener('submit', handleSaveMetricsForm);

  // Section 3: Hero Buttons & Public WhatsApp Contact
  document.getElementById('sw-hero-researches')?.addEventListener('click', () => setHeroButtonValue(1));
  document.getElementById('sw-hero-software')?.addEventListener('click', () => setHeroButtonValue(0));
  document.getElementById('sw-hero-both')?.addEventListener('click', () => setHeroButtonValue(2));

  const waInputEl = document.getElementById('f-whatsapp');
  if (waInputEl) {
    waInputEl.addEventListener('input', () => {
      setFieldError('whatsapp', '');
      updateCharCounterForInput(waInputEl);
      syncWhatsappConsentUi(waInputEl.value);
      if (state.profile) {
        const cur = cleanText(state.profile.whatsapp);
        markDirty('profiles.whatsapp', waInputEl.value.trim() !== cur);
      }
    });
    waInputEl.addEventListener('blur', () => {
      handleWhatsappFieldBlur();
    });
    waInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        waInputEl.blur();
      }
    });
  }

  document.getElementById('clear-whatsapp-btn')?.addEventListener('click', handleClearWhatsappClick);
  document.getElementById('save-switches-btn')?.addEventListener('click', handleSaveSwitchesSection);

  // Section 4: Profile Picture (Frontend-only WebP preview)
  document.getElementById('pe-avatar-file')?.addEventListener('change', handleAvatarFileSelected);
  document.getElementById('pe-avatar-upload-btn')?.addEventListener('click', handleAvatarUploadClick);
  document.getElementById('pe-avatar-reset-btn')?.addEventListener('click', resetPendingAvatarPreview);

  // Sections 5–8: Relational Portfolio Add buttons
  document.getElementById('add-education-btn')?.addEventListener('click', () => openCvModal('education'));
  document.getElementById('add-experience-btn')?.addEventListener('click', () => openCvModal('experience'));
  document.getElementById('add-skills-btn')?.addEventListener('click', () => openCustomCardModal('skills'));
  document.getElementById('add-cocurriculars-btn')?.addEventListener('click', () =>
    openCustomCardModal('cocurriculars')
  );
  document.getElementById('add-research-btn')?.addEventListener('click', () => openResearchModal(null));
  document.getElementById('add-software-btn')?.addEventListener('click', () => openSoftwareModal(null));

  // Modals close & Escape handling
  document.getElementById('pe-editor-modal-close')?.addEventListener('click', closeEditorModal);
  document.getElementById('pe-editor-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'pe-editor-modal') closeEditorModal();
  });

  document.getElementById('pe-confirm-close')?.addEventListener('click', closeConfirmDeleteModal);
  document.getElementById('pe-confirm-cancel')?.addEventListener('click', closeConfirmDeleteModal);
  document.getElementById('pe-confirm-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'pe-confirm-modal') closeConfirmDeleteModal();
  });
  document.getElementById('pe-confirm-accept')?.addEventListener('click', () => {
    if (typeof confirmAcceptCallback === 'function') {
      confirmAcceptCallback();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const confirmModal = document.getElementById('pe-confirm-modal');
      if (confirmModal?.classList.contains('open')) {
        closeConfirmDeleteModal();
        return;
      }
      const editorModal = document.getElementById('pe-editor-modal');
      if (editorModal?.classList.contains('open')) {
        closeEditorModal();
      }
    }
  });

  // Auth listener: redirect immediately to /login.html on sign-out
  const client = getSupabaseClient();
  if (client?.auth?.onAuthStateChange) {
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (!session && state.ownerCid)) {
        window.location.replace('/login.html');
      } else if (session) {
        state.session = session;
      }
    });
  }

  // Warn before leaving if saves are in flight or changes are unsaved
  window.addEventListener('beforeunload', (e) => {
    if (state.inFlightSaves > 0 || state.dirtyKeys.size > 0 || state.modalDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initDomEvents();
  loadOwnerWorkspace();
});
