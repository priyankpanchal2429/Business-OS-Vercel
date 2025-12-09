import React, { useState } from 'react';
import { Package, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const ProductCard = ({ item, onEdit, onDelete, viewMode = 'grid' }) => {
    const [showActions, setShowActions] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                height: '100%',
                cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#d1d5db';
                setIsHovered(true);
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e5e7eb';
                setShowActions(false);
                setIsHovered(false);
            }}
        >
            {/* Image Section */}
            <div style={{
                width: '100%',
                height: '240px',
                background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                borderBottom: '1px solid #f3f4f6'
            }}>
                {item.imageUrl ? (
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: '24px'
                        }}
                    />
                ) : (
                    <Package size={56} color="#d1d5db" strokeWidth={1.5} />
                )}

                {/* Category Badge */}
                {item.category && (
                    <div style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                        {item.category}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div style={{
                padding: '20px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                {/* Product Name */}
                <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#111827',
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em'
                }}>
                    {item.name}
                </h3>

                {/* Description */}
                {item.description && (
                    <p style={{
                        margin: '0 0 16px 0',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {item.description}
                    </p>
                )}

                {/* Divider */}
                <div style={{
                    height: '1px',
                    background: '#f3f4f6',
                    margin: '12px 0'
                }}></div>

                {/* Metadata Grid */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: 'auto'
                }}>
                    {/* HSN */}
                    {item.hsnCode && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.875rem'
                        }}>
                            <span style={{ color: '#9ca3af', fontWeight: 500 }}>HSN</span>
                            <span style={{ color: '#111827', fontWeight: 600 }}>{item.hsnCode}</span>
                        </div>
                    )}

                    {/* Type */}
                    {item.type && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.875rem'
                        }}>
                            <span style={{ color: '#9ca3af', fontWeight: 500 }}>Type</span>
                            <span style={{ color: '#111827', fontWeight: 600 }}>{item.type}</span>
                        </div>
                    )}

                    {/* Vendor */}
                    {item.vendorName && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.875rem'
                        }}>
                            <span style={{ color: '#9ca3af', fontWeight: 500 }}>Vendor</span>
                            <span style={{
                                color: '#111827',
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '180px',
                                textAlign: 'right'
                            }}>{item.vendorName}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Three-Dot Menu - Appears on hover */}
            {isHovered && (
                <div style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16
                }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowActions(!showActions);
                        }}
                        style={{
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f9fafb';
                            e.currentTarget.style.color = '#111827';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.color = '#6b7280';
                        }}
                    >
                        <MoreVertical size={18} />
                    </button>

                    {/* Dropdown Menu */}
                    {showActions && (
                        <div style={{
                            position: 'absolute',
                            bottom: '110%',
                            right: 0,
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                            zIndex: 10,
                            minWidth: '140px',
                            overflow: 'hidden'
                        }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(item);
                                    setShowActions(false);
                                }}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 14px',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: '1px solid #f3f4f6',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontSize: '0.875rem',
                                    color: '#111827',
                                    fontWeight: 500,
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => e.target.style.background = '#f9fafb'}
                                onMouseLeave={e => e.target.style.background = 'none'}
                            >
                                <Edit2 size={16} strokeWidth={2} /> Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(item);
                                    setShowActions(false);
                                }}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 14px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontSize: '0.875rem',
                                    color: '#ef4444',
                                    fontWeight: 500,
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => e.target.style.background = '#fef2f2'}
                                onMouseLeave={e => e.target.style.background = 'none'}
                            >
                                <Trash2 size={16} strokeWidth={2} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductCard;
