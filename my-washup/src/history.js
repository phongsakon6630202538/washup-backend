document.addEventListener('DOMContentLoaded', async function() {
    console.log("History System Initialized");

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem("user"));

    // 1. โหลด Navbar และ Footer
    // 1. โหลด Navbar และ Footer
    fetch("components/navbar.html")
        .then(res => res.text())
        .then(data => {
            document.getElementById("navbar-placeholder").innerHTML = data;
            
            checkLoginStatus(); 
            setActiveMenu(); // <--- เพิ่มบรรทัดนี้เข้าไปเพื่อให้เมนู Active ทำงาน
            
            const userBadge = document.getElementById("user-fullname");
            if (userBadge && user) userBadge.textContent = user.fullname;
        });

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    function setActiveMenu() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        // ตรวจสอบว่า href ตรงกับหน้าปัจจุบันหรือไม่
        if (item.getAttribute('href') === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

    // 2. ดึงข้อมูลจาก Database
    try {
        const response = await fetch('http://localhost:3000/api/bookings/user', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error("Fetch failed");
        
        const bookings = await response.json();
        
        const currentList = document.getElementById('current-bookings-list');
        const pastList = document.getElementById('past-bookings-list');
        
        if (currentList) currentList.innerHTML = "";
        if (pastList) pastList.innerHTML = "";

        if (!bookings || bookings.length === 0) {
            if (currentList) currentList.innerHTML = "<p class='empty-msg'>ไม่พบข้อมูลการจองของคุณ</p>";
            return;
        }

        bookings.forEach(booking => {
            const card = createCard(booking);
            // แยกกลุ่ม: ถ้าเสร็จแล้ว หรือ ยกเลิกแล้ว ให้ไปอยู่ประวัติที่ผ่านมา
            if (booking.status === 'finished' || booking.status === 'cancelled' || booking.status === 'completed') {
                if (pastList) pastList.appendChild(card);
            } else {
                if (currentList) currentList.appendChild(card);
            }
        });
    } catch (error) {
        console.error("Error:", error);
        const currentList = document.getElementById('current-bookings-list');
        if (currentList) currentList.innerHTML = "เกิดข้อผิดพลาดในการโหลดข้อมูล";
    }
});

function checkLoginStatus() {
  const userStr = localStorage.getItem("user");
  if (!userStr || userStr === "undefined" || userStr === "null") return;
  try {
    const user = JSON.parse(userStr);
    if (!user || !user.login_name) return;
    
    // อัปเดตเมนูสำหรับลูกค้า
    const authSectionCustomer = document.getElementById("nav-auth-section");
    if (authSectionCustomer) {
      authSectionCustomer.innerHTML = `
        <a href="profile.html" class="btn-user-badge">${user.login_name}</a>
        <button onclick="logoutUser()" class="btn-logout" style="cursor:pointer;">LOGOUT</button>
      `;
    }
    
    // อัปเดตเมนูสำหรับพนักงาน (ถ้ามี)
    const authSectionStaff = document.getElementById("nav-auth-section-staff");
    if (authSectionStaff) {
      authSectionStaff.innerHTML = `
        <span class="btn-user-badge">STAFF: ${user.login_name}</span>
        <button onclick="logoutUser()" class="btn-logout" style="cursor:pointer;">LOGOUT</button>
      `;
    }
  } catch (error) {
    console.error("Login status error:", error);
  }
}

// ฟังก์ชัน Logout (เพิ่มไว้เพื่อให้ปุ่มทำงานได้)
window.logoutUser = function() {
    localStorage.clear();
    window.location.href = "index.html";
};

function createCard(data) {
    const div = document.createElement('div');
    div.className = 'booking-card'; 
    
    const status = data.status;
    const getActive = (stepName) => {
        const steps = ['pending', 'confirmed', 'in_progress', 'ready', 'finished', 'completed'];
        return steps.indexOf(status) >= steps.indexOf(stepName) ? 'active' : '';
    };

    // แก้ไข data.car_plate เป็น data.license_plate ให้ตรงกับ Database
    div.innerHTML = `
        <div class="card-top">
            <div class="booking-info">
                <span class="booking-id">หมายเลขการจอง #${data.booking_id || 'N/A'}</span>
                <p class="date"><i class="far fa-calendar-alt"></i> ${data.booking_datetime ? new Date(data.booking_datetime).toLocaleString('th-TH') : 'ไม่ระบุวันที่'}</p>
            </div>
            <div class="price-tag">${(data.total_price || 0).toLocaleString()}.-</div>
        </div>
        <div class="car-display">
            <div class="car-circle"><i class="fas fa-car"></i></div>
            <div class="car-text">
                <b>${data.brand || ''} ${data.model || 'ไม่พบข้อมูลรถ'}</b>
                <p>ทะเบียน: ${data.license_plate || data.car_plate || '-'} | สี: ${data.color || '-'}</p>
            </div>
        </div>
        ${(status !== 'finished' && status !== 'completed' && status !== 'cancelled') ? `
        <div class="status-tracker">
            <div class="step ${getActive('pending')}"><i class="fas fa-clock"></i><br>รอรับรถ</div>
            <div class="step ${getActive('confirmed')}"><i class="fas fa-check"></i><br>ยืนยันแล้ว</div>
            <div class="step ${getActive('in_progress')}"><i class="fas fa-spinner"></i><br>กำลังล้าง</div>
            <div class="step ${getActive('ready')}"><i class="fas fa-car-side"></i><br>เสร็จแล้ว</div>
        </div>` : `<div class="status-badge ${status}">${(status === 'finished' || status === 'completed') ? 'บริการเสร็จสิ้น' : 'ยกเลิกแล้ว'}</div>`}
    `;
    return div;
}