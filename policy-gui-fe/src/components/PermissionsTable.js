// import React from 'react';
// import '../styles/PermissionsTable.css';

// function PermissionsTable({ permissions, selectedPermissions, onChange }) {
//   const handleCheckbox = (perm) => {
//     let updated;
//     if (selectedPermissions.includes(perm)) {
//       updated = selectedPermissions.filter(p => p !== perm);
//     } else {
//       updated = [...selectedPermissions, perm];
//     }
//     onChange(updated);
//   };

//   return (
//     <div className="permissions-table-wrapper">
//       <table className="permissions-table">
//         <thead>
//           <tr>
//             <th>Permission</th>
//             <th>Allowed</th>
//           </tr>
//         </thead>
//         <tbody>
//           {permissions.map((perm) => (
//             <tr key={perm}>
//               <td>{perm}</td>
//               <td>
//                 <input
//                   type="checkbox"
//                   checked={selectedPermissions.includes(perm)}
//                   onChange={() => handleCheckbox(perm)}
//                   className="permission-checkbox"
//                 />
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default PermissionsTable;

import React from 'react';
import '../styles/PermissionsTable.css';

function PermissionsTable({ permissions, selectedPermissions, onChange }) {
  // Compute whether everything is currently selected
  const allSelected = permissions.length > 0 && selectedPermissions.length === permissions.length;

  // Toggle a single checkbox
  const handleCheckbox = (perm) => {
    let updated;
    if (selectedPermissions.includes(perm)) {
      updated = selectedPermissions.filter(p => p !== perm);
    } else {
      updated = [...selectedPermissions, perm];
    }
    onChange(updated);
  };

  // Toggle the “Select All” checkbox
  const handleSelectAll = () => {
    if (allSelected) {
      onChange([]);           // Uncheck all
    } else {
      onChange([...permissions]); // Check all
    }
  };

  return (
    <div className="permissions-table-wrapper">
      <table className="permissions-table">
        <thead>
          <tr>
            <th>Permission</th>
            <th>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Allowed
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="permission-checkbox"
                />
              </label>
            </th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((perm) => (
            <tr key={perm}>
              <td>{perm}</td>
              <td>
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(perm)}
                  onChange={() => handleCheckbox(perm)}
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

export default PermissionsTable;
