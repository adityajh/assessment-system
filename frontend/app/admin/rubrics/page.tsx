export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { getRubricsData } from '@/lib/supabase/queries/assessments';
import RubricsClientPage from './RubricsClientPage';

export default async function RubricsPage() {
    const supabase = await createClient();
    const data = await getRubricsData(supabase);

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] h-full">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Assessment Rubrics</h2>
                    <p className="text-slate-400">View the 6 Readiness Domains and their corresponding sub-parameters.</p>
                </div>
            </div>

            <RubricsClientPage domains={data.domains} parameters={data.parameters} />
        </div>
    );
}
