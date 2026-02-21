package com.sgotko.web_rtc.signal_server.message;

import jakarta.validation.constraints.NotNull;

public record MessageSended(@NotNull() String userId, @NotNull() String text) {

}
