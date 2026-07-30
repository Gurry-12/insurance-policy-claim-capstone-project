package com.insurance.demo.util;

import java.util.Collection;

import com.insurance.demo.exception.BadRequestException;

/**
 * Shared pagination validation utility.
 * Centralises page/size/sortField validation that was duplicated across all service classes.
 */
public class PaginationValidator {

    private static final int MAX_PAGE_SIZE = 100;

    private PaginationValidator() {
    }

    public static void validate(int page, int size) {
        if (page < 0) {
            throw new BadRequestException("Page number cannot be negative.");
        }
        if (size <= 0) {
            throw new BadRequestException("Page size must be greater than zero.");
        }
        if (size > MAX_PAGE_SIZE) {
            throw new BadRequestException("Page size cannot exceed " + MAX_PAGE_SIZE + ".");
        }
    }

    public static void validateSortField(String sortBy, Collection<String> allowedFields) {
        if (!allowedFields.contains(sortBy)) {
            throw new BadRequestException("Invalid sort field: '" + sortBy + "'. Allowed fields: " + allowedFields);
        }
    }
}