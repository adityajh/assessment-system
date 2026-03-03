"use client";

import { useState, useMemo, useEffect } from 'react';
import { Assessment, ReadinessDomain, ReadinessParameter, AssessmentLog, getAssessmentsByLog } from '@/lib/supabase/queries/assessments';
import { Student } from '@/lib/supabase/queries/students';
import { Project } from '@/lib/supabase/queries/projects';
import { ScoreGrid } from '@/components/admin/ScoreGrid';
import { ScoreDisplayToggle } from '@/components/admin/ScoreDisplayToggle';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface MentorAssessmentsProps {
    initialStudents: Student[];
    initialProjects: Project[];
    initialDomains: ReadinessDomain[];
    initialParameters: ReadinessParameter[];
    initialAssessments: Assessment[];
    initialLogs: AssessmentLog[];
}

export default function MentorAssessmentsClientPage({
    initialStudents,
    initialProjects,
    initialDomains,
    initialParameters,
    initialAssessments,
    initialLogs
}: MentorAssessmentsProps) {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>(initialProjects[0]?.id || '');
    const [displayScore, setDisplayScore] = useState<'raw' | 'normalized'>('normalized');
    const [isLoading, setIsLoading] = useState(true);

    const activeStudents = useMemo(() => initialStudents.filter(s => s.is_active), [initialStudents]);

    // Filter logs that belong to the selected project
    const availableLogs = useMemo(() => {
        return initialLogs.filter(log => log.project_id === selectedProject);
    }, [initialLogs, selectedProject]);

    const [selectedLog, setSelectedLog] = useState<string>(
        initialLogs.filter(log => log.project_id === (initialProjects[0]?.id || ''))[0]?.id || ''
    );

    useEffect(() => {
        const fetchAssessments = async () => {
            if (!selectedLog) {
                setAssessments([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const supabase = createClient();
                const data = await getAssessmentsByLog(supabase, selectedLog, 'mentor');
                setAssessments(data);
            } catch (error) {
                console.error('Error fetching assessments:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssessments();
    }, [selectedLog]);

    const displayAssessments = useMemo(() => {
        return assessments; // Already filtered by log in the fetch
    }, [assessments]);

    const scaleInfo = useMemo(() => {
        if (displayAssessments.length === 0) return { min: null, max: null };

        let min = Infinity;
        let max = -Infinity;
        let found = false;

        for (const a of displayAssessments) {
            let rowMin = a.raw_scale_min;
            let rowMax = a.raw_scale_max;

            // Fallback to log if not on row (legacy imports)
            if (rowMax == null && a.assessment_log_id) {
                const log = availableLogs.find(l => l.id === a.assessment_log_id);
                if (log?.mapping_config?.raw_scale_max) {
                    rowMax = Number(log.mapping_config.raw_scale_max);
                    rowMin = log.mapping_config.raw_scale_min !== undefined ? Number(log.mapping_config.raw_scale_min) : 1;
                }
            }

            if (rowMin !== null && rowMin !== undefined) {
                min = Math.min(min, rowMin);
                found = true;
            }
            if (rowMax !== null && rowMax !== undefined) {
                max = Math.max(max, rowMax);
                found = true;
            }
        }

        if (!found) return { min: null, max: null };
        return {
            min: min !== Infinity ? min : 1,
            max: max !== -Infinity ? max : 10,
        };
    }, [displayAssessments, availableLogs]);

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
                            // Auto-select first log for the new project
                            const firstLog = initialLogs.filter(l => l.project_id === e.target.value)[0];
                            setSelectedLog(firstLog?.id || '');
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
                        {availableLogs.length === 0
                            ? <option value="">No events available</option>
                            : availableLogs.map(log => (
                                <option key={log.id} value={log.id}>
                                    {log.assessment_date} • {log.file_name || 'Import'} ({log.records_inserted} records)
                                </option>
                            ))
                        }
                    </select>
                </div>

                <ScoreDisplayToggle
                    displayScore={displayScore}
                    onChange={setDisplayScore}
                    min={scaleInfo.min}
                    max={scaleInfo.max}
                    hasData={displayAssessments.length > 0}
                />
            </div>

            <div className="flex-1 min-h-[500px] bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col relative">
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
                        <LoadingSpinner size={48} />
                    </div>
                )}
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
                        assessmentType="mentor"
                        displayScore={displayScore}
                        onScoreUpdate={handleScoreUpdate}
                    />
                )}
            </div>
        </div>
    );
}
