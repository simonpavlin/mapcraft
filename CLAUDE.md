# MapCraft

## Building Generation
When creating 3D buildings, ALWAYS follow the skill defined in `SKILL.md`:
1. Plan layout in MCP (rooms → doors/windows → furniture)
2. Verify with `check_collision` and `get_ascii`
3. Generate 3D using `building-utils.js` utilities (`wallWithOpenings`, `addWindow`, `addDoor`, `addStairs`, etc.)

Read `SKILL.md` before generating any new building.

## Project Structure
- `viewer/` — Three.js 3D viewer (Vite, port 3000)
- `viewer/src/building-utils.js` — shared 3D generation utilities
- `mcp-server/` — MCP server for spatial planning
- `mcp-server/ui/` — web UI for browsing plans (port 3001, `npm run ui`)
