import { validateImage } from '../../utils/mediaValidation';

const ImageFileUploadWidget = ({ widget, onChange }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.isValid) {
      console.warn(validation.error);
      event.target.value = ''; // Reset the input
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onChange({
        target: {
          name: widget.name,
          value: e.target.result
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const imageUrl = widget.widgetValues?.[widget.name] ?? widget.value ?? '';

  return (
    <div style={{ padding: '0px 0px 10px 0px', position: 'relative' }}>
      {imageUrl && (
        <div style={{ marginTop: '10px' }}>
          <img
            src={imageUrl}
            alt={widget.name}
            style={{
              width: 'calc(100% - 40px)',
              height: 'auto',
              maxHeight: '200px',
              objectFit: 'contain',
              borderRadius: '5px',
              backgroundColor: '#1e1e1e',
              display: 'block',
              margin: '0 auto'
            }}
            onError={(e) => console.error('Image failed to load:', e)}
          />
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        id={widget.name}
        name={widget.name}
        onChange={handleFileChange}
        className="nodrag"
        style={{
          width: 'calc(100% - 40px)',
          padding: '8px',
          border: '1px solid #333',
          borderRadius: '5px',
          fontSize: '12px',
          backgroundColor: '#1e1e1e',
          color: '#fff',
          paddingLeft: '7px',
          paddingTop: '12px'
        }}
      />
    </div>
  );
};

export default ImageFileUploadWidget;

