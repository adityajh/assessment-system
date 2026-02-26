"use client";

import '../../styles/admin.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Users,
    FolderGit2,
    BarChart3,
    BookOpen,
    PieChart,
    CalendarClock,
    Settings,
    MessageSquareQuote,
    LogOut,
    ChevronRight,
    Search,
    FileText,
    UploadCloud,
    MessageSquare,
    Briefcase,
    LayoutDashboard,
    StickyNote,
    BarChart2,
    LayoutTemplate
} from 'lucide-react';
import { useEffect } from 'react';

const navSections = [
    {
        label: 'Students & Projects',
        items: [
            { href: '/admin/students', icon: Users, label: 'Students' },
            { href: '/admin/projects', icon: FolderGit2, label: 'Projects' },
        ]
    },
    {
        label: 'Assessments',
        items: [
            { href: '/admin/assessments/mentor', icon: BarChart2, label: 'Mentor Scores' },
            { href: '/admin/assessments/self', icon: FileText, label: 'Self Scores' },
            { href: '/admin/peer-feedback', icon: MessageSquareQuote, label: 'Peer Feedback' },
            { href: '/admin/notes', icon: StickyNote, label: 'Mentor Notes' },
            { href: '/admin/metrics', icon: Briefcase, label: 'Metrics' }
        ]
    },
    {
        label: 'Tools',
        items: [
            { label: 'Data Import', href: '/admin/import', icon: UploadCloud, badge: 'Beta' },
            { label: 'Assessment Logs', href: '/admin/assessment-logs', icon: FileText },
            { label: 'Rubrics', href: '/admin/rubrics', icon: BookOpen },
            { label: 'Playground', href: '/admin/playground', icon: LayoutTemplate },
            { label: 'Settings', href: '/admin/settings', icon: Settings },
        ]
    }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        document.body.className = 'admin-theme';
        return () => { document.body.className = ''; };
    }, []);

    return (
        <div className="admin-layout flex min-h-screen bg-slate-950">
            {/* ── Sidebar ── */}
            <aside className="fixed inset-y-0 left-0 z-10 flex flex-col w-64 bg-[#11131a] border-r border-slate-800/60 shrink-0">

                {/* Logo / Brand */}
                <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800/60 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                        <BarChart2 size={16} className="text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white leading-tight">Let's Entreprise</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Admin Panel</div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6">
                    {navSections.map((section) => (
                        <div key={section.label}>
                            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                                {section.label}
                            </p>
                            <div className="flex flex-col gap-3">
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = item.href === '/dashboard'
                                        ? pathname.startsWith('/dashboard')
                                        : pathname.startsWith(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={
                                                "flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 border shadow-sm " +
                                                (isActive
                                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-indigo-900/50 "
                                                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600 ")
                                            }
                                        >

                                            <Icon
                                                size={18}
                                                className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`}
                                            />
                                            <span className="truncate flex-1">{item.label}</span>
                                            {(item as any).badge && (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase shrink-0 ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                                    {(item as any).badge}
                                                </span>
                                            )}
                                            {isActive && !((item as any).badge) && (
                                                <ChevronRight size={18} className="shrink-0 text-white/70" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-800/60 shrink-0">
                    <p className="text-[10px] text-slate-600 text-center">Year 1 Assessment System</p>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="admin-main flex-1 ml-64 flex flex-col min-h-screen">
                <header className="admin-header h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center px-8 shrink-0 gap-3">
                    <div className="flex-1">
                        <h1 className="text-base font-semibold text-white">
                            {pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Admin'}
                        </h1>
                        <p className="text-xs text-slate-500">{pathname}</p>
                    </div>
                </header>
                <div className="admin-content p-8 flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
