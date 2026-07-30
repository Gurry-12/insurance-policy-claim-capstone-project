package com.insurance.demo.util;

import java.util.UUID;

public class TransactionReferenceGenerator {

	private TransactionReferenceGenerator() {
	}

	public static String generateTransactionReference() {
		return "TRX-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
	}
}