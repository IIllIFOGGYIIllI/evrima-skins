# Primeval Refuge Discord Blueprint

`/setup confirm:PRIMEVAL` manages this structure without deleting unrelated custom channels or roles.

```text
🌿 WELCOME
  # welcome                read-only
  # rules                  read-only
  # server-info            read-only
  # announcements          read-only

🦖 PRIMEVAL REFUGE
  # general
  # screenshots
  # clips
  # dinosaur-chat
  # skin-showcase
  # suggestions

🛰 SERVER
  # server-status          read-only
  # server-updates         read-only
  # known-issues           read-only
  # bug-reports

🐾 GAMEPLAY
  # group-finder
  # nesting
  # migration-chat
  # new-player-help
  # species-guides         read-only

🎨 SKIN STUDIO
  # skin-studio
  # skin-help
  # published-skins        read-only
  # featured-skins         read-only

🛟 SUPPORT
  # support
  # report-info            read-only
  # appeals-info           read-only

🛡 STAFF                   hidden from @everyone
  # staff-chat             Admin / Moderator / Support
  # staff-alerts           Admin / Moderator / Support
  # moderation-log         Admin / Moderator
  # server-management      Admin only

🔊 VOICE
  General
  Group 1
  Group 2
  AFK
```

## Managed roles

- **Admin** — server/channel/role/message management plus kick, ban, timeout, nickname and audit-log permissions.
- **Moderator** — message moderation, timeouts, kick and nickname management.
- **Support** — no global moderation permissions; access is granted through staff channel overwrites.
- **Member** — presentation/member role with no global elevated permissions.

The Discord server owner remains authoritative and is not replaced by a bot-created Owner role.
