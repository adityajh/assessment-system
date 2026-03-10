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

    // 4. Fetch Assessment Averages (pre-aggregated in SQL view)
    const { data: assessmentAvgs } = await supabase
        .from('v_student_assessment_averages')
        .select('student_id, assessment_type, avg_score, assessment_count');
    
    // Map assessment stats per student
    const selfStats: Record<string, { count: number, avg: number }> = {};
    const mentorStats: Record<string, { count: number, avg: number }> = {};

    if (assessmentAvgs) {
        assessmentAvgs.forEach(a => {
            const stats = { count: a.assessment_count, avg: Number(a.avg_score) };
            if (a.assessment_type === 'self') selfStats[a.student_id] = stats;
            else if (a.assessment_type === 'mentor') mentorStats[a.student_id] = stats;
        });
    }

    // 5. Fetch Peer Feedback Averages
    const { data: peerFeedback } = await supabase
        .from('v_peer_feedback_summary')
        .select('student_id, avg_overall'); // Use student_id as aliased in view
    
    const peerMap: Record<string, number> = {};
    if (peerFeedback) {
        peerFeedback.forEach(p => {
            peerMap[p.student_id] = Number(p.avg_overall) || 0;
        });
    }

    // Combine all data into a clean structure for the client
    const compiledData = students.map(student => {
        const metrics = (dashboardMetrics?.find(m => m.student_id === student.id) || {}) as any;
        const sStat = selfStats[student.id];
        const mStat = mentorStats[student.id];
        
        const avgSelfScore = sStat ? sStat.avg : 0;
        const avgMentorScore = mStat ? mStat.avg : 0;
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
            selfAssessmentsCount: sStat?.count || 0,
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
