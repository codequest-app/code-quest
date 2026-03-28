-- Remove FK constraint from messages.channel_id → sessions.id
ALTER TABLE `messages` DROP FOREIGN KEY `messages_channel_id_sessions_id_fk`;
