export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Users, FolderGit2, LayoutTemplate, Settings as SettingsIcon, Trophy } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold mb-1 flex items-center gap-2">
                        Settings
                    </h2>
                    <p className="text-slate-400">Manage application configuration, core entities, and testing environments.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/admin/students" className="admin-card p-6 flex flex-col hover:bg-slate-800/40 transition-colors group cursor-pointer border border-slate-800/60 hover:border-indigo-500/50">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-400 group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-200 mb-2">Student Roster</h3>
                    <p className="text-sm text-slate-500 flex-1">
                        Manage the canonical list of students, their cohorts, programs, and aliases for data parsing.
                    </p>
                </Link>

                <Link href="/admin/projects" className="admin-card p-6 flex flex-col hover:bg-slate-800/40 transition-colors group cursor-pointer border border-slate-800/60 hover:border-emerald-500/50">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                        <FolderGit2 size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-200 mb-2">Projects Dictionary</h3>
                    <p className="text-sm text-slate-500 flex-1">
                        Configure the official programs, terms, cohorts, and project categories.
                    </p>
                </Link>

                <Link href="/admin/playground" className="admin-card p-6 flex flex-col hover:bg-slate-800/40 transition-colors group cursor-pointer border border-slate-800/60 hover:border-cyan-500/50">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
                        <LayoutTemplate size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-200 mb-2">Component Playground</h3>
                    <p className="text-sm text-slate-500 flex-1">
                        Isolated testing environment for data visualizations and new dashboard components.
                    </p>
                </Link>

                <Link href="/admin/program-dashboard" className="admin-card p-6 flex flex-col hover:bg-slate-800/40 transition-colors group cursor-pointer border border-slate-800/60 hover:border-amber-500/50">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 text-amber-400 group-hover:scale-110 transition-transform">
                        <Trophy size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-200 mb-2">Program Dashboard</h3>
                    <p className="text-sm text-slate-500 flex-1">
                        View cohort-wide ranking and calculate relative dynamic engagement scores.
                    </p>
                </Link>
            </div>

            <div className="mt-8 admin-card flex flex-col items-center justify-center py-16 text-slate-500 border-dashed border-2 bg-slate-900/30 border-slate-800">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                    <SettingsIcon size={20} />
                </div>
                <h3 className="text-md font-medium text-slate-300 mb-1">Global Configuration (Coming Soon)</h3>
                <p className="text-sm max-w-md text-center">
                    Additional administration settings will appear here.
                </p>
            </div>
        </div>
    );
}
