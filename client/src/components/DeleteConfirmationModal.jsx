import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, employeeName, isDeleting }) => {
    const [isConfirmed, setIsConfirmed] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsConfirmed(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter' && isConfirmed) {
                handleConfirm();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isConfirmed]);

    const handleConfirm = () => {
        if (!isConfirmed) return;
        onConfirm();
    };

    if (!isOpen) return null;

    return (
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
                padding: '32px',
                maxWidth: '480px',
                width: '90%',
                boxShadow: '0 8px 40px rgba(0,0,0,0.2)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
                    <div style={{
                        background: 'rgba(255, 59, 48, 0.1)',
                        padding: '12px',
                        borderRadius: '12px',
                        color: 'var(--color-error)'
                    }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                            Confirm Permanent Deletion
                        </h2>
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            style={{
                                position: 'absolute',
                                top: '24px',
                                right: '24px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                color: 'var(--color-text-secondary)'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
                        Are you sure you want to permanently delete <strong>{employeeName}</strong>?
                    </p>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        This action cannot be undone. All data associated with this employee will be lost.
                    </p>

                    {/* Simple Checkbox Confirmation */}
                    <div style={{ marginTop: '24px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px',
                            background: 'var(--color-background-subtle)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}>
                            <input
                                type="checkbox"
                                checked={isConfirmed}
                                onChange={(e) => setIsConfirmed(e.target.checked)}
                                disabled={isDeleting}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    cursor: 'pointer'
                                }}
                            />
                            <span style={{
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                color: 'var(--color-text-primary)'
                            }}>
                                I understand this action cannot be undone
                            </span>
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'white',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            fontWeight: 500,
                            opacity: isDeleting ? 0.5 : 1
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isConfirmed || isDeleting}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: isConfirmed && !isDeleting ? 'var(--color-error)' : 'rgba(255, 59, 48, 0.3)',
                            color: 'white',
                            fontWeight: 600,
                            cursor: isConfirmed && !isDeleting ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
