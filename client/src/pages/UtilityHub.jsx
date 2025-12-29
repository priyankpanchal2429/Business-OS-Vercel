import { useState, useEffect } from 'react';
import { Calculator, Zap, Save, Trash2, IndianRupee, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import PageHeader from '../components/PageHeader';
import PlantLayoutVisualPlanner from '../components/PlantLayoutVisualPlanner';
import ElectricalPanelBoardPlanner from '../components/ElectricalPanelBoardPlanner';
import LabelPrintPlanner from '../components/LabelPrintPlanner';
import ChequePrinterPlanner from '../components/ChequePrinterPlanner';

const labelStyle = { display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-secondary)' };
const inputWrapperStyle = { position: 'relative', display: 'flex', alignItems: 'center' };
const inputIconStyle = { position: 'absolute', left: 12, color: 'var(--color-text-tertiary)' };
const inputStyle = { width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '1rem' };
const chipStyle = { padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s' };
const primaryButtonStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, marginTop: 8 };
const rowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.95rem' };

const UtilityModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
            {/* Note: No onClick on backdrop to close, per user request */}
            <div style={{
                background: 'white', borderRadius: 16, width: '100%', maxWidth: '1000px', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
            }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{title}</h2>
                    <button onClick={onClose} style={{
                        background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}>
                        <X size={20} color="#64748B" />
                    </button>
                </div>
                <div style={{ padding: '24px', overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

const UtilityHub = () => {
    return (
        <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>
            <PageHeader
                title="Utility Hub"
                subtitle="Essential tools and planners for your business operations."
                icon={Calculator}
            />

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
                alignItems: 'stretch'
            }}>
                <MotorCalculatorCard />
                <SplitBillingCard />
                <PlantLayoutVisualPlanner />
                <ElectricalPanelBoardPlanner />
                <LabelPrintPlanner />
                <ChequePrinterPlanner />
            </div>
        </div>
    );
};

const MotorCalculatorCard = () => {
    const [isOpen, setIsOpen] = useState(false);
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
        <>
            <div style={{
                background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0',
                overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease', cursor: 'pointer', height: '100%',
                display: 'flex', flexDirection: 'column'
            }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; e.currentTarget.style.borderColor = '#3B82F6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                onClick={() => setIsOpen(true)}>
                <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', overflow: 'hidden' }}>
                        {motorImage ? <img src={motorImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Calculator size={28} />}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>{motorName || 'Motor Price'}</h3>
                        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.9rem' }}>Quick Estimator</p>
                    </div>
                </div>
            </div>

            <UtilityModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Motor Price Calculator">
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
            </UtilityModal>
        </>
    );
};

const SplitBillingCard = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [originalPrice, setOriginalPrice] = useState('');
    const [cashPercent, setCashPercent] = useState(50);
    const [gstRate, setGstRate] = useState(18);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const price = parseFloat(originalPrice) || 0;
    const cashAmount = price * (cashPercent / 100);
    const billableAmount = price - cashAmount;
    const gstValue = billableAmount * (gstRate / 100);
    const finalTotal = billableAmount + gstValue;

    // Full Bill Calculation
    const fullBillGst = price * (gstRate / 100);
    const fullBillTotal = price + fullBillGst;
    const savings = fullBillTotal - finalTotal;

    const handleDownloadImage = async () => {
        const element = document.getElementById('estimate-modal-content');
        if (element) {
            const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 });
            const link = document.createElement('a');
            link.download = `Estimate-${new Date().getTime()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    return (
        <>
            <div style={{
                background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0',
                overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease', cursor: 'pointer', height: '100%',
                display: 'flex', flexDirection: 'column'
            }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; e.currentTarget.style.borderColor = '#F59E0B'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                onClick={() => setIsOpen(true)}>
                <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                        <Zap size={28} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Split Billing</h3>
                        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.9rem' }}>Cash vs Bill Adjuster</p>
                    </div>
                </div>
            </div>

            <UtilityModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Split Billing Adjuster">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Original Price (No GST)</label>
                            <div style={inputWrapperStyle}>
                                <IndianRupee size={16} style={inputIconStyle} />
                                <input
                                    type="number"
                                    value={originalPrice}
                                    onChange={(e) => setOriginalPrice(e.target.value)}
                                    style={inputStyle}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Cash Percentage: {cashPercent}%</label>
                            <input
                                type="range"
                                min="0" max="100" step="5"
                                value={cashPercent}
                                onChange={(e) => setCashPercent(Number(e.target.value))}
                                style={{ width: '100%', accentColor: '#ff9500' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                                <span>0% (Full Bill)</span>
                                <span>50/50</span>
                                <span>100% (No Bill)</span>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>GST Rate</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[12, 18, 28].map(rate => (
                                    <button
                                        key={rate}
                                        onClick={() => setGstRate(rate)}
                                        style={{
                                            ...chipStyle,
                                            background: gstRate === rate ? '#ff9500' : 'var(--color-background-subtle)',
                                            color: gstRate === rate ? 'white' : 'var(--color-text-primary)'
                                        }}
                                    >
                                        {rate}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={() => setShowPreviewModal(true)} style={{ ...primaryButtonStyle, background: '#ff9500' }}>
                            <Save size={16} /> View Estimate & Share
                        </button>
                    </div>

                    <div style={{ background: 'var(--color-background-subtle)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={rowStyle}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>Cash Component</span>
                            <span style={{ color: '#ff9500', fontWeight: 700, fontSize: '1.1rem' }}>₹{cashAmount.toFixed(0)}</span>
                        </div>
                        <div style={{ margin: '16px 0', borderTop: '2px dashed var(--color-border-subtle)' }}></div>
                        <div style={rowStyle}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>Billable Amount</span>
                            <span style={{ fontWeight: 600 }}>₹{billableAmount.toFixed(0)}</span>
                        </div>
                        <div style={{ ...rowStyle, marginTop: 12 }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>GST ({gstRate}%)</span>
                            <span style={{ color: 'var(--color-text-primary)' }}>+ ₹{gstValue.toFixed(0)}</span>
                        </div>
                        <div style={{ margin: '16px 0', borderTop: '1px solid var(--color-border)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total Payable</span>
                            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>₹{finalTotal.toFixed(0)}</span>
                        </div>

                        {savings > 0 && (
                            <div style={{ marginTop: 20, padding: 12, background: 'white', borderRadius: 8, border: '1px solid #34C759', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Total Savings</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34C759' }}>₹{savings.toFixed(0)}</div>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ marginTop: 24, padding: 12, background: 'rgba(255, 149, 0, 0.1)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#ff9500' }}></div>
                    <span style={{ color: '#d47b00', fontWeight: 500 }}>Note: This is an internal calculation tool, not a valid tax invoice.</span>
                </div>
            </UtilityModal>

            {showPreviewModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
                }}>
                    <div style={{ background: 'white', borderRadius: 16, maxWidth: 600, width: '90%', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Estimate Comparison</h3>
                            <button onClick={() => setShowPreviewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div id="estimate-modal-content" style={{ padding: 24, background: '#f8f9fa' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Payment Estimate</div>
                                <div style={{
                                    textAlign: 'right',
                                    fontSize: '0.85rem',
                                    color: 'var(--color-text-secondary)',
                                    background: 'var(--color-background-subtle)',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontWeight: 500
                                }}>
                                    {new Date().toLocaleString()}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 20 }}>
                                {/* Standard Invoice Card */}
                                <div style={{ flex: 1, background: 'white', padding: 20, borderRadius: 12, border: '1px solid #eee', opacity: 0.7 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 16, color: '#666' }}>Standard Invoice (100% Tax)</div>
                                    <div style={rowStyle}><span>Item Value</span><span>₹{price.toFixed(0)}</span></div>
                                    <div style={rowStyle}><span>GST ({gstRate}%)</span><span>₹{fullBillGst.toFixed(0)}</span></div>
                                    <div style={{ borderTop: '1px solid #eee', margin: '12px 0' }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                        <span>Total</span>
                                        <span>₹{fullBillTotal.toFixed(0)}</span>
                                    </div>
                                </div>

                                {/* Smart Deal Card */}
                                <div style={{ flex: 1, background: '#fff9e6', padding: 20, borderRadius: 12, border: '1px solid #ffeeba', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: -10, right: 10, background: '#34C759', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>Recommended</div>
                                    <div style={{ fontWeight: 600, marginBottom: 16, color: '#d47b00' }}>Smart Invoice (Split)</div>
                                    <div style={rowStyle}><span>Bill Amount</span><span>₹{billableAmount.toFixed(0)}</span></div>
                                    <div style={rowStyle}><span>GST ({gstRate}%)</span><span>₹{gstValue.toFixed(0)}</span></div>
                                    <div style={rowStyle}><span>Cash Part</span><span>₹{cashAmount.toFixed(0)}</span></div>
                                    <div style={{ borderTop: '1px dashed #d47b00', margin: '12px 0' }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem', color: '#d47b00' }}>
                                        <span>You Pay</span>
                                        <span>₹{finalTotal.toFixed(0)}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 24, background: '#d1fae5', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #34d399' }}>
                                <span style={{ color: '#047857', fontWeight: 600 }}>Total Savings with Smart Invoice</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857' }}>₹{savings.toFixed(0)}</span>
                            </div>
                        </div>

                        <div style={{ padding: 20, background: 'white', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button onClick={() => setShowPreviewModal(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>Close</button>
                            <button onClick={handleDownloadImage} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#007aff', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Download size={18} /> Download Image
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UtilityHub;
