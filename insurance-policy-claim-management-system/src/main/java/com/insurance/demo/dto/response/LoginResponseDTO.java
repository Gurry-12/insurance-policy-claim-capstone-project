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
public class LoginResponseDTO {

    private Long userId;

    private String fullName;

    private String email;

    private String role;

    private String token;

    private String tokenType;

    /**
     * The refresh token issued at login. Handed to the controller so it can be
     * set as an HttpOnly cookie; never serialized into the JSON body.
     */
    @JsonIgnore
    private String refreshToken;
}
