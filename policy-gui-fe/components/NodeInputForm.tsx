import React, { useState } from 'react';

const NodeInputForm: React.FC = () => {
  const [nodeAddress, setNodeAddress] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNodeAddress(e.target.value);
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(e.target.value);
  };

  return (
    <div className="p-4 max-w-md mx-auto rounded shadow bg-white space-y-4">
      <h2 className="text-lg font-semibold">Connect to AnyLog Node</h2>

      {/* IP:Port Input */}
      <div>
        <label htmlFor="node-address" className="block font-medium">
          Node Address (IP:Port)
        </label>
        <input
          id="node-address"
          type="text"
          value={nodeAddress}
          onChange={handleInputChange}
          placeholder="e.g. 127.0.0.1:7848"
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Dropdown */}
      <div>
        <label htmlFor="policy-type" className="block font-medium">
          Policy Type
        </label>
        <select
          id="policy-type"
          value={selectedOption}
          onChange={handleDropdownChange}
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="" disabled>Select a policy type</option>
          <option value="config">Configuration Policy</option>
          <option value="security">Security Policy</option>
        </select>
      </div>

      {/* Preview (Optional) */}
      <div className="text-sm text-gray-600">
        <p><strong>Selected Node:</strong> {nodeAddress || 'None'}</p>
        <p><strong>Selected Policy Type:</strong> {selectedOption || 'None'}</p>
      </div>
    </div>
  );
};

export default NodeInputForm;
