import React from 'react';
import { TrendingUp, Home, MapPin, DollarSign } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            {subtext && <p className="text-xs text-emerald-600 mt-1 font-medium">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon size={20} className="text-white" />
        </div>
    </div>
);

const DashboardStats = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
                title="Toplam İlan"
                value={stats.totalProperties || 0}
                subtext="+12% geçen haftaya göre"
                icon={Home}
                color="bg-emerald-500"
            />
            <StatCard
                title="Ortalama Fiyat"
                value={`₺${stats.avgPrice?.toLocaleString() || 0}`}
                subtext="Son günlerde sabit"
                icon={DollarSign}
                color="bg-blue-500"
            />
            <StatCard
                title="Ortalama m²"
                value={`${stats.avgSize || 0} m²`}
                subtext="Genel ortalama"
                icon={TrendingUp}
                color="bg-purple-500"
            />
        </div>
    );
};

export default DashboardStats;
