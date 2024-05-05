import React, { useState } from 'react';

function formatDateToInputString(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns month from 0-11
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}


function AddEventForm() {
    const [event, setEvent] = useState({
        timestamp: new Date(),
        event_type: 'feeding',  // Default event type
        notes: '',
        amount_ml: '',  // Initialize as empty string to avoid uncontrolled components
        consistency: '',  // Initialize as empty string to avoid uncontrolled components
        volume: ''  // Initialize as empty string to avoid uncontrolled components
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'timestamp') {
            setEvent({
                ...event,
                [name]: new Date(value)  // Convert input string back to Date object
            });
        } else if (name === 'event_type') {
            // Reset specific fields when changing types
            setEvent({
                ...event,
                amount_ml: '',
                consistency: '',
                volume: '',
                [name]: value
            });
        } else {
            setEvent({
                ...event,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const eventToSend = {
            ...event,
            timestamp: Math.floor(event.timestamp.getTime() / 1000)  // Convert Date object to Unix timestamp
        };

        const response = await fetch('http://10.154.71.199:7989/events/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventToSend)
        });

        const data = await response.json();
        if (data.success) {
            alert(`${event.event_type} event added!`);
            setEvent({ timestamp: new Date(), event_type: 'feeding', notes: '', amount_ml: '', consistency: '', volume: '' });
        } else {
            alert('Failed to add event.');
        }
    };


    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="timestamp">Timestamp:</label>
                <input
                    type="datetime-local"
                    id="timestamp"
                    name="timestamp"
                    value={formatDateToInputString(event.timestamp)}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <label htmlFor="event_type">Event Type:</label>
                <select id="event_type" name="event_type" value={event.event_type} onChange={handleChange}>
                    <option value="feeding">Feeding</option>
                    <option value="poop">Poop</option>
                    <option value="spit up">Spit Up</option>
                </select>
            </div>
            <div>
                <label htmlFor="notes">Notes:</label>
                <input type="text" id="notes" name="notes" value={event.notes} onChange={handleChange} placeholder="Notes" />
            </div>
            {event.event_type === 'feeding' && (
                <div>
                    <label htmlFor="amount_ml">Amount (ml):</label>
                    <input type="number" id="amount_ml" name="amount_ml" value={event.amount_ml || ''} onChange={handleChange} placeholder="Amount (ml)" required />
                </div>
            )}
            {event.event_type === 'poop' && (
                <div>
                    <label htmlFor="consistency">Consistency:</label>
                    <input type="text" id="consistency" name="consistency" value={event.consistency || ''} onChange={handleChange} placeholder="Consistency" required />
                </div>
            )}
            {event.event_type === 'spit up' && (
                <div>
                    <label htmlFor="volume">Volume:</label>
                    <input type="text" id="volume" name="volume" value={event.volume || ''} onChange={handleChange} placeholder="Volume" required />
                </div>
            )}
            <button type="submit">Add Event</button>
        </form>
    );
}

export default AddEventForm;
