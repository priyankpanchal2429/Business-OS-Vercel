import React, { useState, useEffect } from 'react';
import { Landmark, Clock, MapPin, AlertTriangle, ExternalLink } from 'lucide-react';
import Card from './Card';

const BankStatusWidget = ({ daysUntilPayday }) => {
    // Branch Config
    const SHOP_OPEN_TIME = 10; // 10 AM
    const SHOP_CLOSE_TIME = 16; // 4 PM

    const [status, setStatus] = useState({
        today: { isOpen: false, text: '', timeText: '' },
        tomorrow: { isOpen: false, text: '', timeText: '' },
        recommendation: null
    });

    // Helper: Format Time 12h
    const formatTime12h = (hour) => {
        const h = hour % 12 || 12;
        const ampm = hour < 12 ? 'AM' : 'PM';
        return `${String(h).padStart(2, '0')}:00 ${ampm}`;
    };

    // Helper: Check if specific date is a working day
    const getDayStatus = (date) => {
        const day = date.getDay(); // 0 = Sun, 6 = Sat
        const d = date.getDate();

        // Sunday is always closed
        if (day === 0) return { isOpen: false, reason: 'Sunday' };

        // Saturday Logic
        if (day === 6) {
            // Calculate which Saturday of the month it is
            // Math.ceil(d / 7) gives 1, 2, 3, 4, 5
            const weekNum = Math.ceil(d / 7);
            if (weekNum === 2 || weekNum === 4) {
                return { isOpen: false, reason: 'Bank Holiday (Saturday)' };
            }
        }

        // Default Working Day
        return { isOpen: true, openTime: SHOP_OPEN_TIME, closeTime: SHOP_CLOSE_TIME };
    };

    useEffect(() => {
        const calculateStatus = () => {
            const now = new Date();
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            // --- Analyze Today ---
            const todayInfo = getDayStatus(today);
            let todayStatus = { isOpen: false, text: 'Closed', timeText: '', color: 'var(--color-error)' };

            if (todayInfo.isOpen) {
                const currentHour = now.getHours();
                // Check hours
                if (currentHour < todayInfo.openTime) {
                    todayStatus = {
                        isOpen: false,
                        text: 'Closed',
                        timeText: `Opens at ${formatTime12h(todayInfo.openTime)}`,
                        color: 'var(--color-text-secondary)'
                    };
                } else if (currentHour >= todayInfo.openTime && currentHour < todayInfo.closeTime) {
                    todayStatus = {
                        isOpen: true,
                        text: 'Open',
                        timeText: `Closes at ${formatTime12h(todayInfo.closeTime)}`,
                        color: 'var(--color-success)'
                    };
                } else {
                    todayStatus = {
                        isOpen: false,
                        text: 'Closed',
                        timeText: 'Opens Tomorrow', // Simplified (technically need to check if tmrw is open)
                        color: 'var(--color-text-secondary)'
                    };
                }
            } else {
                todayStatus = { isOpen: false, text: 'Closed', timeText: todayInfo.reason, color: 'var(--color-error)' };
            }

            // --- Analyze Tomorrow ---
            const tmrwInfo = getDayStatus(tomorrow);
            let tmrwStatusText = tmrwInfo.isOpen
                ? `Open ${formatTime12h(tmrwInfo.openTime)} - ${formatTime12h(tmrwInfo.closeTime)}`
                : `Closed (${tmrwInfo.reason})`;

            // --- Recommendation Logic ---
            // If Tomorrow is Closed AND Payday is within 2 days (i.e. <= 2)
            let rec = null;
            if (!tmrwInfo.isOpen && daysUntilPayday <= 2 && daysUntilPayday >= 0) {
                rec = "Bank closed tomorrow — withdraw salary cash today.";
            }

            setStatus({
                today: todayStatus,
                tomorrow: { isOpen: tmrwInfo.isOpen, text: tmrwStatusText },
                recommendation: rec
            });
        };

        calculateStatus();
        const timer = setInterval(calculateStatus, 60000); // Update every minute
        return () => clearInterval(timer);
    }, [daysUntilPayday]);

    return (
        <Card title="Bank Status">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {/* Header Info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>BOB Madhi</h4>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>IFSC: BARB0MADHIX</p>
                    </div>
                    <div style={{ padding: 8, borderRadius: '50%', background: 'rgba(255, 149, 0, 0.1)', color: 'var(--color-warning)' }}>
                        <Landmark size={20} />
                    </div>
                </div>

                {/* Today Status */}
                <div style={{ padding: 'var(--spacing-sm)', background: 'var(--color-background-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block' }}>Today</span>
                        <span style={{ fontWeight: 600, color: status.today.color }}>{status.today.text}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{status.today.timeText}</span>
                </div>

                {/* Tomorrow Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Tomorrow</span>
                    <span>{status.tomorrow.text}</span>
                </div>

                {/* Recommendation Banner */}
                {status.recommendation && (
                    <div style={{
                        marginTop: 'var(--spacing-xs)',
                        padding: 'var(--spacing-sm)',
                        background: 'rgba(255, 59, 48, 0.1)',
                        border: '1px solid rgba(255, 59, 48, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                    }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <AlertTriangle size={16} color="var(--color-error)" style={{ flexShrink: 0, marginTop: 2 }} />
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-error)', fontWeight: 500 }}>
                                {status.recommendation}
                            </p>
                        </div>
                        <button style={{
                            alignSelf: 'flex-end',
                            background: 'var(--color-error)',
                            color: 'white',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}>
                            Plan Withdrawal
                        </button>
                    </div>
                )}

                {/* Footer Link */}
                <div style={{ paddingTop: 'var(--spacing-xs)', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={12} color="var(--color-text-secondary)" />
                    <a
                        href="https://maps.google.com/?q=Bank+of+Baroda+Madhi"
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textDecoration: 'none', flex: 1 }}
                    >
                        Madhi, Dist Surat, Gujarat
                    </a>
                    <ExternalLink size={12} color="var(--color-text-secondary)" />
                </div>
            </div>
        </Card>
    );
};

export default BankStatusWidget;
