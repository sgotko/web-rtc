import { useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import loggerFactory from "./lib/logger";

type Peer = {
  media: MediaStream;
  connection: RTCPeerConnection;
};

const logger = loggerFactory("RTC");

async function createPeer(): Promise<Peer> {
  const media = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  const connection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    iceTransportPolicy: "all",
    iceCandidatePoolSize: 0,
  });

  media?.getTracks().forEach((t) => {
    connection?.addTrack(t, media);
  });

  connection.ontrack = (event) => {
    logger.log("onTrack");
    logger.log("Streams ", event.streams);
    logger.log("Tracks ", event.streams[0]?.getTracks());
  };

  connection.oniceconnectionstatechange = () =>
    logger.log("ICE state:", connection.iceConnectionState);

  connection.onconnectionstatechange = () =>
    logger.log("Connection state:", connection.connectionState);

  return { media, connection };
}

function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const handler = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", handler);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", handler);
  });
}

function App() {
  const myVideo = useRef<HTMLVideoElement>(null);
  const other = useRef<HTMLVideoElement>(null);
  const [offerText, setOfferText] = useState<string>("");
  const [offerInput, setOfferInput] = useState<string>("");
  const [answerText, setAnswerText] = useState<string>("");
  const [answerInput, setAnswerInput] = useState<string>("");
  const [connection, setConnection] = useState<RTCPeerConnection>();

  const onCreate = async () => {
    const peer = await createPeer();

    if (myVideo.current) {
      myVideo.current.srcObject = peer.media;
    }

    const offer = await peer.connection.createOffer();
    await peer.connection.setLocalDescription(offer);

    await waitForIceGathering(peer.connection);

    // Local description with ICE-candidatesx
    setOfferText(JSON.stringify(peer.connection.localDescription));

    setConnection(connection);
  };

  const handleAnswer = async () => {
    if (connection) {
      await connection.setRemoteDescription(JSON.parse(answerInput));
      if (connection?.remoteDescription) {
        console.log(
          "Remote description set. ICE gathering state:",
          connection.iceGatheringState,
        );
      }
    }
  };

  const onConnect = async () => {
    const media = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    myVideo.current!.srcObject = media;

    const offer: RTCSessionDescriptionInit = JSON.parse(offerInput);
    const connection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      iceCandidatePoolSize: 0,
    });
    connection.ontrack = (event) => {
      console.log("✅ ONTRACK СРАБОТАЛ!");
      console.log("Потоки:", event.streams.length);
      console.log(
        "Треки:",
        event.streams[0]
          ?.getTracks()
          .map(
            (t) =>
              `${t.kind}: ${t.readyState} (${t.enabled ? "enabled" : "disabled"})`,
          ),
      );

      if (other.current && event.streams[0]) {
        other.current.srcObject = event.streams[0];
        // КРИТИЧНО: явный play() с обработкой ошибок
        other.current
          .play()
          .then(() => console.log("▶️ Воспроизведение запущено"))
          .catch((err) =>
            console.error(
              "❌ Ошибка воспроизведения:",
              err,
              "Проверьте: элемент видим? есть ли звук/видео треки?",
            ),
          );
      } else {
        console.warn("⚠️ Нет потока или ref не установлен");
      }
    };
    media?.getTracks().forEach((t) => {
      connection?.addTrack(t, media);
      console.log(connection, t);
    });

    await connection.setRemoteDescription(offer);
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    connection.oniceconnectionstatechange = () =>
      console.log("ICE state:", connection.iceConnectionState); // Должно быть "connected" или "completed"

    connection.onconnectionstatechange = () =>
      console.log("Connection state:", connection.connectionState); // Должно быть "connected"

    await waitForIceGathering(connection);

    setAnswerText(JSON.stringify(connection.localDescription));

    setConnection(connection);
  };

  async function copyText(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="flex flex-row basis-full min-h-full justify-between gap-4">
      <div className="flex flex-col min-h-full max-w-1/2 grow">
        <video
          id="me"
          className="video"
          ref={myVideo}
          autoPlay
          muted
          playsInline
        ></video>
        <Button variant={"default"} onClick={onCreate}>
          Create
        </Button>

        {offerText ? (
          <Button onClick={() => copyText(offerText)}>Copy offer</Button>
        ) : null}
        <Input
          value={answerInput}
          onChange={(e) => setAnswerInput(e.target.value)}
        ></Input>
        <Button variant={"default"} onClick={handleAnswer}>
          Set Answer
        </Button>
      </div>
      <div className="flex flex-col min-h-full max-w-1/2 grow">
        <video id="other" ref={other} autoPlay muted playsInline></video>
        <Input
          value={offerInput}
          onChange={(e) => setOfferInput(e.target.value)}
        ></Input>
        <Button onClick={onConnect}>Connect</Button>
        {answerText ? (
          <Button onClick={() => copyText(answerText)}>Copy answer</Button>
        ) : null}
      </div>
    </div>
  );
}

export default App;
