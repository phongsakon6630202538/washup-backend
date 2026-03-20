import React, { useState, useEffect } from 'react';
import { Car, Plus, Check, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const BookingPage = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('24');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // --- ส่วนจัดการข้อมูลรถ ---
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/vehicles/user',  {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        
        if (response.ok) {
          // แก้จุดนี้: API ของคุณส่งมาในรูปแบบ { data: [รถ1, รถ2] }
          const vehicleData = result.data || result; 
          
          if (Array.isArray(vehicleData)) {
            setVehicles(vehicleData);
            if (vehicleData.length > 0) {
              // เลือก ID แรกให้โดยอัตโนมัติ (รองรับทั้ง _id และ vehicle_id)
              setSelectedVehicleId(vehicleData[0]._id || vehicleData[0].vehicle_id);
            }
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // --- ฟังก์ชันบันทึกการจอง ---
  const handleBooking = async () => {
    if (!selectedVehicleId || !selectedService || !selectedTime) {
      alert('กรุณาเลือกข้อมูลให้ครบถ้วน');
      return;
    }

    const mainService = mainServices.find(s => s.id === selectedService);
    const addonsTotal = selectedAddons.reduce((acc, id) => acc + (addons.find(a => a.id === id)?.price || 0), 0);
    const totalPrice = (mainService?.price || 0) + addonsTotal;

    // แก้ไขตรงนี้: ให้หาจากทั้ง _id และ vehicle_id เพื่อความแม่นยำ
    const selectedCar = vehicles.find(v => (v._id === selectedVehicleId || v.vehicle_id === selectedVehicleId));

    const bookingData = {
      vehicle_id: selectedCar?.vehicle_id,
      service_details: {
        main_service: mainService?.name,
        addons: selectedAddons.map(id => addons.find(a => a.id === id)?.name),
      },
      appointment_date: `2024-03-${selectedDate}`, // ตัวอย่างวันที่
      appointment_time: selectedTime,
      total_price: totalPrice,
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        alert('จองบริการสำเร็จ!');
        navigate('/status'); // หรือหน้าติดตามสถานะ
      } else {
        const err = await response.json();
        alert('เกิดข้อผิดพลาด: ' + err.message);
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const mainServices = [
    { id: 'std', name: 'ล้างสี - ดูดฝุ่น (STANDARD WASH)', desc: 'ล้างทำความสะอาดภายนอกและภายในรถเบื้องต้น เช็ดแห้ง ทำความสะอาดกระจก ดูดฝุ่นพื้นรถและพรม และเช็ดแผงหน้าปัด', price: 150 },
    { id: 'prm', name: 'ล้างสี - ดูดฝุ่น + เคลือบแว็กซ์ (PREMIUM WASH)', desc: 'บริการแบบ STANDARD WASH พร้อมเพิ่มการลงแว็กซ์เคลือบสีรถ เพื่อความเงางามและปกป้องสีจากมลภาวะ และป้องกันคราบน้ำเกาะ', price: 300 },
    { id: 'dlx', name: 'สปารถเต็มรูปแบบ (DELUXE DETAILING)', desc: 'บริการทำความสะอาดอย่างละเอียด ทั้งภายนอกและภายในรถยนต์ ฟื้นฟูสภาพพื้นผิวรถยนต์และพรม ให้กลับมาดูดีเหมือนใหม่', price: 700 },
    { id: 'ubw', name: 'ล้างอัดฉีด - ฉีดล้างช่วงล่าง (UNDERBODY WASH)', desc: 'ฉีดล้างคราบสกปรกและโคลนสะสมใต้ท้องรถด้วยเครื่องฉีดน้ำแรงดันสูง พร้อมเคลือบป้องกันสนิมเบื้องต้น', price: 250 },
    { id: 'exp', name: 'ล้างด่วนภายนอก (EXPRESS EXTERIOR ONLY)', desc: 'ล้างทำความสะอาดสีรถและเช็ดแห้งภายนอกเพียงอย่างเดียวเพื่อความรวดเร็ว (ไม่รวมงานดูดฝุ่นและภายใน)', price: 100 },
    { id: 'hyg', name: 'ฆ่าเชื้อและฟอกอากาศ (HYGIENE PACKAGE)', desc: 'บริการอบไอน้ำ ฆ่าเชื้อโรคในรถ และใช้น้ำยาอบโอโซนเพื่อทำลายกลิ่นไม่พึงประสงค์', price: 400 },
  ];

  const addons = [
    { id: 'rain', name: 'เคลือบกระจกกันน้ำ (RAIN REPELLENT)', desc: 'เคลือบสารผลักน้ำบนกระจกหน้าและรอบคัน ช่วยให้ทัศนวิสัยดีเยี่ยมแม้ฝนตกหนัก', price: 50 },
    { id: 'tar', name: 'ขจัดคราบยางมะตอย / คราบแมลง (TAR & BUG REMOVAL)', desc: 'ใช้น้ำยาเฉพาะทางเพื่อสลายคราบยางมะตอยและแมลง โดยไม่ทำลายชั้นแลกเกอร์ของรถ', price: 200 },
    { id: 'eng', name: 'ล้างทำความสะอาดห้องเครื่อง (ENGINE BAY CLEANING)', desc: 'ขจัดคราบน้ำมันและฝุ่นสะสมในห้องเครื่องอย่างปลอดภัย พร้อมพ่นเคลือบรักษาท่อยางและพลาสติก', price: 300 },
    { id: 'ozone', name: 'อบโอโซนกำจัดกลิ่นอับ (OZONE PURIFICATION)', desc: 'อบโอโซนภายในรถ 15-20 นาที เพื่อกำจัดกลิ่นบุหรี่ กลิ่นอาหาร และเชื้อแบคทีเรียในช่องแอร์', price: 100 },
    { id: 'trim', name: 'ฟื้นฟูพลาสติกภายนอก (PLASTIC TRIM RESTORE)', desc: 'ฟื้นฟูชิ้นส่วนพลาสติกสีดำที่ซีดจาง (กันชน, คิ้วล้อ) ให้กลับมาดำเงางามและทนทานต่อน้ำ', price: 100 },
  ];

  const dates = [
    { day: 'MON', date: '23' }, { day: 'TUE', date: '24' }, { day: 'WED', date: '25' },
    { day: 'THU', date: '26' }, { day: 'FRI', date: '27' }, { day: 'SAT', date: '28' },
    { day: 'SUN', date: '01' },
  ];

  const timeSlots = [
    { time: '09:00', slot: '0 / 2' }, { time: '10:30', slot: '1 / 2' }, { time: '12:00', slot: '2 / 2' },
    { time: '13:30', slot: '0 / 2' }, { time: '15:00', slot: '0 / 2' }, { time: '16:30', slot: '0 / 2' },
  ];

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  return (
    <div className="booking-page-root">
      <style>{`
        .booking-page-root {
          max-width: 600px;
          margin: 0 auto;
          padding: 30px 20px 100px;
          font-family: 'Inter', 'Prompt', sans-serif;
          background-color: #fafafa;
          color: #333;
        }

        .title-section { margin-bottom: 35px; }
        .main-title { font-size: 24px; font-weight: 800; margin-bottom: 4px; color: #000; }
        .sub-title { font-size: 11px; color: #888; letter-spacing: 0.02em; }

        .step-container { margin-bottom: 45px; }
        .step-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .step-num {
          background: #ff3b30; color: white; width: 28px; height: 28px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-weight: bold; font-size: 14px;
        }
        .step-label { font-size: 16px; font-weight: 700; color: #444; }

        .car-list { display: flex; flex-direction: column; gap: 10px; }
        .car-card {
          display: flex; align-items: center; padding: 15px; background: white;
          border-radius: 16px; border: 2px solid transparent; cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02); transition: 0.2s;
        }
        .car-card.selected { border-color: #ff3b30; background: #fffcfc; }
        .car-info-main { flex: 1; margin-left: 15px; }
        .car-plate { font-size: 15px; font-weight: 800; color: #000; }
        .car-detail { font-size: 11px; color: #999; }
        .add-more-car {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px; border: 1.5px dashed #ccc; border-radius: 12px;
          color: #888; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 10px;
        }

        .car-empty-box {
          border: 1.5px dashed #ffbaba; background: #fff8f8;
          border-radius: 12px; padding: 40px 20px; text-align: center;
        }
        .car-icon-bg {
          background: #ffe5e5; width: 65px; height: 65px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;
        }
        .car-empty-text { font-size: 15px; font-weight: 800; margin-bottom: 4px; }
        .car-empty-sub { font-size: 11px; color: #999; margin-bottom: 20px; line-height: 1.5; }
        .btn-add-car {
          background: #d40000; color: white; padding: 8px 24px; border-radius: 50px;
          border: none; font-weight: 700; font-size: 13px; cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px;
          text-decoration: none;
        }

        .service-group-label { font-size: 12px; font-weight: 700; color: #bbb; margin-bottom: 15px; display: block; border-bottom: 1px solid #eee; padding-bottom: 8px; }
        .service-item {
          display: flex; align-items: flex-start; gap: 15px; padding: 18px;
          background: #f2f2f2; border-radius: 12px; margin-bottom: 10px; cursor: pointer;
          border: 2px solid transparent; transition: 0.2s;
        }
        .service-item.selected { border-color: #d40000; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
        .radio-circle {
          min-width: 18px; height: 18px; border-radius: 50%; border: 2px solid #ccc;
          margin-top: 3px; display: flex; align-items: center; justify-content: center;
        }
        .selected .radio-circle { border-color: #d40000; }
        .radio-inner { width: 10px; height: 10px; background: #d40000; border-radius: 50%; }
        
        .service-info { flex: 1; }
        .service-name { font-size: 14px; font-weight: 700; margin-bottom: 4px; display: block; }
        .service-desc { font-size: 9px; color: #aaa; line-height: 1.4; display: block; }
        .service-price { font-size: 13px; font-weight: 700; color: #999; margin-left: 10px; white-space: nowrap; }
        .selected .service-price { color: #d40000; }

        .date-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 25px; }
        .date-btn {
          display: flex; flex-direction: column; align-items: center; padding: 12px 0;
          background: #efefef; border-radius: 10px; border: none; cursor: pointer;
        }
        .date-btn.active { background: #d40000; color: white; }
        .date-day { font-size: 9px; font-weight: 700; margin-bottom: 4px; opacity: 0.6; }
        .date-num { font-size: 18px; font-weight: 800; }

        .time-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .time-btn {
          padding: 12px; background: #efefef; border-radius: 8px; border: none;
          display: flex; justify-content: space-between; align-items: center; cursor: pointer;
        }
        .time-btn.active { background: #fff; outline: 1.5px solid #ff3b30; color: #ff3b30; }
        .time-val { font-size: 12px; font-weight: 700; }
        .time-slot { font-size: 10px; opacity: 0.4; font-weight: 700; }

        .summary-bar {
          position: fixed; bottom: 0; left: 0; right: 0; background: white;
          padding: 15px 25px; border-top: 1px solid #eee; display: flex;
          justify-content: space-between; align-items: center; box-shadow: 0 -5px 20px rgba(0,0,0,0.05);
        }
        .total-label { font-size: 10px; font-weight: 800; color: #bbb; text-transform: uppercase; }
        .total-val { font-size: 24px; font-weight: 900; color: #d40000; }
        .btn-submit {
          background: #d40000; color: white; padding: 14px 40px; border-radius: 12px;
          border: none; font-weight: 800; font-size: 14px; cursor: pointer;
        }
      `}</style>

      <div className="title-section">
        <h1 className="main-title">จองบริการล้างรถ</h1>
        <p className="sub-title">บริการล้างรถระดับพรีเมียมเพียงปลายนิ้ว พร้อมรับประกัน ความสะอาดและเงางามดุจรถใหม่ งานคุณภาพ</p>
      </div>

      {/* Section 1 */}
      <div className="step-container">
        <div className="step-head">
          <div className="step-num">1</div>
          <span className="step-label">ข้อมูลรถ</span>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#999', fontSize: '13px' }}>กำลังโหลดข้อมูลรถ...</p>
        ) : vehicles.length > 0 ? (
          <div className="car-list">
            {vehicles.map(car => {
              const carId = car._id || car.vehicle_id; // รองรับทั้งสองแบบ
              return (
                <div
                  key={carId}
                  className={`car-card ${selectedVehicleId === carId ? 'selected' : ''}`}
                  onClick={() => setSelectedVehicleId(carId)}
                >
                  <div className="radio-circle">
                    {selectedVehicleId === carId && <div className="radio-inner" />}
                  </div>
                  <div className="car-info-main">
                    <div className="car-plate">{car.license_plate}</div>
                    <div className="car-detail">{car.brand} {car.model} • {car.color}</div>
                  </div>
                  <ChevronRight size={18} color="#ccc" />
                </div>
              );
            })}
            <Link to="/addcar" className="add-more-car">
              <Plus size={16} /> เพิ่มรถคันอื่น
            </Link>
          </div>
        ) : (
          <div className="car-empty-box">
            <div className="car-icon-bg"><Car color="#d40000" size={32} /></div>
            <div className="car-empty-text">ยังไม่มีรถ</div>
            <p className="car-empty-sub">เพิ่มรายละเอียดรถของคุณเพื่อ<br />ดูแพ็กเกจล้างรถระดับพรีเมียมที่เหมาะสม</p>
            <Link to="/addcar" className="btn-add-car">
              <Plus size={16} strokeWidth={3} /> เพิ่มรถคันแรกของคุณ
            </Link>
          </div>
        )}
      </div>

      {/* Section 2 */}
      <div className="step-container">
        <div className="step-head">
          <div className="step-num">2</div>
          <span className="step-label">บริการและแพ็กเกจ</span>
        </div>
        
        <span className="service-group-label">บริการหลัก</span>
        {mainServices.map(s => (
          <div key={s.id} className={`service-item ${selectedService === s.id ? 'selected' : ''}`} onClick={() => setSelectedService(s.id)}>
            <div className="radio-circle">{selectedService === s.id && <div className="radio-inner" />}</div>
            <div className="service-info">
              <span className="service-name">{s.name}</span>
              <span className="service-desc">{s.desc}</span>
            </div>
            <span className="service-price">{s.price} THB</span>
          </div>
        ))}

        <span className="service-group-label" style={{marginTop: '30px'}}>บริการเสริม <span style={{fontWeight: 400, fontSize: '10px'}}>( ลูกค้าสามารถเลือกเพิ่มได้ตามความต้องการ )</span></span>
        {addons.map(a => (
          <div key={a.id} className={`service-item ${selectedAddons.includes(a.id) ? 'selected' : ''}`} onClick={() => toggleAddon(a.id)}>
            <div className="radio-circle" style={{borderRadius: '4px'}}>{selectedAddons.includes(a.id) && <Check size={14} color="#d40000" strokeWidth={4} />}</div>
            <div className="service-info">
              <span className="service-name">{a.name}</span>
              <span className="service-desc">{a.desc}</span>
            </div>
            <span className="service-price">{a.price} THB</span>
          </div>
        ))}
      </div>

      {/* Section 3 */}
      <div className="step-container">
        <div className="step-head">
          <div className="step-num">3</div>
          <span className="step-label">วันที่และเวลา</span>
        </div>
        <div className="date-row">
          {dates.map(d => (
            <button key={d.date} className={`date-btn ${selectedDate === d.date ? 'active' : ''}`} onClick={() => setSelectedDate(d.date)}>
              <span className="date-day">{d.day}</span>
              <span className="date-num">{d.date}</span>
            </button>
          ))}
        </div>
        <div className="time-row">
          {timeSlots.map(t => (
            <button key={t.time} className={`time-btn ${selectedTime === t.time ? 'active' : ''}`} onClick={() => setSelectedTime(t.time)}>
              <span className="time-val">{t.time}</span>
              <span className="time-slot">{t.slot}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sticky Summary Bar */}
      {selectedService && (
        <div className="summary-bar">
          <div>
            <div className="total-label">ยอดรวมประมาณการ</div>
            <div className="total-val">
              {(mainServices.find(s => s.id === selectedService)?.price || 0) + 
                selectedAddons.reduce((acc, id) => acc + (addons.find(a => a.id === id)?.price || 0), 0)
              } <span style={{fontSize: '12px', color: '#999'}}>THB</span>
            </div>
          </div>
          <button className="btn-submit" onClick={handleBooking}>ยืนยันการจอง</button>
        </div>
      )}
    </div>
  );
};

export default BookingPage;