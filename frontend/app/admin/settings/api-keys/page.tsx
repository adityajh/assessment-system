'use client';

import { useState, useEffect } from 'react';
import { Key, Trash2, Plus, AlertCircle, Copy, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ApiKey {
    id: string;
    name: string;
    created_at: string;
    last_used_at: string | null;
    created_by: string;
}

export default function ApiKeysPage() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [newKeyName, setNewKeyName] = useState('');
    const [createdToken, setCreatedToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchKeys();
    }, []);

    async function fetchKeys() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/api-keys');
            const { data } = await res.json();
            if (data) setApiKeys(data);
        } catch (error) {
            console.error('Failed to fetch keys', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateKey(e: React.FormEvent) {
        e.preventDefault();
        if (!newKeyName) return;

        try {
            const res = await fetch('/api/admin/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName })
            });
            const { data, token, error } = await res.json();
            if (error) throw new Error(error);

            setCreatedToken(token);
            setNewKeyName('');
            fetchKeys();
        } catch (error) {
            console.error('Failed to create key', error);
            alert('Failed to create key');
        }
    }

    async function handleDeleteKey(id: string) {
        if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;

        try {
            const res = await fetch('/api/admin/api-keys', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const { error } = await res.json();
            if (error) throw new Error(error);

            fetchKeys();
        } catch (error) {
            console.error('Failed to delete key', error);
            alert('Failed to revoke key');
        }
    }

    const copyToClipboard = () => {
        if (createdToken) {
            navigator.clipboard.writeText(createdToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 text-slate-200">
            <div>
                <Link href="/admin/settings" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 mb-4 transition-colors">
                    <ArrowLeft size={16} />
                    Back to Settings
                </Link>
                <h1 className="text-2xl font-bold text-white">API Keys</h1>
                <p className="text-slate-400 mt-1">Manage API integrations for external systems.</p>
            </div>

            <section className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-2 mb-4">
                        <Key className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-semibold text-white">Create New Key</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-6">
                        Keys provide full read access to the external API endpoints. Store them securely as they are only shown once.
                    </p>

                    <form onSubmit={handleCreateKey} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Key Name (e.g., Canvas LMS Integration)"
                            className="flex-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-500"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            maxLength={50}
                            required
                        />
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Key
                        </button>
                    </form>

                    {createdToken && (
                        <div className="mt-4 p-4 bg-emerald-950 border border-emerald-800 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-medium text-emerald-400">Key Created Successfully</h3>
                                    <p className="text-sm text-emerald-200 mt-1">
                                        Please copy this key and store it safely. You will not be able to see it again.
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <code className="px-3 py-2 bg-slate-950 border border-emerald-900 rounded text-sm text-emerald-300 font-mono flex-1 break-all">
                                            {createdToken}
                                        </code>
                                        <button
                                            onClick={copyToClipboard}
                                            className="p-2 bg-slate-900 border border-emerald-900 rounded hover:bg-emerald-900/50 text-emerald-400 transition-colors"
                                            title="Copy to clipboard"
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => setCreatedToken(null)}
                                        className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 font-medium underline"
                                    >
                                        I have saved the key securely
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Created At</th>
                                <th className="px-6 py-3 font-medium">Last Used At</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        Loading keys...
                                    </td>
                                </tr>
                            ) : apiKeys.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        No API keys generated yet.
                                    </td>
                                </tr>
                            ) : (
                                apiKeys.map((key) => (
                                    <tr key={key.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-200">{key.name}</td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {new Date(key.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteKey(key.id)}
                                                className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-950/50 transition-colors"
                                                title="Revoke key"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
