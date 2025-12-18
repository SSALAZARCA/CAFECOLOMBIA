import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Test Insumos
import Insumos from '@/pages/Insumos';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Insumos />} />
            </Routes>
        </Router>
    );
}

export default App;
