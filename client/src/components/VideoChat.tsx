// components/VideoChat.tsx
import React from 'react';
import { usePeerStore } from '../store/usePeerStore';
import { VideoPlayer } from './VideoPlayer';

export const VideoChat: React.FC = () => {
  const { roomId, userId, localStream, remoteStream, toggleCamera, toggleMicrophone, leaveRoom } =
    usePeerStore();

  return (
    <div className="chat">
      <p>
        Комната: <strong>{roomId}</strong> | Вы: <strong>{userId}</strong>
      </p>

      <div className="video-container">
        <VideoPlayer stream={localStream} label="Ты" muted />
        <VideoPlayer stream={remoteStream} label="Собеседник" />
      </div>

      <div className="status">
        {remoteStream ? '🟢 Соединение установлено' : '🟡 Ожидание собеседника...'}
      </div>

      <div className="controls">
        <button
          onClick={toggleMicrophone}
          className={usePeerStore.getState().isMicrophoneOn ? 'unmute' : 'mute'}
        >
          {usePeerStore.getState().isMicrophoneOn ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 14a2 2 0 0 0 2-2V6a2 2 0 0 0-4 0v6a2 2 0 0 0 2 2z" />
                <path d="M12 18v2M8 22h8M6 18h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
              </svg>
              Микрофон: Вкл
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 18v2M8 22h8M6 18h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
              Микрофон: Выкл
            </>
          )}
        </button>

        <button onClick={toggleCamera} className={usePeerStore.getState().isCameraOn ? '' : 'mute'}>
          {usePeerStore.getState().isCameraOn ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Камера: Вкл
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 10.5l-5 5M7 15.5l-5-5M17 3l5 5M7 3l-5 5" />
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Камера: Выкл
            </>
          )}
        </button>

        <button onClick={leaveRoom} className="leave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Покинуть
        </button>
      </div>
    </div>
  );
};