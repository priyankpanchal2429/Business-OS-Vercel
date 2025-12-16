import React, { useState, useEffect } from 'react';
import { getBaseUrl } from '../config/api';
import { X, Save, Store, Upload, Link as LinkIcon } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const VendorModal = ({ isOpen, onClose, vendor, onSave }) => {
    const { addToast } = useToast();
    const API_URL = getBaseUrl();
    const [formData, setFormData] = useState({
        name: vendor?.name || '',
        contactPerson: vendor?.contactPerson || '',
        phone: vendor?.phone || '',
        email: vendor?.email || '',
        address: vendor?.address || '',
        status: vendor?.status || 'active',
        logoUrl: vendor?.logoUrl || ''
    });
    const [loading, setLoading] = useState(false);
    const [imageMode, setImageMode] = useState('url');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(vendor?.logoUrl || '');

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: vendor?.name || '',
                contactPerson: vendor?.contactPerson || '',
                phone: vendor?.phone || '',
                email: vendor?.email || '',
                address: vendor?.address || '',
                status: vendor?.status || 'active',
                logoUrl: vendor?.logoUrl || ''
            });
            setImagePreview(vendor?.logoUrl || '');
            setImageFile(null);
            setImageMode('url');
        }
    }, [isOpen, vendor]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'logoUrl' && imageMode === 'url') {
            setImagePreview(value);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.contactPerson || !formData.phone || !formData.email) {
            addToast('Please fill in all required fields', 'error');
            return;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            addToast('Please enter a valid email address', 'error');
            return;
        }

        setLoading(true);
        try {
            let logoUrl = formData.logoUrl;

            // Handle file upload
            if (imageMode === 'upload' && imageFile) {
                const formDataUpload = new FormData();
                formDataUpload.append('image', imageFile);

                const uploadRes = await fetch(`${API_URL}/upload/image`, {
                    method: 'POST',
                    body: formDataUpload
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    logoUrl = uploadData.imageUrl;
                } else {
                    addToast('Failed to upload logo', 'error');
                    setLoading(false);
                    return;
                }
            }

            const method = vendor ? 'PATCH' : 'POST';
            const url = vendor ? `${API_URL}/vendors/${vendor.id}` : `${API_URL}/vendors`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    logoUrl
                })
            });

            if (res.ok) {
                addToast(vendor ? 'Vendor updated successfully' : 'Vendor added successfully', 'success');
                onSave && onSave();
                onClose();
            } else {
                addToast('Failed to save vendor', 'error');
            }
        } catch (err) {
            addToast('Error saving vendor', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '560px',
                maxWidth: '95%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column',
                animation: 'slideUp 0.3s ease-out'
            }}>
                <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                            {vendor ? 'Edit Vendor' : 'Add New Vendor'}
                        </h2>
                        <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                            {vendor ? 'Update vendor details' : 'Add a new vendor to your system'}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Vendor Name */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                Vendor Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                placeholder="Enter vendor/company name"
                                value={formData.name}
                                onChange={handleChange}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>

                        {/* Contact Person and Phone */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    Contact Person *
                                </label>
                                <input
                                    type="text"
                                    name="contactPerson"
                                    required
                                    placeholder="Name"
                                    value={formData.contactPerson}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    Phone *
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    placeholder="Contact number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Email and Status */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    Status *
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                        fontSize: '0.95rem', background: 'white'
                                    }}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                Address
                            </label>
                            <textarea
                                name="address"
                                placeholder="Full address..."
                                value={formData.address}
                                onChange={handleChange}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                    fontSize: '0.9rem', minHeight: '80px', resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Logo Upload/URL Section */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                Company Logo
                            </label>

                            {/* Toggle between Upload and URL */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageMode('url');
                                        setImageFile(null);
                                        setImagePreview(formData.logoUrl);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: `2px solid ${imageMode === 'url' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                        background: imageMode === 'url' ? 'rgba(0, 113, 227, 0.1)' : 'white',
                                        color: imageMode === 'url' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6
                                    }}
                                >
                                    <LinkIcon size={16} />
                                    Logo URL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageMode('upload');
                                        setFormData(prev => ({ ...prev, logoUrl: '' }));
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: `2px solid ${imageMode === 'upload' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                        background: imageMode === 'upload' ? 'rgba(0, 113, 227, 0.1)' : 'white',
                                        color: imageMode === 'upload' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6
                                    }}
                                >
                                    <Upload size={16} />
                                    Upload Logo
                                </button>
                            </div>

                            {/* URL Input */}
                            {imageMode === 'url' && (
                                <input
                                    type="url"
                                    name="logoUrl"
                                    placeholder="https://example.com/logo.png"
                                    value={formData.logoUrl}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            )}

                            {/* File Upload */}
                            {imageMode === 'upload' && (
                                <div style={{
                                    border: '2px dashed var(--color-border)',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    textAlign: 'center',
                                    background: 'var(--color-background-subtle)',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <Upload size={32} style={{ color: 'var(--color-text-secondary)', marginBottom: 8 }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        {imageFile ? imageFile.name : 'Click to upload or drag and drop'}
                                    </p>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                        PNG, JPG, SVG up to 10MB
                                    </p>
                                </div>
                            )}

                            {/* Image Preview */}
                            {imagePreview && (
                                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Preview:</p>
                                    <div style={{
                                        width: '100%',
                                        height: '150px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: '1px solid var(--color-border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#f5f5f5'
                                    }}>
                                        <img
                                            src={imagePreview}
                                            alt="Logo Preview"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                objectFit: 'contain'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<div style="color: var(--color-text-secondary); font-size: 0.9rem;">Invalid image URL</div>';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                background: 'white', color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 500
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '12px 24px', borderRadius: '8px', border: 'none',
                                background: 'var(--color-accent)', color: 'white',
                                cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: 8
                            }}
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : (vendor ? 'Update Vendor' : 'Add Vendor')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VendorModal;
