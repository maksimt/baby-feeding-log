import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

function hexToByteArray(hexString) {
    const result = new Uint8Array(hexString.length / 2);
    for (let i = 0, j = 0; i < hexString.length; i += 2, j++) {
        result[j] = parseInt(hexString.substring(i, i + 2), 16);
    }
    return result;
}

const VideoPlayer = ({ src }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(videoRef.current);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoRef.current.play();
            });
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [src]);

    return <video ref={videoRef} controls style={{ width: '100%' }} />;
};

function MonitorPage() {
    const streamUrl = "http://babymonitor.local/hls/stream.m3u8";

    return (
        // <div className='player-wrapper'>
        //     <ReactPlayer
        //         url={streamUrl}
        //         className='react-player'
        //         playing
        //         width='100%'
        //         height='100%'
        //         controls={true}
        //  />
        //  <br/>
        <VideoPlayer src={streamUrl} />
        // </div>
    );

}

export default MonitorPage;