// ลบโค้ดซ้ำออก แล้วรวมทุกอย่างมาไว้ที่นี่ที่เดียว
document.addEventListener("DOMContentLoaded", () => {
  // 1. โหลด Navbar
  fetch("components/navbar.html")
    .then((res) => res.text())
    .then((data) => {
      const navPlaceholder = document.getElementById("navbar-placeholder");
      if (navPlaceholder) {
        navPlaceholder.innerHTML = data;
        checkLoginStatus(); // เรียกทำงานหลังจากแปะ Navbar เสร็จ
        setActiveMenu();
      }
    });

  // 2. โหลด Footer
  fetch("components/footer.html")
    .then((res) => res.text())
    .then((data) => {
      const footer = document.getElementById("footer-placeholder");
      if (footer) footer.innerHTML = data;
    });

  // 3. จัดการปุ่มจองบริการทั้งหมด (เช็ค Login ก่อนจอง)
  document.body.addEventListener("click", (e) => {
    if (
      e.target.closest(".btn-booking-hero") ||
      e.target.closest(".btn-main-booking") ||
      e.target.closest(".btn-select")
    ) {
      e.preventDefault();
      if (!localStorage.getItem("user")) {
        alert("กรุณาเข้าสู่ระบบก่อนทำการจองบริการ");
        window.location.href = "Login.html";
      } else {
        window.location.href = "bookingnocar.html";
      }
    }
  });
});

// --- ฟังก์ชันต่างๆ ---

function checkLoginStatus() {
  const authSection = document.getElementById("nav-auth-section");
  const user = JSON.parse(localStorage.getItem("user")); // ดึงข้อมูล User มาเช็ค

  // แก้ไข: เช็คแค่ว่ามี user ในระบบก็พอ ไม่ต้องเช็ค token แล้ว
  if (user && authSection) {
    // เปลี่ยน UI เป็นปุ่มสีแดง และปุ่ม Logout
    authSection.innerHTML = `
      <a href="profile.html" class="btn-user-badge">${user.login_name}</a>
      <button onclick="logoutUser()" class="btn-logout">LOGOUT</button>
    `;
  }
}

function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html"; // เด้งกลับหน้าแรก
}

function setActiveMenu() {
  const currentPath = window.location.pathname;
  if (currentPath.includes("index.html") || currentPath === "/") {
    const home = document.getElementById("nav-home");
    if (home) home.classList.add("active");
  } else if (currentPath.includes("booking")) {
    const booking = document.getElementById("nav-booking");
    if (booking) booking.classList.add("active");
  } else if (currentPath.includes("history")) {
    const history = document.getElementById("nav-history");
    if (history) history.classList.add("active");
  }
}
