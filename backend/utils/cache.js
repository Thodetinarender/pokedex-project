
class Cache {
  constructor(options = {}) {
    this.store = new Map();
    this.timestamps = new Map(); 
    this.accessTimes = new Map();
    this.maxEntries = options.maxEntries || 1000;
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour in ms
    this.cleanupInterval = options.cleanupInterval || 600000; // 10 minutes
    
    this.startCleanup();
  }

  set(key, value, ttl = null) {
    const now = Date.now();
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictLRU();
    }

    this.store.set(key, value);
    this.timestamps.set(key, {
      created: now,
      ttl: ttl || this.defaultTTL
    });
    this.accessTimes.set(key, now);
  }
  get(key) {
    if (!this.store.has(key)) {
      return null;
    }
    const timestamp = this.timestamps.get(key);
    const now = Date.now();
    
    if (now - timestamp.created > timestamp.ttl) {
      this.delete(key);
      return null;
    }
    this.accessTimes.set(key, now);
    return this.store.get(key);
  }

  has(key) {
    if (!this.store.has(key)) {
      return false;
    }

    const timestamp = this.timestamps.get(key);
    const now = Date.now();
    
    if (now - timestamp.created > timestamp.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key) {
    this.store.delete(key);
    this.timestamps.delete(key);
    this.accessTimes.delete(key);
  }
  clear() {
    this.store.clear();
    this.timestamps.clear();
    this.accessTimes.clear();
  }
  evictLRU() {
    let lruKey = null;
    let lruTime = Infinity;

    for (const [key, accessTime] of this.accessTimes.entries()) {
      if (accessTime < lruTime) {
        lruTime = accessTime;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
    }
  }

  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp.created > timestamp.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      const removed = this.cleanup();
      if (removed > 0) {
        console.log(`[Cache] Cleaned up ${removed} expired entries`);
      }
    }, this.cleanupInterval);
  }

  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  getStats() {
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      defaultTTL: this.defaultTTL,
      keys: Array.from(this.store.keys())
    };
  }
}

module.exports = Cache;
