import PlaygroundClientPage from './PlaygroundClientPage';
import { createClient } from '@/lib/supabase/server';
import { getPlaygroundData } from '@/lib/supabase/queries/assessments';

export const metadata = {
    title: 'Component Playground - Admin Panel',
};

export default async function PlaygroundPage() {
    let mockData = null;
    let gapData = null;
    let heatmapData = null;
    let trajectoryData = null;
    let heatmapProjects: string[] = [];
    let studentName = "Mock Student";

    try {
        const supabase = await createClient();
        const data = await getPlaygroundData(supabase);

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

            const mentorAvg = mentorAsses.length > 0 ? mentorAsses.reduce((sum, a) => sum + a.normalized_score!, 0) / mentorAsses.length : 0;
            const selfAvg = selfAsses.length > 0 ? selfAsses.reduce((sum, a) => sum + a.normalized_score!, 0) / selfAsses.length : 0;

            return {
                project: proj.name,
                mentor: Number(mentorAvg.toFixed(1)),
                self: Number(selfAvg.toFixed(1))
            };
        }).filter(t => t.mentor > 0 || t.self > 0); // Only keep projects with actual data

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
                heatmapProjects={heatmapProjects}
                trajectoryData={trajectoryData}
            />
        </div>
    );
}
