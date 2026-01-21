// Import ฟังก์ชันจาก Firebase v9
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue, get, update, push, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
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

// ✅ เริ่มต้น Firebase แบบ v9
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ✅ ดึงข้อมูลการจองแบบ real-time
const bookingRef = ref(database, "bookings");
onValue(bookingRef, (snapshot) => {
  const data = snapshot.val();
  console.log("📦 ข้อมูลใหม่จาก Firebase:", data);

  latestData = data;
  renderTable(data);
  showStats(data);
});

// ✅ แสดงข้อมูลในตาราง
function renderTable(data) {
  const tbody = document.querySelector("#bookingTable tbody");
  tbody.innerHTML = "";

   if (!data) return; // ✅ ป้องกันกรณีไม่มีข้อมูล

   const sorted = Object.entries(data).sort(([, a], [, b]) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateB - dateA;
  });
  for (const [id, booking] of sorted) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${booking.name}</td>
      <td>${booking.date}</td>
      <td>${booking.startTime} - ${booking.endTime}</td>
      <td>${booking.room}</td>
      <td>${booking.note}</td>
      <td>
        <button onclick="editBooking('${id}')">แก้ไข</button>
        <button onclick="deleteBooking('${id}')">ลบ</button>
      </td>
    `;
  const detailCell = document.createElement("td");
 const toggleBtn = document.createElement("button");
 toggleBtn.textContent = "ดูเพิ่มเติม";
 toggleBtn.addEventListener("click", () => {
  row.classList.toggle("expanded");
  toggleBtn.textContent = row.classList.contains("expanded") ? "ย่อข้อมูล" : "ดูเพิ่มเติม";
});
detailCell.appendChild(toggleBtn);
row.appendChild(detailCell);

    tbody.appendChild(row);
  }
}

// ✅ ลบข้อมูล
window.deleteBooking = function(id) {
  const bookingRef = ref(database, "bookings/" + id);
  remove(bookingRef)
    .then(() => showToast("🗑️ ลบข้อมูลเรียบร้อย"))
    .catch((err) => {
      console.error("ลบไม่สำเร็จ:", err);
      showToast("❌ ลบข้อมูลไม่สำเร็จ", true);
    });
};

// ✅ แก้ไขข้อมูล
window.editBooking = function(id) {
  const newName = prompt("ชื่อใหม่:");
  if (newName) {
    const bookingRef = ref(database, "bookings/" + id);
    update(bookingRef, { name: newName })
      .then(() => showToast("✏️ แก้ไขชื่อเรียบร้อย"))
      .catch((err) => {
        console.error("แก้ไขไม่สำเร็จ:", err);
        showToast("❌ แก้ไขไม่สำเร็จ", true);
      });
  }
};

// ✅ แสดงสถิติและกราฟ
function showStats(data) {
  const total = Object.keys(data).length;
  const rooms = {};
  for (const id in data) {
    const room = data[id].room;
    rooms[room] = (rooms[room] || 0) + 1;
  }

  document.getElementById("totalCount").textContent = total;
  document.getElementById("roomA").textContent = rooms.A || 0;
  document.getElementById("roomB").textContent = rooms.B || 0;

  renderRoomChart(rooms);
}

// ✅ สร้างกราฟ Pie Chart
let roomChartInstance;

function renderRoomChart(roomCounts) {
  const ctx = document.getElementById("roomChart")?.getContext("2d");
  if (!ctx) return;

  // ✅ ทำลายกราฟเดิมก่อนสร้างใหม่
  if (roomChartInstance) {
    roomChartInstance.destroy();
  }

  roomChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["ห้อง A", "ห้อง B"],
      datasets: [{
        data: [roomCounts.A || 0, roomCounts.B || 0],
        backgroundColor: ["#1900ffff", "#fb0000ff"]
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

// ✅ Toast แจ้งเตือน
function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.style.backgroundColor = isError ? "#e53935" : "#4CAF50";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ✅ Logout
function logout() {
  window.location.href = "password.html";
}
window.logout = logout;

// ✅ เพิ่มข้อมูลใหม่
document.getElementById("addForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const date = document.getElementById("date").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const room = document.getElementById("room").value;
  const note = document.getElementById('note').value;

  if (!name || !date || !startTime || !endTime || !room || !note) {
    showToast("⚠️ กรุณากรอกข้อมูลให้ครบ", true);
    return;
  }

  const bookingRef = ref(database, "bookings");
  push(bookingRef, { name, date, startTime, endTime, room, note })
    .then(() => {
      showToast("✅ เพิ่มข้อมูลเรียบร้อย");
      document.getElementById("addForm").reset();
    })
    .catch((err) => {
      console.error("เพิ่มข้อมูลไม่สำเร็จ:", err);
      showToast("❌ เพิ่มข้อมูลไม่สำเร็จ", true);
    });
});

const toggleBtn = document.getElementById("toggleBookingBtn");
const bookingWrapper = document.getElementById("bookingWrapper");

//คำสั่งค้นหาข้อมูล
document.getElementById("searchInput").addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  const rows = document.querySelectorAll("#bookingTable tbody tr");

  rows.forEach(row => {
    const nameCell = row.querySelector("td:nth-child(1)").textContent.toLowerCase();
    const dateCell = row.querySelector("td:nth-child(2)").textContent.toLowerCase();

    const match = nameCell.includes(keyword) || dateCell.includes(keyword);
    row.style.display = match ? "" : "none";
  });
});

document.getElementById("timeRange").addEventListener("change", updateBookingChart);

async function updateBookingChart() {
  const range = document.getElementById("timeRange").value;
  const bookingRef = ref(database, "bookings");
  const snapshot = await get(bookingRef);
  const data = snapshot.val();

  const counts = {};

  for (const id in data) {
    const booking = data[id];
    const date = new Date(booking.date);

    let key;
    if (range === "daily") {
      key = booking.date; // YYYY-MM-DD
    } else if (range === "monthly") {
      key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`; // YYYY-MM
    } else if (range === "yearly") {
      key = `${date.getFullYear()}`; // YYYY
    }

    counts[key] = (counts[key] || 0) + 1;
  }

  renderBookingChart(counts, range);
}

let bookingChartInstance;

function renderBookingChart(counts, range) {
  const ctx = document.getElementById("bookingChart").getContext("2d");

  const labels = Object.keys(counts).sort();
  const values = labels.map(label => counts[label]);

  // กราฟใหม่
  if (bookingChartInstance) {
    bookingChartInstance.destroy(); 
  }
  
  bookingChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: `จำนวนการจองห้องประชุม (${range})`,
        data: values,
        backgroundColor: "#00c621ff"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "จำนวนการจองตามช่วงเวลา"
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: range === "daily" ? "วันที่" : range === "monthly" ? "เดือน" : "ปี"
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "จำนวนการจอง"
          }
        }
      }
    }
  });
}

updateBookingChart(); // โหลดกราฟครั้งแรก

// ✅ ฟังก์ชัน Export ข้อมูลจากตารางไป Excel
window.exportToExcel = function () {
  const table = document.getElementById("bookingTable");
  if (!table) {
    showToast("❌ ไม่พบตารางข้อมูล", true);
    return;
  }

  const workbook = XLSX.utils.table_to_book(table, { sheet: "Bookings" });
  XLSX.writeFile(workbook, "booking-data.xlsx");
};

// ✅ เชื่อมปุ่มกับฟังก์ชัน

document.getElementById("exportBtn").addEventListener("click", exportToExcel);

toggleBtn.addEventListener("click", () => {
  const isVisible = window.getComputedStyle(bookingWrapper).display !== "none";
  bookingWrapper.style.display = isVisible ? "none" : "block";
  toggleBtn.textContent = isVisible ? "📂 แสดงข้อมูลการจอง" : "📂 ซ่อนข้อมูลการจอง";

  if (!isVisible && latestData) {
    renderTable(latestData);
    showStats(latestData);
  }
});

let latestData = null;

// ดึงข้อมูลจาก path bookings ที่มี field date ตรงกับวันที่ปัจจุบัน
function fetchBookingsForToday(date) {
  const bookingsRef = ref(db, 'bookings');
  return get(bookingsRef).then(snapshot => {
    const bookings = [];
    snapshot.forEach(child => {
      const data = child.val();
      if (data.date === date) {
        bookings.push({
          id: child.key,
          name: data.name,
          room: data.room,
          startTime: data.startTime,
          endTime: data.endTime,
          note: data.note,
          notified_120: data.notified_120 || false,
          notified_60: data.notified_60 || false
        });
      }
    });
    return bookings;
  });
}

if (Notification.permission !== 'granted') {
  Notification.requestPermission();
}

setInterval(() => {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // yyyy-mm-dd
  const currentTimeInMin = now.getHours() * 60 + now.getMinutes();

  // ดึงข้อมูลการจองจากฐานข้อมูล (ตัวอย่างแบบ array)
  fetchBookingsForToday(currentDate).then(bookings => {
    bookings.forEach(booking => {
      const [startHour, startMin] = booking.startTime.split(':').map(Number);
      const startTimeInMin = startHour * 60 + startMin;
      const diff = startTimeInMin - currentTimeInMin;

      if ((diff === 120 || diff === 60) && !booking[`notified_${diff}`]) {
        showNotification(booking, diff);
        markAsNotified(booking.id, diff);
      }
    });
  });
}, 60000); // ✅ เช็กทุก 1 นาที

function showNotification(booking, diff) {
  const title = `📢 แจ้งเตือนล่วงหน้า ${diff / 60} ชั่วโมง`;
  const body = `คุณ ${booking.name} คุณมีประชุมห้อง ${booking.room} เวลา ${booking.startTime} - ${booking.endTime}\nเรื่อง: ${booking.note || 'ไม่ระบุ'}`;
  new Notification(title, { body });
}

function markAsNotified(bookingId, diff) {
  const field = diff === 120 ? 'notified_120' : 'notified_60';
  const bookingRef = ref(database, `bookings/${bookingId}`);
  update(bookingRef, { [field]: true });
}