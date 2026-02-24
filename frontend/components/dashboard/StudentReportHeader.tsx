import { Student } from '@/lib/supabase/queries/students';
import { Project } from '@/lib/supabase/queries/projects';
import { Assessment } from '@/lib/supabase/queries/assessments';

interface HeaderProps {
    student: Student;
    projects: Project[];
    mentorAssessments: Assessment[];
}

export function StudentReportHeader({ student, projects, mentorAssessments }: HeaderProps) {
    // Calculate some basic top-level metrics

    // 1. Completion rate (projects with at least one score vs total standard projects)
    const standardProjects = projects.filter(p => p.project_type === 'standard');
    const attemptedProjectIds = new Set(mentorAssessments.map(a => a.project_id));
    const completionPercent = standardProjects.length > 0
        ? Math.round((attemptedProjectIds.size / standardProjects.length) * 100)
        : 0;

    // 2. Overall Mentor Average
    const allScores = mentorAssessments.map(a => a.normalized_score).filter((s): s is number => s !== null);
    const overallAvg = allScores.length > 0
        ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)
        : 'N/A';

    return (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:shadow-none print:border-b-2 print:border-b-slate-800 print:rounded-none">

            <div className="flex items-center gap-6">
                <div className="hidden sm:flex w-20 h-20 bg-indigo-50 rounded-full items-center justify-center text-indigo-200 border-4 border-indigo-100">
                    <span className="text-3xl font-bold tracking-tighter text-indigo-400">
                        {student.student_number}
                    </span>
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">{student.canonical_name}</h1>
                    <div className="flex gap-4 text-sm font-medium text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active Student
                        </span>
                        <span>ID: #{student.student_number}</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-8">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Overall Mentor Score</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-indigo-600">{overallAvg}</span>
                        <span className="text-slate-400 font-medium">/10</span>
                    </div>
                </div>

                <div className="w-px h-12 bg-slate-200 self-center hidden md:block"></div>

                <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Project Completion</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-700">{completionPercent}%</span>
                    </div>
                    <span className="text-xs text-slate-400 mt-1">{attemptedProjectIds.size} of {standardProjects.length} Projects</span>
                </div>
            </div>

        </div>
    );
}
