import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
