# Alistair’s Wildlands

Double-click `index.html` to play in a desktop browser. The game runs offline without installation or a server.

The first playable space is a safe camp. You begin with a weak rusty sword and practice against training dummies. Press Enter to open the travel map. Only weapons collected in the levels enter your inventory; gear, ammo, and potions carry forward.

The map has six separate, long levels. Fernwood Trail has log platforms and thorns; Amber Ridge has sandstone shelves and spikes; Moonstone Ruins has crystal towers and the Warden. The new Mirewood Bog has low boardwalks and tangled roots, Frostglass Pass climbs icy ledges, and Ember Citadel ends the journey with a tougher monster gauntlet. Each level has its own monster defeat goal and exit gate. Clear a level to unlock the next; press M to revisit the map. Chests and rest stops give supplies.

There are two weapon finds per level. Fernwood starts with a weak wooden club and pebble sling. Amber Ridge adds a reed bow and axe. Moonstone brings a non-damaging wind staff for escapes and, later, the pistol. Mirewood has a spore sprayer and shotgun; Frostglass has an ice pick and machine gun. The hammer and powerful single-shot gun arrive in the final level. Three sword upgrades add 18 damage each. Larger, tougher creatures resist knockback more strongly; melee weapons deliver stronger knockback than gunfire. The Warden leaps to raised routes, fires telegraphed volleys, charges, and becomes more dangerous below half health.

Spring pads launch you only when you land on them. Floor traps cannot strike through an overhead platform. Rest stops activate only when you touch them on the ground.

Move with A/D or left/right arrows. Space, W, or up arrow jumps, including a double jump. Release early for a shorter hop. Hold J to attack ahead or click to attack toward the mouse. I opens the inventory and pauses play. Select a bar and slot there, then click a collected weapon to assign it; closing the inventory resumes play. B switches between two seven-slot bars, and number keys 1–7 select a slot on the active bar. E uses a health potion, P pauses, M opens the map, and R restarts after victory or defeat.

On a phone, turn to landscape. Use the left and right buttons to move, swipe up to jump or double jump, tap the game to attack once, and hold to keep attacking. Drag from Attack to aim. Gear buttons cycle through collected weapons; Bar switches loadouts, and Pack opens the pausing inventory. Map leaves camp or opens the travel map; Pause stops the game. The phone layout fills the screen and accounts for display cutouts.

The sprites in `assets/starter-pack` and `assets/monsters` load locally. `make-monsters.js` regenerates the monster and obstacle PNGs using `@napi-rs/canvas`; this build dependency is not needed to play. `node test-game.js` runs gameplay checks. `render-preview.js` produces offscreen visual snapshots when supplied with the canvas library. The original chess project in the parent folder is unchanged.
