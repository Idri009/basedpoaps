import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppKitProvider } from './config/appkit';
import MainPage from './components/MainPage';
import MintPage from './components/MintPage';
import CreateEventPage from './components/CreateEventPage';
import ContractVerificationPage from './components/ContractVerificationPage';
import './App.css';

function App() {
  return (
    <AppKitProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/mint/:eventCode" element={<MintPage />} />
            <Route path="/create-event" element={<CreateEventPage />} />
            <Route path="/verify-contract" element={<ContractVerificationPage />} />
          </Routes>
        </div>
      </Router>
    </AppKitProvider>
  );
}

export default App;
