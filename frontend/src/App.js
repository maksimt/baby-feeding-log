import React from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import AddEventForm from './components/AddEventForm';
import EventList from './components/EventList';
import ReportPage from './components/ReportPage'; // You will need to create this component

function App() {
    return (
        <Router>
            <div>
                <nav style={{ textAlign: 'right', padding: '10px' }}>
                    <Link to="/" style={{ marginRight: '20px' }}>Home</Link>
                    <Link to="/report">Report</Link>
                </nav>
                <Switch>
                    <Route path="/" exact>
                        <AddEventForm />
                        <EventList />
                    </Route>
                    <Route path="/report">
                        <ReportPage />
                    </Route>
                </Switch>
            </div>
        </Router>
    )
}

export default App;