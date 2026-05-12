# mcp-waqi

WAQI MCP — World Air Quality Index (free key)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 250+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_aqi_by_location` | Real-time AQI for the WAQI station nearest a lat/lon. |
| `get_aqi_by_station` | Real-time AQI for a specific WAQI station by UID (numeric). |
| `search_stations` | Search stations by keyword (city/region name). Returns station UID, name, current AQI, and location. |

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

Or connect to the full Pipeworx gateway for access to all 250+ data sources:

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

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
