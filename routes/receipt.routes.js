router.post("/", authMiddleware, async (req, res) => {
  const payments = mongoose.connection.collection("payments");
  const bookings = mongoose.connection.collection("bookings");
  const receipts = mongoose.connection.collection("receipts"); // 🎯 เพิ่มการเรียกใช้ receipts

  try {
    const { booking_id, payment_method } = req.body;
    // ... (โค้ดเช็ค booking และกันจ่ายซ้ำเหมือนเดิม) ...

    // 🔢 1. สร้าง payment_id
    const lastPayment = await payments
      .find()
      .sort({ payment_id: -1 })
      .limit(1)
      .toArray();
    const payment_id = lastPayment.length
      ? lastPayment[0].payment_id + 1
      : 8001;

    // 💰 2. บันทึกลง payments
    await payments.insertOne({
      payment_id,
      booking_id: parseInt(booking_id),
      total_amount: booking.total_price,
      payment_method,
      payment_status: "paid",
      paid_at: new Date(),
    });

    // 🧾 3. สร้างใบเสร็จลงคอลเลกชัน receipts (ตามโครงสร้างในรูป)
    const lastReceipt = await receipts
      .find()
      .sort({ receipt_id: -1 })
      .limit(1)
      .toArray();
    const receipt_id = lastReceipt.length
      ? lastReceipt[0].receipt_id + 1
      : 9001;

    // สร้างเลขใบเสร็จแบบ RC-2026-0001
    const receipt_number = `RC-${new Date().getFullYear()}-${String(receipt_id - 9000).padStart(4, "0")}`;

    await receipts.insertOne({
      receipt_id,
      payment_id,
      receipt_number,
      issued_at: new Date(),
    });

    // 🔄 4. อัปเดตสถานะใน bookings (เพื่อให้หายไปจากหน้า Dashboard)
    await bookings.updateOne(
      { booking_id: parseInt(booking_id) },
      { $set: { payment_status: "paid", status: "completed" } }, // 🎯 เปลี่ยน status เป็น completed งานจะได้จบ
    );

    res.json({
      message: "payment success",
      payment_id,
      receipt_number, // 🚀 ส่งเลขใบเสร็จกลับไปให้ Frontend โชว์ด้วย
    });
  } catch (err) {
    res.status(500).json({ message: "payment error" });
  }
});
