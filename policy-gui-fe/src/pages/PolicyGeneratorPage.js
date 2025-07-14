import React, { useState, useEffect } from 'react';
import NodeInput from '../components/NodeInput';
import PolicySelector from '../components/PolicySelector';
import DynamicPolicyForm from '../components/DynamicPolicyForm';
import SSLConfig from '../components/SSLConfig';
import { getPolicyTemplate, submitPolicy, fetchPermissions } from '../services/api';
import '../styles/PolicyGeneratorPage.css'; // Adjust the path as necessary


function PolicyGeneratorPage() {
  // const [node, setNode] = useState('45.33.110.211:32549'); // Default node
  const [node, setNode] = useState('192.168.86.21:32049'); // Default node
  const [permissions, setPermissions] = useState(null);
  const [policyType, setPolicyType] = useState('');
  const [formTemplate, setFormTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [response, setResponse] = useState(null);
  const [sslEnabled, setSSLEnabled] = useState(false);
  const [sslFiles, setSSLFiles] = useState({});


  useEffect(() => {
    if (!node) return;
    fetchPermissions(node)
      .then(perms => setPermissions(perms))
      .catch(err => {
        console.error('failed to load permissions', err);
        setPermissions(null);
      });
  }, [node]);

  useEffect(() => {
    if (!policyType) return;

    setFormTemplate(null);
    setFormData({});

    getPolicyTemplate(policyType).then((template) => {
      if (template) setFormTemplate(template);
    });
  }, [policyType]);

  const handleSubmit = async () => {
    const missingFields = formTemplate.fields
      .filter(f => f.required && f.type !== "generated")
      .filter(f => {
        const val = formData[f.name];
        return val === undefined || val === null || val === '';
      });

    if (missingFields.length > 0) {
      alert(`Please fill out all required fields: ${missingFields.map(f => f.name).join(", ")}`);
      return;
    }
    const result = await submitPolicy(node, policyType, formData);
    console.log('Submit result:', result);


    if (result.success) {
      setResponse({ status: 'success', policy: result.data[result.data.length - 1] });
      // setResponse(result);
    } else {
      setResponse({ status: 'error', message: result.error });
    }
  };



  return (
    <div className="policy-generator">
      <NodeInput value={node} onChange={setNode} />
      <SSLConfig
        sslEnabled={sslEnabled}
        setSSLEnabled={setSSLEnabled}
        sslFiles={sslFiles}
        setSSLFiles={setSSLFiles}
      />
      <PolicySelector value={policyType} onChange={setPolicyType} />
      <DynamicPolicyForm
        template={formTemplate}
        formData={formData}
        node={node}
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
