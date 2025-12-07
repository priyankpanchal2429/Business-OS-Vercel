import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{
                marginLeft: '260px',
                flex: 1,
                padding: 'var(--spacing-2xl)',
                maxWidth: '1600px', /* Prevent wide stretching on huge screens */
                width: '100%'
            }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
