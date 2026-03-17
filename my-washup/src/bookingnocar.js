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

    const userBadge = document.getElementById("user-fullname");
    if (userBadge) userBadge.textContent = user.fullname;

    // --- 1. จัดการข้อมูลรถ ---
    let selectedCar = null;
    async function fetchUserVehicles() {
        try {
            const res = await fetch(`http://localhost:3000/vehicles/user`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const cars = await res.json();
            if (cars && cars.length > 0) {
                selectedCar = cars[0]; 
                renderCarDetail(selectedCar);
            }
        } catch (e) {
            console.error("Car load error", e);
        }
    }

    function renderCarDetail(car) {
        const carSection = document.getElementById("car-section-content");
        if (!carSection) return;
        carSection.innerHTML = `
            <div class="service-card" style="background:#fff; border:1px solid #ddd; cursor:default; width:100%; display:flex; align-items:center;">
                <div class="car-icon-bg" style="margin:0 20px 0 0; width:50px; height:50px; font-size:20px;">
                    <i class="fas fa-car"></i>
                </div>
                <div class="service-detail">
                    <h4>${car.brand} ${car.model}</h4>
                    <p>ทะเบียน: ${car.license_plate} | สี: ${car.color}</p>
                </div>
                <div class="service-price" style="color:#d71920; font-size:12px; cursor:pointer;" onclick="window.location.href='popupadd.html'">
                    แก้ไข
                </div>
            </div>
        `;
    }

    // --- 2. ดึงข้อมูลบริการจาก API & จัดการ URL ---
    async function fetchServices() {
        try {
            const response = await fetch("http://localhost:3000/service");
            const services = await response.json();
            
            // ถ้าคุณมีฟังก์ชัน renderServices ให้เรียกตรงนี้
            // renderServices(services); 

            // จัดการเลือกแพ็กเกจจาก URL ต่อทันทีที่โหลดข้อมูลเสร็จ
            handleUrlParams();
        } catch (error) {
            console.error("Error fetching services:", error);
        }
    }

    function handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const serviceIdFromUrl = urlParams.get('service_id');

        if (serviceIdFromUrl) {
            // หา Input ที่มี value ตรงกับ ID จาก URL
            const targetRadio = document.querySelector(`input[name="main_service"][value="${serviceIdFromUrl}"]`);
            if (targetRadio) {
                targetRadio.checked = true;
                calculatePrice(); 
                targetRadio.closest('.service-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // --- 3. ระบบคำนวณราคา ---
    function calculatePrice() {
        let sum = 0;
        const mainService = document.querySelector('input[name="main_service"]:checked');
        if (mainService) {
            // ถ้า value เป็น ID ให้ใช้ data-price แทน (ถ้าคุณใส่ไว้ใน HTML)
            // แต่ถ้าใน HTML value เป็นราคาอยู่แล้ว ก็ใช้ค่านี้ได้เลย
            sum += parseInt(mainService.value || 0);
        }
        const addons = document.querySelectorAll('#addon-service-group input:checked');
        addons.forEach(addon => {
            sum += parseInt(addon.value || 0);
        });

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

    // --- 5. ยืนยันการจอง ---
    const submitBtn = document.getElementById("submit-booking");
    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            const mainService = document.querySelector('input[name="main_service"]:checked');
            const selectedTime = document.querySelector(".time-item.selected");
            const selectedDate = document.querySelector(".date-item.active");

            if (!mainService) return alert("กรุณาเลือกบริการหลัก");
            if (!selectedTime) return alert("กรุณาเลือกเวลา");
            if (!selectedCar) return alert("ไม่พบข้อมูลรถของคุณ");

            const addonIds = [];
            document.querySelectorAll("#addon-service-group input:checked").forEach((el) => {
                addonIds.push(parseInt(el.dataset.id)); // สมมติว่าเก็บ ID ไว้ใน data-id
            });

            const bookingData = {
                vehicle_id: selectedCar.vehicle_id,
                service_id: parseInt(mainService.dataset.id), // ID บริการหลัก
                addon_ids: addonIds,
                booking_date: selectedDate.dataset.date,
                booking_time: selectedTime.dataset.time,
                total_price: parseInt(totalDisplay.textContent.replace(/,/g, '')),
                display_name: mainService.dataset.name // สำหรับโชว์ในหน้าถัดไป
            };

            localStorage.setItem("tempBooking", JSON.stringify(bookingData));
            window.location.href = "confirm.html";
        });
    }

    // --- 6. Event Listeners ---
    document.addEventListener('change', (e) => {
        if (e.target.name === 'main_service' || e.target.closest('#addon-service-group')) {
            calculatePrice();
        }
    });

    // --- เริ่มทำงานตามลำดับ ---
    await fetchUserVehicles(); // โหลดรถก่อน
    await fetchServices();     // โหลดบริการและเช็ค URL
    calculatePrice();          // คำนวณราคาสรุป
});