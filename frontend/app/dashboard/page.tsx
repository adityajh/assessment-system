import { createClient } from '@/lib/supabase/server';
import { getStudents } from '@/lib/supabase/queries/students';
import Link from 'next/link';
import { LayoutDashboard, Briefcase } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardIndexPage() {
    const supabase = await createClient();
    const students = await getStudents(supabase);
    const { data: projects } = await supabase.from('projects').select('*').order('sequence').limit(1);
    const defaultProjectId = projects?.[0]?.id || '';
    const activeStudents = students.filter(s => s.is_active);

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto py-12 px-4">
            <div className="text-center">
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Student Dashboards</h1>
                <p className="text-slate-500 max-w-2xl mx-auto font-medium">
                    Select a report type for each student to view comprehensive progress or project-specific impact analysis.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {activeStudents.map(student => (
                    <div
                        key={student.id}
                        className="flex flex-col p-6 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 border border-slate-200">
                                {student.student_number}
                            </span>
                            <h2 className="text-xl font-bold text-slate-800">
                                {student.canonical_name}
                            </h2>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                            <Link 
                                href={`/dashboard/${student.id}`}
                                className="flex flex-col items-center justify-center p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all group"
                            >
                                <LayoutDashboard className="w-6 h-6 mb-2 opacity-60 group-hover:opacity-100" />
                                <span className="text-xs font-black uppercase tracking-widest">Student Overview</span>
                            </Link>
                            <Link 
                                href={`/dashboard/${student.id}/project/${defaultProjectId}`}
                                className="flex flex-col items-center justify-center p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 hover:bg-amber-600 hover:text-white transition-all group"
                            >
                                <Briefcase className="w-6 h-6 mb-2 opacity-60 group-hover:opacity-100" />
                                <span className="text-xs font-black uppercase tracking-widest">Project Report</span>
                            </Link>
                        </div>
                    </div>
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
