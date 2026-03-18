document.addEventListener('DOMContentLoaded', async function() {
    console.log("Booking System Initialized");

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem("user"));
    const totalDisplay = document.getElementById("total-amount");

    if (!token || !user) {
        alert("กรุณาเข้าสู่ระบบก่อนทำการจอง");
        window.location.href = "login.html";
        return;
    }

    // --- แก้ไขเฉพาะส่วน NAV เริ่มต้นตรงนี้ ---
    const navPlaceholder = document.getElementById("navbar-placeholder");
    const navStaffPlaceholder = document.getElementById("navbar-staff-placeholder");

    if (navPlaceholder) {
        fetch("components/navbar.html")
            .then((res) => res.text())
            .then((data) => {
                navPlaceholder.innerHTML = data;
                checkLoginStatus(); // แสดงชื่อ User และปุ่ม Logout ตาม CSS ใหม่
                setActiveMenu();    // สั่งให้เมนู "จองบริการ" เป็นตัวหนา (Active)
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

    // ฟังก์ชันจัดการสถานะเมนู (Active) ให้ตัวหนาตามหน้าปัจจุบัน
    function setActiveMenu() {
        const currentPage = window.location.pathname.split("/").pop() || "index.html";
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.getAttribute('href') === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // ฟังก์ชันเปลี่ยนปุ่ม LOGIN เป็น Badge ชื่อผู้ใช้ (ตาม CSS .btn-user-badge)
    function checkLoginStatus() {
        const userStr = localStorage.getItem("user");
        if (!userStr || userStr === "undefined") return;
        const userData = JSON.parse(userStr);
        
        const authSection = document.getElementById("nav-auth-section");
        if (authSection && userData.login_name) {
            authSection.innerHTML = `
                <a href="profile.html" class="btn-user-badge">${userData.login_name}</a>
                <button onclick="logoutUser()" class="btn-logout">LOGOUT</button>
            `;
        }
    }

    // ฟังก์ชัน Logout ให้ปุ่มใน Nav ทำงานได้
    window.logoutUser = function() {
        localStorage.clear();
        window.location.href = "index.html";
    };
    // --- สิ้นสุดส่วนที่แก้ NAV ---

    // หลังจากนี้เป็นส่วนเดิมของคุณ (จัดการรถ / บริการ / ยืนยันจอง) ห้ามลบหรือเปลี่ยน
    fetch("components/footer.html")
        .then((res) => res.text())
        .then((data) => {
            const footer = document.getElementById("footer-placeholder");
            if (footer) footer.innerHTML = data;
        });

    // ... (โค้ดจัดการรถและยืนยันการจองส่วนเดิมของคุณทั้งหมด) ...
    // --- 2. จัดการข้อมูลรถ ---
    let selectedCar = null;

    async function fetchUserVehicles() {
        try {
            const res = await fetch(`http://localhost:3000/api/vehicles/user`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                renderAllCars(data);
            } else {
                renderNoCar();
            }
        } catch (e) {
            console.error("เกิดข้อผิดพลาดในการดึงข้อมูลรถ:", e);
            renderNoCar();
        }
    }

    function renderAllCars(cars) {
        const carSection = document.getElementById("car-section-content");
        if (!carSection) return;

        const carsHtml = cars.map((car) => `
            <div class="service-card car-item" 
                 id="car-${car.vehicle_id}" 
                 onclick="selectCarAction(${JSON.stringify(car).replace(/"/g, '&quot;')})"
                 style="background:#fff; border:1px solid #ddd; cursor:pointer; width:100%; display:flex; align-items:center; padding: 15px; border-radius: 12px; margin-bottom: 10px; transition: 0.3s;">
                <div class="car-icon-bg" style="margin-right:20px; width:50px; height:50px; background: #fdf2f2; color: #d71920; display: flex; align-items:center; justify-content: center; border-radius: 50%; font-size:20px;">
                    <i class="fas fa-car"></i>
                </div>
                <div class="service-detail" style="flex-grow: 1;">
                    <h4 style="margin: 0; font-size: 16px;">${car.brand} ${car.model}</h4>
                    <p style="margin: 5px 0 0; color: #666; font-size: 14px;">ทะเบียน: ${car.license_plate} | สี: ${car.color}</p>
                </div>
                <div class="select-indicator" style="color:#ccc;">
                    <i class="fas fa-check-circle" style="font-size: 20px;"></i>
                </div>
            </div>
        `).join('');

        carSection.innerHTML = `<div style="display: flex; flex-direction: column; gap: 5px;">${carsHtml}
            <div style="text-align: right; margin-top: 5px;">
                <button type="button" onclick="window.location.href='popupadd.html'" style="background: none; border: none; color: #d71920; cursor: pointer; font-size: 13px;">+ เพิ่มรถคันใหม่</button>
            </div></div>`;
        selectCarAction(cars[0]);
    }

    window.selectCarAction = function(car) {
        selectedCar = car;
        document.querySelectorAll('.car-item').forEach(el => {
            el.style.borderColor = "#ddd";
            el.querySelector('.select-indicator').style.color = "#ccc";
        });
        const activeCard = document.getElementById(`car-${car.vehicle_id}`);
        if (activeCard) {
            activeCard.style.borderColor = "#d71920";
            activeCard.querySelector('.select-indicator').style.color = "#d71920";
        }
    };

    function renderNoCar() {
        const carSection = document.getElementById("car-section-content");
        if (!carSection) return;
        carSection.innerHTML = `<div class="service-card" style="border: 2px dashed #ccc; padding: 20px; text-align: center; cursor: pointer;" onclick="window.location.href='popupadd.html'">
            <i class="fas fa-plus-circle" style="font-size: 24px; color: #ccc;"></i>
            <p style="margin-top: 10px; color: #888;">คุณยังไม่มีข้อมูลรถ คลิกเพื่อเพิ่มรถ</p>
        </div>`;
    }

    // --- 3. ระบบบริการและราคา ---
    async function fetchServices() {
        try {
            await fetch("http://localhost:3000/api/service");
            handleUrlParams();
        } catch (error) { console.error(error); }
    }

    function handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const serviceIdFromUrl = urlParams.get('service_id');
        if (serviceIdFromUrl) {
            const targetRadio = document.querySelector(`input[name="main_service"][value="${serviceIdFromUrl}"]`);
            if (targetRadio) {
                targetRadio.checked = true;
                calculatePrice(); 
                targetRadio.closest('.service-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    function calculatePrice() {
        let sum = 0;
        const mainService = document.querySelector('input[name="main_service"]:checked');
        if (mainService) sum += parseInt(mainService.value || 0);
        const addons = document.querySelectorAll('#addon-service-group input:checked');
        addons.forEach(addon => { sum += parseInt(addon.value || 0); });
        if (totalDisplay) totalDisplay.textContent = sum.toLocaleString();
    }

    // --- 4. การเลือกวันที่และเวลา ---
    document.querySelectorAll(".date-item").forEach((item) => {
        item.addEventListener("click", () => {
            document.querySelector(".date-item.active")?.classList.remove("active");
            item.classList.add("active");
        });
    });

    document.querySelectorAll(".time-item:not(.full)").forEach((item) => {
        item.addEventListener("click", () => {
            document.querySelector(".time-item.selected")?.classList.remove("selected");
            item.classList.add("selected");
            document.querySelectorAll(".time-item").forEach(t => t.style.background = "");
            item.style.background = "#ffebeb";
        });
    });

    // --- 5. ยืนยันการจอง (จุดสำคัญที่แก้ไข) ---
    const submitBtn = document.getElementById("submit-booking");
    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const mainService = document.querySelector('input[name="main_service"]:checked');
            const selectedTime = document.querySelector(".time-item.selected");
            const selectedDate = document.querySelector(".date-item.active");

            if (!mainService) return alert("กรุณาเลือกบริการหลัก");
            if (!selectedTime) return alert("กรุณาเลือกเวลา");
            if (!selectedDate) return alert("กรุณาเลือกวันที่");
            if (!selectedCar) return alert("ไม่พบข้อมูลรถของคุณ (กรุณาเลือกรถ)");

            // ดึง ID จาก dataset.id ที่คุณใส่ไว้ใน HTML
            const mainId = parseInt(mainService.dataset.id);
            const addonIds = Array.from(document.querySelectorAll("#addon-service-group input:checked"))
                                  .map(el => parseInt(el.dataset.id))
                                  .filter(id => !isNaN(id));

            if (isNaN(mainId)) return alert("ไม่พบ ID บริการหลัก (เช็ค data-id ใน HTML)");

            const bookingDatetime = `${selectedDate.dataset.date}T${selectedTime.dataset.time}:00`;

            const payload = {
                vehicle_id: selectedCar.vehicle_id,
                booking_datetime: bookingDatetime,
                services: [mainId, ...addonIds]
            };

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = "กำลังบันทึก...";
                const response = await fetch("http://localhost:3000/api/bookings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (response.ok) {
                    alert("จองสำเร็จ!");
                    window.location.href = "history.html";
                } else {
                    alert("ล้มเหลว: " + (result.message || "เช็คราคาไม่สำเร็จ"));
                    submitBtn.disabled = false;
                    submitBtn.textContent = "ยืนยันการจอง";
                }
            } catch (error) {
                alert("Server Error");
                submitBtn.disabled = false;
            }
        });
    }

    // --- 6. ฟังก์ชันเสริม ---
    function checkLoginStatus() {
        const userData = JSON.parse(localStorage.getItem("user"));
        if (!userData) return;
        const authSection = document.getElementById("nav-auth-section");
        if (authSection) {
            authSection.innerHTML = `<a href="profile.html" class="btn-user-badge">${userData.login_name}</a>
                                     <button onclick="logoutUser()" class="btn-logout">LOGOUT</button>`;
        }
    }

    window.logoutUser = function() {
        localStorage.clear();
        window.location.href = "index.html";
    };

    document.addEventListener('change', (e) => {
        if (e.target.name === 'main_service' || e.target.closest('#addon-service-group')) {
            calculatePrice();
        }
    });

    await fetchUserVehicles();
    await fetchServices();
    calculatePrice();
});