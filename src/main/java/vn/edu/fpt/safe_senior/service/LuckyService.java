package vn.edu.fpt.safe_senior.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.edu.fpt.safe_senior.dto.response.SpinInfoResponse;
import vn.edu.fpt.safe_senior.dto.response.SpinResponse;
import vn.edu.fpt.safe_senior.entity.*;
import vn.edu.fpt.safe_senior.enums.SpinPrize;
import vn.edu.fpt.safe_senior.enums.VoucherSource;
import vn.edu.fpt.safe_senior.enums.VoucherStatus;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.repository.*;

import java.util.List;
import java.util.Random;


@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LuckyService {
    UserRepository userRepository;
    SpinHistoryRepository spinHistoryRepository;
    UserSpinBalanceRepository spinBalanceRepository;
    VoucherRepository voucherRepository;
    UserVoucherRepository userVoucherRepository;

    public SpinResponse spin(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));


        UserSpinBalance balance = spinBalanceRepository.findByUserId(user.getId())
                .orElse(UserSpinBalance.builder()
                        .user(user)
                        .remainingSpins(0)
                        .totalSpins(0)
                        .build());

        if (balance.getRemainingSpins() <= 0)
            throw new AppException(ErrorCode.NO_SPIN_LEFT);

        SpinPrize prize = weightedRandom();


        balance.setRemainingSpins(balance.getRemainingSpins() - 1);
        balance.setTotalSpins(balance.getTotalSpins() + 1);


        if (prize == SpinPrize.EXTRA_SPIN) {
            balance.setRemainingSpins(balance.getRemainingSpins() + 1);
        }
        spinBalanceRepository.save(balance);
        if (prize == SpinPrize.VOUCHER_10 || prize == SpinPrize.VOUCHER_20) {
            String voucherCode = prize == SpinPrize.VOUCHER_10 ? "SPIN_VOUCHER_10" : "SPIN_VOUCHER_20";

            Voucher voucher = voucherRepository.findByCode(voucherCode)
                    .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

            userVoucherRepository.save(UserVoucher.builder()
                    .user(user)
                    .voucher(voucher)
                    .status(VoucherStatus.AVAILABLE)
                    .source(VoucherSource.SPIN)
                    .build());
        }
        spinHistoryRepository.save(SpinHistory.builder()
                .user(user)
                .prizeIndex(prize.prizeIndex)
                .prizeLabel(prize.label)
                .prizeType(prize.name())
                .build());

        return SpinResponse.builder()
                .prizeIndex(prize.prizeIndex)
                .prizeLabel(prize.label)
                .remainingSpins(balance.getRemainingSpins())
                .totalSpins(balance.getTotalSpins())
                .build();
    }


    private SpinPrize weightedRandom() {
        int rand = new Random().nextInt(100);
        for (SpinPrize p : SpinPrize.values()) {
            rand -= p.weight;
            if (rand < 0) return p;
        }
        return SpinPrize.BAD_LUCK;
    }

    public SpinInfoResponse getSpinInfo(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        UserSpinBalance balance = spinBalanceRepository.findByUserId(user.getId())
                .orElse(UserSpinBalance.builder()
                        .user(user)
                        .remainingSpins(0)
                        .totalSpins(0)
                        .build());

        List<SpinInfoResponse.SpinHistoryItem> history =
                spinHistoryRepository.findByUserIdOrderBySpunAtDesc(user.getId())
                        .stream()
                        .limit(20)
                        .map(h -> SpinInfoResponse.SpinHistoryItem.builder()
                                .prizeIndex(h.getPrizeIndex())
                                .prizeLabel(h.getPrizeLabel())
                                .spunAt(h.getSpunAt())
                                .build())
                        .toList();

        return SpinInfoResponse.builder()
                .remainingSpins(balance.getRemainingSpins())
                .totalSpins(balance.getTotalSpins())
                .history(history)
                .build();
    }
}
