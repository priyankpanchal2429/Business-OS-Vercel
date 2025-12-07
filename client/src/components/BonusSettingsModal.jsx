import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const BonusSettingsModal = ({ isOpen, onClose, onSave }) => {
    const { addToast } = useToast();
    const [settings, setSettings] = useState({
        startDate: '',
        endDate: '',
        amountPerDay: 35
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings/bonus');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/settings/bonus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                addToast('Bonus settings updated', 'success');
                onSave && onSave();
                onClose();
            } else {
                addToast('Failed to save settings', 'error');
            }
        } catch (err) {
            addToast('Error saving settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '450px',
                maxWidth: '95%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column',
                animation: 'slideUp 0.3s ease-out'
            }}>
                <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Bonus Year Settings</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                            Bonus Period
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: '#666' }}>Start Date</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                    <input
                                        type="date"
                                        required
                                        value={settings.startDate}
                                        onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
                                        style={{
                                            width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: '#666' }}>End Date</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                    <input
                                        type="date"
                                        required
                                        value={settings.endDate}
                                        min={settings.startDate}
                                        onChange={(e) => setSettings({ ...settings, endDate: e.target.value })}
                                        style={{
                                            width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                            Bonus Rate (Per Working Day)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <DollarSign size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                            <input
                                type="number"
                                required
                                min="0"
                                step="1"
                                value={settings.amountPerDay}
                                onChange={(e) => setSettings({ ...settings, amountPerDay: e.target.value })}
                                style={{
                                    width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                background: 'white', color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 500
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '10px 20px', borderRadius: '8px', border: 'none',
                                background: 'var(--color-accent)', color: 'white', cursor: loading ? 'wait' : 'pointer', fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: 8
                            }}
                        >
                            {loading ? 'Saving...' : <><Save size={18} /> Save Settings</>}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default BonusSettingsModal;
