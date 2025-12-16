import React, { useState, useEffect, useRef } from 'react';
import { getBaseUrl } from '../config/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Download, Share2, Calendar, User, TrendingUp, Award, MapPin, Clock, Trophy, Crown, Sparkles, ChevronDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import confetti from 'canvas-confetti';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import '../index.css';

const Report = () => {
    const { addToast } = useToast();
    const API_URL = getBaseUrl();
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const reportRef = useRef(null);

    // EOTM State
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (!showLeaderboard && selectedEmployee && dateRange.start && dateRange.end) {
            fetchReportData();
        }
    }, [selectedEmployee, dateRange, showLeaderboard]);

    useEffect(() => {
        if (showLeaderboard) {
            fetchLeaderboard();
        }
    }, [showLeaderboard]);

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${API_URL.replace('/api', '')}/api/employees`);
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.filter(e => e.status?.toLowerCase() === 'active'));
                if (data.length > 0) setSelectedEmployee(data[0].id);
            }
        } catch (err) {
            console.error(err);
            addToast('Failed to load employees', 'error');
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                employeeId: selectedEmployee,
                startDate: dateRange.start,
                endDate: dateRange.end
            });
            const res = await fetch(`${API_URL}/reports/performance?${query}`);
            if (res.ok) {
                const data = await res.json();
                setReportData(data);
            } else {
                addToast('Failed to load report data', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Error fetching report', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                startDate: dateRange.start,
                endDate: dateRange.end
            });

            const res = await fetch(`${API_URL}/reports/leaderboard?${query}`);
            if (res.ok) {
                const data = await res.json();
                setLeaderboardData(data);
                // Trigger confetti if data loaded
                if (data.topPerformers.length > 0) {
                    setTimeout(() => {
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 }
                        });
                    }, 500);
                }
            } else {
                addToast('Failed to load leaderboard', 'error');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };



    const handleExportPDF = async () => {
        if (!reportRef.current) return;

        try {
            addToast('Generating PDF...', 'info');
            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#F5F5F7',
                useCORS: true
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Performance_Report.pdf`);
            addToast('PDF downloaded successfully', 'success');
        } catch (err) {
            console.error('PDF Export Error:', err);
            addToast('Failed to export PDF', 'error');
        }
    };

    const handleShareWhatsApp = async () => {
        let text = "";
        if (showLeaderboard && leaderboardData) {
            // Find the winner (first non-dev)
            const winner = leaderboardData.topPerformers.find(p => !p.employee.role.toLowerCase().includes('dev')) || leaderboardData.topPerformers[0];
            text = `🏆 Employee of the Month: ${winner.employee.name} with a Score of ${winner.score}/100!`;
        } else {
            text = `Here is the performance report for ${reportData?.employee?.name}. Performance Score: ${calculateScore()}/100.`;
        }
        const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        addToast('Opened WhatsApp.', 'info');
    };

    // calculate dynamic score for individual
    const calculateScore = () => {
        if (!reportData) return 0;
        const { attendanceDays, totalHours, avgHoursPerDay } = reportData.summary;
        let score = 50;
        if (attendanceDays > 20) score += 20;
        else score += attendanceDays;

        if (avgHoursPerDay >= 9) score += 30;
        else if (avgHoursPerDay >= 8) score += 20;
        else score += 10;

        return Math.min(100, score);
    };

    // Render Logic

    // Header UI
    const Header = () => (
        <header style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)',
            background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)',
            padding: '16px 24px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', background: '#f0f0f5', borderRadius: '12px', padding: '4px' }}>
                    <button
                        onClick={() => setShowLeaderboard(false)}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none',
                            background: !showLeaderboard ? 'white' : 'transparent',
                            color: !showLeaderboard ? 'black' : '#666',
                            fontWeight: 600, boxShadow: !showLeaderboard ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Report
                    </button>
                    <button
                        onClick={() => setShowLeaderboard(true)}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none',
                            background: showLeaderboard ? 'white' : 'transparent',
                            color: showLeaderboard ? '#D97706' : '#666',
                            fontWeight: 600, boxShadow: showLeaderboard ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                        }}
                    >
                        <Trophy size={16} /> Champions
                    </button>
                </div>

                {!showLeaderboard ? (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="select-wrapper" style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <select
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                style={{
                                    padding: '10px 16px 10px 36px', borderRadius: '12px', border: '1px solid #eee',
                                    fontSize: '0.95rem', outline: 'none', background: '#f9f9f9', fontWeight: 600, minWidth: '200px', appearance: 'none'
                                }}
                            >
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                        </div>


                    </div>
                ) : null}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f9f9f9', padding: '4px', borderRadius: '12px', border: '1px solid #eee' }}>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', fontSize: '0.9rem', fontWeight: 500 }}
                    />
                    <span style={{ color: '#aaa', fontSize: '0.8rem' }}>➔</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', fontSize: '0.9rem', fontWeight: 500 }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>

                <button onClick={handleExportPDF} className="action-btn" style={{ background: 'white', border: '1px solid #eee' }}>
                    <Download size={18} /> Export Profile
                </button>
                <button onClick={handleShareWhatsApp} className="action-btn" style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', color: 'white', border: 'none' }}>
                    <Share2 size={18} /> Share
                </button>
            </div>
        </header>
    );

    const Loading = () => (
        <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner"></div>
            <span style={{ marginLeft: 10, fontWeight: 500, color: '#666' }}>Analyzing Data...</span>
        </div>
    );

    // Main Render
    return (
        <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-family)' }}>
            <Header />
            {loading ? <Loading /> :

                showLeaderboard ? (
                    // LEADERBOARD VIEW
                    <div ref={reportRef} style={{ background: '#F5F5F7', padding: '10px', minHeight: '60vh' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px', opacity: 0.6, fontSize: '0.9rem', fontWeight: 600 }}>
                            Report Period: {new Date(dateRange.start).toLocaleDateString()} — {new Date(dateRange.end).toLocaleDateString()}
                        </div>
                        {leaderboardData && leaderboardData.topPerformers.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                                {/* Winner Card - Filtered to exclude Devs */}
                                {(() => {
                                    // Find top non-dev
                                    const devKeywords = ['dev', 'software', 'engineer', 'programmer'];
                                    const winner = leaderboardData.topPerformers.find(p => {
                                        const role = (p.employee.role || '').toLowerCase();
                                        return !devKeywords.some(kw => role.includes(kw));
                                    }) || leaderboardData.topPerformers[0]; // Fallback to first if all are devs

                                    return (
                                        <div style={{
                                            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                                            border: '2px solid var(--color-accent)', borderRadius: '32px', padding: '40px',
                                            position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            boxShadow: '0 20px 50px rgba(0, 113, 227, 0.15)'
                                        }}>
                                            <div style={{ position: 'absolute', top: -30, background: 'var(--color-accent)', color: 'white', padding: '8px 20px', borderRadius: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 10px rgba(0, 113, 227, 0.4)' }}>
                                                <Crown size={20} fill="white" /> EMPLOYEE OF THE MONTH
                                            </div>

                                            <Avatar
                                                name={winner.employee.name}
                                                src={winner.employee.image}
                                                size={140}
                                                borderRadius="40px"
                                                style={{ border: '6px solid white', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: '24px' }}
                                            />

                                            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px 0', color: '#1F2937' }}>{winner.employee.name}</h2>
                                            <div style={{ fontSize: '1.1rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '24px' }}>{winner.employee.role}</div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', width: '100%' }}>
                                                <ScoreBadge label="Score" value={winner.score} icon={<Sparkles size={16} />} />
                                                <ScoreBadge label="Attendance" value={`${winner.stats.attendanceRate}%`} />
                                                <ScoreBadge label="Total Hours" value={winner.stats.totalHours} suffix="h" />
                                                <ScoreBadge label="Avg Hours" value={winner.stats.avgHours} suffix="h" />
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* All Employees Leaderboard with Details */}
                                <div style={{ width: '100%' }}>
                                    <h3 style={{ textAlign: 'center', color: '#666', marginBottom: '20px', fontSize: '1.5rem', fontWeight: 700 }}>
                                        Complete Performance Comparison ({leaderboardData.totalEmployees} Employees)
                                    </h3>
                                    <EmployeeLeaderboardTable performers={leaderboardData.topPerformers} period={leaderboardData.period} />
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                                No data available for this period yet.
                            </div>
                        )}
                    </div>
                ) : reportData ? (
                    // INDIVIDUAL REPORT VIEW (Previous Code)
                    <div ref={reportRef} style={{ background: '#F5F5F7', padding: '10px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px', opacity: 0.6, fontSize: '0.9rem', fontWeight: 600 }}>
                            Report Period: {new Date(dateRange.start).toLocaleDateString()} — {new Date(dateRange.end).toLocaleDateString()}
                        </div>
                        {/* HERO SECTION */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px', marginBottom: '32px'
                        }}>
                            {/* Profile Card - Redesigned */}
                            <div style={{
                                background: 'linear-gradient(135deg, var(--color-accent) 0%, #0056b3 100%)',
                                borderRadius: '24px',
                                padding: '32px',
                                boxShadow: '0 10px 40px rgba(0, 113, 227, 0.25)',
                                position: 'relative',
                                overflow: 'hidden',
                                color: 'white'
                            }}>
                                {/* Decorative circles */}
                                <div style={{
                                    position: 'absolute',
                                    top: -50,
                                    right: -50,
                                    width: '200px',
                                    height: '200px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                    pointerEvents: 'none'
                                }}></div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: -30,
                                    left: -30,
                                    width: '150px',
                                    height: '150px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)',
                                    pointerEvents: 'none'
                                }}></div>

                                <div style={{ position: 'relative', zIndex: 2 }}>
                                    {/* Top Section: Profile Pic + Name/Role */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                                        {/* Profile Picture */}
                                        <div style={{ flexShrink: 0 }}>
                                            <Avatar
                                                name={reportData.employee.name}
                                                src={reportData.employee.image}
                                                size={160}
                                                borderRadius="24px"
                                                style={{
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                                    border: '4px solid rgba(255,255,255,0.3)'
                                                }}
                                            />
                                        </div>

                                        {/* Employee Info on Right */}
                                        <div style={{ flex: 1 }}>
                                            <h2 style={{
                                                fontSize: '1.8rem',
                                                margin: '0 0 8px',
                                                fontWeight: 800,
                                                letterSpacing: '-0.5px',
                                                color: 'white'
                                            }}>
                                                {reportData.employee.name}
                                            </h2>
                                            <div style={{
                                                fontSize: '1rem',
                                                opacity: 0.9,
                                                fontWeight: 500
                                            }}>
                                                {reportData.employee.role}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            background: 'rgba(255,255,255,0.15)',
                                            backdropFilter: 'blur(10px)',
                                            borderRadius: '16px',
                                            padding: '16px',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }}>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '6px', fontWeight: 600 }}>
                                                RELIABILITY
                                            </div>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 800,
                                                color: 'white'
                                            }}>
                                                {calculateScore()}%
                                            </div>
                                        </div>
                                        <div style={{
                                            background: 'rgba(255,255,255,0.15)',
                                            backdropFilter: 'blur(10px)',
                                            borderRadius: '16px',
                                            padding: '16px',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }}>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '6px', fontWeight: 600 }}>
                                                STATUS
                                            </div>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 800
                                            }}>
                                                Active
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* KPIS */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '20px' }}>
                                <PremiumKPI
                                    title="Total Hours"
                                    value={reportData.summary.totalHours}
                                    subtext="Billable hrs"
                                    icon={<Clock size={24} color="white" />}
                                    gradient="linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
                                />
                                <PremiumKPI
                                    title="Travel Days"
                                    value={reportData.summary.travelDays}
                                    subtext="On-site visits"
                                    icon={<MapPin size={24} color="white" />}
                                    gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
                                />
                                <PremiumKPI
                                    title="Bonus Eligible"
                                    value={reportData.summary.bonusDays}
                                    subtext="Days accrued"
                                    icon={<Award size={24} color="white" />}
                                    gradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                                />
                                <PremiumKPI
                                    title="Avg Daily"
                                    value={reportData.summary.avgHoursPerDay}
                                    unit="hrs"
                                    subtext="Consistency"
                                    icon={<TrendingUp size={24} color="white" />}
                                    gradient="linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)"
                                />
                            </div>
                        </div>

                        {/* EARNINGS SUMMARY */}
                        {reportData.earnings && reportData.attendance && (
                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '20px', color: 'var(--color-text-primary)' }}>Earnings Summary</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                    {/* Total Earnings Card */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, var(--color-accent) 0%, #0056b3 100%)',
                                        borderRadius: '20px',
                                        padding: '24px',
                                        color: 'white',
                                        boxShadow: '0 8px 24px rgba(0, 113, 227, 0.3)'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>TOTAL EARNINGS</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>₹{reportData.earnings.totalEarnings.toLocaleString('en-IN')}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>For {reportData.attendance.workedDays} days worked</div>
                                    </div>

                                    {/* Bonus Card */}
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '20px',
                                        padding: '24px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                        border: '1px solid var(--color-border)'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 600 }}>BONUS EARNED</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#F59E0B', marginBottom: '4px' }}>₹{reportData.earnings.bonusAmount.toLocaleString('en-IN')}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{reportData.summary.bonusDays} bonus days</div>
                                    </div>


                                    {/* Overtime Hours & Pay Card */}
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '20px',
                                        padding: '24px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                        border: '1px solid var(--color-border)'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 600 }}>OVERTIME</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10B981', marginBottom: '4px' }}>
                                            {reportData.summary.totalOvertimeHours}h
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                            ₹{reportData.earnings.overtimePay.toLocaleString('en-IN')} earned
                                        </div>
                                    </div>


                                    {/* Attendance Stats Card */}
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '20px',
                                        padding: '24px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                        border: '1px solid var(--color-border)'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 600 }}>ATTENDANCE</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                                            {reportData.attendance.workedDays}/{reportData.attendance.totalDays}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: reportData.attendance.attendanceRate >= 90 ? '#34C759' : '#F59E0B', fontWeight: 600 }}>
                                            {reportData.attendance.attendanceRate}% attendance
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Insights Footer */}
                        <div style={{ background: 'linear-gradient(90deg, #111827 0%, #1F2937 100%)', borderRadius: '24px', padding: '32px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 8px 0', color: 'white' }}>Performance Insight</h3>
                                <p style={{ margin: 0, opacity: 0.8, maxWidth: '600px', lineHeight: 1.5 }}>
                                    {reportData.summary.travelDays > 3
                                        ? `${reportData.employee.name} has been traveling frequently this month, contributing significantly to field operations.`
                                        : reportData.summary.avgHoursPerDay > 9
                                            ? `${reportData.employee.name} is averaging high daily hours. Consider reviewing workload to prevent burnout.`
                                            : `${reportData.employee.name} demonstrates consistent attendance and stable performance.`}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '4px' }}>GENERATED ON</div>
                                <div style={{ fontWeight: 600 }}>{new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                ) : <div className="p-8">Select an employee to view report.</div>}

            <style>{`
                .action-btn {
                    padding: 10px 16px;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: transform 0.1s;
                }
                .action-btn:active {
                    transform: scale(0.98);
                }
                .spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid #eee;
                    border-top-color: #0071e3;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const PremiumKPI = ({ title, value, subtext, icon, gradient, unit }) => (
    <div style={{
        background: 'white', borderRadius: '20px', padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'start'
    }}>
        <div>
            <div style={{ color: '#888', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px' }}>{title}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#111', lineHeight: 1 }}>{value}<span style={{ fontSize: '1rem', color: '#999', marginLeft: 4 }}>{unit || ''}</span></div>
            <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '12px', fontWeight: 600, background: '#ECFDF5', display: 'inline-block', padding: '4px 8px', borderRadius: '8px' }}>{subtext}</div>
        </div>
        <div style={{
            width: '48px', height: '48px', borderRadius: '14px', background: gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }}>
            {icon}
        </div>
    </div>
);

const ScoreBadge = ({ label, value, suffix, icon }) => (
    <div style={{ background: 'white', borderRadius: '16px', padding: '12px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {icon} {value}{suffix}
        </div>
    </div>
);

// Employee Leaderboard Table Component with Expandable Details
const EmployeeLeaderboardTable = ({ performers, period }) => {
    const [expandedRows, setExpandedRows] = React.useState({});

    const toggleRow = (idx) => {
        setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {performers.map((p, idx) => (
                <div key={idx} style={{
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    border: idx === 0 ? '2px solid #FCD34D' : '1px solid #eee',
                    overflow: 'hidden'
                }}>
                    {/* Main Row */}
                    <div
                        onClick={() => toggleRow(idx)}
                        style={{
                            padding: '20px 24px',
                            display: 'grid',
                            gridTemplateColumns: '60px 1fr 100px 100px 100px 100px 50px',
                            alignItems: 'center',
                            gap: '16px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            background: expandedRows[idx] ? '#f9fafb' : 'white'
                        }}
                    >
                        {/* Rank */}
                        <div style={{
                            fontSize: '1.8rem',
                            fontWeight: 800,
                            color: idx === 0 ? '#FCD34D' : idx === 1 ? '#CBD5E1' : idx === 2 ? '#FDBA74' : '#ddd'
                        }}>
                            {idx + 1}
                        </div>

                        {/* Employee Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Avatar name={p.employee.name} src={p.employee.image} size={56} borderRadius="12px" />
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111' }}>{p.employee.name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#888' }}>{p.employee.role}</div>
                            </div>
                        </div>

                        {/* Score */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>Score</div>
                            <div style={{
                                fontWeight: 800,
                                fontSize: '1.5rem',
                                color: idx === 0 ? '#10B981' : '#0071e3'
                            }}>{p.score}</div>
                        </div>

                        {/* Attendance */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>Attendance</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                {p.stats.attendanceRate}%
                            </div>
                        </div>

                        {/* Total Hours */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>Total Hours</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{p.stats.totalHours}h</div>
                        </div>

                        {/* Avg Hours */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>Avg Hours</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{p.stats.avgHours}h</div>
                        </div>

                        {/* Expand Icon */}
                        <div style={{ textAlign: 'center' }}>
                            <ChevronDown
                                size={20}
                                style={{
                                    transition: 'transform 0.3s',
                                    transform: expandedRows[idx] ? 'rotate(180deg)' : 'rotate(0deg)',
                                    color: '#888'
                                }}
                            />
                        </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedRows[idx] && (
                        <div style={{
                            padding: '24px',
                            background: '#f9fafb',
                            borderTop: '1px solid #eee'
                        }}>
                            {/* Score Breakdown */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700, color: '#111' }}>
                                    Score Breakdown
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div style={{
                                        background: 'white',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>Attendance Score</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3B82F6' }}>
                                            {p.scoreBreakdown.attendance}/40
                                        </div>
                                    </div>
                                    <div style={{
                                        background: 'white',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>Performance Score</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981' }}>
                                            {p.scoreBreakdown.performance}/40
                                        </div>
                                    </div>
                                    <div style={{
                                        background: 'white',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>Bonus Score</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>
                                            {p.scoreBreakdown.bonus}/20
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Stats */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700, color: '#111' }}>
                                    Detailed Statistics
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                                    <StatBox label="Present Days" value={p.stats.presentDays} color="#10B981" />
                                    <StatBox label="Absent Days" value={p.stats.absentDays} color="#EF4444" />
                                    <StatBox label="Travel Days" value={p.stats.travelDays} color="#8B5CF6" />
                                    <StatBox label="Overtime Hours" value={`${p.stats.totalOvertimeHours}h`} color="#F59E0B" />
                                    <StatBox label="Working Days" value={`${p.stats.presentDays}/${p.stats.totalWorkingDays}`} color="#6B7280" />
                                </div>
                            </div>

                            {/* Daily Breakdown */}
                            <div>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700, color: '#111' }}>
                                    Daily Attendance Breakdown
                                </h4>
                                <div style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '1px solid #e5e7eb',
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}>
                                    <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                        <thead style={{ background: '#f3f4f6', position: 'sticky', top: 0 }}>
                                            <tr>
                                                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Date</th>
                                                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Type</th>
                                                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Clock In</th>
                                                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Clock Out</th>
                                                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Total Hours</th>
                                                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>OT Hours</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {p.dailyBreakdown.map((day, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>
                                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </td>
                                                    <td style={{ padding: '10px 16px' }}>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            background: day.dayType === 'Travel' ? '#E0E7FF' : '#F3F4F6',
                                                            color: day.dayType === 'Travel' ? '#4F46E5' : '#6B7280'
                                                        }}>
                                                            {day.dayType}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 16px', color: '#6b7280' }}>{day.clockIn}</td>
                                                    <td style={{ padding: '10px 16px', color: '#6b7280' }}>{day.clockOut}</td>
                                                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>
                                                        {day.totalHours}h
                                                    </td>
                                                    <td style={{
                                                        padding: '10px 16px',
                                                        textAlign: 'right',
                                                        fontWeight: 600,
                                                        color: day.overtimeHours > 0 ? '#F59E0B' : '#6b7280'
                                                    }}>
                                                        {day.overtimeHours > 0 ? `${day.overtimeHours}h` : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// Stat Box Component
const StatBox = ({ label, value, color }) => (
    <div style={{
        background: 'white',
        padding: '12px',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{value}</div>
    </div>
);

export default Report;

