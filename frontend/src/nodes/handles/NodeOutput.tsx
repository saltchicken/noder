import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getTypeColor } from './utils/handleColors.tsx';

const NodeOutput = ({ output, spacing }) => (
  <div style={{
    position: 'relative',
    height: `${spacing}px`,
    marginBottom: '5px'
  }}>
    <Handle
      type="source"
      position={Position.Right}
      style={{
        position: 'absolute',
        right: '-15px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: getTypeColor(output.type),
        borderColor: getTypeColor(output.type)
      }}
      id={output.name}
      data-type={output.type}
    />
    <span style={{
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '6px',
      whiteSpace: 'nowrap'
    }}>
      {output.name}: {output.type}
    </span>
  </div>
);

export default NodeOutput;

