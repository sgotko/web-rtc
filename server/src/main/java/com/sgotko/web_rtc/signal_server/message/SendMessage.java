package com.sgotko.web_rtc.signal_server.message;

import jakarta.validation.constraints.NotBlank;

public record SendMessage(@NotBlank(message = "User ID cannot be empty") String userId,
		@NotBlank(message = "Text cannot be empty") String text) implements MessagePayload {
}
