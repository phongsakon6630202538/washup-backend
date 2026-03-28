import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePDF } from "react-to-pdf";
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

// ตัวแปร receiptRef จะถูกนำไปผูกกับ Div หลักเพื่อจับภาพไปทำ PDF ครับ
const FormalReceiptHTML = ({
  showReceipt,
  receiptRef,
}: {
  showReceipt: any;
  receiptRef: any;
}) => {
  if (!showReceipt) return null;

  // จัดรูปแบบวันที่ (พ.ศ.)
  const today = new Date();
  const formattedDate = `${today.getDate()} ${today.toLocaleString("th-TH", { month: "short" })} ${today.getFullYear() + 543}`;

  // ดึงข้อมูลบริการ (Services) มาจัดรูปแบบสำหรับตาราง
  // ในที่นี้สมมติว่าบริการหลักคือรายการแรกครับ
  const mainService =
    showReceipt.booking?.services && showReceipt.booking.services[0]
      ? showReceipt.booking.services[0]
      : "Premium Wash & Wax";

  return (
    // 🎯 1. ตัวหลักที่ผูกกับ Ref เพื่อจับภาพ
    <div ref={receiptRef} style={pdfStyles.container}>
      {/* 🎯 2. Header (โลโก้ + RECEIPT) */}
      <div style={pdfStyles.header}>
        <div style={pdfStyles.logoArea}>
          {/* อย่าลืมเปลี่ยน path โลโก้ให้ตรงนะครับ */}
          <img
            src="/image/logowashup.png"
            alt="WASH UP Logo"
            style={pdfStyles.logo}
          />
        </div>
        <h1 style={pdfStyles.title}>RECEIPT</h1>
      </div>
      {/* 🎯 3. ข้อมูลการทำรายการ */}
      <div style={pdfStyles.infoGrid}>
        <div style={pdfStyles.infoCol}>
          <p>
            <span style={pdfStyles.label}>Receipt #:</span> #RC-
            {showReceipt.paymentId || "0000"}
          </p>
          <p>
            <span style={pdfStyles.label}>Date:</span> {formattedDate}
          </p>
        </div>
        <div style={pdfStyles.infoCol}>
          <p>
            <span style={pdfStyles.label}>Customer Name:</span>{" "}
            {showReceipt.booking?.customer_name || "Guest"}
          </p>
          <p>
            <span style={pdfStyles.label}>Vehicle:</span>{" "}
            {showReceipt.booking?.vehicle_plate || "-"}
          </p>
        </div>
      </div>
      {/* 🎯 4. ตารางรายการ */}
      <table style={pdfStyles.table}>
        <thead>
          <tr style={pdfStyles.tableHeaderRow}>
            <th style={{ ...pdfStyles.tableHeaderCell, width: "10%" }}>SR.#</th>
            <th style={{ ...pdfStyles.tableHeaderCell, width: "50%" }}>
              DESCRIPTION
            </th>
            <th
              style={{
                ...pdfStyles.tableHeaderCell,
                width: "10%",
                textAlign: "center" as const, // 🎯 เติม as const ตรงนี้
              }}
            >
              QTY
            </th>
            <th
              style={{
                ...pdfStyles.tableHeaderCell,
                width: "15%",
                textAlign: "right" as const, // 🎯 เติม as const ตรงนี้
              }}
            >
              PRICE (THB)
            </th>
            <th
              style={{
                ...pdfStyles.tableHeaderCell,
                width: "15%",
                textAlign: "right" as const, // 🎯 เติม as const ตรงนี้
              }}
            >
              AMOUNT (THB)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={pdfStyles.tableBodyRow}>
            <td style={pdfStyles.tableBodyCell}>1</td>
            <td style={pdfStyles.tableBodyCell}>
              WASH UP Wash Service
              <br />({mainService})
            </td>
            <td
              style={{
                ...pdfStyles.tableBodyCell,
                textAlign: "center" as const,
              }}
            >
              1
            </td>
            <td
              style={{
                ...pdfStyles.tableBodyCell,
                textAlign: "right" as const,
              }}
            >
              {showReceipt.details?.total || 300} THB
            </td>
            <td
              style={{
                ...pdfStyles.tableBodyCell,
                textAlign: "right" as const,
              }}
            >
              {showReceipt.details?.total || 300} THB
            </td>
          </tr>
          {/* คุณตูนสามารถ map รายการ services อื่นๆ ลงตรงนี้ได้ตามต้องการครับ */}
        </tbody>
      </table>
      {/* 🎯 5. ส่วนสรุปยอด */}
      <div style={pdfStyles.totalsArea}>
        <div style={pdfStyles.totalsGrid}>
          <div
            style={{ ...pdfStyles.totalsLabels, textAlign: "right" as const }}
          >
            <p style={pdfStyles.totalSubLabel}>SUBTOTAL:</p>
            <p style={pdfStyles.totalSubLabel}>VAT (7%):</p>
            <p style={pdfStyles.totalMainLabel}>TOTAL:</p>
          </div>
          <div
            style={{ ...pdfStyles.totalsValues, textAlign: "right" as const }}
          >
            <p style={pdfStyles.totalSubValue}>
              {showReceipt.details?.total || 300} THB
            </p>
            <p style={pdfStyles.totalSubValue}>0 THB</p>
            <p style={pdfStyles.totalMainValue}>
              {showReceipt.details?.total || 300} THB
            </p>
          </div>
        </div>
      </div>{" "}
      {/* 🎯 เติมปิด div ตัวที่หายไปครับ */}
      {/* 🎯 6. รายละเอียดการชำระ */}
      <div style={pdfStyles.paymentInfo}>
        <div style={pdfStyles.paymentGrid}>
          <div>
            <p
              style={{ ...pdfStyles.totalSubLabel, textTransform: "uppercase" }}
            >
              {showReceipt.details?.method || "Cash"} RECEIVED:
            </p>
            <p style={pdfStyles.totalSubLabel}>CHANGE:</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={pdfStyles.totalSubValue}>
              {showReceipt.details?.received || showReceipt.details?.total} THB
            </p>
            <p style={pdfStyles.totalSubValue}>
              {showReceipt.details?.change || 0} THB
            </p>
          </div>
        </div>
      </div>
      {/* 🎯 7. Footer */}
      <div style={pdfStyles.footer}>
        <div style={pdfStyles.signatureLine}></div>
        <p style={{ textAlign: "center", marginTop: "10px", fontSize: "14px" }}>
          Authorized Signature
        </p>
        <div
          style={{
            ...pdfStyles.dashedSeparator,
            marginTop: "30px",
            marginBottom: "10px",
          }}
        ></div>
        <p style={{ textAlign: "center", color: "#888", fontSize: "12px" }}>
          THANK YOU FOR USING WASH UP SERVICE
        </p>
      </div>
    </div>
  );
};

// 🎨 Styles สำหรับ PDF (inline เพื่อให้แสดงผล PDF แม่นยำที่สุด)
const pdfStyles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "60px",
    backgroundColor: "white",
    fontFamily: "Kanit, sans-serif",
    boxSizing: "border-box",
    width: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    borderBottom: "2px dashed #eee",
    paddingBottom: "20px",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    width: "120px",
    height: "auto",
  },
  title: {
    margin: 0,
    fontSize: "40px",
    color: "#1D3557", // สีแดงตามรูปที่ 1 เพื่อคุมโทน แต่แบบเป็นทางการ
    fontWeight: "900",
    letterSpacing: "2px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
    marginBottom: "40px",
  },
  infoCol: {
    fontSize: "14px",
    color: "#333",
  },
  label: {
    fontWeight: "bold",
    color: "#1D3557",
    display: "inline-block",
    width: "130px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as "collapse",
    marginBottom: "40px",
  },
  tableHeaderRow: {
    backgroundColor: "#1D3557", // สีแดงทางการ
    color: "white",
  },
  tableHeaderCell: {
    padding: "12px",
    fontSize: "14px",
    fontWeight: "bold",
    textAlign: "left",

    textTransform: "uppercase" as "uppercase",
  },
  tableBodyRow: {
    borderBottom: "1px dashed #eee",
  },
  tableBodyCell: {
    padding: "15px 12px",
    fontSize: "13px",
    color: "#333",
    lineHeight: "1.4",
  },
  dashedSeparator: {
    borderTop: "2px dashed #eee",
    margin: "20px 0",
  },
  totalsArea: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "30px",
  },
  totalsGrid: {
    display: "flex",
    width: "300px",
  },
  totalsLabels: {
    flex: 1,
    textAlign: "right",
  },
  totalsValues: {
    flex: 1,
    textAlign: "right",
    paddingLeft: "20px",
  },
  totalSubLabel: {
    fontSize: "13px",
    color: "#666",
    margin: "5px 0",
  },
  totalSubValue: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#333",
    margin: "5px 0",
  },
  totalMainLabel: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#1D3557",
    margin: "15px 0",
  },
  totalMainValue: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#E63946",
    margin: "10px 0",
  },
  paymentInfo: {
    display: "flex",
    justifyContent: "flex-end",
    color: "#888",
  },
  paymentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 100px",
    gap: "20px",
    width: "300px",
  },
  footer: {
    marginTop: "60px",
  },
  signatureLine: {
    width: "200px",
    borderBottom: "1px solid #aaa",
    margin: "0 auto",
  },
};

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
  const { toPDF, targetRef } = usePDF({
    filename: `WASHUP-Receipt-${showReceipt?.booking_id || "0000"}.pdf`,
  });
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
                  {showPaymentModal.total_price || 300} THB{" "}
                  {/* ✅ เปลี่ยนให้ดึงค่าจริงมาโชว์ครับ */}
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

              {paymentMethod === "cash" && (
                <div
                  style={{
                    background: "#f0f4f8",
                    padding: "16px",
                    borderRadius: "12px",
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
                      borderRadius: "8px",
                      padding: "8px 12px",
                      marginBottom: "15px",
                    }}
                  >
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)} // 🚀 ลิงก์ค่าเข้า State เพื่อคำนวณเงินทอน
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        fontSize: "18px",
                        fontWeight: "bold",
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
        {/* 🟢 ส่วนของใบเสร็จ (แสดงเมื่อชำระสำเร็จ) */}
        {showReceipt && (
          <>
            {/* 🎯 1. Popup แบบเดิมที่โชว์หน้าจอ (รูปที่ 1) */}
            {/* อันนี้โชว์สวยๆ กระชับๆ เหมือนเดิมครับคุณตูน */}
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2000,
                fontFamily: "Kanit, sans-serif",
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
                  boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
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
                  #RC-{showReceipt.paymentId || showReceipt.booking_id}
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
                      margin: "10px 0",
                    }}
                  >
                    <span style={{ color: "#666" }}>ทะเบียนรถ:</span>{" "}
                    <strong>{showReceipt.booking?.vehicle_plate || "-"}</strong>
                  </p>
                  <p
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      margin: "10px 0",
                    }}
                  >
                    <span style={{ color: "#666" }}>ยอดชำระสุทธิ:</span>{" "}
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
                      <strong style={{ color: "#1D3557" }}>
                        {showReceipt.details?.change || 0} THB
                      </strong>
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  {/* 🎯 ปุ่มปริ้น: สั่งให้ไปจับภาพอันที่ซ่อนอยู่ทำ PDF */}
                  <button
                    onClick={() => toPDF()} // 🚀 เรียก PDF ตัวทางการที่ซ่อนอยู่
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "white",
                      border: "1px solid #1D3557",
                      borderRadius: "8px",
                      color: "#1D3557",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontFamily: "Kanit",
                    }}
                  >
                    📄 พิมพ์ใบเสร็จ (PDF)
                  </button>
                  <button
                    onClick={() => setShowReceipt(null)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "#1D3557",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontFamily: "Kanit",
                    }}
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>

            {/* 🎯 2. Popup แบบทางการที่ซ่อนอยู่ (รูปที่ 2) */}
            {/* อันนี้เอาไว้จับภาพไปทำ PDF ครับ เราจะสั่งซ่อนไม่ให้เห็นหน้าจอ */}
            <div
              style={{
                position: "absolute", // ย้ายออกนอกหน้าจอ
                top: "-10000px",
                left: "-10000px",
                width: "100%", // เผื่อความกว้างไว้ให้จับภาพแม่นๆ
                opacity: 0, // ซ่อนไว้
              }}
            >
              <FormalReceiptHTML
                showReceipt={showReceipt}
                receiptRef={targetRef}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
