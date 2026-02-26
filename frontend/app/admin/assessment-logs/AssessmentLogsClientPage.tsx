"use client";

import { useState } from 'react';
import { Eye, X, CheckSquare, Search } from 'lucide-react';

type LogRow = {
    id: string;
    assessment_date: string;
    program_id: string;
    term: string;
    data_type: 'self' | 'mentor' | 'peer' | 'term';
    project_id: string | null;
    file_name: string | null;
    mapping_config: Record<string, string>;
    records_inserted: number;
    created_at: string;
    programs?: { name: string };
    projects?: { name: string };
};

type Parameter = any;

export default function AssessmentLogsClientPage({ logs, parameters }: { logs: LogRow[], parameters: Parameter[] }) {
    const [selectedLog, setSelectedLog] = useState<LogRow | null>(null);

    const getParameterName = (id: string) => {
        if (id === 'student_name') return '★ Student Name Key';
        if (id === 'giver_name') return '★ Giver Student Name';
        if (id === 'recipient_name') return '★ Recipient Student Name';
        if (id === 'quality_of_work') return 'Score: Quality of Work';
        if (id === 'initiative_ownership') return 'Score: Initiative & Ownership';
        if (id === 'communication') return 'Score: Communication';
        if (id === 'collaboration') return 'Score: Collaboration';
        if (id === 'growth_mindset') return 'Score: Growth Mindset';
        if (id === 'cbp_count') return 'Value: CBP Count';
        if (id === 'conflexion_count') return 'Value: Conflexion Count';
        if (id === 'bow_score') return 'Value: BOW Score';

        const param = parameters.find(p => p.id === id);
        return param ? `[${param.code || param.param_number}] ${param.name}` : id;
    };

    return (
        <div className="max-w-6xl mx-auto py-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assessment Logs</h1>
                    <p className="text-slate-500 mt-1">Audit trail of all datasets imported into the assessment system.</p>
                </div>
            </div>

            <div className="bg-white border text-sm border-slate-200 shadow-sm rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="py-3 px-6 font-semibold text-slate-700">Date</th>
                            <th className="py-3 px-6 font-semibold text-slate-700">Type</th>
                            <th className="py-3 px-6 font-semibold text-slate-700">Program / Term</th>
                            <th className="py-3 px-6 font-semibold text-slate-700">Project</th>
                            <th className="py-3 px-6 font-semibold text-slate-700">File Name</th>
                            <th className="py-3 px-6 font-semibold text-slate-700 text-right">Records</th>
                            <th className="py-3 px-6 font-semibold text-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-6 font-medium text-slate-900 whitespace-nowrap">{log.assessment_date}</td>
                                <td className="py-3 px-6 capitalize whitespace-nowrap">{log.data_type}</td>
                                <td className="py-3 px-6 whitespace-nowrap text-slate-800">{log.programs?.name || 'Unknown'} <span className="text-slate-400 mx-1">•</span> {log.term}</td>
                                <td className="py-3 px-6 whitespace-nowrap text-slate-800">{log.projects?.name || '-'}</td>
                                <td className="py-3 px-6 text-slate-700 font-medium truncate max-w-[200px]" title={log.file_name || ''}>{log.file_name || '-'}</td>
                                <td className="py-3 px-6 text-right font-medium text-slate-900">{log.records_inserted}</td>
                                <td className="py-3 px-6 text-right">
                                    <button
                                        onClick={() => setSelectedLog(log)}
                                        className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                                    >
                                        <Eye size={14} /> View Map
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-500">No assessment logs found. Import data to see logs here.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Read-Only Mapping Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <Search className="text-indigo-500" size={18} />
                                    Mapping Configuration (Read Only)
                                </h3>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    Columns imported from <strong>{selectedLog.file_name || 'Upload'}</strong>
                                </p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 flex-1">
                            {!selectedLog.mapping_config || Object.keys(selectedLog.mapping_config).length === 0 ? (
                                <p className="text-slate-500 text-center py-8">No mapping configuration was saved for this log.</p>
                            ) : (
                                <table className="w-full text-left text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="py-3 px-4 font-semibold text-slate-700 w-1/2 border-b border-slate-200">Excel Column Header</th>
                                            <th className="py-3 px-4 font-semibold text-slate-700 w-1/2 border-b border-slate-200">Database Parameter Target</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Object.entries(selectedLog.mapping_config).map(([excelHeader, paramTarget]) => {
                                            const isIgnored = !paramTarget;
                                            return (
                                                <tr key={excelHeader} className={!isIgnored ? 'bg-white' : 'bg-slate-50 opacity-60'}>
                                                    <td className="py-3 px-4 text-slate-700 font-medium max-w-[300px] truncate" title={excelHeader}>
                                                        {excelHeader}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {!isIgnored ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                                                                <CheckSquare size={14} />
                                                                {getParameterName(paramTarget)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 italic">-- Ignored Column --</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setSelectedLog(null)} className="px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
