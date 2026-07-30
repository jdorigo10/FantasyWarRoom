"""
Fantasy Football Player Stock Analyzer
=======================================
Reads historical + current preseason/postseason data from the
FantasyWarRoom SQLite DB and assigns every player (draft_rank 1-600)
in a target season a roster-tier "stock" label:

    SUPERSTAR -> STAR -> STARTER -> AVERAGE -> BENCH -> WAIVER -> AVOID

Tiers are rank-based within each position, sized off LEAGUE_COUNT and
the position roster-multipliers below, but boundaries "breathe" a bit:
if the players straddling a nominal cutoff are within GAP_THRESHOLD_PCT
of each other's expected PPG, the cutoff slides down to keep them
together in the same tier (e.g. if QB 9-13 are all bunched together in
a 10-team/1-QB league, all five land in the starting-caliber group).

Expected PPG for each player blends (in configurable proportions):
    1) their own historical preseason-vs-actual track record, and
    2) a COMP COHORT of historically similar players (same position,
       similar age/experience/ADP tier/projection tier, and a matching
       injury/suspension/new-team situation where that data exists).
Both fall back gracefully on seasons with missing data (2023 has no
valid ADP/projected_ppg/projected_games; 2023-2024 have no injury or
suspension status) -- see build_history / get_self_history / get_comp_cohort.

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

MIN_DRAFT_RANK = 1
MAX_DRAFT_RANK = 600     # only players with draft_rank in [MIN_DRAFT_RANK, MAX_DRAFT_RANK] get a stock

# ---- league shape --------------------------------------------------
LEAGUE_COUNT = 10         # number of teams in the league

# "starting caliber" pool size per position = LEAGUE_COUNT * multiplier.
# This is the SUPERSTAR + STAR + STARTER pool combined (tiers 1-3).
STARTER_MULTIPLIER = {
    'QB': 1.0, 'RB': 2.0, 'WR': 2.0, 'TE': 1.0, 'DST': 1.0, 'K': 1.0,
}

# extra players (beyond the starting-caliber pool) added per tier, again as
# LEAGUE_COUNT * multiplier. AVERAGE = flex-caliber, BENCH/WAIVER = deeper.
AVERAGE_EXTRA_MULTIPLIER = {
    'QB': 0.5, 'RB': 2.0, 'WR': 2.0, 'TE': 1.0, 'DST': 0.5, 'K': 0.5,
}
BENCH_EXTRA_MULTIPLIER = {
    'QB': 0.5, 'RB': 1.0, 'WR': 1.0, 'TE': 0.5, 'DST': 0.5, 'K': 0.5,
}
WAIVER_EXTRA_MULTIPLIER = {
    'QB': 0.5, 'RB': 1.0, 'WR': 1.0, 'TE': 0.5, 'DST': 0.5, 'K': 0.5,
}

# how many of the very top starting-caliber players can be SUPERSTAR (1 = only
# the top guy, unless #2/#3 are close enough in expected PPG to join him)
SUPERSTAR_BASE = 1
SUPERSTAR_MAX = 3

# nominal size of the STAR tier (the "handful" of players just below SUPERSTAR
# but clearly above the rest of the starter pool), per position
STAR_TIER_SIZE = {
    'QB': 3, 'RB': 5, 'WR': 5, 'TE': 3, 'DST': 3, 'K': 3,
}

# how "close" (as a fraction of the boundary player's expected PPG) two
# adjacent players' expected PPG must be to be treated as tied at a tier
# boundary, and how many extra players a boundary is allowed to absorb
GAP_THRESHOLD_PCT = 0.04
MAX_BOUNDARY_EXTEND = 4

# ---- expected-PPG blend weights ------------------------------------
# Nominal weights (renormalized after zeroing out whichever signals are
# unavailable for a given player/season -- e.g. no self-history yet, or a
# thin comp cohort). Must reflect relative trust in each signal, not sum to 1.
WEIGHT_SELF_HISTORY = 0.25      # trust in the player's own past beat-rate
WEIGHT_COMP_COHORT = 0.55       # trust in how similar players actually did
WEIGHT_RAW_PROJECTION = 0.20    # trust in the projection itself (ratio = 1.0)

SELF_HISTORY_SEASON_CAP = 3     # seasons of own history needed for full self-history weight
MIN_COMPS = 8                   # comp-cohort size needed for full comp-cohort weight

# comp-matching windows
AGE_WINDOW = 2                  # +/- years for age-based comp matching
ADP_PCT_WINDOW = 0.20            # +/- positional ADP-percentile window for comp matching
PROJ_PCT_WINDOW = 0.20           # +/- positional projected_ppg-percentile window for comp matching
BUST_THRESHOLD = 0.75
HIT_THRESHOLD = 1.15
BYE_MARKER = -99.0               # sentinel value in `breakdown` for bye/inactive weeks

# how "established" a player's historical output must be to count as
# already having had a big year (top X% of position, 2+ seasons)
ESTABLISHED_QUALITY_PCT = 0.35
ESTABLISHED_MIN_SEASONS = 2

STOCK_ORDER = ['SUPERSTAR', 'STAR', 'STARTER', 'AVERAGE', 'BENCH', 'WAIVER', 'AVOID']


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

    # NOTE: beat_ratio requires a valid projected_ppg, which 2023 preseason rows
    # don't have -- those rows naturally end up with beat_ratio = NaN and are
    # excluded anywhere beat_ratio is required (comp cohorts, self-history ratio).
    hist['beat_ratio'] = hist.apply(lambda r: safe_div(r['actual_ppg'], r['projected_ppg']), axis=1)
    hist['games_ratio'] = hist.apply(lambda r: safe_div(r['actual_games'], r['projected_games']), axis=1)
    hist['cv'] = hist['breakdown'].apply(volatility_cv)

    # positional percentiles WITHIN each historical season (NaN-safe: an all-NaN
    # column, like average_draft_position in 2023, just produces all-NaN percentiles)
    hist['adp_pos_pct'] = hist.groupby(['season_year', 'position'])['average_draft_position'] \
        .rank(pct=True, ascending=True)
    hist['proj_pos_pct'] = hist.groupby(['season_year', 'position'])['projected_ppg'] \
        .rank(pct=True, ascending=False)
    # positional percentile of ACTUAL output (low pct = elite finish) -- only needs
    # actual_ppg, so this is valid even for 2023 despite its missing projection data
    hist['actual_pos_pct'] = hist.groupby(['season_year', 'position'])['actual_ppg'] \
        .rank(pct=True, ascending=False)
    return hist


# ------------------------------------------------------------------
# PER-PLAYER FEATURE EXTRACTION
# ------------------------------------------------------------------
def get_self_history(player_id, hist_prior):
    ph = hist_prior[hist_prior['player_id'] == player_id].sort_values('season_year')
    if ph.empty:
        return dict(self_n_seasons=0, self_mean_beat_ratio=np.nan, self_trend_slope=np.nan,
                    self_mean_cv=np.nan, self_last_actual_ppg=np.nan,
                    self_best_actual_pos_pct=np.nan, self_established=False)

    ph_actual = ph.dropna(subset=['actual_ppg'])       # valid even for 2023 (no projection needed)
    ph_ratio = ph.dropna(subset=['beat_ratio'])        # needs a valid projected_ppg (excludes 2023)

    n_ratio = len(ph_ratio)
    mean_beat = ph_ratio['beat_ratio'].mean() if n_ratio > 0 else np.nan
    mean_cv = ph_actual['cv'].mean() if len(ph_actual) > 0 else np.nan
    last_actual = ph_actual['actual_ppg'].iloc[-1] if len(ph_actual) > 0 else np.nan
    best_pos_pct = ph_actual['actual_pos_pct'].min() if len(ph_actual) > 0 else np.nan

    slope = np.nan
    if len(ph_actual) >= 2:
        x = ph_actual['season_year'].values.astype(float)
        y = ph_actual['actual_ppg'].values.astype(float)
        try:
            slope = float(np.polyfit(x, y, 1)[0])
        except Exception:
            slope = np.nan

    established = bool(len(ph_actual) >= ESTABLISHED_MIN_SEASONS and pd.notna(best_pos_pct)
                        and best_pos_pct <= ESTABLISHED_QUALITY_PCT)

    # self_n_seasons drives the self-history WEIGHT below, so it must reflect
    # seasons where we actually have a usable beat_ratio, not just any past season
    return dict(self_n_seasons=n_ratio, self_mean_beat_ratio=mean_beat, self_trend_slope=slope,
                self_mean_cv=mean_cv, self_last_actual_ppg=last_actual,
                self_best_actual_pos_pct=best_pos_pct, self_established=established)


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

    # is_injured/is_suspended are unknown (NaN) in 2023-2024 historical rows, so a
    # strict match against those seasons naturally fails and the relaxation
    # cascade below drops these filters when the pool gets too small.
    if match_injury and pd.notna(row.get('is_injured')):
        p = p[p['is_injured'] == row['is_injured']]
    if match_suspended and pd.notna(row.get('is_suspended')):
        p = p[p['is_suspended'] == row['is_suspended']]
    if match_new_team and pd.notna(row.get('new_team')):
        p = p[p['new_team'] == row['new_team']]
    return p


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
    base_pool = base_pool[base_pool['player_id'] != row['player_id']]
    base_pool = base_pool.dropna(subset=['beat_ratio'])   # excludes 2023 rows (no valid projection)

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
        comp_situation_matched=(match_tier == 0),
    )


def blend_expected_ppg(row, self_feat, comp_feat):
    """
    expected_ppg = projected_ppg * blended_ratio, where blended_ratio is a
    confidence-weighted mix of: the player's own historical beat-rate, the
    comp cohort's historical beat-rate, and the raw projection itself
    (ratio = 1.0, i.e. "trust the projection as given"). Each signal's
    weight is scaled down by how much of it is actually available, then
    the three are renormalized to sum to 1 -- so a rookie with no self
    history and a thin comp pool falls back almost entirely on the raw
    projection, while an established veteran with a deep comp pool leans
    on both history signals.
    """
    projected = row['projected_ppg']
    if pd.isna(projected):
        return np.nan, np.nan, 0.0, 0.0

    self_n = self_feat['self_n_seasons']
    self_ratio = self_feat['self_mean_beat_ratio']
    comp_n = comp_feat['comp_n']
    comp_ratio = comp_feat['comp_mean_beat_ratio']

    self_confidence = min(self_n, SELF_HISTORY_SEASON_CAP) / SELF_HISTORY_SEASON_CAP if self_n > 0 else 0.0
    if pd.isna(self_ratio):
        self_confidence = 0.0

    comp_confidence = min(comp_n / MIN_COMPS, 1.0) if comp_n > 0 else 0.0
    if pd.isna(comp_ratio):
        comp_confidence = 0.0

    w_self = WEIGHT_SELF_HISTORY * self_confidence
    w_comp = WEIGHT_COMP_COHORT * comp_confidence
    w_base = WEIGHT_RAW_PROJECTION   # the raw-projection signal is always available

    total_w = w_self + w_comp + w_base
    if total_w <= 0:
        blended_ratio = 1.0
    else:
        blended_ratio = (
            w_self * (self_ratio if pd.notna(self_ratio) else 1.0) +
            w_comp * (comp_ratio if pd.notna(comp_ratio) else 1.0) +
            w_base * 1.0
        ) / total_w

    return projected * blended_ratio, blended_ratio, (w_self / total_w if total_w > 0 else 0.0), \
        (w_comp / total_w if total_w > 0 else 0.0)


def analyze_player(row, hist_prior):
    # NOTE: self-history / comp-cohort blending is on pause for now -- expected_ppg
    # is just the given projected_ppg as-is. get_self_history/get_comp_cohort/
    # blend_expected_ppg are left in place below so this can be flipped back on
    # later by swapping the two lines under "TO RE-ENABLE" back in.
    out = dict(row)

    # --- TO RE-ENABLE the comp/self-history blend, swap this block back in: ---
    # self_feat = get_self_history(row['player_id'], hist_prior)
    # comp_feat = get_comp_cohort(row, hist_prior)
    # expected_ppg, blended_ratio, self_weight, comp_weight = blend_expected_ppg(row, self_feat, comp_feat)
    # out.update(self_feat)
    # out.update(comp_feat)
    # out['blended_ratio'] = blended_ratio
    # out['self_weight'] = self_weight
    # out['comp_weight'] = comp_weight

    out['expected_ppg'] = row['projected_ppg']
    out.setdefault('comp_n', np.nan)
    out.setdefault('comp_situation_matched', np.nan)
    out.setdefault('self_n_seasons', np.nan)
    out.setdefault('self_weight', np.nan)
    out.setdefault('comp_weight', np.nan)
    return out


# ------------------------------------------------------------------
# ROSTER-TIER STOCK ASSIGNMENT
# ------------------------------------------------------------------
def _soft_cutoff_rank(sorted_desc_ppg, nominal_rank, max_extend, gap_pct=GAP_THRESHOLD_PCT):
    """
    Given expected_ppg values sorted descending, return an adjusted 1-indexed,
    inclusive cutoff rank starting from `nominal_rank`: the boundary slides
    outward (includes more players) while the next player's expected PPG is
    within `gap_pct` of the current boundary player's, up to `max_extend`
    extra players. This is what lets e.g. QB 9-13 all land in the same tier
    when they're bunched tightly together.
    """
    n = len(sorted_desc_ppg)
    rank = min(max(nominal_rank, 0), n)
    if rank < 1:
        return rank
    extended = 0
    while rank < n and extended < max_extend:
        current_val = sorted_desc_ppg[rank - 1]
        next_val = sorted_desc_ppg[rank]
        if pd.isna(current_val) or pd.isna(next_val) or current_val <= 0:
            break
        gap = (current_val - next_val) / current_val
        if gap <= gap_pct:
            rank += 1
            extended += 1
        else:
            break
    return rank


def assign_position_tiers(pos_df, league_count):
    """
    pos_df: rows for a single position, with an 'expected_ppg' column.
    Returns pos_df with a 'stock' column added.
    """
    pos = pos_df['position'].iloc[0]
    ordered = pos_df.sort_values('expected_ppg', ascending=False, na_position='last')
    ppg_sorted = ordered['expected_ppg'].to_numpy()
    n = len(ordered)

    starter_count = round(league_count * STARTER_MULTIPLIER.get(pos, 1.0))
    average_extra = round(league_count * AVERAGE_EXTRA_MULTIPLIER.get(pos, 0.5))
    bench_extra = round(league_count * BENCH_EXTRA_MULTIPLIER.get(pos, 0.5))
    waiver_extra = round(league_count * WAIVER_EXTRA_MULTIPLIER.get(pos, 0.5))
    star_size = STAR_TIER_SIZE.get(pos, 3)

    # SUPERSTAR: starts at SUPERSTAR_BASE, can extend up to SUPERSTAR_MAX total
    c1 = _soft_cutoff_rank(ppg_sorted, SUPERSTAR_BASE, max_extend=SUPERSTAR_MAX - SUPERSTAR_BASE)
    # STAR: next `star_size` players after SUPERSTAR
    c2_nominal = max(c1 + star_size, c1)
    c2 = _soft_cutoff_rank(ppg_sorted, c2_nominal, max_extend=MAX_BOUNDARY_EXTEND)
    c2 = max(c2, c1)
    # STARTER: fills out the rest of the starting-caliber pool
    c3_nominal = max(starter_count, c2)
    c3 = _soft_cutoff_rank(ppg_sorted, c3_nominal, max_extend=MAX_BOUNDARY_EXTEND)
    c3 = max(c3, c2)
    # AVERAGE: flex-caliber extension
    c4_nominal = c3 + average_extra
    c4 = _soft_cutoff_rank(ppg_sorted, c4_nominal, max_extend=MAX_BOUNDARY_EXTEND)
    c4 = max(c4, c3)
    # BENCH: just missed starting caliber, tier 1
    c5_nominal = c4 + bench_extra
    c5 = _soft_cutoff_rank(ppg_sorted, c5_nominal, max_extend=MAX_BOUNDARY_EXTEND)
    c5 = max(c5, c4)
    # WAIVER: just missed starting caliber, tier 2
    c6_nominal = c5 + waiver_extra
    c6 = _soft_cutoff_rank(ppg_sorted, c6_nominal, max_extend=MAX_BOUNDARY_EXTEND)
    c6 = max(c6, c5)

    cutoffs = [c1, c2, c3, c4, c5, c6]
    labels = ['SUPERSTAR', 'STAR', 'STARTER', 'AVERAGE', 'BENCH', 'WAIVER']

    stocks = []
    for i in range(n):
        rank = i + 1
        assigned = 'AVOID'
        for cutoff, label in zip(cutoffs, labels):
            if rank <= cutoff:
                assigned = label
                break
        stocks.append(assigned)

    ordered = ordered.copy()
    ordered['stock'] = stocks
    return ordered


# ------------------------------------------------------------------
# MAIN PIPELINE
# ------------------------------------------------------------------
async def player_analyzer(year, league_count):
    df = analyze(year, league_count)

    players = []
    for row in df.itertuples():
        print(f"{row.full_name} - {row.stock}")
        players.append({
            "id": str(row.player_id),
            "stock": str(row.stock)
        })

    return {"players": players}


def analyze(year, league_count):
    """
    Run the full stock analysis for `year`, reading from DB_PATH and using the
    league-shape / weighting config at the top of this file. Returns a
    DataFrame with one row per player with draft_rank in
    [MIN_DRAFT_RANK, MAX_DRAFT_RANK], including their assigned stock tier.
    """
    players, preseason, postseason = load_data(DB_PATH)
    hist = build_history(players, preseason, postseason)
    hist_prior = hist[hist['season_year'] < year]

    target_pre = preseason[preseason['season_year'] == year].copy()
    if target_pre.empty:
        raise ValueError(f"No player_preseason rows found for season_year={year}")

    target_pre = target_pre.merge(players, on='player_id', how='left')

    target_pre = target_pre[
        (target_pre['draft_rank'] >= MIN_DRAFT_RANK) & (target_pre['draft_rank'] <= MAX_DRAFT_RANK)
    ].copy()
    if target_pre.empty:
        raise ValueError(f"No players with draft_rank in [{MIN_DRAFT_RANK}, {MAX_DRAFT_RANK}] "
                         f"found for season_year={year}")

    target_pre['adp_pos_pct'] = target_pre.groupby('position')['average_draft_position'] \
        .rank(pct=True, ascending=True)
    target_pre['proj_pos_pct'] = target_pre.groupby('position')['projected_ppg'] \
        .rank(pct=True, ascending=False)

    records = [analyze_player(row, hist_prior) for _, row in target_pre.iterrows()]
    result = pd.DataFrame(records)

    result = pd.concat(
        [assign_position_tiers(g, league_count) for _, g in result.groupby('position', group_keys=False)],
        ignore_index=True,
    )
    result['stock'] = pd.Categorical(result['stock'], categories=STOCK_ORDER, ordered=True)

    cols = ['player_id', 'full_name', 'position', 'age', 'experience', 'draft_rank',
            'average_draft_position', 'projected_ppg', 'expected_ppg',
            'comp_n', 'comp_situation_matched', 'self_n_seasons', 'self_weight', 'comp_weight',
            'stock']
    result = result[cols].sort_values(['position', 'stock', 'expected_ppg'],
                                       ascending=[True, True, False])
    return result


if __name__ == "__main__":
    df = analyze(YEAR, LEAGUE_COUNT)
    output_csv = f"player_stock_{YEAR}.csv"
    df.to_csv(output_csv, index=False)
    print(f"Wrote {len(df)} player rows to {output_csv}\n")
    print(df['stock'].value_counts().reindex(STOCK_ORDER))
    print()

    with pd.option_context('display.max_rows', None, 'display.max_colwidth', 60):
        print(df[['full_name', 'position', 'average_draft_position', 'projected_ppg', 'expected_ppg', 'stock']].to_string(index=False))