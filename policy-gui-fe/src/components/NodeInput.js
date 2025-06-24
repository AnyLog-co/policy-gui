import React from 'react';

function NodeInput({ value, onChange }) {
  return (
    <div>
      <label>Node Address (IP:Port):</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. 127.0.0.1:7848"
      />
    </div>
  );
}

export default NodeInput;
