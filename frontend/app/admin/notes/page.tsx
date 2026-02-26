import { createClient } from '@/lib/supabase/server';
import { getMentorNotesData } from '@/lib/supabase/queries/notes';
import MentorNotesClientPage from './MentorNotesClientPage';

export const dynamic = 'force-dynamic';

export default async function MentorNotesPage() {
    const supabase = await createClient();
    const data = await getMentorNotesData(supabase);

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] h-full">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Mentor Notes</h2>
                    <p className="text-slate-400">View free-text observations and qualitative feedback provided by mentors.</p>
                </div>
            </div>

            <MentorNotesClientPage
                initialNotes={data.notes}
                initialStudents={data.students}
                initialProjects={data.projects}
            />
        </div>
    );
}
