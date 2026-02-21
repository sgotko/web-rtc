import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { WsMessageSender, type WebSocketMessage } from "./wsMessages";

interface PeerState {
  roomId: string;
  userId: string;
  isConnected: boolean;
  error: string | null;
  localStream: MediaStream | null;
  remoteStreams: Set<MediaStream>;

  wsRef: WebSocket | null;
  wsSender: WsMessageSender | null;
  peerRef: RTCPeerConnection | null;
}

interface PeerActions {
  setRoomId: (id: string) => void;
  setUserId: (id: string) => void;
  setIsConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (stream: MediaStream) => void;
  removeRemoteStream: (stream: MediaStream) => void;
  joinRoom: () => Promise<void>;
  sendOffer: () => Promise<void>;
  handleOffer: (offer: RTCSessionDescriptionInit) => Promise<void>;
  handleAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
  handleCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  reset: () => void;

  isCameraOn: boolean;
  isMicrophoneOn: boolean;
  toggleCamera: () => void;
  toggleMicrophone: () => void;
  leaveRoom: () => void;
}

export type PeerStore = PeerState & PeerActions;

export const usePeerStore = create<PeerStore>()(
  devtools((set, get) => ({
    roomId: "",
    userId: "",
    isConnected: false,
    error: null,
    localStream: null,
    remoteStreams: new WeakSet(),
    wsRef: null,
    peerRef: null,
    isCameraOn: false,
    isMicrophoneOn: false,

    toggleCamera: () => {
      const { localStream } = get();
      localStream
        ?.getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
      set((state) => ({ isCameraOn: !state.isCameraOn }));
    },

    toggleMicrophone: () => {
      const { localStream } = get();
      localStream
        ?.getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
      set((state) => ({ isMicrophoneOn: !state.isMicrophoneOn }));
    },

    leaveRoom: () => {
      const { wsRef, peerRef, localStream, reset } = get();
      localStream?.getTracks().forEach((t) => t.stop());
      wsRef?.close();
      peerRef?.close();
      reset();
    },

    setRoomId: (roomId) => set({ roomId }),
    setUserId: (userId) => set({ userId }),
    setIsConnected: (isConnected) => set({ isConnected }),
    setError: (error) => set({ error }),
    setLocalStream: (localStream) => set({ localStream }),
    addRemoteStream: (remoteStream) => get().remoteStreams.add(remoteStream),
    removeRemoteStream: (remoteStream) =>
      get().remoteStreams.delete(remoteStream),

    joinRoom: async () => {
      const state = get();
      if (!state.roomId || !state.userId) {
        set({ error: "Enter user ID and room ID" });
        return;
      }

      set({ error: null });

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        });

        set({ localStream: stream });

        const ws = new WebSocket(`ws://localhost:3300`);
        set({ wsRef: ws });
        const wsSender = new WsMessageSender(ws, state.roomId, state.userId);

        ws.onopen = () => {
          console.log("WebSocket connected");
          wsSender.join();
        };
        ws.onclose = () => set({ isConnected: false });

        ws.onerror = (err) => {
          console.error("WebSocket error:", err);
          set({ error: "WebSocket error" });
        };

        ws.onmessage = async (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            console.log("Received:", data);

            if (data.type === "join" && data.payload.userId !== state.userId) {
              console.log("New user in the room, send offer");
              await get().sendOffer();
            } else if (data.type === "sdp") {
              if (data.payload.sdp.type === "answer") {
                await get().handleAnswer(data.payload.sdp);
              } else if (data.payload.sdp.type === "offer") {
                await get().handleOffer(data.payload.sdp);
              }
            } else if (data.type === "candidate") {
              await get().handleCandidate(data.payload.candidate);
            }
          } catch (err) {
            console.error("Error during message handing", err);
          }
        };

        set({ isConnected: true });
      } catch (err) {
        set({
          error: `Cannot get access to the microphone or camera: ${(err as Error).message}`,
        });
      }
    },

    sendOffer: async () => {
      const { localStream, peerRef } = get();
      let peer = peerRef;
      if (!peer) {
        peer = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        set({ peerRef: peer });

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            get().wsRef?.send(
              JSON.stringify({
                type: "candidate",
                data: event.candidate,
              }),
            );
          }
        };

        peer.ontrack = (event) => {
          console.log("New track", event.track.kind);
          get().addRemoteStream(event.streams[0]);
        };
      }

      localStream?.getTracks().forEach((track) => {
        if (localStream) peer!.addTrack(track, localStream);
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      get().wsRef?.send(
        JSON.stringify({
          type: "offer",
          offer,
        }),
      );
    },

    handleOffer: async (offer: RTCSessionDescriptionInit) => {
      const { localStream, peerRef } = get();
      let peer = peerRef;
      if (!peer) {
        peer = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        set({ peerRef: peer });

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            get().wsRef?.send(
              JSON.stringify({
                type: "candidate",
                data: event.candidate,
              }),
            );
          }
        };

        peer.ontrack = (event) => {
          console.log("New track", event.track.kind);
          get().addRemoteStream(event.streams[0]);
        };
      }

      localStream?.getTracks().forEach((track) => {
        if (localStream) peer!.addTrack(track, localStream);
      });

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      get().wsRef?.send(
        JSON.stringify({
          type: "answer",
          answer,
        }),
      );
    },

    handleAnswer: async (answer: RTCSessionDescriptionInit) => {
      const { peerRef } = get();
      if (peerRef) {
        await peerRef.setRemoteDescription(new RTCSessionDescription(answer));
      }
    },

    handleCandidate: async (candidate: RTCIceCandidateInit) => {
      const { peerRef } = get();
      if (peerRef) {
        await peerRef.addIceCandidate(new RTCIceCandidate(candidate));
      }
    },

    reset: () => {
      const { localStream, wsRef, peerRef } = get();
      localStream?.getTracks().forEach((t) => t.stop());
      wsRef?.close();
      peerRef?.close();
      set({
        roomId: "",
        userId: "",
        isConnected: false,
        error: null,
        localStream: null,
        remoteStreams: new Set(),
        wsRef: null,
        peerRef: null,
      });
    },
  })),
);
