package com.insurance.demo.exception;

import com.insurance.demo.util.MessageConstants;

public class PlanNotActiveException extends RuntimeException {

    public PlanNotActiveException() {
        super(MessageConstants.PolicyPlan.PLAN_NOT_ACTIVE);
    }
}