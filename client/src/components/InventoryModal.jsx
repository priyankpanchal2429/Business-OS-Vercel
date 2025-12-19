import React, { useState, useEffect } from 'react';
import { X, Save, Package, Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const InventoryModal = ({ isOpen, onClose, item, onSave }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: item?.name || '',
        category: item?.category || '',
        type: item?.type || '',
        stock: item?.stock || '',
        price: item?.price || '',
        description: item?.description || '',
        hsnCode: item?.hsnCode || '',
        vendorName: item?.vendorName || '',
        imageUrl: item?.imageUrl || item?.image || ''
    });
    const [loading, setLoading] = useState(false);
    const [imageMode, setImageMode] = useState('url'); // 'url' or 'upload'
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(item?.imageUrl || '');

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setFormData({
                name: item?.name || '',
                category: item?.category || '',
                type: item?.type || '',
                stock: item?.stock || '',
                price: item?.price || '',
                description: item?.description || '',
                hsnCode: item?.hsnCode || '',
                vendorName: item?.vendorName || '',
                imageUrl: item?.imageUrl || item?.image || ''
            });
            setImagePreview(item?.imageUrl || item?.image || '');
            setImageFile(null);
            setImageMode('url');
        }
    }, [isOpen, item]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Update preview for URL mode
        if (name === 'imageUrl' && imageMode === 'url') {
            setImagePreview(value);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.category || !formData.type) {
            addToast('Please fill in all required fields', 'error');
            return;
        }

        setLoading(true);
        try {
            let imageUrl = formData.imageUrl;

            // Handle file upload
            if (imageMode === 'upload' && imageFile) {
                const formDataUpload = new FormData();
                formDataUpload.append('image', imageFile);

                const uploadRes = await fetch('/api/upload/image', {
                    method: 'POST',
                    body: formDataUpload
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageUrl = uploadData.imageUrl;
                } else {
                    addToast('Failed to upload image', 'error');
                    setLoading(false);
                    return;
                }
            }

            const method = item ? 'PATCH' : 'POST';
            const url = item ? `/api/inventory/${item.id}` : '/api/inventory';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    stock: parseInt(formData.stock) || 0,
                    price: parseFloat(formData.price) || 0,
                    imageUrl
                })
            });

            if (res.ok) {
                addToast(item ? 'Item updated successfully' : 'Item added successfully', 'success');
                onSave && onSave();
                onClose();
            } else {
                addToast('Failed to save item', 'error');
            }
        } catch (err) {
            addToast('Error saving item', 'error');
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
                width: '800px', // Wider modal for better layout
                maxWidth: '95%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column',
                maxHeight: '90vh',
                animation: 'slideUp 0.3s ease-out'
            }}>
                <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                            {item ? 'Edit Item' : 'Add New Item'}
                        </h2>
                        <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                            {item ? 'Update inventory item details' : 'Add a new item to inventory'}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px' }}>

                        {/* LEFT COLUMN: Image Upload */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                Product Image
                            </label>

                            {/* Image Preview */}
                            <div style={{
                                width: '100%',
                                height: '240px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f8f9fa',
                                marginBottom: '12px',
                                position: 'relative'
                            }}>
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = '<div style="color: var(--color-text-secondary); font-size: 0.9rem;">Invalid Image</div>';
                                        }}
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                                        <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: 8 }} />
                                        <p style={{ fontSize: '0.8rem', margin: 0 }}>No image selected</p>
                                    </div>
                                )}
                            </div>

                            {/* Toggle between Upload and URL */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageMode('url');
                                        setImageFile(null);
                                        setImagePreview(formData.imageUrl);
                                    }}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px',
                                        border: `1px solid ${imageMode === 'url' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                        background: imageMode === 'url' ? 'rgba(0, 113, 227, 0.05)' : 'white',
                                        color: imageMode === 'url' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                    }}
                                >
                                    <LinkIcon size={16} /> URL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageMode('upload');
                                        setFormData(prev => ({ ...prev, imageUrl: '' }));
                                    }}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px',
                                        border: `1px solid ${imageMode === 'upload' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                        background: imageMode === 'upload' ? 'rgba(0, 113, 227, 0.05)' : 'white',
                                        color: imageMode === 'upload' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                    }}
                                >
                                    <Upload size={16} /> Upload
                                </button>
                            </div>

                            {/* URL Input */}
                            {imageMode === 'url' && (
                                <input
                                    type="url"
                                    name="imageUrl"
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '8px',
                                        border: '1px solid var(--color-border)', fontSize: '0.9rem'
                                    }}
                                />
                            )}

                            {/* File Upload */}
                            {imageMode === 'upload' && (
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{
                                            width: '100%', padding: '10px', fontSize: '0.9rem',
                                            background: 'var(--color-background-subtle)',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 6, marginLeft: 2 }}>
                                        Supported: PNG, JPG, GIF (Max 10MB)
                                    </p>
                                </div>
                            )}

                        </div>

                        {/* RIGHT COLUMN: Item Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            {/* Item Name - Full Width */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="Enter item name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>

                            {/* Category & Type */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        Category *
                                    </label>
                                    <input
                                        type="text"
                                        name="category"
                                        required
                                        placeholder="e.g., Electronics"
                                        value={formData.category}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        Type *
                                    </label>
                                    <input
                                        type="text"
                                        name="type"
                                        required
                                        placeholder="e.g., Product"
                                        value={formData.type}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Stock & Price */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        Stock
                                    </label>
                                    <input
                                        type="number"
                                        name="stock"
                                        placeholder="0"
                                        value={formData.stock}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        Price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                            </div>



                            {/* HSN Code & Vendor Name (NEW FIELDS) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        HSN Code
                                    </label>
                                    <input
                                        type="text"
                                        name="hsnCode"
                                        placeholder="Enter HSN Code"
                                        value={formData.hsnCode}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        Vendor Name
                                    </label>
                                    <input
                                        type="text"
                                        name="vendorName"
                                        placeholder="Enter Vendor Name"
                                        value={formData.vendorName}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    placeholder="Optional item description..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                        fontSize: '0.9rem', minHeight: '100px', resize: 'vertical',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                background: 'white', color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 500,
                                fontSize: '0.95rem'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '12px 28px', borderRadius: '8px', border: 'none',
                                background: 'var(--color-accent)', color: 'white',
                                cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600,
                                fontSize: '0.95rem',
                                display: 'flex', alignItems: 'center', gap: 8,
                                boxShadow: '0 2px 8px rgba(0, 113, 227, 0.2)'
                            }}
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : (item ? 'Save Item' : 'Add Item')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryModal;
