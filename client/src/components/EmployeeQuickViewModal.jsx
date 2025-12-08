import React, { useState, useEffect } from 'react';
import {
    X, User, Phone, MapPin, Calendar, Clock, Banknote,
    ChevronDown, ChevronUp, Edit2, FileText, CreditCard,
    DollarSign, Briefcase, Building, AlertCircle, TrendingUp
} from 'lucide-react';

const EmployeeQuickViewModal = ({
    isOpen,
    onClose,
    employee,
    bonusBalance,
    getSalaryDetails,
    onEdit,
    onViewPayslip,
    onAddLoan,
    onWithdrawBonus
}) => {
    const [loanInfo, setLoanInfo] = useState(null);
    const [loadingLoan, setLoadingLoan] = useState(false);
    const [expandedSection, setExpandedSection] = useState(null);

    useEffect(() => {
        if (isOpen && employee?.id) {
            fetchLoanInfo();
            setExpandedSection(null);
        } else {
            setLoanInfo(null);
        }
    }, [isOpen, employee?.id]);

    const fetchLoanInfo = async () => {
        setLoadingLoan(true);
        try {
            const res = await fetch(`/api/loans?employeeId=${employee.id}`);
            if (res.ok) {
                const loans = await res.json();
                const activeLoan = loans.find(l => l.status === 'active');
                setLoanInfo(activeLoan || null);
            }
        } catch (err) {
            console.error('Error fetching loan info:', err);
        } finally {
            setLoadingLoan(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    if (!isOpen || !employee) return null;

    const details = getSalaryDetails ? getSalaryDetails(employee) : {};

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount || 0);
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '-';
        const [h, m] = timeStr.split(':');
        const d = new Date(2000, 0, 1, h, m);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Handle action button clicks
    const handleEdit = () => {
        onClose();
        if (onEdit) onEdit(employee);
    };

    const handleViewPayslip = () => {
        onClose();
        if (onViewPayslip) onViewPayslip(employee);
    };

    const handleAddLoan = () => {
        onClose();
        if (onAddLoan) onAddLoan(employee);
    };

    const handleWithdrawBonus = () => {
        onClose();
        if (onWithdrawBonus) onWithdrawBonus(employee);
    };

    // Compact stat card component
    const StatCard = ({ icon: Icon, label, value, color = 'var(--color-accent)', highlight = false }) => (
        <div style={{
            padding: '12px',
            background: highlight ? `${color}10` : 'var(--color-background-card)',
            borderRadius: '10px',
            border: `1px solid ${highlight ? `${color}30` : 'var(--color-border)'}`,
            flex: 1,
            minWidth: 0
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Icon size={12} color={color} />
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</span>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: highlight ? color : 'var(--color-text-primary)' }}>{value}</div>
        </div>
    );

    // Expandable section component
    const ExpandableSection = ({ id, icon: Icon, title, summary, children }) => {
        const isExpanded = expandedSection === id;
        return (
            <div style={{
                background: 'var(--color-background-card)',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                overflow: 'hidden'
            }}>
                <button
                    onClick={() => toggleSection(id)}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon size={14} color="var(--color-accent)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{title}</span>
                        {summary && !isExpanded && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>{summary}</span>
                        )}
                    </div>
                    {isExpanded ? <ChevronUp size={14} color="var(--color-text-tertiary)" /> : <ChevronDown size={14} color="var(--color-text-tertiary)" />}
                </button>
                {isExpanded && (
                    <div style={{ padding: '0 12px 12px 12px', borderTop: '1px solid var(--color-border)' }}>
                        {children}
                    </div>
                )}
            </div>
        );
    };

    // Action button component
    const ActionButton = ({ icon: Icon, title, onClick, color = 'var(--color-accent)', disabled = false }) => (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-background-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                color: color,
                opacity: disabled ? 0.5 : 1
            }}
            onMouseOver={e => {
                if (!disabled) {
                    e.currentTarget.style.background = `${color}10`;
                    e.currentTarget.style.borderColor = `${color}40`;
                }
            }}
            onMouseOut={e => {
                e.currentTarget.style.background = 'var(--color-background-card)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
        >
            <Icon size={16} />
        </button>
    );

    const getInitials = (name) => {
        if (!name) return '';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
        }}>
            <div style={{
                background: 'var(--color-background-subtle)',
                borderRadius: '16px',
                width: '480px',
                maxHeight: '85vh',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                animation: 'modalSlide 0.25s ease'
            }}>
                <style>{`
                    @keyframes modalSlide {
                        from { transform: scale(0.95); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                `}</style>

                {/* Compact Header */}
                <div style={{
                    padding: '16px',
                    background: 'var(--color-background-card)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            background: 'var(--color-background-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '2px solid var(--color-border)',
                            backgroundImage: employee.image ? `url(${employee.image})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            flexShrink: 0
                        }}>
                            {!employee.image && (
                                <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
                                    {getInitials(employee.name)}
                                </span>
                            )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {employee.name}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{employee.role}</span>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    background: employee.status === 'Active' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                    color: employee.status === 'Active' ? 'var(--color-success)' : 'var(--color-error)',
                                    fontSize: '0.65rem',
                                    fontWeight: 500
                                }}>
                                    {employee.status || 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: 'var(--color-background-subtle)',
                            borderRadius: '8px',
                            width: 28,
                            height: 28,
                            cursor: 'pointer',
                            color: 'var(--color-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '12px', overflowY: 'auto', maxHeight: 'calc(85vh - 130px)' }}>

                    {/* Quick Stats Row - 4 columns */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <StatCard icon={DollarSign} label="Per Day" value={`₹${details.perShift || '0'}`} color="var(--color-accent)" />
                        <StatCard icon={TrendingUp} label="Bonus" value={`₹${formatCurrency(bonusBalance)}`} color="#34c759" highlight={bonusBalance > 0} />
                        <StatCard icon={Banknote} label="Loan" value={loadingLoan ? '...' : loanInfo ? `₹${formatCurrency(loanInfo.amount)}` : 'None'} color="#ff9500" highlight={!!loanInfo} />
                        <StatCard icon={Clock} label="Rate" value={`₹${details.rate || '0'}/hr`} color="#667eea" />
                    </div>

                    {/* Two Column Layout for Key Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        {/* Shift Info Card */}
                        <div style={{
                            padding: '12px',
                            background: 'var(--color-background-card)',
                            borderRadius: '10px',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <Clock size={12} color="var(--color-accent)" />
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 500 }}>Shift</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                {formatTime(employee.shiftStart)} - {formatTime(employee.shiftEnd)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                {details.duration || '-'} ({details.billable || '-'} billable)
                            </div>
                        </div>

                        {/* Contact Card */}
                        <div style={{
                            padding: '12px',
                            background: 'var(--color-background-card)',
                            borderRadius: '10px',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <Phone size={12} color="var(--color-accent)" />
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 500 }}>Contact</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                {employee.contact || '-'}
                            </div>
                            {employee.category && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                    {employee.category}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expandable Sections */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>

                        {/* Loan Section */}
                        {loanInfo && (
                            <ExpandableSection
                                id="loan"
                                icon={Banknote}
                                title="Active Loan"
                                summary={`₹${formatCurrency(loanInfo.amount)}`}
                            >
                                <div style={{ paddingTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Amount</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ff9500' }}>₹{formatCurrency(loanInfo.amount)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Issued On</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{formatDate(loanInfo.date)}</span>
                                    </div>
                                </div>
                            </ExpandableSection>
                        )}

                        {/* Bonus Section */}
                        <ExpandableSection
                            id="bonus"
                            icon={Briefcase}
                            title="Bonus Balance"
                            summary={`₹${formatCurrency(bonusBalance)}`}
                        >
                            <div style={{ paddingTop: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Available Balance</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34c759' }}>₹{formatCurrency(bonusBalance)}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                    Accumulated from attendance days
                                </div>
                            </div>
                        </ExpandableSection>

                        {/* Personal Details Section */}
                        <ExpandableSection id="personal" icon={User} title="Personal Details">
                            <div style={{ paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>Birthday</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{formatDate(employee.birthday)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>Age</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                        {employee.birthday ? `${Math.floor((new Date() - new Date(employee.birthday).getTime()) / 3.15576e+10)} years` : '-'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>Category</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{employee.category || '-'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>Pay Type</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{employee.payType || 'Hourly'}</div>
                                </div>
                                {employee.address && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>Address</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{employee.address}</div>
                                    </div>
                                )}
                            </div>
                        </ExpandableSection>

                        {/* Emergency Contact */}
                        {(employee.emergencyName || employee.emergencyPhone) && (
                            <ExpandableSection id="emergency" icon={AlertCircle} title="Emergency Contact">
                                <div style={{ paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{employee.emergencyName || '-'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{employee.emergencyPhone || '-'}</div>
                                    </div>
                                    {employee.emergencyPhone && (
                                        <a
                                            href={`tel:${employee.emergencyPhone}`}
                                            style={{
                                                padding: '6px 12px',
                                                background: 'rgba(255, 59, 48, 0.1)',
                                                borderRadius: '6px',
                                                color: 'var(--color-error)',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                textDecoration: 'none'
                                            }}
                                        >
                                            Call
                                        </a>
                                    )}
                                </div>
                            </ExpandableSection>
                        )}
                    </div>

                    {/* Action Buttons Row */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center',
                        padding: '12px',
                        background: 'var(--color-background-card)',
                        borderRadius: '10px',
                        border: '1px solid var(--color-border)'
                    }}>
                        <ActionButton
                            icon={Edit2}
                            title="Edit Employee"
                            color="var(--color-accent)"
                            onClick={handleEdit}
                        />
                        <ActionButton
                            icon={FileText}
                            title="View Payslip"
                            color="#667eea"
                            onClick={handleViewPayslip}
                        />
                        <ActionButton
                            icon={Banknote}
                            title="Add/Edit Loan"
                            color="#ff9500"
                            onClick={handleAddLoan}
                        />
                        <ActionButton
                            icon={Briefcase}
                            title="Withdraw Bonus"
                            color="#007aff"
                            onClick={handleWithdrawBonus}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeQuickViewModal;
