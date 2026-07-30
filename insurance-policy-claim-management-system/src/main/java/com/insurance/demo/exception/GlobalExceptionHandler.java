package com.insurance.demo.exception;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.insurance.demo.dto.response.ErrorResponseDTO;
import com.insurance.demo.dto.response.ValidationErrorResponseDTO;
import com.insurance.demo.util.MessageConstants;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ResourceNotFoundException.class)
	public ResponseEntity<ErrorResponseDTO> handleResourceNotFound(ResourceNotFoundException ex,
			HttpServletRequest request) {
		log.warn("Resource not found: {}", ex.getMessage());
		return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
	}

	@ExceptionHandler(DuplicateResourceException.class)
	public ResponseEntity<ErrorResponseDTO> handleDuplicateResource(DuplicateResourceException ex,
			HttpServletRequest request) {
		log.warn("Duplicate resource: {}", ex.getMessage());
		return buildResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
	}

	@ExceptionHandler(BadRequestException.class)
	public ResponseEntity<ErrorResponseDTO> handleBadRequest(BadRequestException ex, HttpServletRequest request) {
		log.warn("Bad request: {}", ex.getMessage());
		return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ErrorResponseDTO> handleIllegalArgument(IllegalArgumentException ex,
			HttpServletRequest request) {
		log.warn("Illegal argument: {}", ex.getMessage());
		return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ValidationErrorResponseDTO> handleValidation(MethodArgumentNotValidException ex,
			HttpServletRequest request) {
		log.warn("Validation failed for request: {}", request.getRequestURI());
		Map<String, String> fieldErrors = new LinkedHashMap<>();
		for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
			fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
		}
		ValidationErrorResponseDTO error = new ValidationErrorResponseDTO(
				LocalDateTime.now(),
				HttpStatus.BAD_REQUEST.value(),
				"VALIDATION_FAILED",
				MessageConstants.Common.VALIDATION_FAILED,
				request.getRequestURI(),
				fieldErrors);
		return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
	}

	@ExceptionHandler(PlanNotActiveException.class)
	public ResponseEntity<ErrorResponseDTO> handlePlanNotActiveException(PlanNotActiveException ex,
			HttpServletRequest request) {
		ErrorResponseDTO error = new ErrorResponseDTO(LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(),
				MessageConstants.Common.PLAN_NOT_ACTIVE_ERROR_TYPE, ex.getMessage(), request.getRequestURI());
		return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
	}

	@ExceptionHandler({ org.springframework.orm.ObjectOptimisticLockingFailureException.class,
			org.hibernate.StaleObjectStateException.class })
	public ResponseEntity<ErrorResponseDTO> handleStaleStateException(Exception ex, HttpServletRequest request) {
		ErrorResponseDTO error = new ErrorResponseDTO(LocalDateTime.now(), HttpStatus.CONFLICT.value(), "CONFLICT",
				MessageConstants.Common.CONFLICT_RECORD_MODIFIED, request.getRequestURI());
		return new ResponseEntity<>(error, HttpStatus.CONFLICT);
	}

	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ErrorResponseDTO> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
			HttpServletRequest request) {
		log.warn("Invalid path variable or request parameter: {}", ex.getMessage());
		return buildResponse(HttpStatus.BAD_REQUEST, MessageConstants.Common.INVALID_INPUT, request);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ErrorResponseDTO> handleInvalidJson(HttpMessageNotReadableException ex,
			HttpServletRequest request) {
		log.warn("Invalid JSON request body");
		return buildResponse(HttpStatus.BAD_REQUEST, MessageConstants.Common.INVALID_JSON_BODY, request);
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ErrorResponseDTO> handleDataIntegrity(DataIntegrityViolationException ex,
			HttpServletRequest request) {
		log.error("Database constraint violation: {}", ex.getMessage());
		return buildResponse(HttpStatus.CONFLICT, MessageConstants.Common.DB_CONSTRAINT_VIOLATION, request);
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ErrorResponseDTO> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
		log.warn("Access denied: {}", ex.getMessage());
		return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage(), request);
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<ErrorResponseDTO> handleBadCredentials(BadCredentialsException ex,
			HttpServletRequest request) {
		log.warn("Bad credentials: {}", ex.getMessage());
		return buildResponse(HttpStatus.UNAUTHORIZED, MessageConstants.Auth.INVALID_CREDENTIALS, request);
	}

	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<ErrorResponseDTO> handleAuthenticationException(AuthenticationException ex,
			HttpServletRequest request) {
		log.warn("Authentication failed: {}", ex.getMessage());
		return buildResponse(HttpStatus.UNAUTHORIZED, MessageConstants.Security.UNAUTHORIZED, request);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponseDTO> handleGeneric(Exception ex, HttpServletRequest request) {
		log.error("Unexpected error occurred", ex);
		return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, MessageConstants.Common.INTERNAL_SERVER_ERROR, request);
	}

	private ResponseEntity<ErrorResponseDTO> buildResponse(HttpStatus status, String message,
			HttpServletRequest request) {
		ErrorResponseDTO error = new ErrorResponseDTO();
		error.setTimestamp(LocalDateTime.now());
		error.setStatusCode(status.value());
		error.setErrorType(status.name());
		error.setMessage(message);
		error.setRequestPath(request.getRequestURI());
		return new ResponseEntity<>(error, status);
	}
}
