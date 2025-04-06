import React from 'react';
import { Handle, useNodeConnections } from '@xyflow/react';
 
const SingleConnectionHandle = (props) => {
  const connections = useNodeConnections({
    handleType: props.type,
    handleId: props.id
  });

  const isTypeCompatible = (sourceType, targetType) => {
    return sourceType === targetType;
  };
 
  return (
    <Handle
      {...props}
      isConnectable={(connection) => {
        if (connections.length >= 1) return false;
        if (props.type === 'target' && connection.source) {
          const sourceHandle = document.querySelector(
            `[data-nodeid="${connection.source}"] [data-handleid="${connection.sourceHandle}"]`
          );
          const sourceType = sourceHandle?.getAttribute('data-type');
          const targetType = props['data-type'];
          
          return isTypeCompatible(sourceType, targetType);
        }
        
        return true;
      }}
    />
  );
};
 
export default SingleConnectionHandle;
