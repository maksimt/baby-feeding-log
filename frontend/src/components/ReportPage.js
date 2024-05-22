import React, { useEffect, useState } from 'react';
import config from '../config';

function ReportPage() {
    const tz = new Intl.DateTimeFormat().resolvedOptions().timeZone;

    // State for the new parameter
    const [milkOz, setMilkOz] = useState(1.0);

    // State for plot URLs
    const [plotUrl, setPlotUrl] = useState(`${config.API_URL}/events/cumulative-history-plot/?tz=${tz}&milkOz=1.0`);
    const [interpoopPlotUrl, setInterpoopPlotUrl] = useState(`${config.API_URL}/events/interpoop-evolution-plot/?tz=${tz}`);

    // Update plot URL when the parameter changes
    useEffect(() => {
        setPlotUrl(`${config.API_URL}/events/cumulative-history-plot/?tz=${tz}&milkOz=${milkOz}`);
    }, [milkOz, tz]);

    return (
        <div>
            <h3>Cumulative Eating by Hour</h3>

            <div>
                <label>
                    estimated oz/15min boobs:
                    <input
                        type="number"
                        step="0.25"
                        value={milkOz}
                        onChange={e => setMilkOz(parseFloat(e.target.value))}
                    />
                </label>
            </div>

            <iframe
                src={plotUrl}
                width="90%"
                height="600"
                style={{ border: 'none' }}
                title="Plotly Plot"
            ></iframe>

            <h3>Interpoopillary Evolution</h3>

            <iframe
                src={interpoopPlotUrl}
                width="90%"
                height="600"
                style={{ border: 'none' }}
                title="Plotly Plot"
            ></iframe>
        </div>
    );
}

export default ReportPage;
