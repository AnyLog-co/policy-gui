import React from 'react';

function PolicySelector({ value, onChange }) {
  return (
    <div>
      <label>Select Policy Type:</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">-- Choose Policy Type --</option>
        <option value="config">Configuration Policy</option>
        <option value="security">Security Policy</option>
      </select>
    </div>
  );
}

export default PolicySelector;
