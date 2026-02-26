"use client";

import { useState, useMemo } from 'react';
import { PeerFeedback } from '@/lib/supabase/queries/feedback';
import { Student } from '@/lib/supabase/queries/students';
import { Project } from '@/lib/supabase/queries/projects';

interface PeerFeedbackProps {
    initialStudents: Student[];
    initialProjects: Project[];
    initialFeedback: PeerFeedback[];
    initialLogs: any[];
}

const PEER_SCALE_MAX = 5; // Raw peer feedback is on a 1-5 scale

export default function PeerFeedbackClientPage({
    initialStudents,
    initialProjects,
    initialFeedback,
    initialLogs
}: PeerFeedbackProps) {
    const [selectedProject, setSelectedProject] = useState<string>(initialProjects[0]?.id || '');
    const [displayScore, setDisplayScore] = useState<'raw' | 'normalized'>('raw');

    const activeStudents = useMemo(() => initialStudents.filter(s => s.is_active), [initialStudents]);

    const availableLogs = useMemo(() => {
        return initialLogs.filter(log => log.project_id === selectedProject || log.project_id === null); // Support null for generic term/peer imports
    }, [initialLogs, selectedProject]);

    const [selectedLog, setSelectedLog] = useState<string>('all');

    // Filter feedback based on selected log
    const displayFeedback = useMemo(() => {
        if (selectedLog === 'all') return initialFeedback;
        return initialFeedback.filter(f => f.assessment_log_id === selectedLog);
    }, [initialFeedback, selectedLog]);

    // Compute averages for each student on the selected project
    const studentAverages = useMemo(() => {
        const metrics = ['quality_of_work', 'initiative_ownership', 'communication', 'collaboration', 'growth_mindset'] as const;
        const result: Record<string, Record<string, number | null>> = {};

        activeStudents.forEach(student => {
            const studentFeedback = displayFeedback.filter(f => f.recipient_id === student.id && f.project_id === selectedProject);

            result[student.id] = {};
            metrics.forEach(metric => {
                const rawScores = studentFeedback.map(f => f[metric]).filter((s): s is number => s !== null);
                if (rawScores.length > 0) {
                    const rawAvg = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
                    result[student.id][`${metric}_raw`] = Number(rawAvg.toFixed(1));
                    result[student.id][`${metric}_norm`] = Number(((rawAvg / PEER_SCALE_MAX) * 10).toFixed(1));
                } else {
                    result[student.id][`${metric}_raw`] = null;
                    result[student.id][`${metric}_norm`] = null;
                }
            });
            // Total peer score
            const rawScoresAll = metrics.map(m => result[student.id][`${m}_raw`]).filter((s): s is number => s !== null);
            const overallRaw = rawScoresAll.length > 0 ? Number((rawScoresAll.reduce((a, b) => a + b, 0) / rawScoresAll.length).toFixed(1)) : null;
            result[student.id]['overall_raw'] = overallRaw;
            result[student.id]['overall_norm'] = overallRaw !== null ? Number(((overallRaw / PEER_SCALE_MAX) * 10).toFixed(1)) : null;
            
            // Counts
            result[student.id]['count'] = studentFeedback.length; // Received
            result[student.id]['given_count'] = displayFeedback.filter(f => f.giver_id === student.id && f.project_id === selectedProject).length;
        });

        return result;
    }, [activeStudents, initialFeedback, selectedProject]);

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex gap-4 p-4 admin-card bg-slate-900/50 shrink-0 flex-wrap items-end">
                <div className="flex flex-col gap-1.5 min-w-[250px]">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Project</label>
                    <select
                        className="input bg-slate-900"
                        value={selectedProject}
                        onChange={(e) => {
                            setSelectedProject(e.target.value);
                            setSelectedLog('all'); // Reset log filter when project changes
                        }}
                    >
                        {initialProjects.map(p => (
                            <option key={p.id} value={p.id}>{p.sequence_label} - {p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5 min-w-[300px]">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <span>Assessment Event</span>
                        <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">Filter</span>
                    </label>
                    <select
                        className="input bg-slate-900"
                        value={selectedLog}
                        onChange={(e) => setSelectedLog(e.target.value)}
                    >
                        <option value="all">All Available Data</option>
                        {availableLogs.map(log => (
                            <option key={log.id} value={log.id}>
                                {log.assessment_date} • {log.file_name || 'Import'}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="ml-auto flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
                    <button
                        onClick={() => setDisplayScore('raw')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${displayScore === 'raw' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Raw (1-5)
                    </button>
                    <button
                        onClick={() => setDisplayScore('normalized')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${displayScore === 'normalized' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Normalized (1-10)
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-[500px] bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                {!selectedProject ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                        Please select a project to view feedback
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left align-middle border-collapse divide-y divide-slate-800">
                            <thead className="bg-[#0f172a] text-slate-300">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-200 sticky left-0 bg-[#0f172a] z-20 min-w-[250px]">
                                        Student
                                    </th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap text-center text-slate-400">Reviews Received</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap text-center text-slate-400">Reviews Given</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Quality of Work</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Initiative</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Communication</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Collaboration</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Growth Mindset</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap text-center text-indigo-400 border-l border-slate-800">Overall Avg</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {activeStudents.map(student => {
                                    const avg = studentAverages[student.id];
                                    const hasData = (avg.count ?? 0) > 0;
                                    const suffix = displayScore === 'normalized' ? '_norm' : '_raw';

                                    return (
                                        <tr key={student.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-3 sticky left-0 z-10 font-medium text-slate-200" style={{ backgroundColor: 'inherit' }}>
                                                <div className="font-semibold text-slate-200">{student.canonical_name}</div>
                                                <div className="text-xs text-slate-500 font-mono">#{student.student_number}</div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${hasData ? 'bg-slate-800 text-slate-300' : 'text-slate-600'}`}>
                                                    {avg.count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${(avg.given_count ?? 0) > 0 ? 'bg-slate-800 text-slate-300' : 'text-slate-600'}`}>
                                                    {avg.given_count}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-3 text-center font-mono ${hasData ? 'text-slate-300' : 'text-slate-600'}`}>{(avg[`quality_of_work${suffix}`] as number | null) ?? '-'}</td>
                                            <td className={`px-6 py-3 text-center font-mono ${hasData ? 'text-slate-300' : 'text-slate-600'}`}>{(avg[`initiative_ownership${suffix}`] as number | null) ?? '-'}</td>
                                            <td className={`px-6 py-3 text-center font-mono ${hasData ? 'text-slate-300' : 'text-slate-600'}`}>{(avg[`communication${suffix}`] as number | null) ?? '-'}</td>
                                            <td className={`px-6 py-3 text-center font-mono ${hasData ? 'text-slate-300' : 'text-slate-600'}`}>{(avg[`collaboration${suffix}`] as number | null) ?? '-'}</td>
                                            <td className={`px-6 py-3 text-center font-mono ${hasData ? 'text-slate-300' : 'text-slate-600'}`}>{(avg[`growth_mindset${suffix}`] as number | null) ?? '-'}</td>
                                            <td className={`px-6 py-3 text-center font-mono font-bold border-l border-slate-800 ${hasData ? 'text-indigo-400' : 'text-slate-600'}`}>
                                                {(avg[`overall${suffix}`] as number | null) ?? '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
