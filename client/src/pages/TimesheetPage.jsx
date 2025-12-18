import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBaseUrl } from '../config/api';
import { ArrowLeft, Save, Plus, Zap, RotateCcw, Trash2, Briefcase, Plane, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

const TimesheetPage = () => {
    const { employeeId, start: periodStart, end: periodEnd } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const API_URL = getBaseUrl();

    const [employee, setEmployee] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, details: null });

    // Check if period is marked as Paid (could be passed in state, or fetched)
    // For now, we assume it's editable unless we fetch payroll status.
    // Simplifying to assume editable for this rebuild.
    const isPaid = false;

    const firstErrorRef = useRef(null);

    useEffect(() => {
        fetchEmployeeAndTimesheet();
    }, [employeeId, periodStart, periodEnd]);

    const fetchEmployeeAndTimesheet = async () => {
        setLoading(true);
        try {
            // Fetch Employee Details
            const empRes = await fetch(`${API_URL}/employees/${employeeId}`);
            if (!empRes.ok) throw new Error('Employee not found');
            const empData = await empRes.json();
            setEmployee(empData);

            // Fetch Timesheet
            await fetchTimesheet(empData);
        } catch (err) {
            console.error('Initial fetch failed:', err);
            addToast('Failed to load employee or timesheet data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchTimesheet = async (empData) => {
        try {
            if (!empData?.id || !periodStart || !periodEnd) return;

            const res = await fetch(`${API_URL}/timesheet/${empData.id}/${periodStart}/${periodEnd}`);

            // Handle 404/500 from fetch
            const data = res.ok ? await res.json() : [];

            if (!Array.isArray(data)) {
                // Fallback
                setEntries(generatePeriodDates(periodStart, periodEnd, empData));
                return;
            }

            const normalizedEntries = data
                .filter(e => e && (e.status === 'active' || e.status === 'edited'))
                .map(e => ({
                    ...e,
                    clockIn: e.clockIn || e.shiftStart || '',
                    clockOut: e.clockOut || e.shiftEnd || '',
                    breakMinutes: e.breakMinutes || 0
                }));

            if (normalizedEntries.length === 0) {
                setEntries(generatePeriodDates(periodStart, periodEnd, empData));
            } else {
                setEntries(normalizedEntries);
            }
        } catch (err) {
            console.error('Failed to fetch timesheet:', err);
            setEntries(generatePeriodDates(periodStart, periodEnd, empData));
        }
    };

    const generatePeriodDates = (startDate, endDate, emp) => {
        if (!startDate || !endDate) return [];
        const entries = [];
        try {
            const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
            const start = new Date(startYear, startMonth - 1, startDay);
            const end = new Date(endYear, endMonth - 1, endDay);

            let currentDate = new Date(start);
            let counter = 0;

            while (currentDate <= end && counter < 60) {
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                entries.push({
                    id: `ts-preload-${counter}`,
                    employeeId: emp?.id || employeeId,
                    date: dateStr,
                    clockIn: '',
                    clockOut: '',
                    breakMinutes: 0,
                    dayType: 'Work',
                    notes: '',
                    status: 'new'
                });
                currentDate.setDate(currentDate.getDate() + 1);
                counter++;
            }
        } catch (e) { console.error(e); }
        return entries;
    };

    const handleFieldChange = (index, field, value) => {
        const updated = [...entries];
        updated[index][field] = value;
        setEntries(updated);

        if (validateEntries().isValid) {
            setValidationErrors({});
        } else if (validationErrors[`${index}-${field}`]) {
            const newErrors = { ...validationErrors };
            delete newErrors[`${index}-${field}`];
            setValidationErrors(newErrors);
        }
    };

    const addNewDay = () => {
        const newEntry = {
            id: `ts-new-${Date.now()}`,
            employeeId: employee?.id || employeeId,
            date: '',
            clockIn: '',
            clockOut: '',
            breakMinutes: 0,
            dayType: 'Work',
            notes: '',
            status: 'new'
        };
        setEntries([...entries, newEntry]);
    };

    const deleteDay = (index) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const autofillShift = (index) => {
        if (!employee?.shiftStart || !employee?.shiftEnd) {
            alert('Employee has no default shift times set');
            return;
        }
        const updated = [...entries];
        updated[index].clockIn = employee.shiftStart;
        updated[index].clockOut = employee.shiftEnd;
        updated[index].breakMinutes = employee.breakTime || 60;
        setEntries(updated);
    };

    const resetTime = (index) => {
        const updated = [...entries];
        updated[index].clockIn = '';
        updated[index].clockOut = '';
        updated[index].breakMinutes = 0;
        setEntries(updated);
    };

    // Helper functions
    const validateEntries = () => {
        const errors = {};
        entries.forEach((entry, index) => {
            if (!entry.date) errors[`${index}-date`] = 'Date is required';
        });
        return { errors, isValid: Object.keys(errors).length === 0 };
    };

    const handleSaveClick = () => {
        const { errors, isValid } = validateEntries();
        if (!isValid) {
            setValidationErrors(errors);
            addToast('Please fix validation errors.', 'error');
            return;
        }
        // Count working days
        const workingDays = entries.filter(e => e.dayType === 'Work' && (e.clockIn || e.clockOut)).length;
        setConfirmModal({
            isOpen: true,
            details: (
                <div>
                    <p>Saving timesheet for <strong>{employee?.name}</strong>.</p>
                    <p>Found <strong>{workingDays}</strong> working days.</p>
                </div>
            )
        });
    };

    const confirmSave = async () => {
        setConfirmModal({ isOpen: false, details: null });
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/timesheet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: employeeId,
                    periodStart,
                    periodEnd,
                    entries: entries.map(e => ({
                        ...e, shiftStart: e.clockIn, shiftEnd: e.clockOut
                    })),
                    isPostPaymentAdjustment: isPaid
                })
            });
            const result = await res.json();
            if (result.success) {
                addToast('Timesheet saved successfully.', 'success');
                // Don't auto-close, stay on page but show success
            } else {
                addToast('Failed to save timesheet.', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Connection error while saving.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const getInputStyle = (index, field, baseStyle) => {
        const hasError = validationErrors[`${index}-${field}`];
        return {
            ...baseStyle,
            borderColor: hasError ? 'var(--color-error)' : 'var(--color-border)',
            boxShadow: hasError ? '0 0 0 2px rgba(255, 59, 48, 0.2)' : 'none'
        };
    };

    return (
        <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/payroll')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}
                    >
                        <ArrowLeft size={24} color="var(--color-text-primary)" />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
                            {loading ? 'Loading...' : `${employee?.name || 'Employee'} - Timesheet`}
                        </h1>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
                            {periodStart} to {periodEnd}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSaveClick}
                    disabled={saving || loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px',
                        background: 'var(--color-accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: (saving || loading) ? 'not-allowed' : 'pointer',
                        opacity: (saving || loading) ? 0.7 : 1
                    }}
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Timesheet'}
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading data...</div>
            ) : (
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-background-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, width: '160px' }}>Date</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, width: '130px' }}>Type</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, width: '120px' }}>Clock In</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, width: '120px' }}>Clock Out</th>
                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, width: '90px' }}>Break</th>
                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, idx) => {
                                if (!entry) return null;
                                const dateObj = new Date(entry.date);
                                const isSunday = dateObj.getDay() === 0;

                                return (
                                    <tr key={entry.id || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '12px' }}>
                                            <input
                                                type="date"
                                                value={entry.date}
                                                onChange={e => handleFieldChange(idx, 'date', e.target.value)}
                                                style={getInputStyle(idx, 'date', {
                                                    padding: '8px', border: '1px solid var(--color-border)', borderRadius: '6px', width: '140px'
                                                })}
                                            />
                                            <div style={{ fontSize: '0.8rem', marginTop: '4px', color: isSunday ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
                                                {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <select
                                                value={entry.dayType || 'Work'}
                                                onChange={e => handleFieldChange(idx, 'dayType', e.target.value)}
                                                style={{ padding: '8px', border: '1px solid var(--color-border)', borderRadius: '6px', width: '100%' }}
                                            >
                                                <option value="Work">Work</option>
                                                <option value="Travel">Travel</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <input
                                                type="time"
                                                value={entry.clockIn || ''}
                                                onChange={e => handleFieldChange(idx, 'clockIn', e.target.value)}
                                                style={{ padding: '8px', border: '1px solid var(--color-border)', borderRadius: '6px', width: '100%' }}
                                            />
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <input
                                                type="time"
                                                value={entry.clockOut || ''}
                                                onChange={e => handleFieldChange(idx, 'clockOut', e.target.value)}
                                                style={{ padding: '8px', border: '1px solid var(--color-border)', borderRadius: '6px', width: '100%' }}
                                            />
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <input
                                                type="number"
                                                value={entry.breakMinutes}
                                                onChange={e => handleFieldChange(idx, 'breakMinutes', e.target.value)}
                                                style={{ padding: '8px', border: '1px solid var(--color-border)', borderRadius: '6px', width: '60px', textAlign: 'center' }}
                                            />
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                <button onClick={() => autofillShift(idx)} title="Autofill" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)' }}><Zap size={18} /></button>
                                                <button onClick={() => resetTime(idx)} title="Reset" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><RotateCcw size={18} /></button>
                                                <button onClick={() => deleteDay(idx)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)' }}>
                        <button onClick={addNewDay} style={{ background: 'white', border: '1px dashed var(--color-border)', padding: '10px', width: '100%', borderRadius: '8px', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Plus size={16} /> Add Extra Day
                        </button>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, details: null })}
                onConfirm={confirmSave}
                title="Save Timesheet?"
                message="Are you sure you want to save these changes?"
                details={confirmModal.details}
                confirmText="Yes, Save"
            />
        </div>
    );
};

export default TimesheetPage;
