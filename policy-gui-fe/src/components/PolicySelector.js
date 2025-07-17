import React, { useEffect, useState, useMemo } from 'react';
import { fetchPolicyTypes } from '../services/api';
import '../styles/PolicySelector.css';

function PolicySelector({ value, onChange, allowedPolicyTypes }) {
  const [types, setTypes] = useState([]);

  useEffect(() => {
    fetchPolicyTypes().then(setTypes);
  }, []);

  useEffect(() => {
    console.log("PolicySelector types:", types);
    console.log("PolicySelector allowedPolicyTypes:", allowedPolicyTypes);
  }, [types]);


  return (
    <div className="policy-selector">
      <label>Select Policy Type:</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">-- Choose Policy Type --</option>
        {types
          .filter(t => {
            // if wildcard, allow all
            if (allowedPolicyTypes.includes('*')) return true;

            // else strip "_policy" and check
            const baseType = t.type.endsWith('_policy')
              ? t.type.slice(0, -7)
              : t.type;
            return allowedPolicyTypes.includes(baseType);
          })
          .map(({ type, name }) => (
            <option key={type} value={type}>
              {name}
            </option>
          ))}
      </select>
    </div>
  );
}

export default PolicySelector;
