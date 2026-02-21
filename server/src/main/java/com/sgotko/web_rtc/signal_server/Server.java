package com.sgotko.web_rtc.signal_server;

import java.net.InetSocketAddress;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.slf4j.LoggerFactory;

import com.sgotko.web_rtc.signal_server.message.WebsocketMessage;

public class Server extends WebSocketServer {

	private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(Server.class);

	private final RoomService roomService;

	public Server(final InetSocketAddress address, final RoomService roomService) {
		super(address);
		this.roomService = roomService;
	}

	@Override
	public void onOpen(final WebSocket conn, final ClientHandshake handshake) {
		LOGGER.debug("Connection opened {}", conn);
	}

	@Override
	public void onClose(final WebSocket conn, final int code, final String reason, final boolean remote) {
		LOGGER.debug("Connection closed {}", conn);
	}

	@Override
	public void onMessage(final WebSocket conn, final String message) {
		try {
			WebsocketMessage wsMessage = WebsocketMessage.fromJson(message);

		} catch (IllegalArgumentException e) {
			LOGGER.error(e.getMessage());
		}
	}

	@Override
	public void onError(final WebSocket conn, final Exception ex) {
		LOGGER.error("WebSocket error {}", ex);
	}

	@Override
	public void onStart() {
		LOGGER.info("WebSocker server started on {}", getAddress());
	}

	@Override
	public String toString() {
		return "Server [roomService=" + roomService + "]";
	}

}
