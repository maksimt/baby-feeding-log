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

function confirmDeleteImage(eventId, imageId) {
    if (window.confirm('Are you sure you want to delete this image?')) {
        deleteImage(eventId, imageId);
    }
}

async function deleteImage(eventId, imageId) {
    try {
        const response = await fetch(`${config.API_URL}/events/${eventId}/images/${imageId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            window.location.reload();
        } else {
            alert('Failed to delete image.');
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        alert('Error deleting image.');
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
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const settingsData = await config.fetchSettings();
                setSettings(settingsData);

                let getUrl = `${config.API_URL}/events/`;
                if (numberOfEventsToDisplay !== -1) {
                    getUrl = `${getUrl}?limit=${numberOfEventsToDisplay}`
                }
                if (eventType !== 'all') {
                    getUrl = `${getUrl}${getUrl.includes('?') ? '&' : '?'}event_type=${eventType}`
                }
                const response = await fetch(getUrl);
                const data = await response.json();
                const groupedEvents = groupEventsByDate(data);
                setEvents(groupedEvents);
                calculateLastPoopStats(data);
            } catch (error) {
                console.error('Failed to fetch initial data', error);
            }
        }
        fetchInitialData();
    }, [numberOfEventsToDisplay, eventType]);

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

    function calculateBabyAge(date, birthTimestamp) {
        const birthDate = new Date(birthTimestamp);
        const targetDate = new Date(date);
        const diffTime = Math.abs(targetDate - birthDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.floor(diffDays / 30);
        const days = diffDays % 30;
        return `${months} months, ${days} days`;
    }

    function calculateTotalFeeding(events) {
        return events.reduce((total, event) => {
            if (event.event_type === 'feeding') {
                return total + (event.amount_oz || 0);
            } else if (event.event_type === 'breastfeeding') {
                const minutes = event.time_left + event.time_right;
                return total + (minutes / 15) * settings.oz_per_15_minutes_breastfeeding;
            }
            return total;
        }, 0);
    }

    return (
        <div>
            {dailyStats && (
                <span className="sinceLastPoop">
                    Since Last {getEmoji("poop")}: {lastPoopStats.hoursSinceLastPoop ? lastPoopStats.hoursSinceLastPoop : 'N/A'} hours; {getEmoji("feeding")} {lastPoopStats.totalOzSinceLastPoop} oz; {getEmoji("breastfeeding")} {lastPoopStats.totalMinsBreastfeedingSinceLastPoop} mins
                </span>
            )}
            <br />
            {Object.keys(events).map((date, index) => (
                <div key={index}>
                    <h3>{date} ({settings && calculateBabyAge(date, settings.birth_timestamp)})</h3>
                    {dailyStats && (
                        <p>
                            {getEmoji("feeding")}: {calculateBottleFeeding(events[date])} oz, {getEmoji("breastfeeding")}: {calculateBreastfeedingMinutes(events[date])} mins ({calculateTotalFeeding(events[date])} total)
                        </p>
                    )}
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
                                        {event.picture_links && event.picture_links.length > 0 && (
                                            <div>
                                                {event.picture_links.map((link, i) => (
                                                    <div key={i} style={{ position: 'relative', display: 'inline-block', margin: '10px' }}>
                                                        <img
                                                            src={link.startsWith('http') ? link : `${config.API_URL}${link}`}
                                                            alt={`Event ${i}`}
                                                            style={{ maxHeight: '300px' }}
                                                        />
                                                        <button
                                                            onClick={() => confirmDeleteImage(event.id, link.split('/').pop())}
                                                            style={{
                                                                position: 'absolute',
                                                                top: '0',
                                                                right: '0',
                                                                backgroundColor: 'red',
                                                                color: 'white',
                                                                border: 'none',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            X
                                                        </button>
                                                    </div>
                                                ))}
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

function calculateBottleFeeding(events) {
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
        case 'solids_feeding':
            return `Solids: ${event.amount_eaten_grams}g (${event.ingredients}) | ${event.how_did_he_like_it}`
        case 'bath':
            return `Bath taken`;
        case 'other':
            return `Details: ${event.description}`;
        case 'poop':
            return `Consistency: ${event.consistency}; Since last poop: ate ${event.total_oz_since_last_poop} oz, 🕰️ ${event.time_since_last_poop}`;
        case 'spit up':
            return `Spit up: ${event.amount_ml} ml`;
        case 'weight_recorded':
            return `I weigh ${event.weight_kg} kg (${event.weight_kg * 2.2} lbs)!!!`;
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
        case 'solids_feeding':
            return 'orange';
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
