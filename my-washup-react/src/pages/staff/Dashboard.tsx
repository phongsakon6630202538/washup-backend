import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

interface Booking {
  booking_id: number;
  booking_datetime: string;
  status: string;
  customer_name?: string;
  payment_status: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_plate?: string;

  services?: string[];
  total_price?: number;
}
export default function StaffDashboard() {
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<Booking | null>(
    null,
  ); // จำว่ากำลังกดคันไหน
  const [showInspectionModal, setShowInspectionModal] =
    useState<Booking | null>(null);

  const [carCondition, setCarCondition] = useState("ปกติ");
  const [staffNote, setStaffNote] = useState("");

  const [showCompleteModal, setShowCompleteModal] = useState<Booking | null>(
    null,
  ); // สำหรับ STEP 3

  // 1. ตัวแปรเก็บว่ากำลังเปิด Popup ชำระเงินของคันไหน
  const [showPaymentModal, setShowPaymentModal] = useState<Booking | null>(
    null,
  );

  // 2. เก็บช่องทางชำระเงิน (cash, transfer, credit)
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [cashReceived, setCashReceived] = useState<number | string>("");
  const [change, setChange] = useState<number>(0);
  const navigate = useNavigate();
  const [showReceipt, setShowReceipt] = useState<any>(null);
  // 🎯 เพิ่ม useEffect นี้เพื่อคำนวณเงินทอนอัตโนมัติ
  useEffect(() => {
    if (showPaymentModal && paymentMethod === "cash") {
      const total = showPaymentModal.total_price || 300;
      if (Number(cashReceived) >= total) {
        setChange(Number(cashReceived) - total);
      } else {
        setChange(0);
      }
    }
  }, [cashReceived, paymentMethod, showPaymentModal]);

  const fetchBookings = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("ไม่มี Token กรุณาล็อกอินใหม่");
      return;
    }

    fetch("http://localhost:3000/api/bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setJobs(data);
        }
      })
      .catch((err) => console.error("โหลดข้อมูลพัง:", err));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // ฟังก์ชันอัปเดตสถานะรถ (PUT)
  // 👈 เพิ่ม extraData เข้ามาเผื่อส่งข้อมูลอื่นนอกจาก status
  const updateStatus = async (
    bookingId: number,
    newStatus: string,
    extraData: any = {},
  ) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://localhost:3000/api/bookings/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          // 👈 เอา extraData มารวมกับ status แล้วส่งไปทีเดียว
          body: JSON.stringify({ status: newStatus, ...extraData }),
        },
      );

      if (response.ok) {
        fetchBookings();
      } else {
        const data = await response.json();
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error("เชื่อมต่อพัง:", err);
    }
  };

  const handlePayment = async (bookingId: number) => {
    // 🛑 1. ดักเช็คเงิน (เหมือนเดิม)
    const total = showPaymentModal?.total_price || 300;

    if (paymentMethod === "cash" && Number(cashReceived) < total) {
      alert("รับเงินมาไม่ครบยอดชำระ กรุณาตรวจสอบอีกครั้ง!");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:3000/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: bookingId,
          payment_method: paymentMethod,
        }),
      });

      const data = await response.json();

      if (response.ok || data.message === "ชำระเงินแล้ว") {
        // เซตข้อมูลใส่ Popup ใบเสร็จ (แทนการเด้งหน้าใหม่)
        setShowReceipt({
          booking: showPaymentModal,
          paymentId: data.payment_id || bookingId,
          details: {
            method: paymentMethod,
            received: cashReceived,
            change: change,
            total: total,
          },
        });

        // ✅ 4. เคลียร์ข้อมูลหน้า Dashboard
        setJobs((prevJobs) =>
          prevJobs.filter((job) => job.booking_id !== bookingId),
        );
        setShowPaymentModal(null);
        setCashReceived("");
        setChange(0); // รีเซ็ตเงินทอน
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error("เชื่อมต่อพัง:", err);
    }
  };
  // ฟังก์ชันตัวช่วยดึงข้อมูลตาม Status ของ Backend
  const getJobs = (status: string) =>
    jobs.filter((j) => j.status === status && j.payment_status !== "paid");

  // ฟังก์ชันตัวช่วยจัดรูปแบบเวลา
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getDate()} ${date.toLocaleString("th-TH", { month: "short" })} - ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")} น.`;
  };

  return (
    <>
      <div className="staff-board-bg">
        <div className="board-grid-original">
          {/* ----- คอลัมน์ 1: รอยืนยัน (Backend = pending) ----- */}
          <div className="col-wrapper">
            <div className="col-header bg-darknavy">
              <div>
                <i className="fas fa-clock"></i> รอยืนยัน
              </div>
              <div className="col-count">{getJobs("pending").length} คัน</div>
            </div>
            <div className="col-body-dashed">
              {getJobs("pending").map((job) => (
                <div
                  key={job.booking_id}
                  className="job-card-og border-darknavy"
                >
                  <div className="card-top">
                    <span className="card-user">
                      {job.customer_name || "ลูกค้าทั่วไป"}
                    </span>{" "}
                    <span className="card-time">
                      {formatTime(job.booking_datetime)}
                    </span>
                  </div>
                  <div className="card-car-info">
                    <div className="car-model">
                      {job.vehicle_brand || "ไม่ระบุ"} {job.vehicle_model || ""}
                    </div>
                    <div className="car-license">
                      ทะเบียน: {job.vehicle_plate || "ไม่ระบุ"}
                    </div>
                  </div>
                  <div className="card-services">
                    {job.services && job.services.length > 0 ? (
                      job.services.map((service, index) => (
                        <div key={index}>
                          <i className="fas fa-check-circle"></i> {service}
                        </div>
                      ))
                    ) : (
                      <div>
                        <i className="fas fa-exclamation-circle"></i>{" "}
                        รอระบุบริการ
                      </div>
                    )}
                  </div>
                  <div className="card-actions">
                    <button className="btn-sm btn-red">ปฏิเสธ</button>

                    {/* 🚀 แก้ตรงนี้ครับ เปลี่ยนจาก updateStatus เป็น setShowConfirmModal เพื่อเปิด Popup */}
                    <button
                      className="btn-sm btn-darknavy"
                      onClick={() => setShowConfirmModal(job)}
                    >
                      ยืนยันคิว
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ----- คอลัมน์ 2: รอล้าง (Backend = confirmed) ----- */}
          <div className="col-wrapper">
            <div className="col-header bg-yellow">
              <div>
                <i className="fas fa-car"></i> รอล้าง
              </div>
              <div className="col-count">{getJobs("confirmed").length} คัน</div>
            </div>
            <div className="col-body-dashed">
              {getJobs("confirmed").map((job) => (
                <div key={job.booking_id} className="job-card-og border-yellow">
                  <div className="card-top">
                    <span className="card-user">
                      {job.customer_name || "ลูกค้าทั่วไป"}
                    </span>{" "}
                    <span className="card-time">
                      {formatTime(job.booking_datetime)}
                    </span>
                  </div>
                  <div className="card-car-info">
                    <div className="car-model">
                      {job.vehicle_brand || "ไม่ระบุ"} {job.vehicle_model || ""}
                    </div>
                    <div className="car-license">
                      ทะเบียน: {job.vehicle_plate || "ไม่ระบุ"}
                    </div>
                  </div>
                  <div className="card-services">
                    {job.services && job.services.length > 0 ? (
                      job.services.map((service, index) => (
                        <div key={index}>
                          <i className="fas fa-check-circle"></i> {service}
                        </div>
                      ))
                    ) : (
                      <div>
                        <i className="fas fa-exclamation-circle"></i>{" "}
                        รอระบุบริการ
                      </div>
                    )}
                  </div>
                  <div className="card-actions">
                    {/* 🚀 แก้ตรงนี้ครับ เปลี่ยนจาก updateStatus เป็นเปิด Popup Inspection แทน */}
                    <button
                      className="btn-sm btn-darknavy"
                      style={{ width: "100%" }}
                      onClick={() => {
                        setCarCondition("ปกติ");
                        setStaffNote("");
                        setShowInspectionModal(job); // เปิด Popup ของคันนี้
                      }}
                    >
                      เริ่มล้างรถ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ----- คอลัมน์ 3: กำลังล้าง (Backend = in_progress) ----- */}
          <div className="col-wrapper">
            <div className="col-header bg-blue">
              <div>
                <i className="fas fa-tint"></i> กำลังล้าง
              </div>
              <div className="col-count">{getJobs("washing").length} คัน</div>
            </div>
            <div className="col-body-dashed">
              {getJobs("washing").map((job) => (
                <div key={job.booking_id} className="job-card-og border-blue">
                  <div className="card-top">
                    <span className="card-user">
                      {job.customer_name || "ลูกค้าทั่วไป"}
                    </span>{" "}
                    <span className="card-time">
                      {formatTime(job.booking_datetime)}
                    </span>
                  </div>
                  <div className="card-car-info">
                    <div className="car-model">
                      {job.vehicle_brand || "ไม่ระบุ"} {job.vehicle_model || ""}
                    </div>
                    <div className="car-license">
                      ทะเบียน: {job.vehicle_plate || "ไม่ระบุ"}
                    </div>
                  </div>
                  <div className="card-services">
                    {job.services && job.services.length > 0 ? (
                      job.services.map((service, index) => (
                        <div key={index}>
                          <i className="fas fa-check-circle"></i> {service}
                        </div>
                      ))
                    ) : (
                      <div>
                        <i className="fas fa-exclamation-circle"></i>{" "}
                        รอระบุบริการ
                      </div>
                    )}
                  </div>
                  <div className="card-actions">
                    {/* 🚀 แก้ตรงนี้ครับ เปลี่ยนให้มาเปิด Popup สีฟ้าแทน */}
                    <button
                      className="btn-sm btn-blue"
                      onClick={() => setShowCompleteModal(job)}
                    >
                      ล้างเสร็จสิ้น
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ----- คอลัมน์ 4: รอชำระเงิน (Backend = completed) ----- */}
          <div className="col-wrapper">
            <div className="col-header bg-green">
              <div>
                <i className="fas fa-money-bill-wave"></i> รอชำระเงิน
              </div>
              <div className="col-count">{getJobs("completed").length} คัน</div>
            </div>
            <div className="col-body-dashed">
              {getJobs("completed").map((job) => (
                <div key={job.booking_id} className="job-card-og border-green">
                  <div className="card-top">
                    <span className="card-user">
                      {job.customer_name || "ลูกค้าทั่วไป"}
                    </span>{" "}
                    <span className="card-time">
                      {formatTime(job.booking_datetime)}
                    </span>
                  </div>
                  <div className="card-car-info">
                    <div className="car-model">
                      {job.vehicle_brand || "ไม่ระบุ"} {job.vehicle_model || ""}
                    </div>
                    <div className="car-license">
                      ทะเบียน: {job.vehicle_plate || "ไม่ระบุ"}
                    </div>
                  </div>
                  <div className="card-services">
                    {/* เช็คว่ามีข้อมูล services จาก Backend ไหม */}
                    {job.services && job.services.length > 0 ? (
                      job.services.map((service, index) => (
                        <div key={index}>
                          <i className="fas fa-check-circle"></i> {service}
                        </div>
                      ))
                    ) : (
                      <div>
                        <i className="fas fa-exclamation-circle"></i>{" "}
                        รอระบุบริการ
                      </div>
                    )}
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn-sm btn-green"
                      onClick={() => {
                        setPaymentMethod("cash"); // รีเซ็ตให้กลับมาเป็นเงินสดทุกครั้งที่เปิด
                        setShowPaymentModal(job); // เปิด Popup
                      }}
                    >
                      ชำระเงินเสร็จสิ้น
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 1: Popup ยืนยันการจอง */}
        {showConfirmModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              fontFamily: "Kanit",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "20px",
                width: "90%",
                maxWidth: "350px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  backgroundColor: "#e8f5e9",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <span style={{ color: "#4CAF50", fontSize: "40px" }}>✔</span>
              </div>

              <h3
                style={{
                  color: "#FF5722",
                  marginBottom: "10px",
                  fontSize: "18px",
                }}
              >
                STEP 1 : ยืนยันการจอง
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                ต้องการยืนยันรับคิวนี้ใช่หรือไม่?
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#999",
                  marginBottom: "25px",
                }}
              >
                การยืนยันนี้จะทำให้คิวล็อกช่วงเวลาทำงานของคุณทันที
              </p>

              <div style={{ display: "flex", gap: "15px" }}>
                <button
                  onClick={() => setShowConfirmModal(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#eeeeee",
                    color: "#666",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ยกเลิก
                </button>

                <button
                  onClick={async () => {
                    await updateStatus(
                      showConfirmModal.booking_id,
                      "confirmed",
                    ); // สั่งอัปเดตสถานะ
                    setShowConfirmModal(null); // ปิด Popup
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#A5F3D0",
                    color: "#065F46",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        )}
        {/* STEP 2: Popup บันทึกสภาพรถ */}
        {showInspectionModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              fontFamily: "Kanit",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "20px",
                width: "90%",
                maxWidth: "380px",
                textAlign: "left",
              }}
            >
              {/* Header: USERNAME | JOB ID */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "15px",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#e60000",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  {showInspectionModal.customer_name || "USERNAME"}
                </span>
                <span style={{ color: "#999", fontSize: "12px" }}>
                  JOB ID : {showInspectionModal.booking_id}
                </span>
              </div>

              <h3
                style={{
                  color: "#FF5722",
                  marginBottom: "15px",
                  fontSize: "18px",
                  textAlign: "center",
                }}
              >
                STEP 2 : บันทึกสภาพรถ
              </h3>

              {/* ข้อมูลรถ */}
              <div
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "10px 15px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  🚗 {showInspectionModal.vehicle_brand || "ไม่ระบุ"}{" "}
                  {showInspectionModal.vehicle_model || ""}
                </div>
                <div style={{ marginTop: "5px" }}>
                  ⏰ ลูกค้าเข้า :{" "}
                  {formatTime(showInspectionModal.booking_datetime)} น.
                </div>
              </div>

              {/* ส่วนเลือกสภาพรถ */}
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "10px",
                }}
              >
                สภาพรถ{" "}
                <span style={{ color: "red", fontSize: "11px" }}>
                  * ตัวอย่าง
                </span>
              </label>
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "15px" }}
              >
                <button
                  onClick={() => setCarCondition("ปกติ")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "20px",
                    border: "1px solid #ddd",
                    fontSize: "10px",
                    cursor: "pointer",
                    background: carCondition === "ปกติ" ? "#f0f4f8" : "white",
                    color: carCondition === "ปกติ" ? "#003366" : "#666",
                    fontWeight: carCondition === "ปกติ" ? "bold" : "normal",
                  }}
                >
                  ปกติ (ไม่มีรอยขีดข่วน)
                </button>
                <button
                  onClick={() => setCarCondition("พบรอยขีดข่วน")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "20px",
                    border: "1px solid #ddd",
                    fontSize: "10px",
                    cursor: "pointer",
                    background:
                      carCondition === "พบรอยขีดข่วน" ? "#f0f4f8" : "white",
                    color: carCondition === "พบรอยขีดข่วน" ? "#003366" : "#666",
                    fontWeight:
                      carCondition === "พบรอยขีดข่วน" ? "bold" : "normal",
                  }}
                >
                  พบรอยขีดข่วน/ความเสียหาย
                </button>
              </div>

              {/* 🎯 บล็อกพิมพ์บันทึกรายละเอียด (ห้ามขยับได้) */}
              <textarea
                placeholder="บันทึกรายละเอียด..."
                value={staffNote}
                onChange={(e) => setStaffNote(e.target.value)}
                style={{
                  width: "100%",
                  height: "80px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  padding: "10px",
                  boxSizing: "border-box",
                  fontSize: "13px",
                  fontFamily: "Kanit",
                  resize: "none", // 👈 ตรึงกล่อง ห้ามขยายขนาด
                }}
              ></textarea>

              {/* 🎯 ส่วนปุ่มกดล่างสุด (มีปุ่มยกเลิกเล็กกว่าตกลง) */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "15px",
                  alignItems: "center",
                }}
              >
                {/* ปุ่มยกเลิก (เล็กกว่า) */}
                <button
                  onClick={() => setShowInspectionModal(null)}
                  style={{
                    padding: "8px 20px", // ขนาดเล็กกว่า
                    background: "#f5f5f5",
                    color: "#666",
                    border: "none",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  ยกเลิก
                </button>

                {/* ปุ่มตกลง (ใหญ่เด่น) */}
                <button
                  onClick={async () => {
                    // 🚀 ส่งข้อมูลโน้ตและสภาพรถแนบไปกับสถานะ in_progress
                    await updateStatus(
                      showInspectionModal.booking_id,
                      "washing",
                      {
                        checkin_note: carCondition, // 💡 แอบเห็นหลังบ้านเพื่อนใช้คำว่า checkin_note แทน car_condition นะครับ
                        staff_note: staffNote,
                      },
                    );

                    setShowInspectionModal(null);
                  }}
                  className="btn-sm"
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#A5F3D0",
                    color: "#065F46",
                    borderRadius: "30px",
                    fontWeight: "bold",
                    fontSize: "16px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        )}
        {/* STEP 3: Popup ยืนยันการล้างเสร็จ */}
        {/* 🔵 STEP 3: Popup ล้างรถเสร็จสิ้น */}
        {showCompleteModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              fontFamily: "Kanit",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "20px",
                width: "90%",
                maxWidth: "350px",
                textAlign: "center",
              }}
            >
              {/* ไอคอนวงกลมถูกสีฟ้า */}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  backgroundColor: "#dbeafe",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <span style={{ color: "#2563eb", fontSize: "40px" }}>✔</span>
              </div>

              <h3
                style={{
                  color: "#FF5722",
                  marginBottom: "10px",
                  fontSize: "18px",
                }}
              >
                STEP 3 : ล้างรถเสร็จสิ้น
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#333",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                ต้องการยืนยันการทำรายการใช่หรือไม่?
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#999",
                  marginBottom: "25px",
                }}
              >
                การยืนยันนี้จะส่งรถไปยังจุดรอชำระเงิน
              </p>

              <div style={{ display: "flex", gap: "15px" }}>
                {/* ปุ่มยกเลิก */}
                <button
                  onClick={() => setShowCompleteModal(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#eeeeee",
                    color: "#666",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  ยกเลิก
                </button>

                {/* ปุ่มตกลงสีฟ้า */}
                <button
                  onClick={async () => {
                    await updateStatus(
                      showCompleteModal.booking_id,
                      "completed",
                    ); // ยิงสถานะไปรอชำระเงิน
                    setShowCompleteModal(null); // ปิด Popup
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#a5b4fc",
                    color: "#3730a3",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 🟢 STEP 4: Popup ชำระเงิน */}
        {showPaymentModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              fontFamily: "Kanit",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "20px",
                width: "90%",
                maxWidth: "380px",
                textAlign: "left",
              }}
            >
              {/* Header: USERNAME | JOB ID */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "15px",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#e60000",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  {showPaymentModal.customer_name || "USERNAME"}
                </span>
                <span style={{ color: "#999", fontSize: "12px" }}>
                  JOB ID : {showPaymentModal.booking_id}
                </span>
              </div>

              {/* ข้อมูลรถ */}
              <div
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "10px 15px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  🚗 {showPaymentModal.vehicle_brand || "ไม่ระบุ"}{" "}
                  {showPaymentModal.vehicle_model || ""}
                </div>
                <div style={{ marginTop: "5px" }}>
                  ⏰ ลูกค้าเข้า :{" "}
                  {formatTime(showPaymentModal.booking_datetime)} น.
                </div>
              </div>

              {/* ยอดชำระ (ตอนนี้จำลองค่า 300 THB ไว้ก่อน เพราะ API ฝั่ง Backend ยังไม่ส่งราคาแยกมาให้ครับ) */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <p
                  style={{
                    margin: 0,
                    color: "#666",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  ยอดชำระทั้งหมด
                </p>
                <h2
                  style={{
                    margin: "5px 0 0 0",
                    color: "#0F9D58",
                    fontSize: "36px",
                    fontWeight: "800",
                  }}
                >
                  300 THB
                </h2>
              </div>

              {/* ช่องทางชำระเงิน (กดแล้วกรอบแดงเปลี่ยน) */}
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                ช่องทางชำระเงิน
              </p>
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "25px" }}
              >
                <div
                  onClick={() => setPaymentMethod("cash")}
                  style={{
                    flex: 1,
                    border:
                      paymentMethod === "cash"
                        ? "2px solid #ff0000"
                        : "2px dashed #ccc",
                    borderRadius: "10px",
                    padding: "15px 5px",
                    textAlign: "center",
                    cursor: "pointer",
                    color: paymentMethod === "cash" ? "#ff0000" : "#666",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "5px" }}>
                    💵
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "bold" }}>
                    เงินสด
                  </div>
                </div>
                <div
                  onClick={() => setPaymentMethod("transfer")}
                  style={{
                    flex: 1,
                    border:
                      paymentMethod === "transfer"
                        ? "2px solid #ff0000"
                        : "2px dashed #ccc",
                    borderRadius: "10px",
                    padding: "15px 5px",
                    textAlign: "center",
                    cursor: "pointer",
                    color: paymentMethod === "transfer" ? "#ff0000" : "#666",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "5px" }}>
                    🏦
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "bold" }}>
                    โอนเงิน
                  </div>
                </div>
                <div
                  onClick={() => setPaymentMethod("credit")}
                  style={{
                    flex: 1,
                    border:
                      paymentMethod === "credit"
                        ? "2px solid #ff0000"
                        : "2px dashed #ccc",
                    borderRadius: "10px",
                    padding: "15px 5px",
                    textAlign: "center",
                    cursor: "pointer",
                    color: paymentMethod === "credit" ? "#ff0000" : "#666",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "5px" }}>
                    💳
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "bold" }}>
                    บัตรเครดิต
                  </div>
                </div>
              </div>

              {/* ปุ่มกด */}
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <button
                  onClick={() => setShowPaymentModal(null)}
                  style={{
                    padding: "8px 20px",
                    background: "#f5f5f5",
                    color: "#666",
                    border: "none",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handlePayment(showPaymentModal.booking_id)}
                  className="btn-sm"
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#A5F3D0",
                    color: "#065F46",
                    borderRadius: "30px",
                    fontWeight: "bold",
                    fontSize: "16px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ยืนยันชำระเงิน
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 🟢 STEP 4: Popup ชำระเงิน (อัปเดตใหม่ตรงตาม Figma) */}
        {showPaymentModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              fontFamily: "Kanit, sans-serif",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "400px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ color: "#E63946", fontSize: "18px" }}>💵</span>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#1D3557" }}>
                    ชำระเงินและจบงาน
                  </h3>
                </div>
                <button
                  onClick={() => setShowPaymentModal(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    color: "#999",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              {/* รายละเอียดการจอง */}
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <p
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    margin: "8px 0",
                  }}
                >
                  <span style={{ color: "#666" }}>Booking ID</span>
                  <strong>#{showPaymentModal.booking_id}</strong>
                </p>
                <p
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    margin: "8px 0",
                  }}
                >
                  <span style={{ color: "#666" }}>Vehicle</span>
                  <strong>
                    🚘 {showPaymentModal.vehicle_brand || "ไม่ระบุ"}{" "}
                    {showPaymentModal.vehicle_model || ""} (
                    {showPaymentModal.vehicle_plate || "-"})
                  </strong>
                </p>
              </div>

              {/* ยอดชำระ */}
              <div style={{ textAlign: "center", marginBottom: "25px" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
                  ยอดชำระทั้งหมด
                </p>
                <h1
                  style={{
                    margin: "5px 0",
                    fontSize: "36px",
                    color: "#E63946",
                    fontWeight: "900",
                  }}
                >
                  {showPaymentModal.total_price || 300}{" "}
                  <span style={{ fontSize: "20px" }}>THB</span>
                </h1>
              </div>

              {/* ช่องทางการชำระเงิน */}
              <div style={{ marginBottom: "20px" }}>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                  }}
                >
                  ช่องทางการชำระเงิน
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div
                    onClick={() => setPaymentMethod("cash")}
                    style={{
                      border:
                        paymentMethod === "cash"
                          ? "2px solid #E63946"
                          : "1px solid #ddd",
                      background: paymentMethod === "cash" ? "#fff5f5" : "#fff",
                      borderRadius: "8px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>💵</span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: paymentMethod === "cash" ? "#E63946" : "#666",
                      }}
                    >
                      เงินสด
                    </span>
                    {paymentMethod === "cash" && (
                      <div
                        style={{
                          position: "absolute",
                          top: "5px",
                          right: "5px",
                          background: "#E63946",
                          color: "white",
                          borderRadius: "50%",
                          width: "16px",
                          height: "16px",
                          fontSize: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✔
                      </div>
                    )}
                  </div>
                  <div
                    onClick={() => setPaymentMethod("transfer")}
                    style={{
                      border:
                        paymentMethod === "transfer"
                          ? "2px solid #E63946"
                          : "1px solid #ddd",
                      background:
                        paymentMethod === "transfer" ? "#fff5f5" : "#fff",
                      borderRadius: "8px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>🏦</span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color:
                          paymentMethod === "transfer" ? "#E63946" : "#666",
                      }}
                    >
                      โอนเงิน
                    </span>
                    {paymentMethod === "transfer" && (
                      <div
                        style={{
                          position: "absolute",
                          top: "5px",
                          right: "5px",
                          background: "#E63946",
                          color: "white",
                          borderRadius: "50%",
                          width: "16px",
                          height: "16px",
                          fontSize: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✔
                      </div>
                    )}
                  </div>
                  <div
                    onClick={() => setPaymentMethod("credit")}
                    style={{
                      border:
                        paymentMethod === "credit"
                          ? "2px solid #E63946"
                          : "1px solid #ddd",
                      background:
                        paymentMethod === "credit" ? "#fff5f5" : "#fff",
                      borderRadius: "8px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>💳</span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: paymentMethod === "credit" ? "#E63946" : "#666",
                      }}
                    >
                      บัตรเครดิต
                    </span>
                    {paymentMethod === "credit" && (
                      <div
                        style={{
                          position: "absolute",
                          top: "5px",
                          right: "5px",
                          background: "#E63946",
                          color: "white",
                          borderRadius: "50%",
                          width: "16px",
                          height: "16px",
                          fontSize: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✔
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ส่วนรับเงิน/เงินทอน (แสดงเฉพาะเงินสด) */}
              {paymentMethod === "cash" && (
                <div
                  style={{
                    background: "#f0f4f8",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "8px",
                      color: "#1D3557",
                    }}
                  >
                    รับเงินมา (Cash Received)
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      marginBottom: "15px",
                    }}
                  >
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        fontSize: "16px",
                        fontFamily: "Kanit",
                      }}
                      placeholder="0"
                    />
                    <span style={{ color: "#aaa", fontSize: "12px" }}>THB</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: "#666" }}>
                      เงินทอน (Change)
                    </span>
                    <strong style={{ fontSize: "20px", color: "#1D3557" }}>
                      {change} THB
                    </strong>
                  </div>
                </div>
              )}

              {/* ปุ่ม Action */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setShowPaymentModal(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "white",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    color: "#666",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handlePayment(showPaymentModal.booking_id)}
                  style={{
                    flex: 2,
                    padding: "12px",
                    background: "#E63946",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ✔ ยืนยันชำระเงินและจบงาน
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 🧾 Popup ใบเสร็จ (ต้องวางไว้ล่างสุดตรงนี้!) */}
        {showReceipt && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
              fontFamily: "Kanit",
            }}
          >
            <div
              style={{
                background: "white",
                width: "100%",
                maxWidth: "400px",
                borderRadius: "16px",
                padding: "30px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "#E8F5E9",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 15px",
                }}
              >
                <span style={{ color: "#4CAF50", fontSize: "30px" }}>✔</span>
              </div>
              <h2 style={{ margin: "0 0 5px 0", color: "#2E7D32" }}>
                ชำระเงินสำเร็จ
              </h2>
              <p style={{ color: "#888", fontSize: "12px" }}>
                #RC-{showReceipt.paymentId}
              </p>

              <div
                style={{
                  textAlign: "left",
                  margin: "20px 0",
                  borderTop: "1px dashed #eee",
                  paddingTop: "15px",
                }}
              >
                <p
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                  }}
                >
                  <span>ทะเบียนรถ:</span>{" "}
                  <strong>{showReceipt.booking?.vehicle_plate || "-"}</strong>
                </p>
                <p
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                  }}
                >
                  <span>ยอดชำระ:</span>{" "}
                  <strong style={{ color: "#E63946" }}>
                    {showReceipt.details?.total || 300} THB
                  </strong>
                </p>
                {showReceipt.details?.method === "cash" && (
                  <p
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    <span>เงินทอน:</span>{" "}
                    <strong>{showReceipt.details?.change || 0} THB</strong>
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowReceipt(null)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#1D3557",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
