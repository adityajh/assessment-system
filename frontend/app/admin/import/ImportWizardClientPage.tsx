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

            {/* Step 1: Upload */}
            <div className="admin-card bg-white shadow-md border-slate-200">
                <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-sm">1</span>
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
                            <LoadingSpinner size={32} />
                            <p className="text-slate-600 font-medium">Parsing Excel file...</p>
                        </div>
                    ) : file ? (
                        <div className="flex flex-col items-center gap-3">
                            <FileSpreadsheet size={48} className="text-indigo-600" />
                            <div>
                                <p className="font-bold text-black">{file.name}</p>
                                <p className="text-sm text-slate-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button
                                className="text-xs text-indigo-700 hover:text-indigo-800 font-semibold underline mt-2"
                                onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewData(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            >
                                Remove file
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <UploadCloud size={48} className="text-slate-400" />
                            <div>
                                <p className="font-bold text-slate-800">Click or drag Excel file to upload</p>
                                <p className="text-sm text-slate-500 mt-1 font-medium">Supports .xlsx and .xls formats</p>
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
                <div className="admin-card bg-white shadow-md border-slate-200 animate-in slide-in-from-bottom-4">
                    <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-sm">2</span>
                        Configure Import
                    </h3>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex flex-col gap-5">

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-700">Detected Data Type</label>
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
                                    <label className="text-sm font-bold text-slate-700">Associated Project</label>
                                    <select
                                        className="input bg-white border-slate-300 text-black font-medium"
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                    >
                                        <option value="">-- Select Project --</option>
                                        {initialProjects.filter(p => p.project_type === 'standard').sort((a, b) => (a.sequence_label || '').localeCompare(b.sequence_label || '')).map(p => (
                                            <option key={p.id} value={p.id}>{p.sequence_label} - {p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 mt-2">
                                <label className="text-sm font-bold text-slate-700">Date of Assessment</label>
                                <input
                                    type="date"
                                    className="input bg-white border-slate-300 text-black font-medium"
                                    value={assessmentDate}
                                    onChange={(e) => setAssessmentDate(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-slate-700">Program</label>
                                    <select
                                        className="input bg-white border-slate-300 text-black font-medium"
                                        value={program}
                                        onChange={(e) => setProgram(e.target.value)}
                                    >
                                        {initialPrograms.map(p => (
                                            <option key={p.id} value={p.name}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-slate-700">Term</label>
                                    <input
                                        type="text"
                                        className="input bg-white border-slate-300 text-black font-medium"
                                        placeholder="e.g. Year 1"
                                        value={term}
                                        onChange={(e) => setTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                className="btn btn-primary mt-4 py-3"
                                onClick={handleImport}
                                disabled={isProcessing || detectedType === 'unknown' || ((detectedType === 'mentor' || detectedType === 'self') && (!projectId || !assessmentDate || !program || !term))}
                            >
                                {isProcessing ? (
                                    <span className="flex items-center gap-2"><LoadingSpinner size={18} /> Processing...</span>
                                ) : (
                                    <span className="flex items-center gap-2">Start Import <ArrowRight size={18} /></span>
                                )}
                            </button>

                        </div>

                        <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
                            <h4 className="text-sm font-bold text-black mb-4 uppercase tracking-wider">Recognition Confirmation</h4>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-slate-500">STUDENTS RECOGNIZED</span>
                                        <span className="text-xs font-bold text-black">{previewData.recognition.studentCount} Found</span>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded p-2 max-h-32 overflow-y-auto">
                                        {previewData.recognition.students.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {previewData.recognition.students.map((s: string) => (
                                                    <span key={s} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">{s}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-red-500 text-[10px] font-bold">No students matched! Check headers.</span>
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
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-slate-500">METRICS / CODES RECOGNIZED</span>
                                        <span className="text-xs font-bold text-black">{previewData.recognition.parameterCount} Matched</span>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded p-2">
                                        {previewData.recognition.parameters.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {previewData.recognition.parameters.map((p: string) => (
                                                    <span key={p} className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-bold">{p}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-red-500 text-[10px] font-bold">No parameter codes recognized!</span>
                                        )}
                                    </div>
                                </div>

                                {previewData.recognition.unrecognizedCodes.length > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded p-2">
                                        <span className="text-[10px] font-bold text-amber-800 block mb-1">UNRECOGNIZED CODES (WILL BE SKIPPED):</span>
                                        <div className="flex flex-wrap gap-1">
                                            {previewData.recognition.unrecognizedCodes.map((c: string) => (
                                                <span key={c} className="text-[10px] text-amber-600 font-mono">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 p-3 bg-indigo-50 border border-indigo-100 rounded text-[11px] text-indigo-900 font-medium flex items-start gap-2">
                                <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-indigo-600" />
                                <p>Recognition is automatic. Column mapping is no longer required as long as Student Names and Parameter Codes are found.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Success Result */}
            {importResult && (
                <div className="admin-card border-emerald-500/30 bg-emerald-500/5 animate-in slide-in-from-bottom-4">
                    <div className="flex flex-col items-center justify-center text-center py-8">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 size={32} className="text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-emerald-400 mb-2">Import Successful!</h3>
                        <p className="text-slate-300 mb-6">{importResult.message}</p>

                        <button
                            className="btn bg-slate-800 hover:bg-slate-700"
                            onClick={() => { setFile(null); setPreviewData(null); setImportResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        >
                            Import Another File
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
