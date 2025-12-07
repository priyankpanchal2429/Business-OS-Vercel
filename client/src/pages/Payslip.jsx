import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Printer, Download, Share2, Moon } from 'lucide-react';

const Payslip = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();
    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayslip = async () => {
            try {
                let url;
                if (id === 'preview') {
                    // Preview Mode: Fetch calculated data
                    const searchParams = new URLSearchParams(location.search);
                    const employeeId = searchParams.get('employeeId');
                    const periodStart = searchParams.get('periodStart');
                    const periodEnd = searchParams.get('periodEnd');

                    if (!employeeId || !periodStart || !periodEnd) {
                        throw new Error("Missing parameters for preview");
                    }

                    url = `/api/payroll/calculate?employeeId=${employeeId}&start=${periodStart}&end=${periodEnd}`;
                } else {
                    // View Mode: Fetch saved data
                    url = `/api/payroll/${id}`;
                }

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setEntry(data);
                } else {
                    addToast('Payslip not found.', 'error');
                    navigate('/payroll');
                }
            } catch (err) {
                console.error("Failed to fetch payslip:", err);
                addToast('Error loading payslip.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchPayslip();
    }, [id, location.search, navigate, addToast]);

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Payslip...</div>;
    if (!entry) return null;

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const formatTime12h = (timeStr) => {
        if (!timeStr || timeStr === '-') return '-';
        const [hours, minutes] = timeStr.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const formatCurrency = (val) => {
        return '₹' + Number(val || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
            {/* Header / Actions - Hidden when printing */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                <button
                    onClick={() => navigate('/payroll')}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        color: 'var(--color-text-secondary)', fontSize: '0.9rem'
                    }}
                >
                    <ArrowLeft size={18} /> Back to Payroll
                </button>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={handlePrint}
                        style={{
                            background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
                            padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        <Printer size={16} /> Print Payslip
                    </button>
                </div>
            </div>

            {/* Payslip Container */}
            <div id="payslip-content" style={{
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '40px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}>
                {/* Company Header */}
                <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h1 style={{ margin: '0 0 4px 0', fontSize: '1.8rem', color: '#111' }}>Business OS</h1>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                            Business Address Line 1<br />
                            City, State, Zip Code<br />
                            Phone: +91 XXXXX XXXXX
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ margin: '0 0 4px 0', color: '#111', textTransform: 'uppercase', letterSpacing: '1px' }}>Payslip</h2>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            Ref: {entry.id.split('-')[1]}<br />
                            Date: {formatDate(new Date())}
                        </div>
                    </div>
                </div>

                {/* Employee & Period Details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', background: '#f9f9f9', padding: '20px', borderRadius: '6px' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', textTransform: 'uppercase', color: '#888' }}>Employee Details</h3>
                        <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '1.1rem' }}>{entry.employeeName}</div>
                        <div style={{ color: '#555', fontSize: '0.9rem' }}>{entry.employeeRole}</div>
                        <div style={{ color: '#555', fontSize: '0.9rem' }}>ID: {entry.employeeId}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', textTransform: 'uppercase', color: '#888' }}>Pay Period</h3>
                        <div style={{ fontSize: '1rem', fontWeight: 500 }}>
                            {formatDate(entry.periodStart)} – {formatDate(entry.periodEnd)}
                        </div>
                        <div style={{ marginTop: 8 }}>
                            Expected: <span style={{ fontWeight: 500 }}>{entry.workingDays} Days</span>
                            {entry.totalBillableMinutes > 0 && (
                                <span style={{ marginLeft: 12 }}>
                                    Worked: <span style={{ fontWeight: 500 }}>{(entry.totalBillableMinutes / 60).toFixed(1)} hrs</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Earnings & Deductions Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', width: '50%' }}>Earnings</th>
                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd', width: '15%' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', width: '20%', paddingLeft: 20 }}>Deductions</th>
                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd', width: '15%' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '12px', verticalAlign: 'top', borderBottom: '1px solid #eee' }}>
                                <div style={{ marginBottom: 8 }}>Basic Salary</div>
                                {entry.overtimePay > 0 && (
                                    <div style={{ marginBottom: 8, color: 'var(--color-primary)' }}>
                                        Overtime
                                        <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: 8 }}>
                                            ({(entry.totalOvertimeMinutes / 60).toFixed(1)} hrs @ 1.5x)
                                        </span>
                                    </div>
                                )}
                                {entry.isAdjusted && (
                                    <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                                        Adjustment (Previous Period)
                                    </div>
                                )}
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right', verticalAlign: 'top' }}>
                                <div style={{ marginBottom: 8 }}>
                                    {formatCurrency(entry.grossPay - (entry.overtimePay || 0))}
                                </div>
                                {entry.overtimePay > 0 && (
                                    <div style={{ marginBottom: 8, color: 'var(--color-primary)' }}>
                                        {formatCurrency(entry.overtimePay)}
                                    </div>
                                )}
                                {entry.isAdjusted && (
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                        {entry.adjustmentAmount > 0 ? '+' : ''}{formatCurrency(entry.adjustmentAmount)}
                                    </div>
                                )}
                            </td>
                            <td style={{ padding: '12px', verticalAlign: 'top', paddingLeft: 20, borderBottom: '1px solid #eee' }}>
                                <div style={{ marginBottom: 8 }}>Advance Salary</div>
                                <div style={{ marginBottom: 8 }}>Other Deductions</div>
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right', verticalAlign: 'top' }}>
                                <div style={{ marginBottom: 8, color: '#d32f2f' }}>{formatCurrency(entry.advanceDeductions)}</div>
                                <div style={{ marginBottom: 8, color: '#d32f2f' }}>
                                    {formatCurrency(entry.deductions - (entry.advanceDeductions || 0))}
                                </div>
                            </td>
                        </tr>
                        {/* Minimum height rows/padding filler if needed */}
                        <tr style={{ height: 100 }}><td></td><td></td><td></td><td></td></tr>
                    </tbody>
                    <tfoot>
                        <tr style={{ background: '#f9f9f9', borderTop: '2px solid #ddd' }}>
                            <td style={{ padding: '12px', fontWeight: 600 }}>Total Earnings</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                                {formatCurrency(entry.grossPay + (entry.isAdjusted ? entry.adjustmentAmount : 0))}
                            </td>
                            <td style={{ padding: '12px', fontWeight: 600, paddingLeft: 20 }}>Total Deductions</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#d32f2f' }}>
                                {formatCurrency(entry.deductions)}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                {/* --- DETAILED SECTIONS --- */}

                {/* 1. Timesheet Summary */}
                {entry.details?.timesheet?.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '0.95rem', color: '#444', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px' }}>
                            Timesheet Summary
                        </h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#fafafa', color: '#666' }}>
                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 500 }}>Date</th>
                                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>Clock In</th>
                                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>Clock Out</th>
                                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>Break</th>
                                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>Shift Type</th>
                                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>OT</th>
                                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>Total Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entry.details.timesheet.map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px', color: '#333' }}>{formatDate(row.date)}</td>
                                        <td style={{ padding: '8px', textAlign: 'center', color: '#555' }}>{formatTime12h(row.clockIn)}</td>
                                        <td style={{ padding: '8px', textAlign: 'center', color: '#555' }}>
                                            {formatTime12h(row.clockOut)}
                                            {row.nightStatus && (
                                                <div style={{ fontSize: '0.7rem', color: 'purple', fontWeight: 500 }}>
                                                    {row.nightStatus === 'Extended Night' ? '🌙 Late' : '🌑 Night'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'center', color: '#555' }}>
                                            {row.breakMinutes}m
                                            {row.dinnerBreakDeduction > 0 && (
                                                <div style={{ fontSize: '0.7rem', color: '#d32f2f' }}>
                                                    - Dinner ({row.dinnerBreakDeduction}m)
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'center', fontSize: '0.75rem' }}>
                                            {row.nightStatus ?
                                                <span style={{
                                                    background: '#fff9c4',
                                                    color: '#f9a825',
                                                    padding: '2px 8px',
                                                    borderRadius: 12,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    fontWeight: 600,
                                                    border: '1px solid #fff59d'
                                                }}>
                                                    <Moon size={10} fill="currentColor" />
                                                    {row.nightStatus === 'Extended Night' ? 'Late Night' : 'Night Shift'}
                                                </span>
                                                : <span style={{ color: '#999' }}>Standard</span>
                                            }
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'right', color: row.overtimeMinutes > 0 ? 'var(--color-primary)' : '#ccc' }}>
                                            {row.overtimeMinutes > 0 ? `${(row.overtimeMinutes / 60).toFixed(1)}h` : '-'}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>
                                            {(row.billableMinutes / 60).toFixed(2)} hrs
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: '#fcfcfc', borderTop: '1px solid #eee' }}>
                                    <td colSpan="5" style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#444' }}>Totals:</td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                                        {(entry.totalOvertimeMinutes / 60).toFixed(1)} hrs
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#444' }}>
                                        {(entry.details.timesheet.reduce((acc, curr) => acc + curr.billableMinutes, 0) / 60).toFixed(2)} hrs
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* 2. Advance Salary Section */}
                {entry.details?.advances?.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '0.95rem', color: '#444', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px' }}>
                            Advance Salary Breakdown
                        </h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#fafafa', color: '#666' }}>
                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 500 }}>Date Issued</th>
                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 500 }}>Reason</th>
                                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entry.details.advances.map((adv, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px', color: '#333' }}>{formatDate(adv.date)}</td>
                                        <td style={{ padding: '8px', color: '#555' }}>{adv.reason}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 500, color: '#d32f2f' }}>
                                            {formatCurrency(adv.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: '#fcfcfc', borderTop: '1px solid #eee' }}>
                                    <td colSpan="2" style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#444' }}>Total Advance Salary:</td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#d32f2f' }}>
                                        {formatCurrency(entry.details.advances.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* 3. Loan Summary Section */}
                {(entry.details?.loans?.length > 0) ? (
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '0.95rem', color: '#444', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px' }}>
                            Loan Summary
                        </h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#fafafa', color: '#666' }}>
                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 500 }}>Loan Type / Description</th>
                                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>Paid This Period</th>
                                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>Remaining Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entry.details.loans.map((loan, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px', color: '#333' }}>{loan.description || 'Loan Repayment'}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 500, color: '#d32f2f' }}>
                                            {formatCurrency(loan.amount)}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'right', color: '#888', fontStyle: 'italic' }}>
                                            {loan.remainingBalance}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ marginBottom: '30px', padding: '12px', background: '#fafafa', borderRadius: '4px', fontSize: '0.85rem', color: '#666', border: '1px dashed #ddd' }}>
                        No loan entries for this period.
                    </div>
                )}

                {/* Net Pay Highlight */}
                <div style={{
                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                    borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '20px'
                }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Payable Amount</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                            {formatCurrency(entry.netPay)}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#888', fontStyle: 'italic', marginTop: 4 }}>
                            Paid via Bank Transfer
                        </div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '0.85rem', color: '#888', textAlign: 'center' }}>
                    <p>This is a computer-generated document and does not require a signature.</p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    #payslip-content { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; }
                    @page { margin: 20mm; size: auto; }
                }
            `}</style>
        </div>
    );
};

export default Payslip;
