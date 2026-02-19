package geocoding

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
)

type mockHTTPClient struct {
	response *http.Response
	err      error
}

func (m *mockHTTPClient) Do(req *http.Request) (*http.Response, error) {
	return m.response, m.err
}

func TestGeocodeSuccess(t *testing.T) {
	body := `{
		"results": [{
			"geometry": {"location": {"lat": 37.4419, "lng": -122.1430}},
			"formatted_address": "Menlo Park, CA 94025, USA"
		}],
		"status": "OK"
	}`

	client := &mockHTTPClient{
		response: &http.Response{
			StatusCode: 200,
			Body:       io.NopCloser(strings.NewReader(body)),
		},
	}

	g := NewGoogleGeocoder("test-key", client)
	loc, err := g.Geocode(context.Background(), "94025")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if loc.Lat != 37.4419 {
		t.Errorf("Lat: got %f, want 37.4419", loc.Lat)
	}
	if loc.Lng != -122.1430 {
		t.Errorf("Lng: got %f, want -122.1430", loc.Lng)
	}
	if loc.DisplayName != "Menlo Park, CA 94025, USA" {
		t.Errorf("DisplayName: got %q", loc.DisplayName)
	}
}

func TestGeocodeInvalidZIP(t *testing.T) {
	g := NewGoogleGeocoder("test-key")

	tests := []string{"abc", "1234", "123456", ""}
	for _, zip := range tests {
		_, err := g.Geocode(context.Background(), zip)
		if !errors.Is(err, ErrInvalidZIP) {
			t.Errorf("zip=%q: expected ErrInvalidZIP, got %v", zip, err)
		}
	}
}

func TestGeocodeZeroResults(t *testing.T) {
	body := `{"results": [], "status": "ZERO_RESULTS"}`
	client := &mockHTTPClient{
		response: &http.Response{
			StatusCode: 200,
			Body:       io.NopCloser(strings.NewReader(body)),
		},
	}

	g := NewGoogleGeocoder("test-key", client)
	_, err := g.Geocode(context.Background(), "00000")
	if !errors.Is(err, ErrNoResults) {
		t.Errorf("expected ErrNoResults, got %v", err)
	}
}

func TestGeocodeHTTPError(t *testing.T) {
	client := &mockHTTPClient{
		response: &http.Response{
			StatusCode: 500,
			Body:       io.NopCloser(strings.NewReader("")),
		},
	}

	g := NewGoogleGeocoder("test-key", client)
	_, err := g.Geocode(context.Background(), "94025")
	if err == nil {
		t.Error("expected error for HTTP 500")
	}
}

func TestGeocodeNetworkError(t *testing.T) {
	client := &mockHTTPClient{
		err: errors.New("connection refused"),
	}

	g := NewGoogleGeocoder("test-key", client)
	_, err := g.Geocode(context.Background(), "94025")
	if err == nil {
		t.Error("expected error for network failure")
	}
}
