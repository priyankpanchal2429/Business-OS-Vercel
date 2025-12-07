import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';

import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Payslip from './pages/Payslip';

import { ToastProvider } from './context/ToastContext';

// Placeholder Components (Views) - Will replace with actual pages
const Vendors = () => <h1>Vendor Management</h1>;

function App() {
    return (
        <ToastProvider>
            <Router>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/vendors" element={<Vendors />} />
                        <Route path="/employees" element={<Employees />} />
                        <Route path="/payroll" element={<Payroll />} />
                        <Route path="/payslip/:id" element={<Payslip />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Layout>
            </Router>
        </ToastProvider>
    );
}

export default App;
