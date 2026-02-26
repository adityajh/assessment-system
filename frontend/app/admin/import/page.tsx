import { createClient } from '@/lib/supabase/server';
import ImportWizardClientPage from './ImportWizardClientPage';
import { getStudents } from '@/lib/supabase/queries/students';
import { getProjects } from '@/lib/supabase/queries/projects';

export default async function AdminImportPage() {
    const supabase = await createClient();

    // Fetch initial data for the wizard
    const [students, projects, programsRes] = await Promise.all([
        getStudents(supabase),
        getProjects(supabase),
        supabase.from('programs').select('*').order('name')
    ]);

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-200">
                <div className="mb-10 text-center max-w-2xl mx-auto">
                    <h1 className="text-4xl font-extrabold text-slate-950 tracking-tight">Smart Data Importer</h1>
                    <p className="text-slate-700 mt-3 text-lg font-medium">
                        Upload assessment sheets. The system will automatically recognize parameter codes and student aliases.
                    </p>
                </div>

                <ImportWizardClientPage
                    initialStudents={students}
                    initialProjects={projects}
                    initialPrograms={programsRes.data || []}
                />
            </div>
        </div>
    );
}
