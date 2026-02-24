import { createClient } from '@/lib/supabase/server';
import { getStudents } from '@/lib/supabase/queries/students';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardIndexPage() {
    const supabase = await createClient();
    const students = await getStudents(supabase);
    const activeStudents = students.filter(s => s.is_active);

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto py-12">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-800 mb-4">Student Assessment Dashboards</h1>
                <p className="text-slate-600 max-w-2xl mx-auto">
                    Select a student below to view their comprehensive progress report, including mentor assessments, self-assessments, and term tracking data.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeStudents.map(student => (
                    <Link
                        key={student.id}
                        href={`/dashboard/${student.id}`}
                        className="flex flex-col p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group"
                    >
                        <div className="text-sm font-mono text-slate-500 mb-1 flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs">
                                {student.student_number}
                            </span>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {student.canonical_name}
                        </h2>
                        <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500 flex justify-between items-center text-indigo-600 font-medium">
                            View Report &rarr;
                        </div>
                    </Link>
                ))}
                {activeStudents.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                        No active students found. Please add students in the Admin panel.
                    </div>
                )}
            </div>
        </div>
    );
}
