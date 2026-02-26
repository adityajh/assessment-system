"use client";

import { useMemo, useState } from 'react';
import { MentorNote, BasicProject } from '@/lib/supabase/queries/notes';
import { Student } from '@/lib/supabase/queries/students';

interface MentorNotesProps {
    initialNotes: MentorNote[];
    initialStudents: Student[];
    initialProjects: BasicProject[];
}

export default function MentorNotesClientPage({
    initialNotes,
    initialStudents,
    initialProjects
}: MentorNotesProps) {
    const activeStudents = useMemo(() => initialStudents.filter(s => s.is_active), [initialStudents]);

    // Filters
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [selectedMentor, setSelectedMentor] = useState<string>('');
    const [selectedProject, setSelectedProject] = useState<string>('');

    // Extract unique mentors for the dropdown
    const uniqueMentors = useMemo(() => {
        const mentors = new Set<string>();
        initialNotes.forEach(n => {
            if (n.created_by) {
                // Split by comma in case of concatenated mentors
                n.created_by.split(',').forEach(m => mentors.add(m.trim()));
            }
        });
        return Array.from(mentors).sort();
    }, [initialNotes]);

    // Apply filters
    const filteredNotes = useMemo(() => {
        return initialNotes.filter(note => {
            if (selectedStudent && note.student_id !== selectedStudent) return false;
            
            if (selectedMentor) {
                if (!note.created_by) return false;
                const noteMentors = note.created_by.split(',').map(m => m.trim().toLowerCase());
                if (!noteMentors.includes(selectedMentor.toLowerCase())) return false;
            }
            
            if (selectedProject && note.project_id !== selectedProject) return false;
            
            return true;
        });
    }, [initialNotes, selectedStudent, selectedMentor, selectedProject]);

    const getStudentName = (id: string) => {
        return activeStudents.find(s => s.id === id)?.canonical_name || 'Unknown Student';
    };

    const getProjectName = (id: string | null) => {
        if (!id) return 'General (No Project)';
        return initialProjects.find(p => p.id === id)?.name || 'Unknown Project';
    };

    return (
        <div className="flex flex-col gap-6 h-full">

            {/* Filter Bar */}
            <div className="flex gap-6 mt-2">
                <div className="flex flex-col gap-2 w-1/3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Filter by Student</label>
                    <select
                        className="input bg-slate-900 border-slate-700 text-slate-300 font-medium"
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                    >
                        <option value="">-- All Students --</option>
                        {activeStudents.map(s => (
                            <option key={s.id} value={s.id}>{s.canonical_name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-2 w-1/3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Filter by Mentor</label>
                    <select
                        className="input bg-slate-900 border-slate-700 text-slate-300 font-medium"
                        value={selectedMentor}
                        onChange={(e) => setSelectedMentor(e.target.value)}
                    >
                        <option value="">-- All Mentors --</option>
                        {uniqueMentors.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-2 w-1/3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Filter by Project</label>
                    <select
                        className="input bg-slate-900 border-slate-700 text-slate-300 font-medium"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                    >
                        <option value="">-- All Projects --</option>
                        {initialProjects.map(p => (
                            <option key={p.id} value={p.id}>{p.sequence_label} - {p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 gap-4 overflow-y-auto pb-8">
                {filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 border border-slate-800 border-dashed rounded-xl">
                        <p className="text-slate-500 font-medium">No mentor notes found matching the selected filters.</p>
                    </div>
                ) : (
                    filteredNotes.map((note) => (
                        <div key={note.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-slate-100">{getStudentName(note.student_id)}</h4>
                                    <p className="text-sm font-medium text-slate-400">{getProjectName(note.project_id)}</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 bg-slate-800 text-indigo-400 rounded-full text-xs font-bold border border-slate-700">
                                        {note.created_by || 'Unknown'}
                                    </span>
                                    <p className="text-xs font-mono text-slate-500 mt-2">
                                        {new Date(note.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-800">
                                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {note.note_text}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
