import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, employeeName, isDeleting }) => {
    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setConfirmText('');
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter' && confirmText === 'DELETE') {
                handleConfirm();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, confirmText]);

    const handleConfirm = () => {
        if (confirmText !== 'DELETE') {
            setError('Please type DELETE to confirm');
            return;
        }
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

                    {/* Type DELETE Confirmation */}
                    <div style={{ marginTop: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: 'var(--color-text-secondary)',
                            marginBottom: '8px'
                        }}>
                            Type <code style={{
                                background: 'var(--color-background-subtle)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 600
                            }}>DELETE</code> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => {
                                setConfirmText(e.target.value);
                                setError('');
                            }}
                            disabled={isDeleting}
                            placeholder="Type DELETE here"
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: 'var(--radius-md)',
                                border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
                                fontSize: '0.95rem',
                                fontFamily: 'monospace'
                            }}
                        />
                        {error && (
                            <div style={{
                                color: 'var(--color-error)',
                                fontSize: '0.85rem',
                                marginTop: '8px'
                            }}>
                                {error}
                            </div>
                        )}
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
                        disabled={confirmText !== 'DELETE' || isDeleting}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: confirmText === 'DELETE' && !isDeleting ? 'var(--color-error)' : 'rgba(255, 59, 48, 0.3)',
                            color: 'white',
                            fontWeight: 600,
                            cursor: confirmText === 'DELETE' && !isDeleting ? 'pointer' : 'not-allowed',
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
