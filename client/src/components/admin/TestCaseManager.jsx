import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Trash2, Plus, CheckCircle, AlertCircle, Beaker } from 'lucide-react';

const TestCaseManager = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({
        input_message: '',
        expected_intent: '',
        expected_keywords: '',
        is_golden: true
    });

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const res = await api.get('/ai/tests');
            setTests(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await api.post('/ai/tests', newItem);
            setNewItem({
                input_message: '',
                expected_intent: '',
                expected_keywords: '',
                is_golden: true
            });
            fetchTests();
        } catch (error) {
            alert('Ekleme başarısız: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu test senaryosunu silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/ai/tests/${id}`);
            setTests(tests.filter(t => t.id !== id));
        } catch (error) {
            alert('Silme başarısız');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Beaker className="text-purple-600" size={20} />
                Test Senaryoları (Sınav Soruları)
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{tests.length} Soru</span>
            </h2>

            {/* Add Form */}
            <form onSubmit={handleAdd} className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100 grid gap-4 grid-cols-1 md:grid-cols-4">
                <div className="md:col-span-2">
                    <input
                        type="text"
                        placeholder="Örnek Soru (User Input)"
                        required
                        className="w-full text-sm border-gray-300 rounded-md p-2"
                        value={newItem.input_message}
                        onChange={e => setNewItem({ ...newItem, input_message: e.target.value })}
                    />
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="Beklenen Kelimeler (virgülle)"
                        className="w-full text-sm border-gray-300 rounded-md p-2"
                        value={newItem.expected_keywords}
                        onChange={e => setNewItem({ ...newItem, expected_keywords: e.target.value })}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="text-sm border-gray-300 rounded-md p-2 flex-1"
                        value={newItem.expected_intent}
                        onChange={e => setNewItem({ ...newItem, expected_intent: e.target.value })}
                    >
                        <option value="">Niyet Seç (Opsiyonel)</option>
                        <option value="searchProperties">searchProperties</option>
                        <option value="searchWeb">searchWeb</option>
                        <option value="createCalendarEvent">createCalendarEvent</option>
                    </select>
                    <button type="submit" className="bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700">
                        <Plus size={20} />
                    </button>
                </div>
            </form>

            {/* List */}
            <div className="max-h-80 overflow-y-auto space-y-2">
                {tests.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-purple-200 transition-colors">
                        <div className="flex-1">
                            <div className="font-medium text-gray-800 text-sm">{t.input_message}</div>
                            <div className="text-xs text-gray-500 flex gap-2 mt-1">
                                {t.expected_intent && <span className="bg-blue-50 text-blue-600 px-1.5 rounded">{t.expected_intent}</span>}
                                {t.expected_keywords.length > 0 && <span className="bg-gray-100 text-gray-600 px-1.5 rounded">{t.expected_keywords.join(', ')}</span>}
                            </div>
                        </div>
                        <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-500 p-1">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {loading && <div className="text-center text-xs text-gray-400">Yükleniyor...</div>}
                {!loading && tests.length === 0 && <div className="text-center text-xs text-gray-400">Henüz test sorusu eklenmemiş.</div>}
            </div>
        </div>
    );
};

export default TestCaseManager;
