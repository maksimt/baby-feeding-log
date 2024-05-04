import React, { useState } from 'react';

function AddFeedingForm() {
  const [feeding, setFeeding] = useState({
    timestamp: '',
    amount_ml: '',
    notes: ''
  });

  const handleChange = (event) => {
    setFeeding({
      ...feeding,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch('/add-feeding/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feeding)
    });

    const data = await response.json();
    if (data.success) {
      alert('Feeding added!');
      setFeeding({ timestamp: '', amount_ml: '', notes: '' });
    } else {
      alert('Failed to add feeding.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="timestamp" value={feeding.timestamp} onChange={handleChange} placeholder="Timestamp" required />
      <input type="number" name="amount_ml" value={feeding.amount_ml} onChange={handleChange} placeholder="Amount (ml)" required />
      <input type="text" name="notes" value={feeding.notes} onChange={handleChange} placeholder="Notes" />
      <button type="submit">Add Feeding</button>
    </form>
  );
}

export default AddFeedingForm;
