import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

const Avatar = ({ src, name, size = 40, borderRadius = '50%', fontSize, style = {}, className = '' }) => {
    const [imageError, setImageError] = useState(false);

    // Reset error state if src changes
    useEffect(() => {
        setImageError(false);
    }, [src]);

    const getInitials = (fullName) => {
        if (!fullName) return '';
        const names = fullName.trim().split(/\s+/);
        if (names.length === 0) return '';
        // If only one name, take first two letters if possible, else just first
        if (names.length === 1) return names[0].slice(0, 2).toUpperCase();

        // Take first letter of first name and first letter of last name
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    const containerStyle = {
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        minWidth: typeof size === 'number' ? `${size}px` : size, // Prevent compressing
        minHeight: typeof size === 'number' ? `${size}px` : size,
        borderRadius: borderRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
    };

    // If we have a valid image source and no error, show generic img or styled div
    if (src && !imageError) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                className={className}
                onError={() => setImageError(true)}
                style={{
                    ...containerStyle,
                    objectFit: 'cover',
                    border: '1px solid var(--color-border)'
                }}
            />
        );
    }

    // Fallback: Initials
    return (
        <div
            className={className}
            style={{
                ...containerStyle,
                background: '#e0e7ff', // Soft indigo/blue background to match theme
                color: '#4338ca', // Darker indigo text
                fontWeight: 700,
                fontSize: fontSize || (typeof size === 'number' ? `${size * 0.4}px` : 'calc(100% * 0.4)'),
                border: '1px solid #c7d2fe',
                userSelect: 'none'
            }}
            title={name}
        >
            {name ? getInitials(name) : <User size={typeof size === 'number' ? size * 0.5 : 20} />}
        </div>
    );
};

export default Avatar;
