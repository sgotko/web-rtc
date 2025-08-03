import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ stream, label, muted = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      // При необходимости можно остановить треки здесь
    };
  }, [stream]);

  return (
    <div className="video-box">
      <video ref={videoRef} autoPlay playsInline muted={muted} />
      <p>{label}</p>
    </div>
  );
};