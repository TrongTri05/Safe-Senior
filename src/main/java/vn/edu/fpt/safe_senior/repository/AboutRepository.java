package vn.edu.fpt.safe_senior.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.safe_senior.entity.About;

import java.util.List;
import java.util.UUID;

@Repository
public interface AboutRepository extends JpaRepository<About, UUID> {
    List<About> findAllByOrderByDisplayOrderAsc();
}
