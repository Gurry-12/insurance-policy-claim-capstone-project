package com.insurance.demo.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RefreshResponseDTO {

	private String accessToken;

	private String tokenType;

	/**
	 * The rotated refresh token. Handed to the controller so it can be set as an
	 * HttpOnly cookie; never serialized into the JSON body.
	 */
	@JsonIgnore
	private String refreshToken;
}
