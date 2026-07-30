package com.insurance.demo.security;

import com.insurance.demo.model.AppUser;
import com.insurance.demo.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AppUserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        
        log.info("Loading user from database with email: {}", email);

        AppUser appUser = userRepository.findByEmailAndIsActiveTrue(email)
                .orElseThrow(() -> {
                    log.warn("User not found or inactive with email: {}", email);
                    return new UsernameNotFoundException(com.insurance.demo.util.MessageConstants.Auth.INVALID_CREDENTIALS);
                });

        // Convert single Role enum to Spring Security authority
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(appUser.getRole().name());

        return new User(
                appUser.getEmail(),           // username = email
                appUser.getPassword(),
                appUser.getIsActive(),        // enabled
                true,                         // accountNonExpired
                true,                         // credentialsNonExpired
                true,                         // accountNonLocked
                Collections.singletonList(authority)
        );
    }
}