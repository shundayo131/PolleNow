package cli

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/spf13/cobra"

	"github.com/shunito/pollenow/internal/cache"
	"github.com/shunito/pollenow/internal/config"
	"github.com/shunito/pollenow/internal/forecast"
	"github.com/shunito/pollenow/internal/geocoding"
	"github.com/shunito/pollenow/internal/pollen"
	"github.com/shunito/pollenow/internal/ui"
)

var (
	flagDays    int
	flagToday   bool
	flagCompact bool
)

var forecastCmd = &cobra.Command{
	Use:   "forecast [ZIP]",
	Short: "Get pollen forecast",
	Long:  "Get pollen forecast for a US ZIP code. Defaults to the ZIP code in your config.",
	Args:  cobra.MaximumNArgs(1),
	RunE:  runForecast,
}

func addForecastFlags(cmd *cobra.Command) {
	cmd.Flags().IntVarP(&flagDays, "days", "d", 0, "Number of forecast days (1-5)")
	cmd.Flags().BoolVarP(&flagToday, "today", "t", false, "Show today only (shortcut for -d 1)")
	cmd.Flags().BoolVarP(&flagCompact, "compact", "c", false, "One-line summary output")
}

func init() {
	addForecastFlags(forecastCmd)
}

func runForecast(cmd *cobra.Command, args []string) error {
	// Load config
	cfg, err := config.Load()
	if err != nil {
		ui.RenderError(err)
		return err
	}

	// First-run: no config file exists
	if !config.Exists() {
		cfg, err = runFirstTimeSetup()
		if err != nil {
			ui.RenderError(err)
			return err
		}
	}

	// Validate API key
	if err := cfg.Validate(); err != nil {
		ui.RenderError(fmt.Errorf("%w\nRun: pollenow config set api_key YOUR_KEY\nOr set POLLENOW_API_KEY environment variable", err))
		return err
	}

	// Resolve ZIP code: arg > config default
	zip := cfg.DefaultZIP
	if len(args) > 0 {
		zip = args[0]
	}
	if zip == "" {
		err := fmt.Errorf("no ZIP code provided\nUsage: pollenow [ZIP]\nOr set a default: pollenow config set default_zip 94025")
		ui.RenderError(err)
		return err
	}

	// Resolve days: --today > --days > config > default
	days := cfg.Days
	if days == 0 {
		days = config.DefaultDays
	}
	if flagDays > 0 {
		days = flagDays
	}
	if flagToday {
		days = 1
	}

	// Create services
	geocoder := geocoding.NewGoogleGeocoder(cfg.APIKey)
	pollenClient := pollen.NewGooglePollenClient(cfg.APIKey)
	c := cache.New("")
	svc := forecast.NewService(geocoder, pollenClient, c)

	// Fetch forecast with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	result, err := svc.GetForecast(ctx, zip, days)
	if err != nil {
		if errors.Is(err, geocoding.ErrInvalidZIP) {
			ui.RenderError(fmt.Errorf("invalid ZIP code %q — please enter a 5-digit US ZIP code", zip))
		} else if errors.Is(err, pollen.ErrInvalidDays) {
			ui.RenderError(fmt.Errorf("days must be between 1 and 5"))
		} else {
			ui.RenderError(err)
		}
		return err
	}

	// Render output
	if flagCompact {
		ui.RenderCompact(result)
	} else {
		ui.RenderForecast(result)
	}

	return nil
}

// runFirstTimeSetup runs the interactive guided setup.
func runFirstTimeSetup() (*config.Config, error) {
	reader := bufio.NewReader(os.Stdin)

	fmt.Println()
	fmt.Println("  Welcome to PolleNow! Let's get you set up.")
	fmt.Println()

	fmt.Print("  Enter your Google API key: ")
	apiKey, _ := reader.ReadString('\n')
	apiKey = strings.TrimSpace(apiKey)
	if apiKey == "" {
		return nil, fmt.Errorf("API key is required")
	}

	fmt.Print("  Enter your default ZIP code (optional): ")
	zip, _ := reader.ReadString('\n')
	zip = strings.TrimSpace(zip)

	cfg := &config.Config{
		APIKey:     apiKey,
		DefaultZIP: zip,
		Days:       config.DefaultDays,
	}

	if err := config.Save(cfg); err != nil {
		return nil, fmt.Errorf("saving config: %w", err)
	}

	fmt.Printf("\n  ✓ Config saved to %s\n\n", config.Path())

	return cfg, nil
}
