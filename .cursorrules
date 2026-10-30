# Stockify Project Development Guidelines & Rules

## 1. Execution & Autonomy
- **End-to-End Autonomy**: Eksekusi task secara mandiri dari pembuatan file, konfigurasi, build, hingga testing tanpa berhenti di tengah jalan untuk konfirmasi hal-hal teknis yang sudah jelas.
- **Fail-Fast & Auto-Fix**: Jika terjadi error saat build atau test, analisa root cause secara langsung dan perbaiki tanpa menunggu instruksi tambahan.
- **Minimal User Interruption**: Hanya tanyakan konfirmasi kepada user jika ada keputusan desain arsitektur besar yang membutuhkan persetujuan bisnis.

## 2. Token & File Reading Optimization (Anti-Looping)
- **NO Repeated Whole-Project Reads**: DILARANG membaca ulang seluruh file proyek (full scan/looping) secara berulang jika struktur atau kontennya sudah diketahui.
- **Targeted Lookups Only**: Hanya baca line range spesifik atau file yang benar-benar akan dimodifikasi.
- **Concise Reporting**: Jangan mengulang print isi kode utuh yang panjang dalam respon chat. Tampilkan hanya ringkasan poin perubahan, status test, dan tautan file (`file://...`).

## 3. Technology Standards
- **Backend**: ASP.NET Core 10 Web API, Entity Framework Core, PostgreSQL, JWT Authentication.
- **Frontend Web**: React 19, Vite, Tailwind CSS v4, Axios.
- **Machine Learning**: Python 3.11+, PyTorch (Time-Series Forecasting LSTM/Transformer), FastAPI.
- **Mobile**: React Native (Expo).
- **Desktop**: .NET MAUI / Modern WPF.
- **DevOps**: Docker Compose, multi-stage Dockerfile, isolated internal networks.

