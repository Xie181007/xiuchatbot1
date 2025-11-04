# Xiuchatbot Landing Page v2

> Landing page modern dan responsive untuk Xiuchatbot — AI asisten pintar berbasis Gemini API yang membantu menjawab pertanyaan sehari-hari.

---

## Ringkasan Proyek

Xiuchatbot adalah halaman landing interaktif yang menampilkan demo chat berbasis Gemini API. Versi ini (v2) fokus pada desain "minimalis gen z futuristik", responsivitas penuh, dan pengalaman pengguna yang halus dengan efek pengetikan (typewriter) untuk menampilkan jawaban AI secara mandiri.

Fitur inti:
- Hero modern dengan efek typewriter.
- Section fitur (grid) yang responsif.
- Demo chat UI dengan glassmorphism dan efek mengetik balasan AI (char-by-char).
- Peringatan anti-spam sederhana dan tampilan timestamp per pesan.
- Struktur file sederhana: HTML, CSS, dan JavaScript (frontend).

---

## Teknologi

- HTML5
- CSS3 (Flexbox, Grid, Media Queries)
- JavaScript (vanilla) — Typewriter, IntersectionObserver
- Gemini API (client-side demo, sebaiknya menggunakan backend pada production)

```
## Cara Pakai (User Flow)

- Buka halaman landing.
- Scroll ke bagian "Coba Xiuchatbot Sekarang".
- Ketik pertanyaan pada input lalu tekan `Enter` atau klik tombol "Kirim".
- Pesan user akan muncul segera dengan timestamp.
- Balasan AI akan muncul dengan efek mengetik (character-by-character) dan timestamp setelah selesai.
- Jika Anda mengirim pesan terlalu cepat (lebih cepat dari cooldown), sebuah peringatan singkat akan muncul di bawah input (anti-spam client-side).
