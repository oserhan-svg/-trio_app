import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, CheckCircle2, XCircle, ExternalLink, RefreshCw, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const CalendarSettingsModal = ({ isOpen, onClose }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState(null);

    useEffect(() => {
        if (isOpen) {
            checkStatus();
        }
    }, [isOpen]);

    const checkStatus = async () => {
        setLoading(true);
        try {
            // Assuming the backend has a status endpoint that might return email too
            const response = await api.get('/calendar/google/status');
            setIsConnected(response.data.connected);
            if (response.data.email) setEmail(response.data.email);
        } catch (error) {
            console.error('Error checking Google status:', error);
            toast.error('Bağlantı durumu kontrol edilemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        try {
            const response = await api.get('/calendar/google');
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            toast.error('Google bağlantısı başlatılamadı.');
        }
    };

    const handleDisconnect = async () => {
        // Implement disconnect logic if API supports it, otherwise just show info
        toast.error('Bağlantıyı kesme henüz desteklenmiyor.');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="text-blue-600" size={20} />
                        Takvim Entegrasyonu
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21.35 11.1h-9.17v2.73h5.14c-.22 1.2-1.27 3.17-5.14 3.17-3.32 0-6.04-2.75-6.04-6.14s2.72-6.14 6.04-6.14c1.92 0 3.24.81 3.97 1.51l2.14-2.08C16.92 3.01 14.65 2 12.18 2 6.56 2 2 6.56 2 12.18s4.56 10.18 10.18 10.18c5.85 0 9.74-4.11 9.74-9.91 0-.67-.07-1.18-.17-1.67z" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Google Takvim</h4>
                        <p className="text-sm text-gray-500 mt-1 max-w-xs">
                            {isConnected
                                ? 'Takviminiz başarıyla bağlı. Etkinlikleriniz otomatik olarak senkronize ediliyor.'
                                : 'Etkinliklerinizi yönetmek ve senkronize etmek için Google hesabınızı bağlayın.'}
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-4">
                            <RefreshCw className="animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {isConnected ? (
                                <>
                                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
                                        <CheckCircle2 className="text-green-600 shrink-0" size={20} />
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-green-800">Bağlantı Aktif</p>
                                            {email && <p className="text-xs text-green-600">{email}</p>}
                                        </div>
                                    </div>
                                    {/* Disconnect button could go here */}
                                </>
                            ) : (
                                <button
                                    onClick={handleConnect}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:scale-[1.02]"
                                >
                                    <ExternalLink size={18} />
                                    Google Hesabı ile Bağlan
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarSettingsModal;
