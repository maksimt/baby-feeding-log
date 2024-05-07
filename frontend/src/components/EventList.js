import React, { useState, useEffect } from 'react';
import { getEmoji } from '../utils';
import config from '../config';

function confirmDelete(event) {
    const eventTypeFormatted = event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1);  // Capitalize the first letter
    const eventTime = new Date(event.timestamp * 1000).toLocaleString();
    if (window.confirm(`Are you sure you want to delete this ${eventTypeFormatted} event from ${eventTime}?`)) {
        deleteEvent(event.timestamp);
    }
}

async function deleteEvent(timestamp) {
    try {
        const response = await fetch(`${config.API_URL}/events/${timestamp}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            window.location.reload();
        } else {
            alert('Failed to delete event.');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event.');
    }
}

function handlePrint() {
    window.print();
}

function EventList() {
    const [events, setEvents] = useState({});
    const [lastPoopStats, setLastPoopStats] = useState({ lastPoopTime: null, totalOzSinceLastPoop: 0, totalMinsBreastfeedingSinceLastPoop: 0 });

    useEffect(() => {
        async function fetchEvents() {
            try {
                const response = await fetch(`${config.API_URL}/events/`);
                const data = await response.json();
                const groupedEvents = groupEventsByDate(data);
                setEvents(groupedEvents);
                calculateLastPoopStats(data);
            } catch (error) {
                console.error('Failed to fetch events', error);
            }
        }
        fetchEvents();
    }, []);

    function calculateLastPoopStats(events) {
        const lastPoop = events.find(e => e.event_type === 'poop');
        if (lastPoop) {
            const now = Date.now();
            const lastPoopTime = new Date(lastPoop.timestamp * 1000);
            const hoursSinceLastPoop = ((now - lastPoopTime) / (1000 * 60 * 60)).toFixed(1);  // Convert milliseconds to hours and round to one decimal place

            const eventsAfterLastPoop = events.filter(e => e.timestamp > lastPoop.timestamp);
            const totalOzSinceLastPoop = eventsAfterLastPoop.filter(e => e.event_type === 'feeding').reduce((acc, curr) => acc + (curr.amount_oz || 0), 0);
            const totalMinsBreastfeedingSinceLastPoop = eventsAfterLastPoop.filter(e => e.event_type === 'breastfeeding').reduce((acc, curr) => acc + (curr.time_left + curr.time_right), 0);

            setLastPoopStats({
                hoursSinceLastPoop,
                totalOzSinceLastPoop,
                totalMinsBreastfeedingSinceLastPoop
            });
        }
    }

    return (
        <div>
            <span className="sinceLastPoop">Since Last {getEmoji("poop")}: {lastPoopStats.hoursSinceLastPoop ? lastPoopStats.hoursSinceLastPoop : 'N/A'} hours; {getEmoji("feeding")} {lastPoopStats.totalOzSinceLastPoop} oz; {getEmoji("breastfeeding")} {lastPoopStats.totalMinsBreastfeedingSinceLastPoop} mins</span>
            <br />
            {Object.keys(events).map((date, index) => (
                <div key={index}>
                    <h3>{date}</h3>
                    <p>Total {getEmoji("feeding")}: {calculateFeedingTotals(events[date])} oz, {getEmoji("breastfeeding")}: {calculateBreastfeedingMinutes(events[date])} mins</p>
                    <ul style={{ listStyleType: 'none' }}>
                        {events[date].map((event, idx) => (
                            <li key={idx} style={{ color: getColor(event.event_type) }}>
                                <span style={{ display: 'inline' }}>
                                    {getEmoji(event.event_type)} {convertUnixTimeToLocalTime(event.timestamp)} | {renderEventData(event)} | {event.notes}
                                    {event.event_type === "milestone" && event.picture_link && <li><img src={event.picture_link} alt="Milestone" style={{ marginLeft: '10px', maxHeight: '300px' }} /></li>}
                                </span>
                                <button onClick={() => confirmDelete(event)} style={{ display: 'inline', color: '#ff5c33', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '10px', fontSize: '12px' }}>
                                    X
                                </button>
                            </li>
                        ))}
                    </ul>
                    {index < Object.keys(events).length - 1 && <hr />}
                </div>
            ))}
            <button onClick={handlePrint} style={{ marginRight: '20px' }}>Print</button>
        </div>
    );
}

function groupEventsByDate(events) {
    return events.reduce((acc, event) => {
        const date = new Date(event.timestamp * 1000).toDateString();
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

function calculateBreastfeedingMinutes(events) {
    return events.filter(e => e.event_type === 'breastfeeding').reduce((total, curr) => total + (curr.time_left + curr.time_right), 0);
}

function convertUnixTimeToLocalTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
    });
}

function renderEventData(event) {
    switch (event.event_type) {
        case 'feeding':
            return `Ate: ${event.amount_oz} oz`;
        case 'breastfeeding':
            return `Breastfed left: ${event.time_left} min, right: ${event.time_right} min`;
        case 'milestone':
            return `Milestone: ${event.description}`;
        case 'bath':
            return `Bath taken`;
        case 'other':
            return `Details: ${event.description}`;
        case 'poop':
            return `Consistency: ${event.consistency}; Since last poop: ate ${event.total_oz_since_last_poop} oz, 🕰️ ${event.time_since_last_poop}`;
        case 'spit up':
            return `Spit up: ${event.amount_ml} ml`;
        default:
            return '';
    }
}

function getColor(eventType) {
    switch (eventType) {
        case 'feeding':
        case 'breastfeeding':
            return 'lightblue';
        case 'milestone':
            return 'lightgreen';
        case 'bath':
            return 'lightyellow';
        case 'other':
            return 'lightgrey';
        case 'poop':
            return '#cc9966';
        case 'spit up':
            return '#b3b3cc';
        default:
            return 'black';
    }
}

export default EventList;
