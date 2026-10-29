# @pipeworx/waqi

World Air Quality Index MCP — 12k+ real-time AQI stations worldwide.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1857+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

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

## Freshness (fleet #3741)

A monitoring station that stops reporting keeps serving its last value, so an
upstream feed can answer with a plausible AQI that is months old. Every reading
from this pack therefore carries `measured_at`, the station identity,
`data_age_hours`, `freshness` (`fresh` | `stale` | `unknown`) and
`freshness_bound_hours` (24).

- `get_aqi_by_city` and `get_aqi_by_location` never present a reading older than
  24h as current. If the matched station is stale they use the nearest station
  within 100 km that is reporting (`station_selection:
  "fallback_fresher_station"`, with `skipped_stale_station` naming what was passed
  over), or they error naming the station, its `measured_at` and its age.
- `get_aqi_by_station` returns the station that was asked for, labelled with its
  age, because the caller chose it.
- City matching: see "Place resolution" below.

## Place resolution (fleet #3751)

The publisher's city resolver can map a name to the wrong place ("Venice" to a
station in Dayton, Ohio). `get_aqi_by_city` therefore accepts `"city"` or
`"city, country"` (also `"Roma Italia"`), and verifies that the matched
station's own name is the requested city (exact, a listed exonym such as
Venice/Venezia, or one letter off such as Rome/Roma) and, when a qualifier is
given, that its country or region agrees. A station that fails is never served:
if stations whose own name is the city report in one place, that one is used
(`station_selection: "resolved_by_search"`, `rejected_upstream_match` names what
was refused); if several places share the name they are listed; otherwise the
call errors naming the station it matched. Every city response carries a
`place` block with the requested and matched place.

Source: World Air Quality Index Project, station network.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/waqi/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1857+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/get_aqi_by_city \
  -H 'Content-Type: application/json' \
  -d '{"city":"beijing"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/get_aqi_by_city`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-waqi` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/waqi/mcp` endpoint shown above. It needs network access;
there is no offline mode.

```json
{
  "mcpServers": {
    "waqi": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-waqi"]
    }
  }
}
```

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Waqi data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
