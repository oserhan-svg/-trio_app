const prisma = require('../db');
const crypto = require('crypto');
const auditService = require('./auditService');

class DigitalSignService {

    /**
     * Initiate a signature request for a document
     */
    async requestSignature(documentId, clientPhone, type = 'SHOWING_FORM') {
        console.log(`📲 Requesting Digital Signature for Document #${documentId} via SMS to ${clientPhone}`);

        // 1. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Clear-text for simulation, in real apps hash it
        const signatureToken = crypto.randomBytes(32).toString('hex');

        // 3. Save to DB (Assuming a DigitalSignature model exists or storing in metadata)
        // For simulation, we'll use AuditLog to track the "Sent" status
        await auditService.log({
            action: 'SIGN_REQUEST',
            entityType: 'Document',
            entityId: parseInt(documentId),
            details: { otp, clientPhone, type, status: 'PENDING' }
        });

        // 4. Mock SMS Send
        console.log(`[REAL-TIME SMS SIMULATOR] To ${clientPhone}: Trio Emlak Yer Gösterme Formu onay kodunuz: ${otp}. Lütfen danışmana bildirin.`);

        return {
            success: true,
            message: 'Onay kodu SMS ile gönderildi.',
            token: signatureToken // Used to identify the session
        };
    }

    /**
     * Verify the OTP and finalize the signature
     */
    async verifyAndSign(documentId, otpInput, clientId, officerId) {
        // Query recent SIGN_REQUEST for this document
        const lastRequest = await prisma.auditLog.findFirst({
            where: {
                entity_type: 'Document',
                entity_id: parseInt(documentId),
                action: 'SIGN_REQUEST'
            },
            orderBy: { created_at: 'desc' }
        });

        if (!lastRequest || lastRequest.details.otp !== otpInput) {
            throw new Error('Geçersiz onay kodu.');
        }

        // 1. Finalize Signature (Create a permanent Proof-of-Signature)
        const signatureDetails = {
            signedAt: new Date(),
            ip: '192.168.1.1', // Mock
            method: 'SMS-OTP',
            clientPhone: lastRequest.details.clientPhone,
            verified: true
        };

        // 2. Update Audit Log with Success
        await auditService.log({
            userId: officerId,
            action: 'DIGITAL_SIGN_COMPLETE',
            entityType: 'Document',
            entityId: parseInt(documentId),
            details: signatureDetails
        });

        return {
            success: true,
            signatureId: `SIG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            signedAt: signatureDetails.signedAt
        };
    }

    /**
     * Get signature status for a document
     */
    async getStatus(documentId) {
        const logs = await prisma.auditLog.findMany({
            where: {
                entity_type: 'Document',
                entity_id: parseInt(documentId),
                action: { in: ['SIGN_REQUEST', 'DIGITAL_SIGN_COMPLETE'] }
            },
            orderBy: { created_at: 'desc' }
        });

        if (logs.some(l => l.action === 'DIGITAL_SIGN_COMPLETE')) return 'SIGNED';
        if (logs.length > 0) return 'PENDING';
        return 'UNSIGNED';
    }
}

module.exports = new DigitalSignService();
