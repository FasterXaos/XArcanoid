const xarcanoid_achievements = {
    rows: [
        ["new_player", "combo20", "score100k", "survival30", "two_cores", "finale", "true_finale", "designer"],
        ["no_try", "madness", "all_drops", "focus", "guide", "theme", "board_off", "cheats", "platinum"],
    ],
    icons: {
        new_player: "+",
        combo20: "×",
        score100k: "K",
        survival30: "30",
        two_cores: "◎",
        finale: "★",
        true_finale: "Ω",
        designer: "⌗",
        no_try: "∅",
        madness: "↻",
        all_drops: "∀",
        focus: "…",
        guide: "i",
        theme: "◐",
        board_off: "—",
        cheats: "ツ",
        platinum: "Pt",
    },

    render(row, items, t) {
        row.innerHTML = "";
        const by_id = {};
        (items || []).forEach((item) => {
            by_id[item.id] = item;
        });
        this.rows.forEach((ids) => {
            const line = document.createElement("div");
            line.className = "ach_row";
            ids.forEach((id) => {
                const data = by_id[id] || {
                    id,
                    unlocked: false,
                    hidden: id === "cheats",
                    percent: 0,
                    holders: 0,
                };
                const tile = document.createElement("button");
                tile.type = "button";
                tile.className = "ach_tile" + (data.unlocked ? " is_on" : " is_off");
                tile.dataset.id = id;
                tile.textContent = this.icons[id] || "?";
                tile.setAttribute("aria-label", t("ach_" + id + "_title"));
                this.bind_tooltip(tile, data, t);
                line.appendChild(tile);
            });
            row.appendChild(line);
        });
    },

    bind_tooltip(tile, data, t) {
        const show = () => {
            const tip = document.createElement("div");
            tip.className = "ach_tip";
            const title = document.createElement("div");
            title.className = "ach_tip_title";
            title.textContent = t("ach_" + data.id + "_title");
            const desc = document.createElement("div");
            desc.className = "ach_tip_desc";
            desc.textContent = data.hidden
                ? t("ach_hidden")
                : t("ach_" + data.id + "_desc");
            tip.appendChild(title);
            tip.appendChild(desc);
            if (data.unlocked) {
                const comment = t("ach_" + data.id + "_comment");
                if (comment && comment !== "ach_" + data.id + "_comment") {
                    const extra = document.createElement("div");
                    extra.className = "ach_tip_comment";
                    extra.textContent = comment;
                    tip.appendChild(extra);
                }
            }
            const percent = document.createElement("div");
            percent.className = "ach_tip_percent";
            if (!data.holders) {
                percent.textContent = t("ach_percent_none");
            } else {
                percent.textContent = t("ach_percent", {
                    percent: String(data.percent),
                    holders: String(data.holders),
                    players: String(data.players || 0),
                });
            }
            tip.appendChild(percent);
            document.body.appendChild(tip);
            const box = tile.getBoundingClientRect();
            const tip_box = tip.getBoundingClientRect();
            let left = box.left + box.width / 2 - tip_box.width / 2;
            left = Math.max(8, Math.min(left, window.innerWidth - tip_box.width - 8));
            tip.style.left = left + "px";
            tip.style.top = Math.max(8, box.top - tip_box.height - 8) + "px";
            tile._tip = tip;
        };
        const hide = () => {
            if (tile._tip) {
                tile._tip.remove();
                tile._tip = null;
            }
        };
        tile.addEventListener("mouseenter", show);
        tile.addEventListener("mouseleave", hide);
        tile.addEventListener("blur", hide);
    },
};
