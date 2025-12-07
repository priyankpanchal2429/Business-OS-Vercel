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
        imageUrl: item?.imageUrl || ''
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
                imageUrl: item?.imageUrl || ''
            });
            setImagePreview(item?.imageUrl || '');
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

        if (!formData.name || !formData.category || !formData.type || !formData.stock || !formData.price) {
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
                    stock: parseInt(formData.stock),
                    price: parseFloat(formData.price),
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
                width: '500px',
                maxWidth: '95%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column',
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

                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Item Name */}
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

                        {/* Category and Type */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

                        {/* Stock and Price */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    Stock Quantity *
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    required
                                    min="0"
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
                                    Price (₹) *
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    required
                                    min="0"
                                    step="0.01"
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
                                    fontSize: '0.9rem', minHeight: '80px', resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Image Upload/URL Section */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                Product Image
                            </label>

                            {/* Toggle between Upload and URL */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageMode('url');
                                        setImageFile(null);
                                        setImagePreview(formData.imageUrl);
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
                                    Image URL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageMode('upload');
                                        setFormData(prev => ({ ...prev, imageUrl: '' }));
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
                                    Upload Image
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
                                        PNG, JPG, GIF up to 10MB
                                    </p>
                                </div>
                            )}

                            {/* Image Preview */}
                            {imagePreview && (
                                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Preview:</p>
                                    <div style={{
                                        width: '100%',
                                        height: '200px',
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
                                            alt="Preview"
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
                            {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryModal;
