import React, { useState } from 'react';
import { getEmoji, formatDateToInputString } from '../utils';
import config from '../config';

function AddEventForm({ defaultEventType }) {
    const [event, setEvent] = useState({
        timestamp: new Date(),
        event_type: defaultEventType,
        notes: '',
        amount_oz: '',
        consistency: '',
        amount_ml: '',
        time_left: '',
        time_right: '',
        description: '',
        weight_kg: '',
        weight_lbs: '',
        picture_links: [] // Update to hold multiple picture links
    });
    const [images, setImages] = useState([]);

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
                weight_kg: '',
                weight_lbs: '',
                picture_links: [],
                [name]: value
            });
        } else if (name === 'weight_kg') {
            const weight_kg = parseFloat(value);
            const weight_lbs = (weight_kg * 2.20462).toFixed(2);
            setEvent({ ...event, weight_kg, weight_lbs });
        } else if (name === 'weight_lbs') {
            const weight_lbs = parseFloat(value);
            const weight_kg = (weight_lbs / 2.20462).toFixed(2);
            setEvent({ ...event, weight_lbs, weight_kg });
        } else {
            setEvent({ ...event, [name]: value });
        }
    };

    const handleImageChange = (e) => {
        setImages([...e.target.files]);
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
        } else if (event.event_type === 'weight_recorded') {
            eventToSend.weight_kg = parseFloat(event.weight_kg);
        }

        const response = await fetch(`${config.API_URL}/events/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventToSend)
        });

        const data = await response.json();
        if (data.success) {
            const { event_id } = data;
            if (images.length > 0) {
                const formData = new FormData();
                images.forEach((image, index) => {
                    formData.append('images', image);
                });
                await fetch(`${config.API_URL}/events/${event_id}/images`, {
                    method: 'POST',
                    body: formData
                });
            }
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
                    <option value="weight_recorded">{getEmoji("weight_recorded")} Weight Recorded</option>
                    <option value="incomplete_feeding">{getEmoji("incomplete_feeding")} Incomplete Feeding</option>
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
                    <input type="text" id="consistency" name="consistency" value={event.consistency || ''} onChange={handleChange} placeholder="Consistency" />
                </div>
            )}
            {event.event_type === 'milestone' && (
                <div>
                    <label htmlFor="images">Upload Images:</label>
                    <input
                        type="file"
                        id="images"
                        name="images"
                        accept="image/png, image/jpeg"
                        multiple
                        onChange={handleImageChange}
                    />
                    <br/>
                    <label htmlFor="description">Description:</label>
                    <input type="text" id="description" name="description" value={event.description} onChange={handleChange} placeholder="Description" required />
                </div>
            )}
            {event.event_type === 'weight_recorded' && (
                <div>
                    <label htmlFor="weight_kg">Weight (kg):</label>
                    <input type="number" id="weight_kg" name="weight_kg" value={event.weight_kg || ''} onChange={handleChange} placeholder="Weight (kg)" required />
                    <label htmlFor="weight_lbs">Weight (lbs):</label>
                    <input type="number" id="weight_lbs" name="weight_lbs" value={event.weight_lbs || ''} onChange={handleChange} placeholder="Weight (lbs)" required />
                    <label htmlFor="images">Upload Images:</label>
                    <input
                        type="file"
                        id="images"
                        name="images"
                        accept="image/png, image/jpeg"
                        multiple
                        onChange={handleImageChange}
                    />
                </div>
            )}
            {event.event_type === 'incomplete_feeding' && (
                <div>
                    <label htmlFor="notes">Notes:</label>
                    <input type="text" id="notes" name="notes" value={event.notes} onChange={handleChange} placeholder="Notes" />
                </div>
            )}
            {event.event_type === 'other' && (
                <div>
                    <label htmlFor="description">Description:</label>
                    <input type="text" id="description" name="description" value={event.description} onChange={handleChange} placeholder="Description" required />
                </div>
            )}
            <button type="submit">Add Event</button>
        </form>
    );
}

export default AddEventForm;
