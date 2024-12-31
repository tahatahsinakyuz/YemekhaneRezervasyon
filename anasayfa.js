const API_URL = "http://localhost:3000/api"; // Backend URL'si

// Günün Menüsü Verisini Çek ve Göster
async function loadTodayMenu() {
    try {
        const response = await fetch("http://localhost:3000/api/gunun-menusu");
        const data = await response.json();

        console.log(data); // Veri kontrolü

        if (data.success && data.menu) {
            const gununMenusu = document.getElementById("gunun-menusu");
            gununMenusu.innerHTML = ""; // Mevcut içeriği temizle

            const { corba, anaYemek, yardimciYemek, ekstra, corba_gramaj, corba_kalori, anaYemek_gramaj, anaYemek_kalori, yardimciYemek_gramaj, yardimciYemek_kalori, ekstra_gramaj, ekstra_kalori } = data.menu;

            // 2x2 Grid ve dinamik resimler
            const gridHTML = `
                <div class="menu-item">
                    <img src="images/corba.png" alt="Çorba Resmi">
                    <p>${corba}</p>
                    <p>${corba_gramaj}g - ${corba_kalori} kcal</p>
                </div>
                <div class="menu-item">
                    <img src="images/ana-yemek.png" alt="Ana Yemek Resmi">
                    <p>${anaYemek}</p>
                    <p>${anaYemek_gramaj}g - ${anaYemek_kalori} kcal</p>
                </div>
                <div class="menu-item">
                    <img src="images/yardimci-yemek.png" alt="Yardımcı Yemek Resmi">
                    <p>${yardimciYemek}</p>
                    <p>${yardimciYemek_gramaj}g - ${yardimciYemek_kalori} kcal</p>
                </div>
                <div class="menu-item">
                    <img src="images/ekstra.png" alt="Ekstra Resmi">
                    <p>${ekstra}</p>
                    <p>${ekstra_gramaj}g - ${ekstra_kalori} kcal</p>
                </div>
            `;

            gununMenusu.innerHTML = gridHTML;
        } else {
            document.getElementById("gunun-menusu").innerHTML = "<p>Günün menüsü bulunamadı.</p>";
        }
    } catch (error) {
        console.error("Günün menüsü yüklenirken hata:", error);
        document.getElementById("gunun-menusu").innerHTML = "<p>Menü yüklenirken bir hata oluştu.</p>";
    }
}


// İlerleyen Günler Verisini Çek ve Göster
async function loadUpcomingMenus() {
    try {
        const response = await fetch("http://localhost:3000/api/ilerleyen-gunler");
        const data = await response.json();

        if (data.success && Array.isArray(data.menu)) {
            const ilerleyenGunler = document.getElementById("ilerleyen-gunler");
            ilerleyenGunler.innerHTML = ""; // Mevcut içeriği temizle

            data.menu.forEach((menu) => {
                const tarih = new Date(menu.tarih);
                const gun = tarih.toLocaleDateString("tr-TR", { weekday: "long" }); // Günü al

                const dayCard = document.createElement("div");
                dayCard.className = "day-card";

                // Kart içeriği
                dayCard.innerHTML = `
                    <h3>${menu.tarih.split("T")[0]} (${gun})</h3>
                    <p><strong></strong> ${menu.corba}</p>
                    <p><strong></strong> ${menu.anaYemek}</p>
                    <p><strong></strong> ${menu.yardimciYemek}</p>
                    <p><strong></strong> ${menu.ekstra}</p>
                `;
                ilerleyenGunler.appendChild(dayCard);
            });
        } else {
            document.getElementById("ilerleyen-gunler").innerHTML = "<p>İlerleyen günler için menü bulunamadı.</p>";
        }
    } catch (error) {
        console.error("İlerleyen günler yüklenirken hata:", error);
        document.getElementById("ilerleyen-gunler").innerHTML = "<p>Menü yüklenirken bir hata oluştu.</p>";
    }
}




// Sayfa yüklendiğinde menüleri yükle
document.addEventListener("DOMContentLoaded", () => {
    // Günün Menüsü ve İlerleyen Günler Yükleniyor
    loadTodayMenu();
    loadUpcomingMenus();

    // Yetkili İşlemleri Butonu için Tıklama Olayı
    const yetkiliButton = document.getElementById("yetkiliButton");
    if (yetkiliButton) {
        yetkiliButton.addEventListener("click", () => {
            navigateTo("admin-giris.html"); // Admin giriş sayfasına yönlendirme
        });
    } else {
        console.error("Yetkili işlemleri butonu bulunamadı!");
    }
});

function navigateTo(url) {
    window.location.href = url; // Belirtilen URL'ye yönlendirir
}
