"use client";

import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Student } from '@/lib/supabase/queries/students';
import { Project } from '@/lib/supabase/queries/projects';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface ImportWizardProps {
    initialStudents: Student[];
    initialProjects: Project[];
}

type ImportType = 'mentor' | 'self' | 'peer' | 'term' | 'unknown';

export default function ImportWizardClientPage({ initialStudents, initialProjects }: ImportWizardProps) {
    const [file, setFile] = useState<File | null>(null);
    const [detectedType, setDetectedType] = useState<ImportType>('unknown');
    const [projectId, setProjectId] = useState<string>('');

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
        // This is a placeholder. 
        // True implementation would rigorously parse the sheetsData 
        // matching aliases and mapping columns to parameter IDs.
        console.log("Mock Transforming:", { type, projId, sheets: preview.sheetNames.length });
        return [
            // Mock record structure
            // { student_id: '...', project_id: projId, parameter_id: '...', assessment_type: type, raw_score: 5, etc. }
        ];
    };

    return (
        <div className="flex flex-col gap-6">

            {/* Step 1: Upload */}
            <div className="admin-card">
                <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-sm">1</span>
                    Upload Data File
                </h3>

                <div
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${file ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-700 bg-slate-800/20 hover:border-slate-600 hover:bg-slate-800/40'
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
                            <p className="text-slate-400">Parsing Excel file...</p>
                        </div>
                    ) : file ? (
                        <div className="flex flex-col items-center gap-3">
                            <FileSpreadsheet size={48} className="text-indigo-400" />
                            <div>
                                <p className="font-medium text-slate-200">{file.name}</p>
                                <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button
                                className="text-xs text-indigo-400 hover:text-indigo-300 underline mt-2"
                                onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewData(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            >
                                Remove file
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <UploadCloud size={48} className="text-slate-500" />
                            <div>
                                <p className="font-medium text-slate-300">Click or drag Excel file to upload</p>
                                <p className="text-sm text-slate-500 mt-1">Supports .xlsx and .xls formats</p>
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

            {/* Step 2: Configure & Verify (Only shown if file parsed) */}
            {previewData && !importResult && (
                <div className="admin-card animate-in slide-in-from-bottom-4">
                    <h3 className="text-lg font-medium text-slate-200 mb-6 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-sm">2</span>
                        Configure Import
                    </h3>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex flex-col gap-5">

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-400">Detected Data Type</label>
                                <select
                                    className="input bg-slate-900"
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
                                    <label className="text-sm font-medium text-slate-400">Associated Project</label>
                                    <select
                                        className="input bg-slate-900"
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                    >
                                        <option value="">-- Select Project --</option>
                                        {initialProjects.filter(p => p.project_type === 'standard').map(p => (
                                            <option key={p.id} value={p.id}>{p.sequence_label} - {p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button
                                className="btn btn-primary mt-4 py-3"
                                onClick={handleImport}
                                disabled={isProcessing || detectedType === 'unknown' || ((detectedType === 'mentor' || detectedType === 'self') && !projectId)}
                            >
                                {isProcessing ? (
                                    <span className="flex items-center gap-2"><LoadingSpinner size={18} /> Processing...</span>
                                ) : (
                                    <span className="flex items-center gap-2">Start Import <ArrowRight size={18} /></span>
                                )}
                            </button>

                        </div>

                        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                            <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">File Synopsis</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex justify-between">
                                    <span className="text-slate-500">File Name:</span>
                                    <span className="font-mono truncate ml-4" title={previewData.filename}>{previewData.filename}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-slate-500">Sheets Found:</span>
                                    <span>{previewData.sheetNames.length}</span>
                                </li>
                                {previewData.sheetNames.map((sheet: string, i: number) => {
                                    const rowCount = previewData.sheetsData[sheet]?.length || 0;
                                    if (i > 3) return i === 4 ? <li key="more" className="text-slate-500 text-right text-xs">...and {previewData.sheetNames.length - 4} more</li> : null;
                                    return (
                                        <li key={sheet} className="text-xs flex justify-between pl-2 border-l-2 border-slate-700 ml-1">
                                            <span className="truncate">{sheet}</span>
                                            <span className="text-slate-500 ml-2">{rowCount} rows</span>
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded text-xs text-indigo-300 flex items-start gap-2">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                <p>The import process will attempt to auto-match student names using known aliases. Unmatched records will be skipped.</p>
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
