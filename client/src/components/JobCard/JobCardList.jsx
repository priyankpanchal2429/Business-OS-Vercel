import React from 'react';
import { Briefcase, Plus } from 'lucide-react';

const JobCardList = ({ history, onNewJob, onEditJob }) => {
    return (
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Briefcase size={28} color="#2563EB" /> Job Cards
                    </h1>
                    <p style={{ color: '#64748B' }}>Manage manufacturing jobs usage tracking.</p>
                </div>
                <button onClick={onNewJob} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={18} /> New Job Card
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <tr>
                            <th style={{ padding: 16, color: '#64748B', fontWeight: 600 }}>Job No</th>
                            <th style={{ padding: 16, color: '#64748B', fontWeight: 600 }}>Date</th>
                            <th style={{ padding: 16, color: '#64748B', fontWeight: 600 }}>Customer / Plant</th>
                            <th style={{ padding: 16, color: '#64748B', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: 16, color: '#64748B', fontWeight: 600 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(job => (
                            <tr key={job.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: 16, fontWeight: 600 }}>{job.jobNo}</td>
                                <td style={{ padding: 16, color: '#64748B' }}>{new Date(job.date || job.jobDate).toLocaleDateString('en-GB')}</td>
                                <td style={{ padding: 16 }}>{job.customer || job.customerName} <span style={{ color: '#94A3B8' }}>• {job.plant || job.plantName}</span></td>
                                <td style={{ padding: 16 }}><span style={{ padding: '4px 8px', borderRadius: 4, background: '#F1F5F9', fontSize: '0.85rem' }}>{job.status}</span></td>
                                <td style={{ padding: 16 }}><button onClick={() => onEditJob(job)} style={{ color: '#2563EB', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Open</button></td>
                            </tr>
                        ))}
                        {history.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                                    No job cards found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default JobCardList;
