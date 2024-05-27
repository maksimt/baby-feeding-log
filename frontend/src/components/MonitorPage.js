import React from 'react';

import ReactHlsPlayer from 'react-hls-player';
import { isIOS, isAndroid } from 'react-device-detect';
import dashjs from 'dashjs';

import config from '../config';


const VideoPlayer = ({ src, type }) => {
    const videoRef = React.useRef(null);

    React.useEffect(() => {
        if (type === 'dash' && videoRef.current && !isIOS) {
            const player = dashjs.MediaPlayer().create();
            player.initialize(videoRef.current, src, true);
            return () => {
                if (player) {
                    player.reset();
                }
            };
        }
    }, [src, type]);
    

    return (
        <div>
            {type === 'hls' ? (
                <ReactHlsPlayer
                    // playerRef={(player) => (videoRef.current = player)}
                    src={src}
                    autoPlay={true}
                    controls={true}
                    width="100%"
                    height="20px"
                />
            ) : (
                    <video ref={videoRef} autoPlay controls style={{ width: '100%', height: '50px' }} />
            )}
        </div>
    );
};

function MonitorPage() {
    const hlsStreamUrl = "http://babymonitor.local:8080/hls/stream.m3u8";
    const dashStreamUrl = "http://babymonitor.local:8080/dash/stream.mpd";
    let isAndroid = true;
    const streamUrl = isAndroid ? dashStreamUrl : hlsStreamUrl;
    const streamType = isAndroid ? 'dash' : 'hls';

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
                }, 5000); // Wait 5 seconds before reloading the page
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
                if (!restartAttempted) {
                    setRestartAttempted(true);
                    restartWebcam(); // Restart the webcam if the status check fails
                }
            }
        } catch (error) {
            console.error('Error checking webcam status:', error);
            setStatusIcon('🔴');
            restartWebcam(); // Restart the webcam if the status check fails
        }
    };

    return (
        <div>
            <div style={{ top: '10px', left: '10px', fontSize: '24px' }}>
                {statusIcon}
                <VideoPlayer src={streamUrl} type={streamType} />
                <button onClick={restartWebcam} style={{ marginTop: '10px', marginBottom: '10px' }}>Restart Audio</button>
            </div>

            <iframe src="http://babymonitor.local:9081" frameborder="0" width="100%"
                height="720px" allowfullscreen></iframe>
        </div>
    );
}

export default MonitorPage;
