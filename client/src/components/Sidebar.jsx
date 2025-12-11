import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Contact, Receipt, FileText } from 'lucide-react';
import '../index.css';

const Sidebar = () => {
    const navItems = [
        { to: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
        { to: "/inventory", icon: <Package size={20} />, label: "Inventory" },
        { to: "/vendors", icon: <Users size={20} />, label: "Vendors" },
        { to: "/employees", icon: <Contact size={20} />, label: "Employees" },
        { to: "/payroll", icon: <Receipt size={20} />, label: "Payroll" },
        { to: "/report", icon: <FileText size={20} />, label: "Report" },
    ];

    return (
        <aside style={{
            width: '260px',
            height: '100vh',
            backgroundColor: 'var(--color-background)',
            borderRight: '1px solid var(--color-border)',
            padding: 'var(--spacing-lg)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0
        }}>
            <div style={{ marginBottom: 'var(--spacing-2xl)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--color-accent)' }}></div>
                <h1 style={{ fontSize: '1.2rem', margin: 0 }}>BusinessOS</h1>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            textDecoration: 'none',
                            color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                            backgroundColor: isActive ? 'rgba(0, 113, 227, 0.08)' : 'transparent',
                            fontWeight: isActive ? 600 : 500,
                            fontSize: '0.95rem',
                            transition: 'all var(--transition-fast)'
                        })}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto' }}>
                <div style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-background-subtle)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem'
                }}>
                    <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Priyank's Device</p>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>Connected • Admin</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
