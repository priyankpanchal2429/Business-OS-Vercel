import React, { useState, useEffect } from 'react';
import { X, Save, IndianRupee, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const BonusWithdrawalModal = ({ isOpen, onClose, employee, onSave }) => {
    const { addToast } = useToast();
    const [stats, setStats] = useState(null);
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && employee) {
            fetchStats();
            setAmount('');
            setNotes('');
        }
    }, [isOpen, employee]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bonus/stats');
            if (res.ok) {
                const data = await res.json();
                const empStats = data.employees.find(e => e.employeeId === employee.id);
                setStats(empStats);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            addToast('Please enter a valid amount', 'error');
            return;
        }
        if (parseFloat(amount) > (stats?.balance || 0)) {
            addToast('Amount exceeds available balance', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/bonus/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: employee.id,
                    amount: parseFloat(amount),
                    date: new Date().toISOString().split('T')[0],
                    notes
                })
            });

            if (res.ok) {
                addToast('Bonus withdrawal successful', 'success');
                onSave && onSave();
                onClose();
            } else {
                addToast('Failed to process withdrawal', 'error');
            }
        } catch (err) {
            addToast('Error processing request', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !employee) return null;

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
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Withdraw Bonus</h2>
                        <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{employee.name}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading balance...</div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                        {/* Balance Card */}
                        <div style={{
                            background: 'linear-gradient(135deg, var(--color-accent), #0055ff)',
                            borderRadius: '12px', padding: '20px', color: 'white', marginBottom: '24px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: 4 }}>Available Bonus Balance</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                                ₹{(stats?.balance || 0).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: 4 }}>
                                Total Accrued: ₹{(stats?.totalAccrued || 0).toLocaleString('en-IN')}
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                Withdrawal Amount
                            </label>
                            <div style={{ position: 'relative' }}>
                                <IndianRupee size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={stats?.balance}
                                    step="1"
                                    placeholder="Enter amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 12px 12px 36px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                        fontSize: '1.1rem', fontWeight: 600
                                    }}
                                />
                            </div>
                            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                <button type="button" onClick={() => setAmount(stats?.balance)} style={{ fontSize: '0.8rem', padding: '4px 8px', background: '#f0f0f0', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                                    Max
                                </button>
                                <button type="button" onClick={() => setAmount(Math.floor(stats?.balance / 2))} style={{ fontSize: '0.8rem', padding: '4px 8px', background: '#f0f0f0', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                                    50%
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                Notes / Reason
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Optional notes for this withdrawal..."
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                    fontSize: '0.9rem', minHeight: '80px', resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                    background: 'white', color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 500
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || parseFloat(amount) > (stats?.balance || 0)}
                                style={{
                                    padding: '12px 24px', borderRadius: '8px', border: 'none',
                                    background: 'var(--color-success)', color: 'white',
                                    cursor: (submitting || parseFloat(amount) > (stats?.balance || 0)) ? 'not-allowed' : 'pointer', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: 8
                                }}
                            >
                                {submitting ? 'Processing...' : 'Confirm Withdrawal'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default BonusWithdrawalModal;
