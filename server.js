const express = require("express"); // ใช้สร้าง API Server
const mongoose = require("mongoose"); // ใช้เชื่อมต่อ MongoDB

const app = express();// สร้างตัวแอป server
app.use(express.json());

// เชื่อมต่อ Database
mongoose.connect("mongodb://127.0.0.1:27017/carwashDB");

app.post("/users/register",async(req,res) => {
    const db = mongoose.connection.collection("users");

    // หา user ล่าสุด
    const lastUser = await db.find()
    .sort({ _id: -1 })
    .limit(1)
    .toArray();

    let newUserId = 1001; // ค่าเริ่มต้น
    if (lastUser.length > 0) { 
       newUserId = lastUser[0].user_id + 1;}
      
    const user ={
        user_id:newUserId,
        login_name:req.body.login_name,
        login_password:req.body.login_password,
        user_role: "customer",
        fullname:req.body.fullname,
        phone:req.body.phone
    };
    //บันทึกข้อมูลลง MongoDB
    const result = await db.insertOne(user);

      // ส่งข้อมูลกลับเป็น JSON
    res.json({
        message:"register sucess",
        data: result
    });
});
// เปิด Server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});


