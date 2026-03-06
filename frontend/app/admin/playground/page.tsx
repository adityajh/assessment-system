import PlaygroundClientPage from './PlaygroundClientPage';
import { createClient } from '@/lib/supabase/server';
import { getPlaygroundData } from '@/lib/supabase/queries/assessments';
import { getStudents } from '@/lib/supabase/queries/students';

export const metadata = {
    title: 'Component Playground - Admin Panel',
};

export default async function PlaygroundPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
    const { studentId } = await searchParams;
    let gapData = null;
    let heatmapData = null;
    let consolidatedHeatmapData = null;
    let trajectoryData = null;
    let kpiData = null;
    let peerRatingData = null;
    let peerRatingProjects: string[] = [];
    let projectDomainScores = null;
    let heatmapProjects: string[] = [];
    let topStrengths: any[] = [];
    let growthAreas: any[] = [];
    let topDomainStrengths: any[] = [];
    let growthDomainAreas: any[] = [];
    let distributionData: any[] = [];
    let studentName = "Mock Student";
    let peerStackedData: any[] = [];
    let scatterData: any[] = [];
    let engagementDistributionData: any[] = [];
    let peerStackedByParamData: any[] = [];
    let peerStackedByParamProjects: string[] = [];
    let studentsList: any[] = [];
    let activeStudentId = studentId || "";

    try {
        const supabase = await createClient();
        const data = await getPlaygroundData(supabase, studentId);
        studentsList = await getStudents(supabase);

        activeStudentId = data.student.id;
        studentName = data.student.canonical_name;

        // 1. BUILD GAP DATA (Domain Averages)
        const domainMap = new Map();
        data.domains.forEach(d => domainMap.set(d.id, { name: d.name, mentorSum: 0, mentorCount: 0, selfSum: 0, selfCount: 0 }));

        data.assessments.forEach(a => {
            if (a.normalized_score === null) return;
            const param = data.parameters.find(p => p.id === a.parameter_id);
            if (!param) return;
            const domainEntry = domainMap.get(param.domain_id);
            if (!domainEntry) return;

            if (a.assessment_type === 'mentor') {
                domainEntry.mentorSum += a.normalized_score;
                domainEntry.mentorCount++;
            } else {
                domainEntry.selfSum += a.normalized_score;
                domainEntry.selfCount++;
            }
        });

        gapData = Array.from(domainMap.values()).map(d => {
            const mentor = d.mentorCount > 0 ? Number((d.mentorSum / d.mentorCount).toFixed(1)) : 0;
            const self = d.selfCount > 0 ? Number((d.selfSum / d.selfCount).toFixed(1)) : 0;
            const deltaPercent = mentor > 0 ? ((self - mentor) / mentor) * 100 : 0;
            return {
                name: d.name,
                mentor,
                self,
                range: mentor <= self ? [mentor, self] : [self, mentor],
                delta: Number(deltaPercent.toFixed(1))
            };
        });

        // 2. BUILD HEATMAP DATA (Parameters x Projects)
        const projectNames: string[] = data.projects.map(p => p.name);
        heatmapProjects = projectNames;

        heatmapData = data.parameters.map(param => {
            const domain = data.domains.find(d => d.id === param.domain_id)?.name || '';
            const scores: Record<string, number | null> = {};

            data.projects.forEach(proj => {
                const assessment = data.assessments.find(a => a.parameter_id === param.id && a.project_id === proj.id && a.assessment_type === 'mentor');
                scores[proj.name] = assessment?.normalized_score ? Number(assessment.normalized_score.toFixed(1)) : null;
            });

            return { parameter: param.name, domain, scores };
        });

        // 3. BUILD TRAJECTORY DATA (Project Averages)
        trajectoryData = data.projects.map(proj => {
            const mentorAsses = data.assessments.filter(a => a.project_id === proj.id && a.assessment_type === 'mentor' && a.normalized_score !== null);
            const selfAsses = data.assessments.filter(a => a.project_id === proj.id && a.assessment_type === 'self' && a.normalized_score !== null);

            const mentorAvg = mentorAsses.length > 0 ? mentorAsses.reduce((sum, a) => sum + a.normalized_score!, 0) / mentorAsses.length : null;
            const selfAvg = selfAsses.length > 0 ? selfAsses.reduce((sum, a) => sum + a.normalized_score!, 0) / selfAsses.length : null;

            return {
                project: proj.name,
                mentor: mentorAvg !== null ? Number(mentorAvg.toFixed(1)) : null,
                self: selfAvg !== null ? Number(selfAvg.toFixed(1)) : null
            };
        });

        // 4. BUILD CONSOLIDATED HEATMAP DATA (Domains x Projects)
        consolidatedHeatmapData = data.domains.map(domain => {
            const scores: Record<string, number | null> = {};
            data.projects.forEach(proj => {
                const domainParams = data.parameters.filter(p => p.domain_id === domain.id).map(p => p.id);
                const asses = data.assessments.filter(a => domainParams.includes(a.parameter_id) && a.project_id === proj.id && a.assessment_type === 'mentor' && a.normalized_score !== null);

                if (asses.length > 0) {
                    const avg = asses.reduce((sum, a) => sum + a.normalized_score!, 0) / asses.length;
                    scores[proj.name] = Number(avg.toFixed(1));
                } else {
                    scores[proj.name] = null;
                }
            });
            return { domain: domain.name, scores };
        });

        // 5. BUILD KPI DATA (Dashboard view)
        const uniqueProjectsAssessed = new Set(data.assessments.map(a => a.project_id)).size;

        // Count active student's self assessments
        const selfAssessmentsCount = data.assessments.filter(a => a.assessment_type === 'self' && a.normalized_score !== null).length;

        kpiData = {
            projectsCount: `${uniqueProjectsAssessed}/${data.projects.length}`,
            cbpCount: data.termTracking?.cbp_count || 0,
            conflexionCount: data.termTracking?.conflexion_count || 0,
            bowScore: data.termTracking?.bow_score !== undefined && data.termTracking?.bow_score !== null ? Number(data.termTracking.bow_score).toFixed(2) : "0.00",
            selfAssessmentsCount
        };

        // Calculate Engagement Score 2.0 (out of 100)
        // Max targets -> CBP: 5, Conflexion: 5, BoW: 10, Self Assess: 15
        const cbpVal = Math.min(kpiData.cbpCount, 5);
        const confVal = Math.min(kpiData.conflexionCount, 5);
        const bowVal = kpiData.bowScore ? Math.min(Number(kpiData.bowScore), 10) : 0;
        const saVal = Math.min(selfAssessmentsCount, 15);

        // Weights: CBP (25%), Conflexion (25%), BoW (25%), Assessments (25%)
        (kpiData as any).engagementScore = Math.round((cbpVal / 5) * 25 + (confVal / 5) * 25 + (bowVal / 10) * 25 + (saVal / 15) * 25);

        // Badges
        (kpiData as any).hasConsistencyBadge = (kpiData.cbpCount >= 4 && kpiData.conflexionCount >= 4);
        (kpiData as any).hasBreadthBadge = (kpiData.cbpCount >= 5 && kpiData.conflexionCount >= 5 && Number(kpiData.bowScore) >= 8 && selfAssessmentsCount >= 10);

        // Cohort Engagement Data for Dot Plot
        const selfAssessMap: Record<string, number> = {};
        if ((data as any).allSelfAssessments) {
            (data as any).allSelfAssessments.forEach((s: any) => {
                selfAssessMap[s.student_id] = (selfAssessMap[s.student_id] || 0) + 1;
            });
        }

        if (data.allTermTracking) {
            data.allTermTracking.forEach(t => {
                const tvCbp = Math.min(t.cbp_count || 0, 5);
                const tvConf = Math.min(t.conflexion_count || 0, 5);
                const tvBow = t.bow_score ? Math.min(Number(t.bow_score), 10) : 0;
                const tvSa = Math.min(selfAssessMap[t.student_id] || 0, 15);
                const score = Math.round((tvCbp / 5) * 25 + (tvConf / 5) * 25 + (tvBow / 10) * 25 + (tvSa / 15) * 25);

                engagementDistributionData.push({
                    studentId: t.student_id,
                    score: score,
                    yAxis: 0, // Constant Y for 1D dot plot
                    isCurrentStudent: t.student_id === activeStudentId
                });
            });
            engagementDistributionData.sort((a, b) => a.score - b.score);
        }



        // 6. BUILD PEER RATING DATA (Radar Chart)
        const peerCategories = [
            { key: 'quality_of_work', label: 'Quality of Work' },
            { key: 'initiative_ownership', label: 'Initiative & Ownership' },
            { key: 'communication', label: 'Communication' },
            { key: 'collaboration', label: 'Collaboration' },
            { key: 'growth_mindset', label: 'Growth Mindset' }
        ];

        const radarDataMap: Record<string, any> = {};
        peerCategories.forEach(c => {
            radarDataMap[c.key] = { subject: c.label };
        });

        data.projects.forEach(proj => {
            const projectFeedback = data.peerFeedback.filter(f => f.project_id === proj.id);
            if (projectFeedback.length > 0) {
                peerRatingProjects.push(proj.name);
                peerCategories.forEach(c => {
                    const scores = projectFeedback.map(f => f[c.key as keyof typeof f]).filter(s => s !== null && s !== undefined) as number[];
                    const avg = scores.length > 0 ? (scores.reduce((sum, s) => sum + s, 0) / scores.length) : null;
                    if (avg !== null) {
                        radarDataMap[c.key][proj.name] = Number(avg.toFixed(1));
                    }
                });
            }
        });

        peerRatingData = peerCategories.map(c => radarDataMap[c.key]);

        // BUILD PEER STACKED BAR DATA
        data.projects.forEach(proj => {
            const projectFeedback = data.peerFeedback.filter(f => f.project_id === proj.id);
            if (projectFeedback.length > 0) {
                const entry: any = { project: proj.name };
                peerCategories.forEach(c => {
                    const scores = projectFeedback.map(f => f[c.key as keyof typeof f]).filter(s => s !== null && s !== undefined) as number[];
                    const avg = scores.length > 0 ? (scores.reduce((sum, s) => sum + s, 0) / scores.length) : null;
                    entry[c.key] = avg !== null ? Number(avg.toFixed(1)) : 0;
                });
                peerStackedData.push(entry);
            }
        });

        // BUILD PEER STACKED BY PARAM DATA (Cohort Delta)
        peerCategories.forEach(c => {
            const entry: any = { parameter: c.label };

            // Calculate cohort average for this parameter
            const metricKey = `avg_${c.key}`;
            let cohortSum = 0;
            let cohortCount = 0;
            if (data.cohortPeerSummary) {
                data.cohortPeerSummary.forEach((member: any) => {
                    if (member[metricKey] !== null && member[metricKey] !== undefined) {
                        cohortSum += Number(member[metricKey]);
                        cohortCount++;
                    }
                });
            }
            const cohortAvg = cohortCount > 0 ? (cohortSum / cohortCount) : 0;

            data.projects.forEach(proj => {
                const projectFeedback = data.peerFeedback.filter(f => f.project_id === proj.id);
                if (projectFeedback.length > 0) {
                    const scores = projectFeedback.map(f => f[c.key as keyof typeof f]).filter(s => s !== null && s !== undefined) as number[];
                    const avg = scores.length > 0 ? (scores.reduce((sum, s) => sum + s, 0) / scores.length) : null;
                    if (avg !== null) {
                        entry[proj.name] = Number((avg - cohortAvg).toFixed(2));
                        // Ensure peerStackedByParamProjects contains proj.name
                        if (!peerStackedByParamProjects.includes(proj.name)) {
                            // We will collect them all and sort later, or just push.
                            peerStackedByParamProjects.push(proj.name);
                        }
                    }
                }
            });
            peerStackedByParamData.push(entry);
        });

        // Ensure peerStackedByParamProjects is sorted by project sequence
        peerStackedByParamProjects.sort((a, b) => {
            const projA = data.projects.find(p => p.name === a);
            const projB = data.projects.find(p => p.name === b);
            return (projA?.sequence || 0) - (projB?.sequence || 0);
        });

        // BUILD PEER VS MENTOR SCATTER DATA
        data.projects.forEach(proj => {
            const mentorAsses = data.assessments.filter(a => a.project_id === proj.id && a.assessment_type === 'mentor' && a.normalized_score !== null);
            const mentorAvg = mentorAsses.length > 0 ? mentorAsses.reduce((sum, a) => sum + a.normalized_score!, 0) / mentorAsses.length : null;

            const projectFeedback = data.peerFeedback.filter(f => f.project_id === proj.id);
            let peerAvg = null;
            if (projectFeedback.length > 0) {
                let sum = 0;
                let count = 0;
                projectFeedback.forEach(f => {
                    peerCategories.forEach(c => {
                        const score = f[c.key as keyof typeof f];
                        if (score !== null && score !== undefined) {
                            sum += Number(score);
                            count++;
                        }
                    });
                });
                peerAvg = count > 0 ? (sum / count) * 2 : null; // scale peer avg (0-5) to mentor scale (0-10)
            }

            if (mentorAvg !== null && peerAvg !== null) {
                scatterData.push({
                    project: proj.name,
                    mentor: Number(mentorAvg.toFixed(1)),
                    peer: Number(peerAvg.toFixed(1))
                });
            }
        });


        // 7. BUILD GROUPED BAR DATA
        projectDomainScores = data.projects.map(proj => {
            const categories = data.domains.map(domain => {
                const domainParams = data.parameters.filter(p => p.domain_id === domain.id).map(p => p.id);
                const mentorAsses = data.assessments.filter(a => domainParams.includes(a.parameter_id) && a.project_id === proj.id && a.assessment_type === 'mentor' && a.normalized_score !== null);
                const selfAsses = data.assessments.filter(a => domainParams.includes(a.parameter_id) && a.project_id === proj.id && a.assessment_type === 'self' && a.normalized_score !== null);

                const mentorAvg = mentorAsses.length > 0 ? mentorAsses.reduce((sum, a) => sum + a.normalized_score!, 0) / mentorAsses.length : 0;
                const selfAvg = selfAsses.length > 0 ? selfAsses.reduce((sum, a) => sum + a.normalized_score!, 0) / selfAsses.length : 0;

                return {
                    domain: domain.name,
                    mentor: mentorAsses.length > 0 ? Number(mentorAvg.toFixed(1)) : null,
                    self: selfAsses.length > 0 ? Number(selfAvg.toFixed(1)) : null
                };
            });

            return {
                project: proj.name,
                categories
            };
        });

        // 8. BUILD TOP STRENGTHS & GROWTH AREAS (Parameters)
        const paramAverages: Record<string, { sum: number, count: number, name: string, domain: string }> = {};
        data.assessments.filter(a => a.assessment_type === 'mentor' && a.normalized_score !== null).forEach(a => {
            const param = data.parameters.find(p => p.id === a.parameter_id);
            if (!param) return;
            if (!paramAverages[param.id]) {
                const domain = data.domains.find(d => d.id === param.domain_id)?.name || '';
                paramAverages[param.id] = { sum: 0, count: 0, name: param.name, domain };
            }
            paramAverages[param.id].sum += a.normalized_score!;
            paramAverages[param.id].count++;
        });

        const sortedParams = Object.values(paramAverages)
            .map(p => ({ name: p.name, domain: p.domain, score: Number((p.sum / p.count).toFixed(1)) }))
            .sort((a, b) => b.score - a.score);

        topStrengths = sortedParams.slice(0, 3);
        growthAreas = sortedParams.slice(-3).reverse();

        // 9. BUILD DISTRIBUTION CURVE DATA
        data.domains.forEach(domain => {
            const studentAverages: Record<string, { sum: number, count: number }> = {};
            data.cohortDomainScores.filter((c: any) => c.domain_name === domain.name && c.domain_score !== null).forEach((c: any) => {
                if (!studentAverages[c.student_id]) studentAverages[c.student_id] = { sum: 0, count: 0 };
                studentAverages[c.student_id].sum += Number(c.domain_score);
                studentAverages[c.student_id].count++;
            });
            const cohortAverages = Object.values(studentAverages).map(s => s.sum / s.count);
            const activeStudentAvg = studentAverages[activeStudentId] ? (studentAverages[activeStudentId].sum / studentAverages[activeStudentId].count) : null;

            const bins = Array(10).fill(0);
            cohortAverages.forEach(score => {
                const binIdx = Math.min(Math.floor(score) - 1, 9);
                if (binIdx >= 0) bins[binIdx]++;
            });

            distributionData.push({
                type: 'domain',
                name: domain.name,
                studentScore: activeStudentAvg !== null ? Number(activeStudentAvg.toFixed(1)) : null,
                cohortScores: cohortAverages,
                bins: bins.map((count, i) => ({ range: `${i + 1}-${i + 2}`, count, studentMarker: activeStudentAvg !== null && activeStudentAvg >= i + 1 && activeStudentAvg < i + 2 ? activeStudentAvg : null }))
            });
        });

        // Peer metrics
        const peerMetricsMap: Record<string, string> = {
            'avg_quality_of_work': 'Quality of Work',
            'avg_initiative_ownership': 'Initiative & Ownership',
            'avg_communication': 'Communication',
            'avg_collaboration': 'Collaboration',
            'avg_growth_mindset': 'Growth Mindset'
        };
        Object.entries(peerMetricsMap).forEach(([key, name]) => {
            const metricAverages: Record<string, { sum: number, count: number }> = {};
            data.cohortPeerSummary.forEach((c: any) => {
                const score = c[key];
                if (score !== null && score !== undefined) {
                    if (!metricAverages[c.student_id]) metricAverages[c.student_id] = { sum: 0, count: 0 };
                    metricAverages[c.student_id].sum += Number(score);
                    metricAverages[c.student_id].count++;
                }
            });
            const cohortAverages = Object.values(metricAverages).map(s => s.sum / s.count);
            const activeStudentAvg = metricAverages[activeStudentId] ? (metricAverages[activeStudentId].sum / metricAverages[activeStudentId].count) : null;

            const bins = Array(5).fill(0);
            cohortAverages.forEach(score => {
                const binIdx = Math.min(Math.floor(score) - 1, 4);
                if (binIdx >= 0) bins[binIdx]++;
            });

            distributionData.push({
                type: 'peer',
                name: name,
                studentScore: activeStudentAvg !== null ? Number(activeStudentAvg.toFixed(1)) : null,
                cohortScores: cohortAverages,
                bins: bins.map((count, i) => ({ range: `${i + 1}-${i + 2}`, count, studentMarker: activeStudentAvg !== null && activeStudentAvg >= i + 1 && activeStudentAvg < i + 2 ? activeStudentAvg : null }))
            });
        });

        // 10. BUILD DOMAIN-LEVEL STRENGTHS & GROWTH AREAS
        const domainAveragesList = data.domains.map(domain => {
            const domainParams = data.parameters.filter(p => p.domain_id === domain.id).map(p => p.id);
            const mentorAsses = data.assessments.filter(a => domainParams.includes(a.parameter_id) && a.assessment_type === 'mentor' && a.normalized_score !== null);

            if (mentorAsses.length > 0) {
                const avg = mentorAsses.reduce((sum, a) => sum + a.normalized_score!, 0) / mentorAsses.length;
                return { name: domain.name, score: Number(avg.toFixed(1)) };
            }
            return { name: domain.name, score: null };
        }).filter(d => d.score !== null) as { name: string, score: number }[];

        const sortedDomains = [...domainAveragesList].sort((a, b) => b.score - a.score);
        topDomainStrengths = sortedDomains.slice(0, 2);
        growthDomainAreas = sortedDomains.slice(-2).reverse();

    } catch (e) {
        console.error("Failed to load playground data", e);
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] h-full">
            <div className="flex justify-between items-center shrink-0 border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Component Playground</h2>
                    <p className="text-slate-400">Isolated testing environment. Currently showing real data for student: <span className="text-indigo-400 font-medium">{studentName}</span></p>
                </div>
            </div>

            <PlaygroundClientPage
                gapData={gapData}
                heatmapData={heatmapData}
                consolidatedHeatmapData={consolidatedHeatmapData}
                heatmapProjects={heatmapProjects}
                trajectoryData={trajectoryData}
                kpiData={kpiData}
                peerRatingData={peerRatingData}
                peerRatingProjects={peerRatingProjects}
                projectDomainScores={projectDomainScores}
                topStrengths={topStrengths}
                growthAreas={growthAreas}
                topDomainStrengths={topDomainStrengths}
                growthDomainAreas={growthDomainAreas}
                distributionData={distributionData}
                scatterData={scatterData}
                peerStackedData={peerStackedData}
                peerStackedByParamData={peerStackedByParamData}
                peerStackedByParamProjects={peerStackedByParamProjects}
                engagementDistributionData={engagementDistributionData}
                students={studentsList}
                studentId={activeStudentId}
            />
        </div>
    );
}
