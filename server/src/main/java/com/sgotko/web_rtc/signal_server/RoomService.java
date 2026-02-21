package com.sgotko.web_rtc.signal_server;

import java.util.Collection;

public interface RoomService {

	void enter(String roomId, String userId);

	Collection<String> getUsers(String roomId);

	void leave(String roomId, String userId);

}
