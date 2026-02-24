import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
            <div
                ref={modalRef}
                className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right"
            >
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 text-slate-300">
                    {children}
                </div>
            </div>
        </div>
    );
}
