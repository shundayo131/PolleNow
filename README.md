### PolleNow

A CLI tool that delivers pollen forecasts right in your terminal. Get grass, tree, and weed pollen levels for any US ZIP code with health recommendations.

### Key features

- 5-day pollen forecast for grass, tree, and weed
- Health recommendations based on pollen levels
- Compact one-line output mode
- API response caching (1 hour TTL)
- Guided first-run setup

### Tech stack

- Language: Go
- CLI: Cobra
- Terminal UI: Lipgloss
- External APIs: Google Pollen API, Google Maps Geocoding API

### Prerequisites

- Go 1.21+
- Google Cloud project with **Pollen API** and **Geocoding API** enabled
- Google API key

### Quick start

```
go build -o pollenow ./cmd/pollenow
./pollenow config set api_key YOUR_GOOGLE_API_KEY
./pollenow 94025
```

### Usage

```
pollenow [ZIP]                      # Forecast using ZIP code
pollenow --today                    # Today only
pollenow -d 3                       # 3-day forecast
pollenow -c                         # Compact one-line output
pollenow config                     # Show current config
pollenow config set api_key KEY     # Set API key
pollenow config set default_zip ZIP # Set default ZIP code
pollenow config init                # Interactive setup
pollenow version                    # Print version
```

### Configuration

Config file: `~/.config/pollenow/config.yaml`

```yaml
api_key: "AIzaSy..."
default_zip: "94025"
days: 5
```

The `POLLENOW_API_KEY` environment variable overrides the config file.

### Project structure

```
├── cmd/pollenow/main.go        # Entry point
├── cli/                         # Cobra commands
├── internal/
│   ├── config/                  # Config load/save
│   ├── cache/                   # File-based API response cache
│   ├── geocoding/               # Google Geocoding API client
│   ├── pollen/                  # Google Pollen API client + formatter
│   ├── forecast/                # Service orchestrator
│   └── ui/                      # Terminal rendering
├── go.mod
└── README.md
```

### Testing

```
go test ./...
```
