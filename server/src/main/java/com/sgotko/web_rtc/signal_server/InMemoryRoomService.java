package com.sgotko.web_rtc.signal_server;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class InMemoryRoomService implements RoomService {

	private final Map<String, Set<String>> rooms;

	public InMemoryRoomService() {
		this.rooms = new HashMap<String, Set<String>>();
	}

	@Override
	public void enter(String roomId, String userId) {
		rooms.computeIfAbsent(roomId, (k) -> new HashSet<>()).add(userId);
	}

	@Override
	public Collection<String> getUsers(String roomId) {
		return rooms.getOrDefault(roomId, Collections.emptySet());
	}

	@Override
	public void leave(String roomId, String userId) {
		rooms.computeIfAbsent(roomId, (k) -> new HashSet<>()).remove(userId);
	}

	@Override
	public String toString() {
		return "InMemoryRoomService [rooms=" + rooms + "]";
	}

}
