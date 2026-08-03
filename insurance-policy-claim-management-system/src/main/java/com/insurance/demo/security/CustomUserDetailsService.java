package com.insurance.demo.security;

import com.insurance.demo.model.AppUser;
import com.insurance.demo.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AppUserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        AppUser appUser = userRepository.findByEmailAndIsActiveTrue(email)
                .orElseThrow(() -> {
                    log.debug("User not found or inactive with email: {}", email);
                    return new UsernameNotFoundException(com.insurance.demo.util.MessageConstants.Auth.INVALID_CREDENTIALS);
                });

        return new AppUserDetails(appUser);
    }
}
