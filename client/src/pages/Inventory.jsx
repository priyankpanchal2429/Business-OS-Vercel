import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import Card from '../components/Card';
import InventoryModal from '../components/InventoryModal';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

    const fetchItems = () => {
        setLoading(true);
        fetch('/api/inventory')
            .then(res => res.json())
            .then(data => {
                setItems(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch inventory", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchItems();
    }, []);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1 style={{ marginBottom: 0 }}>Inventory</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>Manage your stock and assets.</p>
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
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 500,
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={18} /> Add New Item
                </button>
            </div>

            <Card className="table-container" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--spacing-md)' }}>
                    <div style={{ position: 'relative', width: 300 }}>
                        <Search size={18} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search items..."
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 36px',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '8px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                                background: viewMode === 'list' ? 'var(--color-background-subtle)' : 'white',
                                color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title="List View"
                        >
                            <LayoutList size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                padding: '8px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                                background: viewMode === 'grid' ? 'var(--color-background-subtle)' : 'white',
                                color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title="Card View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                    <button style={{
                        background: 'white',
                        border: '1px solid var(--color-border)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--color-text-primary)'
                    }}>
                        <Filter size={16} /> Filter
                    </button>
                </div>

                {viewMode === 'list' ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                        <thead style={{ background: 'var(--color-background-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Name</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Category</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Type</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Stock</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Price</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ padding: 24, textAlign: 'center' }}>Loading...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan="6" style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)' }}>No items found.</td></tr>
                            ) : (
                                items.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {item.imageUrl && (
                                                    <img
                                                        src={item.imageUrl}
                                                        alt=""
                                                        style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', background: '#f5f5f5' }}
                                                    />
                                                )}
                                                {item.name}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>{item.category}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>{item.type}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>{item.stock}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>₹{item.price}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>...</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                        {loading ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>Loading...</div>
                        ) : items.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#888' }}>No items found.</div>
                        ) : (
                            items.map(item => (
                                <div
                                    key={item.id}
                                    style={{
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        overflow: 'hidden',
                                        background: 'white',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        setSelectedItem(item);
                                        setIsModalOpen(true);
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{
                                        height: '160px',
                                        background: '#f5f5f5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderBottom: '1px solid var(--color-border)',
                                        position: 'relative'
                                    }}>
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <Package size={48} color="var(--color-text-tertiary)" />
                                        )}
                                        <div style={{
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                            background: 'rgba(255,255,255,0.9)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        }}>
                                            {item.type}
                                        </div>
                                    </div>
                                    <div style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>{item.category}</div>
                                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: 600 }}>{item.name}</h3>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>Stock</div>
                                                <div style={{ fontWeight: 600 }}>{item.stock}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>Price</div>
                                                <div style={{ fontWeight: 600, color: 'var(--color-accent)' }}>₹{item.price}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </Card>

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
