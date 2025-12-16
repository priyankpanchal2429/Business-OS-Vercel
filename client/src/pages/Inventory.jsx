import React, { useState, useEffect } from 'react';
import { getBaseUrl } from '../config/api';
import {
    Plus, Search, LayoutList, LayoutGrid,
    Package, Layers, ArrowUpRight, Filter
} from 'lucide-react';
import InventoryModal from '../components/InventoryModal';
import ProductCard from '../components/ProductCard';
import { useToast } from '../context/ToastContext';

// Simple Stat Card Component
const StatCard = ({ title, value, icon: Icon, trend }) => (
    <div style={{
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '120px'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
            <div style={{
                padding: '8px',
                background: 'var(--color-background-subtle)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)'
            }}>
                <Icon size={18} />
            </div>
        </div>
        <div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '4px 0 0', color: 'var(--color-text-primary)' }}>{value}</h3>
            {/* Optional Trend or Label */}
            {trend && <span style={{ fontSize: '0.8rem', color: '#34c759', fontWeight: 500 }}>{trend}</span>}
        </div>
    </div>
);

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();
    const API_URL = getBaseUrl();

    // Stats
    const totalItems = items.length;
    const categories = [...new Set(items.map(i => i.category))].filter(Boolean).length;
    const uniqueVendors = [...new Set(items.map(i => i.vendorName))].filter(Boolean).length;

    const fetchItems = () => {
        setLoading(true);
        fetch(`${API_URL}/inventory`)
            .then(res => res.json())
            .then(data => {
                setItems(data);
                setFilteredItems(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch inventory", err);
                addToast("Failed to load inventory", "error");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = items.filter(item =>
            item.name.toLowerCase().includes(lowerTerm) ||
            item.category.toLowerCase().includes(lowerTerm) ||
            (item.vendorName && item.vendorName.toLowerCase().includes(lowerTerm))
        );
        setFilteredItems(filtered);
    }, [searchTerm, items]);

    const handleEdit = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
            try {
                const res = await fetch(`${API_URL}/inventory/${item.id}`, { method: 'DELETE' });
                if (res.ok) {
                    addToast('Item deleted successfully', 'success');
                    fetchItems();
                } else {
                    addToast('Failed to delete item', 'error');
                }
            } catch (err) {
                console.error(err);
                addToast('Error deleting item', 'error');
            }
        }
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                marginBottom: '32px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Inventory</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
                            Track and manage your products, assets, and equipment.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedItem(null);
                            setIsModalOpen(true);
                        }}
                        style={{
                            background: 'var(--color-accent)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 20px',
                            borderRadius: 'var(--radius-full)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)',
                            fontSize: '0.95rem'
                        }}
                    >
                        <Plus size={20} /> Add Item
                    </button>
                </div>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px'
                }}>
                    <StatCard
                        title="Total Products"
                        value={totalItems}
                        icon={Package}
                    />
                    <StatCard
                        title="Categories"
                        value={categories}
                        icon={Layers}
                    />
                    <StatCard
                        title="Active Vendors"
                        value={uniqueVendors}
                        icon={ArrowUpRight}
                    />
                </div>
            </div>

            {/* Controls Toolbar */}
            <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                boxShadow: 'var(--shadow-sm)',
                gap: '16px',
                flexWrap: 'wrap'
            }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                    <Search size={18} style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-text-secondary)'
                    }} />
                    <input
                        type="text"
                        placeholder="Search by name, category, or vendor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 42px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.95rem',
                            background: 'var(--color-background-subtle)',
                            transition: 'border-color 0.2s',
                            outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                        background: 'var(--color-background-subtle)',
                        padding: '4px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        border: '1px solid var(--color-border)'
                    }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: viewMode === 'grid' ? 'white' : 'transparent',
                                color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontWeight: 500
                            }}
                        >
                            <LayoutGrid size={18} /> <span style={{ fontSize: '0.9rem' }}>Grid</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: viewMode === 'list' ? 'white' : 'transparent',
                                color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontWeight: 500
                            }}
                        >
                            <LayoutList size={18} /> <span style={{ fontSize: '0.9rem' }}>List</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)' }}>
                    Loading inventory...
                </div>
            ) : filteredItems.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '80px 20px',
                    background: 'white',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    borderStyle: 'dashed'
                }}>
                    <div style={{
                        width: '80px', height: '80px',
                        background: 'var(--color-background-subtle)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <Package size={40} style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
                    </div>
                    <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>No products found</h3>
                    <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                        {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first product to the inventory.'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            style={{
                                marginTop: '24px',
                                background: 'white',
                                border: '1px solid var(--color-border)',
                                padding: '10px 20px',
                                borderRadius: 'var(--radius-full)',
                                color: 'var(--color-text-primary)',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            Add Product
                        </button>
                    )}
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    // Reduced to 260px for narrower product cards
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(260px, 1fr))' : '1fr',
                    gap: '20px',
                    paddingBottom: '40px'
                }}>
                    {filteredItems.map(item => (
                        <ProductCard
                            key={item.id}
                            item={item}
                            viewMode={viewMode}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            <InventoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={selectedItem}
                onSave={fetchItems}
            />
        </div>
    );
};

export default Inventory;
