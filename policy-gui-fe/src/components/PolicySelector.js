import React from 'react';
import '../styles/PolicySelector.css';

function PolicySelector({ value, onChange }) {
  return (
    <div className="policy-selector">
      <label>Select Policy Type:</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">-- Choose Policy Type --</option>
        <option value="config">Configuration Policy</option>
        <option value="security">Security Policy</option>
        <option value="user">User Policy</option>
      </select>
    </div>
  );
}

export default PolicySelector;
