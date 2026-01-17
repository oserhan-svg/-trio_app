import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const Toast = ({ message, type, onClose }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="text-emerald-500" size={18} />;
            case 'error': return <AlertCircle className="text-red-500" size={18} />;
            case 'warning': return <AlertTriangle className="text-yellow-500" size={18} />;
            case 'info': return <Info className="text-blue-500" size={18} />;
            default: return null;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success': return 'bg-emerald-50 border-emerald-100';
            case 'error': return 'bg-red-50 border-red-100';
            case 'warning': return 'bg-yellow-50 border-yellow-100';
            case 'info': return 'bg-blue-50 border-blue-100';
            default: return 'bg-white border-gray-100';
        }
    };

    const getTextColor = () => {
        switch (type) {
            case 'success': return 'text-emerald-800';
            case 'error': return 'text-red-800';
            case 'warning': return 'text-yellow-800';
            case 'info': return 'text-blue-800';
            default: return 'text-gray-800';
        }
    };

    return (
        <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in fade-in slide-in-from-right-8 duration-300 ${getBgColor()}`}>
            {getIcon()}
            <p className={`text-sm font-medium ${getTextColor()}`}>{message}</p>
            <button
                onClick={onClose}
                className="p-1 hover:bg-black/5 rounded-full transition-colors ml-2"
            >
                <X size={14} className="text-gray-400" />
            </button>
        </div>
    );
};
