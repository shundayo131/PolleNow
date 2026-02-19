package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSaveAndLoad(t *testing.T) {
	// Use temp dir to avoid touching real config
	tmpDir := t.TempDir()
	origPath := Path
	Path = func() string { return filepath.Join(tmpDir, "config.yaml") }
	defer func() { Path = origPath }()

	cfg := &Config{
		APIKey:     "test-api-key",
		DefaultZIP: "94025",
		Days:       3,
	}

	if err := Save(cfg); err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	loaded, err := Load()
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}

	if loaded.APIKey != cfg.APIKey {
		t.Errorf("APIKey: got %q, want %q", loaded.APIKey, cfg.APIKey)
	}
	if loaded.DefaultZIP != cfg.DefaultZIP {
		t.Errorf("DefaultZIP: got %q, want %q", loaded.DefaultZIP, cfg.DefaultZIP)
	}
	if loaded.Days != cfg.Days {
		t.Errorf("Days: got %d, want %d", loaded.Days, cfg.Days)
	}
}

func TestLoadMissingFile(t *testing.T) {
	tmpDir := t.TempDir()
	origPath := Path
	Path = func() string { return filepath.Join(tmpDir, "nonexistent", "config.yaml") }
	defer func() { Path = origPath }()

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load should not fail for missing file: %v", err)
	}
	if cfg.Days != DefaultDays {
		t.Errorf("Days: got %d, want default %d", cfg.Days, DefaultDays)
	}
}

func TestValidate(t *testing.T) {
	cfg := &Config{}
	if err := cfg.Validate(); err != ErrNoAPIKey {
		t.Errorf("expected ErrNoAPIKey, got %v", err)
	}

	cfg.APIKey = "something"
	if err := cfg.Validate(); err != nil {
		t.Errorf("expected nil, got %v", err)
	}
}

func TestEnvOverride(t *testing.T) {
	tmpDir := t.TempDir()
	origPath := Path
	Path = func() string { return filepath.Join(tmpDir, "config.yaml") }
	defer func() { Path = origPath }()

	cfg := &Config{APIKey: "file-key", Days: DefaultDays}
	if err := Save(cfg); err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	os.Setenv("POLLENOW_API_KEY", "env-key")
	defer os.Unsetenv("POLLENOW_API_KEY")

	loaded, err := Load()
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if loaded.APIKey != "env-key" {
		t.Errorf("APIKey: got %q, want %q", loaded.APIKey, "env-key")
	}
}

func TestInvalidDaysReset(t *testing.T) {
	tmpDir := t.TempDir()
	origPath := Path
	Path = func() string { return filepath.Join(tmpDir, "config.yaml") }
	defer func() { Path = origPath }()

	cfg := &Config{APIKey: "key", Days: 99}
	if err := Save(cfg); err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	loaded, err := Load()
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if loaded.Days != DefaultDays {
		t.Errorf("Days: got %d, want default %d", loaded.Days, DefaultDays)
	}
}
