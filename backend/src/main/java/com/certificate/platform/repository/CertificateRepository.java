package com.certificate.platform.repository;

import com.certificate.platform.model.Certificate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    Optional<Certificate> findByUniqueCode(String uniqueCode);
    Page<Certificate> findByInstitutionId(Long institutionId, Pageable pageable);
}
