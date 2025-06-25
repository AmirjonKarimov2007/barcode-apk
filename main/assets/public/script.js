Telegram.WebApp.ready();
Telegram.WebApp.expand();

let resultDiv = document.getElementById("result");
let restartBtn = document.getElementById("restart-btn");
let scanned = false;
let currentCamera = null;
let html5QrCode = null;

// Navigation
const scanPage = document.getElementById("scanner-page");
const profilePage = document.getElementById("profile-page");
const navScan = document.getElementById("nav-scan");
const navProfile = document.getElementById("nav-profile");

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove("active"));
  document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove("active"));

  if (pageId === "scanner-page") {
    scanPage.classList.add("active");
    navScan.classList.add("active");
    if (!scanned) startScanner();
  } else if (pageId === "profile-page") {
    profilePage.classList.add("active");
    navProfile.classList.add("active");
    loadTelegramUser();
    if (html5QrCode) html5QrCode.stop().catch(() => {});
  }
}

navScan.addEventListener("click", () => showPage("scanner-page"));
navProfile.addEventListener("click", () => showPage("profile-page"));

function loadTelegramUser() {
  const user = Telegram.WebApp.initDataUnsafe?.user;
  const infoDiv = document.getElementById("tg-user-info");

  if (!user) {
    infoDiv.innerHTML = "❌ Foydalanuvchi ma'lumotlari topilmadi";
    return;
  }

  infoDiv.innerHTML = `
    <p><strong>ID:</strong> ${user.id}</p>
    <p><strong>Ism:</strong> ${user.first_name} ${user.last_name || ""}</p>
    <p><strong>Username:</strong> @${user.username || "yo'q"}</p>
    <img src="${user.photo_url}" alt="Avatar" width="100" style="margin-top: 10px; border-radius: 50%;" />
  `;
}

function startScanner() {
  resultDiv.innerHTML = `📤 Barcode yoki QR kodni ko‘rsating.`;
  restartBtn.classList.add("hidden");
  scanned = false;

  // Telegram WebView cheklovi
  if (
    (Telegram.WebApp.platform === "android" || Telegram.WebApp.platform === "ios") &&
    window.navigator.userAgent.includes("Telegram")
  ) {
    resultDiv.innerHTML = `
      📵 <strong>Telegram ilovasida kamera ishlamasligi mumkin</strong>.<br>
      <br>
      Iltimos, <b>brauzerda oching</b> yoki Telegram sozlamalaridan kamera ruxsatini tekshiring.
    `;
    return;
  }

  const readerWrapper = document.getElementById("reader-wrapper");
  readerWrapper.innerHTML = `<div id="reader"></div>`;
  html5QrCode = new Html5Qrcode("reader");

  Html5Qrcode.getCameras().then(cameras => {
    if (cameras.length === 0) {
      resultDiv.textContent = "❌ Kamera topilmadi!";
      return;
    }

    currentCamera = cameras.find(c => c.label.toLowerCase().includes("back")) || cameras[0];

    html5QrCode.start(
      currentCamera.id,
      {
        fps: 30,
        qrbox: { width: 300, height: 200 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        disableFlip: true
      },
      barcode => {
        if (scanned) return;
        scanned = true;

        resultDiv.innerHTML = `✅ Topildi: <strong>${barcode}</strong>`;
        restartBtn.classList.remove("hidden");

        html5QrCode.stop().then(() => {
          // Kamera oynasini DOMdan tozalash
          document.getElementById("reader-wrapper").innerHTML = "";
        }).catch(err => console.error("Stop xatolik:", err));
      },
      error => console.warn("📛 Xatolik:", error)
    ).catch(err => {
      resultDiv.textContent = "❌ Kamera ishga tushmadi: " + err;
    });
  }).catch(err => {
    resultDiv.textContent = "❌ Kamera aniqlanmadi: " + err;
  });
}

// 🔄 Qayta skanerlash
restartBtn.addEventListener("click", async () => {
  try {
    scanned = false;
    startScanner();
  } catch (err) {
    console.error("Restart xatolik:", err);
    resultDiv.textContent = "❌ Qayta skanerlashda xatolik: " + err;
  }
});

// 📦 Dastlab skaner sahifasi ochiladi
showPage("scanner-page");
