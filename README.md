# @pipeworx/waqi

World Air Quality Index MCP — 12k+ real-time AQI stations worldwide.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `get_aqi_by_city(city)`
- `get_aqi_by_location(latitude, longitude)`
- `get_aqi_by_station(station_id)`
- `search_stations(keyword)`

## Auth

- **Platform key:** gateway env `PLATFORM_WAQI_KEY`.
- **BYO:** `?_apiKey=<token>` after registering at https://aqicn.org/data-platform/token/ (free).

## Data source

`https://api.waqi.info/` — `?token=` query param.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "waqi": {
      "url": "https://gateway.pipeworx.io/waqi/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Waqi data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
