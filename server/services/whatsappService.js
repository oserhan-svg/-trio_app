const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const socketService = require('./socketService');
const prisma = require('../db');

// In-memory cache for consultant phone-to-name mapping
let consultantCache = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// NEW: Phase 3 - Client and Property caching for bulk operations
const resolutionCache = new Map(); // Simple short-lived cache for recent lookups
const CLIENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '../uploads/whatsapp');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

class WhatsAppService {
    constructor() {
        this.client = null;
        this.qrCodeData = null;
        this.status = 'disconnected'; // 'disconnected', 'connecting', 'qr_ready', 'ready'
        this.onMessageCallback = null;
    }

    // Helper to kill stuck Chrome instances - DISABLED to avoid killing user's browser
    async killChromeProcesses() {
        // Disabled: This was killing the user's dashboard browser
        console.log('Skipping aggressive process kill to protect user browser.');
        return Promise.resolve();
    }

    async initialize() {
        if (this.status === 'ready' || this.status === 'connecting' || this.status === 'qr_ready') {
            return;
        }

        console.log('Initializing WhatsApp Client...');
        this.status = 'connecting';

        // No longer killing global chrome processes

        try {
            console.log('WhatsApp Auth Path:', path.join(__dirname, '../.wwebjs_auth'));

            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: path.join(__dirname, '../.wwebjs_auth')
                }),
                // Lock WhatsApp Web version to a known compatible one
                webVersionCache: {
                    type: 'remote',
                    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
                },
                puppeteer: {
                    headless: false, // VISIBLE MODE FOR DEBUGGING
                    // executablePath removed to allow Puppeteer to find its own bundled Chrome
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-extensions',
                        '--disable-gpu' // Adding back disable-gpu just in case
                    ],
                    handleSIGINT: false,
                    handleSIGTERM: false,
                    handleSIGHUP: false,
                    timeout: 60000
                }
            });

            console.log('Client instance created. Attaching listeners...');

            // Add an explicit timeout to detect if Puppeteer launch hangs
            const initializationTimeout = setTimeout(() => {
                if (this.status === 'connecting') {
                    console.error('TIMED OUT waiting for Puppeteer to launch or QR code.');
                    this.status = 'disconnected';
                    socketService.emit('whatsapp_status', { status: 'disconnected', error: 'Launch Timeout' });
                    // Try to kill whatever started
                    this.killChromeProcesses();
                }
            }, 45000);

            this.client.on('auth_failure', msg => {
                clearTimeout(initializationTimeout);
                console.error('WhatsApp AUTHENTICATION FAILURE:', msg);
                this.status = 'disconnected';
            });

            this.client.on('authenticated', () => {
                console.log('WhatsApp Authenticated successfully!');
                clearTimeout(initializationTimeout);
                this.status = 'connecting'; // Switch to loading state
                this.qrCodeData = null;
                socketService.emit('whatsapp_status', { status: 'connecting' });

                // Backup: Check if we are ready every 2 seconds in case event doesn't fire
                const checkReadyInterval = setInterval(async () => {
                    if (this.status === 'ready') {
                        clearInterval(checkReadyInterval);
                        return;
                    }
                    try {
                        // CRITICAL FIX: Ensure Puppeteer page and WWebJS injection are actually ready
                        if (this.client && this.client.pupPage) {
                            const isInjected = await this.client.pupPage.evaluate(() => {
                                return typeof window.WWebJS !== 'undefined' && typeof window.Store !== 'undefined';
                            });

                            if (isInjected) {
                                console.log('Detected Ready State via Polling (Injection Valid verified)!');
                                clearInterval(checkReadyInterval);
                                this.status = 'ready';
                                socketService.emit('whatsapp_status', { status: 'ready' });
                            }
                        }
                    } catch (err) {
                        // ignore error
                    }
                }, 2000);
            });

            this.client.on('change_state', state => {
                console.log('WhatsApp State Change:', state);
                socketService.emit('whatsapp_status', { status: state });
            });

            this.client.on('qr', async (qr) => {
                clearTimeout(initializationTimeout);
                console.log('QR Code received from WhatsApp Web');
                this.status = 'qr_ready';
                try {
                    this.qrCodeData = await qrcode.toDataURL(qr);
                    console.log('QR Code converted to DataURL');
                    socketService.emit('whatsapp_status', { status: 'qr_ready', qrCode: this.qrCodeData });
                } catch (qrError) {
                    console.error('Error processing QR code:', qrError);
                }
            });

            this.client.on('loading_screen', (percent, message) => {
                clearTimeout(initializationTimeout);
                console.log('WhatsApp Loading:', percent, message);
            });

            this.client.on('ready', () => {
                clearTimeout(initializationTimeout);
                console.log('WhatsApp Client is ready!');
                this.status = 'ready';
                this.qrCodeData = null;
                socketService.emit('whatsapp_status', { status: 'ready' });
            });

            this.client.on('message_create', async (message) => {
                // Process media if present
                const mediaData = await this.processMessageMedia(message);

                // Add media to original object to preserve methods
                message.media = mediaData;

                // Emit real-time event
                socketService.emit('whatsapp_message', message);

                if (this.onMessageCallback) {
                    await this.onMessageCallback(message);
                }
            });

            this.client.on('disconnected', (reason) => {
                console.log('WhatsApp Client was disconnected', reason);
                this.status = 'disconnected';
                this.qrCodeData = null;
                socketService.emit('whatsapp_status', { status: 'disconnected' });
            });

            this.client.initialize().catch(err => {
                console.error('WhatsApp initialization error:', err);
                this.status = 'disconnected';
            });
        } catch (error) {
            console.error('Error creating WhatsApp client:', error);
            this.status = 'disconnected';
            throw error;
        }
    }

    async reset() {
        console.log('Resetting WhatsApp Client...');
        try {
            if (this.client) {
                await this.client.destroy();
            }
        } catch (e) {
            console.error('Error destroying client:', e);
        }

        await this.clearSessionData();

        this.client = null;
        this.qrCodeData = null;
        this.status = 'disconnected';
        return this.initialize();
    }

    async clearSessionData() {
        const authPath = path.join(__dirname, '../.wwebjs_auth');
        console.log(`Clearing session data at: ${authPath}`);
        try {
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
                console.log('Session data cleared successfully.');
            }
        } catch (error) {
            console.error('Error clearing session data:', error);
        }
    }

    getStatus() {
        return {
            status: this.status,
            qrCode: this.qrCodeData
        };
    }

    setOnMessageCallback(callback) {
        this.onMessageCallback = callback;
    }

    async sendMessage(to, content) {
        if (this.status !== 'ready') throw new Error('WhatsApp client not ready');
        const chatId = to.includes('@') ? to : `${to}@c.us`;
        return await this.client.sendMessage(chatId, content);
    }

    async getChats() {
        if (this.status !== 'ready') return [];
        return await this.client.getChats();
    }

    async getChat(chatId) {
        if (this.status !== 'ready') return null;
        try {
            return await this.client.getChatById(chatId.includes('@') ? chatId : `${chatId}@c.us`);
        } catch (e) {
            console.error('Error fetching chat:', e);
            return null;
        }
    }

    async getChatMessages(chatId, limit = 50) {
        if (this.status !== 'ready') return [];
        try {
            const chat = await this.client.getChatById(chatId.includes('@') ? chatId : `${chatId}@c.us`);
            return await chat.fetchMessages({ limit });
        } catch (e) {
            console.error('Error fetching chat messages:', e);
            return [];
        }
    }

    async getContact(contactId) {
        if (this.status !== 'ready') return null;
        const jid = contactId.includes('@') ? contactId : `${contactId}@c.us`;
        try {
            return await this.client.getContactById(jid);
        } catch (e) {
            console.error('Error fetching contact:', e);
            return null;
        }
    }

    async processMessageMedia(message) {
        if (!message.hasMedia) return null;

        try {
            const media = await message.downloadMedia();
            if (!media) return null;

            const extension = mime.extension(media.mimetype) || 'bin';
            const filename = `${message.id._serialized}.${extension}`;
            const filepath = path.join(UPLOAD_DIR, filename);

            // Write file
            fs.writeFileSync(filepath, media.data, { encoding: 'base64' });

            return {
                url: `/uploads/whatsapp/${filename}`,
                mimetype: media.mimetype,
                type: extension === 'mp4' ? 'video' : (extension === 'mp3' || extension === 'ogg' ? 'audio' : 'image')
            };
        } catch (error) {
            console.error('Error processing media:', error);
            return null;
        }
    }

    async getProfilePicUrl(contactId) {
        if (this.status !== 'ready') return null;
        const jid = contactId.includes('@') ? contactId : `${contactId}@c.us`;
        try {
            const contact = await this.client.getContactById(jid);
            if (!contact) return null;
            return await contact.getProfilePicUrl();
        } catch (e) {
            console.error(`[WA] Error fetching profile pic for ${contactId}:`, e.message);
            return null;
        }
    }

    async getContactWithWarming(contactId) {
        if (this.status !== 'ready') return null;
        let contact = await this.getContact(contactId);
        if (!contact) return null;

        // If name is missing, try to "warm up" by fetching profile pic or about
        // This sometimes triggers the client to fetch better metadata
        if (!contact.pushname && !contact.name) {
            try {
                // Parallel warming actions
                await Promise.all([
                    contact.getAbout().catch(() => { }),
                    contact.getProfilePicUrl().catch(() => { })
                ]);

                // Refetch after a short delay to allow background sync
                await new Promise(resolve => setTimeout(resolve, 500));
                contact = await this.getContact(contactId);
            } catch (e) {
                console.warn(`[WA] Warming failed for ${contactId}:`, e.message);
            }
        }
        return contact;
    }

    async getContactName(contactId) {
        const contact = await this.getContactWithWarming(contactId);
        const resolution = await this.resolveName(contactId, contact);
        return resolution.name;
    }

    /**
     * Optimized helper to resolve sender name with CRM/Consultant priority
     * Matches WA phone with User table and Client table
     */
    async resolveName(phoneNumber, waContact, waChat) {
        if (!phoneNumber) return { name: 'Bilinmeyen', isConsultant: false, source: 'default' };

        const cleanId = String(phoneNumber).split('@')[0];
        const cleanPhone = cleanId.replace(/\D/g, '').slice(-10);

        // 1. Check User Table (Consultants) with caching
        const now = Date.now();
        if (!consultantCache || (now - lastCacheUpdate) > CACHE_TTL) {
            try {
                const consultants = await prisma.user.findMany({
                    select: { name: true, phone: true }
                });

                consultantCache = new Map();
                consultants.forEach(c => {
                    if (c.phone) {
                        const cleanC = c.phone.replace(/\D/g, '').slice(-10);
                        if (cleanC.length === 10) {
                            consultantCache.set(cleanC, c.name);
                        }
                    }
                });
                lastCacheUpdate = now;
            } catch (err) {
                console.error('[CACHE] Error updating consultant cache:', err);
            }
        }

        if (consultantName) return { name: consultantName, isConsultant: true, source: 'consultant' };

        // 1b. Check Short-lived resolution cache
        const cached = resolutionCache.get(cleanPhone);
        if (cached && (now - cached.timestamp) < CLIENT_CACHE_TTL) {
            return cached.data;
        }

        // 2. Check CRM (Client Table) - High Priority System Knowledge
        try {
            const existingClient = await prisma.client.findFirst({
                where: {
                    OR: [
                        { phone: { contains: cleanPhone } },
                        { phone: cleanId }
                    ]
                },
                select: { name: true }
            });

            if (existingClient && existingClient.name && !/^\d+$/.test(existingClient.name.replace(/\D/g, ''))) {
                const result = { name: existingClient.name, isConsultant: false, source: 'crm' };
                resolutionCache.set(cleanPhone, { data: result, timestamp: now });
                return result;
            }
        } catch (err) {
            console.error('[RESOLVE] CRM lookup error:', err);
        }

        // 3. Check Property Sellers (Property Table)
        try {
            const propertySeller = await prisma.property.findFirst({
                where: {
                    OR: [
                        { seller_phone: { contains: cleanPhone } },
                        { seller_phone: cleanId }
                    ]
                },
                select: { seller_name: true }
            });

            if (propertySeller && propertySeller.seller_name && !/^\d+$/.test(propertySeller.seller_name.replace(/\D/g, ''))) {
                const result = { name: propertySeller.seller_name, isConsultant: false, source: 'property' };
                resolutionCache.set(cleanPhone, { data: result, timestamp: now });
                return result;
            }
        } catch (err) {
            console.error('[RESOLVE] Property lookup error:', err);
        }

        // 4. Resolve Name from WA Metadata
        let name = null;
        const isGroup = String(phoneNumber).includes('@g.us') || (waChat && waChat.isGroup);

        if (isGroup) {
            name = waChat?.name || waChat?.groupMetadata?.subject || waContact?.name;
            if (!name || name === 'WhatsApp Grup' || name === cleanId) {
                name = cleanId;
            }
        } else {
            const candidates = [
                waContact?.name,
                waContact?.verifiedName,
                waContact?.shortName,
                waContact?.pushname,
                waChat?.name
            ];

            name = candidates.find(c => {
                if (!c) return false;
                const cleanC = String(c).replace(/\D/g, '');
                return c !== cleanId && c !== phoneNumber && cleanC !== cleanPhone && !/^\d+$/.test(cleanC);
            });
        }

        return { name: String(name || cleanId), isConsultant: false, source: 'whatsapp' };
    }

    async getHealthStatus() {
        const stats = {
            status: this.status,
            platform: process.platform,
            uptime: Math.floor(process.uptime()),
            memoryUsage: process.memoryUsage(),
            clientReady: !!this.client,
            hasSession: fs.existsSync(path.join(__dirname, '../.wwebjs_auth')),
        };

        if (this.client && this.status === 'ready') {
            try {
                const info = await this.client.getState();
                stats.connectionState = info;
            } catch (e) {
                stats.connectionState = 'error';
            }
        }

        return stats;
    }
}

module.exports = new WhatsAppService();
