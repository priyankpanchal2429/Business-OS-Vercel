import React, { useState } from 'react';
import { Activity, Database, Server, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const SystemDiagnostics = () => {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const runDiagnostics = async () => {
        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/diagnostics`);
            const data = await response.json();
            setResults(data);
            addToast('Diagnostics completed', 'success');
        } catch (error) {
            console.error('Diagnostics failed:', error);
            addToast('Failed to run diagnostics', 'error');
            setResults({
                status: 'critical',
                message: 'Could not reach server',
                checks: { server: false }
            });
        } finally {
            setLoading(false);
        }
    };

    const StatusCard = ({ title, status, icon: Icon, details }) => {
        const isOk = status === true || status === 'ok';
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
                <div className={`p-3 rounded-lg ${isOk ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <Icon size={24} />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-900">{title}</h3>
                        {isOk ? <CheckCircle className="text-green-500" size={20} /> : <XCircle className="text-red-500" size={20} />}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{isOk ? 'Operational' : 'Issue Detected'}</p>
                    {details && (
                        <div className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(details, null, 2)}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Diagnostics</h1>
                    <p className="text-gray-500">Analyze application health and connectivity</p>
                </div>
                <button
                    onClick={runDiagnostics}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Analyzing...' : 'Run System Check'}
                </button>
            </header>

            {!results && (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Activity className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900">Ready to Analyze</h3>
                    <p className="text-gray-500">Click the button above to start diagnostics</p>
                </div>
            )}

            {results && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatusCard
                        title="Backend Server"
                        status={results.checks?.server}
                        icon={Server}
                        details={results.serverInfo}
                    />
                    <StatusCard
                        title="Database (Supabase)"
                        status={results.checks?.database}
                        icon={Database}
                        details={results.dbInfo}
                    />

                    {results.checks?.dataHealth && (
                        <div className={`md:col-span-2 p-6 rounded-xl border shadow-sm flex items-start gap-4 ${results.checks.dataHealth.status === 'warning'
                                ? 'bg-amber-50 border-amber-200 text-amber-900'
                                : 'bg-blue-50 border-blue-200 text-blue-900'
                            }`}>
                            <div className={`p-3 rounded-lg ${results.checks.dataHealth.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                <Activity size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold mb-1">Data Integrity Check</h3>
                                <p className="text-sm opacity-90">{results.checks.dataHealth.message}</p>
                                <div className="mt-2 flex gap-4 text-xs font-mono uppercase tracking-wider opacity-70">
                                    <span>Employees: {results.checks.dataHealth.activeEmployees}</span>
                                    <span>Payroll Records: {results.checks.dataHealth.payrollEntries}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4">Table Access Status</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {['employees', 'inventory', 'vendors', 'timesheet_entries', 'payroll_entries'].map(table => (
                                <div key={table} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="font-medium text-gray-700 capitalize">{table.replace('_', ' ')}</span>
                                    {results.checks?.tables?.[table] ? (
                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">ACCESSIBLE</span>
                                    ) : (
                                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">ERROR</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-900 border-b-2 border-red-500 pb-1">Recent System Failures</h3>
                            <span className="text-xs text-gray-500">Last 20 events</span>
                        </div>

                        {results.recentErrors && results.recentErrors.length > 0 ? (
                            <div className="space-y-3">
                                {results.recentErrors.map((err, idx) => (
                                    <div key={idx} className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-red-700 uppercase">{err.context || 'Unknown Context'}</span>
                                            <span className="text-[10px] text-gray-500">{new Date(err.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-red-900 font-medium mb-1">{err.message}</p>
                                        {err.details && (
                                            <p className="text-xs text-red-700 font-mono opacity-80">{err.details}</p>
                                        )}
                                        {err.code && (
                                            <span className="text-[10px] bg-red-200 text-red-800 px-1 rounded font-mono">Code: {err.code}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-green-50 rounded-lg border border-dashed border-green-200">
                                <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                                <p className="text-green-700 font-medium">No recent errors detected!</p>
                                <p className="text-green-600 text-xs text-opacity-80">System operations are flowing smoothly.</p>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2 text-center pt-4">
                        <p className="text-sm text-gray-500">
                            If issues persist, please screenshot this page and share it with support.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemDiagnostics;
