import React from 'react';
import { usePeerStore } from '../store/usePeerStore';

export const JoinForm: React.FC = () => {
  const { roomId, userId, error, setRoomId, setUserId, joinRoom } = usePeerStore();

  return (
    <div className="setup">
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <input
        type="text"
        placeholder="ID комнаты"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <input
        type="text"
        placeholder="Ваше имя"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <button onClick={joinRoom}>Войти в комнату</button>
    </div>
  );
};