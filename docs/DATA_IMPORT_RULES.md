# 📊 Golden Rules for Assessment Data Uploads

To ensure flawless data ingestion through the Import Wizard, all CSV or Excel files must follow these rules:

### 0. 🏷️ File Naming Nomenclature
**CRITICAL:** The Import Wizard uses the filename to automatically detect the **Data Type**. Your filename **MUST** contain one of the following keywords:
*   **"Self"** → For Student Self-Assessments
*   **"Peer"** → For Peer Feedback Matrices
*   **"Term"** → For Term Tracking (CBP/Conflexion/BOW)
*   **"Notes"** → For Mentor Qualitative Notes
*   *(No keyword defaults to Mentor Assessments)*

### 1. 🗂️ One File per Assessment Event
**Rule:** Only upload exactly one flat dataset at a time.
* **Why?** The Import Wizard applies a single set of metadata (Project, Date, Cohort) to the entire file.
* **Manual Range:** If your file contains scores (Self/Mentor), you will be asked to manually enter the **Raw Score Range** (e.g., 1 to 5, or 1 to 10) in the Wizard to ensure correct normalization.

### 2. 🧢 First Row is the Header
**Rule:** The very first row (Row 1) of your sheet must contain your column titles.
* **Why?** The backend parser scans downward. If it hits merged title rows (like "Assessment Matrix 2026") taking up Row 1 and 2, it might misread the actual column bindings. Keep it clean.

### 3. ⚓ Column A is the Anchor (The Code)
**Rule:** For **Mentor** and **Self** assessments, the leftmost column (Column A) must contain the alphanumeric parameter **Code** (e.g., `C1`, `E4`).
* **Special Rule for Self-Assessments:** You **MUST** include a column named exactly **"Question"** or **"Prompt"** containing the text of the self-reflection prompt. This is used to map responses to the correct readiness parameters.

### 4. 🧑‍🎓 Student Names as Headers
**Rule:** For **Mentor** and **Self** assessments, write the students' names as the horizontal column headers (starting anywhere to the right of the Code column).
* **Why?** The system will automatically iterate over these headers and run "alias checks" against your master database to securely link the score column beneath it to the correct profile.

### 5. ⏭️ Ignore the Middle
**Rule:** You are free to place any helper text between the `Code` column and the first Student column.
* **Why?** You can safely add columns like "Domain", "Parameter Description", or "I-Statement Prompt". The data engine is smart enough to step over columns that do not match known student aliases.

---

## Example Expected Format (Self/Mentor)

| Code | Question | Domain | Jane Doe | John Smith |
| :--- | :--- | :--- | :--- | :--- |
| **C1** | I can interpret financial... | Commercial | 3.0 | 4.0 |
| **C2** | I correctly applied... | Commercial | 2.5 | 3.5 |
| **E1** | I identified trends... | Entrepreneurial | 4.0 | 5.0 |

---

## 2. Peer Feedback Format
**Rule:** Peer feedback is processed differently. It is a "flat" or "transactional" format where each row is a single feedback instance between two students.

### Required Header Columns
Your header row must contain columns with words that match these specific keywords (case-insensitive):
1. **Recipient Name:** The column header must contain `recipient` or `to:`. This is the student receiving feedback.
2. **Giver Name:** The column header must contain `giver`, `your name`, or `from:`. This is the student giving feedback.
3. **Project Name (Optional but Recommended):** The header must contain `project`. If left blank, the wizard's dropdown selection will be used.
4. **Metrics:** You must have columns containing the following keywords to map to the 5 standard peer metrics:
   * `quality` (maps to Quality of Work)
   * `initiative` or `ownership` (maps to Initiative & Ownership)
   * `communication` (maps to Communication)
   * `collaboration` (maps to Collaboration)
   * `growth` (maps to Growth Mindset)

### Example Expected Format (Peer Feedback)

| Timestamp | Recipient Name | Your Name (Giver) | Project | Quality of Work | Communication | Collaboration |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 10/24 | Jane Doe | John Smith | SDP | 4 | 5 | 5 |
| 10/24 | John Smith | Jane Doe | SDP | 5 | 4 | 3 |

---

## 3. Term Report Format
**Rule:** Term reports track single high-level metrics for students. It expects a row-by-row flat structure mapping a student to a specific metric name and score.

### Required Header Columns
Your header row must contain columns that match these keywords:
1. **Student Name:** Header must contain `student` or `name`.
2. **Metric Type:** Header must contain `metric` (and not 'value'). Accepted values in rows below this column: `cbp`, `conflexion`, `bow`.
3. **Value:** Header must contain `value`, `score`, or `count`.

### Example Expected Format (Term Report)

| Sr. | Student Name | Metric | Value |
| :--- | :--- | :--- | :--- |
| 1 | Jane Doe | cbp | 4 |
| 2 | Jane Doe | bow | 3.5 |
| 3 | John Smith | conflexion | 12 |

---

## 4. Mentor Notes Format
**Rule:** For bulk importing qualitative free-text feedback from mentors to students. If multiple rows exist for the same student (from the same or different mentors), the parser will intelligently combine them into a single comprehensive note.

### Required Header Columns
Your header row must contain columns that match these keywords:
1. **Student Name:** Header must contain `student` or `name`.
2. **Mentor Name:** Header must contain `mentor`.
3. **Notes:** Header must contain `note`.

> **Note on Projects:** Project association is done via the "Associated Project" dropdown in the Import Wizard UI, not in the spreadsheet itself. If left blank, the notes will be saved as "General (No Project)".

### Example Expected Format (Mentor Notes)

| Sr. | Student Name | Mentor | Notes |
| :--- | :--- | :--- | :--- |
| 1 | Jane Doe | Sharjeel | Jane showed excellent leadership today. |
| 2 | Jane Doe | Aditya | She needs to speak up more in large groups. |

*Following these rules guarantees your data will be safely, cleanly, and permanently ingested into the platform.*
