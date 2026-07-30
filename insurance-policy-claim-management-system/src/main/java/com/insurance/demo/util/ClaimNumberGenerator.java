package com.insurance.demo.util;

import java.util.UUID;

public class ClaimNumberGenerator {

	private ClaimNumberGenerator() {
	}

	public static String generateClaimNumber() {
		return "CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
	}
}