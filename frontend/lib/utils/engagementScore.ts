/**
 * Canonical engagement score calculation.
 * Used by BOTH the Program Dashboard and the individual Student Dashboard
 * to guarantee identical zone assignments and relative positioning.
 */

export interface StudentEngagementInput {
    studentId: string;
    cbpCount: number;
    conflexionCount: number;
    bowScore: number;
    selfAssessmentsCount: number;
}

export interface StudentEngagementResult {
    studentId: string;
    rawScore: number;       // 0-100, absolute % against cohort top performer
    relativeScore: number;  // 0-100, Z-score scaled position within cohort
    zone: 'Syncing' | 'Connecting' | 'Engaging' | 'Leading';
    zoneColor: string;      // Tailwind bg class
    zoneDotColor: string;   // Tailwind bg class for dot indicators
}

export function getZone(relativeScore: number): StudentEngagementResult['zone'] {
    if (relativeScore < 25) return 'Syncing';
    if (relativeScore < 50) return 'Connecting';
    if (relativeScore < 75) return 'Engaging';
    return 'Leading';
}

export function getZoneColor(zone: StudentEngagementResult['zone']): string {
    switch (zone) {
        case 'Syncing':    return 'bg-rose-500';
        case 'Connecting': return 'bg-amber-500';
        case 'Engaging':   return 'bg-emerald-500';
        case 'Leading':    return 'bg-sky-500';
    }
}

export function getBadgeColor(zone: StudentEngagementResult['zone']): { text: string; bg: string } {
    switch (zone) {
        case 'Syncing':    return { text: 'text-rose-600',    bg: 'bg-rose-100' };
        case 'Connecting': return { text: 'text-amber-600',   bg: 'bg-amber-100' };
        case 'Engaging':   return { text: 'text-emerald-600', bg: 'bg-emerald-100' };
        case 'Leading':    return { text: 'text-sky-600',     bg: 'bg-sky-100' };
    }
}

/**
 * Given a list of students in the SAME cohort, calculates each student's
 * raw and relative engagement scores.
 *
 * Raw Score: weighted average across 4 pillars, normalised against the
 *            cohort's top performer in each pillar.
 *
 * Relative Score: Z-score of the raw score, scaled to a 0-100 range
 *                 centred at 62.5 (average student → 62.5).
 */
export function calculateCohortEngagement(
    students: StudentEngagementInput[]
): Map<string, StudentEngagementResult> {
    const results = new Map<string, StudentEngagementResult>();
    if (students.length === 0) return results;

    // 1. Determine cohort maximums for normalisation
    const maxCBP  = Math.max(...students.map(s => s.cbpCount), 1);
    const maxConf = Math.max(...students.map(s => s.conflexionCount), 1);
    const maxBow  = Math.max(10, ...students.map(s => s.bowScore));
    const maxSA   = Math.max(...students.map(s => s.selfAssessmentsCount), 1);

    // 2. Compute a raw score (0-100) for each student
    const rawScores: { studentId: string; raw: number }[] = students.map(s => {
        const cbpNorm  = Math.min(s.cbpCount, maxCBP)  / maxCBP;
        const confNorm = Math.min(s.conflexionCount, maxConf) / maxConf;
        const bowNorm  = Math.min(s.bowScore, maxBow)  / maxBow;
        const saNorm   = Math.min(s.selfAssessmentsCount, maxSA) / maxSA;

        const raw = Math.round((cbpNorm + confNorm + bowNorm + saNorm) * 25);
        return { studentId: s.studentId, raw };
    });

    // 3. Z-score scaling: centre at 62.5, spread of ±25 per SD
    const n    = rawScores.length;
    const mean = rawScores.reduce((sum, s) => sum + s.raw, 0) / n;
    const variance = rawScores.reduce((sum, s) => sum + Math.pow(s.raw - mean, 2), 0) / Math.max(n - 1, 1);
    const sd   = Math.sqrt(variance) || 1;

    for (const { studentId, raw } of rawScores) {
        const zScore = (raw - mean) / sd;
        const relativeScore = Number(Math.max(2, Math.min(98, (zScore * 25) + 62.5)).toFixed(1));
        const zone = getZone(relativeScore);

        results.set(studentId, {
            studentId,
            rawScore: raw,
            relativeScore,
            zone,
            zoneColor: getZoneColor(zone),
            zoneDotColor: getZoneColor(zone),
        });
    }

    return results;
}
