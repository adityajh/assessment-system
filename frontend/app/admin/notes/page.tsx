export const dynamic = 'force-dynamic';

export default function MentorNotesPage() {
    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold mb-1 flex items-center gap-2">
                        Mentor Notes
                    </h2>
                    <p className="text-slate-400">View and manage qualitative feedback and notes from mentors.</p>
                </div>
            </div>

            <div className="admin-card flex flex-col items-center justify-center py-20 text-slate-500 border-dashed border-2 bg-slate-900/30">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-1">Coming Soon</h3>
                <p className="text-sm max-w-md text-center">
                    The mentor notes data viewer is currently under development and will be available in an upcoming release.
                </p>
            </div>
        </div>
    );
}
