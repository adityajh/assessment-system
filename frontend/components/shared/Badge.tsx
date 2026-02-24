export function Badge({
    children,
    variant = 'default'
}: {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
    const variants = {
        default: 'bg-slate-800 text-slate-300',
        success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
        info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>
            {children}
        </span>
    );
}
