import React, { useState, useEffect } from 'react';
import { fetchNodeOptions, fetchTableOptions } from '../services/api';
import '../styles/DynamicPolicyForm.css';

// DynamicPolicyForm renders a form based on a policy template definition
function DynamicPolicyForm({ template, formData, onChange, node, allowedPolicyFields }) {
  // State for dynamic options (e.g., node or table options fetched from backend)
  const [dynamicOptions, setDynamicOptions] = useState({});
  const [allowedFields, setAllowedFields] = useState([]);


  useEffect(() => {
    console.log("DynamicPolicyForm template:", template);
    console.log("Allowed Policy Fields", allowedPolicyFields)

    if (template && template.policy_type && allowedPolicyFields) {
      // Initialize allowed fields from the template
      const type = template.policy_type
      console.log("DynamicPolicyForm type:", type);

      const allowed = Object.keys(allowedPolicyFields[type] || {});

      // const fields = template.fields.map(f => f.name);
      setAllowedFields(allowed);

      // // If allowedPolicyFields is provided, filter the template fields
      // if (allowedPolicyFields) {
      //   const filteredFields = template.fields.filter(f => allowedPolicyFields.includes(f.name));
      //   template.fields = filteredFields;
      // }
    }

  }, [template, allowedPolicyFields]);

  // Fetch dynamic options for fields of type 'node' or 'table' when template or node changes
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

  // Renders the appropriate input for a given field definition
  function renderFieldInput(field, value, onChange) {
    // Handles value changes for different field types
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

    // Use dynamic options if available (for node/table fields)
    const dynamic = dynamicOptions[field.name];

    // Render select dropdown for select, node, or table fields
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

    // Render input for other field types
    switch (field.type) {
      case 'textarea':
        return (
          <textarea value={value || ''} onChange={handleChange} rows="4" />
        );
      case 'array':
        // Render an array input with add/remove functionality
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
      case 'object':
        // Render nested object fields recursively
        return (
          <div style={{ marginLeft: 16, paddingLeft: 8, borderLeft: '2px solid #e5e7eb' }}>
            <strong>{field.label || field.name}</strong>
            {field.fields && field.fields.map((subField) => (
              <div key={subField.name} style={{ marginTop: 8 }}>
                <label>
                  {subField.label || subField.name}
                  {subField.required && <span className="required-asterisk"> *</span>}
                  <span className="tooltip-icon">ⓘ
                    <span className="tooltip-text">
                      {subField.description} {subField.required ? "(Required)" : ""}
                    </span>
                  </span>
                </label>
                {renderFieldInput(
                  subField,
                  (value && typeof value === 'object') ? value[subField.name] : undefined,
                  (subName, subVal) => {
                    const newObj = { ...(value && typeof value === 'object' ? value : {}) };
                    newObj[subName] = subVal;
                    onChange(field.name, newObj);
                  }
                )}
              </div>
            ))}
          </div>
        );
      default:
        // Default to text input for unknown types
        return (
          <input type="text" value={value || ''} onChange={handleChange} />
        );
    }
  }

  // Capitalizes the first letter of a string (for display)
  function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // If no template or fields, render nothing
  if (!template || !template.fields) return null;

  // Main render: map over fields and render each input
  return (
    <div className="dynamic-policy-form">
      <h4>{capitalizeFirstLetter(template.name)} Policy Form</h4>
      {template.fields.map((field) => {
        if (field.type === 'generated') return null; // Skip generated fields

        // If allowedPolicyFields is provided, skip fields not in the allowed list
        if (allowedFields.length > 0 && !allowedFields.includes(field.name)) {
          return null; // Skip fields not in allowed list
        }

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
