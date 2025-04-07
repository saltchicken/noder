import { useCallback, memo, useMemo, useState, useEffect } from 'react';

import { NodeResizeControl } from '@xyflow/react';
import InputWidget from './widgets/InputWidget.tsx';
import DropdownWidget from './widgets/DropdownWidget.tsx';
import SliderWidget from './widgets/SliderWidget.tsx';
import TextAreaWidget from './widgets/TextAreaWidget.tsx';
import ImageWidget from './widgets/ImageWidget.tsx';
import FileUploadWidget from './widgets/FileUploadWidget.tsx';
import NodeInput from './handles/NodeInput.tsx';
import NodeOutput from './handles/NodeOutput.tsx';


function PythonNode({ id, data, onWidgetValuesChange }) {
  const [widgetValues, setWidgetValues] = useState(() => {
    // Initialize with either existing widgetValues or default values
    if (data.widgetValues && Object.keys(data.widgetValues).length > 0) {
      return { ...data.widgetValues };
    }
    const values = {};
    data.widgets?.forEach(widget => {
      values[widget.name] = widget.value || (
        widget.type === 'dropdown' ? widget.options[0] :
          widget.type === 'slider' ? (widget.min || 0) :
            ''
      );
    });
    onWidgetValuesChange?.(values);
    return values;
  });

  // Sync widgetValues when updates come from backend
  useEffect(() => {
    if (data.widgetValues) {
      setWidgetValues(prev => ({
        ...prev,
        ...data.widgetValues
      }));
    }
  }, [data.widgetValues]);

  const onChange = useCallback((evt) => {
    const { name, value } = evt.target;
    console.log('onChange', name, value, widgetValues)
    const newValues = {
      ...widgetValues,
      [name]: value
    };
    setWidgetValues(newValues);
    onWidgetValuesChange?.(newValues);
  }, [widgetValues, onWidgetValuesChange]);

  const renderWidget = (widget) => {
    const widgetWithValues = {
      ...widget,
      widgetValues: widgetValues  // Use local state instead of data.widgetValues
    };

    switch (widget.type) {
      case 'dropdown':
        return <DropdownWidget
          key={widget.name}
          widget={widgetWithValues}
          onChange={onChange}
        />;
      case 'slider':
        return <SliderWidget
          key={widget.name}
          widget={widgetWithValues}
          onChange={onChange}
        />;
      case 'textarea':
        return <TextAreaWidget
          key={widget.name}
          widget={widgetWithValues}
          onChange={onChange}
        />;
      case 'image':
        return <ImageWidget
          key={widget.name}
          widget={widgetWithValues}
          onChange={onWidgetValuesChange}
        />;
      case 'file_upload':
        return <FileUploadWidget
          key={widget.name}
          widget={widgetWithValues}
          onChange={onChange}
        />;
      default:
        return <InputWidget
          key={widget.name}
          widget={widgetWithValues}
          onChange={onChange}
        />;
    }
  };
  const { inputs, outputs, widgets, widgetTopPadding, spacing, topPadding } = useMemo(() => {
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

