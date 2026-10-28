// ==========================================================================
// The Iteration Lab — Common Member Portfolio Controller (/assets/js/profile.js)
// Serves Students (S), Teachers (T), Independent Publishers (R), & Leaders.
//
// Live Database Integration:
//  - Loads member rows directly from Supabase (profiles, profile_cv_entries,
//    profile_custom_cards, researches, software, students/teachers/institutes, leaders)
//  - Resolves ?cid=<uuid>, ?slug=<slug>, /profile/<TYPE>/<slug>, Founder aliases,
//    and bare /profile/ (authenticated owner's profile or Founder fallback)
//  - Strict ownership check: Eye Edit toggle renders ONLY when logged into that cid
//  - Double-click (and touch double-tap) inline editing saves directly to Supabase
//  - Dynamic GPA strip: hides 0 / empty GPAs in User View and stretches remaining
//    columns evenly across 100% width with zero blank gaps
//  - Horizontal Right-to-Left scroll-driven card stacking (no prev/next buttons)
// ==========================================================================

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  FOUNDER_LEADER_CID,
  IMAGE_DIRS
} from '../../js/config.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FOUNDER_ALIASES = new Set([
  'ikramulhoquearik',
  'ikramul-hoque',
  'ikramul_hoque',
  'founder',
  'arik'
]);

const MEMBER_CROSS_DIRS = [
  IMAGE_DIRS.students,
  IMAGE_DIRS.teachers,
  IMAGE_DIRS.leaders,
  IMAGE_DIRS.institutes,
  '/profile/img/'
];

/* ==========================================================================
   1. Curated Role Defaults & Optional Demo Sample Personas (?demo=1)
   ========================================================================== */
const ROLE_DEFAULTS = {
  S: {
    roleKicker: 'Student · Researcher',
    headline: 'Turn Insight Into Discovery',
    lead: 'Investigating applied engineering, scientific computing, and reproducible student research workflows through The Iteration Lab open educational network.',
    statementKicker: 'RESEARCH PHILOSOPHY',
    quote: '“Rigorous inquiry begins the moment curiosity is paired with open methodology, transparent data, and peer verification.”',
    description: 'Building open-source projects and publishing peer-reviewed student research through The Iteration Lab—bridging classroom theory with hands-on experimentation.',
    institution: 'Student Researcher · The Iteration Lab'
  },
  T: {
    roleKicker: 'Academic Mentor · Research Evaluator',
    headline: 'Guiding Inquiry Into Rigor',
    lead: 'Supervising collegiate experimental methodology, peer-review standards, and scientific modelling to cultivate the next generation of researchers.',
    statementKicker: 'MENTORSHIP & EDITORIAL STATEMENT',
    quote: '“True mentorship equips young scholars not merely to recite established answers, but to design falsifiable experiments of their own.”',
    description: 'Serving as faculty advisor and peer-review steward within The Iteration Lab—helping student investigators refine hypotheses, validation, and ethical attribution.',
    institution: 'Academic Mentor · The Iteration Lab'
  },
  R: {
    roleKicker: 'Independent Publisher · Field Researcher',
    headline: 'Open Data For Civic Impact',
    lead: 'Conducting independent technical investigations, archival documentation, and community-focused datasets published openly for public benefit.',
    statementKicker: 'INDEPENDENT RESEARCH ETHOS',
    quote: '“Scientific discovery belongs to every citizen willing to measure carefully, document honestly, and share openly.”',
    description: 'Publishing open-access field studies, reproducible tools, and practical engineering benchmarks across communities in Bangladesh.',
    institution: 'Independent Publisher · The Iteration Lab'
  },
  I: {
    roleKicker: 'Partner Academic Institution',
    headline: 'Advancing Open Collegiate Inquiry',
    lead: 'Supporting student research chapters, faculty mentorship, and peer-reviewed scholarly publishing within The Iteration Lab network.',
    statementKicker: 'INSTITUTIONAL CHARTER',
    quote: '“Institutions thrive when classrooms connect directly with open scientific inquiry and collaborative engineering.”',
    description: 'Partnering with The Iteration Lab to verify student researchers, mentor faculty-guided investigations, and share open educational outputs.',
    institution: 'Verified Partner Institution · The Iteration Lab'
  }
};

function createSamplePortfolios() {
  return {
    student: {
      profileKey: 'student',
      isLiveDb: false,
      cid: 'sample-student-cid-0001',
      accountType: 'S',
      name: 'Tanvir Hossain',
      institution: 'Notre Dame College, Dhaka (EIIN 108274)',
      defaultInstitution: 'Notre Dame College, Dhaka (EIIN 108274)',
      roleKicker: ROLE_DEFAULTS.S.roleKicker,
      headline: ROLE_DEFAULTS.S.headline,
      lead: ROLE_DEFAULTS.S.lead,
      primaryCtaTarget: 'researches',
      whatsapp: '+880 1711-000101',
      email: 'tanvir.research@iterationlab.org',
      location: 'Motijheel, Dhaka, Bangladesh',
      photo: '',
      rawPhotoField: '',
      statementKicker: ROLE_DEFAULTS.S.statementKicker,
      quote: ROLE_DEFAULTS.S.quote,
      description: ROLE_DEFAULTS.S.description,
      gpas: {
        ssc: '5.00',
        sscSub: 'Science · Batch 2024',
        hsc: '5.00',
        hscSub: 'Science · Batch 2026',
        ug: '0',
        ugSub: 'Undergraduate CGPA',
        grad: '0',
        gradSub: 'Graduate CGPA',
        researchCount: '03',
        researchSub: 'Peer-Reviewed & Preprints'
      },
      education: [
        {
          id: 'edu-1',
          period: '2024 — 2026',
          core: 'Higher Secondary Certificate (HSC) in Science',
          org: 'Notre Dame College, Dhaka',
          detail: 'Concentration in Higher Mathematics, Physics, and Chemistry. Student Coordinator of the Collegiate Scientific Computing & Research Reading Circle.'
        },
        {
          id: 'edu-2',
          period: '2022 — 2024',
          core: 'Secondary School Certificate (SSC) in Science',
          org: 'Ideal School and College, Dhaka',
          detail: 'Awarded Board Scholarship with GPA 5.00 across all quantitative sciences; led junior robotics and microcontroller instrumentation team.'
        }
      ],
      skills: [
        {
          id: 'sk-1',
          spine: 'Scientific Computing',
          category: 'Technical Competency',
          meta: 'Python · PyTorch · ONNX Runtime · LaTeX',
          title: 'Computational Modelling & Reproducible Statistical Analysis',
          subtitle: 'Verified Iteration Lab Research Methods Track',
          description: 'Designing reproducible experiment pipelines, dialectal acoustic alignment benchmarks, and publication-grade LaTeX manuscripts with open Zenodo archival datasets.',
          footerMeta: 'Issued Oct 2026 · Credential ID TIL-MTH-204',
          linkLabel: null,
          linkUrl: null
        },
        {
          id: 'sk-2',
          spine: 'National Olympiad',
          category: 'Honor & Badge',
          meta: 'Bangladesh Informatics & Physics Cohort · 2025',
          title: 'National Finalist — Algorithmic & Experimental Problem Solving',
          subtitle: 'National Science & Informatics Competition',
          description: 'Recognized among top collegiate problem solvers in graph optimization, numerical simulation, and real-time sensor calibration under timed laboratory constraints.',
          footerMeta: 'National Merit Distinction · Dhaka Division',
          linkLabel: null,
          linkUrl: null
        }
      ],
      experiences: [
        {
          id: 'exp-1',
          period: 'Jan 2026 — Present',
          core: 'Lead Student Investigator — Open Speech & OCR Working Group',
          org: 'The Iteration Lab · Computational Linguistics Cohort',
          detail: 'Coordinating dataset annotation, phonetic alignment evaluation, and reproducible benchmark releases across 14 student contributors.'
        }
      ],
      researches: [
        {
          id: 'res-1',
          ilrid: 'ILR0001',
          spine: 'ILR0001',
          category: 'Computational Linguistics',
          meta: 'ILR0001 · Oct 2026',
          title: 'Dialectal Phonetic Alignment in Low-Resource Bengali Speech Recognition',
          subtitle: 'Peer-Reviewed Student Monograph',
          description: 'A standardized acoustic benchmark evaluating sequence-to-sequence neural architectures for dialectal sentence normalization across regional spoken variants.',
          image: '/profile/img/ocr_manuscript.jpg',
          footerMeta: 'Open Dataset Included',
          linkLabel: 'Open in Archive ↗',
          linkUrl: '/researches/'
        }
      ],
      softwares: [
        {
          id: 'sw-1',
          ilsid: 'ILS0001',
          spine: 'ILS0001',
          category: 'Open Source Build · v1.2',
          meta: 'ILS0001 · WebAssembly · TypeScript',
          title: 'BanglaLipi Web-OCR',
          subtitle: 'Client-Side Historical Manuscript Recognition Engine',
          description: 'Browser-native optical character recognition engine for Bengali ligatures running quantized ONNX models locally.',
          image: '/profile/img/ocr_manuscript.jpg',
          footerMeta: 'MIT License',
          linkLabel: 'Open in Registry ↗',
          linkUrl: '/softwares/'
        }
      ],
      cocurriculars: [
        {
          id: 'cc-1',
          spine: 'Science Club',
          category: 'Collegiate Leadership',
          meta: '2025 — 2026 · Notre Dame Science Club',
          title: 'Editorial Secretary — Annual Student Research Compendium',
          subtitle: 'Peer Review & Science Communication',
          description: 'Organized bi-weekly methodology workshops for 180+ first-year students and edited 22 investigative project abstracts.',
          footerMeta: '22 Student Abstracts Edited',
          linkLabel: null,
          linkUrl: null
        }
      ]
    },
    founder: {
      profileKey: 'founder',
      isLiveDb: false,
      cid: FOUNDER_LEADER_CID,
      accountType: 'S',
      name: 'Ikramul Hoque',
      institution: 'Founder & Chief of Governance and Development · The Iteration Lab',
      defaultInstitution: 'Founder & Chief of Governance and Development · The Iteration Lab',
      roleKicker: 'Student · Researcher · Founder',
      headline: 'Turn Insight Into Impact',
      lead: 'Guiding the governance, architectural vision, open research systems, and student publishing infrastructure of The Iteration Lab.',
      primaryCtaTarget: 'researches',
      whatsapp: '+8801890803091',
      email: 'coordination@iterationlab.org',
      location: 'Bangladesh · Open Educational Research Network',
      photo: '/leaders/img/Arik.webp',
      rawPhotoField: '/leaders/img/Arik.webp',
      statementKicker: 'ARCHITECTURAL VISION',
      quote: '“When students are trusted with real research infrastructure and transparent peer review, classrooms transform into engines of discovery.”',
      description: 'Designing full-stack open academic archives, institutional verification workflows, and collaborative software registries connecting secondary schools, colleges, and mentors nationwide.',
      gpas: {
        ssc: '5.00',
        sscSub: 'Science · Chittagong Ideal High School',
        hsc: '4.00',
        hscSub: 'Science · Gachbaria Govt College',
        ug: '0',
        ugSub: '',
        grad: '0',
        gradSub: '',
        researchCount: '04',
        researchSub: 'Published & Indexed'
      },
      education: [],
      skills: [],
      experiences: [],
      researches: [],
      softwares: [],
      cocurriculars: []
    },
    teacher: {
      profileKey: 'teacher',
      isLiveDb: false,
      cid: 'sample-teacher-cid-0002',
      accountType: 'T',
      name: 'Dr. Farhana Rahman',
      institution: 'Associate Professor of Physics · EIIN 108274',
      defaultInstitution: 'Associate Professor of Physics · EIIN 108274',
      roleKicker: ROLE_DEFAULTS.T.roleKicker,
      headline: ROLE_DEFAULTS.T.headline,
      lead: ROLE_DEFAULTS.T.lead,
      primaryCtaTarget: 'researches',
      whatsapp: '+880 1711-000202',
      email: 'farhana.mentor@iterationlab.org',
      location: 'Dhaka, Bangladesh',
      photo: '/profile/img/teacher_portrait.jpg',
      rawPhotoField: '',
      statementKicker: ROLE_DEFAULTS.T.statementKicker,
      quote: ROLE_DEFAULTS.T.quote,
      description: ROLE_DEFAULTS.T.description,
      gpas: {
        ssc: '5.00',
        sscSub: 'Science · Dhaka Board',
        hsc: '5.00',
        hscSub: 'Science · Merit List',
        ug: '3.92',
        ugSub: 'B.Sc. (Hons) Physics',
        grad: '3.98',
        gradSub: 'M.Sc. & Ph.D. Computational Physics',
        researchCount: '02',
        researchSub: 'Journals & Supervised Papers'
      },
      education: [
        {
          id: 't-edu-1',
          period: '2016 — 2020',
          core: 'Ph.D. in Computational Condensed Matter & Nonlinear Dynamics',
          org: 'University of Dhaka · Collaborative Numerical Lab',
          detail: 'Dissertation on finite-element transport simulations in disordered low-dimensional lattices.'
        }
      ],
      skills: [
        {
          id: 't-sk-1',
          spine: 'Peer Review',
          category: 'Editorial Governance',
          meta: 'Experimental Design · Error Propagation',
          title: 'Senior Academic Reviewer — Student & Collegiate Manuscripts',
          subtitle: 'The Iteration Lab Editorial Board',
          description: 'Evaluating statistical power, measurement uncertainty, and reproducibility across physics and applied mathematics submissions.',
          footerMeta: '38+ Student Manuscripts Reviewed',
          linkLabel: null,
          linkUrl: null
        }
      ],
      experiences: [
        {
          id: 't-exp-1',
          period: '2021 — Present',
          core: 'Associate Professor & Collegiate Research Coordinator',
          org: 'Department of Physics · Partner College Network',
          detail: 'Mentoring student research cohorts and supervising instrumentation calibration.'
        }
      ],
      researches: [],
      softwares: [],
      cocurriculars: []
    },
    publisher: {
      profileKey: 'publisher',
      isLiveDb: false,
      cid: 'sample-publisher-cid-0003',
      accountType: 'R',
      name: 'Mahmudul Hasan',
      institution: 'Independent Hydrological & Archival Publisher',
      defaultInstitution: 'Independent Hydrological & Archival Publisher',
      roleKicker: ROLE_DEFAULTS.R.roleKicker,
      headline: ROLE_DEFAULTS.R.headline,
      lead: ROLE_DEFAULTS.R.lead,
      primaryCtaTarget: 'softwares',
      whatsapp: '+880 1711-000303',
      email: 'mahmudul.open@iterationlab.org',
      location: 'Sylhet & Dhaka, Bangladesh',
      photo: '/leaders/img/sami.jpg',
      rawPhotoField: '',
      statementKicker: ROLE_DEFAULTS.R.statementKicker,
      quote: ROLE_DEFAULTS.R.quote,
      description: ROLE_DEFAULTS.R.description,
      gpas: {
        ssc: '4.88',
        sscSub: 'Science · Sylhet Board',
        hsc: '5.00',
        hscSub: 'Science · Sylhet Board',
        ug: '3.76',
        ugSub: 'B.Sc. Civil & Environmental Eng.',
        grad: '0',
        gradSub: 'Graduate CGPA',
        researchCount: '01',
        researchSub: 'Open Field Monographs'
      },
      education: [
        {
          id: 'r-edu-1',
          period: '2018 — 2022',
          core: 'B.Sc. in Civil & Environmental Engineering',
          org: 'Shahjalal University of Science and Technology (SUST)',
          detail: 'Undergraduate thesis on tidal embankment shear cohesion and open-source hydrological GIS mapping.'
        }
      ],
      skills: [
        {
          id: 'r-sk-1',
          spine: 'GIS & Hydrology',
          category: 'Field Instrumentation',
          meta: 'QGIS · Sentinel-1 SAR · Ultrasonic Gauges',
          title: 'Floodplain Mapping & Citizen Hydrological Telemetry',
          subtitle: 'Open Environmental Data Stewardship',
          description: 'Combining satellite flood extents with community-maintained river stage sensors to publish open CSV baselines.',
          footerMeta: 'Open Data Commons Attribution',
          linkLabel: null,
          linkUrl: null
        }
      ],
      experiences: [
        {
          id: 'r-exp-1',
          period: '2023 — Present',
          core: 'Independent Open-Science Publisher & Field Engineer',
          org: 'Surma-Kushiyara Basin Citizen Telemetry Project',
          detail: 'Maintaining solar river-level nodes and publishing seasonal sediment reports.'
        }
      ],
      researches: [],
      softwares: [],
      cocurriculars: []
    }
  };
}

/* ==========================================================================
   2. State, Supabase Client & Session Ownership Helpers
   ========================================================================== */
const STORAGE_PREFIX = 'til_portfolio_draft_v1_';
const OWNER_SIM_KEY = 'til_portfolio_sim_owner_v1';

let sbClient = null;
let saveStatusClearTimer = null;
let portraitLoadToken = 0;

const state = {
  isDemoMode: false,
  forceVisitor: false,
  activeProfileKey: 'founder',
  routeDescriptor: null,
  profile: null,
  supabaseUserId: null,
  simulateOwnerInDemo: true,
  isAccountOwner: false,
  isEditMode: false,
  recentIndex: 0,
  recentTimer: null,
  recentPaused: false,
  stackRafPending: false
};

function getSupabaseClient() {
  if (sbClient) return sbClient;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return sbClient;
  }
  return null;
}

function detectSupabaseSessionUserIdSync() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (/^sb-.*-auth-token$/i.test(key)) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const user = parsed?.user || parsed?.currentSession?.user;
        if (user && typeof user.id === 'string' && UUID_RE.test(user.id.trim())) {
          return user.id.trim();
        }
      }
    }
    const cookieMatch = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
    if (cookieMatch && cookieMatch[1]) {
      const parts = decodeURIComponent(cookieMatch[1]).split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload && typeof payload.sub === 'string' && UUID_RE.test(payload.sub.trim())) {
          return payload.sub.trim();
        }
      }
    }
  } catch (_) {
    // Ignore restricted iframe storage errors
  }
  return null;
}

async function refreshSessionUserId() {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data } = await client.auth.getSession();
      const uid = data?.session?.user?.id;
      if (uid && UUID_RE.test(uid)) {
        state.supabaseUserId = uid;
        return uid;
      }
      state.supabaseUserId = null;
      return null;
    } catch (_) {
      // Fallback to localStorage inspection below
    }
  }
  state.supabaseUserId = detectSupabaseSessionUserIdSync();
  return state.supabaseUserId;
}

function computeIsOwner() {
  if (state.forceVisitor) return false;
  if (!state.profile) return false;

  if (state.profile.isLiveDb) {
    const uid = state.supabaseUserId || detectSupabaseSessionUserIdSync();
    return Boolean(
      uid &&
      state.profile.cid &&
      uid.toLowerCase() === String(state.profile.cid).toLowerCase()
    );
  }

  if (state.isDemoMode) {
    return Boolean(state.simulateOwnerInDemo);
  }
  return false;
}

/* ==========================================================================
   3. Data Normalization, Path & Formatting Helpers
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

function isHttpUrl(val) {
  const s = cleanText(val);
  return /^https?:\/\/\S+$/i.test(s);
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

function formatShortDate(dateStr) {
  const s = cleanText(dateStr);
  if (!s) return '';
  const d = new Date(s.length === 10 ? `${s}T00:00:00` : s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function formatGpaFromDb(val) {
  if (val === null || val === undefined || val === '') return '0';
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return '0';
  return num.toFixed(2);
}

function resolveDefaultImageDirForType(accountType) {
  if (accountType === 'T') return IMAGE_DIRS.teachers;
  if (accountType === 'I') return IMAGE_DIRS.institutes;
  return IMAGE_DIRS.students;
}

function resolveImageSrc(val, defaultDir = IMAGE_DIRS.students) {
  const raw = cleanText(val).replace(/\\/g, '/');
  if (!raw) return '';
  if (/^data:image\//i.test(raw)) return raw;
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

function buildPortraitRetryQueue(initialSrc) {
  const candidates = [];
  const pushUnique = (u) => {
    if (u && u !== initialSrc && !candidates.includes(u)) {
      candidates.push(u);
    }
  };
  if (!initialSrc || /^https?:\/\/|^data:/i.test(initialSrc)) return candidates;

  const match = initialSrc.match(
    /^(\/(?:leaders|students|teachers|institutes|profile)\/img\/)([^/?#]+)(\.(?:jpe?g|png|webp))$/i
  );
  if (match) {
    const [, prefix, baseName, ext] = match;
    const toggled =
      baseName[0] === baseName[0].toUpperCase()
        ? baseName[0].toLowerCase() + baseName.slice(1)
        : baseName[0].toUpperCase() + baseName.slice(1);
    for (const b of [baseName, toggled]) {
      for (const e of [ext, '.webp', '.jpg', '.png']) {
        pushUnique(`${prefix}${b}${e}`);
      }
    }
    for (const altDir of MEMBER_CROSS_DIRS) {
      for (const b of [baseName, toggled]) {
        pushUnique(`${altDir}${b}${ext}`);
      }
    }
  }
  return candidates;
}

function getInitials(name) {
  const parts = cleanText(name).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'IL';
  if (parts.length === 1) return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();
  return (Array.from(parts[0])[0] + Array.from(parts[parts.length - 1])[0]).toUpperCase();
}

function isPositiveGpa(val) {
  if (val === null || val === undefined) return false;
  const cleaned = String(val).trim();
  if (!cleaned) return false;
  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num > 0;
}

function getRoleDefault(field) {
  const type = state.profile?.accountType || 'S';
  const pack = ROLE_DEFAULTS[type] || ROLE_DEFAULTS.S;
  if (field === 'institution' && state.profile?.defaultInstitution) {
    return state.profile.defaultInstitution;
  }
  return pack[field] || ROLE_DEFAULTS.S[field] || '';
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (cur[key] === undefined) return;
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
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

function buildOwnerWhatsAppUrl(rawWhatsapp, messageText = '') {
  const target = normalizeOwnerWhatsAppTarget(rawWhatsapp);
  if (!target) return null;
  const base = `https://wa.me/${target}`;
  if (!messageText) return base;
  return `${base}?text=${encodeURIComponent(messageText)}`;
}

function isValidPublicEmail(rawEmail) {
  const cleaned = cleanText(rawEmail);
  if (!cleaned || cleaned === '0') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
}

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

/* ==========================================================================
   4. URL Route Resolver & Live Supabase Portfolio Loader
   ========================================================================== */
function resolveRouteDescriptor() {
  const rawPath = window.location.pathname || '';
  const params = new URLSearchParams(window.location.search);

  state.forceVisitor = params.get('visitor') === '1';

  const savedSim = sessionStorage.getItem(OWNER_SIM_KEY);
  if (savedSim !== null) {
    state.simulateOwnerInDemo = savedSim === '1';
  }

  // Optional demo preview mode (strictly opt-in via ?demo=1 or ?sample=...)
  const sampleParam = cleanText(params.get('sample')).toLowerCase();
  if (params.get('demo') === '1' || sampleParam) {
    const key = ['student', 'founder', 'teacher', 'publisher'].includes(sampleParam)
      ? sampleParam
      : 'student';
    return { mode: 'demo', sampleKey: key };
  }

  // 1. Explicit UUID or ID query (?cid=<uuid> or ?id=<uuid>)
  const qCid = cleanText(params.get('cid') || params.get('id'));
  if (qCid) {
    if (UUID_RE.test(qCid)) {
      return { mode: 'live', lookup: 'cid', value: qCid };
    }
    return { mode: 'live', lookup: 'slug', value: qCid.toLowerCase() };
  }

  // 2. Explicit slug query (?slug=<slug> or ?profile=<slug>)
  const qSlug = cleanText(params.get('slug') || params.get('profile'));
  if (qSlug) {
    if (UUID_RE.test(qSlug)) {
      return { mode: 'live', lookup: 'cid', value: qSlug };
    }
    return { mode: 'live', lookup: 'slug', value: qSlug.toLowerCase() };
  }

  // 3. Clean path segments: /profile/<TYPE>/<slug> or /profile/<slug>
  const segments = rawPath
    .split('/')
    .map((s) => decodeURIComponent(s.trim()))
    .filter((s) => s && !/^index\.html$/i.test(s));

  // Strip leading segments up to and including "profile" or "profiles"
  const profIdx = segments.findIndex((s) => /^profiles?$/i.test(s));
  if (profIdx !== -1) {
    segments.splice(0, profIdx + 1);
  }

  if (segments.length >= 2 && /^[STRI]$/i.test(segments[0])) {
    const candidate = segments[1];
    if (UUID_RE.test(candidate)) {
      return { mode: 'live', lookup: 'cid', value: candidate };
    }
    return { mode: 'live', lookup: 'slug', value: candidate.toLowerCase() };
  }

  if (segments.length >= 1) {
    const candidate = segments[0];
    if (UUID_RE.test(candidate)) {
      return { mode: 'live', lookup: 'cid', value: candidate };
    }
    if (!/^[STRI]$/i.test(candidate)) {
      return { mode: 'live', lookup: 'slug', value: candidate.toLowerCase() };
    }
  }

  // 4. Bare /profile/ -> logged-in user's own account if signed in, else Founder live row
  const sessionUid = state.supabaseUserId || detectSupabaseSessionUserIdSync();
  if (sessionUid && UUID_RE.test(sessionUid)) {
    return {
      mode: 'live',
      lookup: 'cid',
      value: sessionUid,
      fallbackToFounder: true
    };
  }

  return { mode: 'live', lookup: 'cid', value: FOUNDER_LEADER_CID };
}

async function sbRestGet(queryPath) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${queryPath}`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if (!response.ok) {
    throw new Error(`Supabase GET failed (${response.status})`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function sbSafeGet(queryPath) {
  try {
    return await sbRestGet(queryPath);
  } catch (err) {
    console.warn('Non-fatal profile sub-query warning:', err);
    return [];
  }
}

const PROFILE_SELECT_COLS = [
  'cid',
  'type',
  'verified',
  'photo',
  'name',
  'slug',
  'profession',
  'institution_override',
  'q1',
  'research_interests',
  'hero_button',
  'whatsapp',
  'public_email',
  'location',
  'statement_kicker',
  'q2',
  'bio',
  'ssc_gpa',
  'ssc_sub',
  'hsc_gpa',
  'hsc_sub',
  'ug_cgpa',
  'ug_sub',
  'grad_cgpa',
  'grad_sub',
  'research_metric_sub'
].join(',');

async function fetchProfileRow(descriptor) {
  if (descriptor.lookup === 'cid') {
    const rows = await sbRestGet(
      `profiles?select=${PROFILE_SELECT_COLS}&cid=eq.${encodeURIComponent(descriptor.value)}&limit=1`
    );
    if (rows[0]) return rows[0];
    if (descriptor.fallbackToFounder && descriptor.value !== FOUNDER_LEADER_CID) {
      const founderRows = await sbRestGet(
        `profiles?select=${PROFILE_SELECT_COLS}&cid=eq.${encodeURIComponent(FOUNDER_LEADER_CID)}&limit=1`
      );
      return founderRows[0] || null;
    }
    return null;
  }

  const slug = cleanText(descriptor.value).toLowerCase();
  if (!slug) return null;

  const bySlug = await sbRestGet(
    `profiles?select=${PROFILE_SELECT_COLS}&slug=eq.${encodeURIComponent(slug)}&limit=1`
  );
  if (bySlug[0]) return bySlug[0];

  // Support Founder clean URL aliases (/profile/S/ikramulhoquearik, /profile/S/ikramul-hoque)
  if (FOUNDER_ALIASES.has(slug)) {
    const founderRows = await sbRestGet(
      `profiles?select=${PROFILE_SELECT_COLS}&cid=eq.${encodeURIComponent(FOUNDER_LEADER_CID)}&limit=1`
    );
    return founderRows[0] || null;
  }

  return null;
}

async function resolveDefaultInstitution(accountType, cid, leaderRow) {
  let eiin = '';
  if (accountType === 'S') {
    const sRows = await sbSafeGet(`students?select=eiin&cid=eq.${encodeURIComponent(cid)}&limit=1`);
    eiin = cleanText(sRows[0]?.eiin);
  } else if (accountType === 'T') {
    const tRows = await sbSafeGet(`teachers?select=eiin&cid=eq.${encodeURIComponent(cid)}&limit=1`);
    eiin = cleanText(tRows[0]?.eiin);
  } else if (accountType === 'I') {
    const iRows = await sbSafeGet(`institutes?select=eiin&cid=eq.${encodeURIComponent(cid)}&limit=1`);
    eiin = cleanText(iRows[0]?.eiin);
  }

  if (eiin) {
    const instRows = await sbSafeGet(
      `institutes?select=eiin,profiles(name)&eiin=eq.${encodeURIComponent(eiin)}&limit=1`
    );
    const profField = instRows[0]?.profiles;
    const instProf = Array.isArray(profField) ? profField[0] : profField;
    const instName = cleanText(instProf?.name);
    if (instName) {
      return `${instName} (EIIN ${eiin})`;
    }
    return `EIIN ${eiin}`;
  }

  const leaderRole = cleanText(leaderRow?.role);
  if (leaderRole) {
    return `${leaderRole} · The Iteration Lab`;
  }

  const pack = ROLE_DEFAULTS[accountType] || ROLE_DEFAULTS.S;
  return pack.institution;
}

function mapResearchRowToCard(row) {
  const ilrid = cleanText(row.ilrid) || 'RESEARCH';
  const category = cleanText(row.category) || 'Open Research';
  const pubShort = formatShortDate(row.publish_date);
  const keywords = parseStringArray(row.keywords);
  const reviewerCount = Array.isArray(row.reviewers) ? row.reviewers.length : 0;
  const likesCount = Number(row.likes ?? 0);
  const paperUrl = cleanText(row.paper_url);
  const hasExternalPaper = isHttpUrl(paperUrl);

  const metaPieces = [ilrid];
  if (pubShort) metaPieces.push(pubShort);
  if (row.is_sample === true) metaPieces.push('SAMPLE');

  const subtitle = keywords.length > 0
    ? `Keywords: ${keywords.join(' · ')}`
    : 'The Iteration Lab · Open Research Archive';

  const footerPieces = [`Reviewed by ${reviewerCount}`, `${likesCount} ${likesCount === 1 ? 'like' : 'likes'}`];

  return {
    id: ilrid,
    ilrid,
    spine: ilrid,
    category,
    meta: metaPieces.join(' · '),
    title: cleanText(row.title) || 'Untitled Research',
    subtitle,
    description: cleanText(row.abstract) || '',
    image: resolveImageSrc(row.cover_url, IMAGE_DIRS.researches),
    footerMeta: footerPieces.join(' · '),
    linkLabel: hasExternalPaper ? 'Read Full Paper ↗' : 'View in Archive ↗',
    linkUrl: hasExternalPaper ? paperUrl : `/researches/?id=${encodeURIComponent(ilrid)}`,
    readOnlyRegistry: true
  };
}

function mapSoftwareRowToCard(row) {
  const ilsid = cleanText(row.ilsid) || 'SOFTWARE';
  const categoryBase = cleanText(row.category) || 'Software Build';
  const status = cleanText(row.status);
  const category = status ? `${categoryBase} · ${status}` : categoryBase;
  const techList = parseStringArray(row.tech);
  const pubShort = formatShortDate(row.publish_date);
  const reviewerCount = Array.isArray(row.reviewers) ? row.reviewers.length : 0;
  const launchUrl = cleanText(row.url);
  const repoUrl = cleanText(row.repo_url);
  const primaryExternal = isHttpUrl(launchUrl) ? launchUrl : isHttpUrl(repoUrl) ? repoUrl : '';

  const metaPieces = [ilsid];
  if (techList.length > 0) {
    metaPieces.push(techList.slice(0, 3).join(' · '));
  } else if (pubShort) {
    metaPieces.push(pubShort);
  }
  if (row.is_sample === true) metaPieces.push('SAMPLE');

  const footerPieces = [`Reviewed by ${reviewerCount}`];
  if (status) footerPieces.push(status);

  return {
    id: ilsid,
    ilsid,
    spine: ilsid,
    category,
    meta: metaPieces.join(' · '),
    title: cleanText(row.name) || 'Untitled Software',
    subtitle: cleanText(row.tagline) || 'The Iteration Lab · Software Registry',
    description: cleanText(row.description) || '',
    image: resolveImageSrc(row.image_url, IMAGE_DIRS.softwares),
    footerMeta: footerPieces.join(' · '),
    linkLabel: isHttpUrl(launchUrl)
      ? 'Launch Software ↗'
      : isHttpUrl(repoUrl)
        ? 'Source Repository ↗'
        : 'View in Registry ↗',
    linkUrl: primaryExternal || `/softwares/?id=${encodeURIComponent(ilsid)}`,
    readOnlyRegistry: true
  };
}

async function loadLiveProfileFromSupabase(descriptor) {
  const profRow = await fetchProfileRow(descriptor);
  if (!profRow) return null;

  const cid = String(profRow.cid);
  const accountType = normalizeAccountType(profRow.type);
  const roleDefaults = ROLE_DEFAULTS[accountType] || ROLE_DEFAULTS.S;

  const [cvRows, cardRows, researchRows, softwareRows, leaderRows] = await Promise.all([
    sbSafeGet(
      `profile_cv_entries?select=id,entry_type,sort_order,period,core_title,organization_name,detail&cid=eq.${encodeURIComponent(cid)}&order=entry_type.asc,sort_order.asc`
    ),
    sbSafeGet(
      `profile_custom_cards?select=id,deck_type,sort_order,spine_label,category,meta_badge,title,subtitle,description,footer_meta,link_label,link_url&cid=eq.${encodeURIComponent(cid)}&order=deck_type.asc,sort_order.asc`
    ),
    sbSafeGet(
      `researches?select=ilrid,uid,title,abstract,category,keywords,paper_url,cover_url,publish_date,likes,comments,reviewers,is_sample&uid=cs.{${encodeURIComponent(cid)}}&order=publish_date.desc.nullslast,ilrid.asc`
    ),
    sbSafeGet(
      `software?select=ilsid,uid,name,tagline,description,category,tech,url,repo_url,image_url,status,publish_date,likes,comments,reviewers,is_sample&uid=cs.{${encodeURIComponent(cid)}}&order=publish_date.desc.nullslast,ilsid.asc`
    ),
    sbSafeGet(
      `leaders?select=display_name,role,profile_i,quote,bio,whatsapp&cid=eq.${encodeURIComponent(cid)}&limit=1`
    )
  ]);

  const leaderRow = leaderRows[0] || null;
  const defaultInstitution = await resolveDefaultInstitution(accountType, cid, leaderRow);

  const memberImgDir = resolveDefaultImageDirForType(accountType);
  const rawPhotoField = cleanText(profRow.photo);
  const resolvedProfilePhoto = resolveImageSrc(rawPhotoField, memberImgDir);
  const resolvedLeaderPhoto = resolveImageSrc(leaderRow?.profile_i, IMAGE_DIRS.leaders);
  const finalPhoto = resolvedProfilePhoto || resolvedLeaderPhoto;

  // Prefer display_name from leaders only if profiles.name is missing; otherwise use profiles.name
  // Note: for Founder, if display_name is set and profiles.name is uppercase legal name,
  // profiles.name is editable by owner directly on public.profiles!
  const displayName = cleanText(profRow.name) || cleanText(leaderRow?.display_name) || 'Member Researcher';

  const education = cvRows
    .filter((r) => r.entry_type === 'education')
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((r) => ({
      id: r.id,
      period: cleanText(r.period) || '2026',
      core: cleanText(r.core_title) || 'Academic Qualification',
      org: cleanText(r.organization_name) || defaultInstitution,
      detail: cleanText(r.detail)
    }));

  const experiences = cvRows
    .filter((r) => r.entry_type === 'experience')
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((r) => ({
      id: r.id,
      period: cleanText(r.period) || '2026',
      core: cleanText(r.core_title) || 'Research or Professional Role',
      org: cleanText(r.organization_name) || defaultInstitution,
      detail: cleanText(r.detail)
    }));

  const mapCustomCard = (r) => ({
    id: r.id,
    spine: cleanText(r.spine_label) || cleanText(r.title).split(/\s+/).slice(0, 2).join(' ') || 'Record',
    category: cleanText(r.category) || 'VERIFIED RECORD',
    meta: cleanText(r.meta_badge) || '2026',
    title: cleanText(r.title) || 'Untitled Record',
    subtitle: cleanText(r.subtitle),
    description: cleanText(r.description),
    footerMeta: cleanText(r.footer_meta),
    linkLabel: cleanText(r.link_label) || null,
    linkUrl: isHttpUrl(r.link_url) ? cleanText(r.link_url) : null,
    readOnlyRegistry: false
  });

  const skills = cardRows
    .filter((r) => r.deck_type === 'skills')
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map(mapCustomCard);

  const cocurriculars = cardRows
    .filter((r) => r.deck_type === 'cocurriculars')
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map(mapCustomCard);

  const researches = researchRows.map(mapResearchRowToCard);
  const softwares = softwareRows.map(mapSoftwareRowToCard);

  const leaderBioFallback =
    cleanText(leaderRow?.bio) && cleanText(leaderRow?.bio).toLowerCase() !== 'coming'
      ? cleanText(leaderRow.bio)
      : '';

  return {
    profileKey: cleanText(profRow.slug) || cid,
    isLiveDb: true,
    cid,
    slug: cleanText(profRow.slug),
    accountType,
    name: displayName,
    institution: cleanText(profRow.institution_override) || defaultInstitution,
    defaultInstitution,
    roleKicker: cleanText(profRow.profession) || roleDefaults.roleKicker,
    headline: cleanText(profRow.q1) || roleDefaults.headline,
    lead: cleanText(profRow.research_interests) || leaderBioFallback || roleDefaults.lead,
    primaryCtaTarget: Number(profRow.hero_button ?? 1) === 0 ? 'softwares' : 'researches',
    whatsapp: cleanText(profRow.whatsapp),
    email: cleanText(profRow.public_email),
    location: cleanText(profRow.location) || 'Bangladesh · The Iteration Lab',
    photo: finalPhoto,
    rawPhotoField,
    leaderFallbackPhoto: resolvedLeaderPhoto,
    statementKicker: cleanText(profRow.statement_kicker) || roleDefaults.statementKicker,
    quote: cleanText(profRow.q2) || roleDefaults.quote,
    description: cleanText(profRow.bio) || roleDefaults.description,
    gpas: {
      ssc: formatGpaFromDb(profRow.ssc_gpa),
      sscSub: cleanText(profRow.ssc_sub) || 'Secondary Examination',
      hsc: formatGpaFromDb(profRow.hsc_gpa),
      hscSub: cleanText(profRow.hsc_sub) || 'Higher Secondary',
      ug: formatGpaFromDb(profRow.ug_cgpa),
      ugSub: cleanText(profRow.ug_sub) || 'Undergraduate CGPA',
      grad: formatGpaFromDb(profRow.grad_cgpa),
      gradSub: cleanText(profRow.grad_sub) || 'Graduate CGPA',
      researchCount: String(researches.length).padStart(2, '0'),
      researchSub: cleanText(profRow.research_metric_sub) || 'Published & Indexed'
    },
    education,
    skills,
    experiences,
    researches,
    softwares,
    cocurriculars
  };
}

function loadDemoProfileData(profileKey) {
  const samples = createSamplePortfolios();
  const base = samples[profileKey] || samples.student;
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + base.profileKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.profileKey === base.profileKey) {
        if (parsed.photo === '/profile/img/student_portrait.jpg') {
          parsed.photo = '';
        }
        parsed.isLiveDb = false;
        return parsed;
      }
    }
  } catch (_) {
    // Ignore storage parse errors
  }
  return JSON.parse(JSON.stringify(base));
}

function persistDemoDraftIfNeeded() {
  if (!state.profile || state.profile.isLiveDb) return;
  try {
    localStorage.setItem(
      STORAGE_PREFIX + state.profile.profileKey,
      JSON.stringify(state.profile)
    );
  } catch (_) {
    // Ignore quota errors
  }
}

/* ==========================================================================
   5. Live Supabase Persistence (Authenticated Owner Writes via RLS)
   ========================================================================== */
function setSaveStatus(kind, message) {
  const el = document.getElementById('prof-save-status');
  if (!el) return;
  if (saveStatusClearTimer) {
    clearTimeout(saveStatusClearTimer);
    saveStatusClearTimer = null;
  }
  el.className = 'prof-save-status' + (kind ? ` is-${kind}` : '');
  el.textContent = message || '';

  if (kind === 'saved') {
    saveStatusClearTimer = setTimeout(() => {
      el.className = 'prof-save-status';
      el.textContent = '';
    }, 3200);
  }
}

async function saveProfileColumnsToDb(patchObj) {
  if (!state.profile || !state.profile.isLiveDb) {
    persistDemoDraftIfNeeded();
    return true;
  }

  const client = getSupabaseClient();
  if (!client || !state.isAccountOwner) return false;

  setSaveStatus('saving', 'Saving…');
  const { error } = await client
    .from('profiles')
    .update(patchObj)
    .eq('cid', state.profile.cid);

  if (error) {
    console.error('Failed to update public.profiles:', error);
    setSaveStatus('error', 'Could not save change');
    return false;
  }

  setSaveStatus('saved', 'Saved to database');
  return true;
}

function buildProfileScalarPatch(path, value) {
  const p = state.profile;
  switch (path) {
    case 'roleKicker':
      return { profession: clampStr(value, 80) || null };
    case 'name':
      return { name: clampStr(value, 120) || p.name };
    case 'institution':
      return { institution_override: clampStr(value, 160) || null };
    case 'headline':
      return { q1: clampStr(value, 140) || null };
    case 'lead':
      return { research_interests: clampStr(value, 500) || null };
    case 'whatsapp': {
      const hasWa = normalizeOwnerWhatsAppTarget(value);
      return { whatsapp: hasWa ? clampStr(value, 24) : null };
    }
    case 'email': {
      const cleaned = clampStr(value, 160);
      return { public_email: cleaned && cleaned !== '0' ? cleaned : null };
    }
    case 'location':
      return { location: clampStr(value, 120) || null };
    case 'statementKicker':
      return { statement_kicker: clampStr(value, 60) || null };
    case 'quote':
      return { q2: clampStr(value, 260) || null };
    case 'description':
      return { bio: clampStr(value, 800) || null };
    case 'gpas.ssc': {
      const num = Math.min(5, Math.max(0, parseFloat(value) || 0));
      return { ssc_gpa: Number(num.toFixed(2)) };
    }
    case 'gpas.sscSub':
      return { ssc_sub: clampStr(value, 60) || null };
    case 'gpas.hsc': {
      const num = Math.min(5, Math.max(0, parseFloat(value) || 0));
      return { hsc_gpa: Number(num.toFixed(2)) };
    }
    case 'gpas.hscSub':
      return { hsc_sub: clampStr(value, 60) || null };
    case 'gpas.ug': {
      const num = Math.min(5, Math.max(0, parseFloat(value) || 0));
      return num <= 0
        ? { ug_cgpa: 0, ug_sub: null }
        : { ug_cgpa: Number(num.toFixed(2)) };
    }
    case 'gpas.ugSub':
      return { ug_sub: clampStr(value, 60) || null };
    case 'gpas.grad': {
      const num = Math.min(5, Math.max(0, parseFloat(value) || 0));
      return num <= 0
        ? { grad_cgpa: 0, grad_sub: null }
        : { grad_cgpa: Number(num.toFixed(2)) };
    }
    case 'gpas.gradSub':
      return { grad_sub: clampStr(value, 60) || null };
    case 'gpas.researchSub':
      return { research_metric_sub: clampStr(value, 60) || null };
    default:
      return null;
  }
}

async function addCvEntry(arrayKey) {
  const list = state.profile[arrayKey];
  const isEdu = arrayKey === 'education';
  const draftItem = {
    id: `${arrayKey}-${Date.now()}`,
    period: '2026 — Present',
    core: isEdu
      ? 'New Academic Qualification'
      : 'New Research or Professional Experience',
    org: clampStr(state.profile.institution, 180) || 'Institution / Organization',
    detail: 'Double-click to describe coursework, methodology, responsibilities, or outcomes.'
  };

  if (!state.profile.isLiveDb) {
    list.push(draftItem);
    persistDemoDraftIfNeeded();
    renderAll();
    return;
  }

  const client = getSupabaseClient();
  if (!client || !state.isAccountOwner) return;

  setSaveStatus('saving', 'Adding entry…');
  const payload = {
    cid: state.profile.cid,
    entry_type: isEdu ? 'education' : 'experience',
    sort_order: list.length,
    period: clampStr(draftItem.period, 50),
    core_title: clampStr(draftItem.core, 160),
    organization_name: clampStr(draftItem.org, 180),
    detail: clampStr(draftItem.detail, 600)
  };

  const { data, error } = await client
    .from('profile_cv_entries')
    .insert(payload)
    .select('id,entry_type,sort_order,period,core_title,organization_name,detail')
    .single();

  if (error || !data) {
    console.error('Failed to insert CV entry:', error);
    setSaveStatus('error', 'Could not add CV entry');
    return;
  }

  list.push({
    id: data.id,
    period: cleanText(data.period),
    core: cleanText(data.core_title),
    org: cleanText(data.organization_name),
    detail: cleanText(data.detail)
  });
  setSaveStatus('saved', 'Added CV entry');
  renderAll();
}

async function updateCvEntryInDb(arrayKey, idx, prop, value) {
  const entry = state.profile?.[arrayKey]?.[idx];
  if (!entry) return;

  if (!state.profile.isLiveDb) {
    persistDemoDraftIfNeeded();
    return;
  }

  const client = getSupabaseClient();
  if (!client || !state.isAccountOwner || !UUID_RE.test(String(entry.id))) return;

  const colMap = {
    period: { col: 'period', max: 50, nonNull: '2026' },
    core: { col: 'core_title', max: 160, nonNull: 'Qualification' },
    org: { col: 'organization_name', max: 180, nonNull: 'Institution' },
    detail: { col: 'detail', max: 600, nonNull: null }
  };
  const spec = colMap[prop];
  if (!spec) return;

  const clamped = clampStr(value, spec.max);
  const dbVal = clamped || spec.nonNull;

  setSaveStatus('saving', 'Saving…');
  const { error } = await client
    .from('profile_cv_entries')
    .update({ [spec.col]: dbVal })
    .eq('id', entry.id)
    .eq('cid', state.profile.cid);

  if (error) {
    console.error('Failed to update CV entry:', error);
    setSaveStatus('error', 'Could not save CV entry');
    return;
  }
  setSaveStatus('saved', 'Saved to database');
}

async function removeCvEntry(arrayKey, idx) {
  const list = state.profile?.[arrayKey];
  if (!Array.isArray(list) || !list[idx]) return;
  const target = list[idx];

  if (!state.profile.isLiveDb) {
    list.splice(idx, 1);
    persistDemoDraftIfNeeded();
    renderAll();
    return;
  }

  const client = getSupabaseClient();
  if (!client || !state.isAccountOwner) return;

  setSaveStatus('saving', 'Removing…');
  if (UUID_RE.test(String(target.id))) {
    const { error } = await client
      .from('profile_cv_entries')
      .delete()
      .eq('id', target.id)
      .eq('cid', state.profile.cid);

    if (error) {
      console.error('Failed to delete CV entry:', error);
      setSaveStatus('error', 'Could not remove entry');
      return;
    }
  }

  list.splice(idx, 1);
  // Keep sort_order sequential in background
  list.forEach((item, orderIdx) => {
    if (UUID_RE.test(String(item.id))) {
      client
        .from('profile_cv_entries')
        .update({ sort_order: orderIdx })
        .eq('id', item.id)
        .eq('cid', state.profile.cid)
        .then(() => {});
    }
  });

  setSaveStatus('saved', 'Removed entry');
  renderAll();
}

async function addCustomStackedCard(sectionKey, stageEl) {
  const list = state.profile[sectionKey];
  const nextNum = list.length + 1;
  const isSkills = sectionKey === 'skills';

  const draftCard = isSkills
    ? {
        id: `sk-${Date.now()}`,
        spine: `Skill ${String(nextNum).padStart(2, '0')}`,
        category: 'CERTIFICATION & SKILL',
        meta: 'Issued 2026',
        title: 'New Skill, Badge, or Certification',
        subtitle: clampStr(state.profile.institution, 180) || 'Issuing Institution',
        description: 'Double-click this description to detail competencies, laboratory methods, tools mastered, or verification credentials.',
        footerMeta: 'Verified Record',
        linkLabel: null,
        linkUrl: null,
        readOnlyRegistry: false
      }
    : {
        id: `cc-${Date.now()}`,
        spine: `Activity ${String(nextNum).padStart(2, '0')}`,
        category: 'CO-CURRICULAR & COMMUNITY',
        meta: '2026 · Student Initiative',
        title: 'New Leadership, Club, or Community Role',
        subtitle: clampStr(state.profile.institution, 180) || 'The Iteration Lab Community',
        description: 'Double-click to summarize your role, workshops organized, students mentored, or community impact.',
        footerMeta: 'Active Contribution',
        linkLabel: null,
        linkUrl: null,
        readOnlyRegistry: false
      };

  if (!state.profile.isLiveDb) {
    list.push(draftCard);
    persistDemoDraftIfNeeded();
    renderAll();
    requestAnimationFrame(() => {
      const updatedStage = document.getElementById(stageEl.id);
      if (updatedStage) scrollToStackCard(updatedStage, list.length - 1);
    });
    return;
  }

  const client = getSupabaseClient();
  if (!client || !state.isAccountOwner) return;

  setSaveStatus('saving', 'Adding card…');
  const payload = {
    cid: state.profile.cid,
    deck_type: isSkills ? 'skills' : 'cocurriculars',
    sort_order: list.length,
    spine_label: clampStr(draftCard.spine, 28),
    category: clampStr(draftCard.category, 60) || 'VERIFIED RECORD',
    meta_badge: clampStr(draftCard.meta, 60) || null,
    title: clampStr(draftCard.title, 140) || 'Untitled Card',
    subtitle: clampStr(draftCard.subtitle, 180) || null,
    description: clampStr(draftCard.description, 700) || null,
    footer_meta: clampStr(draftCard.footerMeta, 100) || null,
    link_label: null,
    link_url: null
  };

  const { data, error } = await client
    .from('profile_custom_cards')
    .insert(payload)
    .select('id,deck_type,sort_order,spine_label,category,meta_badge,title,subtitle,description,footer_meta,link_label,link_url')
    .single();

  if (error || !data) {
    console.error('Failed to insert custom card:', error);
    setSaveStatus('error', 'Could not add card');
    return;
  }

  list.push({
    id: data.id,
    spine: cleanText(data.spine_label) || draftCard.spine,
    category: cleanText(data.category),
    meta: cleanText(data.meta_badge),
    title: cleanText(data.title),
    subtitle: cleanText(data.subtitle),
    description: cleanText(data.description),
    footerMeta: cleanText(data.footer_meta),
    linkLabel: cleanText(data.link_label) || null,
    linkUrl: isHttpUrl(data.link_url) ? cleanText(data.link_url) : null,
    readOnlyRegistry: false
  });

  setSaveStatus('saved', 'Added card');
  renderAll();

  requestAnimationFrame(() => {
    const updatedStage = document.getElementById(stageEl.id);
    if (updatedStage) scrollToStackCard(updatedStage, list.length - 1);
  });
}

async function updateCustomCardInDb(sectionKey, idx, prop, value) {
  const card = state.profile?.[sectionKey]?.[idx];
  if (!card || card.readOnlyRegistry) return;

  if (!state.profile.isLiveDb) {
    persistDemoDraftIfNeeded();
    return;
  }

  const client = getSupabaseClient();
  if (!client || !state.isAccountOwner || !UUID_RE.test(String(card.id))) return;

  const colMap = {
    spine: { col: 'spine_label', max: 28, nonNull: null },
    category: { col: 'category', max: 60, nonNull: 'VERIFIED RECORD' },
    meta: { col: 'meta_badge', max: 60, nonNull: null },
    title: { col: 'title', max: 140, nonNull: 'Untitled Entry' },
    subtitle: { col: 'subtitle', max: 180, nonNull: null },
    description: { col: 'description', max: 700, nonNull: null },
    footerMeta: { col: 'footer_meta', max: 100, nonNull: null }
  };
  const spec = colMap[prop];
  if (!spec) return;

  const clamped = clampStr(value, spec.max);
  const dbVal = clamped || spec.nonNull;

  setSaveStatus('saving', 'Saving…');
  const { error } = await client
    .from('profile_custom_cards')
    .update({ [spec.col]: dbVal })
    .eq('id', card.id)
    .eq('cid', state.profile.cid);

  if (error) {
    console.error('Failed to update custom card:', error);
    setSaveStatus('error', 'Could not save card');
    return;
  }
  setSaveStatus('saved', 'Saved to database');
}

async function deleteCustomCard(sectionKey, idx) {
  const list = state.profile?.[sectionKey];
  if (!Array.isArray(list) || !list[idx] || list[idx].readOnlyRegistry) return;
  const target = list[idx];

  if (!state.profile.isLiveDb) {
    list.splice(idx, 1);
    persistDemoDraftIfNeeded();
    renderAll();
    return;
  }

  const client = getSupabaseClient();
  if (!client || !state.isAccountOwner) return;

  setSaveStatus('saving', 'Deleting card…');
  if (UUID_RE.test(String(target.id))) {
    const { error } = await client
      .from('profile_custom_cards')
      .delete()
      .eq('id', target.id)
      .eq('cid', state.profile.cid);

    if (error) {
      console.error('Failed to delete custom card:', error);
      setSaveStatus('error', 'Could not delete card');
      return;
    }
  }

  list.splice(idx, 1);
  list.forEach((item, orderIdx) => {
    if (UUID_RE.test(String(item.id))) {
      client
        .from('profile_custom_cards')
        .update({ sort_order: orderIdx })
        .eq('id', item.id)
        .eq('cid', state.profile.cid)
        .then(() => {});
    }
  });

  setSaveStatus('saved', 'Deleted card');
  renderAll();
}

async function handleCommittedPathSave(path, newVal) {
  if (!state.profile) return;

  // Check array paths: education.0.core, experiences.1.detail, skills.2.title, cocurriculars.0.description
  const parts = path.split('.');
  if (parts.length === 3) {
    const [section, idxRaw, prop] = parts;
    const idx = parseInt(idxRaw, 10);
    if (Number.isNaN(idx)) return;

    if (section === 'education' || section === 'experiences') {
      await updateCvEntryInDb(section, idx, prop, newVal);
      return;
    }
    if (section === 'skills' || section === 'cocurriculars') {
      await updateCustomCardInDb(section, idx, prop, newVal);
      return;
    }
    persistDemoDraftIfNeeded();
    return;
  }

  const scalarPatch = buildProfileScalarPatch(path, newVal);
  if (scalarPatch) {
    await saveProfileColumnsToDb(scalarPatch);
  } else {
    persistDemoDraftIfNeeded();
  }
}

/* ==========================================================================
   6. Rendering the Complete Portfolio
   ========================================================================== */
function showProfileNotFound(headingText, messageText) {
  const statusScreen = document.getElementById('prof-status-screen');
  const mainContent = document.getElementById('main-content');
  const hEl = document.getElementById('prof-status-heading');
  const mEl = document.getElementById('prof-status-message');
  const eyeBtn = document.getElementById('profile-eye-btn');

  if (eyeBtn) eyeBtn.hidden = true;
  if (mainContent) mainContent.hidden = true;
  if (statusScreen) statusScreen.hidden = false;
  if (hEl && headingText) hEl.textContent = headingText;
  if (mEl && messageText) mEl.textContent = messageText;
  document.title = 'Member Portfolio · The Iteration Lab';
}

function showMainPortfolioView() {
  const statusScreen = document.getElementById('prof-status-screen');
  const mainContent = document.getElementById('main-content');
  if (statusScreen) statusScreen.hidden = true;
  if (mainContent) mainContent.hidden = false;
}

function renderAll() {
  if (!state.profile) return;
  showMainPortfolioView();

  state.isAccountOwner = computeIsOwner();
  if (!state.isAccountOwner && state.isEditMode) {
    state.isEditMode = false;
  }

  document.body.classList.toggle('is-edit-mode', state.isEditMode);
  document.title = `${state.profile.name} · Portfolio · The Iteration Lab`;

  renderHeaderControls();
  renderHeroSection();
  renderRecentResearchesCard();
  renderObsidianBand();
  renderCvSection('education', 'edu-cv-list', 'No academic education entries listed yet.');
  renderCvSection('experiences', 'exp-cv-list', 'No research or work experiences listed yet.');
  renderStackedSection(
    'skills',
    'skills-stack-stage',
    'skills-stack-counter',
    'skill, badge or certification',
    'No skills, badges, or certifications listed yet.'
  );
  renderStackedSection(
    'researches',
    'researches-stack-stage',
    'researches-stack-counter',
    'research or journal',
    'No published research papers or preprints indexed for this member yet.'
  );
  renderStackedSection(
    'softwares',
    'softwares-stack-stage',
    'softwares-stack-counter',
    'software project',
    'No software builds indexed for this member yet.'
  );
  renderStackedSection(
    'cocurriculars',
    'cocurriculars-stack-stage',
    'cocurriculars-stack-counter',
    'co-curricular activity',
    'No co-curricular or community leadership activities listed yet.'
  );
  renderContactDetails();
  renderDemoDock();

  requestAnimationFrame(() => {
    recalculateStackRunways();
    updateAllStackPositions();
  });
}

function renderHeaderControls() {
  const eyeBtn = document.getElementById('profile-eye-btn');
  const eyeLabel = document.getElementById('profile-eye-label');
  const editRibbon = document.getElementById('prof-edit-ribbon');
  const ctaSwitchBtn = document.getElementById('prof-cta-switch-btn');
  const photoEditBtn = document.getElementById('prof-photo-edit-btn');
  const resetDefaultsBtn = document.getElementById('prof-reset-defaults-btn');

  if (eyeBtn) {
    eyeBtn.hidden = !state.isAccountOwner;
    eyeBtn.setAttribute('aria-pressed', state.isEditMode ? 'true' : 'false');
    eyeBtn.setAttribute(
      'title',
      state.isEditMode ? 'Switch back to User View' : 'Switch to Edit Mode (double-click texts to edit)'
    );
  }

  if (eyeLabel) {
    eyeLabel.textContent = state.isEditMode ? 'User View' : 'Edit';
  }

  if (editRibbon) {
    editRibbon.hidden = !state.isEditMode;
  }

  if (resetDefaultsBtn) {
    resetDefaultsBtn.textContent = state.profile?.isLiveDb
      ? 'Reload Saved Data'
      : 'Reset Sample Defaults';
  }

  if (ctaSwitchBtn) {
    ctaSwitchBtn.hidden = !state.isEditMode;
    const nextLabel = state.profile.primaryCtaTarget === 'softwares' ? 'Researches' : 'Software';
    ctaSwitchBtn.textContent = `Switch button to "${nextLabel}"`;
  }

  if (photoEditBtn) {
    photoEditBtn.hidden = !state.isEditMode;
  }
}

function renderHeroSection() {
  const p = state.profile;

  const kickerEl = document.getElementById('prof-role-kicker');
  if (kickerEl) {
    kickerEl.textContent = p.roleKicker || getRoleDefault('roleKicker');
    kickerEl.dataset.default = getRoleDefault('roleKicker');
  }

  const nameEl = document.getElementById('prof-member-name');
  if (nameEl) {
    nameEl.textContent = p.name;
    nameEl.dataset.default = p.name || 'Member Researcher';
  }

  const instEl = document.getElementById('prof-member-inst');
  if (instEl) {
    instEl.textContent = p.institution || getRoleDefault('institution');
    instEl.dataset.default = getRoleDefault('institution');
  }

  const headlineEl = document.getElementById('prof-hero-headline');
  if (headlineEl) {
    headlineEl.textContent = p.headline || getRoleDefault('headline');
    headlineEl.dataset.default = getRoleDefault('headline');
  }

  const leadEl = document.getElementById('prof-hero-lead');
  if (leadEl) {
    leadEl.textContent = p.lead || getRoleDefault('lead');
    leadEl.dataset.default = getRoleDefault('lead');
  }

  const primaryBtn = document.getElementById('prof-primary-cta');
  const primaryBtnText = document.getElementById('prof-primary-cta-text');
  if (primaryBtn && primaryBtnText) {
    const isSw = p.primaryCtaTarget === 'softwares';
    primaryBtnText.textContent = isSw ? 'Software' : 'Researches';
    primaryBtn.setAttribute('href', isSw ? '#softwares-section' : '#researches-section');
  }

  const waBtn = document.getElementById('prof-whatsapp-cta');
  if (waBtn) {
    const ownerWaHref = buildOwnerWhatsAppUrl(p.whatsapp);
    if (ownerWaHref) {
      waBtn.hidden = false;
      waBtn.setAttribute('href', ownerWaHref);
    } else {
      waBtn.hidden = true;
      waBtn.removeAttribute('href');
    }
  }

  // Portrait image with zero-flash loading, cross-directory fallback queue & 2-letter initials fallback
  const imgEl = document.getElementById('prof-portrait-img');
  const fallbackEl = document.getElementById('prof-portrait-fallback');
  const initialsEl = document.getElementById('prof-portrait-initials');
  if (initialsEl) {
    initialsEl.textContent = getInitials(p.name);
  }
  if (imgEl && fallbackEl) {
    if (p.photo) {
      if (
        imgEl.dataset.loadedKey === p.photo &&
        !imgEl.hidden &&
        !imgEl.classList.contains('is-loading') &&
        imgEl.complete &&
        imgEl.naturalWidth > 0
      ) {
        imgEl.alt = `${p.name} portrait`;
        fallbackEl.hidden = true;
      } else {
        const loadToken = ++portraitLoadToken;
        const candidates = [p.photo, ...buildPortraitRetryQueue(p.photo)];
        if (
          p.leaderFallbackPhoto &&
          !candidates.includes(p.leaderFallbackPhoto)
        ) {
          candidates.push(p.leaderFallbackPhoto);
        }

        imgEl.alt = `${p.name} portrait`;
        fallbackEl.hidden = true;
        imgEl.classList.add('is-loading');
        imgEl.hidden = false;

        const tryCandidate = (idx) => {
          if (loadToken !== portraitLoadToken) return;
          if (idx >= candidates.length) {
            imgEl.onload = null;
            imgEl.onerror = null;
            imgEl.removeAttribute('src');
            delete imgEl.dataset.loadedKey;
            imgEl.classList.remove('is-loading');
            imgEl.hidden = true;
            fallbackEl.hidden = false;
            return;
          }

          const nextSrc = candidates[idx];
          imgEl.onload = () => {
            if (loadToken !== portraitLoadToken) return;
            imgEl.dataset.loadedKey = p.photo;
            imgEl.classList.remove('is-loading');
            imgEl.hidden = false;
            fallbackEl.hidden = true;
          };
          imgEl.onerror = () => {
            if (loadToken !== portraitLoadToken) return;
            tryCandidate(idx + 1);
          };
          imgEl.src = nextSrc;

          if (imgEl.complete && imgEl.naturalWidth > 0) {
            imgEl.dataset.loadedKey = p.photo;
            imgEl.classList.remove('is-loading');
            imgEl.hidden = false;
            fallbackEl.hidden = true;
          }
        };

        tryCandidate(0);
      }
    } else {
      ++portraitLoadToken;
      imgEl.onload = null;
      imgEl.onerror = null;
      imgEl.removeAttribute('src');
      delete imgEl.dataset.loadedKey;
      imgEl.classList.remove('is-loading');
      imgEl.hidden = true;
      fallbackEl.hidden = false;
    }
  }
}

function renderRecentResearchesCard() {
  const list = Array.isArray(state.profile?.researches) ? state.profile.researches : [];
  const slideContainer = document.getElementById('prof-recent-slide');
  if (!slideContainer) return;

  slideContainer.textContent = '';

  if (list.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'prof-recent-title';
    emptyMsg.textContent = 'No published research entries yet.';
    slideContainer.appendChild(emptyMsg);
    return;
  }

  if (state.recentIndex >= list.length) state.recentIndex = 0;
  if (state.recentIndex < 0) state.recentIndex = list.length - 1;

  const item = list[state.recentIndex];

  const thumb = document.createElement('div');
  thumb.className = 'prof-recent-thumb';
  if (item.image) {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
      img.remove();
      const fb = document.createElement('div');
      fb.className = 'prof-recent-thumb-fallback';
      fb.textContent = `${item.ilrid || 'RESEARCH'} · ${item.category || 'MONOGRAPH'}`;
      thumb.appendChild(fb);
    };
    thumb.appendChild(img);
  } else {
    const fb = document.createElement('div');
    fb.className = 'prof-recent-thumb-fallback';
    fb.textContent = `${item.ilrid || 'RESEARCH'} · ${item.category || 'MONOGRAPH'}`;
    thumb.appendChild(fb);
  }

  const title = document.createElement('div');
  title.className = 'prof-recent-title';
  title.textContent = item.title;

  const meta = document.createElement('div');
  meta.className = 'prof-recent-meta';

  const countSpan = document.createElement('span');
  const idxStr = String(state.recentIndex + 1).padStart(2, '0');
  const totalStr = String(list.length).padStart(2, '0');
  countSpan.textContent = `${idxStr} / ${totalStr} · ${item.category || 'Research'}`;

  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.className = 'prof-recent-open';
  openBtn.textContent = 'Inspect ↗';
  openBtn.addEventListener('click', () => openItemReaderModal(item, 'Research Paper'));

  meta.appendChild(countSpan);
  meta.appendChild(openBtn);

  slideContainer.appendChild(thumb);
  slideContainer.appendChild(title);
  slideContainer.appendChild(meta);
}

/* ==========================================================================
   7. Obsidian Quote, Description & Dynamic GPA Strip
   ========================================================================== */
function renderObsidianBand() {
  const p = state.profile;

  const stKicker = document.getElementById('prof-statement-kicker');
  if (stKicker) {
    stKicker.textContent = p.statementKicker || getRoleDefault('statementKicker');
    stKicker.dataset.default = getRoleDefault('statementKicker');
  }

  const quoteEl = document.getElementById('prof-quote-text');
  if (quoteEl) {
    quoteEl.textContent = p.quote || getRoleDefault('quote');
    quoteEl.dataset.default = getRoleDefault('quote');
  }

  const descEl = document.getElementById('prof-description-text');
  if (descEl) {
    descEl.textContent = p.description || getRoleDefault('description');
    descEl.dataset.default = getRoleDefault('description');
  }

  const metricsRow = document.getElementById('prof-metrics-row');
  if (!metricsRow) return;
  metricsRow.textContent = '';

  const g = p.gpas || {};
  const ugNumeric = parseFloat(g.ug || '0');
  const gradNumeric = parseFloat(g.grad || '0');
  const derivedResearchCount = String((p.researches || []).length).padStart(2, '0');

  const metricDefs = [
    {
      key: 'ssc',
      label: 'SSC GPA',
      value: g.ssc,
      scale: '/ 5.00',
      subKey: 'sscSub',
      sub: g.sscSub || 'Secondary Examination',
      isGpa: true,
      editableValue: true
    },
    {
      key: 'hsc',
      label: 'HSC GPA',
      value: g.hsc,
      scale: '/ 5.00',
      subKey: 'hscSub',
      sub: g.hscSub || 'Higher Secondary',
      isGpa: true,
      editableValue: true
    },
    {
      key: 'ug',
      label: 'UG / Others',
      value: g.ug,
      scale: ugNumeric > 4.0 ? '/ 5.00' : '/ 4.00',
      subKey: 'ugSub',
      sub: g.ugSub || 'Undergraduate CGPA',
      isGpa: true,
      editableValue: true
    },
    {
      key: 'grad',
      label: 'Graduate',
      value: g.grad,
      scale: gradNumeric > 4.0 ? '/ 5.00' : '/ 4.00',
      subKey: 'gradSub',
      sub: g.gradSub || 'Graduate CGPA',
      isGpa: true,
      editableValue: true
    },
    {
      key: 'researchCount',
      label: 'Research & Journal',
      value: p.isLiveDb ? derivedResearchCount : (g.researchCount || derivedResearchCount),
      scale: 'works',
      subKey: 'researchSub',
      sub: g.researchSub || 'Published & Indexed',
      isGpa: false,
      editableValue: !p.isLiveDb
    }
  ];

  const visibleDefs = metricDefs.filter((m) => {
    if (!m.isGpa) return true;
    if (state.isEditMode) return true;
    return isPositiveGpa(m.value);
  });

  metricsRow.style.setProperty('--metric-cols', String(Math.max(1, visibleDefs.length)));

  visibleDefs.forEach((m) => {
    const zeroHidden = m.isGpa && !isPositiveGpa(m.value);
    const cell = document.createElement('div');
    cell.className = 'prof-metric-cell' + (zeroHidden ? ' is-zero-hidden-preview' : '');

    const valWrap = document.createElement('div');
    valWrap.className = 'prof-metric-value-wrap';

    const valSpan = document.createElement('span');
    valSpan.className = 'prof-metric-value';
    valSpan.textContent = zeroHidden ? '0' : String(m.value);
    if (m.editableValue) {
      valSpan.dataset.editable = `gpas.${m.key}`;
      valSpan.dataset.singleLine = 'true';
      valSpan.dataset.gpaField = m.isGpa ? 'true' : 'false';
      valSpan.dataset.default = m.isGpa ? '0' : '01';
    }

    const scaleSpan = document.createElement('span');
    scaleSpan.className = 'prof-metric-scale';
    scaleSpan.textContent = m.scale;

    valWrap.appendChild(valSpan);
    valWrap.appendChild(scaleSpan);

    const labelDiv = document.createElement('div');
    labelDiv.className = 'prof-metric-label';
    labelDiv.textContent = m.label;

    const subDiv = document.createElement('div');
    subDiv.className = 'prof-metric-sub';
    if (zeroHidden && state.isEditMode) {
      subDiv.textContent = 'Hidden (0) · Double-click GPA to show';
    } else {
      subDiv.textContent = m.sub;
      subDiv.dataset.editable = `gpas.${m.subKey}`;
      subDiv.dataset.singleLine = 'true';
      subDiv.dataset.default = m.sub;
    }

    cell.appendChild(valWrap);
    cell.appendChild(labelDiv);
    cell.appendChild(subDiv);
    metricsRow.appendChild(cell);
  });
}

/* ==========================================================================
   8. CV Timeline Renderer (Education & Experiences)
   ========================================================================== */
function renderCvSection(arrayKey, containerId, emptyMessage) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.textContent = '';

  const items = Array.isArray(state.profile[arrayKey]) ? state.profile[arrayKey] : [];

  if (items.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'prof-cv-empty';
    emptyEl.textContent = state.isEditMode
      ? `${emptyMessage} Click the button below to add your first entry.`
      : emptyMessage;
    container.appendChild(emptyEl);
  }

  items.forEach((entry, idx) => {
    const row = document.createElement('article');
    row.className = 'prof-cv-item';

    const period = document.createElement('div');
    period.className = 'prof-cv-period';
    period.textContent = entry.period || '2026';
    period.dataset.editable = `${arrayKey}.${idx}.period`;
    period.dataset.singleLine = 'true';
    period.dataset.default = '2026';

    const main = document.createElement('div');
    main.className = 'prof-cv-main';

    const coreRow = document.createElement('div');
    coreRow.className = 'prof-cv-core-row';

    const core = document.createElement('h3');
    core.className = 'prof-cv-core';
    core.textContent = entry.core;
    core.dataset.editable = `${arrayKey}.${idx}.core`;
    core.dataset.singleLine = 'true';
    core.dataset.default = arrayKey === 'education' ? 'Academic Degree or Certificate' : 'Research Role or Position';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'prof-item-remove-btn';
    removeBtn.hidden = !state.isEditMode;
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      removeCvEntry(arrayKey, idx);
    });

    coreRow.appendChild(core);
    coreRow.appendChild(removeBtn);

    const org = document.createElement('div');
    org.className = 'prof-cv-org';
    org.textContent = entry.org;
    org.dataset.editable = `${arrayKey}.${idx}.org`;
    org.dataset.singleLine = 'true';
    org.dataset.default = 'Institution or Research Group';

    const detail = document.createElement('p');
    detail.className = 'prof-cv-detail';
    detail.textContent = entry.detail || '';
    detail.dataset.editable = `${arrayKey}.${idx}.detail`;
    detail.dataset.default = 'Summary of coursework, experimental focus, or academic contribution.';

    main.appendChild(coreRow);
    main.appendChild(org);
    main.appendChild(detail);

    row.appendChild(period);
    row.appendChild(main);
    container.appendChild(row);
  });

  const addBtn = document.getElementById(`${arrayKey}-add-btn`);
  if (addBtn) {
    addBtn.hidden = !state.isEditMode;
    addBtn.onclick = () => addCvEntry(arrayKey);
  }
}

/* ==========================================================================
   9. Horizontal Right-to-Left Stacked Cards Renderer & Scroll Engine
   ========================================================================== */
function renderStackedSection(sectionKey, stageId, counterId, singularNoun, emptyMessage) {
  const stage = document.getElementById(stageId);
  if (!stage) return;
  stage.textContent = '';

  const sectionEl = stage.closest('.prof-stack-section');
  const items = Array.isArray(state.profile[sectionKey]) ? state.profile[sectionKey] : [];
  const showMediaSlot = sectionKey === 'researches' || sectionKey === 'softwares';
  const isRegistrySection = sectionKey === 'researches' || sectionKey === 'softwares';
  const isLiveRegistry = Boolean(state.profile.isLiveDb && isRegistrySection);
  const canEditCardsInline = state.isEditMode && !isLiveRegistry;

  // Compact empty deck in User View when member has 0 cards in this section
  if (items.length === 0 && !state.isEditMode) {
    if (sectionEl) sectionEl.classList.add('is-empty-deck');
    const emptyBox = document.createElement('div');
    emptyBox.className = 'prof-stack-empty-card';
    emptyBox.textContent = emptyMessage;
    stage.appendChild(emptyBox);

    const counterEl = document.getElementById(counterId);
    if (counterEl) {
      counterEl.textContent = '00 entries';
    }
    return;
  }

  if (sectionEl) sectionEl.classList.remove('is-empty-deck');

  items.forEach((item, idx) => {
    const card = document.createElement('article');
    card.className = 'prof-stack-card';
    card.dataset.cardIndex = String(idx);

    // Left Index Spine (peeks on the left as newer cards glide from right to left)
    const spine = document.createElement('div');
    spine.className = 'prof-card-spine';
    spine.setAttribute('title', `Scroll to card ${idx + 1}: ${item.title}`);
    spine.addEventListener('click', (e) => {
      if (e.target.getAttribute && e.target.getAttribute('contenteditable') === 'true') return;
      scrollToStackCard(stage, idx);
    });

    const spineNum = document.createElement('span');
    spineNum.className = 'prof-spine-num';
    spineNum.textContent = String(idx + 1).padStart(2, '0');

    const spineLabel = document.createElement('span');
    spineLabel.className = 'prof-spine-label';
    spineLabel.textContent = item.spine || item.category || `Item ${idx + 1}`;
    if (canEditCardsInline) {
      spineLabel.dataset.editable = `${sectionKey}.${idx}.spine`;
      spineLabel.dataset.singleLine = 'true';
      spineLabel.dataset.default = `Item ${idx + 1}`;
    }

    spine.appendChild(spineNum);
    spine.appendChild(spineLabel);

    const inner = document.createElement('div');
    inner.className = 'prof-stack-card-inner' + (showMediaSlot ? ' has-media' : '');

    const copyCol = document.createElement('div');
    copyCol.className = 'prof-card-copy';

    const topGroup = document.createElement('div');

    const metaLine = document.createElement('div');
    metaLine.className = 'prof-card-meta-line';

    const catSpan = document.createElement('span');
    catSpan.className = 'prof-meta-accent';
    catSpan.textContent = item.category || 'Academic Entry';
    if (canEditCardsInline) {
      catSpan.dataset.editable = `${sectionKey}.${idx}.category`;
      catSpan.dataset.singleLine = 'true';
      catSpan.dataset.default = 'VERIFIED RECORD';
    }

    const sepSpan = document.createElement('span');
    sepSpan.className = 'prof-meta-sep';
    sepSpan.setAttribute('aria-hidden', 'true');
    sepSpan.textContent = '·';

    const dateSpan = document.createElement('span');
    dateSpan.textContent = item.meta || '2026';
    if (canEditCardsInline) {
      dateSpan.dataset.editable = `${sectionKey}.${idx}.meta`;
      dateSpan.dataset.singleLine = 'true';
      dateSpan.dataset.default = '2026';
    }

    metaLine.appendChild(catSpan);
    metaLine.appendChild(sepSpan);
    metaLine.appendChild(dateSpan);

    if (canEditCardsInline) {
      const linkBtn = document.createElement('button');
      linkBtn.type = 'button';
      linkBtn.className = 'prof-item-remove-btn';
      linkBtn.style.borderColor = '#CBD5E1';
      linkBtn.style.background = '#F8FAFC';
      linkBtn.style.color = '#334155';
      linkBtn.textContent = item.linkUrl ? 'Edit Link' : 'Set Link';
      linkBtn.addEventListener('click', () => openCardLinkEditorModal(sectionKey, idx));
      metaLine.appendChild(linkBtn);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'prof-item-remove-btn';
      delBtn.textContent = 'Delete Card';
      delBtn.addEventListener('click', () => deleteCustomCard(sectionKey, idx));
      metaLine.appendChild(delBtn);
    }

    const titleEl = document.createElement('h3');
    titleEl.className = 'prof-card-title';
    titleEl.textContent = item.title;
    if (canEditCardsInline) {
      titleEl.dataset.editable = `${sectionKey}.${idx}.title`;
      titleEl.dataset.singleLine = 'true';
      titleEl.dataset.default = 'Untitled Portfolio Entry';
    }

    const subEl = document.createElement('div');
    subEl.className = 'prof-card-subtitle';
    subEl.textContent = item.subtitle || '';
    if (canEditCardsInline) {
      subEl.dataset.editable = `${sectionKey}.${idx}.subtitle`;
      subEl.dataset.singleLine = 'true';
      subEl.dataset.default = state.profile.institution || 'The Iteration Lab';
    }

    topGroup.appendChild(metaLine);
    topGroup.appendChild(titleEl);
    topGroup.appendChild(subEl);

    const descEl = document.createElement('p');
    descEl.className = 'prof-card-desc';
    descEl.textContent = item.description || '';
    if (canEditCardsInline) {
      descEl.dataset.editable = `${sectionKey}.${idx}.description`;
      descEl.dataset.default = 'Detailed summary of methods, technical execution, and verified findings.';
    }

    const footer = document.createElement('div');
    footer.className = 'prof-card-footer';

    const specs = document.createElement('span');
    specs.className = 'prof-card-specs';
    specs.textContent = item.footerMeta || 'Verified Portfolio Record';
    if (canEditCardsInline) {
      specs.dataset.editable = `${sectionKey}.${idx}.footerMeta`;
      specs.dataset.singleLine = 'true';
      specs.dataset.default = 'Verified Portfolio Record';
    }

    const linksWrap = document.createElement('div');
    linksWrap.className = 'prof-card-links';

    if (item.linkUrl) {
      const directLink = document.createElement('a');
      directLink.className = 'prof-card-link';
      directLink.href = item.linkUrl;
      if (isHttpUrl(item.linkUrl)) {
        directLink.target = '_blank';
        directLink.rel = 'noopener noreferrer';
      }
      directLink.textContent = item.linkLabel || 'Open Link ↗';
      linksWrap.appendChild(directLink);
    }

    const inspectBtn = document.createElement('button');
    inspectBtn.type = 'button';
    inspectBtn.className = 'prof-card-link';
    inspectBtn.textContent = item.linkUrl ? 'Details' : (item.linkLabel || 'View Details ↗');
    inspectBtn.addEventListener('click', () => openItemReaderModal(item, singularNoun));
    linksWrap.appendChild(inspectBtn);

    footer.appendChild(specs);
    footer.appendChild(linksWrap);

    copyCol.appendChild(topGroup);
    copyCol.appendChild(descEl);
    copyCol.appendChild(footer);
    inner.appendChild(copyCol);

    if (showMediaSlot) {
      const mediaBox = document.createElement('div');
      mediaBox.className = 'prof-card-media';

      const fallbackBox = document.createElement('div');
      fallbackBox.className = 'prof-card-media-fallback';
      const fbCode = document.createElement('div');
      fbCode.className = 'prof-media-fallback-code';
      fbCode.textContent = item.ilrid || item.ilsid || sectionKey.toUpperCase();
      const fbCap = document.createElement('div');
      fbCap.className = 'prof-media-fallback-caption';
      fbCap.textContent = item.title;
      fallbackBox.appendChild(fbCode);
      fallbackBox.appendChild(fbCap);

      if (item.image) {
        fallbackBox.hidden = true;
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.title;
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        img.onerror = () => {
          img.hidden = true;
          fallbackBox.hidden = false;
        };
        mediaBox.appendChild(img);
      }

      mediaBox.appendChild(fallbackBox);
      inner.appendChild(mediaBox);
    }

    card.appendChild(spine);
    card.appendChild(inner);
    stage.appendChild(card);
  });

  // In Edit Mode: append trailing card
  if (state.isEditMode) {
    const addIdx = items.length;
    const addCard = document.createElement('article');
    addCard.className = 'prof-stack-card prof-stack-card-add';
    addCard.dataset.cardIndex = String(addIdx);

    const spine = document.createElement('div');
    spine.className = 'prof-card-spine';
    spine.addEventListener('click', () => scrollToStackCard(stage, addIdx));
    const spineNum = document.createElement('span');
    spineNum.className = 'prof-spine-num';
    spineNum.textContent = isLiveRegistry ? '↗' : '+';
    const spineLabel = document.createElement('span');
    spineLabel.className = 'prof-spine-label';
    spineLabel.textContent = isLiveRegistry ? 'Registry' : 'Add New';
    spine.appendChild(spineNum);
    spine.appendChild(spineLabel);

    const body = document.createElement('div');
    body.className = 'prof-add-card-body';

    const title = document.createElement('h3');
    title.className = 'prof-add-card-title';

    const desc = document.createElement('p');
    desc.className = 'prof-add-card-desc';

    if (isLiveRegistry) {
      const isRes = sectionKey === 'researches';
      title.textContent = isRes
        ? 'Synced with Open Research Archive'
        : 'Synced with Software Builds Registry';
      desc.textContent = isRes
        ? 'Published papers where your account UUID is listed as an author appear here automatically with live peer-review metrics.'
        : 'Software builds where your account UUID is listed as a developer appear here automatically.';

      const archiveLink = document.createElement('a');
      archiveLink.className = 'prof-add-card-cta';
      archiveLink.href = isRes ? '/researches/' : '/softwares/';
      archiveLink.textContent = isRes ? 'Open Research Archive ↗' : 'Open Software Registry ↗';

      body.appendChild(title);
      body.appendChild(desc);
      body.appendChild(archiveLink);
    } else {
      title.textContent = `Add another ${singularNoun}`;
      desc.textContent = 'Appends a new card directly to your database profile. Double-click any heading, spine, or summary on the card to customize it.';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'prof-add-card-cta';
      btn.textContent = `+ Add another ${singularNoun}`;
      btn.addEventListener('click', () => addCustomStackedCard(sectionKey, stage));

      body.appendChild(title);
      body.appendChild(desc);
      body.appendChild(btn);
    }

    addCard.appendChild(spine);
    addCard.appendChild(body);
    stage.appendChild(addCard);
  }

  const counterEl = document.getElementById(counterId);
  if (counterEl) {
    const total = stage.children.length;
    counterEl.textContent = total > 1
      ? `01 / ${String(total).padStart(2, '0')} · Scroll to stack`
      : `01 / 01`;
  }
}

function recalculateStackRunways() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sections = document.querySelectorAll('.prof-stack-section');

  sections.forEach((sec) => {
    if (sec.classList.contains('is-empty-deck')) return;

    const runway = sec.querySelector('.prof-stack-runway');
    const sticky = sec.querySelector('.prof-stack-sticky');
    const stage = sec.querySelector('.prof-stack-stage');
    if (!runway || !sticky || !stage) return;

    const cards = Array.from(stage.children).filter((el) => el.classList.contains('prof-stack-card'));
    const count = cards.length;

    if (reducedMotion || count <= 1) {
      runway.style.height = 'auto';
      stage.style.setProperty('--max-spine-space', '0px');
      stage.style.removeProperty('--active-spine-width');
      cards.forEach((c, idx) => {
        c.style.transform = 'none';
        c.style.zIndex = String(idx + 1);
      });
      return;
    }

    const stageWidth = stage.clientWidth || 960;
    const baseSpine = window.innerWidth <= 520 ? 28 : window.innerWidth <= 820 ? 34 : 44;
    const maxAllowedTotalSpine = Math.floor(stageWidth * 0.36);
    const spineStep = Math.max(
      18,
      Math.min(baseSpine, Math.floor(maxAllowedTotalSpine / Math.max(1, count - 1)))
    );
    const totalSpineSpace = spineStep * (count - 1);

    stage.dataset.spineStep = String(spineStep);
    stage.style.setProperty('--max-spine-space', `${totalSpineSpace}px`);
    stage.style.setProperty('--active-spine-width', `${Math.max(24, spineStep)}px`);

    const scrollPerCard = window.innerWidth <= 640 ? 290 : 340;
    const stickyHeight = sticky.offsetHeight || window.innerHeight - 68;
    runway.style.height = `${stickyHeight + (count - 1) * scrollPerCard}px`;
  });
}

function updateAllStackPositions() {
  state.stackRafPending = false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const headerOffset = 68;
  const sections = document.querySelectorAll('.prof-stack-section');

  sections.forEach((sec) => {
    if (sec.classList.contains('is-empty-deck')) return;

    const runway = sec.querySelector('.prof-stack-runway');
    const sticky = sec.querySelector('.prof-stack-sticky');
    const stage = sec.querySelector('.prof-stack-stage');
    const counter = sec.querySelector('.prof-stack-counter');
    if (!runway || !sticky || !stage) return;

    const cards = Array.from(stage.children).filter((el) => el.classList.contains('prof-stack-card'));
    const count = cards.length;
    if (count <= 1) return;

    const rect = runway.getBoundingClientRect();
    const maxScroll = Math.max(1, runway.offsetHeight - sticky.offsetHeight);
    const rawScrolled = -(rect.top - headerOffset);
    const progress01 = Math.min(1, Math.max(0, rawScrolled / maxScroll));

    const u = progress01 * (count - 1);
    const spineStep = parseFloat(stage.dataset.spineStep || '40');
    const stageWidth = stage.clientWidth || 960;
    const offscreenRight = stageWidth + 36;

    cards.forEach((card, i) => {
      const restX = i * spineStep;
      let x = restX;

      if (i > 0) {
        const localT = Math.min(1, Math.max(0, u - (i - 1)));
        const eased = 1 - Math.pow(1 - localT, 2.5);
        x = offscreenRight + (restX - offscreenRight) * eased;
      }

      const coveredBy = Math.min(4, Math.max(0, u - i));
      const scale = 1 - coveredBy * 0.011;

      card.style.zIndex = String(i + 1);
      card.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0) scale(${scale.toFixed(4)})`;
    });

    if (counter) {
      const activeIdx = Math.min(count, Math.max(1, Math.floor(u + 0.55) + 1));
      counter.textContent = `${String(activeIdx).padStart(2, '0')} / ${String(count).padStart(2, '0')} · Scroll to stack`;
    }
  });
}

function scrollToStackCard(stageEl, targetIndex) {
  const runway = stageEl.closest('.prof-stack-runway');
  const sticky = runway && runway.querySelector('.prof-stack-sticky');
  if (!runway || !sticky) return;

  const count = stageEl.children.length;
  if (count <= 1) return;

  const runwayTopDoc = window.scrollY + runway.getBoundingClientRect().top - 68;
  const maxScroll = Math.max(0, runway.offsetHeight - sticky.offsetHeight);
  const targetScrollY = runwayTopDoc + (targetIndex / (count - 1)) * maxScroll;

  window.scrollTo({
    top: targetScrollY,
    behavior: 'smooth'
  });
}

/* ==========================================================================
   10. Contact Section & Modal Dialogs (Reader + Portrait + Card Link)
   ========================================================================== */
function renderContactDetails() {
  const p = state.profile;
  const emailRowEl = document.getElementById('prof-contact-email-row');
  const emailLinkEl = document.getElementById('prof-contact-email-link');
  const emailEditEl = document.getElementById('prof-contact-email');
  const locEl = document.getElementById('prof-contact-location');
  const waRowEl = document.getElementById('prof-contact-wa-row');
  const waLinkEl = document.getElementById('prof-contact-wa');
  const waEditEl = document.getElementById('prof-contact-wa-edit');
  const submitBtn = document.getElementById('prof-contact-submit-btn');

  const cleanedEmail = cleanText(p.email);
  const validEmail = isValidPublicEmail(cleanedEmail);

  if (emailRowEl && emailLinkEl && emailEditEl) {
    if (state.isEditMode) {
      emailRowEl.hidden = false;
      emailLinkEl.hidden = true;
      emailEditEl.hidden = false;
      emailEditEl.textContent = validEmail
        ? cleanedEmail
        : '0 (Hidden — double-click to add public email)';
    } else if (validEmail) {
      emailRowEl.hidden = false;
      emailEditEl.hidden = true;
      emailLinkEl.hidden = false;
      emailLinkEl.href = `mailto:${cleanedEmail}`;
      emailLinkEl.textContent = cleanedEmail;
    } else {
      emailRowEl.hidden = true;
    }
  }

  if (locEl) {
    locEl.textContent = p.location || 'Bangladesh · The Iteration Lab';
    locEl.dataset.default = 'Bangladesh · The Iteration Lab';
  }

  const ownerWaTarget = normalizeOwnerWhatsAppTarget(p.whatsapp);
  const ownerWaHref = buildOwnerWhatsAppUrl(p.whatsapp);
  const displayPhone = cleanText(p.whatsapp);

  if (waRowEl && waLinkEl && waEditEl) {
    if (state.isEditMode) {
      waRowEl.hidden = false;
      waLinkEl.hidden = true;
      waEditEl.hidden = false;
      waEditEl.textContent = ownerWaTarget
        ? displayPhone
        : '0 (Hidden — double-click to add WhatsApp phone number)';
    } else if (ownerWaHref && ownerWaTarget) {
      waRowEl.hidden = false;
      waEditEl.hidden = true;
      waLinkEl.hidden = false;
      waLinkEl.href = ownerWaHref;
      waLinkEl.textContent = displayPhone.replace(/^https?:\/\//i, '') || `wa.me/${ownerWaTarget}`;
    } else {
      waRowEl.hidden = true;
    }
  }

  if (submitBtn) {
    if (ownerWaTarget) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message via WhatsApp';
    } else {
      submitBtn.disabled = true;
      submitBtn.textContent = 'WhatsApp Not Enabled by Member';
    }
  }
}

function openItemReaderModal(item, kindLabel) {
  const modal = document.getElementById('prof-reader-modal');
  const titleEl = document.getElementById('prof-reader-title');
  const bodyEl = document.getElementById('prof-reader-body');
  if (!modal || !titleEl || !bodyEl) return;

  titleEl.textContent = item.title || kindLabel;
  bodyEl.textContent = '';

  const meta = document.createElement('div');
  meta.style.cssText = 'font-family:var(--font-mono); font-size:12px; color:var(--prof-orange); margin-bottom:12px;';
  meta.textContent = [item.category || kindLabel, item.meta].filter(Boolean).join(' · ');

  const sub = document.createElement('div');
  sub.style.cssText = 'font-size:14px; font-weight:600; color:var(--prof-ink-secondary); margin-bottom:14px;';
  sub.textContent = item.subtitle || state.profile.name;

  const desc = document.createElement('p');
  desc.style.cssText = 'font-size:15px; line-height:1.72; color:var(--prof-ink); margin-bottom:20px;';
  desc.textContent = item.description || '';

  const foot = document.createElement('div');
  foot.style.cssText = 'display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; padding-top:16px; border-top:1px solid var(--prof-hairline);';

  const spec = document.createElement('span');
  spec.style.cssText = 'font-family:var(--font-mono); font-size:12px; color:var(--prof-ink-muted);';
  spec.textContent = item.footerMeta || 'The Iteration Lab';
  foot.appendChild(spec);

  if (item.linkUrl) {
    const actionLink = document.createElement('a');
    actionLink.className = 'btn btn-orange';
    actionLink.href = item.linkUrl;
    if (isHttpUrl(item.linkUrl)) {
      actionLink.target = '_blank';
      actionLink.rel = 'noopener noreferrer';
    }
    actionLink.textContent = item.linkLabel || 'Open Link ↗';
    foot.appendChild(actionLink);
  }

  bodyEl.appendChild(meta);
  bodyEl.appendChild(sub);
  bodyEl.appendChild(desc);
  bodyEl.appendChild(foot);

  modal.classList.add('open');
}

function openPortraitEditorModal() {
  const modal = document.getElementById('prof-reader-modal');
  const titleEl = document.getElementById('prof-reader-title');
  const bodyEl = document.getElementById('prof-reader-body');
  if (!modal || !titleEl || !bodyEl || !state.profile) return;

  titleEl.textContent = 'Update Member Portrait';
  bodyEl.textContent = '';

  const form = document.createElement('form');
  form.className = 'contact-form';
  form.noValidate = true;

  const group = document.createElement('div');
  group.className = 'input-group';

  const label = document.createElement('label');
  label.className = 'input-label';
  label.textContent = 'Portrait Filename or Image URL (max 255 chars)';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'input-field';
  input.maxLength = 255;
  input.placeholder = 'e.g. Arik.webp or https://...';
  input.value = state.profile.rawPhotoField || '';

  const hint = document.createElement('p');
  hint.style.cssText = 'font-size:12.5px; color:var(--prof-ink-muted); margin-top:6px; line-height:1.5;';
  hint.textContent = 'Enter a filename inside your role image folder (e.g. Arik.webp) or a direct https:// image URL. Leave blank to use automatic fallback.';

  group.appendChild(label);
  group.appendChild(input);
  group.appendChild(hint);

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex; flex-wrap:wrap; gap:10px; justify-content:flex-end; margin-top:16px;';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => modal.classList.remove('open'));

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.className = 'btn btn-orange';
  saveBtn.textContent = 'Save Portrait';

  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  form.appendChild(group);
  form.appendChild(actions);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const raw = clampStr(input.value, 255);
    const memberDir = resolveDefaultImageDirForType(state.profile.accountType);
    state.profile.rawPhotoField = raw;
    state.profile.photo = resolveImageSrc(raw, memberDir) || state.profile.leaderFallbackPhoto || '';
    await saveProfileColumnsToDb({ photo: raw || null });
    modal.classList.remove('open');
    renderHeroSection();
  });

  bodyEl.appendChild(form);
  modal.classList.add('open');
  input.focus();
}

function openCardLinkEditorModal(sectionKey, idx) {
  const card = state.profile?.[sectionKey]?.[idx];
  const modal = document.getElementById('prof-reader-modal');
  const titleEl = document.getElementById('prof-reader-title');
  const bodyEl = document.getElementById('prof-reader-body');
  if (!card || !modal || !titleEl || !bodyEl) return;

  titleEl.textContent = 'Set External Proof / Portfolio Link';
  bodyEl.textContent = '';

  const form = document.createElement('form');
  form.className = 'contact-form';
  form.noValidate = true;

  const urlGroup = document.createElement('div');
  urlGroup.className = 'input-group';
  const urlLabel = document.createElement('label');
  urlLabel.className = 'input-label';
  urlLabel.textContent = 'External URL (must start with https:// or http://)';
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.className = 'input-field';
  urlInput.maxLength = 500;
  urlInput.placeholder = 'https://example.com/certificate';
  urlInput.value = card.linkUrl || '';
  urlGroup.appendChild(urlLabel);
  urlGroup.appendChild(urlInput);

  const lblGroup = document.createElement('div');
  lblGroup.className = 'input-group';
  const lblLabel = document.createElement('label');
  lblLabel.className = 'input-label';
  lblLabel.textContent = 'Button Label (optional, max 40 chars)';
  const lblInput = document.createElement('input');
  lblInput.type = 'text';
  lblInput.className = 'input-field';
  lblInput.maxLength = 40;
  lblInput.placeholder = 'Verify Credential ↗';
  lblInput.value = card.linkLabel || '';
  lblGroup.appendChild(lblLabel);
  lblGroup.appendChild(lblInput);

  const errNote = document.createElement('div');
  errNote.style.cssText = 'font-size:12.5px; color:#B91C1C; display:none;';

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex; flex-wrap:wrap; gap:10px; justify-content:flex-end; margin-top:16px;';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn btn-secondary';
  clearBtn.textContent = 'Clear Link';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.className = 'btn btn-orange';
  saveBtn.textContent = 'Save Link';

  actions.appendChild(clearBtn);
  actions.appendChild(saveBtn);
  form.appendChild(urlGroup);
  form.appendChild(lblGroup);
  form.appendChild(errNote);
  form.appendChild(actions);

  const applyLinkValues = async (nextUrl, nextLabel) => {
    card.linkUrl = nextUrl;
    card.linkLabel = nextUrl ? (nextLabel || 'Open Link ↗') : null;

    if (state.profile.isLiveDb) {
      const client = getSupabaseClient();
      if (client && state.isAccountOwner && UUID_RE.test(String(card.id))) {
        setSaveStatus('saving', 'Saving link…');
        const { error } = await client
          .from('profile_custom_cards')
          .update({
            link_url: card.linkUrl,
            link_label: card.linkLabel
          })
          .eq('id', card.id)
          .eq('cid', state.profile.cid);

        if (error) {
          console.error('Failed to save card link:', error);
          setSaveStatus('error', 'Could not save link');
          return;
        }
        setSaveStatus('saved', 'Saved link');
      }
    } else {
      persistDemoDraftIfNeeded();
    }

    modal.classList.remove('open');
    renderAll();
  };

  clearBtn.addEventListener('click', () => applyLinkValues(null, null));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawUrl = clampStr(urlInput.value, 500);
    const rawLabel = clampStr(lblInput.value, 40);
    if (!rawUrl) {
      applyLinkValues(null, null);
      return;
    }
    if (!isHttpUrl(rawUrl)) {
      errNote.style.display = 'block';
      errNote.textContent = 'Please enter a full URL starting with https:// or http:// (or click Clear Link).';
      return;
    }
    applyLinkValues(rawUrl, rawLabel);
  });

  bodyEl.appendChild(form);
  modal.classList.add('open');
  urlInput.focus();
}

/* ==========================================================================
   11. Double-Click (and Touch Double-Tap) Inline Editor
   ========================================================================== */
function activateInlineEditor(targetEl) {
  if (!state.isEditMode || !targetEl) return;
  if (targetEl.getAttribute('contenteditable') === 'true') return;

  const path = targetEl.dataset.editable;
  if (!path) return;

  const isSingleLine = targetEl.dataset.singleLine === 'true';
  const isGpaField = targetEl.dataset.gpaField === 'true';
  const isNullableField = targetEl.dataset.nullableField === 'true';
  const defaultVal = targetEl.dataset.default || '';
  const previousText = targetEl.textContent || '';

  if (isNullableField) {
    const curVal = cleanText(getByPath(state.profile, path));
    const hasActive = path === 'whatsapp'
      ? Boolean(normalizeOwnerWhatsAppTarget(curVal))
      : isValidPublicEmail(curVal);
    targetEl.textContent = hasActive ? curVal : '';
  }

  targetEl.setAttribute('contenteditable', 'true');
  targetEl.setAttribute('spellcheck', 'true');
  targetEl.focus();

  try {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(targetEl);
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (_) {
    // Ignore selection errors
  }

  let finished = false;

  const commit = (cancelled) => {
    if (finished) return;
    finished = true;
    targetEl.removeAttribute('contenteditable');
    targetEl.removeEventListener('blur', onBlur);
    targetEl.removeEventListener('keydown', onKeyDown);

    if (cancelled) {
      targetEl.textContent = previousText;
      return;
    }

    let rawVal = String(targetEl.textContent || '').replace(/\s+/g, ' ').trim();

    if (isGpaField) {
      if (!rawVal || parseFloat(rawVal) <= 0 || Number.isNaN(parseFloat(rawVal))) {
        rawVal = '0';
      } else {
        const numeric = Math.min(5, Math.max(0, parseFloat(rawVal)));
        rawVal = numeric.toFixed(2);
      }
    } else if (isNullableField) {
      if (!rawVal || rawVal === '0' || rawVal.toLowerCase() === 'null') {
        rawVal = '';
      }
    } else if (!rawVal) {
      rawVal = defaultVal;
    }

    setByPath(state.profile, path, rawVal);
    renderAll();
    handleCommittedPathSave(path, rawVal);
  };

  const onBlur = () => commit(false);
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      commit(true);
    } else if (e.key === 'Enter' && isSingleLine) {
      e.preventDefault();
      commit(false);
    }
  };

  targetEl.addEventListener('blur', onBlur);
  targetEl.addEventListener('keydown', onKeyDown);
}

/* ==========================================================================
   12. Optional Demo Preview Dock (?demo=1 only)
   ========================================================================== */
function renderDemoDock() {
  const demoDock = document.getElementById('prof-demo-dock');
  if (!demoDock) return;

  if (!state.isDemoMode) {
    demoDock.hidden = true;
    return;
  }

  demoDock.hidden = false;
  const selectEl = document.getElementById('prof-demo-role-select');
  const authBtn = document.getElementById('prof-demo-auth-btn');
  if (selectEl) {
    selectEl.value = state.activeProfileKey;
  }
  if (authBtn) {
    authBtn.classList.toggle('is-owner', state.isAccountOwner);
    authBtn.textContent = state.isAccountOwner ? 'Session: Owner (Eye Visible)' : 'Session: Visitor (Eye Hidden)';
  }
}

/* ==========================================================================
   13. Event Listeners & Initialization
   ========================================================================== */
function startRecentAutoScroll() {
  if (state.recentTimer) clearInterval(state.recentTimer);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  state.recentTimer = setInterval(() => {
    if (state.recentPaused || state.isEditMode) return;
    const list = state.profile?.researches || [];
    if (list.length <= 1) return;
    state.recentIndex = (state.recentIndex + 1) % list.length;
    renderRecentResearchesCard();
  }, 4500);
}

function initInteractions() {
  // 1. Eye Toggle (User Mode <-> Edit Mode)
  const eyeBtn = document.getElementById('profile-eye-btn');
  if (eyeBtn) {
    eyeBtn.addEventListener('click', () => {
      if (!state.isAccountOwner) return;
      state.isEditMode = !state.isEditMode;
      setSaveStatus('', '');
      renderAll();
    });
  }

  const exitEditBtn = document.getElementById('prof-exit-edit-btn');
  if (exitEditBtn) {
    exitEditBtn.addEventListener('click', () => {
      state.isEditMode = false;
      setSaveStatus('', '');
      renderAll();
    });
  }

  const resetDefaultsBtn = document.getElementById('prof-reset-defaults-btn');
  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener('click', async () => {
      if (state.profile?.isLiveDb && state.routeDescriptor) {
        setSaveStatus('saving', 'Reloading…');
        try {
          const fresh = await loadLiveProfileFromSupabase(state.routeDescriptor);
          if (fresh) {
            state.profile = fresh;
            renderAll();
            setSaveStatus('saved', 'Reloaded from database');
          }
        } catch (_) {
          setSaveStatus('error', 'Reload failed');
        }
        return;
      }

      const key = state.activeProfileKey;
      try {
        localStorage.removeItem(STORAGE_PREFIX + key);
      } catch (_) {
        // Ignore
      }
      const fresh = createSamplePortfolios()[key] || createSamplePortfolios().student;
      state.profile = JSON.parse(JSON.stringify(fresh));
      renderAll();
    });
  }

  // Primary CTA Switcher (Researches <-> Software -> hero_button 1 <-> 0)
  const ctaSwitchBtn = document.getElementById('prof-cta-switch-btn');
  if (ctaSwitchBtn) {
    ctaSwitchBtn.addEventListener('click', async () => {
      state.profile.primaryCtaTarget =
        state.profile.primaryCtaTarget === 'softwares' ? 'researches' : 'softwares';
      renderAll();
      await saveProfileColumnsToDb({
        hero_button: state.profile.primaryCtaTarget === 'softwares' ? 0 : 1
      });
    });
  }

  // Portrait Editor Modal in Edit Mode
  const photoEditBtn = document.getElementById('prof-photo-edit-btn');
  if (photoEditBtn) {
    photoEditBtn.addEventListener('click', () => {
      if (!state.isEditMode) return;
      openPortraitEditorModal();
    });
  }

  // 2. Double-Click & Touch Double-Tap Inline Edit Delegation
  document.addEventListener('dblclick', (e) => {
    if (!state.isEditMode) return;
    const editable = e.target.closest('[data-editable]');
    if (editable) {
      e.preventDefault();
      activateInlineEditor(editable);
    }
  });

  let lastTapTime = 0;
  let lastTapTarget = null;
  document.addEventListener('touchend', (e) => {
    if (!state.isEditMode) return;
    const editable = e.target.closest('[data-editable]');
    if (!editable) return;
    const now = Date.now();
    if (lastTapTarget === editable && now - lastTapTime < 340) {
      e.preventDefault();
      activateInlineEditor(editable);
      lastTapTime = 0;
      lastTapTarget = null;
    } else {
      lastTapTime = now;
      lastTapTarget = editable;
    }
  });

  // 3. Recent Researches Card Manual Prev / Next & Hover Pause
  const prevBtn = document.getElementById('prof-recent-prev');
  const nextBtn = document.getElementById('prof-recent-next');
  const recentCard = document.getElementById('prof-recent-card');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const len = (state.profile?.researches || []).length;
      if (!len) return;
      state.recentIndex = (state.recentIndex - 1 + len) % len;
      renderRecentResearchesCard();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const len = (state.profile?.researches || []).length;
      if (!len) return;
      state.recentIndex = (state.recentIndex + 1) % len;
      renderRecentResearchesCard();
    });
  }
  if (recentCard) {
    recentCard.addEventListener('mouseenter', () => { state.recentPaused = true; });
    recentCard.addEventListener('mouseleave', () => { state.recentPaused = false; });
    recentCard.addEventListener('focusin', () => { state.recentPaused = true; });
    recentCard.addEventListener('focusout', () => { state.recentPaused = false; });
  }

  // 4. Navigation Drawer
  const menuBtn = document.getElementById('profile-menu-btn');
  const drawer = document.getElementById('prof-drawer');
  const backdrop = document.getElementById('prof-drawer-backdrop');
  const drawerClose = document.getElementById('prof-drawer-close');

  const setDrawerOpen = (open) => {
    if (!drawer || !backdrop || !menuBtn) return;
    drawer.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  if (menuBtn) menuBtn.addEventListener('click', () => setDrawerOpen(true));
  if (drawerClose) drawerClose.addEventListener('click', () => setDrawerOpen(false));
  if (backdrop) backdrop.addEventListener('click', () => setDrawerOpen(false));
  if (drawer) {
    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setDrawerOpen(false));
    });
  }

  // 5. Reader Modal Close
  const readerModal = document.getElementById('prof-reader-modal');
  const readerClose = document.getElementById('prof-reader-close');
  if (readerClose && readerModal) {
    readerClose.addEventListener('click', () => readerModal.classList.remove('open'));
    readerModal.addEventListener('click', (e) => {
      if (e.target === readerModal) readerModal.classList.remove('open');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setDrawerOpen(false);
      if (readerModal) readerModal.classList.remove('open');
    }
  });

  // 6. Scroll & Resize Listeners for Right-to-Left Card Stacking
  window.addEventListener(
    'scroll',
    () => {
      if (!state.stackRafPending) {
        state.stackRafPending = true;
        requestAnimationFrame(updateAllStackPositions);
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', () => {
    recalculateStackRunways();
    updateAllStackPositions();
  });

  // 7. Contact Form Handler (Redirects to Profile Owner's WhatsApp Number)
  const contactForm = document.getElementById('prof-contact-form');
  const contactFeedback = document.getElementById('prof-contact-feedback');
  if (contactForm && contactFeedback) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const sender = document.getElementById('prof-sender-name')?.value?.trim();
      const email = document.getElementById('prof-sender-email')?.value?.trim();
      const msg = document.getElementById('prof-sender-msg')?.value?.trim();

      if (!sender || !email || !msg) {
        contactFeedback.style.display = 'block';
        contactFeedback.className = 'form-feedback error';
        contactFeedback.textContent = 'Please complete your name, email address, and academic inquiry message.';
        return;
      }

      const formattedMessage = [
        '*Academic Inquiry via The Iteration Lab*',
        `*To:* ${state.profile.name}`,
        '',
        `*From:* ${sender}`,
        `*Email:* ${email}`,
        '',
        '*Message:*',
        msg
      ].join('\n');

      const ownerWaHref = buildOwnerWhatsAppUrl(state.profile.whatsapp, formattedMessage);
      if (!ownerWaHref) {
        contactFeedback.style.display = 'block';
        contactFeedback.className = 'form-feedback error';
        contactFeedback.textContent = `${state.profile.name} has not enabled a WhatsApp phone number for direct messages.`;
        return;
      }

      contactFeedback.textContent = '';
      contactFeedback.style.display = 'block';
      contactFeedback.className = 'form-feedback success';

      const statusText = document.createElement('span');
      statusText.textContent = `Redirecting to WhatsApp for ${state.profile.name}… `;

      const fallbackLink = document.createElement('a');
      fallbackLink.href = ownerWaHref;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      fallbackLink.style.fontWeight = '700';
      fallbackLink.style.textDecoration = 'underline';
      fallbackLink.textContent = 'Open in WhatsApp ↗';

      contactFeedback.appendChild(statusText);
      contactFeedback.appendChild(fallbackLink);

      redirectToWhatsApp(ownerWaHref);
      contactForm.reset();
    });
  }

  // 8. Optional Demo Switcher Dock (?demo=1)
  const roleSelect = document.getElementById('prof-demo-role-select');
  const authToggleBtn = document.getElementById('prof-demo-auth-btn');
  const dockCloseBtn = document.getElementById('prof-demo-close');
  const demoDock = document.getElementById('prof-demo-dock');

  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      if (!state.isDemoMode) return;
      const nextKey = roleSelect.value;
      state.activeProfileKey = nextKey;
      state.recentIndex = 0;
      state.profile = loadDemoProfileData(nextKey);
      renderAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (authToggleBtn) {
    authToggleBtn.addEventListener('click', () => {
      if (!state.isDemoMode) return;
      state.simulateOwnerInDemo = !state.simulateOwnerInDemo;
      try {
        sessionStorage.setItem(OWNER_SIM_KEY, state.simulateOwnerInDemo ? '1' : '0');
      } catch (_) {
        // Ignore
      }
      renderAll();
    });
  }

  if (dockCloseBtn && demoDock) {
    dockCloseBtn.addEventListener('click', () => {
      demoDock.hidden = true;
    });
  }

  // Live Supabase auth session listener across tabs & sign-in/sign-out events
  const client = getSupabaseClient();
  if (client && client.auth && typeof client.auth.onAuthStateChange === 'function') {
    client.auth.onAuthStateChange((_event, session) => {
      state.supabaseUserId = session?.user?.id || null;
      if (state.profile) {
        renderAll();
      }
    });
  }

  window.addEventListener('storage', (e) => {
    if (e.key && /^sb-.*-auth-token$/i.test(e.key)) {
      state.supabaseUserId = detectSupabaseSessionUserIdSync();
      if (state.profile) renderAll();
    }
  });

  window.__ITERATION_LAB_PORTFOLIO__ = {
    SUPABASE_URL,
    getState: () => state
  };
}

async function bootstrapPortfolio() {
  initInteractions();
  await refreshSessionUserId();

  const descriptor = resolveRouteDescriptor();
  state.routeDescriptor = descriptor;

  if (descriptor.mode === 'demo') {
    state.isDemoMode = true;
    state.activeProfileKey = descriptor.sampleKey;
    state.profile = loadDemoProfileData(descriptor.sampleKey);
    renderAll();
    startRecentAutoScroll();
    return;
  }

  state.isDemoMode = false;

  try {
    const liveProfile = await loadLiveProfileFromSupabase(descriptor);
    if (!liveProfile) {
      showProfileNotFound(
        'Member portfolio not found',
        'No verified or registered member profile matches this URL on The Iteration Lab.'
      );
      return;
    }

    state.profile = liveProfile;
    renderAll();
    startRecentAutoScroll();
  } catch (err) {
    console.error('Failed to load live portfolio:', err);
    showProfileNotFound(
      'Unable to load portfolio',
      'Could not connect to the database right now. Please check your connection and reload.'
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bootstrapPortfolio();
});
