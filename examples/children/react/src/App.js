import './App.css';
import logo from './logo.svg'
console.info(logo)
function App() {
  return (
  <div className="App">
      <header className="App-header">
        <div style={{
          background: `url(http://localhost:4004${logo})`,
        }} className="App-logo" alt="logo" />
        <p>
          我是 React 应用ddd
        </p>
      </header>
    </div>
  );
}

export default App;
