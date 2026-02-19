package pollen

import (
	"fmt"
	"time"
)

// FormatForecast transforms the raw API response into a display-ready Forecast.
func FormatForecast(raw *RawForecastResponse) *Forecast {
	if raw == nil {
		return &Forecast{RegionCode: "Unknown"}
	}

	regionCode := raw.RegionCode
	if regionCode == "" {
		regionCode = "Unknown"
	}

	days := make([]DayForecast, 0, len(raw.DailyInfo))
	for i, day := range raw.DailyInfo {
		dateStr := fmt.Sprintf("%d-%02d-%02d", day.Date.Year, day.Date.Month, day.Date.Day)
		dayName := getDayName(i, day.Date)

		days = append(days, DayForecast{
			Date:                  dateStr,
			DayName:               dayName,
			Grass:                 extractPollenLevel(day.PollenTypeInfo, "GRASS"),
			Tree:                  extractPollenLevel(day.PollenTypeInfo, "TREE"),
			Weed:                  extractPollenLevel(day.PollenTypeInfo, "WEED"),
			HealthRecommendations: extractHealthRecommendations(day.PollenTypeInfo),
		})
	}

	return &Forecast{
		RegionCode: regionCode,
		Days:       days,
	}
}

// extractPollenLevel finds the pollen type by code and returns a PollenLevel.
func extractPollenLevel(pollenTypes []PollenTypeInfo, code string) PollenLevel {
	for _, p := range pollenTypes {
		if p.Code == code {
			if p.IndexInfo == nil {
				return PollenLevel{
					Level:    nil,
					Category: "No Data",
					InSeason: p.InSeason,
				}
			}
			level := p.IndexInfo.Value
			return PollenLevel{
				Level:    &level,
				Category: p.IndexInfo.Category,
				InSeason: p.InSeason,
			}
		}
	}
	return PollenLevel{
		Level:    nil,
		Category: "No Data",
		InSeason: false,
	}
}

// extractHealthRecommendations collects, deduplicates, and limits recommendations.
func extractHealthRecommendations(pollenTypes []PollenTypeInfo) []string {
	seen := make(map[string]bool)
	var recommendations []string

	for _, p := range pollenTypes {
		for _, rec := range p.HealthRecommendations {
			if !seen[rec] {
				seen[rec] = true
				recommendations = append(recommendations, rec)
				if len(recommendations) >= 3 {
					return recommendations
				}
			}
		}
	}

	return recommendations
}

// getDayName returns "Today", "Tomorrow", or the weekday name.
// Uses index-based naming to avoid timezone issues.
func getDayName(index int, date DateInfo) string {
	switch index {
	case 0:
		return "Today"
	case 1:
		return "Tomorrow"
	default:
		t := time.Date(date.Year, time.Month(date.Month), date.Day, 0, 0, 0, 0, time.UTC)
		return t.Weekday().String()
	}
}
