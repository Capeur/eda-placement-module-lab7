"""A correct learner-style implementation of the module's three functions (independent of the checker's code).
Used in Stage 2 to prove that `sa_place_check.py --impl` passes a right answer; the files in
examples/wrong/ are this file with ONE rule changed (see make_wrong.py)."""
import math


def mulberry32(seed):
    a = seed & 0xFFFFFFFF

    def rand():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = (a ^ (a >> 15)) * (1 | a) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (61 | t) & 0xFFFFFFFF) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return rand


def total_hpwl(nets, positions):
    total = 0.0
    for net in nets:
        xs = [positions[c]["x"] for c in net]
        ys = [positions[c]["y"] for c in net]
        total += (max(xs) - min(xs)) + (max(ys) - min(ys))
    return total


def sa_place(positions, cells, nets, *, moves=60, t0=3.0, cool=0.94, step=1.0, seed=42):
    rand = mulberry32(seed)
    pos = {c: dict(p) for c, p in positions.items()}
    cur = total_hpwl(nets, pos)
    best, best_pos = cur, {c: dict(p) for c, p in pos.items()}
    T, accepted, rejected = t0, 0, 0
    for _ in range(moves):
        cell = cells[int(rand() * len(cells))]
        axis = "x" if rand() < 0.5 else "y"
        sign = -1 if rand() < 0.5 else 1
        size = step * (0.5 + rand())
        trial = {c: dict(p) for c, p in pos.items()}
        trial[cell][axis] += sign * size
        for k in ("x", "y"):
            trial[cell][k] = max(-1.0, min(9.0, trial[cell][k]))
        new = total_hpwl(nets, trial)
        delta = new - cur
        if delta <= 0 or rand() < math.exp(-delta / T):
            pos, cur = trial, new
            accepted += 1
            if cur < best:
                best, best_pos = cur, {c: dict(p) for c, p in pos.items()}
        else:
            rejected += 1
        T *= cool
    return {"positions": best_pos, "hpwl": best, "accepted": accepted, "rejected": rejected, "final_hpwl": cur}
