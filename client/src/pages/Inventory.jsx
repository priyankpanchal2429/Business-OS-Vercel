import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter } from 'lucide-react';
import Card from '../components/Card';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
    }, []);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1 style={{ marginBottom: 0 }}>Inventory</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>Manage your stock and assets.</p>
                </div>
                <button style={{
                    background: 'var(--color-accent)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 500
                }}>
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

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead style={{ background: 'var(--color-background-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>ID</th>
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
                            <tr><td colSpan="7" style={{ padding: 24, textAlign: 'center' }}>Loading...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)' }}>No items found.</td></tr>
                        ) : (
                            items.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '12px 16px' }}>#{item.id}</td>
                                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.name}</td>
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
            </Card>
        </div>
    );
};

export default Inventory;
