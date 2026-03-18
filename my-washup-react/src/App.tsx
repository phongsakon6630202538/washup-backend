import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import UserLayout from "./layouts/UserLayout";
import Home from "./pages/user/Home";
import Login from "./pages/auth/Login"; // Import มาก่อน
import Register from "./pages/auth/Register"; // 1. Import มา

// 1. นำเข้า StaffLayout ที่เพิ่งสร้าง
import StaffLayout from "./layouts/StaffLayout";
import StaffDashboard from "./pages/staff/Dashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 🟢 โซนลูกค้า */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Home />} />
        </Route>

        {/* 🔵 โซนพนักงาน: แก้ตรงนี้! เอา StaffLayout มาครอบ StaffDashboard ไว้ */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<StaffDashboard />} />
          {/* ถ้าในอนาคตมีหน้าอื่นของพนักงาน ก็เอามาเพิ่มต่อในนี้ได้เลย */}
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}
