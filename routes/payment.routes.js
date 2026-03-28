const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middlewares/auth");

// ===============================
// ✅ CREATE PAYMENT (รับชำระเงิน + ออกใบเสร็จ)
// ===============================
router.post("/", authMiddleware, async (req, res) => {
  const payments = mongoose.connection.collection("payments");
  const bookings = mongoose.connection.collection("bookings");

  // 🎯 ต้องมีบรรทัดนี้ถึงจะบันทึกใบเสร็จได้!
  const receipts = mongoose.connection.collection("receipts");

  try {
    const { booking_id, payment_method } = req.body;

    if (!booking_id || !payment_method) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }

    const booking = await bookings.findOne({
      booking_id: parseInt(booking_id),
    });

    if (!booking) {
      return res.status(404).json({ message: "ไม่พบ booking" });
    }

    if (booking.payment_status === "paid") {
      return res.status(400).json({ message: "ชำระเงินแล้ว" });
    }

    // 1. สร้าง payment_id
    const lastPayment = await payments
      .find()
      .sort({ payment_id: -1 })
      .limit(1)
      .toArray();
    const payment_id = lastPayment.length
      ? lastPayment[0].payment_id + 1
      : 8001;

    // 2. บันทึกลงตาราง payments
    await payments.insertOne({
      payment_id,
      booking_id: parseInt(booking_id),
      total_amount: booking.total_price,
      payment_method,
      payment_status: "paid",
      paid_at: new Date(),
    });

    // 3. 🧾 สร้างใบเสร็จลงตาราง receipts
    const lastReceipt = await receipts
      .find()
      .sort({ receipt_id: -1 })
      .limit(1)
      .toArray();
    const receipt_id = lastReceipt.length
      ? lastReceipt[0].receipt_id + 1
      : 9001;

    const receipt_number = `RC-${new Date().getFullYear()}-${String(receipt_id - 9000).padStart(4, "0")}`;

    await receipts.insertOne({
      receipt_id,
      payment_id,
      receipt_number,
      issued_at: new Date(),
    });

    // 4. 🔄 อัปเดตสถานะใน bookings ว่าจ่ายแล้ว + ทำงานเสร็จแล้ว (คิวจะหายไปจากหน้าจอ)
    await bookings.updateOne(
      { booking_id: parseInt(booking_id) },
      {
        $set: {
          payment_status: "paid",
          status: "completed",
        },
      },
    );

    res.json({
      message: "payment success",
      payment_id,
      receipt_number,
    });
  } catch (err) {
    res.status(500).json({ message: "payment error" });
  }
});

// ===============================
// ✅ GET PAYMENT BY BOOKING (ดูบิล)
// ===============================
router.get("/:booking_id", authMiddleware, async (req, res) => {
  const payments = mongoose.connection.collection("payments");
  const bookings = mongoose.connection.collection("bookings");

  try {
    const booking_id = parseInt(req.params.booking_id);
    const payment = await payments.findOne({ booking_id });

    if (!payment) {
      return res.status(404).json({ message: "ไม่พบ payment" });
    }

    const booking = await bookings.findOne({ booking_id });

    if (
      !booking ||
      (booking.user_id !== req.user.user_id &&
        req.user.user_role !== "staff" &&
        req.user.user_role !== "admin")
    ) {
      return res.status(403).json({ message: "forbidden" });
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: "fetch payment error" });
  }
});

module.exports = router;
