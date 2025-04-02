import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';

import SingleConnectionHandle from '../components/SingleConnectionHandle.jsx'

function TextUpdaterNode({ data }) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  const inputs = Array.isArray(data.inputs) ? data.inputs : ['default'];
  const outputs = Array.isArray(data.outputs) ? data.outputs : ['default'];
  const spacing = 10; // 5% spacing between handles
  const topPadding = 10; // 10% padding from the top

  return (
    <>
      {inputs.map((inputId, index) => (
        <div key={inputId}>
          <SingleConnectionHandle 
            type="target" 
            position={Position.Left} 
            style={{ top: `${topPadding + (index * spacing)}%` }} 
            id={inputId}
          />
          <span style={{
            position: 'absolute',
            left: '20px',
            top: `${topPadding + (index * spacing)}%`,
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
          <SingleConnectionHandle  
            type="source" 
            position={Position.Right} 
            style={{ top: `${topPadding + (index * spacing)}%` }} 
            id={outputId}
          />
          <span style={{
            position: 'absolute',
            right: '20px',
            top: `${topPadding + (index * spacing)}%`,
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

export default TextUpdaterNode;

