# Cookie Transfer Rehberi

Sahibinden.com bot olduğunuzu düşündüğü için sürekli doğrulama çıkarıyor. Bunu aşmanın en kesin yolu, **kendi tarayıcınızdaki (Chrome/Edge)** geçerli oturumu Scraper'a kopyalamaktır.

## Adım 1: Cookie Editor Kurulumu
1. Kendi kullandığınız Chrome tarayıcısında "Cookie-Editor" eklentisini kurun:
   > https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm

## Adım 2: Çerezleri Kopyalama
1. Kendi tarayıcınızdan **sahibinden.com**'a girin.
2. Eğer "Verify" veya doğrulama çıkarsa çözün ve anasayfanın açıldığından emin olun.
3. Sağ üstteki yapboz/eklenti ikonuna tıklayıp **Cookie-Editor**'ü açın.
4. **"Export"** butonuna (aşağı ok simgesi) tıklayın. format olarak **JSON** seçin.
5. "Cookies copied to clipboard" dediğinde kopyalamış olur.

## Adım 3: Scraper'a Yapıştırma
1. Bu dosyayı açın: `d:\GRAVITY\TRIO\emlak22\server\browser_data\cookies.json`
2. İçindekileri tamamen silin.
3. Kopyaladığınız kodu yapıştırın ve kaydedin (`Ctrl+S`).

## Adım 4: Tekrar Deneme
Scraper'ı tekrar çalıştırın:
```bash
node scripts/trigger_scraper_manual.js
```
Artık doğrulama sormadan direkt girmesi gerekir.
