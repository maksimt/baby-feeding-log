import React from 'react';
import ReactHlsPlayer from 'react-hls-player';

const VideoPlayer = ({ src }) => {
    return (
        <div>
            <ReactHlsPlayer
                src={src}
                autoPlay={true}
                controls={true}
                width="100%"
                height="auto"
            />
        </div>
    );
};

function MonitorPage() {
    const streamUrl = "http://babymonitor.local/hls/stream.m3u8";

    return (
        <VideoPlayer src={streamUrl} />
    );

}

export default MonitorPage;