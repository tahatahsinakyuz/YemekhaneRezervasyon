// API URL Tanımı
const API_URL = window.API_URL || "http://localhost:3000";

// Kullanıcı Bilgilerini Yükleme
async function loadUserInfo() {
    const email = localStorage.getItem("email");
    const sifre = localStorage.getItem("sifre");

    if (!email || !sifre) {
        alert("Yetkisiz giriş! Lütfen giriş yapın.");
        window.location.href = "kullanici-giris.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/kullanici-bilgileri`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            throw new Error(`Sunucudan beklenmeyen yanıt: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            // Kullanıcı bilgilerini sayfaya yerleştir
            document.querySelector(".user-info").innerHTML = `
                <p><strong>Ad Soyad:</strong> ${data.kullanici.ad} ${data.kullanici.soyad}</p>
                <p><strong>Okul No:</strong> ${data.kullanici.id}</p>
            `;
            document.querySelector(".balance-info").innerHTML = `
                <p><strong>Bakiye:</strong> ${parseFloat(data.kullanici.bakiye).toFixed(2)} TL</p>
            `;
        } else {
            alert("Kullanıcı bilgileri alınamadı! Lütfen tekrar giriş yapın.");
            localStorage.clear(); // Oturumu temizle
            window.location.href = "kullanici-giris.html";
        }
    } catch (error) {
        console.error("Kullanıcı bilgileri yüklenirken hata oluştu:", error);
        alert("Kullanıcı bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.");
    }
}




// Haftalık Menü Yükleme
async function loadWeeklyMenu() {
    try {
        const response = await fetch(`${API_URL}/api/weekly-menu`);
        const data = await response.json();

        const calendarContainer = document.querySelector(".weekly-plan .calendar");
        calendarContainer.innerHTML = ""; // Önceki içeriği temizle

        if (data.success && data.menu.length > 0) {
            data.menu.forEach(menu => {
                const day = document.createElement("div");
                day.className = "day";
                day.innerHTML = `
                    <p><strong>${formatDate(menu.date)} - ${menu.day}</strong></p>
                    <div class="menu-items">
                        <ul>
                            <li>${menu.soup}</li>
                            <li>${menu.mainDish}</li>
                            <li>${menu.sideDish}</li>
                            <li>${menu.extra}</li>
                        </ul>
                    </div>
                    <p class="meal-time">Öğle: ${menu.lunchTime}</p>
                    <p class="meal-time">Akşam: ${menu.dinnerTime}</p>
                    <button class="reserve-button" data-date="${menu.date}" data-meal="öğle">Öğle Rezervasyon Yap</button>
                    <button class="reserve-button" data-date="${menu.date}" data-meal="akşam">Akşam Rezervasyon Yap</button>
                `;
                calendarContainer.appendChild(day);
            });

            // Rezervasyon butonlarına tıklama olaylarını ekle
            document.querySelectorAll(".reserve-button").forEach(button => {
                button.addEventListener("click", async (event) => {
                    const tarih = event.target.dataset.date;
                    const ogun = event.target.dataset.meal;
                    const email = localStorage.getItem("email");

                    if (!email || !tarih || !ogun) {
                        alert("Rezervasyon için eksik bilgi!");
                        return;
                    }

                    await makeReservation(email, tarih, ogun, 25);
                });
            });
        } else {
            calendarContainer.innerHTML = "<p>Bu hafta için menü bulunmamaktadır.</p>";
        }
    } catch (error) {
        console.error("Haftalık menü alınamadı:", error);
    }
}


// Rezervasyon Yapma
async function makeReservation(email, tarih, ogun, ucret) {
    try {
        const response = await fetch(`${API_URL}/api/make-reservation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, tarih, ogun, ucret }),
        });

        const data = await response.json();

        if (data.success) {
            alert("Rezervasyon başarıyla yapıldı!");
            await loadUserInfo(); // Kullanıcı bilgilerini günceller (bakiye)
            await loadReservationHistory(); // Rezervasyon geçmişini günceller
            await loadTransactionHistory(); // İşlem geçmişini günceller
        } else {
            alert(data.message || "Rezervasyon yapılamadı.");
        }
    } catch (error) {
        console.error("Rezervasyon sırasında hata oluştu:", error);
        alert("Rezervasyon sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    }
}



// Bugünkü Rezervasyon Yükleme
async function loadTodayReservation() {
    const email = localStorage.getItem("email");
    if (!email) {
        document.querySelector(".today-reservation").innerHTML = `
            <h2>Bugün</h2>
            <p>Kullanıcı giriş bilgileri eksik.</p>
        `;
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/today-reservation?email=${email}`);
        const data = await response.json();

        const todayContainer = document.querySelector(".today-reservation");

        if (data.success) {
            todayContainer.innerHTML = `
                <h2>Bugün - ${formatDate(data.reservation.tarih)}</h2>
                <p><strong>Öğün:</strong> ${data.reservation.ogun}</p>
                <p><strong>Ücret:</strong> ${data.reservation.ucret} TL</p>
            `;
        } else {
            todayContainer.innerHTML = `
                <h2>Bugün</h2>
                <p>${data.message}</p>
            `;
        }
    } catch (error) {
        console.error("Bugünkü rezervasyon yüklenirken hata:", error);
    }
}



async function loadReservationHistory() {
    const email = localStorage.getItem("email");

    if (!email) {
        alert("Kullanıcı bilgisi eksik! Lütfen giriş yapın.");
        window.location.href = "kullanici-giris.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/reservations?email=${email}`);
        const data = await response.json();

        const historyContainer = document.querySelector(".reservation-history .reservation-cards");
        historyContainer.innerHTML = ""; // Önceki içeriği temizle

        if (data.success && data.reservations.length > 0) {
            data.reservations.forEach(reservation => {
                const card = document.createElement("div");
                const formattedDate = formatDate(reservation.tarih) || "Bilinmiyor";
                const durum = reservation.durum || "Bekleniyor";
                const ogun = reservation.ogun || "Belirtilmedi";
                const formattedTime = reservation.saat || "Bilinmiyor";

                card.className = `card ${durum === "Gidildi" ? "red" : durum === "Bugün" ? "green" : "yellow"}`;
                card.innerHTML = `
                    <p><strong>Tarih:</strong> ${formattedDate}</p>
                    <p><strong>Saat:</strong> ${formattedTime}</p>
                    <p><strong>Durum:</strong> ${durum}</p>
                    <p><strong>Öğün:</strong> ${ogun}</p>
                    <p><strong>Ücret:</strong> ${reservation.ucret || "0"} TL</p>
                `;
                historyContainer.appendChild(card);
            });
        } else {
            historyContainer.innerHTML = "<p>Rezervasyon geçmişi bulunmamaktadır.</p>";
        }
    } catch (error) {
        console.error("Rezervasyon geçmişi yüklenirken hata oluştu:", error);
    }
}





async function loadTransactionHistory() {
    const email = localStorage.getItem("email");

    if (!email) {
        document.querySelector("#transaction-list").innerHTML = `
            <tr><td colspan="4">Kullanıcı giriş bilgisi eksik!</td></tr>
        `;
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/transaction-history?email=${email}`);
        const data = await response.json();

        const transactionList = document.querySelector("#transaction-list");
        transactionList.innerHTML = ""; // Önceki içeriği temizle

        if (data.success && data.transactions.length > 0) {
            data.transactions.forEach(transaction => {
                const row = document.createElement("tr");
                const formattedDate = formatDate(transaction.tarih) || "Bilinmiyor";
                const formattedTime = transaction.saat || "Bilinmiyor";

                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${formattedTime}</td>
                    <td>${transaction.tutar} TL</td>
                    <td>${transaction.islem_tipi}</td>
                `;
                transactionList.appendChild(row);
            });
        } else {
            transactionList.innerHTML = `<tr><td colspan="4">${data.message || "İşlem geçmişi bulunmamaktadır."}</td></tr>`;
        }
    } catch (error) {
        console.error("İşlem geçmişi yüklenirken hata:", error);
    }
}




async function loadAllReservations() {
    try {
        const response = await fetch(`${API_URL}/api/reservations`);
        const data = await response.json();

        const reservationTable = document.getElementById("transaction-list");
        reservationTable.innerHTML = ""; // Tabloyu temizle

        if (data.success && data.reservations.length > 0) {
            data.reservations.forEach(reservation => {
                const row = document.createElement("tr");
                const formattedDate = formatDate(reservation.tarih) || "Bilinmiyor";
                const formattedTime = reservation.saat || "Bilinmiyor";
                const durum = reservation.durum || "Bekleniyor";

                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${formattedTime}</td>
                    <td>${reservation.ucret || "0"} TL</td>
                    <td>${durum}</td>
                `;
                reservationTable.appendChild(row);
            });
        } else {
            reservationTable.innerHTML = `<tr><td colspan="4">Henüz işlem geçmişi bulunmamaktadır.</td></tr>`;
        }
    } catch (error) {
        console.error("Rezervasyonlar yüklenirken hata oluştu:", error);
    }
}




// Tarih Formatlama Fonksiyonu
function formatDate(dateString) {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
        return "Bilinmiyor"; // Geçersiz tarih için yedek değer
    }

    const options = { year: "numeric", month: "long", day: "numeric", weekday: "long" };
    return new Date(dateString).toLocaleDateString("tr-TR", options);
}


// DOM Yükleme
document.addEventListener("DOMContentLoaded", async () => {
    await loadUserInfo(); // Kullanıcı bilgilerini yükler
    await loadWeeklyMenu(); // Haftalık menüyü yükler
    await loadTodayReservation(); // Bugünkü rezervasyonu kontrol eder
    await loadReservationHistory(); // Rezervasyon geçmişini yükler
    await loadTransactionHistory(); // Son işlem hareketlerini yükle
    await loadAllReservations(); // Tüm rezervasyonları yükle

});
