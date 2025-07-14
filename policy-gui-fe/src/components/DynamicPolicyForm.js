import React, { useState, useEffect } from 'react';
import { fetchNodeOptions, fetchTableOptions } from '../services/api';
import '../styles/DynamicPolicyForm.css';

function DynamicPolicyForm({ template, formData, onChange, node }) {
  const [dynamicOptions, setDynamicOptions] = useState({});

  useEffect(() => {
    async function fetchOptions() {
      if (!template || !node) return;

      const updated = { ...dynamicOptions };

      for (const field of template.fields) {
        if (field.type === 'node' && !updated[field.name]) {
          updated[field.name] = await fetchNodeOptions(node);
        } else if (field.type === 'table' && !updated[field.name]) {
          updated[field.name] = await fetchTableOptions(node);
        }
      }

      setDynamicOptions(updated);
    }

    fetchOptions();
  }, [template, node]);

  function renderFieldInput(field, value, onChange) {
    const handleChange = (e) => {
      let val = e.target.value;

      switch (field.type) {
        case 'integer':
          val = parseInt(val, 10) || 0;
          break;
        case 'float':
          val = parseFloat(val) || 0;
          break;
        case 'boolean':
          val = e.target.checked;
          break;
        default:
          break;
      }

      onChange(field.name, val);
    };

    const dynamic = dynamicOptions[field.name];

    if (field.type === 'select' || field.type === 'node' || field.type === 'table') {
      const options = field.options || dynamic || [];
      return (
        <select value={value || ''} onChange={handleChange}>
          <option value="">-- Select --</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    switch (field.type) {
      case 'textarea':
        return (
          <textarea value={value || ''} onChange={handleChange} rows="4" />
        );
      case 'array':
        return (
          <div className="array-input">
            <div className="array-list">
              {(value || []).map((item, idx) => (
                <div key={idx} className="array-item">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newArray = [...value];
                      newArray[idx] = e.target.value;
                      onChange(field.name, newArray);
                    }}
                  />
                  <button onClick={() => {
                    const newArray = (value || []).filter((_, i) => i !== idx);
                    onChange(field.name, newArray);
                  }}>Remove</button>
                </div>
              ))}
            </div>
            <button onClick={() => onChange(field.name, [...(value || []), ""])}>Add Item</button>
          </div>
        );

      case 'boolean':
        return (
          <input type="checkbox" checked={value || false} onChange={handleChange} />
        );
      case 'integer':
      case 'float':
        return (
          <input type="number" value={value || ''} onChange={handleChange} />
        );
      default:
        return (
          <input type="text" value={value || ''} onChange={handleChange} />
        );
    }
  }

  function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  if (!template || !template.fields) return null;

  return (
    <div className="dynamic-policy-form">
      <h4>{capitalizeFirstLetter(template.policy_type)} Policy Form</h4>
      {template.fields.map((field) => {
        if (field.type === 'generated') return null;

        return (
          <div key={field.name} className="dynamic-policy-form-field">
            <label className="dynamic-policy-form-label">
              {field.name}
              {field.required && <span className="required-asterisk"> *</span>}
              <span className="tooltip-icon">ⓘ
                <span className="tooltip-text">
                  {field.description} {field.required ? "(Required)" : ""}
                </span>
              </span>
            </label>
            {renderFieldInput(field, formData[field.name], (name, val) => onChange({ ...formData, [name]: val }))}
          </div>
        );
      })}
    </div>
  );
}

export default DynamicPolicyForm;
