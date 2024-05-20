import React from 'react';
import ReactHlsPlayer from 'react-hls-player';
import { isIOS, isAndroid } from 'react-device-detect';
import dashjs from 'dashjs';

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
                    height="auto"
                />
            ) : (
                <video ref={videoRef} autoPlay controls style={{ width: '100%', height: 'auto' }} />
            )}
        </div>
    );
};

function MonitorPage() {
    const hlsStreamUrl = "http://babymonitor.local:8080/hls/stream.m3u8";
    const dashStreamUrl = "http://babymonitor.local:8080/dash/stream.mpd";
    const streamUrl = isAndroid ? dashStreamUrl : hlsStreamUrl;
    const streamType = isAndroid ? 'dash' : 'hls';

    return (
        <VideoPlayer src={streamUrl} type={streamType} />
    );
}

export default MonitorPage;
