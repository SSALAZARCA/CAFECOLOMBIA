import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAdminStore } from '@/stores/adminStore';

function TestStore() {
    const { currentAdmin } = useAdminStore();
    return (
        <div style={{ padding: '2rem' }}>
            <h1>Store Test</h1>
            <p>Admin: {currentAdmin ? currentAdmin.name : 'None'}</p>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<TestStore />} />
            </Routes>
        </Router>
    );
}

export default App;
