import React, { useState } from 'react';
import { ShieldCheck, Smartphone, Send, Key, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

const DigitalSignatureBridge = ({ documentId, clientPhone, onComplete }) => {
    const [step, setStep] = useState('INIT'); // INIT, OTP_WAIT, COMPLETED
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const requestSms = async () => {
        try {
            setLoading(true);
            setError(null);
            await api.post(`/documents/${documentId}/request-sign`, { clientPhone });
            setStep('OTP_WAIT');
        } catch (err) {
            setError('SMS gönderilemedi. Lütfen numarayı kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.post(`/documents/${documentId}/verify-sign`, { otp });
            setStep('COMPLETED');
            if (onComplete) onComplete(res.data);
        } catch (err) {
            setError('Geçersiz onay kodu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 border-2 border-indigo-100 rounded-2xl p-6 overflow-hidden relative">
            {step === 'INIT' && (
                <div className="text-center">
                    <Smartphone size={48} className="mx-auto text-indigo-200 mb-4" />
                    <h4 className="font-black text-slate-800 mb-2 font-inter tracking-tight">Dijital İmza & Onay</h4>
                    <p className="text-xs text-slate-500 mb-6 px-4">
                        Müşterinin telefonuna ({clientPhone}) tek kullanımlık bir onay kodu gönderilerek yasal imza süreci başlatılacaktır.
                    </p>
                    <button
                        onClick={requestSms}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-100"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        Onay Kodu Gönder
                    </button>
                </div>
            )}

            {step === 'OTP_WAIT' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 text-indigo-600 mb-4 justify-center">
                        <Key size={20} className="animate-bounce" />
                        <span className="text-sm font-black uppercase tracking-widest">Onay Bekleniyor</span>
                    </div>
                    <div className="mb-4">
                        <input
                            type="text"
                            maxLength="6"
                            placeholder="6 Haneli Kod"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full text-center text-2xl font-black tracking-[0.5em] py-4 bg-white border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                        />
                    </div>
                    {error && (
                        <div className="flex items-center gap-2 text-rose-500 text-[10px] font-bold mb-4 justify-center uppercase tracking-tighter">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}
                    <button
                        onClick={verifyOtp}
                        disabled={loading || otp.length < 6}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                        Kodu Doğrula ve İmzala
                    </button>
                    <button
                        onClick={() => setStep('INIT')}
                        className="w-full mt-4 text-[10px] text-gray-400 font-bold uppercase hover:text-indigo-600"
                    >
                        Kodu Tekrar Gönder
                    </button>
                </div>
            )}

            {step === 'COMPLETED' && (
                <div className="text-center animate-in zoom-in-95 duration-500 py-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} />
                    </div>
                    <h4 className="font-black text-slate-800 mb-1">DOKÜMAN İMZALANDI</h4>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        HUKUKİ GEÇERLİ KAYIT OLUŞTURULDU
                    </p>
                    <div className="mt-6 p-3 bg-emerald-50 rounded-lg text-emerald-800 text-[10px] font-medium italic">
                        * Bu işlem SMS-OTP doğrulaması ile mühürlenmiştir. Timestamp ve IP logları Audit Log'a işlendi.
                    </div>
                </div>
            )}
        </div>
    );
};

export default DigitalSignatureBridge;
