package com.sgotko.web_rtc.signal_server;

import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.slf4j.LoggerFactory;

import com.sgotko.web_rtc.signal_server.message.WsMessage;

public class Server extends WebSocketServer {

	private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(Server.class);

	private final RoomService roomService;

	public Server(final InetSocketAddress address, final RoomService roomService) {
		super(address);
		this.roomService = roomService;
	}

	public static Map<String, List<String>> parseQuery(final String query) {
		Map<String, List<String>> params = new LinkedHashMap<>();
		if (query == null || query.isEmpty())
			return params;

		for (String pair : query.split("&")) {
			final String[] keyValue = pair.split("=", 2);
			final String key = URLDecoder.decode(keyValue[0], StandardCharsets.UTF_8);
			final String value = keyValue.length > 1 ? URLDecoder.decode(keyValue[1], StandardCharsets.UTF_8) : "";

			params.computeIfAbsent(key, k -> new ArrayList<>()).add(value);
		}
		return params;
	}

	@Override
	public void onOpen(final WebSocket conn, final ClientHandshake handshake) {
		final String resource = handshake.getResourceDescriptor();
		final URI uri = URI.create(resource);
		System.out.println(uri.getQuery());
		LOGGER.info("on open {}", handshake.toString());
	}

	@Override
	public void onClose(final WebSocket conn, final int code, final String reason, final boolean remote) {
		LOGGER.info("on close {}");
	}

	@Override
	public void onMessage(final WebSocket conn, final String message) {
		try {
			WsMessage wsMessage = WsMessageParser.parse(message);
			switch (wsMessage.type()) {
			case "join": {
//				roomService.enter(wsMessage.data()., message);
			}
			default:

			}
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
