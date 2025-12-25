import React, { useState, useEffect } from 'react';
import { Calculator, Save, Trash2, IndianRupee } from 'lucide-react';
import PageHeader from './PageHeader';

const labelStyle = { display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-secondary)' };
const inputWrapperStyle = { position: 'relative', display: 'flex', alignItems: 'center' };
const inputIconStyle = { position: 'absolute', left: 12, color: 'var(--color-text-tertiary)' };
const inputStyle = { width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '1rem' };
const chipStyle = { padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s' };
const primaryButtonStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, marginTop: 8 };
const rowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.95rem' };

const MotorCalculator = () => {
    const [inventory, setInventory] = useState([]);
    const [selectedMotorId, setSelectedMotorId] = useState(null);
    const [motorName, setMotorName] = useState('');
    const [motorImage, setMotorImage] = useState(null);

    const [purchasePrice, setPurchasePrice] = useState('');
    const [gstRate, setGstRate] = useState(18);

    const [profitType, setProfitType] = useState('percentage');
    const [profitValue, setProfitValue] = useState(10);

    const [saveToInventory, setSaveToInventory] = useState(false);
    const [savedMotors, setSavedMotors] = useState([]);

    useEffect(() => {
        fetchInventory();
        const saved = localStorage.getItem('saved_motors');
        if (saved) setSavedMotors(JSON.parse(saved));
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await fetch('/api/inventory');
            const data = await res.json();
            if (Array.isArray(data)) setInventory(data);
        } catch (err) {
            console.error("Failed to fetch inventory", err);
        }
    };

    const handleMotorSelect = (e) => {
        const val = e.target.value;
        if (val === 'new') {
            setSelectedMotorId('new');
            setMotorName('');
            setMotorImage(null);
            setPurchasePrice('');
        } else {
            const item = inventory.find(i => i.id === val);
            if (item) {
                setSelectedMotorId(item.id);
                setMotorName(item.name);
                setMotorImage(item.image);
                setPurchasePrice(item.price || '');
            }
        }
    };

    const basePrice = parseFloat(purchasePrice) || 0;
    const gstAmount = basePrice * (gstRate / 100);
    const costWithGst = basePrice + gstAmount;

    let profitAmount = 0;
    if (profitType === 'percentage') {
        profitAmount = costWithGst * (parseFloat(profitValue) / 100);
    } else {
        profitAmount = parseFloat(profitValue) || 0;
    }

    const finalTotal = costWithGst + profitAmount;

    const handleSave = async () => {
        if (!motorName || !basePrice) {
            alert("Please enter Motor Name and Purchase Price");
            return;
        }

        const calculation = {
            id: Date.now(),
            motorId: selectedMotorId === 'new' ? null : selectedMotorId,
            name: motorName,
            purchaseBase: basePrice,
            gstRate,
            costWithGst,
            profitAmount,
            finalTotal,
            date: new Date().toISOString()
        };

        const updated = [calculation, ...savedMotors];
        setSavedMotors(updated);
        localStorage.setItem('saved_motors', JSON.stringify(updated));

        if (saveToInventory) {
            try {
                if (selectedMotorId === 'new' || !inventory.find(i => i.id === selectedMotorId)) {
                    const newItem = {
                        name: motorName,
                        category: 'Motor',
                        price: parseFloat(finalTotal.toFixed(2)),
                        stock: 0,
                        description: 'Added via Calculator',
                        image: motorImage
                    };
                    const res = await fetch('/api/inventory', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newItem)
                    });
                    if (res.ok) {
                        fetchInventory();
                        alert("Saved to Inventory successfully!");
                    }
                } else {
                    const res = await fetch(`/api/inventory/${selectedMotorId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ price: parseFloat(finalTotal.toFixed(2)) })
                    });
                    if (res.ok) fetchInventory();
                }
            } catch (err) {
                console.error("Failed to save to inventory", err);
            }
        }
    };

    const handleDelete = (id) => {
        const updated = savedMotors.filter(m => m.id !== id);
        setSavedMotors(updated);
        localStorage.setItem('saved_motors', JSON.stringify(updated));
    };

    return (
        <div className="p-10 max-w-[1600px] mx-auto">
            <PageHeader
                title="Motor Price Calculator"
                subtitle="Calculate landed costs, profit margins, and final sell prices."
                icon={Calculator}
                backTo="/tools"
            />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-4xl">
                <div style={{ marginTop: 0, marginBottom: 20 }}>
                    <div style={{ position: 'relative' }}>
                        <select
                            style={{ ...inputStyle, appearance: 'none' }}
                            onChange={handleMotorSelect}
                            value={selectedMotorId || ''}
                        >
                            <option value="" disabled>-- Select Stock Motor --</option>
                            <option value="new">+ Create New Motor</option>
                            {inventory.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        <div style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none', color: 'var(--color-text-tertiary)' }}>▼</div>
                    </div>
                    {(selectedMotorId === 'new' || !selectedMotorId) && (
                        <input
                            placeholder="Motor Name"
                            value={motorName}
                            onChange={(e) => { setMotorName(e.target.value); setSelectedMotorId('new'); }}
                            style={{ ...inputStyle, marginTop: 8 }}
                        />
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Price & GST</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ ...inputWrapperStyle, flex: 1.5 }}>
                                    <IndianRupee size={16} style={inputIconStyle} />
                                    <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} style={inputStyle} placeholder="Base Price" />
                                </div>
                                <select
                                    value={gstRate}
                                    onChange={(e) => setGstRate(Number(e.target.value))}
                                    style={{ ...inputStyle, flex: 1, paddingLeft: 12 }}
                                >
                                    <option value={12}>12%</option>
                                    <option value={18}>18%</option>
                                    <option value={28}>28%</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>My Profit</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ ...inputWrapperStyle, flex: 1 }}>
                                    <div style={{ position: 'absolute', left: 12, fontSize: '0.9rem', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                                        {profitType === 'percentage' ? '%' : '₹'}
                                    </div>
                                    <input
                                        type="number"
                                        value={profitValue}
                                        onChange={(e) => setProfitValue(e.target.value)}
                                        style={inputStyle}
                                    />
                                </div>
                                <button
                                    onClick={() => setProfitType(profitType === 'percentage' ? 'fixed' : 'percentage')}
                                    style={{ ...chipStyle, background: 'var(--color-background-subtle)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                                >
                                    {profitType === 'percentage' ? 'Percent' : 'Fixed'}
                                </button>
                            </div>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer', marginTop: 4 }}>
                            <input type="checkbox" checked={saveToInventory} onChange={(e) => setSaveToInventory(e.target.checked)} style={{ accentColor: 'var(--color-accent)' }} />
                            <span>Save this price to Inventory</span>
                        </label>

                        <button onClick={handleSave} style={primaryButtonStyle}><Save size={16} /> Calculate & Save</button>
                    </div>

                    <div style={{ background: 'var(--color-background-subtle)', borderRadius: 'var(--radius-md)', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={rowStyle}>
                            <span>Base Price</span>
                            <span>{basePrice.toFixed(0)}</span>
                        </div>
                        <div style={rowStyle}>
                            <span>GST ({gstRate}%)</span>
                            <span>{gstAmount.toFixed(0)}</span>
                        </div>
                        <div style={{ ...rowStyle, color: 'var(--color-text-primary)', fontWeight: 600, marginTop: 8, marginBottom: 16, borderTop: '1px dashed var(--color-border)', paddingTop: 8 }}>
                            <span>Landed Cost</span>
                            <span>{costWithGst.toFixed(0)}</span>
                        </div>

                        <div style={rowStyle}>
                            <span>Profit</span>
                            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{profitAmount.toFixed(0)}</span>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                            <div style={{
                                background: 'rgba(52, 199, 89, 0.1)', color: 'var(--color-success)',
                                padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600
                            }}>
                                {((profitAmount / (costWithGst || 1)) * 100).toFixed(1)}% Markup
                            </div>
                            <div style={{
                                background: 'rgba(0, 122, 255, 0.1)', color: 'var(--color-accent)',
                                padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600
                            }}>
                                {((profitAmount / (finalTotal || 1)) * 100).toFixed(1)}% Margin
                            </div>
                        </div>

                        <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total Sell Price</span>
                            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>
                                ₹{finalTotal.toFixed(0)}
                            </span>
                        </div>
                    </div>
                </div>

                {savedMotors.length > 0 && (
                    <div style={{ marginTop: 32 }}>
                        <h4 style={{ marginBottom: 12, fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>Saved Calculations (History)</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                            {savedMotors.map(m => (
                                <div key={m.id} style={{
                                    padding: 12, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                                    position: 'relative', background: 'white', display: 'flex', flexDirection: 'column', gap: 6
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{m.name}</div>
                                        <button onClick={() => handleDelete(m.id)} style={{ padding: 2, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}><Trash2 size={14} /></button>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Cost: ₹{m.costWithGst.toFixed(0)} | Profit: ₹{m.profitAmount.toFixed(0)}</div>

                                    <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{new Date(m.date).toLocaleString()}</span>
                                        <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>₹{m.finalTotal.toFixed(0)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MotorCalculator;
