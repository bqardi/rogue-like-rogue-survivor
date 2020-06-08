# Rogue Survivor
A Rogue like game called Rogue Survivor

### Short explanation
The idea for this game is that you have this character that you can move around (with W, A, S, D or the arrow keys on the keyboard) in a grid (dynamically created. Everything is intended to be dynamic).
If you move outside the grid edges you will move your character to the "next zone". The size of this entire region is also created dynamically.
Loot is placed randomly around the entire world as well as enemies and obstacles. Dungeon entrances are also placed randomly.

#### Collectable items (loot)
To pick up loot, just walk over the tile with the loot
- Coins (adds to your total amount of money/gold)
- Health potions (adds to your life/health)
- Armor (adds to your armor/shield)
- Weapons (adds to your strength)
- Keys (Intended to open up for Dungeons (see below), but other usecases can be added)
- More to come...

#### Player
TODO (?):
- Add bow and arrows (to shoot enemies from a distance)
- Add spells to learn (for many things, such as shoot an enemy with a fireball or heal the player or maybe even teleportation skills. (limited only by imagination)
- Collecting specific keys for specific doors/dungeon entrances (currently any key will open any dungeon). This is a definite maybe, since I would also have to change the UI for this to work

#### Enemies
- Skeletons (fast and weak)
- Orcs (slow but strong)
- More to come...

#### Dungeons
These dungeons are accessed only if you have found a key, and they will give you access to a specific dungeon/maze/cave/lair/whatever, where you can find a lot of loot and a strong end-of-level boss.
TODO:
- Currently, when you open a dungeon, nothing will happen. The plan is to transition the player to a new region with its own tileset and layout based on the region class.
- Creating a more maze like environment (with walls/hallways/doors/etc.)
- End-of-level boss(es)

#### Obstacles
- Trees (different sprites based on biom)
- Rocks
- More to come(?)...

#### Battle system
Currently the battle system is very basic and simple. It is created as a turn-based system, but only when enemies are present. In the following, character refers to both the player and the enemy. This is because both the Player class and the Enemy class inherits from Character class and therefore have shared properties, which makes it possible to create this dynamic battle system.
CURRENTLY:
- Turn based system (basics)
- Randomly choose the starting character
- One action per turn, per character
- Can attack opponent character (by moving into their tile), giving damage based on attacking characters strength
- Enemy AI tracks the player and moves towards the player one tile at a time

TODO:
- UI for the turn based system
- Choose the starting character based on some swiftness or speed parameter. Random if same value is shared between multiple characters
- Possibility for escaping the battle (maybe if you are worried that you can't win the battle or just don't want to fight(?))
- Possibility for evading attacks
- Improving AI (especially so they don't move through obstacles (trees/rocks...), as they currently do)
- Overall creating a story so the game has a purpose :smiley:

#### Other things
TODO (?):
- Daytime cycle (making the environment darker at nighttime)
- Torches (to light up the area around the player when in dark areas, such as at night or inside a dungeon)
- Maybe even creating switches in dungeons to switch on light
