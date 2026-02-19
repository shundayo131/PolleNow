package forecast

import (
	"context"
	"errors"
	"testing"

	"github.com/shunito/pollenow/internal/geocoding"
	"github.com/shunito/pollenow/internal/pollen"
)

type mockGeocoder struct {
	location *geocoding.Location
	err      error
}

func (m *mockGeocoder) Geocode(ctx context.Context, zip string) (*geocoding.Location, error) {
	return m.location, m.err
}

type mockPollenClient struct {
	response *pollen.RawForecastResponse
	err      error
}

func (m *mockPollenClient) GetForecast(ctx context.Context, lat, lng float64, days int) (*pollen.RawForecastResponse, error) {
	return m.response, m.err
}

func TestGetForecastHappyPath(t *testing.T) {
	geo := &mockGeocoder{
		location: &geocoding.Location{
			Lat:         37.44,
			Lng:         -122.14,
			DisplayName: "Menlo Park, CA 94025",
		},
	}

	level := 2
	_ = level
	pc := &mockPollenClient{
		response: &pollen.RawForecastResponse{
			RegionCode: "US",
			DailyInfo: []pollen.DailyInfo{
				{
					Date: pollen.DateInfo{Year: 2025, Month: 6, Day: 15},
					PollenTypeInfo: []pollen.PollenTypeInfo{
						{Code: "GRASS", InSeason: true, IndexInfo: &pollen.IndexInfo{Value: 2, Category: "Low"}},
						{Code: "TREE", InSeason: true, IndexInfo: &pollen.IndexInfo{Value: 4, Category: "High"}},
						{Code: "WEED", InSeason: false, IndexInfo: &pollen.IndexInfo{Value: 0, Category: "None"}},
					},
				},
			},
		},
	}

	svc := NewService(geo, pc, nil)
	result, err := svc.GetForecast(context.Background(), "94025", 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.Location.DisplayName != "Menlo Park, CA 94025" {
		t.Errorf("DisplayName: got %q", result.Location.DisplayName)
	}
	if len(result.Forecast.Days) != 1 {
		t.Fatalf("Days: got %d, want 1", len(result.Forecast.Days))
	}
	if result.Cached {
		t.Error("should not be cached on first call")
	}
}

func TestGetForecastGeocodingError(t *testing.T) {
	geo := &mockGeocoder{err: errors.New("geocoding failed")}
	pc := &mockPollenClient{}

	svc := NewService(geo, pc, nil)
	_, err := svc.GetForecast(context.Background(), "99999", 1)
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestGetForecastPollenError(t *testing.T) {
	geo := &mockGeocoder{
		location: &geocoding.Location{Lat: 37.44, Lng: -122.14, DisplayName: "Test"},
	}
	pc := &mockPollenClient{err: errors.New("pollen API failed")}

	svc := NewService(geo, pc, nil)
	_, err := svc.GetForecast(context.Background(), "94025", 1)
	if err == nil {
		t.Fatal("expected error")
	}
}
