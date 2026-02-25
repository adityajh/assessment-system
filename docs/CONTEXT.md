# Assessment System — Project Context Document

> **Program:** Let's Entreprise — Year 1  
> **Last Updated:** 2026-02-24  
> **Purpose:** This document maps out the assessment data ecosystem for the Year 1 cohort of Let's Entreprise. It serves as a reference for building a **consolidated per-student dashboard** and a **tool that ingests input sheets and generates those dashboards automatically**.

---

## 1. Overview

The Year 1 assessment system consists of **multiple data sources** (input sheets) that feed into a **consolidated output**. The assessment model is multi-dimensional, evaluating students across **6 Readiness Domains** through **multiple project modules**, using a combination of **mentor assessments**, **self-assessments**, and **peer feedback**.

### Project Goal

Build two things:
1. **A consolidated per-student dashboard** — visualizing each student's readiness across all projects and assessment types.
2. **An automated tool** — that takes the input sheets and produces these dashboards.

### Data Flow Diagram (Conceptual)

```
┌─────────────────────────────────┐
│       INPUT SHEETS              │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Assessment Matrix         │  │──── Mentor Assessment (per project, per student)
│  │ (mentor-filled)           │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Self-Assessment Forms     │  │──── Student Self-Assessment (per project)
│  │ (Business X-Ray, Accounts)│  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Peer Feedback Form        │  │──── Peer-to-Peer Feedback (per project, per student pair)
│  │ (metrics tab)             │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Term Report               │  │──── Coaching & Credit Tracking
│  │ (CBP / Conflexion / BOW)  │  │
│  └───────────────────────────┘  │
└────────────────┬────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│       OUTPUT                      │
│                                   │
│  Per-Student Dashboard            │──── Merged Mentor + Self + Peer scores
│  (per student, per project,       │     across all readiness domains
│   per readiness domain,           │     + coaching/credit tracking
│   with progression over time)     │
└───────────────────────────────────┘
```

---

## 2. Students (Year 1 Cohort)

There are **17 students** in the Year 1 cohort (same cohort across all sheets). Names appear in different formats across sheets. Below is the **canonical name mapping**:

| # | Canonical Name              | Assessment Matrix Alias | Self-Assessment Form Alias | Peer Feedback Alias          | Consolidated Alias        | Notes |
|---|----------------------------|------------------------|---------------------------|------------------------------|--------------------------|-------|
| 1 | Aadi Gujar                 | Adi Gujar M            | Aadi Gujar                | Aadi Gujar                   | Aadi Gujar               |       |
| 2 | Aditya Singhal             | Aditya Singhal L       | Aditya Singhal             | Aditya Singhal               | Aditya Singhal           |       |
| 3 | Adityaraj Shetty           | Adityaraj M            | —                         | Adityaraj Shetty             | Adityaraj Shetty         |       |
| 4 | Advait Sureshbabu          | Advait M               | Advait Sureshbabu          | Advait Sureshbabu            | Advait Sureshbabu        |       |
| 5 | Ameya Kanchar              | Ameya M                | Ameya Kanchar             | Ameya Kanchar                | Ameya Kanchar            |       |
| 6 | Archit Gupta               | Archit L               | Archit Gupta               | Archit Gupta                 | Archit Gupta             |       |
| 7 | Arha Doijode               | Arha M                 | Arha doijode              | Arha Doijode                 | Arha Doijode             |       |
| 8 | Arnee Parmar               | Arnee L                | Arnee Parmar              | Arnee Dipakkumar Parmar      | Arnee Dipakkumar Parmar / Arnee Parmar |       |
| 9 | Diyansh Bafna              | Diyansh L              | Diyansh                   | Diyansh Bafna                | Diyansh Bafna            |       |
| 10| Husain Nasikwala           | Hussain M              | Husain Nasikwala           | Husain Nasikwala             | Husain Nasikwala         | Spelling: Husain vs Hussain |
| 11| Idris Dhariwala            | Idris L                | idris dhariwala           | Idris Dhariwala              | Idris Dhariwala          |       |
| 12| Jasper Jovi Dias           | Jasper M               | Jasper Jovi Dias          | Jasper Dias                  | Jasper Jovi Dias         |       |
| 13| Kunal Jeswani              | Kunal M                | —                         | Kunal Jeswani                | Kunal Jeswani            | Not in self-assessment forms reviewed |
| 14| Moiz Lakdawala             | Moiz M                 | Moiz Lakdawala            | Moiz Lakdawala               | Moiz Lakdawala           |       |
| 15| Rudrasen Mahale            | Rudrasen M             | Rudrasen                  | Rudrasen Mahale              | Rudrasen Mahale          |       |
| 16| Saumyaa Gupta              | Saumyaa M              | Saumyaa Gupta             | Saumyaa Gupta                | Saumyaa Gupta            |       |
| 17| Zainab Khandwawala         | Zainab L               | Zainab Khandwawala        | Zainab Khandwawala           | Zainab Khandwawala       |       |

> **Note:** `Madhur Kalantri` appears in the Peer Feedback sheet but not in any other sheet. **He has left the program — ignore his data.** He is marked `is_active = FALSE` in the database.

### Student Grouping in Assessment Matrix

In the Assessment Matrix, students have a suffix (`M` or `L`). **These suffixes should be ignored** when mapping to canonical names — they are internal batch/group labels with no bearing on the assessment data itself. In later project tabs (Business Xray, SDP, Accounts), all 17 students appear together without suffixes.

---

## 3. Projects / Modules

Year 1 students go through a defined sequence of project modules. Each project is assessed independently. **"Murder Mystery" is the internal name for the "Marketing" project.**

### Confirmed Project Sequence

| Seq | Project Name                          | Assessment Matrix Tab(s)                     | Self-Assessment Form           | In Consolidated? | In Peer Feedback? | Notes |
|-----|---------------------------------------|---------------------------------------------|-------------------------------|------------------|-------------------|-------|
| 1   | **Kickstart**                         | Kickstart                                   | —                             | ✅ Yes           | ✅ Yes            | All students together |
| 2a  | **Marketing** (Murder Mystery)        | Murder Mystery, Copy of Murder Mystery      | —                             | ✅ Yes           | ✅ Yes            | **M-group students only** (11 students). Concurrent with Legacy. |
| 2b  | **Legacy**                            | Legacy, Copy of Legacy                      | —                             | ✅ Yes (some)    | ✅ Yes            | **L-group students only** (6 students). Concurrent with Marketing. |
| 3   | **Business X-Ray**                    | Business Xray                               | ✅ Business X-Ray Responses   | ❌ Not yet       | ❌ No             | All students together |
| 4   | **Accounts**                          | Accounts                                    | ✅ Accounting Self-Assessment | ❌ Not yet       | ❌ No             | All students together |
| 5   | **SDP** (Service Design Project)      | SDP                                         | —                             | ✅ Yes           | ✅ Yes            | All students together |
| 6   | **Moonshine / SIDR Client Project**   | Moonshine Client, SIDR Client               | —                             | ❌ No            | ❌ No             | Client projects tied to SDP; assessed via client evaluation frameworks |

> **⚠️ Note on Consolidated Data:** The existing consolidated Excel file uses different sequence numbers (Kickstart=1, Marketing=2, SDP=3). The actual correct sequence is as listed above. This discrepancy should be accounted for when building the automated tool.
>
> **Key insight — Seq 2 is concurrent:** At Sequence 2, the cohort was split into two groups. The **M-group** (11 students) did the **Marketing / Murder Mystery** project, while the **L-group** (6 students) did the **Legacy** project. From Sequence 3 onwards, all students are assessed together.

---

## 4. Assessment Framework — The 6 Readiness Domains

Each student is evaluated across **6 readiness domains**, each with **4 sub-parameters** (24 parameters total). This framework is consistent across the Assessment Matrix, Self-Assessment Forms, and the Consolidated output.

**Some readiness domains may intentionally not be scored for certain projects** (e.g., Marketing Readiness is NaN for SDP). This is by design — not every project exercises every domain.

### 4.1 Commercial Readiness
| # | Parameter | Description |
|---|-----------|-------------|
| 1 | Financial Literacy & Analysis | Uses ratios, percentages, breakeven logic |
| 2 | Budgeting & Forecasting | Prepares budgets, forecasts, business plans |
| 3 | Accounting & Compliance | Double-entry, balance sheets, contracts |
| 4 | Negotiation & Vendor Management | Research, negotiation, cost/value optimisation |

### 4.2 Entrepreneurial Readiness
| # | Parameter | Description |
|---|-----------|-------------|
| 1 | Market Research & Opportunity Recognition | Studies industries, identifies customer needs, spots opportunities |
| 2 | Business Model & Lean Execution | Applies lean start-up, uses strengths/resources, develops strategies |
| 3 | Sales & Outreach | Drives outreach, sales, and business development |
| 4 | Networking & Pitching | Builds connections, pitches persuasively, asks meaningful questions |

### 4.3 Marketing Readiness
| # | Parameter | Description |
|---|-----------|-------------|
| 1 | Content & Communication | Creates persuasive copies, messaging plans, and brand communication |
| 2 | Sales Enablement | Engages in outbound calls, prospecting, and targeting customers |
| 3 | Marketing Strategy & Execution | Designs lead generation, go-to-market strategies |
| 4 | Analysis & Optimization | Runs analysis to refine marketing and sales funnel performance |

### 4.4 Innovation Readiness
| # | Parameter | Description |
|---|-----------|-------------|
| 1 | Ideation & Creativity | Applies brainstorming, mood boarding, and design briefs |
| 2 | Customer-Centered Insights | Develops personas, conducts interviews, maps customer journeys |
| 3 | Prototyping & Agile Development | Builds prototypes and applies agile methods |
| 4 | Business & System Mapping | Creates business model canvases and maps supply chains |

### 4.5 Operational Readiness
| # | Parameter | Description |
|---|-----------|-------------|
| 1 | Planning & Collaboration | Defines roles, plans teamwork, manages client expectations |
| 2 | Problem-Solving & Risk Management | Anticipates challenges, creates contingency plans |
| 3 | Process & Project Management | Uses tools, flowcharts, and automation for efficiency |
| 4 | Documentation & Reporting | Communicates progress, writes guides, ensures transparency |

### 4.6 Professional Readiness
| # | Parameter | Description |
|---|-----------|-------------|
| 1 | Career Planning & Awareness | Makes career decisions based on self-awareness |
| 2 | Professional Conduct & Ethics | Demonstrates professionalism, accountability, ethical behavior |
| 3 | Continuous Growth & Reflection | Practices self-reflection, seeks improvement |
| 4 | Networking & Presence | Builds relationships, engages with mentors, maintains professional presence |

---

## 5. Detailed Sheet Descriptions

### 5.1 Assessment Matrix (INPUT — Mentor Assessment)
**File:** `Year 1 Assessment_Matrix (1) (1) (1).xlsx`

| Tab | Purpose | Structure |
|-----|---------|-----------|
| **Kickstart** | Mentor assessment for Kickstart project | Rows = 24 readiness parameters (across 6 domains); Columns = student names; Values = numeric scores (1–10) |
| **Legacy** | Mentor assessment for Legacy project (L-group students only: 6 students) | Same structure as Kickstart |
| **Copy of Legacy** | Clean/template version of Legacy assessment | Has assessment framework without student scores |
| **Murder Mystery** | Mentor assessment for Marketing project (M-group students only: 11 students) | Same structure |
| **Copy of Murder Mystery** | Clean/template version for Marketing assessment | Framework only |
| **Business Xray** | Mentor assessment for Business X-Ray project | Adds `Assessment Questions` and `Evidence Based Assessment` columns; All 17 students |
| **SDP** | Mentor assessment for Service Design Project | Adds `Assessable in SDP?`, `Evidence Used`, `Why/Why Not` columns; All 17 students |
| **Accounts** | Mentor assessment for Accounts project | Similar to SDP structure; All 17 students |
| **Moonshine Client** | Client-side assessment framework for Moonshine | 5 columns: Readiness Category, Parameter, Assessment Status, Self Evaluation Question, Client Evaluation Question |
| **SIDR Client** | Client-side assessment framework for SIDR | Same structure as Moonshine Client |

**Key Details:**
- **Rating Scale:** Numeric scores (observed values: 1–10)
- **Structure Evolution:** Earlier projects (Kickstart, Legacy, Murder Mystery) use a condensed format. Later projects (SDP, Accounts) add richer assessment context (evidence, assessability status).
- **Batch Split:** Legacy tab has only L-group students (6); Murder Mystery tab has only M-group students (11). Business Xray, SDP, and Accounts have all students combined.
- **Client Tabs (Moonshine, SIDR):** These are **client-perspective assessment frameworks** for the SDP client projects. They contain assessment questions and assessability status but **no student scores** — they define what CAN be assessed from the client side.

---

### 5.2 Self-Assessment Forms (INPUT — Student Self-Assessment)

#### 5.2.1 Business X-Ray Responses
**File:** `Business X-Ray _ Responses.xlsx`  
**Tab:** `Form Responses 1`

- **Shape:** 17 responses × 22 columns
- **Structure:** `Timestamp`, `Student Name`, then 20 self-reflection questions
- **Rating Scale:** 1–5 (integer, Likert-style)
- **Questions map to readiness domains** — each question is a statement about competence in a specific area (financial metrics, BMC, communication, etc.)

#### 5.2.2 Accounting Project Self-Assessment
**File:** `Accounting Project – Readiness Self-Assessment (Responses).xlsx`  
**Tab:** `Form responses 1`

- **Shape:** 18 responses × 12 columns (15 unique students; some may have duplicates)
- **Structure:** `Timestamp`, `Student Name`, 9 Likert questions + 1 open-ended question
- **Rating Scale:** 1–10 (integer)
- **Questions:** Focused on accounting skills, documentation, professionalism, and growth

> **⚠️ Note:** The rating scale differs between Business X-Ray (1–5) and Accounting (1–10). This needs normalization if combining.

---

### 5.3 Peer Feedback Form (INPUT — Peer-to-Peer)
**File:** `Peer Feedback Form (Responses) (1).xlsx`  
**Tab:** `Peer feedback metrics` (the only tab we use)

- **Shape:** 236 responses × 9 columns
- **Structure:** `Timestamp`, `Recipient Name`, `Your Name`, 5 metric columns, `Project Name`
- **Rating Scale:** 1–5 (integer)
- **Metrics:**
  - Quality of Work
  - Initiative & Ownership
  - Communication
  - Collaboration
  - Growth Mindset
- **Projects covered:** Kickstart, Legacy, Marketing, SDP
- **Relationship:** Many-to-many — each student rates multiple peers, and each student receives ratings from multiple peers
- **These metrics DO NOT directly map to the 6 readiness domains.** They represent a separate, complementary assessment axis (soft skills / team behavior).

> **⚠️ Data Quality Issue:** Some project names have trailing spaces (`"Legacy "` vs `"Legacy"`, `"Marketing "` vs `"Marketing"`). These need trimming/normalization.

---

### 5.4 Term Report (INPUT — Coaching & Credit Tracking)
**File:** `Term Report CBP Conflexion BOW.xlsx`  
**Tab:** `Sheet1`

- **Shape:** 17 students × 5 columns
- **Fields:**
  - `Student Name`
  - `CBP` — Coaching sessions completed (integer; range: 2–3)
  - `Conflexion` — Conflexion processes completed (integer; range: 0–2)
  - `BOW` — Body of Work credits earned (decimal; range: 0.50–15.60)

This is a supplementary tracking sheet, not directly tied to readiness domain scores but part of the overall student profile.

---

### 5.5 Year 1 Consolidated Assessment (OUTPUT — Current State)
**File:** `Year 1 Consolidated Assessment Final 2026 (3).xlsx`

| Tab | Purpose |
|-----|---------|
| **Power query** | Unpivoted/normalized data — one row per student × project × readiness type × assessment type |
| **Final Score** | Pivoted view — one row per student × project × assessment type, with readiness domains as columns |
| **Final Score (2)** | Alternate/backup version of Final Score |
| **Old Score** | Previous version of scores (for comparison) |
| **Adi Gujar**, **Aditya Singal**, **Adityaraj**, **Advait**, **Advait (2)** | Individual student breakdowns |
| **Adi Gujar Pivot**, **Adityaraj Pivot** | Pivot table views for individual students |
| **Sheet3** | Scratch/summary sheet |

**Key Structure — `Power query` tab:**
| Field | Description |
|-------|-------------|
| SR NO | Serial number |
| ID | Student ID |
| Student Name | Canonical student name |
| Type | `Mentor` or `Self` |
| Project Name | Project module name |
| Project Sequence | Numeric order of the project |
| Readiness Type | One of the 6 readiness domains |
| Rating | Score (1.0–10.0 scale) |

**Key Structure — `Final Score` tab:**
| Field | Description |
|-------|-------------|
| SR NO, ID, Student Name, Type, Project Name, Project Sequence | Same as Power query |
| Commercial Readiness | Average/aggregated score |
| Entrepreneurial Readiness | Average/aggregated score |
| Marketing | Average/aggregated score (intentionally NaN for some projects) |
| Innovation Readiness | Average/aggregated score |
| Operational Readiness | Average/aggregated score |
| Professional Readiness | Average/aggregated score |

**Currently consolidated projects:** Kickstart (Seq 1), Marketing (Seq 2a), Legacy (Seq 2b, partial), SDP (Seq 5).  
**Not yet consolidated:** Business X-Ray (Seq 3), Accounts (Seq 4), Moonshine/SIDR Client (Seq 6).  

> **⚠️ Note:** The `Project Sequence` numbers in this file (1, 2, 3) do not match the actual confirmed sequence. The tool should remap these.

---

## 6. Field Overlap & Relationships

### 6.1 Common Dimensions Across All Sheets

| Dimension | Assessment Matrix | Self-Assessment Forms | Peer Feedback | Term Report | Consolidated |
|-----------|------------------|-----------------------|---------------|-------------|--------------|
| **Student Name** | ✅ (with M/L suffix — ignore) | ✅ (various formats) | ✅ (Recipient + Giver) | ✅ | ✅ |
| **Project Name** | ✅ (tab-based) | ✅ (implicit – one form per project) | ✅ (column) | ❌ | ✅ |
| **Readiness Domain** | ✅ (rows) | ✅ (questions map to domains) | ❌ (different metrics) | ❌ | ✅ |
| **Score / Rating** | ✅ (1–10) | ✅ (1–5 or 1–10) | ✅ (1–5) | ✅ (counts/credits) | ✅ (1–10) |
| **Assessment Type** | Mentor | Self | Peer | — | Mentor + Self |

### 6.2 Mapping Self-Assessment Questions → Readiness Domains

The self-assessment forms use verbose question text. These have been mapped to the 6 readiness domains and sub-parameters. **See `SUPABASE_SCHEMA.md` Section 1 for the full derived mapping** (Business X-Ray: 20 questions; Accounts: 9 scored questions). The mapping was derived from question content aligned with readiness parameter definitions.

### 6.3 Peer Feedback Metrics — Separate Axis

The 5 peer feedback metrics (Quality of Work, Initiative & Ownership, Communication, Collaboration, Growth Mindset) do **not** directly map to the 6 readiness domains. They represent a **separate assessment axis** focused on teamwork and soft skills. In the dashboard, they should be presented as their own section, not merged into readiness domain scores.

---

## 7. Rating Scales Summary

| Source | Scale | Notes |
|--------|-------|-------|
| Assessment Matrix (Mentor) | 1–10 | Integer scores, some `na` / blank values |
| Self-Assessment: Business X-Ray | 1–5 | Likert-style integer |
| Self-Assessment: Accounts | 1–10 | Integer |
| Peer Feedback | 1–5 | Integer |
| Consolidated Output | 1.0–10.0 | Decimal (averaged sub-parameters) |
| Term Report: CBP | 2–3 | Count of sessions |
| Term Report: Conflexion | 0–2 | Count of processes |
| Term Report: BOW | 0.50–15.60 | Decimal credits |

---

## 8. Open Questions & Ambiguities

| # | Question | Status |
|---|----------|--------|
| 1 | ~~What do the `M` and `L` suffixes mean?~~ → Ignore them; internal group labels. | ✅ Resolved |
| 2 | ~~Is "Murder Mystery" = "Marketing"?~~ → Yes. | ✅ Resolved |
| 3 | ~~Full project sequence?~~ → Kickstart → Legacy → Marketing → SDP → Business X-Ray → Accounts → Moonshine/SIDR | ✅ Resolved |
| 4 | ~~Are Moonshine/SIDR sub-projects of SDP?~~ → Yes, client projects tied to SDP. | ✅ Resolved |
| 5 | ~~Is Marketing Readiness intentionally excluded from SDP?~~ → Yes. Some scores may intentionally not be given in certain assessments. | ✅ Resolved |
| 6 | ~~Same cohort?~~ → Yes, all 17 students are the same Year 1 cohort. | ✅ Resolved |
| 7 | ~~End goal?~~ → Consolidated per-student dashboard + automated tool to generate dashboards from input sheets. | ✅ Resolved |
| 8 | ~~Marketing sequence?~~ → Marketing (M-group) and Legacy (L-group) are **concurrent at Seq 2**. Correct full sequence: Kickstart → Marketing+Legacy → Business X-Ray → Accounts → SDP → Moonshine/SIDR. | ✅ Resolved |
| 9 | ~~Self-assessment question mapping?~~ → Derived from question content. See `SUPABASE_SCHEMA.md` Section 1. Pending user review before finalization. | ✅ Resolved (pending review) |
| 10 | ~~Madhur Kalantri?~~ → Left the program. Ignore his data. Mark `is_active = FALSE`. | ✅ Resolved |

---

## 9. File Inventory

| File Name | Type | Sheets Used |
|-----------|------|-------------|
| `Year 1 Assessment_Matrix (1) (1) (1).xlsx` | INPUT (Mentor) | Kickstart, Legacy, Murder Mystery, Business Xray, SDP, Accounts, Moonshine Client, SIDR Client |
| `Business X-Ray _ Responses.xlsx` | INPUT (Self) | Form Responses 1 |
| `Accounting Project – Readiness Self-Assessment (Responses).xlsx` | INPUT (Self) | Form responses 1 |
| `Peer Feedback Form (Responses) (1).xlsx` | INPUT (Peer) | Peer feedback metrics |
| `Term Report CBP Conflexion BOW.xlsx` | INPUT (Tracking) | Sheet1 |
| `Year 1 Consolidated Assessment Final 2026 (3).xlsx` | OUTPUT (existing) | Power query, Final Score, + student-specific tabs |

---

## Appendix A: Raw File & Tab Structure Summary

Below is the raw column/field listing for every sheet, as extracted programmatically.

### A.1 Business X-Ray _ Responses.xlsx

**Tab: `Form Responses 1`** (17 rows × 22 cols)
- `Timestamp`
- `Student Name`
- `How confidently can I calculate and interpret key financial metrics like break-even, cost structure, and ROI for the business I studied?`
- `How accurately was I able to estimate revenues, costs, and financial risks using field data and assumptions?`
- `How effectively did I communicate with owners/staff to gather accurate operational and financial information?`
- `How well was I able to identify customer needs, frustrations, and emerging opportunities through observation and questioning?`
- `How clearly can I map and explain the business model (BMC) and identify what drives value?`
- `How confidently and clearly was I able to present insights and defend my analysis during the pitch?`
- `How clearly and persuasively did I communicate complex insights in my slides, visuals, and presentation?`
- `How well do I understand the target customers, competitive landscape, and external forces influencing the business?`
- `How effectively could I identify inefficiencies, risks, or optimization opportunities in the business?`
- `How creatively was I able to uncover deeper patterns or hidden levers affecting the business?`
- `How well did I understand customer behavior and translate it into meaningful insights?`
- `How accurately and completely was I able to map the business system using strategy frameworks?`
- `How effectively did I plan tasks and collaborate with my team to complete all project requirements?`
- `How well was I able to identify key risks and explain business vulnerabilities?`
- `How effectively did I analyze business processes and manage my workflow?`
- `How thorough and well-organized was my documentation across all frameworks and deliverables?`
- `How well can I explain the different roles, functions, and systems that make a business run?`
- `How professionally did I conduct myself during field visits, interviews, and team interactions?`
- `How deeply did I reflect on my learnings and apply feedback throughout the project?`
- `How confidently did I build rapport and ask meaningful questions to people involved in the business?`

**Tab: `Sheet1`** — Empty

---

### A.2 Accounting Project – Readiness Self-Assessment (Responses).xlsx

**Tab: `Form responses 1`** (18 rows × 12 cols)
- `Timestamp`
- `Student Name`
- `I can interpret financial statements and explain what they reveal about a business's health and performance.`
- `I correctly applied accounting principles to record transactions and prepare financial statements.`
- `I understand how different business activities connect and reflect across financial statements as one system.`
- `I identified accounting entries and recorded them with accuracy.`
- `I followed a structured process to complete accounting tasks.`
- `I clearly documented my work and communicated accounting outcomes through statements and presentations.`
- `I demonstrated honesty, responsibility, and professionalism while completing accounting work.`
- `I steadily improved my approach and applied my learning as the project progressed.`
- `I engaged professionally with mentors and asked meaningful questions during sessions.`
- `What is one specific skill or insight you gained from this accounting project?`

---

### A.3 Peer Feedback Form (Responses) (1).xlsx

**Tab: `Peer feedback metrics`** (236 rows × 9 cols)
- `Timestamp`
- `Recipient Name (Who are you giving feedback to?)`
- `Your Name (So we can follow up if needed)`
- `Quality of Work`
- `Initiative & Ownership`
- `Communication`
- `Collaboration`
- `Growth Mindset`
- `Project Name`

**Tab: `Peer feedback responses`** — Unnamed columns (raw response data)

**Tab: `DO NOT DELETE - AutoCrat Job Se`** — AutoCrat configuration (ignore)

---

### A.4 Term Report CBP Conflexion BOW.xlsx

**Tab: `Sheet1`** (17 rows × 5 cols)
- `[index]` (unnamed serial number)
- `Student Name`
- `CBP`
- `Conflexion`
- `BOW`

---

### A.5 Year 1 Assessment_Matrix (1) (1) (1).xlsx

**Tab: `Kickstart`** (32 rows × 20 cols)
- Col 0: Assessment parameter name (readiness category header + 4 sub-parameters per category)
- Col 1: Description/evidence
- Cols 2–19: Student names (with M/L suffix) — numeric scores

**Tab: `Legacy`** (same structure, 6 L-group students)

**Tab: `Copy of Legacy`** (template — no scores)

**Tab: `Murder Mystery`** (same structure, 11 M-group students)

**Tab: `Copy of Murder Mystery`** (template — no scores)

**Tab: `Business Xray`** (31 rows × 20 cols)
- Col 0: Assessment parameter name
- Col 1: Assessment Questions
- Col 2: Evidence Based Assessment
- Cols 3–19: All 17 student names — numeric scores

**Tab: `SDP`** (25 rows × 22 cols)
- Col 0: Commercial/Entrepreneurial/etc Readiness Parameter
- Col 1: Assessable in SDP? (Strongly Assessable / Partially Assessable / Not Fully Assessable / Not Assessed)
- Col 2: Evidence Used for Assessment (Observable / Verifiable)
- Col 3: Why / Why Not (Assessment Logic)
- Col 4: Self Evaluation Question
- Cols 5–21: All 17 student names — numeric scores

**Tab: `Accounts`** (25 rows × 22 cols) — Same structure as SDP

**Tab: `Moonshine Client`** (25 rows × 5 cols)
- `Readiness Category`
- `Parameter`
- `Assessment Status (Assessed / Partially Assessed / Not Assessed)`
- `Self Evaluation Question (Client Perspective)`
- `Moonshine Industry Evaluation Question (Client Perspective)`

**Tab: `SIDR Client`** (25 rows × 5 cols) — Same structure as Moonshine Client

---

### A.6 Year 1 Consolidated Assessment Final 2026 (3).xlsx

**Tab: `Power query`** (530 rows × 8 cols)
- `SR NO`, `ID`, `Student Name`, `Type`, `Project Name`, `Project Sequence`, `Readiness Type`, `Rating`

**Tab: `Final Score`** (95 rows × 12 cols)
- `SR NO`, `ID`, `Student Name`, `Type`, `Project Name`, `Project Sequence`
- `Commercial Readiness`, `Entrepreneurial Readiness`, `Marketing`, `Innovation Readiness`, `Operational Readiness`, `Professional Readiness`

**Tab: `Final Score (2)`** — Alternate version of Final Score

**Tab: `Old Score`** — Previous version

**Tab: `Sheet3`** — Scratch sheet (6 unnamed columns)

**Tabs: `Adi Gujar`, `Aditya Singal`, `Adityaraj`, `Advait`, `Advait (2)`** — Individual student breakdowns (same structure as Final Score)

**Tabs: `Adi Gujar Pivot`, `Adityaraj Pivot`** — Pivot views (`Project Sequence`, aggregated values)

---

*This document will be updated as the project progresses.*
