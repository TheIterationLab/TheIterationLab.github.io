// ==========================================================================
// The Iteration Lab — Shared Directory Controller (/assets/js/directory.js)
// Powers /leaders/, /researches/, /students/, /teachers/, /institutes/,
// /softwares/, and /communities/ (both paginated list & ?id= detail views).
// ==========================================================================

import { SUPABASE_URL, SUPABASE_ANON_KEY, IMAGE_DIRS } from '../../js/config.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MEMBER_IMAGE_DIRS = [
  IMAGE_DIRS.students,
  IMAGE_DIRS.teachers,
  IMAGE_DIRS.leaders,
  IMAGE_DIRS.institutes
];

const DIRECTORY_CONFIGS = {
  leaders: {
    pageSize: 20,
    basePath: '/leaders/',
    imageDir: IMAGE_DIRS.leaders,
    table: 'leaders',
    idColumn: 'cid',
    idIsUuid: true,
    listSelect: 'cid,sort_order,display_name,role,quote,bio,responsibilities,profile_i,whatsapp,profiles(name,photo)',
    detailSelect: 'cid,sort_order,display_name,role,quote,bio,responsibilities,profile_i,whatsapp,s_invite_count,c_invite_count,t_invite_count,r_published,s_published,skill_score,profiles(name,photo)',
    order: 'sort_order.asc',
    singularLabel: 'leader',
    pluralLabel: 'leaders',
    skeletonLayout: 'cols-3'
  },
  teachers: {
    pageSize: 24,
    basePath: '/teachers/',
    imageDir: IMAGE_DIRS.teachers,
    table: 'teachers',
    idColumn: 'cid',
    idIsUuid: true,
    listSelect: 'cid,eiin,profiles(name,photo)',
    detailSelect: 'cid,eiin,profiles(name,photo,certificates,softwares,researches,others)',
    order: 'created_at.desc',
    singularLabel: 'teacher',
    pluralLabel: 'teachers',
    skeletonLayout: 'cols-compact',
    searchFields: [
      { value: 'name', label: 'Name', placeholder: 'Search by teacher name...' },
      { value: 'eiin', label: 'College EIIN', placeholder: 'Enter college EIIN (e.g. 108274)...' }
    ]
  },
  students: {
    pageSize: 24,
    basePath: '/students/',
    imageDir: IMAGE_DIRS.students,
    table: 'students',
    idColumn: 'cid',
    idIsUuid: true,
    listSelect: 'cid,eiin,profiles(name,photo)',
    detailSelect: 'cid,eiin,profiles(name,photo,certificates,softwares,researches,others)',
    order: 'created_at.desc',
    singularLabel: 'student',
    pluralLabel: 'students',
    skeletonLayout: 'cols-compact',
    searchFields: [
      { value: 'name', label: 'Name', placeholder: 'Search by student name...' },
      { value: 'eiin', label: 'College EIIN', placeholder: 'Enter college EIIN (e.g. 108274)...' }
    ]
  },
  institutes: {
    pageSize: 24,
    basePath: '/institutes/',
    imageDir: IMAGE_DIRS.institutes,
    table: 'institutes',
    idColumn: 'cid',
    idIsUuid: true,
    listSelect: 'cid,eiin,profiles(name,photo)',
    detailSelect: 'cid,eiin,profiles(name,photo,certificates,softwares,researches,others)',
    order: 'created_at.desc',
    singularLabel: 'institute',
    pluralLabel: 'institutes',
    skeletonLayout: 'cols-compact',
    searchFields: [
      { value: 'name', label: 'Name', placeholder: 'Search by institute name...' },
      { value: 'eiin', label: 'EIIN', placeholder: 'Enter EIIN (e.g. 108274)...' }
    ]
  },
  researches: {
    pageSize: 12,
    basePath: '/researches/',
    imageDir: IMAGE_DIRS.researches,
    table: 'researches',
    idColumn: 'ilrid',
    idIsUuid: false,
    listSelect: 'ilrid,uid,title,abstract,category,keywords,paper_url,cover_url,publish_date,likes,comments,reviewers,is_sample',
    detailSelect: 'ilrid,uid,title,abstract,category,keywords,paper_url,cover_url,publish_date,likes,comments,reviewers,is_sample',
    order: 'publish_date.desc.nullslast',
    singularLabel: 'research paper',
    pluralLabel: 'research papers',
    skeletonLayout: 'cols-2',
    searchFields: [
      { value: 'title', label: 'Title', placeholder: 'Search by paper title...' },
      { value: 'author', label: 'Author', placeholder: 'Search by author name...' },
      { value: 'eiin', label: 'College EIIN', placeholder: 'Enter college EIIN (e.g. 108274)...' }
    ]
  },
  softwares: {
    pageSize: 6,
    basePath: '/softwares/',
    imageDir: IMAGE_DIRS.softwares,
    table: 'software',
    idColumn: 'ilsid',
    idIsUuid: false,
    listSelect: 'ilsid,uid,name,tagline,description,category,tech,url,repo_url,image_url,status,publish_date,likes,comments,reviewers,is_sample',
    detailSelect: 'ilsid,uid,name,tagline,description,category,tech,url,repo_url,image_url,status,publish_date,likes,comments,reviewers,is_sample',
    order: 'publish_date.desc.nullslast',
    singularLabel: 'software build',
    pluralLabel: 'software builds',
    skeletonLayout: 'stack',
    searchFields: [
      { value: 'name', label: 'Name', placeholder: 'Search by software name...' },
      { value: 'developer', label: 'Developer name', placeholder: 'Search by developer name...' }
    ]
  },
  communities: {
    pageSize: 6,
    basePath: '/communities/',
    imageDir: IMAGE_DIRS.communities,
    table: 'groups',
    idColumn: 'id',
    idIsUuid: false,
    listSelect: 'id,name,description,mission,m_id,l_id,l2_id,p_id,image_url,is_sample',
    detailSelect: 'id,name,description,mission,m_id,l_id,l2_id,p_id,image_url,is_sample',
    order: 'created_at.desc',
    singularLabel: 'community',
    pluralLabel: 'communities',
    skeletonLayout: 'stack',
    searchFields: [
      { value: 'name', label: 'Name', placeholder: 'Search by community name...' },
      { value: 'eiin', label: 'College EIIN', placeholder: 'Enter college EIIN (e.g. 108274)...' }
    ]
  }
};

/* ==========================================================================
   DOM, String, Link & Avatar Utilities (strict textContent rendering)
   ========================================================================== */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) {
    node.textContent = String(text);
  }
  return node;
}

function cleanText(val) {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return '';
  return s;
}

function isHttpUrl(val) {
  if (typeof val !== 'string') return false;
  const s = val.trim();
  return /^https?:\/\/\S+$/i.test(s);
}

export function resolveImageSrc(val, defaultDir = '') {
  const raw = cleanText(val).replace(/\\/g, '/');
  if (!raw) return '';
  if (/^https?:\/\/\S+$/i.test(raw)) return raw;
  if (raw.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return '';

  const fixedRaw = raw.replace(/\/leaders\/ing\//gi, '/leaders/img/');
  const trimmed = fixedRaw.replace(/^\.?\/+/, '');
  if (!trimmed) return '';

  const normDir = defaultDir
    ? `/${defaultDir.replace(/^\/+|\/+$/g, '')}/`
    : '/';

  // Filename only (e.g. "Arik.webp") -> prepend default directory ("/leaders/img/Arik.webp")
  if (!trimmed.includes('/')) {
    return `${normDir}${trimmed}`;
  }

  // Relative "img/filename.ext" -> "<defaultDir>filename.ext"
  if (/^img\/[^/]+$/i.test(trimmed) && defaultDir) {
    return `${normDir}${trimmed.slice(4)}`;
  }

  return `/${trimmed}`;
}

function buildLocalImageRetryQueue(initialSrc, allowCrossMemberDirs = false) {
  const candidates = [];
  const pushUnique = (u) => {
    if (u && u !== initialSrc && !candidates.includes(u)) {
      candidates.push(u);
    }
  };
  if (initialSrc.includes('/leaders/ing/')) {
    pushUnique(initialSrc.replace('/leaders/ing/', '/leaders/img/'));
  }
  const dirFixed = initialSrc.replace('/leaders/ing/', '/leaders/img/');
  const match = dirFixed.match(
    /^(\/(?:leaders|students|teachers|institutes|researches|softwares|communities)\/img\/)([^/?#]+)(\.(?:jpe?g|png|webp))$/i
  );
  if (match) {
    const [, prefix, baseName, ext] = match;
    const toggled =
      baseName[0] === baseName[0].toUpperCase()
        ? baseName[0].toLowerCase() + baseName.slice(1)
        : baseName[0].toUpperCase() + baseName.slice(1);
    for (const b of [baseName, toggled]) {
      for (const e of [ext, '.webp', '.jpg']) {
        pushUnique(`${prefix}${b}${e}`);
      }
    }
    if (allowCrossMemberDirs) {
      for (const altDir of MEMBER_IMAGE_DIRS) {
        for (const b of [baseName, toggled]) {
          pushUnique(`${altDir}${b}${ext}`);
        }
      }
    }
  }
  return candidates;
}

function attachImgFallback(imgEl, onFail, allowCrossMemberDirs = false) {
  const src = imgEl.getAttribute('src') || '';
  const retries = buildLocalImageRetryQueue(src, allowCrossMemberDirs);
  const handleErr = () => {
    if (retries.length > 0) {
      imgEl.src = retries.shift();
      return;
    }
    onFail();
  };
  imgEl.addEventListener('error', handleErr);
  if (imgEl.complete && imgEl.naturalWidth === 0) {
    handleErr();
  }
}

export function getInitials(name) {
  const cleaned = cleanText(name);
  if (!cleaned) return '--';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();
  }
  const first = Array.from(parts[0])[0] || '';
  const last = Array.from(parts[parts.length - 1])[0] || '';
  return (first + last).toUpperCase();
}

export function createAvatar(
  name,
  photoUrl,
  sizeModifier = '',
  defaultDir = IMAGE_DIRS.students,
  allowCrossMemberDirs = true
) {
  const displayName = cleanText(name) || 'Contributor';
  const initials = getInitials(displayName);
  const validSrc = resolveImageSrc(photoUrl, defaultDir);
  const dim = sizeModifier === 'dir-avatar-sm' ? 34 : sizeModifier === 'dir-avatar-lg' ? 84 : 48;

  const wrap = el('span', `dir-avatar${sizeModifier ? ` ${sizeModifier}` : ''}`);
  wrap.setAttribute('title', displayName);

  const initialsSpan = el('span', 'dir-avatar-initials', initials);
  initialsSpan.setAttribute('aria-hidden', 'true');

  if (validSrc) {
    initialsSpan.hidden = true;
    const img = document.createElement('img');
    img.src = validSrc;
    img.alt = `Portrait of ${displayName}`;
    img.width = dim;
    img.height = dim;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    wrap.appendChild(img);
    wrap.appendChild(initialsSpan);
    attachImgFallback(
      img,
      () => {
        img.hidden = true;
        initialsSpan.hidden = false;
      },
      allowCrossMemberDirs
    );
  } else {
    wrap.appendChild(initialsSpan);
  }

  return wrap;
}

function extractProfile(profilesField) {
  if (Array.isArray(profilesField)) return profilesField[0] || null;
  if (profilesField && typeof profilesField === 'object') return profilesField;
  return null;
}

function parseStringArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map(v => cleanText(v)).filter(Boolean);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(v => cleanText(v)).filter(Boolean);
        }
      } catch (_) {
        // Treat as newline/comma list
      }
    }
    return trimmed
      .split(/\r?\n/)
      .map(s => s.replace(/^[\s\-—•*]+/, '').trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeUuidList(val) {
  if (!val) return [];
  const rawList = Array.isArray(val) ? val : [val];
  return rawList.map(v => cleanText(v)).filter(Boolean);
}

function formatDate(dateStr) {
  const s = cleanText(dateStr);
  if (!s) return '';
  const d = new Date(s.length === 10 ? `${s}T00:00:00` : s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatWhatsappHref(whatsappVal) {
  const raw = cleanText(whatsappVal);
  if (!raw) return '';
  if (isHttpUrl(raw)) return raw;
  if (/^wa\.me\/\S+$/i.test(raw)) return `https://${raw}`;
  const cleaned = raw.replace(/^[@+\s]+/, '').replace(/[\s()-]/g, '');
  if (!cleaned) return '';
  return `https://wa.me/${encodeURIComponent(cleaned)}`;
}

/* ==========================================================================
   Supabase Read-Only REST Fetch Helper + Batch Lookups
   ========================================================================== */
function parseTotalFromContentRange(headerVal, fallbackCount) {
  if (!headerVal) return fallbackCount;
  const parts = String(headerVal).split('/');
  if (parts.length === 2) {
    const totalNum = parseInt(parts[1], 10);
    if (!Number.isNaN(totalNum) && totalNum >= 0) {
      return totalNum;
    }
  }
  return fallbackCount;
}

export async function sbFetch(queryPath, { countExact = false } = {}) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
  };
  if (countExact) {
    headers.Prefer = 'count=exact';
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${queryPath}`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  const data = await response.json();
  const rows = Array.isArray(data) ? data : [];
  const total = countExact
    ? parseTotalFromContentRange(response.headers.get('content-range'), rows.length)
    : rows.length;

  return { rows, total };
}

async function fetchProfilesMap(rawIds) {
  const validUuids = Array.from(
    new Set(rawIds.map(id => cleanText(id)).filter(id => UUID_RE.test(id)))
  );
  const map = new Map();
  if (validUuids.length === 0) return map;

  const inClause = validUuids.map(u => `"${u}"`).join(',');
  const { rows } = await sbFetch(
    `profiles?select=cid,name,photo&cid=in.(${encodeURIComponent(inClause)})`
  );

  rows.forEach(r => {
    if (r.cid) {
      map.set(String(r.cid), {
        cid: String(r.cid),
        name: cleanText(r.name) || 'Contributor',
        photo: cleanText(r.photo)
      });
    }
  });
  return map;
}

function resolvePerson(profilesMap, id) {
  const key = cleanText(id);
  if (key && profilesMap.has(key)) {
    return profilesMap.get(key);
  }
  return { cid: key, name: 'Contributor', photo: '' };
}

async function fetchInstitutesMap(eiinValues) {
  const distinct = Array.from(
    new Set(eiinValues.map(v => cleanText(v)).filter(Boolean))
  );
  const map = new Map();
  if (distinct.length === 0) return map;

  const inClause = distinct.map(e => `"${e.replace(/"/g, '')}"`).join(',');
  const { rows } = await sbFetch(
    `institutes?select=eiin,profiles(name)&eiin=in.(${encodeURIComponent(inClause)})`
  );

  rows.forEach(r => {
    const key = cleanText(r.eiin);
    const prof = extractProfile(r.profiles);
    const instName = prof ? cleanText(prof.name) : '';
    if (key && instName) {
      map.set(key, instName);
    }
  });
  return map;
}

function resolveInstitutionText(eiinVal, institutesMap) {
  const key = cleanText(eiinVal);
  if (!key) return '';
  if (institutesMap && institutesMap.has(key)) {
    return institutesMap.get(key);
  }
  return `EIIN ${key}`;
}

function sanitizeIlikeTerm(raw) {
  return cleanText(raw).replace(/[*%]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function sanitizeEiinTerm(raw) {
  const stripped = cleanText(raw).replace(/^eiin[\s:#\-]*/i, '');
  return sanitizeIlikeTerm(stripped);
}

async function fetchProfileCidsByName(nameTerm) {
  const term = sanitizeIlikeTerm(nameTerm);
  if (!term) return [];
  const { rows } = await sbFetch(
    `profiles?select=cid&name=ilike.*${encodeURIComponent(term)}*&limit=200`
  );
  return Array.from(
    new Set(rows.map(r => cleanText(r.cid)).filter(id => UUID_RE.test(id)))
  );
}

async function fetchAffiliatedCidsByEiin(eiinTerm) {
  const term = sanitizeEiinTerm(eiinTerm);
  if (!term) return [];
  const encoded = encodeURIComponent(term);
  const [studRes, teachRes, instRes] = await Promise.all([
    sbFetch(`students?select=cid&eiin=ilike.*${encoded}*&limit=300`),
    sbFetch(`teachers?select=cid&eiin=ilike.*${encoded}*&limit=300`),
    sbFetch(`institutes?select=cid&eiin=ilike.*${encoded}*&limit=300`)
  ]);
  const combined = [...studRes.rows, ...teachRes.rows, ...instRes.rows];
  return Array.from(
    new Set(combined.map(r => cleanText(r.cid)).filter(id => UUID_RE.test(id)))
  );
}

async function fetchDirectoryListPage(dirKey, cfg, { page, searchBy, searchQuery }) {
  const offset = (page - 1) * cfg.pageSize;
  const activeQuery = cleanText(searchQuery);

  if (!activeQuery || !Array.isArray(cfg.searchFields) || cfg.searchFields.length === 0) {
    const query = `${cfg.table}?select=${cfg.listSelect}&order=${cfg.order}&limit=${cfg.pageSize}&offset=${offset}`;
    return sbFetch(query, { countExact: true });
  }

  if (dirKey === 'institutes' || dirKey === 'teachers' || dirKey === 'students') {
    if (searchBy === 'eiin') {
      const term = sanitizeEiinTerm(activeQuery);
      if (!term) return { rows: [], total: 0 };
      const query = `${cfg.table}?select=${cfg.listSelect}&eiin=ilike.*${encodeURIComponent(term)}*&order=${cfg.order}&limit=${cfg.pageSize}&offset=${offset}`;
      return sbFetch(query, { countExact: true });
    }
    const term = sanitizeIlikeTerm(activeQuery);
    if (!term) return { rows: [], total: 0 };
    const innerSelect = 'cid,eiin,profiles!inner(name,photo)';
    const query = `${cfg.table}?select=${innerSelect}&profiles.name=ilike.*${encodeURIComponent(term)}*&order=${cfg.order}&limit=${cfg.pageSize}&offset=${offset}`;
    return sbFetch(query, { countExact: true });
  }

  if (dirKey === 'communities') {
    if (searchBy === 'eiin') {
      const cids = await fetchAffiliatedCidsByEiin(activeQuery);
      if (cids.length === 0) return { rows: [], total: 0 };
      const uuidCsv = cids.join(',');
      const orFilter = `(m_id.ov.{${uuidCsv}},l_id.in.(${uuidCsv}),l2_id.in.(${uuidCsv}),p_id.in.(${uuidCsv}))`;
      const query = `${cfg.table}?select=${cfg.listSelect}&or=${orFilter}&order=${cfg.order}&limit=${cfg.pageSize}&offset=${offset}`;
      return sbFetch(query, { countExact: true });
    }
    const term = sanitizeIlikeTerm(activeQuery);
    if (!term) return { rows: [], total: 0 };
    const query = `${cfg.table}?select=${cfg.listSelect}&name=ilike.*${encodeURIComponent(term)}*&order=${cfg.order}&limit=${cfg.pageSize}&offset=${offset}`;
    return sbFetch(query, { countExact: true });
  }

  if (dirKey === 'researches') {
    if (searchBy === 'author') {
      const cids = await fetchProfileCidsByName(activeQuery);
      if (cids.length === 0) return { rows: [], total: 0 };
      const query = `${cfg.table}?select=${cfg.listSelect}&uid=ov.{${cids.join(',')}}&order=${cfg.order}&limit=${cfg.pageSize}&offset=${offset}`;
      return sbFetch(query, { countExact: true });
    }
    if (searchBy === 'eiin') {
      const cids = await fetchAffiliatedCidsByEiin(activeQuery);
      if (cids.length === 0) return { rows: [], total: 0 };
      const query = `${cfg.table}?select=${cfg.listSelect}&uid=ov.{${cids.join(',')}}&order=${cfg.order}&limit=${cfg.pageSize}&offset=${offset}`;
      return sbFetch(query, { countExact: true });
    }
    const term = sanitizeIlikeTerm(activeQuery);
    if (!term) return { rows: [], total: 0 };
    const query = `${cfg.table}?select=${cfg.listSelect}&title=ilike.*${encodeURIComponent(term)}*&order=${cfg.order}&limit=${cfg.pageSize}&offset=${offset}`;
    return sbFetch(query, { countExact: true });
  }

  if (dirKey === 'softwares') {
    if (searchBy === 'developer') {
      const cids = await fetchProfileCidsByName(activeQuery);
      if (cids.length === 0) return { rows: [], total: 0 };
      const query = `${cfg.table}?select=${cfg.listSelect}&uid=ov.{${cids.join(',')}}&order=${cfg.order}&limit=${cfg.pageSize}&offset=${offset}`;
      return sbFetch(query, { countExact: true });
    }
    const term = sanitizeIlikeTerm(activeQuery);
    if (!term) return { rows: [], total: 0 };
    const query = `${cfg.table}?select=${cfg.listSelect}&name=ilike.*${encodeURIComponent(term)}*&order=${cfg.order}&limit=${cfg.pageSize}&offset=${offset}`;
    return sbFetch(query, { countExact: true });
  }

  const fallbackQuery = `${cfg.table}?select=${cfg.listSelect}&order=${cfg.order}&limit=${cfg.pageSize}&offset=${offset}`;
  return sbFetch(fallbackQuery, { countExact: true });
}

/* ==========================================================================
   Pagination Builder (First, Prev, numbered with "…" gaps, Next, Last)
   ========================================================================== */
function computePageTokens(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const wanted = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1
  ]);
  if (currentPage <= 3) {
    wanted.add(2);
    wanted.add(3);
    wanted.add(4);
  }
  if (currentPage >= totalPages - 2) {
    wanted.add(totalPages - 1);
    wanted.add(totalPages - 2);
    wanted.add(totalPages - 3);
  }

  const sorted = Array.from(wanted)
    .filter(p => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const tokens = [];
  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i];
    if (i > 0) {
      const prev = sorted[i - 1];
      if (page - prev === 2) {
        tokens.push(prev + 1);
      } else if (page - prev > 2) {
        tokens.push('…');
      }
    }
    tokens.push(page);
  }
  return tokens;
}

function renderPaginationInto(navEl, currentPage, totalPages, onSelectPage) {
  navEl.replaceChildren();
  if (totalPages <= 1) {
    navEl.hidden = true;
    return;
  }
  navEl.hidden = false;

  const makeBtn = (label, targetPage, disabled, isCurrent, ariaLabel) => {
    const btn = el('button', 'dir-page-btn', label);
    btn.type = 'button';
    if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
    if (disabled) btn.disabled = true;
    if (isCurrent) btn.setAttribute('aria-current', 'page');
    if (!disabled && !isCurrent) {
      btn.addEventListener('click', () => onSelectPage(targetPage));
    }
    return btn;
  };

  navEl.appendChild(makeBtn('First', 1, currentPage <= 1, false, 'First page'));
  navEl.appendChild(makeBtn('Prev', currentPage - 1, currentPage <= 1, false, 'Previous page'));

  const tokens = computePageTokens(currentPage, totalPages);
  tokens.forEach(tok => {
    if (tok === '…') {
      const gap = el('span', 'dir-page-gap', '…');
      gap.setAttribute('aria-hidden', 'true');
      navEl.appendChild(gap);
    } else {
      navEl.appendChild(
        makeBtn(String(tok), tok, false, tok === currentPage, `Page ${tok}`)
      );
    }
  });

  navEl.appendChild(makeBtn('Next', currentPage + 1, currentPage >= totalPages, false, 'Next page'));
  navEl.appendChild(makeBtn('Last', totalPages, currentPage >= totalPages, false, 'Last page'));
}

/* ==========================================================================
   Loading Skeleton, Empty State & Error State Builders
   ========================================================================== */
function renderLoadingSkeleton(container, cfg) {
  container.replaceChildren();
  const count = cfg.skeletonLayout === 'stack' ? 3 : cfg.skeletonLayout === 'cols-2' ? 4 : 6;
  const grid = el(
    'div',
    cfg.skeletonLayout === 'stack' ? 'dir-stack-list' : `dir-skeleton-grid ${cfg.skeletonLayout}`
  );
  grid.setAttribute('aria-busy', 'true');
  grid.setAttribute('aria-label', `Loading ${cfg.pluralLabel}`);

  for (let i = 0; i < count; i++) {
    const card = el('div', 'dir-skeleton-card');
    const b1 = el('div', 'dir-skel-block');
    b1.style.height = cfg.skeletonLayout === 'cols-compact' ? '48px' : '140px';
    b1.style.width = cfg.skeletonLayout === 'cols-compact' ? '48px' : '100%';
    if (cfg.skeletonLayout === 'cols-compact') b1.style.borderRadius = '50%';

    const b2 = el('div', 'dir-skel-block');
    b2.style.height = '18px';
    b2.style.width = '68%';

    const b3 = el('div', 'dir-skel-block');
    b3.style.height = '13px';
    b3.style.width = '90%';

    const b4 = el('div', 'dir-skel-block');
    b4.style.height = '38px';
    b4.style.width = '45%';
    b4.style.marginTop = '8px';

    card.append(b1, b2, b3, b4);
    grid.appendChild(card);
  }
  container.appendChild(grid);
}

function renderEmptyState(container, titleText, descText, actionLabel = '', onAction = null) {
  container.replaceChildren();
  const box = el('div', 'dir-state-box');
  box.appendChild(el('h2', 'dir-state-title', titleText));
  box.appendChild(el('p', 'dir-state-desc', descText));
  if (actionLabel && typeof onAction === 'function') {
    const actionBtn = el('button', 'dir-btn dir-btn-outline', actionLabel);
    actionBtn.type = 'button';
    actionBtn.addEventListener('click', onAction);
    box.appendChild(actionBtn);
  }
  container.appendChild(box);
}

function renderErrorState(container, messageText, onRetry) {
  container.replaceChildren();
  const box = el('div', 'dir-state-box');
  box.setAttribute('role', 'alert');
  box.appendChild(el('h2', 'dir-state-title', 'Unable to load directory data'));
  box.appendChild(el('p', 'dir-state-desc', messageText));
  const retryBtn = el('button', 'dir-btn dir-btn-primary', 'Retry');
  retryBtn.type = 'button';
  retryBtn.addEventListener('click', onRetry);
  box.appendChild(retryBtn);
  container.appendChild(box);
}

/* ==========================================================================
   List Card Renderers for All 7 Directories
   ========================================================================== */
function renderLeadersList(container, rows) {
  const grid = el('div', 'dir-leaders-grid');

  rows.forEach(row => {
    const prof = extractProfile(row.profiles);
    const name = cleanText(row.display_name) || (prof ? cleanText(prof.name) : '') || 'Leader';
    const role = cleanText(row.role);
    const quote = cleanText(row.quote);
    const resps = parseStringArray(row.responsibilities).slice(0, 3);
    const directPhoto = cleanText(row.profile_i);
    const profPhoto = prof ? cleanText(prof.photo) : '';
    const rawPhoto = directPhoto || profPhoto;
    const photoSrc = resolveImageSrc(rawPhoto, IMAGE_DIRS.leaders);
    const whatsappHref = formatWhatsappHref(row.whatsapp);
    const cid = cleanText(row.cid);

    const card = el('article', 'dir-leader-card');
    card.setAttribute('aria-label', role ? `${name}, ${role}` : name);

    // Top/Left Photo Slot (photo or centered 2-letter initials circle)
    const media = el('div', 'dir-leader-media');
    const fallbackAvatar = createAvatar(name, '', 'dir-avatar-lg', IMAGE_DIRS.leaders, false);
    if (photoSrc) {
      fallbackAvatar.style.display = 'none';
      const img = document.createElement('img');
      img.src = photoSrc;
      img.alt = `Portrait of ${name}`;
      img.width = 360;
      img.height = 240;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      media.appendChild(img);
      media.appendChild(fallbackAvatar);
      attachImgFallback(
        img,
        () => {
          img.hidden = true;
          fallbackAvatar.style.display = 'inline-flex';
        },
        !directPhoto && Boolean(profPhoto)
      );
    } else {
      media.appendChild(fallbackAvatar);
    }

    const body = el('div', 'dir-leader-body');
    const headWrap = el('div');
    headWrap.appendChild(el('h2', 'dir-leader-name', name));
    if (role) {
      headWrap.appendChild(el('div', 'dir-leader-role', role));
    }
    body.appendChild(headWrap);

    if (quote) {
      body.appendChild(el('p', 'dir-leader-quote', quote));
    }

    if (resps.length > 0) {
      const ul = el('ul', 'dir-leader-resp-list');
      resps.forEach(item => {
        const li = el('li', '', item);
        li.title = item;
        ul.appendChild(li);
      });
      body.appendChild(ul);
    }

    const actions = el('div', 'dir-leader-actions');
    if (whatsappHref) {
      const waLink = el('a', 'dir-btn dir-btn-outline', 'WhatsApp');
      waLink.href = whatsappHref;
      waLink.target = '_blank';
      waLink.rel = 'noopener noreferrer';
      actions.appendChild(waLink);
    }
    if (cid) {
      const profLink = el('a', 'dir-btn dir-btn-primary', 'Profile');
      profLink.href = `/leaders/?id=${encodeURIComponent(cid)}`;
      profLink.dataset.dirNav = 'true';
      actions.appendChild(profLink);
    }
    body.appendChild(actions);

    card.append(media, body);
    grid.appendChild(card);
  });

  container.replaceChildren(grid);
}

function renderMembersCompactList(container, rows, institutesMap, cfg, defaultLabel) {
  const grid = el('div', 'dir-compact-grid');

  rows.forEach(row => {
    const prof = extractProfile(row.profiles);
    const name = (prof ? cleanText(prof.name) : '') || defaultLabel;
    const photo = prof ? cleanText(prof.photo) : '';
    const instText = resolveInstitutionText(row.eiin, institutesMap);
    const cid = cleanText(row.cid);

    const card = el('article', 'dir-compact-card');
    const top = el('div', 'dir-compact-top');
    top.appendChild(createAvatar(name, photo, '', cfg.imageDir, true));

    const info = el('div', 'dir-compact-info');
    info.appendChild(el('h2', 'dir-compact-name', name));
    if (instText) {
      info.appendChild(el('div', 'dir-compact-sub', instText));
    }
    top.appendChild(info);
    card.appendChild(top);

    if (cid) {
      const btn = el('a', 'dir-btn dir-btn-outline', 'View profile');
      btn.href = `${cfg.basePath}?id=${encodeURIComponent(cid)}`;
      btn.dataset.dirNav = 'true';
      card.appendChild(btn);
    }

    grid.appendChild(card);
  });

  container.replaceChildren(grid);
}

function renderInstitutesList(container, rows) {
  const grid = el('div', 'dir-compact-grid');

  rows.forEach(row => {
    const prof = extractProfile(row.profiles);
    const name = (prof ? cleanText(prof.name) : '') || 'Institute';
    const photo = prof ? cleanText(prof.photo) : '';
    const eiin = cleanText(row.eiin);
    const cid = cleanText(row.cid);

    const card = el('article', 'dir-compact-card');
    const top = el('div', 'dir-compact-top');
    top.appendChild(createAvatar(name, photo, '', IMAGE_DIRS.institutes, true));

    const info = el('div', 'dir-compact-info');
    info.appendChild(el('h2', 'dir-compact-name', name));
    if (eiin) {
      info.appendChild(el('div', 'dir-compact-eiin', `EIIN ${eiin}`));
    }
    top.appendChild(info);
    card.appendChild(top);

    if (cid) {
      const btn = el('a', 'dir-btn dir-btn-outline', 'View profile');
      btn.href = `/institutes/?id=${encodeURIComponent(cid)}`;
      btn.dataset.dirNav = 'true';
      card.appendChild(btn);
    }

    grid.appendChild(card);
  });

  container.replaceChildren(grid);
}

function createResearchCover(ilrid, category, title, coverUrl, isDetail = false) {
  const wrap = el('div', isDetail ? 'dir-detail-cover' : 'dir-research-cover');
  const validCover = resolveImageSrc(coverUrl, IMAGE_DIRS.researches);

  const typo = el('div', 'dir-typographic-cover');
  const topLine = el('div', 'dir-typo-code', [ilrid, category].filter(Boolean).join(' · ') || 'RESEARCH');
  const titlePreview = el('div', 'dir-typo-title', title || 'Research Manuscript');
  const footLine = el('div', 'dir-stat-inline', 'The Iteration Lab · Open Research Archive');
  typo.append(topLine, titlePreview, footLine);

  if (validCover) {
    typo.hidden = true;
    const img = document.createElement('img');
    img.src = validCover;
    img.alt = `Cover illustration for ${title || ilrid || 'research paper'}`;
    img.width = 640;
    img.height = 360;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    wrap.append(img, typo);
    attachImgFallback(img, () => {
      img.hidden = true;
      typo.hidden = false;
    });
  } else {
    wrap.appendChild(typo);
  }
  return wrap;
}

function renderResearchesList(container, rows, profilesMap) {
  const grid = el('div', 'dir-research-grid');

  rows.forEach(row => {
    const ilrid = cleanText(row.ilrid);
    const title = cleanText(row.title) || 'Untitled Research';
    const abstract = cleanText(row.abstract);
    const category = cleanText(row.category);
    const keywords = parseStringArray(row.keywords);
    const authorIds = normalizeUuidList(row.uid);
    const reviewerIds = normalizeUuidList(row.reviewers);
    const pubDate = formatDate(row.publish_date);
    const likes = Number(row.likes ?? 0);
    const comments = Number(row.comments ?? 0);
    const paperUrl = cleanText(row.paper_url);

    const card = el('article', 'dir-research-card');
    card.appendChild(createResearchCover(ilrid, category, title, row.cover_url, false));

    const body = el('div', 'dir-research-body');

    const metaRow = el('div', 'dir-meta-row');
    if (ilrid) metaRow.appendChild(el('span', 'dir-chip dir-chip-code', ilrid));
    if (category) metaRow.appendChild(el('span', 'dir-category-label', category));
    if (row.is_sample === true) metaRow.appendChild(el('span', 'dir-sample-badge', 'SAMPLE'));
    if (metaRow.childNodes.length > 0) body.appendChild(metaRow);

    body.appendChild(el('h2', 'dir-card-serif-title', title));

    if (abstract) {
      body.appendChild(el('p', 'dir-full-prose', abstract));
    }

    if (keywords.length > 0) {
      const kwWrap = el('div', 'dir-chips-wrap');
      keywords.forEach(kw => kwWrap.appendChild(el('span', 'dir-chip', kw)));
      body.appendChild(kwWrap);
    }

    const statsBox = el('div', 'dir-meta-stats');
    const authorNames = authorIds.length > 0
      ? authorIds.map(id => resolvePerson(profilesMap, id).name).join(', ')
      : 'Contributor';
    statsBox.appendChild(el('div', '', `Authors: ${authorNames}`));

    const subStats = el('div', 'dir-stat-inline');
    const pieces = [`Reviewed by ${reviewerIds.length}`];
    if (pubDate) pieces.push(pubDate);
    pieces.push(`${likes} ${likes === 1 ? 'like' : 'likes'}`);
    pieces.push(`${comments} ${comments === 1 ? 'comment' : 'comments'}`);
    subStats.textContent = pieces.join(' · ');
    statsBox.appendChild(subStats);
    body.appendChild(statsBox);

    const actions = el('div', 'dir-actions-row');
    if (isHttpUrl(paperUrl)) {
      const readBtn = el('a', 'dir-btn dir-btn-primary', 'Read paper');
      readBtn.href = paperUrl;
      readBtn.target = '_blank';
      readBtn.rel = 'noopener noreferrer';
      actions.appendChild(readBtn);
    }
    if (ilrid) {
      const detBtn = el('a', 'dir-btn dir-btn-outline', 'Details');
      detBtn.href = `/researches/?id=${encodeURIComponent(ilrid)}`;
      detBtn.dataset.dirNav = 'true';
      actions.appendChild(detBtn);
    }
    body.appendChild(actions);

    card.appendChild(body);
    grid.appendChild(card);
  });

  container.replaceChildren(grid);
}

function createSoftwareMedia(ilsid, name, category, imageUrl, isDetail = false) {
  const wrap = el('div', isDetail ? 'dir-detail-cover' : 'dir-software-media');
  const validImg = resolveImageSrc(imageUrl, IMAGE_DIRS.softwares);

  const ph = el('div', 'dir-neutral-placeholder');
  if (ilsid) ph.appendChild(el('span', 'dir-chip dir-chip-code', ilsid));
  ph.appendChild(el('div', 'dir-typo-title', name || 'Software Build'));
  if (category) ph.appendChild(el('div', 'dir-category-label', category));

  if (validImg) {
    ph.hidden = true;
    const img = document.createElement('img');
    img.src = validImg;
    img.alt = `Preview of ${name || ilsid || 'software build'}`;
    img.width = 640;
    img.height = 400;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    wrap.append(img, ph);
    attachImgFallback(img, () => {
      img.hidden = true;
      ph.hidden = false;
    });
  } else {
    wrap.appendChild(ph);
  }
  return wrap;
}

function renderSoftwaresList(container, rows, profilesMap) {
  const stack = el('div', 'dir-stack-list');

  rows.forEach((row, idx) => {
    const ilsid = cleanText(row.ilsid);
    const name = cleanText(row.name) || 'Untitled Software';
    const tagline = cleanText(row.tagline);
    const desc = cleanText(row.description);
    const category = cleanText(row.category);
    const status = cleanText(row.status);
    const tech = parseStringArray(row.tech);
    const devIds = normalizeUuidList(row.uid);
    const reviewerIds = normalizeUuidList(row.reviewers);
    const pubDate = formatDate(row.publish_date);
    const openUrl = cleanText(row.url);
    const repoUrl = cleanText(row.repo_url);

    const sec = el('article', `dir-software-section${idx % 2 === 1 ? ' is-alt' : ''}`);
    sec.appendChild(createSoftwareMedia(ilsid, name, category, row.image_url, false));

    const content = el('div', 'dir-software-content');

    const metaRow = el('div', 'dir-meta-row');
    if (ilsid) metaRow.appendChild(el('span', 'dir-chip dir-chip-code', ilsid));
    if (status) metaRow.appendChild(el('span', 'dir-chip dir-chip-status', status));
    if (category) metaRow.appendChild(el('span', 'dir-category-label', category));
    if (row.is_sample === true) metaRow.appendChild(el('span', 'dir-sample-badge', 'SAMPLE'));
    if (metaRow.childNodes.length > 0) content.appendChild(metaRow);

    content.appendChild(el('h2', 'dir-card-serif-title', name));
    if (tagline) content.appendChild(el('div', 'dir-software-tagline', tagline));
    if (desc) content.appendChild(el('p', 'dir-full-prose', desc));

    if (tech.length > 0) {
      const techWrap = el('div', 'dir-chips-wrap');
      tech.forEach(t => techWrap.appendChild(el('span', 'dir-chip', t)));
      content.appendChild(techWrap);
    }

    const statsBox = el('div', 'dir-meta-stats');
    const devNames = devIds.length > 0
      ? devIds.map(id => resolvePerson(profilesMap, id).name).join(', ')
      : 'Contributor';
    statsBox.appendChild(el('div', '', `Developers: ${devNames}`));

    const subPieces = [`Reviewed by ${reviewerIds.length}`];
    if (pubDate) subPieces.push(pubDate);
    if (row.likes !== null && row.likes !== undefined) {
      const lk = Number(row.likes);
      subPieces.push(`${lk} ${lk === 1 ? 'like' : 'likes'}`);
    }
    if (row.comments !== null && row.comments !== undefined) {
      const cm = Number(row.comments);
      subPieces.push(`${cm} ${cm === 1 ? 'comment' : 'comments'}`);
    }
    statsBox.appendChild(el('div', 'dir-stat-inline', subPieces.join(' · ')));
    content.appendChild(statsBox);

    const actions = el('div', 'dir-actions-row');
    if (isHttpUrl(openUrl)) {
      const openBtn = el('a', 'dir-btn dir-btn-primary', 'Open');
      openBtn.href = openUrl;
      openBtn.target = '_blank';
      openBtn.rel = 'noopener noreferrer';
      actions.appendChild(openBtn);
    }
    if (isHttpUrl(repoUrl)) {
      const srcBtn = el('a', 'dir-btn dir-btn-outline', 'Source');
      srcBtn.href = repoUrl;
      srcBtn.target = '_blank';
      srcBtn.rel = 'noopener noreferrer';
      actions.appendChild(srcBtn);
    }
    if (ilsid) {
      const detBtn = el('a', 'dir-btn dir-btn-outline', 'Details');
      detBtn.href = `/softwares/?id=${encodeURIComponent(ilsid)}`;
      detBtn.dataset.dirNav = 'true';
      actions.appendChild(detBtn);
    }
    if (actions.childNodes.length > 0) content.appendChild(actions);

    sec.appendChild(content);
    stack.appendChild(sec);
  });

  container.replaceChildren(stack);
}

function renderCommunitiesList(container, rows, profilesMap) {
  const stack = el('div', 'dir-stack-list');

  rows.forEach(row => {
    const id = cleanText(row.id);
    const name = cleanText(row.name) || 'Community Group';
    const mission = cleanText(row.mission);
    const desc = cleanText(row.description);
    const memberIds = normalizeUuidList(row.m_id);
    const leadIds = [cleanText(row.l_id), cleanText(row.l2_id)].filter(Boolean);
    const observerId = cleanText(row.p_id);
    const bannerSrc = resolveImageSrc(row.image_url, IMAGE_DIRS.communities);

    const sec = el('article', 'dir-community-section');

    if (bannerSrc) {
      const banner = el('div', 'dir-community-banner');
      const img = document.createElement('img');
      img.src = bannerSrc;
      img.alt = `Banner for ${name}`;
      img.width = 840;
      img.height = 360;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      banner.appendChild(img);
      attachImgFallback(img, () => {
        banner.hidden = true;
      });
      sec.appendChild(banner);
    }

    const metaRow = el('div', 'dir-meta-row');
    if (id) metaRow.appendChild(el('span', 'dir-chip dir-chip-code', id));
    if (row.is_sample === true) metaRow.appendChild(el('span', 'dir-sample-badge', 'SAMPLE'));
    metaRow.appendChild(
      el('span', 'dir-stat-inline', `${memberIds.length} ${memberIds.length === 1 ? 'member' : 'members'}`)
    );
    sec.appendChild(metaRow);

    sec.appendChild(el('h2', 'dir-card-serif-title', name));

    if (mission) {
      sec.appendChild(el('blockquote', 'dir-mission-statement', mission));
    }

    if (desc) {
      sec.appendChild(el('p', 'dir-full-prose', desc));
    }

    if (leadIds.length > 0 || observerId) {
      const govRow = el('div', 'dir-governance-row');
      if (leadIds.length > 0) {
        const ledItem = el('div', 'dir-gov-item');
        ledItem.appendChild(el('span', 'dir-gov-label', 'Led by'));
        const leadNames = leadIds.map(lid => resolvePerson(profilesMap, lid).name).join(', ');
        ledItem.appendChild(el('span', '', leadNames));
        govRow.appendChild(ledItem);
      }
      if (observerId) {
        const obsItem = el('div', 'dir-gov-item');
        obsItem.appendChild(el('span', 'dir-gov-label', 'Observed by'));
        obsItem.appendChild(el('span', '', resolvePerson(profilesMap, observerId).name));
        govRow.appendChild(obsItem);
      }
      sec.appendChild(govRow);
    }

    const membersBar = el('div', 'dir-members-bar');
    const avatarRow = el('div', 'dir-avatar-row');
    const shownMembers = memberIds.slice(0, 8);
    shownMembers.forEach(mid => {
      const p = resolvePerson(profilesMap, mid);
      avatarRow.appendChild(createAvatar(p.name, p.photo, 'dir-avatar-sm'));
    });
    if (memberIds.length > 8) {
      avatarRow.appendChild(el('span', 'dir-avatar-more', `+${memberIds.length - 8}`));
    }
    avatarRow.appendChild(
      el('span', 'dir-stat-inline', `${memberIds.length} ${memberIds.length === 1 ? 'member' : 'members'}`)
    );
    membersBar.appendChild(avatarRow);

    if (id) {
      const viewBtn = el('a', 'dir-btn dir-btn-primary', 'View community');
      viewBtn.href = `/communities/?id=${encodeURIComponent(id)}`;
      viewBtn.dataset.dirNav = 'true';
      membersBar.appendChild(viewBtn);
    }

    sec.appendChild(membersBar);
    stack.appendChild(sec);
  });

  container.replaceChildren(stack);
}

/* ==========================================================================
   Detail View Renderers (?id=<id>)
   ========================================================================== */
function createBackLink(basePath, pluralLabel) {
  const row = el('div', 'dir-back-row');
  const back = el('a', 'dir-btn dir-btn-outline', `← Back to all ${pluralLabel}`);
  back.href = basePath;
  back.dataset.dirNav = 'true';
  row.appendChild(back);
  return row;
}

function createPeoplePillsSection(headingText, ids, profilesMap) {
  const sec = el('div', 'dir-detail-section');
  sec.appendChild(el('div', 'dir-detail-heading', headingText));
  const wrap = el('div', 'dir-people-list');
  ids.forEach(id => {
    const p = resolvePerson(profilesMap, id);
    const pill = el('div', 'dir-person-pill');
    pill.appendChild(createAvatar(p.name, p.photo, 'dir-avatar-sm'));
    pill.appendChild(el('span', '', p.name));
    wrap.appendChild(pill);
  });
  sec.appendChild(wrap);
  return sec;
}

function appendPublicProfileArrays(detailCard, prof) {
  if (!prof) return;
  const sections = [
    { key: 'researches', label: 'Researches' },
    { key: 'softwares', label: 'Softwares' },
    { key: 'certificates', label: 'Certificates' },
    { key: 'others', label: 'Other Links & Works' }
  ];

  sections.forEach(({ key, label }) => {
    const raw = prof[key];
    if (!Array.isArray(raw) || raw.length === 0) return;

    const validEntries = [];
    raw.forEach(entry => {
      if (typeof entry === 'string') {
        const s = cleanText(entry);
        if (s) validEntries.push({ text: s, url: isHttpUrl(s) ? s : '' });
      } else if (entry && typeof entry === 'object') {
        const candidateUrl = cleanText(entry.url || entry.link || entry.href || '');
        const candidateTitle = cleanText(entry.title || entry.name || entry.label || candidateUrl);
        if (candidateTitle) {
          validEntries.push({
            text: candidateTitle,
            url: isHttpUrl(candidateUrl) ? candidateUrl : ''
          });
        }
      }
    });

    if (validEntries.length === 0) return;

    const sec = el('div', 'dir-detail-section');
    sec.appendChild(el('div', 'dir-detail-heading', label));
    const ul = el('ul', 'dir-public-list');
    validEntries.forEach(({ text, url }) => {
      const li = el('li');
      if (url) {
        const a = el('a', 'dir-ext-link', text);
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        li.appendChild(a);
      } else {
        li.textContent = text;
      }
      ul.appendChild(li);
    });
    sec.appendChild(ul);
    detailCard.appendChild(sec);
  });
}

function renderLeaderDetail(container, row, cfg) {
  const prof = extractProfile(row.profiles);
  const name = cleanText(row.display_name) || (prof ? cleanText(prof.name) : '') || 'Leader';
  const role = cleanText(row.role);
  const quote = cleanText(row.quote);
  const bio = cleanText(row.bio);
  const resps = parseStringArray(row.responsibilities);
  const directPhoto = cleanText(row.profile_i);
  const profPhoto = prof ? cleanText(prof.photo) : '';
  const rawPhoto = directPhoto || profPhoto;
  const photoSrc = resolveImageSrc(rawPhoto, IMAGE_DIRS.leaders);
  const whatsappHref = formatWhatsappHref(row.whatsapp);

  const wrap = document.createDocumentFragment();
  wrap.appendChild(createBackLink(cfg.basePath, cfg.pluralLabel));

  const card = el('article', 'dir-detail-card');
  const hero = el('div', 'dir-detail-hero has-side-portrait');

  const portraitBox = el('div', 'dir-detail-portrait');
  const fallbackAvatar = createAvatar(name, '', 'dir-avatar-lg', IMAGE_DIRS.leaders, false);
  if (photoSrc) {
    fallbackAvatar.style.display = 'none';
    const img = document.createElement('img');
    img.src = photoSrc;
    img.alt = `Portrait of ${name}`;
    img.width = 140;
    img.height = 140;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    portraitBox.append(img, fallbackAvatar);
    attachImgFallback(
      img,
      () => {
        img.hidden = true;
        fallbackAvatar.style.display = 'inline-flex';
      },
      !directPhoto && Boolean(profPhoto)
    );
  } else {
    portraitBox.appendChild(fallbackAvatar);
  }

  const headCol = el('div');
  headCol.style.minWidth = '0';
  headCol.appendChild(el('h1', 'dir-title', name));
  if (role) {
    const roleEl = el('div', 'dir-category-label', role);
    roleEl.style.marginTop = '6px';
    headCol.appendChild(roleEl);
  }
  if (quote) {
    const qEl = el('p', 'dir-subtitle', `“${quote}”`);
    qEl.style.fontStyle = 'italic';
    headCol.appendChild(qEl);
  }
  if (whatsappHref) {
    const actions = el('div', 'dir-actions-row');
    actions.style.marginTop = '14px';
    const waBtn = el('a', 'dir-btn dir-btn-primary', 'WhatsApp');
    waBtn.href = whatsappHref;
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
    actions.appendChild(waBtn);
    headCol.appendChild(actions);
  }

  hero.append(portraitBox, headCol);
  card.appendChild(hero);

  if (bio) {
    const bioSec = el('div', 'dir-detail-section');
    bioSec.appendChild(el('div', 'dir-detail-heading', 'Biography'));
    bioSec.appendChild(el('p', 'dir-full-prose', bio));
    card.appendChild(bioSec);
  }

  if (resps.length > 0) {
    const respSec = el('div', 'dir-detail-section');
    respSec.appendChild(el('div', 'dir-detail-heading', 'Areas of Responsibility'));
    const ul = el('ul', 'dir-public-list');
    resps.forEach(r => ul.appendChild(el('li', '', r)));
    respSec.appendChild(ul);
    card.appendChild(respSec);
  }

  const statDefs = [
    { key: 'r_published', label: 'Researches Published' },
    { key: 's_published', label: 'Softwares Published' },
    { key: 's_invite_count', label: 'Students Invited' },
    { key: 't_invite_count', label: 'Teachers Invited' },
    { key: 'c_invite_count', label: 'Institutes Invited' },
    { key: 'skill_score', label: 'Skill Score' }
  ];
  const presentStats = statDefs.filter(d => row[d.key] !== undefined && row[d.key] !== null);
  if (presentStats.length > 0) {
    const statsSec = el('div', 'dir-detail-section');
    statsSec.appendChild(el('div', 'dir-detail-heading', 'Contributions & Metrics'));
    const sGrid = el('div', 'dir-stats-grid');
    presentStats.forEach(({ key, label }) => {
      const box = el('div', 'dir-stat-box');
      box.appendChild(el('div', 'dir-stat-val', String(row[key])));
      box.appendChild(el('div', 'dir-stat-lbl', label));
      sGrid.appendChild(box);
    });
    statsSec.appendChild(sGrid);
    card.appendChild(statsSec);
  }

  wrap.appendChild(card);
  container.replaceChildren(wrap);
}

function renderProfileEntityDetail(container, row, cfg, institutionText) {
  const prof = extractProfile(row.profiles);
  const name = (prof ? cleanText(prof.name) : '') || cfg.singularLabel;
  const photo = prof ? cleanText(prof.photo) : '';
  const eiin = cleanText(row.eiin);

  const wrap = document.createDocumentFragment();
  wrap.appendChild(createBackLink(cfg.basePath, cfg.pluralLabel));

  const card = el('article', 'dir-detail-card');
  const hero = el('div', 'dir-detail-hero has-side-portrait');
  hero.appendChild(createAvatar(name, photo, 'dir-avatar-lg', cfg.imageDir, true));

  const info = el('div');
  info.style.minWidth = '0';
  info.appendChild(el('div', 'dir-category-label', cfg.singularLabel));
  const titleEl = el('h1', 'dir-title', name);
  titleEl.style.marginTop = '4px';
  info.appendChild(titleEl);

  if (cfg.table === 'institutes') {
    if (eiin) {
      const eiinEl = el('div', 'dir-compact-eiin', `EIIN ${eiin}`);
      eiinEl.style.fontSize = '13.5px';
      eiinEl.style.marginTop = '8px';
      info.appendChild(eiinEl);
    }
  } else if (institutionText) {
    info.appendChild(el('p', 'dir-subtitle', institutionText));
  }

  hero.appendChild(info);
  card.appendChild(hero);

  appendPublicProfileArrays(card, prof);

  wrap.appendChild(card);
  container.replaceChildren(wrap);
}

function renderResearchDetail(container, row, cfg, profilesMap) {
  const ilrid = cleanText(row.ilrid);
  const title = cleanText(row.title) || 'Untitled Research';
  const abstract = cleanText(row.abstract);
  const category = cleanText(row.category);
  const keywords = parseStringArray(row.keywords);
  const authorIds = normalizeUuidList(row.uid);
  const reviewerIds = normalizeUuidList(row.reviewers);
  const pubDate = formatDate(row.publish_date);
  const likes = Number(row.likes ?? 0);
  const comments = Number(row.comments ?? 0);
  const paperUrl = cleanText(row.paper_url);

  const wrap = document.createDocumentFragment();
  wrap.appendChild(createBackLink(cfg.basePath, cfg.pluralLabel));

  const card = el('article', 'dir-detail-card');
  card.appendChild(createResearchCover(ilrid, category, title, row.cover_url, true));

  const metaRow = el('div', 'dir-meta-row');
  if (ilrid) metaRow.appendChild(el('span', 'dir-chip dir-chip-code', ilrid));
  if (category) metaRow.appendChild(el('span', 'dir-category-label', category));
  if (row.is_sample === true) metaRow.appendChild(el('span', 'dir-sample-badge', 'SAMPLE'));
  if (metaRow.childNodes.length > 0) card.appendChild(metaRow);

  card.appendChild(el('h1', 'dir-title', title));

  const statPieces = [`Reviewed by ${reviewerIds.length}`];
  if (pubDate) statPieces.push(`Published ${pubDate}`);
  statPieces.push(`${likes} ${likes === 1 ? 'like' : 'likes'}`);
  statPieces.push(`${comments} ${comments === 1 ? 'comment' : 'comments'}`);
  card.appendChild(el('div', 'dir-stat-inline', statPieces.join(' · ')));

  if (isHttpUrl(paperUrl)) {
    const actions = el('div', 'dir-actions-row');
    const readBtn = el('a', 'dir-btn dir-btn-primary', 'Read paper');
    readBtn.href = paperUrl;
    readBtn.target = '_blank';
    readBtn.rel = 'noopener noreferrer';
    actions.appendChild(readBtn);
    card.appendChild(actions);
  }

  if (abstract) {
    const absSec = el('div', 'dir-detail-section');
    absSec.appendChild(el('div', 'dir-detail-heading', 'Abstract'));
    absSec.appendChild(el('p', 'dir-full-prose', abstract));
    card.appendChild(absSec);
  }

  if (keywords.length > 0) {
    const kwSec = el('div', 'dir-detail-section');
    kwSec.appendChild(el('div', 'dir-detail-heading', 'Keywords'));
    const kwWrap = el('div', 'dir-chips-wrap');
    keywords.forEach(k => kwWrap.appendChild(el('span', 'dir-chip', k)));
    kwSec.appendChild(kwWrap);
    card.appendChild(kwSec);
  }

  if (authorIds.length > 0) {
    card.appendChild(createPeoplePillsSection('Authors', authorIds, profilesMap));
  }
  if (reviewerIds.length > 0) {
    card.appendChild(createPeoplePillsSection('Reviewers', reviewerIds, profilesMap));
  }

  wrap.appendChild(card);
  container.replaceChildren(wrap);
}

function renderSoftwareDetail(container, row, cfg, profilesMap) {
  const ilsid = cleanText(row.ilsid);
  const name = cleanText(row.name) || 'Untitled Software';
  const tagline = cleanText(row.tagline);
  const desc = cleanText(row.description);
  const category = cleanText(row.category);
  const status = cleanText(row.status);
  const tech = parseStringArray(row.tech);
  const devIds = normalizeUuidList(row.uid);
  const reviewerIds = normalizeUuidList(row.reviewers);
  const pubDate = formatDate(row.publish_date);
  const openUrl = cleanText(row.url);
  const repoUrl = cleanText(row.repo_url);

  const wrap = document.createDocumentFragment();
  wrap.appendChild(createBackLink(cfg.basePath, cfg.pluralLabel));

  const card = el('article', 'dir-detail-card');
  card.appendChild(createSoftwareMedia(ilsid, name, category, row.image_url, true));

  const metaRow = el('div', 'dir-meta-row');
  if (ilsid) metaRow.appendChild(el('span', 'dir-chip dir-chip-code', ilsid));
  if (status) metaRow.appendChild(el('span', 'dir-chip dir-chip-status', status));
  if (category) metaRow.appendChild(el('span', 'dir-category-label', category));
  if (row.is_sample === true) metaRow.appendChild(el('span', 'dir-sample-badge', 'SAMPLE'));
  if (metaRow.childNodes.length > 0) card.appendChild(metaRow);

  card.appendChild(el('h1', 'dir-title', name));
  if (tagline) card.appendChild(el('div', 'dir-software-tagline', tagline));

  const statPieces = [`Reviewed by ${reviewerIds.length}`];
  if (pubDate) statPieces.push(`Published ${pubDate}`);
  if (row.likes !== null && row.likes !== undefined) {
    const lk = Number(row.likes);
    statPieces.push(`${lk} ${lk === 1 ? 'like' : 'likes'}`);
  }
  if (row.comments !== null && row.comments !== undefined) {
    const cm = Number(row.comments);
    statPieces.push(`${cm} ${cm === 1 ? 'comment' : 'comments'}`);
  }
  card.appendChild(el('div', 'dir-stat-inline', statPieces.join(' · ')));

  const actions = el('div', 'dir-actions-row');
  if (isHttpUrl(openUrl)) {
    const openBtn = el('a', 'dir-btn dir-btn-primary', 'Open');
    openBtn.href = openUrl;
    openBtn.target = '_blank';
    openBtn.rel = 'noopener noreferrer';
    actions.appendChild(openBtn);
  }
  if (isHttpUrl(repoUrl)) {
    const srcBtn = el('a', 'dir-btn dir-btn-outline', 'Source');
    srcBtn.href = repoUrl;
    srcBtn.target = '_blank';
    srcBtn.rel = 'noopener noreferrer';
    actions.appendChild(srcBtn);
  }
  if (actions.childNodes.length > 0) card.appendChild(actions);

  if (desc) {
    const descSec = el('div', 'dir-detail-section');
    descSec.appendChild(el('div', 'dir-detail-heading', 'Overview'));
    descSec.appendChild(el('p', 'dir-full-prose', desc));
    card.appendChild(descSec);
  }

  if (tech.length > 0) {
    const techSec = el('div', 'dir-detail-section');
    techSec.appendChild(el('div', 'dir-detail-heading', 'Technologies'));
    const techWrap = el('div', 'dir-chips-wrap');
    tech.forEach(t => techWrap.appendChild(el('span', 'dir-chip', t)));
    techSec.appendChild(techWrap);
    card.appendChild(techSec);
  }

  if (devIds.length > 0) {
    card.appendChild(createPeoplePillsSection('Developers', devIds, profilesMap));
  }
  if (reviewerIds.length > 0) {
    card.appendChild(createPeoplePillsSection('Reviewers', reviewerIds, profilesMap));
  }

  wrap.appendChild(card);
  container.replaceChildren(wrap);
}

function renderCommunityDetail(container, row, cfg, profilesMap) {
  const id = cleanText(row.id);
  const name = cleanText(row.name) || 'Community Group';
  const mission = cleanText(row.mission);
  const desc = cleanText(row.description);
  const memberIds = normalizeUuidList(row.m_id);
  const leadIds = [cleanText(row.l_id), cleanText(row.l2_id)].filter(Boolean);
  const observerId = cleanText(row.p_id);
  const bannerSrc = resolveImageSrc(row.image_url, IMAGE_DIRS.communities);

  const wrap = document.createDocumentFragment();
  wrap.appendChild(createBackLink(cfg.basePath, cfg.pluralLabel));

  const card = el('article', 'dir-detail-card');

  if (bannerSrc) {
    const banner = el('div', 'dir-community-banner');
    const img = document.createElement('img');
    img.src = bannerSrc;
    img.alt = `Banner for ${name}`;
    img.width = 840;
    img.height = 360;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    banner.appendChild(img);
    attachImgFallback(img, () => {
      banner.hidden = true;
    });
    card.appendChild(banner);
  }

  const metaRow = el('div', 'dir-meta-row');
  if (id) metaRow.appendChild(el('span', 'dir-chip dir-chip-code', id));
  if (row.is_sample === true) metaRow.appendChild(el('span', 'dir-sample-badge', 'SAMPLE'));
  metaRow.appendChild(
    el('span', 'dir-stat-inline', `${memberIds.length} ${memberIds.length === 1 ? 'member' : 'members'}`)
  );
  card.appendChild(metaRow);

  card.appendChild(el('h1', 'dir-title', name));

  if (mission) {
    card.appendChild(el('blockquote', 'dir-mission-statement', mission));
  }

  if (desc) {
    const descSec = el('div', 'dir-detail-section');
    descSec.appendChild(el('div', 'dir-detail-heading', 'Purpose & Activities'));
    descSec.appendChild(el('p', 'dir-full-prose', desc));
    card.appendChild(descSec);
  }

  if (leadIds.length > 0) {
    card.appendChild(createPeoplePillsSection('Led By', leadIds, profilesMap));
  }
  if (observerId) {
    card.appendChild(createPeoplePillsSection('Observed By', [observerId], profilesMap));
  }
  if (memberIds.length > 0) {
    card.appendChild(createPeoplePillsSection(`Members (${memberIds.length})`, memberIds, profilesMap));
  }

  wrap.appendChild(card);
  container.replaceChildren(wrap);
}

/* ==========================================================================
   Page Bootstrap & State Coordinator
   ========================================================================== */
function initDirectoryPage() {
  const root = document.getElementById('dir-root');
  if (!root) return;

  const dirKey = root.dataset.directory || '';
  const cfg = DIRECTORY_CONFIGS[dirKey];
  if (!cfg) return;

  const pageHeader = document.getElementById('dir-page-header');
  const searchForm = document.getElementById('dir-search-form');
  const searchBySelect = document.getElementById('dir-search-by');
  const searchInput = document.getElementById('dir-search-input');
  const searchClearBtn = document.getElementById('dir-search-clear');
  const summaryBar = document.getElementById('dir-summary');
  const pagTop = document.getElementById('dir-pagination-top');
  const pagBottom = document.getElementById('dir-pagination-bottom');
  const listSlot = document.getElementById('dir-list-slot');
  const detailSlot = document.getElementById('dir-detail-slot');
  const scrollTarget = document.getElementById('dir-scroll-anchor') || root;

  let activeRequestId = 0;

  const getValidSearchField = (rawBy) => {
    const fields = Array.isArray(cfg.searchFields) ? cfg.searchFields : [];
    if (fields.length === 0) return null;
    const cleaned = cleanText(rawBy);
    return fields.find(f => f.value === cleaned) || fields[0];
  };

  const syncSearchPlaceholder = () => {
    if (!searchBySelect || !searchInput || !Array.isArray(cfg.searchFields)) return;
    const field = getValidSearchField(searchBySelect.value);
    if (field && field.placeholder) {
      searchInput.placeholder = field.placeholder;
    }
  };

  const buildListUrl = ({ page = 1, searchBy = '', searchQuery = '' } = {}) => {
    const params = new URLSearchParams();
    const q = cleanText(searchQuery);
    if (q && Array.isArray(cfg.searchFields) && cfg.searchFields.length > 0) {
      const field = getValidSearchField(searchBy);
      if (field) params.set('by', field.value);
      params.set('q', q);
    }
    if (page > 1) {
      params.set('page', String(page));
    }
    const qs = params.toString();
    return qs ? `${cfg.basePath}?${qs}` : cfg.basePath;
  };

  const scrollToListTop = () => {
    const rect = scrollTarget.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top - 84;
    window.scrollTo({ top: Math.max(0, absoluteTop), behavior: 'smooth' });
  };

  const navigateUrl = (nextUrl, shouldScroll = true) => {
    window.history.pushState({}, '', nextUrl);
    if (shouldScroll) scrollToListTop();
    loadFromCurrentUrl();
  };

  const clearSearch = () => {
    if (searchInput) searchInput.value = '';
    if (searchClearBtn) searchClearBtn.hidden = true;
    navigateUrl(cfg.basePath, false);
  };

  if (searchForm && searchBySelect && searchInput) {
    syncSearchPlaceholder();

    searchBySelect.addEventListener('change', () => {
      syncSearchPlaceholder();
      const currentVal = cleanText(searchInput.value);
      if (currentVal) {
        navigateUrl(
          buildListUrl({ page: 1, searchBy: searchBySelect.value, searchQuery: currentVal }),
          false
        );
      } else {
        searchInput.focus();
      }
    });

    searchInput.addEventListener('input', () => {
      if (searchClearBtn) {
        const params = new URLSearchParams(window.location.search);
        const hasUrlQuery = Boolean(cleanText(params.get('q')));
        searchClearBtn.hidden = !cleanText(searchInput.value) && !hasUrlQuery;
      }
    });

    searchInput.addEventListener('search', () => {
      const params = new URLSearchParams(window.location.search);
      if (!cleanText(searchInput.value) && cleanText(params.get('q'))) {
        clearSearch();
      }
    });

    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = cleanText(searchInput.value);
      if (!q) {
        clearSearch();
        return;
      }
      navigateUrl(
        buildListUrl({ page: 1, searchBy: searchBySelect.value, searchQuery: q }),
        false
      );
    });

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        clearSearch();
        searchInput.focus();
      });
    }
  }

  root.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-dir-nav="true"]');
    if (!link) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const url = new URL(link.href, window.location.origin);
    if (url.pathname === window.location.pathname) {
      e.preventDefault();
      navigateUrl(url.pathname + url.search, true);
    }
  });

  window.addEventListener('popstate', () => {
    loadFromCurrentUrl();
  });

  async function loadDetailView(itemId, reqId) {
    if (pageHeader) pageHeader.hidden = true;
    if (searchForm) searchForm.hidden = true;
    if (summaryBar) summaryBar.hidden = true;
    pagTop.hidden = true;
    pagBottom.hidden = true;
    listSlot.hidden = true;
    detailSlot.hidden = false;

    renderLoadingSkeleton(detailSlot, cfg);

    if (cfg.idIsUuid && !UUID_RE.test(itemId)) {
      renderEmptyState(
        detailSlot,
        'Record not found',
        `No ${cfg.singularLabel} matches the requested identifier.`
      );
      detailSlot.prepend(createBackLink(cfg.basePath, cfg.pluralLabel));
      return;
    }

    try {
      const query = `${cfg.table}?select=${cfg.detailSelect}&${cfg.idColumn}=eq.${encodeURIComponent(itemId)}&limit=1`;
      const { rows } = await sbFetch(query, { countExact: false });
      if (reqId !== activeRequestId) return;

      if (rows.length === 0) {
        renderEmptyState(
          detailSlot,
          'Record not found',
          `This ${cfg.singularLabel} entry does not exist or is not publicly available.`
        );
        detailSlot.prepend(createBackLink(cfg.basePath, cfg.pluralLabel));
        return;
      }

      const row = rows[0];

      if (dirKey === 'leaders') {
        renderLeaderDetail(detailSlot, row, cfg);
      } else if (dirKey === 'students' || dirKey === 'teachers') {
        const instMap = await fetchInstitutesMap([row.eiin]);
        if (reqId !== activeRequestId) return;
        const instText = resolveInstitutionText(row.eiin, instMap);
        renderProfileEntityDetail(detailSlot, row, cfg, instText);
      } else if (dirKey === 'institutes') {
        renderProfileEntityDetail(detailSlot, row, cfg, '');
      } else if (dirKey === 'researches') {
        const uuids = [...normalizeUuidList(row.uid), ...normalizeUuidList(row.reviewers)];
        const profilesMap = await fetchProfilesMap(uuids);
        if (reqId !== activeRequestId) return;
        renderResearchDetail(detailSlot, row, cfg, profilesMap);
      } else if (dirKey === 'softwares') {
        const uuids = [...normalizeUuidList(row.uid), ...normalizeUuidList(row.reviewers)];
        const profilesMap = await fetchProfilesMap(uuids);
        if (reqId !== activeRequestId) return;
        renderSoftwareDetail(detailSlot, row, cfg, profilesMap);
      } else if (dirKey === 'communities') {
        const uuids = [
          ...normalizeUuidList(row.m_id),
          cleanText(row.l_id),
          cleanText(row.l2_id),
          cleanText(row.p_id)
        ];
        const profilesMap = await fetchProfilesMap(uuids);
        if (reqId !== activeRequestId) return;
        renderCommunityDetail(detailSlot, row, cfg, profilesMap);
      }
    } catch (err) {
      if (reqId !== activeRequestId) return;
      console.error(err);
      renderErrorState(
        detailSlot,
        `Could not fetch this ${cfg.singularLabel} from the database. Please check your connection and try again.`,
        () => loadFromCurrentUrl()
      );
      detailSlot.prepend(createBackLink(cfg.basePath, cfg.pluralLabel));
    }
  }

  async function loadListView(requestedPage, searchByParam, searchQueryParam, reqId) {
    if (pageHeader) pageHeader.hidden = false;
    if (searchForm) searchForm.hidden = false;
    detailSlot.hidden = true;
    detailSlot.replaceChildren();
    listSlot.hidden = false;
    pagTop.hidden = true;
    pagBottom.hidden = true;
    if (summaryBar) summaryBar.hidden = true;

    const activeField = getValidSearchField(searchByParam);
    const activeBy = activeField ? activeField.value : '';
    const activeQuery = activeField ? cleanText(searchQueryParam) : '';

    if (searchBySelect && activeField) {
      searchBySelect.value = activeField.value;
      syncSearchPlaceholder();
    }
    if (searchInput) {
      searchInput.value = activeQuery;
    }
    if (searchClearBtn) {
      searchClearBtn.hidden = !activeQuery;
    }

    renderLoadingSkeleton(listSlot, cfg);

    const page = Math.max(1, requestedPage);
    const offset = (page - 1) * cfg.pageSize;

    try {
      const { rows, total } = await fetchDirectoryListPage(dirKey, cfg, {
        page,
        searchBy: activeBy,
        searchQuery: activeQuery
      });
      if (reqId !== activeRequestId) return;

      const totalPages = Math.max(1, Math.ceil(total / cfg.pageSize));

      if (total > 0 && page > totalPages) {
        navigateUrl(
          buildListUrl({ page: totalPages, searchBy: activeBy, searchQuery: activeQuery }),
          false
        );
        return;
      }

      if (total === 0 || rows.length === 0) {
        if (summaryBar) summaryBar.hidden = true;
        pagTop.hidden = true;
        pagBottom.hidden = true;
        if (activeQuery && activeField) {
          renderEmptyState(
            listSlot,
            `No matching ${cfg.pluralLabel} found`,
            `No ${cfg.pluralLabel} matched “${activeQuery}” under ${activeField.label}. Try another search term or filter.`,
            'Clear search',
            () => clearSearch()
          );
        } else {
          renderEmptyState(
            listSlot,
            `No ${cfg.pluralLabel} published yet`,
            `Verified ${cfg.pluralLabel} will appear here automatically as records are added to the directory.`
          );
        }
        return;
      }

      if (dirKey === 'leaders') {
        renderLeadersList(listSlot, rows);
      } else if (dirKey === 'teachers') {
        const instMap = await fetchInstitutesMap(rows.map(r => r.eiin));
        if (reqId !== activeRequestId) return;
        renderMembersCompactList(listSlot, rows, instMap, cfg, 'Teacher');
      } else if (dirKey === 'students') {
        const instMap = await fetchInstitutesMap(rows.map(r => r.eiin));
        if (reqId !== activeRequestId) return;
        renderMembersCompactList(listSlot, rows, instMap, cfg, 'Student');
      } else if (dirKey === 'institutes') {
        renderInstitutesList(listSlot, rows);
      } else if (dirKey === 'researches') {
        const uuids = [];
        rows.forEach(r => {
          uuids.push(...normalizeUuidList(r.uid), ...normalizeUuidList(r.reviewers));
        });
        const profilesMap = await fetchProfilesMap(uuids);
        if (reqId !== activeRequestId) return;
        renderResearchesList(listSlot, rows, profilesMap);
      } else if (dirKey === 'softwares') {
        const uuids = [];
        rows.forEach(r => {
          uuids.push(...normalizeUuidList(r.uid), ...normalizeUuidList(r.reviewers));
        });
        const profilesMap = await fetchProfilesMap(uuids);
        if (reqId !== activeRequestId) return;
        renderSoftwaresList(listSlot, rows, profilesMap);
      } else if (dirKey === 'communities') {
        const uuids = [];
        rows.forEach(r => {
          uuids.push(
            ...normalizeUuidList(r.m_id),
            cleanText(r.l_id),
            cleanText(r.l2_id),
            cleanText(r.p_id)
          );
        });
        const profilesMap = await fetchProfilesMap(uuids);
        if (reqId !== activeRequestId) return;
        renderCommunitiesList(listSlot, rows, profilesMap);
      }

      if (summaryBar) {
        const startNum = offset + 1;
        const endNum = Math.min(total, offset + rows.length);
        const baseSummary = `Showing ${startNum}–${endNum} of ${total} ${total === 1 ? cfg.singularLabel : cfg.pluralLabel}`;
        summaryBar.textContent =
          activeQuery && activeField
            ? `${baseSummary} matching “${activeQuery}” (${activeField.label})`
            : baseSummary;
        summaryBar.hidden = false;
      }

      const handlePageChange = (nextPage) => {
        navigateUrl(
          buildListUrl({ page: nextPage, searchBy: activeBy, searchQuery: activeQuery }),
          true
        );
      };

      renderPaginationInto(pagTop, page, totalPages, handlePageChange);
      renderPaginationInto(pagBottom, page, totalPages, handlePageChange);
    } catch (err) {
      if (reqId !== activeRequestId) return;
      console.error(err);
      pagTop.hidden = true;
      pagBottom.hidden = true;
      if (summaryBar) summaryBar.hidden = true;
      renderErrorState(
        listSlot,
        `Could not load ${cfg.pluralLabel} from the database. Please check your connection and try again.`,
        () => loadFromCurrentUrl()
      );
    }
  }

  function loadFromCurrentUrl() {
    const reqId = ++activeRequestId;
    const params = new URLSearchParams(window.location.search);
    const idParam = cleanText(params.get('id'));
    if (idParam) {
      loadDetailView(idParam, reqId);
    } else {
      const pageNum = parseInt(params.get('page') || '1', 10);
      const searchBy = cleanText(params.get('by'));
      const searchQuery = cleanText(params.get('q'));
      loadListView(
        Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum,
        searchBy,
        searchQuery,
        reqId
      );
    }
  }

  loadFromCurrentUrl();
}

document.addEventListener('DOMContentLoaded', initDirectoryPage);
