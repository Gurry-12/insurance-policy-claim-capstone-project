package com.insurance.demo.util;

import java.util.UUID;

public class PolicyNumberGenerator {

	private PolicyNumberGenerator() {
	}

	public static String generatePolicyNumber() {

		return "POL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
	}
}