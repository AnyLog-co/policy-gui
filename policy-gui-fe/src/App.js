import React, { useState } from 'react';
import PolicyGeneratorPage from './pages/PolicyGeneratorPage';
import LoginForm from './components/LoginForm';
import { login } from './services/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const handleLoginSuccess = (loginData) => {
    setUserInfo(loginData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUserInfo(null);
    setIsAuthenticated(false);
  };

  const handleNodeChange = async (newNode) => {
    if (!userInfo?.pubkey) {
      console.error('No pubkey available for re-authentication');
      return;
    }

    try {
      const result = await login(newNode, userInfo.pubkey);
      
      if (result.success) {
        setUserInfo({
          node: newNode,
          pubkey: userInfo.pubkey,
          memberPolicy: result.data.member_policy
        });
      } else {
        // Show error to user - you might want to add a toast notification here
        alert(`Failed to connect to new node: ${result.error}`);
      }
    } catch (error) {
      console.error('Error changing node:', error);
      alert('Failed to connect to new node');
    }
  };

  return (
    <div className="App">
      {!isAuthenticated ? (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="app-root">
          <div className="app-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="app-title">AnyLog Policy Maker</h1>
                <p className="app-subtitle">Create and manage your policies with ease</p>
              </div>
              <div className="header-right">
                <div className="user-info">
                  <span className="user-node">Node: {userInfo?.node}</span>
                  <span className="user-pubkey">PubKey: {userInfo?.pubkey?.substring(0, 8)}...</span>
                </div>
                <button className="logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
          <PolicyGeneratorPage 
            authenticatedNode={userInfo?.node}
            memberPolicy={userInfo?.memberPolicy}
            onNodeChange={handleNodeChange}
          />
        </div>
      )}
    </div>
  );
}

export default App;
