import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const Toast = ({ id, message, type, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 4000); // 4 seconds auto-dismiss
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(id);
        }, 300); // Match animation duration
    };

    const isSuccess = type === 'success';

    return (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '400px',
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderLeft: `4px solid ${isSuccess ? 'var(--color-success)' : 'var(--color-error)'}`,
            marginBottom: '12px',
            transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
            opacity: isExiting ? 0 : 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            pointerEvents: 'auto'
        }}>
            <div style={{
                color: isSuccess ? 'var(--color-success)' : 'var(--color-error)',
                marginTop: '2px'
            }}>
                {isSuccess ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-primary)' }}>
                    {isSuccess ? 'Success' : 'Error'}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    {message}
                </div>
            </div>

            <button
                onClick={handleClose}
                style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: 'var(--color-text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '-4px',
                    marginRight: '-4px'
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pointerEvents: 'none' // Allowed clicks to pass through empty space
        }}>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={removeToast}
                />
            ))}
        </div>
    );
};
