import React, { useState } from 'react';
import { CheckSquare, Square, Trash2, UserCheck, Power, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const BulkOperationsPanel = ({ selectedProperties, onComplete, users }) => {
    const [operation, setOperation] = useState('');
    const [targetUser, setTargetUser] = useState('');
    const [targetStatus, setTargetStatus] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleBulkOperation = async () => {
        if (!operation) {
            alert('Lütfen bir işlem seçin');
            return;
        }

        if (operation === 'assign' && !targetUser) {
            alert('Lütfen bir danışman seçin');
            return;
        }

        if (operation === 'status' && !targetStatus) {
            alert('Lütfen bir durum seçin');
            return;
        }

        if (!confirm(`${selectedProperties.length} ilan için "${operation}" işlemini onaylıyor musunuz?`)) {
            return;
        }

        setProcessing(true);
        try {
            const propertyIds = selectedProperties.map(p => p.id);

            switch (operation) {
                case 'assign':
                    await api.post('/properties/bulk-assign', {
                        propertyIds,
                        userId: parseInt(targetUser)
                    });
                    break;

                case 'status':
                    await api.post('/properties/bulk-status', {
                        propertyIds,
                        status: targetStatus
                    });
                    break;

                case 'delete':
                    await api.post('/properties/bulk-delete', {
                        propertyIds
                    });
                    break;

                case 'activate':
                    await api.post('/properties/bulk-status', {
                        propertyIds,
                        status: 'active'
                    });
                    break;

                case 'deactivate':
                    await api.post('/properties/bulk-status', {
                        propertyIds,
                        status: 'removed'
                    });
                    break;
            }

            alert('İşlem başarıyla tamamlandı!');
            onComplete();
        } catch (error) {
            console.error('Bulk operation error:', error);
            alert('İşlem başarısız: ' + (error.response?.data?.error || error.message));
        } finally {
            setProcessing(false);
        }
    };

    if (selectedProperties.length === 0) {
        return null;
    }

    return (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <CheckSquare className="text-blue-600" size={20} />
                    <span className="font-bold text-gray-800">
                        {selectedProperties.length} ilan seçildi
                    </span>
                </div>
                <AlertCircle className="text-blue-600" size={20} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                    value={operation}
                    onChange={(e) => {
                        setOperation(e.target.value);
                        setTargetUser('');
                        setTargetStatus('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium"
                >
                    <option value="">İşlem Seç</option>
                    <option value="assign">Danışman Ata</option>
                    <option value="status">Durum Değiştir</option>
                    <option value="activate">Aktif Et</option>
                    <option value="deactivate">Pasif Et</option>
                    <option value="delete">Sil</option>
                </select>

                {operation === 'assign' && (
                    <select
                        value={targetUser}
                        onChange={(e) => setTargetUser(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg font-medium"
                    >
                        <option value="">Danışman Seç</option>
                        {users && users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name}
                            </option>
                        ))}
                    </select>
                )}

                {operation === 'status' && (
                    <select
                        value={targetStatus}
                        onChange={(e) => setTargetStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg font-medium"
                    >
                        <option value="">Durum Seç</option>
                        <option value="active">Aktif</option>
                        <option value="removed">Yayından Kaldırıldı</option>
                        <option value="sold">Satıldı</option>
                        <option value="pending">Beklemede</option>
                    </select>
                )}

                <button
                    onClick={handleBulkOperation}
                    disabled={processing || !operation}
                    className={`px-6 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${processing || !operation
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    {processing ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            İşleniyor...
                        </>
                    ) : (
                        'Uygula'
                    )}
                </button>
            </div>
        </div>
    );
};

export default BulkOperationsPanel;
