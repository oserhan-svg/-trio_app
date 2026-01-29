/**
 * Simple Offline Storage Manager for Field Consultants
 */
class OfflineStorage {
    constructor() {
        this.DB_NAME = 'trio_offline_v1';
        this.QUEUES = {
            draftListings: 'draft_listings',
            clientDemands: 'draft_demands',
            fieldNotes: 'field_notes'
        };
    }

    /**
     * Save a draft locally
     */
    saveDraft(type, data) {
        const queueKey = this.QUEUES[type];
        if (!queueKey) return;

        const existing = JSON.parse(localStorage.getItem(queueKey) || '[]');
        const newItem = {
            id: Date.now(),
            data,
            timestamp: new Date().toISOString(),
            synced: false
        };

        existing.push(newItem);
        localStorage.setItem(queueKey, JSON.stringify(existing));
        console.log(`💾 Saved ${type} draft locally.`);
        return newItem.id;
    }

    /**
     * Get all unsynced items
     */
    getPendingSyncings() {
        return {
            listings: JSON.parse(localStorage.getItem(this.QUEUES.draftListings) || '[]').filter(i => !i.synced),
            demands: JSON.parse(localStorage.getItem(this.QUEUES.clientDemands) || '[]').filter(i => !i.synced),
            notes: JSON.parse(localStorage.getItem(this.QUEUES.fieldNotes) || '[]').filter(i => !i.synced)
        };
    }

    /**
     * Mark an item as synced and potentially remove from local storage
     */
    markAsSynced(type, id) {
        const queueKey = this.QUEUES[type];
        const items = JSON.parse(localStorage.getItem(queueKey) || '[]');
        const updated = items.filter(i => i.id !== id);
        localStorage.setItem(queueKey, JSON.stringify(updated));
    }
}

export default new OfflineStorage();
