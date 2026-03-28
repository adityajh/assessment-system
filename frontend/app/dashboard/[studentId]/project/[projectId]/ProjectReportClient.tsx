"use client";

import { useMemo, useRef } from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    Cell
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
    Printer
} from 'lucide-react';
import Link from 'next/link';
import { ReadinessDomain, Assessment } from '@/lib/supabase/queries/assessments';

interface ProjectReportClientProps {
    student: any;
    project: any;
    domains: ReadinessDomain[];
    assessments: Assessment[];
    peerSummary: any;
    notes: any[];
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
    assessments,
    peerSummary,
    notes
}: ProjectReportClientProps) {
    const reportRef = useRef<HTMLDivElement>(null);

    // Aggregate 6-domain scores
    const chartData = useMemo(() => {
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

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 pb-20 p-4 md:p-8" ref={reportRef}>
            {/* Header / Nav (Hidden on Print) */}
            <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <Link 
                    href={`/dashboard/${student.id}`}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold uppercase text-xs tracking-widest"
                >
                    <ArrowLeft size={16} />
                    Back to Profile
                </Link>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-black hover:bg-indigo-600 transition-all shadow-xl"
                >
                    <Printer size={18} />
                    Export Project Report
                </button>
            </div>

            {/* Report Container */}
            <div className="max-w-5xl mx-auto border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm print:border-0 print:shadow-none">
                
                {/* Visual Header */}
                <div className="bg-slate-950 p-10 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Project Impact Report</span>
                            <span className="px-3 py-1 bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">{project.sequence_label || 'X'}</span>
                        </div>
                        <h1 className="text-5xl font-black mb-4 tracking-tight">{project.name}</h1>
                        <div className="flex flex-wrap gap-8 items-end">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Student</p>
                                <p className="text-xl font-bold">{student.canonical_name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Programme</p>
                                <p className="text-xl font-bold">{student.programs?.name || 'BBA'}</p>
                            </div>
                            <div className="ml-auto text-right">
                                <img src="/images/logo-dark.png" alt="Logo" className="h-12 brightness-200" />
                            </div>
                        </div>
                    </div>
                    {/* Abstract design elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                </div>

                <div className="p-10 space-y-16">
                    
                    {/* Section 1: Growth Comparison */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <BarChart2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">Readiness Development</h2>
                                <p className="text-sm text-slate-500 font-bold">Triangulated comparison of perspective across 6 core domains.</p>
                            </div>
                        </div>

                        <div className="h-[450px] w-full bg-slate-50/50 border border-slate-100 rounded-3xl p-8 pb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                                    />
                                    <YAxis 
                                        domain={[1, 10]} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend 
                                        verticalAlign="top" 
                                        align="right" 
                                        wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }} 
                                    />
                                    <Bar dataKey="mentor" name="Mentor Score" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                                    <Bar dataKey="self" name="Self Eval" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
                                    <Bar dataKey="client" name="Client Eval" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Section 2: Peer Feedback & Narrative */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        
                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                    <Star size={20} />
                                </div>
                                <h3 className="text-xl font-black tracking-tight">Peer Feedback</h3>
                            </div>
                            
                            {peerSummary ? (
                                <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-6">
                                    <div className="text-center mb-6">
                                        <p className="text-4xl font-black text-emerald-600">{peerSummary.avg_overall}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60">Average Project Rating</p>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Quality of Work', val: peerSummary.avg_quality_of_work },
                                            { label: 'Initiative/Ownership', val: peerSummary.avg_initiative_ownership },
                                            { label: 'Communication', val: peerSummary.avg_communication },
                                            { label: 'Collaboration', val: peerSummary.avg_collaboration },
                                            { label: 'Growth Mindset', val: peerSummary.avg_growth_mindset },
                                        ].map(m => (
                                            <div key={m.label} className="flex justify-between items-center text-xs font-bold">
                                                <span className="text-slate-600">{m.label}</span>
                                                <span className="text-slate-900">{m.val || '-'}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-6 text-[10px] text-emerald-800/60 font-bold italic text-center">Based on {peerSummary.feedback_count} confidential peer evaluations.</p>
                                </div>
                            ) : (
                                <div className="h-40 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-sm italic">
                                    No peer feedback data for this project
                                </div>
                            )}
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                                    <MessageSquare size={20} />
                                </div>
                                <h3 className="text-xl font-black tracking-tight">Mentor Narrative</h3>
                            </div>
                            
                            <div className="space-y-4">
                                {notes.length > 0 ? notes.map((note, idx) => (
                                    <div key={note.id} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 relative">
                                        <div className="absolute top-4 right-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            {new Date(note.date).toLocaleDateString()}
                                        </div>
                                        <p className="text-sm font-bold text-slate-500 mb-2 uppercase text-[10px] tracking-wider">{note.created_by || 'Mentor'}</p>
                                        <p className="text-slate-700 leading-relaxed text-sm font-medium whitespace-pre-wrap">{note.note_text}</p>
                                    </div>
                                )) : (
                                    <div className="h-40 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-sm italic">
                                        No qualitative notes for this project
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Section 3: Domain Detail Table */}
                    <section className="print:break-before-page print:mt-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <FileText size={20} />
                            </div>
                            <h3 className="text-xl font-black tracking-tight">Detailed Domain Scores</h3>
                        </div>

                        <div className="overflow-hidden border border-slate-100 rounded-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Readiness Domain</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center text-slate-500">Mentor</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center text-slate-500">Self</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center text-slate-500">Client</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {chartData.map(d => (
                                        <tr key={d.name} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-black text-slate-900">{d.fullName}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${d.mentor ? 'bg-indigo-50 text-indigo-600' : 'text-slate-300'}`}>
                                                    {d.mentor || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${d.self ? 'bg-slate-100 text-slate-500' : 'text-slate-300'}`}>
                                                    {d.self || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${d.client ? 'bg-amber-50 text-amber-600' : 'text-slate-300'}`}>
                                                    {d.client || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                </div>

                {/* Footer Credits */}
                <div className="bg-slate-50 border-t border-slate-100 p-8 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Generated by Let's Entreprise Assessment System</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
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
                    .print\\:mt-10 {
                        margin-top: 2.5rem !important;
                    }
                    .print\\:break-before-page {
                        break-before: page !important;
                    }
                }
            `}</style>
        </div>
    );
}
