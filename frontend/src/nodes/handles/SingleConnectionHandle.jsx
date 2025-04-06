import React from 'react';
import { Handle, useNodeConnections } from '@xyflow/react';
 
const SingleConnectionHandle = (props) => {
  const connections = useNodeConnections({
    handleType: props.type,
    handleId: props.id
  });
 
  return (
    <Handle
      {...props}
      isConnectable={connections.length < 1}
    />
  );
};
 
export default SingleConnectionHandle;
