import React, { useState } from 'react';
import { getEmoji } from '../utils';
import config from '../config';

function formatDateToInputString(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function AddEventForm() {
    const [event, setEvent] = useState({
        timestamp: new Date(),
        event_type: 'feeding',
        notes: '',
        amount_oz: '',
        consistency: '',
        amount_ml: '',
        time_left: '',
        time_right: '',
        description: '',
        picture_link: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'timestamp') {
            setEvent({ ...event, [name]: new Date(value) });
        } else if (name === 'event_type') {
            setEvent({
                ...event,
                amount_oz: '',
                consistency: '',
                amount_ml: '',
                time_left: '',
                time_right: '',
                description: '',
                picture_link: '',
                [name]: value
            });
        } else {
            setEvent({ ...event, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const eventToSend = {
            ...event,
            timestamp: Math.floor(event.timestamp.getTime() / 1000)
        };

        if (event.event_type === 'feeding') {
            eventToSend.amount_oz = parseFloat(event.amount_oz);
        } else if (event.event_type === 'breastfeeding') {
            eventToSend.time_left = parseInt(event.time_left);
            eventToSend.time_right = parseInt(event.time_right);
        } else if (event.event_type === 'milestone') {
            eventToSend.description = event.description;
            eventToSend.picture_link = event.picture_link;
        } else if (event.event_type === 'poop') {
            eventToSend.consistency = event.consistency;
        } else if (event.event_type === 'spit up') {
            eventToSend.amount_ml = parseFloat(event.amount_ml);
        }

        const response = await fetch(`${config.API_URL}/events/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventToSend)
        });

        const data = await response.json();
        if (data.success) {
            window.location.reload();
        } else {
            alert(`Failed to add event: ${data.message}`);
        }
    };

    return (
        <form className="form-input" onSubmit={handleSubmit}>
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
                    <option value="feeding">{getEmoji("feeding")} Feeding</option>
                    <option value="breastfeeding">{getEmoji("breastfeeding")} Breastfeeding</option>
                    <option value="poop">{getEmoji("poop")} Poop</option>
                    <option value="spit up">{getEmoji("spit up")} Spit Up</option>
                    <option value="bath">{getEmoji("bath")} Bath</option>
                    <option value="milestone">{getEmoji("milestone")} Milestone</option>
                    <option value="other">{getEmoji("other")} Other</option>
                </select>
            </div>
            {event.event_type === 'feeding' && (
                <div>
                    <label htmlFor="amount_oz">Amount (oz):</label>
                    <input type="number" id="amount_oz" name="amount_oz" value={event.amount_oz || ''} onChange={handleChange} placeholder="Amount (oz)" required />
                </div>
            )}
            {event.event_type === 'breastfeeding' && (
                <div>
                    <label htmlFor="time_left">Time Left (min):</label>
                    <input type="number" id="time_left" name="time_left" value={event.time_left || ''} onChange={handleChange} placeholder="Time Left (min)" required />
                    <label htmlFor="time_right">Time Right (min):</label>
                    <input type="number" id="time_right" name="time_right" value={event.time_right || ''} onChange={handleChange} placeholder="Time Right (min)" required />
                </div>
            )}
            {event.event_type === 'poop' && (
                <div>
                    <label htmlFor="consistency">Consistency:</label>
                    <input type="text" id="consistency" name="consistency" value={event.consistency || ''} onChange={handleChange} placeholder="Consistency" required />
                </div>
            )}
            {event.event_type === 'milestone' && (
                <div>
                    <label htmlFor="description">Description:</label>
                    <input type="text" id="description" name="description" value={event.description} onChange={handleChange} placeholder="Description" required />
                    <label htmlFor="picture_link">Picture Link:</label>
                    <input type="url" id="picture_link" name="picture_link" value={event.picture_link} onChange={handleChange} placeholder="Picture URL" />
                </div>
            )}
            {event.event_type === 'other' && (
                <div>
                    <label htmlFor="description">Description:</label>
                    <input type="text" id="description" name="description" value={event.description} onChange={handleChange} placeholder="Description" required />
                </div>
            )}

            {event.event_type === 'spit up' && (
                <div>
                    <label htmlFor="amount_ml">Amount (ml):</label>
                    <input type="number" id="amount_ml" name="amount_ml" value={event.amount_ml || ''} onChange={handleChange} placeholder="Amount (ml)" required />
                </div>
            )}
            <div>
                <label htmlFor="notes">Notes:</label>
                <input type="text" id="notes" name="notes" value={event.notes} onChange={handleChange} placeholder="Notes" />
            </div>
            <button type="submit">Add Event</button>
        </form>
    );
}

export default AddEventForm;
