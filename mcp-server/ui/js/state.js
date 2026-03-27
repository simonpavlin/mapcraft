export const state = {
  currentPath: '/',
  currentTab: 'floorplan',
  treeData: null,
  nodeData: null,
  expandedPaths: new Set(['/']),
  selectedFloor: null,
  selectedFloorData: null,
  currentProjection: 'plan',
  navHistory: [],
  lastUiHash: null,
};
