import { uuidv4 } from './uuid';

export function createPythonNode({
  position,
  nodeType,
  pythonNode = null,
  customData = {}
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
        label: nodeType,
        inputs: pythonNode.inputs,
        outputs: pythonNode.outputs,
        widgets: pythonNode.widgets,
        widgetValues: customData.widgetValues || {},
        isCollapsed: false
      }
    };
  } else {
    const fileConfig = {
      ImageSource: {
        nodeType: 'CaptionedImageSource',
        outputs: [
          {
            name: 'image_upload',
            type: '<class \'str\'>'
          },
          {
            name: 'captioned_image',
            type: '<class \'CaptionedImage\'>'
          }
        ],
        widgets: [
          {
            name: 'image_upload',
            type: 'image_file_upload',
            value: ''
          },
          {
            name: 'caption',
            type: 'textarea',
            value: ''
          }
        ]
      },
      VideoSource: {
        nodeType: 'CaptionedVideoSource',
        outputs: [
          {
            name: 'video_upload',
            type: '<class \'str\'>'
          },
          {
            name: 'captioned_video',
            type: '<class \'CaptionedVideo\'>'
          }
        ],
        widgets: [
          {
            name: 'video_upload',
            type: 'video_file_upload',
            value: ''
          },
          {
            name: 'caption',
            type: 'textarea',
            value: ''
          }
        ]
      }
    };

    const config = fileConfig[nodeType];
    if (!config) {
      throw new Error(`Unsupported node type: ${nodeType}`);
    }

    return {
      ...baseNode,
      style: {
        ...baseNode.style,
      },
      data: {
        label: config.nodeType,
        inputs: [],
        outputs: config.outputs,
        widgets: config.widgets,
        widgetValues: {
          [config.widgets[0].name]: customData[nodeType === 'ImageSource' ? 'imageData' : 'videoData'] || '',
          caption: ''
        },
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

  return createPythonNode({
    position,
    nodeType: node.data.label,
    pythonNode,
    customData: {
      widgetValues: node.data.widgetValues
    }
  });
}
