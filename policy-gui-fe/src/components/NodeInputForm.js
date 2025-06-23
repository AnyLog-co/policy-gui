import React, { useState } from 'react';
import { pingBackend } from '../services/api'; // Adjust the import path as necessary

function NodeInputForm() {
  const [nodeAddress, setNodeAddress] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [pingResult, setPingResult] = useState(null);

  const handleInputChange = (event) => {
    setNodeAddress(event.target.value);
  };

  const handleDropdownChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handlePingClick = async () => {
    const result = await pingBackend();
    setPingResult(result ? result.message : 'Error');
  };

  return (
    <div style={styles.container}>
      <h2>Connect to AnyLog Node</h2>

      <div style={styles.field}>
        <label>Node Address (IP:Port):</label>
        <input
          type="text"
          value={nodeAddress}
          onChange={handleInputChange}
          placeholder="e.g. 127.0.0.1:7848"
          style={styles.input}
        />
      </div>

      <div style={styles.field}>
        <label>Select Policy Type:</label>
        <select
          value={selectedOption}
          onChange={handleDropdownChange}
          style={styles.select}
        >
          <option value="">-- Choose Policy Type --</option>
          <option value="config">Configuration Policy</option>
          <option value="security">Security Policy</option>
        </select>
      </div>

      <button onClick={handlePingClick} style={styles.button}>
        Ping Backend
      </button>

      {pingResult && (
        <div style={styles.preview}>
          <p><strong>Backend Response:</strong> {pingResult}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '400px',
    margin: '40px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9f9f9',
  },
  field: {
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '8px',
    marginTop: '6px',
    fontSize: '14px',
  },
  select: {
    width: '100%',
    padding: '8px',
    marginTop: '6px',
    fontSize: '14px',
  },
  button: {
    padding: '8px 16px',
    fontSize: '14px',
    marginTop: '10px',
    cursor: 'pointer',
  },
  preview: {
    marginTop: '20px',
    fontSize: '14px',
  },
};

export default NodeInputForm;
