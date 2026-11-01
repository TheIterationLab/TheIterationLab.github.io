// ==========================================================================
// The Iteration Lab — Common Member Portfolio Controller (/assets/js/profile.js)
// Serves Students (S), Teachers (T), Independent Publishers (R), & Leaders.
//
// Live Database Integration:
//  - Loads member rows directly from Supabase (profiles, profile_cv_entries,
//    profile_custom_cards, researches, software, students/teachers/institutes, leaders)
//  - Resolves ?cid=<uuid>, ?slug=<slug>, /profile/<TYPE>/<slug>, Founder aliases,
//    and bare /profile/ (authenticated owner's profile or Founder fallback)
//  - Strict ownership check: "Edit" link (/profile/edit/) renders ONLY when
//    logged into that specific member's cid
//  - Dynamic GPA strip: hides 0 / empty GPAs and stretches remaining columns
//    evenly across 100% width with zero blank gaps
//  - Smooth horizontal Right-to-Left scroll-driven card stacking
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
      affiliatedInstitute: {
        name: 'Notre Dame College, Dhaka',
        eiin: '108274',
        href: '/profile/?sample=institute'
      },
      fatherName: 'Md. Abdul Karim Hossain',
      motherName: 'Nasreen Akter',
      sscBatch: '2024',
      hscBatch: '2026',
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
          archiveUrl: '/researches/ILR0001',
          linkLabel: 'Open Research Page →',
          linkUrl: '/researches/ILR0001'
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
          archiveUrl: '/softwares/ILS0001',
          linkLabel: 'Open Software Page →',
          linkUrl: '/softwares/ILS0001'
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
      primaryCtaTarget: 'both',
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
      institution: 'Notre Dame College, Dhaka (EIIN 108274)',
      defaultInstitution: 'Notre Dame College, Dhaka (EIIN 108274)',
      affiliatedInstitute: {
        name: 'Notre Dame College, Dhaka',
        eiin: '108274',
        href: '/profile/?sample=institute'
      },
      fatherName: 'Prof. M. A. Rahman',
      motherName: 'Rokeya Begum',
      sscBatch: '2008',
      hscBatch: '2010',
      teacherMeta: {
        eiin: '108274',
        designation: 'Associate Professor',
        department: 'Department of Physics',
        instName: 'Notre Dame College, Dhaka',
        instHref: '/profile/?sample=institute',
        totalReviewed: 18,
        totalPublished: 2,
        reviewedPapers: [
          {
            ilrid: 'ILR0001',
            title: 'Dialectal Phonetic Alignment in Low-Resource Bengali Speech Recognition',
            category: 'Computational Linguistics',
            publishDate: 'Oct 2026'
          }
        ]
      },
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
          footerMeta: '18 Student Manuscripts Reviewed',
          linkLabel: null,
          linkUrl: null
        }
      ],
      experiences: [
        {
          id: 't-exp-1',
          period: '2021 — Present',
          core: 'Associate Professor & Collegiate Research Coordinator',
          org: 'Notre Dame College, Dhaka · Department of Physics',
          detail: 'Mentoring student research cohorts and supervising instrumentation calibration.'
        }
      ],
      researches: [
        {
          id: 't-res-1',
          ilrid: 'ILR0002',
          spine: 'ILR0002',
          category: 'Applied Physics',
          meta: 'ILR0002 · Sep 2026',
          title: 'Low-Cost Optical Interferometry for Collegiate Wave-Optics Laboratories',
          subtitle: 'Keywords: Interferometry · Error Calibration · Open Hardware',
          description: 'Reproducible benchtop Michelson interferometer design achieving sub-wavelength fringe stability using locally fabricated mounts.',
          image: '',
          footerMeta: 'Reviewed by 3 · 24 likes',
          archiveUrl: '/researches/ILR0002',
          linkLabel: 'Open Research Page →',
          linkUrl: '/researches/ILR0002'
        },
        {
          id: 't-res-2',
          ilrid: 'ILR0003',
          spine: 'ILR0003',
          category: 'Physics Pedagogy',
          meta: 'ILR0003 · Jun 2026',
          title: 'Uncertainty Propagation Frameworks in Secondary Experimental Reports',
          subtitle: 'Keywords: Metrology · Collegiate Curriculum',
          description: 'Comparative evaluation of structured error-budget worksheets across 340 higher-secondary laboratory submissions.',
          image: '',
          footerMeta: 'Reviewed by 2 · 19 likes',
          archiveUrl: '/researches/ILR0003',
          linkLabel: 'Open Research Page →',
          linkUrl: '/researches/ILR0003'
        }
      ],
      softwares: [],
      cocurriculars: [
        {
          id: 't-cc-1',
          spine: 'Olympiad Jury',
          category: 'Academic Service',
          meta: '2023 — Present · National Physics Olympiad',
          title: 'Regional Experimental Problem Committee & Faculty Mentor',
          subtitle: 'Collegiate STEM Outreach',
          description: 'Designing experimental physics tasks and training regional teacher mentors in uncertainty analysis.',
          footerMeta: 'Dhaka Division Committee',
          linkLabel: null,
          linkUrl: null
        }
      ]
    },
    institute: {
      profileKey: 'institute',
      isLiveDb: false,
      cid: 'sample-institute-cid-0004',
      accountType: 'I',
      name: 'Notre Dame College, Dhaka',
      institution: 'EIIN 108274 · Higher Secondary & Degree College',
      defaultInstitution: 'EIIN 108274 · Dhaka, Bangladesh',
      roleKicker: ROLE_DEFAULTS.I.roleKicker,
      headline: 'Crucible of Collegiate Scientific Inquiry Since 1949',
      lead: ROLE_DEFAULTS.I.lead,
      primaryCtaTarget: 'researches',
      whatsapp: '+880 1711-000404',
      email: 'research.desk@ndc.edu.bd',
      location: 'Toyenbee Circular Road, Motijheel, Dhaka-1000',
      photo: '',
      rawPhotoField: '',
      statementKicker: ROLE_DEFAULTS.I.statementKicker,
      quote: ROLE_DEFAULTS.I.quote,
      description: 'Partnering with The Iteration Lab to verify student investigators, coordinate faculty peer review, and publish open collegiate research monographs and laboratory software builds.',
      instituteMeta: {
        eiin: '108274',
        coverUrl: '/src/assets/images/institute_campus_cover_1793541878936.jpg',
        address: 'Toyenbee Circular Road, Motijheel, Dhaka-1000, Bangladesh',
        website: 'https://ndc.edu.bd',
        instituteType: 'Higher Secondary & Degree College',
        establishedYear: '1949',
        totalStudents: 6500,
        memberStudents: 42,
        studentResearches: 19,
        studentSoftwares: 11,
        totalTeachers: 118,
        memberTeachers: 9,
        teacherResearches: 7,
        recentWorks: [
          {
            kind: 'Research',
            code: 'ILR0001',
            title: 'Dialectal Phonetic Alignment in Low-Resource Bengali Speech Recognition',
            href: '/researches/ILR0001'
          },
          {
            kind: 'Software',
            code: 'ILS0001',
            title: 'BanglaLipi Web-OCR',
            href: '/softwares/ILS0001'
          }
        ]
      },
      gpas: {},
      education: [],
      skills: [],
      experiences: [],
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
      fatherName: ' Shamsul Alam Hasan',
      motherName: 'Tahmina Begum',
      sscBatch: '2016',
      hscBatch: '2018',
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
const OWNER_SIM_KEY = 'til_portfolio_sim_owner_v1';

let sbClient = null;
let portraitLoadToken = 0;
let recentFadeTimer = null;
let stackAnimRafId = 0;
let stackLastFrameTs = 0;

const state = {
  isDemoMode: false,
  forceVisitor: false,
  activeProfileKey: 'founder',
  routeDescriptor: null,
  profile: null,
  supabaseUserId: null,
  simulateOwnerInDemo: true,
  isAccountOwner: false,
  recentIndex: 0,
  recentTimer: null,
  recentPaused: false
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

function normalizeHeroButtonMode(rawVal) {
  if (rawVal === 'both') return 'both';
  if (rawVal === 'softwares' || rawVal === 'software') return 'softwares';
  if (rawVal === 'researches' || rawVal === 'research') return 'researches';
  const num = Number(rawVal ?? 1);
  if (num === 2) return 'both';
  if (num === 0) return 'softwares';
  return 'researches';
}

function getRoleDefault(field) {
  const type = state.profile?.accountType || 'S';
  const pack = ROLE_DEFAULTS[type] || ROLE_DEFAULTS.S;
  if (field === 'institution' && state.profile?.defaultInstitution) {
    return state.profile.defaultInstitution;
  }
  return pack[field] || ROLE_DEFAULTS.S[field] || '';
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
    const key = ['student', 'founder', 'teacher', 'institute', 'publisher'].includes(sampleParam)
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

function normalizeExternalUrl(rawVal) {
  const s = cleanText(rawVal);
  if (!s) return '';
  if (/^https?:\/\/\S+$/i.test(s)) return s;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(s)) return `https://${s}`;
  return '';
}

function parseOptionalNonNegInt(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function uniqueRowsByKey(rows, key) {
  const seen = new Set();
  const out = [];
  (Array.isArray(rows) ? rows : []).forEach((r) => {
    const id = cleanText(r?.[key]);
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push(r);
  });
  return out;
}

async function fetchProfileRow(descriptor) {
  if (descriptor.lookup === 'cid') {
    const rows = await sbRestGet(
      `profiles?select=*&cid=eq.${encodeURIComponent(descriptor.value)}&limit=1`
    );
    if (rows[0]) return rows[0];
    if (descriptor.fallbackToFounder && descriptor.value !== FOUNDER_LEADER_CID) {
      const founderRows = await sbRestGet(
        `profiles?select=*&cid=eq.${encodeURIComponent(FOUNDER_LEADER_CID)}&limit=1`
      );
      return founderRows[0] || null;
    }
    return null;
  }

  const slug = cleanText(descriptor.value).toLowerCase();
  if (!slug) return null;

  const bySlug = await sbRestGet(
    `profiles?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`
  );
  if (bySlug[0]) return bySlug[0];

  // Support Founder clean URL aliases (/profile/S/ikramulhoquearik, /profile/S/ikramul-hoque)
  if (FOUNDER_ALIASES.has(slug)) {
    const founderRows = await sbRestGet(
      `profiles?select=*&cid=eq.${encodeURIComponent(FOUNDER_LEADER_CID)}&limit=1`
    );
    return founderRows[0] || null;
  }

  return null;
}

async function resolveAffiliationContext(accountType, cid, leaderRow) {
  let eiin = '';
  let roleRow = null;

  if (accountType === 'S') {
    const sRows = await sbSafeGet(`students?select=*&cid=eq.${encodeURIComponent(cid)}&limit=1`);
    roleRow = sRows[0] || null;
    eiin = cleanText(roleRow?.eiin);
  } else if (accountType === 'T') {
    const tRows = await sbSafeGet(`teachers?select=*&cid=eq.${encodeURIComponent(cid)}&limit=1`);
    roleRow = tRows[0] || null;
    eiin = cleanText(roleRow?.eiin);
  } else if (accountType === 'I') {
    const iRows = await sbSafeGet(`institutes?select=*&cid=eq.${encodeURIComponent(cid)}&limit=1`);
    roleRow = iRows[0] || null;
    eiin = cleanText(roleRow?.eiin);
  }

  let affiliatedInstitute = null;
  if (eiin && accountType !== 'I') {
    const instRows = await sbSafeGet(
      `institutes?select=*,profiles(cid,type,name,slug)&eiin=eq.${encodeURIComponent(eiin)}&limit=1`
    );
    const instRec = instRows[0] || null;
    const profField = instRec?.profiles;
    const instProf = Array.isArray(profField) ? profField[0] : profField;
    const instName = cleanText(instProf?.name);
    const instCid = cleanText(instProf?.cid || instRec?.cid);
    const instSlug = cleanText(instProf?.slug);
    const instHref = instSlug
      ? `/profile/I/${encodeURIComponent(instSlug)}`
      : instCid
        ? `/profile/?cid=${encodeURIComponent(instCid)}`
        : '';

    affiliatedInstitute = {
      name: instName || `Institute (EIIN ${eiin})`,
      eiin,
      href: instHref
    };
  }

  let defaultInstitution = '';
  if (affiliatedInstitute) {
    defaultInstitution = affiliatedInstitute.name.includes(eiin)
      ? affiliatedInstitute.name
      : `${affiliatedInstitute.name} (EIIN ${eiin})`;
  } else if (eiin) {
    defaultInstitution = `EIIN ${eiin}`;
  } else if (cleanText(leaderRow?.role)) {
    defaultInstitution = `${cleanText(leaderRow.role)} · The Iteration Lab`;
  } else {
    const pack = ROLE_DEFAULTS[accountType] || ROLE_DEFAULTS.S;
    defaultInstitution = pack.institution;
  }

  return { eiin, roleRow, affiliatedInstitute, defaultInstitution };
}

async function buildLiveInstituteMeta(instRow, profRow) {
  const eiin = cleanText(instRow?.eiin);
  let studentCids = [];
  let teacherCids = [];
  let studResRows = [];
  let studSwRows = [];
  let teachResRows = [];

  if (eiin) {
    const [studRows, teachRows] = await Promise.all([
      sbSafeGet(`students?select=cid&eiin=eq.${encodeURIComponent(eiin)}&limit=2000`),
      sbSafeGet(`teachers?select=cid&eiin=eq.${encodeURIComponent(eiin)}&limit=2000`)
    ]);

    studentCids = Array.from(
      new Set(studRows.map((r) => cleanText(r.cid)).filter((id) => UUID_RE.test(id)))
    );
    teacherCids = Array.from(
      new Set(teachRows.map((r) => cleanText(r.cid)).filter((id) => UUID_RE.test(id)))
    );

    const studCsv = studentCids.slice(0, 250).join(',');
    const teachCsv = teacherCids.slice(0, 250).join(',');

    const [sRes, sSw, tRes] = await Promise.all([
      studCsv
        ? sbSafeGet(
            `researches?select=ilrid,title,category,publish_date&uid=ov.{${studCsv}}&order=publish_date.desc.nullslast,ilrid.asc`
          )
        : Promise.resolve([]),
      studCsv
        ? sbSafeGet(
            `software?select=ilsid,name,category,publish_date&uid=ov.{${studCsv}}&order=publish_date.desc.nullslast,ilsid.asc`
          )
        : Promise.resolve([]),
      teachCsv
        ? sbSafeGet(
            `researches?select=ilrid,title,category,publish_date&uid=ov.{${teachCsv}}&order=publish_date.desc.nullslast,ilrid.asc`
          )
        : Promise.resolve([])
    ]);

    studResRows = uniqueRowsByKey(sRes, 'ilrid');
    studSwRows = uniqueRowsByKey(sSw, 'ilsid');
    teachResRows = uniqueRowsByKey(tRes, 'ilrid');
  }

  const combinedRes = uniqueRowsByKey([...teachResRows, ...studResRows], 'ilrid');
  const recentWorks = [
    ...combinedRes.slice(0, 4).map((r) => ({
      kind: 'Research',
      code: cleanText(r.ilrid),
      title: cleanText(r.title) || 'Untitled Research',
      href: `/researches/${encodeURIComponent(cleanText(r.ilrid))}`
    })),
    ...studSwRows.slice(0, 3).map((s) => ({
      kind: 'Software',
      code: cleanText(s.ilsid),
      title: cleanText(s.name) || 'Untitled Software',
      href: `/softwares/${encodeURIComponent(cleanText(s.ilsid))}`
    }))
  ].slice(0, 6);

  return {
    eiin,
    coverUrl: resolveImageSrc(instRow?.cover_url, IMAGE_DIRS.institutes),
    address: cleanText(instRow?.address) || cleanText(profRow?.location),
    website: normalizeExternalUrl(instRow?.website),
    instituteType: cleanText(instRow?.institute_type),
    establishedYear: cleanText(instRow?.established_year),
    totalStudents: parseOptionalNonNegInt(instRow?.total_students),
    memberStudents: studentCids.length,
    studentResearches: studResRows.length,
    studentSoftwares: studSwRows.length,
    totalTeachers: parseOptionalNonNegInt(instRow?.total_teachers),
    memberTeachers: teacherCids.length,
    teacherResearches: teachResRows.length,
    recentWorks
  };
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
  const archiveUrl = cleanText(row.ilrid)
    ? `/researches/${encodeURIComponent(cleanText(row.ilrid))}`
    : '/researches/';

  const metaPieces = [ilrid];
  if (pubShort) metaPieces.push(pubShort);
  if (row.is_sample === true) metaPieces.push('SAMPLE');

  const subtitle = keywords.length > 0
    ? `Keywords: ${keywords.join(' · ')}`
    : cleanText(row.question_solved) || 'The Iteration Lab · Open Research Archive';

  const footerPieces = [`Reviewed by ${reviewerCount}`, `${likesCount} ${likesCount === 1 ? 'like' : 'likes'}`];

  return {
    id: ilrid,
    ilrid,
    spine: ilrid,
    category,
    meta: metaPieces.join(' · '),
    title: cleanText(row.title || row.name) || 'Untitled Research',
    subtitle,
    description: cleanText(row.abstract || row.details || row.purpose) || '',
    image: resolveImageSrc(row.cover_url, IMAGE_DIRS.researches),
    footerMeta: footerPieces.join(' · '),
    archiveUrl,
    linkLabel: 'Open Research Page →',
    linkUrl: archiveUrl,
    secondaryLinkLabel: hasExternalPaper ? 'PDF ↗' : null,
    secondaryLinkUrl: hasExternalPaper ? paperUrl : null
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
  const archiveUrl = cleanText(row.ilsid)
    ? `/softwares/${encodeURIComponent(cleanText(row.ilsid))}`
    : '/softwares/';

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
    title: cleanText(row.name || row.title) || 'Untitled Software',
    subtitle: cleanText(row.tagline) || 'The Iteration Lab · Software Registry',
    description: cleanText(row.description || row.details || row.purpose) || '',
    image: resolveImageSrc(row.image_url, IMAGE_DIRS.softwares),
    footerMeta: footerPieces.join(' · '),
    archiveUrl,
    linkLabel: 'Open Software Page →',
    linkUrl: archiveUrl,
    secondaryLinkLabel: isHttpUrl(launchUrl)
      ? 'Live App ↗'
      : isHttpUrl(repoUrl)
        ? 'Source ↗'
        : null,
    secondaryLinkUrl: primaryExternal || null
  };
}

async function loadLiveProfileFromSupabase(descriptor) {
  const profRow = await fetchProfileRow(descriptor);
  if (!profRow) return null;

  const cid = String(profRow.cid);
  const accountType = normalizeAccountType(profRow.type);
  const roleDefaults = ROLE_DEFAULTS[accountType] || ROLE_DEFAULTS.S;

  if (accountType === 'I') {
    const { roleRow: instRow, defaultInstitution } = await resolveAffiliationContext('I', cid, null);
    const instituteMeta = await buildLiveInstituteMeta(instRow, profRow);
    const rawPhotoField = cleanText(profRow.photo);
    const finalPhoto = resolveImageSrc(rawPhotoField, IMAGE_DIRS.institutes);
    const displayName = cleanText(profRow.name) || 'Partner Institution';

    return {
      profileKey: cleanText(profRow.slug) || cid,
      isLiveDb: true,
      cid,
      slug: cleanText(profRow.slug),
      accountType: 'I',
      name: displayName,
      institution: cleanText(profRow.institution_override) || defaultInstitution,
      defaultInstitution,
      roleKicker: cleanText(profRow.profession) || roleDefaults.roleKicker,
      headline: cleanText(profRow.q1) || '',
      lead: cleanText(profRow.research_interests) || roleDefaults.lead,
      primaryCtaTarget: 'researches',
      whatsapp: cleanText(profRow.whatsapp),
      email: cleanText(profRow.public_email),
      location: instituteMeta.address || cleanText(profRow.location) || 'Bangladesh · The Iteration Lab',
      photo: finalPhoto,
      rawPhotoField,
      statementKicker: cleanText(profRow.statement_kicker) || roleDefaults.statementKicker,
      quote: cleanText(profRow.q2) || roleDefaults.quote,
      description: cleanText(profRow.bio) || cleanText(profRow.research_interests) || roleDefaults.description,
      instituteMeta,
      gpas: {},
      education: [],
      skills: [],
      experiences: [],
      researches: [],
      softwares: [],
      cocurriculars: []
    };
  }

  const [cvRows, cardRows, researchRows, softwareRows, leaderRows, reviewedRows] = await Promise.all([
    sbSafeGet(
      `profile_cv_entries?select=*&cid=eq.${encodeURIComponent(cid)}&order=entry_type.asc,sort_order.asc`
    ),
    sbSafeGet(
      `profile_custom_cards?select=*&cid=eq.${encodeURIComponent(cid)}&order=deck_type.asc,sort_order.asc`
    ),
    sbSafeGet(
      `researches?select=*&uid=cs.{${encodeURIComponent(cid)}}&order=publish_date.desc.nullslast,ilrid.asc`
    ),
    accountType === 'T'
      ? Promise.resolve([])
      : sbSafeGet(
          `software?select=*&uid=cs.{${encodeURIComponent(cid)}}&order=publish_date.desc.nullslast,ilsid.asc`
        ),
    sbSafeGet(
      `leaders?select=display_name,role,profile_i,quote,bio,whatsapp&cid=eq.${encodeURIComponent(cid)}&limit=1`
    ),
    accountType === 'T'
      ? sbSafeGet(
          `researches?select=ilrid,title,category,publish_date&reviewers=cs.{${encodeURIComponent(cid)}}&order=publish_date.desc.nullslast,ilrid.asc`
        )
      : Promise.resolve([])
  ]);

  const leaderRow = leaderRows[0] || null;
  const { eiin, roleRow, affiliatedInstitute, defaultInstitution } = await resolveAffiliationContext(
    accountType,
    cid,
    leaderRow
  );

  const memberImgDir = resolveDefaultImageDirForType(accountType);
  const rawPhotoField = cleanText(profRow.photo);
  const resolvedProfilePhoto = resolveImageSrc(rawPhotoField, memberImgDir);
  const resolvedLeaderPhoto = resolveImageSrc(leaderRow?.profile_i, IMAGE_DIRS.leaders);
  const finalPhoto = resolvedProfilePhoto || resolvedLeaderPhoto;

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
    linkUrl: isHttpUrl(r.link_url) ? cleanText(r.link_url) : null
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
  const softwares = accountType === 'T' ? [] : softwareRows.map(mapSoftwareRowToCard);

  let teacherMeta = null;
  if (accountType === 'T') {
    const dbReviewed = parseOptionalNonNegInt(roleRow?.researches_reviewed) || 0;
    const dedupReviewed = uniqueRowsByKey(reviewedRows, 'ilrid');
    teacherMeta = {
      eiin,
      designation: cleanText(roleRow?.designation),
      department: cleanText(roleRow?.department),
      instName: affiliatedInstitute?.name || cleanText(profRow.institution_override) || defaultInstitution,
      instHref: affiliatedInstitute?.href || '',
      totalReviewed: Math.max(dbReviewed, dedupReviewed.length),
      totalPublished: researches.length,
      reviewedPapers: dedupReviewed.map((r) => ({
        ilrid: cleanText(r.ilrid),
        title: cleanText(r.title) || 'Untitled Research',
        category: cleanText(r.category),
        publishDate: formatShortDate(r.publish_date)
      }))
    };
  }

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
    affiliatedInstitute,
    fatherName: cleanText(profRow.father_name),
    motherName: cleanText(profRow.mother_name),
    sscBatch: cleanText(profRow.ssc_batch),
    hscBatch: cleanText(profRow.hsc_batch),
    teacherMeta,
    roleKicker: cleanText(profRow.profession) || roleDefaults.roleKicker,
    headline: cleanText(profRow.q1) || roleDefaults.headline,
    lead: cleanText(profRow.research_interests) || leaderBioFallback || roleDefaults.lead,
    primaryCtaTarget: accountType === 'T' ? 'researches' : normalizeHeroButtonMode(profRow.hero_button),
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
      sscSub: cleanText(profRow.ssc_sub) || (cleanText(profRow.ssc_batch) ? `Batch ${cleanText(profRow.ssc_batch)}` : 'Secondary Examination'),
      hsc: formatGpaFromDb(profRow.hsc_gpa),
      hscSub: cleanText(profRow.hsc_sub) || (cleanText(profRow.hsc_batch) ? `Batch ${cleanText(profRow.hsc_batch)}` : 'Higher Secondary'),
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
  return JSON.parse(JSON.stringify(base));
}

/* ==========================================================================
   5. Rendering the Complete Portfolio
   ========================================================================== */
function showProfileNotFound(headingText, messageText) {
  const statusScreen = document.getElementById('prof-status-screen');
  const mainContent = document.getElementById('main-content');
  const hEl = document.getElementById('prof-status-heading');
  const mEl = document.getElementById('prof-status-message');
  const editLink = document.getElementById('profile-edit-link');

  if (editLink) editLink.hidden = true;
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

function setNodeHidden(id, hidden) {
  const node = document.getElementById(id);
  if (node) node.hidden = Boolean(hidden);
}

function setNodeText(id, text) {
  const node = document.getElementById(id);
  if (node) node.textContent = text;
}

function applyAccountTypeLayout(accountType) {
  const isInst = accountType === 'I';
  const isTeacher = accountType === 'T';

  setNodeHidden('institute-profile-view', !isInst);
  setNodeHidden('member-hero-section', isInst);
  setNodeHidden('member-obsidian-band', isInst);
  setNodeHidden('teacher-scholarship-section', !isTeacher);
  setNodeHidden('education-section', isInst);
  setNodeHidden('skills-section', isInst);
  setNodeHidden('experiences-section', isInst);
  setNodeHidden('researches-section', isInst);
  setNodeHidden('softwares-section', isInst || isTeacher);
  setNodeHidden('cocurriculars-section', isInst);

  // Drawer links visibility & dynamic numbering
  setNodeHidden('drawer-link-inst-overview', !isInst);
  setNodeHidden('drawer-link-inst-students', !isInst);
  setNodeHidden('drawer-link-inst-teachers', !isInst);

  setNodeHidden('drawer-link-teacher', !isTeacher);
  setNodeHidden('drawer-link-education', isInst);
  setNodeHidden('drawer-link-skills', isInst);
  setNodeHidden('drawer-link-experiences', isInst);
  setNodeHidden('drawer-link-researches', isInst);
  setNodeHidden('drawer-link-softwares', isInst || isTeacher);
  setNodeHidden('drawer-link-cocurriculars', isInst);

  if (isInst) {
    setNodeText('contact-section-index', '04 · Institutional Correspondence');
    setNodeText('contact-heading', 'Institutional Contact');
    setNodeText(
      'contact-desc',
      'Connect with the institutional coordination desk regarding collegiate research chapters, student verification, or academic partnerships.'
    );
    setNodeText('drawer-link-contact', '04. Institutional Contact');
    return;
  }

  if (isTeacher) {
    setNodeText('teacher-section-index', '01 · Faculty Affiliation & Peer Review');
    setNodeText('edu-section-index', '02 · Academic Background');
    setNodeText('skills-section-index', '03 · Verified Competencies');
    setNodeText('exp-section-index', '04 · Research & Lab Track');
    setNodeText('researches-section-index', '05 · Open Scholarship');
    setNodeText('cocurriculars-section-index', '06 · Community & Leadership');
    setNodeText('contact-section-index', '07 · Family & Academic Correspondence');

    setNodeText('drawer-link-teacher', '01. Institute & Peer Review');
    setNodeText('drawer-link-education', '02. Education');
    setNodeText('drawer-link-skills', '03. Skills, Badges & Certifications');
    setNodeText('drawer-link-experiences', '04. Experiences');
    setNodeText('drawer-link-researches', '05. Researches & Journals');
    setNodeText('drawer-link-cocurriculars', '06. Co-Curriculars');
    setNodeText('drawer-link-contact', '07. Contact & Identity');
  } else {
    setNodeText('edu-section-index', '01 · Academic Background');
    setNodeText('skills-section-index', '02 · Verified Competencies');
    setNodeText('exp-section-index', '03 · Research & Lab Track');
    setNodeText('researches-section-index', '04 · Open Scholarship');
    setNodeText('softwares-section-index', '05 · Engineering & Code');
    setNodeText('cocurriculars-section-index', '06 · Community & Leadership');
    setNodeText('contact-section-index', '07 · Family & Academic Correspondence');

    setNodeText('drawer-link-education', '01. Education');
    setNodeText('drawer-link-skills', '02. Skills, Badges & Certifications');
    setNodeText('drawer-link-experiences', '03. Experiences');
    setNodeText('drawer-link-researches', '04. Researches & Journals');
    setNodeText('drawer-link-softwares', '05. Softwares');
    setNodeText('drawer-link-cocurriculars', '06. Co-Curriculars');
    setNodeText('drawer-link-contact', '07. Contact & Identity');
  }

  setNodeText('contact-heading', 'Contact & Identity');
  setNodeText(
    'contact-desc',
    'Reach out regarding research replication, dataset requests, co-authorship, or peer-review coordination through The Iteration Lab.'
  );
}

function renderTeacherScholarshipSection() {
  const p = state.profile;
  if (!p || p.accountType !== 'T') return;

  const tm = p.teacherMeta || {};
  const instName = cleanText(tm.instName) || cleanText(p.institution) || getRoleDefault('institution');
  const instHref = cleanText(tm.instHref) || cleanText(p.affiliatedInstitute?.href);
  const metaParts = [];
  if (cleanText(tm.designation)) metaParts.push(cleanText(tm.designation));
  if (cleanText(tm.department)) metaParts.push(cleanText(tm.department));
  if (cleanText(tm.eiin)) metaParts.push(`EIIN ${cleanText(tm.eiin)}`);

  setNodeText('teacher-inst-name', instName);
  setNodeText('teacher-inst-meta', metaParts.join(' · ') || 'Registered Faculty Mentor · The Iteration Lab');

  const instActions = document.getElementById('teacher-inst-actions');
  const instLink = document.getElementById('teacher-inst-link');
  if (instActions && instLink) {
    if (instHref) {
      instActions.hidden = false;
      instLink.href = instHref;
    } else {
      instActions.hidden = true;
    }
  }

  const totalReviewed = Number(tm.totalReviewed ?? 0);
  const totalPublished = Number(tm.totalPublished ?? (p.researches || []).length);
  setNodeText('teacher-reviewed-count', String(totalReviewed).padStart(2, '0'));
  setNodeText('teacher-published-count', String(totalPublished).padStart(2, '0'));

  const listWrap = document.getElementById('teacher-reviewed-list-wrap');
  const listEl = document.getElementById('teacher-reviewed-list');
  const reviewedPapers = Array.isArray(tm.reviewedPapers) ? tm.reviewedPapers : [];
  if (listWrap && listEl) {
    listEl.textContent = '';
    if (reviewedPapers.length === 0) {
      listWrap.hidden = true;
    } else {
      listWrap.hidden = false;
      reviewedPapers.forEach((paper) => {
        const row = document.createElement('a');
        row.className = 'prof-inst-work-row';
        row.href = paper.ilrid
          ? `/researches/${encodeURIComponent(paper.ilrid)}`
          : '/researches/';

        const main = document.createElement('div');
        main.className = 'prof-inst-work-main';

        const meta = document.createElement('div');
        meta.className = 'prof-inst-work-meta';
        meta.textContent = [paper.ilrid, paper.category, paper.publishDate].filter(Boolean).join(' · ');

        const name = document.createElement('div');
        name.className = 'prof-inst-work-name';
        name.textContent = paper.title || 'Research Manuscript';

        main.appendChild(meta);
        main.appendChild(name);

        const arrow = document.createElement('span');
        arrow.className = 'prof-inst-work-arrow';
        arrow.textContent = 'View Paper →';

        row.appendChild(main);
        row.appendChild(arrow);
        listEl.appendChild(row);
      });
    }
  }
}

function renderInstituteProfileView() {
  const p = state.profile;
  if (!p || p.accountType !== 'I') return;

  const im = p.instituteMeta || {};

  // Cover Banner (Facebook-style backdrop behind crest & title)
  const coverImg = document.getElementById('inst-cover-img');
  const coverFallback = document.getElementById('inst-cover-fallback');
  if (coverImg && coverFallback) {
    if (im.coverUrl) {
      coverImg.hidden = false;
      coverFallback.hidden = true;
      coverImg.alt = `${p.name} campus cover`;
      coverImg.onerror = () => {
        coverImg.hidden = true;
        coverFallback.hidden = false;
      };
      coverImg.src = im.coverUrl;
    } else {
      coverImg.removeAttribute('src');
      coverImg.hidden = true;
      coverFallback.hidden = false;
    }
  }

  // Crest / Profile Logo
  const logoImg = document.getElementById('inst-logo-img');
  const logoInitials = document.getElementById('inst-logo-initials');
  if (logoInitials) {
    logoInitials.textContent = getInitials(p.name);
  }
  if (logoImg && logoInitials) {
    if (p.photo) {
      logoImg.hidden = false;
      logoInitials.hidden = true;
      logoImg.alt = `${p.name} crest`;
      logoImg.onerror = () => {
        logoImg.hidden = true;
        logoInitials.hidden = false;
      };
      logoImg.src = p.photo;
    } else {
      logoImg.removeAttribute('src');
      logoImg.hidden = true;
      logoInitials.hidden = false;
    }
  }

  setNodeText('inst-kicker', cleanText(im.instituteType) || p.roleKicker || ROLE_DEFAULTS.I.roleKicker);
  setNodeText('inst-college-name', p.name);

  const metaLine = document.getElementById('inst-meta-line');
  if (metaLine) {
    metaLine.textContent = '';
    const pieces = [];
    if (cleanText(im.eiin)) pieces.push({ text: `EIIN ${cleanText(im.eiin)}`, mono: true });
    if (cleanText(im.establishedYear)) pieces.push({ text: `Est. ${cleanText(im.establishedYear)}`, mono: false });
    if (cleanText(im.address || p.location)) pieces.push({ text: cleanText(im.address || p.location), mono: false });

    pieces.forEach((piece, idx) => {
      if (idx > 0) {
        const sep = document.createElement('span');
        sep.className = 'prof-identity-sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '·';
        metaLine.appendChild(sep);
      }
      const sp = document.createElement('span');
      if (piece.mono) sp.className = 'prof-inst-meta-eiin';
      sp.textContent = piece.text;
      metaLine.appendChild(sp);
    });
  }

  const websiteBtn = document.getElementById('inst-website-btn');
  if (websiteBtn) {
    const validSite = normalizeExternalUrl(im.website);
    if (validSite) {
      websiteBtn.hidden = false;
      websiteBtn.href = validSite;
    } else {
      websiteBtn.hidden = true;
      websiteBtn.removeAttribute('href');
    }
  }

  const waBtn = document.getElementById('inst-whatsapp-btn');
  if (waBtn) {
    const waHref = buildOwnerWhatsAppUrl(p.whatsapp);
    if (waHref) {
      waBtn.hidden = false;
      waBtn.href = waHref;
    } else {
      waBtn.hidden = true;
      waBtn.removeAttribute('href');
    }
  }

  const mottoEl = document.getElementById('inst-motto');
  if (mottoEl) {
    const cleanMotto = cleanText(p.headline);
    if (cleanMotto && cleanMotto !== ROLE_DEFAULTS.I.headline) {
      mottoEl.hidden = false;
      mottoEl.textContent = cleanMotto;
    } else {
      mottoEl.hidden = true;
    }
  }

  setNodeText('inst-bio', cleanText(p.description) || ROLE_DEFAULTS.I.description);

  // Registry Fact Sheet
  const factsList = document.getElementById('inst-facts-list');
  if (factsList) {
    factsList.textContent = '';
    const addFact = (dtLabel, ddValue, linkHref = '') => {
      const val = cleanText(ddValue);
      if (!val) return;
      const row = document.createElement('div');
      row.className = 'prof-inst-fact-row';
      const dt = document.createElement('dt');
      dt.className = 'prof-inst-fact-dt';
      dt.textContent = dtLabel;
      const dd = document.createElement('dd');
      dd.className = 'prof-inst-fact-dd';
      if (linkHref) {
        const a = document.createElement('a');
        a.href = linkHref;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = val.replace(/^https?:\/\//i, '').replace(/\/$/, '');
        dd.appendChild(a);
      } else {
        dd.textContent = val;
      }
      row.appendChild(dt);
      row.appendChild(dd);
      factsList.appendChild(row);
    };

    addFact('College / Institute Name', p.name);
    addFact('EIIN (Board Code)', cleanText(im.eiin) || 'Not assigned yet');
    addFact('Institution Type', cleanText(im.instituteType));
    addFact('Established', cleanText(im.establishedYear));
    addFact('Campus Address', cleanText(im.address) || cleanText(p.location));
    const validSite = normalizeExternalUrl(im.website);
    if (validSite) addFact('Official Website', validSite, validSite);
    if (isValidPublicEmail(p.email)) addFact('Official Email', cleanText(p.email), `mailto:${cleanText(p.email)}`);
  }

  const formatMetricNumber = (val, allowDashForNull = false) => {
    if (val === null || val === undefined || val === '') {
      return allowDashForNull ? '—' : '0';
    }
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0) return allowDashForNull ? '—' : '0';
    if (allowDashForNull && n === 0) return '—';
    return n.toLocaleString('en-US');
  };

  const renderMetricBoxes = (gridId, defs) => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.textContent = '';
    defs.forEach((d) => {
      const box = document.createElement('div');
      box.className = 'prof-inst-metric-box';
      box.setAttribute('role', 'listitem');

      const top = document.createElement('div');
      const val = document.createElement('div');
      val.className = 'prof-inst-metric-val';
      val.textContent = d.value;
      const lbl = document.createElement('div');
      lbl.className = 'prof-inst-metric-lbl';
      lbl.textContent = d.label;
      top.appendChild(val);
      top.appendChild(lbl);

      const note = document.createElement('div');
      note.className = 'prof-inst-metric-note';
      note.textContent = d.note;

      box.appendChild(top);
      box.appendChild(note);
      grid.appendChild(box);
    });
  };

  renderMetricBoxes('inst-student-metrics-grid', [
    {
      value: formatMetricNumber(im.totalStudents, true),
      label: 'Total Students',
      note: 'Overall campus enrollment reported by the institution'
    },
    {
      value: formatMetricNumber(im.memberStudents, false),
      label: 'Total Member Students',
      note: 'Registered Iteration Lab student researchers with this EIIN'
    },
    {
      value: formatMetricNumber(im.studentResearches, false),
      label: 'Researches by Member Students',
      note: 'Published papers & journals authored by affiliated students'
    },
    {
      value: formatMetricNumber(im.studentSoftwares, false),
      label: 'Software by Member Students',
      note: 'Open software builds developed by affiliated students'
    }
  ]);

  renderMetricBoxes('inst-teacher-metrics-grid', [
    {
      value: formatMetricNumber(im.totalTeachers, true),
      label: 'Total Teachers',
      note: 'Overall faculty strength reported by the institution'
    },
    {
      value: formatMetricNumber(im.memberTeachers, false),
      label: 'Total Member Teachers',
      note: 'Registered Iteration Lab faculty mentors with this EIIN'
    },
    {
      value: formatMetricNumber(im.teacherResearches, false),
      label: 'Researches by Member Teachers',
      note: 'Published papers & journals authored by affiliated teachers'
    }
  ]);

  // Recent affiliated works list
  const worksWrap = document.getElementById('inst-works-wrap');
  const worksList = document.getElementById('inst-works-list');
  const works = Array.isArray(im.recentWorks) ? im.recentWorks : [];
  if (worksWrap && worksList) {
    worksList.textContent = '';
    if (works.length === 0) {
      worksWrap.hidden = true;
    } else {
      worksWrap.hidden = false;
      works.forEach((w) => {
        const row = document.createElement('a');
        row.className = 'prof-inst-work-row';
        row.href = w.href;

        const main = document.createElement('div');
        main.className = 'prof-inst-work-main';

        const meta = document.createElement('div');
        meta.className = 'prof-inst-work-meta';
        meta.textContent = [w.kind, w.code].filter(Boolean).join(' · ');

        const name = document.createElement('div');
        name.className = 'prof-inst-work-name';
        name.textContent = w.title;

        main.appendChild(meta);
        main.appendChild(name);

        const arrow = document.createElement('span');
        arrow.className = 'prof-inst-work-arrow';
        arrow.textContent = w.kind === 'Software' ? 'Open Software →' : 'Open Research →';

        row.appendChild(main);
        row.appendChild(arrow);
        worksList.appendChild(row);
      });
    }
  }
}

function renderAll() {
  if (!state.profile) return;
  showMainPortfolioView();

  const acctType = normalizeAccountType(state.profile.accountType);
  state.isAccountOwner = computeIsOwner();
  document.title = acctType === 'I'
    ? `${state.profile.name} · Institute Profile · The Iteration Lab`
    : `${state.profile.name} · Portfolio · The Iteration Lab`;

  applyAccountTypeLayout(acctType);
  renderHeaderControls();

  if (acctType === 'I') {
    renderInstituteProfileView();
    renderContactDetails();
    renderDemoDock();
    return;
  }

  renderHeroSection();
  renderRecentResearchesCard();
  renderObsidianBand();
  if (acctType === 'T') {
    renderTeacherScholarshipSection();
  }
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
  if (acctType !== 'T') {
    renderStackedSection(
      'softwares',
      'softwares-stack-stage',
      'softwares-stack-counter',
      'software project',
      'No software builds indexed for this member yet.'
    );
  }
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
    updateAllStackPositions(true);
  });
}

function renderHeaderControls() {
  const editLink = document.getElementById('profile-edit-link');
  if (editLink) {
    editLink.hidden = !state.isAccountOwner;
    editLink.setAttribute('href', '/profile/edit/');
  }
}

function renderHeroSection() {
  const p = state.profile;

  const kickerEl = document.getElementById('prof-role-kicker');
  if (kickerEl) {
    kickerEl.textContent = p.roleKicker || getRoleDefault('roleKicker');
  }

  const nameEl = document.getElementById('prof-member-name');
  if (nameEl) {
    nameEl.textContent = p.name;
  }

  const instEl = document.getElementById('prof-member-inst');
  if (instEl) {
    instEl.textContent = '';
    const instLabel = p.institution || getRoleDefault('institution');
    const instHref = cleanText(p.affiliatedInstitute?.href);
    if (instHref) {
      const a = document.createElement('a');
      a.className = 'prof-member-inst-link';
      a.href = instHref;
      a.textContent = instLabel;
      instEl.appendChild(a);
    } else {
      instEl.textContent = instLabel;
    }
  }

  const headlineEl = document.getElementById('prof-hero-headline');
  if (headlineEl) {
    headlineEl.textContent = p.headline || getRoleDefault('headline');
  }

  const leadEl = document.getElementById('prof-hero-lead');
  if (leadEl) {
    leadEl.textContent = p.lead || getRoleDefault('lead');
  }

  const isTeacher = p.accountType === 'T';
  const heroMode = isTeacher ? 'researches' : normalizeHeroButtonMode(p.primaryCtaTarget);
  const primaryBtn = document.getElementById('prof-primary-cta');
  const primaryBtnText = document.getElementById('prof-primary-cta-text');
  const softwareBtn = document.getElementById('prof-software-cta');

  if (primaryBtn) {
    const showResearches = heroMode === 'researches' || heroMode === 'both';
    primaryBtn.hidden = !showResearches;
    primaryBtn.setAttribute('href', '#researches-section');
    if (primaryBtnText) {
      primaryBtnText.textContent = 'Researches';
    }
  }

  if (softwareBtn) {
    const showSoftwares = !isTeacher && (heroMode === 'softwares' || heroMode === 'both');
    softwareBtn.hidden = !showSoftwares;
    softwareBtn.setAttribute('href', '#softwares-section');
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

function transitionRecentResearchSlide(nextIndex) {
  const list = Array.isArray(state.profile?.researches) ? state.profile.researches : [];
  if (!list.length) return;

  const slideContainer = document.getElementById('prof-recent-slide');
  if (!slideContainer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    state.recentIndex = ((nextIndex % list.length) + list.length) % list.length;
    renderRecentResearchesCard();
    return;
  }

  if (recentFadeTimer) {
    clearTimeout(recentFadeTimer);
    recentFadeTimer = null;
  }

  slideContainer.classList.add('is-fading');
  recentFadeTimer = setTimeout(() => {
    recentFadeTimer = null;
    const latestList = Array.isArray(state.profile?.researches) ? state.profile.researches : [];
    if (latestList.length > 0) {
      state.recentIndex = ((nextIndex % latestList.length) + latestList.length) % latestList.length;
    }
    renderRecentResearchesCard();
    requestAnimationFrame(() => {
      slideContainer.classList.remove('is-fading');
    });
  }, 240);
}

function renderRecentResearchesCard() {
  const list = Array.isArray(state.profile?.researches) ? state.profile.researches : [];
  const slideContainer = document.getElementById('prof-recent-slide');
  if (!slideContainer) return;

  slideContainer.classList.remove('is-fading');
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
  const targetArchiveHref = item.archiveUrl || (item.ilrid ? `/researches/${encodeURIComponent(item.ilrid)}` : '/researches/');

  const thumb = document.createElement('div');
  thumb.className = 'prof-recent-thumb';
  thumb.style.cursor = 'pointer';
  thumb.addEventListener('click', () => {
    window.location.href = targetArchiveHref;
  });
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
  title.style.cursor = 'pointer';
  title.textContent = item.title;
  title.addEventListener('click', () => {
    window.location.href = targetArchiveHref;
  });

  const meta = document.createElement('div');
  meta.className = 'prof-recent-meta';

  const countSpan = document.createElement('span');
  const idxStr = String(state.recentIndex + 1).padStart(2, '0');
  const totalStr = String(list.length).padStart(2, '0');
  countSpan.textContent = `${idxStr} / ${totalStr} · ${item.category || 'Research'}`;

  const openLink = document.createElement('a');
  openLink.className = 'prof-recent-open';
  openLink.href = targetArchiveHref;
  openLink.textContent = 'Open Paper →';

  meta.appendChild(countSpan);
  meta.appendChild(openLink);

  slideContainer.appendChild(thumb);
  slideContainer.appendChild(title);
  slideContainer.appendChild(meta);
}

/* ==========================================================================
   6. Obsidian Quote, Description & Dynamic GPA Strip
   ========================================================================== */
function renderObsidianBand() {
  const p = state.profile;

  const stKicker = document.getElementById('prof-statement-kicker');
  if (stKicker) {
    stKicker.textContent = p.statementKicker || getRoleDefault('statementKicker');
  }

  const quoteEl = document.getElementById('prof-quote-text');
  if (quoteEl) {
    quoteEl.textContent = p.quote || getRoleDefault('quote');
  }

  const descEl = document.getElementById('prof-description-text');
  if (descEl) {
    descEl.textContent = p.description || getRoleDefault('description');
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
      sub: g.sscSub || 'Secondary Examination',
      isGpa: true
    },
    {
      key: 'hsc',
      label: 'HSC GPA',
      value: g.hsc,
      scale: '/ 5.00',
      sub: g.hscSub || 'Higher Secondary',
      isGpa: true
    },
    {
      key: 'ug',
      label: 'UG / Others',
      value: g.ug,
      scale: ugNumeric > 4.0 ? '/ 5.00' : '/ 4.00',
      sub: g.ugSub || 'Undergraduate CGPA',
      isGpa: true
    },
    {
      key: 'grad',
      label: 'Graduate',
      value: g.grad,
      scale: gradNumeric > 4.0 ? '/ 5.00' : '/ 4.00',
      sub: g.gradSub || 'Graduate CGPA',
      isGpa: true
    },
    {
      key: 'researchCount',
      label: p.accountType === 'T' ? 'Researches Published' : 'Research & Journal',
      value: p.isLiveDb ? derivedResearchCount : (g.researchCount || derivedResearchCount),
      scale: 'works',
      sub: g.researchSub || 'Published & Indexed',
      isGpa: false
    }
  ];

  if (p.accountType === 'T') {
    const revCount = Number(p.teacherMeta?.totalReviewed ?? 0);
    metricDefs.push({
      key: 'reviewedCount',
      label: 'Researches Reviewed',
      value: String(revCount).padStart(2, '0'),
      scale: 'papers',
      sub: 'Peer-Review Evaluations',
      isGpa: false
    });
  }

  const visibleDefs = metricDefs.filter((m) => {
    if (!m.isGpa) return true;
    return isPositiveGpa(m.value);
  });

  metricsRow.style.setProperty('--metric-cols', String(Math.max(1, visibleDefs.length)));

  visibleDefs.forEach((m) => {
    const cell = document.createElement('div');
    cell.className = 'prof-metric-cell';

    const valWrap = document.createElement('div');
    valWrap.className = 'prof-metric-value-wrap';

    const valSpan = document.createElement('span');
    valSpan.className = 'prof-metric-value';
    valSpan.textContent = String(m.value);

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
    subDiv.textContent = m.sub;

    cell.appendChild(valWrap);
    cell.appendChild(labelDiv);
    cell.appendChild(subDiv);
    metricsRow.appendChild(cell);
  });
}

/* ==========================================================================
   7. CV Timeline Renderer (Education & Experiences)
   ========================================================================== */
function renderCvSection(arrayKey, containerId, emptyMessage) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.textContent = '';

  const items = Array.isArray(state.profile[arrayKey]) ? state.profile[arrayKey] : [];

  if (items.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'prof-cv-empty';
    emptyEl.textContent = emptyMessage;
    container.appendChild(emptyEl);
    return;
  }

  items.forEach((entry) => {
    const row = document.createElement('article');
    row.className = 'prof-cv-item';

    const period = document.createElement('div');
    period.className = 'prof-cv-period';
    period.textContent = entry.period || '2026';

    const main = document.createElement('div');
    main.className = 'prof-cv-main';

    const coreRow = document.createElement('div');
    coreRow.className = 'prof-cv-core-row';

    const core = document.createElement('h3');
    core.className = 'prof-cv-core';
    core.textContent = entry.core;
    coreRow.appendChild(core);

    const org = document.createElement('div');
    org.className = 'prof-cv-org';
    org.textContent = entry.org;

    const detail = document.createElement('p');
    detail.className = 'prof-cv-detail';
    detail.textContent = entry.detail || '';

    main.appendChild(coreRow);
    main.appendChild(org);
    main.appendChild(detail);

    row.appendChild(period);
    row.appendChild(main);
    container.appendChild(row);
  });
}

/* ==========================================================================
   8. Horizontal Right-to-Left Stacked Cards Renderer & Scroll Engine
   ========================================================================== */
function renderStackedSection(sectionKey, stageId, counterId, singularNoun, emptyMessage) {
  const stage = document.getElementById(stageId);
  if (!stage) return;
  stage.textContent = '';

  const sectionEl = stage.closest('.prof-stack-section');
  const items = Array.isArray(state.profile[sectionKey]) ? state.profile[sectionKey] : [];
  const showMediaSlot = sectionKey === 'researches' || sectionKey === 'softwares';

  if (items.length === 0) {
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

    const spine = document.createElement('div');
    spine.className = 'prof-card-spine';
    spine.setAttribute('title', `Scroll to card ${idx + 1}: ${item.title}`);
    spine.addEventListener('click', () => {
      scrollToStackCard(stage, idx);
    });

    const spineNum = document.createElement('span');
    spineNum.className = 'prof-spine-num';
    spineNum.textContent = String(idx + 1).padStart(2, '0');

    const spineLabel = document.createElement('span');
    spineLabel.className = 'prof-spine-label';
    spineLabel.textContent = item.spine || item.category || `Item ${idx + 1}`;

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

    const sepSpan = document.createElement('span');
    sepSpan.className = 'prof-meta-sep';
    sepSpan.setAttribute('aria-hidden', 'true');
    sepSpan.textContent = '·';

    const dateSpan = document.createElement('span');
    dateSpan.textContent = item.meta || '2026';

    metaLine.appendChild(catSpan);
    metaLine.appendChild(sepSpan);
    metaLine.appendChild(dateSpan);

    const titleEl = document.createElement('h3');
    titleEl.className = 'prof-card-title';
    titleEl.textContent = item.title;

    const archiveHref = cleanText(item.archiveUrl);
    if (archiveHref) {
      card.classList.add('is-archive-clickable');
      titleEl.addEventListener('click', () => {
        window.location.href = archiveHref;
      });
    }

    const subEl = document.createElement('div');
    subEl.className = 'prof-card-subtitle';
    subEl.textContent = item.subtitle || '';

    topGroup.appendChild(metaLine);
    topGroup.appendChild(titleEl);
    topGroup.appendChild(subEl);

    const descEl = document.createElement('p');
    descEl.className = 'prof-card-desc';
    descEl.textContent = item.description || '';

    const footer = document.createElement('div');
    footer.className = 'prof-card-footer';

    const specs = document.createElement('span');
    specs.className = 'prof-card-specs';
    specs.textContent = item.footerMeta || 'Verified Portfolio Record';

    const linksWrap = document.createElement('div');
    linksWrap.className = 'prof-card-links';

    if (archiveHref) {
      const pageLink = document.createElement('a');
      pageLink.className = 'prof-card-link';
      pageLink.href = archiveHref;
      pageLink.textContent = item.linkLabel || 'Open Details →';
      linksWrap.appendChild(pageLink);

      if (item.secondaryLinkUrl) {
        const extLink = document.createElement('a');
        extLink.className = 'prof-card-link';
        extLink.href = item.secondaryLinkUrl;
        extLink.target = '_blank';
        extLink.rel = 'noopener noreferrer';
        extLink.textContent = item.secondaryLinkLabel || 'Open ↗';
        linksWrap.appendChild(extLink);
      }
    } else {
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
    }

    footer.appendChild(specs);
    footer.appendChild(linksWrap);

    copyCol.appendChild(topGroup);
    copyCol.appendChild(descEl);
    copyCol.appendChild(footer);
    inner.appendChild(copyCol);

    if (showMediaSlot) {
      const mediaBox = document.createElement('div');
      mediaBox.className = 'prof-card-media';
      if (archiveHref) {
        mediaBox.addEventListener('click', () => {
          window.location.href = archiveHref;
        });
      }

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
      delete runway.dataset.leadHold;
      delete runway.dataset.tailHold;
      stage.style.setProperty('--max-spine-space', '0px');
      stage.style.removeProperty('--active-spine-width');
      stage._renderedU = 0;
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

    // Generous, unhurried scroll runway per card + calm entry/exit dwell buffers
    const isCompact = window.innerWidth <= 640;
    const leadHold = isCompact ? 60 : 90;
    const tailHold = isCompact ? 90 : 140;
    const scrollPerCard = isCompact ? 600 : 800;
    const stickyHeight = sticky.offsetHeight || window.innerHeight - 68;

    runway.dataset.leadHold = String(leadHold);
    runway.dataset.tailHold = String(tailHold);
    runway.style.height = `${stickyHeight + leadHold + (count - 1) * scrollPerCard + tailHold}px`;
  });
}

function scheduleStackAnimation() {
  if (stackAnimRafId) return;
  stackLastFrameTs = 0;
  stackAnimRafId = requestAnimationFrame(tickStackAnimation);
}

function tickStackAnimation(nowTs) {
  stackAnimRafId = 0;
  const dtSec = stackLastFrameTs > 0
    ? Math.min(0.064, Math.max(0.004, (nowTs - stackLastFrameTs) / 1000))
    : 0.016;
  stackLastFrameTs = nowTs;

  const needsMoreFrames = applyStackPositions(false, dtSec);
  if (needsMoreFrames) {
    stackAnimRafId = requestAnimationFrame(tickStackAnimation);
  } else {
    stackLastFrameTs = 0;
  }
}

function updateAllStackPositions(immediate = false) {
  if (immediate) {
    if (stackAnimRafId) {
      cancelAnimationFrame(stackAnimRafId);
      stackAnimRafId = 0;
      stackLastFrameTs = 0;
    }
    applyStackPositions(true, 0);
    return;
  }
  scheduleStackAnimation();
}

function applyStackPositions(immediate, dtSec) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  const headerOffset = 68;
  const sections = document.querySelectorAll('.prof-stack-section');
  let anyStillMoving = false;

  // Smooth exponential glide (~3.2/s -> gentle ~650ms settle on wheel steps)
  const lerpAlpha = immediate ? 1 : 1 - Math.exp(-dtSec * 3.2);

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
    const leadHold = parseFloat(runway.dataset.leadHold || '90');
    const tailHold = parseFloat(runway.dataset.tailHold || '140');
    const effectiveMax = Math.max(1, maxScroll - leadHold - tailHold);
    const rawScrolled = -(rect.top - headerOffset) - leadHold;
    const progress01 = Math.min(1, Math.max(0, rawScrolled / effectiveMax));

    const targetU = progress01 * (count - 1);
    let u = targetU;

    if (immediate || typeof stage._renderedU !== 'number' || Number.isNaN(stage._renderedU)) {
      u = targetU;
    } else {
      const clampedPrev = Math.min(count - 1, Math.max(0, stage._renderedU));
      u = clampedPrev + (targetU - clampedPrev) * lerpAlpha;
      if (Math.abs(targetU - u) < 0.0012) {
        u = targetU;
      } else {
        anyStillMoving = true;
      }
    }
    stage._renderedU = u;

    const spineStep = parseFloat(stage.dataset.spineStep || '40');
    const stageWidth = stage.clientWidth || 960;
    const offscreenRight = stageWidth + 36;

    cards.forEach((card, i) => {
      const restX = i * spineStep;
      let x = restX;

      if (i > 0) {
        const localT = Math.min(1, Math.max(0, u - (i - 1)));
        // Symmetric sinusoidal ease-in-out for a calm, deliberate glide
        const eased = 0.5 - 0.5 * Math.cos(Math.PI * localT);
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

  return anyStillMoving;
}

function scrollToStackCard(stageEl, targetIndex) {
  const runway = stageEl.closest('.prof-stack-runway');
  const sticky = runway && runway.querySelector('.prof-stack-sticky');
  if (!runway || !sticky) return;

  const cards = Array.from(stageEl.children).filter((el) => el.classList.contains('prof-stack-card'));
  const count = cards.length;
  if (count <= 1) return;

  const runwayTopDoc = window.scrollY + runway.getBoundingClientRect().top - 68;
  const maxScroll = Math.max(0, runway.offsetHeight - sticky.offsetHeight);
  const leadHold = parseFloat(runway.dataset.leadHold || '90');
  const tailHold = parseFloat(runway.dataset.tailHold || '140');
  const effectiveMax = Math.max(0, maxScroll - leadHold - tailHold);
  const targetScrollY = runwayTopDoc + leadHold + (targetIndex / (count - 1)) * effectiveMax;

  window.scrollTo({
    top: targetScrollY,
    behavior: 'smooth'
  });
}

/* ==========================================================================
   9. Contact Section & Reader Modal
   ========================================================================== */
function renderContactDetails() {
  const p = state.profile;
  const isInst = p.accountType === 'I';

  const instRowEl = document.getElementById('prof-contact-inst-row');
  const instValEl = document.getElementById('prof-contact-inst-val');
  const fatherRowEl = document.getElementById('prof-contact-father-row');
  const fatherValEl = document.getElementById('prof-contact-father-val');
  const motherRowEl = document.getElementById('prof-contact-mother-row');
  const motherValEl = document.getElementById('prof-contact-mother-val');
  const batchesRowEl = document.getElementById('prof-contact-batches-row');
  const batchesValEl = document.getElementById('prof-contact-batches-val');
  const locLabelEl = document.getElementById('prof-contact-location-label');

  if (locLabelEl) {
    locLabelEl.textContent = isInst ? 'Campus Address' : 'Location & Network';
  }

  if (instRowEl && instValEl) {
    instValEl.textContent = '';
    const affName = cleanText(p.affiliatedInstitute?.name);
    const affEiin = cleanText(p.affiliatedInstitute?.eiin);
    const affHref = cleanText(p.affiliatedInstitute?.href);
    if (!isInst && affName) {
      instRowEl.hidden = false;
      const label = affEiin && !affName.includes(affEiin) ? `${affName} (EIIN ${affEiin})` : affName;
      if (affHref) {
        const a = document.createElement('a');
        a.className = 'prof-member-inst-link';
        a.href = affHref;
        a.textContent = label;
        instValEl.appendChild(a);
      } else {
        instValEl.textContent = label;
      }
    } else {
      instRowEl.hidden = true;
    }
  }

  if (fatherRowEl && fatherValEl) {
    const fName = cleanText(p.fatherName);
    if (!isInst && fName) {
      fatherRowEl.hidden = false;
      fatherValEl.textContent = fName;
    } else {
      fatherRowEl.hidden = true;
    }
  }

  if (motherRowEl && motherValEl) {
    const mName = cleanText(p.motherName);
    if (!isInst && mName) {
      motherRowEl.hidden = false;
      motherValEl.textContent = mName;
    } else {
      motherRowEl.hidden = true;
    }
  }

  if (batchesRowEl && batchesValEl) {
    const batchParts = [];
    if (cleanText(p.sscBatch)) batchParts.push(`SSC ${cleanText(p.sscBatch)}`);
    if (cleanText(p.hscBatch)) batchParts.push(`HSC ${cleanText(p.hscBatch)}`);
    if (!isInst && batchParts.length > 0) {
      batchesRowEl.hidden = false;
      batchesValEl.textContent = batchParts.join(' · ');
    } else {
      batchesRowEl.hidden = true;
    }
  }

  const emailRowEl = document.getElementById('prof-contact-email-row');
  const emailLinkEl = document.getElementById('prof-contact-email-link');
  const locEl = document.getElementById('prof-contact-location');
  const waRowEl = document.getElementById('prof-contact-wa-row');
  const waLinkEl = document.getElementById('prof-contact-wa');
  const submitBtn = document.getElementById('prof-contact-submit-btn');

  const cleanedEmail = cleanText(p.email);
  const validEmail = isValidPublicEmail(cleanedEmail);

  if (emailRowEl && emailLinkEl) {
    if (validEmail) {
      emailRowEl.hidden = false;
      emailLinkEl.hidden = false;
      emailLinkEl.href = `mailto:${cleanedEmail}`;
      emailLinkEl.textContent = cleanedEmail;
    } else {
      emailRowEl.hidden = true;
    }
  }

  if (locEl) {
    locEl.textContent = p.location || 'Bangladesh · The Iteration Lab';
  }

  const ownerWaTarget = normalizeOwnerWhatsAppTarget(p.whatsapp);
  const ownerWaHref = buildOwnerWhatsAppUrl(p.whatsapp);
  const displayPhone = cleanText(p.whatsapp);

  if (waRowEl && waLinkEl) {
    if (ownerWaHref && ownerWaTarget) {
      waRowEl.hidden = false;
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
      submitBtn.textContent = isInst
        ? 'WhatsApp Not Enabled by Institute'
        : 'WhatsApp Not Enabled by Member';
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
  meta.className = 'prof-reader-meta';
  meta.textContent = [item.category || kindLabel, item.meta].filter(Boolean).join(' · ');

  const sub = document.createElement('div');
  sub.className = 'prof-reader-subtitle';
  sub.textContent = item.subtitle || state.profile.name;

  const desc = document.createElement('p');
  desc.className = 'prof-reader-desc';
  desc.textContent = item.description || '';

  const foot = document.createElement('div');
  foot.className = 'prof-reader-foot';

  const spec = document.createElement('span');
  spec.className = 'prof-reader-spec';
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

/* ==========================================================================
   10. Optional Demo Preview Dock (?demo=1 only)
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
    authBtn.textContent = state.isAccountOwner
      ? 'Session: Owner (Edit Visible)'
      : 'Session: Visitor (Edit Hidden)';
  }
}

/* ==========================================================================
   11. Event Listeners & Initialization
   ========================================================================== */
function startRecentAutoScroll() {
  if (state.recentTimer) clearInterval(state.recentTimer);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  state.recentTimer = setInterval(() => {
    if (state.recentPaused) return;
    const list = state.profile?.researches || [];
    if (list.length <= 1) return;
    transitionRecentResearchSlide((state.recentIndex + 1) % list.length);
  }, 8500);
}

function initInteractions() {
  // 1. Recent Researches Card Manual Prev / Next & Hover Pause
  const prevBtn = document.getElementById('prof-recent-prev');
  const nextBtn = document.getElementById('prof-recent-next');
  const recentCard = document.getElementById('prof-recent-card');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const len = (state.profile?.researches || []).length;
      if (!len) return;
      transitionRecentResearchSlide((state.recentIndex - 1 + len) % len);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const len = (state.profile?.researches || []).length;
      if (!len) return;
      transitionRecentResearchSlide((state.recentIndex + 1) % len);
    });
  }
  if (recentCard) {
    recentCard.addEventListener('mouseenter', () => { state.recentPaused = true; });
    recentCard.addEventListener('mouseleave', () => { state.recentPaused = false; });
    recentCard.addEventListener('focusin', () => { state.recentPaused = true; });
    recentCard.addEventListener('focusout', () => { state.recentPaused = false; });
  }

  // 2. Navigation Drawer
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

  // 3. Reader Modal Close
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

  // 4. Scroll & Resize Listeners for Smooth, Damped Right-to-Left Card Stacking
  window.addEventListener(
    'scroll',
    () => {
      scheduleStackAnimation();
    },
    { passive: true }
  );

  window.addEventListener('resize', () => {
    recalculateStackRunways();
    updateAllStackPositions(true);
  });

  // 5. Contact Form Handler (Redirects to Profile Owner's WhatsApp Number)
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
      fallbackLink.className = 'prof-wa-fallback-link';
      fallbackLink.textContent = 'Open in WhatsApp ↗';

      contactFeedback.appendChild(statusText);
      contactFeedback.appendChild(fallbackLink);

      redirectToWhatsApp(ownerWaHref);
      contactForm.reset();
    });
  }

  // 6. Optional Demo Switcher Dock (?demo=1)
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
