import { createClient } from '@/lib/supabase/server';
import { getStudents, getPrograms } from '@/lib/supabase/queries/students';
import StudentsClientPage from './StudentsClientPage';

export const dynamic = 'force-dynamic';

export default async function StudentsPage() {
    const supabase = await createClient();
    const students = await getStudents(supabase);
    const programs = await getPrograms(supabase);

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Student Roster</h2>
                    <p className="text-slate-400">Manage the canonical list of students and their name aliases.</p>
                </div>
            </div>

            <StudentsClientPage initialStudents={students} initialPrograms={programs} />
        </div>
    );
}
