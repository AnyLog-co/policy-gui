import React, { useEffect, useState } from 'react';
import { fetchPolicyTypes } from '../services/api';
import '../styles/PolicySelector.css';

function PolicySelector({ value, onChange }) {
  const [types, setTypes] = useState([]);

  useEffect(() => {
    fetchPolicyTypes().then(setTypes);
  }, []);

  return (
    <div className="policy-selector">
      <label>Select Policy Type:</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">-- Choose Policy Type --</option>
        {types.map(({ type, name }) => (
          <option key={type} value={type}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default PolicySelector;
