import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import BankStatusCard from '../components/BankStatusCard';
import AttendanceCard from '../components/AttendanceCard';
import { TrendingUp, AlertCircle, CheckCircle2, Package, Store, Users, CreditCard, FileText } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [metrics, setMetrics] = React.useState({
        inventoryCount: 0,
        lowStockCount: 0,
        activeVendors: 0,
        serverStatus: 'Checking...',
        ipAddress: '',
    });

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Inventory
                const invRes = await fetch('/api/inventory');
                const invData = await invRes.json();
                const inventoryCount = invData.length;
                const lowStockCount = invData.filter(item => Number(item.quantity) < 10).length;

                // Fetch Vendors
                const vendorRes = await fetch('/api/vendors');
                const vendorData = await vendorRes.json();
                const activeVendors = vendorData.length;

                // Check Health
                const healthRes = await fetch('/api/health');
                const healthData = await healthRes.json();

                setMetrics({
                    inventoryCount,
                    lowStockCount,
                    activeVendors,
                    serverStatus: healthData.status === 'ok' ? 'Online' : 'Offline',
                    ipAddress: healthData.ip || 'Unknown'
                });
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
                setMetrics(prev => ({ ...prev, serverStatus: 'Offline' }));
            }
        };

        fetchData();
        // Poll every 30 seconds for live status
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Logic for Payday
    const getPaydayInfo = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const anchorDate = new Date('2025-12-06T00:00:00'); // Today (Saturday)

        const diffTime = today - anchorDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let daysUntil = 0;
        if (diffDays >= 0) {
            const daysIntoCycle = diffDays % 14;
            daysUntil = daysIntoCycle === 0 ? 0 : 14 - daysIntoCycle;
        } else {
            daysUntil = Math.abs(diffDays);
        }

        let text = `${daysUntil.toString().padStart(2, '0')} Days`;
        if (daysUntil === 0) text = "Today";
        if (daysUntil === 1) text = "Tomorrow";

        return { text, daysUntil };
    };

    const paydayInfo = getPaydayInfo();

    // Helper for cards
    const cardData = [
        {
            label: "Total Inventory Items",
            value: `${metrics.inventoryCount} Items`,
            icon: <Package size={20} color="var(--color-success)" />,
            change: "Real-time count"
        },
        {
            label: "Low Stock Items",
            value: `${metrics.lowStockCount} Items`,
            icon: <AlertCircle size={20} color="var(--color-error)" />,
            change: metrics.lowStockCount > 0 ? "Requires attention" : "Stock is healthy"
        },
        {
            label: "Active Vendors",
            value: metrics.activeVendors,
            icon: <CheckCircle2 size={20} color="var(--color-accent)" />,
            change: "Registered partners"
        },
        {
            label: "Next Payday",
            value: paydayInfo.text,
            icon: <TrendingUp size={20} color={paydayInfo.text === "Today" ? "white" : "var(--color-warning)"} />,
            change: "Bi-Weekly (Sat)",
            isPayday: paydayInfo.text === "Today"
        }
    ];

    return (
        <div>
            <h1>Dashboard</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                Welcome back, Priyank. Here's what's happening today.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 340px',
                gap: 'var(--spacing-lg)',
                alignItems: 'start',
                marginBottom: 'var(--spacing-2xl)'
            }}>
                {/* Left Column: Metrics & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>

                    {/* Top Row: 4 Metric Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 'var(--spacing-lg)'
                    }}>
                        {cardData.map((metric, index) => (
                            <Card
                                key={index}
                                title={metric.label}
                                style={{
                                    height: '150px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    ...(metric.isPayday ? {
                                        background: 'var(--color-accent)',
                                        borderColor: 'var(--color-accent)',
                                        color: 'white'
                                    } : {})
                                }}
                                titleStyle={metric.isPayday ? { color: 'rgba(255, 255, 255, 0.9)' } : {}}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xs)' }}>
                                    <span style={{ fontSize: '1.75rem', fontWeight: 600 }}>{metric.value}</span>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        background: metric.isPayday ? 'rgba(255, 255, 255, 0.2)' : 'var(--color-background-subtle)'
                                    }}>
                                        {metric.icon}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: metric.isPayday ? 'rgba(255, 255, 255, 0.8)' : 'var(--color-text-secondary)' }}>
                                    {metric.change}
                                </div>
                            </Card>
                        ))}
                    </div>


                    {/* Quick Actions */}
                    <Card title="Quick Actions">
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)', // Force 5 columns for buttons
                            gap: 'var(--spacing-md)'
                        }}>
                            {[
                                { label: 'Inventory', path: '/inventory', icon: Package },
                                { label: 'Vendors', path: '/vendors', icon: Store },
                                { label: 'Employees', path: '/employees', icon: Users },
                                { label: 'Payroll', path: '/payroll', icon: CreditCard },
                                { label: 'Payslips', path: '/payslips', icon: FileText }
                            ].map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => navigate(action.path)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        background: 'var(--color-background-subtle)',
                                        border: '1px solid transparent',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '12px var(--spacing-md)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'var(--color-surface)';
                                        e.currentTarget.style.borderColor = 'var(--color-accent)';
                                        e.currentTarget.style.color = 'var(--color-accent)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'var(--color-background-subtle)';
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.color = 'var(--color-text-primary)';
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <action.icon size={18} strokeWidth={2} />
                                    <span>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Today's Attendance */}
                    <AttendanceCard />

                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <BankStatusCard daysUntilPayday={paydayInfo.daysUntil} />

                    <Card title="System Health">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Server Status Section */}
                            <div style={{ paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--spacing-md)' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Server Status</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    <div style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        background: metrics.serverStatus === 'Online' ? 'var(--color-success)' : 'var(--color-error)',
                                        boxShadow: metrics.serverStatus === 'Online' ? '0 0 0 4px rgba(52, 199, 89, 0.2)' : '0 0 0 4px rgba(255, 59, 48, 0.2)'
                                    }}></div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>Main Remote Server: {metrics.serverStatus}</p>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Last check: Just now</p>
                                    </div>
                                </div>
                            </div>

                            {/* Security Section */}
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Security</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(0, 113, 227, 0.1)',
                                        borderRadius: '50%',
                                        color: 'var(--color-accent)'
                                    }}>
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>IP Whitelist Active</p>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Current IP: {metrics.ipAddress || 'Checking...'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
