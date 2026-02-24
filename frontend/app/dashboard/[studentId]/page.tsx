import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { RadarRechart } from '@/components/dashboard/RadarChart';
import { ProgressionChart } from '@/components/dashboard/ProgressionChart';
import { StudentReportHeader } from '@/components/dashboard/StudentReportHeader';
import {
    getMentorAssessmentData,
    ReadinessDomain,
    ReadinessParameter
} from '@/lib/supabase/queries/assessments';
import { getProjects } from '@/lib/supabase/queries/projects';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage({ params }: { params: Promise<{ studentId: string }> }) {
    const supabase = await createClient();
    const { studentId } = await params;

    // 1. Fetch Student Details
    const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

    if (studentError || !student) {
        notFound();
    }

    // 2. Fetch all necessary data for the charts
    // For simplicity MVP, using the mentor data query which gets domains/params too
    const data = await getMentorAssessmentData(supabase);
    const projects = await getProjects(supabase);

    // Also fetch self-assessments
    const { data: selfAssessments } = await supabase
        .from('assessments')
        .select('*')
        .eq('assessment_type', 'self')
        .eq('student_id', studentId);

    // Filter mentor assessments for this student
    const studentMentorAssessments = data.assessments.filter(a => a.student_id === studentId);
    const studentSelfAssessments = selfAssessments || [];

    // Prepare Radar Chart Data
    const radarData = data.domains.map(domain => {
        const domainParams = data.parameters.filter(p => p.domain_id === domain.id);
        const paramIds = new Set(domainParams.map(p => p.id));

        // Mentor Avg
        const mScores = studentMentorAssessments.filter(a => paramIds.has(a.parameter_id)).map(a => a.normalized_score).filter((s): s is number => s !== null);
        const mAvg = mScores.length ? mScores.reduce((a, b) => a + b, 0) / mScores.length : null;

        // Self Avg
        const sScores = studentSelfAssessments.filter(a => paramIds.has(a.parameter_id)).map(a => a.normalized_score).filter((s): s is number => s !== null);
        const sAvg = sScores.length ? sScores.reduce((a, b) => a + b, 0) / sScores.length : null;

        return {
            subject: domain.short_name || domain.name.split(' ')[0],
            mentorAvg: mAvg !== null ? Number(mAvg.toFixed(1)) : null,
            selfAvg: sAvg !== null ? Number(sAvg.toFixed(1)) : null,
            fullMark: 10
        };
    });

    return (
        <div className="flex flex-col gap-8 pb-20 print:pb-0">
            <StudentReportHeader
                student={student}
                projects={projects}
                mentorAssessments={studentMentorAssessments}
            />

            {/* Overview Section - Radar and Progression */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:break-inside-avoid">
                <div className="dash-card flex flex-col h-[500px]">
                    <h3 className="section-title">Readiness Domains (Cumulative)</h3>
                    <p className="text-sm var(--dash-text-muted) mb-4">
                        Comparison of Mentor (Subjective + Objective) and Self (Subjective) scores across the 6 major domains.
                    </p>
                    <div className="flex-1 min-h-0">
                        <RadarRechart data={radarData} />
                    </div>
                </div>

                <div className="dash-card flex flex-col h-[500px] print:mt-8">
                    <h3 className="section-title">Progression Over Time</h3>
                    <p className="text-sm var(--dash-text-muted) mb-4">
                        Average Mentor score progression across the assessment timeline.
                    </p>
                    <div className="flex-1 min-h-0">
                        <ProgressionChart
                            projects={projects}
                            assessments={studentMentorAssessments}
                        />
                    </div>
                </div>
            </section>

            {/* Detailed Domain Breakdown Section */}
            <section className="print:break-before-page">
                <h3 className="section-title mb-6">Detailed Readiness Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.domains.map(domain => {
                        const domainParams = data.parameters.filter(p => p.domain_id === domain.id);
                        return (
                            <DomainDetailCard
                                key={domain.id}
                                domain={domain}
                                parameters={domainParams}
                                mentorAssessments={studentMentorAssessments}
                                selfAssessments={studentSelfAssessments}
                            />
                        );
                    })}
                </div>
            </section>

            {/* Term Tracking and Peer Feedback placeholders */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:break-before-page">
                <div className="dash-card">
                    <h3 className="section-title">Term Tracking (CBP/IP)</h3>
                    <div className="py-12 flex items-center justify-center border-2 border-dashed var(--dash-border) rounded-lg bg-slate-50">
                        <span className="text-slate-400">Term report data integration pending.</span>
                    </div>
                </div>
                <div className="dash-card">
                    <h3 className="section-title">Peer Feedback Highlights</h3>
                    <div className="py-12 flex items-center justify-center border-2 border-dashed var(--dash-border) rounded-lg bg-slate-50">
                        <span className="text-slate-400">Peer feedback text integration pending.</span>
                    </div>
                </div>
            </section>

        </div>
    );
}

function DomainDetailCard({
    domain,
    parameters,
    mentorAssessments,
    selfAssessments
}: {
    domain: ReadinessDomain,
    parameters: ReadinessParameter[],
    mentorAssessments: any[],
    selfAssessments: any[]
}) {
    // Calculate domain averages just for display
    const mentorScores = parameters.flatMap(p =>
        mentorAssessments.filter(a => a.parameter_id === p.id).map(a => a.normalized_score).filter((s): s is number => s !== null)
    );
    const mentorAvg = mentorScores.length ? (mentorScores.reduce((a, b) => a + b, 0) / mentorScores.length).toFixed(1) : '-';

    return (
        <div className="dash-card border-t-4" style={{ borderTopColor: getDomainColor(domain.name) }}>
            <div className="flex justify-between items-start mb-4">
                <h4 className="font-semibold text-lg text-slate-800">{domain.name}</h4>
                <div className="flex flex-col items-end">
                    <span className="text-2xl font-bold" style={{ color: getDomainColor(domain.name) }}>{mentorAvg}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-widest">Mentor Avg</span>
                </div>
            </div>

            <div className="space-y-3 mt-4">
                {parameters.map(param => {
                    // Find latest mentor and self scores for this param (simplified logic)
                    const mScores = mentorAssessments.filter(a => a.parameter_id === param.id && a.normalized_score !== null);
                    const mLatest = mScores.length > 0 ? mScores[mScores.length - 1].normalized_score : null;

                    const sScores = selfAssessments.filter(a => a.parameter_id === param.id && a.normalized_score !== null);
                    const sLatest = sScores.length > 0 ? sScores[sScores.length - 1].normalized_score : null;

                    return (
                        <div key={param.id} className="text-sm border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                            <div className="font-medium text-slate-700 mb-1 leading-snug">{param.name}</div>
                            <div className="flex items-center gap-4 text-xs font-mono">
                                <div className="flex items-center gap-1.5 border px-1.5 py-0.5 rounded bg-slate-50">
                                    <span className="text-indigo-600 font-bold">M</span>
                                    <span className="text-slate-600">{mLatest !== null ? mLatest.toFixed(1) : '-'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 border px-1.5 py-0.5 rounded bg-slate-50">
                                    <span className="text-cyan-600 font-bold">S</span>
                                    <span className="text-slate-600">{sLatest !== null ? sLatest.toFixed(1) : '-'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function getDomainColor(domainName: string) {
    const map: Record<string, string> = {
        'Commercial Readiness': '#f59e0b',
        'Entrepreneurial Readiness': '#10b981',
        'Marketing Readiness': '#ec4899',
        'Innovation Readiness': '#8b5cf6',
        'Operational Readiness': '#3b82f6',
        'Professional Readiness': '#14b8a6',
    };
    return map[domainName] || '#94a3b8';
}
