# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
