import { createClient } from '@/lib/supabase/server';
import { getProjects } from '@/lib/supabase/queries/projects';
import ProjectsClientPage from './ProjectsClientPage';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
    const supabase = await createClient();
    const projects = await getProjects(supabase);

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Project Sequence</h2>
                    <p className="text-slate-400">Manage the order and metadata of assessment modules.</p>
                </div>
            </div>

            <ProjectsClientPage initialProjects={projects} />
        </div>
    );
}
