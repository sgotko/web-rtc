export type WebSocketMessage =
  | {
      type: "join";
      payload: {
        roomId: string;
        userId: string;
      };
    }
  | {
      type: "leave";
      payload: {
        roomId: string;
        userId: string;
      };
    }
  | {
      type: "sdp";
      payload: {
        roomId: string;
        userId: string;
        sdp: RTCSessionDescriptionInit;
      };
    }
  | {
      type: "candidate";
      payload: {
        roomId: string;
        userId: string;
        candidate: RTCIceCandidateInit;
      };
    };

export class WsMessageSender {
  #webSocket: WebSocket;
  #roomId: string;
  #userId: string;

  public constructor(webSocket: WebSocket, roomId: string, userId: string) {
    this.#webSocket = webSocket;
    this.#roomId = roomId;
    this.#userId = userId;
  }

  public join(): void {
    return this.#webSocket.send(
      JSON.stringify({
        type: "join",
        payload: {
          roomId: this.#roomId,
          userId: this.#userId,
        },
      }),
    );
  }

  public leave(): void {
    return this.#webSocket.send(
      JSON.stringify({
        type: "leave",
        payload: {
          roomId: this.#roomId,
          userId: this.#userId,
        },
      }),
    );
  }

  public sdp(sdp: RTCLocalSessionDescriptionInit): void {
    return this.#webSocket.send(
      JSON.stringify({
        type: "sdp",
        payload: {
          roomId: this.#roomId,
          userId: this.#userId,
          sdp: sdp,
        },
      }),
    );
  }

  public candidate(candidate: RTCIceCandidateInit) {
    this.#webSocket.send(
      JSON.stringify({
        type: "candidate",
        payload: {
          userId: this.#userId,
          roomId: this.#roomId,
          candidate,
        },
      }),
    );
  }
}
