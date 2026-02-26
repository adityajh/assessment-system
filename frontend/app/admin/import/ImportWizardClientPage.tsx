"use client";

import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Student } from '@/lib/supabase/queries/students';
import { Project } from '@/lib/supabase/queries/projects';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface ImportWizardProps {
    initialStudents: Student[];
    initialProjects: Project[];
    initialPrograms: any[];
}

type ImportType = 'mentor' | 'self' | 'peer' | 'term' | 'unknown';

export default function ImportWizardClientPage({ initialStudents, initialProjects, initialPrograms }: ImportWizardProps) {
    const [file, setFile] = useState<File | null>(null);
    const [detectedType, setDetectedType] = useState<ImportType>('unknown');
    const [projectId, setProjectId] = useState<string>('');
    const [assessmentDate, setAssessmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [program, setProgram] = useState<string>(initialPrograms?.[0]?.name || 'UG-MED');
    const [term, setTerm] = useState<string>('Year 1');

    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [previewData, setPreviewData] = useState<any>(null);
    const [importResult, setImportResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

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
        if ((detectedType === 'mentor' || detectedType === 'self') && !projectId) {
            setError("Please select a project before importing assessments.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // 1. Transform previewData into backend-ready records
            // Note: Full robust parsing logic replicating Phase 2 Python scripts 
            // is complex to do purely client-side without a python backend. 
            // For this wizard, we are scaffolding the UI and sending the request to the Next.js API.
            // In a real scenario, the parsing logic resides in the backend API.

            const recordsToSave = transformDataForDatabase(previewData, detectedType, projectId, initialStudents);

            if (recordsToSave.length === 0) {
                throw new Error("No valid records found to import.");
            }

            // 2. Send to API to save
            const response = await fetch('/api/import/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: detectedType,
                    projectId: projectId,
                    program: program,
                    term: term,
                    date: assessmentDate,
                    fileName: file.name,
                    records: recordsToSave
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to import data');
            }

            setImportResult(result);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Mock transformation function for scaffolding purposes
    const transformDataForDatabase = (preview: any, type: ImportType, projId: string, students: Student[]) => {
        // Since we are sending the raw sheetsData to the backend for actual parsing now, 
        // we'll just return the raw preview data payload and let the backend securely parse it!
        return preview.sheetsData;
    };

    return (
        <div className="flex flex-col gap-6">

            {/* Templates & Resources Card */}
            <div className="admin-card bg-white shadow-md border-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-black mb-1">Importer Resources</h3>
                        <p className="text-sm text-slate-600 font-medium">Download these "Golden Templates" to ensure your data is perfectly formatted.</p>
                    </div>
                    <div className="flex gap-2">
                        <a
                            href="/templates/Golden_Template_Matrix.xlsx"
                            download
                            className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center gap-2"
                        >
                            <FileSpreadsheet size={14} /> Matrix Template
                        </a>
                        <a
                            href="/templates/Golden_Template_PeerFeedback.xlsx"
                            download
                            className="bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-2"
                        >
                            <FileSpreadsheet size={14} /> Peer Template
                        </a>
                    </div>
                </div>
            </div>

            {/* Templates & Resources Card */}
            <div className="bg-slate-50 border-2 border-slate-200 p-8 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-950 mb-1">Golden Data Templates</h3>
                        <p className="text-sm text-slate-700 font-bold">Use these established formats for 100% recognition accuracy.</p>
                    </div>
                    <div className="flex gap-4">
                        <a
                            href="/templates/Golden_Template_Matrix.xlsx"
                            download
                            className="bg-slate-950 text-white px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-slate-950 hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
                        >
                            <FileSpreadsheet size={16} /> Matrix Template
                        </a>
                        <a
                            href="/templates/Golden_Template_PeerFeedback.xlsx"
                            download
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-indigo-500 hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg"
                        >
                            <FileSpreadsheet size={16} /> Peer Template
                        </a>
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
                        }`}
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
                    <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <div className="text-sm">{error}</div>
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
                                    className="input bg-white border-slate-300 text-black font-medium"
                                    value={detectedType}
                                    onChange={(e) => setDetectedType(e.target.value as ImportType)}
                                >
                                    <option value="unknown">-- Select Data Type --</option>
                                    <option value="mentor">Mentor Assessments (Matrix)</option>
                                    <option value="self">Self Assessments</option>
                                    <option value="peer">Peer Feedback</option>
                                    <option value="term">Term Reports</option>
                                </select>
                            </div>

                            {(detectedType === 'mentor' || detectedType === 'self') && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-md font-black text-slate-950 uppercase tracking-wide">Associated Project</label>
                                    <select
                                        className="input bg-white border-2 border-slate-300 text-slate-950 font-black h-12 focus:border-indigo-600 transition-all"
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

                            <div className="flex flex-col gap-2 border-t border-slate-100 pt-6 mt-2">
                                <label className="text-md font-black text-slate-950 uppercase tracking-wide">Date of Assessment</label>
                                <input
                                    type="date"
                                    className="input bg-white border-2 border-slate-300 text-slate-950 font-black h-12"
                                    value={assessmentDate}
                                    onChange={(e) => setAssessmentDate(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-black text-slate-950 uppercase">Program</label>
                                    <select
                                        className="input bg-white border-2 border-slate-300 text-slate-950 font-black h-12"
                                        value={program}
                                        onChange={(e) => setProgram(e.target.value)}
                                    >
                                        {initialPrograms.map(p => (
                                            <option key={p.id} value={p.name}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-black text-slate-950 uppercase">Term</label>
                                    <input
                                        type="text"
                                        className="input bg-white border-2 border-slate-300 text-slate-950 font-black h-12"
                                        placeholder="e.g. Year 1"
                                        value={term}
                                        onChange={(e) => setTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                className="w-full bg-slate-950 text-white rounded-xl py-4 font-black text-lg hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-3 mt-4"
                                onClick={handleImport}
                                disabled={isProcessing || detectedType === 'unknown' || ((detectedType === 'mentor' || detectedType === 'self') && (!projectId || !assessmentDate || !program || !term))}
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
