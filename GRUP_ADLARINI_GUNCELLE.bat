@echo off
echo ========================================
echo GRUP ADLARINI GUNCELLE
echo ========================================
echo.
echo WhatsApp bagli oldugunda bu dosyayi calistirin.
echo Otomatik olarak gercek grup isimlerini cekecek.
echo.
pause

cd server
node -e "const whatsappService = require('./services/whatsappService'); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function update() { try { if (whatsappService.status !== 'ready') { console.log('HATA: WhatsApp bagli degil. Once QR kod tarayin.'); return; } const chats = await whatsappService.client.getChats(); const groups = chats.filter(c => c.isGroup); console.log(groups.length + ' grup bulundu'); for (const chat of groups) { const jid = chat.id._serialized; const name = chat.name || chat.groupMetadata?.subject || jid.split('@')[0]; await prisma.client.upsert({ where: { phone: jid }, update: { name, type: 'group' }, create: { name, phone: jid, type: 'group', status: 'New' } }); console.log('Guncellendi: ' + name); } console.log('TAMAMLANDI!'); } catch(e) { console.error('Hata:', e.message); } finally { await prisma.$disconnect(); process.exit(0); }} update();"

echo.
echo ========================================
echo Islem tamamlandi!
echo ========================================
pause
