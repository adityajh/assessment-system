"use client";

import { useState } from 'react';
import { Project } from '@/lib/supabase/queries/projects';
import { Badge } from '@/components/shared/Badge';
import { Edit2, Plus, GitMerge } from 'lucide-react';
import { ProjectForm } from '@/components/admin/ProjectForm';

export default function ProjectsClientPage({ initialProjects }: { initialProjects: Project[] }) {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Group by sequence for visual display
    const groupedProjects = projects.reduce((acc, project) => {
        if (!acc[project.sequence]) {
            acc[project.sequence] = [];
        }
        acc[project.sequence].push(project);
        return acc;
    }, {} as Record<number, Project[]>);

    const sequences = Object.keys(groupedProjects).map(Number).sort((a, b) => a - b);

    const handleSave = (updatedProject: Project) => {
        setProjects(prev => {
            const exists = prev.find(p => p.id === updatedProject.id);
            if (exists) {
                return prev.map(p => p.id === updatedProject.id ? updatedProject : p);
            }
            return [...prev, updatedProject].sort((a, b) => {
                if (a.sequence === b.sequence) return a.sequence_label.localeCompare(b.sequence_label);
                return a.sequence - b.sequence;
            });
        });
        setEditingProject(null);
        setIsFormOpen(false);
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    className="btn btn-primary"
                    onClick={() => { setEditingProject(null); setIsFormOpen(true); }}
                >
                    <Plus size={18} /> Add Project
                </button>
            </div>

            <div className="flex flex-col gap-6">
                {sequences.map(seq => {
                    const seqProjects = groupedProjects[seq];
                    const isConcurrent = seqProjects.some(p => p.is_concurrent);

                    return (
                        <div key={seq} className="admin-card">
                            <div className="flex gap-4 items-center mb-4 pb-4 border-b border-slate-800">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                                    {seq}
                                </div>
                                <h3 className="text-lg font-medium text-slate-200">
                                    Sequence {seq} {isConcurrent && <span className="text-slate-400 text-sm font-normal ml-2">(Concurrent Phase)</span>}
                                </h3>
                            </div>

                            <div className={`grid gap-4 ${isConcurrent ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {seqProjects.map(project => (
                                    <div
                                        key={project.id}
                                        className={`p-4 rounded-lg border border-slate-800 bg-slate-900/50 flex flex-col gap-3 ${project.project_type === 'client' ? 'border-dashed border-indigo-500/30' : ''}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                                    {project.sequence_label}
                                                </span>
                                                <h4 className="font-semibold text-slate-200">{project.name}</h4>
                                            </div>
                                            <button
                                                onClick={() => { setEditingProject(project); setIsFormOpen(true); }}
                                                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2 text-sm">
                                            <Badge variant={project.project_type === 'client' ? 'info' : 'default'}>
                                                {project.project_type === 'client' ? 'Client Project' : 'Standard'}
                                            </Badge>

                                            {project.internal_name && (
                                                <span className="text-slate-400 text-xs flex items-center gap-1">
                                                    Internal: <span className="text-slate-300">{project.internal_name}</span>
                                                </span>
                                            )}

                                            {project.is_concurrent && project.concurrent_group && (
                                                <div className="flex items-center gap-1 text-slate-400 text-xs ml-auto">
                                                    <GitMerge size={14} className="text-amber-500" />
                                                    Group: <span className="font-medium text-amber-500">{project.concurrent_group}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {projects.length === 0 && (
                    <div className="admin-card text-center py-12 text-slate-500">
                        No projects defined yet.
                    </div>
                )}
            </div>

            <ProjectForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                project={editingProject}
                allProjects={projects}
                onSave={handleSave}
            />
        </>
    );
}
