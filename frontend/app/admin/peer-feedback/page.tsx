import { createClient } from '@/lib/supabase/server';
import { getPeerFeedbackData } from '@/lib/supabase/queries/feedback';
import PeerFeedbackClientPage from './PeerFeedbackClientPage';

export const dynamic = 'force-dynamic';

export default async function PeerFeedbackPage() {
    const supabase = await createClient();
    const data = await getPeerFeedbackData(supabase);

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] h-full">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Peer Feedback Data</h2>
                    <p className="text-slate-400">View individual peer-to-peer feedback scores across all projects.</p>
                </div>
            </div>

            <PeerFeedbackClientPage
                initialStudents={data.students}
                initialProjects={data.projects}
                initialFeedback={data.feedback}
            />
        </div>
    );
}
