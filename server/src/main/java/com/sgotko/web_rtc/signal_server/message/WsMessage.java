package com.sgotko.web_rtc.signal_server.message;

public record WsMessage(String type, EventData data) {
}