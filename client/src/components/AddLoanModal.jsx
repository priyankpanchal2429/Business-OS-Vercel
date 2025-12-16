import React, { useState, useEffect } from 'react';
import { getBaseUrl } from '../config/api';
import { X, Save, AlertTriangle, Banknote, Calendar, IndianRupee, Edit3, Check } from 'lucide-react';

const AddLoanModal = ({ isOpen, onClose, employee, onSave }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const API_URL = getBaseUrl();
    const [loading, setLoading] = useState(false);
    const [existingLoan, setExistingLoan] = useState(null);
    const [checkingLoan, setCheckingLoan] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editAmount, setEditAmount] = useState('');
    const [editDate, setEditDate] = useState('');

    // Check for existing loan when modal opens
    useEffect(() => {
        if (isOpen && employee?.id) {
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setLoading(false);
            setIsEditing(false);
            checkExistingLoan();
        } else {
            setExistingLoan(null);
            setIsEditing(false);
        }
    }, [isOpen, employee?.id]);

    const checkExistingLoan = async () => {
        setCheckingLoan(true);
        try {
            const res = await fetch(`${API_URL}/loans?employeeId=${employee.id}`);
            if (res.ok) {
                const loans = await res.json();
                const activeLoan = loans.find(l => l.status === 'active');
                setExistingLoan(activeLoan || null);
                if (activeLoan) {
                    setEditAmount(activeLoan.amount.toString());
                    setEditDate(activeLoan.date);
                }
            }
        } catch (err) {
            console.error('Error checking existing loan:', err);
        } finally {
            setCheckingLoan(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid loan amount');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/loans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: employee.id,
                    amount: parseFloat(amount),
                    date
                })
            });
            const data = await res.json();

            if (res.ok) {
                setAmount('');
                setDate(new Date().toISOString().split('T')[0]);
                onSave();
                onClose();
            } else {
                console.error('Server error:', data);
                alert(data.error || 'Failed to add loan');
            }
        } catch (err) {
            console.error('Network error:', err);
            alert('Error connecting to server: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!editAmount || parseFloat(editAmount) <= 0) {
            alert('Please enter a valid loan amount');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/loans/${existingLoan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(editAmount),
                    date: editDate
                })
            });
            const data = await res.json();

            if (res.ok) {
                setIsEditing(false);
                onSave();
                onClose();
            } else {
                console.error('Server error:', data);
                alert(data.error || 'Failed to update loan');
            }
        } catch (err) {
            console.error('Network error:', err);
            alert('Error connecting to server: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
            <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                width: '440px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                animation: 'slideUp 0.3s ease'
            }}>
                <style>{`
                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}</style>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '10px',
                            background: isEditing ? 'linear-gradient(135deg, #007aff, #0055cc)' : 'linear-gradient(135deg, #ff9500, #ff6b00)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {isEditing ? <Edit3 size={18} color="white" /> : <Banknote size={18} color="white" />}
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                            {isEditing ? 'Edit Loan' : existingLoan ? 'Active Loan' : 'Add Loan'}
                        </h3>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666' }}><X size={20} /></button>
                </div>

                {/* Employee Info */}
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #e0e0e0' }}>
                        {employee?.image ? <img src={employee.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.2rem' }}>👤</span>}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{employee?.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{employee?.role}</div>
                    </div>
                </div>

                {/* Loading State */}
                {checkingLoan && (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: 'var(--color-text-secondary)'
                    }}>
                        Checking existing loans...
                    </div>
                )}

                {/* Existing Loan - View/Edit Mode */}
                {!checkingLoan && existingLoan && !isEditing && (
                    <div style={{
                        background: 'linear-gradient(135deg, #fff5f5, #fff0f0)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid #ffcdd2',
                        marginBottom: '16px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                            <div style={{
                                background: '#ff9500',
                                borderRadius: '50%',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Banknote size={20} color="white" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, color: '#e65100', fontSize: '1rem', marginBottom: '8px' }}>
                                    Active Loan
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.5, marginBottom: '16px' }}>
                                    This employee currently has an active loan. You can edit the loan details below.
                                </div>

                                {/* Loan Details Card */}
                                <div style={{
                                    background: 'white',
                                    borderRadius: '10px',
                                    padding: '14px',
                                    border: '1px solid #e0e0e0'
                                }}>
                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#999', marginBottom: '10px', letterSpacing: '0.5px' }}>
                                        Current Loan Details
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <IndianRupee size={16} color="#ff6b00" />
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#999' }}>Amount</div>
                                                <div style={{ fontWeight: 600, color: '#333' }}>₹{formatCurrency(existingLoan.amount)}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Calendar size={16} color="#007aff" />
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#999' }}>Issued On</div>
                                                <div style={{ fontWeight: 600, color: '#333' }}>{formatDate(existingLoan.date)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'linear-gradient(135deg, #007aff, #0055cc)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 122, 255, 0.4)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 122, 255, 0.3)';
                                }}
                            >
                                <Edit3 size={16} /> Edit Loan
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#f5f5f5',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    color: '#333',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#eeeeee'}
                                onMouseOut={e => e.currentTarget.style.background = '#f5f5f5'}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit Loan Form */}
                {!checkingLoan && existingLoan && isEditing && (
                    <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{
                            padding: '12px',
                            background: 'rgba(0, 122, 255, 0.08)',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#007aff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px'
                        }}>
                            <Edit3 size={16} />
                            <span>Editing existing loan details</span>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: '#444' }}>
                                Loan Amount (₹) <span style={{ color: '#ff3b30' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#999',
                                    fontSize: '1rem'
                                }}>₹</span>
                                <input
                                    type="number"
                                    required
                                    value={editAmount}
                                    onChange={e => setEditAmount(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 32px',
                                        borderRadius: '8px',
                                        border: '1px solid #007aff',
                                        fontSize: '1rem',
                                        boxShadow: '0 0 0 3px rgba(0, 122, 255, 0.1)'
                                    }}
                                    placeholder="e.g. 50000"
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: '#444' }}>
                                Date Issued <span style={{ color: '#ff3b30' }}>*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={editDate}
                                onChange={e => setEditDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #34c759, #28a745)',
                                    color: 'white',
                                    padding: '14px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    opacity: loading ? 0.7 : 1,
                                    boxShadow: '0 4px 12px rgba(52, 199, 89, 0.3)'
                                }}
                                onMouseOver={e => {
                                    if (!loading) {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(52, 199, 89, 0.4)';
                                    }
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 199, 89, 0.3)';
                                }}
                            >
                                <Check size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditAmount(existingLoan.amount.toString());
                                    setEditDate(existingLoan.date);
                                }}
                                style={{
                                    padding: '14px 20px',
                                    background: '#f5f5f5',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '10px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    color: '#666'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* New Loan Form (only shown if no existing loan) */}
                {!checkingLoan && !existingLoan && (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: '#444' }}>
                                Loan Amount (₹) <span style={{ color: '#ff3b30' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#999',
                                    fontSize: '1rem'
                                }}>₹</span>
                                <input
                                    type="number"
                                    required
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 32px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '1rem',
                                        transition: 'border-color 0.2s, box-shadow 0.2s'
                                    }}
                                    placeholder="e.g. 50000"
                                    onFocus={e => {
                                        e.target.style.borderColor = '#007aff';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(0, 122, 255, 0.1)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.borderColor = '#ddd';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: '#444' }}>
                                Date Issued <span style={{ color: '#ff3b30' }}>*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.2s, box-shadow 0.2s'
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = '#007aff';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 122, 255, 0.1)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = '#ddd';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: 'linear-gradient(135deg, #ff9500, #ff6b00)',
                                color: 'white',
                                padding: '14px',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                marginTop: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                opacity: loading ? 0.7 : 1,
                                boxShadow: '0 4px 12px rgba(255, 149, 0, 0.3)'
                            }}
                            onMouseOver={e => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 149, 0, 0.4)';
                                }
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 149, 0, 0.3)';
                            }}
                        >
                            <Save size={18} /> {loading ? 'Creating...' : 'Issue Loan'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddLoanModal;
