# 📊 Golden Rules for Assessment Data Uploads

To ensure flawless data ingestion through the Import Wizard, all CSV or Excel templates must adhere strictly to the following format rules:

### 1. 🗂️ One File per Assessment Event
**Rule:** Only upload exactly one flat dataset at a time based on the specific event you are assessing.
* **Why?** The Import Wizard dropdowns (Program, Term, Date) apply exactly one set of metadata to the entire file. If you mix "Kickstart Mentor" and "Kickstart Self" into the same spreadsheet, the upload will fail or mislabel the origin.
* **Example:** `Kickstart_Mentor_Data.xlsx` & `Kickstart_Self_Data.xlsx` are uploaded separately.

### 2. 🧢 First Row is the Header
**Rule:** The very first row (Row 1) of your sheet must contain your column titles.
* **Why?** The backend parser scans downward. If it hits merged title rows (like "Assessment Matrix 2026") taking up Row 1 and 2, it might misread the actual column bindings. Keep it clean.

### 3. ⚓ Column A is the Anchor (The Code)
**Rule:** The leftmost column where data begins must contain the alphanumeric parameter **Code** (e.g., `C1`, `C2`, `E4`).
* **Why?** The engine relies exclusively on this Code column to identify which metric a student's score belongs to. Do not use the full parameter text (e.g., "1. Financial Literacy") as the anchor.

### 4. 🧑‍🎓 Student Names as Headers
**Rule:** Write the students' names as the horizontal column headers (starting anywhere to the right of the Code column).
* **Why?** The system will automatically iterate over these headers and run "alias checks" against your master database to securely link the score column beneath it to the correct profile.

### 5. ⏭️ Ignore the Middle
**Rule:** You are free to place any helper text between the `Code` column and the first Student column.
* **Why?** You can safely add columns like "Domain", "Parameter Description", or "I-Statement Prompt". The data engine is smart enough to step over columns that do not match known student aliases.

---

## Example Expected Format

| Code | Domain | Helper Text / Question | Jane Doe | John Smith |
| :--- | :--- | :--- | :--- | :--- |
| **C1** | Commercial | Could I explain our profit/loss... | 3.0 | 4.0 |
| **C2** | Commercial | If I had ₹1,000 more... | 2.5 | 3.5 |
| **E1** | Entrepreneurial | Am I willing to take calculated risks... | 4.0 | 5.0 |

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

*Following these rules guarantees your data will be safely, cleanly, and permanently ingested into the platform.*
