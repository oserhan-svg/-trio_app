import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bot, MessageSquare, Play, Sparkles, Trash2, User, BookOpen, History, Plus, Save } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ExternalLink, Home, MapPin, LayoutGrid, Activity, Cpu, Layers, TrendingUp, Terminal, Shield, CheckCircle, XCircle } from 'lucide-react';
import LearnedRulesView from '../admin/LearnedRulesView';
import TestCaseManager from '../admin/TestCaseManager';

const PropertyCard = React.memo(({ property }) => (
    <div className="min-w-[280px] max-w-[280px] bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
        <div className="relative h-40 bg-gray-200 overflow-hidden">
            {property.images && property.images.length > 0 ? (
                <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                    <Home size={32} strokeWidth={1} />
                    <span className="text-[10px] mt-2">Görsel Yok</span>
                </div>
            )}
            <div className="absolute top-2 right-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${property.listing_type === 'sale' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                    {property.listing_type === 'sale' ? 'Satılık' : 'Kiralık'}
                </span>
            </div>
        </div>
        <div className="p-4 flex-1 flex flex-col">
            <h4 className="font-bold text-gray-800 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                {property.title}
            </h4>
            <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                <MapPin size={12} />
                <span>{property.neighborhood}, {property.district}</span>
            </div>
            <div className="mt-auto flex items-center justify-between pt-3 border-t">
                <div className="text-blue-600 font-bold text-base">
                    {new Intl.NumberFormat('tr-TR').format(property.price)} TL
                </div>
                <div className="text-xs text-gray-400 font-medium">
                    {property.rooms}
                </div>
            </div>
            <a
                href={property.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2 rounded-lg text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300"
            >
                Detayları Gör <ExternalLink size={12} />
            </a>
        </div>
    </div>
));

const formatMessage = (text) => {
    if (!text) return null;

    // Split by markdown links [text](url) and bold **text**
    const parts = text.split(/(\[.*?\]\(.*?\))|(\*\*.*?\*\*)/g);

    return parts.map((part, i) => {
        if (!part) return null;

        // Link match: [label](url)
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
            return (
                <a
                    key={i}
                    href={linkMatch[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline font-medium inline-flex items-center gap-0.5"
                >
                    {linkMatch[1]}
                    <ExternalLink size={10} />
                </a>
            );
        }

        // Bold match: **text**
        const boldMatch = part.match(/\*\*(.*?)\*\*/);
        if (boldMatch) {
            return <strong key={i} className="font-bold text-gray-900">{boldMatch[1]}</strong>;
        }

        return part;
    });
};

const TrainingDashboard = () => {
    const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' or 'knowledge'
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [knowledgeItems, setKnowledgeItems] = useState([]);
    const [stats, setStats] = useState(null);

    // Simulator State
    const [testMessage, setTestMessage] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Knowledge State
    const [newKnowledge, setNewKnowledge] = useState({ title: '', content: '', category: 'regional' });
    const [knowledgeLoading, setKnowledgeLoading] = useState(false);

    // Bot State
    const [botStatus, setBotStatus] = useState(null);
    const [botResults, setBotResults] = useState([]);
    const [botLoading, setBotLoading] = useState(false);

    // Memoize filtered sessions
    const recentSessions = useMemo(() => {
        return sessions.slice(0, 20); // Limit to 20 most recent
    }, [sessions]);

    // Memoize knowledge by category
    const knowledgeByCategory = useMemo(() => {
        return {
            regional: knowledgeItems.filter(k => k.category === 'regional'),
            general: knowledgeItems.filter(k => k.category === 'general'),
            instruction: knowledgeItems.filter(k => k.category === 'instruction')
        };
    }, [knowledgeItems]);

    useEffect(() => {
        fetchSessions();
        if (activeTab === 'knowledge') {
            fetchKnowledge();
        }
        if (activeTab === 'overview') {
            fetchStats();
        }
        if (activeTab === 'bot') {
            fetchBotStatus();
            fetchBotResults();
        }
    }, [activeTab]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/ai/sessions');
            setSessions(res.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    const fetchKnowledge = async () => {
        try {
            const res = await api.get('/ai/knowledge');
            setKnowledgeItems(res.data);
        } catch (error) {
            console.error('Error fetching knowledge:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/ai/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchBotStatus = async () => {
        try {
            const res = await api.get('/ai/bot/status');
            setBotStatus(res.data);
        } catch (error) {
            console.error('Error fetching bot status:', error);
        }
    };

    const fetchBotResults = async () => {
        try {
            const res = await api.get('/ai/bot/test-results');
            setBotResults(res.data);
        } catch (error) {
            console.error('Error fetching bot results:', error);
        }
    };

    const triggerBotAction = async (action) => {
        setBotLoading(true);
        try {
            await api.post('/ai/bot/trigger', { action });
            toast.success(`Bot görevi başlatıldı: ${action}`);
            fetchBotStatus();
            setTimeout(fetchBotResults, 5000); // Wait a bit for results
        } catch (error) {
            toast.error('Girişim başarısız: ' + error.message);
        } finally {
            setBotLoading(false);
        }
    };

    const loadSession = async (sessionId) => {
        try {
            const res = await api.get(`/ai/sessions/${sessionId}`);
            setHistory(res.data.messages.map(m => ({
                role: m.role,
                content: m.content,
                properties: m.metadata // User changed metadata to be the direct array
            })));
            setSelectedSessionId(sessionId);
            setActiveTab('simulator');
        } catch (error) {
            toast.error('Oturum yüklenemedi.');
        }
    };

    const handleTest = async () => {
        if (!testMessage.trim()) return;

        const userMsg = { role: 'user', content: testMessage };
        setHistory(prev => [...prev, userMsg]);
        setTestMessage('');
        setLoading(true);

        try {
            const response = await api.post('/ai/process', {
                message: testMessage,
                sessionId: selectedSessionId
            });

            const { answer, sessionId: newSessionId, properties } = response.data;

            if (newSessionId && newSessionId !== selectedSessionId) {
                setSelectedSessionId(newSessionId);
                fetchSessions(); // Refresh list to show new session title
            }

            setHistory(prev => [...prev, { role: 'assistant', content: answer, properties }]);
        } catch (error) {
            toast.error('AI Hatası: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleAddKnowledge = async () => {
        if (!newKnowledge.title || !newKnowledge.content) return toast.error('Başlık ve içerik zorunludur.');

        setKnowledgeLoading(true);
        try {
            await api.post('/ai/knowledge', newKnowledge);
            toast.success('Bilgi eklendi!');
            setNewKnowledge({ title: '', content: '', category: 'regional' });
            fetchKnowledge();
        } catch (error) {
            toast.error('Ekleme hatası: ' + error.message);
        } finally {
            setKnowledgeLoading(false);
        }
    };

    const clearChat = () => {
        setHistory([]);
        setSelectedSessionId(null);
        setTestMessage('');
        toast.success('Yeni sohbet başlatıldı.');
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 mt-8">
            {/* Sidebar: Sessions & Navigation */}
            <div className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Bot size={18} /> AI Kontrol
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <div className="mb-4">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                            <LayoutGrid size={16} /> Genel Bakış
                        </button>
                        <button
                            onClick={() => { setActiveTab('simulator'); clearChat(); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'simulator' && !selectedSessionId ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                            <Plus size={16} /> Yeni Simülasyon
                        </button>
                        <button
                            onClick={() => setActiveTab('knowledge')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'knowledge' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                            <BookOpen size={16} /> Bilgi Bankası
                        </button>
                        <button
                            onClick={() => setActiveTab('bot')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'bot' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                            <Shield size={16} /> Geliştirici Bot
                        </button>
                    </div>

                    <div className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Geçmiş Oturumlar
                    </div>
                    {recentSessions.map(session => (
                        <button
                            key={session.id}
                            onClick={() => loadSession(session.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-xs truncate transition ${selectedSessionId === session.id ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {session.title || `Oturum #${session.id}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {activeTab === 'overview' ? (
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <LayoutGrid className="text-blue-600" /> AI Eğitim Merkezi Paneli
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Sistemin öğrenme istatistikleri ve performans verileri.</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-blue-200 transition-colors">
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><Bot /></div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Toplam Sohbet</p>
                                    <p className="text-xl font-bold text-gray-800">{stats?.totalSessions || 0}</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-green-200 transition-colors">
                                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600"><TrendingUp /></div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Toplam Mesaj</p>
                                    <p className="text-xl font-bold text-gray-800">{stats?.totalMessages || 0}</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-purple-200 transition-colors">
                                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600"><Cpu /></div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Model</p>
                                    <p className="text-xl font-bold text-gray-800">Llama 3.3</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-orange-200 transition-colors">
                                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600"><Layers /></div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bilgi Sayısı</p>
                                    <p className="text-xl font-bold text-gray-800">{stats?.totalKnowledge || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Widget: Knowledge Dist */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
                                <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><Cpu size={16} className="text-gray-400" /> Bilgi Dağılımı</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    {['regional', 'general', 'instruction'].map(cat => (
                                        <div key={cat} className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="capitalize">{cat === 'regional' ? 'Bölgesel' : cat === 'general' ? 'Genel' : 'Talimat'}</span>
                                                <span className="text-gray-400">{stats?.knowledgeStats?.[cat] || 0} Madde</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${cat === 'regional' ? 'bg-purple-500' : cat === 'general' ? 'bg-blue-500' : 'bg-orange-500'}`}
                                                    style={{ width: `${(stats?.knowledgeStats?.[cat] || 0) / (stats?.totalKnowledge || 1) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Widget: Auto Learnt */}
                            <div className="h-fit">
                                <LearnedRulesView />
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'bot' ? (
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Shield className="text-indigo-600" /> Geliştirici Bot & Sürekli Test
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Arka planda AI performansını denetleyen ve iyileştiren otonom bot.</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => triggerBotAction('test')}
                                    disabled={botLoading || botStatus?.isWorking}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Play size={16} /> Testleri Çalıştır
                                </button>
                                <button
                                    onClick={() => triggerBotAction('audit')}
                                    disabled={botLoading || botStatus?.isWorking}
                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Activity size={16} /> Öz-Denetim Başlat
                                </button>
                            </div>
                        </div>

                        {/* Test Case Manager */}
                        <div className="mb-8">
                            <TestCaseManager />
                        </div>

                        <div className={`mb-8 p-4 rounded-xl border flex items-center justify-between ${botStatus?.isWorking ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${botStatus?.isWorking ? 'bg-indigo-600 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                                    <Terminal size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">
                                        Bot Durumu: {botStatus?.isWorking ? `Çalışıyor (${botStatus.currentTask})` : 'Boşta'}
                                    </p>
                                    <p className="text-xs text-gray-500">Son aktivite: {botStatus?.lastLogs?.[0] ? new Date(botStatus.lastLogs[0].created_at).toLocaleString('tr-TR') : 'Kayıt yok'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${botStatus?.isWorking ? 'bg-indigo-200 text-indigo-800' : 'bg-green-100 text-green-700'}`}>
                                    {botStatus?.isWorking ? 'AKTİF GÖREV' : 'HAZIR'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b bg-gray-50/50">
                                    <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><Terminal size={16} /> Bot Aktivite Günlüğü</h3>
                                </div>
                                <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                    {botStatus?.lastLogs?.map(log => (
                                        <div key={log.id} className="text-xs flex gap-3 border-b border-gray-50 pb-2 last:border-0">
                                            <span className="text-gray-400 whitespace-nowrap">{new Date(log.created_at).toLocaleTimeString('tr-TR')}</span>
                                            <span className={`font-bold uppercase tracking-tighter ${log.status === 'success' ? 'text-green-600' : log.status === 'failed' ? 'text-red-600' : 'text-blue-600'}`}>
                                                [{log.action}]
                                            </span>
                                            <span className="text-gray-700">{log.message}</span>
                                        </div>
                                    ))}
                                    {(!botStatus?.lastLogs || botStatus.lastLogs.length === 0) && (
                                        <p className="text-xs text-gray-400 italic text-center py-4">Henüz aktivite kaydı bulunmuyor.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><Shield size={16} /> Son Test Sonuçları</h3>
                                </div>
                                <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                    {botResults.map(result => (
                                        <div key={result.id} className="p-3 bg-gray-50 rounded-lg border border-transparent hover:border-indigo-100 transition-all">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-[10px] px-2 py-0.5 bg-white rounded border font-medium text-gray-500">{result.test_case?.category}</span>
                                                {result.is_success ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                                            </div>
                                            <p className="text-xs font-bold text-gray-800 line-clamp-1">{result.test_case?.input_message}</p>
                                            <div className="mt-2 text-[10px] text-gray-500 bg-white p-2 rounded border border-gray-100">
                                                <span className="font-bold text-indigo-600">AI:</span> {result.actual_response.substring(0, 100)}...
                                            </div>
                                            <span className="text-[10px] text-gray-400 block mt-2">{new Date(result.created_at).toLocaleString('tr-TR')}</span>
                                        </div>
                                    ))}
                                    {botResults.length === 0 && (
                                        <div className="text-center py-10 text-gray-400 text-sm flex flex-col items-center gap-2">
                                            <Play size={24} className="opacity-20" />
                                            Henüz test sonucu bulunmuyor.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'simulator' ? (
                    <>
                        {/* Simulator Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="text-blue-600" size={20} />
                                <h2 className="font-semibold text-gray-800">
                                    {selectedSessionId ? `Oturum #${selectedSessionId}` : 'Yeni Simülasyon'}
                                </h2>
                            </div>
                            {history.length > 0 && (
                                <button onClick={clearChat} className="text-gray-400 hover:text-red-600 transition">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                            {history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-60">
                                    <Bot size={48} strokeWidth={1} />
                                    <p className="text-sm">Merhaba! Ayvalık emlak piyasası hakkında ne bilmek istersiniz?</p>
                                </div>
                            ) : (
                                history.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-800' : 'bg-blue-600'}`}>
                                            {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                                        </div>
                                        <div className="flex flex-col gap-3 min-w-0 max-w-[85%]">
                                            <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-tr-none self-end ml-auto' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none self-start mr-auto'}`}>
                                                <div className="whitespace-pre-wrap leading-relaxed">
                                                    {formatMessage(msg.content)}
                                                </div>
                                            </div>

                                            {/* Render Property Cards if available */}
                                            {msg.properties && msg.properties.length > 0 && (
                                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2 scroll-smooth">
                                                    {msg.properties.map(p => (
                                                        <PropertyCard key={p.id} property={p} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            {loading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center animate-pulse"><Bot size={16} className="text-white" /></div>
                                    <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm"><span className="text-xs text-gray-500">Yazıyor...</span></div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-white">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleTest()}
                                    placeholder="Mesajınızı yazın..."
                                    className="flex-1 border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                                <button
                                    onClick={handleTest}
                                    disabled={loading || !testMessage.trim()}
                                    className="bg-blue-600 text-white px-5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 font-medium"
                                >
                                    {loading ? <Sparkles className="animate-spin" size={18} /> : <Play size={18} />}
                                    <span className="hidden sm:inline">Gönder</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <BookOpen className="text-blue-600" /> Bilgi Bankası Yönetimi
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                AI'ın bölge hakkında bilmesi gereken özel bilgileri buradan ekleyin.
                            </p>
                        </div>

                        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                            {/* Add Form */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="font-semibold mb-3 text-sm text-gray-700">Yeni Bilgi Ekle</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 block mb-1">Kategori</label>
                                            <select
                                                value={newKnowledge.category}
                                                onChange={e => setNewKnowledge({ ...newKnowledge, category: e.target.value })}
                                                className="w-full border rounded-md p-2 text-sm"
                                            >
                                                <option value="regional">Bölgesel Bilgi</option>
                                                <option value="general">Genel Emlak Bilgisi</option>
                                                <option value="instruction">Özel Talimat</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 block mb-1">Başlık</label>
                                            <input
                                                type="text"
                                                value={newKnowledge.title}
                                                onChange={e => setNewKnowledge({ ...newKnowledge, title: e.target.value })}
                                                placeholder="Örn: Cunda İmar Durumu"
                                                className="w-full border rounded-md p-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 block mb-1">İçerik</label>
                                            <textarea
                                                value={newKnowledge.content}
                                                onChange={e => setNewKnowledge({ ...newKnowledge, content: e.target.value })}
                                                rows={6}
                                                placeholder="AI'ın bilmesi gereken bilgi..."
                                                className="w-full border rounded-md p-2 text-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddKnowledge}
                                            disabled={knowledgeLoading}
                                            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                                        >
                                            {knowledgeLoading ? <Sparkles className="animate-spin" size={16} /> : <Save size={16} />}
                                            Kaydet
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* List */}
                            <div className="lg:col-span-2 overflow-y-auto pr-2">
                                <h3 className="font-semibold mb-3 text-sm text-gray-700">Mevcut Bilgiler ({knowledgeItems.length})</h3>
                                <div className="space-y-3">
                                    {knowledgeItems.map(item => (
                                        <div key={item.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition group">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wide ${item.category === 'regional' ? 'bg-purple-50 text-purple-700' :
                                                        item.category === 'instruction' ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {item.category}
                                                    </span>
                                                    <h4 className="font-bold text-gray-800 mt-1">{item.title}</h4>
                                                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.content}</p>
                                                    <div className="text-xs text-gray-400 mt-3 flex items-center gap-2">
                                                        <History size={12} />
                                                        {new Date(item.updated_at).toLocaleDateString('tr-TR')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {knowledgeItems.length === 0 && (
                                        <div className="text-center py-10 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">
                                            Henüz bilgi eklenmemiş.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainingDashboard;
