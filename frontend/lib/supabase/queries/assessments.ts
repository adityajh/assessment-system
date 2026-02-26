import { SupabaseClient } from '@supabase/supabase-js';
import { Student } from './students';
import { Project } from './projects';

export type ReadinessDomain = {
    id: string;
    name: string;
    short_name: string;
    display_order: number;
};

export type ReadinessParameter = {
    id: string;
    domain_id: string;
    name: string;
    code?: string;
    description: string;
    param_number: number;
};

export type AssessmentLog = {
    id: string;
    assessment_date: string;
    program_id: string;
    term: string;
    data_type: 'self' | 'mentor' | 'peer' | 'term';
    project_id: string | null;
    file_name: string | null;
    mapping_config: Record<string, string>;
    records_inserted: number;
    created_at: string;
};

export type Assessment = {
    id: string;
    student_id: string;
    project_id: string;
    parameter_id: string;
    assessment_type: 'mentor' | 'self';
    assessment_log_id?: string | null;
    assessment_framework_id?: string | null;
    self_assessment_question_id?: string | null;
    raw_score: number | null;
    raw_scale_min: number | null;
    raw_scale_max: number | null;
    normalized_score: number | null;
    source_file: string | null;
};

// Data required for the admin score browser grid
export async function getMentorAssessmentData(supabase: SupabaseClient) {
    const [studentsResult, projectsResult, domainsResult, paramsResult, assessmentsResult, logsResult] = await Promise.all([
        supabase.from('students').select('*').order('student_number'),
        supabase.from('projects').select('*').order('sequence').order('sequence_label'),
        supabase.from('readiness_domains').select('*').order('display_order'),
        supabase.from('readiness_parameters').select('*').order('param_number'),
        supabase.from('assessments').select('*').eq('assessment_type', 'mentor'),
        supabase.from('assessment_logs').select('*').eq('data_type', 'mentor').order('assessment_date', { ascending: false })
    ]);

    if (studentsResult.error) throw studentsResult.error;
    if (projectsResult.error) throw projectsResult.error;
    if (domainsResult.error) throw domainsResult.error;
    if (paramsResult.error) throw paramsResult.error;
    if (assessmentsResult.error) throw assessmentsResult.error;
    if (logsResult.error) throw logsResult.error;

    return {
        students: studentsResult.data as Student[],
        projects: projectsResult.data as Project[],
        domains: domainsResult.data as ReadinessDomain[],
        parameters: paramsResult.data as ReadinessParameter[],
        assessments: assessmentsResult.data as Assessment[],
        assessmentLogs: logsResult.data as AssessmentLog[],
    };
}

export async function getSelfAssessmentData(supabase: SupabaseClient) {
    const [studentsResult, projectsResult, domainsResult, paramsResult, assessmentsResult, logsResult] = await Promise.all([
        supabase.from('students').select('*').order('student_number'),
        supabase.from('projects').select('*').order('sequence').order('sequence_label'),
        supabase.from('readiness_domains').select('*').order('display_order'),
        supabase.from('readiness_parameters').select('*').order('param_number'),
        supabase.from('assessments').select('*').eq('assessment_type', 'self'),
        supabase.from('assessment_logs').select('*').eq('data_type', 'self').order('assessment_date', { ascending: false })
    ]);

    if (studentsResult.error) throw studentsResult.error;
    if (projectsResult.error) throw projectsResult.error;
    if (domainsResult.error) throw domainsResult.error;
    if (paramsResult.error) throw paramsResult.error;
    if (assessmentsResult.error) throw assessmentsResult.error;
    if (logsResult.error) throw logsResult.error;

    return {
        students: studentsResult.data as Student[],
        projects: projectsResult.data as Project[],
        domains: domainsResult.data as ReadinessDomain[],
        parameters: paramsResult.data as ReadinessParameter[],
        assessments: assessmentsResult.data as Assessment[],
        assessmentLogs: logsResult.data as AssessmentLog[],
    };
}

export async function updateAssessment(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<Omit<Assessment, 'id' | 'created_at'>>
) {
    const { data, error } = await supabase
        .from('assessments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Assessment;
}

// Data required for the Rubrics viewer admin page
export async function getRubricsData(supabase: SupabaseClient) {
    const [domainsResult, paramsResult] = await Promise.all([
        supabase.from('readiness_domains').select('*').order('display_order'),
        supabase.from('readiness_parameters').select('*').order('param_number')
    ]);

    if (domainsResult.error) throw domainsResult.error;
    if (paramsResult.error) throw paramsResult.error;

    return {
        domains: domainsResult.data as ReadinessDomain[],
        parameters: paramsResult.data as ReadinessParameter[],
    };
}

// Data required for the Component Playground charts
export async function getPlaygroundData(supabase: SupabaseClient, studentId?: string) {
    // 1. Get the student
    let student;
    if (studentId) {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();
        if (error) throw error;
        student = data;
    } else {
        const { data: students, error: studentError } = await supabase
            .from('students')
            .select('*')
            .order('student_number')
            .limit(1);

        if (studentError) throw studentError;
        student = students[0];
    }

    // 2. Fetch all required reference data and assessments for that student
    const [projectsResult, domainsResult, paramsResult, assessmentsResult, peerFeedbackResult, termTrackingResult] = await Promise.all([
        supabase.from('projects').select('*').order('sequence'),
        supabase.from('readiness_domains').select('*').order('display_order'),
        supabase.from('readiness_parameters').select('*').order('param_number'),
        supabase.from('assessments').select('*').eq('student_id', student.id),
        supabase.from('peer_feedback').select('*').eq('recipient_id', student.id),
        supabase.from('term_tracking').select('*').eq('student_id', student.id).single()
    ]);

    if (projectsResult.error) throw projectsResult.error;
    if (domainsResult.error) throw domainsResult.error;
    if (paramsResult.error) throw paramsResult.error;
    if (assessmentsResult.error) throw assessmentsResult.error;
    if (peerFeedbackResult.error) throw peerFeedbackResult.error;

    return {
        student: student as Student,
        projects: projectsResult.data as Project[],
        domains: domainsResult.data as ReadinessDomain[],
        parameters: paramsResult.data as ReadinessParameter[],
        assessments: assessmentsResult.data as Assessment[],
        peerFeedback: peerFeedbackResult.data as any[],
        termTracking: termTrackingResult.data as any
    };
}
