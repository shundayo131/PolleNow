package cli

import (
	"github.com/spf13/cobra"
)

var (
	// Version is set at build time via ldflags.
	Version = "dev"
)

var rootCmd = &cobra.Command{
	Use:   "pollenow [ZIP]",
	Short: "Pollen forecast in your terminal",
	Long:  "PolleNow — get pollen forecasts for any US ZIP code right in your terminal.",
	// When run with no subcommand, behave like "forecast".
	Args:          cobra.MaximumNArgs(1),
	SilenceErrors: true,
	SilenceUsage:  true,
	RunE:          runForecast,
}

func init() {
	// Register forecast flags on the root command so `pollenow -d 3` works
	addForecastFlags(rootCmd)

	rootCmd.AddCommand(forecastCmd)
	rootCmd.AddCommand(configCmd)
	rootCmd.AddCommand(versionCmd)
}

// Execute runs the root command.
func Execute() error {
	return rootCmd.Execute()
}
