package cache

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

const defaultTTL = 1 * time.Hour

// Entry wraps cached data with a timestamp.
type Entry struct {
	Data      json.RawMessage `json:"data"`
	CachedAt  time.Time       `json:"cachedAt"`
}

// Cache provides file-based caching with a TTL.
type Cache struct {
	dir string
	ttl time.Duration
}

// New creates a Cache. If dir is empty, uses ~/.cache/pollenow/.
func New(dir string) *Cache {
	if dir == "" {
		home, _ := os.UserHomeDir()
		dir = filepath.Join(home, ".cache", "pollenow")
	}
	return &Cache{dir: dir, ttl: defaultTTL}
}

// Get retrieves a cached entry. Returns nil if not found or expired.
// Also returns how long ago the entry was cached.
func (c *Cache) Get(key string) (json.RawMessage, time.Duration, bool) {
	p := c.path(key)
	data, err := os.ReadFile(p)
	if err != nil {
		return nil, 0, false
	}

	var entry Entry
	if err := json.Unmarshal(data, &entry); err != nil {
		return nil, 0, false
	}

	age := time.Since(entry.CachedAt)
	if age > c.ttl {
		os.Remove(p)
		return nil, 0, false
	}

	return entry.Data, age, true
}

// Set stores data in the cache.
func (c *Cache) Set(key string, data any) error {
	if err := os.MkdirAll(c.dir, 0o755); err != nil {
		return err
	}

	raw, err := json.Marshal(data)
	if err != nil {
		return err
	}

	entry := Entry{
		Data:     raw,
		CachedAt: time.Now(),
	}

	out, err := json.Marshal(entry)
	if err != nil {
		return err
	}

	return os.WriteFile(c.path(key), out, 0o600)
}

// Key generates a cache key from zip code and days.
func Key(zip string, days int) string {
	today := time.Now().Format("2006-01-02")
	h := sha256.Sum256([]byte(fmt.Sprintf("%s_%d_%s", zip, days, today)))
	return fmt.Sprintf("%x", h[:8])
}

func (c *Cache) path(key string) string {
	return filepath.Join(c.dir, key+".json")
}
