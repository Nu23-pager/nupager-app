import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  runTransaction,
  onChildAdded
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBSuoBKR6R8UNIX3u5q1_3VxSJj3durM8",
  authDomain: "nu-pager.firebaseapp.com",
  databaseURL: "https://nu-pager-default-rtdb.firebaseio.com",
  projectId: "nu-pager",
  storageBucket: "nu-pager.firebasestorage.app",
  messagingSenderId: "1616905096",
  appId: "1:1616905096:web:a6e426d97612e523f1703d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let deviceId = localStorage.getItem("deviceID");

/**
 * ลงทะเบียนเครื่องครั้งแรก
 * ใช้ serial ใน Firebase เพื่อสร้าง NU-0001, NU-0002 ...
 */
async function registerDevice() {
  if (!deviceId) {
    const counterRef = ref(db, "serial");

    const result = await runTransaction(counterRef, (current) => {
      return (current || 0) + 1;
    });

    const number = result.snapshot.val();
    deviceId = "NU-" + String(number).padStart(4, "0");
    localStorage.setItem("deviceId", deviceID);
  }

  const deviceEl = document.getElementById("device");
  if (deviceEl) {
    deviceEl.innerText = "DEVICE : " + deviceId;
  }

  console.log("Device ID:", deviceId);
}

/**
 * ส่งข้อความ
 */
window.sendMessage = function () {
  const fromInput = document.getElementById("from");
  const toInput = document.getElementById("to");
  const messageInput = document.getElementById("message");

  const to = toInput ? toInput.value.trim() : "";
  const message = messageInput ? messageInput.value.trim().slice(0, 80) : "";
  const from = fromInput && fromInput.value.trim() !== "" ? fromInput.value.trim() : deviceId;

  if (!to) {
    alert("Please enter target device ID");
    return;
  }

  if (!message) {
    alert("Please enter message");
    return;
  }

  push(ref(db, "messages"), {
    from: from,
    to: to,
    message: message,
    time: Date.now()
  });

  if (messageInput) {
    messageInput.value = "";
  }

  alert("Message sent!");
};

/**
 * รับข้อความแบบ realtime
 * แสดงเฉพาะข้อความที่ส่งมาหาเครื่องนี้
 */
function startMessageListener() {
  const messagesRef = ref(db, "messages");

  onChildAdded(messagesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    if (data.to === deviceId) {
      const screen = document.getElementById("screen");
      if (!screen) return;

      const msg = document.createElement("div");
      msg.className = "msg";

      const timeText = formatTime(data.time);
      msg.innerText = `[${timeText}] ${data.from} : ${data.message}`;

      screen.appendChild(msg);
      screen.scrollTop = screen.scrollHeight;

      beep();
    }
  });
}

/**
 * จัดรูปเวลา
 */
function formatTime(timestamp) {
  if (!timestamp) return "--:--";

  const date = new Date(timestamp);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * เสียงเตือนแบบเบา ๆ
 */
function beep() {
  try {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (e) {
    console.log("Beep blocked:", e);
  }
}

/**
 * เริ่มระบบ
 */
async function initPager() {
  await registerDevice();
  startMessageListener();
}

initPager();
