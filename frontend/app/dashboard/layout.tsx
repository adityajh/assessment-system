import '../../styles/dashboard.css';
import { Inter, Roboto_Mono } from 'next/font/google';
import { LayoutDashboard, Users, FileText, ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-roboto-mono' });

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className={`min-h-screen bg-slate-50 flex flex-col dashboard-theme ${inter.variable} ${robotoMono.variable} font-sans`}>
            {/* Top Navigation Bar - Hidden when printing */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden shadow-sm">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/students" className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 text-sm font-medium transition-colors">
                            <ArrowLeft size={16} /> Back to Admin
                        </Link>
                        <div className="h-6 w-px bg-slate-300"></div>
                        <div className="flex items-center gap-2 text-slate-800 font-semibold tracking-tight">
                            <LayoutDashboard className="text-indigo-600" size={20} />
                            Let's Entreprise Dashboard
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Real implementation would have a student selector here for teachers to quickly switch */}
                        <button
                            onClick={() => typeof window !== 'undefined' && window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Printer size={16} /> Print Report
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-[1400px] w-full mx-auto p-8 print:p-0 print:m-0 print:max-w-none">
                {children}
            </main>
        </div>
    );
}
