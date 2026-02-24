import { createClient } from '@/lib/supabase/server';
import ImportWizardClientPage from './ImportWizardClientPage';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
    const supabase = await createClient();

    // We just need projects and students for the import dropdowns/matching
    const [studentsResult, projectsResult] = await Promise.all([
        supabase.from('students').select('*').order('student_number'),
        supabase.from('projects').select('*').order('sequence').order('sequence_label')
    ]);

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Data Import Wizard</h2>
                    <p className="text-slate-400">Upload Excel sheets to ingest data into the assessment system.</p>
                </div>
            </div>

            <ImportWizardClientPage
                initialStudents={studentsResult.data || []}
                initialProjects={projectsResult.data || []}
            />
        </div>
    );
}
