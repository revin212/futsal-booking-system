-- Set cancellation cutoff to 1 hour before play time

UPDATE pengaturan_sistem
SET value = '1'
WHERE key = 'MinJamBatalkan';

