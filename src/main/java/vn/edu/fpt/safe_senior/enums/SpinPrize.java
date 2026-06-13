package vn.edu.fpt.safe_senior.enums;


public enum SpinPrize {
    VOUCHER_10 (0, "Voucher 10%",     20),
    BAD_LUCK   (2, "May mắn lần sau", 40),
    EXTRA_SPIN (4, "+1 Lượt quay",    30),
    VOUCHER_20 (7, "Voucher 20%",     10);

    public final int prizeIndex;
    public final String label;
    public final int weight;

    SpinPrize(int prizeIndex, String label, int weight) {
        this.prizeIndex = prizeIndex;
        this.label = label;
        this.weight = weight;
    }
}
