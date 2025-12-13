import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, details, type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '400px',
                padding: '24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                transform: 'translateY(0)',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                {/* Icon */}
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: type === 'warning' ? '#fff7ed' : '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: type === 'warning' ? '#f59e0b' : '#16a34a',
                    alignSelf: 'center',
                    marginBottom: '8px'
                }}>
                    {type === 'warning' ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
                </div>

                {/* Content */}
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#111' }}>{title}</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        {message}
                    </p>
                    {details && (
                        <div style={{
                            marginTop: '16px',
                            background: '#f9fafb',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#444',
                            textAlign: 'left',
                            border: '1px solid #e5e7eb'
                        }}>
                            {details}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid #e5e7eb',
                            background: 'white',
                            color: '#4b5563',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '10px',
                            border: 'none',
                            background: type === 'warning' ? '#f59e0b' : '#16a34a',
                            color: 'white',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: type === 'warning'
                                ? '0 4px 12px rgba(245, 158, 11, 0.3)'
                                : '0 4px 12px rgba(22, 163, 74, 0.3)',
                            transition: 'transform 0.1s'
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default ConfirmationModal;
