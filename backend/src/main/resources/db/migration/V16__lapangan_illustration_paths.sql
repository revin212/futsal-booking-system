-- Ilustrasi lapangan (path ke asset statis frontend public/, dilayani sebagai /images/...)
UPDATE foto_lapangan fl
SET file_path = '/images/lapangan-futsal.jpg'
FROM lapangan l
WHERE fl.lapangan_id = l.id AND l.nama = 'Lapangan A';

UPDATE foto_lapangan fl
SET file_path = '/images/lapangan-futsal-2.jpg'
FROM lapangan l
WHERE fl.lapangan_id = l.id AND l.nama = 'Lapangan B';
