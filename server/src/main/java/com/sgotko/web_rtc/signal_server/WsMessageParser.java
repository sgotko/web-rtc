package com.sgotko.web_rtc.signal_server;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.module.paramnames.ParameterNamesModule;
import com.sgotko.web_rtc.signal_server.message.EventData;
import com.sgotko.web_rtc.signal_server.message.JoinMessage;
import com.sgotko.web_rtc.signal_server.message.WsMessage;

public class WsMessageParser {

	private static final ObjectMapper MAPPER = new ObjectMapper();

	static {
		MAPPER.registerModule(new Jdk8Module()).registerModule(new ParameterNamesModule());
	}

	private static final Map<String, Class<? extends EventData>> TYPE_TO_CLASS = new ConcurrentHashMap<>();

	static {
		TYPE_TO_CLASS.put("join", JoinMessage.class);
	}

	public static WsMessage parse(final String json) {
		try {
			JsonNode root = MAPPER.readTree(json);

			String type = getRequiredText(root, "type");
			JsonNode dataNode = root.get("data");
			if (dataNode == null || !dataNode.isObject()) {
				throw new IllegalArgumentException("'data' must be an object");
			}

			Class<? extends EventData> dataType = TYPE_TO_CLASS.get(type);
			if (dataType == null) {
				throw new IllegalArgumentException("Unknown message type: " + type);
			}

			EventData data = MAPPER.treeToValue(dataNode, dataType);
			JsonValidator.validate(data);

			return new WsMessage(type, data);
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

	private static long getRequiredNumber(final JsonNode node, final String field) {
		final JsonNode value = node.get(field);
		if (value == null || !value.isNumber()) {
			throw new IllegalArgumentException("Field '" + field + "' is required and must be a number");
		}
		return value.asLong();
	}

}
