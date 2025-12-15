import React, { createContext, useContext, useState, useCallback } from 'react';

const DebugContext = createContext();

export const useDebug = () => {
    const context = useContext(DebugContext);
    if (!context) {
        throw new Error('useDebug must be used within a DebugProvider');
    }
    return context;
};

export const DebugProvider = ({ children }) => {
    const [logs, setLogs] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    
    const addLog = useCallback((type, message, details = null) => {
        const timestamp = new Date().toLocaleTimeString();
        const newLog = {
            id: Date.now() + Math.random(),
            timestamp,
            type, // 'info', 'success', 'error', 'network'
            message,
            details
        };
        
        setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
        
        // Auto-open on critical errors if not already open
        if (type === 'error' && !isOpen) {
             // Optional: setIsOpen(true); 
        }
    }, [isOpen]);

    const clearLogs = () => setLogs([]);
    const toggleDebug = () => setIsOpen(prev => !prev);

    const value = {
        logs,
        addLog,
        clearLogs,
        isOpen,
        toggleDebug,
        setIsOpen
    };

    return (
        <DebugContext.Provider value={value}>
            {children}
        </DebugContext.Provider>
    );
};
