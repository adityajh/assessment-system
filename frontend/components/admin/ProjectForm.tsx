"use client";

import { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Project, createProject, updateProject } from '@/lib/supabase/queries/projects';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface ProjectFormProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    allProjects: Project[];
    onSave: (project: Project) => void;
}

export function ProjectForm({ isOpen, onClose, project, allProjects, onSave }: ProjectFormProps) {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        internal_name: '',
        sequence: '',
        sequence_label: '',
        is_concurrent: false,
        concurrent_group: '',
        project_type: 'standard' as 'standard' | 'client',
        parent_project_id: ''
    });

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name,
                internal_name: project.internal_name || '',
                sequence: project.sequence.toString(),
                sequence_label: project.sequence_label,
                is_concurrent: project.is_concurrent,
                concurrent_group: project.concurrent_group || '',
                project_type: project.project_type,
                parent_project_id: project.parent_project_id || ''
            });
        } else {
            setFormData({
                name: '',
                internal_name: '',
                sequence: '',
                sequence_label: '',
                is_concurrent: false,
                concurrent_group: '',
                project_type: 'standard',
                parent_project_id: ''
            });
        }
    }, [project, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name || !formData.sequence || !formData.sequence_label) {
            setError("Name, Sequence, and Sequence Label are required.");
            return;
        }

        if (formData.is_concurrent && !formData.concurrent_group) {
            setError("Concurrent Group is required for concurrent projects.");
            return;
        }

        setIsLoading(true);

        try {
            const payload: any = {
                name: formData.name.trim(),
                internal_name: formData.internal_name.trim() || null,
                sequence: parseInt(formData.sequence, 10),
                sequence_label: formData.sequence_label.trim(),
                is_concurrent: formData.is_concurrent,
                concurrent_group: formData.is_concurrent ? formData.concurrent_group.trim() : null,
                project_type: formData.project_type,
                parent_project_id: formData.parent_project_id || null
            };

            let savedProject: Project;

            if (project) {
                savedProject = await updateProject(supabase, project.id, payload);
            } else {
                savedProject = await createProject(supabase, payload);
            }

            onSave(savedProject);
        } catch (err: any) {
            console.error("Error saving project:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const standardProjects = allProjects.filter(p => p.project_type === 'standard' && p.id !== project?.id);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={project ? "Edit Project" : "Add New Project"}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                {error && (
                    <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Project Name *</label>
                    <input
                        type="text"
                        className="input"
                        value={formData.name}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Kickstart"
                        required
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Internal Name</label>
                    <input
                        type="text"
                        className="input"
                        value={formData.internal_name}
                        onChange={(e) => setFormData(p => ({ ...p, internal_name: e.target.value }))}
                        placeholder="e.g. Murder Mystery"
                    />
                    <p className="text-xs text-slate-500">Used if the excel sheet uses a different name than the display name.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 mt-2">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-300">Sequence Number *</label>
                        <input
                            type="number"
                            className="input"
                            value={formData.sequence}
                            onChange={(e) => setFormData(p => ({ ...p, sequence: e.target.value }))}
                            placeholder="e.g. 1"
                            required
                        />
                        <p className="text-xs text-slate-500">Numeric chronological order</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-300">Sequence Label *</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.sequence_label}
                            onChange={(e) => setFormData(p => ({ ...p, sequence_label: e.target.value }))}
                            placeholder="e.g. 2a"
                            required
                        />
                        <p className="text-xs text-slate-500">Display label (e.g. 1, 2a, 2b)</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-800 pt-4 mt-2">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isConcurrent"
                            checked={formData.is_concurrent}
                            onChange={(e) => setFormData(p => ({ ...p, is_concurrent: e.target.checked, concurrent_group: e.target.checked ? p.concurrent_group : '' }))}
                            className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                        />
                        <label htmlFor="isConcurrent" className="text-sm font-medium text-slate-300 cursor-pointer">
                            This is a concurrent project
                        </label>
                    </div>

                    {formData.is_concurrent && (
                        <div className="flex flex-col gap-1.5 pl-7">
                            <label className="text-sm font-medium text-slate-300">Concurrent Group *</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.concurrent_group}
                                onChange={(e) => setFormData(p => ({ ...p, concurrent_group: e.target.value }))}
                                placeholder="e.g. M or L"
                                required={formData.is_concurrent}
                            />
                            <p className="text-xs text-slate-500">Which group of students took this track?</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-800 pt-4 mt-2 mb-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-300">Project Type</label>
                        <select
                            className="input bg-slate-900"
                            value={formData.project_type}
                            onChange={(e) => setFormData(p => ({ ...p, project_type: e.target.value as 'standard' | 'client', parent_project_id: e.target.value === 'standard' ? '' : p.parent_project_id }))}
                        >
                            <option value="standard">Standard Project</option>
                            <option value="client">Client Project (e.g. Moonshine/SIDR)</option>
                        </select>
                    </div>

                    {formData.project_type === 'client' && (
                        <div className="flex flex-col gap-1.5 pl-4 border-l-2 border-slate-800">
                            <label className="text-sm font-medium text-slate-300">Parent Project</label>
                            <select
                                className="input bg-slate-900"
                                value={formData.parent_project_id}
                                onChange={(e) => setFormData(p => ({ ...p, parent_project_id: e.target.value }))}
                            >
                                <option value="">-- No Parent (Standalone) --</option>
                                {standardProjects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500">Select the main project this client project belongs to (e.g. SDP).</p>
                        </div>
                    )}
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
                        {isLoading ? <LoadingSpinner size={18} /> : (project ? "Save Changes" : "Add Project")}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
