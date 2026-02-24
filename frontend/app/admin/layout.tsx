"use client";

import '../../styles/admin.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, FolderGit2, FileText, UploadCloud, MessageSquare, Briefcase, Settings, LayoutDashboard } from 'lucide-react';
import { useEffect } from 'react';

const navItems = [
    { href: '/admin/students', icon: Users, label: 'Students' },
    { href: '/admin/projects', icon: FolderGit2, label: 'Projects' },
    { href: '/admin/term-tracking', icon: Briefcase, label: 'Term Tracking' },
    { href: '/admin/assessments/mentor', icon: FileText, label: 'Mentor Scores' },
    { href: '/admin/assessments/self', icon: FileText, label: 'Self Scores' },
    { href: '/admin/peer-feedback', icon: MessageSquare, label: 'Peer Feedback' },
    { href: '/admin/notes', icon: FileText, label: 'Mentor Notes' },
    { href: '/admin/import', icon: UploadCloud, label: 'Import Excel' },
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard Viewer' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        document.body.className = 'admin-theme';
        return () => { document.body.className = ''; };
    }, []);

    return (
        <div className="admin-layout flex min-h-screen bg-slate-950">
            <aside className="admin-sidebar border-r border-slate-800 bg-slate-900 p-4 w-64 flex flex-col gap-4 fixed inset-y-0 left-0 z-10 shrink-0">
                <div className="text-xl font-bold text-white mb-2 tracking-tight px-4 flex items-center h-12">
                    <span>Let's Entreprise</span>
                </div>
                <nav className="flex flex-col gap-1 overflow-y-auto w-full">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href) && item.href !== '/dashboard';
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full ${isActive
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <Icon size={18} className="shrink-0" />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className="admin-main flex-1 ml-64 flex flex-col min-h-screen">
                <header className="admin-header h-16 border-b border-slate-800 bg-slate-900 flex items-center px-8 shrink-0">
                    <h1 className="text-lg font-semibold capitalize">
                        {pathname.split('/').pop()?.replace('-', ' ') || 'Admin Panel'}
                    </h1>
                </header>
                <div className="admin-content p-8 flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
