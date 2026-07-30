package com.insurance.demo.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	@Value("${app.jwt.secret}")
	private String jwtSecret;

	@Value("${app.jwt.expiration-ms}")
	private long jwtExpirationMs;

	public String generateToken(UserDetails userDetails, String fullName, String productSpeciality) {

		List<String> roles = userDetails.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();

		Date issuedAt = new Date();
		Date expiryDate = new Date(issuedAt.getTime() + jwtExpirationMs);

		return Jwts.builder().subject(userDetails.getUsername()).claim("roles", roles).claim("fullName", fullName)
				.claim("productSpeciality", productSpeciality)
				.issuedAt(issuedAt).expiration(expiryDate).signWith(getSigningKey()).compact();
	}

	public String extractUsername(String token) {
		return extractAllClaims(token).getSubject();
	}

	public boolean isTokenValid(String token, UserDetails userDetails) {
		String username = extractUsername(token);
		return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
	}

	private boolean isTokenExpired(String token) {
		return extractAllClaims(token).getExpiration().before(new Date());
	}

	private Claims extractAllClaims(String token) {
		return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
	}

	private SecretKey getSigningKey() {
		byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
		return Keys.hmacShaKeyFor(keyBytes);
	}

	public long getJwtExpirationMs() {
		return jwtExpirationMs;
	}
}
