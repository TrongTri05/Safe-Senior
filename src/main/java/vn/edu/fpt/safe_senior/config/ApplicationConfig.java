package vn.edu.fpt.safe_senior.config;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.edu.fpt.safe_senior.entity.Role;
import vn.edu.fpt.safe_senior.entity.User;
import vn.edu.fpt.safe_senior.enums.RoleEnum;
import vn.edu.fpt.safe_senior.repository.RoleRepository;
import vn.edu.fpt.safe_senior.repository.UserRepository;

import java.util.HashSet;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationConfig {
    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;


    //Method check neu chua co admin tu tao
    @Bean
    ApplicationRunner applicationRunner(UserRepository userRepository) {
        return args -> {
            if (roleRepository.findByName(RoleEnum.ADMIN.name()).isEmpty()) {
                Role role = new Role();
                role.setName(RoleEnum.ADMIN.name());
                roleRepository.save(role);
            }
            if (userRepository.findByUsername("admin").isEmpty()) {
                Role adminRole = roleRepository.findByName(RoleEnum.ADMIN.name()).orElseThrow(() -> new RuntimeException("Role ADMIN not found"));
                var roles = new HashSet<Role>();
                roles.add(adminRole);
                User user = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin"))
                        .roles(roles)
                        .isActive(true)
                        .build();
                userRepository.save(user);
                log.warn("Admin user has been created");
            }
        };
    }
}

