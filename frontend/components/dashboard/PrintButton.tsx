"use client";

import { Printer } from 'lucide-react';

export function PrintButton() {
    return (
        <button
            onClick={() => typeof window !== 'undefined' && window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
            <Printer size={16} /> Print Report
        </button>
    );
}
