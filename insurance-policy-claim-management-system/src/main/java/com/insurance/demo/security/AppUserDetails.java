package com.insurance.demo.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.insurance.demo.model.AppUser;

public class AppUserDetails implements UserDetails {

	private static final long serialVersionUID = 1L;

	private final AppUser appUser;

	public AppUserDetails(AppUser appUser) {
		this.appUser = appUser;
	}

	public AppUser getAppUser() {
		return appUser;
	}

	public Long getId() {
		return appUser != null ? appUser.getId() : null;
	}

	public Long getTokenVersion() {
		return appUser.getTokenVersion() != null ? appUser.getTokenVersion() : 0L;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority(appUser.getRole().name()));
	}

	@Override
	public String getPassword() {
		return appUser.getPassword();
	}

	@Override
	public String getUsername() {
		return appUser.getEmail();
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return Boolean.TRUE.equals(appUser.getIsActive());
	}
}
