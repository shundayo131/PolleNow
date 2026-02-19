package pollen

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

func TestGetForecastSuccess(t *testing.T) {
	body := `{
		"regionCode": "US",
		"dailyInfo": [{
			"date": {"year": 2025, "month": 6, "day": 15},
			"pollenTypeInfo": [{
				"code": "GRASS",
				"displayName": "Grass",
				"inSeason": true,
				"indexInfo": {
					"code": "UPI",
					"displayName": "Universal Pollen Index",
					"value": 2,
					"category": "Low",
					"indexDescription": "Low",
					"color": {"green": 0.54}
				}
			}]
		}]
	}`

	client := &mockHTTPClient{
		response: &http.Response{
			StatusCode: 200,
			Body:       io.NopCloser(strings.NewReader(body)),
		},
	}

	c := NewGooglePollenClient("test-key", client)
	raw, err := c.GetForecast(context.Background(), 37.44, -122.14, 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if raw.RegionCode != "US" {
		t.Errorf("RegionCode: got %q, want %q", raw.RegionCode, "US")
	}
	if len(raw.DailyInfo) != 1 {
		t.Fatalf("DailyInfo: got %d, want 1", len(raw.DailyInfo))
	}
}

func TestGetForecastInvalidDays(t *testing.T) {
	c := NewGooglePollenClient("test-key")

	for _, days := range []int{0, -1, 6, 100} {
		_, err := c.GetForecast(context.Background(), 37.44, -122.14, days)
		if !errors.Is(err, ErrInvalidDays) {
			t.Errorf("days=%d: expected ErrInvalidDays, got %v", days, err)
		}
	}
}

func TestGetForecastAPIError(t *testing.T) {
	body := `{"error": {"message": "API key invalid"}}`
	client := &mockHTTPClient{
		response: &http.Response{
			StatusCode: 403,
			Body:       io.NopCloser(strings.NewReader(body)),
		},
	}

	c := NewGooglePollenClient("bad-key", client)
	_, err := c.GetForecast(context.Background(), 37.44, -122.14, 1)
	if !errors.Is(err, ErrAPIRequest) {
		t.Errorf("expected ErrAPIRequest, got %v", err)
	}
	if !strings.Contains(err.Error(), "API key invalid") {
		t.Errorf("error should contain API message, got: %v", err)
	}
}

func TestGetForecastNetworkError(t *testing.T) {
	client := &mockHTTPClient{
		err: errors.New("connection refused"),
	}

	c := NewGooglePollenClient("test-key", client)
	_, err := c.GetForecast(context.Background(), 37.44, -122.14, 1)
	if err == nil {
		t.Error("expected error for network failure")
	}
}
