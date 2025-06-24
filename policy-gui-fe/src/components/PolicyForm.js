import React from 'react';

function PolicyForm({ type, formData, onChange }) {
  if (!type) return null;

  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div>
      <h4>{type === 'config' ? 'Configuration' : 'Security'} Form</h4>
      <label>Policy Name:</label>
      <input
        type="text"
        value={formData.name || ''}
        onChange={e => handleChange('name', e.target.value)}
      />
      {type === 'config' && (
        <>
          <label>Local IP:</label>
          <input
            type="text"
            value={formData.local_ip || ''}
            onChange={e => handleChange('local_ip', e.target.value)}
          />
        </>
      )}
      {/* Add more fields per policy as needed */}
    </div>
  );
}

export default PolicyForm;
