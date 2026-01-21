import React, { useState } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { LogIn } from 'lucide-react';
import api from '../services/api'; // Changed from axios
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Using api instance handles base URL
            const response = await api.post('/auth/login', {
                email,
                password
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            toast.success('Giriş başarılı! Yönlendiriliyorsunuz...');

            // Navigate to dashboard
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);

        } catch (err) {
            console.error('Login Error Full:', err);
            const msg = err.response?.data?.error || err.message || 'Giriş yapılamadı.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                            <LogIn size={24} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Hoş Geldiniz</h1>
                        <p className="text-gray-500 text-sm mt-1">Trio App'e giriş yapın</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <Input
                            id="email"
                            type="email"
                            label="E-posta Adresi"
                            placeholder="ornek@trioapp.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Input
                            id="password"
                            type="password"
                            label="Parola"
                            placeholder=""
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />



                        <Button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2">
                            <LogIn size={18} />
                            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </Button>
                    </form>
                </div>
                <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        © 2026 Trio App v1.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
