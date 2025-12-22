package com.sgotko.web_rtc.signal_server;

import java.net.InetSocketAddress;

import org.java_websocket.server.WebSocketServer;

import picocli.CommandLine.Option;

public class WebSocketCommand implements Runnable {

	@Option(names = { "-p", "--port" }, description = "Port number", defaultValue = "3300")
	int port;

	@Override
	public void run() {
		System.out.println(port);
		RoomService roomService = new InMemoryRoomService();
		InetSocketAddress address = new InetSocketAddress("0.0.0.0", port);
		WebSocketServer server = new Server(address, roomService);
		server.run();
	}

}
