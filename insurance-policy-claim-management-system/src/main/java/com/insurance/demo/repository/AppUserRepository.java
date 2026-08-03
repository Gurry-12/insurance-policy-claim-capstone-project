package com.insurance.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.insurance.demo.enums.Role;
import com.insurance.demo.model.AppUser;

import jakarta.persistence.LockModeType;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, Long>, JpaSpecificationExecutor<AppUser> {

	boolean existsByEmail(String email);

	Optional<AppUser> findByEmail(String email);
	
	boolean existsByMobileNumber(String mobileNumber);

	Optional<AppUser> findByEmailAndIsActiveTrue(String email);

	List<AppUser> findByRoleIn(List<Role> roles);
	
	List<AppUser> findByRoleNot(Role role);

	Page<AppUser> findByRoleAndIsActive(Role role, Boolean isActive, Pageable pageable);

	@Query("SELECT a FROM AppUser a WHERE a.role = :role")
	Page<AppUser> findByRole(Role role, Pageable pageable);

	Page<AppUser> findByIsActive(Boolean isActive, Pageable pageable);

	Optional<AppUser> findByEmailAndMobileNumber(String email, String mobileNumber);

	/**
	 * Locks the user row for update. Used to serialize session-family
	 * revocation per user so concurrent refresh replays cannot deadlock each
	 * other on the bulk token update.
	 */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("SELECT a FROM AppUser a WHERE a.id = :id")
	Optional<AppUser> findByIdForUpdate(@Param("id") Long id);

}
