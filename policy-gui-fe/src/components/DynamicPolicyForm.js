import React from 'react';
import '../styles/DynamicPolicyForm.css'; // Assuming you have a CSS file for styles

function DynamicPolicyForm({ template, formData, onChange }) {
  if (!template || !template.fields) return null;

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
          // keep string value for text, textarea, select
          break;
      }

      onChange(field.name, val);
    };

    switch (field.type) {
      case 'select':
        return (
          <select value={value || ''} onChange={handleChange}>
            <option value="">-- Select --</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea value={value || ''} onChange={handleChange} rows="4" />
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
      default: // fallback to text
        return (
          <input type="text" value={value || ''} onChange={handleChange} />
        );
    }
  }

  return (
    <div className="dynamic-policy-form">
      <h4>{template.policy_type} Policy Form</h4>
      {template.fields.map((field) => {
        if (field.type === 'generated') return null;

        return (
          <div key={field.name} className="dynamic-policy-form-field">
            <label className="dynamic-policy-form-label">
              {field.name}
              <span className="tooltip-icon">ⓘ
                <span className="tooltip-text">{field.description}</span>
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
