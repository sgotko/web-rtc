package com.sgotko.web_rtc.signal_server.message;

import jakarta.validation.constraints.NotBlank;

public record LeaveRoomMessage(@NotBlank(message = "Room ID cannot be empty") String roomId,
		@NotBlank(message = "User ID cannot be empty") String userId) implements MessagePayload {

}
