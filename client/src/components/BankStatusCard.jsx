import React, { useState, useEffect } from 'react';
import { Landmark, AlertTriangle, MapPin, ExternalLink, Clock, Calendar, Settings } from 'lucide-react';
import Card from './Card';

const BankStatusCard = ({ daysUntilPayday }) => {
    // Admin Config State (Simulated)
    const [config, setConfig] = useState({
        openTime: 10, // 10 AM
        closeTime: 16, // 4 PM
        observeSatHoliday: true, // 2nd & 4th Sat
        branchName: "BOB Madhi",
        branchDetails: "Madhi, Dist Surat",
        ifsc: "BARB0MADHIX",
        mapLink: "https://maps.google.com/?q=Bank+of+Baroda+Madhi"
    });

    const [status, setStatus] = useState({
        today: { isOpen: false, text: '', timeText: '', color: '' },
        tomorrow: { isOpen: false, text: '', timeText: '' },
        showBanner: false
    });

    // Helper: Format Time 12h
    const formatTime12h = (hour) => {
        const h = hour % 12 || 12;
        const ampm = hour < 12 ? 'AM' : 'PM';
        return `${String(h).padStart(2, '0')}:00 ${ampm}`;
    };

    // Helper: Check Day Status
    const getDayStatus = (date) => {
        const day = date.getDay(); // 0 = Sun
        const d = date.getDate();

        // Sunday
        if (day === 0) return { isOpen: false, reason: 'Sunday' };

        // Saturday Logic
        if (day === 6 && config.observeSatHoliday) {
            const weekNum = Math.ceil(d / 7);
            if (weekNum === 2 || weekNum === 4) {
                return { isOpen: false, reason: '2nd/4th Saturday' };
            }
        }

        return { isOpen: true, openTime: config.openTime, closeTime: config.closeTime };
    };

    // Helper: Find Next Open Day
    const getNextOpenDay = (startDate) => {
        const maxDays = 14; // Check up to 2 weeks ahead
        for (let i = 1; i <= maxDays; i++) {
            const checkDate = new Date(startDate);
            checkDate.setDate(startDate.getDate() + i);
            const dayInfo = getDayStatus(checkDate);
            if (dayInfo.isOpen) {
                const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
                return {
                    dayName,
                    date: checkDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                    openTime: dayInfo.openTime
                };
            }
        }
        return null; // No open day found in next 2 weeks
    };

    useEffect(() => {
        const calculate = () => {
            const now = new Date();
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            // Today Analysis
            const todayInfo = getDayStatus(today);
            let todayRes = { isOpen: false, text: 'Closed', timeText: '', color: 'var(--color-error)' };

            if (todayInfo.isOpen) {
                const currentHour = now.getHours();
                if (currentHour < todayInfo.openTime) {
                    todayRes = {
                        isOpen: false,
                        text: 'Closed',
                        timeText: `Opens ${formatTime12h(todayInfo.openTime)}`,
                        color: 'var(--color-text-secondary)'
                    };
                } else if (currentHour >= todayInfo.openTime && currentHour < todayInfo.closeTime) {
                    todayRes = {
                        isOpen: true,
                        text: 'Open',
                        timeText: `Closes ${formatTime12h(todayInfo.closeTime)}`,
                        color: 'var(--color-success)'
                    };
                } else {
                    // After closing - check if tomorrow is open
                    const tmrwCheck = getDayStatus(tomorrow);
                    if (tmrwCheck.isOpen) {
                        todayRes = {
                            isOpen: false,
                            text: 'Closed',
                            timeText: `Opens Tomorrow ${formatTime12h(tmrwCheck.openTime)}`,
                            color: 'var(--color-text-secondary)'
                        };
                    } else {
                        // Tomorrow closed - find next open day
                        const nextOpen = getNextOpenDay(today);
                        todayRes = {
                            isOpen: false,
                            text: 'Closed',
                            timeText: nextOpen
                                ? `Opens ${nextOpen.dayName} ${formatTime12h(nextOpen.openTime)}`
                                : 'Closed Extended Period',
                            color: 'var(--color-text-secondary)'
                        };
                    }
                }
            } else {
                todayRes = { isOpen: false, text: 'Closed', timeText: todayInfo.reason, color: 'var(--color-error)' };
            }

            // Tomorrow Analysis - or Next Open
            const tmrwInfo = getDayStatus(tomorrow);
            let tomorrowDisplay;

            if (tmrwInfo.isOpen) {
                // Tomorrow is open - show normal tomorrow info
                tomorrowDisplay = {
                    label: `Tomorrow, ${tomorrow.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
                    isOpen: true,
                    text: 'Open',
                    timeText: `${formatTime12h(tmrwInfo.openTime)} - ${formatTime12h(tmrwInfo.closeTime)}`
                };
            } else {
                // Tomorrow is closed - find and show next open day
                const nextOpen = getNextOpenDay(today);
                if (nextOpen) {
                    tomorrowDisplay = {
                        label: `Next Open`,
                        isOpen: false,
                        text: `${nextOpen.dayName}`,
                        timeText: formatTime12h(nextOpen.openTime)
                    };
                } else {
                    tomorrowDisplay = {
                        label: 'Next Open',
                        isOpen: false,
                        text: 'Unknown',
                        timeText: 'Check schedule'
                    };
                }
            }

            // Recommendation Banner
            // Show if Tomorrow Closed AND Payday is soon (0-2 days)
            const showBanner = !tmrwInfo.isOpen && daysUntilPayday <= 2 && daysUntilPayday >= 0;

            setStatus({
                today: todayRes,
                tomorrow: tomorrowDisplay,
                showBanner
            });
        };

        calculate();
        const interval = setInterval(calculate, 60000);
        return () => clearInterval(interval);
    }, [daysUntilPayday, config]);

    return (
        <Card title="Bank Status" style={{ minHeight: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--spacing-md)' }}>

                {/* Header / Branch Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{config.branchName}</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            IFSC: {config.ifsc}
                        </p>
                    </div>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(255, 149, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Landmark size={16} color="var(--color-warning)" />
                    </div>
                </div>

                {/* Today Status (Prominent) */}
                <div style={{
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Today, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: status.today.color }}>
                            {status.today.text}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <Clock size={14} color="var(--color-text-tertiary)" style={{ marginBottom: 4, display: 'inline-block' }} />
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{status.today.timeText.replace("Opens ", "").replace("Closes ", "")}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{status.today.timeText.split(" ")[0]}</div>
                    </div>
                </div>

                {/* Tomorrow Status or Next Open */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0 4px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                        {status.tomorrow.label}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 500, color: status.tomorrow.isOpen ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
                            {status.tomorrow.text}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                            {status.tomorrow.timeText}
                        </span>
                    </div>
                </div>

                {/* Recommendation Banner */}
                {status.showBanner && (
                    <div style={{
                        marginTop: 'auto',
                        padding: 'var(--spacing-sm)',
                        background: 'rgba(255, 59, 48, 0.1)',
                        border: '1px solid rgba(255, 59, 48, 0.2)',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <AlertTriangle size={16} color="var(--color-error)" style={{ flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-error)', fontWeight: 500, lineHeight: 1.3 }}>
                                Bank closed tomorrow — withdraw salary cash today.
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer / Address */}
                <div style={{
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 'var(--spacing-sm)',
                    marginTop: 'auto', // Pushes to bottom if height expands
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                }}>
                    <MapPin size={12} color="var(--color-text-tertiary)" />
                    <a
                        href={config.mapLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-secondary)',
                            textDecoration: 'none',
                            flex: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {config.branchDetails}
                    </a>
                    <ExternalLink size={12} color="var(--color-text-tertiary)" />
                </div>

            </div>
        </Card>
    );
};

export default BankStatusCard;
