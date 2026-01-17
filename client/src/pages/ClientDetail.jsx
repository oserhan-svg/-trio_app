import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    User, Phone, Mail, ArrowLeft, Calendar,
    MessageSquare, Clock, MapPin, TrendingUp,
    CheckCircle, XCircle, Star, Send, Plus, Edit2, X, FileText, Trash2
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import AddDemandModal from '../components/crm/AddDemandModal';
import ClientMatchesModal from '../components/crm/ClientMatchesModal';

const ClientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [client, setClient] = useState(null);
    const [interactions, setInteractions] = useState([]);
    const [savedProperties, setSavedProperties] = useState([]);
    const [activeTab, setActiveTab] = useState('timeline'); // 'timeline', 'portfolio', 'demands'
    const [loading, setLoading] = useState(true);

    // Interaction Form
    const [noteContent, setNoteContent] = useState('');
    const [interactionType, setInteractionType] = useState('note');

    // Modals
    const [showDemandModal, setShowDemandModal] = useState(false);
    const [selectedDemand, setSelectedDemand] = useState(null);
    const [showMatchModal, setShowMatchModal] = useState(false);

    // Property Note Editing
    const [editingPropertyNote, setEditingPropertyNote] = useState(null); // propertyId being edited
    const [tempPropertyNote, setTempPropertyNote] = useState('');

    useEffect(() => {
        fetchClientData();
    }, [id]);

    const fetchClientData = async () => {
        try {
            setLoading(true);
            const clientRes = await api.get(`/clients/${id}`);
            setClient(clientRes.data);
            setInteractions(clientRes.data.interactions || []);
            console.log('Client Data:', clientRes.data);
            console.log('Saved Props:', clientRes.data.saved_properties);
            setSavedProperties(clientRes.data.saved_properties || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddInteraction = async (e) => {
        e.preventDefault();
        if (!noteContent.trim()) return;

        try {
            await api.post(`/clients/${id}/interactions`, {
                type: interactionType,
                content: noteContent
            });
            setNoteContent('');
            addToast('Not başarıyla eklendi');
            // Refresh interactions
            const res = await api.get(`/clients/${id}/interactions`);
            setInteractions(res.data);
        } catch (error) {
            addToast('Not eklenemedi', 'error');
        }

    };

    // Info Edit Logic
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [tempNotes, setTempNotes] = useState('');

    const handleSaveInfo = async () => {
        try {
            const res = await api.put(`/clients/${client.id}`, {
                notes: tempNotes
            });
            setClient({ ...client, notes: tempNotes });
            setIsEditingInfo(false);
            addToast('Müşteri bilgileri güncellendi');
        } catch (error) {
            addToast('Bilgiler güncellenemedi', 'error');
        }
    };

    // Helper for Source Badge
    const getSourceType = (url) => {
        if (!url) return null;
        if (url.includes('sahibinden.com')) return 'sahibinden';
        if (url.includes('hepsiemlak.com')) return 'hepsiemlak';
        return 'other';
    };

    const SourceBadge = ({ url }) => {
        const type = getSourceType(url);
        if (!type || type === 'other') return null;

        const styles = {
            sahibinden: 'bg-yellow-400 text-yellow-900',
            hepsiemlak: 'bg-red-500 text-white'
        };
        const labels = {
            sahibinden: 'Sahibinden',
            hepsiemlak: 'Hepsiemlak'
        };

        return (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 ${styles[type]}`}>
                {labels[type]}
            </span>
        );
    };

    const handleDeleteDemand = async (e, demandId) => {
        e.stopPropagation(); // Prevent opening modal
        if (!window.confirm('Bu talebi silmek istediğinize emin misiniz?')) return;

        try {
            await api.delete(`/clients/demands/${demandId}`);
            addToast('Talep silindi');
            fetchClientData();
        } catch (error) {
            addToast('Talep silinemedi', 'error');
        }
    };

    const handleRemoveProperty = async (propertyId) => {
        if (!confirm('Bu ilanı listeden kaldırmak istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/clients/${id}/properties/${propertyId}`);
            addToast('İlan listeden kaldırıldı', 'success');
            fetchClientData();
        } catch (error) {
            console.error('Error removing property:', error);
            addToast('İlan kaldırılamadı', 'error');
        }
    };

    // Render Helpers
    const getStatusColor = (status) => {
        if (!status) return 'bg-gray-100 text-gray-800';
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800';
            case 'Negotiation': return 'bg-yellow-100 text-yellow-800';
            case 'Closed Won': return 'bg-blue-100 text-blue-800';
            case 'Lost': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;
    if (!client) return <div className="p-10 text-center">Müşteri bulunamadı.</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* ... Header ... */}
            <div className="bg-white border-b sticky top-0 z-10 px-6 py-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/consultant-panel')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            {client.name}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(client.status)}`}>
                                {client.status}
                            </span>
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowMatchModal(true)}>
                        ✨ Akıllı Eşleştirme
                    </Button>
                </div>
            </div>

            <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Info */}
                <div className="space-y-6">
                    {/* Contact Card */}
                    {/* ... (kept same) ... */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">İletişim</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-600">
                                <Phone size={18} className="text-gray-400" />
                                {client.phone || '-'}
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <Mail size={18} className="text-gray-400" />
                                <a href={`mailto:${client.email}`} className="hover:text-emerald-600">{client.email || '-'}</a>
                            </div>

                            <div className="flex items-center gap-3 text-gray-600">
                                <MapPin size={18} className="text-gray-400" />
                                <span>Ayvalık, Balıkesir</span>
                            </div>
                        </div>

                        {/* Basic Info (Notes) */}
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-semibold text-gray-700">Temel Bilgiler</h4>
                                {!isEditingInfo && (
                                    <button onClick={() => { setTempNotes(client.notes || ''); setIsEditingInfo(true); }} className="text-gray-400 hover:text-emerald-600">
                                        <Edit2 size={14} />
                                    </button>
                                )}
                            </div>

                            {isEditingInfo ? (
                                <div className="space-y-2">
                                    <textarea
                                        className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                                        value={tempNotes}
                                        onChange={(e) => setTempNotes(e.target.value)}
                                        placeholder="Müşteri hakkında notlar..."
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setIsEditingInfo(false)}
                                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                                        >
                                            <X size={16} />
                                        </button>
                                        <button
                                            onClick={handleSaveInfo}
                                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                        >
                                            <CheckCircle size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 whitespace-pre-wrap">
                                    {client.notes || 'Henüz bilgi girilmemiş.'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Demands Summary */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Talepler</h3>
                            <button onClick={() => { setSelectedDemand(null); setShowDemandModal(true); }} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded">
                                <Plus size={18} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {client.demands.map(d => (
                                <div key={d.id} className="relative group bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm cursor-pointer hover:border-emerald-200"
                                    onClick={() => { setSelectedDemand(d); setShowDemandModal(true); }}>

                                    <button
                                        onClick={(e) => handleDeleteDemand(e, d.id)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        title="Talebi Sil"
                                    >
                                        <XCircle size={16} />
                                    </button>

                                    <div className="font-semibold text-slate-700 pr-6">
                                        {d.district} {d.neighborhood && `/ ${d.neighborhood}`}
                                    </div>
                                    <div className="text-slate-500 mt-1 flex justify-between">
                                        <span>{d.rooms || 'Oda farketmez'}</span>
                                        <span>{d.max_price ? `${parseInt(d.max_price / 1000)}k ₺` : 'Limit yok'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center Column: Interaction Timeline */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Input Box */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <form onSubmit={handleAddInteraction}>
                            <div className="flex gap-2 mb-2 p-1 bg-gray-50 rounded-lg w-fit">
                                {['note', 'call', 'meeting'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setInteractionType(t)}
                                        className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${interactionType === t ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {t === 'note' ? 'Not' : t === 'call' ? 'Telefon' : 'Toplantı'}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                className="w-full bg-transparent border-0 focus:ring-0 p-2 text-gray-700 placeholder:text-gray-400 resize-none h-24"
                                placeholder="Görüşme notu veya aksiyon..."
                                value={noteContent}
                                onChange={e => setNoteContent(e.target.value)}
                            />
                            <div className="flex justify-end border-t border-gray-100 pt-2">
                                <Button type="submit" size="sm" className="flex items-center gap-2">
                                    <Send size={14} /> Kaydet
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Tabs for Timeline vs Portfolio */}
                    <div className="flex gap-6 border-b border-gray-200 px-2">
                        <button
                            className={`pb-3 font-medium text-sm transition-colors ${activeTab === 'timeline' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('timeline')}
                        >
                            Zaman Tüneli
                        </button>
                        <button
                            className={`pb-3 font-medium text-sm transition-colors ${activeTab === 'portfolio' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('portfolio')}
                        >
                            İlgilenilen İlanlar ({savedProperties.length})
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[400px]">
                        {activeTab === 'timeline' ? (
                            <div className="space-y-6 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-200">
                                {interactions.map(item => (
                                    <div key={item.id} className="relative pl-10">
                                        <div className={`absolute left-2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white ${item.type === 'call' ? 'bg-blue-500' : item.type === 'meeting' ? 'bg-purple-500' : 'bg-gray-400'
                                            }`}></div>
                                        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-xs font-bold uppercase ${item.type === 'call' ? 'text-blue-600' : item.type === 'meeting' ? 'text-purple-600' : 'text-gray-500'
                                                    }`}>
                                                    {item.type === 'note' ? 'Not' : item.type === 'call' ? 'Telefon Görüşmesi' : 'Toplantı'}
                                                </span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {new Date(item.date).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {interactions.length === 0 && <div className="pl-10 text-gray-400 text-sm">Henüz bir aktivite yok.</div>}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {savedProperties.length === 0 && <div className="col-span-2 text-center text-gray-400 py-10">Kayıtlı ilan yok. "Akıllı Eşleştirme" üzerinden ekleyebilirsiniz.</div>}
                                {savedProperties.map(p => (
                                    <div key={p.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                                        <div className="h-32 bg-gray-200 relative group">
                                            {p.property.images?.[0] && (
                                                <img src={p.property.images[0]} className="w-full h-full object-cover" />
                                            )}
                                            <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold shadow">
                                                {parseInt(p.property.price).toLocaleString()} ₺
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemoveProperty(p.property.id); }}
                                                className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                title="Listeden Kaldır"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <div className="p-3 flex-1 flex flex-col">
                                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 flex items-center">
                                                {p.property.title}
                                                <SourceBadge url={p.property.url} />
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">{p.property.district} / {p.property.neighborhood}</p>

                                            {/* Property-Specific Notes */}
                                            {editingPropertyNote === p.property.id ? (
                                                <div className="mt-2 space-y-1">
                                                    <textarea
                                                        className="w-full text-xs p-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[60px]"
                                                        value={tempPropertyNote}
                                                        onChange={(e) => setTempPropertyNote(e.target.value)}
                                                        placeholder="Bu ilan hakkında notlar..."
                                                    />
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            onClick={() => setEditingPropertyNote(null)}
                                                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSavePropertyNote(p.id, p.property.id)}
                                                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : p.notes ? (
                                                <div className="mt-2 bg-yellow-50 p-2 rounded-lg text-xs text-yellow-800 border border-yellow-100 relative group">
                                                    <button
                                                        onClick={() => { setEditingPropertyNote(p.property.id); setTempPropertyNote(p.notes || ''); }}
                                                        className="absolute top-1 right-1 text-yellow-600 hover:text-yellow-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <p className="whitespace-pre-wrap pr-6">{p.notes}</p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => { setEditingPropertyNote(p.property.id); setTempPropertyNote(''); }}
                                                    className="mt-2 text-xs text-gray-400 hover:text-emerald-600 flex items-center gap-1"
                                                >
                                                    <MessageSquare size={12} /> Not Ekle
                                                </button>
                                            )}

                                            <div className="mt-auto pt-3 flex gap-2">
                                                <button
                                                    onClick={() => window.open(`/property-listing/${p.property.id}`, '_blank')}
                                                    className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 flex items-center gap-1 font-medium transition-colors"
                                                    title="İlan Sayfası Oluştur"
                                                >
                                                    <FileText size={12} /> Sayfa
                                                </button>
                                                <span className={`text-xs px-2 py-1 rounded flex-1 text-center font-medium ${p.status === 'liked' ? 'bg-green-100 text-green-700' :
                                                    p.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {p.status === 'liked' ? 'Beğendi' : p.status === 'rejected' ? 'İlgilenmedi' : 'Önerildi'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <AddDemandModal
                isOpen={showDemandModal}
                onClose={() => setShowDemandModal(false)}
                onSave={async (data) => {
                    await api.post(`/clients/${id}/demands`, data);
                    setShowDemandModal(false);
                    fetchClientData();
                }}
                clientName={client.name}
                initialData={selectedDemand}
            />

            <ClientMatchesModal
                isOpen={showMatchModal}
                onClose={() => setShowMatchModal(false)}
                client={client}
                onUpdate={fetchClientData}
            />
        </div >
    );
};

export default ClientDetail;
