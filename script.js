const API_KEY = 'ef66e4fffbmshc4ad32b653ea502p1c9116jsnef1759373801';
const API_HOST = 'tempmail-api-free.p.rapidapi.com';
const BASE_URL = `https://${API_HOST}/api/v3/email`;

let currentEmail = "";
let readMessages = []; 
let unreadMessages = [];

// Fungsi Ganti Tab
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    el.classList.add('active');
}

// 1. Generate Email Baru (Endpoint v3/email/new)
async function generateEmail() {
    try {
        document.getElementById('email-text').innerText = "Generating...";
        const response = await fetch(`${BASE_URL}/new`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': API_HOST
            }
        });
        const data = await response.json();
        
        // Sesuaikan dengan response body API v3 (biasanya data.email atau data[0])
        currentEmail = data.email || data[0]; 
        document.getElementById('email-text').innerText = currentEmail;
        
        // Reset list saat ganti email
        unreadMessages = [];
        renderUpdates();
    } catch (err) {
        document.getElementById('email-text').innerText = "Error API Key!";
        console.error("Gagal generate email:", err);
    }
}

// 2. Cek Pesan Masuk (Endpoint v3/email/messages)
async function checkMessages() {
    if (!currentEmail) return;
    try {
        const response = await fetch(`${BASE_URL}/messages/${currentEmail}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': API_HOST
            }
        });
        const messages = await response.json();

        if (Array.isArray(messages) && messages.length > 0) {
            // Filter hanya pesan yang belum ada di daftar 'readMessages'
            unreadMessages = messages.filter(m => !readMessages.find(rm => rm.id === m.id));
            renderUpdates();
            
            // Trigger suara jika ada pesan benar-benar baru
            if (unreadMessages.length > 0) {
                playNotifSound();
            }
        }
    } catch (e) {
        console.log("Menunggu pesan...");
    }
}

// 3. Render ke Tab Updates
function renderUpdates() {
    const container = document.getElementById('unread-messages-list');
    if (unreadMessages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <p>Belum ada pesan baru.</p>
            </div>`;
        return;
    }

    container.innerHTML = "";
    unreadMessages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'email-box-card';
        div.style.textAlign = 'left';
        div.style.cursor = 'pointer';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between">
                <strong>${msg.from}</strong>
                <span style="color:var(--accent-blue); font-size:10px">BARU</span>
            </div>
            <div style="font-size:13px; margin-top:5px">${msg.subject}</div>
        `;
        div.onclick = () => openEmail(msg);
        container.appendChild(div);
    });
}

// 4. Buka & Pindahkan ke Inbox (Riwayat)
function openEmail(msg) {
    if (!readMessages.find(m => m.id === msg.id)) {
        readMessages.push(msg);
        unreadMessages = unreadMessages.filter(m => m.id !== msg.id);
        renderUpdates();
        renderInbox();
    }
    
    // Tampilkan Detail (Bisa pakai Modal atau Alert)
    document.getElementById('view-subject').innerText = msg.subject;
    document.getElementById('view-from').innerText = `Dari: ${msg.from}`;
    document.getElementById('view-body').innerHTML = msg.body || msg.content || "Tidak ada isi pesan.";
    document.getElementById('mail-modal').style.display = 'block';
}

function renderInbox() {
    const container = document.getElementById('read-messages-list');
    const emptyState = document.querySelector('#inbox .empty-state');
    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = "";
    readMessages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'email-box-card';
        div.style.opacity = '0.8';
        div.innerHTML = `<strong>${msg.from}</strong><br><small>${msg.subject}</small>`;
        container.appendChild(div);
    });
}

function playNotifSound() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play();
}

function copyEmail() {
    const text = document.getElementById('email-text').innerText;
    navigator.clipboard.writeText(text);
    alert("Email berhasil disalin!");
}

function closeModal() {
    document.getElementById('mail-modal').style.display = 'none';
}

// Jalankan sistem
generateEmail();
setInterval(checkMessages, 5000); // Cek setiap 5 detik
