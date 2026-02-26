"use client";

import { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Student, createStudent, updateStudent, Program } from '@/lib/supabase/queries/students';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { X } from 'lucide-react';

interface StudentFormProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    programs: Program[];
    onSave: (student: Student) => void;
}

export function StudentForm({ isOpen, onClose, student, programs, onSave }: StudentFormProps) {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        student_number: '',
        canonical_name: '',
        is_active: true,
        program_id: '',
        cohort: '',
        aliases: [] as string[],
        newAlias: ''
    });

    useEffect(() => {
        if (student) {
            setFormData({
                student_number: student.student_number.toString(),
                canonical_name: student.canonical_name,
                is_active: student.is_active,
                program_id: student.program_id || '',
                cohort: student.cohort || '',
                aliases: [...student.aliases],
                newAlias: ''
            });
        } else {
            setFormData({
                student_number: '',
                canonical_name: '',
                is_active: true,
                program_id: '',
                cohort: '',
                aliases: [],
                newAlias: ''
            });
        }
    }, [student, isOpen]);

    const addAlias = (e: React.KeyboardEvent | React.MouseEvent) => {
        if ('key' in e && e.key !== 'Enter') return;
        e.preventDefault();
        if (!formData.newAlias.trim()) return;
        if (formData.aliases.includes(formData.newAlias.trim())) return;

        setFormData(prev => ({
            ...prev,
            aliases: [...prev.aliases, prev.newAlias.trim()],
            newAlias: ''
        }));
    };

    const removeAlias = (aliasToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            aliases: prev.aliases.filter(a => a !== aliasToRemove)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.canonical_name || !formData.student_number) {
            setError("Name and Student Number are required.");
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                student_number: parseInt(formData.student_number, 10),
                canonical_name: formData.canonical_name.trim(),
                is_active: formData.is_active,
                program_id: formData.program_id || undefined,
                cohort: formData.cohort.trim() || undefined,
                aliases: formData.aliases
            };

            let savedStudent: Student;

            if (student) {
                savedStudent = await updateStudent(supabase, student.id, payload);
            } else {
                savedStudent = await createStudent(supabase, payload);
            }

            onSave(savedStudent);
        } catch (err: any) {
            console.error("Error saving student:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={student ? "Edit Student" : "Add New Student"}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                {error && (
                    <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Student Number</label>
                    <input
                        type="number"
                        className="input"
                        value={formData.student_number}
                        onChange={(e) => setFormData(p => ({ ...p, student_number: e.target.value }))}
                        placeholder="e.g. 1"
                        required
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Canonical Name</label>
                    <input
                        type="text"
                        className="input"
                        value={formData.canonical_name}
                        onChange={(e) => setFormData(p => ({ ...p, canonical_name: e.target.value }))}
                        placeholder="e.g. Aadi Gujar"
                        required
                    />
                    <p className="text-xs text-slate-500">The primary name used across the system.</p>
                </div>

                <div className="flex gap-4">
                    <div className="flex flex-col gap-1.5 w-1/2">
                        <label className="text-sm font-medium text-slate-300">Program <span className="text-slate-500">(Optional)</span></label>
                        <select
                            className="input"
                            value={formData.program_id}
                            onChange={(e) => setFormData(p => ({ ...p, program_id: e.target.value }))}
                        >
                            <option value="">-- No Program --</option>
                            {programs.map(prog => (
                                <option key={prog.id} value={prog.id}>{prog.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5 w-1/2">
                        <label className="text-sm font-medium text-slate-300">Cohort <span className="text-slate-500">(Optional)</span></label>
                        <input
                            type="text"
                            className="input"
                            value={formData.cohort}
                            onChange={(e) => setFormData(p => ({ ...p, cohort: e.target.value }))}
                            placeholder="e.g. 2025"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-300">Known Aliases</label>
                    <p className="text-xs text-slate-500 leading-tight">
                        Other names this student goes by in input sheets (e.g., "Adi Gujar M"). Used for auto-matching during import.
                    </p>

                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.aliases.map((alias) => (
                            <span key={alias} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-sm group">
                                {alias}
                                <button
                                    type="button"
                                    onClick={() => removeAlias(alias)}
                                    className="text-slate-500 hover:text-red-400 focus:outline-none"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                        {formData.aliases.length === 0 && <span className="text-sm text-slate-600 italic">No aliases added.</span>}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="input flex-1"
                            value={formData.newAlias}
                            onChange={(e) => setFormData(p => ({ ...p, newAlias: e.target.value }))}
                            onKeyDown={addAlias}
                            placeholder="Add an alias and press Enter"
                        />
                        <button
                            type="button"
                            onClick={addAlias}
                            className="btn bg-slate-800 hover:bg-slate-700 text-sm px-3"
                        >
                            Add
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 py-2 mt-2 border-t border-slate-800 pt-4">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-300 cursor-pointer">
                        Program Status: Student is currently active
                    </label>
                </div>

                <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-ghost"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary min-w-[100px] justify-center"
                        disabled={isLoading}
                    >
                        {isLoading ? <LoadingSpinner size={18} /> : (student ? "Save Changes" : "Add Student")}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
