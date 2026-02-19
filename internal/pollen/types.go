package pollen

// --- Raw API response types (mirror Google Pollen API JSON) ---

// RawForecastResponse is the top-level response from the Google Pollen API.
type RawForecastResponse struct {
	DailyInfo  []DailyInfo `json:"dailyInfo"`
	RegionCode string      `json:"regionCode,omitempty"`
}

// DailyInfo contains pollen data for a single day.
type DailyInfo struct {
	Date           DateInfo         `json:"date"`
	PollenTypeInfo []PollenTypeInfo `json:"pollenTypeInfo"`
	PlantInfo      []PlantInfo      `json:"plantInfo,omitempty"`
}

// DateInfo represents a calendar date from the API.
type DateInfo struct {
	Year  int `json:"year"`
	Month int `json:"month"`
	Day   int `json:"day"`
}

// PollenTypeInfo represents data for one pollen type (GRASS, TREE, WEED).
type PollenTypeInfo struct {
	Code                  string     `json:"code"`
	DisplayName           string     `json:"displayName"`
	HealthRecommendations []string   `json:"healthRecommendations,omitempty"`
	InSeason              bool       `json:"inSeason,omitempty"`
	IndexInfo             *IndexInfo `json:"indexInfo,omitempty"`
}

// IndexInfo contains the Universal Pollen Index data.
type IndexInfo struct {
	Code             string `json:"code"`
	DisplayName      string `json:"displayName"`
	Value            int    `json:"value"`    // 0-5 (UPI scale)
	Category         string `json:"category"` // "None", "Very Low", "Low", "Moderate", "High", "Very High"
	IndexDescription string `json:"indexDescription"`
	Color            Color  `json:"color"`
}

// Color represents an RGB color from the API (values are 0.0-1.0 floats).
type Color struct {
	Red   float64 `json:"red,omitempty"`
	Green float64 `json:"green,omitempty"`
	Blue  float64 `json:"blue,omitempty"`
}

// PlantInfo represents data for a specific plant species.
type PlantInfo struct {
	Code        string     `json:"code"`
	DisplayName string     `json:"displayName"`
	InSeason    bool       `json:"inSeason,omitempty"`
	IndexInfo   *IndexInfo `json:"indexInfo,omitempty"`
}

// --- Formatted output types (used by CLI and future consumers) ---

// PollenLevel represents the formatted pollen level for one type.
type PollenLevel struct {
	Level    *int   `json:"level"`    // nil means no data
	Category string `json:"category"` // "None", "Very Low", "Low", "Moderate", "High", "Very High", "No Data"
	InSeason bool   `json:"inSeason"`
}

// DayForecast represents the formatted forecast for a single day.
type DayForecast struct {
	Date                  string      `json:"date"`    // "2025-06-15"
	DayName               string      `json:"dayName"` // "Today", "Tomorrow", "Wednesday"
	Grass                 PollenLevel `json:"grass"`
	Tree                  PollenLevel `json:"tree"`
	Weed                  PollenLevel `json:"weed"`
	HealthRecommendations []string    `json:"healthRecommendations"`
}

// Forecast is the fully formatted forecast result.
type Forecast struct {
	RegionCode string        `json:"regionCode"`
	Days       []DayForecast `json:"days"`
}
