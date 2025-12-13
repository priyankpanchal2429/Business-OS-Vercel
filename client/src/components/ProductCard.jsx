import React, { useState } from 'react';
import { Package, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const ProductCard = ({ item, onEdit, onDelete, viewMode = 'grid' }) => {
    const [showActions, setShowActions] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    // List View Layout
    if (viewMode === 'list') {
        return (
            <div
                style={{
                    background: 'white',
                    border: '1px solid var(--color-border)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '16px',
                    position: 'relative',
                    cursor: 'pointer',
                    minHeight: '120px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                    setIsHovered(true);
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    setShowActions(false);
                    setIsHovered(false);
                }}
            >
                {/* Image */}
                <div style={{
                    width: '90px',
                    height: '90px',
                    background: 'white',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)'
                }}>
                    {item.imageUrl ? (
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                padding: '8px'
                            }}
                        />
                    ) : (
                        <Package size={36} color="#d1d5db" strokeWidth={1.5} />
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color: 'var(--color-text-primary)'
                        }}>
                            {item.name}
                        </h3>
                        {item.category && (
                            <span style={{
                                background: 'var(--color-background-subtle)',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--color-text-secondary)',
                                textTransform: 'uppercase'
                            }}>
                                {item.category}
                            </span>
                        )}
                    </div>

                    {item.description && (
                        <p style={{
                            margin: '0 0 12px 0',
                            fontSize: '0.875rem',
                            color: 'var(--color-text-secondary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {item.description}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.875rem' }}>
                        {item.hsnCode && (
                            <div>
                                <span style={{ color: 'var(--color-text-secondary)' }}>HSN: </span>
                                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.hsnCode}</span>
                            </div>
                        )}
                        {item.type && (
                            <div>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Type: </span>
                                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.type}</span>
                            </div>
                        )}
                        {item.vendorName && (
                            <div>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Vendor: </span>
                                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.vendorName}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Menu */}
                {isHovered && (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowActions(!showActions);
                            }}
                            style={{
                                background: 'white',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '8px',
                                color: 'var(--color-text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                            }}
                        >
                            <MoreVertical size={18} />
                        </button>

                        {showActions && (
                            <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '110%',
                                background: 'white',
                                border: '1px solid var(--color-border)',
                                borderRadius: '12px',
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
                                        padding: '12px 16px',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.875rem',
                                        color: 'var(--color-text-primary)',
                                        fontWeight: 500
                                    }}
                                    onMouseEnter={e => e.target.style.background = 'var(--color-background-subtle)'}
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
                                        padding: '12px 16px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.875rem',
                                        color: 'var(--color-error)',
                                        fontWeight: 500
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
    }

    // Grid View Layout (Redesigned - Vertical with Image)
    return (
        <>
            {/* Image Zoom Modal */}
            {showImageModal && item.imageUrl && (
                <div
                    onClick={() => setShowImageModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px',
                        cursor: 'zoom-out'
                    }}
                >
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{
                            maxWidth: '90%',
                            maxHeight: '90%',
                            objectFit: 'contain',
                            borderRadius: '12px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <div
                style={{
                    background: 'white',
                    border: '1px solid var(--color-border)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    height: '100%',
                    cursor: 'pointer',
                    padding: '16px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 113, 227, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                    setIsHovered(true);
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    setShowActions(false);
                    setIsHovered(false);
                }}
            >
                {/* Image Section - Top */}
                <div
                    onClick={() => item.imageUrl && setShowImageModal(true)}
                    style={{
                        width: '100%',
                        height: '180px',
                        background: 'white',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        overflow: 'hidden',
                        cursor: item.imageUrl ? 'zoom-in' : 'default',
                        transition: 'all 0.2s',
                        position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                        if (item.imageUrl) {
                            e.currentTarget.style.transform = 'scale(1.02)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    {item.imageUrl ? (
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                padding: '12px'
                            }}
                        />
                    ) : (
                        <Package size={48} color="#d1d5db" strokeWidth={1.5} />
                    )}

                    {/* Category Badge - Top Right Corner */}
                    {item.category && (
                        <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'var(--color-accent)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            boxShadow: '0 2px 8px rgba(0, 113, 227, 0.3)',
                            zIndex: 2
                        }}>
                            {item.category}
                        </div>
                    )}
                </div>

                {/* Content Section - Below Image */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Product Name with Three-Dot Menu */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color: 'var(--color-text-primary)',
                            lineHeight: 1.3,
                            flex: 1
                        }}>
                            {item.name}
                        </h3>

                        {/* Three-Dot Menu - Always Visible */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowActions(!showActions);
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    color: 'var(--color-text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <MoreVertical size={16} />
                            </button>

                            {showActions && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '4px',
                                    background: 'white',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '12px',
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
                                            padding: '12px 16px',
                                            background: 'none',
                                            border: 'none',
                                            borderBottom: '1px solid var(--color-border)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            fontSize: '0.875rem',
                                            color: 'var(--color-text-primary)',
                                            fontWeight: 500
                                        }}
                                        onMouseEnter={e => e.target.style.background = 'var(--color-background-subtle)'}
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
                                            padding: '12px 16px',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            fontSize: '0.875rem',
                                            color: 'var(--color-error)',
                                            fontWeight: 500
                                        }}
                                        onMouseEnter={e => e.target.style.background = '#fef2f2'}
                                        onMouseLeave={e => e.target.style.background = 'none'}
                                    >
                                        <Trash2 size={16} strokeWidth={2} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {item.description && (
                        <p style={{
                            margin: '0 0 auto 0',
                            fontSize: '0.85rem',
                            color: 'var(--color-text-secondary)',
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {item.description}
                        </p>
                    )}
                </div>



                {/* Bottom Section: Metadata */}
                <div style={{
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-border)',
                    marginTop: '12px'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        {item.hsnCode && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.85rem'
                            }}>
                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>HSN</span>
                                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.hsnCode}</span>
                            </div>
                        )}
                        {item.type && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.85rem'
                            }}>
                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Type</span>
                                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.type}</span>
                            </div>
                        )}
                        {item.vendorName && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.85rem'
                            }}>
                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Vendor</span>
                                <span style={{
                                    color: 'var(--color-text-primary)',
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '150px',
                                    textAlign: 'right'
                                }}>
                                    {item.vendorName}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProductCard;
