'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell, ReferenceLine, LineChart, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ReferenceArea, ZAxis, ComposedChart } from 'recharts';
import { 
    Zap, Award, Target, 
    Calendar, Edit3, CheckCircle2,
    TrendingUp, Download, ChevronDown, ChevronUp, Map, Eye, MessageSquare, Briefcase, ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
    projectDomainScores, topStrengths, growthAreas, distributionData, mentorNotes,
    engagementDistributionData, peerStackedByParamData, peerStackedByParamProjects,
    topDomainStrengths, growthDomainAreas,
    initialMission, missionDate
}: any) {
    const [savedMission, setSavedMission] = React.useState(initialMission || '');
    const [isEditingMission, setIsEditingMission] = React.useState(false);
    const [isSavingMission, setIsSavingMission] = React.useState(false);
    const [lastSavedDate, setLastSavedDate] = React.useState(missionDate);

    const supabase = createClient();

    const handleSaveMission = async () => {
        setIsSavingMission(true);
        try {
            const { error } = await supabase
                .from('mentor_notes')
                .insert({
                    student_id: studentData.id,
                    note_text: savedMission,
                    note_type: 'mission',
                    created_by: 'Dashboard UI',
                    date: new Date().toISOString().split('T')[0]
                });

            if (error) throw error;
            setLastSavedDate(new Date().toISOString().split('T')[0]);
            setIsEditingMission(false);
        } catch (err) {
            console.error('Error saving mission:', err);
            alert('Failed to save mission. Please try again.');
        } finally {
            setIsSavingMission(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!studentData) return <div className="p-8">Loading student data...</div>;

    return (
        <div className="bg-slate-50 min-h-screen text-slate-900 pb-20 print:pb-0 print:bg-white">
            <div className="max-w-[1200px] mx-auto p-8 pt-12 print:p-0 print:max-w-none">

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
                            <img src="/images/logo-light.png" alt="Let's Enterprise" className="h-[80px] mb-2 object-contain print:h-[100px]" />
                            <p className="text-xl font-semibold text-slate-800">Student Dashboard</p>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
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

                    {/* Engagement Stack */}
                    {engagementDistributionData && engagementDistributionData.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-8 print:break-inside-avoid">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
                                <h3 className="text-xl font-bold text-slate-800">Relative Engagement Stack</h3>
                                {(() => {
                                    const normalizedScore = engagementDistributionData?.find((d: any) => d.isCurrentStudent)?.score || kpiData?.engagementScore || 0;
                                    // relativePosition is the un-jittered Z-score based position (0-100)
                                    const relativePosition = engagementDistributionData?.find((d: any) => d.isCurrentStudent)?.relativeScore || 0; 
                                    
                                    let color = 'text-sky-600';
                                    let bgColor = 'bg-sky-100';
                                    let zone = 'Leading';
                                    if (relativePosition < 25) { color = 'text-rose-600'; bgColor = 'bg-rose-100'; zone = 'Syncing'; }
                                    else if (relativePosition < 50) { color = 'text-amber-600'; bgColor = 'bg-amber-100'; zone = 'Connecting'; }
                                    else if (relativePosition < 75) { color = 'text-emerald-600'; bgColor = 'bg-emerald-100'; zone = 'Engaging'; }

                                    return (
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-2 mr-4">
                                                {kpiData?.hasConsistencyBadge && (
                                                    <div className="flex items-center justify-center p-1.5 bg-emerald-50 border border-emerald-200 rounded-full" title="Consistency Badge">
                                                        <Zap className="w-4 h-4 text-emerald-500" />
                                                    </div>
                                                )}
                                                {kpiData?.hasBreadthBadge && (
                                                    <div className="flex items-center justify-center p-1.5 bg-amber-50 border border-amber-200 rounded-full" title="Breadth Badge">
                                                        <Award className="w-4 h-4 text-amber-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full ${bgColor} ${color} font-bold text-sm tracking-wide shadow-sm border border-slate-200 border-opacity-50`}>
                                                Zone: {zone}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="h-[120px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: 20 }}>
                                        <defs>
                                            <linearGradient id="syncingGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.20} />
                                                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="connectingGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.20} />
                                                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="engagingGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.20} />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="leadingGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.20} />
                                                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>

                                        <ReferenceArea x1={0} x2={25} fill="url(#syncingGrad)" stroke="none" label={{ position: 'top', value: 'SYNCING', fill: '#f43f5e', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', dy: -5 }} />
                                        <ReferenceArea x1={25} x2={50} fill="url(#connectingGrad)" stroke="none" label={{ position: 'top', value: 'CONNECTING', fill: '#f59e0b', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', dy: -5 }} />
                                        <ReferenceArea x1={50} x2={75} fill="url(#engagingGrad)" stroke="none" label={{ position: 'top', value: 'ENGAGING', fill: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', dy: -5 }} />
                                        <ReferenceArea x1={75} x2={100} fill="url(#leadingGrad)" stroke="none" label={{ position: 'top', value: 'LEADING', fill: '#0ea5e9', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', dy: -5 }} />

                                        <ReferenceLine x={62.5} stroke="#94a3b8" strokeDasharray="3 3" strokeOpacity={0.5} label={{ position: 'top', value: 'Pace Car', fill: '#94a3b8', fontSize: 11, fontWeight: 500, dy: -20 }} />

                                        <ReferenceLine y={0} stroke="#f1f5f9" strokeWidth={12} strokeLinecap="round" />
                                        <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} strokeLinecap="round" strokeOpacity={0.3} />

                                        <XAxis type="number" dataKey="displayScore" name="Engagement Score" domain={[0, 100]} hide />
                                        <YAxis type="number" dataKey="yAxis" domain={[-1, 1]} hide />

                                        <RechartsTooltip
                                            cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
                                            contentStyle={{ backgroundColor: '#fff', borderColor: '#cbd5e1', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value, name, props) => {
                                                if (name === "yAxis") return [null, null];
                                                const rawScore = props.payload?.score || 0;
                                                const trueRelativeScore = props.payload?.relativeScore || value; // Fallback to displayScore if relativeScore is missing
                                                
                                                let zone = "Leading";
                                                if (Number(trueRelativeScore) < 25) zone = "Syncing";
                                                else if (Number(trueRelativeScore) < 50) zone = "Connecting";
                                                else if (Number(trueRelativeScore) < 75) zone = "Engaging";
                                                return [`${rawScore} (${zone})`, props.payload.isCurrentStudent ? studentData.canonical_name : "Cohort Score"];
                                            }}
                                            labelFormatter={() => ''}
                                        />
                                        <Scatter name="Students" data={engagementDistributionData} isAnimationActive={false}>
                                            {engagementDistributionData.map((entry: any, index: number) => {
                                                const isSelected = entry.isCurrentStudent;
                                                return (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={isSelected ? '#6366f1' : '#cbd5e1'}
                                                        r={isSelected ? 8 : 5}
                                                        opacity={isSelected ? 1 : 0.7}
                                                        stroke={isSelected ? '#ffffff' : 'none'}
                                                        strokeWidth={isSelected ? 2 : 0}
                                                        style={{ zIndex: isSelected ? 10 : 1 }}
                                                    />
                                                );
                                            })}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                {/* Section: Project Impact Reports (NEW) */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-10 print:hidden transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-2">
                        <Briefcase className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-xl font-bold text-slate-800">Project Impact Reports</h3>
                        <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">New</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {peerRatingProjects?.map((p: any) => (
                            <Link
                                key={p.id}
                                href={`/dashboard/${studentData.id}/project/${p.id}`}
                                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-indigo-600 hover:border-indigo-500 transition-all text-left"
                            >
                                <div className="flex flex-col gap-1 overflow-hidden">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white/70">Project Analysis</span>
                                    <span className="font-bold text-slate-900 group-hover:text-white truncate">{p.name}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
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
                                <Line connectNulls={true} type="monotone" dataKey="mentor" name="Mentor Average" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                                <Line connectNulls={true} type="monotone" dataKey="self" name="Self Average" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* PAGE 2 / Section 3: Self-Awareness Gap Bar */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-10 print:break-inside-avoid">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">Self-Awareness Gap Dashboard</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-3xl">
                        This view shows the gap between the student's <span className="text-slate-900 font-bold border-b-2 border-slate-200">Self Assessment</span> (White dot) and the <span className="text-indigo-600 font-bold border-b-2 border-indigo-200">Mentor's Assessment</span> (Indigo dot).
                        <br />
                        <span className="text-rose-500 font-medium">Red line = Overconfident</span> <span className="text-slate-400 mx-2">|</span> <span className="text-emerald-500 font-medium">Green line = Underconfident</span>
                    </p>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={gapData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={true} />
                                <XAxis type="number" stroke="#64748b" tick={{ fill: '#475569' }} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} width={140} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#fff', borderColor: '#cbd5e1', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={((value: any, name: string | undefined, props: any) => {
                                        if (name === 'range') {
                                            const delta = props.payload.delta;
                                            return [`${delta}%`, "Variance"];
                                        }
                                        const cleanName = name || '';
                                        return [value, cleanName.charAt(0).toUpperCase() + cleanName.slice(1)];
                                    }) as any}
                                />
                                <Bar dataKey="range" barSize={8} isAnimationActive={false}>
                                    {gapData?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.delta > 0 ? '#ef4444' : entry.delta < 0 ? '#10b981' : '#94a3b8'} opacity={0.5} />
                                    ))}
                                </Bar>
                                <Scatter dataKey="mentor" fill="#4f46e5" />
                                <Scatter dataKey="self" fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1} />
                            </ComposedChart>
                        </ResponsiveContainer>
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

                {/* PAGE 4 / Section 5: Peer Feedback Grouped Bar */}
                {peerStackedByParamData && peerStackedByParamData.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-10 print:break-inside-avoid">
                        <h3 className="text-xl font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">Peer Rating Across Projects</h3>
                        <p className="text-slate-500 text-sm mb-6 max-w-3xl">
                            Each bar shows the student's <strong className="text-slate-700">deviation from the cohort average</strong> per project. <br />
                            <span className="text-emerald-500 font-medium">+ Positive</span> bars mean higher than cohort average. <span className="text-rose-500 font-medium">- Negative</span> bars mean lower.
                        </p>
                        <div className="h-[450px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={peerStackedByParamData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }} barGap={2} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="parameter" stroke="#64748b" tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                                    <YAxis stroke="#64748b" tick={{ fill: '#475569' }} domain={['auto', 'auto']} tickFormatter={(value) => value > 0 ? `+${value}` : value.toString()} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#fff', borderColor: '#cbd5e1', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={((value: number | undefined, name: string | undefined) => {
                                            if (value === undefined || value === null) return ['-', name ?? ''];
                                            return [value > 0 ? `+${value}` : value, name ?? ''];
                                        }) as any}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={2} label={{ position: 'insideTopRight', value: 'Cohort Average', fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                                    {peerStackedByParamProjects?.map((proj: string, idx: number) => {
                                        const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#14b8a6', '#f43f5e', '#a855f7'];
                                        return (
                                            <Bar
                                                key={proj}
                                                dataKey={proj}
                                                name={proj}
                                                fill={colors[idx % colors.length]}
                                                radius={[4, 4, 0, 0]}
                                                minPointSize={3}
                                            />
                                        );
                                    })}
                                </BarChart>
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
                                        <div className="flex items-center justify-between mb-3 text-xs text-slate-500 font-medium">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">Project: {note.projects?.name || 'General'}</span>
                                                {note.date && (
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">Date: {new Date(note.date).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                            <span>Mentor: {note.created_by || 'Unknown'}</span>
                                        </div>
                                        <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{note.note_text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PAGE 6 / Section 7: Actionable Mission & Focus Areas */}
                <div className="print:break-inside-avoid print:mt-10 mb-10">
                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                        <div className="flex-1 bg-white border border-emerald-100 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                            <h5 className="text-emerald-700 font-bold flex items-center gap-2 border-b border-emerald-50 pb-2">Top 2 Strongest Domains</h5>
                            <div className="flex flex-col gap-3">
                                {topDomainStrengths?.map((item: any, i: number) => (
                                    <div key={i} className="bg-emerald-50 p-4 rounded-lg flex justify-between items-center">
                                        <p className="text-slate-800 font-semibold">{item.name}</p>
                                        <div className="bg-white text-emerald-600 font-black px-3 py-1 rounded-md shadow-sm border border-emerald-100">
                                            {item.score}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 bg-white border border-rose-100 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                            <h5 className="text-rose-700 font-bold flex items-center gap-2 border-b border-rose-50 pb-2">Top 2 Domains for Growth</h5>
                            <div className="flex flex-col gap-3">
                                {growthDomainAreas?.map((item: any, i: number) => (
                                    <div key={i} className="bg-rose-50 p-4 rounded-lg flex justify-between items-center">
                                        <p className="text-slate-800 font-semibold">{item.name}</p>
                                        <div className="bg-white text-rose-600 font-black px-3 py-1 rounded-md shadow-sm border border-rose-100">
                                            {item.score}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border-2 border-indigo-50 rounded-xl p-8 shadow-lg shadow-indigo-100/50 relative overflow-hidden print:bg-white print:border print:border-slate-300">
                        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 print:hidden"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-indigo-950 font-black text-2xl flex items-center gap-3 print:text-indigo-800">
                                <Target className="w-7 h-7 text-indigo-500 print:text-indigo-600" /> Actionable Mission Plan
                            </h4>
                            {lastSavedDate && (
                                <div className="text-[10px] text-slate-400 font-medium">Last updated: {new Date(lastSavedDate).toLocaleDateString()}</div>
                            )}
                        </div>

                        {isEditingMission ? (
                            <div className="flex flex-col gap-4 print:hidden">
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-800 text-[16px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px] shadow-inner"
                                    value={savedMission}
                                    onChange={(e) => setSavedMission(e.target.value)}
                                    placeholder="Write a custom mission for this student..."
                                />
                                <div className="flex gap-2 justify-end">
                                    <button 
                                        onClick={handleSaveMission}
                                        disabled={isSavingMission}
                                        className="px-6 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                                    >
                                        {isSavingMission ? 'Saving...' : 'Save Plan'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="bg-slate-50/80 border border-slate-200 p-6 rounded-xl print:bg-slate-50 print:border-slate-200">
                                    <p className="text-slate-700 leading-relaxed text-lg print:text-slate-800">
                                        {savedMission || (growthDomainAreas?.length > 0 ? <>Your current bottleneck is the <strong className="text-indigo-700 font-extrabold border-b-2 border-indigo-200 pb-0.5 print:text-indigo-700 print:border-indigo-600">{growthDomainAreas[0].name}</strong> domain. Mission for your next project: Focus aggressively on improving your skills within this domain, paying special attention to elements like <strong className="text-emerald-600 font-bold print:text-emerald-700">{growthAreas?.[0]?.name || "your weakest skills"}</strong>.</> : "No clear growth areas identified yet. Keep pushing your boundaries!")}
                                    </p>
                                </div>
                                <div className="flex justify-end print:hidden">
                                    <button onClick={() => setIsEditingMission(true)} className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-700 font-bold transition-colors">
                                        <Edit3 className="w-4 h-4" />
                                        {savedMission ? 'Edit Mission Plan' : 'Set Custom Mission Plan'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

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
