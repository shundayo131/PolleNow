package cli

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/spf13/cobra"

	"github.com/shunito/pollenow/internal/config"
	"github.com/shunito/pollenow/internal/ui"
)

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Manage configuration",
	Long:  "View and manage PolleNow configuration.",
	RunE:  runConfigShow,
}

var configSetCmd = &cobra.Command{
	Use:   "set <key> <value>",
	Short: "Set a config value",
	Long:  "Set a configuration value. Keys: api_key, default_zip, days",
	Args:  cobra.ExactArgs(2),
	RunE:  runConfigSet,
}

var configInitCmd = &cobra.Command{
	Use:   "init",
	Short: "Interactive setup",
	Long:  "Run the interactive first-time setup wizard.",
	RunE: func(cmd *cobra.Command, args []string) error {
		_, err := runFirstTimeSetup()
		return err
	},
}

var configPathCmd = &cobra.Command{
	Use:   "path",
	Short: "Print config file path",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println(config.Path())
		return nil
	},
}

func init() {
	configCmd.AddCommand(configSetCmd)
	configCmd.AddCommand(configInitCmd)
	configCmd.AddCommand(configPathCmd)
}

func runConfigShow(cmd *cobra.Command, args []string) error {
	cfg, err := config.Load()
	if err != nil {
		ui.RenderError(err)
		return err
	}

	apiKeyDisplay := "(not set)"
	if cfg.APIKey != "" {
		// Redact API key, show first 4 and last 3 chars
		if len(cfg.APIKey) > 10 {
			apiKeyDisplay = cfg.APIKey[:4] + "..." + cfg.APIKey[len(cfg.APIKey)-3:]
		} else {
			apiKeyDisplay = "***"
		}
	}

	zipDisplay := "(not set)"
	if cfg.DefaultZIP != "" {
		zipDisplay = cfg.DefaultZIP
	}

	fmt.Printf("  api_key:     %s\n", apiKeyDisplay)
	fmt.Printf("  default_zip: %s\n", zipDisplay)
	fmt.Printf("  days:        %d\n", cfg.Days)
	fmt.Printf("  config file: %s\n", config.Path())

	return nil
}

func runConfigSet(cmd *cobra.Command, args []string) error {
	key := strings.ToLower(args[0])
	value := args[1]

	cfg, err := config.Load()
	if err != nil {
		ui.RenderError(err)
		return err
	}

	switch key {
	case "api_key":
		cfg.APIKey = value
	case "default_zip":
		cfg.DefaultZIP = value
	case "days":
		d, err := strconv.Atoi(value)
		if err != nil || d < 1 || d > 5 {
			ui.RenderError(fmt.Errorf("days must be a number between 1 and 5"))
			return fmt.Errorf("invalid days value")
		}
		cfg.Days = d
	default:
		ui.RenderError(fmt.Errorf("unknown config key %q — valid keys: api_key, default_zip, days", key))
		return fmt.Errorf("unknown key: %s", key)
	}

	if err := config.Save(cfg); err != nil {
		ui.RenderError(err)
		return err
	}

	fmt.Printf("  ✓ %s set to %s\n", key, value)
	return nil
}
