import React, { useCallback, memo, useMemo, useState, useEffect } from 'react';

import InputWidget from './widgets/InputWidget.tsx';
import DropdownWidget from './widgets/DropdownWidget.tsx';
import SliderWidget from './widgets/SliderWidget.tsx';
import TextAreaWidget from './widgets/TextAreaWidget.tsx';
import ImageWidget from './widgets/ImageWidget.tsx';
import FileUploadWidget from './widgets/FileUploadWidget.tsx';
import ImageFileUploadWidget from './widgets/ImageFileUploadWidget.tsx';
import VideoFileUploadWidget from './widgets/VideoFileUploadWidget.tsx';
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

  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false)

  useEffect(() => {
    if (data.isCollapsed !== undefined) {
      setIsCollapsed(data.isCollapsed);
    }
  }, [data.isCollapsed]);

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
      case 'image_file_upload':
        return <ImageFileUploadWidget
          key={widget.name}
          widget={widgetWithValues}
          onChange={onChange}
        />;

      case 'video_file_upload':
        return <VideoFileUploadWidget
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
    <div style={{
      display: 'grid',
      gridTemplateRows: 'auto auto 1fr',
      gap: '0px',
      width: '100%',
      height: '100%',
      padding: '0px 15px 15px 15px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '50px 1fr 50px',
        position: 'relative'
      }}>
        <div style={{ position: 'relative' }}>
          {inputs.map((input, index) => (
            <NodeInput
              key={input.name}
              input={input}
              spacing={spacing}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', fontSize: '8px', fontWeight: 'bold', position: 'sticky', top: '0', backgroundColor: '#1e1e1e', padding: '0px', borderRadius: '5px', zIndex: -1 }}>
          {data.label}
        </div>

        <div style={{ position: 'relative' }}>
          {outputs.map((output, index) => (
            <NodeOutput
              key={output.name}
              output={output}
              spacing={spacing}
            />
          ))}
        </div>
      </div>
      {!isCollapsed && (
        <>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '10px 0'
          }}>
            {widgets.map((widget) => renderWidget(widget))}
          </div>

        </>
      )}
    </div>
  );
}

export default memo(PythonNode, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});

