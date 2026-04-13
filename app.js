const authCard = document.getElementById("authCard");
const authTitle = document.getElementById("authTitle");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const showLoginBtn = document.getElementById("showLoginBtn");
const showSignupBtn = document.getElementById("showSignupBtn");
const logoutBtn = document.getElementById("logoutBtn");
const appSection = document.getElementById("appSection");

const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const productsWrap = document.getElementById("products");

const upiForm = document.getElementById("upiForm");
const upiStatus = document.getElementById("upiStatus");

const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

const billForm = document.getElementById("billForm");

const USERS_KEY = "shepark_users";
const SESSION_KEY = "shepark_current_user";
const CHAT_KEY = "shepark_seller_chat";
const UPI_KEY = "shepark_upi";

let authMode = "login";

const products = [
  { name: "Floral Kurti", price: 799 },
  { name: "Silk Saree", price: 2499 },
  { name: "Denim Jacket", price: 1799 },
  { name: "Party Gown", price: 3299 },
  { name: "Kids Ethnic Set", price: 1299 },
  { name: "Handbag", price: 999 },
];

const channel = new BroadcastChannel("shepark-room");
channel.onmessage = (event) => {
  if (event.data?.type === "chat") {
    renderChat();
  }
};

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  return localStorage.getItem(SESSION_KEY);
}

function setSession(email) {
  localStorage.setItem(SESSION_KEY, email);
}

function renderProducts(filter = "") {
  const q = filter.toLowerCase();
  const filtered = products.filter((p) => p.name.toLowerCase().includes(q));
  productsWrap.innerHTML = filtered
    .map(
      (p) => `
      <article class="product">
        <strong>${p.name}</strong>
        <p>₹${p.price}</p>
      </article>
    `
    )
    .join("");
}

function getChat() {
  return JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");
}

function saveChat(rows) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(rows));
}

function renderChat() {
  const rows = getChat();
  chatMessages.innerHTML = rows
    .map(
      (m) => `<div class="msg"><small>${m.user} • ${m.time}</small><br/>${m.text}</div>`
    )
    .join("");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showApp(isLoggedIn) {
  appSection.classList.toggle("hidden", !isLoggedIn);
  authCard.classList.toggle("hidden", isLoggedIn);
  logoutBtn.classList.toggle("hidden", !isLoggedIn);
  showLoginBtn.classList.toggle("hidden", isLoggedIn);
  showSignupBtn.classList.toggle("hidden", isLoggedIn);

  if (isLoggedIn) {
    renderProducts();
    renderChat();
    const upi = JSON.parse(localStorage.getItem(UPI_KEY) || "{}");
    if (upi?.id) {
      upiStatus.textContent = `Connected: ${upi.id} (${upi.app})`;
      document.getElementById("upiId").value = upi.id;
      document.getElementById("upiApp").value = upi.app;
    }
  }
}

function setMode(mode) {
  authMode = mode;
  authTitle.textContent = mode === "login" ? "Login" : "Sign Up";
}

showLoginBtn.addEventListener("click", () => setMode("login"));
showSignupBtn.addEventListener("click", () => setMode("signup"));

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  showApp(false);
});

authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = authEmail.value.trim().toLowerCase();
  const password = authPassword.value;
  const users = getUsers();

  if (authMode === "signup") {
    if (users.find((u) => u.email === email)) {
      alert("Account already exists. Please login.");
      return;
    }
    users.push({ email, password });
    saveUsers(users);
    setSession(email);
    showApp(true);
    authForm.reset();
    return;
  }

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    alert("Invalid login credentials.");
    return;
  }
  setSession(email);
  showApp(true);
  authForm.reset();
});

searchInput.addEventListener("input", (e) => renderProducts(e.target.value));
clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  renderProducts();
});

upiForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("upiId").value.trim();
  const app = document.getElementById("upiApp").value;
  localStorage.setItem(UPI_KEY, JSON.stringify({ id, app }));
  upiStatus.textContent = `Connected: ${id} (${app})`;
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  const user = getSession() || "guest";
  const rows = getChat();
  rows.push({
    user,
    text,
    time: new Date().toLocaleTimeString(),
  });
  saveChat(rows);
  renderChat();
  channel.postMessage({ type: "chat" });
  chatInput.value = "";
});

billForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const customer = document.getElementById("customerName").value.trim();
  const item = document.getElementById("itemName").value.trim();
  const qty = Number(document.getElementById("qty").value);
  const price = Number(document.getElementById("price").value);
  const total = qty * price;

  doc.setFontSize(18);
  doc.text("ShePark Boutique Invoice", 20, 20);

  doc.setFontSize(12);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 35);
  doc.text(`Customer: ${customer}`, 20, 45);
  doc.text(`Item: ${item}`, 20, 55);
  doc.text(`Quantity: ${qty}`, 20, 65);
  doc.text(`Price: ₹${price}`, 20, 75);
  doc.text(`Total: ₹${total}`, 20, 90);
  doc.text("Thank you for shopping with ShePark!", 20, 110);

  doc.save(`invoice-${customer || "customer"}.pdf`);
});

showApp(Boolean(getSession()));
