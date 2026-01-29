import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit2, Shield, X, Search } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        role: 'consultant'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
            setLoading(false);
        } catch (error) {
            toast.error('Kullanıcılar yüklenemedi');
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, formData);
                toast.success('Kullanıcı güncellendi');
            } else {
                await api.post('/users', formData);
                toast.success('Yeni kullanıcı oluşturuldu');
            }
            setShowModal(false);
            setEditingUser(null);
            setFormData({ email: '', name: '', password: '', role: 'consultant' });
            await fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'İşlem başarısız');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/users/${id}`);
            toast.success('Kullanıcı silindi');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Silme işlemi başarısız');
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            name: user.name || '',
            password: '', // Don't show existing password
            role: user.role
        });
        setShowModal(true);
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Kullanıcı Listesi</h2>
                    <p className="text-sm text-gray-500">Sistemdeki yetkili hesapları yönetin.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Kullanıcı ara..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setFormData({ email: '', password: '', role: 'consultant' });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm whitespace-nowrap"
                    >
                        <UserPlus size={18} />
                        <span className="hidden md:inline">Yeni Ekle</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kayıt Tarihi</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">Yükleniyor...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">Kullanıcı bulunamadı.</td></tr>
                        ) : filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs ring-2 ring-white shadow-sm">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div className="text-sm font-medium text-gray-700">{user.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="text-sm text-gray-600">{user.name || '-'}</div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        <Shield size={12} />
                                        {user.role === 'admin' ? 'Yönetici' : 'Danışman'}
                                    </span>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
                                    {new Date(user.created_at).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-right space-x-2">
                                    <button
                                        onClick={() => openEditModal(user)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 rounded"
                                        title="Düzenle"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors bg-gray-50 hover:bg-red-50 rounded"
                                        title="Sil"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] transition-all p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Oluştur'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta Adresi</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editingUser ? 'Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)' : 'Şifre'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Rolü</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="consultant">Danışman</option>
                                    <option value="admin">Yönetici (Admin)</option>
                                </select>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition-colors"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
