package com.sgotko.web_rtc.signal_server;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.module.paramnames.ParameterNamesModule;
import com.sgotko.web_rtc.signal_server.message.JoinRoomMessage;
import com.sgotko.web_rtc.signal_server.message.LeaveRoomMessage;
import com.sgotko.web_rtc.signal_server.message.MessagePayload;
import com.sgotko.web_rtc.signal_server.message.SendMessage;
import com.sgotko.web_rtc.signal_server.message.WebsocketMessage;

public class WsMessageParser {

	private static final ObjectMapper MAPPER = new ObjectMapper();

	static {
		MAPPER.registerModule(new Jdk8Module()).registerModule(new ParameterNamesModule());
	}

	private static final Map<String, Class<? extends MessagePayload>> TYPE_TO_CLASS = new ConcurrentHashMap<>();

	static {
		TYPE_TO_CLASS.put("joinRoom", JoinRoomMessage.class);
		TYPE_TO_CLASS.put("leaveRoom", LeaveRoomMessage.class);
		TYPE_TO_CLASS.put("sendMessage", SendMessage.class);
	}

	public static WebsocketMessage parse(final String json) throws IllegalArgumentException {
		try {
			JsonNode root = MAPPER.readTree(json);

			String type = getRequiredText(root, "type");
			JsonNode payloadNode = root.get("payload");
			if (payloadNode == null || !payloadNode.isObject()) {
				throw new IllegalArgumentException("'payload' must be an object");
			}

//			Class<? extends MessagePayload> dataType = TYPE_TO_CLASS.get(type);
//			if (dataType == null) {
//				throw new IllegalArgumentException("Unknown message type: " + type);
//			}
//
//			MessagePayload data = MAPPER.treeToValue(payloadNode, dataType);
//			JsonValidator.validate(data);

			return new WebsocketMessage(type, null);
		} catch (Exception e) {
			throw new IllegalArgumentException("Error during parsing JSON: " + e.getMessage(), e);
		}
	}

	private static String getRequiredText(final JsonNode node, final String field) {
		final JsonNode value = node.get(field);
		if (value == null || !value.isTextual()) {
			throw new IllegalArgumentException("Field '" + field + "' is required and must be a string");
		}
		return value.asText();
	}

}
