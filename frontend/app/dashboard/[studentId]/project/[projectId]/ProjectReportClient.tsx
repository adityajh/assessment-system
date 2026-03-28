"use client";

import React, { useMemo, useRef, useState } from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    Cell,
    ReferenceLine
} from 'recharts';
import { 
    Building2, 
    User, 
    FileText, 
    Star,
    ChevronRight,
    Briefcase,
    BarChart2,
    MessageSquare,
    ArrowLeft,
    Printer,
    ChevronDown,
    ChevronUp,
    Quote,
    Target
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReadinessDomain, ReadinessParameter, Assessment } from '@/lib/supabase/queries/assessments';

interface ProjectReportClientProps {
    student: any;
    project: any;
    domains: ReadinessDomain[];
    parameters: ReadinessParameter[];
    assessments: Assessment[];
    peerSummary: any;
    notes: any[];
    allProjects: any[];
    cohortPeerSummary: any[];
}

const DOMAIN_COLORS: Record<string, string> = {
    'Commercial Readiness': '#f59e0b',
    'Entrepreneurial Readiness': '#10b981',
    'Marketing Readiness': '#ec4899',
    'Innovation Readiness': '#8b5cf6',
    'Operational Readiness': '#3b82f6',
    'Professional Readiness': '#14b8a6',
};

export default function ProjectReportClient({
    student,
    project,
    domains,
    parameters,
    assessments,
    peerSummary,
    notes,
    allProjects,
    cohortPeerSummary
}: ProjectReportClientProps) {
    const reportRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});

    const toggleDomain = (domainId: string) => {
        setExpandedDomains(prev => ({
            ...prev,
            [domainId]: !prev[domainId]
        }));
    };

    // 1. Aggregate Domain Scores
    const domainChartData = useMemo(() => {
        return domains.map(domain => {
            const domainAssessments = assessments.filter(a => {
                const param = (a as any).readiness_parameters;
                return param && param.domain_id === domain.id;
            });

            const getAvg = (type: string) => {
                const filtered = domainAssessments.filter(a => a.assessment_type === type && a.normalized_score !== null);
                if (filtered.length === 0) return null;
                const sum = filtered.reduce((acc, curr) => acc + (curr.normalized_score || 0), 0);
                return parseFloat((sum / filtered.length).toFixed(1));
            };

            return {
                name: domain.short_name.toUpperCase(),
                fullName: domain.name,
                mentor: getAvg('mentor'),
                self: getAvg('self'),
                client: getAvg('client'),
                color: DOMAIN_COLORS[domain.name] || '#6366f1'
            };
        });
    }, [domains, assessments]);

    // 2. Peer Feedback Chart Data (Diverging on Delta)
    const peerChartData = useMemo(() => {
        if (!peerSummary) return [];

        const traits = [
            { key: 'avg_quality_of_work', label: 'Quality of Work' },
            { key: 'avg_initiative_ownership', label: 'Initiative & Ownership' },
            { key: 'avg_communication', label: 'Communication' },
            { key: 'avg_collaboration', label: 'Collaboration' },
            { key: 'avg_growth_mindset', label: 'Growth Mindset' }
        ];

        return traits.map(trait => {
            const studentScore = peerSummary[trait.key] || 0;
            // Calculate cohort average for this trait for this project
            const cohortAvg = cohortPeerSummary.length > 0
                ? cohortPeerSummary.reduce((acc, curr) => acc + (curr[trait.key] || 0), 0) / cohortPeerSummary.length
                : 0;
            
            const delta = studentScore - cohortAvg;

            return {
                label: trait.label,
                studentScore: studentScore,
                cohortAvg: parseFloat(cohortAvg.toFixed(2)),
                delta: parseFloat(delta.toFixed(2))
            };
        });
    }, [peerSummary, cohortPeerSummary]);

    const handlePrint = () => {
        window.print();
    };

    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProjectId = e.target.value;
        if (newProjectId && newProjectId !== project.id) {
            router.push(`/dashboard/${student.id}/project/${newProjectId}`);
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 pb-20 p-4 md:p-8 font-sans" ref={reportRef}>
            {/* Navigation (Hidden on Print) */}
            <div className="max-w-5xl mx-auto mb-6 flex flex-wrap justify-between items-center gap-4 print:hidden">
                <Link 
                    href={`/dashboard/${student.id}`}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-bold uppercase text-[9px] tracking-widest"
                >
                    <ArrowLeft size={12} strokeWidth={3} />
                    Back to Profile
                </Link>

                <div className="flex items-center gap-3">
                    <select 
                        value={project.id}
                        onChange={handleProjectChange}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black text-slate-600 hover:border-indigo-300 focus:outline-none transition-all cursor-pointer"
                    >
                        {allProjects.map((p: any) => (
                            <option key={p.id} value={p.id}>
                                {p.name} ({p.sequence_label || 'X'})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Report Document */}
            <div className="max-w-5xl mx-auto bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm print:border-0 print:shadow-none print:max-w-none">
                
                {/* Visual Header (Thinner & Lighter) */}
                <div className="bg-slate-50 border-b border-slate-100 px-10 py-8 relative overflow-hidden print:py-4 print:px-6">
                    <div className="relative z-10 flex flex-wrap justify-between items-end gap-6 print:gap-2">
                        <div className="flex-1 min-w-[300px]">
                            <div className="flex items-center gap-3 mb-3 print:mb-1">
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-wider">Project Impact Report</span>
                                <span className="text-slate-300 font-bold text-xs print:hidden">•</span>
                                <span className="text-slate-400 font-bold text-xs print:hidden">Module {project.sequence_label || 'X'}</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2 print:text-2xl print:mb-1">
                                {project.name}
                            </h1>
                            <div className="flex gap-6 mt-4 print:mt-2 print:gap-4">
                                <div>
                                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-0.5">Student Associate</p>
                                    <p className="text-lg font-bold text-slate-700 print:text-base">{student.canonical_name}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-0.5">Program Focus</p>
                                    <p className="text-lg font-bold text-slate-700 print:text-base">{student.programs?.name || 'UG-MED'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right hidden sm:block print:block">
                            <img src="/images/logo-dark.png" alt="LE Logo" className="h-10 opacity-30 grayscale print:h-8" />
                        </div>
                    </div>
                </div>

                <div className="px-10 py-12 space-y-16 print:px-6 print:py-8 print:space-y-8">
                    
                    {/* SECTION: READINESS PROFILE */}
                    <section className="print:break-inside-avoid">
                        <div className="flex items-center gap-4 mb-8 print:mb-4">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 print:w-8 print:h-8">
                                <BarChart2 size={24} strokeWidth={2.5} className="print:w-5 print:h-5" />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="text-xl font-black tracking-tight text-slate-900 print:text-lg">Readiness Profile</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Multi-perspective development across 6 domains</p>
                            </div>
                        </div>

                        <div className="h-[400px] w-full bg-white border border-slate-100 rounded-2xl p-6 print:h-[320px] print:p-2 print:border-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={domainChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        domain={[1, 10]} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                                        ticks={[2, 4, 6, 8, 10]}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc', radius: 8 }}
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
                                    />
                                    <Legend 
                                        verticalAlign="top" 
                                        align="right" 
                                        iconType="circle"
                                        wrapperStyle={{ paddingBottom: '30px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }} 
                                    />
                                    <Bar dataKey="mentor" name="Mentor" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                                    <Bar dataKey="self" name="Self" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={24} />
                                    <Bar dataKey="client" name="Client" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* SECTION: PEER FEEDBACK (DIVERGING BARS) */}
                    <section className="print:break-inside-avoid print:pb-12">
                        <div className="flex items-center gap-4 mb-8 print:mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 print:w-8 print:h-8">
                                <Star size={24} strokeWidth={2.5} className="print:w-5 print:h-5" />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="text-xl font-black tracking-tight text-slate-900 print:text-lg">Peer Feedback</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Performance deviation from cohort baseline</p>
                            </div>
                        </div>

                        {peerSummary ? (
                            <div className="bg-white border border-slate-100 rounded-2xl p-8 flex flex-col lg:flex-row gap-10 items-center print:p-4 print:border-0 print:gap-4 print:flex-row">
                                {/* Compact Metric Box */}
                                <div className="w-full lg:w-48 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center shrink-0 print:w-32 print:p-3 print:rounded-xl">
                                    <div className="mb-4 print:mb-2">
                                        <p className="text-4xl font-black text-slate-900 leading-none mb-1 print:text-2xl">{peerSummary.avg_overall}</p>
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Score</p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200/50 print:pt-2">
                                        <p className="text-xl font-black text-indigo-500 leading-none mb-1 print:text-lg">
                                            {(cohortPeerSummary.reduce((acc, curr) => acc + (curr.avg_overall || 0), 0) / cohortPeerSummary.length).toFixed(2)}
                                        </p>
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Norm</p>
                                    </div>
                                </div>

                                {/* Diverging Deviation Chart */}
                                <div className="w-full h-[280px] print:h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart 
                                            layout="vertical" 
                                            data={peerChartData} 
                                            margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                                            barSize={12}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" domain={[-1, 1]} hide />
                                            <YAxis 
                                                dataKey="label" 
                                                type="category" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900, textAnchor: 'end' }} 
                                                width={130}
                                            />
                                            <Tooltip 
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
                                                formatter={(value: any) => [value > 0 ? `+${value}` : value, 'Deviation']}
                                            />
                                            <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={2} />
                                            <Bar dataKey="delta" radius={6}>
                                                {peerChartData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={entry.delta >= 0 ? '#10b981' : '#f43f5e'} 
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div className="flex justify-center gap-6 mt-2 print:mt-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Above Norm</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Below Norm</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-40 bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-3">
                                <Star size={24} opacity={0.2} />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Confidential peer review pending</p>
                            </div>
                        )}
                    </section>

                    {/* SECTION: DOMAIN LEVELS (COMPACT ACCORDIONS) */}
                    <section className="print:break-before-page pt-10">
                        <div className="flex items-center gap-4 mb-8 print:mb-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 print:w-8 print:h-8">
                                <Target size={24} strokeWidth={2.5} className="print:w-5 print:h-5" />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="text-xl font-black tracking-tight text-slate-900 print:text-lg">Readiness Details</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Granular trait-level assessment scores</p>
                            </div>
                        </div>

                        <div className="space-y-2 print:space-y-1">
                            {domains.map(domain => {
                                const isExpanded = expandedDomains[domain.id];
                                const domainParams = parameters.filter(p => p.domain_id === domain.id);
                                const domainData = domainChartData.find(d => d.fullName === domain.name);
                                
                                return (
                                    <div 
                                        key={domain.id} 
                                        className={`group border rounded-xl overflow-hidden transition-all print:border print:rounded-lg print:bg-white ${
                                            isExpanded 
                                            ? 'border-indigo-100 bg-white shadow-sm' 
                                            : 'border-slate-100 bg-white hover:border-slate-200'
                                        }`}
                                    >
                                        <button 
                                            onClick={() => toggleDomain(domain.id)}
                                            className="w-full px-6 py-4 flex items-center justify-between text-left print:px-4 print:py-2"
                                        >
                                            <div className="flex items-center gap-4 print:gap-2">
                                                <div 
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black print:w-6 print:h-6 print:text-[10px]"
                                                    style={{ backgroundColor: DOMAIN_COLORS[domain.name] || '#6366f1' }}
                                                >
                                                    {domain.short_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-800 print:text-xs">{domain.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden print:w-12">
                                                            <div 
                                                                className="h-full rounded-full" 
                                                                style={{ 
                                                                    width: `${(domainData?.mentor || 0) * 10}%`,
                                                                    backgroundColor: DOMAIN_COLORS[domain.name]
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 print:text-[8px]">{domainData?.mentor || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`transition-transform duration-200 print:hidden ${isExpanded ? 'rotate-180 text-indigo-500' : 'text-slate-300'}`}>
                                                <ChevronDown size={20} />
                                            </div>
                                        </button>

                                        {/* Force visibility in print regardless of state */}
                                        <div className={`px-6 pb-6 pt-0 print:px-4 print:pb-2 print:block ${isExpanded ? 'block' : 'hidden'}`}>
                                            <div className="border-t border-slate-50 pt-4 print:pt-2">
                                                <div className="grid grid-cols-12 px-2 py-2 mb-1 print:py-1">
                                                    <div className="col-span-6 text-[8px] font-black uppercase tracking-widest text-slate-300">Trait</div>
                                                    <div className="col-span-2 text-center text-[8px] font-black uppercase tracking-widest text-slate-300">Self</div>
                                                    <div className="col-span-2 text-center text-[8px] font-black uppercase tracking-widest text-slate-300 italic">Mentor</div>
                                                    <div className="col-span-2 text-center text-[8px] font-black uppercase tracking-widest text-slate-300">Client</div>
                                                </div>
                                                <div className="flex flex-col">
                                                    {domainParams.map(param => {
                                                        const ass = assessments.filter(a => a.parameter_id === param.id);
                                                        const s = ass.find(a => a.assessment_type === 'self')?.normalized_score;
                                                        const m = ass.find(a => a.assessment_type === 'mentor')?.normalized_score;
                                                        const c = ass.find(a => a.assessment_type === 'client')?.normalized_score;

                                                        return (
                                                            <div key={param.id} className="grid grid-cols-12 items-center px-2 py-3 hover:bg-slate-50 rounded-lg transition-colors print:py-1">
                                                                <div className="col-span-6">
                                                                    <p className="text-[11px] font-bold text-slate-600 print:text-[9px]">{param.name}</p>
                                                                </div>
                                                                <div className="col-span-2 text-center text-xs font-bold text-slate-400 print:text-[10px]">{s || '-'}</div>
                                                                <div className="col-span-2 text-center text-xs font-black text-indigo-600 print:text-[10px]">{m || '-'}</div>
                                                                <div className="col-span-2 text-center text-xs font-bold text-amber-500 print:text-[10px]">{c || '-'}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* SECTION: MENTOR NOTES (AT THE BOTTOM) */}
                    <section className="bg-slate-50 border border-slate-100 rounded-3xl p-10 print:bg-white print:border print:rounded-2xl print:p-6 print:break-inside-avoid">
                        <div className="flex items-center gap-4 mb-6 print:mb-4">
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 print:w-8 print:h-8">
                                <MessageSquare size={20} strokeWidth={2.5} className="print:w-5 print:h-5" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-slate-900 print:text-lg">Mentor Guidance</h3>
                        </div>
                        
                        <div className="space-y-4 print:space-y-2">
                            {notes.length > 0 ? notes.map((note) => (
                                <div key={note.id} className="bg-white border border-slate-200/50 p-6 rounded-2xl relative print:p-3 print:border-0 print:bg-slate-50">
                                    <div className="flex justify-between items-center mb-3 print:mb-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{note.created_by || 'Mentor'}</p>
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{new Date(note.date).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed text-sm font-medium italic print:text-xs">"{note.note_text}"</p>
                                </div>
                            )) : (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-300 font-bold text-xs uppercase tracking-widest gap-2">
                                    <Quote size={24} opacity={0.2} />
                                    No qualitative notes for this project
                                </div>
                            )}
                        </div>
                        <p className="mt-8 text-center text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] italic print:mt-4">Analysis is module-specific and contextually filtered</p>
                    </section>
                </div>

                {/* Footer Credits */}
                <div className="bg-white border-t border-slate-50 py-6 text-center print:py-2">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Integrated Assessment Report</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 10mm;
                        size: A4 portrait;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:border {
                        border: 1px solid #e2e8f0 !important;
                    }
                    .print\\:border-0 {
                        border: 0 !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:block {
                        display: block !important;
                    }
                    .print\\:flex-row {
                        flex-direction: row !important;
                    }
                    .print\\:max-w-none {
                        max-width: none !important;
                    }
                    .print\\:break-before-page {
                        break-before: page !important;
                    }
                }
            `}</style>
        </div>
    );
}
