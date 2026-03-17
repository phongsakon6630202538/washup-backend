// login.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const login_name = document.getElementById('username').value;
    const login_password = document.getElementById('password').value;

    try {
        const response = await fetch("http://localhost:3000/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login_name, login_password })
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            alert("เข้าสู่ระบบสำเร็จ!");
            
            // ส่งไปหน้า index แล้วให้ customer.js ที่นั่นจัดการเรื่องซ่อนปุ่มเอง
            window.location.href = result.user.user_role === "staff" ? "staff-dashboard.html" : "index.html";
        } else {
            alert("เข้าสู่ระบบไม่สำเร็จ: " + result.message);
        }
    } catch (error) {
        alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
});