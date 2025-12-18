import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Coffee, AlertCircle, CheckCircle } from 'lucide-react';

function TestLucide() {
    return (
        <div style={{ padding: '2rem' }}>
            <h1>Lucide Test</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Mail />
                <Lock />
                <Eye />
                <EyeOff />
                <Coffee />
                <AlertCircle />
                <CheckCircle />
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<TestLucide />} />
            </Routes>
        </Router>
    );
}

export default App;
