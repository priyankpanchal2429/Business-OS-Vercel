import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Phone, Calendar, MapPin, Clock, Banknote,
    Briefcase, FileText, CreditCard, History, Download, Printer,
    ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import Card from '../components/Card';

const ResignedEmployeeHistory = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const employeeId = searchParams.get('id');

    const [employee, setEmployee] = useState(null);
    const [payslips, setPayslips] = useState([]);
    const [loans, setLoans] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [bonusHistory, setBonusHistory] = useState(null);
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSection, setExpandedSection] = useState('personal');

    useEffect(() => {
        if (employeeId) {
            fetchEmployeeData();
        }
    }, [employeeId]);

    const fetchEmployeeData = async () => {
        setLoading(true);
        try {
            // Fetch employee details
            const empRes = await fetch(`/api/employees/${employeeId}`);
            if (empRes.ok) {
                const empData = await empRes.json();
                setEmployee(empData);
            }

            // Fetch payslip history
            const payslipRes = await fetch(`/api/payroll/history/${employeeId}`);
            if (payslipRes.ok) {
                const payslipData = await payslipRes.json();
                setPayslips(payslipData);
            }

            // Fetch loan history
            const loanRes = await fetch(`/api/loans?employeeId=${employeeId}`);
            if (loanRes.ok) {
                const loanData = await loanRes.json();
                setLoans(loanData);
            }

            // Fetch advance salary history
            const advanceRes = await fetch(`/api/advances?employeeId=${employeeId}`);
            if (advanceRes.ok) {
                const advanceData = await advanceRes.json();
                setAdvances(advanceData);
            }

            // Fetch bonus history
            const bonusRes = await fetch(`/api/bonus/${employeeId}`);
            if (bonusRes.ok) {
                const bonusData = await bonusRes.json();
                setBonusHistory(bonusData);
            }

            // Fetch timesheet history
            const timesheetRes = await fetch(`/api/timesheet?employeeId=${employeeId}`);
            if (timesheetRes.ok) {
                const timesheetData = await timesheetRes.json();
                setTimesheets(timesheetData);
            }

        } catch (err) {
            console.error('Error fetching employee data:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount || 0);
    };

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Section Header Component
    const SectionHeader = ({ id, icon: Icon, title, badge, color = 'var(--color-accent)' }) => {
        const isExpanded = expandedSection === id;
        return (
            <button
                onClick={() => toggleSection(id)}
                style={{
                    width: '100%',
                    padding: '16px',
                    background: 'var(--color-background-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    marginBottom: isExpanded ? 0 : '12px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '10px',
                        background: `${color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Icon size={18} color={color} />
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</span>
                    {badge && (
                        <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            background: `${color}15`,
                            color: color,
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}>
                            {badge}
                        </span>
                    )}
                </div>
                {isExpanded ? <ChevronUp size={18} color="var(--color-text-tertiary)" /> : <ChevronDown size={18} color="var(--color-text-tertiary)" />}
            </button>
        );
    };

    // Section Content Wrapper
    const SectionContent = ({ id, children }) => {
        if (expandedSection !== id) return null;
        return (
            <div style={{
                padding: '16px',
                background: 'var(--color-background-card)',
                border: '1px solid var(--color-border)',
                borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                marginBottom: '12px'
            }}>
                {children}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Loading employee history...
            </div>
        );
    }

    if (!employee) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Employee not found
            </div>
        );
    }

    const totalLoanTaken = loans.reduce((sum, l) => sum + (l.amount || 0), 0);
    const activeLoan = loans.find(l => l.status === 'active');

    const getInitials = (name) => {
        if (!name) return '';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <button
                    onClick={() => navigate('/employees')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-accent)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        marginBottom: '16px',
                        padding: 0
                    }}
                >
                    <ArrowLeft size={18} />
                    Back to Employees
                </button>

                {/* Employee Card */}
                <div style={{
                    padding: '20px',
                    background: 'var(--color-background-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: '14px',
                            background: 'var(--color-background-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '2px solid var(--color-border)',
                            backgroundImage: employee.image ? `url(${employee.image})` : 'none',
                            backgroundSize: 'cover'
                        }}>
                            {!employee.image && (
                                <span style={{ fontWeight: 600, fontSize: '1.4rem', color: 'var(--color-text-secondary)' }}>
                                    {getInitials(employee.name)}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                {employee.name}
                            </h2>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                                {employee.role}
                            </div>
                        </div>
                    </div>
                    <div style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        background: 'rgba(255, 59, 48, 0.1)',
                        color: 'var(--color-error)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                    }}>
                        Resigned
                    </div>
                </div>

                {/* Read-Only Notice */}
                <div style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    background: 'rgba(255, 149, 0, 0.1)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 149, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.85rem',
                    color: '#ff9500'
                }}>
                    <AlertCircle size={16} />
                    <span>This employee has resigned. All data is in <strong>read-only mode</strong> and cannot be edited.</span>
                </div>
            </div>

            {/* Personal Details Section */}
            <SectionHeader id="personal" icon={User} title="Personal Details" color="var(--color-accent)" />
            <SectionContent id="personal">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Name</div>
                        <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{employee.name}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Phone</div>
                        <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{employee.contact || '-'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Category</div>
                        <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{employee.category || '-'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Joining Date</div>
                        <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{formatDate(employee.joiningDate)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Resignation Date</div>
                        <div style={{ fontWeight: 500, color: 'var(--color-error)' }}>{formatDate(employee.resignationDate)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Last Working Day</div>
                        <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{formatDate(employee.lastWorkingDay)}</div>
                    </div>
                    {employee.address && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Address</div>
                            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{employee.address}</div>
                        </div>
                    )}
                </div>
            </SectionContent>

            {/* Payslip History Section */}
            <SectionHeader id="payslips" icon={FileText} title="Payslip History" badge={`${payslips.length} records`} color="#667eea" />
            <SectionContent id="payslips">
                {payslips.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '20px' }}>
                        No payslip records found
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {payslips.map((payslip, idx) => (
                            <div key={idx} style={{
                                padding: '12px 16px',
                                background: 'var(--color-background-subtle)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                        {payslip.periodStart} - {payslip.periodEnd}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        Net Pay: ₹{formatCurrency(payslip.netPay)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: payslip.status === 'Paid' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 149, 0, 0.1)',
                                        color: payslip.status === 'Paid' ? 'var(--color-success)' : '#ff9500',
                                        fontSize: '0.75rem',
                                        fontWeight: 500
                                    }}>
                                        {payslip.status || 'Pending'}
                                    </span>
                                    <button
                                        onClick={() => navigate(`/payslip/${payslip.id}`)}
                                        style={{
                                            padding: '6px 12px',
                                            background: 'var(--color-accent)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionContent>

            {/* Loan History Section */}
            <SectionHeader
                id="loans"
                icon={Banknote}
                title="Loan History"
                badge={activeLoan ? 'Active Loan' : 'No Active Loan'}
                color="#ff9500"
            />
            <SectionContent id="loans">
                <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                    <div style={{
                        flex: 1, padding: '16px',
                        background: 'var(--color-background-subtle)',
                        borderRadius: '10px', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Total Loan Taken</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ff9500' }}>₹{formatCurrency(totalLoanTaken)}</div>
                    </div>
                    <div style={{
                        flex: 1, padding: '16px',
                        background: 'var(--color-background-subtle)',
                        borderRadius: '10px', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Remaining Balance</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: activeLoan ? 'var(--color-error)' : 'var(--color-success)' }}>
                            ₹{formatCurrency(activeLoan?.remainingBalance || 0)}
                        </div>
                    </div>
                </div>
                {loans.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '10px' }}>
                        No loan records found
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {loans.map((loan, idx) => (
                            <div key={idx} style={{
                                padding: '12px 16px',
                                background: 'var(--color-background-subtle)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                        ₹{formatCurrency(loan.amount)}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        Issued: {formatDate(loan.date)}
                                    </div>
                                </div>
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: loan.status === 'active' ? 'rgba(255, 149, 0, 0.1)' : 'rgba(52, 199, 89, 0.1)',
                                    color: loan.status === 'active' ? '#ff9500' : 'var(--color-success)',
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                }}>
                                    {loan.status === 'active' ? 'Active' : 'Closed'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </SectionContent>

            {/* Advance Salary History Section */}
            <SectionHeader id="advances" icon={CreditCard} title="Advance Salary History" badge={`${advances.length} records`} color="#34c759" />
            <SectionContent id="advances">
                {advances.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '20px' }}>
                        No advance salary records found
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {advances.map((adv, idx) => (
                            <div key={idx} style={{
                                padding: '12px 16px',
                                background: 'var(--color-background-subtle)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                        ₹{formatCurrency(adv.amount)}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        {formatDate(adv.date)} {adv.reason && `• ${adv.reason}`}
                                    </div>
                                </div>
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: adv.settled ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 149, 0, 0.1)',
                                    color: adv.settled ? 'var(--color-success)' : '#ff9500',
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                }}>
                                    {adv.settled ? 'Settled' : 'Outstanding'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </SectionContent>

            {/* Bonus History Section */}
            <SectionHeader id="bonus" icon={Briefcase} title="Bonus History" color="#007aff" />
            <SectionContent id="bonus">
                {bonusHistory ? (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                            <div style={{
                                padding: '16px',
                                background: 'var(--color-background-subtle)',
                                borderRadius: '10px', textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Total Days Worked</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{bonusHistory.totalDays || 0}</div>
                            </div>
                            <div style={{
                                padding: '16px',
                                background: 'var(--color-background-subtle)',
                                borderRadius: '10px', textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Total Earned</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34c759' }}>₹{formatCurrency(bonusHistory.totalAccrued)}</div>
                            </div>
                            <div style={{
                                padding: '16px',
                                background: 'var(--color-background-subtle)',
                                borderRadius: '10px', textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Balance</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-accent)' }}>₹{formatCurrency(bonusHistory.balance)}</div>
                            </div>
                        </div>
                        {bonusHistory.withdrawals && bonusHistory.withdrawals.length > 0 && (
                            <>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Withdrawals</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {bonusHistory.withdrawals.map((w, idx) => (
                                        <div key={idx} style={{
                                            padding: '10px 14px',
                                            background: 'var(--color-background-subtle)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{formatDate(w.date)}</span>
                                            <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>-₹{formatCurrency(w.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '20px' }}>
                        No bonus records found
                    </div>
                )}
            </SectionContent>

            {/* Timesheet History Section */}
            <SectionHeader id="timesheet" icon={Clock} title="Timesheet History" badge={`${timesheets.length} entries`} color="#667eea" />
            <SectionContent id="timesheet">
                {timesheets.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '20px' }}>
                        No timesheet records found
                    </div>
                ) : (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-background-subtle)' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Date</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Clock In</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Clock Out</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timesheets.slice(0, 20).map((ts, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '10px', color: 'var(--color-text-primary)' }}>{formatDate(ts.date)}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', color: 'var(--color-text-primary)' }}>{ts.clockIn || '-'}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', color: 'var(--color-text-primary)' }}>{ts.clockOut || '-'}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 500, color: 'var(--color-accent)' }}>{ts.hoursWorked || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {timesheets.length > 20 && (
                            <div style={{ textAlign: 'center', padding: '12px', color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
                                Showing 20 of {timesheets.length} entries
                            </div>
                        )}
                    </div>
                )}
            </SectionContent>
        </div>
    );
};

export default ResignedEmployeeHistory;
