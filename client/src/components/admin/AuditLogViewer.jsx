import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, Activity, AlertCircle, Search, Filter } from 'lucide-react';
import api from '../../services/api';

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        entityType: '',
        userId: '',
        action: ''
    });

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/audit-logs', { params: filters });
            setLogs(res.data);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white text-center">
                <div className="inline-block p-3 bg-white/10 rounded-full mb-4">
                    <Shield size={40} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-black mb-1">Sistem Denetim Günlüğü</h2>
                <p className="text-slate-400 text-sm">Tüm kullanıcı hareketleri ve veri değişiklikleri kayıt altındadır.</p>
            </div>

            {/* Filters Bar */}
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex gap-4">
                <div className="flex-1">
                    <select
                        value={filters.entityType}
                        onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold"
                    >
                        <option value="">Tüm Varlıklar</option>
                        <option value="Property">İlanlar</option>
                        <option value="Client">Müşteriler</option>
                        <option value="User">Sistem Kullanıcıları</option>
                    </select>
                </div>
                <div className="flex-1">
                    <select
                        value={filters.action}
                        onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold"
                    >
                        <option value="">Tüm İşlemler</option>
                        <option value="CREATE">Ekleme</option>
                        <option value="UPDATE">Güncelleme</option>
                        <option value="DELETE">Silme</option>
                        <option value="LOGIN">Giriş</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-10 text-center animate-pulse text-gray-400">Günlükler çekiliyor...</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Tarih</th>
                                <th className="px-6 py-4">Kullanıcı</th>
                                <th className="px-6 py-4">İşlem</th>
                                <th className="px-6 py-4">Varlık</th>
                                <th className="px-6 py-4">Detay</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition text-sm">
                                    <td className="px-6 py-4 text-gray-500 font-medium">
                                        <div className="flex flex-col">
                                            <span>{new Date(log.created_at).toLocaleDateString('tr-TR')}</span>
                                            <span className="text-[10px] opacity-70">{new Date(log.created_at).toLocaleTimeString('tr-TR')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-[10px]">
                                                {log.user?.name?.[0] || 'S'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800">{log.user?.name || 'Sistem'}</span>
                                                <span className="text-[10px] text-gray-400">{log.ip_address}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                                                log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                    log.action === 'LOGIN' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-600">
                                        {log.entity_type} #{log.entity_id}
                                    </td>
                                    <td className="px-6 py-4">
                                        <details className="cursor-pointer">
                                            <summary className="text-xs text-blue-600 font-bold hover:underline">Değişiklikleri Gör</summary>
                                            <div className="mt-2 p-3 bg-gray-900 rounded-lg text-[10px] text-emerald-400 font-mono overflow-auto max-w-xs">
                                                <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                            </div>
                                        </details>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {logs.length === 0 && !loading && (
                <div className="p-20 text-center text-gray-400">
                    <Activity size={48} className="mx-auto mb-4 opacity-10" />
                    <p>Herhangi bir işlem kaydı bulunamadı.</p>
                </div>
            )}
        </div>
    );
};

export default AuditLogViewer;
