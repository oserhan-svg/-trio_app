import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, ArrowLeft, BarChart2, Shield, RefreshCw } from 'lucide-react';

const ProjectReportPage = () => {
    const navigate = useNavigate();

    const handlePrint = () => {
        window.print();
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gray-50 print:bg-white text-gray-900 font-sans">
            {/* Action Bar (Hidden on Print) */}
            <div className="bg-white shadow-sm px-8 py-4 flex justify-between items-center print:hidden sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={20} />
                        Dashboard'a Dön
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Proje Raporu</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition">
                        <RefreshCw size={18} />
                        Raporu Güncelle
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm">
                        <Download size={18} />
                        Yazdır / PDF Kaydet
                    </button>
                </div>
            </div>

            {/* A4 Page Container */}
            <div className="max-w-[210mm] mx-auto bg-white shadow-xl my-8 p-[15mm] print:shadow-none print:my-0 print:p-0 print:w-full">

                {/* Header */}
                <div className="border-b-2 border-gray-900 pb-6 mb-8">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">Trio App Emlak Sistemi</h1>
                            <p className="text-xl text-gray-600">Teknik Özet ve Yetenek Raporu</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 font-medium">Rapor Tarihi</p>
                            <p className="text-lg font-bold">{new Date().toLocaleDateString('tr-TR')}</p>
                        </div>
                    </div>
                </div>

                {/* Section 1: Project Overview */}
                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-4 flex items-center gap-2">
                        <FileText size={24} /> 1. Proje Hakkında
                    </h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Bu proje, emlak ilanlarını farklı kaynaklardan (Hepsiemlak, Sahibinden - Bireysel) otomatik veya manuel olarak toplayan, veritabanında saklayan ve kullanıcıya gelişmiş analiz, filtreleme ve CRM (Müşteri İlişkileri Yönetimi) yetenekleri sunan bütünleşik bir web uygulamasıdır.
                    </p>
                </section>

                {/* Section 2: Key Features */}
                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-4 flex items-center gap-2">
                        <Shield size={24} /> 2. Temel Özellikler
                    </h2>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">🔍 Veri Toplama ve Analiz</h3>
                            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                                <li><strong>Çoklu Kaynak:</strong> Hepsiemlak ve Sahibinden (Bireysel) veri çekimi.</li>
                                <li><strong>Akıllı Etiketler:</strong> 🔥 Kelepir, ⚡ Fırsat, ✅ Uygun.</li>
                                <li><strong>Değer Artış Kazancı:</strong> 5 yıl kuralı ve enflasyon (Yİ-ÜFE) düzeltmeli vergi hesaplama robotu.</li>
                                <li><strong>Yatırım Analizi:</strong> ROI ve amortisman hesaplama.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">📊 Danışman Araçları</h3>
                            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                                <li><strong>🎯 Fırsat Radarı:</strong> Anlık piyasa taraması, kategori (Villa, Arsa, vb.) ve "Sadece Sahibinden" filtresi.</li>
                                <li><strong>📋 Fırsat Bülteni:</strong> Manuel seçim kontrollü, güvenlik korumalı ve yazdırılabilir özel liste.</li>
                                <li><strong>Panel Yönetimi:</strong> Admin ve Danışmanlar için özelleşmiş dinamik paneller.</li>
                                <li><strong>İlan Sahibi İletişim:</strong> Sahibinden ilanlarda satıcı adı ve telefonu (otomatik çekim).</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">💻 Dashboard ve Arayüz</h3>
                            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                                <li><strong>Responsive Grid:</strong> Cihaza göre dinamik sütun yapısı.</li>
                                <li><strong>Akıllı Sıralama:</strong> En iyi fırsatları otomatik öne çıkarma.</li>
                                <li><strong>Güvenli Erişim:</strong> Token tabanlı kimlik doğrulama.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">🤝 CRM ve Müşteri</h3>
                            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                                <li><strong>Müşteri Kaydı:</strong> Alıcı/Satıcı veritabanı.</li>
                                <li><strong>Otomatik Eşleşme:</strong> Talep ve ilan eşleştirme sistemi.</li>
                                <li><strong>Portföy Yönetimi:</strong> Müşteriye özel ilan listeleri.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Section 3: Technical Specs */}
                <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200 print:bg-gray-50 print:border-gray-300">
                    <h2 className="text-2xl font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-4 flex items-center gap-2">
                        <BarChart2 size={24} /> 3. Teknik Altyapı ve Güvenlik
                    </h2>

                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Backend</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>• Node.js & Express.js</li>
                                <li>• SQLite & Prisma ORM</li>
                                <li>• <strong>Real-Browser Scraper</strong> (Cloudflare Bypass)</li>
                                <li>• Güvenli Veri Filtreleme (Strict Mode)</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Frontend</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>• React.js (Vite)</li>
                                <li>• Tailwind CSS Styling</li>
                                <li>• Hibrit URL/Cache Yönetimi</li>
                                <li>• Özel Raporlama Motoru</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Algoritmalar</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>• 5 Yıl Değer Artış Matrahı</li>
                                <li>• Fırsat Puanlama (1-10)</li>
                                <li>• Otomatik Vergi Dilimi Hesabı</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-500">
                    <p>Bu rapor Trio App tarafından otomatik olarak oluşturulmuştur.</p>
                    <p>© 2026 Tüm Hakları Saklıdır.</p>
                </div>

            </div>
        </div>
    );
};

export default ProjectReportPage;
