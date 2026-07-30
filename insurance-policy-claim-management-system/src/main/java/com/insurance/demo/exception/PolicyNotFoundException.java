package com.insurance.demo.exception;

import com.insurance.demo.util.MessageConstants;

public class PolicyNotFoundException extends RuntimeException {

    public PolicyNotFoundException(Long id) {
        super(MessageConstants.Policy.NOT_FOUND + id);
    }
}