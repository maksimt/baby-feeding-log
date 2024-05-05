import React, { useState, useEffect } from 'react';

function EventList() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const response = await fetch('http://10.154.71.199:7989/events/');
                const data = await response.json();
                setEvents(data);
            } catch (error) {
                console.error('Failed to fetch events', error);
            }
        }
        fetchEvents();
    }, []);

    return (
        <div>
            <h2>Recent Events</h2>
            <ul>
                {events.map((event, index) => (
                    <li key={index} style={{ color: getColor(event.event_type) }}>
                        {convertUnixTimeToLocalTime(event.timestamp)} - {event.event_type} - {event.notes}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function convertUnixTimeToLocalTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleString();  // Converts date to a string using the local time zone
}

function getColor(eventType) {
    switch (eventType) {
        case 'feeding':
            return 'blue';
        case 'poop':
            return 'brown';
        case 'spit up':
            return 'green';
        default:
            return 'black';
    }
}

export default EventList;
