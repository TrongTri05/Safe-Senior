package vn.edu.fpt.safe_senior.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.safe_senior.entity.Role;

@Repository
public interface RoleRepository  extends JpaRepository<Role, String> {
    Role findByName(String name);
    boolean existsByName(String name);
}
