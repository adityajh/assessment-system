"use client";

import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Student } from '@/lib/supabase/queries/students';
import { Project } from '@/lib/supabase/queries/projects';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { createClient } from '@/lib/supabase/client'; // Added for duplicate check

interface ImportWizardProps {
    initialStudents: Student[];
    initialProjects: Project[];
    initialPrograms: any[];
    initialMetrics?: any[];
}

type ImportType = 'mentor' | 'self' | 'peer' | 'term' | 'mentor_notes' | 'unknown';

export default function ImportWizardClientPage({ initialStudents, initialProjects, initialPrograms, initialMetrics = [] }: ImportWizardProps) {
    const [file, setFile] = useState<File | null>(null);
    const [detectedType, setDetectedType] = useState<ImportType>('unknown');
    const [projectId, setProjectId] = useState<string>('');
    const [targetMetricId, setTargetMetricId] = useState<string>('');
    const [assessmentDate, setAssessmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [program, setProgram] = useState<string>(initialPrograms?.[0]?.name || 'UG-MED');
    const [cohort, setCohort] = useState<string>(''); // Added cohort state
    const [term, setTerm] = useState<string>('Year 1');
    const [rawScaleMin, setRawScaleMin] = useState<number>(1);
    const [rawScaleMax, setRawScaleMax] = useState<number>(10);

    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [previewData, setPreviewData] = useState<any>(null);
    const [importResult, setImportResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateMessage, setDuplicateMessage] = useState('');
    const [proceedAfterDuplicate, setProceedAfterDuplicate] = useState<(() => void) | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewData(null);
            setImportResult(null);
            setError(null);
            setProjectId('');

            // Auto-upload and parse for preview
            await parseFile(selectedFile);
        }
    };

    const parseFile = async (selectedFile: File) => {
        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/api/import/parse', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to parse file');
            }

            setPreviewData(data);
            setDetectedType(data.detectedType as ImportType);

            if (data.detectedScale) {
                setRawScaleMax(data.detectedScale);
                setRawScaleMin(1); // Default to 1
            }

        } catch (err: any) {
            setError(err.message);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } finally {
            setIsUploading(false);
        }
    };

    const handleImport = async () => {
        if (!file || !previewData || detectedType === 'unknown') return;
        if (!program || !assessmentDate) {
            setError("Please fill out Assessment Date and Program.");
            return;
        }
        if (!cohort) {
            setError("Please select a Cohort year.");
            return;
        }
        if (detectedType === 'term' && !targetMetricId) {
            setError("Please select a Target Metric for this term report.");
            return;
        }
        if ((detectedType === 'mentor' || detectedType === 'self' || detectedType === 'peer' || detectedType === 'mentor_notes') && !projectId) {
            setError("Please select a project before importing.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // DUPLICATE CHECK
            const supabase = createClient();
            if (projectId) {
                const { data: existingLogs, error: logError } = await supabase
                    .from('assessment_logs')
                    .select('id, data_type, project_id, cohort')
                    .eq('data_type', detectedType)
                    .eq('project_id', projectId)
                    .eq('cohort', cohort);

                if (!logError && existingLogs && existingLogs.length > 0) {
                    const projectName = initialProjects.find(p => p.id === projectId)?.name || projectId;
                    const msg = `An assessment log for Project "${projectName}", Cohort "${cohort}", and Type "${detectedType}" already exists. Proceeding may create duplicate records.`;
                    setDuplicateMessage(msg);
                    // Store a continuation function and pause
                    setProceedAfterDuplicate(() => () => runImport());
                    setShowDuplicateModal(true);
                    setIsProcessing(false);
                    return;
                }
            }

            // No duplicate found — proceed directly
            await runImport();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Core import execution (called directly or after duplicate confirmation)
    const runImport = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            const recordsToSave = transformDataForDatabase(previewData, detectedType, projectId, initialStudents);
            if (recordsToSave.length === 0) throw new Error("No valid records found to import.");

            const response = await fetch('/api/import/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: detectedType,
                    projectId: projectId,
                    program: program,
                    cohort: cohort,
                    term: term,
                    targetMetricId: targetMetricId, // Passed for term reports
                    date: assessmentDate,
                    rawScaleMin: rawScaleMin,
                    rawScaleMax: rawScaleMax,
                    fileName: file!.name,
                    records: recordsToSave,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to import data');
            setImportResult(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Mock transformation function
    const transformDataForDatabase = (preview: any, type: ImportType, projId: string, students: Student[]) => {
        return preview.sheetsData;
    };

    return (
        <div className="flex flex-col gap-6">



            {/* Templates & Resources Card */}
            <div className="bg-slate-50 border-2 border-slate-200 p-8 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-950 mb-1">Import Guidelines & Nomenclature</h3>
                        <p className="text-sm text-slate-700 font-bold mb-6">Follow these rules for successful automatic data recognition.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-800">
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <h4 className="font-extrabold text-slate-950 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                                    1. File Naming Patterns
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between">
                                        <span className="font-bold">Mentor Assessment:</span>
                                        <span className="text-slate-500 italic">Default</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="font-bold">Self Assessment:</span>
                                        <span className="bg-indigo-100 px-1.5 rounded text-indigo-700 font-mono">Self</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="font-bold">Peer Feedback:</span>
                                        <span className="bg-indigo-100 px-1.5 rounded text-indigo-700 font-mono">Peer</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="font-bold">Term Metrics:</span>
                                        <span className="bg-indigo-100 px-1.5 rounded text-indigo-700 font-mono">Term</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="font-bold">Mentor Notes:</span>
                                        <span className="bg-indigo-100 px-1.5 rounded text-indigo-700 font-mono">Notes</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <h4 className="font-extrabold text-slate-950 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-emerald-600 rounded-full"></span>
                                    2. Required Column Headers
                                </h4>
                                <ul className="space-y-3 text-sm">
                                    <li>
                                        <span className="font-bold block mb-1">Mentor/Self Matrix</span>
                                        <code className="text-[11px] bg-slate-200 px-1.5 rounded text-slate-700">Code</code> (Col A), Student Names as headers.
                                    </li>
                                    <li>
                                        <span className="font-bold block mb-1">Self Assessment (Extra)</span>
                                        <code className="text-[11px] bg-slate-200 px-1.5 rounded text-slate-700">Question</code> or <code className="text-[11px] bg-slate-200 px-1.5 rounded text-slate-700">Prompt</code> column.
                                    </li>
                                    <li>
                                        <span className="font-bold block mb-1">Peer Feedback</span>
                                        <code className="text-[11px] bg-slate-200 px-1.5 rounded text-slate-700">Recipient Name</code>, <code className="text-[11px] bg-slate-200 px-1.5 rounded text-slate-700">Giver Name</code>, <code className="text-[11px] bg-slate-200 px-1.5 rounded text-slate-700">Project</code>.
                                    </li>
                                    <li>
                                        <span className="font-bold block mb-1">Term Metrics</span>
                                        <code className="text-[11px] bg-slate-200 px-1.5 rounded text-slate-700">Student Name</code>, <code className="text-[11px] bg-slate-200 px-1.5 rounded text-slate-700">Metric</code>, <code className="text-[11px] bg-slate-200 px-1.5 rounded text-slate-700">Value</code>.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 1: Upload */}
            <div className="bg-white border-2 border-slate-200 p-8 rounded-2xl shadow-sm">
                <h3 className="text-xl font-extrabold text-slate-950 mb-6 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 text-white text-sm">1</span>
                    Upload Data File
                </h3>

                <div
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${file ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50'
                        } `}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <LoadingSpinner size={40} />
                            <p className="text-slate-950 font-extrabold text-lg">Analyzing Data Structure...</p>
                        </div>
                    ) : file ? (
                        <div className="flex flex-col items-center gap-4">
                            <FileSpreadsheet size={64} className="text-indigo-600" />
                            <div>
                                <p className="text-xl font-black text-slate-950">{file.name}</p>
                                <p className="text-sm text-slate-700 font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button
                                className="text-sm text-red-600 hover:text-red-700 font-black underline mt-2"
                                onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewData(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            >
                                Remove and Try Again
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                <UploadCloud size={40} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-950 italic">Drag Excel sheet here</p>
                                <p className="text-sm text-slate-600 mt-2 font-bold uppercase tracking-widest">Supports .xlsx and .xls</p>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-300 flex items-start gap-3 text-red-800">
                        <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-600" />
                        <div className="text-sm font-semibold">{error}</div>
                    </div>
                )}

                {/* Duplicate Warning Modal */}
                {showDuplicateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-2xl border-2 border-amber-400 shadow-2xl max-w-lg w-full mx-4 p-8 animate-in zoom-in-95">
                            <div className="flex items-start gap-3 mb-6">
                                <AlertCircle size={24} className="text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-lg font-black text-slate-950 mb-2">Duplicate Data Warning</h4>
                                    <p className="text-sm text-slate-700 font-medium">{duplicateMessage}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    className="px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-800 font-bold hover:bg-slate-100 transition-all"
                                    onClick={() => { setShowDuplicateModal(false); setIsProcessing(false); }}
                                >Cancel</button>
                                <button
                                    className="px-6 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-all"
                                    onClick={() => { setShowDuplicateModal(false); if (proceedAfterDuplicate) proceedAfterDuplicate(); }}
                                >Import Anyway</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Step 2: Configure & Verify */}
            {previewData && !importResult && (
                <div className="bg-white border-2 border-slate-200 p-8 rounded-2xl shadow-lg animate-in slide-in-from-bottom-4">
                    <h3 className="text-xl font-extrabold text-slate-950 mb-8 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 text-white text-sm">2</span>
                        Configure & Verify Analysis
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="flex flex-col gap-6">

                            <div className="flex flex-col gap-2">
                                <label className="text-md font-black text-slate-950 uppercase tracking-wide">Detected Data Type</label>
                                <select
                                    className="input bg-white border-slate-300 !text-slate-900 !font-bold"
                                    value={detectedType}
                                    onChange={(e) => setDetectedType(e.target.value as ImportType)}
                                >
                                    <option value="unknown">-- Select Data Type --</option>
                                    <option value="mentor">Mentor Assessments (Matrix)</option>
                                    <option value="self">Self Assessments</option>
                                    <option value="peer">Peer Feedback</option>
                                    <option value="term">Metric Tracking (was Term Reports)</option>
                                    <option value="mentor_notes">Mentor Notes</option>
                                </select>
                            </div>

                            {detectedType === 'term' && (
                                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-md font-black text-slate-950 uppercase tracking-wide">Target Metric</label>
                                    <select
                                        className="input bg-white border-2 border-indigo-300 !text-slate-900 !font-extrabold h-12 focus:border-indigo-600 shadow-sm transition-all"
                                        value={targetMetricId}
                                        onChange={(e) => setTargetMetricId(e.target.value)}
                                    >
                                        <option value="">-- Choose Metric (CBP, BoW, etc.) --</option>
                                        {initialMetrics.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-500 font-bold italic px-1">Choose exactly which metric these values represent.</p>
                                </div>
                            )}

                            {(detectedType === 'mentor' || detectedType === 'self' || detectedType === 'peer' || detectedType === 'mentor_notes') && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-md font-black text-slate-950 uppercase tracking-wide">Associated Project</label>
                                    <select
                                        className="input bg-white border-2 border-slate-300 !text-slate-900 !font-bold h-12 focus:border-indigo-600 transition-all"
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                    >
                                        <option value="">-- Choose Project --</option>
                                        {initialProjects.filter(p => p.project_type === 'standard').sort((a, b) => (a.sequence_label || '').localeCompare(b.sequence_label || '')).map(p => (
                                            <option key={p.id} value={p.id}>{p.sequence_label} - {p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <p className="text-xl font-black text-slate-950 mb-4 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 text-white text-sm">2</span>
                                General Details
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Assessment Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-bold text-slate-950"
                                        value={assessmentDate}
                                        onChange={e => setAssessmentDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Program</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-bold text-slate-950"
                                        value={program}
                                        onChange={e => setProgram(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Program...</option>
                                        {initialPrograms.map(p => (
                                            <option key={p.id} value={p.name}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1">Cohort <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-bold text-slate-950"
                                        value={cohort}
                                        onChange={e => setCohort(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Select Cohort Year --</option>
                                        <option value="2023">2023</option>
                                        <option value="2024">2024</option>
                                        <option value="2025">2025</option>
                                        <option value="2026">2026</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Term</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Phase 1, Term 2"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-bold text-slate-950 placeholder:font-normal placeholder:text-slate-400"
                                        value={term}
                                        onChange={e => setTerm(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <p className="text-xl font-black text-slate-950 mb-4 mt-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 text-white text-sm">3</span>
                                Score Sensitivity (Manual Scale)
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Min Raw Score</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-bold text-slate-950"
                                        value={rawScaleMin}
                                        onChange={e => setRawScaleMin(parseInt(e.target.value))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Max Raw Score</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-bold text-slate-950"
                                        value={rawScaleMax}
                                        onChange={e => setRawScaleMax(parseInt(e.target.value))}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                className={`w-full rounded-xl py-4 font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3 mt-4 ${isProcessing || detectedType === 'unknown' || !assessmentDate || !program || !cohort || !term ||
                                    ((detectedType === 'mentor' || detectedType === 'self' || detectedType === 'peer' || detectedType === 'mentor_notes') && !projectId)
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-slate-950 text-white hover:bg-indigo-600 cursor-pointer'
                                    }`}
                                onClick={handleImport}
                                disabled={isProcessing || detectedType === 'unknown' || !assessmentDate || !program || !cohort || !term ||
                                    ((detectedType === 'mentor' || detectedType === 'self' || detectedType === 'peer' || detectedType === 'mentor_notes') && !projectId)
                                }
                            >
                                {isProcessing ? (
                                    <span className="flex items-center gap-2"><LoadingSpinner size={24} /> Executing Import...</span>
                                ) : (
                                    <span className="flex items-center gap-2">FINAL RUN: IMPORT TO DATABASE <ArrowRight size={24} /></span>
                                )}
                            </button>

                        </div>

                        <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-8 shadow-inner">
                            <h4 className="text-sm font-black text-slate-950 mb-6 uppercase tracking-[0.2em] border-b-2 border-slate-200 pb-2">Analysis Results</h4>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-black text-slate-600 uppercase">Students Detected</span>
                                        <span className="text-xs font-black text-slate-950 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">{previewData.recognition.studentCount} Matched</span>
                                    </div>
                                    <div className="bg-white border-2 border-slate-200 rounded-xl p-3 max-h-32 overflow-y-auto shadow-sm">
                                        {previewData.recognition.students.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {previewData.recognition.students.map((s: string) => (
                                                    <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-900 rounded text-[10px] font-black border border-slate-200">{s}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-red-700 text-[10px] font-black uppercase">Critical: No students matched!</span>
                                        )}
                                    </div>
                                </div>

                                {previewData.recognition.unrecognizedStudentCount > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded p-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-red-800 flex items-center gap-1">
                                                <AlertCircle size={14} /> UNRECOGNIZED STUDENT NAMES
                                            </span>
                                            <span className="text-[10px] font-bold text-red-700 uppercase">Will be skipped</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {previewData.recognition.unrecognizedStudents.map((s: string) => (
                                                <span key={s} className="px-1.5 py-0.5 bg-white border border-red-200 text-red-600 rounded text-[10px] font-bold shadow-sm">{s}</span>
                                            ))}
                                        </div>
                                        <p className="text-[9px] text-red-600 mt-2 font-medium">Verify if these are student names. If yes, add them as aliases in the Student database.</p>
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-black text-slate-600 uppercase">Metrics Validated</span>
                                        <span className="text-xs font-black text-slate-950 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">{previewData.recognition.parameterCount} Verified</span>
                                    </div>
                                    <div className="bg-white border-2 border-slate-200 rounded-xl p-3 shadow-sm">
                                        {previewData.recognition.parameters.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {previewData.recognition.parameters.map((p: string) => (
                                                    <span key={p} className="px-2 py-0.5 bg-indigo-50 text-indigo-900 rounded text-[10px] font-black border border-indigo-100">{p}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-red-700 text-[10px] font-black uppercase">Critical: No parameter codes recognized!</span>
                                        )}
                                    </div>
                                </div>

                                {(detectedType === 'mentor' || detectedType === 'self') && (
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-slate-600 uppercase">Detected Raw Scale</span>
                                            <span className="text-xs font-black text-slate-950 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                                {previewData?.detectedScale ? `1 to ${previewData.detectedScale}` : '1 to 10 (Default)'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {(detectedType === 'self') && (
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-slate-600 uppercase">Questions / Prompts Column</span>
                                            {previewData?.detectedPromptColumn ? (
                                                <span className="text-xs font-black text-slate-950 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                                    ✓ {previewData.detectedPromptColumn}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                                    Not Detected
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {previewData.recognition.unrecognizedCodes.length > 0 && (
                                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 shadow-sm">
                                        <span className="text-[10px] font-black text-amber-900 block mb-2 uppercase tracking-tight">Skipped Codes (Not in database):</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {previewData.recognition.unrecognizedCodes.map((c: string) => (
                                                <span key={c} className="text-[10px] px-1.5 py-0.5 bg-white border border-amber-300 text-amber-700 font-black rounded-md">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 p-4 bg-indigo-950 rounded-xl text-[11px] text-white font-bold flex items-start gap-3 shadow-lg">
                                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-indigo-400" />
                                <p>This engine is fully automated. As long as the names and codes match our "Golden Standard", your data will be perfectly ingested.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Success Result */}
            {importResult && (
                <div className="bg-emerald-50 border-4 border-emerald-500 p-12 rounded-3xl animate-in zoom-in-95 duration-500 shadow-2xl">
                    <div className="flex flex-col items-center justify-center text-center py-6">
                        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-200">
                            <CheckCircle2 size={48} className="text-white" />
                        </div>
                        <h3 className="text-4xl font-black text-slate-950 mb-4">Ingestion Complete!</h3>
                        <p className="text-xl text-slate-700 mb-10 font-bold max-w-lg leading-relaxed">{importResult.message}</p>

                        <button
                            className="bg-slate-950 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3"
                            onClick={() => { setFile(null); setPreviewData(null); setImportResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        >
                            Import Next File
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
