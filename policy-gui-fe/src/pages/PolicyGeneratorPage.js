import React, { useState, useEffect } from 'react';
import NodeInput from '../components/NodeInput';
import PolicySelector from '../components/PolicySelector';
import DynamicPolicyForm from '../components/DynamicPolicyForm';
import SSLConfig from '../components/SSLConfig';
// import AssignmentManager from '../components/AssignmentManager';
import { getPolicyTemplate, submitPolicy, fetchUserPermissions } from '../services/api';
import '../styles/PolicyGeneratorPage.css'; // Adjust the path as necessary

// Main page for generating and submitting policies
function PolicyGeneratorPage({ authenticatedNode, memberPolicy, onNodeChange }) {
  // State for the currently selected node
  const [node, setNode] = useState(authenticatedNode || '192.168.86.21:32049'); // Use authenticated node if available
  // State for permissions fetched from the backend
  const [permissions, setPermissions] = useState(null);
  // State for the selected policy type
  const [policyType, setPolicyType] = useState('');
  // State for the current policy template (schema)
  const [formTemplate, setFormTemplate] = useState(null);
  // State for the form data (user input)
  const [formData, setFormData] = useState({});
  // State for the backend response after submitting a policy
  const [response, setResponse] = useState(null);
  // SSL config state
  const [sslEnabled, setSSLEnabled] = useState(false);
  const [sslFiles, setSSLFiles] = useState({});
  // Node change UI state
  const [showNodeChange, setShowNodeChange] = useState(false);
  const [newNodeAddress, setNewNodeAddress] = useState('');
  const [isChangingNode, setIsChangingNode] = useState(false);
  // State for user permissions
  const [userPermissions, setUserPermissions] = useState(null);
  // State for preview visibility
  const [showPreview, setShowPreview] = useState(true);
  // State for loading during submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State to trigger refresh of dynamic data
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // State for assignment manager visibility
  // const [showAssignmentManager, setShowAssignmentManager] = useState(false);

  // Update node when authenticatedNode changes (e.g., after login or node switch)
  useEffect(() => {
    if (authenticatedNode) {
      setNode(authenticatedNode);
    }
  }, [authenticatedNode]);

  // Fetch permissions from the backend whenever the node changes
  useEffect(() => {
    if (!node) return;
    // console.log("Fetching permissions for:", authenticatedNode);
    // console.log("memberPolicy:", memberPolicy);
    // fetchAvailablePermissions(node)
    //   .then(perms => setPermissions(perms))
    //   .catch(err => {
    //     console.error('failed to load permissions', err);
    //     setPermissions(null);
    //   });

    fetchUserPermissions(node, memberPolicy[0].member.public_key)
      .then(result => {
        if (result.success) {
          setUserPermissions(result.data);
        } else {
          console.log("DIDNT WORK");
          setUserPermissions(null);
        }
      });
  }, [node]);

  // Fetch the policy template whenever the policy type changes
  useEffect(() => {
    if (!policyType) return;

    setFormTemplate(null);
    setFormData({});

    getPolicyTemplate(policyType).then((template) => {
      if (template) setFormTemplate(template);
    });
  }, [policyType]);

  // Handle form submission for creating a policy
  const handleSubmit = async () => {
    // Check for missing required fields (excluding generated fields)
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

    // Set loading state and clear previous response
    setIsSubmitting(true);
    setResponse(null);

    try {
    // Submit the policy to the backend
    console.log('Submitting policy to backend:', formData);
    const result = await submitPolicy(node, policyType, formData);
    console.log('Submit result:', result);

    if (result.success) {
      // Show the last policy in the response (if multiple)
      setResponse({ status: 'success', policy: result.data[result.data.length - 1] });
        // Trigger refresh of dynamic data (permissions, etc.)
        setRefreshTrigger(prev => prev + 1);
      // setResponse(result);
    } else {
      setResponse({ status: 'error', message: result.error });
      }
    } catch (error) {
      console.error('Error submitting policy:', error);
      setResponse({ status: 'error', message: 'An unexpected error occurred while submitting the policy.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle node change form submission
  const handleNodeChangeSubmit = async (e) => {
    e.preventDefault();
    if (!newNodeAddress.trim()) return;

    setIsChangingNode(true);
    try {
      await onNodeChange(newNodeAddress.trim());
      setShowNodeChange(false);
      setNewNodeAddress('');
    } catch (error) {
      console.error('Error changing node:', error);
    } finally {
      setIsChangingNode(false);
    }
  };

  // Render member policy info if available
  const renderMemberPolicyInfo = () => {
    if (!memberPolicy) return null;

    // return (
    //   <div className="member-policy-info">
    //     <h3>Member Policy Information</h3>
    //     <div className="policy-details">
    //       <pre>{JSON.stringify(memberPolicy, null, 2)}</pre>
    //     </div>
    //   </div>
    // );

    const { security_group, name } = memberPolicy[0].member;
    return (
      <div className="member-policy-info">
        <h3>Member Policy Information</h3>
        <div className="policy-details">
          <div><strong>Name:</strong> {name}</div>
          <div><strong>Security Group:</strong> {security_group}</div>
        </div>
      </div>
    );
  };

  // Render the node change interface (input for new node address)
  const renderNodeChangeInterface = () => {
    if (!showNodeChange) return null;

    return (
      <div className="node-change-interface">
        <h3>Change Node Connection</h3>
        <p>Enter a new node address to connect to while keeping your current public key.</p>

        <form onSubmit={handleNodeChangeSubmit}>
          <div className="form-group">
            <label htmlFor="newNodeAddress">New Node Address (IP:Port)</label>
            <input
              type="text"
              id="newNodeAddress"
              value={newNodeAddress}
              onChange={(e) => setNewNodeAddress(e.target.value)}
              placeholder="e.g. 192.168.1.100:7848"
              required
            />
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="change-node-button"
              disabled={isChangingNode}
            >
              {isChangingNode ? 'Connecting...' : 'Connect to New Node'}
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setShowNodeChange(false);
                setNewNodeAddress('');
              }}
              disabled={isChangingNode}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Main render
  return (
    <div className="policy-generator">
      {/* Show node info and member policy if authenticated */}
      {authenticatedNode && (
        <div className="authenticated-node-info">
          <div className="node-header">
            <h3>Connected to Node: {authenticatedNode}</h3>
            <button
              className="change-node-toggle"
              onClick={() => setShowNodeChange(!showNodeChange)}
            >
              {showNodeChange ? 'Cancel' : 'Change Node'}
            </button>
          </div>

          {renderNodeChangeInterface()}
          {renderMemberPolicyInfo()}

          {/* DEBUGGING USER PERMISSIONS */}
          {/* {userPermissions && (
            <div className="user-permissions-info">
              <h4>User Permissions</h4>
              <pre>{JSON.stringify(userPermissions, null, 2)}</pre>
            </div>
          )} */}
        </div>
      )}

      {/* Show node input if not authenticated */}
      {!authenticatedNode && (
        <NodeInput value={node} onChange={setNode} />
      )}

      {/* SSL config section */}
      {/* <SSLConfig
        sslEnabled={sslEnabled}
        setSSLEnabled={setSSLEnabled}
        sslFiles={sslFiles}
        setSSLFiles={setSSLFiles}
      /> */}
      {/* Policy type selector */}
      {userPermissions && (
        <PolicySelector value={policyType} onChange={setPolicyType} allowedPolicyTypes={userPermissions.allowed_policy_types} />
      )}

      {/* Preview toggle and refresh buttons */}
      {userPermissions && formTemplate && (
        <div className="form-controls">
          <div className="preview-toggle">
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className="preview-toggle-button"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
          {/* REFRESH BUTTON FOR DEBUGGING */}
          {/* <div className="refresh-controls">
            <button 
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="refresh-button"
              title="Refresh available options (permissions, nodes, etc.)"
            >
              🔄 Refresh Options
            </button>
          </div> */}
        </div>
      )}

      {/* Dynamic form for the selected policy template */}
      {userPermissions && (
        <DynamicPolicyForm
          template={formTemplate}
          formData={formData}
          node={node}
          onChange={setFormData}
          allowedPolicyFields={userPermissions.allowed_policy_fields}
          showPreview={showPreview}
          refreshTrigger={refreshTrigger}
        />
      )}

      {/* Submit button for the form */}
      {userPermissions && formTemplate && (
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Policy'}
        </button>
      )}



      {/* Loading overlay during submission */}
      {isSubmitting && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Submitting policy...</p>
          </div>
        </div>
      )}

      {/* Show backend response after submission */}
      {response && (
        <div className="response">
          <h4>Response:</h4>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {/* Assignment Manager Section
      {userPermissions && (
        <div className="assignment-manager-section">
          <div className="section-header">
            <h3>Assignment Policy Management</h3>
            <button 
              onClick={() => setShowAssignmentManager(!showAssignmentManager)}
              className="toggle-button"
            >
              {showAssignmentManager ? 'Hide' : 'Show'} Assignment Manager
            </button>
          </div>
          
          {showAssignmentManager && (
            <AssignmentManager node={node} />
          )}
        </div>
      )} */}
    </div>
  );
}

export default PolicyGeneratorPage;
