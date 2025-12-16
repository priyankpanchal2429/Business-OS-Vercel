import React, { useState, useEffect } from 'react';
import { useDebug } from '../context/DebugContext';
import { getBaseUrl, setBaseUrl, isCustomUrl } from '../config/api';
import {
    Terminal,
    X,
    Trash2,
    RefreshCw,
    Wifi,
    WifiOff,
    AlertCircle,
    CheckCircle2,
    Activity,
    Save,
    Globe
} from 'lucide-react';

const DebugPopup = () => {
    const { isOpen, toggleDebug, logs, clearLogs, addLog } = useDebug();
    const [testing, setTesting] = useState(false);
    const [apiUrl, setApiUrl] = useState('');
    const [isCustom, setIsCustom] = useState(false);

    // Initialize state on load
    useEffect(() => {
        setApiUrl(getBaseUrl());
        setIsCustom(isCustomUrl());
    }, [isOpen]);

    const handleSaveUrl = () => {
        if (!apiUrl) return;

        // Remove /api if the user typed it, to sanitize input for the helper which adds it back if needed
        // Actually the helper handles it. Let's just pass what they typed.
        // But better to be smart. If they paste the ".trycloudflare.com" part, we handle it.

        setBaseUrl(apiUrl);
        addLog('success', 'API URL Updated', `New URL: ${getBaseUrl()}`);
        setIsCustom(true);

        // Force reload to apply changes globally
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const handleResetUrl = () => {
        setBaseUrl(null); // Clear storage
        addLog('info', 'API URL Reset', 'Reverting to environment defaults');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const testConnection = async () => {
        setTesting(true);
        const currentUrl = getBaseUrl();
        addLog('info', 'Testing connection to backend...', currentUrl);

        try {
            const start = Date.now();
            const res = await fetch(`${currentUrl}/health`);
            const end = Date.now();

            if (res.ok) {
                const data = await res.json();
                addLog('success', `Connection Successful (${end - start}ms)`, data);
            } else {
                addLog('error', `Server returned ${res.status}`, res.statusText);
            }
        } catch (err) {
            console.error(err);
            addLog('error', 'Connection Failed', err.message);
        } finally {
            setTesting(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={toggleDebug}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#1a1a1a',
                    color: '#00ff00',
                    border: '1px solid #333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    zIndex: 9999,
                    transition: 'all 0.2s ease'
                }}
                title="Debug Details"
            >
                <Terminal size={24} />
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            maxHeight: '600px',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #333',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden',
            fontFamily: 'monospace'
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                background: '#252525',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} color="#00ff00" />
                    <span style={{ color: '#fff', fontWeight: 600 }}>System Debugger</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={clearLogs}
                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                        title="Clear Logs"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button
                        onClick={toggleDebug}
                        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Config Info */}
            <div style={{
                padding: '12px 16px',
                background: '#222',
                borderBottom: '1px solid #333',
                fontSize: '0.8rem',
                color: '#aaa'
            }}>
                {/* Connection Box */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#fff' }}>
                        <Globe size={14} />
                        <span style={{ fontWeight: 600 }}>Backend Connection</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            placeholder="https://...trycloudflare.com"
                            style={{
                                flex: 1,
                                background: '#333',
                                border: isCustom ? '1px solid #4da6ff' : '1px solid #444',
                                borderRadius: '4px',
                                color: '#fff',
                                padding: '6px 8px',
                                fontSize: '0.75rem',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleSaveUrl}
                            style={{
                                background: '#4da6ff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0 8px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}
                        >
                            Save
                        </button>
                    </div>
                    {isCustom && (
                        <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleResetUrl}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ff8888',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}>
                                Reset to Default
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Status:</span>
                    <button
                        onClick={testConnection}
                        disabled={testing}
                        style={{
                            background: 'none',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            color: testing ? '#888' : '#00ff00',
                            fontSize: '0.75rem',
                            cursor: testing ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 6px'
                        }}
                    >
                        {testing ? <RefreshCw size={10} className="spin" /> : <RefreshCw size={10} />}
                        Test Connection
                    </button>
                </div>
            </div>

            {/* Logs Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px',
                minHeight: '300px',
                maxHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {logs.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#555', padding: '20px' }}>
                        No logs captured yet.
                    </div>
                )}
                {logs.map(log => (
                    <div key={log.id} style={{
                        padding: '8px',
                        background: '#252525',
                        borderRadius: '6px',
                        borderLeft: `3px solid ${log.type === 'error' ? '#ff3333' :
                            log.type === 'success' ? '#00ff00' :
                                '#4da6ff'
                            }`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{
                                color: log.type === 'error' ? '#ff8888' : '#fff',
                                fontWeight: 500,
                                fontSize: '0.8rem'
                            }}>
                                {log.type.toUpperCase()}
                            </span>
                            <span style={{ color: '#666', fontSize: '0.7rem' }}>{log.timestamp}</span>
                        </div>
                        <div style={{ color: '#ddd', fontSize: '0.85rem' }}>
                            {log.message}
                        </div>
                        {log.details && (
                            <pre style={{
                                marginTop: '4px',
                                fontSize: '0.75rem',
                                color: '#888',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all'
                            }}>
                                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                            </pre>
                        )}
                    </div>
                ))}
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default DebugPopup;
