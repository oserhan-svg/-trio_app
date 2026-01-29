# WhatsApp AI Bot - Kullanım Kılavuzu

## 🎯 Özellikler

- ✅ **Tamamen Ücretsiz** - API maliyeti yok
- ✅ **Türkçe Optimize** - Türk emlak piyasasına özel
- ✅ **Otomatik Müşteri Tespiti** - Mesajları analiz eder
- ✅ **Akıllı Puanlama** - 0-100 arası lead skorlama
- ✅ **Aksiyon Önerileri** - Ara, randevu, hatırlatıcı
- ✅ **CRM Entegrasyonu** - Otomatik müşteri kaydı

## 🚀 Hızlı Başlangıç

### 1. Sistem Gereksinimlerini Kontrol Edin

```bash
# Node.js versiyonunu kontrol edin (14+ gerekli)
node --version

# PostgreSQL çalıştığından emin olun
```

### 2. Bağımlılıkları Yükleyin

```bash
cd server
npm install
```

### 3. Database'i Güncelleyin

```bash
npx prisma db push
npx prisma generate
```

### 4. Serveri Başlatın

```bash
npm start
```

### 5. WhatsApp'ı Bağlayın

1. Tarayıcıda http://localhost:3000 adresine gidin
2. Danışman Panel → **WhatsApp AI** sekmesine tıklayın
3. **"WhatsApp'ı Bağla"** butonuna basın
4. Çıkan QR kodu WhatsApp uygulamanızda okutun:
   - WhatsApp'ı açın
   - Ayarlar → Bağlı Cihazlar
   - Cihaz Bağla → QR Kodu okutun

5. Bağlantı başarılı olunca "**Bağlı**" durumunu göreceksiniz

## 📱 Test Etme

### Basit Test

WhatsApp'ta kendinize şu mesajı gönderin:

```
Acil olarak Kadıköy'de 3+1 daire arıyorum. Bütçem 5 milyon TL.
```

Dashboard'da **yüksek öncelikli** bir öneri görmelisiniz!

### Test Script ile Doğrulama

```bash
cd server
node test_whatsapp_ai.js
```

Bu komut 7 farklı senaryo için AI'ın tepkilerini gösterir.

## 🎯 Nasıl Çalışır?

### Lead Puanlama Sistemi

| Kriter | Puan |
|--------|------|
| Alım/Satım/Kiralama niyeti | +30 |
| Acil/Hemen kelimesi | +25 |
| Bütçe/m2/Oda bilgisi | +10 (her detay) |
| Lokasyon belirtme | +10 |
| 100+ karakter mesaj | +10 |
| 3+ konuşma geçmişi | +15 |
| Olumsuz kelime | -50 |

### Öneri Seviyeleri

| Skor | Öncelik | Aksiyon | Önerge |
|------|---------|---------|--------|
| 70-100 | ⚡ Yüksek | Ara | HEMEN arayın ve randevu alın |
| 50-69 | 📞 Orta | Ara | Bugün içinde dönüş yapın |
| 30-49 | 📝 Takip | Hatırlatıcı | Yarın hatırlatıcı koyun |
| 0-29 | ℹ️ Düşük | Not | CRM'e not ekleyin |

## 💡 Kullanım İpuçları

### Danışmanlar İçin

1. **Sabah Rutini**
   - WhatsApp AI sekmesini açın
   - Bekleyen önerileri kontrol edin
   - Yüksek öncelikli (⚡) müşterilerle başlayın

2. **Tamamlandı İşareti**
   - İşlem yaptığınız önerilerde "Tamamlandı ✓" butonuna tıklayın
   - Dashboard temiz kalır

3. **Mesaj Kalitesi**
   - Detaylı mesajlar daha yüksek puan alır
   - Aciliyet belirten kelimeler önceliği artırır

### Adminler İçin

1. **Anahtar Kelimeleri Özelleştirme**
   
   `server/services/aiService.js` dosyasını düzenleyin:
   
   ```javascript
   const intentKeywords = {
       buy: ['almak', 'alıyorum', 'kendi kelimeleriniz...'],
       // ... diğer kategoriler
   };
   ```

2. **Puan Eşiklerini Ayarlama**
   
   ```javascript
   // Yüksek öncelik eşiğini 70'ten 80'e çıkarın
   if (leadScore >= 80) { // 70 yerine 80
       recommendation = `⚡ Yüksek öncelikli...`;
   }
   ```

3. **Otomatik Müşteri Kaydı**
   
   `server/routes/whatsappRoutes.js` içinde:
   
   ```javascript
   // Minimum skor 50'den 60'a çıkarın
   if (!client && evaluation.isLead && evaluation.leadScore > 60) {
       // ...
   }
   ```

## 🔧 Sorun Giderme

### Problem: QR Kod Çıkmıyor

**Çözüm:**
```bash
# WhatsApp oturum dosyalarını temizleyin
cd server
rm -rf .wwebjs_auth
# Serveri yeniden başlatın
npm start
```

### Problem: Mesajlar Algılanmıyor

**Çözüm:**
1. WhatsApp bağlantı durumunu kontrol edin
2. Server loglarına bakın: `console.log` çıktıları
3. Telefon internete bağlı olmalı

### Problem: Yanlış Puanlama

**Çözüm:**
1. `aiService.js` içinde anahtar kelimeleri kontrol edin
2. Test script ile doğrulayın:
   ```bash
   node test_whatsapp_ai.js
   ```

## 📊 Örnek Senaryolar

### Senaryo 1: Acil Alıcı

**Mesaj:**
```
Acil daire bakıyorum Beşiktaş'ta. 3+1, bütçem 6 milyon.
Bu hafta sonuna kadar karar vereceğim.
```

**Beklenen Sonuç:**
- Skor: ~85
- Aksiyon: call
- Öneri: ⚡ HEMEN ara

### Senaryo 2: Genel Soru

**Mesaj:**
```
Konut kredisi faizleri ne durumda?
```

**Beklenen Sonuç:**
- Skor: ~15
- Aksiyon: note
- Öneri: ℹ️ Not olarak kaydet

### Senaryo 3: Devam Eden Müşteri

**İlk mesaj:** "Dün gönderdiğiniz dairelere baktım"
**Takip mesajı:** "2. seçenek hoşuma gitti, görebilir miyim?"

**Beklenen Sonuç:**
- Skor: ~45 (+15 konuşma bonusu)
- Aksiyon: call
- Öneri: 📞 Bugün dönüş yap

## 🎓 Anahtar Kelime Listesi

### Alım Niyeti
- almak, alıyorum, satın almak
- ev arıyorum, daire arıyorum
- arıyorum, arayışım
- bulmak istiyorum

### Satım Niyeti
- satmak, satıyorum, satılık
- elden çıkarmak
- değerlendirme, fiyat öğrenmek

### Aciliyet
- **Yüksek:** acil, hemen, bugün, yarın, bir an önce
- **Orta:** 2 hafta, bu ay, yakında

### Detay Göstergeleri
- bütçe, TL, ₺
- oda, m2, metrekare
- kat, banyo, balkon

### Lokasyon
- lokasyon, bölge, mahalle
- cadde, sokak, yakın, merkez

## 📈 İyileştirme Önerileri

1. **Bölgesel Kelimeler Ekleyin**
   - İstanbul için: Anadolu yakası, Avrupa yakası
   - Semtlere özel: Deniz manzaralı, metro yakını

2. **Emlak Jargonu**
   - Sıfır bina, ikinci el
   - Krediye uygun, takas
   - Kat karşılığı, satılık hisseli

3. **Müşteri Profili**
   - İlk alıcı, yatırımcı
   - Acil satan, emekli

## ❓ SSS

**S: API anahtarı gerekli mi?**
C: Hayır! Tamamen kural tabanlı, ücretsiz çözüm.

**S: Kaç WhatsApp hesabı bağlanabilir?**
C: Şu an 1 tane. Çoklu hesap için kod güncellemesi gerekir.

**S: Mesajlar saklanıyor mu?**
C: Evet, database'de `whatsapp_messages` tablosunda.

**S: İngilizce mesajları da analiz eder mi?**
C: Hayır, sadece Türkçe için optimize edilmiştir.

**S: Skorlama nasıl özelleştirilir?**
C: `server/services/aiService.js` içindeki `leadScore +=` satırlarını düzenleyin.

## 🔐 Güvenlik

- WhatsApp oturum dosyaları `.wwebjs_auth/` içinde
- `.gitignore` ile Git'ten hariç tutulmuş
- Sadece yetkili kullanıcılar erişebilir (JWT auth)

## 📞 Destek

Sorularınız için:
1. [walkthrough.md](./walkthrough.md) dosyasını inceleyin
2. Test script çalıştırın: `node test_whatsapp_ai.js`
3. Server loglarını kontrol edin

---

## ✨ Özet

Bu sistem **0 TL/ay** maliyetle profesyonel WhatsApp CRM otomasyonu sağlar. OpenAI gibi pahalı API'lere gerek yoktur. Türk emlak piyasası için optimize edilmiş kural tabanlı AI kullanır.

**Başarılar! 🎉**
