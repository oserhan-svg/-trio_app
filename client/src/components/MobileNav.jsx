import React, { useState } from 'react';
import { Menu, X, RefreshCw, Users, FileText, LogOut, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileNav = ({ user, handleScrape, handleLogout, propertiesCount }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    const navItem = (icon, label, onClick, colorClass = "text-gray-700") => (
        <button
            onClick={() => {
                onClick();
                closeMenu();
            }}
            className={`flex items-center gap-3 w-full p-4 border-b border-gray-100 ${colorClass} hover:bg-gray-50 transition`}
        >
            {icon}
            <span className="font-medium text-lg">{label}</span>
        </button>
    );

    return (
        <div className="md:hidden">
            {/* Hamburger Button */}
            <button
                onClick={toggleMenu}
                className="p-2 text-gray-600 hover:text-blue-600 focus:outline-none"
                aria-label="Menu"
            >
                {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            {/* Overlay & Drawer */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50"
                        onClick={closeMenu}
                    ></div>

                    {/* Drawer */}
                    <div className="relative bg-white w-[80%] max-w-sm h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                        {/* Header */}
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                            <span className="text-xl font-bold text-blue-600">TrioApp</span>
                            <button onClick={closeMenu} className="text-gray-500">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {/* User Info */}
                            {user && (
                                <div className="p-4 bg-blue-50/50 mb-2">
                                    <div className="text-sm text-gray-500">Hoşgeldiniz</div>
                                    <div className="font-semibold text-gray-800">{user.name || user.email}</div>
                                    <div className="text-xs text-blue-600 mt-1 uppercase tracking-wider font-bold">
                                        {user.role === 'admin' ? 'Yönetici' : 'Danışman'}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col">
                                {navItem(<Home size={20} />, "Dashboard", () => navigate('/dashboard'))}

                                {navItem(
                                    <Users size={20} />,
                                    user?.role === 'admin' ? 'Admin Paneli' : 'Danışman Paneli',
                                    () => navigate('/consultant-panel')
                                )}

                                {navItem(<RefreshCw size={20} />, "Verileri Güncelle", handleScrape, "text-green-600")}

                                {navItem(<FileText size={20} />, "Proje Raporu", () => navigate('/report'), "text-purple-600")}

                                {navItem(<LogOut size={20} />, "Çıkış Yap", handleLogout, "text-red-600")}
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="p-4 bg-gray-50 border-t text-center text-xs text-gray-400">
                            <div>v2.1 • {propertiesCount || 0} ilan aktif</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileNav;
