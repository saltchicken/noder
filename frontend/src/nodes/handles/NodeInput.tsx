import React from 'react';
import { Position } from '@xyflow/react';
import SingleConnectionHandle from './SingleConnectionHandle.jsx'
import { getTypeColor } from './utils/handleColors.tsx';

const NodeInput = ({ input, spacing }) => (
  <div style={{
    position: 'relative',
    height: `${spacing}px`,
    marginBottom: '5px'
  }}>
    <SingleConnectionHandle
      type="target"
      position={Position.Left}
      style={{
        position: 'absolute',
        left: '-8px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: getTypeColor(input.type),
        borderColor: getTypeColor(input.type)
      }}
      id={input.name}
      data-type={input.type}
    />
    <span style={{
      position: 'absolute',
      left: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '6px',
      whiteSpace: 'nowrap'
    }}>
      {input.name}: {input.type}
    </span>
  </div>
);

export default NodeInput;
