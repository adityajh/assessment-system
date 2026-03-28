import { createClient } from '@/lib/supabase/server';
import { getClientAssessmentData } from '@/lib/supabase/queries/assessments';
import ClientAssessmentsClientPage from './ClientAssessmentsClientPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ClientAssessmentsPage() {
    const supabase = await createClient();
    const data = await getClientAssessmentData(supabase);

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] h-full">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Client Assessments</h2>
                    <p className="text-slate-400">View and edit evaluations from industry project partners.</p>
                </div>
            </div>

            <ClientAssessmentsClientPage
                initialStudents={data.students}
                initialProjects={data.projects}
                initialDomains={data.domains}
                initialParameters={data.parameters}
                initialAssessments={data.assessments}
                initialLogs={data.assessmentLogs}
            />
        </div>
    );
}
