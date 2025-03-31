export const getMaxNodeId = (nodes) => {
  if (!nodes?.length) return 0;
  return Math.max(...nodes.map(node => parseInt(node.id)));
}
