import React, { useState, useEffect } from 'react';
import { Cake, Gift, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const BirthdayCard = ({ employees = [] }) => {
    const { addToast } = useToast();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const [celebrants, setCelebrants] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [showWishModal, setShowWishModal] = useState(false);
    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
        checkBirthdays();
    }, [employees]);

    const checkBirthdays = async () => {
        if (!employees.length) return;

        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();

        const todaysCelebrants = employees.filter(emp => {
            if (!emp.birthday || emp.status !== 'Active') return false;
            const d = new Date(emp.birthday);
            const isMatch = (d.getMonth() + 1) === currentMonth && d.getDate() === currentDay;
            if (emp.name.includes("Hitesh")) console.log("Checking Hitesh:", d.getMonth() + 1, d.getDate(), "vs", currentMonth, currentDay, "Match:", isMatch);
            return isMatch;
        });

        console.log("Celebrants found:", todaysCelebrants);

        if (todaysCelebrants.length > 0) {
            setCelebrants(todaysCelebrants);
            setIsVisible(true);

            // Log view
            fetch(`${API_URL}/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'BIRTHDAY_CARD_SHOWN',
                    details: `Shown for: ${todaysCelebrants.map(c => c.name).join(', ')}`
                })
            });
        } else {
            setIsVisible(false);
        }
    };

    const handleDismiss = (e) => {
        e.stopPropagation();
        // Only hide temporarily - will show again on page refresh
        setIsVisible(false);
    };

    const handleSendWish = async (message) => {
        try {
            await fetch(`${API_URL}/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'BIRTHDAY_WISH_SENT',
                    details: `Wish sent to ${celebrants.map(c => c.name).join(', ')}: "${message}"`
                })
            });
            setShowWishModal(false);
            addToast('Birthday wishes sent successfully! 🎈', 'success');
        } catch (err) {
            addToast('Failed to send wishes', 'error');
        }
    };

    if (!isVisible || celebrants.length === 0) return null;

    const person = celebrants[0]; // Show first person for now (or carousel if multiple)

    return (
        <div
            style={{ position: 'relative', zIndex: 10 }}
            className="birthday-card-container"
        >
            {/* Balloons Animation - Multi-color via hue-rotate */}
            <div className="balloons-container">
                <div className="balloon" style={{ left: '5%', animationDelay: '0s', filter: 'hue-rotate(0deg)' }}>🎈</div>
                <div className="balloon" style={{ left: '25%', animationDelay: '2s', filter: 'hue-rotate(90deg)' }}>🎈</div>
                <div className="balloon" style={{ left: '50%', animationDelay: '1s', fontSize: '2rem', filter: 'hue-rotate(180deg)' }}>🎈</div>
                <div className="balloon" style={{ left: '75%', animationDelay: '3s', filter: 'hue-rotate(270deg)' }}>🎈</div>
                <div className="balloon" style={{ left: '90%', animationDelay: '1.5s', filter: 'hue-rotate(45deg)' }}>🎈</div>
            </div>

            <div
                className="birthday-banner-card"
                style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #edf4ff 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 20px rgba(0, 113, 227, 0.08)',
                    display: 'flex',
                    flexDirection: 'row', // Left aligned
                    alignItems: 'center',
                    gap: '24px',
                    textAlign: 'left',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <button
                    onClick={handleDismiss}
                    style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', zIndex: 10 }}
                >
                    <X size={18} />
                </button>

                {/* Big Profile Image (Square-ish) */}
                <div style={{
                    minWidth: '100px', width: '100px', height: '100px',
                    borderRadius: '12px',
                    border: '3px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#f0f0f0',
                    zIndex: 5
                }}>
                    <div style={{
                        width: '100%', height: '100%',
                        backgroundImage: person.image ? `url(${person.image})` : 'none',
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {!person.image && <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#ccc' }}>{person.name.charAt(0)}</span>}
                    </div>
                </div>

                <div style={{ flex: 1, zIndex: 5 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700, color: '#333' }}>
                        Happy Birthday, {person.name.split(' ')[0]}! 🎂
                    </h3>
                    <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#666' }}>
                        {person.role} • Turning {new Date().getFullYear() - new Date(person.birthday).getFullYear()}
                    </p>

                    <button
                        onClick={() => setShowWishModal(true)}
                        style={{
                            background: 'var(--color-accent)', color: 'white', border: 'none', padding: '10px 24px',
                            borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 12px rgba(0, 113, 227, 0.25)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <Gift size={18} /> Send Wishes
                    </button>
                </div>
            </div>

            {/* Modal */}
            {showWishModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '300px', maxWidth: '90%', animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                        <h4 style={{ margin: '0 0 16px', textAlign: 'center' }}>Send a Wish 💌</h4>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {['Happy Birthday! 🎉', 'Have a great day! 🌟', 'Best wishes! 🎂'].map((msg, i) => (
                                <button
                                    key={i} onClick={() => handleSendWish(msg)}
                                    style={{
                                        padding: '12px', border: '1px solid #eee', borderRadius: '8px',
                                        background: '#fff', cursor: 'pointer', fontSize: '0.9rem',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = '#f9f9f9'}
                                    onMouseOut={e => e.currentTarget.style.background = '#fff'}
                                >
                                    {msg}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowWishModal(false)} style={{ width: '100%', marginTop: '12px', padding: '8px', background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </div>
            )}

            <style>{`
                .birthday-banner-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 16px;
                    padding: 2px;
                    background: linear-gradient(135deg, #00d4ff 0%, #0071e3 50%, #0047ab 100%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    pointer-events: none;
                    z-index: 1;
                }
                
                .balloons-container {
                    position: absolute;
                    bottom: -20px;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 20; 
                    overflow: visible;
                }
                .balloon {
                    position: absolute;
                    bottom: -50px;
                    opacity: 0.9;
                    font-size: 2.5rem;
                    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
                    animation: floatUp 6s ease-in infinite;
                }
                @keyframes floatUp {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateY(-400px) rotate(15deg); opacity: 0; }
                }
                @keyframes popIn {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default BirthdayCard;
