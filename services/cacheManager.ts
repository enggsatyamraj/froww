// services/cacheManager.ts - Enhanced Caching System

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
    version: string;
}

interface CacheConfig {
    defaultTTL: number; // Default time to live in minutes
    maxSize: number; // Maximum cache size in MB
    version: string; // Cache version for invalidation
}

class EnhancedCacheManager {
    private memoryCache = new Map<string, CacheItem<any>>();
    private config: CacheConfig = {
        defaultTTL: 30, // 30 minutes default
        maxSize: 50, // 50MB max
        version: '1.0.0'
    };

    private readonly CACHE_PREFIX = 'froww_cache_';
    private readonly METADATA_KEY = 'froww_cache_metadata';

    // Cache TTL configurations for different data types
    private readonly TTL_CONFIG = {
        // Real-time data - short TTL
        quote: 2, // 2 minutes
        top_gainers_losers: 5, // 5 minutes
        intraday_chart: 5, // 5 minutes

        // Semi-static data - medium TTL
        company_overview: 60, // 1 hour
        daily_chart: 30, // 30 minutes

        // Static data - long TTL
        company_profile: 24 * 60, // 24 hours
        historical_data: 12 * 60, // 12 hours
    };

    /**
     * Get data from cache (memory first, then storage)
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            // Check memory cache first
            const memoryItem = this.memoryCache.get(key);
            if (memoryItem && this.isValidCacheItem(memoryItem)) {
                console.log(`✅ Cache HIT (Memory): ${key}`);
                return memoryItem.data;
            }

            // Check persistent storage
            const storageKey = this.CACHE_PREFIX + key;
            const cachedData = await AsyncStorage.getItem(storageKey);

            if (cachedData) {
                const cacheItem: CacheItem<T> = JSON.parse(cachedData);

                if (this.isValidCacheItem(cacheItem)) {
                    // Store in memory for faster access
                    this.memoryCache.set(key, cacheItem);
                    console.log(`✅ Cache HIT (Storage): ${key}`);
                    return cacheItem.data;
                } else {
                    // Remove expired cache
                    await this.remove(key);
                    console.log(`🗑️ Cache EXPIRED: ${key}`);
                }
            }

            console.log(`❌ Cache MISS: ${key}`);
            return null;
        } catch (error) {
            console.error(`Cache get error for ${key}:`, error);
            return null;
        }
    }

    /**
     * Set data in cache with automatic TTL based on data type
     */
    async set<T>(key: string, data: T, customTTL?: number): Promise<void> {
        try {
            const ttlMinutes = customTTL || this.getTTLForKey(key);
            const now = Date.now();
            const expiresAt = now + (ttlMinutes * 60 * 1000);

            const cacheItem: CacheItem<T> = {
                data,
                timestamp: now,
                expiresAt,
                version: this.config.version
            };

            // Store in memory
            this.memoryCache.set(key, cacheItem);

            // Store in persistent storage
            const storageKey = this.CACHE_PREFIX + key;
            await AsyncStorage.setItem(storageKey, JSON.stringify(cacheItem));

            // Update metadata
            await this.updateCacheMetadata(key, ttlMinutes);

            console.log(`💾 Cached "${key}" for ${ttlMinutes} minutes`);
        } catch (error) {
            console.error(`Cache set error for ${key}:`, error);
        }
    }

    /**
     * Remove specific cache entry
     */
    async remove(key: string): Promise<void> {
        try {
            // Remove from memory
            this.memoryCache.delete(key);

            // Remove from storage
            const storageKey = this.CACHE_PREFIX + key;
            await AsyncStorage.removeItem(storageKey);

            console.log(`🗑️ Removed cache: ${key}`);
        } catch (error) {
            console.error(`Cache remove error for ${key}:`, error);
        }
    }

    /**
     * Clear all cache data
     */
    async clear(): Promise<void> {
        try {
            // Clear memory cache
            this.memoryCache.clear();

            // Get all cache keys and remove them
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_PREFIX));

            if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
            }

            // Clear metadata
            await AsyncStorage.removeItem(this.METADATA_KEY);

            console.log('🧹 Cache cleared completely');
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }

    /**
     * Clean expired cache entries
     */
    async cleanExpired(): Promise<void> {
        try {
            const now = Date.now();
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_PREFIX));

            const expiredKeys: string[] = [];

            for (const storageKey of cacheKeys) {
                try {
                    const cachedData = await AsyncStorage.getItem(storageKey);
                    if (cachedData) {
                        const cacheItem: CacheItem<any> = JSON.parse(cachedData);
                        if (!this.isValidCacheItem(cacheItem)) {
                            expiredKeys.push(storageKey);
                            // Also remove from memory
                            const key = storageKey.replace(this.CACHE_PREFIX, '');
                            this.memoryCache.delete(key);
                        }
                    }
                } catch (error) {
                    // If we can't parse the cache item, consider it invalid
                    expiredKeys.push(storageKey);
                }
            }

            if (expiredKeys.length > 0) {
                await AsyncStorage.multiRemove(expiredKeys);
                console.log(`🧹 Cleaned ${expiredKeys.length} expired cache entries`);
            }
        } catch (error) {
            console.error('Cache cleanup error:', error);
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{
        memoryEntries: number;
        storageEntries: number;
        totalSize: string;
        oldestEntry: string | null;
        newestEntry: string | null;
    }> {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_PREFIX));

            let totalSize = 0;
            let oldestTimestamp = Date.now();
            let newestTimestamp = 0;
            let oldestKey = null;
            let newestKey = null;

            for (const storageKey of cacheKeys) {
                try {
                    const cachedData = await AsyncStorage.getItem(storageKey);
                    if (cachedData) {
                        totalSize += cachedData.length;
                        const cacheItem: CacheItem<any> = JSON.parse(cachedData);

                        if (cacheItem.timestamp < oldestTimestamp) {
                            oldestTimestamp = cacheItem.timestamp;
                            oldestKey = storageKey.replace(this.CACHE_PREFIX, '');
                        }

                        if (cacheItem.timestamp > newestTimestamp) {
                            newestTimestamp = cacheItem.timestamp;
                            newestKey = storageKey.replace(this.CACHE_PREFIX, '');
                        }
                    }
                } catch (error) {
                    // Skip invalid cache entries
                }
            }

            return {
                memoryEntries: this.memoryCache.size,
                storageEntries: cacheKeys.length,
                totalSize: this.formatBytes(totalSize),
                oldestEntry: oldestKey,
                newestEntry: newestKey,
            };
        } catch (error) {
            console.error('Cache stats error:', error);
            return {
                memoryEntries: 0,
                storageEntries: 0,
                totalSize: '0 B',
                oldestEntry: null,
                newestEntry: null,
            };
        }
    }

    /**
     * Invalidate cache by pattern
     */
    async invalidatePattern(pattern: string): Promise<void> {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const matchingKeys = allKeys.filter(key =>
                key.startsWith(this.CACHE_PREFIX) &&
                key.includes(pattern)
            );

            if (matchingKeys.length > 0) {
                await AsyncStorage.multiRemove(matchingKeys);

                // Also remove from memory
                for (const key of this.memoryCache.keys()) {
                    if (key.includes(pattern)) {
                        this.memoryCache.delete(key);
                    }
                }

                console.log(`🗑️ Invalidated ${matchingKeys.length} cache entries matching "${pattern}"`);
            }
        } catch (error) {
            console.error(`Cache invalidation error for pattern ${pattern}:`, error);
        }
    }

    // Private helper methods

    private isValidCacheItem<T>(item: CacheItem<T>): boolean {
        const now = Date.now();
        return (
            item.expiresAt > now &&
            item.version === this.config.version &&
            item.data !== null &&
            item.data !== undefined
        );
    }

    private getTTLForKey(key: string): number {
        // Determine TTL based on key pattern
        if (key.includes('quote')) return this.TTL_CONFIG.quote;
        if (key.includes('top_gainers_losers')) return this.TTL_CONFIG.top_gainers_losers;
        if (key.includes('intraday')) return this.TTL_CONFIG.intraday_chart;
        if (key.includes('overview')) return this.TTL_CONFIG.company_overview;
        if (key.includes('daily')) return this.TTL_CONFIG.daily_chart;
        if (key.includes('profile')) return this.TTL_CONFIG.company_profile;
        if (key.includes('historical')) return this.TTL_CONFIG.historical_data;

        return this.config.defaultTTL;
    }

    private async updateCacheMetadata(key: string, ttl: number): Promise<void> {
        try {
            const metadata = await this.getCacheMetadata();
            metadata[key] = {
                lastUpdated: Date.now(),
                ttl: ttl,
                size: JSON.stringify({ key }).length
            };
            await AsyncStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
        } catch (error) {
            // Metadata update is not critical, so we just log the error
            console.warn('Cache metadata update failed:', error);
        }
    }

    private async getCacheMetadata(): Promise<any> {
        try {
            const metadata = await AsyncStorage.getItem(this.METADATA_KEY);
            return metadata ? JSON.parse(metadata) : {};
        } catch (error) {
            return {};
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Export singleton instance
export const cacheManager = new EnhancedCacheManager();

// Cache key generators for consistency
export const CacheKeys = {
    topGainersLosers: () => 'top_gainers_losers',
    companyOverview: (symbol: string) => `overview_${symbol}`,
    globalQuote: (symbol: string) => `quote_${symbol}`,
    timeSeriesIntraday: (symbol: string, interval: string) => `timeseries_intraday_${symbol}_${interval}`,
    timeSeriesDaily: (symbol: string) => `timeseries_daily_${symbol}`,
    chartData: (symbol: string, period: string) => `chart_${symbol}_${period}`,
};