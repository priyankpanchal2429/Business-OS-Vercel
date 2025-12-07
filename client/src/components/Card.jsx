import React from 'react';

const Card = ({ title, children, className = '', style = {}, titleStyle = {} }) => {
    return (
        <div style={{
            background: 'var(--color-cards)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-sm)',
            color: 'var(--color-text-primary)', // Default color
            ...style
        }} className={className}>
            {title && (
                <h3 style={{
                    fontSize: '1rem',
                    color: 'var(--color-text-secondary)',
                    fontWeight: 500,
                    margin: 0,
                    ...titleStyle
                }}>
                    {title}
                </h3>
            )}
            <div>
                {children}
            </div>
        </div>
    );
};

export default Card;
