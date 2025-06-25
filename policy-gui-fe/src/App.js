import React from 'react';
import PolicyGeneratorPage from './pages/PolicyGeneratorPage';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="app-root">
        <div className="app-header">
          <h1 className="app-title">AnyLog Policy Maker</h1>
          <p className="app-subtitle">Create and manage your policies with ease</p>
        </div>
        <PolicyGeneratorPage />
      </div>
    </div>
  );
}

export default App;
