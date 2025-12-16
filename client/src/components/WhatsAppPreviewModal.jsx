import React, { useState, useEffect } from 'react';
import { getBaseUrl } from '../config/api';
import { X, MessageCircle, FileText, Check, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const getISOWeek = (dateStr) => {
    const d = new Date(dateStr);
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};

const WhatsAppPreviewModal = ({ isOpen, onClose, pdfBlob, employeeName, periodEnd, periodStart, employeeContact, netPay }) => {
    const { addToast } = useToast();
    const API_URL = getBaseUrl();
    const [sending, setSending] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [contact, setContact] = useState(employeeContact || '');

    // Calculate Filename
    const startWeek = periodStart ? getISOWeek(periodStart) : '?';
    const endWeek = periodEnd ? getISOWeek(periodEnd) : '?';
    // Format: Payslip_Name_Week 43 - 44.pdf
    const filename = `Payslip_${employeeName.replace(/\s+/g, '_')}_Week ${startWeek} - ${endWeek}.pdf`;

    useEffect(() => {
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [pdfBlob]);

    const handleSend = async () => {
        if (!contact) {
            alert('Please enter a WhatsApp number.');
            return;
        }

        setSending(true);
        try {
            // 1. Archive on Server
            const formData = new FormData();
            formData.append('file', pdfBlob, filename);
            formData.append('employeeName', employeeName);
            formData.append('periodEnd', periodEnd);
            formData.append('contact', contact);
            formData.append('netPay', netPay);

            // Attempt to archive (don't block UI on failure if offline, but good to try)
            await fetch(`${API_URL}/whatsapp/send`, {
                method: 'POST',
                body: formData
            }).catch(err => console.error("Server archive failed", err));

            // 2. Download File locally (so user can attach it)
            const downloadUrl = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            // 3. Open WhatsApp Web
            const message = `Hi ${employeeName}, here is your payslip for period ending ${periodEnd}. Net Pay: ₹${Number(netPay).toLocaleString()}. Please see the attached PDF.`;
            const waUrl = `https://wa.me/${contact.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;

            window.open(waUrl, '_blank');

            addToast('Opening WhatsApp... Please attach the downloaded payslip.', 'success');
            onClose();

        } catch (error) {
            console.error('Share failed', error);
            addToast('Error processing share action.', 'error');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 3000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white', borderRadius: '16px', width: '90%', maxWidth: '500px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageCircle size={20} color="#25D366" />
                        Share Payslip
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', flex: 1 }}>
                    {/* PDF Preview Card */}
                    <div style={{
                        background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '12px', padding: '16px',
                        display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'
                    }}>
                        <div style={{
                            width: '48px', height: '48px', background: '#ffebee', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d32f2f'
                        }}>
                            <FileText size={24} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                                {filename}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                                {(pdfBlob?.size / 1024).toFixed(1)} KB • Ready to send
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto' }}>
                            <Check size={20} color="#2e7d32" />
                        </div>
                    </div>

                    {/* Contact Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#444' }}>
                            WhatsApp Number
                        </label>
                        <input
                            type="text"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            placeholder="+91 98765 43210"
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd',
                                fontSize: '14px', fontFamily: 'inherit'
                            }}
                        />
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} />
                            Will send to this number via WhatsApp Business.
                        </div>
                    </div>

                    {/* Message Preview */}
                    <div style={{ padding: '12px', background: '#e8f5e9', borderRadius: '8px', fontSize: '13px', color: '#1b5e20', display: 'flex', gap: '8px' }}>
                        <MessageCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <strong>Message Preview:</strong><br />
                            "Hi {employeeName}, here is your payslip for period ending {periodEnd}. Net Pay: {'₹' + netPay.toLocaleString()}."
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '20px', background: '#f8f9fa', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        disabled={sending}
                        style={{
                            padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: 'white',
                            color: '#444', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        style={{
                            padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#25D366',
                            color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            opacity: sending ? 0.7 : 1
                        }}
                    >
                        {sending ? 'Sending...' : 'Send via WhatsApp'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppPreviewModal;
