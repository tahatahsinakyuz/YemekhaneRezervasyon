const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Veritabanı bağlantısı ayarları
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Sanane338070?',
    database: process.env.DB_NAME || 'yemekhane_sistemi',
    timezone: process.env.DB_TIMEZONE || '+03:00' // Varsayılan olarak Türkiye saat dilimi
};

let db; // Global bağlantı değişkeni
app.use(cors({
    origin: 'https://frontend-uygulama-linki.com', // Yalnızca bu URL'ye izin ver
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // İzin verilen HTTP yöntemleri
    credentials: true
}));

// Veritabanı bağlantısı oluşturma
async function connectToDatabase() {
    if (!db) {
        try {
            db = await mysql.createConnection(dbConfig);
            console.log('Veritabanına bağlandı.');
        } catch (error) {
            console.error('Veritabanına bağlanırken hata oluştu:', error);
            throw error; // Sunucuyu durdurmayalım, ancak hata loglansın.
        }
    }
    return db;
}
// Admin kontrol middleware
async function adminMiddleware(req, res, next) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "E-posta belirtilmedi!" });
    }

    try {
        const db = await connectToDatabase();
        const [rows] = await db.execute('SELECT rol FROM kullanicilar WHERE email = ?', [email]);

        if (rows.length > 0 && rows[0].rol === 'admin') {
            next(); // Adminse devam et
        } else {
            res.status(403).json({ success: false, message: "Bu işlem için yetkiniz yok!" });
        }
    } catch (error) {
        console.error('Admin kontrol hatası:', error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
}
// Yemek Ekleme API'si
app.post('/api/yemek-ekle', async (req, res) => {
    const {
        tarih,
        corba, corba_gramaj, corba_kalori,
        anaYemek, anaYemek_gramaj, anaYemek_kalori,
        yardimciYemek, yardimciYemek_gramaj, yardimciYemek_kalori,
        ekstra, ekstra_gramaj, ekstra_kalori
    } = req.body;

    // Eksik alan kontrolü
    if (
        !tarih ||
        !corba || !corba_gramaj || !corba_kalori ||
        !anaYemek || !anaYemek_gramaj || !anaYemek_kalori ||
        !yardimciYemek || !yardimciYemek_gramaj || !yardimciYemek_kalori ||
        !ekstra || !ekstra_gramaj || !ekstra_kalori
    ) {
        return res.status(400).json({ success: false, message: 'Eksik bilgi gönderildi!' });
    }

    try {
        const db = await connectToDatabase();
        const query = `
            INSERT INTO yemek_menusu (
                tarih, corba, corba_gramaj, corba_kalori,
                anaYemek, anaYemek_gramaj, anaYemek_kalori,
                yardimciYemek, yardimciYemek_gramaj, yardimciYemek_kalori,
                ekstra, ekstra_gramaj, ekstra_kalori
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            tarih, corba, corba_gramaj, corba_kalori,
            anaYemek, anaYemek_gramaj, anaYemek_kalori,
            yardimciYemek, yardimciYemek_gramaj, yardimciYemek_kalori,
            ekstra, ekstra_gramaj, ekstra_kalori
        ];
        const [result] = await db.execute(query, values);
        res.status(201).json({ success: true, message: "Yemek başarıyla eklendi!", id: result.insertId });
    } catch (error) {
        console.error('Yemek ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası! Lütfen tekrar deneyin.' });
    }
});


app.delete('/api/menu-sil/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Menü ID belirtilmedi!' });
    }

    try {
        const db = await connectToDatabase();
        const [result] = await db.execute('DELETE FROM yemek_menusu WHERE id = ?', [id]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ success: true, message: 'Menü başarıyla silindi!' });
        } else {
            return res.status(404).json({ success: false, message: 'Menü bulunamadı!' });
        }
    } catch (error) {
        console.error('Menü silme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});



// Son Eklenen Yemekler API'si
app.get('/api/son-eklenen-yemekler', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const [rows] = await db.execute(`
            SELECT * 
            FROM yemek_menusu
            ORDER BY tarih DESC
            LIMIT 3
        `);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Son eklenen yemekler bulunamadı." });
        }

        res.status(200).json({ success: true, sonYemekler: rows });
    } catch (error) {
        console.error("Son eklenen yemekler hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});

// Tarihler Arası Menü Listeleme API'si
app.get('/api/menuler', async (req, res) => {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
        return res.status(400).json({ success: false, message: "Başlangıç ve bitiş tarihleri belirtilmedi!" });
    }

    try {
        const db = await connectToDatabase();
        const [rows] = await db.execute(`
            SELECT * 
            FROM yemek_menusu 
            WHERE tarih BETWEEN ? AND ? 
            ORDER BY tarih ASC
        `, [start_date, end_date]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Belirtilen tarih aralığında menü bulunamadı." });
        }

        res.status(200).json({ success: true, menuler: rows });
    } catch (error) {
        console.error("Tarihler arası menü listeleme hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});

// Rezervasyon Listeleme API'si
app.get("/api/rezervasyonlar", async (req, res) => {
    const { isim, tarih, ogun } = req.query;
    let query = "SELECT * FROM rezervasyonlar WHERE 1=1";

    if (isim) query += ` AND isim_soyisim LIKE '%${isim}%'`;
    if (tarih) query += ` AND DATE(tarih) = '${tarih}'`;
    if (ogun) query += ` AND ogun = '${ogun}'`;

    try {
        const [results] = await db.execute(query);
        res.json({ success: true, rezervasyonlar: results });
    } catch (error) {
        console.error("Rezervasyon listeleme hatası:", error);
        res.status(500).json({ success: false, message: "Rezervasyonları getirirken bir hata oluştu." });
    }
});




// Rezervasyon Ekleme API'si
app.post('/api/rezervasyon-ekle', async (req, res) => {
    const { isim_soyisim, tarih, ogun, email, okul_no } = req.body;

    if (!isim_soyisim || !tarih || !ogun || !email || !okul_no) {
        return res.status(400).json({ success: false, message: 'Eksik bilgi gönderildi!' });
    }

    try {
        const db = await connectToDatabase();
        const query = `
            INSERT INTO rezervasyonlar (isim_soyisim, tarih, ogun, email, okul_no)
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.execute(query, [isim_soyisim, tarih, ogun, email, okul_no]);
        res.status(201).json({ success: true, message: 'Rezervasyon başarıyla eklendi!' });
    } catch (error) {
        console.error('Rezervasyon ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});

// Rezervasyon Silme API'si
app.delete('/api/rezervasyon-sil/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Rezervasyon ID belirtilmedi!' });
    }

    try {
        const db = await connectToDatabase();
        const [result] = await db.execute('DELETE FROM rezervasyonlar WHERE id = ?', [id]);

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true, message: 'Rezervasyon başarıyla silindi!' });
        } else {
            res.status(404).json({ success: false, message: 'Rezervasyon bulunamadı!' });
        }
    } catch (error) {
        console.error('Rezervasyon silme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});

// Kullanıcı Listeleme API'si
app.get('/api/kullanicilar', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const [users] = await db.execute('SELECT id, ad, soyad, email, rol FROM kullanicilar');
        res.json({ success: true, users });
    } catch (error) {
        console.error("Kullanıcıları listeleme hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});


// Kullanıcı Ekleme API'si
app.post('/api/kullanici-ekle', async (req, res) => {
    const { ad, soyad, email, sifre, rol } = req.body;

    if (!ad || !soyad || !email || !sifre || !rol) {
        return res.status(400).json({ success: false, message: 'Eksik bilgi gönderildi!' });
    }

    try {
        const db = await connectToDatabase();
        const query = `
            INSERT INTO kullanicilar (ad, soyad, email, sifre, rol)
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.execute(query, [ad, soyad, email, sifre, rol]);
        res.status(201).json({ success: true, message: 'Kullanıcı başarıyla eklendi!' });
    } catch (error) {
        console.error('Kullanıcı ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});


// Kullanıcı Silme API'si
app.delete('/api/kullanici-sil/:id', async (req, res) => {
    const { id } = req.params;

    // ID kontrolü
    if (!id) {
        return res.status(400).json({ success: false, message: 'Kullanıcı ID belirtilmedi!' });
    }

    try {
        const db = await connectToDatabase();
        const [result] = await db.execute('DELETE FROM kullanicilar WHERE id = ?', [id]);

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true, message: 'Kullanıcı başarıyla silindi!' });
        } else {
            res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }
    } catch (error) {
        console.error('Kullanıcı silme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});

app.post('/api/kullanici-giris', async (req, res) => {
    const { email, sifre } = req.body;

    if (!email || !sifre) {
        return res.status(400).json({ success: false, message: "E-posta ve şifre alanları zorunludur!" });
    }

    try {
        const db = await connectToDatabase();
        const query = 'SELECT * FROM kullanicilar WHERE email = ? AND sifre = ?';
        const [results] = await db.execute(query, [email, sifre]);

        if (results.length > 0) {
            const user = results[0];
            res.json({ success: true, message: "Giriş başarılı!", kullanici: user });
        } else {
            res.status(401).json({ success: false, message: "Hatalı giriş bilgileri!" });
        }
    } catch (error) {
        console.error('Kullanıcı giriş kontrolünde hata:', error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});



// Admin Giriş API'si
app.post('/api/admin-giris', async (req, res) => {
    const { email , sifre } = req.body;

    const query = 'SELECT * FROM kullanicilar WHERE email  = ? AND sifre = ? AND rol = "admin"';
    try {
        const db = await connectToDatabase();
        const [results] = await db.execute(query, [email , sifre]);

        if (results.length > 0) {
            const user = results[0];
            res.json({ success: true, role: user.rol, message: "Giriş başarılı!" });
        } else {
            res.json({ success: false, message: "Giriş bilgileri hatalı!" });
        }
        
    } catch (error) {
        console.error('Admin giriş kontrolünde hata:', error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});





// Sunucuyu başlatma
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});


/************************************************************************ */

app.post('/api/make-reservation', async (req, res) => {
    const { email, tarih, ogun, ucret } = req.body;

    if (!email || !tarih || !ogun || !ucret) {
        return res.status(400).json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    try {
        const db = await connectToDatabase();

        // Kullanıcının bilgilerini çek
        const [userRows] = await db.execute(`
            SELECT bakiye, CONCAT(ad, ' ', soyad) AS isim_soyisim, id AS okul_no 
            FROM kullanicilar 
            WHERE email = ?
        `, [email]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı!" });
        }


        const mevcutBakiye = parseFloat(userRows[0].bakiye);
        const rezervasyonUcreti = parseFloat(ucret);
        const isimSoyisim = userRows[0].isim_soyisim;
        const okulNo = userRows[0].okul_no;

        if (mevcutBakiye < rezervasyonUcreti) {
            return res.status(400).json({ success: false, message: "Yetersiz bakiye!" });
        }

        // Tarihi UTC'ye çevirmek yerine yerel zaman diliminde tut
        const formattedDate = new Date(new Date(tarih).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
        const localDate = new Date(new Date(formattedDate).getTime() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];

        const currentTime = new Date().toLocaleTimeString("tr-TR", { hour12: false }); // Rezervasyon yapılan saat

        // Rezervasyonun aynı gün içinde aynı öğün için yapılıp yapılmadığını kontrol et
        const [existingReservation] = await db.execute(`
            SELECT * FROM rezervasyonlar 
            WHERE email = ? AND tarih = ? AND ogun = ?
        `, [email, localDate, ogun]);

        if (existingReservation.length > 0) {
            return res.status(400).json({ success: false, message: "Bu tarih ve öğün için zaten rezervasyon yapılmış." });
        }

        // Rezervasyon ekle
        await db.execute(`
            INSERT INTO rezervasyonlar (email, tarih, ogun, ucret, isim_soyisim, okul_no, saat) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [email, localDate, ogun, ucret, isimSoyisim, okulNo, currentTime]);

        // Kullanıcının bakiyesini güncelle
        const yeniBakiye = mevcutBakiye - rezervasyonUcreti;
        await db.execute(`UPDATE kullanicilar SET bakiye = ? WHERE email = ?`, [yeniBakiye, email]);

        res.status(201).json({ success: true, message: "Rezervasyon başarıyla yapıldı!", bakiye: yeniBakiye });
    } catch (error) {
        console.error("Rezervasyon yapma hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});


app.post('/api/update-balance', async (req, res) => {
    const { email, yeniBakiye } = req.body;

    if (!email || yeniBakiye == null) {
        return res.status(400).json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    try {
        const db = await connectToDatabase();
        await db.execute(`UPDATE kullanicilar SET bakiye = ? WHERE email = ?`, [yeniBakiye, email]);
        res.status(200).json({ success: true, message: "Bakiye başarıyla güncellendi." });
    } catch (error) {
        console.error("Bakiye güncelleme hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});

app.post('/api/kullanici-bilgileri', async (req, res) => {
    const { email } = req.body;

    try {
        const db = await connectToDatabase();
        const [results] = await db.execute('SELECT * FROM kullanicilar WHERE email = ?', [email]);

        if (results.length > 0) {
            res.json({ success: true, kullanici: results[0] });
        } else {
            res.json({ success: false, message: "Kullanıcı bulunamadı!" });
        }
    } catch (error) {
        console.error('Kullanıcı bilgilerini alırken hata:', error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});




// Rezervasyon Durumunu ve İşlem Saatini Ekleyen Güncelleme
app.get('/api/reservations', async (req, res) => {
    const email = req.query.email;

    if (!email) {
        return res.status(400).json({ success: false, message: "Kullanıcı email bilgisi eksik!" });
    }

    try {
        const db = await connectToDatabase();
        const today = new Date().toISOString().split('T')[0];

        const [reservations] = await db.execute(`
            SELECT tarih, ogun, ucret, saat 
            FROM rezervasyonlar
            WHERE email = ?
            ORDER BY tarih DESC
        `, [email]);

        const enrichedReservations = reservations.map((reservation) => {
            const reservationDate = new Date(reservation.tarih).toISOString().split('T')[0];
            let durum = 'Bekleniyor';
            if (reservationDate < today) durum = 'Gidildi';
            else if (reservationDate === today) durum = 'Bugün';
            return { ...reservation, durum };
        });

        res.status(200).json({ success: true, reservations: enrichedReservations });
    } catch (error) {
        console.error('Rezervasyon geçmişi hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});


app.get('/api/today-date', (req, res) => {
    const today = new Date().toISOString().split('T')[0]; // ISO formatında bugünün tarihi
    res.status(200).json({ success: true, today });
});




app.get('/api/transaction-history', async (req, res) => {
    const email = req.query.email;

    if (!email) {
        return res.status(400).json({ success: false, message: "Kullanıcı email bilgisi eksik!" });
    }

    try {
        const db = await connectToDatabase();
        const [transactions] = await db.execute(
            `SELECT tarih, saat, tutar, islem_tipi 
            FROM bakiye_islemleri 
            WHERE kullanici_id = (SELECT id FROM kullanicilar WHERE email = ?) 
            ORDER BY tarih DESC, saat DESC 
            LIMIT 5`,
            [email]
        );

        if (transactions.length > 0) {
            res.status(200).json({ success: true, transactions });
        } else {
            res.status(404).json({ success: false, message: "İşlem geçmişi bulunamadı!" });
        }
    } catch (error) {
        console.error("Son işlemleri çekme hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});



app.get('/api/today-reservation', async (req, res) => {
    const email = req.query.email;
    const today = new Date().toISOString().split('T')[0];

    if (!email) {
        return res.status(400).json({ success: false, message: "Kullanıcı email bilgisi eksik!" });
    }

    try {
        const db = await connectToDatabase();
        const [rows] = await db.execute(
            `SELECT tarih, ogun, ucret, saat 
            FROM rezervasyonlar 
            WHERE email = ? AND tarih = ?`,
            [email, today]
        );

        if (rows.length > 0) {
            res.status(200).json({ success: true, reservation: rows[0] });
        } else {
            res.status(404).json({ success: false, message: "Bugün için rezervasyon bulunamadı!" });
        }
    } catch (error) {
        console.error("Bugünkü rezervasyon hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});




app.get('/api/weekly-menu', async (req, res) => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    try {
        const db = await connectToDatabase();
        const [rows] = await db.execute(`
            SELECT tarih AS date,
                   DATE_FORMAT(tarih, '%W') AS day,
                   corba AS soup,
                   anaYemek AS mainDish,
                   yardimciYemek AS sideDish,
                   ekstra AS extra
            FROM yemek_menusu
            WHERE tarih BETWEEN ? AND ?
            ORDER BY tarih ASC
        `, [todayStr, nextWeekStr]);

        res.status(200).json({ success: true, menu: rows });
    } catch (error) {
        console.error("Haftalık menü hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});



app.post('/api/make-reservation', async (req, res) => {
    const { email, tarih, ogun, ucret } = req.body;

    if (!email || !tarih || !ogun || !ucret) {
        return res.status(400).json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    try {
        const db = await connectToDatabase();

        // Kullanıcının bilgilerini çek
        const [userRows] = await db.execute(`SELECT bakiye, CONCAT(ad, ' ', soyad) AS isim_soyisim, id AS okul_no FROM kullanicilar WHERE email = ?`, [email]);
        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı!" });
        }

        const mevcutBakiye = parseFloat(userRows[0].bakiye);
        const rezervasyonUcreti = parseFloat(ucret);
        const isimSoyisim = userRows[0].isim_soyisim;
        const okulNo = userRows[0].okul_no;

        if (mevcutBakiye < rezervasyonUcreti) {
            return res.status(400).json({ success: false, message: "Yetersiz bakiye!" });
        }

        // Rezervasyon ekle
        await db.execute(`
            INSERT INTO rezervasyonlar (email, tarih, ogun, ucret, isim_soyisim, okul_no) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [email, tarih, ogun, ucret, isimSoyisim, okulNo]);

        // Kullanıcının bakiyesini güncelle
        const yeniBakiye = mevcutBakiye - rezervasyonUcreti;
        await db.execute(`UPDATE kullanicilar SET bakiye = ? WHERE email = ?`, [yeniBakiye, email]);

        res.status(201).json({ success: true, message: "Rezervasyon başarıyla yapıldı!", bakiye: yeniBakiye });
    } catch (error) {
        console.error("Rezervasyon yapma hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});

/*********************************************** */


app.post('/api/kart-ekle', async (req, res) => {
    const { kullanici_id, kart_numarasi, son_kullanma_tarihi, cvc } = req.body;

    if (!kullanici_id || !kart_numarasi || !son_kullanma_tarihi || !cvc) {
        return res.status(400).json({ success: false, message: 'Eksik bilgi!' });
    }

    try {
        const db = await connectToDatabase();
        await db.execute(`
            INSERT INTO kart_bilgileri (kullanici_id, kart_numarasi, son_kullanma_tarihi, cvc, eklenme_tarihi)
            VALUES (?, ?, ?, ?, NOW())
        `, [kullanici_id, kart_numarasi, son_kullanma_tarihi, cvc]);

        res.status(201).json({ success: true, message: 'Kart bilgisi başarıyla kaydedildi!' });
    } catch (error) {
        console.error('Kart ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});

app.post('/api/bakiye-yukle', async (req, res) => {
    const { kullanici_id, miktar } = req.body;

    if (!kullanici_id || !miktar) {
        return res.status(400).json({ success: false, message: 'Eksik bilgi!' });
    }

    try {
        const db = await connectToDatabase();
        // Kullanıcı bakiyesini güncelle
        await db.execute(`
            UPDATE kullanicilar SET bakiye = bakiye + ? WHERE id = ?
        `, [miktar, kullanici_id]);

        // İşlem geçmişine ekleme
        await db.execute(`
            INSERT INTO islem_gecmisi (kullanici_id, islem_turu, tutar, tarih)
            VALUES (?, 'Bakiye Yüklendi', ?, NOW())
        `, [kullanici_id, miktar]);

        res.status(200).json({ success: true, message: 'Bakiye başarıyla yüklendi!' });
    } catch (error) {
        console.error('Bakiye yükleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});
app.post('/api/balance-top-up', async (req, res) => {
    const { email, cardNumber, expiryDate, cvc, amount } = req.body;

    if (!email || !cardNumber || !expiryDate || !cvc || !amount) {
        return res.status(400).json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    try {
        const db = await connectToDatabase();

        // Kullanıcıyı kontrol et
        const [rows] = await db.execute(`
            SELECT id FROM kullanicilar WHERE email = ?
        `, [email]);

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: "Kullanıcı bulunamadı!" });
        }

        const kullanici_id = rows[0].id;

        // Bakiye güncelle
        await db.execute(`
            UPDATE kullanicilar SET bakiye = bakiye + ? WHERE id = ?
        `, [amount, kullanici_id]);

        // İşlem geçmişine kaydet
        await db.execute(`
            INSERT INTO bakiye_islemleri (kullanici_id, tarih, islem_tipi, tutar) VALUES (?, NOW(), ?, ?)
        `, [kullanici_id, 'Bakiye Yüklendi', amount]);

        res.status(200).json({ success: true, message: "Bakiye başarıyla yüklendi!" });
    } catch (error) {
        console.error("Bakiye yükleme hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});


app.post('/api/balance-history', async (req, res) => {
    const { email } = req.body;

    // E-posta kontrolü
    if (!email) {
        return res.status(400).json({ success: false, message: "E-posta gerekli!" });
    }

    try {
        const db = await connectToDatabase();

        // Kullanıcı geçmişini sorgula
        const [rows] = await db.execute(`
            SELECT tarih, islem_tipi, tutar 
            FROM bakiye_islemleri 
            WHERE kullanici_id = (SELECT id FROM kullanicilar WHERE email = ?)
            ORDER BY tarih DESC
        `, [email]);

        // Geçmiş boşsa 404 döndür
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "İşlem geçmişi bulunamadı!" });
        }

        // Başarı durumunda işlem geçmişini döndür
        res.status(200).json({ success: true, history: rows });
    } catch (error) {
        console.error("Bakiye geçmişi yüklenirken hata:", error);

        // Hata durumunda 500 döndür
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});


app.post('/api/rezervasyon', async (req, res) => {
    const { email, rezervasyon_tutari } = req.body;

    if (!email || !rezervasyon_tutari) {
        return res.status(400).json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    try {
        const db = await connectToDatabase();

        // Kullanıcıyı al
        const [rows] = await db.execute(`SELECT id, bakiye FROM kullanicilar WHERE email = ?`, [email]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı!" });
        }

        const kullanici_id = rows[0].id;
        const bakiye = rows[0].bakiye;

        if (bakiye < rezervasyon_tutari) {
            return res.status(400).json({ success: false, message: "Yetersiz bakiye!" });
        }

        // Bakiyeyi düşür
        await db.execute(`UPDATE kullanicilar SET bakiye = bakiye - ? WHERE id = ?`, [rezervasyon_tutari, kullanici_id]);

        // Bakiye geçmişine kayıt ekle
        await db.execute(`
            INSERT INTO bakiye_islemleri (kullanici_id, tarih, islem_tipi, tutar) 
            VALUES (?, NOW(), ?, ?)
        `, [kullanici_id, 'Rezervasyon Harcaması', -rezervasyon_tutari]);

        res.status(200).json({ success: true, message: "Rezervasyon başarıyla oluşturuldu!" });
    } catch (error) {
        console.error("Rezervasyon işlemi hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});

app.post('/api/rezervasyon', async (req, res) => {
    const { email, rezervasyon_tutari } = req.body;

    if (!email || !rezervasyon_tutari) {
        return res.status(400).json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    try {
        const db = await connectToDatabase();

        // Kullanıcıyı al
        const [rows] = await db.execute(`SELECT id, bakiye FROM kullanicilar WHERE email = ?`, [email]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı!" });
        }

        const kullanici_id = rows[0].id;
        const bakiye = rows[0].bakiye;

        if (bakiye < rezervasyon_tutari) {
            return res.status(400).json({ success: false, message: "Yetersiz bakiye!" });
        }

        // Bakiyeyi düşür
        await db.execute(`UPDATE kullanicilar SET bakiye = bakiye - ? WHERE id = ?`, [rezervasyon_tutari, kullanici_id]);

        // Bakiye geçmişine kayıt ekle
        await db.execute(`
            INSERT INTO bakiye_islemleri (kullanici_id, tarih, islem_tipi, tutar) 
            VALUES (?, NOW(), ?, ?)
        `, [kullanici_id, 'Rezervasyon Harcaması', -rezervasyon_tutari]);

        res.status(200).json({ success: true, message: "Rezervasyon başarıyla oluşturuldu!" });
    } catch (error) {
        console.error("Rezervasyon işlemi hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});

app.get('/api/gunun-menusu', async (req, res) => {
    try {
        // Yerel tarih için bugünü alıyoruz
        const today = new Date();
        const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0]; // YYYY-MM-DD formatına çevrilir

        const db = await connectToDatabase();
        const [rows] = await db.execute("SELECT * FROM yemek_menusu WHERE tarih = ?", [localDate]);

        if (rows.length > 0) {
            const menu = rows[0];

            // Tarihi yerel formatta döndür
            menu.tarih = new Date(menu.tarih).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

            res.json({ success: true, menu });
        } else {
            res.json({ success: false, message: "Bugün için menü bulunamadı." });
        }
    } catch (error) {
        console.error("Günün menüsü hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});





app.get('/api/ilerleyen-gunler', async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    try {
        const db = await connectToDatabase();
        const [rows] = await db.execute("SELECT * FROM yemek_menusu WHERE tarih > ? ORDER BY tarih ASC", [today]);

        if (rows.length > 0) {
            const menus = rows.map(row => ({
                tarih: row.tarih,
                gun: new Date(row.tarih).toLocaleDateString('tr-TR', { weekday: 'long' }),
                corba: row.corba,
                anaYemek: row.anaYemek,
                yardimciYemek: row.yardimciYemek,
                ekstra: row.ekstra
            }));
            res.json({ success: true, menu: menus });
        } else {
            res.json({ success: false, message: "İlerleyen günler için menü bulunamadı." });
        }
    } catch (error) {
        console.error("İlerleyen günler hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});

      
app.post('/api/yorum-ekle', async (req, res) => {
    const { isim, eposta, yorum } = req.body;

    if (!isim || !eposta || !yorum) {
        return res.status(400).json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    try {
        const db = await connectToDatabase();
        await db.execute(
            `INSERT INTO yorumlar (isim, eposta, yorum) VALUES (?, ?, ?)`,
            [isim, eposta, yorum]
        );
        res.status(201).json({ success: true, message: "Yorum başarıyla eklendi!" });
    } catch (error) {
        console.error("Yorum ekleme hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
});




app.get('/api/yorumlar', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const [rows] = await db.execute('SELECT * FROM yorumlar ORDER BY tarih DESC');
        res.status(200).json({ success: true, yorumlar: rows });
    } catch (error) {
        console.error('Yorumları listeleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});

// Yorum Silme API'si (Sadece adminler)
app.delete('/api/yorum-sil/:id', adminMiddleware, async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Yorum ID belirtilmedi!' });
    }

    try {
        const db = await connectToDatabase();
        const [result] = await db.execute('DELETE FROM yorumlar WHERE id = ?', [id]);

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true, message: 'Yorum başarıyla silindi!' });
        } else {
            res.status(404).json({ success: false, message: 'Yorum bulunamadı!' });
        }
    } catch (error) {
        console.error('Yorum silme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});




