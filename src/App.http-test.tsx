import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { adminHttpClient } from '@/utils/adminHttpClient';

function TestHttp() {
    React.useEffect(() => {
        console.log('Admin Client:', adminHttpClient);
    }, []);

    return (
        <div style={{ padding: '2rem' }}>
            <h1>HTTP Client Test</h1>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<TestHttp />} />
            </Routes>
        </Router>
    );
}

export default App;
