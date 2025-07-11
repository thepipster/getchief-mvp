import axios from "axios";
import hash from "object-hash";

type AxiosRequestConfig = any;
type AxiosResponse<T = any> = {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: any;
};
interface AxiosError<T = any> {
    response?: {
        data: any;
        status: number;
        statusText: string;
    };
    message?: string;
}

let base_url = process.env.REACT_APP_API_URL || import.meta.env.VITE_API_URL;
if (!base_url) {
    base_url = "http://localhost:4374";
}

export type SendOptions = {
    verb: string,
    path: string,
    data?: Object,
    useCache?: boolean // Optional flag to enable/disable caching for specific requests
}

type CacheEntry = {
    data: any;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
};

export default class BaseModel {

    name: string = "base-service";
    private static cachePrefix: string = "basemodel_cache_";
    private static cacheTTL: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    constructor(serviceName: string) {
        this.name = serviceName;
    }

    /**
     * Generate a cache key based on HTTP method, path, and payload
     */
    private static generateCacheKey(verb: string, path: string, data?: Object): string {
        
        const payload = data ? hash(data, {unorderedArrays: true, unorderedObjects: true }) : '';
        const combined = `${verb.toUpperCase()}_${path}_${payload}`;
        return combined;
        /*
        // Use a simple hash function for cache key generation
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
        */
    }

    /**
     * Check if cache entry is still valid
     */
    private static isCacheValid(entry: CacheEntry): boolean {
        return (Date.now() - entry.timestamp) < entry.ttl;
    }

    /**
     * Get cached response if available and valid
     */
    private static getCachedResponse(cacheKey: string): any | null {
        try {
            const storageKey = this.cachePrefix + cacheKey;
            const cachedData = localStorage.getItem(storageKey);
            
            if (!cachedData) {
                return null;
            }
            
            const entry: CacheEntry = JSON.parse(cachedData);
            
            if (this.isCacheValid(entry)) {
                console.log(`BaseModel cache hit:`, cacheKey);
                return entry.data;
            } else {
                // Remove expired entry
                localStorage.removeItem(storageKey);
                console.log(`BaseModel cache expired:`, cacheKey);
                return null;
            }
        } catch (error) {
            console.error(`Error reading BaseModel cache:`, error);
            return null;
        }
    }

    /**
     * Cache a response
     */
    private static setCachedResponse(cacheKey: string, data: any): void {
        console.log(`BaseModel caching response:`, cacheKey);
        try {
            const storageKey = this.cachePrefix + cacheKey;
            const entry: CacheEntry = {
                data,
                timestamp: Date.now(),
                ttl: this.cacheTTL
            };
            
            localStorage.setItem(storageKey, JSON.stringify(entry));
            console.log(`BaseModel cached response:`, cacheKey);
        } catch (error) {
            console.error(`Error caching BaseModel response:`, error);
        }
    }

    /**
     * Clear all BaseModel cache entries
     */
    static clearCache(): void {
        try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.cachePrefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`Cleared ${keysToRemove.length} BaseModel cache entries`);
        } catch (error) {
            console.error(`Error clearing BaseModel cache:`, error);
        }
    }

    static toQuery(obj: object): string {
        const searchParams = new URLSearchParams();
        Object.keys(obj).forEach((key) => {
            if (Array.isArray(obj[key])) {
                return searchParams.append(key, encodeURIComponent(JSON.stringify(obj[key])));
            }
            else {
                return searchParams.append(key, obj[key]);
            }
        });
        return searchParams.toString();
    }

    static async __send(opts: SendOptions) {

        if (!opts.verb) {
            opts.verb = 'get';
        }

        // Check cache first if caching is enabled (default true)
        const useCache = opts.useCache !== false; // Default to true unless explicitly set to false
        let cacheKey: string | null = null;
        
        if (useCache) {
            console.log(`BaseModel checking cache for`, opts.verb, opts.path, opts.data);
            cacheKey = this.generateCacheKey(opts.verb, opts.path, opts.data);
            const cachedResponse = this.getCachedResponse(cacheKey);
            if (cachedResponse) {
                console.log(`BaseModel cache HIT for ${cacheKey}`);
                return cachedResponse;
            }
            else {
                console.log(`BaseModel cache MISS for ${cacheKey}`);
            }
        }

        const axiosOpts: AxiosRequestConfig = {
            method: opts.verb,
            data: {},
            url: `${base_url}/${opts.path}`,
            headers: {  
                'x-api-key': `${process.env.REACT_APP_API_KEY}`
            }
        };

        if (opts.data && opts.verb == 'get') {
            axiosOpts.url += '?' + BaseModel.toQuery(opts.data);
        }
        else if (opts.data) {
            axiosOpts.data = opts.data;
        }

        try {
            console.log(`Sending [${opts.verb.toUpperCase()}] ${axiosOpts.url} `);
            const response = await axios.request(axiosOpts);

            if (response && response.data && response.data.result === 'fail') {
                throw new Error(response.data.message);
            }
            else {
                // Cache the successful response if caching is enabled
                if (useCache && cacheKey) {
                    this.setCachedResponse(cacheKey, response.data);
                }
                return response.data;
            }

        }
        catch (err: unknown) {
            // Check if error is an axios error by checking for response property
            const axiosErr = err as AxiosError;

            if (axiosErr.response) {
                if (axiosErr.response.status === 401) {
                    throw new Error("Session expired or user not authorized");
                }
                else if (axiosErr.response.status === 404) {
                    throw new Error(`Bad request from ${opts.verb.toUpperCase()} /${opts.path}`);
                }
                else if (axiosErr.response) {
                    const errorMessage = axiosErr.response.data.message || axiosErr.response.data;
                    throw new Error(errorMessage);
                }
            }

            // Check if error has message property
            if (typeof err === 'object' && err !== null && 'message' in err) {
                throw new Error(String(err.message));
            }

            // Fallback error message
            throw new Error(`Error while calling [${opts.verb}] ${opts.path}`);
        }
        

    }


}

