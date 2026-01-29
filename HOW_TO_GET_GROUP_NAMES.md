# WhatsApp Grup İsimlerini Getirme Rehberi

## Durum
WhatsApp client şu anda **disconnected** durumda, bu yüzden grup isimlerini alamıyoruz.

## Çözüm: WhatsApp'ı Yeniden Bağlayın

### Adım 1: WhatsApp Client'ı Başlatın
Server'ı açtığınızda WhatsApp otomatik başlayacak, ancak manuel olarak da başlatabilirsiniz:

```bash
# Server klasöründe
npm run dev
```

### Adım 2: QR Kod ile Bağlanın
1. Browser'da `http://localhost:3000/whatsapp` adresine gidin
2. QR kodu telefonunuzla tarayın:
   - WhatsApp'ı açın
   - **Ayarlar** → **Bağlı Cihazlar**
   - **Cihaz Bağla**'ya basın
   - QR kodu tarayın

### Adım 3: Grup İsimlerini Otomatik Güncelleyin
WhatsApp bağlandıktan sonra, aşağıdaki endpoint'i çağırın:

```bash
# Postman veya curl ile
POST http://localhost:5005/api/whatsapp/repair-groups
Authorization: Bearer <your-token>
```

Ya da scripti çalıştırın:
```bash
node scripts/repairGroupNames.js
```

## Alternatif: Manuel Güncelleme
Eğer WhatsApp'ı bağlamak istemiyorsanız, grup isimlerini manuel olarak veritabanına girebilirsiniz:

```sql
UPDATE clients 
SET name = 'Gerçek Grup İsmi' 
WHERE phone = '120363387949557680@g.us';
```

## Not
- Grup isimleri WhatsApp'tan **canlı** olarak çekilmeli
- Metadata'da grup isimleri saklanmıyor (sadece üye isimleri var)
- WhatsApp bağlandığında sync otomatik olarak grup isimlerini güncelleyecek
