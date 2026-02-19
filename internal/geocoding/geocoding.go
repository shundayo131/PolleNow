package geocoding

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
)

var (
	ErrInvalidZIP = errors.New("invalid ZIP code format")
	ErrNoResults  = errors.New("no geocoding results found for ZIP code")
)

var zipRegex = regexp.MustCompile(`^\d{5}$`)

// Geocoder converts a ZIP code into a Location.
type Geocoder interface {
	Geocode(ctx context.Context, zipCode string) (*Location, error)
}

// HTTPClient is a minimal interface satisfied by *http.Client.
type HTTPClient interface {
	Do(req *http.Request) (*http.Response, error)
}

// GoogleGeocoder implements Geocoder using the Google Maps Geocoding API.
type GoogleGeocoder struct {
	apiKey     string
	httpClient HTTPClient
}

// NewGoogleGeocoder creates a new GoogleGeocoder.
func NewGoogleGeocoder(apiKey string, client ...HTTPClient) *GoogleGeocoder {
	var c HTTPClient = http.DefaultClient
	if len(client) > 0 && client[0] != nil {
		c = client[0]
	}
	return &GoogleGeocoder{apiKey: apiKey, httpClient: c}
}

// Geocode converts a US ZIP code to a Location with coordinates and display name.
func (g *GoogleGeocoder) Geocode(ctx context.Context, zipCode string) (*Location, error) {
	if !zipRegex.MatchString(zipCode) {
		return nil, fmt.Errorf("%w: %q", ErrInvalidZIP, zipCode)
	}

	u := fmt.Sprintf(
		"https://maps.googleapis.com/maps/api/geocode/json?address=%s&key=%s",
		url.QueryEscape(zipCode),
		url.QueryEscape(g.apiKey),
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("creating geocoding request: %w", err)
	}

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("geocoding request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("geocoding API returned status %d", resp.StatusCode)
	}

	var data googleGeocodingResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("parsing geocoding response: %w", err)
	}

	if data.Status != "OK" {
		if data.ErrorMessage != "" {
			return nil, fmt.Errorf("geocoding error: %s (%s)", data.ErrorMessage, data.Status)
		}
		return nil, fmt.Errorf("%w: status %s", ErrNoResults, data.Status)
	}

	if len(data.Results) == 0 {
		return nil, ErrNoResults
	}

	result := data.Results[0]
	return &Location{
		Lat:         result.Geometry.Location.Lat,
		Lng:         result.Geometry.Location.Lng,
		DisplayName: result.FormattedAddress,
	}, nil
}
