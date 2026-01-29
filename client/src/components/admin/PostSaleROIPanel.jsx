import React, { useState, useEffect } from 'react';
import { LineChart, TrendingUp, DollarSign, Calendar, AlertCircle, RefreshCw, Send, History } from 'lucide-react';
import api from '../../services/api';

const PostSaleROIPanel = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const fetchOpportunities = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/resale-opportunities');
            setOpportunities(res.data);
        } catch (error) {
            console.error('Failed to fetch ROI data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase text-[10px]">Yatırım Geri Dönüş Analizi Yapılıyor...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-600 rounded-2xl text-white">
                        <LineChart size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Yatırım İzleme & ROI Takibi</h2>
                        <p className="text-xs text-slate-500">Geçmiş satışların güncel piyasa değeri ve yeniden satış fırsatları.</p>
                    </div>
                </div>
                <button
                    onClick={fetchOpportunities}
                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {opportunities.length > 0 ? (
                    opportunities.map((op, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-emerald-200 transition-all group">
                            <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg ${op.roiPercentage > 20 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        %{op.roiPercentage}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 text-lg">{op.clientName}</h4>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                                            <Calendar size={12} /> {op.monthsHeld} AYDIR PORTFÖYDE
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-8">
                                    <Metric label="Alış Fiyatı" value={op.purchasePrice.toLocaleString() + ' ₺'} />
                                    <Metric label="Tahmini Değer" value={op.currentEstimatedValue.toLocaleString() + ' ₺'} highlight />
                                    <Metric label="Net Kazanç" value={'+' + op.absoluteGain.toLocaleString() + ' ₺'} color="text-emerald-600" />
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="hidden lg:block px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black border border-amber-100 uppercase italic">
                                        {op.reason === 'High Appreciation' ? '🔥 Yüksek Değerleme' : '⏳ Uzun Vadeli Tutuş'}
                                    </div>
                                    <button
                                        className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition"
                                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Sayın ${op.clientName}, Trio Emlak yatırım izleme raporuna göre mülkünüz son ${op.monthsHeld} ayda %${op.roiPercentage} değer kazandı. Yeniden satış fırsatlarını değerlendirmek isterseniz kahveye bekliyoruz.`)}`, '_blank')}
                                    >
                                        <Send size={14} /> Müşteriye Bildir
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-20 rounded-2xl border border-slate-100 text-center text-slate-300">
                        <AlertCircle size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="font-bold">Şu an kriterlerinize uygun yeniden satış fırsatı bulunamadı.</p>
                    </div>
                )}
            </div>

            <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                <History size={200} className="absolute -right-20 -bottom-20 opacity-10 rotate-12" />
                <div className="max-w-2xl relative z-10">
                    <h3 className="text-2xl font-black mb-4">Satış Sonrası Sadakat Programı</h3>
                    <p className="text-blue-100 leading-relaxed mb-6">
                        "Trio Emlak'ta satış bir final değil, yeni bir yatırım döngüsünün başlangıcıdır. Müşterileriniz mülkü aldıktan 18 ay sonra 'Property Value Watcher' otomatik olarak onlara bir teşekkür ve güncel değer raporu mesajı hazırlar. Bu sayede her 10 müşteriden 3'ü yeniden satış için sadece sizinle çalışır."
                    </p>
                    <div className="flex gap-4">
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                            <div className="text-[10px] font-bold uppercase opacity-60">Takip Edilen Hacim</div>
                            <div className="text-xl font-black">1.2B ₺</div>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                            <div className="text-[10px] font-bold uppercase opacity-60">Hizmet Alan Müşteri</div>
                            <div className="text-xl font-black">142</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Metric = ({ label, value, highlight, color }) => (
    <div className="text-center md:text-left">
        <div className="text-[9px] font-black text-slate-400 uppercase mb-1">{label}</div>
        <div className={`text-sm font-black ${highlight ? 'text-indigo-600' : color || 'text-slate-800'}`}>{value}</div>
    </div>
);

export default PostSaleROIPanel;
