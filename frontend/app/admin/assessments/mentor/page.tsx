import { createClient } from '@/lib/supabase/server';
import { getMentorAssessmentData } from '@/lib/supabase/queries/assessments';
import MentorAssessmentsClientPage from './MentorAssessmentsClientPage';

export const dynamic = 'force-dynamic';

export default async function MentorAssessmentsPage() {
    const supabase = await createClient();
    const data = await getMentorAssessmentData(supabase);

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] h-full">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Mentor Assessments</h2>
                    <p className="text-slate-400">View and edit mentor scores across all projects and readiness domains.</p>
                </div>
            </div>

            <MentorAssessmentsClientPage
                initialStudents={data.students}
                initialProjects={data.projects}
                initialDomains={data.domains}
                initialParameters={data.parameters}
                initialAssessments={data.assessments}
            />
        </div>
    );
}
