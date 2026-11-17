package com.certificate.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.certificate.platform.model")
@EnableJpaRepositories(basePackages = "com.certificate.platform.repository")
public class CertificateApplication {

    public static void main(String[] args) {
        SpringApplication.run(CertificateApplication.class, args);
    }
}
