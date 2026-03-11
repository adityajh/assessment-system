import { createClient } from '@/lib/supabase/server';
import ProgramDashboardClient from './ProgramDashboardClient';

export const metadata = {
    title: 'Program Dashboard - Admin Panel',
};

export default async function ProgramDashboardPage() {
    const supabase = await createClient();

    // 1. Fetch Students
    const { data: students, error: studentError } = await supabase
        .from('students')
        .select('*')
        .order('canonical_name');
    
    if (studentError) {
        console.error("Error fetching students:", studentError);
        return <div className="p-8">Error loading students data.</div>;
    }

    // 2. Fetch Projects (for phase counts)
    const { data: projects } = await supabase.from('projects').select('sequence');
    const totalPhases = projects ? new Set(projects.map(p => p.sequence)).size : 0;

    // 3. Fetch KPI Metrics view
    const { data: dashboardMetrics } = await supabase
        .from('v_student_dashboard')
        .select('student_id, cbp_count, conflexion_count, bow_score, total_projects_assessed');

    // 4. Fetch Self-Assessment counts DIRECTLY from assessments table
    //    (matching the individual student dashboard logic exactly)
    const { data: selfAssessmentsRaw } = await supabase
        .from('assessments')
        .select('student_id')
        .eq('assessment_type', 'self')
        .not('normalized_score', 'is', null);
    
    const selfCountMap: Record<string, number> = {};
    if (selfAssessmentsRaw) {
        selfAssessmentsRaw.forEach(row => {
            selfCountMap[row.student_id] = (selfCountMap[row.student_id] || 0) + 1;
        });
    }

    // 5. Fetch Assessment Averages (for display only — NOT used in engagement score calculation)
    const { data: assessmentAvgs } = await supabase
        .from('v_student_assessment_averages')
        .select('student_id, assessment_type, avg_score');
    
    const selfAvgMap: Record<string, number> = {};
    const mentorAvgMap: Record<string, number> = {};

    if (assessmentAvgs) {
        assessmentAvgs.forEach(a => {
            if (a.assessment_type === 'self') selfAvgMap[a.student_id] = Number(a.avg_score);
            else if (a.assessment_type === 'mentor') mentorAvgMap[a.student_id] = Number(a.avg_score);
        });
    }

    // 6. Fetch Peer Feedback Averages
    const { data: peerFeedback } = await supabase
        .from('v_peer_feedback_summary')
        .select('student_id, avg_overall');
    
    const peerMap: Record<string, number> = {};
    if (peerFeedback) {
        peerFeedback.forEach(p => {
            peerMap[p.student_id] = Number(p.avg_overall) || 0;
        });
    }

    // Combine all data into a clean structure for the client
    const compiledData = students.map(student => {
        const metrics = (dashboardMetrics?.find(m => m.student_id === student.id) || {}) as any;
        
        const avgSelfScore = selfAvgMap[student.id] || 0;
        const avgMentorScore = mentorAvgMap[student.id] || 0;
        const avgPeerScore = peerMap[student.id] || 0;

        return {
            id: student.id,
            name: student.canonical_name,
            studentNumber: student.student_number,
            cohort: student.cohort || '2025', 
            cbpCount: metrics.cbp_count || 0,
            conflexionCount: metrics.conflexion_count || 0,
            bowScore: metrics.bow_score ? Number(metrics.bow_score).toFixed(2) : '0.00',
            projectsAssessed: metrics.total_projects_assessed || 0, 
            // Direct count from assessments table — matches the individual student dashboard methodology
            selfAssessmentsCount: selfCountMap[student.id] || 0,
            avgMentorScore: avgMentorScore.toFixed(1),
            avgSelfScore: avgSelfScore.toFixed(1),
            avgPeerScore: avgPeerScore.toFixed(1)
        };
    });

    return (
        <ProgramDashboardClient 
            studentsData={compiledData} 
            totalPhases={totalPhases}
        />
    );
}
