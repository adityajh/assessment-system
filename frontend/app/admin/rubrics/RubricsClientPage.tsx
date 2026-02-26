'use client';

import { ReadinessDomain, ReadinessParameter } from '@/lib/supabase/queries/assessments';

export default function RubricsClientPage({
    domains,
    parameters
}: {
    domains: ReadinessDomain[],
    parameters: ReadinessParameter[]
}) {
    return (
        <div className="flex-1 overflow-y-auto min-h-0 pd-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {domains.map(domain => {
                    const domainParams = parameters.filter(p => p.domain_id === domain.id);
                    return (
                        <div key={domain.id} className="admin-card border-t-4 shadow-sm" style={{ borderTopColor: getDomainColor(domain.name) }}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-200">{domain.name}</h3>
                                    <p className="text-sm font-medium" style={{ color: getDomainColor(domain.name) }}>
                                        {domain.short_name.toUpperCase()}
                                    </p>
                                </div>
                                <div className="text-4xl text-slate-800 font-black opacity-20">
                                    0{domain.display_order}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {domainParams.map(param => (
                                    <div key={param.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 hover:border-slate-700 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="shrink-0 px-2 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center text-[11px] font-bold mt-0.5 tracking-wider">
                                                {param.code || param.param_number}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-300 text-sm">{param.name}</h4>
                                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                    {param.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {domainParams.length === 0 && (
                                    <div className="text-sm text-slate-500 italic py-2 text-center">No parameters defined.</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function getDomainColor(domainName: string) {
    const map: Record<string, string> = {
        'Commercial Readiness': '#f59e0b',
        'Entrepreneurial Readiness': '#10b981',
        'Marketing Readiness': '#ec4899',
        'Innovation Readiness': '#8b5cf6',
        'Operational Readiness': '#3b82f6',
        'Professional Readiness': '#14b8a6',
    };
    return map[domainName] || '#94a3b8';
}
