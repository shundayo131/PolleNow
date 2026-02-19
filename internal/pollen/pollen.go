package pollen

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
)

var (
	ErrNoAPIKey    = errors.New("no API key configured")
	ErrInvalidDays = errors.New("days must be between 1 and 5")
	ErrAPIRequest  = errors.New("pollen API request failed")
)

const baseURL = "https://pollen.googleapis.com/v1/forecast:lookup"

// PollenClient fetches raw pollen forecast data.
type PollenClient interface {
	GetForecast(ctx context.Context, lat, lng float64, days int) (*RawForecastResponse, error)
}

// HTTPClient is a minimal interface satisfied by *http.Client.
type HTTPClient interface {
	Do(req *http.Request) (*http.Response, error)
}

// GooglePollenClient implements PollenClient using the Google Pollen API.
type GooglePollenClient struct {
	apiKey     string
	httpClient HTTPClient
}

// NewGooglePollenClient creates a new Google Pollen API client.
func NewGooglePollenClient(apiKey string, client ...HTTPClient) *GooglePollenClient {
	var c HTTPClient = http.DefaultClient
	if len(client) > 0 && client[0] != nil {
		c = client[0]
	}
	return &GooglePollenClient{apiKey: apiKey, httpClient: c}
}

// GetForecast fetches pollen forecast data from the Google Pollen API.
func (c *GooglePollenClient) GetForecast(ctx context.Context, lat, lng float64, days int) (*RawForecastResponse, error) {
	if days < 1 || days > 5 {
		return nil, ErrInvalidDays
	}

	u := fmt.Sprintf(
		"%s?key=%s&location.latitude=%f&location.longitude=%f&days=%d&plantsDescription=true&languageCode=en",
		baseURL, c.apiKey, lat, lng, days,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("creating pollen request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("pollen request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResp struct {
			Error struct {
				Message string `json:"message"`
			} `json:"error"`
		}
		if json.NewDecoder(resp.Body).Decode(&errResp) == nil && errResp.Error.Message != "" {
			return nil, fmt.Errorf("%w: %s", ErrAPIRequest, errResp.Error.Message)
		}
		return nil, fmt.Errorf("%w: status %d", ErrAPIRequest, resp.StatusCode)
	}

	var data RawForecastResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("parsing pollen response: %w", err)
	}

	return &data, nil
}
