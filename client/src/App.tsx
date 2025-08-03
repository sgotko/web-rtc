import './App.css';
import { JoinForm } from './components/JoinForm';
import { VideoChat } from './components/VideoChat';
import { usePeerStore } from './store/usePeerStore';

function App() {
  const { isConnected } = usePeerStore();

  return (
    <div className="App">
      <h1>🎥 WebRTC Видеочат</h1>
      {!isConnected ? <JoinForm /> : <VideoChat />}
    </div>
  );
}

export default App;