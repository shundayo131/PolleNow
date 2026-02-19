package forecast

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/shunito/pollenow/internal/cache"
	"github.com/shunito/pollenow/internal/geocoding"
	"github.com/shunito/pollenow/internal/pollen"
)

// Result includes the location info, formatted forecast, and cache status.
type Result struct {
	Location geocoding.Location `json:"location"`
	Forecast *pollen.Forecast   `json:"forecast"`
	Cached   bool               `json:"cached"`
	CacheAge time.Duration      `json:"-"`
}

// Service orchestrates geocoding and pollen lookup.
type Service struct {
	geocoder     geocoding.Geocoder
	pollenClient pollen.PollenClient
	cache        *cache.Cache
}

// NewService creates a new forecast service.
func NewService(g geocoding.Geocoder, p pollen.PollenClient, c *cache.Cache) *Service {
	return &Service{geocoder: g, pollenClient: p, cache: c}
}

// GetForecast takes a ZIP code and days, performs geocoding, fetches pollen data,
// formats it, and returns the result.
func (s *Service) GetForecast(ctx context.Context, zipCode string, days int) (*Result, error) {
	// Check cache first
	cacheKey := cache.Key(zipCode, days)
	if s.cache != nil {
		if data, age, ok := s.cache.Get(cacheKey); ok {
			var result Result
			if err := json.Unmarshal(data, &result); err == nil {
				result.Cached = true
				result.CacheAge = age
				return &result, nil
			}
		}
	}

	// Geocode the ZIP code
	loc, err := s.geocoder.Geocode(ctx, zipCode)
	if err != nil {
		return nil, fmt.Errorf("geocoding ZIP %s: %w", zipCode, err)
	}

	// Fetch pollen forecast
	raw, err := s.pollenClient.GetForecast(ctx, loc.Lat, loc.Lng, days)
	if err != nil {
		return nil, fmt.Errorf("fetching pollen forecast: %w", err)
	}

	// Format the data
	forecast := pollen.FormatForecast(raw)

	result := &Result{
		Location: *loc,
		Forecast: forecast,
		Cached:   false,
	}

	// Store in cache
	if s.cache != nil {
		_ = s.cache.Set(cacheKey, result)
	}

	return result, nil
}
