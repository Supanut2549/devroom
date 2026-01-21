// 🔗 เชื่อมต่อ Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase, ref, push, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

// ✅ ตั้งค่า Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBc6qS-KMaSX7zrz3LMQScmTRDYTSZrPzw",
  authDomain: "booking-system-bfce6.firebaseapp.com",
  projectId: "booking-system-bfce6",
  storageBucket: "booking-system-bfce6.firebasestorage.app",
  messagingSenderId: "353156769824",
  appId: "1:353156769824:web:b8870157a9cedf0279f445",
  databaseURL: "https://booking-system-bfce6-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ✅ ฟังก์ชันแสดง Toast แจ้งเตือน
function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.style.backgroundColor = isError ? "#e53935" : "#4CAF50"; // สีแดงหรือเขียว
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 5000);
}
window.showToast = showToast;

// ✅ ฟังก์ชันแปลงวันที่เป็น "วัน/เดือน/ปี"
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  const gregorianYear = parseInt(year) - 543;
  return `${day}/${month}/${gregorianYear}`;
}

// ✅ ฟังก์ชันแสดงกราฟสัดส่วนการใช้ห้อง
async function fetchRoomStats() {
  const bookingRef = ref(database, "bookings");
  const snapshot = await get(bookingRef);
  const data = snapshot.val();

  const roomCounts = { A: 0, B: 0 };

  for (const id in data) {
    const booking = data[id];
    if (booking.room === "A") roomCounts.A++;
    if (booking.room === "B") roomCounts.B++;
  }

  renderRoomChart(roomCounts);
}

function renderRoomChart(roomCounts) {
  const ctx = document.getElementById("roomChart").getContext("2d");

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["ห้อง A", "ห้อง B"],
      datasets: [{
        data: [roomCounts.A, roomCounts.B],
        backgroundColor: ["#42a5f5", "#66bb6a"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "สัดส่วนการใช้ห้องประชุม"
        },
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

// ✅ เรียกใช้เมื่อโหลดหน้าแดชบอร์ด
fetchRoomStats();
async function fetchBookingData() {
  const bookingRef = ref(database, "bookings");
  const snapshot = await get(bookingRef);
  const data = snapshot.val();

  renderTable(data); // ✅ แสดงข้อมูลในตาราง
}

fetchRoomStats();
fetchBookingData(); // ✅ โหลดข้อมูลการจอง

// ✅ ตรวจสอบและส่งข้อมูลการจอง
document.getElementById("bookingForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const date = document.getElementById("date").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const room = document.getElementById("room").value;
  const key = `${date}_${room}`; // ใช้สำหรับตรวจสอบเวลาซ้ำ
  const note = document.getElementById('note').value;

  if (!name || !date || !startTime || !endTime || !room || !note) {
    showToast("⚠️ กรุณากรอกข้อมูลให้ครบ", true);
    return;
  }

  const bookingRef = ref(database, "bookings");
  const checkQuery = query(bookingRef, orderByChild("key"), equalTo(key));
  const snapshot = await get(checkQuery);

  let conflict = false;

  if (snapshot.exists()) {
    const data = snapshot.val();
    for (const id in data) {
      const booking = data[id];;
      const bookedStart = booking.startTime;
      const bookedEnd = booking.endTime;

      // ✅ ตรวจสอบช่วงเวลาซ้ำ
      if (startTime < bookedEnd && endTime > bookedStart) {
        conflict = true;
        break;
      }
    }
  }

  if (conflict) {
  showToast("❌ ช่วงเวลานี้ถูกจองแล้ว!", true);
} else {
  push(bookingRef, { name, date, startTime, endTime, room, key , note }).then(() => {
    showToast("✅ จองสำเร็จ!", false);
    document.getElementById("bookingForm").reset();
    showTodayBookings(); // ✅ รีเฟรชรายการด้านขวา
  });
}
});

//เปลี่ยนวันที่
function renderTable(data) {
  const tbody = document.querySelector("#bookingTable tbody");
  tbody.innerHTML = "";

  for (const id in data) {
    const booking = data[id];
    const formattedDate = formatDate(booking.date); // ✅ แปลงวันที่

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${booking.name}</td>
      <td>${formattedDate}</td>
      <td>${booking.startTime} - ${booking.endTime}</td>
      <td>${booking.room}</td>
      <td>${booking.note || '-'}</td>
      <td>
        <button onclick="editBooking('${id}')">แก้ไข</button>
        <button onclick="deleteBooking('${id}')">ลบ</button>
      </td>
    `;
    tbody.appendChild(row);
  }
}

async function showTodayBookings() {
  const today = new Date();
  const yyyyCE = today.getFullYear(); // ค.ศ.
  const yyyyBE = yyyyCE + 543;        // พ.ศ.
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  const todayCE = `${yyyyCE}-${mm}-${dd}`;
  const todayBE = `${yyyyBE}-${mm}-${dd}`;

  const bookingRef = ref(database, "bookings");
  const snapshot = await get(bookingRef);
  const data = snapshot.val();

  const container = document.getElementById("todayBookings");
  container.innerHTML = "";

  let found = false;

  for (const id in data) {
    const booking = data[id];
    if (booking.date === todayCE || booking.date === todayBE) {
      found = true;
      const card = document.createElement("div");
      card.className = `booking-card room-${booking.room.toLowerCase()}`;
      card.innerHTML = `
        <strong>${booking.name}</strong> (${booking.room})<br>
        📅 วันที่: ${formatDate(booking.date)}<br>
        🕒 ${booking.startTime} - ${booking.endTime}<br>
        📝 ${booking.note || "-"}
      `;
      container.appendChild(card);
    }
  }

  if (!found) {
    container.innerHTML = "<p>📭 ยังไม่มีการจองห้องในวันนี้</p>";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  showTodayBookings();
});
