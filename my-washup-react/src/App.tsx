import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import UserLayout from "./layouts/UserLayout";
import Home from "./pages/user/Home";
import BookingPage from "./pages/user/booking";
import AddCar from "./pages/user/addcar";
import HistoryPage from "./pages/user/history"; // 1. Import หน้า History ที่สร้างใหม่
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import StaffLayout from "./layouts/StaffLayout";
import StaffDashboard from "./pages/staff/Dashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 🟢 โซนลูกค้า (มี Navbar/Footer ตาม Layout) */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="addcar" element={<AddCar />} />
          <Route path="history" element={<HistoryPage />} /> {/* 2. เพิ่ม Route หน้าประวัติการจอง */}
        </Route>

        {/* 🔵 โซนพนักงาน */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<StaffDashboard />} />
        </Route>

        {/* 🟡 โซน Authentication (ไม่มี Layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}