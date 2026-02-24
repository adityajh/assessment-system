"use client";

import { useMemo } from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Legend,
    Tooltip
} from 'recharts';
import { ReadinessDomain, Assessment } from '@/lib/supabase/queries/assessments';

interface RadarProps {
    data: Array<{
        subject: string;
        mentorAvg: number | null;
        selfAvg: number | null;
        fullMark: number;
    }>;
}

export function RadarRechart({ data }: RadarProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                No domain data available.
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 10]}
                        tick={{ fill: '#cbd5e1', fontSize: 10 }}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 500 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Radar
                        name="Mentor Score"
                        dataKey="mentorAvg"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.4}
                    />
                    <Radar
                        name="Self Score"
                        dataKey="selfAvg"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.4}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
