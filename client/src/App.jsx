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
import UtilityHub from './pages/UtilityHub';
import SystemDiagnostics from './pages/SystemDiagnostics';
import JobCard from './pages/JobCard';


// Tools
import MotorCalculator from './components/MotorCalculator';
import SplitBilling from './components/SplitBilling';
import PlantLayoutVisualPlanner from './components/PlantLayoutVisualPlanner';
import ElectricalPanelBoardPlanner from './components/ElectricalPanelBoardPlanner';
import LabelPrintPlanner from './components/LabelPrintPlanner';


import { ToastProvider } from './context/ToastContext';
import { DebugProvider } from './context/DebugContext';

function App() {
    return (
        <DebugProvider>
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
                            <Route path="/report" element={<Report />} />
                            <Route path="/tools" element={<UtilityHub />} />

                            {/* Tools Routes */}
                            <Route path="/tools/motor-calculator" element={<MotorCalculator />} />
                            <Route path="/tools/split-billing" element={<SplitBilling />} />
                            <Route path="/tools/plant-layout" element={<PlantLayoutVisualPlanner />} />
                            <Route path="/tools/panel-master" element={<ElectricalPanelBoardPlanner />} />
                            <Route path="/tools/label-printer" element={<LabelPrintPlanner />} />

                            <Route path="/resigned-employee" element={<ResignedEmployeeHistory />} />
                            <Route path="/system-health" element={<SystemDiagnostics />} />
                            <Route path="/job-cards" element={<JobCard />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Layout>
                </Router>
            </ToastProvider>
        </DebugProvider>
    );
}

export default App;
