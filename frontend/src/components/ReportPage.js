import React, { useEffect, useState } from 'react';
import config from '../config'

function ReportPage() {
    const tz = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const plotUrl = `${config.API_URL}/events/cumulative-history-plot/?tz=${tz}`; // Update with actual backend URL
    const interpoopPlotUrl = `${config.API_URL}/events/interpoop-evolution-plot/?tz=${tz}`; // Update with actual backend URL

    return (
        
        <div>
            <h3>Cummulative Eating by Hour</h3>
            <iframe
                src={plotUrl}
                width="90%"
                height="600"
                style={{ border: 'none' }}
                title="Plotly Plot">
            </iframe>
            <h3>Interpoopillary Evolution</h3>
            <iframe
                src={interpoopPlotUrl}
                width="90%"
                height="600"
                style={{ border: 'none' }}
                title="Plotly Plot">
            </iframe>
        </div>
    );
}

export default ReportPage;
