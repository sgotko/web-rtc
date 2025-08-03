// store/usePeerStore.ts
import {create} from 'zustand';
import {devtools} from 'zustand/middleware';

// Типы сообщений
type WebSocketMessage =
    | {type: 'join'; sender: string}
    | {type: 'offer'; data: RTCSessionDescriptionInit}
    | {type: 'answer'; data: RTCSessionDescriptionInit}
    | {type: 'candidate'; data: RTCIceCandidateInit};

// Тип состояния
interface PeerState {
    roomId: string;
    userId: string;
    isConnected: boolean;
    error: string | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;

    // Ссылки (не экспортируем)
    wsRef: WebSocket | null;
    peerRef: RTCPeerConnection | null;
}

// Тип действий
interface PeerActions {
    setRoomId: (id: string) => void;
    setUserId: (id: string) => void;
    setIsConnected: (connected: boolean) => void;
    setError: (error: string | null) => void;
    setLocalStream: (stream: MediaStream | null) => void;
    setRemoteStream: (stream: MediaStream | null) => void;
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

// Единый тип стора
export type UsePeerStore = PeerState & PeerActions;

export const usePeerStore = create<UsePeerStore>()(
    devtools((set, get) => ({
        // Состояние
        roomId: '',
        userId: '',
        isConnected: false,
        error: null,
        localStream: null,
        remoteStream: null,
        wsRef: null,
        peerRef: null,
        isCameraOn: true,
        isMicrophoneOn: true,

        toggleCamera: () => {
            const {localStream} = get();
            localStream
                ?.getVideoTracks()
                .forEach((track) => (track.enabled = !track.enabled));
            set((state) => ({isCameraOn: !state.isCameraOn}));
        },

        toggleMicrophone: () => {
            const {localStream} = get();
            localStream
                ?.getAudioTracks()
                .forEach((track) => (track.enabled = !track.enabled));
            set((state) => ({isMicrophoneOn: !state.isMicrophoneOn}));
        },

        leaveRoom: () => {
            const {wsRef, peerRef, localStream, reset} = get();
            localStream?.getTracks().forEach((t) => t.stop());
            wsRef?.close();
            peerRef?.close();
            reset();
        },

        // Действия
        setRoomId: (roomId) => set({roomId}),
        setUserId: (userId) => set({userId}),
        setIsConnected: (isConnected) => set({isConnected}),
        setError: (error) => set({error}),
        setLocalStream: (localStream) => set({localStream}),
        setRemoteStream: (remoteStream) => set({remoteStream}),

        joinRoom: async () => {
            const state = get();
            if (!state.roomId || !state.userId) {
                set({error: 'Введите ID комнаты и пользователя'});
                return;
            }

            set({error: null});

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {width: 640, height: 480},
                    audio: true,
                });

                set({localStream: stream});

                const ws = new WebSocket(`ws://localhost:3000/ws?room=${state.roomId}&user=${state.userId}`);
                set({wsRef: ws});

                ws.onopen = () => console.log('✅ WebSocket подключён');
                ws.onclose = () => set({isConnected: false});

                ws.onerror = (err) => {
                    console.error('❌ WebSocket ошибка:', err);
                    set({error: 'Ошибка WebSocket'});
                };

                ws.onmessage = async (event) => {
                    try {
                        const data: WebSocketMessage = JSON.parse(event.data);
                        console.log('📩 Получено:', data);

                        if (data.type === 'join' && data.sender !== state.userId) {
                            console.log('👨‍💻 Собеседник в комнате — отправляем offer');
                            await get().sendOffer();
                        } else if (data.type === 'offer') {
                            await get().handleOffer(data.data);
                        } else if (data.type === 'answer') {
                            await get().handleAnswer(data.data);
                        } else if (data.type === 'candidate') {
                            await get().handleCandidate(data.data);
                        }
                    } catch (err) {
                        console.error('❌ Ошибка обработки сообщения:', err);
                    }
                };

                set({isConnected: true});
            } catch (err) {
                set({
                    error: `Не удалось получить доступ к камере/микрофону: ${(err as Error).message}`,
                });
            }
        },

        sendOffer: async () => {
            const {localStream, peerRef} = get();
            let peer = peerRef;
            if (!peer) {
                peer = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});
                set({peerRef: peer});

                peer.onicecandidate = (event) => {
                    if (event.candidate) {
                        get().wsRef?.send(
                            JSON.stringify({
                                type: 'candidate',
                                data: event.candidate,
                            })
                        );
                    }
                };

                peer.ontrack = (event) => {
                    console.log('📥 Новый трек:', event.track.kind);
                    set({remoteStream: event.streams[0]});
                };
            }

            localStream?.getTracks().forEach((track) => {
                if (localStream) peer!.addTrack(track, localStream);
            });

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            get().wsRef?.send(
                JSON.stringify({
                    type: 'offer',
                    offer,
                })
            );
        },

        handleOffer: async (offer: RTCSessionDescriptionInit) => {
            const {localStream, peerRef} = get();
            let peer = peerRef;
            if (!peer) {
                peer = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});
                set({peerRef: peer});

                peer.onicecandidate = (event) => {
                    if (event.candidate) {
                        get().wsRef?.send(
                            JSON.stringify({
                                type: 'candidate',
                                data: event.candidate,
                            })
                        );
                    }
                };

                peer.ontrack = (event) => {
                    console.log('📥 Новый трек:', event.track.kind);
                    set({remoteStream: event.streams[0]});
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
                    type: 'answer',
                    answer,
                })
            );
        },

        handleAnswer: async (answer: RTCSessionDescriptionInit) => {
            const {peerRef} = get();
            if (peerRef) {
                await peerRef.setRemoteDescription(new RTCSessionDescription(answer));
            }
        },

        handleCandidate: async (candidate: RTCIceCandidateInit) => {
            const {peerRef} = get();
            if (peerRef) {
                await peerRef.addIceCandidate(new RTCIceCandidate(candidate));
            }
        },

        reset: () => {
            const {localStream, wsRef, peerRef} = get();
            localStream?.getTracks().forEach((t) => t.stop());
            wsRef?.close();
            peerRef?.close();
            set({
                roomId: '',
                userId: '',
                isConnected: false,
                error: null,
                localStream: null,
                remoteStream: null,
                wsRef: null,
                peerRef: null,
            });
        },
    }))
);