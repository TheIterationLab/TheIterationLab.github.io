# Complete Section-by-Section Database Analysis: `/profile/index.html` & `/assets/js/profile.js`

This document provides a complete, section-by-section database architecture and column specification for the common Academic Portfolio & Researcher Profile page (**Students (`S`)**, **Teachers (`T`)**, and **Independent Publishers (`R`)**) implemented in `/profile/index.html` and `/assets/js/profile.js`.

It aligns every DOM element, `data-editable` path, role fallback (`ROLE_DEFAULTS`), null/zero visibility rule, image path convention (`IMAGE_DIRS`), and interactive state in the frontend with **The Iteration Lab's existing Supabase schema** (`profiles`, `students`, `teachers`, `institutes`, `researches`, `software`).

---

## 1. Identity, Routing & Ownership Architecture (Global Page Context)

Before rendering individual sections, `/assets/js/profile.js` resolves **who** is being viewed (`cid` / `accountType`) and **whether the current browser viewer owns that account** (`state.isAccountOwner`).

### 1.1 URL Query Routing (`resolveInitialProfileKeyFromUrl()`)
| URL Parameter | Current Behavior in `profile.js` | Live Supabase Production Query Target |
| :--- | :--- | :--- |
| `?cid=<uuid>` (or `?id=<uuid>`) | Matches `sample-*` or `founder-*` keys in demo mode | Primary lookup: `profiles?cid=eq.<uuid>` + role join (`students` / `teachers`) |
| `/profile/<TYPE>/<slug>` or `?profile=<slug>` | Matches founder/sample slug (e.g., `/profile/S/ikramulhoquearik`) | Optional `username` / `slug` column on `public.profiles` (`UNIQUE`) |
| `?type=S\|T\|R` | Selects sample persona (`student`, `teacher`, `publisher`) | Fallback role hint when rendering default copy if `account_type` is not yet cached |
| `?visitor=1` | Forces `simulateOwnerInDemo = false` | Forces read-only User View even for the logged-in owner (preview-as-visitor) |

### 1.2 Account Types & Role Fallbacks (`ROLE_DEFAULTS`)
 Every profile resolves an `account_type` code that selects curated default copy whenever an optional text column is `NULL` or cleared by the user:
- `'S'` — **Student · Researcher** (also used by Founder profile; linked to `public.students` + `eiin`)
- `'T'` — **Teacher · Academic Mentor** (linked to `public.teachers` + `eiin`)
- `'R'` — **Independent Publisher** (standalone researcher/reader; no `eiin` required, custom `institution` label allowed)

### 1.3 Supabase Auth Session & Edit Mode Gate (`detectSupabaseSessionUserId()`)
- **Frontend Check**: Inspects `localStorage['sb-<project-ref>-auth-token']` (`user.id`) or cookie `sb-access-token` (JWT `sub`).
- **Ownership Rule**: `isAccountOwner = Boolean(supabaseUserId && supabaseUserId === profile.cid)`.
- **UI Gate**:
  - `#profile-eye-btn` (Header Eye button) is `hidden` unless `isAccountOwner === true`.
  - Toggling `state.isEditMode = true` unlocks: `#prof-edit-ribbon`, `#prof-cta-switch-btn`, `#prof-photo-edit-btn`, `#education-add-btn`, `#experiences-add-btn`, timeline/card delete buttons (`items.length > 1`), the trailing `+ Add another...` card in all 4 stacked decks, hidden `0`-value GPA slots, and double-click `contenteditable` on `[data-editable]` nodes.
- **Database Enforcement**: Never rely on hiding `#profile-eye-btn` alone. Enforce Supabase **Row-Level Security (RLS)** with `USING (auth.uid() = cid)` and `WITH CHECK (auth.uid() = cid)` on all `UPDATE` / `INSERT` / `DELETE` policies.

### 1.4 Core Identity Columns (`public.profiles` + `students` / `teachers`)
| JS State Path | Recommended DB Column | Table | PostgreSQL Type | Nullable / Default | Constraints & Limits | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `profile.cid` | `cid` | `profiles` | `uuid` | `NOT NULL` PK | References `auth.users(id) ON DELETE CASCADE` | Already exists in `profiles` |
| `profile.slug` *(optional)* | `slug` | `profiles` | `varchar(64)` | `NULL` | `UNIQUE`, lowercase `[a-z0-9-_]+` | Supports clean URLs like `/profile/S/ikramulhoquearik` |
| `profile.accountType` | `account_type` | `profiles` | `char(1)` | `NOT NULL DEFAULT 'S'` | `CHECK (account_type IN ('S', 'T', 'R'))` | Drives `ROLE_DEFAULTS[accountType]` |
| `profile.eiin` | `eiin` | `students` / `teachers` | `varchar(12)` | `NULL` | Foreign/logical match to `institutes.eiin` | Already exists on `students` and `teachers` |

---

## 2. Section-by-Section DOM, JS State & Database Mapping

### Section 1 — Sticky Top Header, Navigation Drawer & Edit Mode Ribbon
- **DOM Containers**: `header.prof-header`, `#prof-drawer`, `#prof-edit-ribbon`, `#profile-eye-btn`, `#prof-edit-reset-btn`, `#prof-edit-done-btn`
- **JS Functions**: `syncEditModeUI()`, `persistCurrentProfile()`
- **Database Impact**:
  - **No dedicated content columns** belong exclusively to the header.
  - `#prof-edit-done-btn` exits edit mode; in live Supabase mode, inline edits either auto-save on `blur` (`commitEditableElement`) via `PATCH /rest/v1/profiles?cid=eq.<cid>` or batch-save when clicking **Done Editing**.
  - `#prof-edit-reset-btn` currently resets `localStorage` draft (`til_portfolio_draft_v1_<key>`); in live Supabase mode, repurpose this button as **"Discard Unsaved Changes"** (re-fetching from Supabase) rather than wiping database rows.

---

### Section 2 — Hero Split Section, Portrait Frame & Floating "Recent Researches" Card
- **DOM Containers**: `section.prof-hero`, `#prof-role-kicker`, `#prof-user-name`, `#prof-user-inst`, `#prof-hero-headline`, `#prof-hero-lead`, `#prof-primary-cta`, `#prof-cta-switch-btn`, `#prof-whatsapp-cta`, `#prof-portrait-frame`, `#prof-recent-card`
- **JS Functions**: `renderHeroSection()`, `renderRecentResearchesCard()`, `startRecentAutoScroll()`

#### 2A. Hero Left Column & Action Bar Columns (on `public.profiles`)
| DOM Element ID | `data-editable` Path | Recommended DB Column | PostgreSQL Type | Nullable / Default | Limits & Validation | Frontend Behavior & Fallbacks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `#prof-role-kicker` | `roleKicker` | `profession` *(or `role_kicker`)* | `varchar(80)` | `NULL` | Max `80` chars, single-line (`data-single-line="true"`) | If `NULL`/empty, falls back to `ROLE_DEFAULTS`: `'Student · Researcher'` (`S`), `'Teacher · Academic Mentor'` (`T`), `'Independent Publisher'` (`R`). |
| `#prof-user-name` | `name` | `name` *(exists)* | `varchar(120)` | `NOT NULL` | `2–120` chars, single-line | Already in `public.profiles`. Also used to compute 2-letter portrait fallback initials (`getInitials(name)`). |
| `#prof-user-inst` | `institution` | `institution_override` *(+ resolved `eiin`)* | `varchar(160)` | `NULL` | Max `160` chars, single-line | For `S`/`T`, resolve default via `eiin` → `institutes -> profiles(name)` (same as `directory.js`), allowing optional override or custom affiliation for `R` (Independent Publisher). |
| `#prof-hero-headline` | `headline` | `q1` *(or `hero_headline`)* | `varchar(140)` | `NULL` | Max `140` chars, multi-line (`\n` preserved, max 3 lines recommended) | User's primary hero motto. If `NULL`/empty, restores role default (e.g. `"Turn Insight\nInto Victory"` for `S`). |
| `#prof-hero-lead` | `lead` | `research_interests` *(or `hero_lead`)* | `varchar(500)` | `NULL` | Max `500` chars | Short research focus / platform summary below `h1`. Restores `ROLE_DEFAULTS[type].lead` when `NULL`. |
| `#prof-primary-cta` + `#prof-cta-switch-btn` | *(button toggle)* | `hero_button` *(or `primary_cta`)* | `smallint` *(or `boolean`)* | `NOT NULL DEFAULT 1` | `CHECK (hero_button IN (0, 1))` | `1` = `'researches'` (scrolls to `#researches-section`, label `"Researches"`), `0` = `'softwares'` (scrolls to `#softwares-section`, label `"Software"`). Toggled in Edit Mode via `#prof-cta-switch-btn`. |
| `#prof-whatsapp-cta` | *(synced with Contact `whatsapp`)* | `whatsapp` | `varchar(24)` | `NULL` | Digits + optional `+`, `7–15` digits after stripping non-digits (`normalizeOwnerWhatsAppTarget`) | **Shared with Section 10**. If `NULL`, `""`, or `"0"`, `#prof-whatsapp-cta` is completely hidden (`waBtn.hidden = true`). Otherwise links to `https://wa.me/<digits>`. |

#### 2B. Hero Portrait Frame (`#prof-portrait-frame`)
| DOM Element ID | JS Property | Recommended DB Column | PostgreSQL Type | Nullable / Default | Storage & Path Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `#prof-portrait-img` / `#prof-portrait-fallback` | `profile.photo` | `photo` *(exists in `profiles`)* | `varchar(255)` | `NULL` | Per platform convention (`IMAGE_DIRS`), store **filename only** (e.g. `Arik.webp` resolved against `/students/img/` or `/teachers/img/`) **OR** a Supabase Storage path/public URL (e.g. `avatars/<cid>.webp`, max `2 MB`, `image/webp` or `image/jpeg`). Do **not** store base64 `FileReader` data URLs in PostgreSQL `text` columns in production—upload via `supabase.storage.from('avatars').upload(...)` and save the filename/URL in `profiles.photo`. If `NULL` or `onerror`, `#prof-portrait-initials` renders 2-letter initials. |

#### 2C. Floating Orange "Recent Researches" Card (`#prof-recent-card`)
- **DOM Elements**: `#prof-recent-prev`, `#prof-recent-next`, `#prof-recent-slide`
- **Database Rule**: **Zero extra columns needed.** `renderRecentResearchesCard()` reads directly from `profile.researches[]` (Section 7):
  - Thumbnail: `item.image` (`researches.cover_url`, resolved with `/researches/img/` if filename-only), falling back to `` `${item.ilrid} · ${item.category}` ``.
  - Title: `item.title` (`researches.title`).
  - Counter & Category: `01 / 0N · ${item.category}`.
  - `Inspect ↗` button opens `#prof-reader-modal` with that research entry.
  - If `profile.researches` has `0` rows, displays `"No published research entries yet."`.

---

### Section 3 — Obsidian Architectural Vision Band & Dynamic GPA / Metrics Strip
- **DOM Containers**: `section.prof-obsidian-band`, `#prof-statement-kicker`, `#prof-quote-text`, `#prof-description-text`, `#prof-metrics-row`
- **JS Function**: `renderObsidianBand()`

#### 3A. Architectural Statement Columns (on `public.profiles`)
| DOM Element ID | `data-editable` Path | Recommended DB Column | PostgreSQL Type | Nullable / Default | Limits & Validation | Frontend Behavior & Fallbacks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `#prof-statement-kicker` | `statementKicker` | `statement_kicker` | `varchar(60)` | `NULL` | Max `60` chars, single-line | Uppercase orange eyebrow label. Defaults to `'RESEARCH PHILOSOPHY'` (`S`), `'MENTORSHIP & PEDAGOGY'` (`T`), `'EDITORIAL MANIFESTO'` (`R`). |
| `#prof-quote-text` | `quote` | `q2` *(or `vision_quote`)* | `varchar(260)` | `NULL` | Max `260` chars | Large serif centerpiece quote in the dark obsidian band. Falls back to `ROLE_DEFAULTS[type].quote` when `NULL`. |
| `#prof-description-text` | `description` | `bio` *(or `vision_description`)* | `varchar(800)` | `NULL` | Max `800` chars | Supporting paragraph under `q2`. Falls back to `ROLE_DEFAULTS[type].description` when `NULL`. |

#### 3B. Dynamic Academic GPA & Research Metrics Strip (`profile.gpas.*` on `public.profiles`)
**Critical Dynamic Layout Rule (`isPositiveGpa`)**:
- In **User View**, any GPA metric (`ssc`, `hsc`, `ug`, `grad`) whose numeric value is `NULL` or `<= 0` is **filtered out** of `visibleDefs`. CSS custom property `--metric-cols` is set to `visibleDefs.length` (`1` to `5`), stretching the remaining columns across 100% width with **zero blank gaps**.
- In **Edit Mode**, all 5 metric slots remain visible so the owner can double-click a `0.00` GPA (`'Hidden (0) · Double-click GPA to show'`) to populate it, or type `0` to hide it again.

| Metric Key in `profile.js` | `data-editable` Paths | Recommended DB Columns | PostgreSQL Type | Nullable / Default | Scale & Range Check | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `gpas.ssc` + `gpas.sscSub` | `gpas.ssc`, `gpas.sscSub` | `ssc_gpa`, `ssc_sub` | `numeric(3,2)`, `varchar(60)` | `DEFAULT 0.00`, `NULL` | `CHECK (ssc_gpa IS NULL OR (ssc_gpa >= 0 AND ssc_gpa <= 5.00))` | Displayed with `/ 5.00` scale. Default subtitle: `'Secondary Examination'`. Hidden in User View if `NULL` or `0`. |
| `gpas.hsc` + `gpas.hscSub` | `gpas.hsc`, `gpas.hscSub` | `hsc_gpa`, `hsc_sub` | `numeric(3,2)`, `varchar(60)` | `DEFAULT 0.00`, `NULL` | `CHECK (hsc_gpa IS NULL OR (hsc_gpa >= 0 AND hsc_gpa <= 5.00))` | Displayed with `/ 5.00` scale. Default subtitle: `'Higher Secondary'`. Hidden in User View if `NULL` or `0`. |
| `gpas.ug` + `gpas.ugSub` | `gpas.ug`, `gpas.ugSub` | `ug_cgpa`, `ug_sub` | `numeric(3,2)`, `varchar(60)` | `DEFAULT 0.00`, `NULL` | `CHECK (ug_cgpa IS NULL OR (ug_cgpa >= 0 AND ug_cgpa <= 4.00))` *(use `<= 5.00` if international 5-pt scales exist)* | Displayed with `/ 4.00` scale. Default subtitle: `'Undergraduate CGPA'`. Hidden if `NULL` or `0`. |
| `gpas.grad` + `gpas.gradSub` | `gpas.grad`, `gpas.gradSub` | `grad_cgpa`, `grad_sub` | `numeric(3,2)`, `varchar(60)` | `DEFAULT 0.00`, `NULL` | `CHECK (grad_cgpa IS NULL OR (grad_cgpa >= 0 AND grad_cgpa <= 4.00))` | Displayed with `/ 4.00` scale. Default subtitle: `'Graduate CGPA'`. Hidden if `NULL` or `0`. |
| `gpas.researchCount` + `gpas.researchSub` | `gpas.researchCount`, `gpas.researchSub` | *(Computed `COUNT(*)`)* + `research_metric_sub` | *(Derived integer)* + `varchar(60)` | `NULL` | `research_metric_sub` max `60` chars | **Always visible (`isGpa: false`)**. In live DB, compute count automatically from `researches` (`String(researches.length).padStart(2, '0')`); only store optional custom subtitle `research_metric_sub` (defaults to `'Published & Indexed'`). |

---

### Section 4 — `01 · Academic Foundation`: Education (CV Timeline)
- **DOM Containers**: `#education-section`, `#edu-cv-list`, `#education-add-btn`
- **JS Function**: `renderCvTimeline('education', 'edu-cv-list')`
- **Cardinality**: `1` to `N` rows per user (recommended max `20` entries per user; delete button appears when `entries.length > 1`).
- **Storage Recommendation**: Dedicated child table `public.profile_educations` (or combined `public.profile_timelines` with `section_type = 'education'`).

| JS Item Property | `data-editable` Path | Recommended DB Column | PostgreSQL Type | Nullable / Default | Limits | Default Template When Clicking `+ Add Education` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | — | `id` | `uuid` | `NOT NULL DEFAULT gen_random_uuid()` | PK | Generated UUID |
| *(parent)* | — | `cid` | `uuid` | `NOT NULL` | FK → `profiles(cid) ON DELETE CASCADE` | Owner `cid` |
| *(order)* | — | `sort_order` | `smallint` | `NOT NULL DEFAULT 0` | `>= 0` | Array index `0, 1, 2...` |
| `period` | `education.${idx}.period` | `period` | `varchar(50)` | `NOT NULL` | Max `50` chars, single-line | `'2024 — Present'` |
| `core` | `education.${idx}.core` | `core_title` | `varchar(160)` | `NOT NULL` | Max `160` chars, single-line (bold degree/qualification) | `'New Degree / Academic Program'` |
| `org` | `education.${idx}.org` | `institution_name` | `varchar(180)` | `NOT NULL` | Max `180` chars, single-line | `'Institution Name · Location'` |
| `detail` | `education.${idx}.detail` | `detail` | `varchar(600)` | `NULL` | Max `600` chars | `'Double-click to describe coursework, thesis topic, academic honors, or GPA highlights.'` |

---

### Section 5 — `02 · Verified Capabilities`: Skills, Badges & Certifications (Horizontal Stacked Deck — No Media Slot)
- **DOM Containers**: `#skills-section`, `#skills-stack-stage`, `#skills-stack-viewport`, `#skills-stack-track`
- **JS Function**: `renderStackedSection(STACK_SECTIONS[0])` (`showMediaSlot: false`)
- **Cardinality**: `0` to `N` cards per user (in Edit Mode, appends a final dashed `.prof-stack-card--add` card `"Add another skill, badge, or certification"`).
- **Note on Existing Schema**: `directory.js` already hints at `profiles.certificates`! Using a normalized table `public.profile_skills_badges` (or `jsonb` in `profiles.certificates`) powers both `/profile/` and directory detail views cleanly.

| JS Card Property | `data-editable` Path | Recommended DB Column | PostgreSQL Type | Nullable / Default | Limits & Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | — | `id` | `uuid` | `NOT NULL DEFAULT gen_random_uuid()` | PK |
| *(parent)* | — | `cid` | `uuid` | `NOT NULL` | FK → `profiles(cid) ON DELETE CASCADE` |
| *(order)* | — | `sort_order` | `smallint` | `NOT NULL DEFAULT 0` | Controls right-to-left horizontal stacking order (`01`, `02`, `03`...) |
| `spine` | *(auto or derived)* | `spine_label` | `varchar(28)` | `NULL` | Max `28` chars; vertical rotated label visible when another card slides over it (can auto-derive from first 2 words of `title` if `NULL`) |
| `category` | `skills.${idx}.category` | `category` | `varchar(60)` | `NOT NULL DEFAULT 'SKILL / CERTIFICATION'` | Max `60` chars, single-line uppercase pill |
| `meta` | `skills.${idx}.meta` | `meta_badge` | `varchar(60)` | `NULL` | Max `60` chars, single-line top-right badge (e.g. `'VERIFIED · 2025'`, `'GOLD BADGE'`) |
| `title` | `skills.${idx}.title` | `title` | `varchar(140)` | `NOT NULL` | Max `140` chars, single-line serif card heading |
| `subtitle` | `skills.${idx}.subtitle` | `subtitle` | `varchar(180)` | `NULL` | Max `180` chars, single-line orange subheading (issuer / toolset) |
| `description` | `skills.${idx}.description` | `description` | `varchar(700)` | `NULL` | Max `700` chars; clamped on card, shown in full inside `#prof-reader-modal` |
| `footerMeta` | `skills.${idx}.footerMeta` | `footer_meta` | `varchar(100)` | `NULL` | Max `100` chars, single-line bottom-left tag (e.g. `'Credential ID · Verified'`) |
| `linkLabel` | — | `link_label` | `varchar(40)` | `DEFAULT 'Verify Credential'` | Button text when `link_url` is a valid `http(s)://` URL |
| `linkUrl` | *(via verify link / modal)* | `link_url` | `varchar(500)` | `NULL` | Must start with `http://` or `https://` (`CHECK (link_url IS NULL OR link_url ~* '^https?://')`); otherwise opens `#prof-reader-modal` |

---

### Section 6 — `03 · Research & Leadership Track`: Experiences (CV Timeline)
- **DOM Containers**: `#experiences-section`, `#exp-cv-list`, `#experiences-add-btn`
- **JS Function**: `renderCvTimeline('experiences', 'exp-cv-list')`
- **Database Schema**: **100% identical column structure to Section 4 (`Education`)**.
  - Either store in `public.profile_experiences` (`id`, `cid`, `sort_order`, `period`, `core_title`, `organization_name`, `detail`) **OR** merge Section 4 and Section 6 into a single table `public.profile_cv_entries` with an enum column `entry_type VARCHAR(16) NOT NULL CHECK (entry_type IN ('education', 'experience'))` (recommended—cuts table & RLS maintenance in half).

---

### Section 7 — `04 · Peer-Reviewed & Open Preprints`: Researches & Journals (Horizontal Stacked Deck WITH Media Slot)
- **DOM Containers**: `#researches-section`, `#researches-stack-stage`, `#researches-stack-viewport`, `#researches-stack-track`
- **JS Function**: `renderStackedSection(STACK_SECTIONS[1])` (`showMediaSlot: true`, `idBadgeKey: 'ilrid'`)
- **Crucial Architectural Insight — DO NOT Duplicate the `public.researches` Table!**
  - Your Supabase database **already has** `public.researches` (`ilrid`, `uid`, `title`, `abstract`, `category`, `keywords`, `paper_url`, `cover_url`, `publish_date`, `likes`, `comments`, `reviewers`, `is_sample`), where `uid` is the author's `profiles.cid` (and co-authors/reviewers can also be referenced).
  - Instead of duplicating research papers in a separate profile table, `/profile/` should **query `public.researches` directly** (`researches?select=ilrid,uid,title,abstract,category,keywords,paper_url,cover_url,publish_date,is_sample&uid=eq.<cid>&order=publish_date.desc.nullslast`)!

#### Mapping Existing `public.researches` Columns → `profile.js` Research Card Fields
| `profile.js` Card Field | Existing `public.researches` Column | Recommended Column Additions on `public.researches` (if not present) | Mapping / Formatting Rule |
| :--- | :--- | :--- | :--- |
| `ilrid` | `ilrid` (`varchar`, PK e.g. `ILR0001`) | *(exists)* | Displayed on media fallback & top-right meta |
| `category` | `category` (`varchar(60)`) | *(exists)* | Uppercase category pill (e.g. `'COMPUTATIONAL RESEARCH'`) |
| `meta` | `ilrid` + `publish_date` | *(derived)* | Format as `` `${ilrid} · ${year}` `` |
| `title` | `title` (`varchar(220)`) | *(exists)* | Card serif heading |
| `subtitle` | `keywords` *(or new `subtitle` / `venue`)* | `venue` `varchar(180) NULL` *(optional)* | Shows journal/preprint venue & co-author line, or joins `keywords` |
| `description` | `abstract` (`text` / `varchar(2000)`) | *(exists)* | Clamped to 3 lines on card; full abstract shown in `#prof-reader-modal` |
| `image` | `cover_url` (`varchar(255)`) | *(exists)* | Resolved via `/researches/img/<cover_url>` if filename-only, or full `https://` URL |
| `footerMeta` | `keywords` / `likes` | *(derived)* | E.g. first 2 keywords or `'Open Access · Peer Reviewed'` |
| `linkUrl` | `paper_url` (`varchar(500)`) | *(exists)* | If `https?://`, opens paper; can also link to `/researches/?id=<ilrid>` |
| `spine` | *(derived from `ilrid` or `category`)* | `spine_label` `varchar(28) NULL` *(optional)* | Vertical stacked spine label |

> **Edit Mode Behavior for Section 7**: When a logged-in user edits a research card or clicks `+ Add another research or journal paper` on `/profile/`, `UPSERT` directly into `public.researches` (with `uid = auth.uid()`), or redirect `+ Add` to your central Research Submission flow so `ilrid` generation (`ILR000X`) and peer-review metadata remain consistent platform-wide.

---

### Section 8 — `05 · Open-Source Tools & Engines`: Softwares (Horizontal Stacked Deck WITH Media Slot)
- **DOM Containers**: `#softwares-section`, `#softwares-stack-stage`, `#softwares-stack-viewport`, `#softwares-stack-track`
- **JS Function**: `renderStackedSection(STACK_SECTIONS[2])` (`showMediaSlot: true`, `idBadgeKey: 'ilsid'`)
- **Crucial Architectural Insight — Reuse Existing `public.software` Table!**
  - Just like `researches`, `directory.js` already queries `public.software` (`ilsid`, `uid`, `name`, `tagline`, `description`, `category`, `tech`, `url`, `repo_url`, `image_url`, `status`, `publish_date`, `likes`, `comments`, `reviewers`, `is_sample`).
  - Query `software?select=ilsid,uid,name,tagline,description,category,tech,url,repo_url,image_url,status,publish_date,is_sample&uid=eq.<cid>&order=publish_date.desc.nullslast`.

#### Mapping Existing `public.software` Columns → `profile.js` Software Card Fields
| `profile.js` Card Field | Existing `public.software` Column | Mapping / Formatting Rule |
| :--- | :--- | :--- |
| `ilsid` | `ilsid` (`varchar`, PK e.g. `ILS0001`) | Registry badge ID |
| `category` | `category` (`varchar(60)`) | Uppercase category pill (e.g. `'RESEARCH INFRASTRUCTURE'`) |
| `meta` | `ilsid` + `status` | Format as `` `${ilsid} · ${status || 'LIVE'}` `` |
| `title` | `name` (`varchar(140)`) | Software name |
| `subtitle` | `tagline` (`varchar(200)`) | Orange subtitle directly under software name |
| `description` | `description` (`varchar(1200)`) | Card summary + full reader modal body |
| `image` | `image_url` (`varchar(255)`) | Resolved via `/softwares/img/<image_url>` if filename-only, or Storage URL |
| `footerMeta` | `tech` (`text[]` or `varchar`) | Joined tech stack (e.g. `'TypeScript · Supabase · Vite'`) |
| `linkUrl` | `url` *(fallback `repo_url`)* | External launch URL or `/softwares/?id=<ilsid>` |

---

### Section 9 — `06 · Beyond the Laboratory`: Co-Curriculars (Horizontal Stacked Deck — No Media Slot)
- **DOM Containers**: `#cocurriculars-section`, `#cocurriculars-stack-stage`, `#cocurriculars-stack-viewport`, `#cocurriculars-stack-track`
- **JS Function**: `renderStackedSection(STACK_SECTIONS[3])` (`showMediaSlot: false`)
- **Cardinality**: `0` to `N` cards per user.
- **Note on Existing Schema**: `directory.js` already references `profiles.others`! You can either back this with a dedicated table `public.profile_cocurriculars` (sharing the exact same schema as `profile_skills_badges` in Section 5)—or merge Section 5 (`skills`) and Section 9 (`cocurriculars`) into **one unified custom deck table** `public.profile_custom_cards` discriminated by `deck_type VARCHAR(20) CHECK (deck_type IN ('skills', 'cocurriculars'))`.

| Column in `profile_custom_cards` | PostgreSQL Type | Limits | Used by Section 5 (`skills`) & Section 9 (`cocurriculars`) |
| :--- | :--- | :--- | :--- |
| `id` | `uuid PK DEFAULT gen_random_uuid()` | — | Row identifier |
| `cid` | `uuid NOT NULL REFERENCES profiles(cid) ON DELETE CASCADE` | — | Profile owner |
| `deck_type` | `varchar(20) NOT NULL` | `'skills'` or `'cocurriculars'` | Separates Section 5 vs Section 9 |
| `sort_order` | `smallint NOT NULL DEFAULT 0` | `>= 0` | Card order (`01`, `02`...) |
| `spine_label` | `varchar(28) NULL` | Max `28` chars | Collapsed vertical spine title |
| `category` | `varchar(60) NOT NULL` | Max `60` chars | Top-left orange eyebrow |
| `meta_badge` | `varchar(60) NULL` | Max `60` chars | Top-right status/year |
| `title` | `varchar(140) NOT NULL` | Max `140` chars | Card headline |
| `subtitle` | `varchar(180) NULL` | Max `180` chars | Role / organization / issuer |
| `description` | `varchar(700) NULL` | Max `700` chars | Summary body |
| `footer_meta` | `varchar(100) NULL` | Max `100` chars | Bottom-left impact/credential tag |
| `link_label` | `varchar(40) NULL` | Max `40` chars | CTA text (`'Details'` / `'Verify Credential'`) |
| `link_url` | `varchar(500) NULL` | `^https?://` | Optional external proof URL |

---

### Section 10 — `07 · Direct Academic Inquiry`: Contact Section & WhatsApp Dispatch Form
- **DOM Containers**: `#contact-section`, `#prof-contact-email`, `#prof-contact-wa-row`, `#prof-contact-whatsapp`, `#prof-contact-location`, `#prof-contact-form`, `#prof-contact-submit-btn`, `#prof-contact-feedback`
- **JS Functions**: `renderContactSection()`, `normalizeOwnerWhatsAppTarget()`, `buildOwnerWhatsAppUrl()`, `redirectToWhatsApp()`

#### 10A. Persistent Contact Columns (on `public.profiles`)
| DOM Element ID | `data-editable` Path | Recommended DB Column | PostgreSQL Type | Nullable / Default | Limits & Rules | Visibility & Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `#prof-contact-email` | `email` | `public_email` *(do NOT expose private `auth.users.email` unless opted in)* | `varchar(160)` | `NULL` | Valid email regex, max `160` chars, single-line | Displayed as `mailto:` link in User View; editable text in Edit Mode. |
| `#prof-contact-whatsapp` | `whatsapp` (`data-nullable-field="true"`) | `whatsapp` *(same column as Section 2 Hero CTA!)* | `varchar(24)` | `NULL` | `NULL` or `7–15` international digits (e.g. `+8801800000000`) | **Nullable Field**: Setting empty, `0`, or `null` saves `NULL` in DB. When `NULL`: 1) Hero `#prof-whatsapp-cta` hides, 2) Contact `#prof-contact-wa-row` hides in User View (shows `'Hidden — double-click to add WhatsApp number'` in Edit Mode), 3) `#prof-contact-submit-btn` disables with `'WhatsApp Unavailable'`. |
| `#prof-contact-location` | `location` | `location` | `varchar(120)` | `NULL` | Max `120` chars, single-line | E.g. `'Dhaka, Bangladesh'`. Falls back to `'Bangladesh'` if `NULL`. |

#### 10B. Visitor Inquiry Form Inputs (Transient — **0 Database Columns Needed**)
- `#prof-sender-name`, `#prof-sender-email`, `#prof-sender-msg` are **not saved in Supabase**.
- Submitting `#prof-contact-form` formats:
  ```text
  Hello <Owner Name>,

  Name: <Sender Name>
  Email: <Sender Email>

  Message:
  <Message>
  ```
  and redirects client-side to `https://wa.me/<normalized_owner_digits>?text=<encoded>`.

---

### Section 11 — Footer, Item Detail Reader Modal (`#prof-reader-modal`) & Demo Switcher Dock (`#prof-demo-dock`)
- **Footer (`footer.prof-footer`)**: Static Iteration Lab links + `#prof-footer-wa-link` (`https://wa.me/TheIterationLab` from `js/config.js`). **0 DB columns.**
- **Reader Modal (`#prof-reader-modal`)**: Pure presentation overlay consuming the active card's `category`, `meta`, `title`, `subtitle`, `description`, `footerMeta`, `linkUrl`, and `linkLabel`. **0 extra DB columns.**
- **Floating Demo Dock (`#prof-demo-dock`)**: Uses `localStorage` (`til_portfolio_draft_v1_*`) and `sessionStorage` (`til_portfolio_sim_owner_v1`) strictly while database wiring is pending. **Remove or gate behind `?demo=1` once Supabase live queries are enabled.**

---

## 3. Complete Summary of Required Schema Changes

Because `public.profiles`, `public.students`, `public.teachers`, `public.institutes`, `public.researches`, and `public.software` **already exist**, you only need:
1. **18 new portfolio columns on `public.profiles`** (all `NULL` or safe `DEFAULT`s so existing directory pages `/leaders/`, `/students/`, `/teachers/` continue working untouched).
2. **2 lightweight child tables** for repeatable portfolio items:
   - `public.profile_cv_entries` (powers **01 · Education** and **03 · Experiences**)
   - `public.profile_custom_cards` (powers **02 · Skills, Badges & Certifications** and **06 · Co-Curriculars**)
3. **Direct foreign-key reuse** of `public.researches` (`uid = profiles.cid`) for **04 · Researches & Journals** + Hero **Recent Researches**, and `public.software` (`uid = profiles.cid`) for **05 · Softwares**.

---

## 4. Ready-to-Run Supabase PostgreSQL Migration (DDL + Constraints + RLS)

```sql
-- ============================================================================
-- 1. Extend public.profiles with Portfolio & Academic Metrics Columns
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS slug                varchar(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS account_type        char(1) NOT NULL DEFAULT 'S'
    CHECK (account_type IN ('S', 'T', 'R')),
  ADD COLUMN IF NOT EXISTS profession          varchar(80),
  ADD COLUMN IF NOT EXISTS institution_override varchar(160),
  ADD COLUMN IF NOT EXISTS q1                  varchar(140),
  ADD COLUMN IF NOT EXISTS research_interests  varchar(500),
  ADD COLUMN IF NOT EXISTS hero_button         smallint NOT NULL DEFAULT 1
    CHECK (hero_button IN (0, 1)),
  ADD COLUMN IF NOT EXISTS whatsapp            varchar(24),
  ADD COLUMN IF NOT EXISTS public_email        varchar(160),
  ADD COLUMN IF NOT EXISTS location            varchar(120),
  ADD COLUMN IF NOT EXISTS statement_kicker    varchar(60),
  ADD COLUMN IF NOT EXISTS q2                  varchar(260),
  ADD COLUMN IF NOT EXISTS bio                 varchar(800),
  ADD COLUMN IF NOT EXISTS ssc_gpa             numeric(3,2) DEFAULT 0.00
    CHECK (ssc_gpa IS NULL OR (ssc_gpa >= 0 AND ssc_gpa <= 5.00)),
  ADD COLUMN IF NOT EXISTS ssc_sub             varchar(60),
  ADD COLUMN IF NOT EXISTS hsc_gpa             numeric(3,2) DEFAULT 0.00
    CHECK (hsc_gpa IS NULL OR (hsc_gpa >= 0 AND hsc_gpa <= 5.00)),
  ADD COLUMN IF NOT EXISTS hsc_sub             varchar(60),
  ADD COLUMN IF NOT EXISTS ug_cgpa             numeric(3,2) DEFAULT 0.00
    CHECK (ug_cgpa IS NULL OR (ug_cgpa >= 0 AND ug_cgpa <= 5.00)),
  ADD COLUMN IF NOT EXISTS ug_sub              varchar(60),
  ADD COLUMN IF NOT EXISTS grad_cgpa           numeric(3,2) DEFAULT 0.00
    CHECK (grad_cgpa IS NULL OR (grad_cgpa >= 0 AND grad_cgpa <= 5.00)),
  ADD COLUMN IF NOT EXISTS grad_sub            varchar(60),
  ADD COLUMN IF NOT EXISTS research_metric_sub varchar(60),
  ADD COLUMN IF NOT EXISTS updated_at          timestamptz NOT NULL DEFAULT now();

-- Normalize empty/"0" WhatsApp strings to NULL automatically at DB level
CREATE OR REPLACE FUNCTION public.normalize_profile_fields()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.whatsapp IS NOT NULL THEN
    NEW.whatsapp := btrim(NEW.whatsapp);
    IF NEW.whatsapp = '' OR NEW.whatsapp = '0' OR lower(NEW.whatsapp) = 'null' THEN
      NEW.whatsapp := NULL;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_profile_fields ON public.profiles;
CREATE TRIGGER trg_normalize_profile_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_profile_fields();

-- ============================================================================
-- 2. CV Timelines Table (Section 4: Education & Section 6: Experiences)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profile_cv_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cid               uuid NOT NULL REFERENCES public.profiles(cid) ON DELETE CASCADE,
  entry_type        varchar(16) NOT NULL CHECK (entry_type IN ('education', 'experience')),
  sort_order        smallint NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  period            varchar(50) NOT NULL,
  core_title        varchar(160) NOT NULL,
  organization_name varchar(180) NOT NULL,
  detail            varchar(600),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_cv_cid_type_order
  ON public.profile_cv_entries (cid, entry_type, sort_order ASC);

-- ============================================================================
-- 3. Custom Stacked Cards Table (Section 5: Skills & Section 9: Co-Curriculars)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profile_custom_cards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cid         uuid NOT NULL REFERENCES public.profiles(cid) ON DELETE CASCADE,
  deck_type   varchar(20) NOT NULL CHECK (deck_type IN ('skills', 'cocurriculars')),
  sort_order  smallint NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  spine_label varchar(28),
  category    varchar(60) NOT NULL DEFAULT 'VERIFIED RECORD',
  meta_badge  varchar(60),
  title       varchar(140) NOT NULL,
  subtitle    varchar(180),
  description varchar(700),
  footer_meta varchar(100),
  link_label  varchar(40) DEFAULT 'Details',
  link_url    varchar(500) CHECK (link_url IS NULL OR link_url ~* '^https?://'),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_cards_cid_deck_order
  ON public.profile_custom_cards (cid, deck_type, sort_order ASC);

-- ============================================================================
-- 4. Row-Level Security (RLS): Public Read, Owner-Only Write (auth.uid() = cid)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_cv_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_custom_cards ENABLE ROW LEVEL SECURITY;

-- Public read access for portfolio visitors
CREATE POLICY "Public can view profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Owner can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = cid)
  WITH CHECK (auth.uid() = cid);

-- CV Timeline policies
CREATE POLICY "Public can view CV entries"
  ON public.profile_cv_entries FOR SELECT USING (true);

CREATE POLICY "Owner can insert own CV entries"
  ON public.profile_cv_entries FOR INSERT
  WITH CHECK (auth.uid() = cid);

CREATE POLICY "Owner can update own CV entries"
  ON public.profile_cv_entries FOR UPDATE
  USING (auth.uid() = cid)
  WITH CHECK (auth.uid() = cid);

CREATE POLICY "Owner can delete own CV entries"
  ON public.profile_cv_entries FOR DELETE
  USING (auth.uid() = cid);

-- Custom Stacked Cards policies
CREATE POLICY "Public can view custom cards"
  ON public.profile_custom_cards FOR SELECT USING (true);

CREATE POLICY "Owner can insert own custom cards"
  ON public.profile_custom_cards FOR INSERT
  WITH CHECK (auth.uid() = cid);

CREATE POLICY "Owner can update own custom cards"
  ON public.profile_custom_cards FOR UPDATE
  USING (auth.uid() = cid)
  WITH CHECK (auth.uid() = cid);

CREATE POLICY "Owner can delete own custom cards"
  ON public.profile_custom_cards FOR DELETE
  USING (auth.uid() = cid);
```

---

## 5. Quick Reference: PostgREST Fetch Plan for `/assets/js/profile.js`

When you are ready to replace `SAMPLE_PROFILES` and `loadProfileData()` in `/assets/js/profile.js` with live Supabase REST requests, the entire portfolio page loads cleanly in **parallel (`Promise.all`) with 4 lightweight requests**:

1. **Core Profile + Timelines + Custom Decks (1 embedded PostgREST request)**:
   ```text
   GET /rest/v1/profiles?cid=eq.<cid>&select=cid,slug,account_type,name,photo,profession,institution_override,q1,research_interests,hero_button,whatsapp,public_email,location,statement_kicker,q2,bio,ssc_gpa,ssc_sub,hsc_gpa,hsc_sub,ug_cgpa,ug_sub,grad_cgpa,grad_sub,research_metric_sub,students(eiin),teachers(eiin),profile_cv_entries(id,entry_type,sort_order,period,core_title,organization_name,detail),profile_custom_cards(id,deck_type,sort_order,spine_label,category,meta_badge,title,subtitle,description,footer_meta,link_label,link_url)
   ```
2. **Institution Name Lookup (only if `eiin` is present and `institution_override` is `NULL`)**:
   ```text
   GET /rest/v1/institutes?eiin=eq.<eiin>&select=eiin,profiles(name)
   ```
3. **Author's Published Researches (powers both Hero "Recent Researches" & Section 7)**:
   ```text
   GET /rest/v1/researches?uid=eq.<cid>&select=ilrid,uid,title,abstract,category,keywords,paper_url,cover_url,publish_date,is_sample&order=publish_date.desc.nullslast
   ```
4. **Developer's Published Softwares (powers Section 8)**:
   ```text
   GET /rest/v1/software?uid=eq.<cid>&select=ilsid,uid,name,tagline,description,category,tech,url,repo_url,image_url,status,publish_date,is_sample&order=publish_date.desc.nullslast
   ```
