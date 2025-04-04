import { useCallback, memo, useMemo, useState } from 'react';

import { NodeResizeControl} from '@xyflow/react';
import InputWidget from './widgets/InputWidget.tsx';
import DropdownWidget from './widgets/DropdownWidget.tsx';
import SliderWidget from './widgets/SliderWidget.tsx';
import NodeInput from './handles/NodeInput.tsx';
import NodeOutput from './handles/NodeOutput.tsx';


function PythonNode({ data }) {
  const [widgetValues, setWidgetValues] = useState(() =>{
    const values = {};
    data.widgets?.forEach(widget => {
      values[widget.name] = widget.value;
    });
    return values;
  });

  const onChange = useCallback((evt) => {
    const { name, value } = evt.target;
    setWidgetValues(prev => ({
      ...prev,
      [name]: value
    }));
    data.widgetValues = {
      ...data.widgetValues,
      [name]: value
    };
  }, [data]);

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'dropdown':
        return <DropdownWidget key={widget.name} widget={widget} onChange={onChange} />;
      case 'slider':
        return <SliderWidget key={widget.name} widget={widget} onChange={onChange} />;
      default:
        return <InputWidget key={widget.name} widget={widget} onChange={onChange} />;
    }
  };

  const {inputs, outputs, widgets, widgetTopPadding, spacing, topPadding } = useMemo(() => {
    const inputs = Array.isArray(data.inputs) ? data.inputs : ['default'];
    const outputs = Array.isArray(data.outputs) ? data.outputs : ['default'];
    const widgets = Array.isArray(data.widgets) ? data.widgets : [];
    const spacing = 15; // 5% spacing between handles
    const topPadding = 15; // 10% padding from the top
    const maxHandles = Math.max(inputs.length, outputs.length);
    const widgetTopPadding = topPadding + (maxHandles * spacing);

    return { inputs, outputs, widgets, widgetTopPadding, spacing, topPadding };
  }, [data.inputs, data.outputs, data.widgets]);


  return (
    <>
      {inputs.map((input, index) => (
        <NodeInput 
          key={input.name}
          input={input}
          topPadding={topPadding}
          index={index}
          spacing={spacing}
        />
      ))}
      {outputs.map((output, index) => (
        <NodeOutput
          key={output.name}
          output={output}
          topPadding={topPadding}
          index={index}
          spacing={spacing}
        />
      ))}
      <div style={{ width: '100%', position: 'absolute', top: `${widgetTopPadding}px` }}>
        {widgets.map((widget) => renderWidget(widget))}
      </div>
      <NodeResizeControl style={{ background: 'transparent', border: 'none' }} minWidth={100} minHeight={50}>
        <ResizeIcon />
      </NodeResizeControl>
    </>
  );
}

const ResizeIcon = memo(() => (
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
  ));


export default memo(PythonNode, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});

