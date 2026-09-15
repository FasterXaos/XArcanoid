CATALOG = (
    "new_player",
    "combo20",
    "score100k",
    "survival30",
    "two_cores",
    "finale",
    "true_finale",
    "designer",
    "no_try",
    "madness",
    "all_drops",
    "focus",
    "guide",
    "theme",
    "board_off",
    "cheats",
    "platinum",
)
PLATINUM_NEEDS = tuple(item for item in CATALOG if item != "platinum")
HIDDEN = frozenset({"cheats"})
POWER_KINDS = ("wide", "narrow", "slow", "fast", "life", "sticky", "score", "dual")
