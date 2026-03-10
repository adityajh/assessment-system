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

    // 4. Fetch All Assessments (Self and Mentor) with Scores
    const { data: allAssessments } = await supabase
        .from('assessments')
        .select('student_id, assessment_type, normalized_score')
        .not('normalized_score', 'is', 'null');
    
    // Calculate self/mentor counts and averages per student
    const selfAssessStats: Record<string, { count: number, sum: number }> = {};
    const mentorAssessStats: Record<string, { count: number, sum: number }> = {};
    
    if (allAssessments) {
        allAssessments.forEach(a => {
            const score = Number(a.normalized_score) || 0;
            if (a.assessment_type === 'self') {
                if (!selfAssessStats[a.student_id]) selfAssessStats[a.student_id] = { count: 0, sum: 0 };
                selfAssessStats[a.student_id].count++;
                selfAssessStats[a.student_id].sum += score;
            } else if (a.assessment_type === 'mentor') {
                if (!mentorAssessStats[a.student_id]) mentorAssessStats[a.student_id] = { count: 0, sum: 0 };
                // Ensure mentor score isn't zero padding if we only want true averages
                if (score > 0) {
                    mentorAssessStats[a.student_id].count++;
                    mentorAssessStats[a.student_id].sum += score;
                }
            }
        });
    }

    // 5. Fetch Peer Feedback Averages (from existing summary view)
    const { data: peerFeedback } = await supabase
        .from('v_peer_feedback_summary')
        .select('recipient_id, overall_score_avg');
    
    const peerMap: Record<string, number> = {};
    if (peerFeedback) {
        peerFeedback.forEach(p => {
            peerMap[p.recipient_id] = Number(p.overall_score_avg) || 0;
        });
    }

    // Combine all data into a clean structure for the client
    const compiledData = students.map(student => {
        const metrics = (dashboardMetrics?.find(m => m.student_id === student.id) || {}) as any;
        const selfStats = selfAssessStats[student.id];
        const mentorStats = mentorAssessStats[student.id];
        const avgSelfScore = selfStats && selfStats.count > 0 ? (selfStats.sum / selfStats.count) : 0;
        const avgMentorScore = mentorStats && mentorStats.count > 0 ? (mentorStats.sum / mentorStats.count) : 0;
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
            selfAssessmentsCount: selfStats?.count || 0,
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
