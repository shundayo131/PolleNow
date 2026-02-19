package pollen

import (
	"encoding/json"
	"os"
	"testing"
)

func loadTestData(t *testing.T, filename string) *RawForecastResponse {
	t.Helper()
	data, err := os.ReadFile("testdata/" + filename)
	if err != nil {
		t.Fatalf("failed to read testdata/%s: %v", filename, err)
	}
	var raw RawForecastResponse
	if err := json.Unmarshal(data, &raw); err != nil {
		t.Fatalf("failed to parse testdata/%s: %v", filename, err)
	}
	return &raw
}

func TestFormatForecast5Day(t *testing.T) {
	raw := loadTestData(t, "forecast_5day.json")
	forecast := FormatForecast(raw)

	if forecast.RegionCode != "US" {
		t.Errorf("RegionCode: got %q, want %q", forecast.RegionCode, "US")
	}

	if len(forecast.Days) != 5 {
		t.Fatalf("Days: got %d, want 5", len(forecast.Days))
	}

	// Day 0 should be "Today"
	if forecast.Days[0].DayName != "Today" {
		t.Errorf("Days[0].DayName: got %q, want %q", forecast.Days[0].DayName, "Today")
	}

	// Day 1 should be "Tomorrow"
	if forecast.Days[1].DayName != "Tomorrow" {
		t.Errorf("Days[1].DayName: got %q, want %q", forecast.Days[1].DayName, "Tomorrow")
	}

	// Day 2+ should be a weekday name
	for i := 2; i < 5; i++ {
		name := forecast.Days[i].DayName
		validDays := map[string]bool{
			"Sunday": true, "Monday": true, "Tuesday": true,
			"Wednesday": true, "Thursday": true, "Friday": true, "Saturday": true,
		}
		if !validDays[name] {
			t.Errorf("Days[%d].DayName: got %q, want a weekday", i, name)
		}
	}

	// Check Day 0 pollen levels
	day0 := forecast.Days[0]

	if day0.Grass.Level == nil || *day0.Grass.Level != 2 {
		t.Errorf("Day0 Grass level: got %v, want 2", day0.Grass.Level)
	}
	if day0.Grass.Category != "Low" {
		t.Errorf("Day0 Grass category: got %q, want %q", day0.Grass.Category, "Low")
	}
	if !day0.Grass.InSeason {
		t.Error("Day0 Grass should be in season")
	}

	if day0.Tree.Level == nil || *day0.Tree.Level != 4 {
		t.Errorf("Day0 Tree level: got %v, want 4", day0.Tree.Level)
	}
	if day0.Tree.Category != "High" {
		t.Errorf("Day0 Tree category: got %q, want %q", day0.Tree.Category, "High")
	}

	if day0.Weed.Level == nil || *day0.Weed.Level != 0 {
		t.Errorf("Day0 Weed level: got %v, want 0", day0.Weed.Level)
	}
	if day0.Weed.Category != "None" {
		t.Errorf("Day0 Weed category: got %q, want %q", day0.Weed.Category, "None")
	}

	// Check date format
	if day0.Date != "2025-06-15" {
		t.Errorf("Day0 Date: got %q, want %q", day0.Date, "2025-06-15")
	}
}

func TestFormatForecastNoData(t *testing.T) {
	raw := loadTestData(t, "forecast_no_data.json")
	forecast := FormatForecast(raw)

	if len(forecast.Days) != 1 {
		t.Fatalf("Days: got %d, want 1", len(forecast.Days))
	}

	day0 := forecast.Days[0]

	// All pollen types should have no data (no indexInfo)
	for _, entry := range []struct {
		name  string
		level PollenLevel
	}{
		{"Grass", day0.Grass},
		{"Tree", day0.Tree},
		{"Weed", day0.Weed},
	} {
		if entry.level.Level != nil {
			t.Errorf("%s level: got %v, want nil", entry.name, *entry.level.Level)
		}
		if entry.level.Category != "No Data" {
			t.Errorf("%s category: got %q, want %q", entry.name, entry.level.Category, "No Data")
		}
	}
}

func TestFormatForecastNil(t *testing.T) {
	forecast := FormatForecast(nil)
	if forecast.RegionCode != "Unknown" {
		t.Errorf("RegionCode: got %q, want %q", forecast.RegionCode, "Unknown")
	}
	if len(forecast.Days) != 0 {
		t.Errorf("Days: got %d, want 0", len(forecast.Days))
	}
}

func TestExtractHealthRecommendations(t *testing.T) {
	pollenTypes := []PollenTypeInfo{
		{
			Code:                  "GRASS",
			HealthRecommendations: []string{"Rec A", "Rec B"},
		},
		{
			Code:                  "TREE",
			HealthRecommendations: []string{"Rec B", "Rec C", "Rec D", "Rec E"},
		},
	}

	recs := extractHealthRecommendations(pollenTypes)

	// Should deduplicate "Rec B" and limit to 3
	if len(recs) != 3 {
		t.Fatalf("got %d recommendations, want 3", len(recs))
	}
	if recs[0] != "Rec A" || recs[1] != "Rec B" || recs[2] != "Rec C" {
		t.Errorf("got %v, want [Rec A, Rec B, Rec C]", recs)
	}
}

func TestExtractPollenLevelMissing(t *testing.T) {
	level := extractPollenLevel([]PollenTypeInfo{}, "GRASS")
	if level.Level != nil {
		t.Error("expected nil level for missing type")
	}
	if level.Category != "No Data" {
		t.Errorf("category: got %q, want %q", level.Category, "No Data")
	}
}

func TestGetDayName(t *testing.T) {
	tests := []struct {
		index    int
		date     DateInfo
		expected string
	}{
		{0, DateInfo{2025, 6, 15}, "Today"},
		{1, DateInfo{2025, 6, 16}, "Tomorrow"},
		{2, DateInfo{2025, 6, 17}, "Tuesday"}, // June 17, 2025 is a Tuesday
	}

	for _, tt := range tests {
		got := getDayName(tt.index, tt.date)
		if got != tt.expected {
			t.Errorf("getDayName(%d, %v): got %q, want %q", tt.index, tt.date, got, tt.expected)
		}
	}
}
