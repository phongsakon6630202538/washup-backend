document.addEventListener("DOMContentLoaded", () => {
    const carForm = document.getElementById('carForm');
    const typeOptions = document.querySelectorAll('.type-option');
    const btnCancel = document.querySelector('.btn-cancel');

    // --- 1. จัดการการเลือกประเภทรถ (UI Selection) ---
    if (typeOptions.length > 0) {
        typeOptions.forEach(option => {
            option.addEventListener('click', function() {
                // ลบ class active จากทุกตัวก่อน
                typeOptions.forEach(opt => opt.classList.remove('active'));
                
                // เพิ่ม class active ให้ตัวที่คลิก
                this.classList.add('active');
                
                // ติ๊กถูกที่ radio input ที่ซ่อนอยู่ข้างใน
                const radio = this.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    console.log("เลือกประเภทรถ ID:", radio.value); // Sedan=1, SUV=2
                }
            });
        });
    }

    // --- 2. จัดการการส่งข้อมูลไปยัง Server (Submit Form) ---
    if (carForm) {
        carForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // ดึง Token จาก LocalStorage (ต้องใช้เพื่อยืนยันตัวตน)
            const token = localStorage.getItem('token');
            if (!token) {
                alert("กรุณาเข้าสู่ระบบก่อนเพิ่มข้อมูลรถ");
                window.location.href = "login.html";
                return;
            }

            // เตรียมข้อมูลให้ตรงกับ API (Field names ตามที่ Server ต้องการ)
            const selectedType = document.querySelector('input[name="car_type"]:checked');
            
            const formData = {
                vehicle_type_id: parseInt(selectedType.value), // ส่งเป็นตัวเลข 1 หรือ 2
                license_plate: document.getElementById('license_plate').value.trim(),
                brand: document.getElementById('brand').value.trim(),
                model: document.getElementById('model').value.trim(),
                color: document.getElementById('color').value.trim(),
                note: document.getElementById('note').value.trim() || ""
            };

            try {
                // ยิง API ไปที่ Server (ปรับ URL ตามจริงของคุณ)
                const response = await fetch("http://localhost:3000/api/vehicles", {
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
                    window.location.href = "profile.html"; // ไปยังหน้าโปรไฟล์หรือรายการรถ
                } else {
                    alert("เกิดข้อผิดพลาด: " + (result.message || "ไม่สามารถบันทึกได้"));
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง");
            }
        });
    }

    // --- 3. จัดการปุ่มยกเลิก (Reset Form) ---
       // ค้นหาส่วนจัดการปุ่มยกเลิกในไฟล์ JS ที่คุมหน้าเพิ่มรถ

            if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                // เปลี่ยนจาก carForm.reset() เป็นการส่งกลับไปหน้าจอง
                window.location.href = "bookingnocar.html";
            });
            }
        
});