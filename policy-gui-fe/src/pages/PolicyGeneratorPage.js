import React, { useState } from 'react';
import NodeInput from '../components/NodeInput';
import PolicySelector from '../components/PolicySelector';
import PolicyForm from '../components/PolicyForm';
import { submitPolicy } from '../services/api'; 

function PolicyGeneratorPage() {
  const [node, setNode] = useState('');
  const [policyType, setPolicyType] = useState('');
  const [formData, setFormData] = useState({});
  const [response, setResponse] = useState(null);

  const handleSubmit = async () => {
    const res = await submitPolicy(node, policyType, formData);
    setResponse(res);
  };

  return (
    <div>
      <NodeInput value={node} onChange={setNode} />
      <PolicySelector value={policyType} onChange={setPolicyType} />
      <PolicyForm type={policyType} formData={formData} onChange={setFormData} />
      
      <button onClick={handleSubmit} style={{ marginTop: '20px' }}>
        Submit Policy
      </button>

      {response && (
        <div style={{ marginTop: '20px' }}>
          <h4>API Response:</h4>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default PolicyGeneratorPage;
