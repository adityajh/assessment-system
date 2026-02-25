export const metadata = {
    title: 'Component Playground - Admin Panel',
};

import PlaygroundClientPage from './PlaygroundClientPage';

export default function PlaygroundPage() {
    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] h-full">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Component Playground</h2>
                    <p className="text-slate-400">Isolated testing environment for data visualizations and UI components.</p>
                </div>
            </div>

            <PlaygroundClientPage />
        </div>
    );
}
