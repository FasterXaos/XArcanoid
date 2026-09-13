const xarcanoid_audio = (() => {
    const music_key = "xarcanoid_music";
    const sfx_key = "xarcanoid_sfx";
    const music_vol_key = "xarcanoid_music_vol";
    const sfx_vol_key = "xarcanoid_sfx_vol";

    let ctx = null;
    let master = null;
    let sfx_gain = null;
    let music_gain = null;
    let music_on = true;
    let sfx_on = true;
    let music_vol = 1;
    let sfx_vol = 1;
    let music_wanted = false;
    let ducked = false;
    let step = 0;
    let next_note_at = 0;
    let timer = 0;

    const bass = [98, 98, 82.4, 82.4, 87.3, 87.3, 73.4, 73.4];
    const lead = [196, 246.9, 261.6, 196, 329.6, 261.6, 392, 246.9];
    const step_s = 0.22;

    function read_flag(key, fallback) {
        const raw = localStorage.getItem(key);
        if (raw === null) {
            return fallback;
        }
        return raw === "1";
    }

    function ensure() {
        if (ctx) {
            return;
        }
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            return;
        }
        ctx = new AudioCtx();
        master = ctx.createGain();
        master.gain.value = 0.32;
        master.connect(ctx.destination);
        sfx_gain = ctx.createGain();
        sfx_gain.gain.value = 1;
        const sfx_filter = ctx.createBiquadFilter();
        sfx_filter.type = "lowpass";
        sfx_filter.frequency.value = 2200;
        sfx_filter.Q.value = 0.5;
        sfx_gain.connect(sfx_filter);
        sfx_filter.connect(master);
        music_gain = ctx.createGain();
        music_gain.connect(master);
        apply_gains();
    }

    function clamp_vol(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return 1;
        }
        return Math.max(0, Math.min(1, number));
    }

    function apply_gains() {
        if (sfx_gain) {
            sfx_gain.gain.value = sfx_on ? sfx_vol : 0;
        }
        if (music_gain) {
            music_gain.gain.value = music_on ? 0.2 * music_vol : 0;
        }
    }

    function unlock() {
        ensure();
        if (ctx && ctx.state === "suspended") {
            ctx.resume();
        }
        if (music_on && music_wanted) {
            start_music();
        }
    }

    function tone(freq, duration, type, volume, dest, slide) {
        if (!ctx || !dest) {
            return;
        }
        const start = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(Math.max(40, freq), start);
        if (slide) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), start + duration);
        }
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + duration + 0.03);
    }

    function play_now(name) {
        if (name === "brick") {
            tone(520, 0.09, "triangle", 0.22, sfx_gain, 340);
            return;
        }
        if (name === "paddle") {
            tone(140, 0.11, "sine", 0.28, sfx_gain, 110);
            return;
        }
        if (name === "wall") {
            tone(310, 0.06, "sine", 0.14, sfx_gain);
            return;
        }
        if (name === "serve") {
            tone(280, 0.12, "triangle", 0.2, sfx_gain, 480);
            return;
        }
        if (name === "fall") {
            tone(180, 0.26, "triangle", 0.24, sfx_gain, 70);
            return;
        }
        if (name === "level") {
            tone(392, 0.14, "triangle", 0.2, sfx_gain);
            tone(523, 0.18, "sine", 0.16, sfx_gain);
            return;
        }
        if (name === "over") {
            tone(164, 0.32, "sine", 0.22, sfx_gain, 72);
        }
    }

    function play(name) {
        if (!sfx_on) {
            return;
        }
        ensure();
        if (!ctx || !sfx_gain) {
            return;
        }
        if (ctx.state === "suspended") {
            ctx.resume().then(() => play_now(name));
            return;
        }
        play_now(name);
    }

    function schedule_bar() {
        if (!ctx || !music_on || !music_wanted) {
            return;
        }
        const now = ctx.currentTime;
        if (next_note_at < now - 0.2) {
            next_note_at = now;
        }
        while (next_note_at < now + 0.35) {
            const i = step % bass.length;
            const volume = ducked ? 0.03 : 0.11;
            tone(bass[i], 0.18, "triangle", volume, music_gain);
            if (i % 2 === 0) {
                tone(lead[i], 0.16, "square", volume * 0.55, music_gain);
            }
            next_note_at += step_s;
            step += 1;
        }
        timer = window.setTimeout(schedule_bar, 80);
    }

    function start_music() {
        music_wanted = true;
        if (!music_on) {
            return;
        }
        ensure();
        if (!ctx) {
            return;
        }
        if (ctx.state === "suspended") {
            ctx.resume();
        }
        if (timer) {
            return;
        }
        step = 0;
        next_note_at = ctx.currentTime;
        schedule_bar();
    }

    function stop_music() {
        music_wanted = false;
        if (timer) {
            window.clearTimeout(timer);
            timer = 0;
        }
    }

    function set_ducked(value) {
        ducked = Boolean(value);
    }

    function set_music(on) {
        music_on = Boolean(on);
        localStorage.setItem(music_key, music_on ? "1" : "0");
        if (music_on && music_wanted) {
            start_music();
        } else if (timer) {
            window.clearTimeout(timer);
            timer = 0;
        }
        apply_gains();
        return music_on;
    }

    function set_sfx(on) {
        sfx_on = Boolean(on);
        localStorage.setItem(sfx_key, sfx_on ? "1" : "0");
        apply_gains();
        return sfx_on;
    }

    function set_music_volume(value) {
        music_vol = clamp_vol(value);
        localStorage.setItem(music_vol_key, String(music_vol));
        apply_gains();
        return music_vol;
    }

    function set_sfx_volume(value) {
        sfx_vol = clamp_vol(value);
        localStorage.setItem(sfx_vol_key, String(sfx_vol));
        apply_gains();
        return sfx_vol;
    }

    function toggle_music() {
        return set_music(!music_on);
    }

    function toggle_sfx() {
        return set_sfx(!sfx_on);
    }

    function load() {
        music_on = read_flag(music_key, true);
        sfx_on = read_flag(sfx_key, true);
        const saved_music_vol = localStorage.getItem(music_vol_key);
        const saved_sfx_vol = localStorage.getItem(sfx_vol_key);
        music_vol = saved_music_vol === null ? 1 : clamp_vol(saved_music_vol);
        sfx_vol = saved_sfx_vol === null ? 1 : clamp_vol(saved_sfx_vol);
        apply_gains();
        return { music_on, sfx_on, music_vol, sfx_vol };
    }

    function is_music_on() {
        return music_on;
    }

    function is_sfx_on() {
        return sfx_on;
    }

    return {
        load,
        unlock,
        play,
        start_music,
        stop_music,
        set_ducked,
        toggle_music,
        toggle_sfx,
        set_music,
        set_sfx,
        set_music_volume,
        set_sfx_volume,
        music_volume() { return music_vol; },
        sfx_volume() { return sfx_vol; },
        is_music_on,
        is_sfx_on,
    };
})();
