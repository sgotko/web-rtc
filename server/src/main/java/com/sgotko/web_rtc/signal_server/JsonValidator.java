package com.sgotko.web_rtc.signal_server;

import java.util.stream.Collectors;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

public class JsonValidator {

	private static final Validator validator;

	static {
		try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
			validator = factory.getValidator();
		}
	}

	public static <T> void validate(T object) {
		var violations = validator.validate(object);
		if (!violations.isEmpty()) {
			throw new IllegalArgumentException(violations.stream().map(v -> v.getPropertyPath() + ": " + v.getMessage())
					.collect(Collectors.joining("; ")));
		}
	}

}
