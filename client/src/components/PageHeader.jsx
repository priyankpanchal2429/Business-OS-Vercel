import React from 'react';

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PageHeader = ({ title, subtitle, icon: Icon, actions, children, backTo }) => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 'var(--spacing-xl)' }}>
            {backTo && (
                <button
                    onClick={() => navigate(backTo)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors w-fit font-medium text-sm"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
        </div>
    );
};

export default PageHeader;
