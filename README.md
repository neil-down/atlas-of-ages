# Atlas of Ages — A Walkable Bible History

**Play it: https://neil-down.github.io/atlas-of-ages/** (also local: `npm run serve` → http://localhost:8124)

An explorable, animated, educational adventure built from scratch: walk the Garden,
cross Egypt, sail Galilee, wander the Wilderness, weep in Babylon, gather in the
upper room, confess at Nicaea, and stand at Wittenberg. Talk to people, gather
relics, answer skeptics with evidence, and unseal each era by ordering its events
on the timeline.

## Play

- `npm run serve` → http://localhost:8124 (static files, no build step)
- Move: **WASD / arrows**, click/tap to walk there, touch joystick on mobile
- Interact: **E** (talk, gather, strike, unseal) — a prompt always tells you what E will do
- Follow the **golden arrow**: it points at your live objective (person, relic, shadow, portal)
- Journal/codex/story-threads: **J** · Sound: **M**

## Never lost

- First entry to each age opens a **foundations briefing**: date, three verified facts, a key verse
- The **Threads** tab shows how the eight ages connect into one story
- Quests always name who/where; the tracker prefers business in your current age

## Doctrine

- Grace-alone framing throughout (Eph 2:8–10 codex; every gift given, never earned)
- Church history: Nicaea/Chalcedon, Wittenberg/Worms/Augsburg/Geneva
- Apologetics: answering Arius (John 1:1), indulgences (Rom 1:17), manuscript evidence, resurrection codex
- Westminster Shorter Catechism Q1 in the codex

## Design (from research)

- **Explore first**: an open map you can walk anywhere, like Oregon Trail / Poptropica islands
- **Clear quest motivation** (Filament/MIT): every chore serves a story — no fetch-for-fetch
- **Fail safely, retry freely**: timeline trials give hints, never punish (growth mindset)
- **Learn by doing**: relics unlock real codex facts; ordering events teaches chronology (Chronicle-style)
- **Free time travel** once an era is unsealed; progress autosaves + persists

## Verify

- `npm run validate` — map/content gate (rectangular maps, known tiles, in-bounds spawns, quest references, relic counts, 4-event trials)
- `npm run smoke` — headless playthrough: title → dialogue → movement → journal → quest accept → trial solve → portal travel, zero console errors (needs the `playwright` package available via NODE_PATH)
