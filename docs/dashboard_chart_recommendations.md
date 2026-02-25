# Educator's Recommendation: Student Dashboard Visualizations

As an educator and instructional designer, the primary goal of this dashboard is not merely to display data, but to **drive metacognition (self-awareness), facilitate coaching conversations, and show growth.** 

Currently, the dashboard acts as a "gradebook." We need to shift it to a **"growth profile."**

Here is my systematic recommendation for the charts and layout we should implement for each student's dashboard, based on the Year 1 Assessment data structure (Mentor vs. Self vs. Peer).

---

## 1. The "Self-Awareness Gap" Chart
**Current State:** A grouped bar chart comparing Self vs. Mentor averages across the 6 domains.
**Recommendation:** A **Diverging Bar Chart** (or a clean Bullet Chart).
*   **The Educator's Why:** The most powerful conversation a mentor can have with a student is about the gap in perception. Overconfidence (Self 9, Mentor 5) needs grounding; Impostor Syndrome (Self 5, Mentor 9) needs encouragement.
*   **Execution:** Center the axis at 0. Show the Mentor score as the baseline. The bar stretches Left (negative) if the student undervalued themselves, and stretches Right (positive) if they overvalued themselves. This immediately highlights blind spots.

## 2. The Learning Trajectory (Progression Over Time)
**Current State:** A single line chart averaging *all* mentor scores over the project sequence.
**Recommendation:** An **Interactive Multi-Line Chart (By Domain)**.
*   **The Educator's Why:** Averaging all 6 domains into one line hides the nuances of learning. A student might be rapidly grasping "Professional Readiness" while flatlining in "Commercial Readiness." 
*   **Execution:** A chronological line chart (X-axis: Kickstart → Marketing/Legacy → Business X-Ray → SDP). Give it 6 lines (one for each domain). Add toggle switches so students/mentors can isolate specific domains (e.g., "Let's just look at your Innovation Readiness over the term").

## 3. The Competency Mastery Matrix (Drill Down)
**Current State:** Text grids showing the latest numerical score for the 24 sub-parameters.
**Recommendation:** A **Skill Heatmap (Grid)**.
*   **The Educator's Why:** Numbers in a list are hard to scan. We need to instantly see what parameters are mastered vs. developing.
*   **Execution:** Y-Axis: The 24 parameters (grouped by Domain). X-Axis: The chronologic projects. Cells are color-coded (e.g., Red < 4, Yellow 4-7, Green 8-10). This visually reveals exactly *when* a concept "clicked" for a student, or if there is chronic underperformance in a specific area like "Financial Literacy" across multiple projects.

## 4. The Team Reputation Model (Peer Feedback)
**Current State:** Simple text boxes showing numerical averages per project.
**Recommendation:** **Peer Interaction Radar Chart** overlaying the **Cohort Average**.
*   **The Educator's Why:** Peer feedback dictates a student's "team reputation" (Communication, Collaboration, Initiative). A radar chart is actually scientifically appropriate here to show their "personality shape" as a team member.
*   **Execution:** A 5-axis radar chart for the 5 peer metrics. Crucially, overlay the *Cohort Average* on top of their personal shape. This helps them understand: "Am I collaborating better or worse than the average Year 1 student?"

## 5. Coaching Hub (Term Tracking + Notes)
**Current State:** Numbers in boxes.
**Recommendation:** **Visual Milestones**.
*   **The Educator's Why:** CBP (Coaching) and Conflexion are milestones. 
*   **Execution:** Display these like "unlocked achievements" or a progress bar towards the term requirement.

---

### Suggested Dashboard Flow (Top to Bottom)
1.  **Overview Cards:** Current overarching stats (CBP, Conflexion, BOW) and quick summary.
2.  **The Growth Trajectory:** The Multi-line chart (shows *how* they got here).
3.  **The Self-Awareness Gap:** Diverging bars (shows *where* their blind spots are today).
4.  **Peer Reputation:** Radar chart vs Cohort (shows *who* they are in a team).
5.  **Granular Heatmap:** The 24 parameters (for deep-dive mentor coaching sessions).

### Next Steps:
If you agree with this pedagogical direction, I can begin building these specific interactive charts using **Recharts** and implementing them on the `dashboard/[studentId]/page.tsx`. Which chart would you like me to tackle first?
