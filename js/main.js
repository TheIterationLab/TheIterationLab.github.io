import {
  RESEARCH_PUBLICATIONS,
  SOFTWARE_BUILDS,
  COLLEGE_PARTNERS,
  TOP_LEADERS,
  TEACHER_PROFILES,
  STUDENT_PROFILES,
  LAB_EVENTS,
  POLICIES
} from './data.js';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  FOUNDER_LEADER_DETAIL_URL,
  FOUNDER_PORTFOLIO_URL,
  FOUNDER_PROFILE_URL,
  WHATSAPP_URL,
  WHATSAPP_NUMBER,
  LEADER_APPLICATION_WHATSAPP_URL,
  IMAGE_DIRS
} from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  if (LEADER_APPLICATION_WHATSAPP_URL) {
    document.querySelectorAll('[data-leader-apply-link]').forEach((el) => {
      el.setAttribute('href', LEADER_APPLICATION_WHATSAPP_URL);
    });
  }

  renderPublications();
  renderSoftware();
  renderPartners();
  renderLeaders();
  renderTeachers();
  renderStudents();
  renderEvents('upcoming');
  renderPolicies();

  initShelfControls();
  initEventTabs();
  initContactForm();
  initMobileNav();
  initScrollHeader();
  initSearchModal();
  initDetailModal();
});

// Helper: safe text escape
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getInitials(name) {
  const cleaned = String(name || '').trim();
  if (!cleaned) return '--';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();
  }
  const first = Array.from(parts[0])[0] || '';
  const last = Array.from(parts[parts.length - 1])[0] || '';
  return (first + last).toUpperCase();
}

/* ==========================================================================
   6. Research Works & Publications Shelf
   ========================================================================== */
function renderPublications() {
  const track = document.getElementById('publications-track');
  if (!track) return;

  const cardsHtml = RESEARCH_PUBLICATIONS.map(item => `
    <article class="shelf-card" aria-label="${esc(item.title)}">
      <div>
        <div class="card-thumb">
          <svg width="100%" height="100%" viewBox="0 0 280 175" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="280" height="175" fill="#F8F9FA"/>
            <line x1="20" y1="35" x2="160" y2="35" stroke="#E5E7EB" stroke-width="2"/>
            <line x1="20" y1="50" x2="220" y2="50" stroke="#E5E7EB" stroke-width="2"/>
            <line x1="20" y1="65" x2="200" y2="65" stroke="#E5E7EB" stroke-width="2"/>
            <circle cx="210" cy="115" r="32" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="3 3"/>
            <line x1="180" y1="115" x2="240" y2="115" stroke="#CBD5E1" stroke-width="1.5"/>
            <line x1="210" y1="85" x2="210" y2="145" stroke="#CBD5E1" stroke-width="1.5"/>
            <path d="M 30 135 L 70 95 L 110 120 L 160 80" stroke="#0047AB" stroke-width="2" fill="none"/>
            <circle cx="160" cy="80" r="3" fill="#FF7A00"/>
          </svg>
          <span style="position:absolute; top:8px; left:8px; font-size:10px; font-weight:700; background:#FEF3C7; color:#92400E; padding:2px 6px; border-radius:3px;">SAMPLE</span>
        </div>
        <div class="card-category">${esc(item.category)}</div>
        <h3 class="card-title">${esc(item.title)}</h3>
        <p class="card-desc">${esc(item.abstract)}</p>
      </div>
      <div>
        <div class="card-meta">
          <div><strong>Authors:</strong> ${esc(item.authors)}</div>
          <div>${esc(item.institution)} · ${esc(item.date)}</div>
        </div>
        <button type="button" class="card-link open-paper-btn" data-id="${item.id}">Read research →</button>
      </div>
    </article>
  `).join('');

  // Final distinctive dark Explore All card with 2 buttons
  const darkCard = `
    <div class="shelf-card-dark">
      <div class="shelf-dark-top">
        <div class="shelf-dark-icon">
          <img src="/public/assets/aistudio/iteration-lab-icon-jetspiral_10af4d29.png" alt="Spiral icon">
        </div>
        <h3 class="shelf-dark-title">Explore All Research & Journals</h3>
        <p class="shelf-dark-desc">Search through peer-reviewed papers, experimental datasets, and student preprints across all disciplines.</p>
      </div>
      <div class="shelf-dark-buttons">
        <a href="/researches/" class="btn btn-orange">Explore Research Archives</a>
        <a href="login.html" class="btn btn-dark">Publish your papers</a>
      </div>
    </div>
  `;

  track.innerHTML = cardsHtml + darkCard;
}

/* ==========================================================================
   7. Software Builds Shelf
   ========================================================================== */
function renderSoftware() {
  const track = document.getElementById('software-track');
  if (!track) return;

  const cardsHtml = SOFTWARE_BUILDS.map(item => `
    <article class="shelf-card" aria-label="${esc(item.name)}">
      <div>
        <div class="card-thumb">
          <svg width="100%" height="100%" viewBox="0 0 280 175" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="280" height="175" fill="#181920"/>
            <rect x="20" y="25" width="240" height="125" rx="4" fill="#0A0A0C" stroke="#2B2C38"/>
            <circle cx="36" cy="40" r="4" fill="#EF4444"/>
            <circle cx="48" cy="40" r="4" fill="#F59E0B"/>
            <circle cx="60" cy="40" r="4" fill="#10B981"/>
            <path d="M 35 70 L 65 70 M 75 70 L 140 70 M 35 90 L 110 90 M 35 110 L 85 110" stroke="#4B5563" stroke-width="2" stroke-linecap="round"/>
            <path d="M 180 75 L 230 115 M 230 75 L 180 115" stroke="#FF7A00" stroke-width="1.5" stroke-dasharray="2 2"/>
          </svg>
          <span style="position:absolute; top:8px; left:8px; font-size:10px; font-weight:700; background:#FEF3C7; color:#92400E; padding:2px 6px; border-radius:3px;">SAMPLE</span>
          <span style="position:absolute; bottom:8px; right:8px; font-size:10px; font-weight:600; background:rgba(0,0,0,0.8); color:#A7F3D0; padding:2px 6px; border-radius:3px;">${esc(item.status)}</span>
        </div>
        <div class="card-category">Open Source Build</div>
        <h3 class="card-title">${esc(item.name)}</h3>
        <p class="card-desc">${esc(item.description)}</p>
        <div style="display:flex; flex-wrap:wrap; gap:5px; margin: 8px 0 14px;">
          ${item.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}
        </div>
      </div>
      <div>
        <div class="card-meta">
          <div><strong>Team / Creator:</strong> ${esc(item.team)}</div>
        </div>
        <button type="button" class="card-link open-sw-btn" data-id="${item.id}">Explore project →</button>
      </div>
    </article>
  `).join('');

  const darkCard = `
    <div class="shelf-card-dark">
      <div class="shelf-dark-top">
        <div class="shelf-dark-icon">
          <img src="/public/assets/aistudio/iteration-lab-icon-jetspiral_10af4d29.png" alt="Spiral icon">
        </div>
        <h3 class="shelf-dark-title">Explore All Software Builds</h3>
        <p class="shelf-dark-desc">Browse in-browser tools, firmware repositories, hardware visualizers, and student code libraries.</p>
      </div>
      <div class="shelf-dark-buttons">
        <a href="/softwares/" class="btn btn-orange">Explore Software Registries</a>
        <a href="login.html" class="btn btn-dark">Publish your Softwares</a>
      </div>
    </div>
  `;

  track.innerHTML = cardsHtml + darkCard;
}

/* ==========================================================================
   8. College Partners Shelf
   ========================================================================== */
function renderPartners() {
  const track = document.getElementById('partners-track');
  if (!track) return;

  const cardsHtml = COLLEGE_PARTNERS.map(item => `
    <article class="shelf-card" aria-label="${esc(item.name)}">
      <div>
        <div class="card-thumb" style="aspect-ratio: 16/9; background:#FAFBFD;">
          <div style="font-family:var(--font-serif); font-size:16px; font-weight:700; color:#374151; text-align:center; padding:12px;">
            ${esc(item.name)}
          </div>
          <span style="position:absolute; top:8px; left:8px; font-size:10px; font-weight:700; background:#FEF3C7; color:#92400E; padding:2px 6px; border-radius:3px;">SAMPLE</span>
        </div>
        <div style="margin-bottom:8px;">
          <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:4px; ${item.status.includes('Confirmed') ? 'background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0;' : 'background:#F3F4F6; color:#4B5563; border:1px solid #E5E7EB;'}">
            ${esc(item.status)}
          </span>
        </div>
        <h3 class="card-title">${esc(item.name)}</h3>
        <p class="card-desc">${esc(item.description)}</p>
      </div>
      <div>
        <div class="card-meta">
          <div><strong>Location:</strong> ${esc(item.location)}</div>
        </div>
        <a href="#contact" class="card-link">Partner inquiry →</a>
      </div>
    </article>
  `).join('');

  const darkCard = `
    <div class="shelf-card-dark">
      <div class="shelf-dark-top">
        <div class="shelf-dark-icon">
          <img src="/public/assets/aistudio/iteration-lab-icon-jetspiral_10af4d29.png" alt="Spiral icon">
        </div>
        <h3 class="shelf-dark-title">Explore All Partners</h3>
        <p class="shelf-dark-desc">Connect your high school, college, or university lab with our open publication network.</p>
      </div>
      <div class="shelf-dark-buttons">
        <a href="/institutes/" class="btn btn-orange">Explore All College Partners</a>
        <a href="#contact" class="btn btn-dark">Join as A Partner</a>
      </div>
    </div>
  `;

  track.innerHTML = cardsHtml + darkCard;
}

/* ==========================================================================
   9. Top Leaders: Supabase REST Loader + Stationary Layout
   ========================================================================== */
function extractEmbeddedProfile(profilesField) {
  if (Array.isArray(profilesField)) {
    return profilesField[0] || null;
  }
  if (profilesField && typeof profilesField === 'object') {
    return profilesField;
  }
  return null;
}

function cleanStringField(val) {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return '';
  return s;
}

function normalizeSitePathOrUrl(val) {
  const s = cleanStringField(val).replace(/\\/g, '/');
  if (!s) return '';
  if (/^(https?:\/\/|data:|\/)/i.test(s)) return s;
  return `/${s.replace(/^\.?\//, '')}`;
}

function resolveImageSrc(val, defaultDir = IMAGE_DIRS.leaders) {
  const raw = cleanStringField(val).replace(/\\/g, '/');
  if (!raw) return '';
  if (/^https?:\/\/\S+$/i.test(raw)) return raw;
  if (raw.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return '';

  const fixedRaw = raw.replace(/\/leaders\/ing\//gi, '/leaders/img/');
  const trimmed = fixedRaw.replace(/^\.?\/+/, '');
  if (!trimmed) return '';

  const normDir = defaultDir
    ? `/${defaultDir.replace(/^\/+|\/+$/g, '')}/`
    : '/';

  // Filename only (e.g. "Arik.webp") -> prepend defaultDir ("/leaders/img/Arik.webp")
  if (!trimmed.includes('/')) {
    return `${normDir}${trimmed}`;
  }

  // Relative "img/filename.ext" -> "<defaultDir>filename.ext"
  if (/^img\/[^/]+$/i.test(trimmed) && defaultDir) {
    return `${normDir}${trimmed.slice(4)}`;
  }

  return `/${trimmed}`;
}

function normalizeExternalUrl(val) {
  const s = cleanStringField(val);
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return s;
  return `https://${s}`;
}

function resolveWhatsappHref() {
  const raw = cleanStringField(WHATSAPP_URL) || cleanStringField(WHATSAPP_NUMBER);
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^wa\.me\//i.test(raw)) return `https://${raw}`;
  const handle = raw.replace(/^[@+\s]+/, '');
  return handle ? `https://wa.me/${handle}` : '';
}

function resolveMemberWhatsappHref(val) {
  const raw = cleanStringField(val);
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^wa\.me\/\S+$/i.test(raw)) return `https://${raw}`;
  const cleaned = raw.replace(/^[@+\s]+/, '').replace(/[\s()-]/g, '');
  return cleaned ? `https://wa.me/${encodeURIComponent(cleaned)}` : '';
}

function resolveLeaderName(row) {
  const direct = cleanStringField(row.display_name);
  if (direct) return direct;
  const prof = extractEmbeddedProfile(row.profiles);
  return prof ? cleanStringField(prof.name) : '';
}

function resolveLeaderPhoto(row) {
  const directPhoto = resolveImageSrc(row.profile_i, IMAGE_DIRS.leaders);
  if (directPhoto) return directPhoto;
  const prof = extractEmbeddedProfile(row.profiles);
  return prof ? resolveImageSrc(prof.photo, IMAGE_DIRS.leaders) : '';
}

function resolveLeaderProfileHref(pLink, cid, isFounder) {
  const customLink = normalizeSitePathOrUrl(pLink);
  if (customLink) return customLink;
  if (isFounder) {
    const founderDefault = normalizeSitePathOrUrl(FOUNDER_PROFILE_URL);
    if (founderDefault) return founderDefault;
  }
  return cid ? `/profile/?cid=${encodeURIComponent(cid)}` : '/leaders/';
}

function buildPhotoFallbackCandidates(initialSrc) {
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
  const match = dirFixed.match(/^(\/(?:leaders|students|teachers|institutes)\/img\/)([^/?#]+)(\.(?:jpe?g|png|webp))$/i);
  if (match) {
    const [, prefix, baseName, ext] = match;
    const toggledBase =
      baseName[0] === baseName[0].toUpperCase()
        ? baseName[0].toLowerCase() + baseName.slice(1)
        : baseName[0].toUpperCase() + baseName.slice(1);
    const bases = [baseName, toggledBase];
    const exts = [ext, '.webp', '.jpg'];
    for (const b of bases) {
      for (const e of exts) {
        pushUnique(`${prefix}${b}${e}`);
      }
    }
    for (const altDir of [IMAGE_DIRS.students, IMAGE_DIRS.teachers, IMAGE_DIRS.institutes]) {
      pushUnique(`${altDir}${baseName}${ext}`);
    }
  }

  return candidates;
}

function attachPhotoFallbackHandler(imgEl, onExhausted) {
  if (!imgEl) return;
  const initialSrc = imgEl.getAttribute('src') || '';
  const retryQueue = buildPhotoFallbackCandidates(initialSrc);

  const handleFailure = () => {
    if (retryQueue.length > 0) {
      imgEl.src = retryQueue.shift();
      return;
    }
    onExhausted();
  };

  imgEl.addEventListener('error', handleFailure);
  if (imgEl.complete && imgEl.naturalWidth === 0) {
    handleFailure();
  }
}

function parseResponsibilities(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map(item => String(item || '').trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item || '').trim()).filter(Boolean);
        }
      } catch (_) {
        // Treat as plain text lines below
      }
    }
    return trimmed
      .split(/\r?\n/)
      .map(line => line.replace(/^[\s\-—•*]+/, '').trim())
      .filter(Boolean);
  }
  return [];
}

function getFounderPortfolioUrl() {
  const configured = normalizeExternalUrl(FOUNDER_PORTFOLIO_URL);
  if (configured) return configured;
  const f = TOP_LEADERS && TOP_LEADERS.founder;
  if (!f) return '';
  if (f.portfolioUrl) return normalizeExternalUrl(f.portfolioUrl);
  const found = Array.isArray(f.links)
    ? f.links.find(l => /portfolio/i.test(l.label || ''))
    : null;
  return found ? normalizeExternalUrl(found.url) : '';
}

let activeExpandedLeaderCard = null;
let expandedAtScrollY = 0;
let ignoreExpandScrollUntil = 0;
let leaderExpandListenersBound = false;

function setLeaderCardExpandedUI(cardEl, isExpanded) {
  if (!cardEl) return;
  cardEl.classList.toggle('is-expanded', isExpanded);
  const btn = cardEl.querySelector('.leader-expand-btn');
  if (btn) {
    const leaderName = cardEl.dataset.leaderName || 'leader';
    btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    btn.setAttribute(
      'aria-label',
      isExpanded ? `Exit full size for ${leaderName}` : `Expand card for ${leaderName}`
    );
    btn.setAttribute('title', isExpanded ? 'Exit full size' : 'Full size');
  }
}

function collapseExpandedLeaderCard() {
  if (!activeExpandedLeaderCard) return;
  setLeaderCardExpandedUI(activeExpandedLeaderCard, false);
  activeExpandedLeaderCard = null;
}

function toggleLeaderCardExpanded(cardEl) {
  if (!cardEl) return;
  if (activeExpandedLeaderCard === cardEl) {
    collapseExpandedLeaderCard();
    return;
  }

  if (activeExpandedLeaderCard && activeExpandedLeaderCard !== cardEl) {
    setLeaderCardExpandedUI(activeExpandedLeaderCard, false);
  }

  activeExpandedLeaderCard = cardEl;
  setLeaderCardExpandedUI(cardEl, true);

  expandedAtScrollY = window.scrollY || 0;
  ignoreExpandScrollUntil = performance.now() + 360;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (activeExpandedLeaderCard === cardEl) {
        expandedAtScrollY = window.scrollY || 0;
      }
    });
  });
}

function ensureLeaderExpandListeners() {
  if (leaderExpandListenersBound) return;
  leaderExpandListenersBound = true;

  window.addEventListener(
    'scroll',
    () => {
      if (!activeExpandedLeaderCard) return;
      if (performance.now() < ignoreExpandScrollUntil) return;
      const currentY = window.scrollY || 0;
      if (Math.abs(currentY - expandedAtScrollY) > 10) {
        collapseExpandedLeaderCard();
      }
    },
    { passive: true }
  );

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeExpandedLeaderCard) {
      collapseExpandedLeaderCard();
    }
  });

  window.addEventListener('pageshow', () => {
    collapseExpandedLeaderCard();
  });
}

function hasActiveTextSelection() {
  const sel = window.getSelection ? window.getSelection() : null;
  return Boolean(sel && String(sel).trim().length > 0);
}

function navigateCardHref(href, event) {
  if (!href) return;
  if (event && (event.metaKey || event.ctrlKey) && window.self === window.top) {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  window.location.href = href;
}

function renderFounderCardDOM(founderSlot, data, useLocalSrcset) {
  ensureLeaderExpandListeners();

  const name = data.name || '';
  const role = data.role || '';
  const bio = data.bio || '';
  const responsibilities = Array.isArray(data.responsibilities) ? data.responsibilities : [];
  const photoUrl = data.photo || '';
  const cid = data.cid || '';
  const initials = esc(getInitials(name));

  // Inner "Profile ↗" link stays pointed at the Founder's profile page as before
  const profileHref = resolveLeaderProfileHref(data.p_link, cid, true);
  // Clicking the Founder card itself navigates to /leaders/?id=a370517e-ec1a-4257-9677-9293f6bd8d6b
  const founderLeaderDetailHref = FOUNDER_LEADER_DETAIL_URL;
  const portfolioUrl = getFounderPortfolioUrl();
  const whatsappHref = resolveWhatsappHref();

  let mediaMarkup = '';
  if (photoUrl) {
    const srcsetAttr = useLocalSrcset && data.photo480
      ? `srcset="${esc(data.photo480)} 480w, ${esc(photoUrl)} 900w" sizes="(min-width: 860px) 220px, 50vw"`
      : '';
    mediaMarkup = `
      <img
        class="founder-portrait-img"
        src="${esc(photoUrl)}"
        ${srcsetAttr}
        width="720"
        height="900"
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
        alt="Portrait of ${esc(name)}"
      >
      <div class="founder-portrait-fallback" aria-hidden="true">${initials}</div>
    `;
  } else {
    mediaMarkup = `
      <div class="founder-portrait-fallback is-active" aria-hidden="true">${initials}</div>
    `;
  }

  founderSlot.innerHTML = `
    <article
      class="founder-card founder-card--clickable"
      role="link"
      tabindex="0"
      data-leader-href="${esc(founderLeaderDetailHref)}"
      aria-label="${esc(role ? `${name}, ${role}` : name)}"
    >
      <div class="founder-portrait-col">
        <div class="founder-portrait-stage">
          <span class="founder-crop-mark founder-crop-tl" aria-hidden="true"></span>
          <span class="founder-crop-mark founder-crop-bl" aria-hidden="true"></span>
          <div class="founder-portrait-frame">
            ${mediaMarkup}
            <span class="founder-spiral-strip" aria-hidden="true"></span>
          </div>
        </div>
      </div>

      <div class="founder-content-col">
        <div>
          <h3 class="founder-name">${esc(name)}</h3>
          ${role ? `<div class="founder-title-badge">${esc(role)}</div>` : ''}
        </div>
        ${bio ? `<p class="founder-bio">${esc(bio)}</p>` : ''}
        ${responsibilities.length ? `
          <div>
            <div class="founder-subheading">AREAS OF RESPONSIBILITY</div>
            <ul class="founder-resp-list">
              ${responsibilities.map(r => `<li>${esc(r)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <div class="founder-links">
          <a href="${esc(profileHref)}" class="founder-link">Profile ↗</a>
          ${portfolioUrl ? `<a href="${esc(portfolioUrl)}" class="founder-link" target="_blank" rel="noopener noreferrer">Portfolio ↗</a>` : ''}
          <a
            href="${whatsappHref ? esc(whatsappHref) : '#'}"
            class="founder-link"
            target="_blank"
            rel="noopener noreferrer"
            ${whatsappHref ? '' : 'hidden'}
          >WhatsApp ↗</a>
        </div>
      </div>
    </article>
  `;

  const founderCardEl = founderSlot.querySelector('.founder-card');
  if (founderCardEl) {
    founderCardEl.querySelectorAll('a, button').forEach(interactiveEl => {
      interactiveEl.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });

    founderCardEl.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      if (hasActiveTextSelection()) return;
      collapseExpandedLeaderCard();
      navigateCardHref(founderLeaderDetailHref, e);
    });

    founderCardEl.addEventListener('keydown', (e) => {
      if (e.target !== founderCardEl) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        collapseExpandedLeaderCard();
        navigateCardHref(founderLeaderDetailHref, e);
      }
    });
  }

  const founderImg = founderSlot.querySelector('.founder-portrait-img');
  const fallbackTile = founderSlot.querySelector('.founder-portrait-fallback');
  if (founderImg && fallbackTile) {
    attachPhotoFallbackHandler(founderImg, () => {
      founderImg.classList.add('is-broken');
      fallbackTile.classList.add('is-active');
    });
  }
}

function renderLeaderCardsDOM(gridSlot, items, isSampleFallback) {
  ensureLeaderExpandListeners();
  collapseExpandedLeaderCard();

  if (!items.length) {
    gridSlot.innerHTML = '';
    gridSlot.hidden = true;
    return;
  }

  gridSlot.hidden = false;
  gridSlot.innerHTML = items.map(item => {
    const name = item.name || '';
    const role = item.role || '';
    const quote = item.quote || '';
    const bio = item.bio || '';
    const responsibilities = Array.isArray(item.responsibilities) ? item.responsibilities : [];
    const photoUrl = item.photo || '';
    const cid = item.cid || '';
    const initials = esc(getInitials(name));
    const cardDetailHref = cid ? `/leaders/?id=${encodeURIComponent(cid)}` : '/leaders/';
    const profileHref = resolveLeaderProfileHref(item.p_link, cid, false);
    const whatsappHref = resolveMemberWhatsappHref(item.whatsapp);
    const accessibleLabel = role ? `${name}, ${role}` : name;

    const compactText = quote || bio;
    const showDistinctQuote = Boolean(
      quote &&
      bio &&
      quote.trim().toLowerCase() !== bio.trim().toLowerCase()
    );
    const expandedBioText = bio || quote;

    const avatarInner = photoUrl
      ? `
        <img
          class="leader-photo-img"
          src="${esc(photoUrl)}"
          alt="Portrait of ${esc(name)}"
          width="117"
          height="117"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        >
        <span class="leader-initials-fallback" aria-hidden="true" hidden>${initials}</span>
      `
      : `<span class="leader-initials-fallback" aria-hidden="true">${initials}</span>`;

    const expandedMediaInner = photoUrl
      ? `
        <img
          class="founder-portrait-img leader-expanded-portrait-img"
          src="${esc(photoUrl)}"
          width="720"
          height="900"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
          alt="Portrait of ${esc(name)}"
        >
        <div class="founder-portrait-fallback" aria-hidden="true">${initials}</div>
      `
      : `<div class="founder-portrait-fallback is-active" aria-hidden="true">${initials}</div>`;

    const sampleBadgeMarkup = isSampleFallback
      ? `
        <div class="leader-sample-row">
          <span class="leader-sample-tag">SAMPLE</span>
        </div>
      `
      : '';

    return `
      <article
        class="leader-item-card"
        role="link"
        tabindex="0"
        data-leader-href="${esc(cardDetailHref)}"
        data-leader-name="${esc(name)}"
        aria-label="${esc(accessibleLabel)}"
      >
        <button
          type="button"
          class="leader-expand-btn"
          aria-expanded="false"
          aria-label="Expand card for ${esc(name)}"
          title="Full size"
        >
          <svg class="icon-expand" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
          <svg class="icon-collapse" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="4 14 10 14 10 20"></polyline>
            <polyline points="20 10 14 10 14 4"></polyline>
            <line x1="14" y1="10" x2="21" y2="3"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>

        <div class="leader-compact-view">
          <div class="leader-avatar-row">
            <div class="leader-avatar">
              ${avatarInner}
            </div>
            <div class="leader-meta-col">
              <div class="leader-name">${esc(name)}</div>
              ${role ? `<div class="leader-pos">${esc(role)}</div>` : ''}
            </div>
          </div>
          ${compactText ? `<p class="leader-resp">${esc(compactText)}</p>` : ''}
          ${sampleBadgeMarkup}
        </div>

        <div class="leader-expanded-view">
          <div class="founder-portrait-col">
            <div class="founder-portrait-stage">
              <span class="founder-crop-mark founder-crop-tl" aria-hidden="true"></span>
              <span class="founder-crop-mark founder-crop-bl" aria-hidden="true"></span>
              <div class="founder-portrait-frame">
                ${expandedMediaInner}
                <span class="founder-spiral-strip" aria-hidden="true"></span>
              </div>
            </div>
          </div>

          <div class="founder-content-col">
            <div class="leader-expanded-head">
              <h3 class="founder-name">${esc(name)}</h3>
              ${role ? `<div class="founder-title-badge">${esc(role)}</div>` : ''}
            </div>
            ${showDistinctQuote ? `<p class="leader-expanded-quote">“${esc(quote)}”</p>` : ''}
            ${expandedBioText ? `<p class="founder-bio">${esc(expandedBioText)}</p>` : ''}
            ${responsibilities.length ? `
              <div>
                <div class="founder-subheading">AREAS OF RESPONSIBILITY</div>
                <ul class="founder-resp-list">
                  ${responsibilities.map(r => `<li>${esc(r)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            <div class="founder-links">
              <a href="${esc(profileHref)}" class="founder-link">Profile ↗</a>
              ${whatsappHref ? `<a href="${esc(whatsappHref)}" class="founder-link" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>` : ''}
            </div>
            ${sampleBadgeMarkup}
          </div>
        </div>
      </article>
    `;
  }).join('');

  gridSlot.querySelectorAll('.leader-item-card').forEach(cardEl => {
    const expandBtn = cardEl.querySelector('.leader-expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleLeaderCardExpanded(cardEl);
      });
    }

    cardEl.querySelectorAll('a').forEach(linkEl => {
      linkEl.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });

    cardEl.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      if (hasActiveTextSelection()) return;

      if (activeExpandedLeaderCard && activeExpandedLeaderCard !== cardEl) {
        collapseExpandedLeaderCard();
      }

      const targetHref = cardEl.dataset.leaderHref || '';
      navigateCardHref(targetHref, e);
    });

    cardEl.addEventListener('keydown', (e) => {
      if (e.target !== cardEl) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (activeExpandedLeaderCard && activeExpandedLeaderCard !== cardEl) {
          collapseExpandedLeaderCard();
        }
        const targetHref = cardEl.dataset.leaderHref || '';
        navigateCardHref(targetHref, e);
      }
    });
  });

  gridSlot.querySelectorAll('.leader-photo-img').forEach(img => {
    const fallbackEl = img.parentElement && img.parentElement.querySelector('.leader-initials-fallback');
    attachPhotoFallbackHandler(img, () => {
      img.hidden = true;
      if (fallbackEl) fallbackEl.hidden = false;
    });
  });

  gridSlot.querySelectorAll('.leader-expanded-portrait-img').forEach(img => {
    const fallbackTile = img.parentElement && img.parentElement.querySelector('.founder-portrait-fallback');
    attachPhotoFallbackHandler(img, () => {
      img.classList.add('is-broken');
      if (fallbackTile) fallbackTile.classList.add('is-active');
    });
  });
}

function renderSampleLeadersFallback(founderSlot, gridSlot) {
  if (founderSlot && TOP_LEADERS.founder) {
    const f = TOP_LEADERS.founder;
    renderFounderCardDOM(founderSlot, {
      cid: f.cid || 'founder',
      p_link: f.p_link || '',
      name: f.name,
      role: f.title,
      bio: f.bio,
      responsibilities: f.responsibilities || [],
      photo: resolveImageSrc(f.photo, IMAGE_DIRS.leaders),
      photo480: f.photo480 ? resolveImageSrc(f.photo480, IMAGE_DIRS.leaders) : ''
    }, Boolean(f.photo480));
  }

  if (gridSlot && Array.isArray(TOP_LEADERS.leaders)) {
    const sampleItems = TOP_LEADERS.leaders.slice(0, 6).map(l => ({
      cid: l.id,
      p_link: l.p_link || '',
      name: l.name,
      role: l.position,
      quote: l.responsibility,
      bio: l.bio || l.responsibility || '',
      responsibilities: Array.isArray(l.responsibilities) ? l.responsibilities : [],
      whatsapp: l.whatsapp || '',
      photo: resolveImageSrc(l.photo, IMAGE_DIRS.leaders)
    }));
    renderLeaderCardsDOM(gridSlot, sampleItems, true);
  }
}

async function renderLeaders() {
  const founderSlot = document.getElementById('founder-card-slot');
  const gridSlot = document.getElementById('leaders-grid-slot');
  if (!founderSlot && !gridSlot) return;

  const endpoint = `${SUPABASE_URL}/rest/v1/leaders?select=cid,sort_order,display_name,role,quote,bio,responsibilities,profile_i,p_link,whatsapp,profiles(name,photo)&order=sort_order.asc&limit=7`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Leaders fetch failed with status ${response.status}`);
    }

    const rows = await response.json();
    if (!Array.isArray(rows)) {
      throw new Error('Unexpected leaders payload');
    }

    const ordered = rows.slice().sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));

    if (ordered.length === 0) {
      if (founderSlot) founderSlot.innerHTML = '';
      if (gridSlot) {
        gridSlot.innerHTML = '';
        gridSlot.hidden = true;
      }
      return;
    }

    const founderRow = ordered[0];
    if (founderSlot) {
      renderFounderCardDOM(founderSlot, {
        cid: founderRow.cid,
        p_link: founderRow.p_link,
        name: resolveLeaderName(founderRow),
        role: founderRow.role ? String(founderRow.role).trim() : '',
        bio: founderRow.bio ? String(founderRow.bio).trim() : '',
        responsibilities: parseResponsibilities(founderRow.responsibilities),
        photo: resolveLeaderPhoto(founderRow)
      }, false);
    }

    if (gridSlot) {
      const otherRows = ordered.slice(1, 7).map(row => ({
        cid: row.cid,
        p_link: row.p_link,
        name: resolveLeaderName(row),
        role: row.role ? String(row.role).trim() : '',
        quote: row.quote ? String(row.quote).trim() : '',
        bio: row.bio ? String(row.bio).trim() : '',
        responsibilities: parseResponsibilities(row.responsibilities),
        whatsapp: row.whatsapp ? String(row.whatsapp).trim() : '',
        photo: resolveLeaderPhoto(row)
      }));
      renderLeaderCardsDOM(gridSlot, otherRows, false);
    }
  } catch (err) {
    console.error(err);
    renderSampleLeadersFallback(founderSlot, gridSlot);
  }
}

/* ==========================================================================
   10. Teacher Profiles Shelf
   ========================================================================== */
function renderTeachers() {
  const track = document.getElementById('teachers-track');
  if (!track) return;

  const cardsHtml = TEACHER_PROFILES.map(item => `
    <article class="shelf-card" aria-label="${esc(item.name)}">
      <div>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
          <div class="leader-avatar" style="width:48px; height:48px; font-size:16px; background:#F8FAFC; border-color:#CBD5E1; color:#0047AB;">
            ${getInitials(item.name)}
          </div>
          <div>
            <h3 class="card-title" style="margin-bottom:2px;">${esc(item.name)}</h3>
            <div style="font-size:12px; color:var(--brand-orange); font-weight:600;">${esc(item.designation)}</div>
          </div>
        </div>
        <p style="font-size:13px; color:var(--text-secondary); margin-bottom:10px;"><strong>Institution:</strong> ${esc(item.institution)}</p>
        <p class="card-desc"><strong>Expertise:</strong> ${esc(item.expertise)}</p>
      </div>
      <div>
        <div class="card-meta">
          <div style="font-size:11px; color:#10B981; font-weight:600;">✓ Verified Academic Mentor</div>
        </div>
        <button type="button" class="card-link open-profile-btn" data-type="teacher" data-id="${item.id}">View teacher profile →</button>
      </div>
    </article>
  `).join('');

  const darkCard = `
    <div class="shelf-card-dark">
      <div class="shelf-dark-top">
        <div class="shelf-dark-icon">
          <img src="/public/assets/aistudio/iteration-lab-icon-jetspiral_10af4d29.png" alt="Spiral icon">
        </div>
        <h3 class="shelf-dark-title">Explore All Teacher Profiles</h3>
        <p class="shelf-dark-desc">Connect with verified academic evaluators, subject specialists, and educators across the network.</p>
      </div>
      <div class="shelf-dark-buttons">
        <a href="/teachers/" class="btn btn-orange">Explore All Teachers</a>
        <a href="login.html?role=teacher" class="btn btn-dark">Join as a Teacher</a>
      </div>
    </div>
  `;

  track.innerHTML = cardsHtml + darkCard;
}

/* ==========================================================================
   11. Student Profiles Shelf
   ========================================================================== */
function renderStudents() {
  const track = document.getElementById('students-track');
  if (!track) return;

  const cardsHtml = STUDENT_PROFILES.map(item => `
    <article class="shelf-card" aria-label="${esc(item.name)}">
      <div>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
          <div class="leader-avatar" style="width:48px; height:48px; font-size:16px; background:#F8FAFC; border-color:#CBD5E1; color:#111827;">
            ${getInitials(item.name)}
          </div>
          <div>
            <h3 class="card-title" style="margin-bottom:2px;">${esc(item.name)}</h3>
            <div style="font-size:12px; color:var(--text-muted); font-weight:500;">${esc(item.affiliation)}</div>
          </div>
        </div>
        <p style="font-size:13px; color:var(--text-secondary); margin-bottom:8px;"><strong>Interests:</strong> ${esc(item.interests)}</p>
        <p class="card-desc"><strong>Featured Work:</strong> ${esc(item.featuredWork)}</p>
      </div>
      <div>
        <div class="card-meta">
          <div style="font-size:11px; color:#0047AB; font-weight:600;">● Student Researcher & Author</div>
        </div>
        <button type="button" class="card-link open-profile-btn" data-type="student" data-id="${item.id}">View student profile →</button>
      </div>
    </article>
  `).join('');

  const darkCard = `
    <div class="shelf-card-dark">
      <div class="shelf-dark-top">
        <div class="shelf-dark-icon">
          <img src="/public/assets/aistudio/iteration-lab-icon-jetspiral_10af4d29.png" alt="Spiral icon">
        </div>
        <h3 class="shelf-dark-title">Explore All Student Profiles</h3>
        <p class="shelf-dark-desc">Discover student authors, project creators, and research collaborators from secondary to university levels.</p>
      </div>
      <div class="shelf-dark-buttons">
        <a href="/students/" class="btn btn-orange">Watch all Students profile</a>
        <a href="login.html?role=student" class="btn btn-dark">Join as a Student</a>
      </div>
    </div>
  `;

  track.innerHTML = cardsHtml + darkCard;
}

/* ==========================================================================
   12. Events Shelf with Segmented Switch
   ========================================================================== */
function renderEvents(type = 'upcoming') {
  const track = document.getElementById('events-track');
  if (!track) return;

  const list = LAB_EVENTS[type] || [];
  const cardsHtml = list.map(item => `
    <article class="shelf-card" aria-label="${esc(item.title)}">
      <div>
        <div class="event-date-tag">${esc(item.date)}</div>
        <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">
          ${esc(item.category)} · ${esc(item.format)}
        </div>
        <h3 class="card-title">${esc(item.title)}</h3>
        <p class="card-desc">${esc(item.description)}</p>
      </div>
      <div>
        <div class="card-meta">
          <div>Open Educational Session</div>
        </div>
        <a href="#contact" class="card-link">Register / Details →</a>
      </div>
    </article>
  `).join('');

  const darkCard = `
    <div class="shelf-card-dark">
      <div class="shelf-dark-top">
        <div class="shelf-dark-icon">
          <img src="/public/assets/aistudio/iteration-lab-icon-jetspiral_10af4d29.png" alt="Spiral icon">
        </div>
        <h3 class="shelf-dark-title">Explore All Events</h3>
        <p class="shelf-dark-desc">Participate in monthly research presentations, code walkthroughs, and peer review roundtables.</p>
      </div>
      <div class="shelf-dark-buttons">
        <a href="/communities/" class="btn btn-orange">Explore Communities</a>
        <a href="#contact" class="btn btn-dark">Calendar & Archive</a>
      </div>
    </div>
  `;

  track.innerHTML = cardsHtml + darkCard;
}

function initEventTabs() {
  const btnUpcoming = document.getElementById('event-tab-upcoming');
  const btnPast = document.getElementById('event-tab-past');
  if (!btnUpcoming || !btnPast) return;

  btnUpcoming.addEventListener('click', () => {
    btnUpcoming.classList.add('active');
    btnPast.classList.remove('active');
    renderEvents('upcoming');
  });

  btnPast.addEventListener('click', () => {
    btnPast.classList.add('active');
    btnUpcoming.classList.remove('active');
    renderEvents('past');
  });
}

/* ==========================================================================
   13. Promises, Policy & Privacy Grid
   ========================================================================== */
function renderPolicies() {
  const grid = document.getElementById('policy-grid');
  if (!grid) return;

  grid.innerHTML = POLICIES.map((p, idx) => `
    <div class="policy-item-box" aria-label="${esc(p.title)}">
      <div>
        <div class="policy-head-row">
          <h3 class="policy-name">0${idx + 1}. ${esc(p.title)}</h3>
          <span style="font-size:10px; font-weight:600; padding:2px 6px; border-radius:3px; background:#F3F4F6; color:#4B5563; border:1px solid #E5E7EB;">${esc(p.status)}</span>
        </div>
        <p class="policy-desc">${esc(p.summary)}</p>
      </div>
      <a href="#contact" class="card-link" style="font-size:12px;">View policy guidelines →</a>
    </div>
  `).join('');
}

/* ==========================================================================
   Shelf Scrolling Controls (Previous / Next Buttons)
   ========================================================================== */
function initShelfControls() {
  const sections = document.querySelectorAll('.shelf-section');

  sections.forEach(sec => {
    const track = sec.querySelector('.shelf-track');
    const prevBtn = sec.querySelector('.shelf-prev');
    const nextBtn = sec.querySelector('.shelf-next');

    if (!track || !prevBtn || !nextBtn) return;

    const scrollAmount = 320;

    const updateBtns = () => {
      prevBtn.disabled = track.scrollLeft <= 5;
      nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
    };

    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    track.addEventListener('scroll', updateBtns, { passive: true });
    window.addEventListener('resize', updateBtns);
    setTimeout(updateBtns, 200);
  });
}

/* ==========================================================================
   14. Contact Form Handling (Redirects to wa.me/TheIterationLab)
   ========================================================================== */
function redirectToWhatsApp(waHref) {
  const link = document.createElement('a');
  link.href = waHref;
  if (window.self !== window.top) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('contact-feedback');
  if (!form || !feedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Honeypot check
    const honeypot = form.querySelector('[name="bot_field"]')?.value;
    if (honeypot) return;

    const name = form.querySelector('#contact-name').value.trim();
    const email = form.querySelector('#contact-email').value.trim();
    const topic = form.querySelector('#contact-topic').value;
    const msg = form.querySelector('#contact-message').value.trim();

    if (!name || !email || !topic || !msg) {
      feedback.textContent = 'Please fill out all required fields.';
      feedback.className = 'form-feedback error';
      feedback.style.display = 'block';
      return;
    }

    const baseWaUrl = String(WHATSAPP_URL || 'https://wa.me/TheIterationLab')
      .trim()
      .replace(/\?.*$/, '')
      .replace(/\s+/g, '');

    const formattedMessage = [
      '*The Iteration Lab — Coordination Desk Inquiry*',
      '',
      `*Name:* ${name}`,
      `*Email:* ${email}`,
      `*Category:* ${topic}`,
      '',
      '*Message:*',
      msg
    ].join('\n');

    const waHref = `${baseWaUrl}?text=${encodeURIComponent(formattedMessage)}`;

    feedback.textContent = '';
    feedback.className = 'form-feedback success';
    feedback.style.display = 'block';

    const statusText = document.createElement('span');
    statusText.textContent = `Redirecting to WhatsApp for The Iteration Lab admin… `;

    const fallbackLink = document.createElement('a');
    fallbackLink.href = waHref;
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    fallbackLink.style.fontWeight = '700';
    fallbackLink.style.textDecoration = 'underline';
    fallbackLink.textContent = 'Open in WhatsApp ↗';

    feedback.appendChild(statusText);
    feedback.appendChild(fallbackLink);

    redirectToWhatsApp(waHref);
    form.reset();
  });
}

/* ==========================================================================
   Header Mobile Nav Drawer
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const drawer = document.getElementById('mobile-nav-drawer');
  if (!toggleBtn || !drawer) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
  });

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ==========================================================================
   Header Scroll-Direction Show/Hide Animation
   ========================================================================== */
function initScrollHeader() {
  const header = document.querySelector('.site-header');
  const subnavSearch = document.getElementById('subnav-search-btn');
  const drawer = document.getElementById('mobile-nav-drawer');
  if (!header) return;

  let lastScrollY = window.scrollY || 0;
  let ticking = false;
  const SCROLL_THRESHOLD = 5; // React immediately to slight scroll gestures

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY || 0;
        const delta = currentScrollY - lastScrollY;

        // If mobile nav drawer is open, do not auto-hide header
        if (drawer && drawer.classList.contains('open')) {
          lastScrollY = currentScrollY;
          ticking = false;
          return;
        }

        // At the very top (first 10px): always show header at resting state
        if (currentScrollY <= 10) {
          header.classList.remove('header-hidden');
          header.classList.remove('header-scrolled');
          if (subnavSearch) subnavSearch.classList.remove('search-hidden');
        } else if (delta > SCROLL_THRESHOLD && currentScrollY > 40) {
          // Scrolling DOWN: go up and vanish
          header.classList.add('header-hidden');
          if (subnavSearch) subnavSearch.classList.add('search-hidden');
        } else if (delta < -SCROLL_THRESHOLD) {
          // Scrolling UP: slide down into view smoothly
          header.classList.remove('header-hidden');
          header.classList.add('header-scrolled');
          if (subnavSearch) subnavSearch.classList.remove('search-hidden');
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ==========================================================================
   Search Modal
   ========================================================================== */
function initSearchModal() {
  const searchBtn = document.getElementById('search-btn');
  const subnavSearchBtn = document.getElementById('subnav-search-btn');
  const modal = document.getElementById('search-modal');
  const closeBtn = document.getElementById('search-modal-close');
  const input = document.getElementById('search-input');
  const resultsBox = document.getElementById('search-results');

  if (!modal || !closeBtn || !input || !resultsBox) return;

  const openModal = () => {
    modal.classList.add('open');
    input.value = '';
    input.focus();
    renderSearchResults('');
  };

  const closeModal = () => {
    modal.classList.remove('open');
  };

  if (searchBtn) searchBtn.addEventListener('click', openModal);
  if (subnavSearchBtn) subnavSearchBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  input.addEventListener('input', (e) => {
    renderSearchResults(e.target.value.toLowerCase().trim());
  });

  function renderSearchResults(q) {
    if (!q) {
      resultsBox.innerHTML = `
        <div style="font-size:13px; color:var(--text-muted); text-align:center; padding:20px;">
          Type to search research papers, software builds, teachers, or students...
        </div>
      `;
      return;
    }

    const matchedPubs = RESEARCH_PUBLICATIONS.filter(p => p.title.toLowerCase().includes(q) || p.abstract.toLowerCase().includes(q));
    const matchedSw = SOFTWARE_BUILDS.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    const matchedStudents = STUDENT_PROFILES.filter(st => st.name.toLowerCase().includes(q) || st.interests.toLowerCase().includes(q));

    let html = '';

    if (matchedPubs.length) {
      html += `<div style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:var(--brand-orange); text-transform:uppercase; margin:8px 0 4px;">Research Papers</div>`;
      matchedPubs.forEach(p => {
        html += `
          <div style="padding:10px; border-bottom:1px solid var(--border-light);">
            <div style="font-family:var(--font-serif); font-size:15px; font-weight:600; color:var(--text-main);">${esc(p.title)}</div>
            <div style="font-size:12px; color:var(--text-secondary);">${esc(p.authors)} · ${esc(p.date)}</div>
          </div>
        `;
      });
    }

    if (matchedSw.length) {
      html += `<div style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:var(--accent-blue); text-transform:uppercase; margin:14px 0 4px;">Software Builds</div>`;
      matchedSw.forEach(s => {
        html += `
          <div style="padding:10px; border-bottom:1px solid var(--border-light);">
            <div style="font-size:14px; font-weight:700; color:var(--text-main);">${esc(s.name)}</div>
            <div style="font-size:12px; color:var(--text-secondary);">${esc(s.description)}</div>
          </div>
        `;
      });
    }

    if (matchedStudents.length) {
      html += `<div style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin:14px 0 4px;">Students</div>`;
      matchedStudents.forEach(st => {
        html += `
          <div style="padding:10px; border-bottom:1px solid var(--border-light);">
            <div style="font-size:14px; font-weight:700; color:var(--text-main);">${esc(st.name)}</div>
            <div style="font-size:12px; color:var(--text-secondary);">${esc(st.interests)}</div>
          </div>
        `;
      });
    }

    if (!html) {
      html = `<div style="font-size:13px; color:var(--text-muted); text-align:center; padding:20px;">No matching results found for "${esc(q)}".</div>`;
    }

    resultsBox.innerHTML = html;
  }
}

/* ==========================================================================
   Detail Reading Modal
   ========================================================================== */
function initDetailModal() {
  const modal = document.getElementById('detail-modal');
  const closeBtn = document.getElementById('detail-modal-close');
  const titleEl = document.getElementById('detail-title');
  const bodyEl = document.getElementById('detail-body');

  if (!modal || !closeBtn || !titleEl || !bodyEl) return;

  const openDetail = (title, contentHtml) => {
    titleEl.textContent = title;
    bodyEl.innerHTML = contentHtml;
    modal.classList.add('open');
  };

  const closeDetail = () => {
    modal.classList.remove('open');
  };

  closeBtn.addEventListener('click', closeDetail);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeDetail();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeDetail();
  });

  // Attach click listener for publications
  document.addEventListener('click', (e) => {
    const pubBtn = e.target.closest('.open-paper-btn');
    if (pubBtn) {
      const id = pubBtn.getAttribute('data-id');
      const item = RESEARCH_PUBLICATIONS.find(p => p.id === id);
      if (item) {
        openDetail(item.title, `
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="font-family:var(--font-mono); font-size:12px; color:var(--brand-orange);">${esc(item.category)} · DOI: ${esc(item.doi)}</div>
            <div style="font-size:14px; color:var(--text-secondary); line-height:1.6;">
              <strong>Authors:</strong> ${esc(item.authors)}<br>
              <strong>Affiliation:</strong> ${esc(item.institution)}<br>
              <strong>Published:</strong> ${esc(item.date)} (${esc(item.readTime)})
            </div>
            <hr style="border:0; border-top:1px solid var(--border-light);">
            <div style="font-family:var(--font-serif); font-size:18px; font-weight:600;">Abstract & Methodology</div>
            <p style="font-size:15px; color:var(--text-main); line-height:1.7;">${esc(item.abstract)}</p>
            <div style="background:var(--bg-subtle); border:1px solid var(--border-light); border-radius:6px; padding:16px;">
              <div style="font-family:var(--font-mono); font-size:12px; font-weight:700; color:var(--text-main); margin-bottom:6px;">BibTeX Citation</div>
              <pre style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary); white-space:pre-wrap; overflow-x:auto;">@article{til_${item.id.replace(/-/g, '_')},
  title={${item.title}},
  author={${item.authors}},
  journal={The Iteration Lab Student Research Annals},
  year={2026},
  doi={${item.doi}}
}</pre>
            </div>
            <a href="login.html" class="btn btn-orange" style="width:fit-content;">Submit Peer Review / Discussion</a>
          </div>
        `);
      }
    }

    const swBtn = e.target.closest('.open-sw-btn');
    if (swBtn) {
      const id = swBtn.getAttribute('data-id');
      const item = SOFTWARE_BUILDS.find(s => s.id === id);
      if (item) {
        openDetail(item.name, `
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="font-size:13px; color:var(--text-muted);">Status: <strong style="color:#059669;">${esc(item.status)}</strong></div>
            <p style="font-size:15px; color:var(--text-main); line-height:1.6;">${esc(item.description)}</p>
            <div>
              <strong style="font-size:13px;">Team / Maintainers:</strong>
              <div style="font-size:14px; color:var(--text-secondary);">${esc(item.team)}</div>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${item.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}
            </div>
            <a href="login.html" class="btn btn-orange" style="width:fit-content;">Request Code Access / Join Team</a>
          </div>
        `);
      }
    }

    const profBtn = e.target.closest('.open-profile-btn');
    if (profBtn) {
      const type = profBtn.getAttribute('data-type');
      const id = profBtn.getAttribute('data-id');
      const list = type === 'teacher' ? TEACHER_PROFILES : STUDENT_PROFILES;
      const item = list.find(x => x.id === id);
      if (item) {
        openDetail(item.name, `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div style="font-size:14px; color:var(--brand-orange); font-weight:600;">
              ${type === 'teacher' ? esc(item.designation) : esc(item.affiliation)}
            </div>
            <div style="font-size:14px; color:var(--text-secondary);">
              ${type === 'teacher' ? `<strong>Institution:</strong> ${esc(item.institution)}` : `<strong>Research Interests:</strong> ${esc(item.interests)}`}
            </div>
            <div style="font-size:14px; color:var(--text-secondary);">
              ${type === 'teacher' ? `<strong>Areas of Expertise:</strong> ${esc(item.expertise)}` : `<strong>Featured Work:</strong> ${esc(item.featuredWork)}`}
            </div>
            <div style="font-size:12px; color:#10B981; font-weight:600; margin-top:8px;">
              ✓ Verified in The Iteration Lab Academic Directory
            </div>
            <div style="margin-top:8px;">
              <a href="/profile/?type=${type === 'teacher' ? 'T' : 'S'}" class="btn btn-orange" style="width:fit-content;">Open Full Portfolio →</a>
            </div>
          </div>
        `);
      }
    }
  });
}
