import { createClient } from '@/lib/supabase/server';
import { getPlaygroundData } from '@/lib/supabase/queries/assessments';
import StudentDashboardClient from './StudentDashboardClient';

export const metadata = {
    title: 'Student Dashboard - Admin',
};

export default async function StudentDashboardPage({ params }: { params: Promise<{ studentId: string }> }) {
    const { studentId } = await params;

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
    let distributionData: any[] = [];
    let mentorNotes: any[] = [];
    let studentData = null;
    let engagementDistributionData: any[] = [];
    let peerStackedByParamData: any[] = [];
    let peerStackedByParamProjects: string[] = [];
    let topDomainStrengths: any[] = [];
    let growthDomainAreas: any[] = [];
    let initialMission: string = '';
    let missionDate: string | null = null;

    try {
        const supabase = await createClient();
        const data = await getPlaygroundData(supabase, studentId);

        const { data: notesData } = await supabase
            .from('mentor_notes')
            .select('*, projects(name)')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (notesData) mentorNotes = notesData;

        // Extract the latest mission Note
        const latestMissionNote = mentorNotes.find(n => n.note_type === 'mission');
        initialMission = latestMissionNote ? latestMissionNote.note_text : '';
        missionDate = latestMissionNote ? latestMissionNote.date : null;

        // Filter out missions from the main notes feed
        mentorNotes = mentorNotes.filter(n => n.note_type !== 'mission');

        studentData = data.student;

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
                const assessment = data.assessments.find(a => a.parameter_id === param.id && a.project_id === proj.id && a.assessment_type === 'mentor');
                scores[proj.name] = assessment?.normalized_score ? Number(assessment.normalized_score.toFixed(1)) : null;
            });

            return { parameter: param.name, domain, scores };
        });

        // 3. BUILD TRAJECTORY DATA (Phase-Based Project Averages)
        const uniqueSequences = [...new Set(data.projects.map(p => p.sequence))].sort((a, b) => a - b);
        trajectoryData = uniqueSequences.map(seq => {
            const seqProjects = data.projects.filter(p => p.sequence === seq);

            // Find which project the student actually has assessment data for
            let activeProject = seqProjects[0]; // fallback
            for (const proj of seqProjects) {
                if (data.assessments.some(a => a.project_id === proj.id && a.normalized_score !== null)) {
                    activeProject = proj;
                    break;
                }
            }

            const mentorAsses = data.assessments.filter(a => a.project_id === activeProject.id && a.assessment_type === 'mentor' && a.normalized_score !== null);
            const selfAsses = data.assessments.filter(a => a.project_id === activeProject.id && a.assessment_type === 'self' && a.normalized_score !== null);

            const mentorAvg = mentorAsses.length > 0 ? mentorAsses.reduce((sum, a) => sum + a.normalized_score!, 0) / mentorAsses.length : null;
            const selfAvg = selfAsses.length > 0 ? selfAsses.reduce((sum, a) => sum + a.normalized_score!, 0) / selfAsses.length : null;

            return {
                project: activeProject.name,
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
        const totalPhases = new Set(data.projects.map(p => p.sequence)).size;
        const phasesAssessed = new Set(
            data.assessments
                .filter(a => a.normalized_score !== null)
                .map(a => data.projects.find(p => p.id === a.project_id)?.sequence)
                .filter(Boolean)
        ).size;
        kpiData = {
            projectsCount: `${phasesAssessed}/${totalPhases}`,
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
                    const scores = projectFeedback.map((f: any) => f[c.key as keyof typeof f]).filter(s => s !== null && s !== undefined) as number[];
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
                    mentor: mentorAsses.length > 0 ? Number(mentorAvg.toFixed(1)) : null,
                    self: selfAsses.length > 0 ? Number(selfAvg.toFixed(1)) : null
                };
            });

            return {
                project: proj.name,
                categories
            };
        });

        // 8. BUILD TOP STRENGTHS & GROWTH AREAS
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
            const activeStudentAvg = studentAverages[studentId] ? (studentAverages[studentId].sum / studentAverages[studentId].count) : null;

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

    } catch (e) {
        console.error("Failed to load dashboard data", e);
    }

    return (
        <StudentDashboardClient
            studentData={studentData}
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
            distributionData={distributionData}
            mentorNotes={mentorNotes}
            engagementDistributionData={engagementDistributionData}
            peerStackedByParamData={peerStackedByParamData}
            peerStackedByParamProjects={peerStackedByParamProjects}
            topDomainStrengths={topDomainStrengths}
            growthDomainAreas={growthDomainAreas}
            initialMission={initialMission}
            missionDate={missionDate}
        />
    );
}
