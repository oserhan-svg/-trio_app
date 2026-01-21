import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, Edit2, Shield, Mail, ArrowLeft, Save, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AdminManagement = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
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
            setFormData({ email: '', password: '', role: 'consultant' });
            fetchUsers();
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
            password: '', // Don't show existing password
            role: user.role
        });
        setShowModal(true);
    };

    return (
        <div className={`p-6 ${isEmbedded ? '' : 'min-h-screen bg-gray-50 pt-24'}`}>
            <div className="max-w-6xl mx-auto">
                {!isEmbedded && (
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-white rounded-full transition-colors"
                            >
                                <ArrowLeft size={24} className="text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
                                <p className="text-gray-500">Sistem kullanıcılarını ve yetkilerini yönetin</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setEditingUser(null);
                                setFormData({ email: '', password: '', role: 'consultant' });
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            <UserPlus size={20} />
                            Yeni Kullanıcı Ekle
                        </button>
                    </div>
                )}

                {isEmbedded && (
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Kullanıcı Listesi</h2>
                        <button
                            onClick={() => {
                                setEditingUser(null);
                                setFormData({ email: '', password: '', role: 'consultant' });
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm shadow-sm"
                        >
                            <UserPlus size={16} />
                            Yeni Ekle
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kullanıcı</th>
                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rol</th>
                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kayıt</th>
                                <th className="px-4 py-2.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-400 text-sm italic">Yükleniyor...</td></tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {user.email[0].toUpperCase()}
                                            </div>
                                            <div className="text-xs font-semibold text-gray-700">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
                                            }`}>
                                            <Shield size={10} />
                                            {user.role === 'admin' ? 'Yönetici' : 'Danışman'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-[10px] text-gray-400 font-medium">
                                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right space-x-2">
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                            title="Düzenle"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
            </div>

            {/* User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Oluştur'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta Adresi</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editingUser ? 'Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)' : 'Şifre'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Yetki Rolü</label>
                                <select
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="consultant">Danışman</option>
                                    <option value="admin">Yönetici (Admin)</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-200"
                            >
                                <Save size={20} />
                                {editingUser ? 'Güncelle' : 'Kullanıcıyı Kaydet'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
