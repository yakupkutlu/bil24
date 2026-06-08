-- ================================================================
-- BİLETAL - Örnek Kullanıcı Seed Verisi
-- Tüm kullanıcıların şifresi: Asd123
-- Hashes: bcrypt 10 rounds ($2b$)
-- ================================================================

-- Önceki seed verisini temizle (isteğe bağlı)
-- DELETE FROM users WHERE email IN ('admin@ebilet24.com', 'operator@ebilet24.com', 'musteri@ebilet24.com');

psql -U bilet_user -d bilet_db
--Açılan psql ekranına database/schema.sql içeriğini yapıştır, çalıştır.

INSERT INTO users (email, password_hash, full_name, phone, role, is_active) VALUES
  (
    'admin@ebilet24.com',
    '$2b$10$Mg6sKQTxuBNsvVFtkG2TNeMW7HGsRX/lDGwwvtPa8SQcUvzTAxwF6',
    'Sistem Yöneticisi',
    '05001234567',
    'super_admin',
    true
  ),
  (
    'operator@ebilet24.com',
    '$2b$10$PG89jVW/qxnjgM1nKTQAxeeCIdygktcrZHWKiPRy7ZrEwGDiEHN7O',
    'Bilet Operatörü',
    '05001234568',
    'operator',
    true
  ),
  (
    'musteri@ebilet24.com',
    '$2b$10$7h1NXAnEXixklm2U9skYmu2oOOm4/S0rVxuefVN2HV4jM9XlVOIkq',
    'Test Müşteri',
    '05001234569',
    'customer',
    true
  );

-- Doğrulama
SELECT id, email, full_name, role, is_active, created_at FROM users;
