import logo from './logo.svg';
import './App.css';


import NodeInputForm from './components/NodeInputForm'; // adjust path if it's in a subfolder

function App() {
  return (
    <div style={styles.appContainer}>
      <h1>AnyLog Policy Maker</h1>
      <NodeInputForm />
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '40px',
    fontFamily: 'Arial, sans-serif',
  },
};

export default App;
