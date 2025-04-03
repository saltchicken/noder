import { Position } from '@xyflow/react';
import SingleConnectionHandle from './SingleConnectionHandle.jsx'

const NodeInput = ({ input, topPadding, index, spacing }) => (
  <div key={input.name}>
    <SingleConnectionHandle 
      type="target" 
      position={Position.Left} 
      style={{ top: `${topPadding + (index * spacing)}px` }} 
      id={input.name}
    />
    <span style={{
      position: 'absolute',
      left: '20px',
      top: `${topPadding + (index * spacing)}px`,
      transform: 'translateY(-50%)',
      fontSize: '8px',
      pointerEvents: 'none'
    }}>
      {input.name}
    </span>
  </div>
);

export default NodeInput;
