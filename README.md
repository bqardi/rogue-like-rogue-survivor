# Rogue Survivor
A Rogue like game called Rogue Survivor

### Short explanation
The idea for this game is that you have this character that you can move around (with W, A, S, D or the arrow keys on the keyboard) in a grid (dynamically created. Everything is intended to be dynamic).
If you move outside the grid edges you will move your character to the "next zone". The size of this entire region is also created dynamically.
Loot, as well as enemies and obstacles, are placed randomly around the entire world. Dungeon entrances are also placed randomly.

#### Collectable items (loot)
To pick up loot, just walk over the tile with the loot
UPDATE: Chests added with their own inventory and collecting the items inside the chests, will transfer them to the players inventory.
- Coins (adds to your total amount of money/gold)
- Health potions (adds to your life/health) UPDATE: Now added to inventory.
- Armor (adds to your armor/shield) UPDATE: Now added to inventory.
- Weapons (adds to your strength) UPDATE: Now added to inventory.
- Keys (Intended to open up for Dungeons (see below), but other usecases can be added) UPDATE: Now added to inventory.
- NEW: Gems (red, blue and green) used for spell upgrades
- NEW: Pouch that contains random loot (like chests, but carriably in inventory)
- NEW: Wood (collected from trees only)
- NEW: Stone (collected from rocks only)
- NEW: Iron (collected from rocks only)
- NEW: Wood (can't be collected yet)
- More to come...

#### Player
CURRENTLY:
- Add spells to learn (for many things, such as shoot an enemy with a fireball or heal the player or maybe even teleportation skills. (limited only by imagination) (DONE)
SPELLS:
- Fireball (Damages targets with fire damage and sets burning status (damage over time) on targets)
- Ice Nova (Damages targets surrounding you. TODO: set freeze status on targets)
- Dome Shield (Create a magic shield that protects against all types of damage)
- Teleport (teleports you to a tile of your choice)

TODO (?):
- Add bow and arrows (to shoot enemies from a distance)
- Collecting specific keys for specific doors/dungeon entrances (currently any key will open any dungeon). This is a definite maybe, since I would also have to change the UI for this to work

#### Enemies
CURRENTLY:
- Skeletons (fast and weak)
- Orcs (slow but strong)
- Goblins (fast, weak and steals money)

BOSS:
- NEW Fire elemental (very strong. Shoots FIREBALLS and heals from FIRE, but takes increased damage from ICE)

TODO:
- Bosses (stronger and faster than normal enemy units, and have special skills)
- Mages (can cast magic spells like fireball/firewall/frost nova/teleport/invicibility/protection/etc.)
- Skeleton archers (or other archers for that matter)
- Imps
- Ghosts
- Aaahrgh, what else? Hmm...
- Vampires
- Snakes
- Vultures
- Thieves
- Giant rats
- Pigs (innocent little creatures that can be slaughtered for fun! HAHAHAHA)
- Ghouls
- Zombies

#### Dungeons
These dungeons are accessed only if you have found a key, and they will give you access to a specific dungeon/maze/cave/lair/whatever, where you can find a lot of loot and a strong end-of-level boss.

CURRENTLY:
- The player now transitions to a new region with its own tileset (floor) and layout based on the region class (pillar- and barrel-obstacles).
- The player is respawned at the entrance to the gate (dungeons/home/etc.), when entering and then returning.

TODO:
- Creating a more maze like environment (with walls/hallways/doors/etc.)
- End-of-level boss(es)

#### Obstacles
- Trees (different sprites based on biom)
- Rocks (different sprites based on biom)
- Pillars (Only in dungeons)
- Barrels (Only in dungeons)
- More to come(?)...

#### Battle system
Currently the battle system is very basic and simple. It is created as a turn-based system, but only when enemies are present. In the following, character refers to both the player and the enemy. This is because both the Player class and the Enemy class inherits from Character class and therefore have shared properties, which makes it possible to create this dynamic battle system.
CURRENTLY:
- Turn based system (basics UPDATE: a little more advanced now)
- Randomly choose the starting character
- One action per turn, per character (UPDATE: each character (including the player), now has multiple (individual amounts) action points to spend for either moving or attacking.
- Can attack opponent character (by moving into their tile), giving damage based on attacking characters strength (UPDATE: damage is now also based on the weapon equipped and if primary or secondary attack is chosen).
- Enemy AI tracks the player and moves towards the player one tile at a time
- UI for the turn based system (FIXED)
- Improving AI (especially so they don't move through obstacles (trees/rocks...), as they currently do) (FIXED)
- Implemented the Breadth-First Search algorithm (this was simpler for me to understand in contrast to the popular A* algorithm) to get enemies to steer around obstacles, and still move towards (or chase, if you will) the player.
- Possibility for escaping the battle (maybe if you are worried that you can't win the battle or just don't want to fight(?)) (IMPLEMENTED)

TODO:
- Choose the starting character based on some swiftness or speed parameter. Random if same value is shared between multiple characters
- Possibility for evading attacks
- Overall creating a story so the game has a purpose :smiley: (I now have a small story in mind, it's not much, but can grow as the game development progresses. The main story is something like, starting the game with a boss fight, and the boss WILL defeat you and steal some vital item of yours (don't know what exactly yet), and then he takes of and the main goal of the game would be to hunt him down and kill him and get your item back. But while searching for him you must make your character stronger, so you can actually defeat him, when you find him).

#### Other things
CURRENTLY:
- Created an inventory system, so collected items are placed in the inventory.
- The player can choose what to use/wear/drop/destroy/etc. from the inventory. (currently, only use and wear are implemented).
- Daytime cycle (making the environment darker at nighttime)
- Torches (to light up the area around the player when in dark areas, such as at night or inside a dungeon)
- Double inventory or two inventories displayed at the same time. This is necessary for the ability to trade with a merchant, so the player can transfer items between the two inventories (buy/sell). (DONE, changes between inventories with a button)
- Merchants added so you can buy/sell loot. Merchants can also hold/give quests.
- An advanced quest system created, with quest chains, multiple dialog sequences (show next dialog sequence with the next button)
- Quest overview window to track your quests (now with a sorting function, to sort between ALL / NOT COMPLETED / COMPLETED)
- Crafting feature(?). Also a very big MAYBE! Ability to collect wood from trees / stone from mining rocks (and possibly a small chance to collect gems of sorts) / collecting different items to use for crafting weapons and armor (and maybe other things like tools/chests for storage/traps maybe/glass to store health potions) (So, currently you can only gather resources (wood, stone, iron), but the plan is to create a simple crafting system so crafting weapons/tools/player chests/stations for more advanced crafting/etc. are possible)

TODO (?):
- Maybe even creating switches in dungeons to switch on light
- Adding NPC's to interact with (quest-givers/merchants/???)
- Survival feature(?). This is a very big MAYBE, since this is a major feature to implement and most likely I won't be implementing it, but for future reference I've added it and maybe I will implement...

I'm dreaming big here, but the things I am listing in this readme is, only meant as a brainstorming sheet, that I can come back to and maybe implement if I want to (some, of course, are required)
