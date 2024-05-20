import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AddEventForm from './components/AddEventForm';
import EventList from './components/EventList';
import ReportPage from './components/ReportPage'; // Ensure this component is created
import MonitorPage from './components/MonitorPage'

function App() {
    return (
        <Router>
            <div>
                <nav style={{ textAlign: 'right', padding: '3px' }}>
                    <Link to="/" style={{ marginRight: '20px' }}>Home</Link>
                    <Link to="/report" style={{ marginRight: '20px' }}>Report</Link>
                    <Link to="/events" style={{ marginRight: '20px' }}>All Events</Link>
                    <Link to="/monitor">👀 Monitor</Link>
                </nav>
                <Routes>
                    <Route path="/" element={<><AddEventForm /><EventList numberOfEventsToDisplay={100} /></>} exact />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/events" element={<EventList numberOfEventsToDisplay={-1} />} />
                    <Route path="/monitor" element={<MonitorPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
