import React from 'react';

interface ScoreDisplayToggleProps {
    displayScore: 'raw' | 'normalized';
    onChange: (mode: 'raw' | 'normalized') => void;
    min: number | null;
    max: number | null;
    hasData: boolean;
}

export function ScoreDisplayToggle({ displayScore, onChange, min, max, hasData }: ScoreDisplayToggleProps) {
    // If there is no data, or if min/max are somehow missing, display just "Raw Scores"
    const showRange = hasData && min !== null && max !== null;
    const rawLabel = showRange ? `Raw Scores (${min}-${max})` : 'Raw Scores';

    return (
        <div className="ml-auto flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 shrink-0">
            <button
                onClick={() => onChange('raw')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${displayScore === 'raw' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
                {rawLabel}
            </button>
            <button
                onClick={() => onChange('normalized')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${displayScore === 'normalized' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
                Normalized (1-10)
            </button>
        </div>
    );
}
