import React, { useState } from 'react';
import { Zap, Save, IndianRupee, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import PageHeader from './PageHeader';

const labelStyle = { display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-secondary)' };
const inputWrapperStyle = { position: 'relative', display: 'flex', alignItems: 'center' };
const inputIconStyle = { position: 'absolute', left: 12, color: 'var(--color-text-tertiary)' };
const inputStyle = { width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '1rem' };
const chipStyle = { padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s' };
const primaryButtonStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, marginTop: 8 };
const rowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.95rem' };

const SplitBilling = () => {
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
        <div className="p-10 max-w-[1600px] mx-auto">
            <PageHeader
                title="Split Billing Adjuster"
                subtitle="Calculate cash vs bill splits for customer estimates."
                icon={Zap}
                backTo="/tools"
            />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-4xl">
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
            </div>

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
        </div>
    );
};

export default SplitBilling;
