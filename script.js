import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "nu-pager.firebaseapp.com",
  databaseURL: "https://nu-pager-default-rtdb.firebaseio.com",
  projectId: "nu-pager",
  storageBucket: "nu-pager.firebasestorage.app",
  messagingSenderId: "1616905096",
  appId: "1:1616905096:web:a6e426d97612e523f1703d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let deviceId = localStorage.getItem("deviceId");

async function registerDevice() {

  if (!deviceId) {

    const counterRef = ref(db, "deviceCounter");

    const result = await runTransaction(counterRef, (current) => {
      return (current || 0) + 1;
    });

    const number = result.snapshot.val();

    deviceId = "NU-" + String(number).padStart(4, "0");

    localStorage.setItem("deviceId", deviceId);
  }

  console.log("Device ID:", deviceId);
}

registerDevice();


window.sendMessage = function() {

  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;
  const message = document.getElementById("message").value;

  push(ref(db, "messages"), {
    from: from,
    to: to,
    message: message,
    time: Date.now()
  });

  alert("Message sent!");

}
