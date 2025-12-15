import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, User, Phone, Mail, MapPin, Calendar, Clock, Download, Briefcase, Banknote, GripVertical, Eye, UserX, History, LogOut } from 'lucide-react';
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import { ToastContainer } from '../components/Toast.jsx';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal.jsx';
import BonusWithdrawalModal from '../components/BonusWithdrawalModal';
import AddLoanModal from '../components/AddLoanModal';
import EmployeeQuickViewModal from '../components/EmployeeQuickViewModal';
import './Employees.css';

const Employees = () => {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const [employees, setEmployees] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, employee: null });
    const [bonusModal, setBonusModal] = useState({ isOpen: false, employee: null });
    const [loanModal, setLoanModal] = useState({ isOpen: false, employee: null });
    const [quickViewModal, setQuickViewModal] = useState({ isOpen: false, employee: null });
    const [bonusStats, setBonusStats] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tab state: 'active' or 'resigned'
    const [activeTab, setActiveTab] = useState('active');
    const [searchQuery, setSearchQuery] = useState('');

    // Resignation modal state
    const [resignModal, setResignModal] = useState({ isOpen: false, employee: null });
    const [resignationDate, setResignationDate] = useState(new Date().toISOString().split('T')[0]);
    const [lastWorkingDay, setLastWorkingDay] = useState(new Date().toISOString().split('T')[0]);
    const [isResigning, setIsResigning] = useState(false);

    // Drag and Drop state
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const [newEmployee, setNewEmployee] = useState({
        name: '', role: '', salary: '', email: '',
        image: null, category: '', contact: '',
        birthday: '', age: '', address: '', status: 'Active',
        emergencyName: '', emergencyPhone: '',
        shiftStart: '', shiftEnd: '', breakTime: 60, perShiftAmount: '', payType: 'Hourly'
    });

    // Reusable Calculation Helper
    const getInitials = (name) => {
        if (!name || !name.trim()) return '';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const getSalaryDetails = (emp) => {
        if (!emp.shiftStart || !emp.shiftEnd) {
            return {
                duration: '-', billable: '-', rate: '0.00',
                perShift: Number(emp.salary || emp.perShiftAmount || 0).toLocaleString('en-IN')
            };
        }

        const [StartH, StartM] = emp.shiftStart.split(':').map(Number);
        const [EndH, EndM] = emp.shiftEnd.split(':').map(Number);

        let start = new Date(2000, 0, 1, StartH, StartM);
        let end = new Date(2000, 0, 1, EndH, EndM);

        if (end < start) {
            end.setDate(end.getDate() + 1);
        }

        const diffMs = end - start;
        const totalMins = Math.floor(diffMs / 60000);

        const breakMins = Number(emp.breakTime) || 0;
        const billableMins = Math.max(0, totalMins - breakMins);

        const baseAmount = Number(emp.perShiftAmount || emp.salary) || 0;
        const rate = billableMins > 0 ? (baseAmount / (billableMins / 60)) : 0;

        const formatH_M = (mins) => `${Math.floor(mins / 60)}h ${mins % 60} m`;
        const formatTime = (timeStr) => {
            const [h, m] = timeStr.split(':');
            const d = new Date(2000, 0, 1, h, m);
            return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        };

        return {
            duration: formatH_M(totalMins),
            billable: formatH_M(billableMins),
            rate: Math.round(rate),
            perShift: baseAmount.toLocaleString('en-IN'),
            shiftDisplay: `${formatTime(emp.shiftStart)} - ${formatTime(emp.shiftEnd)} `
        };
    };

    const formStats = getSalaryDetails(newEmployee);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${API_URL}/employees`);
            const data = await res.json();
            setEmployees(data);

            const bonusRes = await fetch(`${API_URL}/bonus/stats`);
            if (bonusRes.ok) {
                const bonusData = await bonusRes.json();
                setBonusStats(bonusData.employees);
            }

            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch employees", err);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${API_URL}/upload/image`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setNewEmployee(prev => ({ ...prev, image: data.imageUrl }));
                addToast('Image uploaded successfully', 'success');
            } else {
                addToast('Failed to upload image', 'error');
            }
        } catch (err) {
            console.error('Upload error:', err);
            addToast('Error uploading image', 'error');
        }
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        const isEditing = editingEmployee !== null;

        try {
            const url = isEditing ? `${API_URL}/employees/${editingEmployee.id}` : `${API_URL}/employees`;
            const method = isEditing ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEmployee)
            });

            if (res.ok) {
                setShowAddForm(false);
                setEditingEmployee(null);
                setNewEmployee({
                    name: '', role: '', salary: '', email: '',
                    image: null, category: '', contact: '',
                    birthday: '', age: '', address: '', status: 'Active',
                    emergencyName: '', emergencyPhone: '',
                    shiftStart: '', shiftEnd: '', breakTime: 60, perShiftAmount: '', payType: 'Hourly'
                });
                fetchEmployees();
                addToast(isEditing ? "Profile updated successfully." : "Profile created successfully.", "success");
            } else {
                addToast(isEditing ? "Failed to update profile." : "Failed to create profile.", "error");
            }
        } catch (err) {
            console.error("Failed to save employee", err);
            addToast("An error occurred while connecting to the server.", "error");
        }
    };

    const openNewEmployeeForm = () => {
        setEditingEmployee(null);
        setNewEmployee({
            name: '', role: '', salary: '', email: '',
            image: null, category: '', contact: '',
            birthday: '', age: '', address: '', status: 'Active',
            emergencyName: '', emergencyPhone: '',
            shiftStart: '', shiftEnd: '', breakTime: 60, perShiftAmount: '', payType: 'Hourly'
        });
        setShowAddForm(true);
    };

    const openEditForm = (employee) => {
        setEditingEmployee(employee);
        setNewEmployee({
            ...employee,
            age: employee.birthday ? Math.floor((new Date() - new Date(employee.birthday).getTime()) / 3.15576e+10) : ''
        });
        setShowAddForm(true);
    };

    const handleDeleteClick = (employee) => {
        setDeleteModal({ isOpen: true, employee });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.employee) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${API_URL}/employees/${deleteModal.employee.id}`, { method: 'DELETE' });
            if (res.ok) {
                setDeleteModal({ isOpen: false, employee: null });
                fetchEmployees();
                addToast('Employee deleted permanently.', 'success');
            } else {
                const error = await res.json();
                addToast(error.details || 'Cannot delete employee.', 'error');
            }
        } catch (err) {
            addToast('An error occurred while deleting.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    // Not used but kept for state
    const [isDeleting, setIsDeleting] = useState(false);

    // Drag and Drop Handlers
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget);
        // Add a slight delay to show drag styling
        setTimeout(() => {
            e.currentTarget.style.opacity = '0.5';
        }, 0);
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = async (e, dropIndex) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDragOverIndex(null);
            return;
        }

        let newEmployees = [...employees];

        // If we are in the active tab, we are reordering active employees only
        // effectively grouping them and then reordering within that group
        if (activeTab === 'active') {
            const activeList = employees.filter(e => e.status !== 'Resigned');
            const resignedList = employees.filter(e => e.status === 'Resigned');

            // Perform reorder on active list
            const [draggedEmployee] = activeList.splice(draggedIndex, 1);
            activeList.splice(dropIndex, 0, draggedEmployee);

            // Recombine: Active + Resigned
            // This implicitly groups active employees at the top of the persistent list, which is fine
            newEmployees = [...activeList, ...resignedList];
        } else {
            // Fallback for safety (though DnD is disabled in resigned tab)
            const [draggedEmployee] = newEmployees.splice(draggedIndex, 1);
            newEmployees.splice(dropIndex, 0, draggedEmployee);
        }

        setEmployees(newEmployees);
        setDraggedIndex(null);
        setDragOverIndex(null);

        // Save new order to server
        try {
            const orderedIds = newEmployees.map(emp => emp.id);
            const res = await fetch(`${API_URL}/employees/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds })
            });

            if (res.ok) {
                addToast('Employee order updated.', 'success');
            } else {
                addToast('Failed to save order.', 'error');
                fetchEmployees(); // Revert to server state
            }
        } catch (err) {
            console.error('Failed to save order', err);
            addToast('Failed to save order.', 'error');
            fetchEmployees(); // Revert to server state
        }
    };


    // Handle employee resignation
    const handleResignation = async () => {
        if (!resignModal.employee) return;

        setIsResigning(true);
        try {
            const res = await fetch(`${API_URL}/employees/${resignModal.employee.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'Resigned',
                    resignationDate: resignationDate,
                    lastWorkingDay: lastWorkingDay
                })
            });

            if (res.ok) {
                addToast(`${resignModal.employee.name} has been marked as resigned.`, 'success');
                setResignModal({ isOpen: false, employee: null });
                fetchEmployees();
            } else {
                addToast('Failed to update employee status.', 'error');
            }
        } catch (err) {
            console.error('Failed to resign employee:', err);
            addToast('Failed to update employee status.', 'error');
        } finally {
            setIsResigning(false);
        }
    };

    // Filter employees based on active tab and search
    const activeEmployees = employees.filter(emp => emp.status !== 'Resigned');
    const resignedEmployees = employees.filter(emp => emp.status === 'Resigned');

    const filteredResignedEmployees = resignedEmployees.filter(emp => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            emp.name?.toLowerCase().includes(query) ||
            emp.contact?.toLowerCase().includes(query) ||
            emp.resignationDate?.includes(query)
        );
    });

    const actionButtonStyle = {
        border: 'none',
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        padding: '8px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm)',
        transition: 'background 0.2s',
        minWidth: '36px',
        minHeight: '36px'
    };

    return (
        <div>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, employee: null })}
                onConfirm={handleDeleteConfirm}
                employeeName={deleteModal.employee?.name || ''}
                isDeleting={isDeleting}
            />

            <BonusWithdrawalModal
                isOpen={bonusModal.isOpen}
                onClose={() => setBonusModal({ isOpen: false, employee: null })}
                employee={bonusModal.employee}
                onSave={fetchEmployees}
            />

            <AddLoanModal
                isOpen={loanModal.isOpen}
                onClose={() => setLoanModal({ isOpen: false, employee: null })}
                employee={loanModal.employee}
                onSave={() => {
                    fetchEmployees();
                    addToast('Loan issued successfully.', 'success');
                }}
            />

            <EmployeeQuickViewModal
                isOpen={quickViewModal.isOpen}
                onClose={() => setQuickViewModal({ isOpen: false, employee: null })}
                employee={quickViewModal.employee}
                bonusBalance={bonusStats.find(b => b.employeeId === quickViewModal.employee?.id)?.balance || 0}
                getSalaryDetails={getSalaryDetails}
                onEdit={(emp) => openEditForm(emp)}
                onViewPayslip={(emp) => window.location.href = `/payslip?employee= ${emp.id} `}
                onAddLoan={(emp) => setLoanModal({ isOpen: true, employee: emp })}
                onWithdrawBonus={(emp) => setBonusModal({ isOpen: true, employee: emp })}
            />

            {/* Resignation Modal */}
            {resignModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 2000
                }}>
                    <div style={{
                        background: 'var(--color-background-card)',
                        borderRadius: '16px',
                        width: '420px',
                        padding: '24px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: '12px',
                                background: 'rgba(255, 59, 48, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <LogOut size={22} color="var(--color-error)" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Mark as Resigned</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                    {resignModal.employee?.name}
                                </p>
                            </div>
                        </div>

                        <div style={{
                            padding: '12px',
                            background: 'rgba(255, 149, 0, 0.1)',
                            borderRadius: '10px',
                            marginBottom: '20px',
                            fontSize: '0.85rem',
                            color: '#ff9500'
                        }}>
                            This employee will be moved to the "Resigned" tab and will no longer appear in attendance or payroll.
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                    Resignation Date
                                </label>
                                <input
                                    type="date"
                                    value={resignationDate}
                                    onChange={(e) => setResignationDate(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                    Last Working Day
                                </label>
                                <input
                                    type="date"
                                    value={lastWorkingDay}
                                    onChange={(e) => setLastWorkingDay(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setResignModal({ isOpen: false, employee: null })}
                                style={{
                                    flex: 1, padding: '12px',
                                    background: 'var(--color-background-subtle)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '10px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResignation}
                                disabled={isResigning}
                                style={{
                                    flex: 1, padding: '12px',
                                    background: 'var(--color-error)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    cursor: isResigning ? 'not-allowed' : 'pointer',
                                    opacity: isResigning ? 0.7 : 1
                                }}
                            >
                                {isResigning ? 'Processing...' : 'Confirm Resignation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}



            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1 style={{ marginBottom: 0 }}>Employees</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>Manage your team members.</p>
                </div>
                <button
                    onClick={openNewEmployeeForm}
                    style={{
                        background: 'var(--color-accent)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 500,
                        cursor: 'pointer'
                    }}>
                    <Plus size={18} /> Add Employee
                </button>
            </div>

            {/* Tabs: Active / Resigned */}
            <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '20px',
                background: 'var(--color-background-subtle)',
                padding: '4px',
                borderRadius: '12px',
                width: 'fit-content'
            }}>
                <button
                    onClick={() => setActiveTab('active')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '10px',
                        background: activeTab === 'active' ? 'var(--color-background-card)' : 'transparent',
                        boxShadow: activeTab === 'active' ? 'var(--shadow-sm)' : 'none',
                        color: activeTab === 'active' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <User size={16} />
                    Active
                    <span style={{
                        background: activeTab === 'active' ? 'var(--color-accent)' : 'var(--color-background-subtle)',
                        color: activeTab === 'active' ? 'white' : 'var(--color-text-tertiary)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                    }}>
                        {activeEmployees.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('resigned')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '10px',
                        background: activeTab === 'resigned' ? 'var(--color-background-card)' : 'transparent',
                        boxShadow: activeTab === 'resigned' ? 'var(--shadow-sm)' : 'none',
                        color: activeTab === 'resigned' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <UserX size={16} />
                    Resigned
                    <span style={{
                        background: activeTab === 'resigned' ? 'var(--color-error)' : 'var(--color-background-subtle)',
                        color: activeTab === 'resigned' ? 'white' : 'var(--color-text-tertiary)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                    }}>
                        {resignedEmployees.length}
                    </span>
                </button>
            </div>

            {/* Search bar for resigned tab */}
            {activeTab === 'resigned' && resignedEmployees.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ position: 'relative', maxWidth: '320px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or date..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 40px',
                                borderRadius: '10px',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'active' && showAddForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <Card style={{ width: 700, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--spacing-xl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h2 style={{ margin: 0 }}>{editingEmployee ? 'Edit Employee Profile' : 'New Employee Profile'}</h2>
                            <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>&times;</button>
                        </div>

                        <form onSubmit={handleAddEmployee} style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: 'var(--radius-md)',
                                    background: 'var(--color-background-subtle)',
                                    backgroundImage: newEmployee.image ? `url(${newEmployee.image})` : 'none',
                                    backgroundSize: 'cover', backgroundPosition: 'center',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px dashed var(--color-border)', cursor: 'pointer', position: 'relative'
                                }}>
                                    {!newEmployee.image && (
                                        newEmployee.name ? (
                                            <span style={{ fontWeight: 600, fontSize: '1.5rem', color: 'var(--color-text-secondary)' }}>
                                                {getInitials(newEmployee.name)}
                                            </span>
                                        ) : (
                                            <User size={24} color="var(--color-text-secondary)" />
                                        )
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Profile Photo</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Click to upload. JPG/PNG.</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Full Name <span style={{ color: 'red' }}>*</span></label>
                                    <input required value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} style={inputStyle} placeholder="e.g. Rahul Sharma" />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Job Role / Title <span style={{ color: 'red' }}>*</span></label>
                                    <input required value={newEmployee.role} onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })} style={inputStyle} placeholder="e.g. Machine Operator" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Category</label>
                                    <select value={newEmployee.category} onChange={e => setNewEmployee({ ...newEmployee, category: e.target.value })} style={inputStyle}>
                                        <option value="">Select Category</option>
                                        <option value="Mixer Machine">Mixer Machine</option>
                                        <option value="Pellet Machine">Pellet Machine</option>
                                        <option value="Ribbon Mixer">Ribbon Mixer</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Office Staff">Office Staff</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Status</label>
                                    <select value={newEmployee.status} onChange={e => setNewEmployee({ ...newEmployee, status: e.target.value })} style={inputStyle}>
                                        <option value="Active">Active (Working)</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Contact Number <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        type="tel" required
                                        pattern="[0-9]{10}"
                                        title="10 digit mobile number"
                                        placeholder="9876543210"
                                        value={newEmployee.contact}
                                        onChange={e => setNewEmployee({ ...newEmployee, contact: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        style={inputStyle}
                                    />
                                    {newEmployee.contact && newEmployee.contact.length !== 10 && <div style={errorStyle}>Must be 10 digits</div>}
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Birthday</label>
                                    <input
                                        type="date"
                                        value={newEmployee.birthday}
                                        onChange={e => {
                                            const bday = e.target.value;
                                            const age = bday ? Math.floor((new Date() - new Date(bday).getTime()) / 3.15576e+10) : '';
                                            setNewEmployee({ ...newEmployee, birthday: bday, age: age });
                                        }}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Age</label>
                                    <input readOnly value={newEmployee.age} style={{ ...inputStyle, background: 'var(--color-background-subtle)', cursor: 'not-allowed' }} placeholder="Auto" />
                                </div>
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Address</label>
                                <textarea
                                    value={newEmployee.address}
                                    onChange={e => setNewEmployee({ ...newEmployee, address: e.target.value })}
                                    style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                                    placeholder="Enter full residential address..."
                                />
                            </div>

                            <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-background-subtle)', borderRadius: 'var(--radius-md)' }}>
                                <h4 style={{ margin: '0 0 var(--spacing-sm) 0' }}>Salary & Shift Rules</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Shift Start</label>
                                        <input type="time" required value={newEmployee.shiftStart} onChange={e => setNewEmployee({ ...newEmployee, shiftStart: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Shift End</label>
                                        <input type="time" required value={newEmployee.shiftEnd} onChange={e => setNewEmployee({ ...newEmployee, shiftEnd: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Break (Mins)</label>
                                        <input type="number" required value={newEmployee.breakTime} onChange={e => setNewEmployee({ ...newEmployee, breakTime: e.target.value })} style={inputStyle} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Total Duration</label>
                                        <div style={{ fontWeight: 600 }}>{formStats.duration}</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Billable Hours</label>
                                        <div style={{ fontWeight: 600 }}>{formStats.billable}</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Per Hour Rate</label>
                                        <div style={{ fontWeight: 600, color: 'var(--color-accent)' }}>₹{formStats.rate}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Per Shift Amount (₹)</label>
                                        <input required type="number" value={newEmployee.perShiftAmount} onChange={e => setNewEmployee({ ...newEmployee, perShiftAmount: e.target.value })} style={inputStyle} placeholder="500" />
                                    </div>
                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Pay Type</label>
                                        <select value={newEmployee.payType} onChange={e => setNewEmployee({ ...newEmployee, payType: e.target.value })} style={inputStyle}>
                                            <option value="Hourly">Hourly Based</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'var(--color-background-subtle)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ gridColumn: '1/-1', fontWeight: 600, fontSize: '0.9rem' }}>Emergency Contact</div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Contact Name</label>
                                    <input value={newEmployee.emergencyName} onChange={e => setNewEmployee({ ...newEmployee, emergencyName: e.target.value })} style={inputStyle} placeholder="Relative Name" />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Contact Number</label>
                                    <input type="tel" value={newEmployee.emergencyPhone} onChange={e => setNewEmployee({ ...newEmployee, emergencyPhone: e.target.value })} style={inputStyle} placeholder="Emergency Phone" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-sm)' }}>
                                <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: 'var(--radius-md)',
                                        border: 'none',
                                        background: 'var(--color-accent)',
                                        color: 'white',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                                    onMouseOut={e => e.currentTarget.style.filter = 'none'}
                                >
                                    {editingEmployee ? 'Save Changes' : 'Create Profile'}
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Active Employees Table */}
            {activeTab === 'active' && (
                <Card className="table-container" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                        <thead style={{ background: 'var(--color-background-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', width: '50px' }}></th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Salary & Pay Rules</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Annual Bonus</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeEmployees.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)' }}>No active employees. Add one to start.</td></tr>
                            ) : (
                                activeEmployees.map((emp, index) => {
                                    const details = getSalaryDetails(emp);
                                    const isDragging = draggedIndex === index;
                                    const isDragOver = dragOverIndex === index;
                                    return (
                                        <tr
                                            key={emp.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, index)}
                                            style={{
                                                borderBottom: '1px solid var(--color-border)',
                                                background: isDragOver ? 'rgba(0, 122, 255, 0.08)' : isDragging ? 'rgba(0, 122, 255, 0.05)' : 'transparent',
                                                transition: 'background 0.2s ease',
                                                cursor: 'grab',
                                                borderTop: isDragOver ? '2px solid var(--color-accent)' : 'none'
                                            }}
                                        >
                                            <td style={{ padding: '16px 8px 16px 16px', verticalAlign: 'middle', textAlign: 'center', width: '50px' }}>
                                                <div
                                                    style={{
                                                        cursor: 'grab',
                                                        color: 'var(--color-text-tertiary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    title="Drag to reorder"
                                                >
                                                    <GripVertical size={18} />
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', verticalAlign: 'middle', fontWeight: 500, textAlign: 'left' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 60, height: 60, borderRadius: '8px', background: 'var(--color-background-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', backgroundImage: emp.image ? `url(${emp.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden' }}>
                                                        {!emp.image && (
                                                            <span style={{ fontWeight: 600, fontSize: '1.2rem' }}>
                                                                {getInitials(emp.name)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {emp.name}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'left' }}>{emp.role}</td>
                                            <td style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60px' }}>
                                                    {emp.shiftStart ? (
                                                        <>
                                                            <div style={{ fontWeight: 600 }}>₹{details.perShift}/day</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                                                {details.shiftDisplay}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                                                rate: ₹{details.rate}/hr
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div>₹{details.perShift} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>(Legacy)</span></div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'center', fontWeight: 600, color: 'var(--color-accent)' }}>
                                                ₹{(bonusStats.find(b => b.employeeId === emp.id)?.balance || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: 20,
                                                    background: emp.status === 'Active' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                                    color: emp.status === 'Active' ? 'var(--color-success)' : 'var(--color-error)',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    height: '24px'
                                                }}>
                                                    {emp.status || 'Active'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', minHeight: '60px' }}>
                                                    <button
                                                        onClick={() => setQuickViewModal({ isOpen: true, employee: emp })}
                                                        title="Quick View"
                                                        style={{ ...actionButtonStyle, color: '#667eea' }}
                                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'}
                                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setBonusModal({ isOpen: true, employee: emp })}
                                                        title="Withdraw Bonus"
                                                        style={{ ...actionButtonStyle, color: 'var(--color-primary)' }}
                                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)'}
                                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <Briefcase size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setLoanModal({ isOpen: true, employee: emp })}
                                                        title="Add Loan"
                                                        style={{ ...actionButtonStyle, color: '#ed6c02' }} // Orange color for Loan
                                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(237, 108, 2, 0.1)'}
                                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <Banknote size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditForm(emp)}
                                                        title="Edit"
                                                        style={{ ...actionButtonStyle, color: 'var(--color-accent)' }}
                                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)'}
                                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(emp)}
                                                        title="Delete"
                                                        style={{ ...actionButtonStyle, color: 'var(--color-error)' }}
                                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)'}
                                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setResignationDate(new Date().toISOString().split('T')[0]);
                                                            setLastWorkingDay(new Date().toISOString().split('T')[0]);
                                                            setResignModal({ isOpen: true, employee: emp });
                                                        }}
                                                        title="Mark as Resigned"
                                                        style={{ ...actionButtonStyle, color: '#ff9500' }}
                                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 149, 0, 0.1)'}
                                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <LogOut size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </Card>
            )}

            {/* Resigned Employees Table */}
            {activeTab === 'resigned' && (
                <Card className="table-container" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                        <thead style={{ background: 'var(--color-background-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resignation Date</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Working Day</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResignedEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <UserX size={40} color="var(--color-text-tertiary)" />
                                            <span>{searchQuery ? 'No matching resigned employees found.' : 'No resigned employees.'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredResignedEmployees.map((emp) => (
                                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: '50%',
                                                    background: 'var(--color-background-subtle)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    overflow: 'hidden',
                                                    border: '2px solid var(--color-border)',
                                                    backgroundImage: emp.image ? `url(${emp.image})` : 'none',
                                                    backgroundSize: 'cover',
                                                    opacity: 0.7
                                                }}>
                                                    {!emp.image && (
                                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                                            {getInitials(emp.name)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>{emp.name}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', verticalAlign: 'middle', color: 'var(--color-text-secondary)' }}>{emp.role}</td>
                                        <td style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{emp.contact || '-'}</td>
                                        <td style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'center', color: 'var(--color-error)' }}>
                                            {emp.resignationDate ? new Date(emp.resignationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                            {emp.lastWorkingDay ? new Date(emp.lastWorkingDay).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <button
                                                    onClick={() => navigate(`/resigned-employee?id=${emp.id}`)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: 'var(--color-background-subtle)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 500,
                                                        color: 'var(--color-text-secondary)'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-background-hover)'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'var(--color-background-subtle)'}
                                                >
                                                    <History size={16} />
                                                    View History
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(emp)}
                                                    title="Delete Permanently"
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: 'rgba(255, 59, 48, 0.1)',
                                                        border: '1px solid transparent',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        color: 'var(--color-error)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.background = 'var(--color-error)';
                                                        e.currentTarget.style.color = 'white';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)';
                                                        e.currentTarget.style.color = 'var(--color-error)';
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
};

const formGroupStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
const labelStyle = { fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)' };
const inputStyle = { padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem' };
const errorStyle = { color: 'var(--color-error)', fontSize: '0.8rem', marginTop: 4 };

export default Employees;
