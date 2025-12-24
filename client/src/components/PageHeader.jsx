import React from 'react';

const PageHeader = ({ title, subtitle, icon: Icon, actions, children }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {Icon && (
                    <div style={{
                        marginTop: '4px',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-primary)'
                    }}>
                        <Icon size={32} strokeWidth={2.5} style={{ color: 'var(--color-text-primary)' }} />
                    </div>
                )}
                <div>
                    <h1 style={{ marginBottom: 0, fontSize: '2.5rem', lineHeight: 1.2 }}>{title}</h1>
                    {subtitle && <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '1rem' }}>{subtitle}</p>}
                    {children && <div style={{ marginTop: '16px' }}>{children}</div>}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                {actions}
            </div>
        </div>
    );
};

export default PageHeader;
