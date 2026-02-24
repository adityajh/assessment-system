"use client";

import { useMemo } from 'react';
import { TermTracking } from '@/lib/supabase/queries/term_tracking';
import { Student } from '@/lib/supabase/queries/students';

interface TermTrackingProps {
    initialStudents: Student[];
    initialTracking: TermTracking[];
}

export default function TermTrackingClientPage({
    initialStudents,
    initialTracking
}: TermTrackingProps) {
    const activeStudents = useMemo(() => initialStudents.filter(s => s.is_active), [initialStudents]);

    // Group tracking records by student ID
    const studentData = useMemo(() => {
        const result: Record<string, TermTracking[]> = {};
        activeStudents.forEach(student => {
            result[student.id] = initialTracking.filter(t => t.student_id === student.id);
        });
        return result;
    }, [activeStudents, initialTracking]);

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex-1 min-h-[500px] bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left align-middle border-collapse divide-y divide-slate-800">
                        <thead className="bg-[#0f172a] text-slate-300">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-200 sticky left-0 bg-[#0f172a] z-20 min-w-[250px]">
                                    Student
                                </th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center text-slate-400">Term Recorded</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center text-emerald-400">Total CBPs</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center text-amber-400">Total Conflexions</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center text-indigo-400 border-l border-slate-800">BOW Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {activeStudents.map(student => {
                                const records = studentData[student.id];
                                const hasData = records && records.length > 0;
                                // For MVP, we'll just show the latest valid record if multiple exist
                                const latest = hasData ? records[records.length - 1] : null;

                                return (
                                    <tr key={student.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-3 sticky left-0 z-10 font-medium text-slate-200" style={{ backgroundColor: 'inherit' }}>
                                            <div className="font-semibold text-slate-200">{student.canonical_name}</div>
                                            <div className="text-xs text-slate-500 font-mono">#{student.student_number}</div>
                                        </td>
                                        <td className={`px-6 py-3 text-center font-mono ${hasData ? 'text-slate-300' : 'text-slate-600'}`}>
                                            {latest?.term || '-'}
                                        </td>
                                        <td className={`px-6 py-3 text-center font-mono font-bold ${hasData ? 'text-emerald-400' : 'text-slate-600'}`}>
                                            {latest?.cbp_count ?? '-'}
                                        </td>
                                        <td className={`px-6 py-3 text-center font-mono font-bold ${hasData ? 'text-amber-400' : 'text-slate-600'}`}>
                                            {latest?.conflexion_count ?? '-'}
                                        </td>
                                        <td className={`px-6 py-3 text-center font-mono font-bold border-l border-slate-800 ${hasData ? 'text-indigo-400' : 'text-slate-600'}`}>
                                            {latest?.bow_score ?? '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
