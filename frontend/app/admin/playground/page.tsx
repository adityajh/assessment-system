import PlaygroundClientPage from './PlaygroundClientPage';
import { createClient } from '@/lib/supabase/server';
import { getPlaygroundData } from '@/lib/supabase/queries/assessments';
import { getStudents } from '@/lib/supabase/queries/students';

export const metadata = {
    title: 'Component Playground - Admin Panel',
};

export default async function PlaygroundPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
    const { studentId } = await searchParams;
    let mockData = null;
    let gapData = null;
    let heatmapData = null;
    let consolidatedHeatmapData = null;
    let trajectoryData = null;
    let kpiData = null;
    let peerRatingData = null;
    let peerRatingProjects: string[] = [];
    let projectDomainScores = null;
    let heatmapProjects: string[] = [];
    let studentName = "Mock Student";
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
            return {
                name: d.name,
                mentor,
                self,
                delta: Number((mentor - self).toFixed(1))
            };
        });

        // 2. BUILD HEATMAP DATA (Parameters x Projects)
        const projectNames: string[] = data.projects.map(p => p.name);
        heatmapProjects = projectNames;

        heatmapData = data.parameters.map(param => {
            const domain = data.domains.find(d => d.id === param.domain_id)?.name || '';
            const scores: Record<string, number | null> = {};

            data.projects.forEach(proj => {
                // For heatmap, we usually want mentor scores as the source of truth for mastery
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
        kpiData = {
            projectsCount: `${uniqueProjectsAssessed}/${data.projects.length}`,
            cbpCount: data.termTracking?.cbp_count || 0,
            conflexionCount: data.termTracking?.conflexion_count || 0,
            bowScore: data.termTracking?.bow_score !== undefined && data.termTracking?.bow_score !== null ? Number(data.termTracking.bow_score).toFixed(2) : "0.00"
        };

        // 6. BUILD PEER RATING DATA (Radar Chart: Questions as axes, Projects as lines)
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

        // 7. BUILD GROUPED BAR DATA (Self vs Mentor by domain across projects)
        projectDomainScores = data.projects.map(proj => {
            const categories = data.domains.map(domain => {
                const domainParams = data.parameters.filter(p => p.domain_id === domain.id).map(p => p.id);
                const mentorAsses = data.assessments.filter(a => domainParams.includes(a.parameter_id) && a.project_id === proj.id && a.assessment_type === 'mentor' && a.normalized_score !== null);
                const selfAsses = data.assessments.filter(a => domainParams.includes(a.parameter_id) && a.project_id === proj.id && a.assessment_type === 'self' && a.normalized_score !== null);

                const mentorAvg = mentorAsses.length > 0 ? mentorAsses.reduce((sum, a) => sum + a.normalized_score!, 0) / mentorAsses.length : 0;
                const selfAvg = selfAsses.length > 0 ? selfAsses.reduce((sum, a) => sum + a.normalized_score!, 0) / selfAsses.length : 0;

                return {
                    domain: domain.name,
                    mentor: Number(mentorAvg.toFixed(1)),
                    self: Number(selfAvg.toFixed(1))
                };
            }).filter(d => d.mentor > 0 || d.self > 0);

            return {
                project: proj.name,
                categories
            };
        }).filter(p => p.categories.length > 0);

    } catch (e) {
        console.error("Failed to load playground data", e);
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] h-full">
            <div className="flex justify-between items-center shrink-0">
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
                students={studentsList}
                studentId={activeStudentId}
            />
        </div>
    );
}
