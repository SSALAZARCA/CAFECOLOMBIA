import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Test Finca  
import Finca from '@/pages/Finca';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Finca />} />
            </Routes>
        </Router>
    );
}

export default App;
