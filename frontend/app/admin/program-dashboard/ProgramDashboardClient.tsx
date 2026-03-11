'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Trophy, Filter, ArrowUpDown } from 'lucide-react';

interface StudentData {
    id: string;
    name: string;
    studentNumber: string;
    cohort: string;
    cbpCount: number;
    conflexionCount: number;
    bowScore: string | number;
    projectsAssessed: number;
    selfAssessmentsCount: number;
    avgMentorScore?: string;
    avgSelfScore?: string;
    avgPeerScore?: string;
    engagementScore?: number; // Raw weighted score (0-100)
    relativeScore?: number;   // Z-score based relative score (0-100)
}

interface ProgramDashboardClientProps {
    studentsData: StudentData[];
    totalPhases: number;
}

export default function ProgramDashboardClient({ studentsData, totalPhases }: ProgramDashboardClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    
    // Get unique cohorts
    const availableCohorts = useMemo(() => {
        const cohorts = new Set(studentsData.map(s => s.cohort));
        return Array.from(cohorts).sort();
    }, [studentsData]);

    const [activeCohort, setActiveCohort] = useState<string>(availableCohorts[0] || '2025');

    const getEngagementColor = (relativeScore: number) => {
        if (relativeScore < 25) return 'bg-rose-500';      // Syncing
        if (relativeScore < 50) return 'bg-amber-500';     // Connecting
        if (relativeScore < 75) return 'bg-emerald-500';   // Engaging
        return 'bg-sky-500';                              // Leading
    };

    // Filter, Curve, and Sort the students
    const processedStudents = useMemo(() => {
        // 1. Focus only on the active cohort
        const cohortStudents = studentsData.filter(s => s.cohort === activeCohort);

        // 2. Determine "The Curve" via maximums in this specific cohort
        const maxCBP = Math.max(...cohortStudents.map(s => s.cbpCount), 1);
        const maxConf = Math.max(...cohortStudents.map(s => s.conflexionCount), 1);
        const maxBow = Math.max(10, Math.max(...cohortStudents.map(s => Number(s.bowScore)), 1));
        const maxSA = Math.max(...cohortStudents.map(s => s.selfAssessmentsCount), 1);

        // 3. Calculate raw engagement scores
        const studentsWithRawScores = cohortStudents.map(s => {
            const cbpVal = Math.min(s.cbpCount, maxCBP);
            const confVal = Math.min(s.conflexionCount, maxConf);
            const bowVal = s.bowScore ? Math.min(Number(s.bowScore), maxBow) : 0;
            const saVal = Math.min(s.selfAssessmentsCount, maxSA);

            const score = Math.round(
                (cbpVal / maxCBP) * 25 +
                (confVal / maxConf) * 25 +
                (bowVal / maxBow) * 25 +
                (saVal / maxSA) * 25
            );

            return { ...s, engagementScore: score };
        });

        // 4. Calculate Z-Score and Relative Scaling (Matching StudentDashboard logic)
        const n = studentsWithRawScores.length;
        if (n === 0) return [];

        const mean = studentsWithRawScores.reduce((sum, s) => sum + (s.engagementScore || 0), 0) / n;
        const variance = studentsWithRawScores.reduce((sum, s) => sum + Math.pow((s.engagementScore || 0) - mean, 2), 0) / Math.max(n - 1, 1);
        const sd = Math.sqrt(variance) || 1;

        const studentsWithRelativeScores = studentsWithRawScores.map(s => {
            const zScore = ((s.engagementScore || 0) - mean) / sd;
            // Standardize to 0-100 range using the same formula: (z * 25) + 62.5
            let relativeScore = (zScore * 25) + 62.5;
            relativeScore = Math.max(2, Math.min(98, relativeScore)); // Clamp for UI
            
            return { 
                ...s, 
                relativeScore: Number(relativeScore.toFixed(1))
            };
        });

        // 5. Filter by search query and sort
        return studentsWithRelativeScores
            .filter(student => 
                searchQuery === '' || 
                student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                student.studentNumber.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0)); // Still sort by raw weighted performance

    }, [studentsData, activeCohort, searchQuery]);

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1400px]">
            <div className="flex justify-between items-end border-b border-slate-700/50 pb-4">
                <div>
                    <h2 className="text-2xl font-semibold mb-1 flex items-center gap-2">
                        <Trophy className="text-amber-400" size={24} />
                        Program Dashboard
                    </h2>
                    <p className="text-slate-400">View and rank student engagement relative to their cohort performance curve.</p>
                </div>
                
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 border border-slate-700 rounded-md">
                        <Filter size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-300">Cohort:</span>
                        <select 
                            value={activeCohort}
                            onChange={(e) => setActiveCohort(e.target.value)}
                            className="bg-transparent text-slate-200 text-sm font-bold focus:outline-none border-none cursor-pointer"
                        >
                            {availableCohorts.map(c => (
                                <option key={c} value={c} className="bg-slate-800 text-slate-200">{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search student..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-md text-sm w-64 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                    </div>
                </div>
            </div>

            <div className="admin-card overflow-hidden border border-slate-700/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-800/30 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                <th className="px-6 py-4 w-16 text-center">Rank</th>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-indigo-400">
                                        Engagement Stack 
                                        <ArrowUpDown size={14} className="opacity-50" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center">Projects Assessed</th>
                                <th className="px-6 py-4 text-center">CBPs</th>
                                <th className="px-6 py-4 text-center">Conflexions</th>
                                <th className="px-6 py-4 text-center">BoW Score</th>
                                <th className="px-6 py-4 text-center">Avg Mentor</th>
                                <th className="px-6 py-4 text-center">Avg Self</th>
                                <th className="px-6 py-4 text-center">Avg Peer</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {processedStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                                        No students found in cohort "{activeCohort}".
                                    </td>
                                </tr>
                            ) : (
                                processedStudents.map((student, index) => (
                                    <tr 
                                        key={student.id} 
                                        className="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors group"
                                    >
                                        <td className="px-6 py-4 text-center font-bold text-slate-500 group-hover:text-slate-300">
                                            #{index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className={`w-3 h-3 rounded-full shrink-0 ${getEngagementColor(student.relativeScore || 0)} shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
                                                    title={`Relative Zone Score: ${student.relativeScore}% (Raw: ${student.engagementScore}%)`}
                                                />
                                                <div>
                                                    <Link 
                                                        href={`/dashboard/${student.id}`} 
                                                        className="font-medium text-slate-200 hover:text-indigo-400 focus:outline-none focus:text-indigo-400 transition-colors"
                                                        target="_blank"
                                                    >
                                                        {student.name}
                                                    </Link>
                                                    <p className="text-xs text-slate-500 mt-0.5">{student.studentNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="font-bold text-base text-slate-200 w-10">
                                                    {student.engagementScore}%
                                                </div>
                                                <div className="flex-1 max-w-[120px] bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                                                        style={{ width: `${student.engagementScore}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-300 font-medium">
                                            {student.projectsAssessed} / {totalPhases}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-300">
                                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-medium border border-emerald-500/20">
                                                {student.cbpCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-300">
                                            <span className="bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded font-medium border border-cyan-500/20">
                                                {student.conflexionCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-300">
                                            <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded font-medium border border-amber-500/20">
                                                {student.bowScore}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-300 font-bold">
                                            {student.avgMentorScore !== '0.0' ? student.avgMentorScore : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-300 font-bold">
                                            {student.avgSelfScore !== '0.0' ? student.avgSelfScore : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-300 font-bold">
                                            {student.avgPeerScore !== '0.0' ? student.avgPeerScore : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
