import React, { useState, useEffect } from 'react';
import { getEmoji } from '../utils'; // Import the getEmoji function
import config from '../config';  // Adjust the import path based on your file structure

function confirmDelete(timestamp) {
    if (window.confirm("Are you sure you want to delete this event?")) {
        deleteEvent(timestamp);
    }
}

async function deleteEvent(timestamp) {
    try {
        const response = await fetch(`${config.API_URL}/events/${timestamp}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            // Refresh the events list if deletion was successful
            window.location.reload();
        } else {
            alert('Failed to delete event.');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event.');
    }
}


const handlePrint = () => {
    // Function to handle print
    window.print();
};

function EventList() {
    const [events, setEvents] = useState({});

    useEffect(() => {
        async function fetchEvents() {
            try {
                const response = await fetch(`${config.API_URL}/events/`);
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
                                <span style={{ display: 'inline' }}>
                                    {getEmoji(event.event_type)} {convertUnixTimeToLocalTime(event.timestamp)} | {renderEventData(event)} | {event.notes}
                                </span>
                                <button onClick={() => confirmDelete(event.timestamp)} style={{ display: 'inline', color: '#ff5c33', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '10px', 'font-size': '12px' }}>
                                    X
                                </button>
                            </li>
                        ))}

                    </ul>
                    {index < Object.keys(events).length - 1 && <hr />} {/* Add a horizontal line between days */}
                </div>
            ))}
            <button onClick={handlePrint} style={{ marginRight: '20px' }}>Print</button>
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
    // Use toLocaleTimeString with options to format time in 24-hour format
    return date.toLocaleTimeString('en-US', {
        hour12: false,  // Use 24-hour time format
        hour: '2-digit',  // Two digit hour
        minute: '2-digit',  // Two digit minute
    });
}


function renderEventData(event) {
    switch (event.event_type) {
        case 'feeding':
            return `Ate: ${event.amount_oz} oz`;
        case 'poop':
            return `Consistency: ${event.consistency}`;
        case 'spit up':
            return `Spit up: ${event.amount_ml} ml`;
        default:
            return '';
    }
}

function getColor(eventType) {
    switch (eventType) {
        case 'feeding':
            return 'white';  // No change for feeding events
        case 'poop':
            return '#cc9966';  // Light brown color
        case 'spit up':
            return '#b3b3cc';  // Light grey color
        default:
            return 'black';  // Default color
    }
}


export default EventList;
