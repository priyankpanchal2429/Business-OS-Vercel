import React, { useState, useEffect } from 'react';
import { User, Clock } from 'lucide-react';
import Card from './Card';

const AttendanceCard = () => {
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAttendance = async () => {
        try {
            // Add cache busting to ensure we always get the latest data
            const res = await fetch(`/api/attendance/today?t=${Date.now()}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const data = await res.json();
            setAttendance(data);
        } catch (err) {
            console.error('Failed to fetch attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();

        // Auto-refresh every 5 seconds for near real-time updates
        const interval = setInterval(fetchAttendance, 5000);

        // Also refresh when page gains focus (user returns from Payroll)
        const handleFocus = () => fetchAttendance();
        window.addEventListener('focus', handleFocus);

        // Listen for timesheet update events from other components
        const handleTimesheetUpdate = () => {
            console.log('AttandanceCard: Received timesheet update event, refreshing...');
            fetchAttendance();
        };
        window.addEventListener('timesheetUpdated', handleTimesheetUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('timesheetUpdated', handleTimesheetUpdate);
        };
    }, []);

    if (loading) {
        return (
            <Card title="Today's Attendance">
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    Loading...
                </div>
            </Card>
        );
    }

    if (!attendance) {
        return null;
    }

    const formattedDate = new Date(attendance.date).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    // Combine all employees for display
    const allEmployees = [...attendance.working, ...attendance.notWorking];

    const getInitials = (name) => {
        if (!name) return '';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', fontWeight: 500, margin: '0 0 4px 0' }}>Today's Attendance</h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{formattedDate}</div>
                </div>

                {!attendance.isClosed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', fontSize: '0.8rem', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)' }} />
                            Working: {attendance.summary.working}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-error)' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-error)' }} />
                            Not Working: {attendance.summary.notWorking}
                        </div>
                    </div>
                )}
            </div>

            <div style={{ paddingTop: '0px' }}>
                {attendance.isClosed ? (
                    /* Sunday - Closed */
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                            marginBottom: '8px'
                        }}>
                            Sunday — Closed
                        </div>
                        <div style={{
                            fontSize: '0.85rem',
                            color: 'var(--color-text-secondary)'
                        }}>
                            No operations on Sundays
                        </div>
                    </div>
                ) : (
                    /* Working Day - Employee Cards */
                    <>


                        {/* Employee Cards Grid */}
                        {allEmployees.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: 'var(--color-text-secondary)'
                            }}>
                                No employees found
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))',
                                gap: '16px'
                            }}>
                                {allEmployees.map(emp => {
                                    const isWorking = emp.status === 'working';

                                    return (
                                        <div key={emp.employeeId} style={{
                                            background: 'white',
                                            border: isWorking ? '1px solid var(--color-success)' : '1px solid var(--color-error)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        }}>
                                            {/* Profile Picture */}
                                            <div style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '8px',
                                                background: 'var(--color-background-subtle)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--color-text-secondary)',
                                                backgroundImage: emp.employeeImage ? `url(${emp.employeeImage})` : 'none',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                overflow: 'hidden',
                                                flexShrink: 0
                                            }}>
                                                {!emp.employeeImage && (
                                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                                        {getInitials(emp.employeeName)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Employee Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {/* Name */}
                                                <div style={{
                                                    fontWeight: 500,
                                                    fontSize: '0.95rem',
                                                    marginBottom: '6px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {emp.employeeName}
                                                </div>

                                                {/* Status Badge */}
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '4px 10px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: isWorking ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    marginBottom: isWorking ? '6px' : '0'
                                                }}>
                                                    <div style={{
                                                        width: '6px',
                                                        height: '6px',
                                                        borderRadius: '50%',
                                                        background: isWorking ? 'var(--color-success)' : 'var(--color-error)'
                                                    }} />
                                                    {isWorking ? 'Working Today' : 'Not Working'}
                                                </div>

                                                {/* Clock Times */}
                                                {isWorking && (
                                                    <div style={{
                                                        fontSize: '0.8rem',
                                                        color: 'var(--color-text-secondary)',
                                                        fontFamily: 'monospace',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <Clock size={12} />
                                                        {(() => {
                                                            const formatTime = (timeStr) => {
                                                                if (!timeStr) return '--:--';
                                                                const [hours, minutes] = timeStr.split(':');
                                                                const h = parseInt(hours, 10);
                                                                const ampm = h >= 12 ? 'PM' : 'AM';
                                                                const h12 = h % 12 || 12;
                                                                return `${h12}:${minutes} ${ampm}`;
                                                            };
                                                            return `${formatTime(emp.clockIn)} - ${formatTime(emp.clockOut)}`;
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
};

export default AttendanceCard;
