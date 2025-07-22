import React from 'react';
import '../styles/PermissionsTable.css'; // Reuse the same styles

function TableTable({ groups, selectedGroups, onChange }) {

  const allSelected = groups.length > 0 && selectedGroups.length === groups.length;

  const handleCheckbox = (group) => {
    let updated;
    if (selectedGroups.includes(group)) {
      updated = selectedGroups.filter(g => g !== group);
    } else {
      updated = [...selectedGroups, group];
    }
    onChange(updated);
  };

  // Toggle the “Select All” checkbox
  const handleSelectAll = () => {
    if (allSelected) {
      onChange([]);           // Uncheck all
    } else {
      onChange([...groups]); // Check all
    }
  };

  return (
    <div className="permissions-table-wrapper">
      <table className="permissions-table">
        <thead>
          <tr>
            <th>Table Name</th>
            <th><label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Allowed
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="permission-checkbox"
              />
            </label></th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group}>
              <td>{group}</td>
              <td>
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(group)}
                  onChange={() => handleCheckbox(group)}
                  className="permission-checkbox"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableTable; 