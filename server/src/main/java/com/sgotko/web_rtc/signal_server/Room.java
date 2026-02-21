package com.sgotko.web_rtc.signal_server;

import java.util.Collection;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class Room {

	private final String id;

	private final Set<String> users = ConcurrentHashMap.newKeySet();

	public Room(final String id) {
		this.id = id;
	}

	public boolean addUser(final String userId) {
		return users.add(userId);
	}

	public boolean removeUser(final String userId) {
		return users.remove(userId);
	}

	public Collection<String> getUsers() {
		return Collections.unmodifiableCollection(users);
	}

	@Override
	public String toString() {
		return "Room [id=" + id + ", users=" + users + "]";
	}

}
