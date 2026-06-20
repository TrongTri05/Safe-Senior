package vn.edu.fpt.safe_senior.service.admin;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vn.edu.fpt.safe_senior.entity.Voucher;
import vn.edu.fpt.safe_senior.repository.VoucherRepository;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class VoucherExpiryScheduler {
    private final VoucherRepository voucherRepository;

    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void deactivateExpiredVouchers() {
        List<Voucher> expired = voucherRepository
                .findByIsActiveTrueAndExpiredAtBefore(LocalDate.now());
        expired.forEach(v -> v.setIsActive(false));
        voucherRepository.saveAll(expired);
    }
}
