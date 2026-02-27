import { createClient } from '@/lib/supabase/server';
import { getTermTrackingData } from '@/lib/supabase/queries/term_tracking';
import TermTrackingClientPage from './TermTrackingClientPage';

export const dynamic = 'force-dynamic';

export default async function TermTrackingPage() {
    const supabase = await createClient();
    const data = await getTermTrackingData(supabase);

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] h-full">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Term Tracking Data</h2>
                    <p className="text-slate-400">View CBP count, Conflexion count, and BOW scores for each student.</p>
                </div>
            </div>

            <TermTrackingClientPage
                initialStudents={data.students}
                initialTracking={data.tracking}
            />
        </div>
    );
}
