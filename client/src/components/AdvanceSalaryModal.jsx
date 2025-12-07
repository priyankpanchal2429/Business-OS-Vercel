import React, { useState, useEffect } from 'react';
import { X, IndianRupee, Save, User, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const AdvanceSalaryModal = ({ isOpen, onClose, employee, onSave, currentPeriod }) => {
    const { addToast } = useToast();
    const [amount, setAmount] = useState('');
    // Initialize date to local YYYY-MM-DD to avoid timezone issues
    const [dateIssued, setDateIssued] = useState(() => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offset).toISOString().split('T')[0];
    });
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // New State for List and Editing
    const [existingAdvances, setExistingAdvances] = useState([]);
    const [loadingAdvances, setLoadingAdvances] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            resetForm();
            // Fetch existing advances for this period
            if (employee && currentPeriod) {
                fetchExistingAdvances();
            }
        }
    }, [isOpen, employee, currentPeriod]);

    const resetForm = () => {
        setErrors({});
        setAmount('');
        setReason('');
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        setDateIssued(new Date(now.getTime() - offset).toISOString().split('T')[0]);
        setEditingId(null);
    };

    const fetchExistingAdvances = async () => {
        if (!employee || !currentPeriod) return;
        setLoadingAdvances(true);
        try {
            console.log('Fetching advances for:', employee.id, currentPeriod);
            const res = await fetch(`/api/advance-salary?employeeId=${employee.id}&start=${currentPeriod.start}&end=${currentPeriod.end}`);
            if (res.ok) {
                const data = await res.json();
                console.log('Fetched advances:', data);
                setExistingAdvances(data);
            } else {
                console.error('Failed response:', res.status);
            }
        } catch (err) {
            console.error("Failed to fetch advances", err);
        } finally {
            setLoadingAdvances(false);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!amount || parseFloat(amount) <= 0) {
            newErrors.amount = 'Valid amount is required';
        }
        if (!dateIssued) {
            newErrors.dateIssued = 'Date is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        if (!employee || !employee.id) {
            addToast('Error: Employee information missing', 'error');
            return;
        }

        setSaving(true);
        try {
            const url = editingId ? `/api/advance-salary/${editingId}` : '/api/advance-salary';
            const method = editingId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: employee.id, // Only really needed for POST but safe to send
                    amount: parseFloat(amount),
                    dateIssued,
                    reason
                })
            });

            const result = await res.json();
            if (result.success) {
                addToast(editingId ? 'Advance Salary updated.' : 'Advance Salary issued.', 'success', 4000);

                resetForm();

                // Refresh list explicitly
                await fetchExistingAdvances();

                // Notify parent
                onSave(result);
            } else {
                addToast(result.error || 'Failed to save. Please try again.', 'error');
            }
        } catch (err) {
            console.error('Failed to save advance:', err);
            addToast('Failed to save. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

    const handleDeleteClick = (id) => {
        setDeleteModal({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        const id = deleteModal.id;
        if (!id) return;

        try {
            const res = await fetch(`/api/advance-salary/${id}`, { method: 'DELETE' });
            if (res.ok) {
                addToast('Advance Salary deleted.', 'success');
                // Remove locally
                setExistingAdvances(prev => prev.filter(item => item.id !== id));
                // Update Parent
                onSave({ success: true }); // Just trigger reload

                // If we were editing this one, reset form
                if (editingId === id) resetForm();
            } else {
                addToast('Failed to delete.', 'error');
            }
        } catch (err) {
            console.error('Failed to delete:', err);
            addToast('Failed to delete.', 'error');
        } finally {
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setAmount(item.amount);
        setDateIssued(item.dateIssued);
        setReason(item.reason || '');
    };

    if (!isOpen) return null;

    const totalAdvance = existingAdvances.reduce((sum, item) => sum + item.amount, 0);

    const getInputStyle = (field) => ({
        padding: '10px 12px',
        border: `1px solid ${errors[field] ? 'var(--color-error)' : 'var(--color-border)'} `,
        borderRadius: 'var(--radius-sm)',
        fontSize: '1rem',
        width: '100%',
        height: '42px',
        outline: 'none',
        boxShadow: errors[field] ? '0 0 0 2px rgba(255, 59, 48, 0.1)' : 'none'
    });

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
                maxWidth: '600px', // Widened slightly for the list
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 40px rgba(0,0,0,0.2)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 50,
                            height: 50,
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
                            {!employee?.image && <User size={20} />}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Advance Salary</h2>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                {employee?.name}
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

                {/* Content - Scrollable */}
                <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Existing Advances Section */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Current Period Advances</h3>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-accent)' }}>
                                Total: ₹{totalAdvance.toLocaleString('en-IN')}
                            </div>
                        </div>

                        <div style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            background: 'var(--color-background-subtle)'
                        }}>
                            {loadingAdvances ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</div>
                            ) : existingAdvances.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No Advance Salary issued for this period.
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                                        <tr>
                                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Date</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Amount</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Reason</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'center', width: 80, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ background: 'white' }}>
                                        {existingAdvances.map((adv) => (
                                            <tr key={adv.id} style={{ borderBottom: '1px solid var(--color-border)', background: editingId === adv.id ? 'var(--color-background-subtle)' : 'white' }}>
                                                <td style={{ padding: '10px 12px' }}>{new Date(adv.dateIssued).toLocaleDateString('en-GB')}</td>
                                                <td style={{ padding: '10px 12px', fontWeight: 500 }}>₹{adv.amount.toLocaleString('en-IN')}</td>
                                                <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>
                                                    {adv.reason || '-'}
                                                </td>
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleEdit(adv)}
                                                            title="Edit"
                                                            style={{
                                                                border: 'none', background: 'none', cursor: 'pointer', padding: '4px',
                                                                color: editingId === adv.id ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                                                            }}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(adv.id)}
                                                            title="Delete"
                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-error)' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--color-border)' }}></div>

                    {/* Form Section */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                                {editingId ? 'Edit Advance Salary' : 'Issue New Advance'}
                            </h3>
                            {editingId && (
                                <button
                                    onClick={resetForm}
                                    style={{
                                        border: '1px solid var(--color-border)',
                                        background: 'white',
                                        padding: '4px 10px',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>
                                    Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        if (errors.amount) setErrors({ ...errors, amount: null });
                                    }}
                                    placeholder="Enter amount..."
                                    min="0"
                                    style={getInputStyle('amount')}
                                />
                                {errors.amount && (
                                    <div style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '4px' }}>
                                        {errors.amount}
                                    </div>
                                )}
                            </div>

                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>
                                    Date Issued *
                                </label>
                                <input
                                    type="date"
                                    value={dateIssued}
                                    onChange={(e) => {
                                        setDateIssued(e.target.value);
                                        if (errors.dateIssued) setErrors({ ...errors, dateIssued: null });
                                    }}
                                    style={getInputStyle('dateIssued')}
                                />
                                {errors.dateIssued && (
                                    <div style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '4px' }}>
                                        {errors.dateIssued}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>
                                Reason
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    if (errors.reason) setErrors({ ...errors, reason: null });
                                }}
                                placeholder="Enter reason for advance..."
                                rows={2}
                                style={{
                                    ...getInputStyle('reason'),
                                    height: 'auto',
                                    minHeight: '80px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px 24px',
                    borderTop: '1px solid var(--color-border)',
                    background: 'var(--color-background-subtle)',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    flexShrink: 0,
                    borderBottomLeftRadius: '16px',
                    borderBottomRightRadius: '16px'
                }}>
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
                        Close
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
                        <IndianRupee size={16} />
                        {saving ? 'Saving...' : editingId ? 'Update Advance' : 'Issue Advance'}
                    </button>
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleConfirmDelete}
                employeeName="this Advance Salary entry"
                isDeleting={false}
            />
        </div>
    );
};

export default AdvanceSalaryModal;
