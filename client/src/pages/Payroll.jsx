import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, CheckCircle, Clock, Calendar, CheckSquare, Square, IndianRupee, FileText, ChevronLeft, ChevronRight, Search, User, Settings } from 'lucide-react';
import Card from '../components/Card';
import TimesheetModal from '../components/TimesheetModal';
import DeductionsModal from '../components/DeductionsModal';
import AdvanceSalaryModal from '../components/AdvanceSalaryModal';
import BonusSettingsModal from '../components/BonusSettingsModal';
import { ToastContainer } from '../components/Toast.jsx';

const Payroll = () => {
    const navigate = useNavigate();
    const [periodData, setPeriodData] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All'); // All, Paid, Unpaid
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [timesheetModal, setTimesheetModal] = useState({ isOpen: false, employee: null, item: null });
    const [deductionsModal, setDeductionsModal] = useState({ isOpen: false, employee: null, item: null });
    const [advanceModal, setAdvanceModal] = useState({ isOpen: false, employee: null });
    const [isBonusSettingsOpen, setIsBonusSettingsOpen] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Period Logic (Default: Current Bi-Weekly Cycle)
    // Anchor: Dec 6 2025. Cycle is 14 days.
    const [currentPeriod, setCurrentPeriod] = useState(() => {
        const today = new Date();
        const anchor = new Date('2025-12-06');
        const diffTime = today - anchor;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const currentCycleStartDiff = diffDays >= 0 ? diffDays % 14 : 14 + (diffDays % 14);

        const start = new Date(today);
        start.setDate(today.getDate() - currentCycleStartDiff);
        const end = new Date(start);
        end.setDate(start.getDate() + 13);

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchPeriodData();
    }, [currentPeriod]);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employees');
            const data = await res.json();
            setEmployees(data);
        } catch (err) {
            console.error("Failed to fetch employees", err);
        }
    };

    const fetchPeriodData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/payroll/period?start=${currentPeriod.start}&end=${currentPeriod.end}`);
            const data = await res.json();
            setPeriodData(data);
            setSelectedIds([]); // Reset selection on period change
        } catch (err) {
            console.error("Failed to fetch payroll period", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (items) => {
        try {
            const res = await fetch('/api/payroll/mark-paid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeIds: items.map(i => i.employeeId) })
            });
            const result = await res.json();
            fetchPeriodData();
            setSelectedIds([]);
            addToast(`Marked ${items.length} employee(s) as Paid`, 'success');
        } catch (err) {
            console.error('Failed to mark as paid:', err);
            addToast('Failed to update status', 'error');
        }
    };

    const handleMarkAsUnpaid = async (items) => {
        try {
            const res = await fetch('/api/payroll/mark-unpaid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeIds: items.map(i => i.employeeId),
                    periodStart: currentPeriod.start,
                    periodEnd: currentPeriod.end
                })
            });
            const result = await res.json();
            fetchPeriodData();
            addToast(`Marked ${items.length} employee(s) as Unpaid`, 'success');
        } catch (err) {
            console.error('Failed to mark as unpaid:', err);
            addToast('Failed to update status', 'error');
        }
    };

    const changePeriod = (direction) => {
        const newStart = new Date(currentPeriod.start);
        newStart.setDate(newStart.getDate() + (direction * 14));

        const newEnd = new Date(newStart);
        newEnd.setDate(newStart.getDate() + 13);

        setCurrentPeriod({
            start: newStart.toISOString().split('T')[0],
            end: newEnd.toISOString().split('T')[0]
        });
    };

    // Derived State
    const filteredData = periodData.filter(item => {
        const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
        const matchesSearch = item.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const totalUnpaid = periodData.filter(p => p.status === 'Unpaid').reduce((sum, p) => sum + Number(p.netPay), 0);
    const totalPaid = periodData.filter(p => p.status === 'Paid').reduce((sum, p) => sum + Number(p.netPay), 0);
    const totalAdvance = periodData.reduce((sum, p) => sum + (Number(p.advanceDeductions) || 0), 0);
    const countUnpaid = periodData.filter(p => p.status === 'Unpaid').length;

    const toggleSelection = (id) => {
        // Use employeeId as reliable key since 'id' might be null for virtual entries
        // Actually, let's use employeeId for selection tracking
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkPay = () => {
        const items = periodData.filter(p => selectedIds.includes(p.employeeId));
        handleMarkAsPaid(items);
    };

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const openTimesheet = (item) => {
        const emp = employees.find(e => e.id === item.employeeId);
        setTimesheetModal({ isOpen: true, employee: emp, item });
    };

    const handleTimesheetSave = (result) => {
        // Show enhanced toast
        let message = 'Timesheet saved';
        if (result.attendanceChanged) {
            message += ' — attendance updated';
        }
        if (result.payrollUpdated) {
            message += result.attendanceChanged ? ' & payroll recalculated' : ' — payroll recalculated';

            // Check if adjustment was made on paid period
            if (result.payrollUpdated.isAdjusted) {
                addToast(`${message}. Adjustment: ₹${Math.abs(result.payrollUpdated.adjustmentAmount).toLocaleString('en-IN')} (${result.payrollUpdated.adjustmentAmount > 0 ? '+' : '-'})`, 'success');
            } else {
                addToast(message + '.', 'success');
            }

            // Update the specific row in periodData with new values
            setPeriodData(prevData => prevData.map(item => {
                if (item.employeeId === result.payrollUpdated.employeeId) {
                    return {
                        ...item,
                        grossPay: result.payrollUpdated.grossPay,
                        deductions: result.payrollUpdated.deductions,
                        advanceDeductions: result.payrollUpdated.advanceDeductions,
                        netPay: result.payrollUpdated.netPay,
                        isAdjusted: result.payrollUpdated.isAdjusted
                    };
                }
                return item;
            }));
        } else {
            addToast(message + '.', 'success');
            fetchPeriodData(); // Fallback to full refresh
        }
    };

    const openDeductions = (item) => {
        const emp = employees.find(e => e.id === item.employeeId);
        setDeductionsModal({ isOpen: true, employee: emp, item });
    };

    const handleDeductionsSave = (result) => {
        addToast('Deductions updated successfully.', 'success');
        fetchPeriodData();
    };

    const openAdvanceSalary = (item) => {
        const emp = employees.find(e => e.id === item.employeeId) || {
            id: item.employeeId,
            name: item.employeeName,
            role: item.employeeRole,
            image: null // Fallback
        };
        setAdvanceModal({ isOpen: true, employee: emp });
    };

    const handleAdvanceSave = (result) => {
        if (result.advance) {
            addToast(`Advance salary issued: ₹${result.advance.amount.toLocaleString('en-IN')}`, 'success');
        } else {
            // Deleted
            addToast('Advance salary updated.', 'success');
        }
        fetchPeriodData();
    };

    return (
        <div>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1 style={{ marginBottom: 0 }}>Payroll Management</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>Track and manage bi-weekly payroll cycles.</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                    {/* Current Period Card */}
                    <div style={{
                        padding: '12px 20px',
                        background: 'var(--color-background-subtle)',
                        border: '1px solid var(--color-accent)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <Calendar size={20} color="var(--color-accent)" />
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Current Period
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                {formatDate(currentPeriod.start)} – {formatDate(currentPeriod.end)}
                            </div>

                        </div>

                        {/* Navigation Buttons */}
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <button onClick={() => changePeriod(-1)} style={navButtonStyle}><ChevronLeft size={18} /></button>
                            <button onClick={() => changePeriod(1)} style={navButtonStyle}><ChevronRight size={18} /></button>
                        </div>

                    </div>

                    <button
                        onClick={() => setIsBonusSettingsOpen(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                            background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                            cursor: 'pointer', color: 'var(--color-text-secondary)', fontWeight: 500
                        }}
                    >
                        <Settings size={18} /> Bonus Settings
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)' }}>
                <Card title="Unpaid Obligations">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255, 59, 48, 0.1)', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={24} /></div>
                        <div>
                            <h2 style={{ margin: 0 }}>₹{totalUnpaid.toLocaleString('en-IN')}</h2>
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{countUnpaid} Employees Pending</p>
                        </div>
                    </div>
                </Card>
                <Card title="Paid This Period">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(52, 199, 89, 0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={24} /></div>
                        <div>
                            <h2 style={{ margin: 0 }}>₹{totalPaid.toLocaleString('en-IN')}</h2>
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Successfully Disbursed</p>
                        </div>
                    </div>
                </Card>
                <Card title="Total Advance Salary">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0, 122, 255, 0.1)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IndianRupee size={24} /></div>
                        <div>
                            <h2 style={{ margin: 0 }}>₹{totalAdvance.toLocaleString('en-IN')}</h2>
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Issued this Period</p>
                        </div>
                    </div>
                </Card>
                <Card title="Actions">
                    <button
                        disabled={selectedIds.length === 0}
                        onClick={handleBulkPay}
                        style={{
                            width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: 'none',
                            background: selectedIds.length > 0 ? 'var(--color-accent)' : 'var(--color-border)',
                            color: 'white', fontWeight: 600, cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s'
                        }}>
                        Pay Selected ({selectedIds.length})
                    </button>
                </Card>
            </div>

            {/* Filters & Toolbar */}
            <Card className="table-container" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        {['All', 'Paid', 'Unpaid'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '6px 16px', borderRadius: 20, border: 'none',
                                    background: filterStatus === status ? 'var(--color-text-primary)' : 'var(--color-background-subtle)',
                                    color: filterStatus === status ? 'white' : 'var(--color-text-primary)',
                                    fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500
                                }}>
                                {status}
                            </button>
                        ))}
                    </div>
                    <div style={{ position: 'relative', width: 250 }}>
                        <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                        <input
                            placeholder="Search employee..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                        />
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead style={{ background: 'var(--color-background-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', width: 40 }}>
                                <input type="checkbox"
                                    onChange={(e) => setSelectedIds(e.target.checked ? filteredData.filter(p => p.status !== 'Paid').map(p => p.employeeId) : [])}
                                    checked={selectedIds.length > 0 && selectedIds.length === filteredData.filter(p => p.status !== 'Paid').length}
                                />
                            </th>
                            <th style={thStyle}>Employee</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Gross Pay</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Advance Salary</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Deductions</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Net Pay</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ padding: 30, textAlign: 'center' }}>Loading Period Data...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan="8" style={{ padding: 30, textAlign: 'center', color: 'var(--color-text-secondary)' }}>No entries found for this period.</td></tr>
                        ) : (
                            filteredData.map(item => (
                                <tr key={item.employeeId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(item.employeeId)}
                                            onChange={() => toggleSelection(item.employeeId)}
                                        />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 60,
                                                height: 60,
                                                borderRadius: '8px',
                                                background: 'var(--color-background-subtle)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--color-text-secondary)',
                                                backgroundImage: employees.find(e => e.id === item.employeeId)?.image ? `url(${employees.find(e => e.id === item.employeeId).image})` : 'none',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                overflow: 'hidden'
                                            }}>
                                                {!employees.find(e => e.id === item.employeeId)?.image && <User size={18} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{item.employeeName}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{item.employeeRole}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle' }}>₹{Number(item.grossPay).toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle', color: item.advanceDeductions > 0 ? 'var(--color-error)' : 'inherit' }}>
                                        {item.advanceDeductions > 0 ? `-₹${Number(item.advanceDeductions).toLocaleString('en-IN')}` : '-'}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                            <span style={{ color: 'var(--color-error)' }}>
                                                {/* Show other deductions (exclusive of advance) */}
                                                -₹{(Number(item.deductions) - (Number(item.advanceDeductions) || 0)).toLocaleString('en-IN')}
                                            </span>
                                            <button
                                                onClick={() => openDeductions(item)}
                                                title="Edit Deductions"
                                                style={{
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: 'var(--color-accent)',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle', fontWeight: 600 }}>₹{Number(item.netPay).toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <StatusPill status={item.status} paidAt={item.paidAt} isAdjusted={item.isAdjusted} />
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                            {/* Timesheet Button */}
                                            <button
                                                onClick={() => openTimesheet(item)}
                                                title="Timesheet"
                                                style={{
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: 'var(--color-accent)',
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: 'var(--radius-sm)',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <Clock size={18} />
                                            </button>

                                            {/* Advance Salary Button */}
                                            <button
                                                onClick={() => openAdvanceSalary(item)}
                                                title="Issue Advance Salary"
                                                style={{
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: 'var(--color-success)',
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: 'var(--radius-sm)',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(52, 199, 89, 0.1)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <IndianRupee size={18} />
                                            </button>

                                            {/* Pay Now / Mark as Unpaid Button */}
                                            {/* Action Buttons Row */}
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                {/* Payslip Button (Always Visible) */}
                                                <button
                                                    onClick={() => {
                                                        if (item.status === 'Paid') {
                                                            navigate(`/payslip/${item.id}`);
                                                        } else {
                                                            navigate(`/payslip/preview?employeeId=${item.employeeId}&periodStart=${currentPeriod.start}&periodEnd=${currentPeriod.end}`);
                                                        }
                                                    }}
                                                    title="View Payslip"
                                                    style={{
                                                        border: '1px solid var(--color-border)', background: 'white', padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                                                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-primary)'
                                                    }}>
                                                    <FileText size={14} /> Payslip
                                                </button>

                                                {/* Pay Now or Mark Unpaid */}
                                                {item.status === 'Unpaid' ? (
                                                    <button
                                                        onClick={() => handleMarkAsPaid([item])}
                                                        style={{ border: '1px solid var(--color-border)', background: 'white', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                                                        Pay Now
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleMarkAsUnpaid([item])}
                                                        title="Mark as Unpaid"
                                                        style={{ border: '1px solid var(--color-border)', background: 'white', padding: '6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--color-error)' }}>
                                                        <span style={{ fontSize: '1.2rem', lineHeight: 0.5 }}>×</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>

            {/* Timesheet Modal */}
            <TimesheetModal
                isOpen={timesheetModal.isOpen}
                onClose={() => setTimesheetModal({ isOpen: false, employee: null, item: null })}
                employee={timesheetModal.employee}
                periodStart={currentPeriod.start}
                periodEnd={currentPeriod.end}
                isPaid={timesheetModal.item?.status === 'Paid'}
                onSave={handleTimesheetSave}
            />

            {/* Deductions Modal */}
            <DeductionsModal
                isOpen={deductionsModal.isOpen}
                onClose={() => setDeductionsModal({ isOpen: false, employee: null, item: null })}
                employee={deductionsModal.employee}
                periodStart={currentPeriod.start}
                periodEnd={currentPeriod.end}
                grossPay={deductionsModal.item?.grossPay}
                onSave={handleDeductionsSave}
            />

            {/* Advance Salary Modal */}
            <AdvanceSalaryModal
                isOpen={advanceModal.isOpen}
                onClose={() => setAdvanceModal({ isOpen: false, employee: null })}
                employee={advanceModal.employee}
                currentPeriod={currentPeriod}
                onSave={handleAdvanceSave}
            />

            {/* Bonus Settings Modal */}
            <BonusSettingsModal
                isOpen={isBonusSettingsOpen}
                onClose={() => setIsBonusSettingsOpen(false)}
            />
        </div>
    );
};

// Sub-components & Styles
const StatusPill = ({ status, paidAt, isAdjusted }) => {
    const isPaid = status === 'Paid';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 500,
                background: isPaid ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.1)',
                color: isPaid ? 'var(--color-success)' : 'var(--color-error)'
            }}>
                {isPaid ? <CheckCircle size={14} /> : <Clock size={14} />}
                {status}
                {isPaid && paidAt && <span style={{ fontSize: '0.7em', opacity: 0.8 }}>({formatDate(paidAt)})</span>}
            </span>
            {isAdjusted && (
                <span style={{
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: 'rgba(255, 149, 0, 0.15)',
                    color: '#ff9500'
                }}>
                    Adjusted
                </span>
            )}
        </div>
    );
};

const navButtonStyle = {
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
};

const thStyle = {
    padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px'
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
};

export default Payroll;
