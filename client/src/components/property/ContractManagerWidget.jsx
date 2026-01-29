import React, { useState } from 'react';
import { FileText, Download, Printer, Send, FileSignature, CheckCircle2, Loader2, Info } from 'lucide-react';
import api from '../../services/api';

const ContractManagerWidget = ({ propertyData, clientData, type = 'SHOWING_FORM' }) => {
    const [document, setDocument] = useState(null);
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            const res = await api.post('/documents/generate', {
                type,
                data: {
                    propertyId: propertyData?.id,
                    propertyTitle: propertyData?.title,
                    propertyAddress: `${propertyData?.district} / ${propertyData?.neighborhood}`,
                    price: propertyData?.price,
                    clientName: clientData?.name,
                    clientId: clientData?.id,
                    ownerName: propertyData?.seller_name,
                    officerName: 'Trio Danışman' // Ideally from AuthContext
                }
            });
            setDocument(res.data);
        } catch (error) {
            console.error('Document generation failed:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-slate-800 p-4 flex items-center justify-between text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <FileSignature size={18} className="text-blue-400" />
                    Sözleşme & Form Yönetimi
                </h3>
                {document && (
                    <span className="bg-emerald-500 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={10} /> HAZIR
                    </span>
                )}
            </div>

            <div className="p-6">
                {!document ? (
                    <div className="text-center">
                        <FileText size={40} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-xs text-gray-500 mb-6">
                            Bu işlem için gerekli tüm veriler (Fiyat, Konum, İsim) otomatik olarak çekilecektir.
                        </p>
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-100"
                        >
                            {generating ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                            {type === 'SHOWING_FORM' ? 'Yer Gösterme Belgesi Oluştur' : 'Sözleşme Hazırla'}
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        {/* Preview Area */}
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 mb-6 font-mono text-[10px] text-gray-600 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                            {document.content}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <ActionButton icon={<Download size={14} />} label="PDF İndir" color="bg-slate-100 text-slate-700 hover:bg-slate-200" />
                            <ActionButton icon={<Printer size={14} />} label="Yazdır" color="bg-slate-100 text-slate-700 hover:bg-slate-200" />
                            <ActionButton icon={<Send size={14} />} label="WhatsApp Paylaş" color="bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white" />
                            <ActionButton icon={<FileSignature size={14} />} label="Dijital İmzaya Gönder" color="bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white" />
                        </div>

                        <div className="p-3 bg-blue-50 rounded-lg flex gap-2">
                            <Info size={16} className="text-blue-500 shrink-0" />
                            <p className="text-[10px] text-blue-700">
                                Sözleşme imzalandığında dijital arşivinize otomatik olarak eklenecektir.
                            </p>
                        </div>

                        <button
                            onClick={() => setDocument(null)}
                            className="w-full text-[10px] text-gray-400 font-bold uppercase py-3 hover:text-indigo-600"
                        >
                            Yeniden Düzenle
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ActionButton = ({ icon, label, color }) => (
    <button className={`p-3 rounded-xl text-[10px] font-black flex flex-col items-center gap-2 transition border border-transparent ${color}`}>
        {icon}
        {label}
    </button>
);

export default ContractManagerWidget;
