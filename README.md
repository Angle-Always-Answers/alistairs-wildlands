# Alistair’s Wildlands

Double-click `index.html` to play in a desktop browser. The game runs offline without installation or a server.

The first playable space is a safe camp. You begin with a weak rusty sword and can walk over loaner weapons to test them against training dummies. Only weapons you pick up appear in the bottom inventory. Press Enter to leave camp and open the travel map. Loaner gear stays in camp; weapons, ammo, and potions found in levels carry forward.

The map has three separate, long levels. Fernwood Trail has log platforms, thorns, and woodland monsters. Amber Ridge has sandstone shelves, spike beds, and desert creatures. Moonstone Ruins has high crystal routes, timed crystal traps, and the Moonstone Warden. Each level has its own monster defeat goal and exit gate. Clear a level to unlock the next; press M from a level to revisit the map. Chests and rest stops give extra supplies.

Weapons arrive in stages and are spaced farther along each level: start with the rusty sword, find the pistol and axe in Fernwood, machine gun and shotgun in Amber Ridge, then the powerful single-shot gun and hammer in Moonstone. Two sword upgrades are hidden on raised routes; each adds 18 damage. The late hammer deals 82 damage, while tougher late enemies and the Warden require repeated hits. Eight regular monster types have distinct sprites and movement. Larger, tougher creatures resist knockback more strongly; melee weapons deliver stronger knockback than gunfire. The Warden has a separate health bar, leaps up to raised routes, fires telegraphed crystal volleys, and charges nearby players. Below half health it speeds up and adds a telegraphed crystal nova.

Spring pads launch you only when you land on them. Floor traps cannot strike through an overhead platform. Rest stops activate only when you touch them on the ground.

Move with A/D or left/right arrows. Space, W, or up arrow jumps, including a double jump. Release early for a shorter hop. Hold J to attack ahead or click to attack toward the mouse, including with melee weapons. Number keys select the corresponding collected weapon in the hotbar; clicking an item works too. E uses a health potion, P pauses, M opens the map, and R restarts after victory or defeat. The pistol fires slowly with no spread; faster guns are less accurate.

On a phone, turn to landscape. Use the left and right touch buttons to move, Jump and Heal on the right, and hold Attack to fire or swing. Drag from Attack to aim. Gear buttons cycle through weapons you have collected. The Map button leaves the practice camp or opens the travel map; Pause stops the game. The phone layout fills the screen and accounts for display cutouts.

The sprites in `assets/starter-pack` and `assets/monsters` load locally. `make-monsters.js` regenerates the monster and obstacle PNGs using `@napi-rs/canvas`; this build dependency is not needed to play. `node test-game.js` runs gameplay checks. `render-preview.js` produces offscreen visual snapshots when supplied with the canvas library. The original chess project in the parent folder is unchanged.
