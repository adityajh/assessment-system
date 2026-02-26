"use client";

import { useState, useMemo } from 'react';
import { Assessment, ReadinessDomain, ReadinessParameter, updateAssessment } from '@/lib/supabase/queries/assessments';
import { Student } from '@/lib/supabase/queries/students';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const DOMAIN_COLORS: Record<string, string> = {
    'Commercial Readiness': 'border-amber-500/30 bg-amber-500/5',
    'Entrepreneurial Readiness': 'border-emerald-500/30 bg-emerald-500/5',
    'Marketing Readiness': 'border-pink-500/30 bg-pink-500/5',
    'Innovation Readiness': 'border-violet-500/30 bg-violet-500/5',
    'Operational Readiness': 'border-blue-500/30 bg-blue-500/5',
    'Professional Readiness': 'border-teal-500/30 bg-teal-500/5',
};

const DOMAIN_TEXT_COLORS: Record<string, string> = {
    'Commercial Readiness': 'text-amber-400',
    'Entrepreneurial Readiness': 'text-emerald-400',
    'Marketing Readiness': 'text-pink-400',
    'Innovation Readiness': 'text-violet-400',
    'Operational Readiness': 'text-blue-400',
    'Professional Readiness': 'text-teal-400',
};

interface ScoreGridProps {
    students: Student[];
    projectId: string;
    domains: ReadinessDomain[];
    parameters: ReadinessParameter[];
    assessments: Assessment[];
    assessmentType: 'mentor' | 'self';
    displayScore: 'raw' | 'normalized';
    onScoreUpdate: (assessment: Assessment) => void;
}

export function ScoreGrid({
    students,
    projectId,
    domains,
    parameters,
    assessments,
    assessmentType,
    displayScore,
    onScoreUpdate
}: ScoreGridProps) {
    const supabase = createClient();
    const [editingCell, setEditingCell] = useState<{ studentId: string; paramId: string } | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Group parameters by domain for table headers
    const paramsByDomain = useMemo(() => {
        const grouped: Record<string, ReadinessParameter[]> = {};
        domains.forEach(d => {
            grouped[d.id] = parameters.filter(p => p.domain_id === d.id).sort((a, b) => a.param_number - b.param_number);
        });
        return grouped;
    }, [domains, parameters]);

    // Create a fast lookup map for assessments
    const scoreMap = useMemo(() => {
        const map = new Map<string, Assessment>();
        assessments.forEach(a => {
            if (a.project_id === projectId && a.assessment_type === assessmentType) {
                map.set(`${a.student_id}-${a.parameter_id}`, a);
            }
        });
        return map;
    }, [assessments, projectId, assessmentType]);

    const handleCellClick = (studentId: string, paramId: string, currentScore: number | null) => {
        setEditingCell({ studentId, paramId });
        setEditValue(currentScore !== null ? currentScore.toString() : '');
    };

    const handleSave = async (studentId: string, paramId: string) => {
        if (!editingCell) return;

        const existingAssessment = scoreMap.get(`${studentId}-${paramId}`);

        // Validate input
        const parsedValue = parseFloat(editValue);
        const newValue = isNaN(parsedValue) || editValue === '' ? null : parsedValue;

        if (existingAssessment && existingAssessment.raw_score === newValue) {
            setEditingCell(null); // No change
            return;
        }

        try {
            setIsSaving(true);

            if (existingAssessment && existingAssessment.id) {
                // Update existing
                // Basic normalization assumption for mentor scores (1-10 scale usually)
                const updated = await updateAssessment(supabase, existingAssessment.id, {
                    raw_score: newValue,
                    normalized_score: newValue !== null ? newValue : null
                });
                onScoreUpdate(updated);
            } else {
                // We do not allow pure creation from grid yet (usually handled by import), 
                // but could add an insert query here if needed.
                console.warn("Manual creation of new assessment rows via grid not fully implemented. Please import first.");
            }
        } catch (error) {
            console.error("Failed to save score:", error);
            alert("Failed to save score. Please try again.");
        } finally {
            setIsSaving(false);
            setEditingCell(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, studentId: string, paramId: string) => {
        if (e.key === 'Enter') {
            handleSave(studentId, paramId);
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };

    return (
        <div className="w-full h-full overflow-auto relative custom-scrollbar">
            <table className="w-max min-w-full border-collapse text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-20">
                    <tr className="bg-slate-900 border-b-2 border-slate-800">
                        <th className="sticky left-0 z-30 bg-slate-900 p-3 min-w-[200px] font-semibold text-slate-300 shadow-[1px_0_0_0_#1e293b]">
                            Student
                        </th>
                        {domains.map(domain => {
                            const params = paramsByDomain[domain.id];
                            if (!params || params.length === 0) return null;

                            const domainName = domains.find(d => d.id === domain.id)?.name || '';
                            const colorClass = DOMAIN_COLORS[domainName] || 'border-slate-700 bg-slate-800/50';
                            const textClass = DOMAIN_TEXT_COLORS[domainName] || 'text-slate-300';

                            return (
                                <th
                                    key={domain.id}
                                    colSpan={params.length}
                                    className={`p-2 border-l border-b ${colorClass} text-center font-medium ${textClass}`}
                                >
                                    {domainName}
                                </th>
                            );
                        })}
                    </tr>

                    <tr className="bg-slate-900 border-b border-slate-800">
                        <th className="sticky left-0 z-30 bg-slate-900 p-2 text-xs font-medium text-slate-500 shadow-[1px_0_0_0_#1e293b]">
                            24 Parameters →
                        </th>
                        {domains.map(domain => {
                            const params = paramsByDomain[domain.id];
                            if (!params || params.length === 0) return null;

                            return params.map((param, idx) => (
                                <th
                                    key={param.id}
                                    className={`p-2 w-[60px] min-w-[60px] text-center text-xs font-mono text-slate-400 border-t border-slate-800/50 ${idx === 0 ? 'border-l border-slate-800' : ''}`}
                                    title={param.name}
                                >
                                    P{param.param_number}
                                </th>
                            ));
                        })}
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                    {students.map((student, rowIndex) => (
                        <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="sticky left-0 z-10 bg-slate-900 p-3 font-medium text-slate-200 shadow-[1px_0_0_0_#1e293b] flex items-center gap-2">
                                <span className="text-xs text-slate-500 font-mono w-4">{student.student_number}</span>
                                {student.canonical_name}
                            </td>

                            {domains.map(domain => {
                                const params = paramsByDomain[domain.id];
                                if (!params || params.length === 0) return null;

                                return params.map((param, idx) => {
                                    const assessment = scoreMap.get(`${student.id}-${param.id}`);
                                    const score = displayScore === 'raw' ? (assessment?.raw_score ?? null) : (assessment?.normalized_score ?? null);
                                    const isEditing = editingCell?.studentId === student.id && editingCell?.paramId === param.id;

                                    let cellBg = '';
                                    let cellText = 'text-slate-300';

                                    if (score === null) {
                                        cellBg = 'bg-slate-800/20'; // Empty
                                    } else if (assessmentType === 'mentor') {
                                        cellBg = 'bg-indigo-500/10 hover:bg-indigo-500/20';
                                        cellText = 'text-indigo-300 font-medium';
                                    } else {
                                        cellBg = 'bg-teal-500/10 hover:bg-teal-500/20';
                                        cellText = 'text-teal-300 font-medium';
                                    }

                                    return (
                                        <td
                                            key={param.id}
                                            className={`p-0 text-center border-t border-slate-800 ${idx === 0 ? 'border-l border-slate-800' : ''}`}
                                        >
                                            {isEditing ? (
                                                <div className="relative w-full h-full flex items-center justify-center bg-slate-800">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="1"
                                                        max="10"
                                                        autoFocus
                                                        className="w-12 text-center bg-transparent text-white outline-none font-mono text-sm py-2"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={() => handleSave(student.id, param.id)}
                                                        onKeyDown={(e) => handleKeyDown(e, student.id, param.id)}
                                                        disabled={isSaving}
                                                    />
                                                    {isSaving && (
                                                        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                                                            <LoadingSpinner size={14} className="p-0" />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div
                                                    className={`w-full h-full min-h-[40px] flex items-center justify-center cursor-pointer transition-colors ${cellBg} ${cellText}`}
                                                    onClick={() => handleCellClick(student.id, param.id, score)}
                                                    title={assessment ? `${param.name}\nRaw: ${assessment.raw_score} / ${assessment.raw_scale_max}\nSource: ${assessment.source_file}` : param.name}
                                                >
                                                    {score !== null ? score : <span className="text-slate-600">-</span>}
                                                </div>
                                            )}
                                        </td>
                                    );
                                });
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
