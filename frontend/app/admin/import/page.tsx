"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';

type ImportType = 'self' | 'mentor' | 'peer' | 'term';
type Project = any;
type Program = any;
type Domain = any;
type Parameter = any;

export default function ImportPage() {
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rawData, setRawData] = useState<any[]>([]);

    // Event Metadata Configuration
    const [importType, setImportType] = useState<ImportType>('self');
    const [programId, setProgramId] = useState<string>('');
    const [projectId, setProjectId] = useState<string>('');
    const [term, setTerm] = useState<string>('Year 1');
    const [assessmentDate, setAssessmentDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Supabase Data
    const [projects, setProjects] = useState<Project[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [domains, setDomains] = useState<Domain[]>([]);
    const [parameters, setParameters] = useState<Parameter[]>([]);
    const [loadingConfig, setLoadingConfig] = useState(true);

    // Column Mapping State: { "Excel Header Name": "Internal DB Target" }
    const [columnMap, setColumnMap] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ success: boolean, message: string } | null>(null);

    useEffect(() => {
        async function loadConfig() {
            const [projRes, progRes, domRes, paramRes] = await Promise.all([
                supabase.from('projects').select('*'),
                supabase.from('programs').select('*'),
                supabase.from('readiness_domains').select('*'),
                supabase.from('readiness_parameters').select('*')
            ]);

            if (projRes.data) setProjects(projRes.data);
            if (progRes.data && progRes.data.length > 0) setProgramId(progRes.data[0].id);
            if (domRes.data) setDomains(domRes.data);
            if (paramRes.data) setParameters(paramRes.data);

            setLoadingConfig(false);
        }
        loadConfig();
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            if (data.length > 0) {
                setHeaders(data[0] as string[]);
                setRawData(XLSX.utils.sheet_to_json(ws));
                setStep(2);
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleMapChange = (header: string, targetId: string) => {
        setColumnMap(prev => ({ ...prev, [header]: targetId }));
    };

    const getMappingTargetOptions = () => {
        if (importType === 'self' || importType === 'mentor') {
            return (
                <>
                    <option value="">-- Ignore Column --</option>
                    <option value="student_name">★ Student Name Key</option>
                    {domains.map(d => (
                        <optgroup key={d.id} label={d.name}>
                            {parameters.filter(p => p.domain_id === d.id).sort((a, b) => a.param_number - b.param_number).map(p => (
                                <option key={p.id} value={p.id}>{p.param_number}. {p.name}</option>
                            ))}
                        </optgroup>
                    ))}
                </>
            );
        } else if (importType === 'peer') {
            return (
                <>
                    <option value="">-- Ignore Column --</option>
                    <option value="giver_name">★ Giver Student Name</option>
                    <option value="recipient_name">★ Recipient Student Name</option>
                    <option value="quality_of_work">Score: Quality of Work</option>
                    <option value="initiative_ownership">Score: Initiative & Ownership</option>
                    <option value="communication">Score: Communication</option>
                    <option value="collaboration">Score: Collaboration</option>
                    <option value="growth_mindset">Score: Growth Mindset</option>
                </>
            );
        } else if (importType === 'term') {
            return (
                <>
                    <option value="">-- Ignore Column --</option>
                    <option value="student_name">★ Student Name Key</option>
                    <option value="cbp_count">Value: CBP Count</option>
                    <option value="conflexion_count">Value: Conflexion Count</option>
                    <option value="bow_score">Value: BOW Score</option>
                </>
            );
        }
    };

    const handleExecuteImport = async () => {
        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const payload = {
                metadata: {
                    importType,
                    programId,
                    projectId: importType === 'term' ? null : projectId,
                    term,
                    assessmentDate,
                    fileName: file?.name || 'Unknown Upload'
                },
                mapping: columnMap,
                rawData: rawData
            };

            const response = await fetch('/api/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to execute import');
            }

            setSubmitResult({ success: true, message: `Successfully imported ${result.recordsInserted} records.` });
        } catch (err: any) {
            setSubmitResult({ success: false, message: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Import & Mapping</h1>
                    <p className="text-slate-500 mt-2">Upload raw assessment data and map it to the universal schema.</p>
                </div>
                {step > 1 && (
                    <button onClick={() => { setStep(1); setFile(null); setHeaders([]); setColumnMap({}); setSubmitResult(null); }} className="text-sm font-medium text-slate-500 hover:text-slate-700">
                        Start Over
                    </button>
                )}
            </div>

            {/* PROGRESS BAR */}
            <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                {[
                    { num: 1, label: "Upload File" },
                    { num: 2, label: "Define Event" },
                    { num: 3, label: "Map Columns" },
                    { num: 4, label: "Review & Run" }
                ].map((s) => (
                    <div key={s.num} className={`flex items-center ${step >= s.num ? 'text-indigo-600' : 'text-slate-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= s.num ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                            {s.num}
                        </div>
                        <span className="ml-3 font-medium">{s.label}</span>
                        {s.num < 4 && <ChevronRight className="w-5 h-5 mx-4 text-slate-300" />}
                    </div>
                ))}
            </div>

            {/* STEP 1: UPLOAD */}
            {step === 1 && (
                <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center shadow-sm animate-in fade-in slide-in-from-bottom-4">
                    <Upload className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900">Upload Excel Spreadsheet</h3>
                    <p className="text-slate-500 mt-2 mb-6 max-w-sm mx-auto">
                        Drop an `.xlsx` file here or click to browse. The first row must contain your column headers.
                    </p>
                    <label className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium cursor-pointer hover:bg-indigo-700 transition-colors">
                        Browse Files
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            )}

            {/* STEP 2: CONTEXT / METADATA */}
            {step === 2 && (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-xl font-semibold mb-6">Define Assessment Event</h3>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Data Type</label>
                            <select
                                className="w-full border-slate-300 rounded-lg shadow-sm p-3 border focus:ring-indigo-500 focus:border-indigo-500"
                                value={importType}
                                onChange={(e) => { setImportType(e.target.value as ImportType); setColumnMap({}); }}
                            >
                                <option value="self">Self Assessment</option>
                                <option value="mentor">Mentor Assessment</option>
                                <option value="peer">Peer Feedback</option>
                                <option value="term">Term Tracking (CBP, BOW)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Assessment Date</label>
                            <input
                                type="date"
                                className="w-full border-slate-300 rounded-lg shadow-sm p-3 border focus:ring-indigo-500 focus:border-indigo-500"
                                value={assessmentDate}
                                onChange={(e) => setAssessmentDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Program</label>
                            <select
                                className="w-full border-slate-300 rounded-lg shadow-sm p-3 border focus:ring-indigo-500 focus:border-indigo-500"
                                value={programId}
                                onChange={(e) => setProgramId(e.target.value)}
                            >
                                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Term</label>
                            <select
                                className="w-full border-slate-300 rounded-lg shadow-sm p-3 border focus:ring-indigo-500 focus:border-indigo-500"
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                            >
                                <option value="Year 1">Year 1</option>
                                <option value="Year 2">Year 2</option>
                                <option value="Year 3">Year 3</option>
                            </select>
                        </div>

                        {importType !== 'term' && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Project (Module)</label>
                                <select
                                    className="w-full border-slate-300 rounded-lg shadow-sm p-3 border focus:ring-indigo-500 focus:border-indigo-500"
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                >
                                    <option value="">Select a Project...</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="col-span-2 pt-6 flex justify-end">
                            <button
                                onClick={() => setStep(3)}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                                disabled={loadingConfig || (importType !== 'term' && !projectId)}
                            >
                                Continue to Mapping
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: MAPPING GRID */}
            {step === 3 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-900">Map Columns to Schema</h3>
                            <p className="text-slate-500 text-sm mt-1">Found {headers.length} columns in {file?.name}</p>
                        </div>
                        <button
                            onClick={() => setStep(4)}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
                        >
                            Verify Configuration
                        </button>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                <tr>
                                    <th className="py-4 px-6 font-semibold text-slate-700 w-1/2 border-b border-slate-100">Excel Column Header</th>
                                    <th className="py-4 px-6 font-semibold text-slate-700 w-1/2 border-b border-slate-100">Database Target</th>
                                </tr>
                            </thead>
                            <tbody>
                                {headers.map((header, i) => (
                                    <tr key={i} className="hover:bg-slate-50 border-b border-slate-100">
                                        <td className="py-3 px-6 text-sm text-slate-600 truncate max-w-md" title={header}>
                                            {header || `(Empty Column ${i + 1})`}
                                        </td>
                                        <td className="py-3 px-6">
                                            <select
                                                className={`w-full text-sm border-slate-200 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500 ${columnMap[header] ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-medium' : 'bg-white'}`}
                                                value={columnMap[header] || ''}
                                                onChange={(e) => handleMapChange(header, e.target.value)}
                                            >
                                                {getMappingTargetOptions()}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* STEP 4: REVIEW & EXECUTE */}
            {step === 4 && (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-xl font-semibold mb-6">Review & Execute</h3>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl">
                            <h4 className="font-semibold text-slate-800 mb-4">Event Details</h4>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between"><dt className="text-slate-500">File</dt> <dd className="font-medium">{file?.name}</dd></div>
                                <div className="flex justify-between"><dt className="text-slate-500">Data Type</dt> <dd className="font-medium capitalize">{importType}</dd></div>
                                <div className="flex justify-between"><dt className="text-slate-500">Date</dt> <dd className="font-medium">{assessmentDate}</dd></div>
                                <div className="flex justify-between"><dt className="text-slate-500">Term</dt> <dd className="font-medium">{term}</dd></div>
                                {importType !== 'term' && (
                                    <div className="flex justify-between"><dt className="text-slate-500">Project</dt> <dd className="font-medium">{projects.find(p => p.id === projectId)?.name}</dd></div>
                                )}
                            </dl>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl">
                            <h4 className="font-semibold text-slate-800 mb-4">Mapping Summary</h4>
                            <div className="text-sm">
                                <p className="mb-2"><span className="text-slate-500">Total Rows:</span> <span className="font-medium">{rawData.length}</span></p>
                                <p className="mb-2"><span className="text-slate-500">Total Columns:</span> <span className="font-medium">{headers.length}</span></p>
                                <p><span className="text-slate-500">Mapped Targets:</span> <span className="font-bold text-indigo-600">{Object.values(columnMap).filter(Boolean).length}</span></p>
                            </div>
                        </div>
                    </div>

                    {submitResult && (
                        <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${submitResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            {submitResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                            <p className="text-sm font-medium">{submitResult.message}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-4 border-t border-slate-100 pt-6">
                        <button onClick={() => setStep(3)} className="px-6 py-2 font-medium text-slate-600 hover:text-slate-900 transition" disabled={isSubmitting}>
                            Back
                        </button>
                        <button
                            onClick={handleExecuteImport}
                            className={`px-8 py-2 rounded-lg font-medium text-white transition flex items-center gap-2 ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Executing...' : 'Run Import to Database'}
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
