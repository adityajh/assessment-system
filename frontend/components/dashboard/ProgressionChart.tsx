"use client";

import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Assessment } from '@/lib/supabase/queries/assessments';
import { Project } from '@/lib/supabase/queries/projects';

interface ProgressionProps {
    projects: Project[];
    assessments: Assessment[];
}

export function ProgressionChart({ projects, assessments }: ProgressionProps) {

    const chartData = useMemo(() => {
        // Find unique sequences across all projects, sort them chronologically
        const uniqueSequences = [...new Set(projects.map(p => p.sequence))].sort((a, b) => a - b);

        return uniqueSequences.map(seq => {
            const seqProjects = projects.filter(p => p.sequence === seq);

            // Find which project the student actually has assessment data for in this sequence
            let activeProject = seqProjects[0]; // fallback
            for (const proj of seqProjects) {
                if (assessments.some(a => a.project_id === proj.id && a.normalized_score !== null)) {
                    activeProject = proj;
                    break;
                }
            }

            // Find all mentor assessments for this specific project
            const projectAssessments = assessments.filter(a => a.project_id === activeProject.id && a.assessment_type === 'mentor');
            const scores = projectAssessments.map(a => a.normalized_score).filter((s): s is number => s !== null);

            const avg = scores.length > 0
                ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
                : null;

            return {
                name: activeProject.sequence_label, // e.g. "1", "2a"
                fullName: activeProject.name,
                average: avg,
            };
        }).filter(d => d.average !== null); // Only show projects with scores

    }, [projects, assessments]);

    if (chartData.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                Not enough data points yet.
            </div>
        );
    }

    return (
        <div className="w-full" style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height={340}>
                <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    <YAxis
                        domain={[0, 10]}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0) {
                                return `Project ${label}: ${payload[0].payload.fullName}`;
                            }
                            return label;
                        }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line
                        type="monotone"
                        name="Mentor Average"
                        dataKey="average"
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
