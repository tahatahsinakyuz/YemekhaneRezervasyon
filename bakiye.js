// API URL Tanımı
const API_URL = window.API_URL || "http://localhost:3000";

// Kullanıcı Bilgilerini Yükleme
async function loadUserInfo() {
    const email = localStorage.getItem("email");

    if (!email) {
        alert("Yetkisiz giriş! Lütfen giriş yapın.");
        window.location.href = "kullanici-dogrulama.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/kullanici-bilgileri`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (data.success) {
            document.querySelector(".user-info").innerHTML = `
                <p><strong>Ad Soyad:</strong> ${data.kullanici.ad} ${data.kullanici.soyad}</p>
                <p><strong>Okul No:</strong> ${data.kullanici.okul_no}</p>
            `;
            document.querySelector(".balance-info").innerHTML = `
                <p><strong>Bakiye:</strong> ${parseFloat(data.kullanici.bakiye).toFixed(2)} TL</p>
            `;
        } else {
            alert("Kullanıcı bilgileri alınamadı! Lütfen tekrar giriş yapın.");
            window.location.href = "kullanici-dogrulama.html";
        }
    } catch (error) {
        console.error("Kullanıcı bilgileri yüklenirken hata:", error);
    }
}



async function uploadBalance() {
    const email = localStorage.getItem("email");
    const kartNumarasi = document.getElementById("card-number").value;
    const sonKullanmaTarihi = document.getElementById("expiry-date").value;
    const cvc = document.getElementById("cvc").value;
    const yuklenecekTutar = document.getElementById("amount").value;

    if (!email || !kartNumarasi || !sonKullanmaTarihi || !cvc || !yuklenecekTutar) {
        alert("Lütfen tüm bilgileri doldurun!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/bakiye-yukle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, kart_numarasi: kartNumarasi, son_kullanma_tarihi: sonKullanmaTarihi, cvc, yuklenecek_tutar: yuklenecekTutar }),
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);
            await loadUserBalance(); // Güncel bakiyeyi yükle
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Bakiye yükleme hatası:", error);
        alert("Sunucu hatası! Lütfen daha sonra tekrar deneyin.");
    }
}

// Bakiye Yükleme
async function handleBalanceTopUp() {
    const cardNumber = document.getElementById("card-number").value.trim();
    const expiryDate = document.getElementById("expiry-date").value.trim();
    const cvc = document.getElementById("cvc").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);
    const email = localStorage.getItem("email");

    if (!cardNumber || !expiryDate || !cvc || isNaN(amount) || !email) {
        alert("Lütfen tüm bilgileri doldurun!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/balance-top-up`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                cardNumber,
                expiryDate,
                cvc,
                amount,
            }),
        });

        const data = await response.json();

        if (data.success) {
            alert("Bakiye başarıyla yüklendi!");
            await loadUserInfo(); // Kullanıcı bilgilerini güncelle
            closeTopUpForm();
        } else {
            alert(data.message || "Bakiye yükleme başarısız oldu!");
        }
    } catch (error) {
        console.error("Bakiye yükleme hatası:", error);
        alert("Sunucu hatası! Daha sonra tekrar deneyin.");
    }
}

// Bakiye Geçmişini Yükle
async function loadBalanceHistory() {
    const email = localStorage.getItem("email");

    if (!email) {
        alert("Yetkisiz giriş! Lütfen giriş yapın.");
        window.location.href = "kullanici-dogrulama.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/balance-history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (data.success) {
            const transactionContainer = document.querySelector(".transaction-cards");
            transactionContainer.innerHTML = ""; // Önceki içeriği temizle

            const existingTransactions = new Set(); // Benzersiz işlem kontrolü

            data.history.forEach(item => {
                // İşlem türü kontrolü: Eğer işlem türü bilinmiyorsa eklenmesini engelle
                if (!item.islem_tipi || item.islem_tipi === "Bilinmiyor") {
                    console.warn("Geçersiz işlem türü atlandı:", item);
                    return;
                }

                const transactionKey = `${item.tarih}_${item.islem_tipi}_${item.tutar}`; // Benzersiz bir anahtar oluştur

                // Aynı işlem zaten varsa ekleme
                if (existingTransactions.has(transactionKey)) {
                    console.warn("Çift işlem tespit edildi, eklenmedi:", transactionKey);
                    return;
                }

                existingTransactions.add(transactionKey); // Yeni işlem ekleniyor

                const formattedDate = formatDate(item.tarih);

                const card = document.createElement("div");
                card.className = `card ${item.islem_tipi.includes("Harcama") ? "red" : "green"}`;
                card.innerHTML = `
                    <p><strong>Tarih:</strong> ${formattedDate}</p>
                    <p><strong>İşlem:</strong> ${item.islem_tipi}</p>
                    <p><strong>Tutar:</strong> ${item.tutar} TL</p>
                `;
                transactionContainer.appendChild(card);
            });
        } else {
            alert(data.message || "İşlem geçmişi bulunamadı!");
        }
    } catch (error) {
        console.error("İşlem geçmişi yüklenirken hata:", error);
        alert("Sunucu hatası! Daha sonra tekrar deneyin.");
    }
}






// Tarih Formatlama
function formatDate(tarih) {
    const date = new Date(tarih);
    if (isNaN(date.getTime())) return "Geçersiz Tarih";
    return date.toLocaleString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}




// Bakiye Yükleme Formunu Açma
function openTopUpForm() {
    document.getElementById("top-up-form").style.display = "block";
}

// Bakiye Yükleme Formunu Kapatma
function closeTopUpForm() {
    document.getElementById("top-up-form").style.display = "none";
}

// DOM Yükleme
document.addEventListener("DOMContentLoaded", async () => {
    await loadUserInfo(); // Kullanıcı bilgilerini yükle
    await loadBalanceHistory(); // Bakiye geçmişini yükle

    const topUpForm = document.getElementById("top-up-form");
    if (topUpForm) {
        topUpForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            await handleBalanceTopUp(); // Bakiye yükleme işlemi
            await loadUserInfo(); // Güncel bilgileri yükle
            await loadBalanceHistory(); // Güncel geçmişi yükle
            await loadUserData();

        });
    }
});

