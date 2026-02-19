package config

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

const (
	DefaultDays = 5
	appDir      = "pollenow"
	configFile  = "config.yaml"
)

var (
	ErrNoAPIKey = errors.New("no API key configured")
)

// Path is a function that returns the config file path.
// It is a variable so tests can override it.
var Path = func() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".config", appDir, configFile)
}

// Config represents the application configuration stored on disk.
type Config struct {
	APIKey     string `yaml:"api_key"`
	DefaultZIP string `yaml:"default_zip,omitempty"`
	Days       int    `yaml:"days,omitempty"`
}

// Load reads config from ~/.config/pollenow/config.yaml.
// Returns a zero-value Config (not an error) if the file does not exist.
func Load() (*Config, error) {
	p := Path()
	data, err := os.ReadFile(p)
	if err != nil {
		if os.IsNotExist(err) {
			return &Config{Days: DefaultDays}, nil
		}
		return nil, fmt.Errorf("reading config: %w", err)
	}

	cfg := &Config{Days: DefaultDays}
	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("parsing config: %w", err)
	}

	// Environment variable override
	if envKey := os.Getenv("POLLENOW_API_KEY"); envKey != "" {
		cfg.APIKey = envKey
	}

	if cfg.Days < 1 || cfg.Days > 5 {
		cfg.Days = DefaultDays
	}

	return cfg, nil
}

// Save writes config to ~/.config/pollenow/config.yaml.
func Save(cfg *Config) error {
	p := Path()
	dir := filepath.Dir(p)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("creating config dir: %w", err)
	}

	data, err := yaml.Marshal(cfg)
	if err != nil {
		return fmt.Errorf("marshaling config: %w", err)
	}

	if err := os.WriteFile(p, data, 0o600); err != nil {
		return fmt.Errorf("writing config: %w", err)
	}

	return nil
}

// Validate checks that the config has required fields.
func (c *Config) Validate() error {
	if c.APIKey == "" {
		return ErrNoAPIKey
	}
	return nil
}

// Exists returns true if the config file exists on disk.
func Exists() bool {
	_, err := os.Stat(Path())
	return err == nil
}
