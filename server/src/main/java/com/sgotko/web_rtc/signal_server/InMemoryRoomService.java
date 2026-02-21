package com.sgotko.web_rtc.signal_server;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.java_websocket.WebSocket;

public class InMemoryRoomService implements RoomService {

	private final Map<String, Room> rooms;
	private final Map<String, Set<WebSocket>> connections;

	public InMemoryRoomService() {
		this.rooms = new HashMap<>();
		this.connections = new HashMap<>();
	}

	@Override
	public void enter(String roomId, String userId) {
		Room room = rooms.get(roomId);
		if (room != null) {
			room.addUser(userId);
		}
	}

	@Override
	public Collection<String> getUsers(String roomId) {
		Room room = rooms.get(roomId);
		if (room != null) {
			return room.getUsers();
		}
		return Collections.emptySet();
	}

	@Override
	public void leave(String roomId, String userId) {
		Room room = rooms.get(roomId);
		if (room != null) {
			room.removeUser(userId);
		}
	}

	@Override
	public String toString() {
		return "InMemoryRoomService [rooms=" + rooms + "]";
	}

}
