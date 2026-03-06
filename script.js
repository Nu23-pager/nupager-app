import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  runTransaction,
  onChildAdded,
  get
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

const deviceEl = document.getElementById("device");
const screenEl = document.getElementById("screen");
const toEl = document.getElementById("to");
const fromEl = document.getElementById("from");
const messageEl = document.getElementById("message");

let deviceId = localStorage.getItem("deviceID") || "";
let inbox = [];

function setDeviceText(text) {
  if (deviceEl) deviceEl.innerText = text;
}

function addLine(text, className = "msg") {
  if (!screenEl) return;
  const line = document.createElement("div");
  line.className = className;
  line.innerText = text;
  screenEl.appendChild(line);
  screenEl.scrollTop = screenEl.scrollHeight;
}

function clearScreen() {
  if (screenEl) screenEl.innerHTML = "";
}
window.clearScreen = clearScreen;

function formatTime(timestamp) {
  if (!timestamp) return "--:--";
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function beep() {
  try {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    audio.volume = 0.45;
    audio.play().catch(() => {});
  } catch (e) {
    console.log("beep blocked", e);
  }
}

function buttonClickSound() {
  try {
    const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
    audio.volume = 0.2;
    audio.play().catch(() => {});
  } catch (e) {
    console.log("click blocked", e);
  }
}

document.querySelectorAll(".key, button").forEach((el) => {
  el.addEventListener("click", () => {
    buttonClickSound();
  });
});

function randomLocalId() {
  return "NU-" + String(Math.floor(1000 + Math.random() * 9000)).padStart(4, "0");
}

async function registerDevice() {
  try {
    if (deviceId) {
      setDeviceText("DEVICE : " + deviceId);
      addLine("Ready.");
      return;
    }

    const counterRef = ref(db, "serial");
    const result = await runTransaction(counterRef, (current) => {
      return (current || 0) + 1;
    });

    let number = null;

    if (result && result.snapshot) {
      number = result.snapshot.val();
    }

    if (!number) {
      deviceId = randomLocalId();
    } else {
      deviceId = "NU-" + String(number).padStart(4, "0");
    }

    localStorage.setItem("deviceID", deviceId);
    setDeviceText("DEVICE : " + deviceId);
    addLine("Ready.");
  } catch (error) {
    console.error("registerDevice error:", error);
    deviceId = randomLocalId();
    localStorage.setItem("deviceID", deviceId);
    setDeviceText("DEVICE : " + deviceId);
    addLine("Offline register fallback.");
  }
}

window.sendMessage = async function () {
  const to = toEl ? toEl.value.trim() : "";
  const message = messageEl ? messageEl.value.trim().slice(0, 80) : "";
  const from = fromEl && fromEl.value.trim() !== "" ? fromEl.value.trim() : deviceId;

  if (!deviceId) {
    alert("Device not ready");
    return;
  }

  if (!to) {
    alert("Please enter target device ID");
    return;
  }

  if (!message) {
    alert("Please enter message");
    return;
  }

  try {
    await push(ref(db, "messages"), {
      from,
      to,
      message,
      time: Date.now()
    });

    if (messageEl) messageEl.value = "";
    addLine(`[${formatTime(Date.now())}] TO ${to} : ${message}`);
  } catch (error) {
    console.error("send error:", error);
    alert("Send failed");
  }
};

function startMessageListener() {
  const messagesRef = ref(db, "messages");

  onChildAdded(messagesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    if (!deviceId) return;

    if (data.to === deviceId) {
      inbox.push(data);

      addLine(`[${formatTime(data.time)}] ${data.from} : ${data.message}`);
      beep();
    }
  });
}

window.readInbox = function () {
  clearScreen();

  if (inbox.length === 0) {
    addLine("No messages.");
    return;
  }

  inbox.forEach((m) => {
    addLine(`[${formatTime(m.time)}] ${m.from} : ${m.message}`);
  });
};

async function loadOldInbox() {
  try {
    const snapshot = await get(ref(db, "messages"));
    if (!snapshot.exists()) return;

    const temp = [];
    snapshot.forEach((child) => {
      const m = child.val();
      if (m && m.to === deviceId) {
        temp.push(m);
      }
    });

    temp.sort((a, b) => (a.time || 0) - (b.time || 0));
    inbox = temp;
  } catch (error) {
    console.error("loadOldInbox error:", error);
  }
}

async function initPager() {
  await registerDevice();
  await loadOldInbox();
  startMessageListener();
}

initPager();
