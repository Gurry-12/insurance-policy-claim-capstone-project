package com.insurance.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurance.demo.model.StaffSpeciality;
import com.insurance.demo.model.AppUser;

@Repository
public interface StaffSpecialityRepository extends JpaRepository<StaffSpeciality, Long> {
	StaffSpeciality findByStaff(AppUser staff);
}