import React, { useState, useEffect } from 'react';
import { getEmoji, formatDateToInputString, convertUnixTimeToLocalTime } from '../utils';
import config from '../config';

function confirmDelete(event) {
    const eventTypeFormatted = event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1);
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

function EventList({ numberOfEventsToDisplay, eventType, dailyStats }) {
    const [events, setEvents] = useState({});
    const [lastPoopStats, setLastPoopStats] = useState({ lastPoopTime: null, totalOzSinceLastPoop: 0, totalMinsBreastfeedingSinceLastPoop: 0 });
    const [editingEvent, setEditingEvent] = useState(null);
    const [editedEvent, setEditedEvent] = useState({});
    const [editImages, setEditImages] = useState([]);

    useEffect(() => {
        async function fetchEvents() {
            try {
                let getUrl = `${config.API_URL}/events/`;
                if (numberOfEventsToDisplay !== -1) {
                    getUrl = `${getUrl}?limit=${numberOfEventsToDisplay}`
                }
                if (eventType !== 'all') {
                    getUrl = `${getUrl}${getUrl.includes('?')?'&':'?'}event_type=${eventType}`
                }
                const response = await fetch(getUrl);
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
            const hoursSinceLastPoop = ((now - lastPoopTime) / (1000 * 60 * 60)).toFixed(1);

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

    function startEditing(event) {
        setEditingEvent(event);
        setEditedEvent(event);
    }

    function handleEditChange(event) {
        let { name, value } = event.target;
        if (name === 'timestamp') {
            value = new Date(value);
            value = Math.floor(value.getTime() / 1000);
        }
        setEditedEvent(prevState => ({
            ...prevState,
            [name]: value
        }));
    }

    function handleEditImageChange(event) {
        setEditImages([...event.target.files]);
    }

    async function saveEdit() {
        try {
            const response = await fetch(`${config.API_URL}/events/${editingEvent.timestamp}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editedEvent)
            });
            const data = await response.json();
            if (data.success) {
                if (editImages.length > 0) {
                    const formData = new FormData();
                    editImages.forEach((image, index) => {
                        formData.append('images', image);
                    });
                    await fetch(`${config.API_URL}/events/${editingEvent.id}/images`, {
                        method: 'POST',
                        body: formData
                    });
                }
                window.location.reload();
            } else {
                alert('Failed to update event.');
            }
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Error updating event.');
        }
    }

    return (
        <div>
            {dailyStats && (<span className="sinceLastPoop">Since Last {getEmoji("poop")}: {lastPoopStats.hoursSinceLastPoop ? lastPoopStats.hoursSinceLastPoop : 'N/A'} hours; {getEmoji("feeding")} {lastPoopStats.totalOzSinceLastPoop} oz; {getEmoji("breastfeeding")} {lastPoopStats.totalMinsBreastfeedingSinceLastPoop} mins</span>)}
            <br />
            {Object.keys(events).map((date, index) => (
                <div key={index}>
                    <h3>{date}</h3>
                    {dailyStats && (<p>Total {getEmoji("feeding")}: {calculateFeedingTotals(events[date])} oz, {getEmoji("breastfeeding")}: {calculateBreastfeedingMinutes(events[date])} mins</p>)}
                    <ul style={{ listStyleType: 'none' }}>
                        {events[date].map((event, idx) => (
                            <li key={idx} style={{ color: getColor(event.event_type) }}>
                                {editingEvent && editingEvent.id === event.id ? (
                                    <div>
                                        <div>
                                            <label htmlFor="timestamp">Timestamp:</label>
                                            <input
                                                type="datetime-local"
                                                id="timestamp"
                                                name="timestamp"
                                                value={formatDateToInputString(new Date(editedEvent.timestamp * 1000))}
                                                onChange={handleEditChange}
                                                required
                                            />
                                        </div>
                                        {Object.keys(event).map((key, i) => (
                                            key !== 'timestamp' && key !== 'event_type' && key !== 'id' && key !== 'picture_links' && (
                                                <div key={i}>
                                                    <label>{key}: </label>
                                                    <input type="text" name={key} value={editedEvent[key] || ''} onChange={handleEditChange} />
                                                </div>
                                            )
                                        ))}
                                        {(event.event_type === 'milestone' || event.event_type === 'weight_recorded') && (
                                            <div>
                                                <label htmlFor="editImages">Upload Images:</label>
                                                <input
                                                    type="file"
                                                    id="editImages"
                                                    name="editImages"
                                                    accept="image/png, image/jpeg"
                                                    multiple
                                                    onChange={handleEditImageChange}
                                                />
                                            </div>
                                        )}
                                        <button onClick={saveEdit}>Save</button>
                                    </div>
                                ) : (
                                    <span style={{ display: 'inline' }}>
                                        {getEmoji(event.event_type)} {convertUnixTimeToLocalTime(event.timestamp)} | {renderEventData(event)} | {event.notes}
                                        {event.picture_links && event.picture_links.length > 0 && (
                                            <div>
                                                {event.picture_links.map((link, i) => (
                                                    <img key={i} src={link.startsWith('http') ? link : `${config.API_URL}${link}`} alt={`Event ${i}`} style={{ marginLeft: '10px', maxHeight: '300px' }} />
                                                ))}
                                            </div>
                                        )}
                                    </span>
                                )}
                                <button onClick={() => startEditing(event)} style={{ display: 'inline', color: '#ff5c33', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '10px', fontSize: '12px' }}>✏️</button>
                                <button onClick={() => confirmDelete(event)} style={{ display: 'inline', color: '#ff5c33', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '10px', fontSize: '12px' }}>X</button>
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
        case 'weight_recorded':
            return `Weight: ${event.weight_kg} kg (${event.weight_lbs} lbs)`;
        case 'incomplete_feeding':
            return `Incomplete feeding data recorded for day: ${event.notes}`;
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
        case 'weight_recorded':
            return 'lightcoral';
        case 'incomplete_feeding':
            return 'lightgoldenrodyellow';
        default:
            return 'black';
    }
}

export default EventList;
