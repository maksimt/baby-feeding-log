import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AddEventForm from './components/AddEventForm';
import EventList from './components/EventList';
import ReportPage from './components/ReportPage'; // Ensure this component is created

function App() {
    return (
        <Router>
            <div>
                <nav style={{ textAlign: 'right', padding: '10px' }}>
                    <Link to="/" style={{ marginRight: '20px' }}>Home</Link>
                    <Link to="/report">Report</Link>
                </nav>
                <Routes>
                    <Route path="/" element={<><AddEventForm /><EventList /></>} exact />
                    <Route path="/report" element={<ReportPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
