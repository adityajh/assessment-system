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
    // Pre-computed on the server using the shared canonical utility
    engagementScore: number;    // Raw score 0-100
    relativeScore: number;      // Z-score based relative score 0-100
    zone: string;               // 'Syncing' | 'Connecting' | 'Engaging' | 'Leading'
    zoneColor: string;          // Tailwind bg class
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

    // No client-side score re-calculation — zones are pre-computed on the server
    // using the shared canonical utility (lib/utils/engagementScore.ts),
    // which guarantees identical results to the individual student dashboard.

    const processedStudents = useMemo(() => {
        return studentsData
            .filter(s => s.cohort === activeCohort)
            .filter(student => 
                searchQuery === '' || 
                student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                student.studentNumber.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => b.relativeScore - a.relativeScore); // Sort by relative position
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
                                        Relative Zone
                                        <ArrowUpDown size={14} className="opacity-50" />
                                    </div>
                                </th>
                                <th className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        Raw Score
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
                                    <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
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
                                                    className={`w-3 h-3 rounded-full shrink-0 ${student.zoneColor} shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
                                                    title={`Zone: ${student.zone} (Relative: ${student.relativeScore}%, Raw: ${student.engagementScore}%)`}
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
                                            {/* Relative zone — matches individual student dashboard */}
                                            <div className="flex items-center gap-3">
                                                <div className="font-bold text-base text-slate-200 w-12">
                                                    {student.relativeScore.toFixed(0)}%
                                                </div>
                                                <div className="flex-1 max-w-[120px] bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                                                    <div 
                                                        className={`h-full ${student.zoneColor} rounded-full opacity-80`}
                                                        style={{ width: `${student.relativeScore}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-slate-400 font-medium">{student.zone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Raw absolute score bar */}
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm text-slate-400 w-10">
                                                    {student.engagementScore}%
                                                </div>
                                                <div className="flex-1 max-w-[80px] bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
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
