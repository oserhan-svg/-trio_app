import React from 'react';
import { Activity, Users, Globe, Flame } from 'lucide-react';

const MarketHealthWidget = ({ data = [], totalCount: propTotalCount }) => {
    // Basic heuristics based on scraped data
    const totalCount = propTotalCount || data.length;
    const ownerCount = data.filter(p => p.seller_type === 'owner').length;
    const ownerRatio = totalCount > 0 ? (ownerCount / totalCount) * 100 : 0;

    // Portal distribution
    const sahCount = data.filter(p => p.url?.includes('sahibinden.com')).length;
    const hepCount = data.filter(p => p.url?.includes('hepsiemlak.com')).length;
    const ejCount = data.filter(p => p.url?.includes('emlakjet.com')).length;

    // Market Temperature: Based on avg opportunity score of recent listings
    const avgScore = data.length > 0
        ? data.reduce((acc, p) => acc + (p.opportunity_score || 0), 0) / data.length
        : 0;

    const getTemp = (score) => {
        if (score >= 7) return { label: 'Sıcak (Fırsat Bol)', color: 'text-orange-600', bg: 'bg-orange-50', icon: Flame };
        if (score >= 5) return { label: 'Normal', color: 'text-blue-600', bg: 'bg-blue-50', icon: Activity };
        return { label: 'Sakin', color: 'text-gray-600', bg: 'bg-gray-50', icon: Activity };
    };

    const temp = getTemp(avgScore);
    const TempIcon = temp.icon;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Portfoy */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                    <Globe size={20} />
                </div>
                <div>
                    <div className="text-xs text-gray-500 font-medium">Toplam Portföy</div>
                    <div className="text-lg font-bold text-gray-900">{totalCount} <span className="text-[10px] text-gray-400 font-normal ml-1">İlan</span></div>
                </div>
            </div>

            {/* Owner Ratio */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                    <Users size={20} />
                </div>
                <div className="flex-1">
                    <div className="text-xs text-gray-500 font-medium whitespace-nowrap">Sahibinden Payı</div>
                    <div className="flex items-end gap-2">
                        <span className="text-lg font-bold text-gray-900">%{Math.round(ownerRatio)}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full mb-1.5 overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${ownerRatio}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Portal Stats */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                    <Activity size={20} />
                </div>
                <div className="flex-1">
                    <div className="text-xs text-gray-500 font-medium">Kaynak Dağılımı</div>
                    <div className="flex gap-1 mt-1">
                        <div className="flex-1 h-2 bg-yellow-400 rounded-full" title={`Sahibinden: ${sahCount}`} style={{ flex: sahCount || 1 }} />
                        <div className="flex-1 h-2 bg-red-500 rounded-full" title={`Hepsiemlak: ${hepCount}`} style={{ flex: hepCount || 1 }} />
                        <div className="flex-1 h-2 bg-blue-500 rounded-full" title={`Emlakjet: ${ejCount}`} style={{ flex: ejCount || 1 }} />
                    </div>
                    <div className="flex justify-between text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                        <span>SAH</span>
                        <span>HEP</span>
                        <span>EMJ</span>
                    </div>
                </div>
            </div>

            {/* Market Temp */}
            <div className={`p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 ${temp.bg}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${temp.color} bg-white shadow-sm`}>
                    <TempIcon size={20} />
                </div>
                <div>
                    <div className="text-xs font-medium opacity-70">Piyasa Nabzı</div>
                    <div className={`text-sm font-bold ${temp.color}`}>{temp.label}</div>
                </div>
            </div>
        </div>
    );
};

export default MarketHealthWidget;
