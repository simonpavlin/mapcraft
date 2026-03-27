export const state = {
  currentPath: '/',
  currentTab: 'floorplan',
  treeData: null,
  nodeData: null,
  expandedPaths: new Set(['/']),
  currentProjection: 'plan',
  navHistory: [],
  lastUiHash: null,
  hiddenTags: new Set(),
};
