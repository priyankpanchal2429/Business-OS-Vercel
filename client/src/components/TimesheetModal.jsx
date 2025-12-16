import React, { useState, useEffect, useRef } from 'react';
import { getBaseUrl } from '../config/api';
import { X, Plus, Save, User, Zap, RotateCcw, AlertCircle, Trash2, Briefcase, Plane } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from './ConfirmationModal';

const TimesheetModal = ({ isOpen, onClose, employee, periodStart, periodEnd, isPaid, prefilledDate, onSave }) => {
    const { addToast } = useToast();
    const API_URL = getBaseUrl();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState({}); // Track field-level errors
    const firstErrorRef = useRef(null);

    // Clear validation errors and entries when modal opens/closes
    useEffect(() => {
        if (isOpen && employee) {
            setValidationErrors({});
            fetchTimesheet();
        } else {
            setEntries([]);
            setValidationErrors({});
        }
    }, [isOpen, employee, periodStart, periodEnd]);

    // Auto-add entry with prefilled date when specified
    useEffect(() => {
        if (isOpen && prefilledDate && entries.length === 0) {
            const newEntry = {
                id: `ts-new-${Date.now()}`,
                employeeId: employee.id,
                date: prefilledDate,
                clockIn: '',
                clockOut: '',
                breakMinutes: 0,
                status: 'new'
            };
            setEntries([newEntry]);
        }
    }, [isOpen, prefilledDate]);

    const fetchTimesheet = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/timesheet/${employee.id}/${periodStart}/${periodEnd}`);
            const data = await res.json();
            // Normalize data: map shiftStart/shiftEnd to clockIn/clockOut
            const normalizedEntries = data
                .filter(e => e.status === 'active' || e.status === 'edited')
                .map(e => ({
                    ...e,
                    clockIn: e.clockIn || e.shiftStart || '',
                    clockOut: e.clockOut || e.shiftEnd || '',
                    breakMinutes: e.breakMinutes || 0
                }));

            // If no existing entries, pre-populate all dates in the period
            if (normalizedEntries.length === 0) {
                const preloadedEntries = generatePeriodDates(periodStart, periodEnd);
                setEntries(preloadedEntries);
            } else {
                setEntries(normalizedEntries);
            }
        } catch (err) {
            console.error('Failed to fetch timesheet:', err);
            // Even on error, pre-populate dates so users can still work
            const preloadedEntries = generatePeriodDates(periodStart, periodEnd);
            setEntries(preloadedEntries);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Generate entries for all dates in the payroll period
    const generatePeriodDates = (startDate, endDate) => {
        const entries = [];

        // Parse dates properly to avoid timezone issues
        // startDate and endDate are in YYYY-MM-DD format
        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

        const start = new Date(startYear, startMonth - 1, startDay);
        const end = new Date(endYear, endMonth - 1, endDay);

        let currentDate = new Date(start);
        let counter = 0;

        while (currentDate <= end) {
            // Format as YYYY-MM-DD
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            entries.push({
                id: `ts-preload-${counter}`,
                employeeId: employee.id,
                date: dateStr,
                clockIn: '',
                clockOut: '',
                breakMinutes: 0,
                dayType: 'Work', // Default to Work
                notes: '',
                status: 'new'
            });

            currentDate.setDate(currentDate.getDate() + 1);
            counter++;
        }

        return entries;
    };

    const handleFieldChange = (index, field, value) => {
        const updated = [...entries];
        updated[index][field] = value;
        setEntries(updated);

        // Clear validation error for this field when user starts typing
        if (validationErrors[`${index}-${field}`]) {
            const newErrors = { ...validationErrors };
            delete newErrors[`${index}-${field}`];
            setValidationErrors(newErrors);
        }
    };

    const addNewDay = () => {
        const newEntry = {
            id: `ts-new-${Date.now()}`,
            employeeId: employee.id,
            date: '',
            clockIn: '',
            clockOut: '',
            breakMinutes: 0,
            dayType: 'Work', // Default to Work
            notes: '',
            status: 'new'
        };
        setEntries([...entries, newEntry]);
    };

    const deleteDay = (index) => {
        const updated = entries.filter((_, i) => i !== index);
        setEntries(updated);
        // Clear any validation errors for removed entry
        const newErrors = { ...validationErrors };
        Object.keys(newErrors).forEach(key => {
            if (key.startsWith(`${index}-`)) {
                delete newErrors[key];
            }
        });
        setValidationErrors(newErrors);
    };

    const autofillShift = (index) => {
        if (!employee.shiftStart || !employee.shiftEnd) {
            alert('Employee has no default shift times set');
            return;
        }

        const updated = [...entries];
        updated[index].clockIn = employee.shiftStart;
        updated[index].clockOut = employee.shiftEnd;
        updated[index].breakMinutes = employee.breakTime || 60;
        setEntries(updated);

        // Clear validation errors for this row
        const newErrors = { ...validationErrors };
        delete newErrors[`${index}-clockIn`];
        delete newErrors[`${index}-clockOut`];
        setValidationErrors(newErrors);
    };

    const resetTime = (index) => {
        const updated = [...entries];
        updated[index].clockIn = '';
        updated[index].clockOut = '';
        updated[index].breakMinutes = 0;
        setEntries(updated);
    };

    // Helper: Format date to DD-MMM-YYYY
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = d.getDate().toString().padStart(2, '0');
        const month = d.toLocaleString('en-US', { month: 'short' });
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Helper: Check if a date is Sunday
    const isSunday = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr + 'T00:00:00');
        return date.getDay() === 0;
    };

    // Helper: Calculate Daily Earnings
    const calculateDailyEarnings = (entry) => {
        if (!entry.clockIn || !entry.clockOut) return 0;

        const start = new Date(`1970-01-01T${entry.clockIn}`);
        const end = new Date(`1970-01-01T${entry.clockOut}`);
        let diffMs = end - start;
        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;

        let totalMinutes = diffMs / (1000 * 60);
        let billableMinutes = totalMinutes - (parseInt(entry.breakMinutes) || 0);
        if (billableMinutes < 0) billableMinutes = 0;

        const billableHours = billableMinutes / 60;

        // Rate Logic
        if (employee.perShiftAmount) {
            // Calculate standard shift duration for proration
            let standardHours = 8; // Default fallback
            if (employee.shiftStart && employee.shiftEnd) {
                const s = new Date(`1970-01-01T${employee.shiftStart}`);
                const e = new Date(`1970-01-01T${employee.shiftEnd}`);
                let d = (e - s) / (1000 * 60 * 60);
                if (d < 0) d += 24;
                standardHours = d - ((employee.breakTime || 60) / 60);
            }
            if (standardHours <= 0) standardHours = 8;

            return (parseFloat(employee.perShiftAmount) / standardHours) * billableHours;
        } else if (employee.hourlyRate) {
            return parseFloat(employee.hourlyRate) * billableHours;
        } else if (employee.salary) {
            // Derived hourly rate from monthly salary
            const rate = parseFloat(employee.salary) / 30 / 8;
            return rate * billableHours;
        }

        return 0;
    };

    const validateEntries = () => {
        const errors = {};
        let firstErrorKey = null;

        entries.forEach((entry, index) => {
            // Skip validation for Sunday entries (closed days)
            if (isSunday(entry.date)) {
                return;
            }

            // Validate date (required for all entries)
            const date = (entry.date || '').trim();
            if (!date) {
                errors[`${index}-date`] = 'Date is required';
                if (!firstErrorKey) firstErrorKey = `${index}-date`;
            }

            // Relaxed validation: Allow empty Clock In/Out to support resetting/clearing time
            // Previous strict checks removed.
        });
        return { errors, firstErrorKey, isValid: Object.keys(errors).length === 0 };
    };

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, details: null });

    const handleSaveClick = () => {
        // Validation
        const { errors, firstErrorKey, isValid } = validateEntries();

        if (!isValid) {
            setValidationErrors(errors);
            setTimeout(() => {
                if (firstErrorRef.current) {
                    firstErrorRef.current.focus();
                    firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            addToast('Please fix errors (highlighted in red) before saving.', 'error');
            return;
        }

        // Calculate Summary for Confirmation
        const workingDays = entries.filter(e => e.dayType === 'Work' && (e.clockIn || e.clockOut)).length;
        const travelDays = entries.filter(e => e.dayType === 'Travel').length;
        const totalMinutes = entries.reduce((sum, e) => {
            // Quick estimation of hours for display
            if (!e.clockIn || !e.clockOut) return sum;
            // We don't have the full calculateShiftHours logic here easily without duplicating, 
            // but we can just count days or trust the backend calc.
            // Let's just show Day Counts which are accurate.
            return sum;
        }, 0);

        setConfirmModal({
            isOpen: true,
            details: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Working Days:</span> <strong>{workingDays}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Travel Days:</span> <strong>{travelDays}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Period:</span> <span style={{ fontSize: '0.85em' }}>{formatDate(periodStart)} - {formatDate(periodEnd)}</span>
                    </div>
                </div>
            )
        });
    };

    const confirmSave = async () => {
        setConfirmModal({ isOpen: false, details: null });
        // Clear any previous errors
        setValidationErrors({});
        setSaving(true);
        // Proceed with Save
        try {
            const res = await fetch(`${API_URL}/timesheet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: employee.id,
                    periodStart,
                    periodEnd,
                    entries: entries.map(e => ({
                        ...e,
                        // Send both formats for backend compatibility
                        shiftStart: e.clockIn,
                        shiftEnd: e.clockOut
                    })),
                    isPostPaymentAdjustment: isPaid
                })
            });

            const result = await res.json();

            if (result.success) {
                // Dispatch event to refresh attendance card
                window.dispatchEvent(new CustomEvent('timesheetUpdated'));

                onSave(result);
                onClose();
            } else if (result.errors) {
                const serverErrors = {};
                result.errors.forEach((err, index) => {
                    if (err.field) {
                        serverErrors[`${index}-${err.field}`] = err.message;
                    }
                });
                setValidationErrors(serverErrors);
                addToast('Server reported validation errors.', 'error');
            } else {
                addToast('Failed to save timesheet. Server returned an error.', 'error');
            }
        } catch (err) {
            console.error('Failed to save timesheet:', err);
            addToast('Failed to save timesheet. connection error.', 'error');
            alert('Failed to save timesheet. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Helper to get error border style
    const getInputStyle = (index, field, baseStyle) => {
        const hasError = validationErrors[`${index}-${field}`];
        return {
            ...baseStyle,
            borderColor: hasError ? 'var(--color-error)' : 'var(--color-border)',
            boxShadow: hasError ? '0 0 0 2px rgba(255, 59, 48, 0.2)' : 'none'
        };
    };

    // Helper: Get Initials
    const getInitials = (name) => {
        if (!name) return '';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

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
                maxWidth: '960px', // Widened slightly to accommodate new column
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
                            {!employee?.image && (
                                <span style={{ fontWeight: 600, fontSize: '1.2rem' }}>
                                    {getInitials(employee?.name)}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{employee?.name} - Manual Timesheet</h2>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                Period: {formatDate(periodStart)} to {formatDate(periodEnd)}
                                {isPaid && <span style={{
                                    marginLeft: 8,
                                    padding: '2px 8px',
                                    background: 'rgba(52, 199, 89, 0.1)',
                                    color: 'var(--color-success)',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                }}>PAID</span>}
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

                {/* Timesheet Table */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                            Loading timesheet...
                        </div>
                    ) : (
                        <>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-background-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', width: '60px' }}>Day</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', width: '150px' }}>Date</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', width: '130px' }}>Type</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', width: '110px' }}>Clock In</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', width: '110px' }}>Clock Out</th>
                                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', width: '90px' }}>Break</th>
                                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', width: '120px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                                Loading dates for this payroll period...
                                            </td>
                                        </tr>
                                    ) : (
                                        entries.map((entry, idx) => (
                                            <tr key={entry.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                                                    <div style={{
                                                        fontSize: '0.9rem',
                                                        fontWeight: 500,
                                                        color: (() => {
                                                            if (!entry.date) return 'var(--color-text-secondary)';
                                                            const date = new Date(entry.date + 'T00:00:00');
                                                            const day = date.getDay();
                                                            return day === 0 ? 'var(--color-error)' : 'var(--color-text-primary)';
                                                        })()
                                                    }}>
                                                        {(() => {
                                                            if (!entry.date) return '-';
                                                            const date = new Date(entry.date + 'T00:00:00');
                                                            return date.toLocaleDateString('en-US', { weekday: 'short' });
                                                        })()}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <input
                                                        ref={validationErrors[`${idx}-date`] ? firstErrorRef : null}
                                                        type="date"
                                                        value={entry.date}
                                                        onChange={(e) => handleFieldChange(idx, 'date', e.target.value)}
                                                        disabled={entry.status !== 'new' || entry.id?.startsWith('ts-preload-')}
                                                        style={getInputStyle(idx, 'date', {
                                                            padding: '6px 10px',
                                                            border: '1px solid',
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontSize: '0.9rem',
                                                            width: '165px',
                                                            marginBottom: entry.date ? '4px' : '0',
                                                            background: entry.id?.startsWith('ts-preload-') ? 'var(--color-background-subtle)' : 'white',
                                                            cursor: entry.id?.startsWith('ts-preload-') ? 'not-allowed' : 'text'
                                                        })}
                                                    />
                                                    {validationErrors[`${idx}-date`] && (
                                                        <div style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '2px' }}>
                                                            {validationErrors[`${idx}-date`]}
                                                        </div>
                                                    )}
                                                </td>
                                                {/* Day Type Column */}
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <select
                                                            value={entry.dayType || 'Work'}
                                                            onChange={(e) => handleFieldChange(idx, 'dayType', e.target.value)}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid var(--color-border)',
                                                                borderRadius: 'var(--radius-sm)',
                                                                fontSize: '0.9rem',
                                                                width: '110px',
                                                                cursor: 'pointer',
                                                                background: entry.dayType === 'Travel' ? 'rgba(0, 122, 255, 0.05)' : 'white'
                                                            }}
                                                        >
                                                            <option value="Work">Work</option>
                                                            <option value="Travel">Travel</option>
                                                        </select>
                                                        {entry.dayType === 'Travel' ? (
                                                            <Plane size={16} color="var(--color-accent)" title="Travel Day" />
                                                        ) : (
                                                            <Briefcase size={16} color="var(--color-text-secondary)" title="Work Day" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <input
                                                        ref={validationErrors[`${idx}-clockIn`] && !validationErrors[`${idx}-date`] ? firstErrorRef : null}
                                                        type="time"
                                                        value={entry.clockIn || ''}
                                                        onChange={(e) => handleFieldChange(idx, 'clockIn', e.target.value)}
                                                        style={getInputStyle(idx, 'clockIn', {
                                                            padding: '6px 10px',
                                                            border: '1px solid',
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontSize: '0.9rem',
                                                            width: '100%'
                                                        })}
                                                    />
                                                    {validationErrors[`${idx}-clockIn`] && (
                                                        <div style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '2px' }}>
                                                            {validationErrors[`${idx}-clockIn`]}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <input
                                                        ref={validationErrors[`${idx}-clockOut`] && !validationErrors[`${idx}-date`] && !validationErrors[`${idx}-clockIn`] ? firstErrorRef : null}
                                                        type="time"
                                                        value={entry.clockOut || ''}
                                                        onChange={(e) => handleFieldChange(idx, 'clockOut', e.target.value)}
                                                        style={getInputStyle(idx, 'clockOut', {
                                                            padding: '6px 10px',
                                                            border: '1px solid',
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontSize: '0.9rem',
                                                            width: '100%'
                                                        })}
                                                    />
                                                    {validationErrors[`${idx}-clockOut`] && (
                                                        <div style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '2px' }}>
                                                            {validationErrors[`${idx}-clockOut`]}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        value={entry.breakMinutes}
                                                        onChange={(e) => handleFieldChange(idx, 'breakMinutes', e.target.value)}
                                                        min="0"
                                                        style={{
                                                            padding: '6px 10px',
                                                            border: '1px solid var(--color-border)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontSize: '0.9rem',
                                                            width: '80px',
                                                            textAlign: 'center'
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                        {/* Autofill Shift Time */}
                                                        <button
                                                            onClick={() => autofillShift(idx)}
                                                            title="Autofill Shift Time"
                                                            style={{
                                                                border: 'none',
                                                                background: 'transparent',
                                                                color: 'var(--color-accent)',
                                                                cursor: 'pointer',
                                                                padding: '8px',
                                                                borderRadius: 'var(--radius-sm)',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)'}
                                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <Zap size={16} />
                                                        </button>

                                                        {/* Reset Time */}
                                                        <button
                                                            onClick={() => resetTime(idx)}
                                                            title="Reset Time"
                                                            style={{
                                                                border: 'none',
                                                                background: 'transparent',
                                                                color: 'var(--color-text-secondary)',
                                                                cursor: 'pointer',
                                                                padding: '8px',
                                                                borderRadius: 'var(--radius-sm)',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
                                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>

                                                        {/* Delete Day */}
                                                        <button
                                                            onClick={() => deleteDay(idx)}
                                                            title="Delete Day"
                                                            style={{
                                                                border: 'none',
                                                                background: 'transparent',
                                                                color: 'var(--color-error)',
                                                                cursor: 'pointer',
                                                                padding: '8px',
                                                                borderRadius: 'var(--radius-sm)',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)'}
                                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Add Extra Day Button */}
                            <button
                                onClick={addNewDay}
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
                                Add Extra Day
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px 24px',
                    borderTop: '1px solid var(--color-border)',
                    background: 'var(--color-background-subtle)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '12px'
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
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveClick}
                        disabled={saving || entries.length === 0}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: entries.length === 0 ? 'rgba(0, 122, 255, 0.3)' : 'var(--color-accent)',
                            color: 'white',
                            fontWeight: 600,
                            cursor: saving || entries.length === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: saving ? 0.5 : 1
                        }}
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Timesheet'}
                    </button>
                </div>

            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, details: null })}
                onConfirm={confirmSave}
                title="Save Timesheet?"
                message={`Are you sure you want to save timesheet for ${employee.name}?`}
                details={confirmModal.details}
                confirmText="Yes, Save Timesheet"
                cancelText="Review"
            />
        </div >
    );
};

export default TimesheetModal;
