"use client";

import { useState, useMemo } from 'react';
import { Assessment, ReadinessDomain, ReadinessParameter, AssessmentLog } from '@/lib/supabase/queries/assessments';
import { Student } from '@/lib/supabase/queries/students';
import { Project } from '@/lib/supabase/queries/projects';
import { ScoreGrid } from '@/components/admin/ScoreGrid';

interface SelfAssessmentsProps {
    initialStudents: Student[];
    initialProjects: Project[];
    initialDomains: ReadinessDomain[];
    initialParameters: ReadinessParameter[];
    initialAssessments: Assessment[];
    initialLogs: AssessmentLog[];
}

export default function SelfAssessmentsClientPage({
    initialStudents,
    initialProjects,
    initialDomains,
    initialParameters,
    initialAssessments,
    initialLogs
}: SelfAssessmentsProps) {
    const [assessments, setAssessments] = useState(initialAssessments);
    const [selectedProject, setSelectedProject] = useState<string>(initialProjects[0]?.id || '');
    const [displayScore, setDisplayScore] = useState<'raw' | 'normalized'>('normalized');

    const activeStudents = useMemo(() => initialStudents.filter(s => s.is_active), [initialStudents]);

    const availableLogs = useMemo(() => {
        return initialLogs.filter(log => log.project_id === selectedProject);
    }, [initialLogs, selectedProject]);

    const [selectedLog, setSelectedLog] = useState<string>('all');

    const displayAssessments = useMemo(() => {
        if (selectedLog === 'all') return assessments;
        return assessments.filter(a => a.assessment_log_id === selectedLog);
    }, [assessments, selectedLog]);

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
            <div className="flex gap-4 p-4 admin-card bg-slate-900/50 shrink-0 flex-wrap items-end">
                <div className="flex flex-col gap-1.5 min-w-[250px]">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Project</label>
                    <select
                        className="input bg-slate-900"
                        value={selectedProject}
                        onChange={(e) => {
                            setSelectedProject(e.target.value);
                            setSelectedLog('all');
                        }}
                    >
                        {initialProjects.filter(p => p.project_type === 'standard').map(p => (
                            <option key={p.id} value={p.id}>{p.sequence_label} - {p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5 min-w-[250px]">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Assessment Event</label>
                    <select
                        className="input bg-slate-900"
                        value={selectedLog}
                        onChange={(e) => setSelectedLog(e.target.value)}
                        disabled={availableLogs.length === 0}
                    >
                        <option value="all">All Events for Project</option>
                        {availableLogs.map(log => (
                            <option key={log.id} value={log.id}>
                                {log.assessment_date} • {log.file_name || 'Import'} ({log.records_inserted} records)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="ml-auto flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
                    <button
                        onClick={() => setDisplayScore('raw')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${displayScore === 'raw' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Raw Scores
                    </button>
                    <button
                        onClick={() => setDisplayScore('normalized')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${displayScore === 'normalized' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Normalized (1-10)
                    </button>
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
                        parameters={initialParameters}
                        assessments={displayAssessments}
                        assessmentType="self"
                        displayScore={displayScore}
                        onScoreUpdate={handleScoreUpdate}
                    />
                )}
            </div>
        </div>
    );
}
