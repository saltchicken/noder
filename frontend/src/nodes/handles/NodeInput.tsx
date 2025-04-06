import { Position } from '@xyflow/react';
import SingleConnectionHandle from './SingleConnectionHandle.jsx'
import { getTypeColor } from './utils/handleColors.tsx';

const NodeInput = ({ input, topPadding, index, spacing }) => (
  <div key={input.name}>
    <SingleConnectionHandle 
      type="target" 
      position={Position.Left} 
      style={{ top: `${topPadding + (index * spacing)}px`, background: getTypeColor(input.type), borderColor: getTypeColor(input.type) }} 
      id={input.name}
      data-type={input.type}
    />
    <span style={{
      position: 'absolute',
      left: '20px',
      top: `${topPadding + (index * spacing)}px`,
      transform: 'translateY(-50%)',
      fontSize: '8px',
      pointerEvents: 'none'
    }}>
      {input.name}: {input.type}
    </span>
  </div>
);

export default NodeInput;
