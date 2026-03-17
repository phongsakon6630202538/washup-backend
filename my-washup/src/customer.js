document.addEventListener("DOMContentLoaded", () => {
  // 1. โหลด Navbar
  const navPlaceholder = document.getElementById("navbar-placeholder");
  const navStaffPlaceholder = document.getElementById("navbar-staff-placeholder");

  if (navPlaceholder) {
    fetch("components/navbar.html")
      .then((res) => res.text())
      .then((data) => {
        navPlaceholder.innerHTML = data;
        checkLoginStatus();
        setActiveMenu();
      });
  } else if (navStaffPlaceholder) {
    fetch("components/navbar-staff.html")
      .then((res) => res.text())
      .then((data) => {
        navStaffPlaceholder.innerHTML = data;
        checkLoginStatus();
        setActiveMenu();
      });
  }

  // 2. โหลด Footer
  fetch("components/footer.html")
    .then((res) => res.text())
    .then((data) => {
      const footer = document.getElementById("footer-placeholder");
      if (footer) footer.innerHTML = data;
    });

  // 3. จัดการปุ่มจองบริการ
  document.body.addEventListener("click", (e) => {
    if (
      e.target.closest(".btn-booking-hero") ||
      e.target.closest(".btn-main-booking") ||
      e.target.closest(".btn-select")
    ) {
      e.preventDefault();
      if (!localStorage.getItem("user")) {
        alert("กรุณาเข้าสู่ระบบก่อนทำการจองบริการ");
        window.location.href = "login.html";
      } else {
        window.location.href = "bookingnocar.html";
      }
    }
  });

  // 4. จัดการปุ่มเลือกประเภทรถ (Type Selector)
  const typeOptions = document.querySelectorAll('.type-option');
  if (typeOptions.length > 0) {
    typeOptions.forEach(option => {
      option.addEventListener('click', function() {
        typeOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
        
        // ให้ไปติ๊กถูกที่ Radio input ข้างในด้วย
        const radio = this.querySelector('input[type="radio"]');
        if(radio) radio.checked = true;
      });
    });
  }

  // 5. บันทึกข้อมูลรถ (ส่งไปยัง Server)
  const carForm = document.getElementById('carForm');
  if (carForm) {
    carForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // ดึง Token มาใช้ (ต้องมีเพื่อผ่าน authMiddleware)
      const token = localStorage.getItem('token');
      if (!token) {
        alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        window.location.href = "login.html";
        return;
      }

      // เตรียมข้อมูลให้ตรงกับ API (POST /vehicles)
      const activeType = document.querySelector('.type-option.active');
      const car_type = activeType?.dataset.type;
      const vehicle_type_id = car_type === "sedan" ? 1 : 2;
      const formData = {
        vehicle_type_id,
        license_plate: document.getElementById('license_plate').value,
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        color: document.getElementById('color').value,
        note: document.getElementById('note').value || ""
      };

      try {
        const response = await fetch("http://localhost:3000/vehicles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
          alert("บันทึกข้อมูลรถสำเร็จ!");
          window.location.href = "profile.html"; // หรือหน้าแสดงรายการรถ
        } else {
          alert("เกิดข้อผิดพลาด: " + result.message);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      }
    });
  }

  // 6. จัดการปุ่มยกเลิก
  const btnCancel = document.querySelector('.btn-cancel');
  if (btnCancel && carForm) {
    btnCancel.addEventListener('click', () => {
      if (confirm('คุณต้องการยกเลิกและล้างข้อมูลใช่หรือไม่?')) {
        carForm.reset();
        typeOptions.forEach(opt => opt.classList.remove('active'));
        if(typeOptions[0]) {
          typeOptions[0].classList.add('active');
          typeOptions[0].querySelector('input').checked = true;
        }
      }
    });
  }
});

// --- ฟังก์ชันอื่นๆ ของคุณ (ห้ามลบ) ---
function checkLoginStatus() {
  const userStr = localStorage.getItem("user");
  if (!userStr || userStr === "undefined" || userStr === "null") return;

  try {
    const user = JSON.parse(userStr);
    if (!user || !user.login_name) return;

    // --- 1. สั่งลบเฉพาะส่วนท้ายของหน้า (Ready Section) เมื่อ Login แล้ว ---
    const readySection = document.getElementById("ready-section");
    if (readySection) {
      readySection.style.display = "none"; 
    }

    // --- 2. ส่วนจัดการ Navbar ด้านบน (คงไว้เหมือนเดิมเพื่อให้แถบเมนูยังอยู่) ---
    const authSectionCustomer = document.getElementById("nav-auth-section");
    if (authSectionCustomer) {
      authSectionCustomer.innerHTML = `
        <a href="profile.html" class="btn-user-badge">${user.login_name}</a>
        <button onclick="logoutUser()" class="btn-logout">LOGOUT</button>
      `;
    }
    
    // ส่วนของ Staff Navbar (ถ้ามี) ก็คงไว้เช่นกัน...
    // ...
    
  } catch (error) {
    localStorage.removeItem("user");
  }
}

function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

function setActiveMenu() {
  const currentPath = window.location.pathname;
  if (currentPath.includes("index.html") || currentPath === "/") {
    const home = document.getElementById("nav-home");
    if (home) home.classList.add("active");
  } else if (currentPath.includes("booking")) {
    const booking = document.getElementById("nav-booking");
    if (booking) booking.classList.add("active");
  } else if (currentPath.includes("history") && !currentPath.includes("staff")) {
    const history = document.getElementById("nav-history");
    if (history) history.classList.add("active");
  }
}


