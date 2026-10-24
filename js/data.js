// Structured Data Layer for The Iteration Lab

export const RESEARCH_PUBLICATIONS = [
  {
    id: "pub-01",
    category: "Computational Linguistics",
    title: "Dialectal Phonetic Alignment in Low-Resource Bengali Speech Recognition",
    abstract: "A standardized acoustic benchmark evaluating sequence-to-sequence neural architectures for dialectal sentence normalization across regional spoken variants.",
    authors: "T. Hossain, F. A. Rini",
    institution: "Dept. of Computer Science & Engineering",
    date: "October 2026",
    doi: "10.5281/zenodo.til.2026.0491",
    readTime: "12 min read",
    sample: true
  },
  {
    id: "pub-02",
    category: "Environmental Sensing",
    title: "Autonomous LoRaWAN Telemetry Buoys for Flash Flood Warning in River Basins",
    abstract: "Ultra-low-power hydrostatic pressure transducers and 433MHz mesh radios designed to provide advance hydrological stage telemetry without cellular infrastructure.",
    authors: "M. H. Shuvo, S. Tabassum",
    institution: "Dept. of Electrical & Electronic Engineering",
    date: "September 2026",
    doi: "10.5281/zenodo.til.2026.0482",
    readTime: "9 min read",
    sample: true
  },
  {
    id: "pub-03",
    category: "Discrete Mathematics",
    title: "Extremal Graph Bounds for Minimal Crossing Topologies in Dense Micro-Grids",
    abstract: "Proving tight topological bounds on edge intersection density for k-connected planar subgraph decompositions in historical urban quarters.",
    authors: "A. Zahin, Z. Subah",
    institution: "Science & Mathematics Research Circle",
    date: "September 2026",
    doi: "10.5281/zenodo.til.2026.0411",
    readTime: "15 min read",
    sample: true
  },
  {
    id: "pub-04",
    category: "Applied Vision",
    title: "Attention-Guided CRNN Character Recognition for Historical Manuscripts",
    abstract: "End-to-end synthetic ligature generation and lightweight ONNX browser inference supporting complex conjuncts and archival vowel diacritics.",
    authors: "S. R. Chowdhury",
    institution: "Digital Humanities & Computing Lab",
    date: "August 2026",
    doi: "10.5281/zenodo.til.2026.0463",
    readTime: "11 min read",
    sample: true
  },
  {
    id: "pub-05",
    category: "Civil & Transportation",
    title: "Agent-Based Simulation of Dynamic Transit Signal Priority on Arterial Corridors",
    abstract: "Microscopic traffic headways combining SUMO simulation and real-world camera detections to optimize passenger throughput over vehicular volume.",
    authors: "N. Abdullah, K. M. Hasan",
    institution: "Transportation Systems Division",
    date: "August 2026",
    doi: "10.5281/zenodo.til.2026.0398",
    readTime: "8 min read",
    sample: true
  },
  {
    id: "pub-06",
    category: "Ecological Engineering",
    title: "Bio-Engineering Coastal Embankments: Tensile Cohesion of Vetiver Root Systems",
    abstract: "Field pullout dynamometer measurements evaluating shear resistance improvement along tidal embankment test strips across salinity gradients.",
    authors: "Cadet T. Karim, M. Alam",
    institution: "Applied Natural Sciences Cohort",
    date: "July 2026",
    doi: "10.5281/zenodo.til.2026.0384",
    readTime: "14 min read",
    sample: true
  },
  {
    id: "pub-07",
    category: "Renewable Energy",
    title: "Decentralized DC Microgrid Control via Swarm Voltage Droop Optimization",
    abstract: "Simulating peer-to-peer solar power sharing in off-grid agricultural settlements with battery cycle longevity optimization heuristics.",
    authors: "E. Mahmud, R. Parveen",
    institution: "Energy & Mechatronics Lab",
    date: "June 2026",
    doi: "10.5281/zenodo.til.2026.0351",
    readTime: "10 min read",
    sample: true
  },
  {
    id: "pub-08",
    category: "Educational Pedagogy",
    title: "Iterative Peer-Review Cycles in Secondary School Investigative Journals",
    abstract: "Measuring student hypothesis refinement, cognitive confidence, and scientific literacy across eight-week multi-institution review cohorts.",
    authors: "A. K. Siddique, T. Fariha",
    institution: "Curriculum & Science Education Guild",
    date: "May 2026",
    doi: "10.5281/zenodo.til.2026.0319",
    readTime: "7 min read",
    sample: true
  }
];

export const SOFTWARE_BUILDS = [
  {
    id: "sw-01",
    name: "BanglaLipi Web-OCR",
    description: "An open browser-based WebAssembly OCR engine for historical texts and student research papers without cloud dependencies.",
    tags: ["WebAssembly", "TypeScript", "ONNX Runtime"],
    team: "BRACU & NSU Student Contributors",
    status: "v1.2 Stable",
    sample: true
  },
  {
    id: "sw-02",
    name: "Suraksha-Mesh Monitor",
    description: "Serial and LoRa packet visualizer displaying real-time river stage telemetry, battery health, and rainfall gradient alerts.",
    tags: ["Rust", "WebSerial", "Chart.js"],
    team: "SUST EEE Open Hardware Circle",
    status: "Active Deployment",
    sample: true
  },
  {
    id: "sw-03",
    name: "VectorKinematics Sim",
    description: "Interactive physics simulator modeling planar rigid body collisions and harmonic oscillators for classroom science lessons.",
    tags: ["Canvas API", "Vanilla JS", "Zero-Deps"],
    team: "Notre Dame College Science Club",
    status: "Public Beta",
    sample: true
  },
  {
    id: "sw-04",
    name: "BibSync Citation CLI",
    description: "Lightweight toolchain for student researchers to format, validate, and auto-export IEEE and APA bibliographies in BibTeX format.",
    tags: ["Node.js", "CLI", "BibTeX"],
    team: "Iteration Lab Core Tooling",
    status: "v0.9 Release",
    sample: true
  },
  {
    id: "sw-05",
    name: "OpenPolder GIS Analyzer",
    description: "Geospatial vector mapping tool highlighting coastal embankment breach risks using public elevation and rainfall data.",
    tags: ["GeoJSON", "Leaflet", "Python"],
    team: "Coastal Resilience Student Team",
    status: "Experimental",
    sample: true
  },
  {
    id: "sw-06",
    name: "TransitSignal Headway Modeler",
    description: "Micro-simulation browser interface analyzing passenger delay reductions under dynamic transit signal prioritization.",
    tags: ["Web Workers", "SVG", "TypeScript"],
    team: "Civic Transit Working Group",
    status: "Prototype v0.4",
    sample: true
  },
  {
    id: "sw-07",
    name: "AcousticLab Spectrum Scope",
    description: "Real-time FFT audio spectrum analyzer capturing classroom acoustic resonance experiments via standard browser microphones.",
    tags: ["Web Audio API", "DSP", "HTML5"],
    team: "Student Physics Guild",
    status: "Maintained",
    sample: true
  },
  {
    id: "sw-08",
    name: "PeerReview Rubric Engine",
    description: "Double-blind peer evaluation matrix assisting student journal editors with constructive feedback scoring and revisions.",
    tags: ["IndexedDB", "PWA", "Tailwind"],
    team: "Editorial Advisory Desk",
    status: "v1.0 Production",
    sample: true
  }
];

export const COLLEGE_PARTNERS = [
  {
    id: "part-01",
    name: "Engineering & Technology University Lab Circle",
    location: "Dhaka Academic Hub",
    description: "Joint pilot program hosting undergraduate research journal archives and hardware prototyping workshops.",
    status: "Confirmed partner",
    sample: true
  },
  {
    id: "part-02",
    name: "Science & Technology Student Research Wing",
    location: "Sylhet Regional Cluster",
    description: "Collaborative environmental telemetry and haor flood research trials with student engineering teams.",
    status: "Confirmed partner",
    sample: true
  },
  {
    id: "part-03",
    name: "Metropolitan College Science Fair Consortium",
    location: "Motijheel Education Precinct",
    description: "Mentoring secondary and higher-secondary students in scientific inquiry and paper preparation.",
    status: "Confirmed partner",
    sample: true
  },
  {
    id: "part-04",
    name: "Northern Polytechnic Innovation Hub",
    location: "Rajshahi Technical Zone",
    description: "Developing open-hardware agriculture robotics testing benches and student firmware libraries.",
    status: "Prospective collaborator",
    sample: true
  },
  {
    id: "part-05",
    name: "Maritime & Coastal Studies Student Guild",
    location: "Chittagong Port Cluster",
    description: "Exploring tidal surge simulation datasets and eco-embankment student field papers.",
    status: "Prospective collaborator",
    sample: true
  }
];

export const TOP_LEADERS = {
  founder: {
    cid: "founder",
    name: "Ikramul Hoque",
    title: "FOUNDER & Chief-DEVELOPER",
    photo: "/leaders/img/Arik.webp",
    photo480: "",
    p_link: "/profile/S/ikramulhoquearik",
    portfolioUrl: "https://ikramulhoque-arik.github.io",
    whatsappUrl: "https://wa.me/TheIterationLab",
    bio: "Guiding the architectural vision, open research systems, and student publishing infrastructure of The Iteration Lab. Leading initiatives to make scientific methodology and software engineering accessible to youth.",
    responsibilities: [
      "Platform Architecture & Software Engineering Systems",
      "Open Research Governance & Editorial Standards",
      "Student Academic Publishing Programs & Institutional Alliances"
    ],
    links: [
      { label: "Portfolio", url: "https://ikramulhoque-arik.github.io" },
      { label: "WhatsApp", url: "https://wa.me/TheIterationLab" }
    ]
  },
  // 6 stationary leadership cards (3x2 grid)
  leaders: [
    { id: "lead-01", name: "Sample Leader 01", position: "Research & Peer-Review Lead", responsibility: "Overseeing peer-review cycles and student submission ethics.", sample: true },
    { id: "lead-02", name: "Sample Leader 02", position: "Technical Systems Architect", responsibility: "Maintaining reproducible testing benches and open toolchains.", sample: true },
    { id: "lead-03", name: "Sample Leader 03", position: "Academic Partnerships Director", responsibility: "Liaising with colleges, secondary institutions, and clubs.", sample: true },
    { id: "lead-04", name: "Sample Leader 04", position: "Editorial & Publications", responsibility: "Curating student journal editions and pedagogical formatting.", sample: true },
    { id: "lead-05", name: "Sample Leader 05", position: "Community & Student Engagement", responsibility: "Organizing student workshops, open demo days, and hackathons.", sample: true },
    { id: "lead-06", name: "Sample Leader 06", position: "Open Source Tooling Curator", responsibility: "Reviewing student code repositories, licenses, and documentation.", sample: true }
  ]
};

export const TEACHER_PROFILES = [
  {
    id: "teacher-01",
    name: "Dr. Shahriar Rahman",
    designation: "Associate Professor",
    institution: "Dept. of Computer Science & Engineering",
    expertise: "Applied Natural Language Processing, Machine Learning & Algorithms",
    sample: true
  },
  {
    id: "teacher-02",
    name: "Prof. Anwara Begum",
    designation: "Head of Physics",
    institution: "Metropolitan Higher Secondary College",
    expertise: "Electromagnetism, Kinematics & Secondary Science Pedagogy",
    sample: true
  },
  {
    id: "teacher-03",
    name: "Engr. Rakibul Alam",
    designation: "Senior Research Fellow",
    institution: "Water Resources & Environmental Division",
    expertise: "Hydrological Modeling, IoT Telemetry & Estuarine Erosion",
    sample: true
  },
  {
    id: "teacher-04",
    name: "Farhana Yasmin",
    designation: "Lecturer in Mathematics",
    institution: "Regional Model Science College",
    expertise: "Discrete Combinatorics, Graph Theory & Olympiad Mentorship",
    sample: true
  },
  {
    id: "teacher-05",
    name: "Dr. Monirul Islam",
    designation: "Professor of Chemistry",
    institution: "Faculty of Science & Chemical Engineering",
    expertise: "Water Desalination, Polymer Cohesion & Green Catalysts",
    sample: true
  }
];

export const STUDENT_PROFILES = [
  {
    id: "stud-01",
    name: "Tanvir Hossain",
    affiliation: "Undergraduate Cohort '20",
    interests: "Bangla NLP, Low-Resource Transformers, Open Datasets",
    featuredWork: "Dialectal Phonetic Alignment Benchmark",
    sample: true
  },
  {
    id: "stud-02",
    name: "Farzana Akter Rini",
    affiliation: "Linguistics & Computing Circle",
    interests: "Phonetic Normalization, Sociolinguistics",
    featuredWork: "Shonglap-45K Dialectal Corpus",
    sample: true
  },
  {
    id: "stud-03",
    name: "Mahmudul Hasan Shuvo",
    affiliation: "Electrical Engineering '21",
    interests: "IoT Hardware, Microcontroller Firmware, LoRaWAN",
    featuredWork: "Suraksha-Jol Flood Telemetry Buoy",
    sample: true
  },
  {
    id: "stud-04",
    name: "Sadia Tabassum",
    affiliation: "Software Engineering '21",
    interests: "Embedded Systems, Sensor Mesh Networks",
    featuredWork: "Suraksha-Mesh Real-Time Monitor",
    sample: true
  },
  {
    id: "stud-05",
    name: "Abrar Zahin",
    affiliation: "Higher Secondary Science (HSC '25)",
    interests: "Topological Graph Theory, Planar Routing",
    featuredWork: "Extremal Graph Bounds for Micro-Grids",
    sample: true
  },
  {
    id: "stud-06",
    name: "Zareen Subah",
    affiliation: "Higher Secondary Physics Club",
    interests: "Applied Mathematics, Photogrammetry",
    featuredWork: "Old Dhaka Alley Cable Topology Study",
    sample: true
  },
  {
    id: "stud-07",
    name: "Saifur Rahman Chowdhury",
    affiliation: "Computer Science '21",
    interests: "Computer Vision, OCR, WebAssembly",
    featuredWork: "BanglaLipi-OCR In-Browser Engine",
    sample: true
  },
  {
    id: "stud-08",
    name: "Cadet Tazwar Karim",
    affiliation: "Cadet College Natural Sciences",
    interests: "Coastal Soil Mechanics, Bio-Engineering",
    featuredWork: "Tensile Analysis of Vetiver Roots",
    sample: true
  },
  {
    id: "stud-09",
    name: "Nayeem Abdullah",
    affiliation: "Transportation Engineering '21",
    interests: "SUMO Traffic Simulation, Civic Technology",
    featuredWork: "Mirpur-Farmgate Bus Priority Signals",
    sample: true
  },
  {
    id: "stud-10",
    name: "Tasnim Jahan",
    affiliation: "Computer Science '22",
    interests: "Speech Processing, Acoustic Modeling",
    featuredWork: "Regional Accent Speech Dataset",
    sample: true
  }
];

export const LAB_EVENTS = {
  upcoming: [
    {
      id: "ev-up-1",
      date: "Nov 14, 2026",
      title: "From Classroom Inquiry to Published Research",
      category: "Research Workshop",
      format: "Virtual Lab & Open Stream",
      description: "An intensive session guiding secondary and college students on drafting reproducible hypotheses and peer review.",
      sample: true
    },
    {
      id: "ev-up-2",
      date: "Nov 28, 2026",
      title: "Open Hardware Telemetry & Microcontrollers Demo",
      category: "Software & Hardware Demo",
      format: "Hybrid Laboratory Hall",
      description: "Hands-on walkthrough of low-power LoRa buoys and WebSerial sensor visualizers built by student teams.",
      sample: true
    },
    {
      id: "ev-up-3",
      date: "Dec 12, 2026",
      title: "National Student Research Journal Volume 02 Launch",
      category: "Publication Launch",
      format: "Main Auditorium & Webcast",
      description: "Celebrating newly accepted peer-reviewed student investigations in linguistics, mathematics, and climate resilience.",
      sample: true
    }
  ],
  past: [
    {
      id: "ev-past-1",
      date: "Sep 18, 2026",
      title: "Teacher-Student Evaluative Roundtable: Responsible Mentorship",
      category: "Teacher-Student Discussion",
      format: "Recorded Discussion Circle",
      description: "Educators and student builders exploring pedagogical growth metrics and constructive feedback loops.",
      sample: true
    },
    {
      id: "ev-past-2",
      date: "Aug 05, 2026",
      title: "Open-Source WebAssembly Tooling Workshop",
      category: "Student Presentation",
      format: "Interactive Code Session",
      description: "Demonstration of in-browser OCR, physics canvas visualizers, and zero-cloud student utilities.",
      sample: true
    }
  ]
};

export const POLICIES = [
  {
    id: "pol-01",
    title: "Editorial Standards",
    summary: "Clear criteria for pedagogical clarity, respectful academic language, and constructive presentation of student works.",
    status: "Draft Standards"
  },
  {
    id: "pol-02",
    title: "Research Integrity",
    summary: "Mandatory honest reporting of methodologies, preservation of raw observations, and transparent documentation of negative results.",
    status: "Draft Standards"
  },
  {
    id: "pol-03",
    title: "Publication and Review Processes",
    summary: "Double-blind peer evaluation cycles assisted by verified academic mentors with author revision milestones.",
    status: "Draft Standards"
  },
  {
    id: "pol-04",
    title: "Authorship and Attribution",
    summary: "Rigorous standards ensuring all student investigators, faculty advisors, and collaborative toolchains receive clear credit.",
    status: "Draft Standards"
  },
  {
    id: "pol-05",
    title: "Corrections and Retractions",
    summary: "Transparent errata workflows allowing authors to update published calculations or acknowledge measurement refinements.",
    status: "Draft Standards"
  },
  {
    id: "pol-06",
    title: "Teacher Evaluation Methodology",
    summary: "Context-grounded, responsible educational feedback mechanisms preventing arbitrary or uncalibrated public scoring.",
    status: "Draft Standards"
  },
  {
    id: "pol-07",
    title: "Student Safety and Privacy",
    summary: "Strict prohibition against displaying student phone numbers, physical addresses, familial details, or private IDs.",
    status: "Draft Standards"
  },
  {
    id: "pol-08",
    title: "Data Collection and Usage",
    summary: "Zero commercial trackers, zero advertising cookies, and minimal technical telemetry required solely for platform operation.",
    status: "Draft Standards"
  },
  {
    id: "pol-09",
    title: "Copyright and Permissions",
    summary: "Student creators retain ownership of their intellectual works under permissive open-access Creative Commons licenses.",
    status: "Draft Standards"
  },
  {
    id: "pol-10",
    title: "Community Guidelines",
    summary: "Mutual respect, scientific curiosity, constructive peer feedback, and zero tolerance for harassment or bad-faith claims.",
    status: "Draft Standards"
  }
];
