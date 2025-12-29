import { useState, useEffect, useRef } from 'react';
import {
    Building2, Calendar, User, IndianRupee, Printer, Settings2,
    History, Plus, Save, Trash2, X, AlertTriangle, FileText,
    ChevronDown, Check, RotateCcw, Download
} from 'lucide-react';

// ==================== CONSTANTS ====================

const CHEQUE_WIDTH_MM = 202;
const CHEQUE_HEIGHT_MM = 92;
const MM_TO_PX = 3.78; // 96 DPI conversion

// Default bank templates (CTS-2010 compliant positions in mm)
// Based on Bank of Baroda reference cheque layout
const DEFAULT_BANK_TEMPLATES = {
    'bank_of_baroda': {
        id: 'bank_of_baroda',
        name: 'Bank of Baroda',
        color: '#FF6B00',
        logo: '/bank-logos/bank_of_baroda.png',
        // Positions calibrated from reference cheque image (in mm)
        positions: {
            dateDay: { x: 158, y: 12 },
            dateMonth: { x: 170, y: 12 },
            dateYear: { x: 180, y: 12 },
            payee: { x: 25, y: 28 },
            amountWords1: { x: 42, y: 38 },
            amountWords2: { x: 8, y: 48 },
            amountFigures: { x: 175, y: 32 },
            acPayee: { x: 5, y: 15 }
        },
        // Template layout zones for visual guide (percentages) - matches actual BoB cheque
        zones: {
            bankLogo: { x: 1, y: 3, w: 18, h: 18, label: 'बैंक ऑफ़ बड़ौदा' },
            branchInfo: { x: 20, y: 3, w: 35, h: 12, label: 'Branch / IFSC Code' },
            dateLabel: { x: 56, y: 3, w: 18, h: 8, label: 'Valid for 3 months' },
            dateBoxes: { x: 76, y: 3, w: 22, h: 12, label: 'DD MM YYYY' },
            accountType: { x: 56, y: 12, w: 20, h: 8, label: 'CURRENT A/C' },
            payLine: { x: 1, y: 24, w: 78, h: 10, label: 'Pay ___________________________' },
            bearerBox: { x: 80, y: 22, w: 18, h: 14, label: 'or Bearer' },
            rupeesLine1: { x: 1, y: 36, w: 78, h: 10, label: 'Rupees रुपये ___________________________' },
            amountBox: { x: 80, y: 36, w: 18, h: 12, label: '₹ _____' },
            rupeesLine2: { x: 1, y: 48, w: 60, h: 8, label: '_________________________________ अदा करें' },
            accountNo: { x: 1, y: 60, w: 40, h: 12, label: 'A/c No: XXXXXXXXXX' },
            ifscCode: { x: 42, y: 60, w: 25, h: 12, label: 'IFSC: XXXXXXX' },
            companyName: { x: 68, y: 58, w: 30, h: 10, label: 'For Company Name' },
            signatureArea: { x: 68, y: 68, w: 30, h: 14, label: 'SIGNATORY AUTHORITY' },
            micrBand: { x: 0, y: 84, w: 100, h: 16, label: '॥ MICR Code ॥' }
        }
    },
    'sbi': {
        id: 'sbi',
        name: 'State Bank of India',
        color: '#0066B3',
        logo: '/bank-logos/sbi.png',
        logoScale: 80, // percentage
        positions: {
            dateDay: { x: 158, y: 10 },
            dateMonth: { x: 170, y: 10 },
            dateYear: { x: 182, y: 10 },
            payee: { x: 38, y: 26 },
            amountWords1: { x: 22, y: 40 },
            amountWords2: { x: 22, y: 50 },
            amountFigures: { x: 168, y: 40 },
            acPayee: { x: 12, y: 6 }
        }
    },
    'hdfc': {
        id: 'hdfc',
        name: 'HDFC Bank',
        color: '#004C8F',
        logo: '/bank-logos/hdfc.png',
        logoScale: 80, // percentage
        positions: {
            dateDay: { x: 156, y: 11 },
            dateMonth: { x: 168, y: 11 },
            dateYear: { x: 180, y: 11 },
            payee: { x: 36, y: 27 },
            amountWords1: { x: 20, y: 41 },
            amountWords2: { x: 20, y: 51 },
            amountFigures: { x: 166, y: 41 },
            acPayee: { x: 10, y: 7 }
        }
    },
    'icici': {
        id: 'icici',
        name: 'ICICI Bank',
        color: '#F58220',
        logo: '/bank-logos/icici.png',
        logoScale: 80, // percentage
        positions: {
            dateDay: { x: 157, y: 12 },
            dateMonth: { x: 169, y: 12 },
            dateYear: { x: 181, y: 12 },
            payee: { x: 37, y: 28 },
            amountWords1: { x: 21, y: 42 },
            amountWords2: { x: 21, y: 52 },
            amountFigures: { x: 167, y: 42 },
            acPayee: { x: 11, y: 8 }
        }
    }
};

// ==================== UTILITY FUNCTIONS ====================

// Convert number to words (Indian system)
const numberToWords = (num) => {
    if (num === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanHundred = (n) => {
        if (n < 20) return ones[n];
        return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    };

    const convertLessThanThousand = (n) => {
        if (n < 100) return convertLessThanHundred(n);
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanHundred(n % 100) : '');
    };

    let result = '';
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    if (crore) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh) result += convertLessThanHundred(lakh) + ' Lakh ';
    if (thousand) result += convertLessThanHundred(thousand) + ' Thousand ';
    if (remainder) result += convertLessThanThousand(remainder);

    return result.trim();
};

const amountToWords = (amount) => {
    const num = parseFloat(amount) || 0;
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let result = 'Rupees ' + numberToWords(rupees);
    if (paise > 0) {
        result += ' and ' + numberToWords(paise) + ' Paise';
    }
    result += ' Only';
    return result;
};

const formatDate = (date) => {
    const d = new Date(date);
    return {
        day: String(d.getDate()).padStart(2, '0'),
        month: String(d.getMonth() + 1).padStart(2, '0'),
        year: String(d.getFullYear())
    };
};

// ==================== STYLES ====================

const cardStyle = {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
};

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s'
};

const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: '#64748B'
};

const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    transition: 'all 0.2s'
};

// ==================== MAIN COMPONENT ====================

const ChequePrinterPlanner = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('entry'); // entry, templates, history

    // Bank & Template
    const [selectedBank, setSelectedBank] = useState('bank_of_baroda');
    const [customTemplates, setCustomTemplates] = useState({});

    // Cheque Entry
    const [chequeDate, setChequeDate] = useState(new Date().toISOString().split('T')[0]);
    const [payeeName, setPayeeName] = useState('');
    const [amount, setAmount] = useState('');
    const [amountWords, setAmountWords] = useState('');
    const [isACPayee, setIsACPayee] = useState(true);
    const [isBearer, setIsBearer] = useState(false);
    const [chequeNumber, setChequeNumber] = useState('');

    // Print Controls
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [isTestMode, setIsTestMode] = useState(false);

    // History
    const [printHistory, setPrintHistory] = useState([]);

    // Confirmation Dialog
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const previewRef = useRef(null);

    // Load saved data on mount
    useEffect(() => {
        const savedTemplates = localStorage.getItem('cheque_custom_templates');
        const savedHistory = localStorage.getItem('cheque_print_history');
        const savedOffsets = localStorage.getItem('cheque_print_offsets');

        if (savedTemplates) setCustomTemplates(JSON.parse(savedTemplates));
        if (savedHistory) setPrintHistory(JSON.parse(savedHistory));
        if (savedOffsets) {
            const offsets = JSON.parse(savedOffsets);
            setOffsetX(offsets.x || 0);
            setOffsetY(offsets.y || 0);
        }
    }, []);

    // Auto-generate amount in words
    useEffect(() => {
        if (amount) {
            setAmountWords(amountToWords(amount));
        } else {
            setAmountWords('');
        }
    }, [amount]);

    // Save offsets when changed
    useEffect(() => {
        localStorage.setItem('cheque_print_offsets', JSON.stringify({ x: offsetX, y: offsetY }));
    }, [offsetX, offsetY]);

    const getAllTemplates = () => ({ ...DEFAULT_BANK_TEMPLATES, ...customTemplates });
    const currentTemplate = getAllTemplates()[selectedBank] || DEFAULT_BANK_TEMPLATES.bank_of_baroda;

    const handlePrint = () => {
        if (!payeeName || !amount) {
            alert('Please enter Payee Name and Amount');
            return;
        }
        setShowConfirmDialog(true);
    };

    const confirmPrint = () => {
        // Save to history
        const historyEntry = {
            id: Date.now(),
            date: chequeDate,
            bank: currentTemplate.name,
            bankId: selectedBank,
            payee: payeeName,
            amount: parseFloat(amount),
            chequeNumber,
            isACPayee,
            isBearer,
            printedAt: new Date().toISOString()
        };

        const newHistory = [historyEntry, ...printHistory].slice(0, 100); // Keep last 100
        setPrintHistory(newHistory);
        localStorage.setItem('cheque_print_history', JSON.stringify(newHistory));

        setShowConfirmDialog(false);

        // Trigger print
        setTimeout(() => {
            const printContent = document.getElementById('cheque-print-area');
            if (printContent) {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Print Cheque</title>
                        <style>
                            @page {
                                size: 202mm 92mm;
                                margin: 0;
                            }
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body { 
                                width: 202mm; 
                                height: 92mm; 
                                font-family: 'Courier New', monospace;
                                position: relative;
                            }
                            .cheque-field {
                                position: absolute;
                                font-size: 12pt;
                                font-weight: bold;
                            }
                            .watermark {
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%) rotate(-30deg);
                                font-size: 48pt;
                                color: rgba(255, 0, 0, 0.15);
                                font-weight: bold;
                                pointer-events: none;
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent.innerHTML}
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }
        }, 100);
    };

    const handleReprint = (entry) => {
        setSelectedBank(entry.bankId);
        setChequeDate(entry.date);
        setPayeeName(entry.payee);
        setAmount(String(entry.amount));
        setChequeNumber(entry.chequeNumber || '');
        setIsACPayee(entry.isACPayee);
        setIsBearer(entry.isBearer);
        setActiveTab('entry');
    };

    const deleteHistoryEntry = (id) => {
        const newHistory = printHistory.filter(h => h.id !== id);
        setPrintHistory(newHistory);
        localStorage.setItem('cheque_print_history', JSON.stringify(newHistory));
    };

    const clearForm = () => {
        setPayeeName('');
        setAmount('');
        setChequeNumber('');
        setChequeDate(new Date().toISOString().split('T')[0]);
    };

    const dateFormatted = formatDate(chequeDate);

    // Split amount words into two lines if too long
    const splitAmountWords = (words) => {
        if (words.length <= 50) return { line1: words, line2: '' };
        const midPoint = words.lastIndexOf(' ', 50);
        return {
            line1: words.substring(0, midPoint),
            line2: words.substring(midPoint + 1)
        };
    };
    const amountWordsSplit = splitAmountWords(amountWords);

    return (
        <>
            {/* Card View */}
            <div
                style={cardStyle}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#10B981';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                }}
                onClick={() => setIsOpen(true)}
            >
                <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 12,
                        background: '#ECFDF5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#10B981'
                    }}>
                        <Building2 size={28} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                            Cheque Printer
                        </h3>
                        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.9rem' }}>
                            Print aligned cheques
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal View */}
            {isOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: 'white', borderRadius: 16, width: '100%', maxWidth: '1200px', maxHeight: '90vh',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '16px 24px', borderBottom: '1px solid #eee',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Building2 size={24} color="#10B981" />
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                                    Bank Cheque Printer
                                </h2>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: '#f1f5f9', border: 'none', borderRadius: '50%',
                                    width: 32, height: 32, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', cursor: 'pointer'
                                }}
                            >
                                <X size={20} color="#64748B" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{
                            display: 'flex', gap: '4px', padding: '12px 24px',
                            background: '#f8fafc', borderBottom: '1px solid #e2e8f0'
                        }}>
                            {[
                                { id: 'entry', label: 'Cheque Entry', icon: FileText },
                                { id: 'templates', label: 'Bank Templates', icon: Settings2 },
                                { id: 'history', label: 'Print History', icon: History }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        ...buttonStyle,
                                        background: activeTab === tab.id ? '#10B981' : 'white',
                                        color: activeTab === tab.id ? 'white' : '#64748B',
                                        border: activeTab === tab.id ? 'none' : '1px solid #e2e8f0'
                                    }}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                            {activeTab === 'entry' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
                                    {/* Left: Entry Form */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {/* Bank Selector */}
                                        <div>
                                            <label style={labelStyle}>Select Bank</label>
                                            <div style={{ position: 'relative' }}>
                                                <select
                                                    value={selectedBank}
                                                    onChange={(e) => setSelectedBank(e.target.value)}
                                                    style={{ ...inputStyle, appearance: 'none', paddingRight: '36px' }}
                                                >
                                                    {Object.values(getAllTemplates()).map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} style={{
                                                    position: 'absolute', right: 12, top: '50%',
                                                    transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8'
                                                }} />
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <label style={labelStyle}>Date</label>
                                            <input
                                                type="date"
                                                value={chequeDate}
                                                onChange={(e) => setChequeDate(e.target.value)}
                                                style={inputStyle}
                                            />
                                        </div>

                                        {/* Payee Name */}
                                        <div>
                                            <label style={labelStyle}>Pay To (Payee Name)</label>
                                            <div style={{ position: 'relative' }}>
                                                <User size={16} style={{
                                                    position: 'absolute', left: 12, top: '50%',
                                                    transform: 'translateY(-50%)', color: '#94a3b8'
                                                }} />
                                                <input
                                                    type="text"
                                                    value={payeeName}
                                                    onChange={(e) => setPayeeName(e.target.value.toUpperCase())}
                                                    placeholder="PAYEE NAME"
                                                    style={{ ...inputStyle, paddingLeft: '40px', textTransform: 'uppercase' }}
                                                />
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div>
                                            <label style={labelStyle}>Amount (₹)</label>
                                            <div style={{ position: 'relative' }}>
                                                <IndianRupee size={16} style={{
                                                    position: 'absolute', left: 12, top: '50%',
                                                    transform: 'translateY(-50%)', color: '#94a3b8'
                                                }} />
                                                <input
                                                    type="number"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    style={{ ...inputStyle, paddingLeft: '40px' }}
                                                />
                                            </div>
                                        </div>

                                        {/* Amount in Words */}
                                        <div>
                                            <label style={labelStyle}>Amount in Words</label>
                                            <textarea
                                                value={amountWords}
                                                onChange={(e) => setAmountWords(e.target.value)}
                                                rows={2}
                                                style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
                                            />
                                        </div>

                                        {/* Toggles */}
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <label style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                cursor: 'pointer', fontSize: '0.9rem'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isACPayee}
                                                    onChange={(e) => setIsACPayee(e.target.checked)}
                                                    style={{ accentColor: '#10B981' }}
                                                />
                                                A/C Payee Only
                                            </label>
                                            <label style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                cursor: 'pointer', fontSize: '0.9rem'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isBearer}
                                                    onChange={(e) => setIsBearer(e.target.checked)}
                                                    style={{ accentColor: '#10B981' }}
                                                />
                                                Bearer
                                            </label>
                                        </div>

                                        {/* Cheque Number */}
                                        <div>
                                            <label style={labelStyle}>Cheque Number (Optional)</label>
                                            <input
                                                type="text"
                                                value={chequeNumber}
                                                onChange={(e) => setChequeNumber(e.target.value)}
                                                placeholder="For tracking only"
                                                style={inputStyle}
                                            />
                                        </div>

                                        {/* Print Offset Controls */}
                                        <div style={{
                                            marginTop: '8px', padding: '16px',
                                            background: '#f8fafc', borderRadius: '12px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                marginBottom: '12px', color: '#64748B', fontSize: '0.85rem', fontWeight: 600
                                            }}>
                                                <Settings2 size={14} />
                                                Print Alignment (mm)
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>X Offset</label>
                                                    <input
                                                        type="number"
                                                        value={offsetX}
                                                        onChange={(e) => setOffsetX(Number(e.target.value))}
                                                        step="0.5"
                                                        style={{ ...inputStyle, padding: '8px' }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Y Offset</label>
                                                    <input
                                                        type="number"
                                                        value={offsetY}
                                                        onChange={(e) => setOffsetY(Number(e.target.value))}
                                                        step="0.5"
                                                        style={{ ...inputStyle, padding: '8px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Test Mode Toggle */}
                                        <label style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '12px', background: isTestMode ? '#FEF3C7' : '#f8fafc',
                                            borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
                                            border: isTestMode ? '1px solid #F59E0B' : '1px solid #e2e8f0'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={isTestMode}
                                                onChange={(e) => setIsTestMode(e.target.checked)}
                                                style={{ accentColor: '#F59E0B' }}
                                            />
                                            <AlertTriangle size={16} color={isTestMode ? '#F59E0B' : '#94a3b8'} />
                                            Test Print Mode (SAMPLE watermark)
                                        </label>
                                    </div>

                                    {/* Right: Preview */}
                                    <div>
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            alignItems: 'center', marginBottom: '12px'
                                        }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>
                                                Preview (Scaled)
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem', color: '#94a3b8',
                                                background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px'
                                            }}>
                                                {currentTemplate.name}
                                            </span>
                                        </div>

                                        {/* Cheque Preview */}
                                        <div style={{
                                            width: '100%',
                                            aspectRatio: `${CHEQUE_WIDTH_MM} / ${CHEQUE_HEIGHT_MM}`,
                                            background: '#FFFEF7',
                                            border: '2px solid #E2E8F0',
                                            borderRadius: '8px',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}>
                                            {/* Bank Color Strip */}
                                            <div style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, height: '6px',
                                                background: currentTemplate.color
                                            }} />

                                            {/* Template Zones (Schematic Guide) */}
                                            {currentTemplate.zones && Object.entries(currentTemplate.zones).map(([key, zone]) => (
                                                <div key={key} style={{
                                                    position: 'absolute',
                                                    left: `${zone.x}%`,
                                                    top: `${zone.y}%`,
                                                    width: `${zone.w}%`,
                                                    height: `${zone.h}%`,
                                                    border: key === 'micrBand' ? '2px dashed #94a3b8' : '1px dashed #cbd5e1',
                                                    borderRadius: '4px',
                                                    background: key === 'micrBand'
                                                        ? 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(148, 163, 184, 0.2) 3px, rgba(148, 163, 184, 0.2) 4px)'
                                                        : key === 'amountBox'
                                                            ? 'rgba(16, 185, 129, 0.1)'
                                                            : 'rgba(100, 116, 139, 0.05)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: key === 'amountBox' ? 'center' : 'flex-start',
                                                    padding: '0 4px',
                                                    boxSizing: 'border-box'
                                                }}>
                                                    <span style={{
                                                        fontSize: '0.45rem',
                                                        color: key === 'amountBox' ? '#10B981' : '#94a3b8',
                                                        fontWeight: key === 'amountBox' ? 600 : 400,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {zone.label}
                                                    </span>
                                                </div>
                                            ))}

                                            {/* Cheque Fields Preview - User's Entered Data */}
                                            <div ref={previewRef} style={{
                                                position: 'absolute', inset: 0,
                                                fontFamily: "'Courier New', monospace",
                                                fontSize: '0.65rem',
                                                fontWeight: 'bold',
                                                color: '#1e293b',
                                                zIndex: 10
                                            }}>
                                                {/* A/C Payee */}
                                                {isACPayee && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: `${(currentTemplate.positions.acPayee.x / CHEQUE_WIDTH_MM) * 100}%`,
                                                        top: `${(currentTemplate.positions.acPayee.y / CHEQUE_HEIGHT_MM) * 100}%`,
                                                        fontSize: '0.5rem',
                                                        border: '1px solid #333',
                                                        padding: '1px 4px',
                                                        background: 'white'
                                                    }}>
                                                        A/C PAYEE ONLY
                                                    </div>
                                                )}

                                                {/* Date */}
                                                <div style={{
                                                    position: 'absolute',
                                                    left: `${(currentTemplate.positions.dateDay.x / CHEQUE_WIDTH_MM) * 100}%`,
                                                    top: `${(currentTemplate.positions.dateDay.y / CHEQUE_HEIGHT_MM) * 100}%`,
                                                    display: 'flex', gap: '2px'
                                                }}>
                                                    <span>{dateFormatted.day}</span>
                                                    <span style={{ marginLeft: '4px' }}>{dateFormatted.month}</span>
                                                    <span style={{ marginLeft: '4px' }}>{dateFormatted.year}</span>
                                                </div>

                                                {/* Payee */}
                                                <div style={{
                                                    position: 'absolute',
                                                    left: `${(currentTemplate.positions.payee.x / CHEQUE_WIDTH_MM) * 100}%`,
                                                    top: `${(currentTemplate.positions.payee.y / CHEQUE_HEIGHT_MM) * 100}%`,
                                                    maxWidth: '60%',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {payeeName || 'PAYEE NAME'}
                                                </div>

                                                {/* Amount in Words Line 1 */}
                                                <div style={{
                                                    position: 'absolute',
                                                    left: `${(currentTemplate.positions.amountWords1.x / CHEQUE_WIDTH_MM) * 100}%`,
                                                    top: `${(currentTemplate.positions.amountWords1.y / CHEQUE_HEIGHT_MM) * 100}%`,
                                                    fontSize: '0.5rem',
                                                    maxWidth: '70%'
                                                }}>
                                                    {amountWordsSplit.line1 || 'Rupees _____ Only'}
                                                </div>

                                                {/* Amount in Words Line 2 */}
                                                {amountWordsSplit.line2 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: `${(currentTemplate.positions.amountWords2.x / CHEQUE_WIDTH_MM) * 100}%`,
                                                        top: `${(currentTemplate.positions.amountWords2.y / CHEQUE_HEIGHT_MM) * 100}%`,
                                                        fontSize: '0.5rem',
                                                        maxWidth: '70%'
                                                    }}>
                                                        {amountWordsSplit.line2}
                                                    </div>
                                                )}

                                                {/* Amount in Figures */}
                                                <div style={{
                                                    position: 'absolute',
                                                    left: `${(currentTemplate.positions.amountFigures.x / CHEQUE_WIDTH_MM) * 100}%`,
                                                    top: `${(currentTemplate.positions.amountFigures.y / CHEQUE_HEIGHT_MM) * 100}%`,
                                                    border: '1px solid #333',
                                                    padding: '2px 6px',
                                                    background: 'white'
                                                }}>
                                                    ₹{amount ? parseFloat(amount).toLocaleString('en-IN') : '0.00'}
                                                </div>



                                                {/* Test Mode Watermark */}
                                                {isTestMode && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '50%', left: '50%',
                                                        transform: 'translate(-50%, -50%) rotate(-30deg)',
                                                        fontSize: '2rem',
                                                        color: 'rgba(255, 0, 0, 0.2)',
                                                        fontWeight: 'bold',
                                                        pointerEvents: 'none'
                                                    }}>
                                                        SAMPLE
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{
                                            display: 'flex', gap: '12px', marginTop: '20px'
                                        }}>
                                            <button
                                                onClick={clearForm}
                                                style={{
                                                    ...buttonStyle, flex: 1,
                                                    background: 'white', color: '#64748B',
                                                    border: '1px solid #e2e8f0'
                                                }}
                                            >
                                                <RotateCcw size={16} />
                                                Clear
                                            </button>
                                            <button
                                                onClick={handlePrint}
                                                style={{
                                                    ...buttonStyle, flex: 2,
                                                    background: '#10B981', color: 'white'
                                                }}
                                            >
                                                <Printer size={16} />
                                                {isTestMode ? 'Test Print' : 'Print Cheque'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'templates' && (
                                <div>
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                        gap: '16px'
                                    }}>
                                        {Object.values(getAllTemplates()).map(template => (
                                            <div
                                                key={template.id}
                                                style={{
                                                    padding: '20px',
                                                    borderRadius: '12px',
                                                    border: selectedBank === template.id
                                                        ? `2px solid ${template.color}`
                                                        : '1px solid #e2e8f0',
                                                    background: selectedBank === template.id ? '#f8fafc' : 'white',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onClick={() => setSelectedBank(template.id)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    {/* Bank Logo or Fallback Initials */}
                                                    {template.logo ? (
                                                        <div style={{
                                                            width: 48, height: 48, borderRadius: 8,
                                                            background: 'white',
                                                            border: '1px solid #e2e8f0',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <img
                                                                src={template.logo}
                                                                alt={template.name}
                                                                style={{
                                                                    width: `${template.logoScale || 115}%`,
                                                                    height: `${template.logoScale || 115}%`,
                                                                    objectFit: 'contain'
                                                                }}
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.parentElement.innerHTML = template.name.split(' ').map(w => w[0]).join('').slice(0, 2);
                                                                    e.target.parentElement.style.background = template.color;
                                                                    e.target.parentElement.style.color = 'white';
                                                                    e.target.parentElement.style.fontWeight = 'bold';
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            width: 48, height: 48, borderRadius: 8,
                                                            background: template.color,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: 'white', fontWeight: 'bold', fontSize: '0.9rem'
                                                        }}>
                                                            {template.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                                            {template.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                            {template.id.startsWith('custom_') ? 'Custom Template' : 'Default Template'}
                                                        </div>
                                                    </div>
                                                    {selectedBank === template.id && (
                                                        <Check size={20} color="#10B981" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{
                                        marginTop: '24px', padding: '20px',
                                        background: '#f8fafc', borderRadius: '12px',
                                        border: '1px dashed #cbd5e1'
                                    }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            color: '#64748B', fontSize: '0.9rem'
                                        }}>
                                            <Plus size={16} />
                                            Custom template creation coming soon
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div>
                                    {printHistory.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center', padding: '60px 20px',
                                            color: '#94a3b8'
                                        }}>
                                            <History size={48} strokeWidth={1} />
                                            <p style={{ marginTop: '12px' }}>No cheques printed yet</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {printHistory.map(entry => (
                                                <div
                                                    key={entry.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '16px',
                                                        padding: '16px',
                                                        background: 'white',
                                                        borderRadius: '12px',
                                                        border: '1px solid #e2e8f0'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: 48, height: 48, borderRadius: 8,
                                                        background: '#f1f5f9',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#64748B'
                                                    }}>
                                                        <FileText size={24} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                                            {entry.payee}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.85rem', color: '#64748B',
                                                            display: 'flex', gap: '12px', marginTop: '4px'
                                                        }}>
                                                            <span>{entry.bank}</span>
                                                            <span>•</span>
                                                            <span>{new Date(entry.date).toLocaleDateString('en-IN')}</span>
                                                            {entry.chequeNumber && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>#{entry.chequeNumber}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        fontSize: '1.1rem', fontWeight: 700,
                                                        color: '#10B981'
                                                    }}>
                                                        ₹{entry.amount.toLocaleString('en-IN')}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => handleReprint(entry)}
                                                            style={{
                                                                ...buttonStyle,
                                                                padding: '8px 12px',
                                                                background: '#f1f5f9',
                                                                color: '#64748B'
                                                            }}
                                                        >
                                                            <RotateCcw size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteHistoryEntry(entry.id)}
                                                            style={{
                                                                ...buttonStyle,
                                                                padding: '8px 12px',
                                                                background: '#FEF2F2',
                                                                color: '#EF4444'
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Print Confirmation Dialog */}
            {showConfirmDialog && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 10000,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '16px', padding: '24px',
                        maxWidth: '400px', width: '90%', textAlign: 'center'
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: isTestMode ? '#FEF3C7' : '#ECFDF5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            {isTestMode ? (
                                <AlertTriangle size={32} color="#F59E0B" />
                            ) : (
                                <Printer size={32} color="#10B981" />
                            )}
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>
                            {isTestMode ? 'Test Print' : 'Print Cheque'}
                        </h3>
                        <p style={{ color: '#64748B', margin: '0 0 20px', fontSize: '0.9rem' }}>
                            {isTestMode
                                ? 'This will print with a SAMPLE watermark for alignment testing.'
                                : `Print cheque for ${payeeName} - ₹${parseFloat(amount).toLocaleString('en-IN')}?`
                            }
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                style={{
                                    ...buttonStyle, flex: 1,
                                    background: '#f1f5f9', color: '#64748B'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmPrint}
                                style={{
                                    ...buttonStyle, flex: 1,
                                    background: isTestMode ? '#F59E0B' : '#10B981',
                                    color: 'white'
                                }}
                            >
                                <Printer size={16} />
                                Confirm Print
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Area */}
            <div id="cheque-print-area" style={{ display: 'none' }}>
                <div style={{
                    width: '202mm',
                    height: '92mm',
                    position: 'relative',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '12pt',
                    fontWeight: 'bold'
                }}>
                    {/* A/C Payee */}
                    {isACPayee && (
                        <div className="cheque-field" style={{
                            left: `${currentTemplate.positions.acPayee.x + offsetX}mm`,
                            top: `${currentTemplate.positions.acPayee.y + offsetY}mm`,
                            fontSize: '8pt',
                            border: '1px solid black',
                            padding: '1px 4px'
                        }}>
                            A/C PAYEE ONLY
                        </div>
                    )}

                    {/* Date */}
                    <div className="cheque-field" style={{
                        left: `${currentTemplate.positions.dateDay.x + offsetX}mm`,
                        top: `${currentTemplate.positions.dateDay.y + offsetY}mm`
                    }}>
                        {dateFormatted.day} {dateFormatted.month} {dateFormatted.year}
                    </div>

                    {/* Payee */}
                    <div className="cheque-field" style={{
                        left: `${currentTemplate.positions.payee.x + offsetX}mm`,
                        top: `${currentTemplate.positions.payee.y + offsetY}mm`
                    }}>
                        {payeeName} {isBearer ? 'OR BEARER' : ''}
                    </div>

                    {/* Amount in Words */}
                    <div className="cheque-field" style={{
                        left: `${currentTemplate.positions.amountWords1.x + offsetX}mm`,
                        top: `${currentTemplate.positions.amountWords1.y + offsetY}mm`,
                        fontSize: '10pt'
                    }}>
                        {amountWordsSplit.line1}
                    </div>
                    {amountWordsSplit.line2 && (
                        <div className="cheque-field" style={{
                            left: `${currentTemplate.positions.amountWords2.x + offsetX}mm`,
                            top: `${currentTemplate.positions.amountWords2.y + offsetY}mm`,
                            fontSize: '10pt'
                        }}>
                            {amountWordsSplit.line2}
                        </div>
                    )}

                    {/* Amount in Figures */}
                    <div className="cheque-field" style={{
                        left: `${currentTemplate.positions.amountFigures.x + offsetX}mm`,
                        top: `${currentTemplate.positions.amountFigures.y + offsetY}mm`
                    }}>
                        ₹{amount ? parseFloat(amount).toLocaleString('en-IN') : '0.00'}/-
                    </div>

                    {/* Test Mode Watermark */}
                    {isTestMode && (
                        <div className="watermark">SAMPLE</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ChequePrinterPlanner;
