import React from 'react';
import '../styles/FieldPermissionsTable.css';

function FieldPermissionsTable({ fieldPermissions, onChange }) {
  console.log("FieldPermissionsTable received:", fieldPermissions);
  
  // Extract all policy types and their fields
  const policyTypes = Object.keys(fieldPermissions || {});
  
  console.log("Policy types found:", policyTypes);

  const handleFieldChange = (policyType, fieldName, value) => {
    const updated = { ...fieldPermissions };
    if (!updated[policyType]) {
      updated[policyType] = {};
    }
    updated[policyType][fieldName] = value;
    onChange(updated);
  };

  return (
    <div className="field-permissions-tables-wrapper">
      {policyTypes.map(policyType => {
        const fields = fieldPermissions[policyType] || {};
        const fieldNames = Object.keys(fields);
        
        if (fieldNames.length === 0) return null;

        return (
          <div key={policyType} className="policy-type-table-container">
            <h5 className="policy-type-title">
              {policyType.charAt(0).toUpperCase() + policyType.slice(1)} Policy Permissions
            </h5>
            <div className="field-permissions-table-wrapper">
              <table className="field-permissions-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Allowed</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldNames.map(fieldName => {
                    const isAllowed = fields[fieldName] || false;
                    return (
                      <tr key={fieldName}>
                        <td className="field-name">
                          <span className="field-label">{fieldName}</span>
                        </td>
                        <td className="permission-cell">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={(e) => handleFieldChange(policyType, fieldName, e.target.checked)}
                            className="field-permission-checkbox"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FieldPermissionsTable; 