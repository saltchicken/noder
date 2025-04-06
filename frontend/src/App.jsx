import React from 'react';
import {
  ReactFlowProvider,
} from '@xyflow/react';
import FlowContent from './components/FlowContent';
import '@xyflow/react/dist/style.css';

const Flow = () => {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
}

export default Flow;
