"use client";

import '../../styles/dashboard.css';
import { Inter, Roboto_Mono } from 'next/font/google';
import { LayoutDashboard, Users, FileText, ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { PrintButton } from '@/components/dashboard/PrintButton';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-roboto-mono' });

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const pathname = usePathname();
    const isIndex = pathname === '/dashboard';
    const backHref = isIndex ? '/' : '/dashboard';

    return (
        <div className={`min-h-screen bg-slate-50 flex flex-col dashboard-theme ${inter.variable} ${robotoMono.variable} font-sans`}>
            {/* Top Navigation Bar - Hidden when printing */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden shadow-sm">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href={backHref}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-all border border-slate-200"
                        >
                            <ArrowLeft size={16} strokeWidth={2.5} /> Back
                        </Link>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-2 text-slate-800 font-bold tracking-tight">
                            <LayoutDashboard className="text-indigo-600" size={20} />
                            <span className="text-slate-900">
                                {isIndex ? "Let's Entreprise Dashboard" : "Student Analysis Dashboard"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <PrintButton />
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-[1400px] w-full mx-auto p-8 print:p-0 print:m-0 print:max-w-none">
                {children}
            </main>
        </div>
    );
}
