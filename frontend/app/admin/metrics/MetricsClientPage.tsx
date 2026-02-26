"use client";

import { useMemo, useState } from 'react';
import { TermTracking, AssessmentLog } from '@/lib/supabase/queries/metrics';
import { Student } from '@/lib/supabase/queries/students';

interface MetricsProps {
    initialStudents: Student[];
    initialTracking: TermTracking[];
    initialLogs: AssessmentLog[];
}

export default function MetricsClientPage({
    initialStudents,
    initialTracking,
    initialLogs
}: MetricsProps) {
    const activeStudents = useMemo(() => initialStudents.filter(s => s.is_active), [initialStudents]);

    // Independent selections for each metric dataset
    const [cbpLogId, setCbpLogId] = useState<string>(initialLogs.length > 0 ? initialLogs[0].id : '');
    const [conflexionLogId, setConflexionLogId] = useState<string>(initialLogs.length > 0 ? initialLogs[0].id : '');
    const [bowLogId, setBowLogId] = useState<string>(initialLogs.length > 0 ? initialLogs[0].id : '');

    // Group tracking records by student ID
    const studentData = useMemo(() => {
        const result: Record<string, TermTracking[]> = {};
        activeStudents.forEach(student => {
            result[student.id] = initialTracking.filter(t => t.student_id === student.id);
        });
        return result;
    }, [activeStudents, initialTracking]);

    const renderLogOption = (log: AssessmentLog) => {
        return `${new Date(log.assessment_date).toLocaleDateString()} - ${log.term} (${log.file_name || 'Manual'})`;
    };

    return (
        <div className="flex flex-col gap-6 h-full">

            {/* Header Selectors */}
            <div className="flex gap-6 mt-2">
                <div className="flex flex-col gap-2 w-1/3">
                    <label className="text-xs font-black text-emerald-400 uppercase tracking-widest">CBP Dataset Override</label>
                    <select
                        className="input bg-slate-900 border-slate-700 text-slate-300 font-medium"
                        value={cbpLogId}
                        onChange={(e) => setCbpLogId(e.target.value)}
                    >
                        <option value="">-- Latest Available --</option>
                        {initialLogs.map(log => (
                            <option key={log.id} value={log.id}>{renderLogOption(log)}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-2 w-1/3">
                    <label className="text-xs font-black text-amber-400 uppercase tracking-widest">Conflexion Dataset Override</label>
                    <select
                        className="input bg-slate-900 border-slate-700 text-slate-300 font-medium"
                        value={conflexionLogId}
                        onChange={(e) => setConflexionLogId(e.target.value)}
                    >
                        <option value="">-- Latest Available --</option>
                        {initialLogs.map(log => (
                            <option key={log.id} value={log.id}>{renderLogOption(log)}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-2 w-1/3">
                    <label className="text-xs font-black text-indigo-400 uppercase tracking-widest">BOW Dataset Override</label>
                    <select
                        className="input bg-slate-900 border-slate-700 text-slate-300 font-medium"
                        value={bowLogId}
                        onChange={(e) => setBowLogId(e.target.value)}
                    >
                        <option value="">-- Latest Available --</option>
                        {initialLogs.map(log => (
                            <option key={log.id} value={log.id}>{renderLogOption(log)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 min-h-[500px] bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col mt-4 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left align-middle border-collapse divide-y divide-slate-800">
                        <thead className="bg-[#0f172a] text-slate-300">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-200 sticky left-0 bg-[#0f172a] z-20 min-w-[250px]">
                                    Student
                                </th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center text-emerald-400">Total CBPs</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center text-amber-400">Total Conflexions</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center text-indigo-400 border-l border-slate-800">BOW Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {activeStudents.map(student => {
                                const records = studentData[student.id] || [];
                                
                                // Resolvers for specific logs or latest fallback
                                const cbpRecord = cbpLogId ? records.find(r => r.assessment_log_id === cbpLogId) : records[records.length - 1];
                                const conflexRecord = conflexionLogId ? records.find(r => r.assessment_log_id === conflexionLogId) : records[records.length - 1];
                                const bowRecord = bowLogId ? records.find(r => r.assessment_log_id === bowLogId) : records[records.length - 1];

                                return (
                                    <tr key={student.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-3 sticky left-0 z-10 font-medium text-slate-200" style={{ backgroundColor: 'inherit' }}>
                                            <div className="font-semibold text-slate-200">{student.canonical_name}</div>
                                            <div className="text-xs text-slate-500 font-mono">#{student.student_number}</div>
                                        </td>
                                        <td className={`px-6 py-3 text-center font-mono font-bold ${cbpRecord && cbpRecord.cbp_count > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                            {cbpRecord?.cbp_count ?? '-'}
                                        </td>
                                        <td className={`px-6 py-3 text-center font-mono font-bold ${conflexRecord && conflexRecord.conflexion_count > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                                            {conflexRecord?.conflexion_count ?? '-'}
                                        </td>
                                        <td className={`px-6 py-3 text-center font-mono font-bold border-l border-slate-800 ${bowRecord && bowRecord.bow_score > 0 ? 'text-indigo-400' : 'text-slate-600'}`}>
                                            {bowRecord?.bow_score !== undefined && bowRecord?.bow_score !== null ? Number(bowRecord.bow_score).toFixed(2) : '-'}
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
