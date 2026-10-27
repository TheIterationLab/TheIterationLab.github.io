// ==========================================================================
// The Iteration Lab — Common Member Portfolio Controller (/assets/js/profile.js)
// Supports Students (S), Teachers (T), and Independent Publishers (R).
// Features:
//  - Supabase session detection (localStorage / cookies) + Owner Eye Mode toggle
//  - Double-click (and touch double-tap) inline editing with smart defaults
//  - Dynamic GPA strip: hides UG / Graduate (or any GPA) when 0 or empty in User Mode
//    and stretches remaining columns evenly across the full row
//  - Academic CV timelines for Education & Experiences
//  - Horizontal Right-to-Left scroll-driven card stacking (no prev/next buttons)
//  - Extra "Add another..." final card in Edit Mode for all 4 stacked sections
// ==========================================================================

import { SUPABASE_URL, SUPABASE_ANON_KEY, WHATSAPP_URL } from '../../js/config.js';

/* ==========================================================================
   1. Curated Role Defaults & Sample Portfolios (Used until DB schema is live)
   ========================================================================== */
const ROLE_DEFAULTS = {
  S: {
    roleKicker: 'Student · Researcher',
    headline: 'Turn Insight Into Discovery',
    lead: 'Investigating computational linguistics, open embedded telemetry, and reproducible student research workflows across secondary and collegiate cohorts in Bangladesh.',
    statementKicker: 'Research Philosophy',
    quote: '“Rigorous inquiry begins the moment curiosity is paired with open methodology, transparent data, and peer verification.”',
    description: 'Committed to building open-source scientific instruments and publishing peer-reviewed student preprints through The Iteration Lab network—bridging classroom theory with field-tested engineering.',
    institution: 'Notre Dame College, Dhaka · Open Research Cohort'
  },
  T: {
    roleKicker: 'Academic Mentor · Research Evaluator',
    headline: 'Guiding Inquiry Into Rigor',
    lead: 'Supervising collegiate experimental methodology, peer-review standards, and computational physics modelling to cultivate the next generation of Bangladeshi researchers.',
    statementKicker: 'Mentorship & Editorial Statement',
    quote: '“True mentorship equips young scholars not merely to recite established answers, but to design falsifiable experiments of their own.”',
    description: 'Serving as faculty advisor and peer-review steward within The Iteration Lab—helping secondary and undergraduate investigators refine hypotheses, statistical validation, and ethical attribution.',
    institution: 'Department of Physics & Computational Science'
  },
  R: {
    roleKicker: 'Independent Publisher · Field Researcher',
    headline: 'Open Data For Civic Impact',
    lead: 'Conducting independent hydrological sensing, archival digitization, and community-led environmental datasets published openly for public benefit.',
    statementKicker: 'Independent Research Ethos',
    quote: '“Scientific discovery belongs to every citizen willing to measure carefully, document honestly, and share openly.”',
    description: 'Publishing open-access field studies, reproducible sensor firmware, and regional ecological benchmarks across riverine communities in Bangladesh.',
    institution: 'Independent Research Fellow · The Iteration Lab'
  }
};

function createSamplePortfolios() {
  return {
    student: {
      profileKey: 'student',
      cid: 'sample-student-cid-0001',
      accountType: 'S',
      name: 'Tanvir Hossain',
      institution: 'Notre Dame College, Dhaka (EIIN 108274)',
      roleKicker: ROLE_DEFAULTS.S.roleKicker,
      headline: ROLE_DEFAULTS.S.headline,
      lead: ROLE_DEFAULTS.S.lead,
      primaryCtaTarget: 'researches', // 'researches' or 'softwares'
      whatsapp: 'https://wa.me/TheIterationLab',
      email: 'tanvir.research@iterationlab.org',
      location: 'Motijheel, Dhaka, Bangladesh',
      photo: '/profile/img/student_portrait.jpg',
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
        researchCount: '04',
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
          linkLabel: 'Verify Method Standards ↗',
          linkUrl: '/#policies'
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
          linkLabel: 'View Communities ↗',
          linkUrl: '/communities/'
        },
        {
          id: 'sk-3',
          spine: 'Embedded Systems',
          category: 'Hardware Certification',
          meta: 'ESP32 · LoRaWAN · C++ · Hydrological Telemetry',
          title: 'Low-Power Environmental Sensor Design & Mesh Networking',
          subtitle: 'Open Hardware Instrumentation Workshop',
          description: 'Calibrated hydrostatic pressure transducers, solar MPPT charge controllers, and 433MHz LoRa packet repeaters for off-grid river stage monitoring.',
          footerMeta: 'Field Validated · 96-Hour Continuous Drift Test',
          linkLabel: 'Explore Builds ↗',
          linkUrl: '/softwares/'
        }
      ],
      experiences: [
        {
          id: 'exp-1',
          period: 'Jan 2026 — Present',
          core: 'Lead Student Investigator — Open Speech & OCR Working Group',
          org: 'The Iteration Lab · Computational Linguistics Cohort',
          detail: 'Coordinating dataset annotation, phonetic alignment evaluation, and reproducible benchmark releases across 14 student contributors from three partner colleges.'
        },
        {
          id: 'exp-2',
          period: 'Jun 2025 — Dec 2025',
          core: 'Undergraduate-Mentored Field Telemetry Assistant',
          org: 'River Basin Sensing Initiative · Dhaka & Sylhet',
          detail: 'Assembled weatherproof LoRaWAN sensor nodes and validated stage-height readings against manual hydrological gauge stations during monsoon peak flow.'
        }
      ],
      researches: [
        {
          id: 'res-1',
          ilrid: 'ILR0001',
          spine: 'ILR0001 · Linguistics',
          category: 'Computational Linguistics',
          meta: 'October 2026 · DOI 10.5281/zenodo.til.2026.0491',
          title: 'Dialectal Phonetic Alignment in Low-Resource Bengali Speech Recognition',
          subtitle: 'Co-authored with F. A. Rini · Peer-Reviewed Student Monograph',
          description: 'A standardized acoustic benchmark evaluating sequence-to-sequence neural architectures for dialectal sentence normalization across regional spoken variants in Bangladesh.',
          image: '/profile/img/ocr_manuscript.jpg',
          footerMeta: '12 min read · Open Dataset Included',
          linkLabel: 'Read Full Paper ↗',
          linkUrl: '/researches/'
        },
        {
          id: 'res-2',
          ilrid: 'ILR0002',
          spine: 'ILR0002 · Hydrology',
          category: 'Environmental Sensing',
          meta: 'September 2026 · DOI 10.5281/zenodo.til.2026.0482',
          title: 'Autonomous LoRaWAN Telemetry Buoys for Flash Flood Warning in River Basins',
          subtitle: 'Co-authored with M. H. Shuvo & S. Tabassum',
          description: 'Ultra-low-power hydrostatic pressure transducers and 433MHz mesh radios engineered to deliver 4-hour advance hydrological stage telemetry without cellular towers.',
          image: '/profile/img/hydrology_sensor.jpg',
          footerMeta: '9 min read · Hardware Schematics Open',
          linkLabel: 'Read Full Paper ↗',
          linkUrl: '/researches/'
        },
        {
          id: 'res-3',
          ilrid: 'ILR0003',
          spine: 'ILR0003 · Graph Theory',
          category: 'Discrete Mathematics',
          meta: 'July 2026 · DOI 10.5281/zenodo.til.2026.0411',
          title: 'Extremal Graph Bounds for Minimal Crossing Topologies in Dense Micro-Grids',
          subtitle: 'Science & Mathematics Research Circle',
          description: 'Proving tight topological bounds on edge intersection density for k-connected planar subgraph decompositions in historical urban distribution networks.',
          image: '',
          footerMeta: '15 min read · Formal Proof Appendix',
          linkLabel: 'Read Full Paper ↗',
          linkUrl: '/researches/'
        }
      ],
      softwares: [
        {
          id: 'sw-1',
          ilsid: 'ILS0001',
          spine: 'ILS0001 · WebAssembly',
          category: 'Open Source Build · v1.2 Stable',
          meta: 'WebAssembly · TypeScript · ONNX Runtime',
          title: 'BanglaLipi Web-OCR',
          subtitle: 'Client-Side Historical Manuscript Recognition Engine',
          description: 'Browser-native optical character recognition engine for Bengali ligatures and student research scans—running quantized ONNX models locally with zero cloud latency.',
          image: '/profile/img/ocr_manuscript.jpg',
          footerMeta: 'MIT License · Zero-Server Inference',
          linkLabel: 'Explore Software ↗',
          linkUrl: '/softwares/'
        },
        {
          id: 'sw-2',
          ilsid: 'ILS0002',
          spine: 'ILS0002 · Telemetry',
          category: 'Active Deployment · Hardware Tooling',
          meta: 'Rust · WebSerial · Real-Time Plotting',
          title: 'Suraksha-Mesh Serial & LoRa Monitor',
          subtitle: 'Field Hydrological Packet Inspector',
          description: 'Plug-and-play WebSerial console for inspecting 433MHz LoRa sensor frames, solar battery curves, and rainfall gradient alerts directly from field laptops.',
          image: '/profile/img/hydrology_sensor.jpg',
          footerMeta: 'GPL-3.0 · Offline-Ready Field Tool',
          linkLabel: 'Explore Software ↗',
          linkUrl: '/softwares/'
        },
        {
          id: 'sw-3',
          ilsid: 'ILS0003',
          spine: 'ILS0003 · LaTeX Studio',
          category: 'Beta Release · Academic Publishing',
          meta: 'JavaScript · KaTeX · Citation Graph',
          title: 'Iteration Cite & Preprint Formatter',
          subtitle: 'Standardized Manuscript Template Generator',
          description: 'Automates BibTeX normalization, figure numbering, and bilingual abstract formatting for first-time secondary school and college authors.',
          image: '',
          footerMeta: 'Open Beta · Used by 6 College Clubs',
          linkLabel: 'Explore Software ↗',
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
          description: 'Organized bi-weekly methodology workshops for 180+ first-year students and edited 22 investigative project abstracts for the annual collegiate science fair.',
          footerMeta: '22 Student Abstracts Edited',
          linkLabel: 'View Communities ↗',
          linkUrl: '/communities/'
        },
        {
          id: 'cc-2',
          spine: 'Open Flood Watch',
          category: 'Civic Science Volunteering',
          meta: 'Monsoon 2025 · Haor Basin Outreach',
          title: 'Community River-Gauge Literacy & Calibration Workshops',
          subtitle: 'Youth Open Environmental Monitoring',
          description: 'Trained local secondary school volunteers to log daily water-level benchmarks and cross-check automated ultrasonic telemetry readings.',
          footerMeta: '3 Rural Partner Schools',
          linkLabel: 'Partner Network ↗',
          linkUrl: '/institutes/'
        },
        {
          id: 'cc-3',
          spine: 'Math Circle',
          category: 'Peer Mentorship',
          meta: '2024 — Present · Weekly Problem Seminar',
          title: 'Combinatorics & Proof-Writing Study Group Facilitator',
          subtitle: 'ILG0002 · Open Mathematics Community',
          description: 'Leading weekly problem-solving sessions on invariants, graph coloring, and generating functions for junior secondary students across Bangladesh.',
          footerMeta: '45+ Active Student Members',
          linkLabel: 'Join Study Circle ↗',
          linkUrl: '/communities/'
        }
      ]
    },

    founder: {
      profileKey: 'founder',
      cid: 'founder-ikramul-hoque-arik',
      accountType: 'S',
      name: 'Ikramul Hoque',
      institution: 'Founder & Chief-Developer · The Iteration Lab',
      roleKicker: 'Student · Researcher · Founder',
      headline: 'Turn Insight Into Impact',
      lead: 'Guiding the architectural vision, open research systems, and student publishing infrastructure of The Iteration Lab. Leading initiatives to make scientific methodology and software engineering accessible to youth.',
      primaryCtaTarget: 'researches',
      whatsapp: 'https://wa.me/TheIterationLab',
      email: 'coordination@iterationlab.org',
      location: 'Bangladesh · Open Educational Research Network',
      photo: '/leaders/img/Arik.webp',
      statementKicker: 'Architectural Vision',
      quote: '“When students are trusted with real research infrastructure and transparent peer review, classrooms transform into engines of discovery.”',
      description: 'Designing full-stack open academic archives, institutional verification workflows, and collaborative software registries connecting secondary schools, colleges, and mentors nationwide.',
      gpas: {
        ssc: '5.00',
        sscSub: 'Science · Merit Distinction',
        hsc: '5.00',
        hscSub: 'Higher Secondary Science',
        ug: '0',
        ugSub: 'Undergraduate CGPA',
        grad: '0',
        gradSub: 'Graduate CGPA',
        researchCount: '05',
        researchSub: 'Papers & Platform Systems'
      },
      education: [
        {
          id: 'f-edu-1',
          period: 'Current',
          core: 'Higher Secondary & Independent Computer Systems Research',
          org: 'Bangladesh · Open Research & Software Architecture',
          detail: 'Focusing on distributed database security, Row-Level Security (RLS) governance, scientific simulation, and low-bandwidth educational tooling.'
        },
        {
          id: 'f-edu-2',
          period: 'Completed',
          core: 'Secondary School Certificate (SSC) in Science',
          org: 'Science Division · GPA 5.00',
          detail: 'Foundation in physics, mathematics, algorithmic systems, and experimental science communication.'
        }
      ],
      skills: [
        {
          id: 'f-sk-1',
          spine: 'Architecture',
          category: 'Systems Engineering',
          meta: 'PostgreSQL · Supabase RLS · TypeScript · Static Edge',
          title: 'Zero-Server Academic Publishing & Verification Systems',
          subtitle: 'Platform Architecture & Security Governance',
          description: 'Engineered fine-grained Row-Level Security policies, cryptographic identity chains, and ultra-lightweight multi-directory static frontends.',
          footerMeta: 'Production Infrastructure · The Iteration Lab',
          linkLabel: 'External Portfolio ↗',
          linkUrl: 'https://ikramulhoque-arik.github.io'
        },
        {
          id: 'f-sk-2',
          spine: 'Governance',
          category: 'Editorial Standards',
          meta: 'Open Access · Peer Review · Youth Safety',
          title: 'Open Research Governance & Institutional Alliances',
          subtitle: 'Founding Charter & Verification Protocol',
          description: 'Established multi-tier identity verification across EIIN institutions, faculty mentors, and student authors while safeguarding minor privacy.',
          footerMeta: 'Governance Framework · v2026',
          linkLabel: 'Read Charter ↗',
          linkUrl: '/#policies'
        }
      ],
      experiences: [
        {
          id: 'f-exp-1',
          period: '2025 — Present',
          core: 'Founder & Chief-Developer',
          org: 'The Iteration Lab',
          detail: 'Leading platform architecture, database security design, student academic publishing programs, and institutional college partnerships across Bangladesh.'
        }
      ],
      researches: [
        {
          id: 'f-res-1',
          ilrid: 'ILR0008',
          spine: 'ILR0008 · Pedagogy',
          category: 'Educational Systems',
          meta: '2026 · Open Platform Monograph',
          title: 'Iterative Peer-Review Cycles in Secondary & Collegiate Investigative Journals',
          subtitle: 'Open Educational Research Infrastructure',
          description: 'Evaluating how structured faculty-guided peer review elevates hypothesis rigor, citation hygiene, and reproducibility among first-time student researchers.',
          image: '/profile/img/ocr_manuscript.jpg',
          footerMeta: 'Open Access · Platform Study',
          linkLabel: 'Browse Archive ↗',
          linkUrl: '/researches/'
        },
        {
          id: 'f-res-2',
          ilrid: 'ILR0002',
          spine: 'ILR0002 · Sensing',
          category: 'Environmental Telemetry',
          meta: '2026 · Collaborative Cohort Study',
          title: 'Decentralized Environmental Telemetry & Open Hardware Registries',
          subtitle: 'The Iteration Lab Hardware & Data Track',
          description: 'Standardizing open hardware schematics and field sensor datasets so collegiate labs can replicate river-stage and microclimate experiments affordably.',
          image: '/profile/img/hydrology_sensor.jpg',
          footerMeta: 'Open Hardware Protocol',
          linkLabel: 'Browse Archive ↗',
          linkUrl: '/researches/'
        }
      ],
      softwares: [
        {
          id: 'f-sw-1',
          ilsid: 'ILS0000',
          spine: 'Core Platform',
          category: 'Production Infrastructure',
          meta: 'JavaScript · PostgREST · Row-Level Security',
          title: 'The Iteration Lab Open Research & Directory Engine',
          subtitle: 'Multi-Directory Academic Archive & Verification Suite',
          description: 'Complete static-hosted academic network connecting verified students, teachers, EIIN colleges, research preprints, and open-source software builds.',
          image: '/profile/img/ocr_manuscript.jpg',
          footerMeta: 'Live Production · iterationlab',
          linkLabel: 'Software Registry ↗',
          linkUrl: '/softwares/'
        }
      ],
      cocurriculars: [
        {
          id: 'f-cc-1',
          spine: 'Alliances',
          category: 'National Student Network',
          meta: '2025 — Present · Inter-College Coordination',
          title: 'Collegiate Research Chapters & Open Software Guilds',
          subtitle: 'Mentorship & Community Stewardship',
          description: 'Building collaborative bridges between science clubs, faculty advisors, and independent student builders across Bangladesh.',
          footerMeta: 'Open Network Stewardship',
          linkLabel: 'View Leaders ↗',
          linkUrl: '/leaders/'
        }
      ]
    },

    teacher: {
      profileKey: 'teacher',
      cid: 'sample-teacher-cid-0002',
      accountType: 'T',
      name: 'Dr. Farhana Rahman',
      institution: 'Associate Professor of Physics · EIIN 108274',
      roleKicker: ROLE_DEFAULTS.T.roleKicker,
      headline: ROLE_DEFAULTS.T.headline,
      lead: ROLE_DEFAULTS.T.lead,
      primaryCtaTarget: 'researches',
      whatsapp: 'https://wa.me/TheIterationLab',
      email: 'farhana.mentor@iterationlab.org',
      location: 'Dhaka, Bangladesh',
      photo: '/profile/img/teacher_portrait.jpg',
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
        researchCount: '14',
        researchSub: 'Journals & Supervised Papers'
      },
      education: [
        {
          id: 't-edu-1',
          period: '2016 — 2020',
          core: 'Ph.D. in Computational Condensed Matter & Nonlinear Dynamics',
          org: 'University of Dhaka · Collaborative Numerical Lab',
          detail: 'Dissertation on finite-element transport simulations in disordered low-dimensional lattices and open pedagogical simulation packages.'
        },
        {
          id: 't-edu-2',
          period: '2010 — 2015',
          core: 'B.Sc. (Honours) & M.Sc. in Physics',
          org: 'Department of Physics, University of Dhaka',
          detail: 'Graduated First Class with distinction; recipient of the Dean’s Academic Gold Medal for experimental optics and numerical methods.'
        }
      ],
      skills: [
        {
          id: 't-sk-1',
          spine: 'Peer Review',
          category: 'Editorial & Methodological Governance',
          meta: 'Experimental Design · Error Propagation · Ethics',
          title: 'Senior Academic Reviewer — Student & Collegiate Manuscripts',
          subtitle: 'The Iteration Lab Editorial Board',
          description: 'Evaluating statistical power, measurement uncertainty, and reproducibility across physics, environmental sensing, and applied mathematics submissions.',
          footerMeta: '38+ Student Manuscripts Reviewed',
          linkLabel: 'Editorial Standards ↗',
          linkUrl: '/#policies'
        },
        {
          id: 't-sk-2',
          spine: 'Simulation',
          category: 'Computational Physics',
          meta: 'Fortran · Python · Finite Element · Monte Carlo',
          title: 'Numerical Transport & Stochastic Lattice Modelling',
          subtitle: 'Graduate & Collegiate Curriculum Development',
          description: 'Authoring interactive numerical laboratories that allow HSC and undergraduate students to visualize differential equations without proprietary licenses.',
          footerMeta: 'Open Curriculum Fellow',
          linkLabel: 'Explore Software ↗',
          linkUrl: '/softwares/'
        }
      ],
      experiences: [
        {
          id: 't-exp-1',
          period: '2021 — Present',
          core: 'Associate Professor & Collegiate Research Coordinator',
          org: 'Department of Physics · Partner College Network',
          detail: 'Mentoring student research cohorts, supervising laboratory safety and instrumentation calibration, and chairing inter-college thesis symposia.'
        },
        {
          id: 't-exp-2',
          period: '2017 — 2021',
          core: 'Lecturer in Experimental & Computational Physics',
          org: 'Higher Secondary & Undergraduate Honours Division',
          detail: 'Redesigned introductory mechanics and electromagnetism laboratories around data-acquisition microcontrollers and uncertainty analysis.'
        }
      ],
      researches: [
        {
          id: 't-res-1',
          ilrid: 'ILR0012',
          spine: 'ILR0012 · Pedagogy',
          category: 'Physics Education Research',
          meta: 'September 2026 · Journal of Open Collegiate Inquiry',
          title: 'Microcontroller Data-Logging as a Bridge to Error Analysis in Higher Secondary Laboratories',
          subtitle: 'Lead Author · Multi-College Controlled Cohort Study',
          description: 'Demonstrating significant gains in student comprehension of measurement variance when manual stopwatch trials are paired with open-source optical gates.',
          image: '/profile/img/hydrology_sensor.jpg',
          footerMeta: 'Peer-Reviewed · N = 310 Students',
          linkLabel: 'Read Full Paper ↗',
          linkUrl: '/researches/'
        },
        {
          id: 't-res-2',
          ilrid: 'ILR0009',
          spine: 'ILR0009 · Microgrids',
          category: 'Applied Energy Physics',
          meta: 'June 2026 · Supervised Student Co-Publication',
          title: 'Decentralized DC Microgrid Control via Swarm Voltage Droop Optimization',
          subtitle: 'Faculty Supervisor · Energy & Mechatronics Lab',
          description: 'Supervised student simulation of peer-to-peer solar power sharing in off-grid agricultural settlements with battery cycle longevity heuristics.',
          image: '/profile/img/ocr_manuscript.jpg',
          footerMeta: 'Open Simulation Code Included',
          linkLabel: 'Read Full Paper ↗',
          linkUrl: '/researches/'
        }
      ],
      softwares: [
        {
          id: 't-sw-1',
          ilsid: 'ILS0007',
          spine: 'ILS0007 · Optics Lab',
          category: 'Educational Simulation · v2.0',
          meta: 'TypeScript · Canvas 2D · Numerical Wave Optics',
          title: 'WaveBench — Interactive Diffraction & Interferometry Sandbox',
          subtitle: 'Open Classroom Physics Simulator',
          description: 'Allows students to vary slit geometry, wavelength, and coherence length in real time while exporting synthetic intensity CSVs for curve fitting.',
          image: '/profile/img/ocr_manuscript.jpg',
          footerMeta: 'Adopted by 9 Partner Classrooms',
          linkLabel: 'Explore Software ↗',
          linkUrl: '/softwares/'
        }
      ],
      cocurriculars: [
        {
          id: 't-cc-1',
          spine: 'Olympiad Jury',
          category: 'Academic Service',
          meta: '2022 — Present · Experimental Physics Track',
          title: 'Regional Academic Juror & Experimental Problem Designer',
          subtitle: 'Bangladesh Youth Physics & Science Symposia',
          description: 'Designing low-cost experimental apparatus problems and training volunteer evaluators across divisional rounds.',
          footerMeta: 'Annual National Service',
          linkLabel: 'Teachers Directory ↗',
          linkUrl: '/teachers/'
        }
      ]
    },

    publisher: {
      profileKey: 'publisher',
      cid: 'sample-publisher-cid-0003',
      accountType: 'R',
      name: 'Mahmudul Hasan',
      institution: 'Independent Hydrological & Archival Publisher',
      roleKicker: ROLE_DEFAULTS.R.roleKicker,
      headline: ROLE_DEFAULTS.R.headline,
      lead: ROLE_DEFAULTS.R.lead,
      primaryCtaTarget: 'softwares',
      whatsapp: 'https://wa.me/TheIterationLab',
      email: 'mahmudul.open@iterationlab.org',
      location: 'Sylhet & Dhaka, Bangladesh',
      photo: '/leaders/img/sami.jpg',
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
        researchCount: '06',
        researchSub: 'Open Field Monographs'
      },
      education: [
        {
          id: 'r-edu-1',
          period: '2018 — 2022',
          core: 'B.Sc. in Civil & Environmental Engineering',
          org: 'Shahjalal University of Science and Technology (SUST)',
          detail: 'Undergraduate thesis on tidal embankment shear cohesion and open-source hydrological GIS mapping in flash-flood-prone haor basins.'
        }
      ],
      skills: [
        {
          id: 'r-sk-1',
          spine: 'GIS & Hydrology',
          category: 'Field Instrumentation',
          meta: 'QGIS · Sentinel-1 SAR · Ultrasonic Gauges',
          title: ' Floodplain Mapping & Citizen Hydrological Telemetry',
          subtitle: 'Open Environmental Data Stewardship',
          description: 'Combining satellite synthetic-aperture radar flood extents with community-maintained river stage sensors to publish open CSV baselines.',
          footerMeta: 'Open Data Commons Attribution',
          linkLabel: 'Explore Research ↗',
          linkUrl: '/researches/'
        }
      ],
      experiences: [
        {
          id: 'r-exp-1',
          period: '2023 — Present',
          core: 'Independent Open-Science Publisher & Field Engineer',
          org: 'Surma-Kushiyara Basin Citizen Telemetry Project',
          detail: 'Maintaining 11 solar river-level nodes and publishing seasonal sediment and embankment cohesion reports on The Iteration Lab.'
        }
      ],
      researches: [
        {
          id: 'r-res-1',
          ilrid: 'ILR0006',
          spine: 'ILR0006 · Ecology',
          category: 'Ecological Engineering',
          meta: 'July 2026 · Open Field Monograph',
          title: 'Bio-Engineering Coastal Embankments: Tensile Cohesion of Vetiver Root Systems',
          subtitle: 'Independent Field Measurement Study',
          description: 'Field pullout dynamometer measurements evaluating shear resistance improvement along tidal embankment test strips across salinity gradients.',
          image: '/profile/img/hydrology_sensor.jpg',
          footerMeta: '14 min read · Raw CSV Included',
          linkLabel: 'Read Full Paper ↗',
          linkUrl: '/researches/'
        }
      ],
      softwares: [
        {
          id: 'r-sw-1',
          ilsid: 'ILS0009',
          spine: 'ILS0009 · HaorGIS',
          category: 'Public Utility · v1.4',
          meta: 'Leaflet · GeoJSON · Offline Service Worker',
          title: 'HaorStage — Low-Bandwidth River & Embankment Atlas',
          subtitle: 'Offline-Capable Hydrological Web Map',
          description: 'Lightweight vector tile viewer rendering 72-hour water-level trends and vulnerable embankment segments on 2G mobile connections.',
          image: '/profile/img/hydrology_sensor.jpg',
          footerMeta: 'Public Domain · 42KB Initial Payload',
          linkLabel: 'Explore Software ↗',
          linkUrl: '/softwares/'
        }
      ],
      cocurriculars: [
        {
          id: 'r-cc-1',
          spine: 'Open Archive',
          category: 'Regional Heritage',
          meta: '2024 — Present · Volunteer Digitization',
          title: 'Sylheti Historical Periodical & Science Pamphlet Digitization',
          subtitle: 'Open Archival Preservation Initiative',
          description: 'Scanning and OCR-indexing 20th-century regional science periodicals for unrestricted student historical research.',
          footerMeta: '140+ Issues Digitized',
          linkLabel: 'Communities ↗',
          linkUrl: '/communities/'
        }
      ]
    }
  };
}

/* ==========================================================================
   2. State & Supabase Auth Session Ownership Helper
   ========================================================================== */
const STORAGE_PREFIX = 'til_portfolio_draft_v1_';
const OWNER_SIM_KEY = 'til_portfolio_sim_owner_v1';

const state = {
  activeProfileKey: 'student',
  profile: null,
  supabaseUserId: null,
  simulateOwnerInDemo: true,
  isAccountOwner: true,
  isEditMode: false,
  recentIndex: 0,
  recentTimer: null,
  recentPaused: false,
  stackRafPending: false
};

/**
 * Reads Supabase session from browser localStorage or cookies without exposing secrets.
 * When live Supabase auth is used on login.html, supabase-js writes:
 *   localStorage['sb-<project-ref>-auth-token'] -> JSON with { user: { id: "<uuid>" } }
 */
function detectSupabaseSessionUserId() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (/^sb-.*-auth-token$/i.test(key)) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const user = parsed?.user || parsed?.currentSession?.user;
        if (user && typeof user.id === 'string' && user.id.trim()) {
          return user.id.trim();
        }
      }
    }
    // Check cookies fallback if custom cookie storage is used later
    const cookieMatch = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
    if (cookieMatch && cookieMatch[1]) {
      const parts = decodeURIComponent(cookieMatch[1]).split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload && typeof payload.sub === 'string') return payload.sub;
      }
    }
  } catch (_) {
    // Ignore storage access errors in restricted iframes
  }
  return null;
}

function resolveInitialProfileKeyFromUrl() {
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);

  if (params.get('visitor') === '1') {
    state.simulateOwnerInDemo = false;
  } else {
    const savedSim = sessionStorage.getItem(OWNER_SIM_KEY);
    if (savedSim !== null) {
      state.simulateOwnerInDemo = savedSim === '1';
    }
  }

  const qProfile = (params.get('profile') || '').toLowerCase();
  if (qProfile === 'founder' || path.includes('ikramulhoquearik')) {
    return 'founder';
  }

  const qType = (params.get('type') || params.get('role') || '').toUpperCase();
  if (qType === 'T' || qType === 'TEACHER' || /\/profiles?\/t(\/|$)/i.test(path)) {
    return 'teacher';
  }
  if (qType === 'R' || qType === 'PUBLISHER' || qType === 'READER' || /\/profiles?\/r(\/|$)/i.test(path)) {
    return 'publisher';
  }
  return 'student';
}

function loadProfileData(profileKey) {
  const samples = createSamplePortfolios();
  const base = samples[profileKey] || samples.student;
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + base.profileKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.profileKey === base.profileKey) {
        return parsed;
      }
    }
  } catch (_) {
    // Fallback to clean sample
  }
  return JSON.parse(JSON.stringify(base));
}

function persistCurrentProfile() {
  if (!state.profile) return;
  try {
    localStorage.setItem(
      STORAGE_PREFIX + state.profile.profileKey,
      JSON.stringify(state.profile)
    );
  } catch (_) {
    // Ignore quota errors
  }
  // Future Supabase persistence hook:
  // When portfolio columns/tables are added in Supabase, PATCH /rest/v1/profiles?cid=eq.<uid> here.
}

function computeIsOwner() {
  state.supabaseUserId = detectSupabaseSessionUserId();
  if (state.supabaseUserId && state.profile && state.supabaseUserId === state.profile.cid) {
    return true;
  }
  // While using sample data prior to database migration, honor demo owner toggle
  const isSampleRecord = String(state.profile?.cid || '').startsWith('sample-') ||
    String(state.profile?.cid || '').startsWith('founder-');
  if (isSampleRecord) {
    return Boolean(state.simulateOwnerInDemo);
  }
  return false;
}

/* ==========================================================================
   3. Safe DOM Helpers & Smart Default Lookup
   ========================================================================== */
function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'IL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

/* ==========================================================================
   4. Rendering the Complete Portfolio
   ========================================================================== */
function renderAll() {
  if (!state.profile) return;
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
  renderCvSection('education', 'edu-cv-list', 'Add Education');
  renderCvSection('experiences', 'exp-cv-list', 'Add Experience');
  renderStackedSection('skills', 'skills-stack-stage', 'skills-stack-counter', 'skill, badge or certification');
  renderStackedSection('researches', 'researches-stack-stage', 'researches-stack-counter', 'research or journal');
  renderStackedSection('softwares', 'softwares-stack-stage', 'softwares-stack-counter', 'software project');
  renderStackedSection('cocurriculars', 'cocurriculars-stack-stage', 'cocurriculars-stack-counter', 'co-curricular activity');
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
    nameEl.dataset.default = 'Member Researcher';
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
    const rawWa = String(p.whatsapp || WHATSAPP_URL || 'https://wa.me/TheIterationLab').trim();
    const href = /^https?:\/\//i.test(rawWa)
      ? rawWa
      : `https://wa.me/${rawWa.replace(/^[@+\s]+/, '')}`;
    waBtn.setAttribute('href', href);
  }

  // Portrait image with zero-broken-image fallback
  const imgEl = document.getElementById('prof-portrait-img');
  const fallbackEl = document.getElementById('prof-portrait-fallback');
  const initialsEl = document.getElementById('prof-portrait-initials');
  if (initialsEl) {
    initialsEl.textContent = getInitials(p.name);
  }
  if (imgEl && fallbackEl) {
    if (p.photo) {
      imgEl.hidden = false;
      fallbackEl.hidden = true;
      imgEl.src = p.photo;
      imgEl.alt = `${p.name} portrait`;
      imgEl.onerror = () => {
        imgEl.hidden = true;
        fallbackEl.hidden = false;
      };
    } else {
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
   5. Obsidian Quote, Description & Dynamic GPA Strip
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
  const metricDefs = [
    {
      key: 'ssc',
      label: 'SSC GPA',
      value: g.ssc,
      scale: '/ 5.00',
      subKey: 'sscSub',
      sub: g.sscSub || 'Secondary Examination',
      isGpa: true
    },
    {
      key: 'hsc',
      label: 'HSC GPA',
      value: g.hsc,
      scale: '/ 5.00',
      subKey: 'hscSub',
      sub: g.hscSub || 'Higher Secondary',
      isGpa: true
    },
    {
      key: 'ug',
      label: 'UG / Others',
      value: g.ug,
      scale: '/ 4.00',
      subKey: 'ugSub',
      sub: g.ugSub || 'Undergraduate CGPA',
      isGpa: true
    },
    {
      key: 'grad',
      label: 'Graduate',
      value: g.grad,
      scale: '/ 4.00',
      subKey: 'gradSub',
      sub: g.gradSub || 'Graduate CGPA',
      isGpa: true
    },
    {
      key: 'researchCount',
      label: 'Research & Journal',
      value: g.researchCount || String((p.researches || []).length).padStart(2, '0'),
      scale: 'works',
      subKey: 'researchSub',
      sub: g.researchSub || 'Published & Indexed',
      isGpa: false
    }
  ];

  // Critical Rule: If UG, Graduate (or any GPA) is empty or 0, hide it in User Mode
  // and stretch remaining columns evenly so there are zero blank gaps!
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
    valSpan.dataset.editable = `gpas.${m.key}`;
    valSpan.dataset.singleLine = 'true';
    valSpan.dataset.gpaField = m.isGpa ? 'true' : 'false';
    valSpan.dataset.default = m.isGpa ? '0' : '01';

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
   6. CV Timeline Renderer (Education & Experiences)
   ========================================================================== */
function renderCvSection(arrayKey, containerId, addLabel) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.textContent = '';

  const items = Array.isArray(state.profile[arrayKey]) ? state.profile[arrayKey] : [];

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
    removeBtn.hidden = !state.isEditMode || items.length <= 1;
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      state.profile[arrayKey].splice(idx, 1);
      persistCurrentProfile();
      renderAll();
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
    detail.textContent = entry.detail;
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
    addBtn.onclick = () => {
      state.profile[arrayKey].push({
        id: `${arrayKey}-${Date.now()}`,
        period: '2026 — Present',
        core: arrayKey === 'education'
          ? 'New Academic Qualification (Double-click to edit)'
          : 'New Research or Laboratory Experience (Double-click to edit)',
        org: state.profile.institution || 'Institution / Department',
        detail: 'Double-click to describe key coursework, thesis topic, methodology, or measurable outcomes.'
      });
      persistCurrentProfile();
      renderAll();
    };
  }
}

/* ==========================================================================
   7. Horizontal Right-to-Left Stacked Cards Renderer & Scroll Engine
   ========================================================================== */
function renderStackedSection(sectionKey, stageId, counterId, singularNoun) {
  const stage = document.getElementById(stageId);
  if (!stage) return;
  stage.textContent = '';

  const items = Array.isArray(state.profile[sectionKey]) ? state.profile[sectionKey] : [];
  const showMediaSlot = sectionKey === 'researches' || sectionKey === 'softwares';

  items.forEach((item, idx) => {
    const card = document.createElement('article');
    card.className = 'prof-stack-card';
    card.dataset.cardIndex = String(idx);

    // Left Index Spine (remains peeking on the left as newer cards stack from right to left)
    const spine = document.createElement('div');
    spine.className = 'prof-card-spine';
    spine.setAttribute('title', `Scroll to card ${idx + 1}: ${item.title}`);
    spine.addEventListener('click', () => scrollToStackCard(stage, idx));

    const spineNum = document.createElement('span');
    spineNum.className = 'prof-spine-num';
    spineNum.textContent = String(idx + 1).padStart(2, '0');

    const spineLabel = document.createElement('span');
    spineLabel.className = 'prof-spine-label';
    spineLabel.textContent = item.spine || item.category || `Item ${idx + 1}`;

    spine.appendChild(spineNum);
    spine.appendChild(spineLabel);

    // Card Inner Content
    const inner = document.createElement('div');
    inner.className = 'prof-stack-card-inner' + (showMediaSlot ? ' has-media' : '');

    const copyCol = document.createElement('div');
    copyCol.className = 'prof-card-copy';

    const topGroup = document.createElement('div');

    // Clean Unboxed Metadata Line (Zero-Pill Rule)
    const metaLine = document.createElement('div');
    metaLine.className = 'prof-card-meta-line';

    const catSpan = document.createElement('span');
    catSpan.className = 'prof-meta-accent';
    catSpan.textContent = item.category || 'Academic Entry';
    catSpan.dataset.editable = `${sectionKey}.${idx}.category`;
    catSpan.dataset.singleLine = 'true';
    catSpan.dataset.default = 'Academic Entry';

    const sepSpan = document.createElement('span');
    sepSpan.className = 'prof-meta-sep';
    sepSpan.setAttribute('aria-hidden', 'true');
    sepSpan.textContent = '·';

    const dateSpan = document.createElement('span');
    dateSpan.textContent = item.meta || '2026';
    dateSpan.dataset.editable = `${sectionKey}.${idx}.meta`;
    dateSpan.dataset.singleLine = 'true';
    dateSpan.dataset.default = '2026';

    metaLine.appendChild(catSpan);
    metaLine.appendChild(sepSpan);
    metaLine.appendChild(dateSpan);

    if (state.isEditMode && items.length > 1) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'prof-item-remove-btn';
      delBtn.textContent = 'Delete Card';
      delBtn.addEventListener('click', () => {
        state.profile[sectionKey].splice(idx, 1);
        if (sectionKey === 'researches') {
          state.profile.gpas.researchCount = String(state.profile.researches.length).padStart(2, '0');
        }
        persistCurrentProfile();
        renderAll();
      });
      metaLine.appendChild(delBtn);
    }

    const titleEl = document.createElement('h3');
    titleEl.className = 'prof-card-title';
    titleEl.textContent = item.title;
    titleEl.dataset.editable = `${sectionKey}.${idx}.title`;
    titleEl.dataset.singleLine = 'true';
    titleEl.dataset.default = 'Untitled Portfolio Entry';

    const subEl = document.createElement('div');
    subEl.className = 'prof-card-subtitle';
    subEl.textContent = item.subtitle || '';
    subEl.dataset.editable = `${sectionKey}.${idx}.subtitle`;
    subEl.dataset.singleLine = 'true';
    subEl.dataset.default = state.profile.institution || 'The Iteration Lab';

    topGroup.appendChild(metaLine);
    topGroup.appendChild(titleEl);
    topGroup.appendChild(subEl);

    const descEl = document.createElement('p');
    descEl.className = 'prof-card-desc';
    descEl.textContent = item.description;
    descEl.dataset.editable = `${sectionKey}.${idx}.description`;
    descEl.dataset.default = 'Detailed summary of methods, technical execution, and verified findings.';

    const footer = document.createElement('div');
    footer.className = 'prof-card-footer';

    const specs = document.createElement('span');
    specs.className = 'prof-card-specs';
    specs.textContent = item.footerMeta || 'Verified Portfolio Record';
    specs.dataset.editable = `${sectionKey}.${idx}.footerMeta`;
    specs.dataset.singleLine = 'true';
    specs.dataset.default = 'Verified Portfolio Record';

    const linksWrap = document.createElement('div');
    linksWrap.className = 'prof-card-links';

    const inspectBtn = document.createElement('button');
    inspectBtn.type = 'button';
    inspectBtn.className = 'prof-card-link';
    inspectBtn.textContent = item.linkLabel || 'View Details ↗';
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

  // In Edit Mode: append the extra final card with "Add another..." button
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
    spineNum.textContent = '+';
    const spineLabel = document.createElement('span');
    spineLabel.className = 'prof-spine-label';
    spineLabel.textContent = 'Add New';
    spine.appendChild(spineNum);
    spine.appendChild(spineLabel);

    const body = document.createElement('div');
    body.className = 'prof-add-card-body';

    const title = document.createElement('h3');
    title.className = 'prof-add-card-title';
    title.textContent = `Add another ${singularNoun}`;

    const desc = document.createElement('p');
    desc.className = 'prof-add-card-desc';
    desc.textContent = 'Appends a new card to this stack. Double-click any heading, metadata, or summary on the new card to customize it.';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'prof-add-card-cta';
    btn.textContent = `+ Add another ${singularNoun}`;
    btn.addEventListener('click', () => handleAddStackedCard(sectionKey, stage));

    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(btn);

    addCard.appendChild(spine);
    addCard.appendChild(body);
    stage.appendChild(addCard);
  }

  const counterEl = document.getElementById(counterId);
  if (counterEl) {
    const total = stage.children.length;
    counterEl.textContent = `01 / ${String(total).padStart(2, '0')} · Scroll to stack`;
  }
}

function handleAddStackedCard(sectionKey, stageEl) {
  const list = state.profile[sectionKey];
  const nextNum = list.length + 1;

  const templates = {
    skills: {
      id: `sk-${Date.now()}`,
      spine: `Skill ${String(nextNum).padStart(2, '0')}`,
      category: 'Certification & Badge',
      meta: 'Issued 2026 · Double-click to edit',
      title: 'New Skill, Olympiad Badge, or Certification',
      subtitle: state.profile.institution || 'Issuing Institution or Guild',
      description: 'Double-click this description to detail competencies, laboratory methods, tools mastered, or verification credentials.',
      footerMeta: 'Credential Verified',
      linkLabel: 'View Details ↗',
      linkUrl: '/#policies'
    },
    researches: {
      id: `res-${Date.now()}`,
      ilrid: `ILR00${nextNum + 10}`,
      spine: `ILR00${nextNum + 10}`,
      category: 'Open Research Preprint',
      meta: 'October 2026 · Manuscript Draft',
      title: 'New Research Paper or Journal Investigation',
      subtitle: `Author: ${state.profile.name}`,
      description: 'Double-click to enter your abstract, experimental hypothesis, dataset scope, and key quantitative findings.',
      image: '/profile/img/hydrology_sensor.jpg',
      footerMeta: 'Open Access Manuscript',
      linkLabel: 'Read Full Paper ↗',
      linkUrl: '/researches/'
    },
    softwares: {
      id: `sw-${Date.now()}`,
      ilsid: `ILS00${nextNum + 10}`,
      spine: `ILS00${nextNum + 10}`,
      category: 'Open Source Software',
      meta: 'TypeScript · Python · Open License',
      title: 'New Software Build or Scientific Tool',
      subtitle: `Maintainer: ${state.profile.name}`,
      description: 'Double-click to describe what this software solves, its system architecture, and how students or researchers can run it.',
      image: '/profile/img/ocr_manuscript.jpg',
      footerMeta: 'MIT License · Source Available',
      linkLabel: 'Explore Software ↗',
      linkUrl: '/softwares/'
    },
    cocurriculars: {
      id: `cc-${Date.now()}`,
      spine: `Activity ${String(nextNum).padStart(2, '0')}`,
      category: 'Co-Curricular & Community',
      meta: '2026 · Student Initiative',
      title: 'New Club Leadership, Olympiad, or Outreach Role',
      subtitle: state.profile.institution || 'The Iteration Lab Community',
      description: 'Double-click to summarize your role, events organized, students mentored, or community impact.',
      footerMeta: 'Active Contribution',
      linkLabel: 'View Communities ↗',
      linkUrl: '/communities/'
    }
  };

  list.push(templates[sectionKey] || templates.skills);
  if (sectionKey === 'researches') {
    state.profile.gpas.researchCount = String(list.length).padStart(2, '0');
  }
  persistCurrentProfile();
  renderAll();

  // Scroll smoothly to focus the newly added card (index = list.length - 1)
  requestAnimationFrame(() => {
    const updatedStage = document.getElementById(stageEl.id);
    if (updatedStage) {
      scrollToStackCard(updatedStage, list.length - 1);
    }
  });
}

function recalculateStackRunways() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sections = document.querySelectorAll('.prof-stack-section');

  sections.forEach((sec) => {
    const runway = sec.querySelector('.prof-stack-runway');
    const sticky = sec.querySelector('.prof-stack-sticky');
    const stage = sec.querySelector('.prof-stack-stage');
    if (!runway || !sticky || !stage) return;

    const cards = Array.from(stage.children);
    const count = cards.length;

    if (reducedMotion || count <= 1) {
      runway.style.height = 'auto';
      stage.style.setProperty('--max-spine-space', '0px');
      cards.forEach((c, idx) => {
        c.style.transform = 'none';
        c.style.zIndex = String(idx + 1);
      });
      return;
    }

    const stageWidth = stage.clientWidth || 960;
    const baseSpine = window.innerWidth <= 520 ? 28 : window.innerWidth <= 820 ? 34 : 44;
    const maxAllowedTotalSpine = Math.floor(stageWidth * 0.34);
    const spineStep = Math.min(baseSpine, Math.floor(maxAllowedTotalSpine / Math.max(1, count - 1)));
    const totalSpineSpace = spineStep * (count - 1);

    stage.dataset.spineStep = String(spineStep);
    stage.style.setProperty('--max-spine-space', `${totalSpineSpace}px`);

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
    const runway = sec.querySelector('.prof-stack-runway');
    const sticky = sec.querySelector('.prof-stack-sticky');
    const stage = sec.querySelector('.prof-stack-stage');
    const counter = sec.querySelector('.prof-stack-counter');
    if (!runway || !sticky || !stage) return;

    const cards = Array.from(stage.children);
    const count = cards.length;
    if (count <= 1) return;

    const rect = runway.getBoundingClientRect();
    const maxScroll = Math.max(1, runway.offsetHeight - sticky.offsetHeight);
    const rawScrolled = -(rect.top - headerOffset);
    const progress01 = Math.min(1, Math.max(0, rawScrolled / maxScroll));

    // u spans [0, count - 1]
    const u = progress01 * (count - 1);
    const spineStep = parseFloat(stage.dataset.spineStep || '40');
    const stageWidth = stage.clientWidth || 960;
    const offscreenRight = stageWidth + 36;

    cards.forEach((card, i) => {
      const restX = i * spineStep;
      let x = restX;

      if (i > 0) {
        const localT = Math.min(1, Math.max(0, u - (i - 1)));
        // Smooth deceleration as card glides from right to left onto the stack
        const eased = 1 - Math.pow(1 - localT, 2.5);
        x = offscreenRight + (restX - offscreenRight) * eased;
      }

      // Subtle depth scale for cards already underneath newer stacked cards
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
   8. Contact Section & Reader Modal
   ========================================================================== */
function renderContactDetails() {
  const p = state.profile;
  const emailEl = document.getElementById('prof-contact-email');
  const locEl = document.getElementById('prof-contact-location');
  const waLinkEl = document.getElementById('prof-contact-wa');

  if (emailEl) {
    emailEl.textContent = p.email || 'coordination@iterationlab.org';
    emailEl.dataset.default = 'coordination@iterationlab.org';
  }
  if (locEl) {
    locEl.textContent = p.location || 'Dhaka, Bangladesh';
    locEl.dataset.default = 'Dhaka, Bangladesh';
  }
  if (waLinkEl) {
    const rawWa = String(p.whatsapp || WHATSAPP_URL).trim();
    const href = /^https?:\/\//i.test(rawWa)
      ? rawWa
      : `https://wa.me/${rawWa.replace(/^[@+\s]+/, '')}`;
    waLinkEl.href = href;
    waLinkEl.textContent = rawWa.replace(/^https?:\/\//i, '');
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
  meta.textContent = `${item.category || kindLabel} · ${item.meta || '2026'}`;

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
  spec.textContent = item.footerMeta || 'The Iteration Lab Open Archive';

  const actionLink = document.createElement('a');
  actionLink.className = 'btn btn-orange';
  actionLink.href = item.linkUrl || '/researches/';
  if (/^https?:\/\//i.test(actionLink.href) && !actionLink.href.includes(window.location.host)) {
    actionLink.target = '_blank';
    actionLink.rel = 'noopener noreferrer';
  }
  actionLink.textContent = item.linkLabel || 'Open Directory Archive ↗';

  foot.appendChild(spec);
  foot.appendChild(actionLink);

  bodyEl.appendChild(meta);
  bodyEl.appendChild(sub);
  bodyEl.appendChild(desc);
  bodyEl.appendChild(foot);

  modal.classList.add('open');
}

/* ==========================================================================
   9. Double-Click (and Touch Double-Tap) Inline Editor
   ========================================================================== */
function activateInlineEditor(targetEl) {
  if (!state.isEditMode || !targetEl) return;
  if (targetEl.getAttribute('contenteditable') === 'true') return;

  const path = targetEl.dataset.editable;
  if (!path) return;

  const isSingleLine = targetEl.dataset.singleLine === 'true';
  const isGpaField = targetEl.dataset.gpaField === 'true';
  const defaultVal = targetEl.dataset.default || '';
  const previousText = targetEl.textContent || '';

  targetEl.setAttribute('contenteditable', 'true');
  targetEl.setAttribute('spellcheck', 'true');
  targetEl.focus();

  // Select text for immediate replacement
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
    } else if (!rawVal) {
      // Restore curated default when user leaves text/quote blank
      rawVal = defaultVal;
    }

    setByPath(state.profile, path, rawVal);
    persistCurrentProfile();
    renderAll();
  };

  const onBlur = () => commit(false);
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      commit(true);
    } else if (e.key === 'Enter' && (isSingleLine || !e.shiftKey)) {
      if (isSingleLine) {
        e.preventDefault();
        commit(false);
      }
    }
  };

  targetEl.addEventListener('blur', onBlur);
  targetEl.addEventListener('keydown', onKeyDown);
}

/* ==========================================================================
   10. Demo Preview Dock (Role & Logged-in Ownership Tester)
   ========================================================================== */
function renderDemoDock() {
  const selectEl = document.getElementById('prof-demo-role-select');
  const authBtn = document.getElementById('prof-demo-auth-btn');
  if (selectEl) {
    selectEl.value = state.profile.profileKey;
  }
  if (authBtn) {
    authBtn.classList.toggle('is-owner', state.isAccountOwner);
    authBtn.textContent = state.isAccountOwner ? 'Session: Owner (Eye Visible)' : 'Session: Visitor (Eye Hidden)';
  }
}

/* ==========================================================================
   11. Event Listeners & Initialization
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
      renderAll();
    });
  }

  const exitEditBtn = document.getElementById('prof-exit-edit-btn');
  if (exitEditBtn) {
    exitEditBtn.addEventListener('click', () => {
      state.isEditMode = false;
      renderAll();
    });
  }

  const resetDefaultsBtn = document.getElementById('prof-reset-defaults-btn');
  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener('click', () => {
      const key = state.profile.profileKey;
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

  // Primary CTA Switcher (Researches <-> Software)
  const ctaSwitchBtn = document.getElementById('prof-cta-switch-btn');
  if (ctaSwitchBtn) {
    ctaSwitchBtn.addEventListener('click', () => {
      state.profile.primaryCtaTarget =
        state.profile.primaryCtaTarget === 'softwares' ? 'researches' : 'softwares';
      persistCurrentProfile();
      renderAll();
    });
  }

  // Photo Upload Preview in Edit Mode
  const photoEditBtn = document.getElementById('prof-photo-edit-btn');
  const photoInput = document.getElementById('prof-photo-file-input');
  if (photoEditBtn && photoInput) {
    photoEditBtn.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', () => {
      const file = photoInput.files && photoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          state.profile.photo = reader.result;
          persistCurrentProfile();
          renderHeroSection();
        }
      };
      reader.readAsDataURL(file);
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

  // 7. Contact Form Handler
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

      contactFeedback.style.display = 'block';
      contactFeedback.className = 'form-feedback success';
      contactFeedback.textContent = `Inquiry recorded for ${state.profile.name} via The Iteration Lab Coordination Desk.`;
      contactForm.reset();
    });
  }

  // 8. Demo Role & Session Switcher Dock
  const roleSelect = document.getElementById('prof-demo-role-select');
  const authToggleBtn = document.getElementById('prof-demo-auth-btn');
  const dockCloseBtn = document.getElementById('prof-demo-close');
  const demoDock = document.getElementById('prof-demo-dock');

  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      const nextKey = roleSelect.value;
      state.activeProfileKey = nextKey;
      state.recentIndex = 0;
      state.profile = loadProfileData(nextKey);
      renderAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (authToggleBtn) {
    authToggleBtn.addEventListener('click', () => {
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

  // Listen for cross-tab Supabase login/logout changes
  window.addEventListener('storage', (e) => {
    if (e.key && /^sb-.*-auth-token$/i.test(e.key)) {
      renderAll();
    }
  });

  // Expose minimal debug reference for future DB integration
  window.__ITERATION_LAB_PORTFOLIO__ = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    getState: () => state
  };
}

document.addEventListener('DOMContentLoaded', () => {
  state.activeProfileKey = resolveInitialProfileKeyFromUrl();
  state.profile = loadProfileData(state.activeProfileKey);
  initInteractions();
  renderAll();
  startRecentAutoScroll();
});
