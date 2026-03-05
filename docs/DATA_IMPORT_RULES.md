# ⚙️ Import Engine Technical Specification

This document details the logic used by the Assessment System to parse, recognize, deduplicate, and normalize data during the import process.

## 1. 🏷️ Discovery & Data Type Detection

The system uses the filename as the primary signal for data type detection during the initial upload.

| Keyword in Filename | Target Data Type | Format Type |
| :--- | :--- | :--- |
| **"Self"** | Student Self-Assessments | Matrix |
| **"Peer"** | Peer Feedback Matrices | Flat (Transactional) |
| **"Term"** | Term Tracking (CBP/Conflexion/BOW) | Flat (Value-Key) |
| **"Notes"** | Mentor Qualitative Notes | Flat (Textual) |
| *No keyword* | Mentor Assessments | Matrix |

## 2. 🧑‍🎓 Student Recognition Logic

The engine uses a fuzzy-tolerant alias system to link spreadsheet columns/rows to database IDs.

1.  **Normalization**: All names are trimmed, lowercased, and internal whitespace is collapsed.
2.  **Exact Matching**: Compares the cell against the `canonical_name` in the `students` table.
3.  **Alias Matching**: If exact matching fails, it iterates through the `aliases` JSON array for each student.
4.  **Safety**: Any column header or cell that does not match a canonical name or known alias is automatically skipped, allowing helper columns (like "Parameter Description") to exist without breaking the import.

## 3. 📉 Extraction Logic

### Matrix Format (Mentor / Self)
- **Anchor**: Column A must contain the alphanumeric parameter **Code** (e.g., `C1`, `E4`).
- **Headers**: Student names start from Column B onwards.
- **Self-Assessment Question**: If a column named **"Question"** or **"Prompt"** is found, the engine extracts the question text and maps it to the specific parameter for that import event.

### Flat Format (Peer Feedback)
- The engine scans the header row for keywords to map transactional data:
    - **Recipient**: Contains `recipient` or `to:`.
    - **Giver**: Contains `giver`, `your name`, or `from:`.
    - **Metrics**: Keywords like `quality`, `initiative`, `communication`, `collaboration`, `growth` are used to map scores to the 5 peer metrics.

### Flat Format (Term Tracking)
- **Target Metric**: For "Term" data types, the user must select a **Target Metric** (CBP, Conflexion, or BoW) during the import process. 
- **Mapping**: The values in the primary data column are mapped to the selected metric in the `metric_tracking` table. Multiple imports of different metrics can be performed against the same Term Report file if it contains multiple columns.

## 4. 🧹 Deduplication Policy

The system handles collisions at two levels to ensure data integrity without requiring manual deletion.

### Internal Collision (Within the same file)
- **Rule**: **Last Row Wins**.
- If a student has multiple rows for the same parameter/metric within the same file, or if multiple sheets are uploaded, the engine keeps only the last occurrence encountered during the scan.
- *Note: This replaces legacy "averaging" logic.*

### Database Collision (Historical Overwrites)
- **Rule**: **Upsert (Update or Insert)**.
- The database enforces a unique constraint on `(student_id, project_id, parameter_id, assessment_type)`.
- If you re-import data for the same project/student, the new record will **overwrite** the old one, but it will be linked to a new `assessment_log_id` for auditing.

## 5. 📏 Normalization Engine

All scores are standardized to a 10-point scale for comparison using **Linear Min-Max Interpolation**.

- **Formula**: `normalized_score = ((raw_score - min) / (max - min)) * 9 + 1`
- **Scale Sources**:
    - **Mentor/Self**: The user must explicitly set the `rawScaleMin` and `rawScaleMax` in the UI during import (e.g., 1 to 4).
    - **Peer**: Defaults to 1 to 5 if not specified.
- **Inference**: If a calculation results in a `NaN` or divide-by-zero (e.g., `max === min`), the raw score is passed through without normalization.

---

*Adherence to these technical patterns ensures that data correctly propagates from Excel/CSV to the student dashboard visualisations.*
