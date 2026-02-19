package ui

import (
	"fmt"
	"os"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/lipgloss/table"
	"github.com/shunito/pollenow/internal/forecast"
	"github.com/shunito/pollenow/internal/pollen"
)

// Color constants for pollen categories.
var categoryColors = map[string]lipgloss.Color{
	"None":      lipgloss.Color("#6b7280"),
	"Very Low":  lipgloss.Color("#10b981"),
	"Low":       lipgloss.Color("#10b981"),
	"Moderate":  lipgloss.Color("#f59e0b"),
	"High":      lipgloss.Color("#ef4444"),
	"Very High": lipgloss.Color("#dc2626"),
	"No Data":   lipgloss.Color("#6b7280"),
}

var (
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("#4361ee")).
			MarginBottom(1)

	locationStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#9ca3af"))

	cachedStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#6b7280")).
			Italic(true)

	warningStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#f59e0b")).
			Bold(true)

	recommendationStyle = lipgloss.NewStyle().
				Foreground(lipgloss.Color("#9ca3af"))

	errorStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#ef4444")).
			Bold(true)

	legendStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#6b7280")).
			Italic(true)
)

// RenderForecast prints the full forecast table to stdout.
func RenderForecast(result *forecast.Result) {
	// Title
	fmt.Println(titleStyle.Render("PolleNow - Pollen Forecast"))

	// Location
	locLine := locationStyle.Render(result.Location.DisplayName)
	if result.Cached {
		minutes := int(result.CacheAge.Minutes())
		locLine += " " + cachedStyle.Render(fmt.Sprintf("(cached %dm ago)", minutes))
	}
	fmt.Println(locLine)
	fmt.Println()

	if len(result.Forecast.Days) == 0 {
		fmt.Println(recommendationStyle.Render("No forecast data available."))
		return
	}

	// Summary line for today
	today := result.Forecast.Days[0]
	summary := buildSummary(today)
	if summary != "" {
		fmt.Println(summary)
		fmt.Println()
	}

	// Forecast table
	hasInSeason := false
	rows := make([][]string, 0, len(result.Forecast.Days))
	for _, day := range result.Forecast.Days {
		grassCell, grassSeason := formatCell(day.Grass)
		treeCell, treeSeason := formatCell(day.Tree)
		weedCell, weedSeason := formatCell(day.Weed)
		if grassSeason || treeSeason || weedSeason {
			hasInSeason = true
		}
		rows = append(rows, []string{day.DayName, grassCell, treeCell, weedCell})
	}

	t := table.New().
		Border(lipgloss.NormalBorder()).
		BorderStyle(lipgloss.NewStyle().Foreground(lipgloss.Color("#4b5563"))).
		Headers("Day", "🌱 Grass", "🌳 Tree", "🌿 Weed").
		Rows(rows...).
		StyleFunc(func(row, col int) lipgloss.Style {
			if row == table.HeaderRow {
				return lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#e5e7eb"))
			}
			return lipgloss.NewStyle()
		})

	fmt.Println(t)

	if hasInSeason {
		fmt.Println(legendStyle.Render("* = in season"))
	}

	// Health recommendations (from today)
	if len(today.HealthRecommendations) > 0 {
		fmt.Println()
		fmt.Println(lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#e5e7eb")).Render("Health Recommendations"))
		for _, rec := range today.HealthRecommendations {
			fmt.Println(recommendationStyle.Render("  • " + rec))
		}
	}

	fmt.Println()
}

// RenderCompact prints a one-line summary.
func RenderCompact(result *forecast.Result) {
	if len(result.Forecast.Days) == 0 {
		fmt.Println("No forecast data available.")
		return
	}

	today := result.Forecast.Days[0]
	parts := []string{
		fmt.Sprintf("Grass %s", compactLevel(today.Grass)),
		fmt.Sprintf("Tree %s", compactLevel(today.Tree)),
		fmt.Sprintf("Weed %s", compactLevel(today.Weed)),
	}

	loc := result.Location.DisplayName
	fmt.Printf("%s: %s\n", loc, strings.Join(parts, " | "))
}

// RenderError prints a styled error message to stderr.
func RenderError(err error) {
	fmt.Fprintln(os.Stderr, errorStyle.Render("Error: "+err.Error()))
}

// buildSummary creates an actionable summary line for today's forecast.
func buildSummary(day pollen.DayForecast) string {
	highest := ""
	highestCategory := ""

	for _, entry := range []struct {
		name  string
		level pollen.PollenLevel
	}{
		{"Grass", day.Grass},
		{"Tree", day.Tree},
		{"Weed", day.Weed},
	} {
		if entry.level.Level != nil && *entry.level.Level >= 4 {
			if highest == "" || *entry.level.Level > 4 {
				highest = entry.name
				highestCategory = entry.level.Category
			}
		}
	}

	if highest != "" {
		return warningStyle.Render(
			fmt.Sprintf("⚠ %s pollen is %s today — consider limiting outdoor activity", highest, strings.ToUpper(highestCategory)),
		)
	}

	// Check if everything is low
	allLow := true
	for _, level := range []pollen.PollenLevel{day.Grass, day.Tree, day.Weed} {
		if level.Level != nil && *level.Level > 2 {
			allLow = false
			break
		}
	}
	if allLow {
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#10b981")).Render("✓ All pollen levels are low today")
	}

	return ""
}

// formatCell formats a pollen level for the table.
func formatCell(level pollen.PollenLevel) (string, bool) {
	color, ok := categoryColors[level.Category]
	if !ok {
		color = categoryColors["No Data"]
	}

	style := lipgloss.NewStyle().Foreground(color)

	if level.Level == nil {
		return style.Render("- No Data"), false
	}

	cat := abbreviateCategory(level.Category)
	marker := ""
	if level.InSeason {
		marker = " *"
	}

	return style.Render(fmt.Sprintf("■ %d %s", *level.Level, cat)) + marker, level.InSeason
}

// abbreviateCategory shortens category names for table display.
func abbreviateCategory(cat string) string {
	switch cat {
	case "Very Low":
		return "V.Low"
	case "Moderate":
		return "Mod"
	case "Very High":
		return "V.High"
	default:
		return cat
	}
}

// compactLevel formats a pollen level for compact output.
func compactLevel(level pollen.PollenLevel) string {
	if level.Level == nil {
		return "N/A"
	}
	cat := level.Category
	if level.Level != nil && *level.Level >= 4 {
		cat = strings.ToUpper(cat)
	}
	return cat
}
