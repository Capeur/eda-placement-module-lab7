#!/usr/bin/env python3
"""Stage 5: every number of the Chinese transcript (written in digits) must be said in words in the English and in the
French transcript of the same slide. Words are generated (not parsed): 49.6 -> "forty-nine point six" /
"quarante-neuf virgule six"; 0.17 -> "zero point one seven" / "zéro virgule dix-sept".

    python3 stage5_numbers.py <eda-learning clone> <site repo>
"""
import re, sys
from pathlib import Path

clone, site = Path(sys.argv[1]), Path(sys.argv[2])
M = "module02-07-sa-placement"
EN = (clone / "courses/learn_placement" / M / "transcript.md").read_text(encoding="utf-8")
FR = (site / "i18n/fr" / M / "transcript.md").read_text(encoding="utf-8")
ZH = (site / "i18n/zh" / M / "transcript.md").read_text(encoding="utf-8")

U_EN = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
T_EN = {2: "twenty", 3: "thirty", 4: "forty", 5: "fifty", 6: "sixty", 7: "seventy", 8: "eighty", 9: "ninety"}
U_FR = "zéro un deux trois quatre cinq six sept huit neuf dix onze douze treize quatorze quinze seize".split()


def en(n):
    if n < 20:
        return U_EN[n]
    if n < 100:
        return T_EN[n // 10] + ("-" + U_EN[n % 10] if n % 10 else "")
    return U_EN[n // 100] + " hundred" + (" " + en(n % 100) if n % 100 else "")


def fr(n, final=True):
    if n <= 16:
        return U_FR[n]
    if n < 20:
        return "dix-" + U_FR[n - 10]
    if n < 70:
        t = {2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante"}[n // 10]
        u = n % 10
        return t if u == 0 else t + (" et un" if u == 1 and n // 10 != 8 else "-" + U_FR[u])
    if n < 80:
        return "soixante-" + (" et onze" if n == 71 else fr(n - 60))
    if n < 100:
        r = n - 80
        return "quatre-vingts" if r == 0 and final else "quatre-vingt" + ("" if r == 0 else "-" + fr(r))
    h = n // 100
    head = "cent" if h == 1 else U_FR[h] + " cent"
    r = n % 100
    return head + ("s" if h > 1 and r == 0 and final else "") + ("" if r == 0 else " " + fr(r, final))


def words(x, lang):
    if "." not in x:
        return (en if lang == "en" else fr)(int(x))
    a, b = x.split(".")
    pt = "point" if lang == "en" else "virgule"
    if lang == "en" or len(b) == 1 or b[0] == "0":
        digs = " ".join((U_EN if lang == "en" else U_FR)[int(c)] for c in b)
    else:
        digs = fr(int(b))
    return f"{words(a, lang)} {pt} {digs}"


def bodies(text):
    out = {}
    for m in re.finditer(r"^## Slide (\d+) — .*?\n(.*?)(?=^## Slide |\Z)", text, flags=re.S | re.M):
        out[int(m.group(1))] = m.group(2)
    return out


b_en, b_fr, b_zh = bodies(EN), bodies(FR), bodies(ZH)
bad = n_checked = 0
for n in sorted(b_zh):
    nums = re.findall(r"\d+(?:\.\d+)?", b_zh[n])
    en_t, fr_t = b_en[n].lower().replace("’", "'"), b_fr[n].lower()
    for x in nums:
        n_checked += 1
        for lang, t in (("en", en_t), ("fr", fr_t)):
            w = words(x, lang).lower()
            if w not in t:
                bad += 1
                print(f"slide {n}: ZH has {x}; {lang} text lacks '{w}'")
    # the other way: no digit in EN or FR
    for lang, t in (("en", b_en[n]), ("fr", b_fr[n])):
        if re.search(r"\d", t):
            bad += 1
            print(f"slide {n}: digits in the {lang} text")
print(f"{n_checked} numbers of the Chinese transcript found in words in EN and FR, {bad} problem(s)")
sys.exit(1 if bad else 0)
