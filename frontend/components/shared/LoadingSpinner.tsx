import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 24, className = '' }: { size?: number, className?: string }) {
    return (
        <div className={`flex items-center justify-center p-4 ${className}`}>
            <Loader2 size={size} className="animate-spin text-indigo-500" />
        </div>
    );
}
