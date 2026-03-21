import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP_FILE = resolve(__dirname, '../../data/map.json');

// Ensure data directory exists
import { mkdirSync } from 'fs';
mkdirSync(resolve(__dirname, '../../data'), { recursive: true });

function loadMap() {
  if (!existsSync(MAP_FILE)) {
    return { buildings: [], trees: [], paths: [] };
  }
  return JSON.parse(readFileSync(MAP_FILE, 'utf-8'));
}

function saveMap(map) {
  writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
}

const server = new McpServer({
  name: 'mapcraft',
  version: '0.1.0',
});

// Tool: Get current map
server.tool('get_map', 'Get the current map data', {}, async () => {
  const map = loadMap();
  return { content: [{ type: 'text', text: JSON.stringify(map, null, 2) }] };
});

// Tool: Add a building
server.tool(
  'add_building',
  'Add a building to the map',
  {
    x: z.number().describe('X position'),
    z: z.number().describe('Z position'),
    width: z.number().min(1).max(50).describe('Width of the building'),
    height: z.number().min(1).max(100).describe('Height of the building'),
    depth: z.number().min(1).max(50).describe('Depth of the building'),
    color: z.string().optional().describe('Hex color (e.g. "#b8860b")'),
    name: z.string().optional().describe('Name of the building'),
  },
  async ({ x, z: posZ, width, height, depth, color, name }) => {
    const map = loadMap();
    const building = {
      id: `building_${Date.now()}`,
      x,
      z: posZ,
      width,
      height,
      depth,
      color: color || '#8b7355',
      name: name || 'Unnamed Building',
    };
    map.buildings.push(building);
    saveMap(map);
    return { content: [{ type: 'text', text: `Building "${building.name}" added at (${x}, ${posZ})` }] };
  }
);

// Tool: Add a tree
server.tool(
  'add_tree',
  'Add a tree to the map',
  {
    x: z.number().describe('X position'),
    z: z.number().describe('Z position'),
    height: z.number().min(1).max(20).optional().describe('Tree height'),
  },
  async ({ x, z: posZ, height }) => {
    const map = loadMap();
    const tree = {
      id: `tree_${Date.now()}`,
      x,
      z: posZ,
      height: height || 4 + Math.random() * 3,
    };
    map.trees.push(tree);
    saveMap(map);
    return { content: [{ type: 'text', text: `Tree added at (${x}, ${posZ})` }] };
  }
);

// Tool: Add a path
server.tool(
  'add_path',
  'Add a path/road to the map',
  {
    x: z.number().describe('X center position'),
    z: z.number().describe('Z center position'),
    width: z.number().describe('Width of the path'),
    length: z.number().describe('Length of the path'),
    rotation: z.number().optional().describe('Rotation in degrees (0 = along X axis, 90 = along Z axis)'),
  },
  async ({ x, z: posZ, width, length, rotation }) => {
    const map = loadMap();
    const path = {
      id: `path_${Date.now()}`,
      x,
      z: posZ,
      width,
      length,
      rotation: rotation || 0,
    };
    map.paths.push(path);
    saveMap(map);
    return { content: [{ type: 'text', text: `Path added at (${x}, ${posZ})` }] };
  }
);

// Tool: Clear map
server.tool('clear_map', 'Remove all objects from the map', {}, async () => {
  saveMap({ buildings: [], trees: [], paths: [] });
  return { content: [{ type: 'text', text: 'Map cleared' }] };
});

// Tool: Remove object
server.tool(
  'remove_object',
  'Remove an object from the map by its ID',
  {
    id: z.string().describe('Object ID to remove'),
  },
  async ({ id }) => {
    const map = loadMap();
    for (const key of ['buildings', 'trees', 'paths']) {
      const idx = map[key].findIndex((obj) => obj.id === id);
      if (idx !== -1) {
        map[key].splice(idx, 1);
        saveMap(map);
        return { content: [{ type: 'text', text: `Removed ${key.slice(0, -1)} ${id}` }] };
      }
    }
    return { content: [{ type: 'text', text: `Object ${id} not found` }] };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MapCraft MCP server running on stdio');
}

main().catch(console.error);
