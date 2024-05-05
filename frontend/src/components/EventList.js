import React, { useState, useEffect } from 'react';
import { getEmoji } from '../utils'; // Import the getEmoji function

function EventList() {
    const [events, setEvents] = useState({});

    useEffect(() => {
        async function fetchEvents() {
            try {
                const response = await fetch('http://10.154.71.199:7989/events/');
                const data = await response.json();
                const groupedEvents = groupEventsByDate(data);
                setEvents(groupedEvents);
            } catch (error) {
                console.error('Failed to fetch events', error);
            }
        }
        fetchEvents();
    }, []);

    return (
        <div>
            <br />
            {Object.keys(events).map((date, index) => (
                <div key={index}>
                    <h3>{date}</h3>
                    <p>Total Feedings: {calculateFeedingTotals(events[date])} oz</p>
                    <ul style={{ listStyleType: 'none' }}>
                        {events[date].map((event, idx) => (
                            <li key={idx} style={{ color: getColor(event.event_type) }}>
                                {getEmoji(event.event_type)} {convertUnixTimeToLocalTime(event.timestamp)} | {renderEventData(event)} | {event.notes}
                            </li>
                        ))}
                    </ul>
                    {index < Object.keys(events).length - 1 && <hr />} {/* Add a horizontal line between days */}
                </div>
            ))}
        </div>
    );
}

function groupEventsByDate(events) {
    return events.reduce((acc, event) => {
        const date = new Date(event.timestamp * 1000).toDateString(); // Converts to a simple date string (ignores time)
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(event);
        return acc;
    }, {});
}

function calculateFeedingTotals(events) {
    return events.filter(e => e.event_type === 'feeding').reduce((total, curr) => total + (curr.amount_oz || 0), 0);
}

function convertUnixTimeToLocalTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleString();  // Converts date to a string using the local time zone
}

function renderEventData(event) {
    switch (event.event_type) {
        case 'feeding':
            return `Amount: ${event.amount_oz} oz`;
        case 'poop':
            return `Consistency: ${event.consistency}`;
        case 'spit up':
            return `Volume: ${event.volume}`;
        default:
            return '';
    }
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
