import React, { useState } from 'react';
import { X, User, Clock, Plus } from 'lucide-react';
import TimesheetModal from './TimesheetModal';

const AttendanceModal = ({ isOpen, onClose, attendance, onRefresh }) => {
    const [filter, setFilter] = useState('all'); // all, working, notWorking
    const [timesheetModal, setTimesheetModal] = useState({ isOpen: false, employee: null });

    if (!isOpen || !attendance) return null;

    const openTimesheetForEmployee = (emp, hasEntry = false) => {
        setTimesheetModal({
            isOpen: true,
            employee: {
                id: emp.employeeId,
                name: emp.employeeName,
                image: emp.employeeImage
            },
            prefilledDate: hasEntry ? null : attendance.date
        });
    };

    const handleTimesheetSave = () => {
        onRefresh();
        setTimesheetModal({ isOpen: false, employee: null });
    };

    const getFilteredData = () => {
        if (filter === 'working') return { working: attendance.working, notWorking: [] };
        if (filter === 'notWorking') return { working: [], notWorking: attendance.notWorking };
        return { working: attendance.working, notWorking: attendance.notWorking };
    };

    const filtered = getFilteredData();

    return (
        <>
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
                    maxWidth: '800px',
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
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                                Today's Attendance
                            </h2>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                {attendance.dayOfWeek}, {new Date(attendance.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
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

                    {/* Filter Tabs */}
                    <div style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        gap: '8px'
                    }}>
                        {[
                            { key: 'all', label: 'All Employees' },
                            { key: 'working', label: 'Working Today' },
                            { key: 'notWorking', label: 'Not Working Today' }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    background: filter === tab.key ? 'var(--color-accent)' : 'transparent',
                                    color: filter === tab.key ? 'white' : 'var(--color-text-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    if (filter !== tab.key) {
                                        e.currentTarget.style.background = 'var(--color-background-subtle)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (filter !== tab.key) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Employee Lists */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                        {/* Working Today */}
                        {filtered.working.length > 0 && (
                            <div style={{ marginBottom: filtered.notWorking.length > 0 ? '32px' : '0' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: 'var(--color-success)'
                                    }} />
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                                        WORKING TODAY ({filtered.working.length})
                                    </h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {filtered.working.map(emp => (
                                        <div key={emp.employeeId} style={{
                                            padding: '16px',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: '8px',
                                                    background: 'var(--color-background-subtle)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--color-text-secondary)',
                                                    backgroundImage: emp.employeeImage ? `url(${emp.employeeImage})` : 'none',
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    overflow: 'hidden'
                                                }}>
                                                    {!emp.employeeImage && <User size={20} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                                                        {emp.employeeName}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        color: 'var(--color-text-secondary)',
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        In: {emp.clockIn} | Out: {emp.clockOut || '--:--'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => openTimesheetForEmployee(emp, true)}
                                                style={{
                                                    padding: '6px 12px',
                                                    border: '1px solid var(--color-border)',
                                                    background: 'white',
                                                    borderRadius: 'var(--radius-sm)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 500,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <Clock size={14} />
                                                Timesheet
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Not Working Today */}
                        {filtered.notWorking.length > 0 && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: 'var(--color-error)'
                                    }} />
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                                        NOT WORKING TODAY ({filtered.notWorking.length})
                                    </h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {filtered.notWorking.map(emp => (
                                        <div key={emp.employeeId} style={{
                                            padding: '16px',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: '8px',
                                                    background: 'var(--color-background-subtle)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--color-text-secondary)',
                                                    backgroundImage: emp.employeeImage ? `url(${emp.employeeImage})` : 'none',
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    overflow: 'hidden'
                                                }}>
                                                    {!emp.employeeImage && <User size={20} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                                                        {emp.employeeName}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        color: 'var(--color-text-secondary)'
                                                    }}>
                                                        No entry for today
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => openTimesheetForEmployee(emp, false)}
                                                style={{
                                                    padding: '6px 12px',
                                                    border: 'none',
                                                    background: 'var(--color-accent)',
                                                    color: 'white',
                                                    borderRadius: 'var(--radius-sm)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 500,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <Plus size={14} />
                                                Add Today's Entry
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {filtered.working.length === 0 && filtered.notWorking.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: 'var(--color-text-secondary)'
                            }}>
                                No employees to display
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Timesheet Modal */}
            {timesheetModal.isOpen && (
                <TimesheetModal
                    isOpen={timesheetModal.isOpen}
                    onClose={() => setTimesheetModal({ isOpen: false, employee: null })}
                    employee={timesheetModal.employee}
                    periodStart={attendance.date}
                    periodEnd={attendance.date}
                    prefilledDate={timesheetModal.prefilledDate}
                    onSave={handleTimesheetSave}
                />
            )}
        </>
    );
};

export default AttendanceModal;
