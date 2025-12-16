import React, { useState, useEffect } from 'react';
import { getBaseUrl } from '../config/api';
import { X, Plus, Trash2, Save, User, Edit2 } from 'lucide-react';

const DeductionsModal = ({ isOpen, onClose, employee, periodStart, periodEnd, grossPay, onSave }) => {
    const [deductions, setDeductions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const API_URL = getBaseUrl();

    useEffect(() => {
        if (isOpen && employee) {
            fetchDeductions();
        }
    }, [isOpen, employee, periodStart, periodEnd]);

    const fetchDeductions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/deductions/${employee.id}/${periodStart}/${periodEnd}`);
            const data = await res.json();
            setDeductions(data);
        } catch (err) {
            console.error('Failed to fetch deductions:', err);
            setDeductions([]);
        } finally {
            setLoading(false);
        }
    };

    const addDeduction = () => {
        setDeductions([...deductions, {
            id: `new-${Date.now()}`,
            type: 'custom',
            description: '',
            amount: 0
        }]);
    };

    const updateDeduction = (index, field, value) => {
        const updated = [...deductions];
        updated[index][field] = value;
        setDeductions(updated);
    };

    const deleteDeduction = (index) => {
        const updated = deductions.filter((_, i) => i !== index);
        setDeductions(updated);
    };

    const handleSave = async () => {
        // Validation
        const hasEmpty = deductions.some(d => !d.description || !d.amount || d.amount <= 0);
        if (hasEmpty) {
            alert('Please fill in all deduction details with valid amounts');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/deductions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: employee.id,
                    periodStart,
                    periodEnd,
                    deductions
                })
            });

            const result = await res.json();
            if (result.success) {
                onSave(result);
                onClose();
            }
        } catch (err) {
            console.error('Failed to save deductions:', err);
            alert('Failed to save deductions. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const totalDeductions = deductions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const netPay = Math.round((grossPay || 0) - totalDeductions);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '700px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 40px rgba(0,0,0,0.2)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 60,
                            height: 60,
                            borderRadius: '8px',
                            background: 'var(--color-background-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-secondary)',
                            backgroundImage: employee?.image ? `url(${employee.image})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            overflow: 'hidden'
                        }}>
                            {!employee?.image && <User size={24} />}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{employee?.name} - Deductions</h2>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                Gross Pay: ₹{grossPay?.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px'
                    }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Deductions List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                            Loading deductions...
                        </div>
                    ) : (
                        <>
                            {deductions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                                    No deductions yet. Click "Add Deduction" to start.
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-background-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Type</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Description</th>
                                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600 }}>Amount</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, width: '60px' }}>Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deductions.map((ded, idx) => (
                                            <tr key={ded.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <select
                                                        value={ded.type}
                                                        onChange={(e) => updateDeduction(idx, 'type', e.target.value)}
                                                        style={{
                                                            padding: '6px 10px',
                                                            border: '1px solid var(--color-border)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontSize: '0.9rem',
                                                            width: '100%'
                                                        }}
                                                    >
                                                        <option value="absence">Absence/Leave</option>
                                                        <option value="penalty">Penalty</option>
                                                        <option value="loan">Loan Repayment</option>
                                                        <option value="advance">Advance Salary</option>
                                                        <option value="custom">Custom</option>
                                                    </select>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <input
                                                        type="text"
                                                        value={ded.description}
                                                        onChange={(e) => updateDeduction(idx, 'description', e.target.value)}
                                                        placeholder="Enter description..."
                                                        style={{
                                                            padding: '6px 10px',
                                                            border: '1px solid var(--color-border)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontSize: '0.9rem',
                                                            width: '100%'
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <input
                                                        type="number"
                                                        value={ded.amount}
                                                        onChange={(e) => updateDeduction(idx, 'amount', e.target.value)}
                                                        placeholder="0"
                                                        min="0"
                                                        style={{
                                                            padding: '6px 10px',
                                                            border: '1px solid var(--color-border)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontSize: '0.9rem',
                                                            width: '100%',
                                                            textAlign: 'right'
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => deleteDeduction(idx)}
                                                        title="Delete deduction"
                                                        style={{
                                                            border: 'none',
                                                            background: 'transparent',
                                                            color: 'var(--color-error)',
                                                            cursor: 'pointer',
                                                            padding: '8px'
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* Add Deduction Button */}
                            <button
                                onClick={addDeduction}
                                style={{
                                    marginTop: '16px',
                                    padding: '10px 20px',
                                    border: '1px dashed var(--color-border)',
                                    background: 'white',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--color-text-secondary)',
                                    fontSize: '0.9rem',
                                    fontWeight: 500
                                }}
                            >
                                <Plus size={16} />
                                Add Deduction
                            </button>
                        </>
                    )}
                </div>

                {/* Footer Summary */}
                <div style={{
                    padding: '20px 24px',
                    borderTop: '1px solid var(--color-border)',
                    background: 'var(--color-background-subtle)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Total Deductions</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-error)' }}>
                                ₹{totalDeductions.toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Net Pay</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: netPay < 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                                ₹{netPay.toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>

                    {netPay < 0 && (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(255, 59, 48, 0.1)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--color-error)',
                            fontSize: '0.85rem',
                            marginBottom: '16px'
                        }}>
                            ⚠️ Warning: Deductions exceed gross pay. Net pay is negative.
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={onClose}
                            disabled={saving}
                            style={{
                                padding: '10px 24px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'white',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                fontWeight: 500,
                                opacity: saving ? 0.5 : 1
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                padding: '10px 24px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: 'var(--color-accent)',
                                color: 'white',
                                fontWeight: 600,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: saving ? 0.5 : 1
                            }}
                        >
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeductionsModal;
