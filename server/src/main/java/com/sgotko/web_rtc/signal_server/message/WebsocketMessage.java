package com.sgotko.web_rtc.signal_server.message;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.sgotko.web_rtc.signal_server.WsMessageParser;

public class WebsocketMessage {

	public final String type;
	public final MessagePayload payload;

	public WebsocketMessage(final String type, final MessagePayload payload) {
		this.type = type;
		this.payload = payload;
	}

	@JsonCreator
	public static WebsocketMessage fromJson(final String json) throws IllegalArgumentException {
		return WsMessageParser.parse(json);
	}

}