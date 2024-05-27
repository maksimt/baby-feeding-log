import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import AddEventForm from './components/AddEventForm';
import EventList from './components/EventList';
import ReportPage from './components/ReportPage';
import MonitorPage from './components/MonitorPage';

function App() {
    const location = useLocation();

    return (
        <div>
            <nav style={{ textAlign: 'right', padding: '3px' }}>
                <Link to="/" style={{ marginRight: '20px' }}>Home</Link>
                <Link to="/report" style={{ marginRight: '20px' }}>Report</Link>
                <Link to="/events" style={{ marginRight: '20px' }}>All Events</Link>
                <Link to="/milestones" style={{ marginRight: '20px' }}>Milestones</Link>
                <Link to="/monitor">👀 Monitor</Link>
            </nav>
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<><AddEventForm defaultEventType="feeding" /><EventList numberOfEventsToDisplay={100} eventType="all" dailyStats={true} /></>} exact />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/events" element={<EventList numberOfEventsToDisplay={-1} eventType="all" dailyStats={true} />} />
                <Route path="/milestones" element={<><AddEventForm defaultEventType="milestone" /><EventList numberOfEventsToDisplay={-1} eventType="milestone" dailyStats={false} /></>} exact />
                <Route path="/monitor" element={<MonitorPage />} />
            </Routes>
        </div>
    );
}

function AppWrapper() {
    return (
        <Router>
            <App />
        </Router>
    );
}

export default AppWrapper;
