# Recuit simulé pour le placement

**Module id:** module02-07-sa-placement
**Lab:** sa-placement
**Tracks:** A (implémentation) · B (lab dans le navigateur)

## Slide 1 — Recuit simulé pour le placement

Pourquoi garder un mouvement qui aggrave les choses ? Une petite puce va vous le montrer. Six cellules y sont posées, reliées par des fils. Notre travail : déplacer les cellules pour raccourcir les fils.

## Slide 2 — Cellules et réseaux

Chaque cellule est un petit bloc de logique. Un placement dit où chaque cellule se trouve sur la puce. Nos cellules s'appellent de A à F. Des fils relient les cellules par groupes, appelés réseaux. Cette puce a six réseaux.

## Slide 3 — Mesurer un réseau avec une boîte

Dessinez la plus petite boîte autour des cellules d'un réseau. La largeur de la boîte plus sa hauteur mesure ce réseau. C'est proche de la vraie longueur des fils. Et c'est rapide à calculer. Cette mesure s'appelle la longueur de fil par demi-périmètre.

## Slide 4 — Cinquante-deux au départ

Au départ, quatre réseaux mesurent huit chacun. Le réseau qui relie A, B, C et D mesure seize. Le réseau de E et F mesure quatre. Additionnez : la longueur de fil est de cinquante-deux.

## Slide 5 — Descendre dans le brouillard

Un plan simple : déplacer une cellule un peu, et garder le mouvement seulement si les fils raccourcissent. C'est comme descendre une colline dans un épais brouillard. Vous n'avez pas de carte : vous sentez seulement la pente sous vos pieds. Vous vous arrêtez dans le premier creux que vous trouvez. Une vallée plus profonde est peut-être juste derrière la prochaine colline.

## Slide 6 — Parfois, monter

Le recuit simulé est plus audacieux : il garde parfois un mouvement qui aggrave les choses. Son nom vient du travail des métaux. Un forgeron refroidit lentement un métal chaud, pour que ses atomes se rangent en un ordre solide. Faites une pause et devinez : le premier mouvement allonge les fils de trois. On le garde, ou non ?

## Slide 7 — Un mouvement, de près

Parfois, et c'est un lancer de dé qui décide. Regardons ce premier mouvement, pas à pas.

## Slide 8 — Choisir, pousser, mesurer

Le recuit choisit une cellule au hasard : D. Il choisit une direction au hasard : vers la droite. Il choisit aussi un petit pas, au hasard. D sortirait de la puce, mais le mur l'arrête. Mesurons maintenant : les fils sont devenus plus longs de trois.

## Slide 9 — Pire ? Lancez le dé

Le mouvement est pire, donc le recuit lance un dé. La chance de garder ce mouvement est de trente-sept pour cent. Ce dé donne un nombre plus petit que un. Le dé affiche zéro virgule dix-sept. C'est en dessous de zéro virgule trente-sept. Le mouvement est donc accepté, et D reste contre le mur.

## Slide 10 — Un mouvement neutre

Au deuxième mouvement, D est de nouveau poussé contre le mur. Il ne peut pas aller plus loin, donc aucun fil ne change. Un mouvement qui n'est pas pire est toujours accepté, sans aucun dé. On l'appelle un mouvement neutre.

## Slide 11 — Ce qui fixe la chance

La chance dépend de deux choses. La première, c'est de combien le mouvement est pire. Au départ, un de plus en longueur donne soixante-douze pour cent. Trois de plus donnent trente-sept pour cent. Six de plus ne donnent que quatorze pour cent. La deuxième est un nombre appelé la température. Elle commence à trois.

## Slide 12 — Même mouvement, plus froid

La température baisse pendant l'exécution. Plus tard, elle est descendue à un virgule quatre. D est de nouveau poussé contre un mur, et les fils s'allongent de trois. Faites une pause et devinez : la chance est-elle plus grande, plus petite ou la même qu'avant ?

## Slide 13 — Plus petite : douze pour cent

Plus petite : seulement douze pour cent. Le dé affiche zéro virgule zéro neuf, donc le mouvement passe quand même. Quelle chance ! Les fils atteignent cinquante-huit virgule six, le plus long de toute cette exécution.

## Slide 14 — Du chaud au froid

La température baisse un peu après chaque mouvement. Elle commence à trois, et finit près de zéro virgule zéro sept. Comme le métal du forgeron, l'exécution refroidit lentement. Chaud veut dire audacieux : beaucoup de mouvements pires passent. Froid veut dire difficile : les mouvements pires ne passent presque jamais.

## Slide 15 — Soixante mouvements

Regardez maintenant le reste des soixante mouvements. Tant qu'il fait chaud, les fils restent longs. En refroidissant, ils raccourcissent. Au mouvement quarante-cinq, ils atteignent quarante-neuf virgule six.

## Slide 16 — Le dernier mouvement

Le tout dernier mouvement pousse A contre un mur : de nouveau trois de plus. Il fait froid maintenant, sous zéro virgule un. La chance est nulle, donc le mouvement est refusé.

## Slide 17 — Accepté n'est pas un progrès

Au total, quarante-quatre mouvements ont été acceptés, et seize ont été refusés. Mais seulement onze mouvements acceptés ont raccourci les fils. Neuf les ont allongés. Vingt-quatre étaient des mouvements neutres. Accepté ne veut pas dire meilleur.

## Slide 18 — Dernier ou meilleur ?

Faites une pause et devinez : après soixante mouvements, les derniers fils sont-ils aussi les plus courts de l'exécution ?

## Slide 19 — Oui, cette fois

Cette fois, oui. Après le mouvement quarante-cinq, rien ne bat quarante-neuf virgule six. Rien ne l'aggrave non plus. Mais c'est de la chance. Chaque choix aléatoire vient d'une graine : un nombre qui fixe tous les lancers de dé. Notre exécution utilise la graine quarante-deux.

## Slide 20 — Graine cent quatre-vingt-dix-neuf

La graine cent quatre-vingt-dix-neuf raconte une autre histoire. Ses fils montent au-dessus de soixante dès le début. Ils ne repassent jamais sous le départ, cinquante-deux. L'exécution se termine à cinquante-trois virgule neuf, pire qu'au début.

## Slide 21 — Graine cent soixante-deux

La graine cent soixante-deux fait beaucoup mieux. Au mouvement cinquante-neuf, elle atteint vingt-sept virgule huit. Puis le dernier mouvement allonge un peu les fils. Le dé le laisse passer. L'exécution se termine à vingt-sept virgule neuf.

## Slide 22 — Garder le meilleur

Alors le recuit garde une copie du meilleur placement qu'il a vu. À la fin, il rend cette copie, pas le dernier placement. Garder cette copie ne coûte presque rien. La graine cent soixante-deux rend vingt-sept virgule huit. La graine cent quatre-vingt-dix-neuf rend le départ.

## Slide 23 — Quarante-deux est-il typique ?

Notre graine, quarante-deux, a rendu quarante-neuf virgule six. Faites une pause et devinez : est-ce un résultat typique ?

## Slide 24 — Une graine, une histoire

Pas du tout : c'est l'un des pires. Nous avons lancé deux cents graines, avec soixante mouvements chacune. La meilleure longueur de fil va de treize virgule sept à cinquante-deux. Le résultat du milieu est d'environ trente-six. Cent quatre-vingt-dix-sept graines battent la graine quarante-deux. Jugez donc une méthode aléatoire sur beaucoup d'exécutions, pas sur une seule.

## Slide 25 — Trois cents mouvements

Donnons maintenant trois cents mouvements à la graine quarante-deux, au lieu de soixante. Les soixante premiers mouvements sont les mêmes, car la graine est la même. Puis les fils continuent de raccourcir, jusqu'à deux virgule six.

## Slide 26 — Ce que le coût ne sait pas

Regardez la puce : les cellules sont les unes sur les autres. De vraies cellules ne peuvent pas se chevaucher. Mais notre coût ne mesure que les fils. Rien dedans ne dit que les cellules ont besoin de leur propre place. Pour le coût, un tas de cellules paraît parfait.

## Slide 27 — Toutes les cellules bougent

Sur une vraie puce, A et D seraient des plots : des portes fixes vers le monde extérieur. Dans ce lab, toutes les cellules bougent, même A et D. Figer les plots est une règle pour un autre lab.

## Slide 28 — À retenir

Un mouvement pire ne passe que si le dé le permet. Le froid rend le dé strict. Accepté ne veut pas dire meilleur. Gardez le meilleur placement, pas le dernier. Une graine, c'est une histoire. Et le coût ne connaît que ce qu'il mesure.

## Slide 29 — À vous

Dans le lab du navigateur, lancez la graine quarante-deux avec soixante mouvements. Vous devez obtenir quarante-neuf virgule six, avec quarante-quatre mouvements acceptés et seize refusés. Le vérificateur Python lance les mêmes dés, donc il donne les mêmes nombres. Ensuite, faites glisser vous-même les cellules, et essayez de battre le recuit. Faites une pause et devinez : comment le coût pourrait-il empêcher les cellules de s'empiler ?
