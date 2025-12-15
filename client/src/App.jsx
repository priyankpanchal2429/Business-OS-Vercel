import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Vendors from './pages/Vendors';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Payslip from './pages/Payslip';
import ResignedEmployeeHistory from './pages/ResignedEmployeeHistory';
import Report from './pages/Report';

import { ToastProvider } from './context/ToastContext';
import { DebugProvider } from './context/DebugContext';
import DebugPopup from './components/DebugPopup';

function App() {
    return (
        <ToastProvider>
            <DebugProvider>
                <Router>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/inventory" element={<Inventory />} />
                            <Route path="/vendors" element={<Vendors />} />
                            <Route path="/employees" element={<Employees />} />
                            <Route path="/payroll" element={<Payroll />} />
                            <Route path="/payslip/:id" element={<Payslip />} />
                            <Route path="/report" element={<Report />} />
                            <Route path="/resigned-employee" element={<ResignedEmployeeHistory />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Layout>
                    <DebugPopup />
                </Router>
            </DebugProvider>
        </ToastProvider>
    );
}

export default App;
