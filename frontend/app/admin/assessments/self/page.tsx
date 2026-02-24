import { createClient } from '@/lib/supabase/server';
import { getSelfAssessmentData } from '@/lib/supabase/queries/assessments';
import SelfAssessmentsClientPage from './SelfAssessmentsClientPage';

export const dynamic = 'force-dynamic';

export default async function SelfAssessmentsPage() {
    const supabase = await createClient();
    const data = await getSelfAssessmentData(supabase);

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] h-full">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Self Assessments</h2>
                    <p className="text-slate-400">View and edit self-reported scores across all projects and readiness domains.</p>
                </div>
            </div>

            <SelfAssessmentsClientPage
                initialStudents={data.students}
                initialProjects={data.projects}
                initialDomains={data.domains}
                initialParameters={data.parameters}
                initialAssessments={data.assessments}
            />
        </div>
    );
}
