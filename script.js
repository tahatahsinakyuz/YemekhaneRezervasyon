if (!window.API_URL) {
    window.API_URL = "http://localhost:3000";
}

// Sayfa Yönlendirme
function navigateTo(page) {
    if (!page) {
        console.error("Hedef sayfa tanımlı değil.");
        return;
    }
    window.location.href = page;
}
window.navigateTo = navigateTo; // Global hale getirildi

// Token Kontrolü (Oturum Devam Ediyor mu?)
function checkSession() {
    return localStorage.getItem("sessionToken");
}

// Oturum Temizleme
function clearSession() {
    localStorage.removeItem("sessionToken");
}
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded olayı tetiklendi."); // DOMContentLoaded olayını kontrol et

    const yetkiliButton = document.getElementById("yetkiliButton");
    if (yetkiliButton) {
        console.log("yetkiliButton bulundu:", yetkiliButton); // Eleman bulunursa kontrol
        yetkiliButton.addEventListener("click", () => {
            console.log("Yetkili işlemleri tıklandı!");
            window.location.href = "admin-giris.html";
        });
    } else {
        console.warn("yetkiliButton elementi DOM yüklendiğinde bulunamadı.");
    }
});




// Çıkış Yapma
function logout() {
    clearSession();
    alert("Oturumunuz sonlandırıldı.");
    navigateTo("anasayfa.html");
}

// Fonksiyonların global erişilebilirliği için
window.logout = logout;



async function kullaniciDogrulama(redirectPage) {
    // Giriş formundaki email ve şifre alanlarını alıyoruz
    const email = document.getElementById("email").value.trim();
    const sifre = document.getElementById("sifre").value.trim();
    const errorMessage = document.getElementById("error-message");

    // Alanlar boşsa hata mesajı göster
    if (!email || !sifre) {
        errorMessage.style.display = "block";
        errorMessage.innerText = "Lütfen tüm alanları doldurun!";
        return;
    }

    try {
        // API'ye POST isteği gönderiyoruz
        const response = await fetch(`${API_URL}/api/kullanici-giris`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, sifre }),
        });

        // Sunucunun yanıtı başarılı değilse hata fırlat
        if (!response.ok) {
            throw new Error(`HTTP Hatası: ${response.status}`);
        }

        // API'den dönen JSON veriyi al
        const data = await response.json();

        if (data.success) {
            // Giriş başarılı ise email ve şifreyi kaydet
            localStorage.setItem("email", email);
            localStorage.setItem("sifre", sifre);

            // Başarı mesajını göster ve yönlendir
            alert(data.message || "Giriş Başarılı! Yönlendiriliyorsunuz...");
            window.location.href = redirectPage;
        } else {
            // Giriş başarısızsa hata mesajını göster
            errorMessage.style.display = "block";
            errorMessage.innerText = data.message || "Giriş bilgileri hatalı!";
        }
    } catch (error) {
        // Hata durumunda hata mesajını konsola yazdır ve kullanıcıya bildir
        console.error("Kullanıcı giriş hatası:", error.message);
        errorMessage.style.display = "block";
        errorMessage.innerText = "Sunucu hatası! Daha sonra tekrar deneyin.";
    }
}






//**************************************************************************** */
// Admin Paneli için JavaScript (admin.js)

// Dinamik İçerik Yükleme

document.querySelectorAll('.menu-item').forEach((item) => {
    item.addEventListener('click', (e) => {
        const section = e.currentTarget.getAttribute('data-section');
        loadDynamicContent(section);
    });
});
document.querySelectorAll(".kategori ul li").forEach((yemek) => {
    yemek.addEventListener("click", () => {
        const yemekAdi = yemek.textContent;
        const kategori = yemek.closest(".kategori").querySelector("h4").textContent;

        const kategoriId = {
            "Çorbalar": "corba",
            "Ana Yemekler": "anaYemek",
            "Yardımcı Yemekler": "yardimciYemek",
            "Ekstralar": "ekstra" // Güncellendi
        }[kategori];

        if (kategoriId) {
            document.getElementById(kategoriId).value = yemekAdi;
        }
    });
});


function loadDynamicContent(section) {
    document.querySelectorAll('.dynamic-section').forEach(sec => sec.classList.add('hidden'));
    const targetSection = document.getElementById(section);
    if (targetSection) targetSection.classList.remove('hidden');
}
function yeniYemekEkleKategorilere(yemek) {
    const kategoriler = {
        corba: document.querySelector(".kategori ul:nth-child(1)"),
        anaYemek: document.querySelector(".kategori ul:nth-child(2)"),
        yardimciYemek: document.querySelector(".kategori ul:nth-child(3)"),
        ekstra: document.querySelector(".kategori ul:nth-child(4)"), // "icecek" yerine "ekstra" olarak güncellendi
    };

    // Her kategori için yemek bilgilerini ekle
    Object.entries(kategoriler).forEach(([kategori, ul]) => {
        if (ul && yemek[kategori]) {
            const yeniItem = document.createElement("li");
            yeniItem.textContent = yemek[kategori];

            // Yemek seçiminde gramaj ve kalori bilgisi de eklensin
            yeniItem.addEventListener("click", () => {
                kategoriYemekSec(kategori, yemek); // İlgili kategori için formu doldur
            });

            // Kategoriye yeni öğeyi ekle
            ul.appendChild(yeniItem);
        } else if (!ul) {
            console.warn(`Kategori için HTML öğesi bulunamadı: ${kategori}`);
        } else if (!yemek[kategori]) {
            console.warn(`Yemek için bilgi eksik: ${kategori}`);
        }
    });
}



function validateForm(data) {
    const requiredFields = ['tarih', 'corba', 'anaYemek', 'yardimciYemek', 'ekstra'];
    for (const field of requiredFields) {
        if (!data[field]) return false; // Eksik alan varsa false döner
    }
    return true;
}





// Yeni Yemekleri Kategorilere Ekleme Fonksiyonu
function yeniYemekEkleKategorilere(yemek) {
    const kategoriler = {
        corba: document.querySelector(".kategori ul:nth-child(1)"),
        anaYemek: document.querySelector(".kategori ul:nth-child(2)"),
        yardimciYemek: document.querySelector(".kategori ul:nth-child(3)"),
        ekstra: document.querySelector(".kategori ul:nth-child(4)"),
    };

    // Çorba Kategorisine Ekle
    const yeniCorba = document.createElement("li");
    yeniCorba.textContent = yemek.corba;
    yeniCorba.addEventListener("click", () => kategoriYemekSec("corba", yemek));
    kategoriler.corba.appendChild(yeniCorba);

    // Ana Yemek Kategorisine Ekle
    const yeniAnaYemek = document.createElement("li");
    yeniAnaYemek.textContent = yemek.anaYemek;
    yeniAnaYemek.addEventListener("click", () => kategoriYemekSec("anaYemek", yemek));
    kategoriler.anaYemek.appendChild(yeniAnaYemek);

    // Yardımcı Yemek Kategorisine Ekle
    const yeniYardimciYemek = document.createElement("li");
    yeniYardimciYemek.textContent = yemek.yardimciYemek;
    yeniYardimciYemek.addEventListener("click", () => kategoriYemekSec("yardimciYemek", yemek));
    kategoriler.yardimciYemek.appendChild(yeniYardimciYemek);

    // Ekstra Kategorisine Ekle
    const yeniEkstra = document.createElement("li");
    yeniEkstra.textContent = yemek.ekstra;
    yeniEkstra.addEventListener("click", () => kategoriYemekSec("ekstra", yemek));
    kategoriler.ekstra.appendChild(yeniEkstra);
}



// Yemek Seçimlerine Tıklama İşlemi
document.querySelectorAll(".kategori ul li").forEach((yemek) => {
    yemek.addEventListener("click", () => {
        const yemekAdi = yemek.textContent;
        const kategori = yemek.closest(".kategori").querySelector("h4").textContent;

        const kategoriId = {
            "Çorbalar": "corbalar",
            "Ana Yemekler": "anaYemekler",
            "Yardımcı Yemekler": "yardimciYemekler",
            "Ekstralar": "ekstralar",
        }[kategori];

        if (kategoriId) {
            randomMenulerOlustur(kategoriId, yemekAdi);
        }
    });
});






// Yemek Seçimlerine Tıklama İşlemi
document.querySelectorAll(".kategori ul li").forEach((yemek) => {
    yemek.addEventListener("click", () => {
        const yemekAdi = yemek.textContent;
        const kategori = yemek.closest(".kategori").querySelector("h4").textContent;

        const kategoriId = {
            "Çorbalar": "corba",
            "Ana Yemekler": "anaYemek",
            "Yardımcı Yemekler": "yardimciYemek",
            "Ekstralar": "ekstra",
        }[kategori];

        if (kategoriId) {
            randomMenulerOlustur(kategoriId, yemekAdi);
        }
    });
});










document.getElementById("yemekEkleForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // Sayfa yenilemesini engeller

    const yemekVerileri = {
        tarih: document.getElementById("tarih").value || null,
        corba: document.getElementById("corba").value || null,
        corba_gramaj: document.getElementById("corbaPorsiyon").value || null,
        corba_kalori: document.getElementById("corbaKalori").value || null,
        anaYemek: document.getElementById("anaYemek").value || null,
        anaYemek_gramaj: document.getElementById("anaYemekPorsiyon").value || null,
        anaYemek_kalori: document.getElementById("anaYemekKalori").value || null,
        yardimciYemek: document.getElementById("yardimciYemek").value || null,
        yardimciYemek_gramaj: document.getElementById("yardimciYemekPorsiyon").value || null,
        yardimciYemek_kalori: document.getElementById("yardimciYemekKalori").value || null,
        ekstra: document.getElementById("ekstra").value || null,
        ekstra_gramaj: document.getElementById("ekstraPorsiyon").value || null,
        ekstra_kalori: document.getElementById("ekstraKalori").value || null,
    };
    

    try {
        const response = await fetch(`${API_URL}/api/yemek-ekle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(yemekVerileri),
        });

        const data = await response.json();

        if (data.success) {
            alert("Yemek başarıyla eklendi!");
            listeleSonEklenenYemekler(); // Listeyi güncelle
            yeniYemekEkleKategorilere(yemekVerileri); // Kategorilere ekle
            document.getElementById("yemekEkleForm").reset(); // Formu temizle
        } else {
            alert(data.message || "Yemek eklenemedi.");
        }
    } catch (error) {
        console.error("Yemek ekleme hatası:", error);
        alert("Bir hata oluştu!");
    }
});

function initializeDatePicker(selector) {
    flatpickr(selector, {
        locale: "tr",
        dateFormat: "Y-m-d",
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initializeDatePicker("#tarih");
    initializeDatePicker("#menuTarih");
});


// Eklenen Yemekleri Güncelleme
function eklenenYemekleriGuncelle(yemek) {
    const yemekListesi = document.getElementById("eklenenYemekListesi");
    
    // Listeyi tamamen temizlemeden sadece yeni yemek ekle
    const listItem = document.createElement("li");
    listItem.innerHTML = `
        <div><strong>Eklenme Tarihi:</strong> ${formatDate(yemek.eklenmeTarihi)} ${formatTime(yemek.eklenmeTarihi)}</div>
        <div><strong>Hedef Tarih:</strong> ${yemek.tarih}</div>
        <div><strong>Çorba:</strong> ${yemek.corba}</div>
        <div><strong>Ana Yemek:</strong> ${yemek.anaYemek}</div>
        <div><strong>Yardımcı Yemek:</strong> ${yemek.yardimciYemek}</div>
        <div><strong>Ekstra:</strong> ${yemek.ekstra}</div>
    `;

    yemekListesi.prepend(listItem);

    // Son 3 yemek sınırı
    while (yemekListesi.childNodes.length > 3) {
        yemekListesi.removeChild(yemekListesi.lastChild);
    }
}

// Kategori Seçiminde Form Otomatik Doldurma
function randomMenulerOlustur(sabitKategori, sabitDeger) {
    // Kategorilere göre yemek listelerini al
    const kategoriler = {
        corbalar: [...document.querySelectorAll(".kategori:nth-child(1) ul li")].map(item => item.textContent),
        anaYemekler: [...document.querySelectorAll(".kategori:nth-child(2) ul li")].map(item => item.textContent),
        yardimciYemekler: [...document.querySelectorAll(".kategori:nth-child(3) ul li")].map(item => item.textContent),
        ekstralar: [...document.querySelectorAll(".kategori:nth-child(4) ul li")].map(item => item.textContent),
    };

    // Sabit kategori belirle ve diğer kategorilerden rastgele yemekler seç
    const sabitMenu = {
        corba: sabitKategori === "corbalar" ? sabitDeger : kategoriler.corbalar[Math.floor(Math.random() * kategoriler.corbalar.length)],
        anaYemek: sabitKategori === "anaYemekler" ? sabitDeger : kategoriler.anaYemekler[Math.floor(Math.random() * kategoriler.anaYemekler.length)],
        yardimciYemek: sabitKategori === "yardimciYemekler" ? sabitDeger : kategoriler.yardimciYemekler[Math.floor(Math.random() * kategoriler.yardimciYemekler.length)],
        ekstra: sabitKategori === "ekstralar" ? sabitDeger : kategoriler.ekstralar[Math.floor(Math.random() * kategoriler.ekstralar.length)],
    };

    // Rastgele gramaj ve kalori değerleri
    const randomGramKalori = {
        corbaGram: Math.floor(Math.random() * 100) + 150,
        corbaKalori: Math.floor(Math.random() * 50) + 100,
        anaYemekGram: Math.floor(Math.random() * 150) + 300,
        anaYemekKalori: Math.floor(Math.random() * 100) + 250,
        yardimciYemekGram: Math.floor(Math.random() * 50) + 200,
        yardimciYemekKalori: Math.floor(Math.random() * 50) + 150,
        ekstraGram: Math.floor(Math.random() * 50) + 100,
        ekstraKalori: Math.floor(Math.random() * 50) + 100,
    };

    // Menü önerisini güncelle
    const oneriListesi = document.getElementById("oneri-listesi");
    oneriListesi.innerHTML = ""; // Önceki önerileri temizle

    const oneri = document.createElement("div");
    oneri.className = "random-menu";
    oneri.innerHTML = `
        <p><strong>Çorba:</strong> ${sabitMenu.corba} (${randomGramKalori.corbaGram}g, ${randomGramKalori.corbaKalori}kcal)</p>
        <p><strong>Ana Yemek:</strong> ${sabitMenu.anaYemek} (${randomGramKalori.anaYemekGram}g, ${randomGramKalori.anaYemekKalori}kcal)</p>
        <p><strong>Yardımcı Yemek:</strong> ${sabitMenu.yardimciYemek} (${randomGramKalori.yardimciYemekGram}g, ${randomGramKalori.yardimciYemekKalori}kcal)</p>
        <p><strong>Ekstra:</strong> ${sabitMenu.ekstra} (${randomGramKalori.ekstraGram}g, ${randomGramKalori.ekstraKalori}kcal)</p>
        <button class="menu-sec-btn">Bu Menüyü Seç</button>
    `;
    oneriListesi.appendChild(oneri);

    // Menü seçilirse formu doldur
    oneri.querySelector(".menu-sec-btn").addEventListener("click", () => {
        document.getElementById("corba").value = sabitMenu.corba;
        document.getElementById("anaYemek").value = sabitMenu.anaYemek;
        document.getElementById("yardimciYemek").value = sabitMenu.yardimciYemek;
        document.getElementById("ekstra").value = sabitMenu.ekstra;
    });
}

function formatDate(dateString) {
    if (!dateString) return "Tarih belirtilmemiş"; // Eğer tarih yoksa bu mesaj döner.
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatTime(dateString) {
    if (!dateString) return "Saat belirtilmemiş";
    const date = new Date(dateString);
    return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// Son Eklenen Yemekleri Güncelle
async function listeleSonEklenenYemekler() {
    try {
        const response = await fetch(`${API_URL}/api/son-eklenen-yemekler`);
        const data = await response.json();

        const yemekListesi = document.getElementById("eklenenYemekListesi");
        yemekListesi.innerHTML = ""; // Listeyi temizle

        if (data.success) {
            data.sonYemekler.forEach((menu) => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    <strong>Hangi Tarih İçin:</strong> ${formatDate(menu.tarih)} <br>
                    <strong>Eklenme Tarihi ve Saati:</strong> ${formatDate(menu.eklenmeTarihi)} ${formatTime(menu.eklenmeTarihi)} <br>
                    <strong>Çorba:</strong> ${menu.corba}, 
                    <strong>Ana Yemek:</strong> ${menu.anaYemek}, 
                    <strong>Yardımcı Yemek:</strong> ${menu.yardimciYemek}, 
                    <strong>Ekstra:</strong> ${menu.ekstra}
                `;
                yemekListesi.appendChild(listItem);
            });
        } else {
            yemekListesi.innerHTML = "<li>Son eklenen yemekler bulunamadı.</li>";
        }
    } catch (error) {
        console.error("Son eklenen yemekleri listeleme hatası:", error);
        const yemekListesi = document.getElementById("eklenenYemekListesi");
        yemekListesi.innerHTML = "<li>Yemekleri listeleme sırasında hata oluştu.</li>";
    }
}



// Sayfa yüklendiğinde otomatik çağır
document.addEventListener("DOMContentLoaded", () => {
    listeleSonEklenenYemekler();
});




document.getElementById("listeleBtn").addEventListener("click", async () => {
    const startDateElement = document.getElementById("startDate");
    const endDateElement = document.getElementById("endDate");

    if (!startDateElement || !endDateElement) {
        console.error("Başlangıç veya bitiş tarihi elementi bulunamadı!");
        alert("Bir hata oluştu. Lütfen sayfayı yenileyin ve tekrar deneyin.");
        return;
    }

    const startDate = startDateElement.value;
    const endDate = endDateElement.value;

    if (!startDate || !endDate) {
        alert("Lütfen başlangıç ve bitiş tarihlerini seçin!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/menuler?start_date=${startDate}&end_date=${endDate}`, {
            method: "GET",
        });

        const data = await response.json();
        const menuListesi = document.getElementById("menuListesi");
        menuListesi.innerHTML = ""; // Mevcut listeyi temizle

        if (data.success && data.menuler && data.menuler.length > 0) {
            data.menuler.forEach(menu => {
                const formattedDate = new Date(menu.tarih).toLocaleDateString("tr-TR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });

                const div = document.createElement("div");
                div.className = "menu-item";
                div.innerHTML = `
                    <p><strong>Tarih:</strong> ${formattedDate}</p>
                    <p><strong>Çorba:</strong> ${menu.corba}</p>
                    <p><strong>Ana Yemek:</strong> ${menu.anaYemek}</p>
                    <p><strong>Yardımcı Yemek:</strong> ${menu.yardimciYemek}</p>
                    <p><strong>Ekstra:</strong> ${menu.ekstra}</p>
                `;
                menuListesi.appendChild(div);
            });
        } else {
            menuListesi.innerHTML = "<p>Seçilen tarih aralığında menü bulunamadı!</p>";
        }
    } catch (error) {
        console.error("Menü listeleme hatası:", error);
        alert("Sunucu hatası! Lütfen tekrar deneyin.");
    }
});

// Dinamik Filtreleme ve Listeleme için Event Listeners
document.getElementById("filter-name").addEventListener("input", updateReservations);
document.getElementById("filter-date").addEventListener("input", updateReservations);
document.getElementById("filter-meal").addEventListener("change", updateReservations);

document.getElementById("clear-filters").addEventListener("click", () => {
    // Tüm filtreleri sıfırla
    document.getElementById("filter-name").value = "";
    document.getElementById("filter-date").value = "";
    document.getElementById("filter-meal").value = "";

    // Tüm rezervasyonları yeniden listele
    updateReservations();
});

// Rezervasyonları Güncelleme Fonksiyonu
async function updateReservations() {
    const name = document.getElementById("filter-name").value.trim();
    const date = document.getElementById("filter-date").value;
    const meal = document.getElementById("filter-meal").value;

    // API için sorgu parametrelerini hazırla
    const queryParams = new URLSearchParams();
    if (name) queryParams.append("isim", name);
    if (date) queryParams.append("tarih", date);
    if (meal) queryParams.append("ogun", meal);

    try {
        const response = await fetch(`${API_URL}/api/rezervasyonlar?${queryParams.toString()}`, {
            method: "GET",
        });

        const data = await response.json();
        const tableBody = document.querySelector("#reservation-table tbody");
        tableBody.innerHTML = ""; // Tabloyu temizle

        if (data.success && data.rezervasyonlar.length > 0) {
            // Filtrelenen rezervasyonları tabloya ekle
            data.rezervasyonlar.forEach((rezervasyon) => {
                const formattedDate = new Date(rezervasyon.tarih).toLocaleDateString("tr-TR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${rezervasyon.isim_soyisim || "-"}</td>
                    <td>${formattedDate}</td>
                    <td>${rezervasyon.ogun || "-"}</td>
                    <td>${rezervasyon.email || "-"}</td>
                    <td>${rezervasyon.okul_no || "-"}</td>
                    <td>${rezervasyon.durum || "-"}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            // Uygun rezervasyon bulunamadıysa uyarı mesajı göster
            tableBody.innerHTML = "<tr><td colspan='6'>Filtreye uygun rezervasyon bulunamadı!</td></tr>";
        }
    } catch (error) {
        console.error("Rezervasyonları listeleme hatası:", error);
        alert("Sunucu hatası! Lütfen tekrar deneyin.");
    }
}

// Dinamik PDF İndirici
document.getElementById("download-reservations").addEventListener("click", async () => {
    const name = document.getElementById("filter-name").value.trim();
    const date = document.getElementById("filter-date").value;
    const meal = document.getElementById("filter-meal").value;

    const queryParams = new URLSearchParams();
    if (name) queryParams.append("isim", name);
    if (date) queryParams.append("tarih", date);
    if (meal) queryParams.append("ogun", meal);

    try {
        const response = await fetch(`${API_URL}/api/rezervasyonlar?${queryParams.toString()}`, {
            method: "GET",
        });

        const data = await response.json();

        if (data.success && data.rezervasyonlar.length > 0) {
            // PDF Oluşturma
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Başlık
            doc.setFontSize(16);
            doc.text("Rezervasyon Yönetimi", 10, 10);
            doc.setFontSize(12);
            doc.text(`Filtre: ${name || "Tümü"} | ${date || "Tümü"} | ${meal || "Tümü"}`, 10, 20);

            // Tablo Başlıkları
            const headers = ["İsim Soyisim", "Tarih", "Öğün", "E-posta", "Okul No", "Durum"];
            const rows = data.rezervasyonlar.map((rezervasyon) => [
                rezervasyon.isim_soyisim || "-",
                new Date(rezervasyon.tarih).toLocaleDateString("tr-TR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
                rezervasyon.ogun || "-",
                rezervasyon.email || "-",
                rezervasyon.okul_no || "-",
                rezervasyon.durum || "-",
            ]);

            // Tabloyu PDF'e ekle
            doc.autoTable({
                head: [headers],
                body: rows,
                startY: 30,
                styles: { fontSize: 10 },
            });

            // PDF İndir
            doc.save("rezervasyonlar.pdf");
        } else {
            alert("Filtreye uygun rezervasyon bulunamadı!");
        }
    } catch (error) {
        console.error("PDF indirme hatası:", error);
        alert("PDF indirirken bir hata oluştu!");
    }
});

// Kullanıcı Ekleme
document.getElementById("add-user-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("user-name").value.trim();
    const email = document.getElementById("user-email").value.trim();
    const password = document.getElementById("user-password").value.trim();
    const role = document.getElementById("user-role").value;

    if (!name || !email || !password || !role) {
        alert("Lütfen tüm alanları doldurun!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/kullanici-ekle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ad: name.split(" ")[0], // İlk kelime ad
                soyad: name.split(" ")[1] || "", // İkinci kelime soyad
                email,
                sifre: password,
                rol: role,
            }),
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            loadUserList(); // Kullanıcı listesini güncelle
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Kullanıcı ekleme hatası:", error);
        alert("Sunucu hatası! Lütfen tekrar deneyin.");
    }
});

// Kullanıcı Listesini Yükleme
function loadUserList() {
    fetch(`${API_URL}/api/kullanicilar`)
        .then((response) => response.json())
        .then((data) => {
            console.log("API'den dönen veri:", data); // Gelen veriyi kontrol edin

            // API'den gelen kullanıcıları kontrol edin
            if (data.success && Array.isArray(data.users)) {
                const tableBody = document.querySelector("#user-table tbody");
                tableBody.innerHTML = ""; // Mevcut içeriği temizle

                data.users.forEach((user) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${user.ad} ${user.soyad}</td>
                        <td>${user.email}</td>
                        <td>${user.rol}</td>
                        <td>
                            <button onclick="deleteUser(${user.id})">Sil</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                console.error("Kullanıcı verisi beklenen formatta değil.");
            }
        })
        .catch((error) => {
            console.error("Kullanıcıları yükleme hatası:", error);
        });
}





// Kullanıcı Silme
async function deleteUser(userId) {
    if (!confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) return;

    try {
        const response = await fetch(`${API_URL}/api/kullanici-sil/${userId}`, {
            method: "DELETE",
        });

        const data = await response.json();

        if (data.success) {
            alert("Kullanıcı başarıyla silindi!");
            loadUserList(); // Kullanıcı listesini güncelle
        } else {
            alert(data.message || "Kullanıcı silinemedi!");
        }
    } catch (error) {
        console.error("Kullanıcı silme hatası:", error);
        alert("Bir hata oluştu! Lütfen tekrar deneyin.");
    }
}
// Sayfa yüklendiğinde kullanıcı listesini yükle
document.addEventListener("DOMContentLoaded", loadUserList);

// Menü Önerilerini Güncelleme
function menuleriGuncelle() {
    const corba = document.getElementById("corba").value.trim();
    const anaYemek = document.getElementById("anaYemek").value.trim();
    const yardimciYemek = document.getElementById("yardimciYemek").value.trim();
    const ekstra = document.getElementById("icecek").value.trim();

    const oneriListesi = document.getElementById("oneri-listesi");
    let oneriler = [];

    if (corba && anaYemek) {
        oneriler.push(`${corba}, ${anaYemek}, ${yardimciYemek || "Yok"}, ${ekstra || "Yok"}`);
    }

    oneriListesi.innerHTML = ""; // Listeyi temizle
    if (oneriler.length > 0) {
        oneriler.forEach(menu => {
            const p = document.createElement("p");
            p.textContent = menu;
            oneriListesi.appendChild(p);
        });
    } else {
        oneriListesi.innerHTML = "<p>Henüz bir menü önerisi yok.</p>";
    }
}



// Yeni Yemekleri Yemek Seçimlerine Ekleme
function yeniYemekEkleKategorilere(yemek) {
    const kategoriler = {
        corba: document.querySelector(".kategori:nth-child(1) ul"),
        anaYemek: document.querySelector(".kategori:nth-child(2) ul"),
        yardimciYemek: document.querySelector(".kategori:nth-child(3) ul"),
        ekstra: document.querySelector(".kategori:nth-child(4) ul"),
    };

    Object.keys(kategoriler).forEach((kategori) => {
        const ulElement = kategoriler[kategori];

        // Eğer kategori elemanı bulunamazsa hata önlemek için kontrol ekle
        if (!ulElement) {
            console.error(`Kategori için ul öğesi bulunamadı: ${kategori}`);
            return;
        }

        // Eğer yemek kategoride tanımlıysa yeni bir <li> ekle
        if (yemek[kategori]) {
            const yeniYemek = document.createElement("li");
            yeniYemek.textContent = yemek[kategori];
            ulElement.appendChild(yeniYemek);
        } else {
            console.warn(`Yemek için bilgi eksik: ${kategori}`);
        }
    });
}



// Sayfa yüklendiğinde rezervasyonları listele
document.addEventListener("DOMContentLoaded", () => {
    updateReservations();
});


document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll(".menu-item"); // Menüdeki öğeleri seç
    const sections = document.querySelectorAll("section"); // Tüm section elementlerini seç

    // Varsayılan olarak sadece ilk bölümü göster (Yemek Yönetimi)
    sections.forEach((section) => {
        section.style.display = "none"; // Tüm bölümleri gizle
    });

    const defaultSection = document.getElementById("yemek");
    if (defaultSection) {
        defaultSection.style.display = "block"; // Varsayılan bölümü göster
    } else {
        console.error("Varsayılan bölüm bulunamadı.");
    }

    // Menü öğelerine tıklama olayını ekle
    menuItems.forEach((item) => {
        item.addEventListener("click", (e) => {
            e.preventDefault(); // Sayfanın yenilenmesini engelle

            // Tüm bölümleri gizle
            sections.forEach((section) => {
                section.style.display = "none";
            });

            // Tıklanan menüye ait bölümü göster
            const sectionId = item.getAttribute("data-section"); // data-section değerini al
            const targetSection = document.getElementById(sectionId); // Hedef bölümü bul
            if (targetSection) {
                targetSection.style.display = "block"; // Bölümü görünür yap
            } else {
                console.error(`Bölüm bulunamadı: ${sectionId}`);
            }

            // Aktif menüyü vurgula
            menuItems.forEach((menu) => {
                menu.classList.remove("active");
            });
            item.classList.add("active");
        });
    });
});
async function silYorum(id) {
    const email = "admin@example.com"; // Oturum açan adminin e-posta adresi

    try {
        const response = await fetch(`/api/yorum-sil/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const result = await response.json();
        if (result.success) {
            alert("Yorum başarıyla silindi!");
            // Yorum listesini güncellemek için ek işlem yapabilirsiniz
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Yorum silme hatası:", error);
    }
}



// Yorum ekleme
document.getElementById('comment-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Formun sayfayı yenilemesini engelle
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const comment = document.getElementById('comment').value;

    console.log("Form Verileri:", { name, email, comment }); // Formdan gelen verileri kontrol et

    try {
        const response = await fetch('/api/yorum-ekle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isim: name, eposta: email, yorum: comment }),
        });

        const result = await response.json();
        console.log("Yorum Ekleme Sonucu:", result); // API'den dönen sonucu kontrol et

        if (result.success) {
            alert('Yorum başarıyla eklendi!');
            loadComments(); // Yorumları yeniden yükle
            document.getElementById('comment-form').reset(); // Formu sıfırla
        } else {
            console.error("Yorum ekleme başarısız:", result.message);
            alert(result.message || "Yorum eklenemedi.");
        }
    } catch (error) {
        console.error("Yorum ekleme sırasında hata:", error);
        alert("Yorum eklenirken bir hata oluştu.");
    }
});



// Yorum silme
async function silYorum(id) {
    const email = "admin@example.com"; // Adminin oturum açtığı e-posta adresi

    try {
        const response = await fetch(`/api/yorum-sil/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const result = await response.json();
        if (result.success) {
            alert('Yorum başarıyla silindi!');
            loadComments(); // Yorumları yeniden yükle
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Yorum silme hatası:', error);
    }
}
async function loadComments() {
    try {
        const response = await fetch('/api/yorumlar');
        const result = await response.json();

        const commentList = document.getElementById('comment-list');
        commentList.innerHTML = ''; // Eski yorumları temizle

        if (result.success && Array.isArray(result.yorumlar)) {
            result.yorumlar.forEach((yorum) => {
                const listItem = document.createElement('div');
                listItem.classList.add('comment-item');

                const formattedDate = new Date(yorum.tarih).toLocaleString("tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                });

                listItem.innerHTML = `
                    <p><strong>${yorum.isim}</strong> (${yorum.eposta}):</p>
                    <p>${yorum.yorum}</p>
                    <p><small>${formattedDate}</small></p>
                    <button onclick="silYorum(${yorum.id})">Sil</button>
                    <hr>
                `;

                commentList.appendChild(listItem);
            });
        } else {
            commentList.innerHTML = '<p>Henüz yorum yapılmamış.</p>';
        }
    } catch (error) {
        console.error('Yorumları yüklerken hata:', error);
        document.getElementById('comment-list').innerHTML = '<p>Yorumları yüklerken bir hata oluştu.</p>';
    }
}


const formattedDate = new Date(yorum.tarih).toLocaleString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
});


// Yorumları sayfa yüklendiğinde çek
document.addEventListener('DOMContentLoaded', () => {
    loadComments();
});





