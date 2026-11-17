# Simulated annealing placement

**Module id:** module02-07-sa-placement
**Lab:** sa-placement
**Tracks:** A (implement) · B (browser lab)

## Slide 1 — Simulated annealing placement

Why would anyone keep a move that makes things worse? A small chip will show you why. Six cells sit on it, joined by wires. Our job is to move the cells so the wires get shorter.

## Slide 2 — Cells and nets

Each cell is a small block of logic. A placement says where each cell sits on the chip. Our cells are named A to F. Wires join the cells in groups, called nets. This chip has six nets.

## Slide 3 — Measure a net with a box

Draw the smallest box around the cells of one net. The box's width plus its height measures that net. It is close to the real length of the wires. And it is quick to compute. This measure is called the half-perimeter wirelength.

## Slide 4 — Fifty-two to start

At the start, four nets measure eight each. The net joining A, B, C and D measures sixteen. The net of E and F measures four. Add them up: the wirelength is fifty-two.

## Slide 5 — Walking downhill in fog

A simple plan: move one cell a little, and keep the move only if the wires get shorter. That is like walking downhill in thick fog. You have no map: you only feel the slope under your feet. You stop in the first dip you find. A deeper valley may be just behind the next hill.

## Slide 6 — Sometimes, go uphill

Simulated annealing is braver: it sometimes keeps a move that makes things worse. Its name comes from metal work. A smith cools hot metal slowly, so its atoms settle into a strong order. Pause and guess: the first move makes the wires three longer. Keep it, or not?

## Slide 7 — One move, up close

Sometimes, and a dice roll decides. Let's watch that first move, step by step.

## Slide 8 — Pick, push, measure

The annealer picks a cell at random: D. It picks a direction at random: to the right. It picks a small step, also at random. D would leave the chip, but the wall stops it. Now measure: the wires got three longer.

## Slide 9 — Worse? Roll the dice

The move is worse, so the annealer rolls a dice. The chance to keep this move is thirty-seven percent. This dice gives a number smaller than one. The dice shows zero point one seven. That is below zero point three seven. So the move is accepted, and D stays against the wall.

## Slide 10 — A free move

In the second move, D is pushed against the wall again. It cannot go further, so no wire changes. A move that is not worse is always accepted, with no dice at all. We call it a free move.

## Slide 11 — What sets the chance

The chance depends on two things. The first is how much worse the move is. At the start, one longer gets seventy-two percent. Three longer gets thirty-seven percent. Six longer gets only fourteen percent. The second thing is a number called the temperature. It starts at three.

## Slide 12 — Same move, colder

The temperature falls during the run. Later in the run, it is down to one point four. D is pushed into a wall again, and the wires get three longer. Pause and guess: is the chance bigger, smaller, or the same as before?

## Slide 13 — Smaller: twelve percent

Smaller: only twelve percent. The dice shows zero point zero nine, so the move still passes. Lucky! The wires reach fifty-eight point six, the longest of this whole run.

## Slide 14 — From hot to cold

The temperature drops a little after every move. It starts at three, and ends near zero point zero seven. Like the smith's metal, the run cools slowly. Hot means brave: many worse moves pass. Cold means picky: worse moves almost never pass.

## Slide 15 — Sixty moves

Now watch the rest of the sixty moves. While it is warm, the wires stay long. As it cools, they shrink. At move forty-five, they reach forty-nine point six.

## Slide 16 — The last move

The very last move pushes A into a wall: three longer again. It is cold now, below zero point one. The chance is zero, so the move is rejected.

## Slide 17 — Accepted is not progress

In total, forty-four moves were accepted, and sixteen were rejected. But only eleven accepted moves made the wires shorter. Nine made them longer. Twenty-four were free moves. Accepted does not mean better.

## Slide 18 — Last or best?

Pause and guess: after sixty moves, are the last wires also the shortest of the run?

## Slide 19 — Yes, this time

This time, yes. After move forty-five, nothing beats forty-nine point six. Nothing makes it worse, either. But that is luck. Every random choice comes from a seed: a number that fixes all the dice rolls. Our run uses seed forty-two.

## Slide 20 — Seed one hundred ninety-nine

Seed one hundred ninety-nine tells another story. Its wires climb above sixty early on. They never get back below the start of fifty-two. The run ends at fifty-three point nine, worse than where it began.

## Slide 21 — Seed one hundred sixty-two

Seed one hundred sixty-two does much better. At move fifty-nine, it reaches twenty-seven point eight. Then the last move makes the wires a little longer. The dice lets it pass. The run ends at twenty-seven point nine.

## Slide 22 — Keep the best

So the annealer keeps a copy of the best placement it has seen. At the end, it returns that copy, not the last placement. Keeping that copy costs almost nothing. Seed one hundred sixty-two returns twenty-seven point eight. Seed one hundred ninety-nine returns the start.

## Slide 23 — Is forty-two typical?

Our seed, forty-two, returned forty-nine point six. Pause and guess: is that a typical result?

## Slide 24 — One seed, one story

Not at all: it is one of the worst. We ran two hundred seeds, with sixty moves each. The best wirelength goes from thirteen point seven to fifty-two. The middle result is about thirty-six. One hundred ninety-seven seeds beat seed forty-two. So judge a random method by many runs, not by one.

## Slide 25 — Three hundred moves

Now give seed forty-two three hundred moves instead of sixty. The first sixty moves are the same, because the seed is the same. Then the wires keep shrinking, down to two point six.

## Slide 26 — What the cost does not know

Look at the chip: the cells sit on top of each other. Real cells cannot overlap. But our cost only measures wires. Nothing in it says that cells need their own space. To the cost, a pile of cells looks perfect.

## Slide 27 — Every cell moves

On a real chip, A and D would be pads: fixed doors to the outside world. In this lab, every cell moves, even A and D. Freezing the pads is a rule for another lab.

## Slide 28 — Remember

A worse move passes only when the dice allows it. Cold makes the dice strict. Accepted does not mean better. Keep the best placement, not the last one. One seed is one story. And the cost only knows what it measures.

## Slide 29 — Your turn

In the browser lab, run seed forty-two with sixty moves. You should get forty-nine point six, with forty-four moves accepted and sixteen rejected. The Python checker rolls the same dice, so it gives the same numbers. Then drag the cells yourself, and try to beat the annealer. Pause and guess: how could the cost stop cells from piling up?
