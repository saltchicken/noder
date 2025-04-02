import { memo } from 'react';
import { useCallback } from 'react';
import { Handle, Position , NodeResizeControl} from '@xyflow/react';

import SingleConnectionHandle from '../components/SingleConnectionHandle.jsx'

const controlStyle = {
  background: 'transparent',
  border: 'none',
};

function CustomNode({ data }) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  const inputs = Array.isArray(data.inputs) ? data.inputs : ['default'];
  const outputs = Array.isArray(data.outputs) ? data.outputs : ['default'];
  const spacing = 15; // 5% spacing between handles
  const topPadding = 15; // 10% padding from the top

  return (
    <>
      <NodeResizeControl style={controlStyle} minWidth={100} minHeight={50}>
        <ResizeIcon />
      </NodeResizeControl>
      {inputs.map((inputId, index) => (
        <div key={inputId}>
          <SingleConnectionHandle 
            type="target" 
            position={Position.Left} 
            style={{ top: `${topPadding + (index * spacing)}px` }} 
            id={inputId}
          />
          <span style={{
            position: 'absolute',
            left: '20px',
            top: `${topPadding + (index * spacing)}px`,
            transform: 'translateY(-50%)',
            fontSize: '8px',
            pointerEvents: 'none'
          }}>
            {inputId}
          </span>
        </div>
      ))}
      <div>
        <label htmlFor="text">{data.label}</label>
        <input id="text" name="text" onChange={onChange} className="nodrag" />
      </div>
      {outputs.map((outputId, index) => (
        <div key={outputId}>
          <Handle  
            type="source" 
            position={Position.Right} 
            style={{ top: `${topPadding + (index * spacing)}px` }} 
            id={outputId}
          />
          <span style={{
            position: 'absolute',
            right: '20px',
            top: `${topPadding + (index * spacing)}px`,
            transform: 'translateY(-50%)',
            fontSize: '8px',
            pointerEvents: 'none'
          }}>
            {outputId}
          </span>
        </div>
      ))}
    </>
  );
}

function ResizeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="#ff0071"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ position: 'absolute', right: 5, bottom: 5 }}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <polyline points="16 20 20 20 20 16" />
      <line x1="14" y1="14" x2="20" y2="20" />
      <polyline points="8 4 4 4 4 8" />
      <line x1="4" y1="4" x2="10" y2="10" />
    </svg>
  );
}

export default memo(CustomNode);

