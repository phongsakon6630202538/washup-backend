import React, { useState, useEffect } from 'react';
import { Car, Clock, CheckCircle2, AlertCircle, Trash2, Calendar, MapPin } from 'lucide-react';

interface Booking {
  booking_id: number;
  booking_datetime: string;
  status: string;
  total_price?: number;
  vehicle: {
    brand: string;
    model: string;
    license_plate: string;
    color: string;
  };
}

const HistoryPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. ดึงข้อมูลประวัติการจอง
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/bookings/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setBookings(data);
      }
    } catch (error) {
      console.error("Fetch history error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 2. ฟังก์ชันยกเลิกการจอง (DELETE)
  const handleCancel = async (id: number) => {
    if (!window.confirm('ยืนยันการยกเลิกการจองนี้?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('ยกเลิกการจองสำเร็จ');
        fetchHistory();
      } else {
        const err = await response.json();
        alert(err.message || 'ไม่สามารถยกเลิกได้');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }) + ' เวลา ' + date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  };

  // แยกกลุ่มสถานะ
  const activeBookings = bookings.filter(b => ['pending', 'confirmed', 'in_progress', 'ready'].includes(b.status));
  const pastBookings = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div className="history-page">
      <style>{`
        .history-page { max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Prompt', sans-serif; background: #fcfcfc; }
        .header { margin-bottom: 30px; }
        .header h1 { font-size: 22px; font-weight: 800; color: #1a1a1a; margin-bottom: 5px; }
        .header p { font-size: 13px; color: #888; }

        .section-label { font-size: 15px; font-weight: 700; color: #ff3b30; margin: 30px 0 15px; display: flex; align-items: center; gap: 8px; }
        
        .booking-card { background: white; border-radius: 20px; padding: 20px; margin-bottom: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.04); border: 1px solid #f0f0f0; }
        .booking-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .order-id { font-weight: 800; font-size: 16px; color: #ff3b30; }
        .order-date { font-size: 12px; color: #aaa; margin-top: 2px; }

        .car-info { display: flex; align-items: center; gap: 15px; background: #fdf2f2; padding: 15px; border-radius: 15px; margin-bottom: 20px; }
        .car-icon-wrap { background: #ff3b30; color: white; padding: 10px; border-radius: 12px; }
        .car-text div { font-size: 13px; color: #444; }
        .car-text strong { color: #000; }

        .status-stepper { display: flex; justify-content: space-between; position: relative; margin: 25px 0; }
        .step { display: flex; flex-direction: column; align-items: center; z-index: 1; flex: 1; }
        .step-icon { width: 32px; height: 32px; border-radius: 50%; background: #eee; display: flex; align-items: center; justify-content: center; color: #bbb; margin-bottom: 6px; transition: 0.3s; }
        .step.active .step-icon { background: #ff3b30; color: white; box-shadow: 0 4px 10px rgba(255,59,48,0.3); }
        .step-label { font-size: 10px; font-weight: 700; color: #ccc; text-transform: uppercase; }
        .step.active .step-label { color: #ff3b30; }

        .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 15px; border-top: 1px dashed #eee; }
        .btn-cancel { background: none; border: none; color: #bbb; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
        .btn-cancel:hover { color: #ff3b30; }
        
        .badge { font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 50px; }
        .badge-completed { background: #e6fffa; color: #2dce89; }
        .badge-cancelled { background: #fff5f5; color: #ff3b30; }
      `}</style>

      <div className="header">
        <h1>ประวัติและติดตามสถานะ</h1>
        <p>คุณสามารถเช็คสถานะการล้างรถได้แบบ Real-time ที่นี่</p>
      </div>

      {/* รายการที่กำลังดำเนินการ */}
      <div className="section-label"><Clock size={18} /> รายการปัจจุบัน</div>
      
      {activeBookings.length > 0 ? activeBookings.map(item => (
        <div key={item.booking_id} className="booking-card">
          <div className="booking-header">
            <div>
              <div className="order-id">#BOOKING-{item.booking_id}</div>
              <div className="order-date">{formatDate(item.booking_datetime)}</div>
            </div>
          </div>

          <div className="car-info">
            <div className="car-icon-wrap"><Car size={24} /></div>
            <div className="car-text">
              <div>ยี่ห้อ: <strong>{item.vehicle.brand} {item.vehicle.model}</strong></div>
              <div>ทะเบียน: <strong>{item.vehicle.license_plate}</strong></div>
            </div>
          </div>

          <div className="status-stepper">
            <div className={`step ${['pending','confirmed','in_progress','ready'].includes(item.status) ? 'active' : ''}`}>
              <div className="step-icon"><AlertCircle size={16} /></div>
              <span className="step-label">รอยืนยัน</span>
            </div>
            <div className={`step ${['confirmed','in_progress','ready'].includes(item.status) ? 'active' : ''}`}>
              <div className="step-icon"><CheckCircle2 size={16} /></div>
              <span className="step-label">ยืนยันแล้ว</span>
            </div>
            <div className={`step ${['in_progress','ready'].includes(item.status) ? 'active' : ''}`}>
              <div className="step-icon"><Clock size={16} /></div>
              <span className="step-label">กำลังล้าง</span>
            </div>
            <div className={`step ${item.status === 'ready' ? 'active' : ''}`}>
              <div className="step-icon"><CheckCircle2 size={16} /></div>
              <span className="step-label">เสร็จแล้ว</span>
            </div>
          </div>

          <div className="card-footer">
            <span style={{ fontSize: '13px', color: '#888' }}>
              สถานะ: <strong style={{ color: '#ff3b30' }}>{item.status.toUpperCase()}</strong>
            </span>
            {item.status === 'pending' && (
              <button onClick={() => handleCancel(item.booking_id)} className="btn-cancel">
                <Trash2 size={14} /> ยกเลิกการจอง
              </button>
            )}
          </div>
        </div>
      )) : <div style={{ textAlign: 'center', padding: '30px', color: '#ccc', fontSize: '14px' }}>ไม่มีรายการที่กำลังดำเนินการ</div>}

      {/* ประวัติที่ผ่านมา */}
      {pastBookings.length > 0 && (
        <>
          <div className="section-label"><Calendar size={18} /> ประวัติการจองที่ผ่านมา</div>
          {pastBookings.map(item => (
            <div key={item.booking_id} className="booking-card" style={{ opacity: 0.7 }}>
              <div className="booking-header">
                <div>
                  <div className="order-id" style={{ color: '#555' }}>#ID-{item.booking_id}</div>
                  <div className="order-date">{formatDate(item.booking_datetime)}</div>
                </div>
                <span className={`badge ${item.status === 'completed' ? 'badge-completed' : 'badge-cancelled'}`}>
                  {item.status === 'completed' ? 'SUCCESS' : 'CANCELLED'}
                </span>
              </div>
              <div className="car-text" style={{ fontSize: '13px' }}>
                รถยนต์: {item.vehicle.brand} ({item.vehicle.license_plate})
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default HistoryPage;