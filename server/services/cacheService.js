// Advanced in-memory cache with TTL, Namespacing, and Memory Governance
class CacheService {
    constructor(maxSize = 1000) {
        this.cache = new Map();
        this.timers = new Map();
        this.promises = new Map(); // Track ongoing async fetches (Promise Coalescing)
        this.maxSize = maxSize; // Maximum number of keys to prevent memory bloat
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            evictions: 0
        };
    }

    /**
     * Set a value in cache with TTL and optional namespace
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttlSeconds - Time to live in seconds
     * @param {string} namespace - Optional namespace (e.g., 'listings')
     */
    set(key, value, ttlSeconds = 300, namespace = 'global') {
        const fullKey = `${namespace}:${key}`;

        // Governance: If cache is full, evict oldest entry (basic FIFO)
        if (this.cache.size >= this.maxSize && !this.cache.has(fullKey)) {
            const firstKey = this.cache.keys().next().value;
            this.delete(firstKey);
            this.stats.evictions++;
        }

        this.cache.set(fullKey, value);
        this.stats.sets++;

        if (this.timers.has(fullKey)) {
            clearTimeout(this.timers.get(fullKey));
        }

        const timer = setTimeout(() => {
            this.delete(fullKey);
        }, ttlSeconds * 1000);

        this.timers.set(fullKey, timer);
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @param {string} namespace - Namespace
     * @returns {any|undefined}
     */
    get(key, namespace = 'global') {
        const fullKey = `${namespace}:${key}`;
        const value = this.cache.get(fullKey);

        if (value !== undefined) {
            this.stats.hits++;
        } else {
            this.stats.misses++;
        }
        return value;
    }

    /**
     * Delete a specific cache entry
     */
    delete(fullKey) {
        if (this.timers.has(fullKey)) {
            clearTimeout(this.timers.get(fullKey));
            this.timers.delete(fullKey);
        }
        this.cache.delete(fullKey);
    }

    /**
     * Clear an entire namespace
     * @param {string} namespace 
     */
    clearNamespace(namespace) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith(`${namespace}:`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.delete(key));
    }

    /**
     * Singleton Wrapper: Get or set pattern (with Promise Coalescing)
     */
    async getOrSet(key, fetcher, ttlSeconds = 300, namespace = 'global') {
        const fullKey = `${namespace}:${key}`;

        // 1. Check direct cache
        const cached = this.get(key, namespace);
        if (cached !== undefined) return cached;

        // 2. BOLT OPTIMIZATION: Check for ongoing promise (Thundering Herd Protection)
        if (this.promises.has(fullKey)) {
            return this.promises.get(fullKey);
        }

        // 3. Initiate new fetch and track it
        const fetchPromise = (async () => {
            try {
                const value = await fetcher();
                this.set(key, value, ttlSeconds, namespace);
                return value;
            } finally {
                // Always clean up the promise map
                this.promises.delete(fullKey);
            }
        })();

        this.promises.set(fullKey, fetchPromise);
        return fetchPromise;
    }

    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0;

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.stats.hits,
            misses: this.stats.misses,
            evictions: this.stats.evictions,
            hitRate: `${hitRate}%`,
            namespaces: this.getNamespaceReport()
        };
    }

    getNamespaceReport() {
        const report = {};
        for (const key of this.cache.keys()) {
            const ns = key.split(':')[0];
            report[ns] = (report[ns] || 0) + 1;
        }
        return report;
    }
}

module.exports = new CacheService();
