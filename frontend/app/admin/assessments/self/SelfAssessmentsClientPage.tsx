"use client";

import { useState, useMemo } from 'react';
import { Assessment, ReadinessDomain, ReadinessParameter } from '@/lib/supabase/queries/assessments';
import { Student } from '@/lib/supabase/queries/students';
import { Project } from '@/lib/supabase/queries/projects';
import { ScoreGrid } from '@/components/admin/ScoreGrid';

interface SelfAssessmentsProps {
    initialStudents: Student[];
    initialProjects: Project[];
    initialDomains: ReadinessDomain[];
    initialParameters: ReadinessParameter[];
    initialAssessments: Assessment[];
}

export default function SelfAssessmentsClientPage({
    initialStudents,
    initialProjects,
    initialDomains,
    initialParameters,
    initialAssessments
}: SelfAssessmentsProps) {
    const [assessments, setAssessments] = useState(initialAssessments);
    const [selectedProject, setSelectedProject] = useState<string>(initialProjects[0]?.id || '');
    const [selectedDomain, setSelectedDomain] = useState<string>('all');

    const activeStudents = useMemo(() => initialStudents.filter(s => s.is_active), [initialStudents]);

    const filteredParams = useMemo(() => {
        if (selectedDomain === 'all') return initialParameters;
        return initialParameters.filter(p => p.domain_id === selectedDomain);
    }, [selectedDomain, initialParameters]);

    const handleScoreUpdate = (updatedAssessment: Assessment) => {
        setAssessments(prev => {
            const exists = prev.find(a => a.id === updatedAssessment.id);
            if (exists) {
                return prev.map(a => a.id === updatedAssessment.id ? updatedAssessment : a);
            }
            return [...prev, updatedAssessment];
        });
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex gap-4 p-4 admin-card bg-slate-900/50 shrink-0">
                <div className="flex flex-col gap-1.5 min-w-[250px]">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Project</label>
                    <select
                        className="input bg-slate-900"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                    >
                        {initialProjects.filter(p => p.project_type === 'standard').map(p => (
                            <option key={p.id} value={p.id}>{p.sequence_label} - {p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5 min-w-[250px]">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Readiness Domain View</label>
                    <select
                        className="input bg-slate-900"
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                    >
                        <option value="all">All Domains (Full Grid)</option>
                        {initialDomains.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 min-h-[500px] bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                {!selectedProject ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                        Please select a project to view scores
                    </div>
                ) : (
                    <ScoreGrid
                        students={activeStudents}
                        projectId={selectedProject}
                        domains={initialDomains}
                        parameters={filteredParams}
                        assessments={assessments}
                        assessmentType="self"
                        onScoreUpdate={handleScoreUpdate}
                    />
                )}
            </div>
        </div>
    );
}
