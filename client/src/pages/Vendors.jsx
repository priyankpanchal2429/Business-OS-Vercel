import React, { useState, useEffect } from 'react';
import { getBaseUrl } from '../config/api';
import { Store, Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import VendorModal from '../components/VendorModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { useToast } from '../context/ToastContext';

const Vendors = () => {
    const { addToast } = useToast();
    const API_URL = getBaseUrl();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, vendor: null });
    const [searchQuery, setSearchQuery] = useState('');

    const fetchVendors = () => {
        setLoading(true);
        fetch(`${API_URL}/vendors`)
            .then(res => res.json())
            .then(data => {
                setVendors(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch vendors", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleEdit = (vendor) => {
        setSelectedVendor(vendor);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteModal.vendor) return;

        try {
            const res = await fetch(`${API_URL}/vendors/${deleteModal.vendor.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                addToast('Vendor deleted successfully', 'success');
                fetchVendors();
                setDeleteModal({ isOpen: false, vendor: null });
            } else {
                const data = await res.json();
                addToast(data.error || 'Failed to delete vendor', 'error');
            }
        } catch (err) {
            addToast('Error deleting vendor', 'error');
            console.error(err);
        }
    };

    // Filter vendors based on search query
    const filteredVendors = vendors.filter(vendor =>
        vendor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.phone?.includes(searchQuery)
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1 style={{ marginBottom: 0 }}>Vendor Management</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>Manage your suppliers and partners.</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedVendor(null);
                        setIsModalOpen(true);
                    }}
                    style={{
                        background: 'var(--color-accent)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 500,
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={18} /> Add New Vendor
                </button>
            </div>

            <Card className="table-container" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--spacing-md)' }}>
                    <div style={{ position: 'relative', width: 300 }}>
                        <Search size={18} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 36px',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                    <button style={{
                        background: 'white',
                        border: '1px solid var(--color-border)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer'
                    }}>
                        <Filter size={16} /> Filter
                    </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead style={{ background: 'var(--color-background-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Company Name</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Contact Person</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Phone No.</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Address</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: 24, textAlign: 'center' }}>Loading...</td></tr>
                        ) : filteredVendors.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                {searchQuery ? 'No vendors found matching your search.' : 'No vendors found. Add your first vendor!'}
                            </td></tr>
                        ) : (
                            filteredVendors.map(vendor => (
                                <tr key={vendor.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {vendor.logoUrl ? (
                                                <img
                                                    src={vendor.logoUrl}
                                                    alt={vendor.name}
                                                    style={{ width: 32, height: 32, borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--color-border)' }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '6px',
                                                    background: 'var(--color-background-subtle)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '1px solid var(--color-border)'
                                                }}>
                                                    <Store size={16} color="var(--color-text-secondary)" />
                                                </div>
                                            )}
                                            {vendor.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>{vendor.contactPerson || '-'}</td>
                                    <td style={{ padding: '12px 16px' }}>{vendor.phone || '-'}</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                                        {vendor.address || '-'}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                            <button
                                                onClick={() => handleEdit(vendor)}
                                                style={{
                                                    padding: '6px 12px',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    color: 'var(--color-accent)'
                                                }}
                                            >
                                                <Edit2 size={14} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal({ isOpen: true, vendor })}
                                                style={{
                                                    padding: '6px 12px',
                                                    border: '1px solid var(--color-error)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    color: 'var(--color-error)'
                                                }}
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>

            <VendorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                vendor={selectedVendor}
                onSave={fetchVendors}
            />

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, vendor: null })}
                onConfirm={handleDelete}
                title="Delete Vendor"
                message={`Are you sure you want to delete "${deleteModal.vendor?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default Vendors;
