import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEY = 'opportunities_cache';

// Memory cache
let memoryCache = {
    data: null,
    timestamp: null,
    loading: false
};

/**
 * Shared hook for fetching and caching opportunity properties
 * Eliminates duplicate API calls across OpportunityList and OpportunityCarousel
 */
const useOpportunities = (options = {}) => {
    const {
        minScore = 8,
        sellerType = null,
        limit = 10,
        forceRefresh = false
    } = options;

    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isCacheValid = useCallback(() => {
        if (!memoryCache.data || !memoryCache.timestamp) return false;
        const age = Date.now() - memoryCache.timestamp;
        return age < CACHE_DURATION;
    }, []);

    const fetchOpportunities = useCallback(async () => {
        // Check cache first (unless force refresh)
        if (!forceRefresh && isCacheValid()) {
            console.log('🎯 Using cached opportunities data');
            setOpportunities(memoryCache.data);
            setLoading(false);
            return;
        }

        // Prevent duplicate simultaneous requests
        if (memoryCache.loading) {
            console.log('⏳ Request already in progress, waiting...');
            // Wait for the ongoing request to complete
            const checkInterval = setInterval(() => {
                if (!memoryCache.loading && memoryCache.data) {
                    clearInterval(checkInterval);
                    setOpportunities(memoryCache.data);
                    setLoading(false);
                }
            }, 100);
            return;
        }

        setLoading(true);
        memoryCache.loading = true;
        setError(null);

        try {
            console.log('🚀 Fetching fresh opportunities data...');
            const response = await api.get('/properties');
            const allProps = response.data.data || response.data || [];

            // Store in cache
            memoryCache.data = allProps;
            memoryCache.timestamp = Date.now();
            memoryCache.loading = false;

            setOpportunities(allProps);
        } catch (err) {
            console.error('❌ Failed to fetch opportunities:', err);
            setError(err);
            memoryCache.loading = false;
        } finally {
            setLoading(false);
        }
    }, [forceRefresh, isCacheValid]);

    useEffect(() => {
        fetchOpportunities();
    }, [fetchOpportunities]);

    // Filter opportunities based on criteria (memoized on component level)
    const filterOpportunities = useCallback((props) => {
        let filtered = props.filter(p => p.opportunity_score >= minScore);

        if (sellerType) {
            filtered = filtered.filter(p => p.seller_type === sellerType);
        }

        return filtered
            .sort((a, b) => b.opportunity_score - a.opportunity_score || b.deviation - a.deviation)
            .slice(0, limit);
    }, [minScore, sellerType, limit]);

    return {
        opportunities,
        loading,
        error,
        refresh: () => fetchOpportunities(),
        filterOpportunities,
        isCacheValid: isCacheValid()
    };
};

// Export cache invalidation function for use after scraper runs
export const invalidateOpportunitiesCache = () => {
    console.log('🔄 Invalidating opportunities cache...');
    memoryCache.data = null;
    memoryCache.timestamp = null;
    memoryCache.loading = false;
};

export default useOpportunities;
