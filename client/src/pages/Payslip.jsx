import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Printer } from 'lucide-react';

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
            <div id="payslip-content" className="payslip-container">
                {/* Company Header */}
                {/* Header Section Matching Reference Image */}
                <div className="top-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', paddingBottom: '10px' }}>

                    {/* LEFT SIDE: Title & Period */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h1 style={{ margin: '0 0 20px 0', fontSize: '28px', color: '#111', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>2 Week Payslip</h1>

                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Pay Period
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#000', marginBottom: '2px' }}>
                            {formatDate(entry.periodStart)} – {formatDate(entry.periodEnd)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                            Expected: {entry.workingDays} Days
                        </div>
                    </div>

                    {/* RIGHT SIDE: Photo & Employee Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '120px' }}>
                        {entry.employeeImage ? (
                            <img
                                src={entry.employeeImage}
                                alt=""
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '12px',
                                    objectFit: 'cover',
                                    marginBottom: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '12px',
                                background: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '8px',
                                color: '#ccc',
                                border: '1px solid #eee'
                            }}>
                                <span style={{ fontSize: '24px' }}>👤</span>
                            </div>
                        )}
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#000', lineHeight: '1.2' }}>
                            {entry.employeeName}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                            {entry.employeeRole}
                        </div>
                    </div>
                </div>

                {/* --- DETAILED SECTIONS (Compact for Print) --- */}

                {/* 1. Timesheet Summary */}
                {entry.details?.timesheet?.length > 0 && (
                    <div className="section-container avoid-break">
                        <h3 className="section-header">Timesheet Summary</h3>
                        <table className="details-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left' }}>Date</th>
                                    <th style={{ textAlign: 'center' }}>In</th>
                                    <th style={{ textAlign: 'center' }}>Out</th>
                                    <th style={{ textAlign: 'center' }}>Break</th>
                                    <th style={{ textAlign: 'center' }}>Shift</th>
                                    <th style={{ textAlign: 'right' }}>OT</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entry.details.timesheet.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{formatDate(row.date)}</td>
                                        <td style={{ textAlign: 'center' }}>{formatTime12h(row.clockIn)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            {formatTime12h(row.clockOut)}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {row.breakMinutes}m
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {row.nightStatus ? 'Night' : 'Std'}
                                        </td>
                                        <td style={{ textAlign: 'right', color: row.overtimeMinutes > 0 ? '#000' : '#888' }}>
                                            {row.overtimeMinutes > 0 ? `${(row.overtimeMinutes / 60).toFixed(1)}h` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 500 }}>
                                            {Math.floor(row.billableMinutes / 60)}:{(row.billableMinutes % 60).toString().padStart(2, '0')}min
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Earnings & Loan Summary Cards */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start', margin: '20px 0' }}>

                    {/* Earnings Card */}
                    <div className="avoid-break" style={{
                        border: '1px solid #0071e3',
                        borderRadius: '8px',
                        padding: '16px',
                        background: '#f8fbff',
                        flex: 1,
                        minWidth: '260px'
                    }}>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#0071e3',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '1px solid rgba(0, 113, 227, 0.2)',
                            paddingBottom: '8px'
                        }}>Earnings</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#333' }}>Basic Salary</span>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(entry.grossPay - (entry.overtimePay || 0))}</span>
                            </div>

                            {entry.overtimePay > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0071e3' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '13px' }}>Overtime Pay</span>
                                        <span style={{ fontSize: '11px', opacity: 0.85 }}>({(entry.totalOvertimeMinutes / 60).toFixed(1)} hrs @ 1.5x)</span>
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(entry.overtimePay)}</span>
                                </div>
                            )}

                            {entry.isAdjusted && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0071e3' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '13px' }}>Payoff</span>
                                        <span style={{ fontSize: '11px', opacity: 0.85 }}>(Previous Period Adjustment)</span>
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                        {entry.adjustmentAmount > 0 ? '+' : ''}{formatCurrency(entry.adjustmentAmount)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid rgba(0, 113, 227, 0.2)', margin: '12px 0 0 0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: '#333' }}>Total</span>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#0071e3' }}>
                                {formatCurrency(entry.grossPay + (entry.isAdjusted ? entry.adjustmentAmount : 0))}
                            </span>
                        </div>
                    </div>

                    {/* Advance Salary Card */}
                    <div className="avoid-break" style={{
                        border: '1px solid #ed6c02',
                        borderRadius: '8px',
                        padding: '16px',
                        background: '#fff9f5',
                        flex: 1,
                        minWidth: '200px'
                    }}>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#ed6c02',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '1px solid rgba(237, 108, 2, 0.2)',
                            paddingBottom: '8px'
                        }}>Advance Salary</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#333' }}>Total Advance</span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#ed6c02' }}>{formatCurrency(entry.advanceDeductions)}</span>
                            </div>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(237, 108, 2, 0.2)', margin: '12px 0 0 0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: '#333' }}>Total</span>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#ed6c02' }}>
                                {formatCurrency(entry.advanceDeductions)}
                            </span>
                        </div>
                    </div>

                    {/* Loan Summary Card */}
                    <div className="avoid-break" style={{
                        border: '1px solid #d32f2f',
                        borderRadius: '8px',
                        padding: '16px',
                        background: '#fff5f5',
                        flex: 1,
                        minWidth: '200px'
                    }}>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#d32f2f',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '1px solid rgba(211, 47, 47, 0.2)',
                            paddingBottom: '8px'
                        }}>Loan Summary</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#333' }}>Other Deductions</span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#d32f2f' }}>{formatCurrency(entry.deductions - (entry.advanceDeductions || 0))}</span>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(211, 47, 47, 0.2)', margin: '12px 0 0 0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: '#333' }}>Total</span>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#d32f2f' }}>
                                {formatCurrency(entry.deductions - (entry.advanceDeductions || 0))}
                            </span>
                        </div>
                    </div>

                </div>

                {/* Bonus Tracker (Card Style) */}
                {entry.details?.bonus && (
                    <div className="section-container avoid-break" style={{
                        border: '1px solid #0071e3',
                        borderRadius: '8px',
                        padding: '16px',
                        background: '#f8fbff',
                        marginTop: '20px',
                        width: 'fit-content',
                        minWidth: '200px'
                    }}>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#0071e3',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '1px solid rgba(0, 113, 227, 0.2)',
                            paddingBottom: '8px'
                        }}>
                            Annual Bonus
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                                <span style={{ fontSize: '13px', color: '#555' }}>Total Days</span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{entry.details.bonus.ytdDays}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                                <span style={{ fontSize: '13px', color: '#555' }}>Balance</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0071e3' }}>{formatCurrency(entry.details.bonus.balance)}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="split-sections">
                    {/* 2. Advance Salary Section */}
                    {entry.details?.advances?.length > 0 && (
                        <div className="section-container avoid-break" style={{ flex: 1 }}>
                            <h3 className="section-header">Advance Salary</h3>
                            <table className="details-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>Date</th>
                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entry.details.advances.map((adv, idx) => (
                                        <tr key={idx}>
                                            <td>{formatDate(adv.date)}</td>
                                            <td style={{ textAlign: 'right', color: '#d32f2f' }}>
                                                {formatCurrency(adv.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 4. Loan Summary Section (Fits beside Advances if space allows, or stacked) */}
                    {(entry.details?.loans?.length > 0) && (
                        <div className="section-container avoid-break" style={{ flex: 1 }}>
                            <h3 className="section-header">Loans</h3>
                            <table className="details-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>Type</th>
                                        <th style={{ textAlign: 'right' }}>Paid</th>
                                        <th style={{ textAlign: 'right' }}>Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entry.details.loans.map((loan, idx) => (
                                        <tr key={idx}>
                                            <td>{loan.description || 'Loan'}</td>
                                            <td style={{ textAlign: 'right', color: '#d32f2f' }}>
                                                {formatCurrency(loan.amount)}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#666' }}>
                                                {loan.remainingBalance}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>



                {/* Net Pay Highlight */}
                <div className="net-pay-section avoid-break">
                    <div className="net-pay-label">Net Payable Amount</div>
                    <div className="net-pay-value" style={{ color: '#0071e3' }}>{formatCurrency(entry.netPay)}</div>
                    <div className="net-pay-note">Paid via Bank Transfer</div>
                </div>


            </div>

            {/* Print Styles */}
            <style>{`
                /* Base Styles for Screen (Aesthetics) */
                .payslip-container {
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                    font-family: 'Inter', sans-serif;
                    color: #111;
                }
                .header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 20px;
                    margin-bottom: 24px;
                }
                .details-section {
                    display: flex;
                    gap: 32px;
                    margin-bottom: 24px;
                    background: #f9f9f9;
                    padding: 20px;
                    border-radius: 6px;
                }
                .section-label {
                    margin: 0 0 8px 0;
                    font-size: 11px;
                    text-transform: uppercase;
                    color: #666;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }
                .earnings-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 24px;
                    font-size: 13px;
                }
                .earnings-table th {
                    text-align: left;
                    padding: 10px;
                    background: #f5f5f5;
                    border-bottom: 1px solid #ddd;
                    font-weight: 600;
                    font-size: 12px;
                    color: #333;
                }
                .earnings-table td {
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                }
                .earnings-table tfoot td {
                    font-weight: 600;
                    padding: 10px;
                    background: #f9f9f9;
                    border-top: 2px solid #ddd;
                }
                .total-value { text-align: right; }
                .deduction { color: #d32f2f; }
                .line-item { margin-bottom: 4px; }
                .highlight { color: var(--color-primary, #0071e3); }
                .italic { font-style: italic; color: #666; }
                .spacer-row { height: 40px; }
                
                .section-container { margin-bottom: 24px; }
                .section-header {
                    font-size: 13px;
                    color: #333;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 6px;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .details-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                }
                .details-table th {
                    background: #fafafa;
                    color: #666;
                    padding: 6px 8px;
                    font-weight: 600;
                    font-size: 11px;
                }
                .details-table td {
                    padding: 6px 8px;
                    border-bottom: 1px solid #f0f0f0;
                    color: #333;
                }

                .bonus-section {
                    background: #f0f7ff;
                    border: 1px solid #e0efff;
                    border-radius: 6px;
                    padding: 12px;
                }
                .metric-row {
                    display: flex;
                    gap: 24px;
                }
                .metric {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .metric label { font-size: 11px; color: #666; text-transform: uppercase; }
                .metric span { font-size: 13px; fontWeight: 600; color: #333; }

                .net-pay-section {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    border-top: 1px solid #eee;
                    padding-top: 16px;
                    margin-top: 8px;
                }
                .net-pay-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
                .net-pay-value { font-size: 24px; font-weight: 700; color: #000; }
                .net-pay-note { font-size: 12px; color: #888; font-style: italic; margin-top: 4px; }


                .split-sections {
                    display: flex;
                    gap: 24px;
                }

                /* PRINT SPECIFIC STYLES - EXCLUSIVE PRINTING */
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm 15mm;
                    }

                    /* 
                       CRITICAL: Hide EVERYTHING in the document body. 
                       Then specifically make the payslip container visible.
                       This ensures Sidebar, Navbar, and all other clutter is gone.
                    */
                    body {
                        visibility: hidden;
                        background: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        overflow: hidden; /* Prevent scrolling/extra pages from hidden content */
                        height: 100%;
                    }

                    /* Hide elements explicitly marked as no-print */
                    .no-print { display: none !important; }

                    /* Position the payslip container to capture the full page */
                    #payslip-content {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        overflow: visible; /* Allow payslip to extend as needed */
                    }

                    /* Ensure children of the payslip are visible */
                    #payslip-content * {
                        visibility: visible;
                    }

                    /* Typography Scaling for Print */
                    #payslip-content h1 { font-size: 24px !important; } /* Restore bold header size */
                    .header-section { padding-bottom: 10px !important; margin-bottom: 20px !important; }
                    
                    /* Compact Details for Print */
                    .details-section {
                        padding: 0 !important;
                        margin-bottom: 20px !important;
                        background: transparent !important;
                        border: none !important;
                    }

                    /* Clearer Tables for Print */
                    .earnings-table { font-size: 12px !important; margin-bottom: 20px !important; width: 100% !important; }
                    .earnings-table th { background: #f5f5f5 !important; color: #000 !important; border-bottom: 1px solid #000 !important; }
                    .earnings-table td { border-bottom: 1px solid #eee !important; }
                    

                }
            `}</style>
        </div>
    );
};

export default Payslip;
