const fs = require('fs');
const path = require('path');

/**
 * Centralized configuration service for AI-related settings
 * Supports hot-reloading and file watching for configuration updates
 */
class ConfigService {
    constructor() {
        this.configs = {
            ai: null,
            keywords: null,
            company: null
        };
        this.watchers = {};
        this.loadAllConfigs();
        this.setupFileWatchers();
    }

    /**
     * Load all configuration files
     */
    loadAllConfigs() {
        this.configs.ai = this.loadConfig('aiConfig.json');
        this.configs.keywords = this.loadConfig('keywords.json');
        this.configs.company = this.loadConfig('companyConfig.json');
    }

    /**
     * Load a specific configuration file
     * @param {string} filename - Configuration filename
     * @returns {object} Parsed configuration object
     */
    loadConfig(filename) {
        try {
            const configPath = path.join(__dirname, '../config', filename);
            if (fs.existsSync(configPath)) {
                const data = fs.readFileSync(configPath, 'utf8');
                return JSON.parse(data);
            } else {
                console.warn(`Config file not found: ${filename}`);
                return {};
            }
        } catch (error) {
            console.error(`Error loading config ${filename}:`, error.message);
            return {};
        }
    }

    /**
     * Setup file watchers for hot-reloading
     */
    setupFileWatchers() {
        if (process.env.NODE_ENV === 'production') {
            // Disable file watching in production for performance
            return;
        }

        const configFiles = ['aiConfig.json', 'keywords.json', 'companyConfig.json'];

        configFiles.forEach(filename => {
            const configPath = path.join(__dirname, '../config', filename);
            if (fs.existsSync(configPath)) {
                this.watchers[filename] = fs.watch(configPath, (eventType) => {
                    if (eventType === 'change') {
                        console.log(`Config file changed: ${filename}, reloading...`);
                        this.reloadConfig(filename);
                    }
                });
            }
        });
    }

    /**
     * Reload a specific configuration file
     * @param {string} filename - Configuration filename
     */
    reloadConfig(filename) {
        const configKey = filename.replace('.json', '').replace('Config', '');
        this.configs[configKey] = this.loadConfig(filename);
        console.log(`✓ Config reloaded: ${filename}`);
    }

    /**
     * Get AI configuration
     * @returns {object} AI configuration
     */
    getAIConfig() {
        return this.configs.ai || {};
    }

    /**
     * Get keywords configuration
     * @returns {object} Keywords configuration
     */
    getKeywords() {
        return this.configs.keywords || {};
    }

    /**
     * Get company configuration
     * @returns {object} Company configuration
     */
    getCompanyConfig() {
        return this.configs.company || {};
    }

    /**
     * Get a specific config value using dot notation
     * @param {string} path - Config path (e.g., 'ai.caching.systemContextTTL')
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Config value
     */
    get(path, defaultValue = null) {
        const parts = path.split('.');
        let current = this.configs;

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return defaultValue;
            }
        }

        return current !== undefined ? current : defaultValue;
    }

    /**
     * Update a configuration value (in-memory only, does not persist to file)
     * @param {string} path - Config path (e.g., 'ai.caching.systemContextTTL')
     * @param {*} value - New value
     */
    set(path, value) {
        const parts = path.split('.');
        const key = parts.pop();
        let current = this.configs;

        for (const part of parts) {
            if (!(part in current)) {
                current[part] = {};
            }
            current = current[part];
        }

        current[key] = value;
        console.log(`Config updated: ${path} = ${value}`);
    }

    /**
     * Check if a feature is enabled
     * @param {string} featureName - Feature name
     * @returns {boolean} Whether feature is enabled
     */
    isFeatureEnabled(featureName) {
        return this.get(`ai.features.${featureName}`, true);
    }

    /**
     * Cleanup watchers on shutdown
     */
    cleanup() {
        Object.values(this.watchers).forEach(watcher => {
            if (watcher) {
                watcher.close();
            }
        });
        this.watchers = {};
    }
}

// Export singleton instance
module.exports = new ConfigService();
