import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Printer, Moon, User, MessageCircle } from 'lucide-react';

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
                    console.log('[Payslip] Loaded data:', {
                        employeeName: data.employeeName,
                        advanceDeductions: data.advanceDeductions,
                        'details.advances': data.details?.advances,
                        periodStart: data.periodStart,
                        periodEnd: data.periodEnd
                    });
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

        // Listen for advance salary updates
        const handleAdvanceUpdate = (event) => {
            console.log('[Payslip] Advance salary updated, refreshing payslip...');
            setLoading(true);
            fetchPayslip();
        };

        // Listen for payroll updates
        const handlePayrollUpdate = (event) => {
            console.log('[Payslip] Payroll updated, refreshing payslip...');
            setLoading(true);
            fetchPayslip();
        };

        window.addEventListener('advanceSalaryUpdated', handleAdvanceUpdate);
        window.addEventListener('payrollUpdated', handlePayrollUpdate);

        return () => {
            window.removeEventListener('advanceSalaryUpdated', handleAdvanceUpdate);
            window.removeEventListener('payrollUpdated', handlePayrollUpdate);
        };
    }, [id, location.search, navigate, addToast]);

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Payslip...</div>;
    if (!entry) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleWhatsApp = () => {
        const phoneNumber = entry.employeeContact ? entry.employeeContact.replace(/[^0-9]/g, '') : '';
        const message = `*Payslip for ${entry.employeeName}*\nPeriod: ${formatDate(entry.periodStart)} - ${formatDate(entry.periodEnd)}\nNet Pay: ${formatCurrency(entry.netPay)}\n\nPlease find your payslip details above.`;
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const day = d.getDate().toString().padStart(2, '0');
        const month = d.toLocaleString('en-US', { month: 'short' });
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
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
        <div style={{ background: '#f5f5f7', minHeight: '100vh', padding: '20px 0', fontFamily: 'Inter, sans-serif' }}>
            {/* Header / Actions - Hidden when printing */}
            <div className="no-print" style={{ maxWidth: '210mm', margin: '0 auto 15px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={() => navigate('/payroll')}
                    style={{
                        background: 'white', border: '1px solid #e1e1e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        color: '#666', fontSize: '13px', padding: '8px 16px', borderRadius: '8px', fontWeight: 500, boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={handleWhatsApp}
                        style={{
                            background: '#25D366', color: 'white', border: 'none', borderRadius: '8px',
                            padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600,
                            fontSize: '13px', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)'
                        }}
                    >
                        <MessageCircle size={16} /> WhatsApp
                    </button>
                    <button
                        onClick={handlePrint}
                        style={{
                            background: '#000', color: 'white', border: 'none', borderRadius: '8px',
                            padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600,
                            fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Printer size={16} /> Print Payslip
                    </button>
                </div>
            </div>

            {/* A4 Page Container */}
            <div id="payslip-content" className="a4-page">

                {/* 1. Top Section (Header + Employee Card) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '3px solid #000', paddingBottom: '25px' }}>
                    {/* Left: Title & Date Range */}
                    <div>
                        <h1 style={{ margin: 0, fontSize: '42px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-1px', lineHeight: 1 }}>Payslip</h1>
                        <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#777', fontWeight: 500 }}>
                            {formatDate(entry.periodStart)} — {formatDate(entry.periodEnd)}
                        </p>
                    </div>

                    {/* Right: Employee Card */}
                    <div style={{
                        background: '#f5f5f5',
                        padding: '16px 24px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '40px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                    }}>
                        {/* Avatar & Identity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                {entry.employeeImage ? (
                                    <img src={entry.employeeImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={28} color="white" />
                                )}
                            </div>
                            <div>
                                <div style={{ fontSize: '17px', fontWeight: 800, color: '#111', lineHeight: 1.2 }}>{entry.employeeName}</div>
                                <div style={{ fontSize: '13px', color: '#888', fontWeight: 500 }}>{entry.employeeRole}</div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: '32px', textAlign: 'right' }}>
                            <div>
                                <div style={{ fontSize: '10px', color: '#aaa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Pay Date</div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#000' }}>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: '#aaa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Working Days</div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#000' }}>{Math.floor((entry.details?.timesheet?.length || 0))} Days</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timesheet Details (Moved) */}
                {entry.details?.timesheet?.length > 0 && (
                    <section style={{ marginBottom: '20px' }}>
                        <h3 className="sub-header" style={{ marginBottom: '10px' }}>Timesheet Details</h3>
                        <table className="compact-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time In</th>
                                    <th>Time Out</th>
                                    <th>Break</th>
                                    <th>Shift</th>
                                    <th style={{ textAlign: 'right' }}>OT</th>
                                    <th style={{ textAlign: 'right' }}>Hours</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entry.details.timesheet.map((row, idx) => {
                                    const isSunday = new Date(row.date).getDay() === 0;
                                    return (
                                        <tr key={idx} style={{
                                            background: row.nightStatus ? '#fffde7' : 'transparent',
                                            color: isSunday ? '#d32f2f' : 'inherit'
                                        }}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                                    {row.nightStatus && <Moon size={12} fill="#f59e0b" color="#f59e0b" />}
                                                </div>
                                            </td>
                                            <td>{formatTime12h(row.clockIn)}</td>
                                            <td>{formatTime12h(row.clockOut)}</td>
                                            <td>{row.breakMinutes > 0 ? `${row.breakMinutes}m` : '-'}</td>
                                            <td>{row.nightStatus ? 'Night' : '-'}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                {row.overtimeMinutes > 0 ? `${(row.overtimeMinutes / 60).toFixed(1)}h` : '-'}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {Math.floor(row.billableMinutes / 60)}h {(row.billableMinutes % 60)}m
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {(() => {
                                                    const hourlyRate = entry.hourlyRate || (entry.perShiftAmount ? parseFloat(entry.perShiftAmount) / 8 : 0);
                                                    return hourlyRate ? formatCurrency(hourlyRate * (row.billableMinutes / 60)) : '-';
                                                })()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'right', fontWeight: 700, paddingTop: '10px', borderTop: '2px solid #eee' }}>Total Amount</td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, paddingTop: '10px', borderTop: '2px solid #eee' }}>
                                        {formatCurrency(entry.details.timesheet.reduce((sum, row) => {
                                            const hourlyRate = entry.hourlyRate || (entry.perShiftAmount ? parseFloat(entry.perShiftAmount) / 8 : 0);
                                            return sum + (hourlyRate * (row.billableMinutes / 60));
                                        }, 0))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </section>
                )}

                {/* 3. Financial Summary (Split View) */}
                {/* 3. Financial Summary (Split View) */}
                {/* 3. Financial Summary (Consolidated View) */}




                {/* 5. Additional Details (Bonus & Loans) */}
                {/* 5. Additional Details (Bonus, Overtime) */}
                {(entry.details?.bonus || Number(entry.overtimePay || 0) > 0) && (
                    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                        {/* Overtime */}
                        {Number(entry.overtimePay || 0) > 0 && (
                            <div className="info-card" style={{ border: '1px solid #fbc02d' }}>
                                <div className="card-label">Overtime Summary</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#555' }}>Total Hours</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{(Number(entry.totalOvertimeMinutes || 0) / 60).toFixed(1)} hrs</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                    <span style={{ fontSize: '12px', color: '#555' }}>Amount</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(entry.overtimePay)}</span>
                                </div>
                            </div>
                        )}
                        {/* Bonus */}
                        {entry.details?.bonus && (
                            <div className="info-card">
                                <div className="card-label">Annual Bonus</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#555' }}>Year to Date</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{entry.details.bonus.ytdDays} Days Accrued</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                    <span style={{ fontSize: '12px', color: '#555' }}>Balance</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#2e7d32' }}>{formatCurrency(entry.details.bonus.balance)}</span>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* 6. Loan Information (Red Border) */}
                {/* 6. Loan Information (Red Border) */}
                {/* 6. Combined Financial Section: Loan Summary & Earnings */}
                <section style={{ display: 'grid', gridTemplateColumns: entry.details?.loanSummary ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>

                    {/* Loan Summary (Left side if present) */}
                    {entry.details?.loanSummary && (
                        <div className="info-card" style={{ border: '1px solid #d32f2f' }}>
                            <div className="card-label" style={{ marginBottom: '10px' }}>Loan Summary</div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '13px', color: '#555' }}>Original Amount</span>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(entry.details.loanSummary.originalAmount)}</span>
                            </div>

                            <div style={{ borderTop: '1px solid #eee', margin: '8px 0' }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '13px', color: '#555' }}>Opening Balance</span>
                                <span style={{ fontSize: '13px', fontWeight: 500 }}>{formatCurrency(entry.details.loanSummary.openingBalance)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '13px', color: '#555' }}>Deduction</span>
                                <span style={{ fontSize: '13px', color: '#d32f2f' }}>{formatCurrency(entry.details.loanSummary.currentDeduction)}</span>
                            </div>

                            <div style={{ borderTop: '1px solid #eee', margin: '8px 0' }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#c62828' }}>Remaining Amount</span>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#c62828' }}>{formatCurrency(entry.details.loanSummary.remainingBalance)}</span>
                            </div>
                        </div>
                    )}

                    {/* Earnings Card */}
                    <div className="info-card" style={{ border: '1px solid #2196f3' }}>
                        <div className="card-label" style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Earnings</div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#555' }}>Basic Salary</span>
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(Number(entry.grossPay || 0) - Number(entry.overtimePay || 0))}</span>
                        </div>

                        {Number(entry.overtimePay || 0) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#555' }}>
                                    Overtime <span style={{ fontSize: '10px', color: '#888' }}>({(Number(entry.totalOvertimeMinutes || 0) / 60).toFixed(1)} hrs)</span>
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(entry.overtimePay)}</span>
                            </div>
                        )}

                        {entry.isAdjusted && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#555' }}>Adjustment</span>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(entry.adjustmentAmount)}</span>
                            </div>
                        )}

                        {Number(entry.advanceDeductions || 0) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#555' }}>Advance Salary</span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#d32f2f' }}>
                                    -{formatCurrency(entry.advanceDeductions)}
                                </span>
                            </div>
                        )}

                        {Number(entry.loanDeductions || 0) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#555' }}>Loan Repayment</span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#d32f2f' }}>
                                    -{formatCurrency(entry.loanDeductions)}
                                </span>
                            </div>
                        )}

                        <div style={{ borderTop: '1px solid #eee', margin: '12px 0 8px 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>Total Earnings</span>
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>
                                {formatCurrency(entry.netPay)}
                            </span>
                        </div>
                    </div>
                </section>

                {/* 4. Net Pay Banner (Moved) */}
                <section style={{ background: '#000', color: 'white', padding: '15px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Net Payable Amount</div>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                        {formatCurrency(entry.netPay)}
                    </div>
                </section>

            </div>

            <style>{`
                .a4-page {
                    width: 210mm;
                    min-height: 297mm;
                    margin: 0 auto;
                    background: white;
                    padding: 10mm;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    box-sizing: border-box;
                    color: #111;
                }
                
                .sub-header {
                    font-size: 11px;
                    text-transform: uppercase;
                    color: #888;
                    letter-spacing: 1px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 8px;
                    margin: 0 0 12px 0;
                }

                .financial-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                .financial-table td {
                    padding: 8px 0;
                    border-bottom: 1px solid #f9f9f9;
                }
                .financial-table .amount {
                    text-align: right;
                    font-weight: 500;
                    font-variant-numeric: tabular-nums;
                }
                .financial-table tfoot td {
                    padding-top: 12px;
                    border-bottom: none;
                    font-weight: 700;
                    font-size: 14px;
                    border-top: 1px solid #eee;
                }

                .info-card {
                    background: #f9f9f9;
                    border-radius: 6px;
                    padding: 12px;
                    border: 1px solid #eee;
                }
                .card-label {
                    font-size: 10px;
                    text-transform: uppercase;
                    color: #000;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .compact-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                    color: #444;
                }
                .compact-table th {
                    text-align: left;
                    padding: 6px 4px;
                    border-bottom: 1px solid #ddd;
                    font-weight: 600;
                    color: #000;
                    font-size: 10px;
                    text-transform: uppercase;
                }
                .compact-table td {
                    padding: 6px 4px;
                    border-bottom: 1px solid #f5f5f5;
                }

                @media print {
                    @page {
                        size: A4;
                        margin: 0.5mm;
                    }
                    body {
                        visibility: hidden;
                        background: white;
                    }
                    .no-print {
                        display: none !important;
                    }
                    #payslip-content {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 10mm;
                        box-shadow: none !important;
                        background: white;
                    }
                    #payslip-content * {
                        visibility: visible;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
};

export default Payslip;
