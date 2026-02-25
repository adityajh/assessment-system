'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine, LineChart, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const getGapColor = (delta: number) => {
    if (delta <= -1.5) return '#ef4444'; // Red (highly overconfident)
    if (delta < 0) return '#f59e0b'; // Amber (slightly overconfident)
    if (delta === 0) return '#94a3b8'; // Slate (perfectly aligned)
    if (delta > 0 && delta < 1.5) return '#06b6d4'; // Cyan (slightly underconfident)
    return '#10b981'; // Emerald (highly underconfident / "impostor syndrome")
};

const getHeatmapColor = (score: number | null | undefined) => {
    if (!score) return '#1e293b'; // Slate 800 - Not Assessed
    if (score < 5) return '#ef4444'; // Red
    if (score < 7) return '#f59e0b'; // Amber
    if (score < 9) return '#10b981'; // Emerald
    return '#06b6d4'; // Cyan
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#1e2233] border border-slate-700 p-3 rounded-md shadow-lg">
                <p className="text-slate-200 font-medium mb-2">{label}</p>
                <div className="flex flex-col gap-1 text-sm">
                    <p className="text-indigo-400">Mentor Score: <span className="text-slate-100 font-medium">{data.mentor}</span></p>
                    <p className="text-cyan-400">Self Score: <span className="text-slate-100 font-medium">{data.self}</span></p>
                    <div className="h-px bg-slate-700 my-1"></div>
                    <p className="text-slate-300">
                        Gap (Mentor - Self):{' '}
                        <span className="font-medium" style={{ color: getGapColor(data.delta) }}>
                            {data.delta > 0 ? '+' : ''}{data.delta}
                        </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {data.delta < 0 ? 'Student rated themselves higher than mentor.' :
                            data.delta > 0 ? 'Student rated themselves lower than mentor.' :
                                'Scores are perfectly aligned.'}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function PlaygroundClientPage({ gapData, heatmapData, consolidatedHeatmapData, heatmapProjects, trajectoryData, kpiData, peerRatingData, peerRatingProjects, projectDomainScores, students, studentId }: any) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');

    if (!gapData || !heatmapData || !trajectoryData) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-500 italic">
                Loading production data from Supabase...
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto min-h-0 pd-8 pb-20">
            {/* Student Selector */}
            {students && students.length > 0 && (
                <div className="mb-6 flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-400">Reference Student:</label>
                    <select
                        value={studentId}
                        onChange={(e) => router.push(`/admin/playground?studentId=${e.target.value}`)}
                        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                        {students.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.canonical_name} ({s.student_number})</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-700/50 pb-4 flex-wrap">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    KPI Dashboard
                </button>
                <button
                    onClick={() => setActiveTab('peer-rating')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'peer-rating' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Peer Rating (Radial)
                </button>
                <button
                    onClick={() => setActiveTab('domain-comparison')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'domain-comparison' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Self vs Mentor (Grouped Bar)
                </button>
                <button
                    onClick={() => setActiveTab('self-awareness')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'self-awareness' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Self-Awareness Gap (Bar)
                </button>
                <button
                    onClick={() => setActiveTab('mastery-consolidated')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'mastery-consolidated' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Program Mastery - Consolidated
                </button>
                <button
                    onClick={() => setActiveTab('mastery-detail')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'mastery-detail' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Program Mastery - Detail
                </button>
                <button
                    onClick={() => setActiveTab('trajectory')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'trajectory' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Learning Trajectory (Line)
                </button>
            </div>

            {/* Content Area */}
            <div className="admin-card">
                <div className="mb-6">
                    <h3 className="text-xl font-medium text-slate-100">
                        {activeTab === 'dashboard' && 'KPI Dashboard'}
                        {activeTab === 'peer-rating' && 'Peer Rating Feedback by Project'}
                        {activeTab === 'domain-comparison' && 'Self vs Mentor Readiness by Project'}
                        {activeTab === 'self-awareness' && 'Self-Awareness Gap Visualization'}
                        {activeTab === 'mastery-consolidated' && 'Program Mastery - Consolidated (Domain Averages)'}
                        {activeTab === 'mastery-detail' && 'Program Mastery - Detail (By Parameter)'}
                        {activeTab === 'trajectory' && 'Learning Trajectory Over Time'}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Displaying live production data for the selected student.
                    </p>
                </div>

                {/* Chart Container placeholder */}
                <div className="h-[500px] w-full bg-slate-800/20 rounded-lg border border-slate-700/50 p-6 flex flex-col">
                    {activeTab === 'self-awareness' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gapData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={true} />
                                <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} domain={[-4, 4]} ticks={[-4, -3, -2, -1, 0, 1, 2, 3, 4]} />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} width={120} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.4 }} />
                                <ReferenceLine x={0} stroke="#f1f5f9" strokeWidth={2} />
                                <Bar dataKey="delta" radius={[0, 4, 4, 0]}>
                                    {gapData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={getGapColor(entry.delta)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {activeTab === 'mastery-consolidated' && (
                        <div className="w-full h-full flex flex-col overflow-auto">
                            <div className="inline-block min-w-max">
                                {/* Header Row */}
                                <div className="flex mb-2 sticky top-0 bg-[#1a1d27] z-10 pt-2 pb-2">
                                    <div className="w-64 shrink-0 text-sm font-semibold text-slate-400">Readiness Domain</div>
                                    <div className="flex gap-1">
                                        {heatmapProjects.map((proj: string) => (
                                            <div key={proj} className="w-24 text-center text-xs font-semibold text-slate-400 rotate-0">
                                                {proj}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Data Rows */}
                                <div className="flex flex-col gap-1">
                                    {consolidatedHeatmapData?.map((row: any, idx: number) => (
                                        <div key={idx} className="flex items-center group">
                                            <div className="w-64 shrink-0 text-sm font-medium text-slate-300 truncate pr-4" title={row.domain}>
                                                {row.domain}
                                            </div>
                                            <div className="flex gap-1">
                                                {heatmapProjects.map((proj: string) => {
                                                    const score = row.scores[proj];
                                                    return (
                                                        <div
                                                            key={proj}
                                                            className="w-24 h-10 rounded-sm flex items-center justify-center text-sm font-medium cursor-default transition-all hover:scale-105 hover:z-20 hover:shadow-lg border border-transparent"
                                                            style={{
                                                                backgroundColor: getHeatmapColor(score),
                                                                color: score ? '#fff' : 'transparent',
                                                                borderColor: score ? 'rgba(255,255,255,0.1)' : 'transparent'
                                                            }}
                                                            title={`${row.domain} avg in ${proj}: ${score ? score : 'Not Assessed'}`}
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
                                <div className="mt-8 flex gap-4 text-xs text-slate-400 items-center border-t border-slate-700/50 pt-4">
                                    <span>Mastery Scale:</span>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }}></div> 1-4.9 (Novice)</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#f59e0b' }}></div> 5-6.9 (Developing)</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#10b981' }}></div> 7-8.9 (Competent)</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#06b6d4' }}></div> 9-10 (Advanced)</div>
                                    <div className="flex items-center gap-1 ml-4"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#1e293b' }}></div> Not Assessed</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'mastery-detail' && (
                        <div className="w-full h-full flex flex-col overflow-auto">
                            <div className="inline-block min-w-max">
                                {/* Header Row */}
                                <div className="flex mb-2 sticky top-0 bg-[#1a1d27] z-10 pt-2 pb-2">
                                    <div className="w-64 shrink-0 text-sm font-semibold text-slate-400">Parameter</div>
                                    <div className="flex gap-1">
                                        {heatmapProjects.map((proj: string) => (
                                            <div key={proj} className="w-24 text-center text-xs font-semibold text-slate-400 rotate-0">
                                                {proj}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Data Rows */}
                                <div className="flex flex-col gap-1">
                                    {heatmapData?.map((row: any, idx: number) => (
                                        <div key={idx} className="flex items-center group">
                                            <div className="w-64 shrink-0 text-xs text-slate-300 truncate pr-4" title={row.parameter}>
                                                <span className="text-slate-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">[{row.domain.substring(0, 3).toUpperCase()}]</span>
                                                {row.parameter}
                                            </div>
                                            <div className="flex gap-1">
                                                {heatmapProjects.map((proj: string) => {
                                                    const score = row.scores[proj];
                                                    return (
                                                        <div
                                                            key={proj}
                                                            className="w-24 h-8 rounded-sm flex items-center justify-center text-xs font-medium cursor-default transition-all hover:scale-105 hover:z-20 hover:shadow-lg border border-transparent"
                                                            style={{
                                                                backgroundColor: getHeatmapColor(score),
                                                                color: score ? '#fff' : 'transparent',
                                                                borderColor: score ? 'rgba(255,255,255,0.1)' : 'transparent'
                                                            }}
                                                            title={`${row.parameter} in ${proj}: ${score ? score : 'Not Assessed'}`}
                                                        >
                                                            {score ? score : '-'}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Legend */}
                                <div className="mt-8 flex gap-4 text-xs text-slate-400 items-center border-t border-slate-700/50 pt-4">
                                    <span>Mastery Scale:</span>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }}></div> 1-4 (Novice)</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#f59e0b' }}></div> 5-6 (Developing)</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#10b981' }}></div> 7-8 (Competent)</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#06b6d4' }}></div> 9-10 (Advanced)</div>
                                    <div className="flex items-center gap-1 ml-4"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#1e293b' }}></div> Not Assessed</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'trajectory' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trajectoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="project" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} domain={[0, 10]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e2233', borderColor: '#334155', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line connectNulls={true} type="monotone" dataKey="mentor" name="Average Mentor Score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#1e2233' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Line connectNulls={true} type="monotone" dataKey="self" name="Average Self Score" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#1e2233' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}

                    {activeTab === 'dashboard' && kpiData && (
                        <div className="flex gap-6 w-full h-full p-4 items-center justify-center">
                            <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-lg flex-1 flex flex-col justify-center items-center h-48 shadow-lg">
                                <h4 className="text-slate-400 text-sm font-medium mb-3">Projects Assessed</h4>
                                <span className="text-5xl font-bold text-indigo-400">{kpiData.projectsCount}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-lg flex-1 flex flex-col justify-center items-center h-48 shadow-lg">
                                <h4 className="text-slate-400 text-sm font-medium mb-3">CBPs Completed</h4>
                                <span className="text-5xl font-bold text-emerald-400">{kpiData.cbpCount}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-lg flex-1 flex flex-col justify-center items-center h-48 shadow-lg">
                                <h4 className="text-slate-400 text-sm font-medium mb-3">Conflexions</h4>
                                <span className="text-5xl font-bold text-cyan-400">{kpiData.conflexionCount}</span>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-lg flex-1 flex flex-col justify-center items-center h-48 shadow-lg">
                                <h4 className="text-slate-400 text-sm font-medium mb-3">BOW Score</h4>
                                <span className="text-5xl font-bold text-amber-400">{kpiData.bowScore}</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'peer-rating' && peerRatingData && peerRatingData.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={peerRatingData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#64748b" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e2233', borderColor: '#334155', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                {peerRatingProjects?.map((proj: string, idx: number) => {
                                    const colors = ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];
                                    return (
                                        <Radar
                                            key={proj}
                                            name={proj}
                                            dataKey={proj}
                                            stroke={colors[idx % colors.length]}
                                            fill={colors[idx % colors.length]}
                                            fillOpacity={0.4}
                                        />
                                    );
                                })}
                            </RadarChart>
                        </ResponsiveContainer>
                    )}
                    {activeTab === 'peer-rating' && (!peerRatingData || peerRatingData.length === 0) && (
                        <div className="flex-1 flex items-center justify-center text-slate-500 italic">
                            No peer feedback recorded for this student.
                        </div>
                    )}

                    {activeTab === 'domain-comparison' && projectDomainScores && projectDomainScores.length > 0 && (
                        <div className="w-full h-full flex gap-2 pb-2 pr-4 overflow-x-auto custom-scrollbar">
                            {projectDomainScores.map((projData: any, idx: number) => (
                                <div key={idx} className="flex-1 min-w-[120px] h-full border border-slate-800 bg-[#161b22] rounded-lg p-2 flex flex-col">
                                    <h4 className="text-indigo-400 font-medium mb-2 text-center text-sm truncate" title={projData.project}>{projData.project}</h4>
                                    <div className="flex-1 min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={projData.categories} margin={{ top: 0, right: 0, left: -25, bottom: 20 }} barGap={0} barCategoryGap="20%">
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis dataKey="domain" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={0} angle={-35} textAnchor="end" height={60} />
                                                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 10]} />
                                                <Tooltip
                                                    cursor={{ fill: '#334155', opacity: 0.2 }}
                                                    contentStyle={{ backgroundColor: '#1e2233', borderColor: '#334155', color: '#f1f5f9' }}
                                                />
                                                <Legend wrapperStyle={{ paddingTop: '5px', fontSize: 10 }} iconSize={8} />
                                                <Bar dataKey="self" name="Self" fill="#06b6d4" radius={[2, 2, 0, 0]} maxBarSize={12} minPointSize={1} />
                                                <Bar dataKey="mentor" name="Mentor" fill="#8b5cf6" radius={[2, 2, 0, 0]} maxBarSize={12} minPointSize={1} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'domain-comparison' && (!projectDomainScores || projectDomainScores.length === 0) && (
                        <div className="flex-1 flex items-center justify-center text-slate-500 italic">
                            No domain-level assessment data recorded for this student.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
