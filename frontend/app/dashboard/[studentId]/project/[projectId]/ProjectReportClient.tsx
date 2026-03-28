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
    Quote
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

    // 2. Peer Feedback Chart Data (with Cohort Triangulation)
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
            // Calculate cohort average for this trait for this project
            const cohortAvg = cohortPeerSummary.length > 0
                ? cohortPeerSummary.reduce((acc, curr) => acc + (curr[trait.key] || 0), 0) / cohortPeerSummary.length
                : 0;

            return {
                label: trait.label,
                studentScore: peerSummary[trait.key] || 0,
                cohortAvg: parseFloat(cohortAvg.toFixed(2))
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
        <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-20 p-4 md:p-8 font-sans" ref={reportRef}>
            {/* Header / Nav (Hidden on Print) */}
            <div className="max-w-6xl mx-auto mb-8 flex flex-wrap justify-between items-center gap-4 print:hidden">
                <Link 
                    href={`/dashboard/${student.id}`}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-black uppercase text-[10px] tracking-widest"
                >
                    <ArrowLeft size={14} strokeWidth={3} />
                    Back to Student Profile
                </Link>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <select 
                            value={project.id}
                            onChange={handleProjectChange}
                            className="appearance-none bg-white border border-slate-200 rounded-2xl px-5 py-3 pr-12 text-sm font-black text-slate-800 hover:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm"
                        >
                            {allProjects.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                    Project {p.sequence_label || 'X'}: {p.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                            <ChevronDown size={18} strokeWidth={2.5} />
                        </div>
                    </div>

                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-3 bg-slate-950 text-white px-6 py-3.5 rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-200/20 active:scale-95"
                    >
                        <Printer size={18} strokeWidth={2.5} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Main Report Document */}
            <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 print:border-0 print:shadow-none">
                
                {/* Visual Header Section */}
                <div className="bg-slate-950 p-12 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-3 mb-8">
                            <span className="px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300">Impact Analysis</span>
                            <span className="px-4 py-1.5 bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-lg shadow-indigo-500/30">Project ID: {project.sequence_label || 'X'}</span>
                        </div>
                        <h1 className="text-6xl font-black mb-6 tracking-tight leading-tight max-w-3xl">
                            {project.name}
                        </h1>
                        <div className="flex flex-wrap gap-12 items-end mt-12 pt-8 border-t border-white/10">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2">Student Associate</p>
                                <p className="text-2xl font-bold">{student.canonical_name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2">Cohort / Program</p>
                                <p className="text-2xl font-bold">{student.programs?.name || 'UG-MED'}</p>
                            </div>
                            <div className="ml-auto text-right self-center">
                                <img src="/images/logo-dark.png" alt="LE Logo" className="h-16 brightness-200 grayscale opacity-80" />
                            </div>
                        </div>
                    </div>
                    {/* Artistic gradient mesh */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 blur-[130px] rounded-full -mr-48 -mt-48 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full -ml-24 -mb-24"></div>
                </div>

                <div className="p-12 space-y-20">
                    
                    {/* SECTION: READINESS DEVELOPMENT (CHART) */}
                    <section>
                        <div className="flex justify-between items-end mb-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-50 rounded-[1.25rem] flex items-center justify-center text-indigo-600 shadow-inner">
                                    <BarChart2 size={28} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Readiness Profile</h2>
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Comparative perspective across 6 readiness domains</p>
                                </div>
                            </div>
                        </div>

                        <div className="h-[480px] w-full bg-slate-50/50 border border-slate-100/50 rounded-[2rem] p-10 relative group transition-all hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={domainChartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }} barGap={6}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900, letterSpacing: '0.1em' }}
                                        dy={15}
                                    />
                                    <YAxis 
                                        domain={[1, 10]} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} 
                                        ticks={[2, 4, 6, 8, 10]}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#f1f5f9', radius: 10 }}
                                        contentStyle={{ 
                                            borderRadius: '20px', 
                                            border: '1px solid #e2e8f0', 
                                            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)',
                                            padding: '15px' 
                                        }}
                                        labelStyle={{ fontWeight: 900, color: '#0f172a', marginBottom: '8px', fontSize: '12px' }}
                                    />
                                    <Legend 
                                        verticalAlign="top" 
                                        align="right" 
                                        iconType="circle"
                                        wrapperStyle={{ paddingBottom: '40px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#64748b' }} 
                                    />
                                    <Bar dataKey="mentor" name="Mentor Assessment" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={28} />
                                    <Bar dataKey="self" name="Self Correction" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={28} />
                                    <Bar dataKey="client" name="Client Review" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* SECTION: MENTOR NOTES (REPOSITIONED) */}
                    <section className="bg-indigo-50/40 border border-indigo-100/50 rounded-[2rem] p-10 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 text-indigo-500/10 scale-[5] pointer-events-none">
                            <Quote size={40} />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="w-11 h-11 bg-white border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                <MessageSquare size={22} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight text-indigo-950">Mentor Notes</h3>
                        </div>
                        
                        <div className="space-y-6 relative z-10">
                            {notes.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {notes.map((note) => (
                                        <div key={note.id} className="bg-white/60 backdrop-blur-md border border-white rounded-2xl p-8 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs uppercase">
                                                        {(note.created_by || 'M').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-600/50 uppercase tracking-[0.2em] leading-none mb-1">Assessed By</p>
                                                        <p className="text-sm font-black text-slate-800">{note.created_by || 'Project Mentor'}</p>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-white border border-indigo-50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                    {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                            <p className="text-slate-700 leading-relaxed text-[15px] font-medium whitespace-pre-wrap italic decoration-indigo-500/20">
                                                "{note.note_text}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/40 border border-dashed border-indigo-200 rounded-2xl py-12 flex flex-col items-center justify-center text-indigo-400/60 font-black text-sm uppercase tracking-widest gap-3">
                                    <MessageSquare size={32} opacity={0.3} />
                                    No narrative notes recorded for this module
                                </div>
                            )}
                        </div>
                    </section>

                    {/* SECTION: PEER FEEDBACK (HORIZONTAL BARS) */}
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-12">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-14 h-14 bg-emerald-50 rounded-[1.25rem] flex items-center justify-center text-emerald-600 shadow-inner">
                                    <Star size={26} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Peer Contributions</h2>
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Relative performance vs cohort project average</p>
                                </div>
                            </div>

                            {peerSummary ? (
                                <div className="bg-white border border-slate-100 rounded-[2rem] p-10 flex flex-col lg:flex-row gap-12 items-center">
                                    {/* Big Metric Box */}
                                    <div className="w-full lg:w-1/4 bg-emerald-600 text-white rounded-[1.5rem] p-8 text-center shadow-xl shadow-emerald-600/20">
                                        <p className="text-6xl font-black mb-2">{peerSummary.avg_overall}</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-8 whitespace-nowrap">Cohort Norm Score</p>
                                        <div className="pt-6 border-t border-white/20">
                                            <p className="text-xs font-bold text-emerald-100 mb-1 italic opacity-80">"Recipient of {peerSummary.feedback_count} reviews"</p>
                                        </div>
                                    </div>

                                    {/* Horizontal Comparison Chart */}
                                    <div className="w-full lg:w-3/4 h-[320px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart 
                                                layout="vertical" 
                                                data={peerChartData} 
                                                margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                                                barSize={14}
                                            >
                                                <XAxis type="number" domain={[0, 5]} hide />
                                                <YAxis 
                                                    dataKey="label" 
                                                    type="category" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900, textAnchor: 'end' }} 
                                                    width={130}
                                                />
                                                <Tooltip 
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
                                                />
                                                <Bar dataKey="studentScore" name="Student Rating" fill="#10b981" radius={[0, 10, 10, 0]}>
                                                    {peerChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.studentScore >= entry.cohortAvg ? '#10b981' : '#f43f5e'} />
                                                    ))}
                                                </Bar>
                                                {/* Each category would ideally have its own reference line, but recharts doesn't support that easily. 
                                                    We can use a legend to explain the cohort average comparison.
                                                */}
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div className="flex justify-center gap-8 mt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Above Average</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Below Average</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-60 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <Star size={40} opacity={0.2} />
                                    <p className="text-sm font-black uppercase tracking-widest opacity-60">Confidential peer review pending</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* SECTION: ACCORDION DOMAINS (REFACTORED TABLE) */}
                    <section className="print:break-before-page">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-14 h-14 bg-indigo-50 rounded-[1.25rem] flex items-center justify-center text-indigo-600 shadow-inner">
                                <FileText size={28} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Readiness Domain Levels</h2>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Deep dive into specific competencies and sub-traits</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {domains.map(domain => {
                                const isExpanded = expandedDomains[domain.id];
                                const domainParams = parameters.filter(p => p.domain_id === domain.id);
                                const domainData = domainChartData.find(d => d.fullName === domain.name);
                                
                                return (
                                    <div 
                                        key={domain.id} 
                                        className={`group border transition-all duration-300 rounded-[1.5rem] overflow-hidden ${
                                            isExpanded 
                                            ? 'border-indigo-200 bg-white shadow-xl shadow-indigo-100/20 select-none' 
                                            : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100'
                                        }`}
                                    >
                                        <button 
                                            onClick={() => toggleDomain(domain.id)}
                                            className="w-full px-8 py-6 flex items-center justify-between text-left"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div 
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg"
                                                    style={{ backgroundColor: DOMAIN_COLORS[domain.name] || '#6366f1' }}
                                                >
                                                    {domain.short_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-900">{domain.name}</h4>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Level:</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full rounded-full transition-all duration-1000" 
                                                                    style={{ 
                                                                        width: `${(domainData?.mentor || 0) * 10}%`,
                                                                        backgroundColor: DOMAIN_COLORS[domain.name]
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-black text-slate-700">{domainData?.mentor || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-500' : 'text-slate-300'}`}>
                                                <ChevronDown size={28} strokeWidth={2.5} />
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-8 pb-8 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="border-b border-indigo-100/30">
                                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Parameter Trait</th>
                                                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 w-24">Self</th>
                                                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.15em] text-indigo-950 w-24">Mentor</th>
                                                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.15em] text-amber-600 w-24">Client</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {domainParams.map(param => {
                                                                const getParamScore = (type: string) => {
                                                                    const ass = assessments.find(a => a.parameter_id === param.id && a.assessment_type === type);
                                                                    return ass?.normalized_score || null;
                                                                };

                                                                const sScore = getParamScore('self');
                                                                const mScore = getParamScore('mentor');
                                                                const cScore = getParamScore('client');

                                                                return (
                                                                    <tr key={param.id} className="hover:bg-white transition-colors">
                                                                        <td className="px-6 py-5">
                                                                            <p className="text-sm font-bold text-slate-700">{param.name}</p>
                                                                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-md">{param.description}</p>
                                                                        </td>
                                                                        <td className="px-6 py-5 text-center">
                                                                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xs font-black border ${sScore ? 'bg-white border-slate-200 text-slate-600 shadow-sm' : 'border-transparent text-slate-300'}`}>
                                                                                {sScore || '-'}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-5 text-center">
                                                                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-black border ${mScore ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'border-transparent text-slate-200'}`}>
                                                                                {mScore || '-'}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-5 text-center">
                                                                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xs font-black border ${cScore ? 'bg-amber-100 border-amber-200 text-amber-700 shadow-sm' : 'border-transparent text-slate-200'}`}>
                                                                                {cScore || '-'}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* Footer Branding */}
                <div className="bg-slate-50 border-t border-slate-100 p-10 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">Official Impact Report Output</p>
                    <div className="flex items-center justify-center gap-8 opacity-40 grayscale">
                        <img src="/images/logo-dark.png" alt="LE" className="h-8" />
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: A4 portrait;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:border-0 {
                        border: 0 !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:break-before-page {
                        break-before: page !important;
                    }
                    .print\\:mt-10 {
                        margin-top: 2.5rem !important;
                    }
                    /* Ensure all accordions are expanded for print */
                    .group.border {
                        border: 0 !important;
                        margin-bottom: 2rem !important;
                    }
                    .group.border > div {
                        display: block !important;
                        padding: 0 !important;
                    }
                    /* Force visibility of subscores in print */
                    table {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}
