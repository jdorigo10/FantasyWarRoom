"""
Fantasy Football Player Stock Analyzer
=======================================
Reads historical + current preseason/postseason data from the
FantasyWarRoom SQLite DB and assigns every player in a target season
a "stock" label (DIAMOND, BREAKOUT, STAR, ...) plus a short outlook,
by blending:
  1) a COMP COHORT of historically similar players — same position,
     similar age/experience, similar ADP & projection tier, and a
     matching situation (injury/suspension/new-team status) — and how
     THOSE players actually performed relative to their own
     projections, weighted primarily; and
  2) the player's OWN historical preseason-vs-actual track record,
     weighted more lightly (see MAX_SELF_HISTORY_WEIGHT below).

Usage:
    Edit DB_PATH and YEAR below, then run:
        python player_stock_analyzer.py

Output:
    - Prints a sorted report to the console
    - Writes a CSV to player_stock_<YEAR>.csv
"""

import sqlite3
import numpy as np
import pandas as pd

# ------------------------------------------------------------------
# CONFIG  (tune these)
# ------------------------------------------------------------------
DB_PATH = r"C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom\db\fantasy_info.db"
YEAR = 2026

MIN_COMPS = 8              # min comp-cohort size before we trust the comp signal
AGE_WINDOW = 2              # +/- years for age-based comp matching
ADP_PCT_WINDOW = 0.20       # +/- positional ADP-percentile window for comp matching
PROJ_PCT_WINDOW = 0.20      # +/- positional projected_ppg-percentile window for comp matching
BUST_THRESHOLD = 0.75       # actual/projected ratio below this = a "bust" outcome
HIT_THRESHOLD = 1.15        # actual/projected ratio above this = a "hit" outcome
BYE_MARKER = -99.0          # sentinel value in `breakdown` for bye/inactive weeks
MAX_DRAFT_RANK = 600        # only generate a stock/description for players drafted this high or higher

# How much to weigh THIS PLAYER'S own past performance vs. how similar players
# (same position/age/experience/ADP/projection/injury-suspension-new_team situation)
# have actually performed historically. 0.0 = ignore the player's own history
# entirely and go purely off the comp cohort; 1.0 = ignore comps and go purely
# off the player's own track record (capped, reached only after several seasons).
MAX_SELF_HISTORY_WEIGHT = 0.35
SELF_HISTORY_SEASON_CAP = 3   # seasons of own history needed to hit the max weight above

# how "established" a player's historical output must be to count as "already a stud"
# (keeps BREAKOUT reserved for players who haven't had a big year yet)
ESTABLISHED_QUALITY_PCT = 0.35   # top 35% of position, historically = "already a stud"
ESTABLISHED_MIN_SEASONS = 2

# --- tier system used by the decision tree -------------------------------
# Both ADP and expected output are bucketed into NUM_TIERS positional tiers
# (tier 1 = best). "tier_drop"/"tier_gain" (see assign_stock) let the rules
# speak in terms of "fell a tier or two" rather than raw percentile deltas.
NUM_TIERS = 6
DEEP_TIER = 5              # tier 5-6 (bottom third) = "deep / low relevance" player
STRONG_EVIDENCE_HIT_RATE = 0.40   # comp hit-rate needed to pull a deep player off AVERAGE
STRONG_EVIDENCE_BUST_RATE = 0.40  # comp bust-rate needed to pull a deep player off AVERAGE
STRONG_EVIDENCE_RATIO = 1.35      # blended_ratio needed to count as a "huge/unexpected" year

BREAKOUT_AGE_WINDOW = {   # (min_age, max_age) commonly-cited breakout windows
    'QB': (21, 27), 'RB': (20, 25), 'WR': (20, 26), 'TE': (21, 26),
}
DECLINE_AGE = {'QB': 38, 'RB': 29, 'WR': 31, 'TE': 30}  # rough position-specific decline cliffs

POSITION_NAME = {
    'QB': 'quarterback', 'RB': 'running back', 'WR': 'wide receiver',
    'TE': 'tight end', 'DST': 'defense', 'K': 'kicker'
}

# ------------------------------------------------------------------
# LOAD
# ------------------------------------------------------------------
def load_data(db_path):
    conn = sqlite3.connect(db_path)
    players = pd.read_sql("SELECT * FROM players", conn)
    preseason = pd.read_sql("SELECT * FROM player_preseason", conn)
    postseason = pd.read_sql("SELECT * FROM player_postseason", conn)
    conn.close()
    return players, preseason, postseason


# ------------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------------
def parse_breakdown(breakdown_str):
    if not breakdown_str or not isinstance(breakdown_str, str):
        return np.array([])
    vals = []
    for tok in breakdown_str.split(','):
        tok = tok.strip()
        if not tok:
            continue
        try:
            v = float(tok)
        except ValueError:
            continue
        if v == BYE_MARKER:
            continue
        vals.append(v)
    return np.array(vals)


def volatility_cv(breakdown_str):
    """Coefficient of variation of game-to-game scoring (NaN if not enough data)."""
    vals = parse_breakdown(breakdown_str)
    if len(vals) < 3:
        return np.nan
    mean = vals.mean()
    if mean <= 0:
        return np.nan
    return float(vals.std() / mean)


def safe_div(a, b):
    if b is None or pd.isna(b) or b == 0 or pd.isna(a):
        return np.nan
    return a / b


# ------------------------------------------------------------------
# BUILD HISTORICAL (preseason x postseason) TABLE
# ------------------------------------------------------------------
def build_history(players, preseason, postseason):
    hist = preseason.merge(postseason, on=['player_id', 'season_year'], how='inner')
    hist = hist.merge(players[['player_id', 'position']], on='player_id', how='left')

    hist['beat_ratio'] = hist.apply(lambda r: safe_div(r['actual_ppg'], r['projected_ppg']), axis=1)
    hist['games_ratio'] = hist.apply(lambda r: safe_div(r['actual_games'], r['projected_games']), axis=1)
    hist['cv'] = hist['breakdown'].apply(volatility_cv)

    # positional ADP / projection percentile WITHIN each historical season
    hist['adp_pos_pct'] = hist.groupby(['season_year', 'position'])['average_draft_position'] \
        .rank(pct=True, ascending=True)
    hist['proj_pos_pct'] = hist.groupby(['season_year', 'position'])['projected_ppg'] \
        .rank(pct=True, ascending=False)
    # positional percentile of ACTUAL output that season (low pct = elite tier finish)
    hist['actual_pos_pct'] = hist.groupby(['season_year', 'position'])['actual_ppg'] \
        .rank(pct=True, ascending=False)
    return hist


# ------------------------------------------------------------------
# PER-PLAYER FEATURE EXTRACTION
# ------------------------------------------------------------------
def get_self_history(player_id, hist_prior):
    ph = hist_prior[hist_prior['player_id'] == player_id].sort_values('season_year')
    if ph.empty:
        return dict(self_n_seasons=0, self_mean_beat_ratio=np.nan,
                    self_trend_slope=np.nan, self_mean_cv=np.nan,
                    self_last_actual_ppg=np.nan, self_best_actual_pos_pct=np.nan,
                    self_established=False)

    n = len(ph)
    mean_beat = ph['beat_ratio'].mean()
    mean_cv = ph['cv'].mean()
    last_actual = ph['actual_ppg'].iloc[-1]
    # best (lowest = most elite) positional finish percentile the player has ever posted
    best_pos_pct = ph['actual_pos_pct'].min()

    slope = np.nan
    if n >= 2:
        x = ph['season_year'].values.astype(float)
        y = ph['actual_ppg'].values.astype(float)
        try:
            slope = float(np.polyfit(x, y, 1)[0])
        except Exception:
            slope = np.nan

    established = bool(n >= ESTABLISHED_MIN_SEASONS and pd.notna(best_pos_pct)
                        and best_pos_pct <= ESTABLISHED_QUALITY_PCT)

    return dict(self_n_seasons=n, self_mean_beat_ratio=mean_beat,
                self_trend_slope=slope, self_mean_cv=mean_cv,
                self_last_actual_ppg=last_actual, self_best_actual_pos_pct=best_pos_pct,
                self_established=established)


def _apply_comp_filters(pool, row, age_window, adp_window, proj_window,
                         match_injury, match_suspended, match_new_team):
    p = pool
    age = row.get('age', np.nan)
    if pd.notna(age):
        p = p[(p['age'] >= age - age_window) & (p['age'] <= age + age_window)]

    adp_pct = row.get('adp_pos_pct', np.nan)
    if pd.notna(adp_pct):
        p = p[(p['adp_pos_pct'] >= adp_pct - adp_window) & (p['adp_pos_pct'] <= adp_pct + adp_window)]

    proj_pct = row.get('proj_pos_pct', np.nan)
    if pd.notna(proj_pct):
        p = p[(p['proj_pos_pct'] >= proj_pct - proj_window) & (p['proj_pos_pct'] <= proj_pct + proj_window)]

    if match_injury and pd.notna(row.get('is_injured')):
        p = p[p['is_injured'] == row['is_injured']]
    if match_suspended and pd.notna(row.get('is_suspended')):
        p = p[p['is_suspended'] == row['is_suspended']]
    if match_new_team and pd.notna(row.get('new_team')):
        p = p[p['new_team'] == row['new_team']]
    return p


# Progressively looser match tiers: start by requiring position + age + ADP tier +
# projection tier + a matching injury/suspension/new-team situation, then relax
# the situational and window constraints (in that order) until MIN_COMPS is hit.
_COMP_RELAXATION_STEPS = [
    dict(age_window=AGE_WINDOW, adp_window=ADP_PCT_WINDOW, proj_window=PROJ_PCT_WINDOW,
         match_injury=True, match_suspended=True, match_new_team=True),
    dict(age_window=AGE_WINDOW, adp_window=ADP_PCT_WINDOW, proj_window=PROJ_PCT_WINDOW,
         match_injury=True, match_suspended=False, match_new_team=True),
    dict(age_window=AGE_WINDOW, adp_window=ADP_PCT_WINDOW, proj_window=PROJ_PCT_WINDOW,
         match_injury=False, match_suspended=False, match_new_team=False),
    dict(age_window=AGE_WINDOW + 1, adp_window=ADP_PCT_WINDOW * 1.5, proj_window=PROJ_PCT_WINDOW * 1.5,
         match_injury=False, match_suspended=False, match_new_team=False),
    dict(age_window=AGE_WINDOW + 2, adp_window=ADP_PCT_WINDOW * 2, proj_window=PROJ_PCT_WINDOW * 2,
         match_injury=False, match_suspended=False, match_new_team=False),
]


def get_comp_cohort(row, hist_prior):
    position = row['position']
    base_pool = hist_prior[hist_prior['position'] == position]
    base_pool = base_pool[base_pool['player_id'] != row['player_id']]  # exclude own past rows
    base_pool = base_pool.dropna(subset=['beat_ratio'])

    pool, match_tier = base_pool.iloc[0:0], None
    for i, step in enumerate(_COMP_RELAXATION_STEPS):
        candidate = _apply_comp_filters(base_pool, row, **step)
        if len(candidate) >= MIN_COMPS or i == len(_COMP_RELAXATION_STEPS) - 1:
            pool, match_tier = candidate, i
            break

    n = len(pool)
    if n == 0:
        return dict(comp_n=0, comp_mean_beat_ratio=np.nan, comp_std_beat_ratio=np.nan,
                    comp_hit_rate=np.nan, comp_bust_rate=np.nan, comp_mean_games_ratio=np.nan,
                    comp_match_tier=match_tier, comp_situation_matched=(match_tier == 0))

    return dict(
        comp_n=n,
        comp_mean_beat_ratio=float(pool['beat_ratio'].mean()),
        comp_std_beat_ratio=float(pool['beat_ratio'].std()) if n > 1 else np.nan,
        comp_hit_rate=float((pool['beat_ratio'] > HIT_THRESHOLD).mean()),
        comp_bust_rate=float((pool['beat_ratio'] < BUST_THRESHOLD).mean()),
        comp_mean_games_ratio=float(pool['games_ratio'].mean()),
        comp_match_tier=match_tier,
        comp_situation_matched=(match_tier == 0),   # tier 0 = injury+suspension+new_team all matched
    )


def blend_expected_ppg(row, self_feat, comp_feat):
    """
    Expected output is driven primarily by the comp cohort (how similar players —
    matched on position/age/experience/ADP/projection tier/injury/suspension/new-team
    situation — actually performed), with the player's own track record folded in
    at a weight capped by MAX_SELF_HISTORY_WEIGHT.
    """
    projected = row['projected_ppg']
    if pd.isna(projected):
        return np.nan, np.nan, 0.0

    self_n = self_feat['self_n_seasons']
    self_ratio = self_feat['self_mean_beat_ratio']
    comp_n = comp_feat['comp_n']
    comp_ratio = comp_feat['comp_mean_beat_ratio']

    # self-history weight ramps up to MAX_SELF_HISTORY_WEIGHT as seasons accumulate,
    # capped so the comp cohort always carries the majority of the signal by default
    self_weight = MAX_SELF_HISTORY_WEIGHT * (min(self_n, SELF_HISTORY_SEASON_CAP) / SELF_HISTORY_SEASON_CAP) \
        if self_n > 0 else 0.0
    if pd.isna(self_ratio):
        self_weight = 0.0

    comp_ratio_eff = comp_ratio if (comp_n >= MIN_COMPS and not pd.isna(comp_ratio)) else 1.0

    blended_ratio = self_weight * self_ratio + (1 - self_weight) * comp_ratio_eff if self_weight > 0 \
        else comp_ratio_eff

    if pd.isna(blended_ratio):
        blended_ratio = 1.0

    return projected * blended_ratio, blended_ratio, self_weight


def analyze_player(row, hist_prior):
    self_feat = get_self_history(row['player_id'], hist_prior)
    comp_feat = get_comp_cohort(row, hist_prior)
    expected_ppg, blended_ratio, self_weight = blend_expected_ppg(row, self_feat, comp_feat)

    out = dict(row)
    out.update(self_feat)
    out.update(comp_feat)
    out['expected_ppg'] = expected_ppg
    out['blended_ratio'] = blended_ratio
    out['self_weight'] = self_weight
    return out


# ------------------------------------------------------------------
# STOCK DECISION LOGIC
# ------------------------------------------------------------------
def tier_from_pct(pct):
    """Bucket a 0..1 percentile (low = better) into 1..NUM_TIERS (tier 1 = best)."""
    if pd.isna(pct):
        return NUM_TIERS
    t = int(pct * NUM_TIERS) + 1
    return min(max(t, 1), NUM_TIERS)


def assign_stock(r):
    risk_injury = r.get('is_injured') in ('HURT', 'IR')
    risk_susp = r.get('is_suspended') == 'SUSPENDED'
    high_bust = pd.notna(r['comp_bust_rate']) and r['comp_bust_rate'] >= 0.35
    high_vol = pd.notna(r.get('vol_pct')) and r['vol_pct'] >= 0.75
    strong_trend_up = pd.notna(r['self_trend_slope']) and r['self_trend_slope'] > 1.5
    strong_trend_down = pd.notna(r['self_trend_slope']) and r['self_trend_slope'] < -1.5

    window = BREAKOUT_AGE_WINDOW.get(r['position'])
    breakout_age = bool(window and pd.notna(r.get('age')) and
                         window[0] <= r['age'] <= window[1] and (r.get('experience') or 0) <= 4)
    young_or_uncertain = breakout_age or r['self_n_seasons'] <= 1

    decline_age = DECLINE_AGE.get(r['position'])
    is_declining_age = bool(decline_age is not None and pd.notna(r.get('age')) and r['age'] >= decline_age)

    quality = 1 - r['exp_goodness_pct']    # 0..1, higher = stronger projected tier at the position
    self_mean_beat = r.get('self_mean_beat_ratio', np.nan)
    self_underperforms = pd.notna(self_mean_beat) and self_mean_beat < 0.8
    already_established = r.get('self_established', False)
    projects_far_above_past = (
        pd.notna(r.get('blended_ratio')) and r['blended_ratio'] >= 1.30 and r['self_n_seasons'] >= 1
    )

    # --- tier math: "tier_drop" > 0 means the expected output tier is WORSE than
    # where he's being drafted (i.e. he's overpriced); "tier_gain" > 0 means the
    # opposite (he's a value). This lets rules speak in "fell a tier or two" terms.
    adp_tier = tier_from_pct(r.get('adp_pos_pct'))
    exp_tier = tier_from_pct(r['exp_goodness_pct'])
    tier_drop = exp_tier - adp_tier
    tier_gain = -tier_drop

    # 0. Deep / low-ADP, low-projected players: default to AVERAGE unless there's
    #    real evidence (comps or trend) of a real outcome in either direction —
    #    most late picks with nothing standing out should just be AVERAGE.
    is_deep = adp_tier >= DEEP_TIER and exp_tier >= DEEP_TIER
    strong_evidence = (
        (pd.notna(r['comp_hit_rate']) and r['comp_hit_rate'] >= STRONG_EVIDENCE_HIT_RATE) or
        (pd.notna(r['comp_bust_rate']) and r['comp_bust_rate'] >= STRONG_EVIDENCE_BUST_RATE) or
        (pd.notna(r.get('blended_ratio')) and r['blended_ratio'] >= STRONG_EVIDENCE_RATIO) or
        strong_trend_up or strong_trend_down or risk_injury or risk_susp
    )
    if is_deep and not strong_evidence:
        return 'AVERAGE'

    # 1. BUST / FADE — reserved for a real, supported fall of 2+ tiers below where
    #    the player is being drafted. Without that kind of support, even a big-name
    #    early pick with a middling signal will NOT land here (falls through to
    #    OVERVALUED at worst). BUST = personal red flag (injury/age/trend) driving
    #    it; FADE = the comps/value say so without a specific personal flag.
    red_flag_support = high_bust or self_underperforms or is_declining_age or strong_trend_down
    if tier_drop >= 2 and red_flag_support:
        return 'BUST' if (risk_injury or is_declining_age or strong_trend_down) else 'FADE'

    # 2. WILDCARD — wide, two-sided range of outcomes, reserved for young/unproven
    #    players rather than established veterans with a lot of data.
    if young_or_uncertain and high_vol and pd.notna(r['comp_hit_rate']) and pd.notna(r['comp_bust_rate']) \
            and r['comp_hit_rate'] >= 0.25 and r['comp_bust_rate'] >= 0.25:
        return 'WILDCARD'

    # 3. OVERVALUED — priced a tier or two ahead of the expected output, without
    #    enough support to call it a bust/fade outright.
    if tier_drop >= 1:
        return 'OVERVALUED'

    # 4. DIAMOND — elite of the elite only: either a top-tier player whose trend/
    #    track record confirms he's staying (or getting) elite, or a still-strong
    #    (top-2-tier) player who's jumped 2+ tiers of value. Kept intentionally rare.
    elite_quality = exp_tier == 1
    low_bust_risk = pd.isna(r['comp_bust_rate']) or r['comp_bust_rate'] < 0.20
    confirmed_elite = elite_quality and low_bust_risk and not risk_injury and (
        strong_trend_up or projects_far_above_past or
        (already_established and pd.notna(self_mean_beat) and self_mean_beat >= 1.05)
    )
    value_diamond = tier_gain >= 2 and exp_tier <= 2 and low_bust_risk and not risk_injury
    if confirmed_elite or value_diamond:
        return 'DIAMOND'

    # 5. STAR — proven, established, consistent production; this (along with
    #    STARTER/AVERAGE below) should catch most properly-priced top picks.
    if quality >= 0.80 and r['self_n_seasons'] >= 2 and \
            (pd.isna(r['self_mean_cv']) or r['self_mean_cv'] < 0.55) and not risk_injury:
        return 'STAR'

    # 6. BREAKOUT — reserved for players who haven't already had a big year, kept
    #    rare via a higher comp hit-rate bar and requiring they're not overpriced.
    breakout_signal = strong_trend_up or projects_far_above_past or \
        (breakout_age and pd.notna(r['comp_hit_rate']) and r['comp_hit_rate'] >= 0.40)
    if breakout_signal and not already_established and not risk_injury:
        return 'BREAKOUT'

    # 7. SLEEPER — modest, ordinary value (a tier of upside, not 2+)
    if tier_gain >= 1:
        return 'SLEEPER'

    # 8. RISKY — real injury/suspension/volatility risk on a player who'd still be
    #    good if the situation resolves cleanly ("good if healthy").
    if (risk_injury or risk_susp or high_vol) and quality >= 0.45:
        return 'RISKY'

    # 9. STARTER — reliable, unspectacular production
    if quality <= 0.55 and (pd.isna(r['self_mean_cv']) or r['self_mean_cv'] < 0.6) and tier_drop <= 0:
        return 'STARTER'

    return 'AVERAGE'


# ------------------------------------------------------------------
# DESCRIPTION GENERATOR (<90 words)
# ------------------------------------------------------------------
LABEL_BLURB = {
    'DIAMOND': "He's being drafted well below his projected output \u2014 a clear value target.",
    'BREAKOUT': "Age, trend, and role all point toward a real step forward this year.",
    'STAR': "He's an established, consistent difference-maker at the position.",
    'STARTER': "Expect steady, dependable production in line with a solid weekly starter.",
    'SLEEPER': "His ADP undersells his likely output \u2014 worth a look in the later rounds.",
    'AVERAGE': "Production and cost look roughly in line with expectations.",
    'OVERVALUED': "His draft cost is running ahead of what the data supports.",
    'RISKY': "Health, role, or situational uncertainty make him a volatile bet.",
    'FADE': "The gap between cost and expected output makes him easy to pass on.",
    'BUST': "Age, injury trend, and comparable outcomes point to real disappointment risk.",
    'WILDCARD': "Outcomes here run wide \u2014 real weekly-winner upside with real downside risk.",
}


def generate_description(r):
    """
    Builds a loose, reason-fitting lead-in: whichever signal actually carried the
    most weight in the call (comp cohort, with or without a matched situation, vs.
    the player's own track record) is what gets described, rather than a fixed
    template order.
    """
    pos = r['position']
    self_n = r['self_n_seasons']
    comp_n = r['comp_n']
    self_weight = r.get('self_weight', 0) or 0
    comp_reliable = comp_n >= MIN_COMPS and pd.notna(r.get('comp_hit_rate'))
    self_reliable = self_n >= 1 and pd.notna(r.get('self_mean_beat_ratio'))

    parts = []

    if comp_reliable and (not self_reliable or self_weight <= 0.5):
        situation_note = " with a matching injury/suspension/team-change situation" \
            if r.get('comp_situation_matched') else ""
        parts.append(
            f"{comp_n} historically similar {POSITION_NAME.get(pos, pos)}s{situation_note} "
            f"hit their projection {r['comp_hit_rate']*100:.0f}% of the time and busted "
            f"{r['comp_bust_rate']*100:.0f}% of the time."
        )
        if self_reliable:
            parts.append(f"He's personally added {r['self_mean_beat_ratio']:.2f}x his own projections over {self_n} seasons.")
    elif self_reliable:
        parts.append(
            f"Over his own last {self_n} season{'s' if self_n != 1 else ''} he's landed at "
            f"{r['self_mean_beat_ratio']:.2f}x his preseason projection."
        )
        if comp_n > 0 and pd.notna(r.get('comp_hit_rate')):
            parts.append(f"A smaller pool of comparable players skews a similar direction.")
    else:
        parts.append("Limited history and thin comps make this a lower-confidence, early-look projection.")

    parts.append(LABEL_BLURB.get(r['stock'], ""))

    text = " ".join(p for p in parts if p)
    words = text.split()
    if len(words) > 90:
        text = " ".join(words[:90]) + "..."
    return text


# ------------------------------------------------------------------
# MAIN PIPELINE
# ------------------------------------------------------------------
def analyze(year):
    """
    Run the full stock analysis for `year`, reading from the DB_PATH configured
    at the top of this file. Returns a DataFrame with one row per player
    (draft_rank <= MAX_DRAFT_RANK) including their assigned stock label and
    a short generated outlook.
    """
    players, preseason, postseason = load_data(DB_PATH)
    hist = build_history(players, preseason, postseason)
    hist_prior = hist[hist['season_year'] < year]

    target_pre = preseason[preseason['season_year'] == year].copy()
    if target_pre.empty:
        raise ValueError(f"No player_preseason rows found for season_year={year}")

    target_pre = target_pre.merge(players, on='player_id', how='left')

    # only players drafted within a relevant range get a stock/description generated
    target_pre = target_pre[target_pre['draft_rank'] <= MAX_DRAFT_RANK].copy()
    if target_pre.empty:
        raise ValueError(f"No players with draft_rank <= {MAX_DRAFT_RANK} found for season_year={year}")

    target_pre['adp_pos_pct'] = target_pre.groupby('position')['average_draft_position'] \
        .rank(pct=True, ascending=True)
    target_pre['proj_pos_pct'] = target_pre.groupby('position')['projected_ppg'] \
        .rank(pct=True, ascending=False)

    records = [analyze_player(row, hist_prior) for _, row in target_pre.iterrows()]
    result = pd.DataFrame(records)

    # positional "goodness" percentile of expected output (low = elite tier at that position)
    result['exp_goodness_pct'] = result.groupby('position')['expected_ppg'] \
        .rank(pct=True, ascending=False)
    # value_vs_adp: positive = being drafted worse than his expected output deserves (value)
    result['value_vs_adp'] = result['adp_pos_pct'] - result['exp_goodness_pct']

    # combined volatility signal -> percentile within position (higher = more volatile)
    result['vol_raw'] = result[['self_mean_cv', 'comp_std_beat_ratio']].mean(axis=1, skipna=True)
    result['vol_pct'] = result.groupby('position')['vol_raw'].rank(pct=True, ascending=True)

    result['stock'] = result.apply(assign_stock, axis=1)
    result['description'] = result.apply(generate_description, axis=1)

    cols = ['player_id', 'full_name', 'position', 'age', 'experience',
            'average_draft_position', 'projected_ppg', 'expected_ppg',
            'comp_n', 'comp_situation_matched', 'self_n_seasons', 'self_weight',
            'stock', 'description']
    result = result[cols].sort_values(['position', 'average_draft_position'])
    return result


if __name__ == "__main__":
    df = analyze(YEAR)
    output_csv = f"player_stock_{YEAR}.csv"
    df.to_csv(output_csv, index=False)
    print(f"Wrote {len(df)} player rows to {output_csv}\n")

    with pd.option_context('display.max_rows', None, 'display.max_colwidth', 60):
        print(df[['full_name', 'position', 'average_draft_position',
                   'projected_ppg', 'expected_ppg', 'stock']].to_string(index=False))
        