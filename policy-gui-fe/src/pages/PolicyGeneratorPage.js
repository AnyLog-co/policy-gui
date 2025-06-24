import React, { useState, useEffect } from 'react';
import NodeInput from '../components/NodeInput';
import PolicySelector from '../components/PolicySelector';
import DynamicPolicyForm from '../components/DynamicPolicyForm';
import { getPolicyTemplate, submitPolicy } from '../services/api';
import '../styles/PolicyGeneratorPage.css'; // Adjust the path as necessary

function PolicyGeneratorPage() {
  const [node, setNode] = useState('');
  const [policyType, setPolicyType] = useState('');
  const [formTemplate, setFormTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [response, setResponse] = useState(null);

  useEffect(() => {
    if (!policyType) return;

    setFormTemplate(null);
    setFormData({});

    getPolicyTemplate(policyType).then((template) => {
      if (template) setFormTemplate(template);
    });
  }, [policyType]);

  const handleSubmit = async () => {
    const result = await submitPolicy(node, policyType, formData);

    if (result.success) {
      setResponse({ status: 'success', message: result.data.message, policy: result.data.policy });
    } else {
      setResponse({ status: 'error', message: result.error });
    }
  };

  return (
    <div className="policy-generator">
      <NodeInput value={node} onChange={setNode} />
      <PolicySelector value={policyType} onChange={setPolicyType} />
      <DynamicPolicyForm
        template={formTemplate}
        formData={formData}
        onChange={setFormData}
      />

      {formTemplate && (
        <button onClick={handleSubmit}>
          Submit Policy
        </button>
      )}

      {response && (
        <div className="response">
          <h4>Response:</h4>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default PolicyGeneratorPage;
