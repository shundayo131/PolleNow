package cache

import (
	"testing"
)

func TestSetAndGet(t *testing.T) {
	dir := t.TempDir()
	c := New(dir)

	data := map[string]string{"hello": "world"}
	if err := c.Set("testkey", data); err != nil {
		t.Fatalf("Set failed: %v", err)
	}

	raw, age, ok := c.Get("testkey")
	if !ok {
		t.Fatal("Get returned not ok")
	}
	if raw == nil {
		t.Fatal("Get returned nil data")
	}
	if age < 0 {
		t.Errorf("age should be non-negative, got %v", age)
	}
}

func TestGetMissing(t *testing.T) {
	dir := t.TempDir()
	c := New(dir)

	_, _, ok := c.Get("nonexistent")
	if ok {
		t.Error("Get should return false for missing key")
	}
}

func TestCacheKey(t *testing.T) {
	k1 := Key("94025", 5)
	k2 := Key("94025", 5)
	k3 := Key("10001", 5)

	if k1 != k2 {
		t.Error("same inputs should produce same key")
	}
	if k1 == k3 {
		t.Error("different inputs should produce different keys")
	}
}
