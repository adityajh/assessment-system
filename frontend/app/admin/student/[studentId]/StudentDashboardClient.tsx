'use client';

import React, { useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell, ReferenceLine, LineChart, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const getGapColor = (delta: number) => {
    if (delta <= -1.5) return '#ef4444'; // Red
    if (delta < 0) return '#f59e0b'; // Amber
    if (delta === 0) return '#94a3b8'; // Slate
    if (delta > 0 && delta < 1.5) return '#06b6d4'; // Cyan
    return '#10b981'; // Emerald
};

const getHeatmapColor = (score: number | null | undefined) => {
    if (!score) return '#f1f5f9'; // Print friendly empty
    if (score < 5) return '#fca5a5'; // Red 300
    if (score < 7) return '#fcd34d'; // Amber 300
    if (score < 9) return '#6ee7b7'; // Emerald 300
    return '#67e8f9'; // Cyan 300
};

const getHeatmapTextColor = (score: number | null | undefined) => {
    if (!score) return '#94a3b8';
    if (score < 5) return '#7f1d1d';
    if (score < 7) return '#78350f';
    if (score < 9) return '#064e3b';
    return '#164e63';
};

export default function StudentDashboardClient({
    studentData, gapData, heatmapData, consolidatedHeatmapData, heatmapProjects,
    trajectoryData, kpiData, peerRatingData, peerRatingProjects,
    projectDomainScores, topStrengths, growthAreas, distributionData, mentorNotes
}: any) {

    const handlePrint = () => {
        window.print();
    };

    if (!studentData) return <div className="p-8">Loading student data...</div>;

    return (
        <div className="bg-slate-50 min-h-screen text-slate-900 pb-20 print:pb-0 print:bg-white">
            {/* Action Bar (Hidden in Print) */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm print:hidden">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Student Dashboard View</h1>
                    <p className="text-sm text-slate-500">Optimized for 1:1 sessions and PDF export. Use landscape mode for best PDF results.</p>
                </div>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Export to PDF
                </button>
            </div>

            <div className="max-w-[1200px] mx-auto p-8 print:p-0 print:max-w-none">

                {/* PAGE 1: HERO & KPIs */}
                <div className="print:break-inside-avoid mb-10">
                    <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-900 mb-1">{studentData.canonical_name}</h1>
                            <p className="text-lg text-slate-600 font-medium tracking-wide">
                                ID: {studentData.student_number} | Cohort: {studentData.cohort || '2025'}
                            </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <img src="/images/logo-light.png" alt="Let's Enterprise" className="h-[40px] mb-2 object-contain print:h-[50px]" />
                            <p className="text-xl font-semibold text-slate-800">Student Readiness Report</p>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm text-center">
                            <h4 className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-2">Projects Assessed</h4>
                            <span className="text-4xl font-black text-indigo-600">{kpiData?.projectsCount || '0/0'}</span>
                        </div>
                        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm text-center">
                            <h4 className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-2">CBPs Completed</h4>
                            <span className="text-4xl font-black text-emerald-600">{kpiData?.cbpCount || 0}</span>
                        </div>
                        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm text-center">
                            <h4 className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-2">Conflexions</h4>
                            <span className="text-4xl font-black text-cyan-600">{kpiData?.conflexionCount || 0}</span>
                        </div>
                        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm text-center">
                            <h4 className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-2">BOW Score</h4>
                            <span className="text-4xl font-black text-amber-600">{kpiData?.bowScore || '0.00'}</span>
                        </div>
                    </div>
                </div>

                {/* Trajectory */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-10 print:break-inside-avoid">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Learning Trajectory Over Time</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trajectoryData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="project" stroke="#64748b" tick={{ fill: '#475569', fontSize: 12 }} />
                                <YAxis stroke="#64748b" tick={{ fill: '#475569', fontSize: 12 }} domain={[0, 10]} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#cbd5e1', borderRadius: '8px' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line connectNulls={false} type="monotone" dataKey="mentor" name="Mentor Average" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                                <Line connectNulls={false} type="monotone" dataKey="self" name="Self Average" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* PAGE 2 / Section 3: Self-Awareness & Strengths/Weaknesses */}
                <div className="grid grid-cols-2 gap-6 mb-10 print:break-inside-avoid">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Self-Awareness Gap (Overall)</h3>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={gapData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={true} />
                                    <XAxis type="number" stroke="#64748b" tick={{ fill: '#475569', fontSize: 12 }} domain={[-4, 4]} ticks={[-4, -2, 0, 2, 4]} />
                                    <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} width={120} />
                                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }} />
                                    <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={2} />
                                    <Bar dataKey="delta" radius={[0, 4, 4, 0]}>
                                        {gapData?.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={getGapColor(entry.delta)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex-1">
                            <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Top 3 Strengths</h3>
                            <div className="flex flex-col gap-3">
                                {topStrengths?.map((item: any, i: number) => (
                                    <div key={i} className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="text-slate-800 font-semibold">{item.name}</p>
                                            <p className="text-slate-500 text-xs font-medium">{item.domain}</p>
                                        </div>
                                        <div className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-md">
                                            {item.score}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex-1">
                            <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Primary Areas to Grow</h3>
                            <div className="flex flex-col gap-3">
                                {growthAreas?.map((item: any, i: number) => (
                                    <div key={i} className="bg-rose-50 border border-rose-100 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="text-slate-800 font-semibold">{item.name}</p>
                                            <p className="text-slate-500 text-xs font-medium">{item.domain}</p>
                                        </div>
                                        <div className="bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded-md">
                                            {item.score}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PAGE 3 / Section 4: Consolidated Mastery Heatmap */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-10 print:break-inside-avoid">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Program Mastery Profile (Domain Averages)</h3>
                    <div className="w-full overflow-hidden">
                        {/* Header Row */}
                        <div className="flex mb-2 border-b border-slate-200 pb-2">
                            <div className="w-64 shrink-0 text-sm font-bold text-slate-600 uppercase tracking-wide">Readiness Domain</div>
                            <div className="flex gap-1 flex-1">
                                {heatmapProjects?.map((proj: string) => (
                                    <div key={proj} className="flex-1 text-center text-xs font-bold text-slate-500 truncate px-1" title={proj}>
                                        {proj}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Data Rows */}
                        <div className="flex flex-col gap-1">
                            {consolidatedHeatmapData?.map((row: any, idx: number) => (
                                <div key={idx} className="flex items-center">
                                    <div className="w-64 shrink-0 text-sm font-semibold text-slate-700 truncate pr-4">
                                        {row.domain}
                                    </div>
                                    <div className="flex gap-1 flex-1">
                                        {heatmapProjects?.map((proj: string) => {
                                            const score = row.scores[proj];
                                            return (
                                                <div
                                                    key={proj}
                                                    className="flex-1 h-10 rounded-md flex items-center justify-center text-sm font-bold border border-slate-100"
                                                    style={{
                                                        backgroundColor: getHeatmapColor(score),
                                                        color: getHeatmapTextColor(score),
                                                    }}
                                                >
                                                    {score ? score.toFixed(1) : '-'}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-8 flex gap-4 text-xs font-medium text-slate-500 items-center justify-center bg-slate-50 rounded-lg p-3">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: '#fee2e2' }}></div> 1-4.9 (Novice)</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: '#fef3c7' }}></div> 5-6.9 (Developing)</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: '#d1fae5' }}></div> 7-8.9 (Competent)</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: '#cffafe' }}></div> 9-10 (Advanced)</div>
                            <div className="flex items-center gap-2 ml-4"><div className="w-4 h-4 rounded" style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}></div> Not Assessed</div>
                        </div>
                    </div>
                </div>

                {/* PAGE 4 / Section 5: Peer Feedback */}
                {peerRatingData && peerRatingData.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-10 print:break-inside-avoid">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Peer Feedback Profile (Averages)</h3>
                        <div className="h-[400px] w-full max-w-2xl mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={peerRatingData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#94a3b8" />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    {peerRatingProjects?.map((proj: string, idx: number) => {
                                        const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
                                        return (
                                            <Radar
                                                key={proj}
                                                name={proj}
                                                dataKey={proj}
                                                stroke={colors[idx % colors.length]}
                                                strokeWidth={2}
                                                fill={colors[idx % colors.length]}
                                                fillOpacity={0.3}
                                            />
                                        );
                                    })}
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* PAGE 5 / Section 6: Mentor Notes Feed */}
                {mentorNotes && mentorNotes.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-10 print:break-inside-avoid">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Qualitative Mentor Feedback</h3>
                        <div className="flex flex-col gap-6">
                            {mentorNotes.map((note: any) => (
                                <div key={note.id} className="relative pl-6 pb-2 border-l-2 border-indigo-100 last:border-0 last:pb-0">
                                    <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7.5px] top-1 border-2 border-white ring-2 ring-indigo-100"></div>
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl rounded-tl-none -mt-2">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="font-bold text-slate-800 mr-2">{note.created_by || 'Mentor'}</span>
                                                <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-md">
                                                    {note.projects?.name || 'General'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">
                                                {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{note.note_text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Print Footer */}
                <div className="hidden print:block text-center text-xs text-slate-400 mt-12 border-t border-slate-200 pt-4">
                    Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} from Let's Enterprise Assessment System.
                </div>
            </div>

            {/* Print specific styles */}
            <style jsx global>{`
                @media print {
                    body {
                        background-color: white !important;
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    /* Hide anything that isn't the specific content area if needed, though Tailwind print classes handle most */
                    @page {
                        margin: 10mm;
                        size: A4 portrait;
                    }
                }
            `}</style>
        </div>
    );
}
