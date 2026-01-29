import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, X, Loader } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const VoiceAssistant = () => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState(null);
    const [properties, setProperties] = useState(null);
    const [showResult, setShowResult] = useState(false);

    const recognition = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            recognition.current = new window.webkitSpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.interimResults = false;
            recognition.current.lang = 'tr-TR';

            recognition.current.onstart = () => {
                setIsListening(true);
                setTranscript('');
            };

            recognition.current.onresult = (event) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                processCommand(text);
            };

            recognition.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
                toast.error("Ses anlaşılamadı, lütfen tekrar deneyin.");
            };

            recognition.current.onend = () => {
                setIsListening(false);
            };
        } else {
            console.warn("Web Speech API not supported in this browser.");
        }
    }, []);

    const toggleListening = () => {
        if (!recognition.current) return toast.error("Tarayıcınız sesli komutu desteklemiyor.");

        if (isListening) {
            recognition.current.stop();
        } else {
            recognition.current.start();
            setResponse(null);
            setShowResult(false);
        }
    };

    const processCommand = async (text) => {
        setIsProcessing(true);
        setShowResult(true);
        try {
            // Send to AI
            const res = await api.post('/ai/process', {
                message: text,
                sessionId: null // Or manage a specific voice session
            });

            setResponse(res.data.answer);
            setProperties(res.data.properties);
            speak(res.data.answer);

        } catch (error) {
            console.error('AI Voice Error:', error);
            setResponse("Bir hata oluştu, lütfen tekrar deneyin.");
            speak("Bir hata oluştu.");
        } finally {
            setIsProcessing(false);
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            // Cancel any previous speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'tr-TR';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            // Try to find a Turkish voice
            const voices = window.speechSynthesis.getVoices();
            const trVoice = voices.find(v => v.lang.includes('tr'));
            if (trVoice) utterance.voice = trVoice;

            window.speechSynthesis.speak(utterance);
        }
    };

    const closePanel = () => {
        window.speechSynthesis.cancel();
        setShowResult(false);
        setResponse(null);
    };

    if (!recognition.current) return null;

    return (
        <>
            {/* FAB Trigger - Bottom Left to avoid Chat Widgets */}
            <button
                onClick={toggleListening}
                className={`fixed bottom-6 left-6 z-[9999] p-4 rounded-full shadow-lg transition-all transform hover:scale-110 ${isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                title="Sesli Asistan"
            >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* Result Overlay */}
            {showResult && (
                <div className="fixed bottom-24 left-6 z-[9999] w-80 bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    <div className="bg-indigo-600 p-3 flex justify-between items-center">
                        <span className="text-white text-sm font-bold flex items-center gap-2">
                            <Volume2 size={16} /> Trio AI Asistan
                        </span>
                        <button onClick={closePanel} className="text-white/80 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-4 max-h-60 overflow-y-auto">
                        <div className="text-right text-gray-500 text-xs mb-2 italic">"{transcript}"</div>

                        {isProcessing ? (
                            <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium">
                                <Loader size={16} className="animate-spin" />
                                Düşünüyor...
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-gray-800 text-sm leading-relaxed">
                                    {response}
                                </div>

                                {/* Property Results */}
                                {properties && properties.length > 0 && (
                                    <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                                        <div className="text-xs font-bold text-gray-500 uppercase">Bulunan İlanlar</div>
                                        {properties.map(p => (
                                            <div key={p.id} className="flex gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:shadow-md transition-all cursor-pointer" onClick={() => window.open(p.url, '_blank')}>
                                                <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                                    {p.images && p.images[0] ? (
                                                        <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-gray-900 text-xs truncate">{p.title}</div>
                                                    <div className="text-indigo-600 font-bold text-xs mt-0.5">{parseFloat(p.price).toLocaleString()} ₺</div>
                                                    <div className="text-gray-500 text-[10px] truncate">{p.district} / {p.neighborhood}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default VoiceAssistant;
