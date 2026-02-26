import { createClient } from '@/lib/supabase/server';
import { getMetricsData } from '@/lib/supabase/queries/metrics';
import MetricsClientPage from './MetricsClientPage';

export const dynamic = 'force-dynamic';

export default async function MetricsPage() {
    const supabase = await createClient();
    const data = await getMetricsData(supabase);

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] h-full">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Metrics & Tracking</h2>
                    <p className="text-slate-400">View CBP count, Conflexion count, and BOW scores for each student across different import datasets.</p>
                </div>
            </div>

            <MetricsClientPage
                initialStudents={data.students}
                initialTracking={data.tracking}
                initialLogs={data.logs}
            />
        </div>
    );
}
