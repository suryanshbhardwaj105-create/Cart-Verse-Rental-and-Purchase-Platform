import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname,"client")));

app.use(express.static(path.join(__dirname,"client")));

app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,"client","oindex.html"));
});

app.get("/register",(req,res)=>{
    res.sendFile(path.join(__dirname,"client","register.html"));
});

app.use(bodyParser.json());
app.use(cors());

/* ===== MongoDB ===== */

mongoose.connect("mongodb://127.0.0.1:27017/cartverse")
.then(()=>console.log("MongoDB Connected"));

/* ===== Schema ===== */

const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    gender:String,
    address:String
});

const User = mongoose.model("User", userSchema);

/* ===== OTP STORE ===== */

let otpStore = {};

/* ===== EMAIL CONFIG ===== */

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "deveshsingh.8865@gmail.com",
        pass: "tpevwhcqlcgbgpmt"
    }
});

/* ===== SEND OTP ===== */

app.post("/send-otp", async (req, res) => {
    try{
        const { email } = req.body;
        console.log("Request aayi for:", email);

        const otp = Math.floor(1000 + Math.random() * 9000);

        otpStore[email] = otp;

        await transporter.sendMail({
            from: "yourgmail@gmail.com",
            to: email,
            subject: "Cart-Verse OTP",
            text: `Your OTP is ${otp}`
        });
        console.log("OTP SENT:",otp);

        res.json({ success: true, message: "OTP sent ✅" });
    }catch (error) {
        console.log("EMAIL ERROR:", error);
        res.json({ success: false, message: "Email failed ❌" });
    }
});

/* ===== VERIFY OTP + REGISTER ===== */

app.post("/verify-otp", async (req, res) => {

    const { email, password, otp, gender, address } = req.body;

    if (otpStore[email] != otp) {
        return res.json({ success: false, message: "Invalid OTP ❌" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
        email,
        password: hashedPassword,
        gender,
        address
    });

    await user.save();

    delete otpStore[email];

    res.json({
        success: true,
        message: "Registered Successfully ✅"
    });
});

/* ===== LOGIN ===== */

app.post("/login", async(req,res)=>{

    const {email,password} = req.body;

    const user = await User.findOne({email});

    if(!user){
        return res.json({success:false,message:"User not found"});
    }

    const isMatch = await bcrypt.compare(password,user.password);

    if(!isMatch){
        return res.json({success:false,message:"Wrong Password"});
    }

    const token = jwt.sign(
        {id:user._id},
        "SECRETKEY",
        {expiresIn:"1d"}
    );

    res.json({success:true,token});
});

/* ===== SERVER ===== */

app.listen(5000,()=>{
    console.log("Server running on port 5000");
});