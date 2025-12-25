import React, { useState } from 'react';
import JobCardList from '../components/JobCard/JobCardList';
import JobCardEditor from '../components/JobCard/JobCardEditor';

const JobCard = () => {
    const [view, setView] = useState('list'); // 'list' | 'editor'
    const [history, setHistory] = useState([
        {
            id: 101,
            jobNo: 'JC-2024-001',
            date: '2024-12-20',
            jobDate: '2024-12-20',
            customer: 'Acme Corp',
            customerName: 'Acme Corp',
            plant: 'Plant A',
            plantName: 'Plant A',
            status: 'Completed',
            machines: [
                {
                    id: 'm1',
                    type: 'Lathe Machine',
                    model: 'L-200',
                    parts: [
                        { id: 'p1', guid: 'p1', name: 'Gear', model: 'G-10', size: '10mm', qty: 2 }
                    ]
                }
            ],
            orderDetails: Array(5).fill(null).map((_, i) => ({ id: i, name: '', model: '' }))
        },
    ]);

    // Initial Empty State for New Job
    const initialFormState = {
        id: '',
        jobNo: `JC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        jobDate: new Date().toISOString().split('T')[0],
        customerName: '',
        plantName: '',
        status: 'Draft',
        orderDetails: Array(5).fill(null).map((_, i) => ({ id: i, name: '', model: '' })),
        machines: [
            {
                id: `m-${Date.now()}`,
                type: '',
                model: '',
                parts: [
                    {
                        id: `p-${Date.now()}`,
                        guid: `g-${Date.now()}`,
                        name: '',
                        model: '',
                        size: '',
                        qty: 1
                    }
                ]
            }
        ]
    };

    const [currentJob, setCurrentJob] = useState(initialFormState);

    const handleNewJob = () => {
        setCurrentJob(initialFormState);
        setView('editor');
    };

    const handleEditJob = (job) => {
        // Ensure data compatibility if fields are missing
        const fullJob = {
            ...initialFormState,
            ...job,
            machines: job.machines || initialFormState.machines
        };
        setCurrentJob(fullJob);
        setView('editor');
    };

    const handleSave = (savedData) => {
        const newRecord = { ...savedData, id: savedData.id || Date.now(), status: 'Recent' };

        setHistory(prev => {
            const existingIndex = prev.findIndex(p => p.id === newRecord.id);
            if (existingIndex >= 0) {
                const newHistory = [...prev];
                newHistory[existingIndex] = newRecord;
                return newHistory;
            }
            return [newRecord, ...prev];
        });
        setView('list');
    };

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            {view === 'list' && (
                <JobCardList
                    history={history}
                    onNewJob={handleNewJob}
                    onEditJob={handleEditJob}
                />
            )}

            {view === 'editor' && (
                <JobCardEditor
                    initialData={currentJob}
                    onSave={handleSave}
                    onCancel={() => setView('list')}
                />
            )}
        </div>
    );
};

export default JobCard;
