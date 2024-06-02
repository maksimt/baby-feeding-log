import React from 'react';
import dashjs from 'dashjs';
import HlsPlayer from 'react-hls-player';

const VideoPlayer = ({ src, type }) => {
    const videoRef = React.useRef(null);

    React.useEffect(() => {
        if (type === 'dash') {
            const player = dashjs.MediaPlayer().create();
            player.initialize(videoRef.current, src, true);
            // These settings taken from https://dashif.org/dash.js/pages/advanced/low-latency.html
            player.updateSettings({
                streaming: {
                    delay: {
                        liveDelay: 4
                    },
                    liveCatchup: {
                        maxDrift: 1,
                        playbackRate: {
                            max: 1,
                            min: -0.5
                        }
                    }
                }
            });

            return () => {
                if (player) {
                    player.reset();
                }
            };
        }
    }, [src, type]);

    return (
        <div>
            {type === 'dash' ? (
                <video ref={videoRef} autoPlay controls style={{ width: '100%', height: '150px' }} />
            ) : (
                <HlsPlayer
                    src={src}
                    autoPlay
                    controls
                    style={{ width: '100%', height: '150px' }}
                />
            )}
        </div>
    );
};

function MonitorPage() {
    const hlsStreamUrl = "http://babymonitor.local:8080/hls/stream.m3u8";
    const dashStreamUrl = "http://babymonitor.local:8080/dash/stream.mpd";

    const [statusIcon, setStatusIcon] = React.useState('🔴'); // Default to red
    const [restartAttempted, setRestartAttempted] = React.useState(false);

    React.useEffect(() => {
        const intervalId = setInterval(checkWebcamStatus, 1000); // Check status every 1 second

        return () => clearInterval(intervalId); // Clean up interval on component unmount
    }, []);

    const restartWebcam = async () => {
        try {
            setStatusIcon('⏳')
            const response = await fetch('http://babymonitor.local:8123/webcam/restart', {
                method: 'POST'
            });
            if (response.ok) {
                alert('Webcam service restarted successfully');
                setTimeout(() => {
                    window.location.reload();
                }, 1000); // Wait 5 seconds before reloading the page
            } else {
                alert('Failed to restart webcam service');
            }
        } catch (error) {
            console.error('Error restarting webcam service:', error);
            alert('Error restarting webcam service');
        }
    };

    const checkWebcamStatus = async () => {
        try {
            const response = await fetch('http://babymonitor.local:8123/webcam/');
            if (response.status === 200) {
                setStatusIcon('🟢');
            } else {
                setStatusIcon('🔴');
                alert('Please restart the audio stream.')
            }
        } catch (error) {
            console.error('Error checking webcam status:', error);
            setStatusIcon('🔴');
            alert('Please restart the audio stream.')
        }
    };

    const isAndroid = /Android/i.test(navigator.userAgent);
    const streamUrl = isAndroid ? dashStreamUrl : hlsStreamUrl;
    const streamType = isAndroid ? 'dash' : 'hls';

    return (
        <div>
            <button onClick={restartWebcam} style={{ marginTop: '10px', marginBottom: '10px' }}>Restart Audio + Video</button>
            <h3>Audio:</h3>
            <div style={{ top: '10px', left: '10px', fontSize: '24px' }}>
                {statusIcon}
                <VideoPlayer src={streamUrl} type={streamType} />
            </div>
            <h3>Video:</h3>
            <iframe src="http://babymonitor.local:9081" frameBorder="0" width="100%"
                height="720px" allowFullScreen></iframe>
        </div>
    );
}

export default MonitorPage;
