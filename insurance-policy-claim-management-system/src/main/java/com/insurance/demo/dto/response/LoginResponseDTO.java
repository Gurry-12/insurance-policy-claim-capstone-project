package com.insurance.demo.dto.response;

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
}
