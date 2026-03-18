document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullname = document.getElementById("fullName").value;
    const login_name = document.getElementById("username").value;
    const phone = document.getElementById("phone").value;
    const login_password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // ตรวจสอบรหัสผ่านเบื้องต้น
    if (login_password !== confirmPassword) {
        alert("รหัสผ่านไม่ตรงกัน!");
        return;
    }

    try {
        // เปลี่ยน URL ให้มี /api/ ตามโครงสร้าง server.js ของเพื่อน
        const response = await fetch("http://localhost:3000/api/users/register", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                fullname,
                login_name,
                phone,
                login_password
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("สมัครสมาชิกสำเร็จ!");
            window.location.href = "login.html";
        } else {
            // แสดงข้อความ error จาก Backend (เช่น ชื่อผู้ใช้ซ้ำ)
            alert(data.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (ตรวจสอบการรัน Node.js)");
    }
});