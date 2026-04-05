import React, { useState, useEffect } from 'react';
import {
    Layout,
    ChevronRight,
    MoreHorizontal,
    MessageCircle,
    Phone,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    Search,
    Filter,
    Loader2
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const SalesPipeline = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [pipeline, setPipeline] = useState([]);
    const [draggedId, setDraggedId] = useState(null);

    useEffect(() => {
        fetchPipeline();
    }, []);

    const fetchPipeline = async () => {
        setLoading(true);
        try {
            const response = await api.get('/analytics/pipeline-summary');
            setPipeline(response.data);
        } catch (error) {
            console.error('Pipeline Fetch Error:', error);
            addToast('Pipeline verileri yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (clientId) => {
        setDraggedId(clientId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (newStatus) => {
        if (!draggedId) return;

        // Optimistic Update
        const oldPipeline = [...pipeline];
        const updatedPipeline = pipeline.map(col => {
            if (col.clients.some(c => c.id === draggedId)) {
                return { ...col, clients: col.clients.filter(c => c.id !== draggedId), count: col.count - 1 };
            }
            if (col.status === newStatus) {
                const client = oldPipeline.find(c => c.clients.some(cl => cl.id === draggedId)).clients.find(cl => cl.id === draggedId);
                return { ...col, clients: [...col.clients, { ...client, status: newStatus }], count: col.count + 1 };
            }
            return col;
        });

        setPipeline(updatedPipeline);

        try {
            await api.put(`/clients/${draggedId}`, { status: newStatus });
            addToast(`Müşteri durumu ${newStatus} olarak güncellendi`, 'success');
        } catch (error) {
            setPipeline(oldPipeline);
            addToast('Güncelleme başarısız', 'error');
        } finally {
            setDraggedId(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'border-blue-500 bg-blue-50 text-blue-700';
            case 'Active': return 'border-amber-500 bg-amber-50 text-amber-700';
            case 'Negotiation': return 'border-indigo-500 bg-indigo-50 text-indigo-700';
            case 'Closed Won': return 'border-emerald-500 bg-emerald-50 text-emerald-700';
            case 'Closed Lost': return 'border-rose-500 bg-rose-50 text-rose-700';
            default: return 'border-slate-300 bg-slate-50 text-slate-500';
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-indigo-600" size={48} />
                    <span className="font-black text-slate-400 uppercase tracking-widest text-sm">Pipeline Hazırlanıyor...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <Layout className="text-indigo-600" size={28} />
                            Satış Pipeline (Kanban)
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            Adaylarınızın satış sürecindeki ilerlemesini görsel olarak takip edin.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text" placeholder="Müşteri ara..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
                            />
                        </div>
                        <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                            Yeni Aday Ekle
                        </button>
                    </div>
                </div>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-x-auto p-8 flex gap-6 scrollbar-hide">
                {pipeline.map(column => (
                    <div
                        key={column.status}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(column.status)}
                        className="w-80 shrink-0 flex flex-col h-full"
                    >
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${getStatusColor(column.status).split(' ')[0].replace('border-', 'bg-')}`}></span>
                                <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs">{column.status}</h3>
                                <span className="text-[10px] font-black bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{column.count}</span>
                            </div>
                            <button aria-label="Daha fazla seçenek" className="text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"><MoreHorizontal size={18} /></button>
                        </div>

                        {/* Column Content */}
                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-20">
                            {column.clients.map(client => (
                                <div
                                    key={client.id}
                                    draggable
                                    onDragStart={() => handleDragStart(client.id)}
                                    className="group bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden"
                                >
                                    {/* Priority Indicator */}
                                    <div className={`absolute top-0 right-0 w-24 h-1 ${client.priority_score > 70 ? 'bg-rose-500' : 'bg-slate-100'}`}></div>

                                    <div className="flex justify-between items-start mb-3">
                                        <div className="font-black text-slate-800 text-sm">{client.name}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {column.status === 'New' ? 'Yeni' : `${client.priority_score}% İhtimal`}
                                        </div>
                                    </div>

                                    <div className="text-[11px] text-slate-500 font-medium mb-4 line-clamp-2">
                                        {client.next_best_action || 'Strateji oluşturulmadı.'}
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            {client.last_sentiment === 'Positive' && <span title="İlgili">🤩</span>}
                                            {client.last_sentiment === 'Negative' && <span title="Soğuk">😠</span>}
                                            {client.is_stale && <AlertCircle size={14} className="text-rose-500 animate-pulse" />}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}`, '_blank')}
                                                className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                                            >
                                                <MessageCircle size={16} />
                                            </button>
                                            <button
                                                onClick={() => window.location.href = `/clients/${client.id}`}
                                                className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {column.clients.length === 0 && (
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl h-32 flex items-center justify-center text-slate-300">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Aday Yok</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default SalesPipeline;
