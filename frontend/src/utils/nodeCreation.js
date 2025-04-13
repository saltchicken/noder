import { uuidv4 } from './uuid';

export function createPythonNode({
  position,
  pythonNode,
}) {
  const baseNode = {
    id: uuidv4(),
    type: 'pythonNode',
    position,
    style: { width: 'auto', minWidth: '300px' }
  };

  if (pythonNode) {
    return {
      ...baseNode,
      style: {
        ...baseNode.style,
      },
      data: {
        label: pythonNode.name,
        inputs: pythonNode.inputs,
        outputs: pythonNode.outputs,
        widgets: pythonNode.widgets,
        widgetValues: {},
        isCollapsed: false
      }
    };
  }
}

export function duplicateNode(node, pythonNodes, offset = { x: 50, y: 50 }) {
  const pythonNode = pythonNodes.find(pNode => pNode.name === node.data.label);
  const position = {
    x: node.position.x + offset.x,
    y: node.position.y + offset.y,
  };

  const newNode = createPythonNode({
    position,
    pythonNode,
  });
  newNode.data.widgetValues = node.data.widgetValues;
  return newNode
}
// widgetValues: {
//   [config.widgets[0].name]: customData[nodeType === 'ImageSource' ? 'imageData' : 'videoData'] || '',
//   caption: ''
// },
