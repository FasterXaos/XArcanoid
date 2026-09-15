# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.1] - 2026-09-14

### Added

- Twin-ball power-up. Sticky holds every ball; Space releases them one by one; when sticky ends they launch on their own.

### Changed

- Touch: holding a finger on the court now drags the paddle.
- Dropdowns use rounded, theme-colored chrome.
- Drops despawn at the inner frame instead of overlapping it.

### Fixed

- Boss core no longer takes a hit every frame while a ball is stuck inside.
- Phase rebuilds wait for a wider gap around all balls and skip cells next to them.
- Fast balls use substeps and are pushed out of bricks so they bounce instead of tunneling.
- Falling balls clip at the inner frame like power-ups.
- The Core rides side rails with a gap so its brick shell cannot jam into the wall.

## [0.7.0] - 2026-09-14

### Added

- Sketch mode: paint a custom brick layout on a highlighted grid and start after a 1.5s countdown. No leaderboard.

## [0.6.0] - 2026-09-14

### Added

- Falling power-ups from broken bricks (wide, thin, slow, fast, extra life, sticky paddle, bonus score), with drop chance and mix scaled by difficulty.
- Ten named brick layouts on a larger court; after stage 10 the set loops at random. Armor bricks take two hits.
- Campaign and Survival modes, a Core boss every 11th stage, and separate leaderboards. Practice still never records a score, and hides a small convenience for clearing a stage.

### Changed

- Playfield frame is the collision border on every theme, including Night Arcade.
- Boss phases follow remaining HP share (about 16/26 and 6/26) and wait until the ball is outside the shell before rebuilding.
- Core damage is shown as spreading cracks, not a number.

## [0.5.2] - 2026-09-14

### Added

- Leaderboard shows the difficulty of the best run.

### Changed

- Practice paddle is a bit wider, Overdrive a bit narrower.
- HUD timer ticks once per second while the ball is in play.

## [0.5.1] - 2026-09-14

### Changed

- Settings panel is narrower; mute controls sit on the same row as volume sliders and reuse the note/speaker icons.
- Volume sliders follow the current theme accent.
- Leaderboard visibility can be toggled from settings.

## [0.5.0] - 2026-09-14

### Added

- Toggle buttons next to the language switch for a generated chiptune OST and short game SFX.
- In-game guide (i) with controls, scoring, difficulties, and the project changelog.
- Settings gear: music/SFX mutes, volume sliders, and theme picker (moved off the main panel).

### Fixed

- SFX never played because they were looked up on `window` (script `const` is not a window property); hits now use soft distinct tones.
- Theme changes now recolor the court, bricks, paddle, highlight, and a contrasting frame (Night Arcade stays the original look).

## [0.4.1] - 2026-09-14

### Added

- Best combo is stored with each run and shown on the leaderboard.

### Changed

- After the difficulty speed cap, ball speed still creeps up slowly to a much higher hard cap.
- Logged-in player name sits on the PLAYER heading row; the extra signed-in banner is gone.

### Fixed

- Timer no longer runs while the ball waits on the paddle.
- Losing a ball now shaves a bit of speed instead of leaving it unchanged.

## [0.4.0] - 2026-09-14

### Added

- Color themes (Night Arcade default, Phosphor Den, Magma Well, Glacier Box, Candy Core, Paper Kit).
- Pause on P, on Space while the ball is in flight, and when the page loses focus, with a 1.5s countdown before resume.
- Difficulty modes: Practice (infinite lives, no score), Standard, Overdrive (1.5× score, faster ball, one life).
- End-run button on every difficulty.
- Scoring from difficulty, timer, stage level, remaining lives (fewer lives pay more), and brick combo.
- Combo and timer on the HUD.

## [0.3.1] - 2026-09-13

### Fixed

- A and D keys now type in login and register fields instead of moving the paddle.

## [0.3.0] - 2026-09-13

### Added

- Russian / English language toggle on the left of the playfield.

### Removed

- In-game "local stand" label.

## [0.2.0] - 2026-09-13

### Added

- Linux VM deployment with gunicorn, systemd, nginx, and an install guide.

## [0.1.0] - 2026-09-13

### Added

- First version of the project.
