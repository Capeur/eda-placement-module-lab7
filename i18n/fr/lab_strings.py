"""French text for the Lab 07 browser lab (simulated annealing placement), except the strings module.

Every word the tool shows lives in platform/tools/sa-placement/sa-placement-strings.js. Its French copy is
i18n/fr/sa-placement-strings.js: build_site.py puts it in docs/fr/tools/sa-placement/ in place of the English file,
after checking that both have the same keys and functions (tools/strings_shape.mjs).

What is left here are exact (file, English snippet, French text) replacements for the page of the lab
(index.html) and for the shared challenge chrome (assets/clustering-ui.js). If a snippet is no longer found
(the lab or the shared file changed in eda-learning), the build stops, so a half-translated lab is never published.

Paths are relative to docs/fr/. Challenge ids, CSS classes, cell names (A-F) and numbers stay as they are.
Vocabulary: placement, recuit simulé (simulated annealing), cellule (cell), réseau (net), longueur de fil (wirelength),
mouvement (move), accepté / refusé (accepted / rejected), meilleur / pire / neutre (better / worse / free),
dé (dice), température, graine (seed), mur (wall), départ (starter).
"""

LAB = "tools/sa-placement/"
UI = "assets/clustering-ui.js"

STRINGS = [
    # ---------------- page (index.html) ----------------
    (LAB + "index.html", '<html lang="en">', '<html lang="fr">'),
    (LAB + "index.html", "<title>SA placement — EDA Algorithms Platform</title>",
     "<title>Placement par recuit simulé — EDA Algorithms Platform</title>"),
    (LAB + "index.html", ">Skip to content<", ">Aller au contenu<"),
    (LAB + "index.html", '<div class="eyebrow">Interactive tool</div>', '<div class="eyebrow">Outil interactif</div>'),
    (LAB + "index.html", "<h1>SA placement</h1>", "<h1>Placement par recuit simulé</h1>"),
    (LAB + "index.html",
     "Move six cells by hand, or let simulated annealing move them: worse moves pass when the dice says yes, and the run returns the best placement it saw.",
     "Déplacez six cellules à la main, ou laissez le recuit simulé les déplacer : les mouvements pires passent quand le dé dit oui, et l'exécution rend le meilleur placement qu'elle a vu."),

    # ---------------- shared challenge chrome (clustering-ui.js) ----------------
    (UI, 'statusText: "Idle"', 'statusText: "En attente"'),
    (UI, '"Challenge armed — act, then Check"', '"Défi lancé : agissez, puis Vérifier"'),
    (UI, '"Starter loaded (reference)"', '"Exemple de départ chargé (référence)"'),
    (UI, '"Load a challenge with Start"', '"Lancez un défi avec Commencer"'),
    (UI, 'setStatus("pass", "PASS")', 'setStatus("pass", "RÉUSSI")'),
    (UI, '"Not yet — try again or show hint"', '"Pas encore : réessayez ou affichez l\'indice"'),
    (UI, '"Load starter example"', '"Charger l\'exemple de départ"'),
    (UI, "<h2>Challenges</h2>", "<h2>Défis</h2>"),
    (UI, "${challenges.length} cleared</span>", "${challenges.length} réussis</span>"),
    (UI, '<label for="lab-chal-sel">Pick one</label>', '<label for="lab-chal-sel">Choisir</label>'),
    (UI, '"Pick a challenge and click <strong>Start</strong>. The starter example above stays available as a reference — reload it anytime."',
     '"Choisissez un défi et cliquez sur <strong>Commencer</strong>. L\'exemple de départ reste disponible comme référence : rechargez-le quand vous voulez."'),
    (UI, "<strong>Hint:</strong>", "<strong>Indice :</strong>"),
    (UI, '"Restart" : "Start"', '"Recommencer" : "Commencer"'),
    (UI, '"Hide hint" : "Show hint"', '"Masquer l\'indice" : "Afficher l\'indice"'),
    (UI, '"disabled"}>Check</button>', '"disabled"}>Vérifier</button>'),
    (UI, ">Next challenge</button>", ">Défi suivant</button>"),
    (UI, ">Stop checking</button>", ">Arrêter le défi</button>"),
    (UI, 'el("h2", { text: "Graph" })', 'el("h2", { text: "Graphe" })'),
    (UI, 'el("h2", { text: "Reference / metrics" })', 'el("h2", { text: "Travail et mesures" })'),

]
