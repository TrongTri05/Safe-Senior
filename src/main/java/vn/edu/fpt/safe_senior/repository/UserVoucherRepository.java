package vn.edu.fpt.safe_senior.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.safe_senior.entity.UserVoucher;


import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, UUID> {
    List<UserVoucher> findByUser_Id(String userId);

    Optional<UserVoucher> findByOrder_Id(String orderId);

    List<UserVoucher> findAllByUser_IdAndVoucher_Id(String userId, UUID voucherId);

}
