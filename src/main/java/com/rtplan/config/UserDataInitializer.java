package com.rtplan.config;

import com.rtplan.entity.Driver;
import com.rtplan.entity.User;
import com.rtplan.repository.DriverRepository;
import com.rtplan.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class UserDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;

    @Override
    public void run(String... args) {
        seedUserAndDriver("Mark", "Mark", "MilaMax1819", "DISPATCHER");
        seedUserAndDriver("Ed", "Ed", "MilaMax1819", "DISPATCHER");
    }

    private void seedUserAndDriver(String username, String fullName, String password, String role) {
        userRepository.findByUsernameIgnoreCase(username).ifPresentOrElse(
                user -> log.info("User '{}' already exists in SQL Server.", username),
                () -> {
                    User newUser = User.builder()
                            .username(username)
                            .fullName(fullName)
                            .password(password)
                            .role(role)
                            .isActive(true)
                            .build();
                    userRepository.save(newUser);
                    log.info("Created user '{}' with initial credentials.", username);
                }
        );

        // Also ensure a corresponding Driver entry exists for assignments
        boolean driverExists = driverRepository.findAll().stream()
                .anyMatch(d -> fullName.equalsIgnoreCase(d.getFullName()));

        if (!driverExists) {
            Driver driver = Driver.builder()
                    .fullName(fullName)
                    .isActive(true)
                    .build();
            driverRepository.save(driver);
            log.info("Created driver entry for '{}'.", fullName);
        }
    }
}
