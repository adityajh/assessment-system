"use client";

import { useState } from 'react';
import { Student, Program } from '@/lib/supabase/queries/students';
import { Badge } from '@/components/shared/Badge';
import { Edit2, Plus, UserX, UserCheck } from 'lucide-react';
import { StudentForm } from '@/components/admin/StudentForm';

export default function StudentsClientPage({ initialStudents, initialPrograms }: { initialStudents: Student[], initialPrograms: Program[] }) {
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const filteredStudents = students.filter(s =>
        s.canonical_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSave = (updatedStudent: Student) => {
        setStudents(prev => {
            const exists = prev.find(p => p.id === updatedStudent.id);
            if (exists) {
                return prev.map(p => p.id === updatedStudent.id ? updatedStudent : p);
            }
            return [...prev, updatedStudent].sort((a, b) => a.student_number - b.student_number);
        });
        setEditingStudent(null);
        setIsFormOpen(false);
    };

    return (
        <>
            <div className="flex gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search by name or alias..."
                    className="input max-w-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                    className="btn btn-primary ml-auto"
                    onClick={() => { setEditingStudent(null); setIsFormOpen(true); }}
                >
                    <Plus size={18} /> New Student
                </button>
            </div>

            <div className="admin-card p-0 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/50">
                            <th className="px-6 py-4 text-sm font-semibold text-slate-300">#</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-300">Canonical Name</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-300">Cohort & Program</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-300">Status</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-300 w-1/4">Known Aliases</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {filteredStudents.map(student => {
                            const progName = initialPrograms.find(p => p.id === student.program_id)?.name || 'No Program';
                            return (
                                <tr key={student.id} className="hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4 text-sm font-mono text-slate-400">
                                        {student.student_number}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-200">{student.canonical_name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold text-indigo-400">{student.cohort || 'No Cohort'}</span>
                                            <span className="text-xs text-slate-500">{progName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={student.is_active ? 'success' : 'danger'}>
                                            {student.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {student.aliases.map((alias, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">
                                                    {alias}
                                                </span>
                                            ))}
                                            {student.aliases.length === 0 && <span className="text-slate-500 text-xs italic">None</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => { setEditingStudent(student); setIsFormOpen(true); }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded transition-colors"
                                            title="Edit Student"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredStudents.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    No students found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <StudentForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                student={editingStudent}
                programs={initialPrograms}
                onSave={handleSave}
            />
        </>
    );
}
