import DesignViewer from './pages/DesignViewer';
import PlotViewer from './pages/PlotViewer';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Marketplace from './pages/Marketplace';
import Chat from './pages/Chat';
import AddPlot from './pages/AddPlot';
import PlotGallery from './pages/PlotGallery';
import { useEffect, useState } from 'react';
import { checkConnection } from './api/client';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const initHealthCheck = async () => {
      const isOnline = await checkConnection();
      setBackendStatus(isOnline ? 'connected' : 'error');
    };
    initHealthCheck();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/chat/:plotId" element={<Chat />} />
        <Route path="/add-plot" element={<AddPlot />} />
        <Route path="/gallery" element={<PlotGallery />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/design/:id" element={<DesignViewer />} />
        <Route path="/view/:id" element={<PlotViewer />} />
      </Routes>
    </Router>
  );
}

export default App;
