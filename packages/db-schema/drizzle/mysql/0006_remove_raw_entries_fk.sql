-- Remove FK constraint from raw_entries.channel_id → sessions.id
ALTER TABLE `raw_entries` DROP FOREIGN KEY `raw_entries_channel_id_sessions_id_fk`;
