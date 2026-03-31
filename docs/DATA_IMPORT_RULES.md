# 📥 Data Import Rules

> **Last Updated:** 2026-03-31
> **Purpose:** Complete reference for how to prepare and upload all data types through the Import Wizard (`/admin/import`).

---

## Overview

The Import Wizard accepts **Excel files (`.xlsx` / `.xls`)** only. It automatically detects the data type from the **filename** and routes the data to the correct database table.

| Data Type | Filename must contain | Target Table | Requires Project? |
| :--- | :--- | :--- | :--- |
| **Mentor Assessment** | *(no keyword — or "matrix")* | `assessments` (type=`mentor`) | ✅ Yes |
| **Self Assessment** | `Self`, `x-ray`, or `Accounting` | `assessments` (type=`self`) | ✅ Yes |
| **Peer Feedback** | `Peer` | `peer_feedback` | ✅ Yes |
| **Term / Metric Report** | `Term` | `metric_tracking` | ❌ No (metric chosen separately) |
| **Mentor Notes** | `Notes` or `note` | `mentor_notes` | ⚠️ Optional — leave blank for General notes |

> **Detection is case-insensitive.** A file named `SDP_MentorNotes_Jun25.xlsx` will correctly be detected as **Mentor Notes**.

---

## Import Wizard Steps (All Types)

1. **Upload** — Drag your `.xlsx` or `.xls` file onto the upload zone. The system will auto-parse it and detect the data type.
2. **Verify the detected type** — You can override the detected type from the dropdown if needed.
3. **Select a Project** — Required for all types except Term/Metric reports and Mentor Notes. For Mentor Notes, leave blank to create "General Guidance" notes not tied to any specific project.
4. **Fill General Details** — Assessment Date, Program, Cohort Year, and Term.
5. **Set Score Scale** — Enter the raw Min/Max scores for normalization (Mentor & Self only; not used for Notes or Term data).
6. **Import** — Click "FINAL RUN: IMPORT TO DATABASE". A duplicate warning will appear if data for that project/cohort/type already exists.

---

## Type 1: Mentor Assessments (Matrix)

**When to use:** After a mentor-led evaluation session. Scores represent the mentor's assessment of each student against the 24 readiness parameters.

**File naming:** Do NOT include `Self`, `Peer`, `Term`, or `Notes` in the filename. Optionally include `Matrix`.
> Example: `SDP_MentorMatrix_Mar26.xlsx`

### Sheet Structure

```
| Code | [Student A] | [Student B] | [Student C] | ... |
|------|-------------|-------------|-------------|-----|
| C1   | 7           | 5           | 8           | ... |
| E2   | 6           | 9           | 7           | ... |
```

- **Column A** must contain the alphanumeric parameter **Code** (e.g., `C1`, `E4`, `M3`). This is mandatory — it's how scores are mapped to parameters.
- **Row 1** (header row) must contain **student names** starting from Column B onwards.
- Student names must match the canonical name or a known alias in the `students` table.
- Helper/metadata columns (e.g., "Parameter Description", "Domain") are automatically skipped as long as they don't match a student name.
- Multiple sheets in the workbook are all scanned and merged.

### Wizard Settings

| Setting | Value |
| :--- | :--- |
| Min Raw Score | Minimum value on mentor's scale (usually `1`) |
| Max Raw Score | Maximum value on mentor's scale (e.g., `4`, `5`, or `10`) |
| Associated Project | The project this assessment corresponds to |

### Deduplication

- **Within file:** If a student appears in two rows with the same parameter code, the **last row wins**.
- **Database:** Re-importing the same student × project × parameter will **overwrite** the previous score. A new audit log entry is created.

---

## Type 2: Self Assessments (Matrix)

**When to use:** After students self-evaluate via a form or survey exported to Excel.

**File naming:** Must contain `Self`, `x-ray`, `xray`, or `Accounting`.
> Example: `BusinessXRay_Self_Assessment.xlsx`, `Accounting_Self_Scores.xlsx`

### Sheet Structure

```
| Code | Question / Prompt          | [Student A] | [Student B] | ... |
|------|----------------------------|-------------|-------------|-----|
| C1   | How confident are you...?  | 3           | 4           | ... |
| E2   | Rate your ability to...    | 5           | 2           | ... |
```

- **Column A** must contain the parameter **Code** (`C1`–`P4`).
- **Question/Prompt column** *(optional but recommended)*: A column whose header contains `Question`, `Prompt`, or `Statement`. The text in each row is stored in `self_assessment_questions` and linked to that parameter for this upload. This allows different projects to use different question wordings.
- Student names start from the first column after code/question metadata.
- Score scale can be 1–4, 1–5, or 1–10. The system auto-detects the scale from the max value found; always verify and correct in the wizard.

### Wizard Settings

| Setting | Value |
| :--- | :--- |
| Min Raw Score | Usually `1` |
| Max Raw Score | `4`, `5`, or `10` depending on the form used |
| Associated Project | The project being self-assessed |

---

## Type 3: Peer Feedback (Flat / Transactional)

**When to use:** After a peer feedback session where students rated each other across 5 metrics.

**File naming:** Must contain `Peer`.
> Example: `Kickstart_PeerFeedback_Oct25.xlsx`

### Sheet Structure

```
| Recipient Name | Giver Name | Quality of Work | Initiative | Communication | Collaboration | Growth Mindset |
|----------------|------------|-----------------|------------|---------------|---------------|----------------|
| Aadi Gujar     | Riya Shah  | 4               | 3          | 5             | 4             | 3              |
```

**Required columns** (header keywords used for detection, case-insensitive):

| Column | Detection Keywords |
| :--- | :--- |
| Recipient | `recipient`, `to:` |
| Giver | `giver`, `your name`, `from:` |
| Quality of Work | `quality` |
| Initiative / Ownership | `initiative` |
| Communication | `communication` |
| Collaboration | `collaboration` |
| Growth Mindset | `growth` |

- Both `Recipient Name` and `Giver Name` are matched against the student roster via canonical name or aliases.
- Scores must be on a **1–5 scale**. They are normalized to 1–10 at import.
- The `Project` column in your sheet is **not used** for routing — the project is selected in the wizard.

### Deduplication

- The database enforces a unique constraint on `(recipient_id, giver_id, project_id)`. Re-importing the same pair will **overwrite** the previous scores.

---

## Type 4: Term / Metric Reports

**When to use:** To record term-level engagement metrics (CBP sessions attended, Conflexion score, BoW score) for each student.

**File naming:** Must contain `Term`.
> Example: `Term2_MetricReport_Jan26.xlsx`

### Sheet Structure

```
| Student Name    | Value |
|-----------------|-------|
| Aadi Gujar      | 12    |
| Priya Mehta     | 8     |
```

Or alternatively with a metric column (when uploading multiple metrics at once per-row):

```
| Student Name    | Metric     | Value |
|-----------------|------------|-------|
| Aadi Gujar      | CBP        | 12    |
| Aadi Gujar      | Conflexion | 3     |
```

**Required columns** (header keywords, case-insensitive):

| Column | Detection Keywords |
| :--- | :--- |
| Student Name | `student`, `name` |
| Value / Score | `value`, `score`, `count` |
| Metric *(optional)* | `metric` |

- **Target Metric must be selected in the wizard** (CBP, Conflexion, or BoW). If your file has a metric column, the wizard still requires you to choose the primary metric for this upload session.
- Values are stored **as-is** (no normalization). They represent raw counts or scores.
- A **Project is not required** for Term Reports.

### Deduplication

- Uniqueness is enforced on `(student_id, metric_id, assessment_log_id)`. Each upload creates a new `assessment_log`, so re-importing creates a new record. The dashboard uses the **most recent** log entry for display.

---

## Type 5: Mentor Notes

**When to use:** To bulk-import qualitative written feedback from mentors for one or more students. Can optionally be linked to a specific project, or left as "General Guidance" with no project association.

**File naming:** Must contain `Notes` or `note`.
> Example: `SDP_MentorNotes_Mar26.xlsx`, `General_notes_Mar26.xlsx`

### Sheet Structure

```
| Student Name | Mentor     | Date       | Notes                                     |
|--------------|------------|------------|-------------------------------------------|
| Aadi Gujar   | Shiv Kumar | 2026-03-10 | Strong commercial awareness, needs to ... |
| Priya Mehta  | Shiv Kumar | 2026-03-10 | Excellent initiative shown during...      |
```

**Required columns** (header keywords, case-insensitive):

| Column | Detection Keywords | Notes |
| :--- | :--- | :--- |
| **Student Name** | `student`, `name` | **Required.** Matched against roster. |
| **Notes / Feedback** | `note`, `notes`, `feedback` | **Required.** The free-text feedback text. |
| Mentor / Created By | `mentor` | Optional. Stored in `created_by`. Defaults to the importing user. |
| Date | `date` | Optional. Per-note date. Falls back to session's Assessment Date if missing. Supports both `YYYY-MM-DD` and raw Excel serial number formats. |

- Each row becomes one `mentor_notes` record with `note_type = 'general'`.
- If a project is selected, notes are linked to that project. If no project is selected, `project_id` is stored as `NULL` ("General Guidance").
- General notes appear in **every** project report for that student, clearly labeled as "General Guidance".
- Long notes (multi-sentence or multi-paragraph) are fully preserved; there is no character limit.

### Wizard Settings

| Setting | Value |
| :--- | :--- |
| Associated Project | *(Optional)* The project these notes relate to. Leave blank for general notes not tied to a module. |
| Assessment Date | Used as fallback date for any rows missing a `Date` column |

### Deduplication

- There is **no unique constraint** on mentor notes — the same student can have multiple notes per project (e.g., from multiple sessions). Each import creates new records.
- To avoid accidental duplication, the wizard will warn you if an `assessment_log` for the same project/cohort/type already exists.

---

## Student Name Matching (All Types)

The engine uses a **fuzzy-tolerant alias system** to match names from your file to the database.

1. **Normalization** — Names are trimmed, lowercased, and internal whitespace is collapsed.
2. **Exact Match** — Compared against `canonical_name` in the `students` table.
3. **Alias Match** — If exact match fails, all entries in the `aliases` array for each student are checked.
4. **Skip on No Match** — Any name that cannot be matched is skipped and flagged in the "Unrecognized Students" panel in the wizard. If a correct name is being skipped, add it to the student's aliases list in the Admin → Students panel.

> **Inactive students** (`is_active = FALSE`, e.g., Madhur Kalantri) are excluded from matching even if their name appears in the file.

---

## Score Normalization

All scored data (Mentor and Self) is normalized to a **1–10 scale** at import time using linear min-max interpolation.

**Formula:**
```
normalized_score = ((raw_score - min) / (max - min)) * 9 + 1
```

| Type | Default Raw Scale | Normalized To |
| :--- | :--- | :--- |
| Mentor Assessment | 1–10 (set manually in wizard) | 1–10 |
| Self Assessment | 1–4, 1–5, or 1–10 (auto-detected) | 1–10 |
| Peer Feedback | 1–5 (fixed) | 1–10 |
| Term / Metric | N/A — stored as-is | Not normalized |
| Mentor Notes | N/A — qualitative text | Not normalized |

> If the raw scale min equals max (divide-by-zero), the raw score is passed through without normalization.

---

## Common Errors & Fixes

| Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| "No students matched" | Names in file don't match canonical names or aliases | Add aliases in Admin → Students, or fix spelling in the file |
| "No parameter codes recognized" | Column A doesn't contain codes (`C1`–`P4`) | Ensure Col A has the exact code, not a description |
| Data type detected as "unknown" | Filename has no recognized keyword | Rename file or override type in the wizard dropdown |
| Wrong scale detected | Scores happen to max out below 5 | Manually set Min/Max in the wizard before importing |
| Duplicate warning shown | Same project/cohort/type was previously imported | Review previous import logs; use "Import Anyway" only if re-importing intentionally |

---

*For the database schema that this data populates, see [`SUPABASE_SCHEMA.md`](./SUPABASE_SCHEMA.md).*
*For the system's architecture, see [`CONTEXT.md`](./CONTEXT.md).*
