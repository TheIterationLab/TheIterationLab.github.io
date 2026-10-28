-- ============================================================================
-- The Iteration Lab: Founder profile seed v2 (Ikramul Hoque)
-- Run in: Supabase Dashboard > SQL Editor, after profile_portfolio_migration_v2.sql
--
-- Covers: profile fields + GPAs, education, experience, skills cards,
-- co-curricular card. Researches and software are NOT here (they live in the
-- public.researches and public.software tables, added in a separate step).
--
-- Safe to run again: it REPLACES your CV entries and cards each time.
-- Not touched: name, photo, type, verified.
-- ============================================================================

DO $$
DECLARE
  v_cid uuid := 'a370517e-ec1a-4257-9677-9293f6bd8d6b';
BEGIN
  -- ------------------------------------------------------------------------
  -- 1. Profile fields (including real SSC / HSC results)
  -- ------------------------------------------------------------------------
  UPDATE public.profiles SET
    slug                 = 'ikramul-hoque',
    profession           = 'Student · Researcher · Founder',
    institution_override = 'Founder & Chief of Governance and Development · The Iteration Lab',
    q1                   = 'Turn Insight Into Impact',
    research_interests   = 'Guiding the governance, architectural vision, open research systems, and student publishing infrastructure of The Iteration Lab. Leading initiatives to make scientific methodology and software engineering accessible to youth.',
    hero_button          = 1,
    whatsapp             = '+8801890803091',
    public_email         = 'coordination@iterationlab.org',
    location             = 'Bangladesh · Open Educational Research Network',
    statement_kicker     = 'ARCHITECTURAL VISION',
    q2                   = '“When students are trusted with real research infrastructure and transparent peer review, classrooms transform into engines of discovery.”',
    bio                  = 'Designing full-stack open academic archives, institutional verification workflows, and collaborative software registries connecting secondary schools, colleges, and mentors nationwide.',
    ssc_gpa              = 5.00,
    ssc_sub              = 'Science · Chittagong Ideal High School',
    hsc_gpa              = 4.00,
    hsc_sub              = 'Science · Gachbaria Govt College',
    ug_cgpa              = 0.00,
    ug_sub               = NULL,
    grad_cgpa            = 0.00,
    grad_sub             = NULL
  WHERE cid = v_cid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No row in public.profiles for that UUID.';
  END IF;

  -- ------------------------------------------------------------------------
  -- 2. CV timelines (newest first)
  -- ------------------------------------------------------------------------
  DELETE FROM public.profile_cv_entries WHERE cid = v_cid;

  INSERT INTO public.profile_cv_entries
    (cid, entry_type, sort_order, period, core_title, organization_name, detail)
  VALUES
    -- Education
    (v_cid, 'education', 0, '2026 — Present',
     'Independent Study in Computing, Engineering & AI',
     'Self-Directed · Bangladesh',
     'CS50x, MATLAB Onramp, Python, C and database systems, now moving into artificial intelligence and machine learning, alongside open research and software projects.'),
    (v_cid, 'education', 1, 'Jul — Oct 2026',
     'Intensive CNC Machining Course (4 months)',
     'Bangladesh-Korea Technical Training Centre (BKTTC), Chattogram',
     'Four-month intensive course in Fanuc lathe and milling programming, machine setup, work offsets and troubleshooting, with self-directed projects beyond the standard competencies.'),
    (v_cid, 'education', 2, '2025',
     'Higher Secondary Certificate (HSC) in Science',
     'Gachbaria Govt College (GGCC) · GPA 4.00',
     'Science group. Studied alongside self-taught programming and web development.'),
    (v_cid, 'education', 3, '2023',
     'Secondary School Certificate (SSC) in Science',
     'Chittagong Ideal High School (CIHS) · GPA 5.00',
     'Foundation in physics, mathematics, algorithmic systems, and experimental science communication.'),

    -- Experience
    (v_cid, 'experience', 0, '2025 — Present',
     'Founder, Developer & Chief of Governance',
     'The Iteration Lab',
     'Leading platform governance and development: database security design, student academic publishing programs, and institutional college partnerships across Bangladesh.'),
    (v_cid, 'experience', 1, 'Present',
     'Co-founder & Math Lecturer / Coach',
     'KFTH Coaching Center, Budpura, Patiya, Chattogram',
     'Co-founded a local coaching center and lead mathematics classes as lecturer and coach.'),
    (v_cid, 'experience', 2, '2025 — Jun 2026',
     'Computer Assistant',
     'Office of a People''s Prosecutor, Chattogram District Court',
     'Reviewed client documents, prepared legal paperwork, summarized case files and submitted online applications.'),
    (v_cid, 'experience', 3, 'Seasonal',
     'Clothing Business: Sourcing & Accounts',
     'Family Eid Clothing Business',
     'Sourced stock from a wholesale store and kept the accounts and cash records, running the business with his mother during Ramadan alongside a full-time job.'),
    (v_cid, 'experience', 4, 'Part-time',
     'Private Tutor',
     'Independent',
     'Teaches school students privately.');

  -- ------------------------------------------------------------------------
  -- 3. Stacked cards: Skills and Co-curriculars
  -- ------------------------------------------------------------------------
  DELETE FROM public.profile_custom_cards WHERE cid = v_cid;

  INSERT INTO public.profile_custom_cards
    (cid, deck_type, sort_order, spine_label, category, meta_badge, title, subtitle, description, footer_meta, link_label, link_url)
  VALUES
    (v_cid, 'skills', 0, 'Founder', 'SYSTEMS ENGINEERING',
     'PostgreSQL · Supabase RLS · JavaScript · Static Edge',
     'Founder, Developer & Chief of Governance',
     'The Iteration Lab: Architecture, Security & Governance',
     'Designed and built the platform: fine-grained Row-Level Security, multi-tier identity verification across institutions, faculty mentors and student authors, and a lightweight static frontend, while safeguarding minor privacy.',
     'Production Infrastructure · Governance Framework v2026',
     'External Portfolio ↗', 'https://ikramulhoque-arik.github.io'),
    (v_cid, 'skills', 1, 'CNC Machinist', 'MACHINING',
     'Fanuc 0i Mate Lathe · Optimill M.2 Milling',
     'CNC Machinist (Lathe & Milling)',
     'Fanuc G-code Programming, Setup & Troubleshooting',
     'Programs, sets up and debugs CNC lathes and milling machines in Fanuc G-code, including G71/G70 cycles, work offsets, tool compensation and alarm diagnosis. Completed a four-month intensive course at BKTTC.',
     'BKTTC · 2026',
     NULL, NULL),
    (v_cid, 'skills', 2, 'CS50x', 'COMPUTER SCIENCE',
     'Harvard CS50x · 2026',
     'CS50x: Introduction to Computer Science',
     'Harvard University online course',
     'Took CS50x in 2026 as a foundation course, building on earlier C, Python and database knowledge.',
     'Self-paced · 2026',
     NULL, NULL),
    (v_cid, 'skills', 3, 'CAD & CAM', 'DESIGN & MANUFACTURING',
     'SolidWorks · Mastercam',
     'CAD & CAM',
     'From 3D model to machined part',
     'Models mechanical parts and prepares them for machining, working with SolidWorks for CAD and Mastercam for CAM, and has also explored Blender.',
     'Self-taught · BKTTC',
     NULL, NULL),
    (v_cid, 'skills', 4, 'MATLAB', 'COMPUTATION',
     'MATLAB Onramp · 2025',
     'MATLAB',
     'Numerical computing & visualization',
     'Learned MATLAB in October 2025 and completed MATLAB Onramp, building a base for engineering computation and data visualization.',
     'Self-taught · 2025',
     NULL, NULL),
    (v_cid, 'skills', 5, 'Onshape', 'CAD',
     'Onshape · Mobile + Web · Since Feb 2026',
     'Onshape',
     'Parametric 3D modeling',
     'Learned Onshape from February 2026 entirely on a phone, through its mobile app and self-paced courses. Modeled internal threads and designed replacement plastic parts that were 3D printed and fit.',
     'Self-taught · 2026',
     NULL, NULL),
    (v_cid, 'skills', 6, 'Kaggle', 'DATA SCIENCE & ML',
     'Kaggle · Data Science & Machine Learning',
     'Kaggle',
     'Data science and machine learning practice',
     'Practices data science and machine learning on Kaggle while learning artificial intelligence and machine learning.',
     'Ongoing learning',
     NULL, NULL),

    (v_cid, 'cocurriculars', 0, 'Alliances', 'NATIONAL STUDENT NETWORK',
     '2025 — Present · Inter-College Coordination',
     'Collegiate Research Chapters & Open Software Guilds',
     'Mentorship & Community Stewardship',
     'Building collaborative bridges between science clubs, faculty advisors, and independent student builders across Bangladesh.',
     'Open Network Stewardship',
     NULL, NULL);
END $$;

-- Check (run separately):
-- select ssc_gpa, hsc_gpa, ssc_sub, hsc_sub from public.profiles
--  where cid = 'a370517e-ec1a-4257-9677-9293f6bd8d6b';
-- select entry_type, sort_order, core_title from public.profile_cv_entries
--  where cid = 'a370517e-ec1a-4257-9677-9293f6bd8d6b' order by entry_type, sort_order;
-- select deck_type, sort_order, title from public.profile_custom_cards
--  where cid = 'a370517e-ec1a-4257-9677-9293f6bd8d6b' order by deck_type, sort_order;
