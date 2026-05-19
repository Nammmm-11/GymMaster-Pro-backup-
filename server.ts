import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

interface Member {
  id: number;
  memberCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username?: string;
  phone: string;
  email: string;
  dob: string;
  gender: string;
  address: string;
  status: string;
  registrationDate?: string;
  expiryDate: string;
  package: string;
  createdBy?: string;
  revenue?: number;
  avatar?: string;
  faceData?: string;
  deletedAt: string | null;
  assignedPTId?: number | null;
  password?: string;
}

interface PersonalTrainer {
  id: number;
  fullName: string;
  expertise: string[];
  level: "Junior" | "Senior" | "Master";
  commissionRate: number; // e.g., 0.1 for 10%
  isActive: boolean;
  phone: string;
  email: string;
  avatar?: string;
}

interface StaffMember {
  id: number;
  fullName: string;
  role: "ADMIN" | "STAFF" | "PT" | "RECEPTIONIST";
  position: string;
  baseSalary: number;
  hourlyRate: number;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  shiftHours: { start: string; end: string };
}

interface AttendanceLog {
  id: number;
  staffId: number;
  checkIn: string;
  checkOut: string | null;
  totalHours: number;
  date: string;
  isOT: boolean;
}

interface PayrollRecord {
  id: number;
  staffId: number;
  month: string;
  basePay: number;
  commission: number;
  ptBonus: number;
  otPay: number;
  totalPay: number;
  status: "Draft" | "Paid";
}

interface PTAssignment {
  id: number;
  memberId: number;
  trainerId: number;
  totalSessions: number;
  sessionsLeft: number;
  price: number;
  startDate: string;
  expiryDate: string;
  assignedDate?: string;
  status: "Active" | "Completed" | "Expired";
}

interface TrainingSession {
  id: number;
  assignmentId: number;
  date: string;
  notes: string;
  memberId: number;
  trainerId: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
}

interface Transaction {
  id: number;
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  note: string;
  date: string;
  createdBy: string;
  customerName?: string;
}

interface MemberSale {
  id: number;
  customerName: string;
  serviceName: string;
  dateTime: string;
  total: number;
  discount: number;
  paymentMethod: string;
  paidAmount: number;
  status: "Hoàn thành";
  startDate?: string;
  expiryDate?: string;
}

interface Evaluation {
  id: number;
  memberId: number;
  memberName: string;
  rating: number;
  comment: string;
  date: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Dữ liệu mẫu
  let members: Member[] = [
    { 
      id: 1, 
      memberCode: "MEM001",
      firstName: "Nam",
      lastName: "Nguyễn Hoài",
      fullName: "Nguyễn Hoài Nam", 
      username: "hoainam",
      phone: "0901234567", 
      email: "hoainam78954@gmail.com",
      dob: "1990-01-01",
      gender: "Nam",
      address: "123 Quận 1, TP.HCM",
      status: "Hoạt động", 
      registrationDate: "2024-01-01", 
      expiryDate: "2026-12-31", 
      package: "Gói Cao Cấp 12T", 
      createdBy: "admin", 
      revenue: 4500000, 
      deletedAt: null,
      password: "123456"
    },
    { 
      id: 3, 
      memberCode: "MEM003",
      firstName: "C",
      lastName: "Lê Văn",
      fullName: "Lê Văn C", 
      username: "vanc",
      phone: "0912345678", 
      email: "vanc@gmail.com",
      dob: "1988-10-20",
      gender: "Nam",
      address: "789 Quận 7, TP.HCM",
      status: "Hoạt động", 
      registrationDate: "2024-06-20", 
      expiryDate: "2026-06-20", 
      package: "Gói Tiêu Chuẩn 6T", 
      createdBy: "staff", 
      revenue: 2500000, 
      deletedAt: null,
      password: "123456"
    },
    { 
      id: 4, 
      memberCode: "MEM004",
      firstName: "D",
      lastName: "Phạm Văn",
      fullName: "Phạm Văn D", 
      username: "vand",
      phone: "0908889999", 
      email: "vand@gmail.com",
      dob: "1992-12-12",
      gender: "Nam",
      address: "321 Quận 10, TP.HCM",
      status: "Hoạt động", 
      registrationDate: "2024-02-15", 
      expiryDate: "2026-12-31", 
      package: "Gói Cơ Bản", 
      createdBy: "admin", 
      revenue: 1500000, 
      deletedAt: null,
      password: "123456"
    },
  ];

  let packages = [
    { id: 1, name: "Gói Cơ Bản", duration: "1 Tháng", price: 500000, description: "Tập luyện tự do, không bao gồm huấn luyện viên", status: "Mở bán" },
    { id: 2, name: "Gói Tiêu Chuẩn 6T", duration: "6 Tháng", price: 2500000, description: "Tập luyện tự do, tặng 2 buổi tập với PT", status: "Mở bán" },
    { id: 3, name: "Gói Cao Cấp 12T", duration: "12 Tháng", price: 4500000, description: "Tập luyện tự do, tặng 5 buổi PT, có tủ đồ riêng", status: "Mở bán" },
    { id: 4, name: "Hội Viên VIP ELITE", duration: "12 Tháng", price: 12000000, description: "Huấn luyện viên cá nhân 1:1, đầy đủ dịch vụ xông hơi", status: "Mở bán" },
  ];

  let personalTrainers: PersonalTrainer[] = [
    {
      id: 1,
      fullName: "Nguyễn Huấn Luyện",
      expertise: ["Yoga", "Cử tạ", "Giảm cân"],
      level: "Senior",
      commissionRate: 0.15,
      isActive: true,
      phone: "0900112233",
      email: "huanluyen@gym.com"
    },
    {
      id: 2,
      fullName: "Lê PT",
      expertise: ["Boxing", "Crossfit"],
      level: "Master",
      commissionRate: 0.20,
      isActive: true,
      phone: "0900445566",
      email: "lept@gym.com"
    }
  ];

  let ptAssignments: PTAssignment[] = [
    {
      id: 1,
      memberId: 1,
      trainerId: 1,
      totalSessions: 12,
      sessionsLeft: 8,
      price: 3600000,
      startDate: "2024-05-01",
      expiryDate: "2024-06-01",
      status: "Active"
    }
  ];

  let trainingSessions: TrainingSession[] = [
    {
      id: 1,
      assignmentId: 1,
      date: new Date().toISOString(),
      notes: "Buổi đầu tiên thành công",
      memberId: 1,
      trainerId: 1
    }
  ];

  // Dữ liệu người dùng mẫu
  const users = [
    { id: 1, username: "admin", password: "123456", role: "ADMIN", fullName: "Admin System" },
    { id: 2, username: "staff", password: "123456", role: "STAFF", fullName: "Nhân Viên Tiếp Tân" },
    { id: 3, username: "pt", password: "123456", role: "PT", fullName: "Huấn Luyện Viên Demo" },
    { id: 4, username: "member", password: "123456", role: "MEMBER", fullName: "Hội Viên Thử Nghiệm" },
  ];

  let staffMembers: StaffMember[] = [
    {
      id: 1,
      fullName: "Nguyễn Văn Admin",
      role: "ADMIN",
      position: "Quản lý tổng",
      baseSalary: 15000000,
      hourlyRate: 100000,
      phoneNumber: "0988776655",
      email: "admin@gym.com",
      isActive: true,
      shiftHours: { start: "08:00", end: "17:00" }
    },
    {
      id: 2,
      fullName: "Trần Thị Tiếp Tân",
      role: "RECEPTIONIST",
      position: "Lễ tân ca sáng",
      baseSalary: 7000000,
      hourlyRate: 50000,
      phoneNumber: "0977665544",
      email: "letan@gym.com",
      isActive: true,
      shiftHours: { start: "06:00", end: "14:00" }
    }
  ];

  let attendanceLogs: AttendanceLog[] = [];
  let payrollRecords: PayrollRecord[] = [];

  let products: Product[] = [
    { id: 1, name: "Whey Protein 2kg", category: "Thực phẩm bổ sung", price: 1500000, stock: 15, image: "https://images.unsplash.com/photo-1593095191850-2a733cd0927e?auto=format&fit=crop&q=80&w=400" },
    { id: 2, name: "Găng tay tập gym", category: "Phụ kiện", price: 250000, stock: 20, image: "https://images.unsplash.com/photo-1583454110551-21f2fa2adfcd?auto=format&fit=crop&q=80&w=400" },
    { id: 3, name: "Bình nước 1L", category: "Phụ kiện", price: 120000, stock: 50, image: "https://images.unsplash.com/photo-1602143399827-bd953672d422?auto=format&fit=crop&q=80&w=400" },
    { id: 4, name: "Nước suối Aquafina", category: "Nước uống", price: 10000, stock: 100, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf3d?auto=format&fit=crop&q=80&w=400" },
    { id: 5, name: "Sting dâu", category: "Nước uống", price: 15000, stock: 45, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400" },
    { id: 6, name: "Khăn lau mồ hôi", category: "Phụ kiện", price: 50000, stock: 30, image: "https://images.unsplash.com/photo-1620912189865-07205168923a?auto=format&fit=crop&q=80&w=400" },
    { id: 7, name: "BCAA Powder", category: "Thực phẩm bổ sung", price: 850000, stock: 10, image: "https://images.unsplash.com/photo-1579722820308-d74e5719d38f?auto=format&fit=crop&q=80&w=400" },
  ];

  let transactions: Transaction[] = [
    { id: 1, type: "EXPENSE", amount: 2000000, category: "Tiền điện", note: "Thanh toán điện tháng 4", date: "2024-04-30", createdBy: "admin", customerName: "Văn phòng" },
    { id: 2, type: "INCOME", amount: 1500000, category: "Bán lẻ", note: "Bán Whey Protein", date: "2024-05-01", createdBy: "staff", customerName: "Khách lẻ" },
  ];

  let memberSales: MemberSale[] = [
    {
      id: 1,
      customerName: "Nguyễn Hoài Nam",
      serviceName: "Gói Cao Cấp 12T",
      dateTime: "2024-05-01 10:30",
      total: 4500000,
      discount: 0,
      paymentMethod: "Chuyển khoản",
      paidAmount: 4500000,
      status: "Hoàn thành"
    },
    {
      id: 2,
      customerName: "Lê Văn C",
      serviceName: "Gói Tiêu Chuẩn 6T",
      dateTime: "2024-05-05 14:15",
      total: 2500000,
      discount: 200000,
      paymentMethod: "Tiền mặt",
      paidAmount: 2300000,
      status: "Hoàn thành"
    }
  ];

  let evaluations: Evaluation[] = [
    { id: 1, memberId: 1, memberName: "Nguyễn Hoài Nam", rating: 5, comment: "Dịch vụ tuyệt vời, máy móc hiện đại!", date: "2024-05-18" },
    { id: 2, memberId: 3, memberName: "Lê Văn C", rating: 4, comment: "PT nhiệt tình nhưng giờ cao điểm hơi đông.", date: "2024-05-17" }
  ];

  // ==========================================
  // STAFF & PAYROLL API
  // ==========================================

  app.get("/api/staff", (req, res) => {
    res.json(staffMembers.filter(s => s.isActive));
  });

  app.post("/api/staff", (req, res) => {
    const maxId = staffMembers.length > 0 ? Math.max(...staffMembers.map(s => s.id)) : 0;
    const newStaff = { id: maxId + 1, isActive: true, ...req.body };
    staffMembers.push(newStaff);
    res.status(201).json(newStaff);
  });

  app.put("/api/staff/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = staffMembers.findIndex(s => s.id === id);
    if (index !== -1) {
      staffMembers[index] = { ...staffMembers[index], ...req.body, id };
      res.json(staffMembers[index]);
    } else {
      res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }
  });

  app.delete("/api/staff/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const staff = staffMembers.find(s => s.id === id);
    if (staff) {
      staff.isActive = false;
      res.json({ success: true });
    } else {
      res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }
  });

  // Attendance
  app.get("/api/attendance", (req, res) => {
    res.json(attendanceLogs);
  });

  app.post("/api/attendance/checkin", (req, res) => {
    const { staffId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const existing = attendanceLogs.find(l => l.staffId === parseInt(staffId) && l.date === today && !l.checkOut);
    
    if (existing) return res.status(400).json({ message: "Nhân viên đã check-in" });

    const maxId = attendanceLogs.length > 0 ? Math.max(...attendanceLogs.map(l => l.id)) : 0;
    const log: AttendanceLog = {
      id: maxId + 1,
      staffId: parseInt(staffId),
      checkIn: new Date().toISOString(),
      checkOut: null,
      totalHours: 0,
      date: today,
      isOT: false
    };
    attendanceLogs.push(log);
    res.status(201).json(log);
  });

  app.post("/api/attendance/checkout", (req, res) => {
    const { staffId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const log = attendanceLogs.find(l => l.staffId === parseInt(staffId) && l.date === today && !l.checkOut);

    if (!log) return res.status(404).json({ message: "Không tìm thấy log check-in" });

    log.checkOut = new Date().toISOString();
    const diff = (new Date(log.checkOut).getTime() - new Date(log.checkIn).getTime()) / (1000 * 60 * 60);
    log.totalHours = parseFloat(diff.toFixed(2));
    
    // Simple OT logic: > 8 hours is OT
    if (log.totalHours > 8) {
      log.isOT = true;
    }

    res.json(log);
  });

  // Payroll
  app.get("/api/payroll", (req, res) => {
    res.json(payrollRecords);
  });

  app.post("/api/payroll/generate", (req, res) => {
    const { month } = req.body; // format "YYYY-MM"
    const newRecords: PayrollRecord[] = staffMembers.filter(s => s.isActive).map(staff => {
      const staffAttendance = attendanceLogs.filter(l => l.staffId === staff.id && l.date.startsWith(month));
      const totalHours = staffAttendance.reduce((sum, l) => sum + l.totalHours, 0);
      const otHours = staffAttendance.filter(l => l.isOT).reduce((sum, l) => sum + (l.totalHours - 8), 0);
      
      const basePay = staff.baseSalary;
      const otPay = otHours * staff.hourlyRate * 1.5;
      
      // PT Bonus: 50,000đ per session recorded
      const ptSessions = trainingSessions.filter(s => s.trainerId === staff.id && s.date.startsWith(month)).length;
      const ptBonus = ptSessions * 50000;

      // Commission: 5% of direct sales (if applicable - currently logic is simplified)
      const commission = 0; 

      const totalPay = basePay + otPay + ptBonus + commission;

      const maxId = payrollRecords.length > 0 ? Math.max(...payrollRecords.map(p => p.id)) : 0;
      return {
        id: maxId + 1,
        staffId: staff.id,
        month,
        basePay,
        commission,
        ptBonus,
        otPay,
        totalPay,
        status: "Draft"
      };
    });

    payrollRecords = [...payrollRecords, ...newRecords];
    res.status(201).json(newRecords);
  });

  // ==========================================
  // MOBILE APP API LAYER (Dành cho Hội viên)
  // ==========================================
  
  // Mobile: Đăng nhập/Kiểm tra hồ sơ bằng Số điện thoại
  app.get("/api/mobile/profile/:phone", (req, res) => {
    const { phone } = req.params;
    const member = members.find(m => m.phone === phone && !m.deletedAt);
    if (!member) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ hội viên với số điện thoại này." });
    }
    res.json({
      id: member.id,
      fullName: member.fullName,
      package: member.package,
      expiryDate: member.expiryDate,
      status: member.status,
      qrCode: `GYM_CHECKIN_${member.id}_${member.phone}`
    });
  });

  // Mobile: Xem lịch sử tập luyện cá nhân
  app.get("/api/mobile/history/:memberId", (req, res) => {
    const memberId = parseInt(req.params.memberId);
    const history = checkins
      .filter(c => c.memberId === memberId)
      .slice(0, 10); // Lấy 10 lần gần nhất cho mobile
    res.json(history);
  });

  // Mobile: Danh sách gói tập để đăng ký mới/gia hạn
  app.get("/api/mobile/packages", (req, res) => {
    res.json(packages.filter(p => p.status === "Mở bán"));
  });

  function calculateExpiryDate(startDate: string, duration: string): string {
    const date = new Date(startDate);
    const num = parseInt(duration) || 1;
    if (duration.includes("Tháng")) {
      date.setMonth(date.getMonth() + num);
    } else if (duration.includes("Năm")) {
      date.setFullYear(date.getFullYear() + num);
    } else if (duration.includes("Ngày")) {
      date.setDate(date.getDate() + num);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
  }

  // ==========================================
  // WEB ADMIN API LAYER
  // ==========================================

  // Dữ liệu điểm danh mẫu
  let checkins = [
    { id: 1, memberId: 1, memberName: "Nguyễn Văn A", time: new Date().toISOString() },
    { id: 2, memberId: 3, memberName: "Lê Văn C", time: new Date().toISOString() },
  ];

  // API Đăng nhập
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ tài khoản và mật khẩu" });
    }

    const cleanUsername = username.toString().trim().toLowerCase();
    const cleanPassword = password.toString().trim();

    console.log(`[LOGIN] Attempt: ${cleanUsername}`);
    const user = users.find(u => 
      u.username.toLowerCase() === cleanUsername && 
      u.password === cleanPassword
    );
    
    if (user) {
      console.log(`[LOGIN] Success: ${cleanUsername} (Role: ${user.role})`);
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      // Kiểm tra tài khoản Hội viên (Sử dụng username hoặc email)
      const member = members.find(m => 
        (m.username && m.username.toLowerCase() === cleanUsername) || 
        (m.email && m.email.toLowerCase() === cleanUsername)
      );
      if (member && (cleanPassword === "123456" || cleanPassword === member.password)) {
        console.log(`[LOGIN] Member Success: ${member.fullName}`);
        return res.json({
          id: member.id,
          username: member.username || member.email,
          fullName: member.fullName,
          role: "MEMBER",
          avatar: member.avatar
        });
      }

      console.log(`[LOGIN] Failed: ${cleanUsername}`);
      res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu." });
    }
  });

  app.post("/api/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Vui lòng nhập email." });

    const member = members.find(m => m.email && m.email.toLowerCase() === email.toLowerCase());
    const userAccount = users.find(u => u.username.toLowerCase() === email.toLowerCase());

    if (member || userAccount) {
      // In a real app, send an email. Here we just simulate success.
      res.json({ success: true, message: "Yêu cầu đã được ghi nhận. Nếu email tồn tại trong hệ thống, bạn sẽ sớm nhận được hướng dẫn đặt lại mật khẩu qua email." });
    } else {
      // For security, don't reveal if email exists, but here we can be a bit more helpful for the demo
      res.status(404).json({ message: "Email không tồn tại trong hệ thống." });
    }
  });

  app.post("/api/register", (req, res) => {
    const { fullName, email, phone, password } = req.body;
    
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin bắt buộc." });
    }

    const existingMember = members.find(m => m.email && m.email.toLowerCase() === email.toLowerCase());
    if (existingMember) {
      return res.status(400).json({ message: "Email này đã được đăng ký." });
    }

    const maxId = members.length > 0 ? Math.max(...members.map(m => m.id)) : 0;
    const newMember: Member = {
      id: maxId + 1,
      memberCode: `MEM${(maxId + 1).toString().padStart(4, '0')}`,
      firstName: fullName.split(' ').slice(0, -1).join(' ') || fullName,
      lastName: fullName.split(' ').slice(-1)[0] || "",
      fullName,
      username: email.split('@')[0], // Default username as email prefix
      email,
      phone: phone || "",
      dob: "",
      gender: "Khác",
      address: "",
      package: "CHƯA CÓ",
      registrationDate: new Date().toISOString().split('T')[0],
      expiryDate: "",
      status: "Chờ kích hoạt",
      revenue: 0,
      createdBy: "Tự đăng ký",
      avatar: "",
      faceData: "",
      deletedAt: null,
      password: password || "123456"
    };

    members.push(newMember);
    console.log(`[REGISTER] New Member: ${newMember.fullName} (${newMember.email})`);
    
    res.status(201).json({ success: true, message: "Đăng ký thành công! Bạn có thể bắt đầu đăng nhập ngay.", member: newMember });
  });

  app.post("/api/members/renew", (req, res) => {
    const { memberId, packageName, paymentMethod, discount, startDate } = req.body;
    const memberIndex = members.findIndex(m => m.id === memberId);
    
    if (memberIndex === -1) return res.status(404).json({ message: "Không tìm thấy hội viên" });
    
    const pkg = packages.find(p => p.name === packageName);
    const revenue = pkg ? pkg.price : 0;
    const finalAmount = revenue - (discount || 0);

    const baseDate = startDate || new Date().toISOString().split('T')[0];
    const newExpiryDate = calculateExpiryDate(baseDate, pkg ? pkg.duration : "1 Tháng");

    // Cập nhật trạng thái và gói của hội viên
    members[memberIndex] = {
      ...members[memberIndex],
      package: packageName,
      status: "Hoạt động",
      registrationDate: baseDate,
      expiryDate: newExpiryDate,
      revenue: (members[memberIndex].revenue || 0) + finalAmount
    };

    // Tạo bản ghi doanh số
    const saleId = memberSales.length > 0 ? Math.max(...memberSales.map(m => m.id)) + 1 : 1;
    memberSales.unshift({
      id: saleId,
      customerName: members[memberIndex].fullName,
      serviceName: packageName,
      dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      total: revenue,
      discount: discount || 0,
      paymentMethod: paymentMethod || "Chuyển khoản",
      paidAmount: finalAmount,
      status: "Hoàn thành",
      startDate: baseDate,
      expiryDate: newExpiryDate
    });

    // Tạo bản ghi giao dịch
    const transId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    transactions.unshift({
      id: transId,
      type: "INCOME",
      amount: finalAmount,
      category: "Gia hạn gói tập",
      note: `Gia hạn: ${members[memberIndex].fullName} - ${packageName}`,
      date: baseDate,
      createdBy: req.body.createdBy || 'Hệ thống',
      customerName: members[memberIndex].fullName
    });

    res.json({ success: true, member: members[memberIndex] });
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role, fullName } = req.body;
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ message: "Tài khoản đã tồn tại" });
    }
    const newUser = {
      id: users.length + 1,
      username,
      password,
      role: role || "STAFF",
      fullName
    };
    users.push(newUser);
    res.status(201).json(newUser);
  });

  app.get("/api/users/staff", (req, res) => {
    const staffList = users
      .filter(u => u.role === 'ADMIN' || u.role === 'STAFF')
      .map(u => ({ username: u.username, fullName: u.fullName, role: u.role }));
    res.json(staffList);
  });

  // API Routes
  app.get("/api/members", (req, res) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const updatedMembers = members.map(m => {
      const expiry = new Date(m.expiryDate).setHours(0, 0, 0, 0);
      return {
        ...m,
        status: m.deletedAt ? m.status : (expiry < today ? "Hết hạn" : "Hoạt động")
      };
    });
    res.json(updatedMembers.filter(m => !m.deletedAt));
  });

  app.get("/api/members/deleted", (req, res) => {
    res.json(members.filter(m => m.deletedAt));
  });

  app.post("/api/members", (req, res) => {
    const { paymentDate, createdBy, paymentMethod, discount, ...rest } = req.body;
    
    // Tìm giá của gói để tính doanh thu
    const pkg = packages.find(p => p.name === rest.package);
    const revenue = pkg ? pkg.price : 0;
    const finalAmount = revenue - (discount || 0);

    const maxId = members.length > 0 ? Math.max(...members.map(m => m.id)) : 0;
    const newMember = {
      id: maxId + 1,
      ...rest,
      registrationDate: paymentDate || new Date().toISOString().split('T')[0],
      status: "Hoạt động",
      createdBy: createdBy || 'Hệ thống',
      revenue: finalAmount,
      deletedAt: null
    };
    members.push(newMember);

    // Tạo bản ghi doanh số hội viên
    const saleId = memberSales.length > 0 ? Math.max(...memberSales.map(m => m.id)) + 1 : 1;
    memberSales.unshift({
      id: saleId,
      customerName: newMember.fullName,
      serviceName: newMember.package,
      dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      total: revenue,
      discount: discount || 0,
      paymentMethod: paymentMethod || "Chuyển khoản",
      paidAmount: finalAmount,
      status: "Hoàn thành",
      startDate: newMember.registrationDate,
      expiryDate: newMember.expiryDate
    });

    // Tạo bản ghi giao dịch
    const transId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    transactions.unshift({
      id: transId,
      type: "INCOME",
      amount: finalAmount,
      category: "Phí gói tập",
      note: `Hội viên mới: ${newMember.fullName} - ${newMember.package}`,
      date: paymentDate || new Date().toISOString().split('T')[0],
      createdBy: createdBy || 'Hệ thống',
      customerName: newMember.fullName
    });

    res.status(201).json(newMember);
  });

  app.get("/api/members/:id/history", (req, res) => {
    const memberId = parseInt(req.params.id);
    const history = checkins.filter(c => c.memberId === memberId);
    res.json(history);
  });

  app.put("/api/members/:id", (req, res) => {
    const memberId = parseInt(req.params.id);
    const index = members.findIndex(m => m.id === memberId);
    if (index !== -1) {
      const updatedMember = { ...members[index], ...req.body, id: memberId };
      members[index] = updatedMember;
      res.json(updatedMember);
    } else {
      res.status(404).json({ message: "Không tìm thấy hội viên" });
    }
  });

  app.delete("/api/members/:id", (req, res) => {
    const memberId = parseInt(req.params.id);
    console.log(`[DELETE] Request for member ID: ${memberId}`);
    const member = members.find(m => m.id === memberId);
    if (member && !member.deletedAt) {
      member.deletedAt = new Date().toISOString();
      console.log(`[DELETE] Member ${memberId} soft-deleted successfully`);
      res.json({ success: true, message: "Xóa hội viên thành công" });
    } else {
      console.log(`[DELETE] Member ${memberId} not found or already deleted`);
      res.status(404).json({ success: false, message: "Không tìm thấy hội viên hoặc hội viên đã bị xóa" });
    }
  });

  app.post("/api/members/:id/restore", (req, res) => {
    const memberId = parseInt(req.params.id);
    console.log(`[RESTORE] Request for member ID: ${memberId}`);
    const member = members.find(m => m.id === memberId);
    if (member && member.deletedAt) {
      member.deletedAt = null;
      console.log(`[RESTORE] Member ${memberId} restored successfully`);
      res.json({ success: true, message: "Khôi phục hội viên thành công" });
    } else {
      console.log(`[RESTORE] Member ${memberId} not found or not deleted`);
      res.status(404).json({ success: false, message: "Không tìm thấy hội viên hoặc hội viên không bị xóa" });
    }
  });

  app.get("/api/members/:id/sales", (req, res) => {
    const memberId = parseInt(req.params.id);
    const member = members.find(m => m.id === memberId);
    if (!member) return res.status(404).json({ message: "Không tìm thấy hội viên" });
    
    console.log(`[SALES] Fetching history for ${member.fullName} (ID: ${memberId})`);
    const sales = memberSales.filter(s => 
      s.customerName && 
      member.fullName && 
      s.customerName.trim().toLowerCase() === member.fullName.trim().toLowerCase()
    );
    console.log(`[SALES] Found ${sales.length} records`);
    res.json(sales);
  });

  app.get("/api/members/:id/training", (req, res) => {
    const memberId = parseInt(req.params.id);
    const sessions = trainingSessions.filter(s => s.memberId === memberId);
    res.json(sessions);
  });

  app.get("/api/packages", (req, res) => {
    res.json(packages);
  });

  app.post("/api/packages", (req, res) => {
    const newPkg = {
      id: packages.length > 0 ? Math.max(...packages.map(p => p.id)) + 1 : 1,
      ...req.body,
      status: "Mở bán"
    };
    packages.push(newPkg);
    res.status(201).json(newPkg);
  });

  app.put("/api/packages/:id", (req, res) => {
    const pkgId = parseInt(req.params.id);
    const index = packages.findIndex(p => p.id === pkgId);
    if (index !== -1) {
      packages[index] = { ...packages[index], ...req.body, id: pkgId };
      res.json(packages[index]);
    } else {
      res.status(404).json({ message: "Không tìm thấy gói tập" });
    }
  });

  app.delete("/api/packages/:id", (req, res) => {
    const pkgId = parseInt(req.params.id);
    const index = packages.findIndex(p => p.id === pkgId);
    if (index !== -1) {
      packages.splice(index, 1);
      res.json({ success: true });
    } else {
      res.status(404).json({ message: "Không tìm thấy gói tập" });
    }
  });

  app.get("/api/checkins/today", (req, res) => {
    const today = new Date().toDateString();
    const todayCheckins = checkins.filter(c => new Date(c.time).toDateString() === today);
    res.json(todayCheckins);
  });

  app.post("/api/checkin", (req, res) => {
    const { memberId } = req.body;
    const member = members.find(m => m.id === parseInt(memberId) && !m.deletedAt);
    if (!member) {
      return res.status(404).json({ message: "Không tìm thấy hội viên hoặc hội viên đã bị xóa" });
    }
    
    // Kiểm tra thời hạn gói tập
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(member.expiryDate);
    expiry.setHours(0, 0, 0, 0);

    if (expiry < today) {
      return res.status(400).json({ message: "Gói tập đã hết hạn. Vui lòng gia hạn để tiếp tục!" });
    }
    
    // Kiểm tra nếu đã điểm danh hôm nay rồi
    const alreadyCheckedIn = checkins.some(c => c.memberId === member.id && new Date(c.time).toDateString() === today.toDateString());
    
    if (alreadyCheckedIn) {
      return res.status(400).json({ message: "Hội viên này đã điểm danh hôm nay" });
    }

    const newCheckin = {
      id: checkins.length + 1,
      memberId: member.id,
      memberName: member.fullName,
      time: new Date().toISOString()
    };
    checkins.unshift(newCheckin);
    res.status(201).json(newCheckin);
  });

  app.get("/api/stats/kpi", (req, res) => {
    const kpiData = users
      .filter(u => u.role === 'ADMIN' || u.role === 'STAFF')
      .map(user => {
        const userMembers = members.filter(m => m.createdBy === user.username && !m.deletedAt);
        const totalRevenue = userMembers.reduce((sum, m) => sum + (m.revenue || 0), 0);
        return {
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          count: userMembers.length,
          revenue: totalRevenue
        };
      });
    res.json(kpiData);
  });

  app.get("/api/stats", (req, res) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const activeMembersList = members.filter(m => !m.deletedAt).map(m => {
      const expiry = new Date(m.expiryDate).setHours(0, 0, 0, 0);
      return {
        ...m,
        status: expiry < today ? "Hết hạn" : "Hoạt động"
      };
    });
    
    const totalRevenue = activeMembersList.reduce((sum, m) => sum + (m.revenue || 0), 0);
    
    res.json({
      totalMembers: activeMembersList.length,
      activeMembers: activeMembersList.filter(m => m.status === "Hoạt động").length,
      expiredMembers: activeMembersList.filter(m => m.status === "Hết hạn").length,
      checkinsToday: checkins.filter(c => new Date(c.time).toDateString() === new Date().toDateString()).length,
      revenueThisMonth: totalRevenue,
      infrastructure: {
        apiStatus: "HEALTHY",
        mobileSync: "ACTIVE",
        lastSync: new Date().toISOString()
      }
    });
  });

  // PT ROUTES
  app.get("/api/trainers", (req, res) => {
    res.json(personalTrainers.filter(t => t.isActive));
  });

  app.post("/api/trainers", (req, res) => {
    const maxId = personalTrainers.length > 0 ? Math.max(...personalTrainers.map(t => t.id)) : 0;
    const newTrainer = { id: maxId + 1, isActive: true, ...req.body };
    personalTrainers.push(newTrainer);
    res.status(201).json(newTrainer);
  });

  app.put("/api/trainers/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = personalTrainers.findIndex(t => t.id === id);
    if (index !== -1) {
      personalTrainers[index] = { ...personalTrainers[index], ...req.body, id };
      res.json(personalTrainers[index]);
    } else {
      res.status(404).json({ message: "Không tìm thấy PT" });
    }
  });

  app.delete("/api/trainers/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const trainer = personalTrainers.find(t => t.id === id);
    if (trainer) {
      trainer.isActive = false;
      res.json({ success: true });
    } else {
      res.status(404).json({ message: "Không tìm thấy PT" });
    }
  });

  app.get("/api/pt-assignments", (req, res) => {
    res.json(ptAssignments);
  });

  app.post("/api/pt-assignments", (req, res) => {
    const maxId = ptAssignments.length > 0 ? Math.max(...ptAssignments.map(a => a.id)) : 0;
    const newAssignment = {
      id: maxId + 1,
      ...req.body,
      status: "Active"
    };
    ptAssignments.push(newAssignment);
    
    // Update member's assignedPTId
    const member = members.find(m => m.id === parseInt(req.body.memberId));
    if (member) member.assignedPTId = parseInt(req.body.trainerId);

    res.status(201).json(newAssignment);
  });

  app.delete("/api/pt-assignments/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = ptAssignments.findIndex(a => a.id === id);
    if (index !== -1) {
      const assignment = ptAssignments[index];
      ptAssignments.splice(index, 1);
      
      // Clear member's assignedPTId if this was their active assignment
      const member = members.find(m => m.id === assignment.memberId);
      if (member && member.assignedPTId === assignment.trainerId) {
        member.assignedPTId = null;
      }
      
      res.json({ success: true });
    } else {
      res.status(404).json({ message: "Không tìm thấy hợp đồng PT" });
    }
  });

  app.post("/api/training-sessions", (req, res) => {
    const { assignmentId, notes } = req.body;
    const assignment = ptAssignments.find(a => a.id === parseInt(assignmentId));
    if (!assignment) return res.status(404).json({ message: "Không tìm thấy hợp đồng PT" });
    if (assignment.sessionsLeft <= 0) return res.status(400).json({ message: "Hợp đồng đã hết buổi tập" });

    assignment.sessionsLeft -= 1;
    if (assignment.sessionsLeft === 0) assignment.status = "Completed";

    const maxId = trainingSessions.length > 0 ? Math.max(...trainingSessions.map(s => s.id)) : 0;
    const newSession = {
      id: maxId + 1,
      assignmentId: assignment.id,
      date: new Date().toISOString(),
      notes,
      memberId: assignment.memberId,
      trainerId: assignment.trainerId
    };
    trainingSessions.push(newSession);
    res.status(201).json(newSession);
  });

  app.get("/api/pt-stats", (req, res) => {
    const stats = personalTrainers.map(trainer => {
      const trainerAssignments = ptAssignments.filter(a => a.trainerId === trainer.id);
      const totalRevenue = trainerAssignments.reduce((sum, a) => sum + a.price, 0);
      const commission = totalRevenue * trainer.commissionRate;
      const sessionsTotal = trainingSessions.filter(s => s.trainerId === trainer.id).length;
      
      return {
        trainerId: trainer.id,
        fullName: trainer.fullName,
        totalRevenue,
        commission,
        sessionsTotal,
        activeClients: trainerAssignments.filter(a => a.status === "Active").length
      };
    });
    res.json(stats);
  });

  // ==========================================
  // PRODUCTS & TRANSACTIONS API
  // ==========================================

  app.get("/api/products", (req, res) => {
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
    const newProduct = { id: maxId + 1, ...req.body };
    products.push(newProduct);
    res.status(201).json(newProduct);
  });

  app.put("/api/products/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...req.body, id };
      res.json(products[index]);
    } else {
      res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
  });

  app.delete("/api/products/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products.splice(index, 1);
      res.json({ success: true });
    } else {
      res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
  });

  app.get("/api/transactions", (req, res) => {
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const maxId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) : 0;
    const newTransaction = { 
      id: maxId + 1, 
      ...req.body,
      date: req.body.date || new Date().toISOString().split('T')[0]
    };
    transactions.unshift(newTransaction);
    res.status(201).json(newTransaction);
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions.splice(index, 1);
      res.json({ success: true });
    } else {
      res.status(404).json({ message: "Không tìm thấy giao dịch" });
    }
  });

  app.post("/api/pos/checkout", (req, res) => {
    const { items, total, createdBy } = req.body;
    
    // Giảm tồn kho
    items.forEach((item: { product: Product; quantity: number }) => {
      const product = products.find(p => p.id === item.product.id);
      if (product) {
        product.stock -= item.quantity;
      }
    });

    // Tạo giao dịch thu nhập
    const maxId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) : 0;
    const newTransaction: Transaction = {
      id: maxId + 1,
      type: "INCOME",
      amount: total,
      category: "Bán lẻ",
      note: `Thanh toán đơn hàng POS (${items.length} mặt hàng)`,
      date: new Date().toISOString().split('T')[0],
      createdBy: createdBy || "staff",
      customerName: req.body.customerName || "Khách lẻ"
    };
    transactions.unshift(newTransaction);

    res.status(201).json({ success: true, transaction: newTransaction });
  });

  app.get("/api/member-sales", (req, res) => {
    res.json(memberSales);
  });

  // ==========================================
  // EVALUATIONS API
  // ==========================================

  app.get("/api/evaluations", (req, res) => {
    res.json(evaluations);
  });

  app.post("/api/evaluations", (req, res) => {
    const { memberId, rating, comment } = req.body;
    const member = members.find(m => m.id === parseInt(memberId));
    if (!member) return res.status(404).json({ message: "Không tìm thấy hội viên" });

    const maxId = evaluations.length > 0 ? Math.max(...evaluations.map(e => e.id)) : 0;
    const newEvaluation: Evaluation = {
      id: maxId + 1,
      memberId: member.id,
      memberName: member.fullName,
      rating: parseInt(rating),
      comment,
      date: new Date().toISOString().split('T')[0]
    };
    evaluations.unshift(newEvaluation);
    res.status(201).json(newEvaluation);
  });

  app.get("/api/evaluations/member/:memberId", (req, res) => {
    const memberId = parseInt(req.params.memberId);
    res.json(evaluations.filter(e => e.memberId === memberId));
  });

  // ==========================================
  // AI CHATBOT API
  // ==========================================
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "Bạn là trợ lý ảo của GymMaster Pro, một hệ thống quản lý phòng gym hiện đại. Bạn trả lời thân thiện, chuyên nghiệp bằng tiếng Việt. Hãy tư vấn về tập luyện, dinh dưỡng và giải đáp thắc mắc về các gói tập (Cơ bản: 500k/tháng, Tiêu chuẩn: 2.5tr/6tháng, Cao cấp: 4.5tr/12tháng, VIP: 12tr/12tháng). Giữ câu trả lời ngắn gọn, súc tích.",
        },
        // We could pass history if the SDK supported it directly in create, 
        // but typically we append to a conversation or use message contents.
        // For simplicity and since we are using ai.chats.create which starts fresh,
        // we could also use ai.models.generateContent with current contents + user message.
      });

      // Simple implementation: generate response based on message. 
      // If history is provided, we can concatenate it for context in generateContent or use chat session.
      // Let's use history for better context.
      
      const contents = history ? [...history, { role: "user", parts: [{ text: message }] }] : [{ role: "user", parts: [{ text: message }] }];

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction: "Bạn là trợ lý ảo của GymMaster Pro, một hệ thống quản lý phòng gym hiện đại. Bạn trả lời thân thiện, chuyên nghiệp bằng tiếng Việt. Hãy tư vấn về tập luyện, dinh dưỡng và giải đáp thắc mắc về các gói tập (Cơ bản: 500k/tháng, Tiêu chuẩn: 2.5tr/6tháng, Cao cấp: 4.5tr/12tháng, VIP: 12tr/12tháng). Sử dụng Markdown để định dạng câu trả lời, đặc biệt là sử dụng danh sách (1., 2., 3. hoặc các dấu chấm đầu dòng) và xuống dòng hợp lý để dễ đọc. Giữ câu trả lời ngắn gọn, súc tích.",
        }
      });

      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Lỗi kết nối với trí tuệ nhân tạo. Vui lòng thử lại sau." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Reset member package data
app.post("/api/members/:id/reset", (req, res) => {
  const { id } = req.params;
  const memberIndex = members.findIndex(m => m.id === parseInt(id));
  
  if (memberIndex === -1) {
    return res.status(404).json({ error: "Member not found" });
  }

  members[memberIndex] = {
    ...members[memberIndex],
    package: "CHƯA CÓ",
    status: "Chưa kích hoạt",
    expiryDate: "",
    registrationDate: ""
  };

  res.json(members[memberIndex]);
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
