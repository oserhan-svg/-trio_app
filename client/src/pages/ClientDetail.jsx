import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    User, Phone, Mail, ArrowLeft, Calendar,
    MessageSquare, Clock, MapPin, TrendingUp,
    CheckCircle, XCircle, Star, Send, Plus, Edit2, X, FileText, Trash2,
    Briefcase, MoreHorizontal, Filter, Home
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
    const [activeTab, setActiveTab] = useState('timeline'); // 'timeline', 'portfolio'
    const [loading, setLoading] = useState(true);

    // Interaction Form
    const [noteContent, setNoteContent] = useState('');
    const [interactionType, setInteractionType] = useState('note');

    // Modals
    const [showDemandModal, setShowDemandModal] = useState(false);
    const [selectedDemand, setSelectedDemand] = useState(null);
    const [showMatchModal, setShowMatchModal] = useState(false);

    // Property Note Editing
    const [editingPropertyNote, setEditingPropertyNote] = useState(null);
    const [tempPropertyNote, setTempPropertyNote] = useState('');

    useEffect(() => {
        fetchClientData();
    }, [id]);

    const fetchClientData = async () => {
        try {
            setLoading(true);
            const clientRes = await api.get(`/clients/${id}`);
            console.log('Client Data Loaded:', clientRes.data); // Debug log
            setClient(clientRes.data);
            setInteractions(clientRes.data.interactions || []);
            setSavedProperties(clientRes.data.saved_properties || []);
        } catch (error) {
            console.error('Fetch Client Error:', error);
            addToast('Müşteri bilgileri alınamadı: ' + error.message, 'error');
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
            addToast('Not eklendi');
            const res = await api.get(`/clients/${id}/interactions`);
            setInteractions(res.data);
        } catch {
            addToast('Hata', 'error');
        }
    };

    // Info Edit Logic
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [tempNotes, setTempNotes] = useState('');

    const handleSaveInfo = async () => {
        try {
            await api.put(`/clients/${client.id}`, { notes: tempNotes });
            setClient({ ...client, notes: tempNotes });
            setIsEditingInfo(false);
            addToast('Bilgiler güncellendi');
        } catch {
            addToast('Hata', 'error');
        }
    };

    const SourceBadge = ({ url }) => {
        if (!url) return null;
        let type = 'other';
        if (url.includes('sahibinden.com')) type = 'sahibinden';
        if (url.includes('hepsiemlak.com')) type = 'hepsiemlak';

        if (type === 'other') return null;

        const styles = {
            sahibinden: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            hepsiemlak: 'bg-red-100 text-red-800 border-red-200'
        };
        const labels = { sahibinden: 'S', hepsiemlak: 'H' };

        return (
            <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full border font-bold ${styles[type]}`} title={type === 'sahibinden' ? 'Sahibinden' : 'Hepsiemlak'}>
                {labels[type]}
            </span>
        );
    };

    const handleDeleteDemand = async (e, demandId) => {
        e.stopPropagation();
        if (!confirm('Talebi sil?')) return;
        try {
            await api.delete(`/clients/demands/${demandId}`);
            addToast('Talep silindi');
            fetchClientData();
        } catch {
            addToast('Hata', 'error');
        }
    };

    const handleRemoveProperty = async (propertyId) => {
        if (!confirm('İlanı listeden kaldır?')) return;
        try {
            await api.delete(`/clients/${id}/properties/${propertyId}`);
            addToast('İlan kaldırıldı');
            fetchClientData();
        } catch {
            addToast('Hata', 'error');
        }
    };

    const handleSavePropertyNote = async (savedPropId, propertyId) => {
        try {
            await api.put(`/clients/${id}/properties/${propertyId}/note`, { note: tempPropertyNote });
            setSavedProperties(prev => prev.map(p => p.id === savedPropId ? { ...p, notes: tempPropertyNote } : p));
            setEditingPropertyNote(null);
            addToast('Not güncellendi');
        } catch {
            addToast('Hata', 'error');
        }
    };

    if (loading) return <div className="p-10 text-center text-sm text-gray-500">Yükleniyor...</div>;
    if (!client) return <div className="p-10 text-center text-sm">Bulunamadı.</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-sm">
            {/* Compact Header */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm/50">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/consultant-panel')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            {client.name}
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${client.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {client.status}
                            </span>
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowMatchModal(true)}
                        className="h-8 text-xs flex items-center justify-center gap-1.5 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 shadow-sm transition-all"
                    >
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        Akıllı Eşleştirme
                    </Button>
                </div>
            </div>

            <div className="flex-1 max-w-7xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Sidebar (3Cols) - sticky */}
                <div className="lg:col-span-3 space-y-4 h-fit lg:sticky lg:top-20">

                    {/* Compact Contact Card */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <User size={14} /> Profil
                            </h3>
                            <button onClick={() => { setTempNotes(client.notes || ''); setIsEditingInfo(true); }} className="text-gray-400 hover:text-blue-600">
                                <Edit2 size={12} />
                            </button>
                        </div>
                        <div className="p-3 space-y-2.5">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Phone size={14} className="text-gray-400" />
                                <span className="font-medium">{client.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <Mail size={14} className="text-gray-400" />
                                <a href={`mailto:${client.email}`} className="hover:text-blue-600 truncate">{client.email || '-'}</a>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <MapPin size={14} className="text-gray-400" />
                                <span>Ayvalık, Balıkesir</span>
                            </div>

                            {/* Notes Area */}
                            <div className="pt-2 border-t border-gray-100">
                                {isEditingInfo ? (
                                    <div className="space-y-2">
                                        <textarea
                                            className="w-full text-xs p-2 border rounded focus:ring-1 focus:ring-blue-500"
                                            value={tempNotes}
                                            onChange={(e) => setTempNotes(e.target.value)}
                                            rows={3}
                                            placeholder="Not..."
                                        />
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => setIsEditingInfo(false)} className="p-1 hover:bg-gray-100 rounded"><X size={14} /></button>
                                            <button onClick={handleSaveInfo} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle size={14} /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 italic whitespace-pre-wrap">
                                        {client.notes || 'Not eklenmemiş.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Compact Demands List */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Filter size={14} /> Talepler
                            </h3>
                            <button onClick={() => { setSelectedDemand(null); setShowDemandModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                                <Plus size={14} />
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {client.demands.map(d => (
                                <div key={d.id}
                                    className="p-3 hover:bg-gray-50 cursor-pointer group flex justify-between items-start"
                                    onClick={() => { setSelectedDemand(d); setShowDemandModal(true); }}
                                >
                                    <div>
                                        <div className="font-semibold text-gray-800 text-xs">
                                            {d.district} {d.neighborhood && `/ ${d.neighborhood}`}
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                            {d.rooms || 'Oda farketmez'} • {d.max_price ? `${parseInt(d.max_price / 1000)}k ₺` : 'Limit yok'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteDemand(e, d.id)}
                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                </div>
                            ))}
                            {client.demands.length === 0 && <div className="p-4 text-center text-xs text-gray-400">Talep yok.</div>}
                        </div>
                    </div>

                </div>

                {/* Right/Center Content (9Cols) */}
                <div className="lg:col-span-9 flex flex-col gap-4">

                    {/* Quick Action Bar + Tabs */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-1 flex items-center justify-between">
                        <div className="flex gap-1">
                            <button
                                onClick={() => setActiveTab('timeline')}
                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'timeline' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-1.5"><Clock size={14} /> Zaman Tüneli</div>
                            </button>
                            <button
                                onClick={() => setActiveTab('portfolio')}
                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'portfolio' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-1.5"><Briefcase size={14} /> Potansiyel İlanlar <span className="opacity-60 ml-0.5">({savedProperties.length})</span></div>
                            </button>
                        </div>
                    </div>

                    {activeTab === 'timeline' && (
                        <>
                            {/* Interaction Input */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                                <form onSubmit={handleAddInteraction}>
                                    <textarea
                                        className="w-full text-sm bg-transparent border-0 focus:ring-0 p-0 text-gray-700 placeholder:text-gray-400 resize-none h-12 mb-2"
                                        placeholder="Hızlı not ekle..."
                                        value={noteContent}
                                        onChange={e => setNoteContent(e.target.value)}
                                    />
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <div className="flex gap-1">
                                            {['note', 'call', 'meeting'].map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setInteractionType(t)}
                                                    className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wide transition-colors ${interactionType === t
                                                        ? (t === 'call' ? 'bg-blue-100 text-blue-700' : t === 'meeting' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-700')
                                                        : 'hover:bg-gray-50 text-gray-400'
                                                        }`}
                                                >
                                                    {t === 'note' ? 'Not' : t === 'call' ? 'Telefon' : 'Toplantı'}
                                                </button>
                                            ))}
                                        </div>
                                        <Button type="submit" size="sm" className="h-7 px-3 text-xs">Gönder</Button>
                                    </div>
                                </form>
                            </div>

                            {/* Feed */}
                            <div className="space-y-3">
                                {interactions.map(item => (
                                    <div key={item.id} className="flex gap-3 group">
                                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-sm ${item.type === 'call' ? 'bg-blue-500' : item.type === 'meeting' ? 'bg-purple-500' : 'bg-gray-400'
                                            }`}>
                                            {item.type === 'call' ? <Phone size={14} /> : item.type === 'meeting' ? <User size={14} /> : <FileText size={14} />}
                                        </div>
                                        <div className="flex-1 bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-gray-300 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-gray-800 text-sm capitalize">{item.type}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(item.date).toLocaleString()}</span>
                                            </div>
                                            <p className="text-gray-600 leading-relaxed dark:text-gray-300">{item.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {interactions.length === 0 && <div className="text-center py-10 text-gray-400 italic">Henüz etkileşim yok.</div>}
                            </div>
                        </>
                    )}

                    {activeTab === 'portfolio' && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="divide-y divide-gray-100">
                                {(() => {
                                    try {
                                        const validProperties = savedProperties.filter(p => p && p.property);

                                        if (validProperties.length === 0) {
                                            return <div className="p-8 text-center text-gray-400 italic">Kayıtlı ilan yok.</div>;
                                        }

                                        return validProperties.map(p => {
                                            // Ultra-defensive checks
                                            const prop = p.property || {};
                                            const title = typeof prop.title === 'string' ? prop.title : 'Başlıksız İlan';
                                            const images = Array.isArray(prop.images) ? prop.images : [];
                                            const price = prop.price ? parseInt(prop.price) : 0;
                                            const matchScore = p.current_match_score || 0;

                                            return (
                                                <div key={p.id} className="p-3 flex gap-3 hover:bg-gray-50 transition-colors group relative">

                                                    {/* Image */}
                                                    <div className="w-20 h-20 bg-gray-200 rounded-md overflow-hidden flex-shrink-0 relative">
                                                        {images.length > 0 && images[0] ?
                                                            <img src={images[0]} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                                            : <div className="w-full h-full flex items-center justify-center text-gray-400"><Home size={16} /></div>
                                                        }
                                                        {/* Score Badge */}
                                                        <div className={`absolute bottom-0 w-full text-[9px] font-bold text-center text-white py-0.5 ${matchScore >= 80 ? 'bg-emerald-500' :
                                                            matchScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                                                            }`}>
                                                            %{matchScore}
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                        <div>
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-bold text-gray-800 text-sm truncate mr-2" title={title}>
                                                                    {title.split('#')[0].trim()}
                                                                </h4>
                                                                <span className="font-bold text-blue-600 text-sm whitespace-nowrap">
                                                                    {price.toLocaleString()} ₺
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                                <SourceBadge url={prop.url} />
                                                                <span>{prop.district} / {prop.neighborhood}</span>
                                                                <span>• {prop.rooms}</span>
                                                                <span>• {prop.size_m2} m²</span>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-end justify-between mt-2">
                                                            <div className="flex-1 mr-4">
                                                                {editingPropertyNote === prop.id ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <input
                                                                            className="flex-1 text-xs px-2 py-1 border rounded"
                                                                            value={tempPropertyNote}
                                                                            onChange={e => setTempPropertyNote(e.target.value)}
                                                                            autoFocus
                                                                        />
                                                                        <button onClick={() => handleSavePropertyNote(p.id, prop.id)} className="text-green-600"><CheckCircle size={14} /></button>
                                                                        <button onClick={() => setEditingPropertyNote(null)} className="text-gray-400"><X size={14} /></button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => { setEditingPropertyNote(prop.id); setTempPropertyNote(p.notes || ''); }}
                                                                        className={`text-xs flex items-center gap-1 max-w-full text-left truncate ${p.notes ? 'text-gray-600 bg-yellow-50 px-2 py-0.5 rounded' : 'text-gray-300 hover:text-gray-500'}`}
                                                                    >
                                                                        <MessageSquare size={12} /> {p.notes || 'Not ekle...'}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => window.open(`/property-listing/${prop.id}`, '_blank')} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" title="Detay"><FileText size={14} /></button>
                                                                <button onClick={() => handleRemoveProperty(prop.id)} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded" title="Kaldır"><Trash2 size={14} /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    } catch (err) {
                                        console.error('Render Error in Portfolio:', err);
                                        return <div className="p-4 text-red-500 text-xs">Bir hata oluştu: {err.message}</div>;
                                    }
                                })()}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Modals */}
            <AddDemandModal
                isOpen={showDemandModal}
                onClose={() => setShowDemandModal(false)}
                onSave={async (data) => {
                    await api.post(`/clients/${id}/demands`, data);
                    setShowDemandModal(false);
                    fetchClientData();
                    addToast('Talep eklendi');
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
        </div>
    );
};

export default ClientDetail;
