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

    // 4. Fetch Self Assessment Counts 
    const { data: selfAssessments } = await supabase
        .from('assessments')
        .select('student_id')
        .eq('assessment_type', 'self')
        .not('normalized_score', 'is', 'null');
    
    const selfAssessMap: Record<string, number> = {};
    if (selfAssessments) {
        selfAssessments.forEach(a => {
            selfAssessMap[a.student_id] = (selfAssessMap[a.student_id] || 0) + 1;
        });
    }

    // Combine all data into a clean structure for the client
    const compiledData = students.map(student => {
        const metrics = (dashboardMetrics?.find(m => m.student_id === student.id) || {}) as any;
        return {
            id: student.id,
            name: student.canonical_name,
            studentNumber: student.student_number,
            cohort: student.cohort || '2025', // Fallback to 2025 if missing
            cbpCount: metrics.cbp_count || 0,
            conflexionCount: metrics.conflexion_count || 0,
            bowScore: metrics.bow_score ? Number(metrics.bow_score).toFixed(2) : '0.00',
            projectsAssessed: metrics.total_projects_assessed || 0, // Note: This uses raw view, might need phase-cap
            selfAssessmentsCount: selfAssessMap[student.id] || 0
        };
    });

    return (
        <ProgramDashboardClient 
            studentsData={compiledData} 
            totalPhases={totalPhases}
        />
    );
}
