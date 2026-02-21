package com.sgotko.web_rtc.signal_server.message;

import jakarta.validation.constraints.NotBlank;

public record SdpMessage(@NotBlank String type, @NotBlank String sdp) {

}
