import NodeCache from 'node-cache';
import { Logger } from '../utils/Logger';
import crypto from 'crypto';

/**
 * Server-side cache service for AI responses using node-cache
 * Stores responses in memory with TTL expiration
 */
export class CacheService {
    private cache: NodeCache;
    private readonly TTL = 60 * 60 * 24; // 24 hours in seconds

    constructor() {
        this.cache = new NodeCache({
            stdTTL: this.TTL,
            checkperiod: 3600, // Check for expired keys every hour
            useClones: false // Better performance, but be careful with object mutations
        });
        
        // Log cache events
        this.cache.on('set', (key, value) => {
            Logger.debug(`Cache SET: ${key}`);
        });
        
        this.cache.on('del', (key, value) => {
            Logger.debug(`Cache DEL: ${key}`);
        });
        
        this.cache.on('expired', (key, value) => {
            Logger.debug(`Cache EXPIRED: ${key}`);
        });
        
        Logger.info('CacheService initialized with node-cache (24h TTL)');
    }

    /**
     * Generate cache key from request parameters using crypto hash
     */
    private generateKey(query: string, systemContext: string, webSearch: boolean): string {
        const combined = `${query}_${systemContext}_${webSearch}`;
        return crypto.createHash('md5').update(combined).digest('hex');
    }

    /**
     * Get cached response
     */
    get(query: string, systemContext: string, webSearch: boolean): string | null {
        const key = this.generateKey(query, systemContext, webSearch);
        const cachedValue = this.cache.get<string>(key);
        
        if (cachedValue === undefined) {
            Logger.debug(`Cache MISS for key: ${key}`);
            return null;
        }

        Logger.debug(`Cache HIT for key: ${key}`);
        return cachedValue;
    }

    /**
     * Store response in cache
     */
    set(query: string, systemContext: string, webSearch: boolean, response: string): void {
        const key = this.generateKey(query, systemContext, webSearch);
        this.cache.set(key, response);
        Logger.debug(`Cache SET for key: ${key} (size: ${response.length} chars)`);
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        const keys = this.cache.keys();
        this.cache.flushAll();
        Logger.info(`Cache cleared: removed ${keys.length} entries`);
    }

    /**
     * Get cache statistics
     */
    getStats(): { 
        size: number; 
        keys: string[];
        hits: number;
        misses: number;
    } {
        const stats = this.cache.getStats();
        return {
            size: this.cache.keys().length,
            keys: this.cache.keys(),
            hits: stats.hits,
            misses: stats.misses
        };
    }

    /**
     * Check if a specific query is cached
     */
    has(query: string, systemContext: string, webSearch: boolean): boolean {
        const key = this.generateKey(query, systemContext, webSearch);
        return this.cache.has(key);
    }

    /**
     * Delete a specific cache entry
     */
    delete(query: string, systemContext: string, webSearch: boolean): boolean {
        const key = this.generateKey(query, systemContext, webSearch);
        return this.cache.del(key) > 0;
    }

    /**
     * Set TTL for a specific entry
     */
    setTTL(query: string, systemContext: string, webSearch: boolean, ttl: number): boolean {
        const key = this.generateKey(query, systemContext, webSearch);
        return this.cache.ttl(key, ttl);
    }

    /**
     * Get TTL for a specific entry
     */
    getTTL(query: string, systemContext: string, webSearch: boolean): number | undefined {
        const key = this.generateKey(query, systemContext, webSearch);
        return this.cache.getTtl(key);
    }
}

// Export singleton instance
export const cacheService = new CacheService();
