'use strict';
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const mobileHud = document.querySelector('#mobile-hud');
const W = 1100, H = 700, LEVEL_LENGTH = 4800, FLOOR = 570;
const keys = new Set();
const mouse = {x:600, y:300, down:false};
let activeAimPointer=null,mobileAim=null,canvasTouch=null,laserHeld=false;
const touchGestures=new Map();
const weapons = [
  {name:'RUSTY SWORD', damage:18, range:108, cool:.52, duration:.38, kind:'thrust', color:'#c7edf0', tip:'Starter sword · 18 damage. Find upgrades in the levels.'},
  {name:'PISTOL', damage:30, cool:.48, spread:0, gun:true, color:'#f6d086', tip:'Slow and perfectly accurate'},
  {name:'HAMMER', damage:82, range:86, cool:1.1, duration:.85, kind:'slam', color:'#caa4fa', tip:'Heavy ground smash · 82 damage'},
  {name:'AXE', damage:30, range:100, cool:.62, duration:.52, kind:'sweep', color:'#f0b275', tip:'Wide sweeping chop · 30 damage'},
  {name:'MACHINE GUN', damage:12, cool:.085, spread:.17, gun:true, color:'#f6d086', tip:'Fast fire · wider spread'},
  {name:'SHOTGUN', damage:15, cool:.85, spread:.28, pellets:6, gun:true, color:'#f6d086', tip:'Six pellets · wide spread'},
  {name:'SINGLE SHOT', damage:65, cool:1, spread:.015, gun:true, color:'#f6d086', tip:'Powerful, precise single rounds'},
  {name:'WOODEN CLUB', damage:12, range:68, cool:.5, duration:.35, kind:'sweep', color:'#c8a46c', tip:'Short reach · solid knockback'},
  {name:'PEBBLE SLING', damage:9, cool:.65, spread:.06, gun:true, freeAmmo:true, color:'#cfc1a3', tip:'Infinite pebbles · light damage'},
  {name:'FIRE STAFF', damage:18, cool:.62, spread:0, gun:true, freeAmmo:true, effect:'burn', color:'#ff985a', tip:'Piercing flame crosses the level and ignites enemies'},
  {name:'WIND STAFF', damage:0, range:112, cool:1.2, duration:.43, kind:'escape', color:'#b3f0ce', tip:'Escape tool · pushes enemies back, no damage'},
  {name:'THORN WHIP', damage:26, range:112, cool:.56, duration:.48, kind:'sweep', effect:'snare', color:'#a7d88b', tip:'Wide vine lash briefly slows monsters'},
  {name:'ICE PICK', damage:24, range:72, cool:.44, duration:.38, kind:'thrust', color:'#a5e0ef', tip:'Fast close-range stab'},
  {name:'ICE STAFF', damage:23, cool:.9, spread:0, gun:true, freeAmmo:true, effect:'freeze', color:'#a8e8ff', tip:'Icicles freeze foes so they cannot move or touch you'},
  {name:'STORM STAFF', damage:46, cool:.72, spread:0, gun:true, freeAmmo:true, effect:'shock', color:'#fff0a3', tip:'Lightning bolts briefly stun monsters · unlimited magic'},
  {name:'LASER STAFF', damage:42, cool:0, spread:0, gun:true, freeAmmo:true, effect:'laser', color:'#fa87df', tip:'No cooldown · ricochets until you leave this level'}
];
const powers={ice:{name:'ICE ORB',cool:3.2},dash:{name:'ROCKET DASH',cool:4.4},spark:{name:'SPARK',cool:3.7}};
let character={name:'Alistair',look:'forest',powers:['ice','dash']};
const biomes = [
  {name:'FERNWOOD TRAIL', visual:0, sky:'#244e60', haze:'#89aa99', soil:'#524238', grass:'#a5ce76', goal:8, monsters:['slime','mushroom','wolf','bat'], description:'Fallen logs, thorns, and the first winding path.'},
  {name:'AMBER RIDGE', visual:1, sky:'#66516e', haze:'#c9a081', soil:'#694c46', grass:'#e5b66e', goal:10, monsters:['beetle','scorpion','wolf','bat'], description:'Sandstone shelves, spikes, and Sandjaw.', boss:true, bossName:'SANDJAW'},
  {name:'MIREWOOD BOG', visual:3, sky:'#284c4a', haze:'#779d75', soil:'#36483e', grass:'#a7ca72', goal:11, monsters:['mushroom','slime','wisp','wolf'], description:'Low boardwalks and flooded roots.'},
  {name:'WHISPERWOOD CANOPY', visual:6, sky:'#284e51', haze:'#8bb7a2', soil:'#425447', grass:'#b1d98b', goal:12, monsters:['bat','witchbat','mushroom','wisp','wolf'], description:'Tall tree bridges and a route through the canopy.'},
  {name:'FROSTGLASS PASS', visual:4, sky:'#344f70', haze:'#a8d0d8', soil:'#425c69', grass:'#c5e7e5', goal:13, monsters:['bat','wisp','frostmite','golem','beetle'], description:'Cold ledges and a high crystal climb.'},
  {name:'MOONSTONE RUINS', visual:2, sky:'#26375c', haze:'#708a9d', soil:'#41465c', grass:'#83bec1', goal:14, monsters:['wisp','golem','witchbat','beetle'], description:'Crystal towers and the Moonstone Warden.', boss:true, bossName:'WARDEN'},
  {name:'STORMBREAK CLIFFS', visual:7, sky:'#354c70', haze:'#9baec9', soil:'#414c61', grass:'#a9c6d9', goal:14, monsters:['bat','witchbat','wolf','frostmite','golem'], description:'Wind-cut ledges and long jumps over the clouds.'},
  {name:'OBSIDIAN QUARRY', visual:8, sky:'#3c3748', haze:'#8d6870', soil:'#34343f', grass:'#c58a77', goal:15, monsters:['golem','scorpion','frostmite','beetle','wisp'], description:'Dark stone steps and glowing fissures.'},
  {name:'SUNFLARE CAUSEWAY', visual:9, sky:'#6b5864', haze:'#e6ba8d', soil:'#655058', grass:'#f2cb8b', goal:16, monsters:['scorpion','wolf','witchbat','golem'], description:'A golden approach through shattered arches.'},
  {name:'EMBER CITADEL', visual:5, sky:'#5e3b4b', haze:'#d58c68', soil:'#574449', grass:'#e6a46b', goal:18, monsters:['scorpion','wolf','golem','bat'], description:'Broken battlements and the Cinder Titan.', boss:true, bossName:'CINDER TITAN'}
].map((b,i)=>({...b,x:i*LEVEL_LENGTH}));
const WORLD = LEVEL_LENGTH * biomes.length;
const originalLayouts = [
  [[360,465,210],[710,370,180],[1070,475,240],[1440,415,170],[1740,325,200],[2080,250,220],[2350,400,240],[2740,460,250],[3020,365,190],[3360,275,220],[3700,405,260],[4100,330,200],[4440,455,220]],
  [[340,470,210],[680,390,200],[1010,300,200],[1320,390,280],[1720,455,200],[2070,365,180],[2370,265,230],[2720,390,250],[3100,460,210],[3440,350,250],[3820,270,220],[4180,385,280],[4550,460,190]],
  [[330,475,230],[700,385,180],[1010,295,190],[1320,210,250],[1690,335,250],[2060,425,220],[2400,330,200],[2710,235,230],[3060,400,220],[3410,305,180],[3720,220,220],[4070,350,240],[4460,450,210]],
  [[300,485,300],[760,445,260],[1120,475,330],[1580,395,220],[1880,355,280],[2310,455,330],[2760,410,250],[3080,470,330],[3520,385,270],[3920,455,300],[4330,370,250]],
  [[340,470,200],[680,380,180],[980,280,180],[1270,205,220],[1600,305,200],[1920,410,230],[2260,315,200],[2570,225,220],[2910,370,230],[3260,275,200],[3590,190,220],[3950,335,250],[4320,435,250]],
  [[310,480,200],[640,390,240],[1010,465,280],[1430,365,240],[1780,265,220],[2120,405,300],[2550,305,230],[2890,445,280],[3260,345,230],[3600,245,230],[3940,375,260],[4310,455,220]]
];
const platformLayouts=[originalLayouts[0],originalLayouts[1],originalLayouts[3],
  [[300,460,220],[650,355,190],[950,255,190],[1260,170,210],[1600,300,220],[1940,390,230],[2280,295,200],[2600,190,230],[2940,360,230],[3280,275,210],[3610,185,220],[3970,335,250],[4350,440,220]],
  originalLayouts[4],originalLayouts[2],
  [[330,465,230],[700,355,200],[1010,245,190],[1320,370,260],[1700,460,210],[2010,345,210],[2330,250,230],[2670,390,250],[3030,475,220],[3370,360,210],[3700,260,210],[4050,385,230],[4420,455,200]],
  [[310,485,240],[690,420,260],[1070,345,200],[1390,250,240],[1740,385,220],[2070,465,220],[2400,365,220],[2730,265,220],[3070,435,260],[3470,330,220],[3810,225,220],[4160,360,260],[4510,460,180]],
  [[340,480,220],[690,390,210],[1020,305,210],[1360,215,210],[1690,360,250],[2070,450,240],[2420,350,210],[2760,250,220],[3090,390,250],[3450,300,210],[3780,205,220],[4120,350,230],[4450,455,210]],
  originalLayouts[5]];
const platforms = platformLayouts.flatMap((layout,level)=>layout.map(([x,y,w])=>({x:x+level*LEVEL_LENGTH,y,w,level})));
const springPads=[[1970,3650],[1750,3300],[1880,3900],[1170,3180],[1320,3520],[1220,2900],[1620,3660],[1490,3310],[1360,3480],[1740,3610]].flatMap((pads,i)=>pads.map(x=>i*LEVEL_LENGTH+x));
const chestSpots=[[[790,350],[2190,230]],[[1110,280],[2470,245]],[[1700,340],[3620,365]],[[1080,225],[2730,175]],[[1340,180],[3670,180]],[[1430,190],[3820,200]],[[920,230],[3080,205]],[[1180,325],[3770,205]],[[1440,190],[3480,275]],[[1890,215],[4060,340]]].flatMap((spots,i)=>spots.map(([x,y])=>({x:i*LEVEL_LENGTH+x,y})));
const traps=[['thorns',[1230,2590,3920]],['spikes',[1500,2880,4050]],['thorns',[950,2600,4080]],['thorns',[1200,2750,3900]],['crystal-trap',[800,2380,4000]],['crystal-trap',[900,2220,3550,3860,4050,4250,4500]],['spikes',[1150,2530,3990]],['crystal-trap',[1250,2790,4110]],['spikes',[990,2430,4070]],['spikes',[1130,2660,3980]]].flatMap(([kind,spots],i)=>spots.map(x=>({x:i*LEVEL_LENGTH+x,kind,w:56,h:25})));
const monsterStats={
  slime:{hp:44,w:34,h:28,speed:68,damage:8,color:'#a0d65a'},
  bat:{hp:40,w:34,h:26,speed:72,damage:8,flying:true,color:'#d394ef'},
  mushroom:{hp:58,w:34,h:32,speed:62,damage:9,hop:true,color:'#d57c99'},
  wolf:{hp:78,w:43,h:31,speed:155,damage:12,charge:true,color:'#a6b8b6'},
  beetle:{hp:110,w:42,h:32,speed:72,damage:13,color:'#d5a176'},
  scorpion:{hp:100,w:46,h:29,speed:104,damage:15,charge:true,color:'#dfb36c'},
  wisp:{hp:95,w:35,h:34,speed:82,damage:10,flying:true,color:'#9edfe1'},
  golem:{hp:175,w:52,h:48,speed:53,damage:19,color:'#94aeb5'},
  witchbat:{hp:75,w:38,h:31,speed:64,damage:9,flying:true,color:'#b8a0e7'},
  frostmite:{hp:90,w:37,h:30,speed:88,damage:10,color:'#a7dce9'},
  sandjaw:{hp:300,w:76,h:62,speed:88,damage:11,boss:true,color:'#e5b477'},
  warden:{hp:620,w:92,h:80,speed:104,damage:15,boss:true,color:'#bddcea'},
  titan:{hp:1180,w:108,h:104,speed:108,damage:28,boss:true,color:'#f2a76b'}
};
let training, lessons, player, enemies, bullets, enemyShots, loot, trainingLoot, sparks, labels, waves, chests, camps;
let kills, stageKills, completed, unlockedStage, stage=-1, bossSpawned, bossDefeated, time, spawnTimer, camera, state='title', last=0, sound=false, audio, region=0, activeBar=0, selectedSlot=0;
const SKY_GOAL=18;
let ship=null;
// Optional sprite pack can be plugged in without making offline play depend on it.
const sprites = {};
function loadSprite(name, path) {
  if (typeof Image === 'undefined') return;
  const img = new Image(); img.onload = () => { sprites[name] = img; }; img.src = path;
}
const weaponSpriteNames=['sword','pistol','hammer','axe','machine-gun','shotgun','single-shot'];
const weaponSpriteSizes=[[64,24],[48,32],[64,40],[64,40],[64,32],[64,24],[72,24]];
for(const name of [...weaponSpriteNames,'player-idle','player-animations','slime','bat','training-dummy','potion','ammo','woodland-tree','background-pine','grass-dirt'])loadSprite(name,'assets/starter-pack/'+name+'.png');
for(const name of Object.keys(monsterStats).filter(n=>!['slime','bat','sandjaw','titan'].includes(n)))loadSprite(name,'assets/monsters/'+name+'.png');
for(const name of ['thorns','spikes','crystal-trap','log-platform','sandstone-platform','ruin-platform'])loadSprite(name,'assets/monsters/'+name+'.png');
function reset() {
  training=true; lessons={move:false,jump:false,melee:false,shoot:false};
  ship=null;document.querySelector('.frame')?.classList.remove('ship-mode');
  weapons[0].name='RUSTY SWORD';weapons[0].tip='Starter sword · 18 damage. Find upgrades in the levels.';
  player={x:100,y:FLOOR-42,w:24,h:42,vx:0,vy:0,hp:100,ammo:0,potions:0,
    unlocked:weapons.map((_,i)=>i===0||i===13),inventory:[0,13],loadouts:[[0,13,null,null,null,null,null],[null,null,null,null,null,null,null]],weaponLevels:weapons.map(()=>0),swordLevel:0,weapon:0,face:1,jumps:0,ground:false,inv:0,cool:0,
    attack:null,recoil:0,walk:0,coyote:0,jumpBuffer:0,padCooldown:0,treasures:0,name:character.name,look:character.look,powers:[...character.powers],powerCooldowns:{ice:0,dash:0,spark:0},poison:0,poisonTick:0,chilled:0,shocked:0,rocketDash:0};
  enemies=[{x:565,y:FLOOR-46,w:32,h:46,hp:99999,max:99999,vx:0,vy:0,color:'#d8b178',dummy:true},
    {x:700,y:FLOOR-46,w:32,h:46,hp:99999,max:99999,vx:0,vy:0,color:'#d8b178',dummy:true}];
  bullets=[];enemyShots=[];sparks=[];labels=[];waves=[];kills=0;stageKills=0;completed=biomes.map(()=>false);unlockedStage=0;stage=-1;bossSpawned=false;bossDefeated=false;time=0;spawnTimer=3;camera=0;region=0;activeBar=0;selectedSlot=0;
  chests=chestSpots.map(c=>({...c,opened:false}));camps=biomes.map((_,i)=>({x:i*LEVEL_LENGTH+2550,used:false}));camps.push({x:5*LEVEL_LENGTH+3590,used:false});
  loot=[
    {x:1500,y:FLOOR-25,type:'weapon',weapon:7},{x:3600,y:FLOOR-25,type:'weapon',weapon:8},
    {x:LEVEL_LENGTH+1600,y:FLOOR-25,type:'weapon',weapon:9},{x:LEVEL_LENGTH+3600,y:FLOOR-25,type:'weapon',weapon:3},
    {x:LEVEL_LENGTH*2+1200,y:FLOOR-25,type:'weapon',weapon:10},{x:LEVEL_LENGTH*2+3350,y:FLOOR-25,type:'upgrade'},
    {x:LEVEL_LENGTH*3+1450,y:FLOOR-25,type:'weapon',weapon:11},{x:LEVEL_LENGTH*3+3420,y:FLOOR-25,type:'weapon',weapon:1},
    {x:LEVEL_LENGTH*4+1600,y:FLOOR-25,type:'weapon',weapon:12},{x:LEVEL_LENGTH*4+3400,y:FLOOR-25,type:'upgrade'},
    {x:LEVEL_LENGTH*5+1520,y:FLOOR-25,type:'weapon',weapon:5},{x:LEVEL_LENGTH*5+2200,y:FLOOR-25,type:'weapon-upgrade',weapon:13},{x:LEVEL_LENGTH*5+3340,y:FLOOR-25,type:'weapon-upgrade',weapon:1},
    {x:LEVEL_LENGTH*6+1540,y:FLOOR-25,type:'weapon',weapon:4},{x:LEVEL_LENGTH*6+3380,y:FLOOR-25,type:'weapon-upgrade',weapon:3},
    {x:LEVEL_LENGTH*7+1550,y:FLOOR-25,type:'weapon',weapon:6},{x:LEVEL_LENGTH*7+2200,y:FLOOR-25,type:'weapon',weapon:14},{x:LEVEL_LENGTH*7+3380,y:FLOOR-25,type:'weapon-upgrade',weapon:11},
    {x:LEVEL_LENGTH*8+1580,y:FLOOR-25,type:'weapon',weapon:2},{x:LEVEL_LENGTH*8+2200,y:FLOOR-25,type:'weapon',weapon:15},{x:LEVEL_LENGTH*8+3350,y:FLOOR-25,type:'upgrade'},
    {x:LEVEL_LENGTH*9+1620,y:FLOOR-25,type:'weapon-upgrade',weapon:2},{x:LEVEL_LENGTH*9+3400,y:FLOOR-25,type:'weapon-upgrade',weapon:5},
    ...Array.from({length:72},(_,i)=>({x:LEVEL_LENGTH*3+500+i*460,y:FLOOR-25,type:'ammo'})),
    ...Array.from({length:49},(_,i)=>({x:1200+i*950,y:FLOOR-28,type:'potion'}))
  ];
  if(typeof window.applySavedLevelEdits==='function')window.applySavedLevelEdits();
  trainingLoot=[];
  keys.clear();mouse.down=false;activeAimPointer=null;mobileAim=null;canvasTouch=null;laserHeld=false;touchGestures.clear();
}
function start() {
  const name=document.querySelector('#hero-name')?.value?.trim();
  const look=document.querySelector('#hero-look')?.value;
  const first=document.querySelector('#hero-power-1')?.value,second=document.querySelector('#hero-power-2')?.value;
  if(name)character.name=name.slice(0,16);
  if(['forest','storm','ember'].includes(look))character.look=look;
  if(powers[first]&&powers[second])character.powers=first===second?[first,Object.keys(powers).find(key=>key!==first)]:[first,second];
  reset();state='play';overlay.classList.remove('map-open');overlay.classList.add('hidden');canvas.focus();
}
function beginAdventure() {
  training=false;enemies=[];bullets=[];enemyShots=[];waves=[];sparks=[];labels=[];
  Object.assign(player,{x:100,y:FLOOR-42,vx:0,vy:0,hp:100,ammo:0,potions:0,weapon:0,attack:null,cool:0,jumps:0,
    unlocked:weapons.map((_,i)=>i===0||i===13),inventory:[0,13],loadouts:[[0,13,null,null,null,null,null],[null,null,null,null,null,null,null]],weaponLevels:weapons.map(()=>0),swordLevel:0});
  activeBar=0;selectedSlot=0;
  stage=0;region=0;camera=0;showMap();
}
function showMap() {
  state='map';keys.clear();mouse.down=false;activeAimPointer=null;mobileAim=null;canvasTouch=null;touchGestures.clear();
  overlay.classList.add('map-open');
  overlay.innerHTML=`<small>THE WILDLANDS MAP</small><h2>Choose your next journey.</h2><p>Ten lands to cross, with an early boss, the Warden at the midpoint, and the Cinder Titan at the end. Collected gear carries forward.</p><div class="map-stages">${biomes.map((b,i)=>`<button class="map-stage" data-stage="${i}" ${i>unlockedStage?'disabled':''}><strong>${i+1}. ${b.name}</strong><span>${completed[i]?'✓ CLEARED':i>unlockedStage?'LOCKED':`DEFEAT ${b.goal} MONSTERS${b.boss?' + '+b.bossName:''}`}</span><em>${b.description}</em></button>`).join('')}</div><p class="hint">Lure monsters into traps to hurt them. M returns to this map.</p>`;
  overlay.classList.remove('hidden');
  overlay.querySelectorAll('[data-stage]').forEach(button=>button.onclick=()=>enterLevel(Number(button.dataset.stage)));
}
function renderInventory() {
  overlay.innerHTML=`<small>ADVENTURER'S PACK · GAME PAUSED</small><h2>Inventory & weapon bars</h2><p>Select a bar and a slot, then choose any weapon you have found. Number keys use the active bar; B switches bars.</p><div class="inventory-bars">${player.loadouts.map((bar,b)=>`<section><button class="inventory-bar ${b===activeBar?'selected':''}" data-bar="${b}">BAR ${b+1}</button><div class="inventory-slots">${bar.map((weapon,s)=>`<button class="inventory-slot ${b===activeBar&&s===selectedSlot?'selected':''}" data-bar="${b}" data-slot="${s}"><b>${s+1}</b><span>${weapon===null?'EMPTY':weapons[weapon].name}</span></button>`).join('')}</div></section>`).join('')}</div><h3>Collected gear</h3><div class="inventory-weapons">${player.inventory.map(i=>`<button data-weapon="${i}">${weapons[i].name}<small>${weaponDamage(i)} DMG</small></button>`).join('')}</div><div class="inventory-powers"><strong>Magic powers · Q and F</strong>${player.powers.map((power,slot)=>`<label>${slot===0?'Q':'F'} <select data-power-slot="${slot}">${Object.entries(powers).map(([id,p])=>`<option value="${id}" ${id===power?'selected':''}>${p.name}</option>`).join('')}</select></label>`).join('')}</div><button id="inventory-close">Return to adventure →</button>`;
  overlay.querySelectorAll('[data-bar]').forEach(button=>button.onclick=()=>{activeBar=Number(button.dataset.bar);selectedSlot=Number(button.dataset.slot||0);renderInventory();});
  overlay.querySelectorAll('[data-weapon]').forEach(button=>button.onclick=()=>assignWeaponToSlot(Number(button.dataset.weapon)));
  overlay.querySelectorAll('[data-power-slot]').forEach(select=>select.onchange=()=>{const slot=Number(select.dataset.powerSlot),other=1-slot; if(player.powers[other]===select.value)player.powers[other]=player.powers[slot];player.powers[slot]=select.value;renderInventory();});
  document.querySelector('#inventory-close').onclick=closeInventory;
}
function openInventory(){if(state!=='play')return;state='inventory';keys.clear();mouse.down=false;activeAimPointer=null;mobileAim=null;canvasTouch=null;touchGestures.clear();player.attack=null;overlay.classList.add('inventory-open');renderInventory();overlay.classList.remove('hidden');}
function closeInventory(){if(state!=='inventory')return;state='play';overlay.classList.remove('inventory-open');overlay.classList.add('hidden');canvas.focus();}
function assignWeaponToSlot(weapon){
  if(state!=='inventory'||!player.unlocked[weapon])return;
  const bar=player.loadouts[activeBar],previous=bar[selectedSlot];
  for(const other of player.loadouts){const index=other.indexOf(weapon);if(index>=0)other[index]=previous;}
  bar[selectedSlot]=weapon;player.weapon=weapon;renderInventory();
}
function switchBar(){if(player.attack)return;const next=1-activeBar,weapon=player.loadouts[next].find(i=>i!==null);if(weapon===undefined){message('That weapon bar is empty');return;}activeBar=next;selectedSlot=player.loadouts[next].indexOf(weapon);player.weapon=weapon;}
function selectHotbarSlot(slot){const weapon=player.loadouts[activeBar][slot];if(weapon!==null)equip(weapon);}
function enterLevel(i) {
  if(i>unlockedStage)return;
  stage=i;region=i;stageKills=0;bossSpawned=false;bossDefeated=false;enemies=[];bullets=[];enemyShots=[];waves=[];sparks=[];labels=[];
  Object.assign(player,{x:i*LEVEL_LENGTH+90,y:FLOOR-42,vx:0,vy:0,hp:Math.min(100,player.hp+25),inv:0,attack:null,cool:0,jumps:0,jumpBuffer:0,coyote:0,ground:false,padCooldown:0});
  camera=i*LEVEL_LENGTH;spawnTimer=2.5;state='play';overlay.classList.remove('map-open');overlay.classList.add('hidden');canvas.focus();
  message(biomes[i].name+' — reach the far gate',player.x,player.y-55,'#fff2bc');
}
function finishLevel() {
  completed[stage]=true;unlockedStage=Math.max(unlockedStage,Math.min(biomes.length-1,stage+1));
  if(stage===biomes.length-1)startSkyRun();else showMap();
}
function startSkyRun(){
  ship={x:W/2,y:H-110,hp:100,inv:0,fireCooldown:0,spawnTimer:.8,scroll:0,kills:0,elapsed:0,bossSpawned:false,enemies:[],shots:[],enemyShots:[]};
  keys.clear();mouse.down=false;laserHeld=false;state='ship';overlay.classList.add('hidden');document.querySelector('.frame')?.classList.add('ship-mode');canvas.focus();
}
function message(text,x=player.x,y=player.y-20,color='#fff') {labels.push({text,x,y,life:1.6,color});}
function tone(freq,duration=.07) {
  if(!sound)return;
  try {audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();
    const o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.value=freq;
    g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
    o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);
  }catch{}
}
function burst(x,y,color,n=10) {for(let i=0;i<n;i++)sparks.push({x,y,vx:(Math.random()-.5)*220,vy:-Math.random()*200,life:.5,color});}
function jump() {
  if(state!=='play')return;
  player.jumpBuffer=.12;
  if(player.jumps<2||player.coyote>0) {
    if(player.coyote>0)player.jumps=0;
    lessons.jump=true;player.vy=-495;player.jumps++;player.ground=false;player.coyote=0;player.jumpBuffer=0;
    tone(370+player.jumps*70);burst(player.x+12,player.y+42,'#d9efc4',5);
  }
}
function heal() {
  if(state!=='play')return;
  if(player.hp>=100){message('Already at full health');return;}
  if(!player.potions){message('Find more potions!');return;}
  player.potions--;player.hp=Math.min(100,player.hp+45);player.poison=0;player.chilled=0;message('+45 health · ailments cured',player.x,player.y-20,'#a1f7a0');tone(720,.15);
}
function castPower(slot){
  if(state!=='play'||player.shocked>0)return;
  const id=player.powers[slot];if(!powers[id]||player.powerCooldowns[id]>0)return;
  player.powerCooldowns[id]=powers[id].cool;
  const x=player.x+12,y=player.y+19,dir=player.face;
  if(id==='dash'){player.vx=dir*790;player.rocketDash=.28;player.inv=Math.max(player.inv,.35);burst(x,y,'#ffba86',16);message('ROCKET DASH!',x,y-30,'#ffce9d');}
  else {const icy=id==='ice';bullets.push({x,y,vx:dir*(icy?610:800),vy:0,life:1.25,damage:icy?26:31,effect:icy?'freeze':'shock',color:icy?'#a8e8ff':'#ffe69b'});burst(x,y,icy?'#b9f5ff':'#ffe69b',10);}
  tone(id==='dash'?130:id==='ice'?520:730,.13);
}
function equip(i) {
  if(player.attack)return;
  if(player.unlocked[i]){player.weapon=i;laserHeld=false;for(let bar=0;bar<2;bar++){const slot=player.loadouts[bar].indexOf(i);if(slot>=0){activeBar=bar;selectedSlot=slot;break;}}tone(250+i*70);}
  else message('Find that weapon in a level first!');
}
function weaponDamage(i){return i===0?weapons[0].damage+player.swordLevel*18:weapons[i].damage+player.weaponLevels[i]*Math.max(2,Math.round(weapons[i].damage*.2));}
function collectWeapon(i){if(!player.unlocked[i]){player.unlocked[i]=true;player.inventory.push(i);message(`${weapons[i].name} FOUND!`,player.x,player.y-45,'#fff0ae');let placed=false;for(let bar=0;bar<2;bar++){const slot=player.loadouts[bar].indexOf(null);if(slot>=0){player.loadouts[bar][slot]=i;placed=true;break;}}if(!placed)player.loadouts[activeBar][selectedSlot]=i;}if(!player.attack)equip(i);if(weapons[i].gun&&!weapons[i].freeAmmo&&player.ammo===0)player.ammo+=training?0:28;}
function attack(aim=false) {
  if(state!=='play'||player.cool>0||player.attack)return;
  if(aim)player.face=mouse.x+camera>=player.x+player.w/2?1:-1;
  const w=weapons[player.weapon];player.cool=w.cool;
  if(w.effect==='laser')laserHeld=true;
  if(w.gun) {
    if(!w.freeAmmo&&!training&&player.ammo<=0){message('No ammo — use a melee weapon!');tone(90);return;}
    if(!w.freeAmmo&&!training)player.ammo--;lessons.shoot=true;player.recoil=.1;
    const x=player.x+12,y=player.y+19;
    const a=aim?Math.atan2(mouse.y-y,mouse.x+camera-x):(player.face===1?0:Math.PI);
    player.face=Math.cos(a)>=0?1:-1;
    if(w.effect==='laser'){const active=bullets.filter(b=>b.effect==='laser'&&b.life>0);if(active.length>=3)active[0].life=0;}
    for(let n=0;n<(w.pellets||1);n++) {
      const angle=a+(Math.random()-.5)*2*w.spread;
      const speed=w.effect==='laser'?640:w.effect==='burn'?900:w.effect?730:920;
      bullets.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:w.effect==='laser'?Infinity:w.effect==='burn'?LEVEL_LENGTH/speed+1:1.4,damage:weaponDamage(player.weapon),effect:w.effect,color:w.color,hitTargets:w.effect==='burn'?new Set():w.effect==='laser'?new Map():null});
    }
    burst(x+Math.cos(a)*37,y+Math.sin(a)*37,'#ffd574',4);tone(150,.045);
  } else {
    lessons.melee=true;
    player.attack={weapon:player.weapon,elapsed:0,face:player.face,hits:new Set(),impacted:false};
    if(w.kind==='escape'){player.vx=-player.face*620;player.inv=Math.max(player.inv,.32);burst(player.x+12,player.y+21,w.color,12);}
    tone(w.kind==='slam'?110:270);
  }
}
// Collision follows each weapon's animated trajectory; one hit per target per swing.
function tickMelee(dt) {
  const a=player.attack;if(!a)return;
  const w=weapons[a.weapon],previous=a.elapsed/w.duration;
  a.elapsed+=dt;const p=Math.min(1,a.elapsed/w.duration);
  const ox=player.x+12,oy=player.y+21;
  if(w.kind==='slam'&&!a.impacted&&p>=.64) {
    a.impacted=true;const x=ox+a.face*63,y=player.y+player.h;
    waves.push({x,y,life:.38,radius:w.range});burst(x,y,w.color,24);tone(72,.15);
    for(const e of enemies)if(e.hp>0&&Math.abs(e.y+e.h-y)<48&&Math.abs(e.x+e.w/2-x)<=w.range+e.w/2) {
      hit(e,weaponDamage(a.weapon));knockback(e,Math.sign(e.x+e.w/2-x),1000,310);a.hits.add(e);
    }
  } else if(w.kind!=='slam') {
    // Sample across the elapsed interval so a fast sweep cannot skip a target.
    for(let t=previous;t<=p+.0001;t+=Math.max(.008,(p-previous)/8)) {
      if(t<.2||t>.72)continue;
      const angle=w.kind==='sweep'||w.kind==='escape'?-1.6+((t-.2)/.52)*3.1:0;
      const reach=w.kind==='thrust'?40+76*Math.sin(Math.PI*(t-.2)/.52):w.range;
      for(const e of enemies) {
        if(e.hp<=0||a.hits.has(e))continue;
        const dx=(e.x+e.w/2-ox)*a.face,dy=e.y+e.h/2-oy;
        const along=dx*Math.cos(angle)+dy*Math.sin(angle),side=-dx*Math.sin(angle)+dy*Math.cos(angle);
        const radius=Math.min(e.w,e.h)*.4;
        if(along>=12-radius&&along<=reach+radius&&Math.abs(side)<(w.kind==='thrust'?9:22)+radius) {
          if(w.damage>0)hit(e,weaponDamage(a.weapon));if(w.effect==='snare'&&!e.boss)e.slow=1.5;a.hits.add(e);knockback(e,a.face,w.kind==='escape'?1800:w.kind==='thrust'?750:960,190);
        }
      }
    }
  }
  if(p>=1)player.attack=null;
}
function knockback(e,dir,force,lift=90) {
  if(e.dummy||e.hp<=0)return;
  // Larger, tougher enemies retain their footing; the Warden barely flinches.
  const mass=1+e.w*e.h/2400+e.max/300+(e.boss?5:0);
  e.knockVx=Math.max(-610,Math.min(610,(e.knockVx||0)+dir*force/mass));
  if(!e.flying)e.vy=Math.min(e.vy,-lift/mass);
}
function hit(e,damage) {
  if(e.dummy){e.flash=.15;burst(e.x+15,e.y+15,'#efd6a1',5);message(`${damage}`,e.x,e.y-12,'#ffe5a7');tone(420);return;}
  e.hp-=damage;burst(e.x+e.w/2,e.y+e.h/2,e.color);
  if(e.boss&&damage>0&&(e.hitLabelCooldown||0)<=0){message(`-${Math.round(damage)}  ${Math.max(0,Math.round(e.hp))}/${e.max}`,e.x+e.w/2,e.y-18,'#f8e9b7');e.hitLabelCooldown=.2;}
  if(e.hp<=0) {
    if(e.boss){bossDefeated=true;enemyShots=[];message(`${e.type==='titan'?'CINDER TITAN':e.type==='sandjaw'?'SANDJAW':'WARDEN'} DEFEATED! Reach the gate →`,e.x,e.y-35,'#d6ffea');burst(e.x,e.y,e.color,35);}
    else {kills++;stageKills++;spawnTimer=Math.max(spawnTimer,1.8);if(kills%2===0&&player.inventory.some(i=>weapons[i].gun&&!weapons[i].freeAmmo))loot.push({x:e.x,y:FLOOR-25,type:'ammo'});if(kills%4===0)loot.push({x:e.x+20,y:FLOOR-25,type:'potion'});
      if(stageKills===biomes[stage].goal)message('EXIT GATE OPEN! Continue right →',player.x,player.y-55,'#baff99');}
    tone(560);
  }
}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function physics(o,dt) {
  const bottom=o.y+o.h;
  o.x=Math.max(0,Math.min(WORLD-o.w,o.x+(o.vx+(o.knockVx||0))*dt));
  if(o.knockVx)o.knockVx*=Math.max(0,1-dt*2.1);
  o.vy+=1250*dt;o.y+=o.vy*dt;o.ground=false;
  let landing=FLOOR;
  for(const p of platforms)if(bottom<=p.y+2&&o.x+o.w>p.x&&o.x<p.x+p.w)landing=Math.min(landing,p.y);
  if(o.vy>=0&&bottom<=landing+2&&o.y+o.h>=landing){o.y=landing-o.h;o.vy=0;o.ground=true;if(o===player)o.jumps=0;}
}
function spawn() {
  if(enemies.some(e=>!e.boss&&e.hp>0&&Math.abs(e.x-player.x)<270))return false;
  const pool=biomes[stage].monsters,name=pool[Math.floor(Math.random()*pool.length)];
  for(let attempt=0;attempt<8;attempt++){
    const side=player.x>(stage+1)*LEVEL_LENGTH-900?-1:player.x<stage*LEVEL_LENGTH+850?1:Math.random()<.2?-1:1;
    let x=player.x+side*(580+Math.random()*180);
    x=Math.max(stage*LEVEL_LENGTH+70,Math.min((stage+1)*LEVEL_LENGTH-220,x));
    if(Math.abs(x-player.x)<450)continue;
    if(enemies.some(e=>e.hp>0&&!e.boss&&Math.abs(e.x-x)<280))continue;
    spawnMonster(name,x);return true;
  }
  return false;
}
function spawnMonster(name,x){const m=monsterStats[name],b=!training&&stage>=0?biomes[stage]:null,hpScale=m.boss?(b?.bossHpScale||1):(b?.enemyHpScale||1),damageScale=m.boss?(b?.bossDamageScale||1):(b?.enemyDamageScale||1),speedScale=m.boss?1:m.flying?(b?.flyingSpeedScale||1):(b?.groundSpeedScale||1),hp=Math.round(m.hp*hpScale);enemies.push({type:name,x,y:m.flying?FLOOR-170:FLOOR-m.h,w:m.w,h:m.h,hp,max:hp,vx:0,vy:0,knockVx:0,flying:!!m.flying,phase:Math.random()*8,color:m.color,damage:Math.round(m.damage*damageScale),speed:m.speed*speedScale,hop:m.hop,charge:m.charge,boss:!!m.boss,bossCooldown:1.2,leapCooldown:1.1,tell:0,attackIndex:0,dash:0,phaseTwo:false,flightTell:0,flightDash:0,flightCooldown:1.1});}
function sandjawSpray(e){
  const x=e.x+e.w/2,y=e.y+18,aim=Math.atan2(player.y+player.h/2-y,player.x+player.w/2-x),count=e.phaseTwo?5:3;
  for(let i=0;i<count;i++){const a=aim+(i-(count-1)/2)*.18;enemyShots.push({x,y,vx:Math.cos(a)*320,vy:Math.sin(a)*320,r:8,life:2.7,damage:e.phaseTwo?9:7,color:'#dfb97a'});}
  burst(x,y,'#f1d19b',13);tone(175,.13);
}
function updateSandjaw(e,dt){
  const enraged=e.hp<e.max*.5,dx=player.x+player.w/2-(e.x+e.w/2);
  if(enraged&&!e.phaseTwo){e.phaseTwo=true;e.bossCooldown=.5;message('SANDJAW STIRS · WATCH ITS LEAP!',e.x,e.y-68,'#ffe0a7');}
  if(e.tell>0){e.tell=Math.max(0,e.tell-dt);e.vx*=Math.max(0,1-dt*8);if(e.tell===0){
    if(e.queuedAttack==='spray')sandjawSpray(e);
    else {e.vy=enraged?-700:-620;e.vx=Math.sign(dx)*(enraged?350:280);e.ground=false;e.stomping=true;}
    e.queuedAttack=null;e.bossCooldown=enraged?1.6:2.2;
  }return;}
  if(e.stomping)return;
  e.bossCooldown=Math.max(0,e.bossCooldown-dt);
  if(e.bossCooldown===0&&Math.abs(dx)<1200){e.queuedAttack=e.attackIndex++%2===0?'spray':'pounce';e.tell=e.queuedAttack==='spray'?.8:.7;message(e.queuedAttack==='spray'?'SAND SPRAY · DODGE!':'SANDJAW POUNCE!',e.x,e.y-60,'#ffe0a7');}
  e.vx+=(Math.sign(dx)*e.speed*(enraged?1.25:1)-e.vx)*Math.min(1,dt*3);
}
function wardenVolley(e) {
  const x=e.x+e.w/2,y=e.y+e.h*.37,aim=Math.atan2(player.y+player.h/2-y,player.x+player.w/2-x);
  const furious=e.hp<e.max*.5,count=furious?4:3,speed=furious?360:315;
  for(let i=0;i<count;i++){const angle=aim+(i-(count-1)/2)*.15;enemyShots.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:9,life:2.1,damage:furious?12:9});}
  burst(x,y,'#e5a6f0',16);tone(180,.16);
}
function wardenNova(e) {
  const x=e.x+e.w/2,y=e.y+e.h/2;
  for(let i=0;i<10;i++){const angle=i*Math.PI/5+time*.3;enemyShots.push({x,y,vx:Math.cos(angle)*275,vy:Math.sin(angle)*275,r:9,life:1.9,damage:12});}
  burst(x,y,'#ffd4f8',26);tone(95,.22);
}
function updateWarden(e,dt) {
  const furious=e.hp<e.max*.5,dx=player.x+player.w/2-(e.x+e.w/2);
  if(furious&&!e.phaseTwo){e.phaseTwo=true;e.bossCooldown=.8;message('WARDEN ENRAGED · WATCH FOR NOVA!',e.x,e.y-82,'#ffe0f6');burst(e.x+e.w/2,e.y+e.h/2,'#f4b4ed',30);}
  e.leapCooldown=Math.max(0,e.leapCooldown-dt);
  if(e.tell>0){e.tell=Math.max(0,e.tell-dt);e.vx*=Math.max(0,1-dt*8);if(e.tell===0){if(e.queuedAttack==='volley')wardenVolley(e);else if(e.queuedAttack==='nova')wardenNova(e);else e.dash=.32;e.queuedAttack=null;e.bossCooldown=furious?1.8:2.4;}return;}
  if(e.dash>0){e.dash=Math.max(0,e.dash-dt);e.vx=e.dash>0?e.dashDir*(furious?400:340):0;if(e.dash===0)e.recovery=furious?.65:.8;return;}
  if(e.recovery>0){e.recovery=Math.max(0,e.recovery-dt);e.vx=0;return;}
  e.bossCooldown=Math.max(0,e.bossCooldown-dt);
  if(e.ground&&e.leapCooldown===0&&player.y+player.h<e.y+25){e.vy=furious?-1010:-940;e.ground=false;e.leapCooldown=furious?3.2:4;burst(e.x+e.w/2,e.y+e.h,'#bcecff',10);}
  if(e.bossCooldown===0&&Math.abs(dx)<1050){e.queuedAttack=furious&&e.attackIndex%3===2?'nova':Math.abs(dx)>270||player.y<e.y-55||e.attackIndex%2===0?'volley':'dash';e.attackIndex++;e.tell=e.queuedAttack==='nova'?1.25:e.queuedAttack==='volley'?.95:.8;e.dashDir=Math.sign(dx)||1;message(e.queuedAttack==='nova'?'CRYSTAL NOVA · MOVE!':e.queuedAttack==='volley'?'CRYSTAL VOLLEY!':'WARDEN CHARGE!',e.x,e.y-65,'#ffc5f7');}
  const dir=Math.sign(dx);e.vx+=(dir*e.speed*(furious?1.15:1)-e.vx)*Math.min(1,dt*4);
}
function titanFan(e){
  const x=e.x+e.w/2,y=e.y+29,aim=Math.atan2(player.y+player.h/2-y,player.x+player.w/2-x),enraged=e.phaseTwo,count=enraged?7:5;
  for(let i=0;i<count;i++){const a=aim+(i-(count-1)/2)*.13;enemyShots.push({x,y,vx:Math.cos(a)*(enraged?540:470),vy:Math.sin(a)*(enraged?540:470),r:10,life:3,damage:enraged?19:15,color:'#f2784d'});}
  burst(x,y,'#ffd27d',22);tone(130,.18);
}
function titanShockwave(e){
  const x=e.x+e.w/2,y=e.y+e.h-13;
  for(const dir of [-1,1])enemyShots.push({x,y,vx:dir*(e.phaseTwo?500:400),vy:0,r:14,life:2.5,damage:e.phaseTwo?21:17,color:'#ffb05a'});
  burst(x,y,'#ffc374',26);tone(82,.2);
}
function updateTitan(e,dt){
  const enraged=e.hp<e.max*.5,dx=player.x+player.w/2-(e.x+e.w/2);
  if(enraged&&!e.phaseTwo){e.phaseTwo=true;e.bossCooldown=.4;message('TITAN ENRAGED · WATCH THE GROUND!',e.x,e.y-90,'#ffd39c');burst(e.x+e.w/2,e.y+e.h/2,'#ffb372',30);}
  if(e.tell>0){e.tell=Math.max(0,e.tell-dt);e.vx*=Math.max(0,1-dt*9);if(e.tell===0){
    if(e.queuedAttack==='fan')titanFan(e);
    else if(e.queuedAttack==='wave')titanShockwave(e);
    else {e.vy=enraged?-1050:-920;e.vx=Math.sign(dx)*(enraged?410:320);e.ground=false;e.stomping=true;}
    e.queuedAttack=null;e.bossCooldown=enraged?1.15:1.7;
  }return;}
  if(e.stomping)return;
  e.bossCooldown=Math.max(0,e.bossCooldown-dt);
  if(e.bossCooldown===0&&Math.abs(dx)<1500){
    e.queuedAttack=['fan','stomp','wave'][e.attackIndex++%3];e.tell=e.queuedAttack==='stomp'?.8:e.queuedAttack==='wave'?.9:.65;
    message(e.queuedAttack==='fan'?'FIRE FAN · FIND A GAP!':e.queuedAttack==='wave'?'SHOCKWAVE · JUMP!':'TITAN LEAP · MOVE!',e.x,e.y-78,'#ffd9a7');
  }
  e.vx+=(Math.sign(dx)*e.speed*(enraged?1.35:1)-e.vx)*Math.min(1,dt*3);
}
function updateFlying(e,dt){
  e.flightCooldown=Math.max(0,e.flightCooldown-dt);
  const hoverY=FLOOR-170+Math.sin(time*2.5+e.phase)*20;
  if(e.flightTell>0){e.flightTell=Math.max(0,e.flightTell-dt);e.y+=(hoverY-e.y)*Math.min(1,dt*1.4);
    if(e.flightTell===0){e.flightDash=.6;e.flightStartY=e.y;e.flightDir=Math.sign(player.x-e.x)||1;}
  }else if(e.flightDash>0){e.flightDash=Math.max(0,e.flightDash-dt);e.x+=(e.flightDir*210+e.knockVx)*dt;e.y=e.flightStartY+(e.flightTargetY-e.flightStartY)*(1-e.flightDash/.6);}
  else {const side=e.x<player.x?-1:1,targetX=player.x+side*115,step=Math.max(-e.speed*(e.slow>0?.5:1)*dt,Math.min(e.speed*(e.slow>0?.5:1)*dt,targetX-e.x));e.x+=step+e.knockVx*dt;e.y+=(hoverY-e.y)*Math.min(1,dt*1.15);
    if(e.flightCooldown===0&&Math.abs(player.x-e.x)<135){e.flightTell=.85;e.flightTargetY=player.y+player.h/2-e.h/2;e.flightCooldown=3.6;message(e.type==='witchbat'?'WITCH BAT DIVE · MOVE!':e.type==='bat'?'BAT DIVE · MOVE!':'WISP DIVE · MOVE!',e.x,e.y-15,'#f2d4ff');burst(e.x+e.w/2,e.y+e.h/2,e.color,6);}
  }
  e.knockVx*=Math.max(0,1-dt*2.1);
}
function updateWitchbat(e,dt){
  updateFlying(e,dt);
  e.lightningCooldown=Math.max(0,(e.lightningCooldown??2)-dt);
  if(e.lightningTell>0){e.lightningTell=Math.max(0,e.lightningTell-dt);if(e.lightningTell===0){const x=e.x+e.w/2,y=e.y+e.h/2,a=Math.atan2(player.y+player.h/2-y,player.x+player.w/2-x);enemyShots.push({x,y,vx:Math.cos(a)*310,vy:Math.sin(a)*310,r:8,life:2,damage:8,effect:'shock',color:'#b9eaff'});e.lightningCooldown=3.3;}}
  else if(e.lightningCooldown===0&&Math.abs(player.x-e.x)<530){e.lightningTell=.7;message('WITCH BAT · LIGHTNING!',e.x,e.y-22,'#c7f3ff');}
}
function end(win) {
  state=win?'win':'over';
  overlay.classList.remove('map-open');
  overlay.innerHTML=`<small>${win?'FRONTIER HERO':'A NEW ADVENTURE AWAITS'}</small><h2>${win?'You won!':'Back to camp.'}</h2><p>${win?`${biomes.length} lands explored! ${player.treasures}/${chestSpots.length} treasure caches discovered.`:`You defeated ${kills} monsters. Try a different power pair next time!`}</p><button id="start">Play again →</button><button id="customize">Change hero & powers</button><p class="hint">Or press R to restart.</p>`;
  overlay.classList.remove('hidden');document.querySelector('#start').onclick=start;document.querySelector('#customize').onclick=showCharacterCreator;
}
function shootShip(){
  if(state!=='ship'||ship.fireCooldown>0)return;
  ship.fireCooldown=.16;
  for(const dx of [-12,12])ship.shots.push({x:ship.x+dx,y:ship.y-30,vy:-760});
  tone(480,.035);
}
function spawnShipEnemy(boss=false){
  const x=boss?W/2:70+Math.random()*(W-140),hp=boss?48:3;
  ship.enemies.push({x,y:boss?115:-35,hp,max:hp,boss,phase:Math.random()*7,shoot:boss?.75:1.2+Math.random()*1.2});
}
function finishSkyRun(win){
  state=win?'win':'over';keys.clear();mouse.down=false;
  overlay.innerHTML=`<small>${win?'WILDLANDS SKY ACE':'SKY RUN ENDED'}</small><h2>${win?'You won on land and in the sky!':'The sky squadron got through.'}</h2><p>${win?`You cleared all ten lands and defeated the sky ace. ${ship.kills} enemy planes shot down.`:`You shot down ${ship.kills} enemy planes. Try the Sky Run again after the citadel.`}</p><button id="start">Play again →</button><button id="customize">Change hero & powers</button>`;
  overlay.classList.remove('hidden');document.querySelector('#start').onclick=start;document.querySelector('#customize').onclick=showCharacterCreator;
}
function updateShip(dt){
  const s=ship;s.elapsed+=dt;s.scroll+=dt*125;s.inv=Math.max(0,s.inv-dt);s.fireCooldown=Math.max(0,s.fireCooldown-dt);
  const dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
  const dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
  const length=Math.hypot(dx,dy)||1;s.x=Math.max(40,Math.min(W-40,s.x+dx/length*360*dt));s.y=Math.max(125,Math.min(H-45,s.y+dy/length*360*dt));
  if(keys.has('j')||keys.has(' ')||mouse.down)shootShip();
  if(s.kills<SKY_GOAL){s.spawnTimer-=dt;if(s.spawnTimer<=0&&s.enemies.filter(e=>!e.boss&&e.hp>0).length<5){spawnShipEnemy();s.spawnTimer=.8+Math.random()*.4;}}
  else if(!s.bossSpawned){s.bossSpawned=true;spawnShipEnemy(true);}
  for(const e of s.enemies){
    if(e.hp<=0)continue;
    if(e.boss){e.x=W/2+Math.sin(s.elapsed*.95)*245;e.y=110+Math.sin(s.elapsed*1.7)*18;}
    else {e.y+=(115+e.phase*8)*dt;e.x+=Math.sin(s.elapsed*2+e.phase)*55*dt;}
    e.shoot-=dt;
    if(e.shoot<=0&&e.y>20&&e.y<H-145){
      if(e.boss){for(const angle of [-.46,-.23,0,.23,.46])s.enemyShots.push({x:e.x,y:e.y+35,vx:Math.sin(angle)*210,vy:260*Math.cos(angle)});e.shoot=1.15;}
      else {const angle=Math.atan2(s.y-e.y,s.x-e.x);s.enemyShots.push({x:e.x,y:e.y+17,vx:Math.cos(angle)*155,vy:Math.sin(angle)*155});e.shoot=2.1;}
    }
    if(s.inv<=0&&Math.abs(s.x-e.x)<(e.boss?58:30)&&Math.abs(s.y-e.y)<(e.boss?50:34)){s.hp=Math.max(0,s.hp-(e.boss?22:14));s.inv=.85;if(!e.boss)e.hp=0;}
  }
  for(const b of s.shots){b.y+=b.vy*dt;for(const e of s.enemies){if(e.hp<=0)continue;if(Math.abs(b.x-e.x)<(e.boss?54:24)&&Math.abs(b.y-e.y)<(e.boss?42:24)){e.hp--;b.y=-100;if(e.hp<=0){if(e.boss){finishSkyRun(true);return;}s.kills++;tone(610,.07);}break;}}}
  for(const b of s.enemyShots){b.x+=b.vx*dt;b.y+=b.vy*dt;if(s.inv<=0&&Math.abs(b.x-s.x)<19&&Math.abs(b.y-s.y)<25){s.hp=Math.max(0,s.hp-9);s.inv=.7;b.y=H+100;}}
  s.enemies=s.enemies.filter(e=>e.hp>0&&e.y<H+60);s.shots=s.shots.filter(b=>b.y>-30);s.enemyShots=s.enemyShots.filter(b=>b.y<H+30&&b.x>-30&&b.x<W+30);
  if(s.hp<=0)finishSkyRun(false);
}
function showCharacterCreator(){
  state='title';overlay.classList.remove('map-open','inventory-open');document.querySelector('.frame')?.classList.remove('ship-mode');
  overlay.innerHTML=`<small>THE EMERALD FRONTIER</small><h2>Create your hero.</h2><p>Choose a name, a look, and two powers. You can swap powers later in your pack.</p><div class="hero-creator"><label>Name <input id="hero-name" maxlength="16" autocomplete="off" value="Alistair"></label><label>Look <select id="hero-look"><option value="forest">Forest cloak</option><option value="storm">Storm cloak</option><option value="ember">Ember cloak</option></select></label><label>Q power <select id="hero-power-1"><option value="ice">Ice Orb</option><option value="dash">Rocket Dash</option><option value="spark">Spark</option></select></label><label>F power <select id="hero-power-2"><option value="dash">Rocket Dash</option><option value="ice">Ice Orb</option><option value="spark">Spark</option></select></label></div><button id="start">Begin adventure →</button><p class="hint">Start with the Ice Staff; find Fire and Laser Staffs later. Q and F cast your chosen powers.</p>`;
  overlay.classList.remove('hidden');document.querySelector('#start').onclick=start;
  document.querySelector('#hero-name').value=character.name;document.querySelector('#hero-look').value=character.look;
  document.querySelector('#hero-power-1').value=character.powers[0];document.querySelector('#hero-power-2').value=character.powers[1];
}
function bounceLaser(b,previousX,previousY){
  const left=training?6:stage*LEVEL_LENGTH+6,right=training?960:(stage+1)*LEVEL_LENGTH-8;
  if(b.x<left){b.x=left+(left-b.x);b.vx=Math.abs(b.vx);}else if(b.x>right){b.x=right-(b.x-right);b.vx=-Math.abs(b.vx);}
  if(b.y<8){b.y=8+(8-b.y);b.vy=Math.abs(b.vy);}else if(b.y>FLOOR-8){b.y=FLOOR-8-(b.y-(FLOOR-8));b.vy=-Math.abs(b.vy);}
  if(!training)for(const p of platforms){if(p.level!==stage||b.x<p.x-3||b.x>p.x+p.w+3||b.y<p.y-3||b.y>p.y+25)continue;
    if(previousX<p.x-3){b.x=p.x-4;b.vx=-Math.abs(b.vx);}else if(previousX>p.x+p.w+3){b.x=p.x+p.w+4;b.vx=Math.abs(b.vx);}
    else if(previousY<p.y-3){b.y=p.y-4;b.vy=-Math.abs(b.vy);}else {b.y=p.y+26;b.vy=Math.abs(b.vy);}break;
  }
}
function update(dt) {
  time+=dt;
  if(canvasTouch&&!canvasTouch.swiped&&!canvasTouch.held){
    canvasTouch.age+=dt;
    if(canvasTouch.age>=.16){canvasTouch.held=true;mouse.down=true;}
  }
  for(const k of ['cool','inv','recoil','padCooldown','jumpBuffer'])player[k]=Math.max(0,player[k]-dt);
  for(const id of Object.keys(powers))player.powerCooldowns[id]=Math.max(0,player.powerCooldowns[id]-dt);
  player.chilled=Math.max(0,player.chilled-dt);player.shocked=Math.max(0,player.shocked-dt);player.rocketDash=Math.max(0,player.rocketDash-dt);
  if(player.poison>0){player.poison=Math.max(0,player.poison-dt);player.poisonTick+=dt;if(player.poisonTick>=.75){player.poisonTick=0;player.hp=Math.max(0,player.hp-3);message('POISON -3',player.x,player.y-20,'#a9e889');}}
  player.coyote=player.ground?.1:Math.max(0,player.coyote-dt);
  const input=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
  const target=input*(player.chilled>0?210:player.attack&&player.attack.weapon===2?190:315);
  const accel=player.ground?2300:1450;
  player.vx+=Math.max(-accel*dt,Math.min(accel*dt,target-player.vx));
  if(input){if(!player.attack)player.face=input;lessons.move=true;}
  player.walk+=Math.abs(player.vx)*dt*.06;
  const previousFeet=player.y+player.h,wasFalling=player.vy>0;
  physics(player,dt);
  if(player.ground&&player.jumpBuffer>0)jump();
  if(training)player.x=Math.min(player.x,960);
  else player.x=Math.max(stage*LEVEL_LENGTH+12,Math.min((stage+1)*LEVEL_LENGTH-player.w-10,player.x));
  if(!training&&player.ground&&wasFalling&&previousFeet<FLOOR-1&&player.y+player.h>=FLOOR-1&&player.padCooldown===0&&springPads.some(x=>Math.abs(player.x+12-x)<28)) {
    player.vy=-760;player.ground=false;player.jumps=1;player.padCooldown=.5;tone(610,.13);burst(player.x,player.y+42,'#c4f28a',14);
  }
  if(mobileAim){mouse.x=player.x+12-camera+mobileAim.x;mouse.y=player.y+20+mobileAim.y;}
  if(keys.has('j')||mouse.down){if(weapons[player.weapon].effect!=='laser'||!laserHeld)attack(mouse.down);}else laserHeld=false;
  tickMelee(dt);
  spawnTimer-=dt;
  if(!training&&spawnTimer<=0&&enemies.filter(e=>!e.boss&&e.hp>0).length<3&&stageKills<biomes[stage].goal){spawnTimer=spawn()?(biomes[stage].spawnSeconds||3.6):1.2;}
  if(!training&&stage===1&&!bossSpawned&&player.x>stage*LEVEL_LENGTH+3700){spawnMonster('sandjaw',stage*LEVEL_LENGTH+4200);bossSpawned=true;message('SANDJAW · THE RIDGE GUARDIAN',player.x,player.y-70,'#ffe0ad');}
  if(!training&&stage===5&&!bossSpawned&&stageKills>=biomes[stage].goal&&player.x>stage*LEVEL_LENGTH+3700){enemies=enemies.filter(e=>e.boss);spawnMonster('warden',stage*LEVEL_LENGTH+4200);bossSpawned=true;message('LURE THE WARDEN INTO CRYSTAL TRAPS!',player.x,player.y-70,'#eed2ff');}
  if(!training&&stage===biomes.length-1&&!bossSpawned&&player.x>stage*LEVEL_LENGTH+3700){spawnMonster('titan',stage*LEVEL_LENGTH+4200);bossSpawned=true;message('THE CINDER TITAN',player.x,player.y-70,'#ffd3a3');}
  for(const e of enemies) {
    if(e.hp<=0)continue;
    if(e.dummy){e.flash=Math.max(0,(e.flash||0)-dt);continue;}
    e.trapCooldown=Math.max(0,(e.trapCooldown||0)-dt);
    e.hitLabelCooldown=Math.max(0,(e.hitLabelCooldown||0)-dt);
    e.slow=Math.max(0,(e.slow||0)-dt);e.stun=Math.max(0,(e.stun||0)-dt);e.freeze=Math.max(0,(e.freeze||0)-dt);e.burn=Math.max(0,(e.burn||0)-dt);e.rocketHitCooldown=Math.max(0,(e.rocketHitCooldown||0)-dt);
    if(e.burn>0){e.burnTick=(e.burnTick||0)+dt;if(e.burnTick>=.5){e.burnTick-=.5;hit(e,5);if(e.hp<=0)continue;}}
    const dir=Math.sign(player.x-e.x);
    if(e.stun<=0&&e.freeze<=0){if(e.type==='witchbat')updateWitchbat(e,dt);else if(e.flying)updateFlying(e,dt);
    else {if(e.type==='sandjaw')updateSandjaw(e,dt);else if(e.type==='warden')updateWarden(e,dt);else if(e.type==='titan')updateTitan(e,dt);else {const rush=e.charge&&Math.sin(time*1.8+e.phase)>.65?1.65:1;e.vx+=(dir*e.speed*(e.slow>0?.5:1)*rush-e.vx)*dt*3;if(e.ground&&(e.hop?Math.random()<dt*2.2:Math.random()<dt*.7))e.vy=e.hop?-445:-340;}physics(e,dt);if(e.type==='sandjaw'&&e.stomping&&e.ground){e.stomping=false;burst(e.x+e.w/2,e.y+e.h,'#e9c48d',14);}if(e.type==='titan'&&e.stomping&&e.ground){e.stomping=false;titanShockwave(e);}}}
    if(player.rocketDash>0&&e.rocketHitCooldown===0&&overlap(player,e)){hit(e,35);knockback(e,player.face,650,100);e.rocketHitCooldown=.5;}
    if(e.type!=='warden'&&e.freeze<=0&&overlap(player,e)&&player.inv<=0){player.hp=Math.max(0,player.hp-e.damage);player.inv=1;player.vy=-220;if(e.type==='scorpion'){player.poison=3;player.poisonTick=0;message('POISONED!',player.x,player.y-25,'#b9f18f');}if(e.type==='frostmite'){player.chilled=1.8;message('CHILLED!',player.x,player.y-25,'#b6f1ff');}burst(player.x,player.y,'#ffb195');tone(80,.13);}
  }
  for(const b of bullets) {
    if(b.life<=0)continue;
    const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
    if(b.effect==='laser')bounceLaser(b,ox,oy);
    for(const e of enemies) {
      if(e.hp<=0)continue;
      if(b.effect==='burn'&&b.hitTargets.has(e)||b.effect==='laser'&&(b.hitTargets.get(e)??-Infinity)>time-.7)continue;
      const steps=Math.ceil(Math.hypot(b.x-ox,b.y-oy)/8);let found=false;
      for(let i=0;i<=steps;i++){const f=i/Math.max(1,steps),x=ox+(b.x-ox)*f,y=oy+(b.y-oy)*f;if(x>=e.x&&x<=e.x+e.w&&y>=e.y&&y<=e.y+e.h){found=true;break;}}
      if(found){hit(e,b.damage);if(b.effect==='freeze')e.freeze=e.boss?.45:1.25;if(!e.boss&&b.effect==='shock')e.stun=.55;if(b.effect==='burn'){e.burn=3;e.burnTick=0;b.hitTargets.add(e);}if(b.effect==='laser')b.hitTargets.set(e,time);knockback(e,Math.sign(b.vx),b.damage*3.3,55);if(b.effect!=='burn'&&b.effect!=='laser'){b.life=0;break;}}
    }
  }
  for(const b of enemyShots){
    const oldX=b.x,oldY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
    if(b.life<=0)continue;
    if(platforms.some(p=>p.level===stage&&b.x+b.r>p.x&&b.x-b.r<p.x+p.w&&b.y+b.r>p.y&&b.y-b.r<p.y+22)){b.life=0;continue;}
    if(player.inv>0)continue;
    const steps=Math.ceil(Math.hypot(b.x-oldX,b.y-oldY)/7);
    for(let i=0;i<=steps;i++){const f=i/Math.max(1,steps),x=oldX+(b.x-oldX)*f,y=oldY+(b.y-oldY)*f;
      if(x+b.r>player.x&&x-b.r<player.x+player.w&&y+b.r>player.y&&y-b.r<player.y+player.h){player.hp=Math.max(0,player.hp-b.damage);player.inv=.8;player.vy=-170;if(b.effect==='shock'){player.shocked=.95;message('SHOCKED · MAGIC JAMMED',player.x,player.y-20,'#c7f3ff');}b.life=0;burst(x,y,'#ffd1ef',12);tone(88,.12);break;}}
  }
  enemies=enemies.filter(e=>e.hp>0&&(e.dummy||e.boss||Math.abs(e.x-player.x)<1600));bullets=bullets.filter(b=>b.life>0);enemyShots=enemyShots.filter(b=>b.life>0);
  const activeLoot=training?trainingLoot:loot;
  const remainingLoot=activeLoot.filter(l=>{
    if(Math.abs(player.x+12-l.x)>31||Math.abs(player.y+22-l.y)>46)return true;
    if(l.type==='weapon')collectWeapon(l.weapon);
    else if(l.type==='upgrade'){player.swordLevel++;weapons[0].name=player.swordLevel===1?'IRON SWORD':'STAR SWORD';weapons[0].tip=`Sword upgrade: +18 damage · ${weaponDamage(0)} total`;message(`SWORD +18 DAMAGE · ${weaponDamage(0)} TOTAL`,l.x,l.y-35,'#c9f8f4');}
    else if(l.type==='weapon-upgrade'){player.weaponLevels[l.weapon]++;message(`${weapons[l.weapon].name} IMPROVED · ${weaponDamage(l.weapon)} DAMAGE`,l.x,l.y-35,'#c9f8f4');}
    else if(l.type==='ammo'){player.ammo+=20;message('+20 ammo',l.x,l.y-25,'#ffe091');}
    else {player.potions++;message('+1 potion · E to heal',l.x,l.y-25,'#ffb7cd');}
    tone(800,.1);burst(l.x,l.y,'#fff5bb');return false;
  });
  if(training)trainingLoot=remainingLoot;else loot=remainingLoot;
  if(!training) {
    for(const c of chests)if(!c.opened&&Math.abs(player.x+12-c.x)<38&&Math.abs(player.y+22-c.y)<45){c.opened=true;player.treasures++;player.ammo+=40;player.potions++;message('Treasure! +40 ammo +1 potion',c.x,c.y-35,'#ffe49a');burst(c.x,c.y,'#ffe49a',20);tone(940,.2);}
    for(const c of camps)if(!c.used&&player.ground&&player.y+player.h>=FLOOR-1&&Math.abs(player.x+12-c.x)<45){c.used=true;player.hp=100;player.poison=0;player.chilled=0;player.shocked=0;const needsAmmo=player.inventory.some(i=>weapons[i].gun&&!weapons[i].freeAmmo);if(needsAmmo)player.ammo+=30;message(needsAmmo?'REST STOP · Full health +30 ammo':'REST STOP · Full health',c.x,player.y-50,'#b8efb2');tone(730,.2);}
    for(const t of traps){if(t.x<stage*LEVEL_LENGTH||t.x>(stage+1)*LEVEL_LENGTH)continue;const armed=t.kind!=='crystal-trap'||Math.sin(time*2.5+t.x)>-.2;
      if(!armed)continue;
      if(player.ground&&player.y+player.h>=FLOOR-1&&player.inv<=0&&Math.abs(player.x+12-(t.x+28))<31){player.hp=Math.max(0,player.hp-11);player.inv=.9;player.vy=-260;burst(player.x,player.y+40,'#f7b2a3',8);message('TRAP!',player.x,player.y-20,'#ffd3a8');}
      for(const e of enemies){if(e.hp<=0||e.dummy||!e.ground||e.y+e.h<FLOOR-1||e.trapCooldown>0)continue;
        if(e.x+e.w<=t.x||e.x>=t.x+t.w)continue;
        e.trapCooldown=.9;hit(e,e.type==='warden'?85:e.boss?25:35);if(e.hp>0){e.vx+=(e.x+e.w/2<t.x+t.w/2?-1:1)*(e.boss?95:185);e.vy=-100;}
        burst(e.x+e.w/2,FLOOR-20,'#f7b2a3',8);message(e.boss?'BOSS HIT BY TRAP!':'TRAP HIT!',e.x,e.y-16,'#ffd3a8');
      }
    }
    const gate=(stage+1)*LEVEL_LENGTH-160,open=completed[stage]||(stageKills>=biomes[stage].goal&&(!biomes[stage].boss||bossDefeated));
    if(player.x>=gate-8){if(open){finishLevel();return;}player.x=gate-8;player.vx=0;if(Math.random()<dt){const remaining=Math.max(0,biomes[stage].goal-stageKills);message(remaining?`Defeat ${remaining} more monsters!`:`Defeat ${biomes[stage].bossName}!`);}}
  }
  for(const s of sparks){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=600*dt;s.life-=dt;}sparks=sparks.filter(s=>s.life>0);
  for(const l of labels){l.y-=22*dt;l.life-=dt;}labels=labels.filter(l=>l.life>0);
  for(const w of waves)w.life-=dt;waves=waves.filter(w=>w.life>0);
  const targetCamera=training?0:Math.max(stage*LEVEL_LENGTH,Math.min((stage+1)*LEVEL_LENGTH-W,player.x-W*.38));
  camera+=(targetCamera-camera)*Math.min(1,dt*8);
  if(player.hp<=0)end(false);
}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function text(t,x,y,size=16,color='#eef7ea'){ctx.fillStyle=color;ctx.font=`bold ${size}px Segoe UI, sans-serif`;ctx.fillText(t,x,y);}
function line(x1,y1,x2,y2,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function sprite(name,x,y,w,h){const img=sprites[name];if(!img)return false;ctx.drawImage(img,Math.round(x),Math.round(y),w,h);return true;}
function animatedSprite(name,x,y,w,h,rate=5,pose){const img=sprites[name];if(!img)return false;const frames=Math.max(1,Math.floor(img.width/64)),frame=pose===undefined?Math.floor(time*rate)%frames:Math.min(frames-1,pose);ctx.drawImage(img,frame*64,0,64,48,Math.round(x),Math.round(y),w,h);return true;}
function drawBackground() {
  const b=biomes[region],v=b.visual,sky=ctx.createLinearGradient(0,0,0,FLOOR);sky.addColorStop(0,b.sky);sky.addColorStop(1,b.haze);ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  rect(850,95,48,48,['#ecdba5','#ffd7aa','#d5e0e4','#deecd0','#efffff','#ffb16f','#c4efc0','#e2ebfa','#efb0a1','#ffe8ad'][v]);
  for(let i=-1;i<9;i++){const x=i*210-(camera*.15)%210;ctx.fillStyle=['#4f6866','#756373','#3a5070','#416b67','#698fa7','#8c5960','#4e7d70','#596d89','#584953','#a37b6d'][v];ctx.beginPath();ctx.moveTo(x-180,FLOOR);ctx.lineTo(x+50,170+(i%3)*45);ctx.lineTo(x+250,FLOOR);ctx.fill();}
  for(let i=-1;i<12;i++){const x=i*135-(camera*.4)%135,y=245+(i%4)*22;
    if(v===0&&sprites['background-pine'])sprite('background-pine',x-65,y-30,145,330);
    else if(v===0){rect(x,y,14,330,'#345e59');for(let j=0;j<3;j++)rect(x-44+j*8,y-23+j*35,105-j*16,48,'#3c6e61');}
    else if(v===1){rect(x-35,y+160,95,170,'#806567');rect(x-48,y+154,120,13,'#a47c70');rect(x-12,y+120,46,45,'#9c7770');rect(x-20,y+116,61,9,'#ba8c74');}
    else if(v===2){rect(x,y,28,330,'#435574');rect(x-9,y,46,13,'#64778f');rect(x+6,y+25,5,220,'#6c8096');rect(x-4,y+70,36,5,'#91aebb');}
    else if(v===3){rect(x,y+115,20,225,'#37584d');rect(x-58,y+75,132,62,'#4e7860');rect(x-43,y+45,104,45,'#699674');for(let j=0;j<5;j++)rect(x-48+j*24,y+121,4,72+(j%2)*30,'#789b76');}
    else if(v===4){ctx.fillStyle='#b3d9e1';ctx.beginPath();ctx.moveTo(x-26,FLOOR);ctx.lineTo(x+13,y+34);ctx.lineTo(x+58,FLOOR);ctx.fill();rect(x+10,y+100,6,150,'#e8f5ef');rect(x-25,FLOOR-24,82,9,'#d5eef0');}
    else if(v===6){rect(x-13,y+30,30,300,'#355f55');rect(x-75,y+5,150,75,'#4d8872');rect(x-55,y-25,112,54,'#75ae83');for(let j=0;j<3;j++)rect(x-56+j*42,y+83,5,105,'#9ac78c');}
    else if(v===7){rect(x-17,y+85,34,245,'#5d7391');rect(x-46,y+72,91,18,'#8cabc4');rect(x-37,y+65,73,8,'#d1e0ef');line(x-100,y+30,x-27,y+20,3,'#c9e6ed');}
    else if(v===8){rect(x-39,y+123,95,210,'#423b49');rect(x-45,y+110,108,16,'#6f5661');rect(x-28,y+160,14,95,'#d87968');rect(x+28,y+178,11,80,'#dd9271');}
    else if(v===9){rect(x-30,y+106,95,225,'#93736c');rect(x-38,y+95,113,15,'#cfaa84');rect(x-10,y+75,54,24,'#e7bc90');rect(x+4,y+130,26,90,'#f2d5a9');}
    else {rect(x-27,y+115,102,220,'#6c4b50');rect(x-37,y+103,122,17,'#9d6260');rect(x-12,y+155,18,24,'#f2a56b');rect(x+37,y+155,18,24,'#f2a56b');for(let j=0;j<3;j++)rect(x-30+j*35,y+88,19,20,'#805155');}}
}
function drawScenery() {
  const b=biomes[region],v=b.visual,start=training?0:stage*LEVEL_LENGTH;
  const gravel=['#587b45','#a47555','#527e88','#4b7360','#8bb8c4','#975f58','#698e68','#7995ac','#70545b','#c59c77'][v];
  rect(start,FLOOR,LEVEL_LENGTH,80,b.soil);rect(start,FLOOR,LEVEL_LENGTH,8,b.grass);rect(start,FLOOR+8,LEVEL_LENGTH,12,gravel);
  const left=Math.max(0,Math.floor(camera/47)-1),right=Math.ceil((camera+W)/47)+1;
  for(let i=left;i<right;i++){
    const x=i*47,stone=['#987961','#ddae7f','#829ca6','#719686','#b7d8db','#c6846d','#8baf84','#b8d2dd','#a07478','#e7bc8c'][v];
    rect(x,FLOOR-8,3,9,b.grass);
    if(i%4===0){rect(x-3,FLOOR-17,9,8,stone);rect(x,FLOOR-10,3,10,gravel);}
    rect(x+8,FLOOR+26+(i%4)*7,11,4,stone);rect(x+24,FLOOR+48+(i%3)*5,17,3,gravel);
    rect(x+2,FLOOR+8,3,4,stone);
    if(i%3===0){rect(x+30,FLOOR+16,10,3,gravel);rect(x+35,FLOOR+13,3,3,stone);}
  }
  for(let i=Math.floor(camera/360);i<=Math.ceil((camera+W)/360);i++){
    const x=i*360-80;
    if(v===0)sprite('woodland-tree',x,FLOOR-220,196,220);
    else if(v===1){
      rect(x+79,FLOOR-91,16,91,'#264e4c');rect(x+81,FLOOR-87,12,86,'#4c8272');rect(x+83,FLOOR-84,3,72,'#77a28a');
      rect(x+45,FLOOR-58,13,37,'#2b5750');rect(x+48,FLOOR-55,7,30,'#5d907b');
      rect(x+55,FLOOR-29,33,11,'#2b5750');rect(x+56,FLOOR-28,30,6,'#659782');
      rect(x+92,FLOOR-55,33,11,'#2b5750');rect(x+94,FLOOR-53,29,6,'#659782');
      rect(x+116,FLOOR-55,13,29,'#2b5750');rect(x+119,FLOOR-53,7,25,'#77a28a');
      for(let j=0;j<5;j++){rect(x+76,FLOOR-75+j*15,3,2,'#b7cda1');rect(x+95,FLOOR-80+j*16,3,2,'#b7cda1');}
      rect(x+68,FLOOR-6,38,6,'#b88865');rect(x+73,FLOOR-11,29,5,'#d6a875');
    }
    else if(v===2){rect(x+55,FLOOR-110,24,110,'#64778f');rect(x+45,FLOOR-115,44,12,'#91a5ab');ctx.fillStyle='#91d9e7';ctx.beginPath();ctx.moveTo(x+110,FLOOR);ctx.lineTo(x+125,FLOOR-95);ctx.lineTo(x+150,FLOOR);ctx.fill();}
    else if(v===3){rect(x+24,FLOOR-14,130,14,'#3c7269');rect(x+35,FLOOR-12,110,5,'#7fc8a5');rect(x+198,FLOOR-75,15,75,'#564b3e');rect(x+176,FLOOR-85,57,24,'#64815b');rect(x+188,FLOOR-105,38,26,'#8eae6c');}
    else if(v===4){ctx.fillStyle='#c7eff4';ctx.beginPath();ctx.moveTo(x+64,FLOOR);ctx.lineTo(x+84,FLOOR-105);ctx.lineTo(x+113,FLOOR);ctx.fill();rect(x+83,FLOOR-82,5,74,'#f2ffff');rect(x+124,FLOOR-25,68,25,'#91c6ce');rect(x+126,FLOOR-25,64,6,'#e9f7ee');}
    else if(v===6){rect(x+52,FLOOR-135,21,135,'#496e54');rect(x+26,FLOOR-148,74,39,'#5b9974');rect(x+38,FLOOR-169,51,29,'#85b988');rect(x+152,FLOOR-38,16,38,'#6b5549');rect(x+141,FLOOR-43,39,12,'#d4a9aa');}
    else if(v===7){rect(x+44,FLOOR-92,72,92,'#697f99');rect(x+38,FLOOR-97,86,9,'#b2d0df');rect(x+156,FLOOR-126,30,126,'#758fac');rect(x+148,FLOOR-132,46,8,'#cce2ea');}
    else if(v===8){rect(x+36,FLOOR-106,75,106,'#443d4b');rect(x+30,FLOOR-110,88,9,'#745761');rect(x+56,FLOOR-70,8,64,'#df7864');rect(x+87,FLOOR-53,7,47,'#ed9e75');rect(x+161,FLOOR-24,40,24,'#a96761');}
    else if(v===9){rect(x+35,FLOOR-95,84,95,'#a78575');rect(x+29,FLOOR-103,96,10,'#e7bd91');rect(x+57,FLOOR-69,39,69,'#6d5860');rect(x+55,FLOOR-72,43,8,'#e8c69b');rect(x+171,FLOOR-40,45,40,'#c8a07d');}
    else {rect(x+39,FLOOR-78,87,78,'#6b4b48');rect(x+34,FLOOR-83,97,10,'#a36a5a');rect(x+47,FLOOR-54,18,31,'#de8660');rect(x+89,FLOOR-54,18,31,'#de8660');rect(x+178,FLOOR-39,12,39,'#59464a');rect(x+168,FLOOR-50,32,13,'#e78d58');rect(x+176,FLOOR-63,16,14,'#ffc16e');}
  }
  for(const p of platforms){if(p.x+p.w<camera||p.x>camera+W||p.level!==region)continue;
    const name=['log-platform','sandstone-platform','ruin-platform','log-platform','ruin-platform','sandstone-platform','log-platform','ruin-platform','ruin-platform','sandstone-platform'][v];
    for(let x=p.x;x<p.x+p.w;x+=60)if(!animatedSprite(name,x,p.y-6,Math.min(60,p.x+p.w-x),42,1))rect(x,p.y,Math.min(60,p.x+p.w-x),22,b.soil);
  }
  if(training){rect(30,FLOOR-54,90,54,'#765a44');rect(22,FLOOR-62,106,12,'#a17d54');text('CAMP',50,FLOOR-30,14,'#ffe8b1');rect(952,FLOOR-94,7,94,'#927250');rect(926,FLOOR-94,95,29,'#46675d');text('ENTER →',933,FLOOR-74,12);return;}
  for(const x of springPads){rect(x-27,FLOOR-7,54,8,'#30484f');rect(x-23,FLOOR-14,46,7,'#789c76');rect(x-19,FLOOR-17,38,4,'#d0f5a1');rect(x-24,FLOOR-6,5,4,'#a5c8b6');rect(x+19,FLOOR-6,5,4,'#a5c8b6');for(let j=-1;j<=1;j++)text('↑',x+j*13-5,FLOOR-22,15,'#e1ffbc');}
  for(const c of camps){rect(c.x-16,FLOOR-78,6,78,'#513f3c');rect(c.x-14,FLOOR-77,2,74,'#d2aa7d');rect(c.x-10,FLOOR-75,55,29,c.used?'#64775d':'#d6bf8f');rect(c.x-10,FLOOR-75,55,4,c.used?'#91a389':'#f6dcaa');rect(c.x-10,FLOOR-50,55,4,'#775b4f');text('+',c.x+9,FLOOR-52,20,'#3d6556');rect(c.x-30,FLOOR-12,60,12,'#675347');rect(c.x-26,FLOOR-12,52,3,'#a28462');}
  for(const c of chests){if(c.x<camera-50||c.x>camera+W+50)continue;rect(c.x-18,c.y-10,36,26,c.opened?'#6d6357':'#b97d3f');rect(c.x-18,c.y-10,36,6,'#e7bd63');rect(c.x-3,c.y-3,6,12,'#ffe29b');if(!c.opened){const y=c.y-25+Math.sin(time*3)*4;line(c.x-5,y,c.x+5,y,2,'#ffe79b');line(c.x,y-5,c.x,y+5,2,'#ffe79b');}}
  for(const t of traps)if(t.x>=camera-80&&t.x<=camera+W+80&&Math.floor(t.x/LEVEL_LENGTH)===stage){const armed=t.kind!=='crystal-trap'||Math.sin(time*2.5+t.x)>-.2;
    ctx.globalAlpha=armed?1:.4;animatedSprite(t.kind,t.x,FLOOR-38,t.w,38,3);ctx.globalAlpha=1;}
  const gate=(stage+1)*LEVEL_LENGTH-160,open=completed[stage]||(stageKills>=b.goal&&(!b.boss||bossDefeated));
  rect(gate,FLOOR-124,74,124,'#657c85');rect(gate+8,FLOOR-116,58,116,open?'#7cdbbf':'#466766');rect(gate+17,FLOOR-103,40,103,open?'#c4ffe0':'#254747');
  text(open?'TO MAP →':b.boss&&!bossDefeated?`${b.bossName} + ${b.goal} KILLS`:`${stageKills}/${b.goal} TO OPEN`,gate-25,FLOOR-140,13,open?'#dcffac':'#d0e1d3');
}
function drawItem(type,x,y,scale=1) {
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  // Draw just the icon pixels: the supplied PNGs include a dark, nearly opaque tile.
  if(type==='potion'){
    rect(-5,-17,10,5,'#d9b98b');rect(-7,-12,14,4,'#f5dfb0');
    rect(-10,-8,20,22,'#d8edf0');rect(-8,-6,16,18,'#385c6a');
    rect(-7,-2,14,12,'#df6d9c');rect(-5,-4,10,3,'#f7b4ca');
    rect(-6,1,3,7,'#ffe0ef');rect(4,1,2,7,'#ac4c7a');rect(-5,12,10,2,'#a5dfe3');
  } else {
    rect(-14,-9,28,23,'#5d4636');rect(-12,-11,24,4,'#d5a45d');
    rect(-11,-5,22,16,'#a8753f');rect(-9,9,18,3,'#6d4935');
    for(let n=0;n<3;n++){const px=-7+n*7;rect(px,-7,4,15,'#efcc75');rect(px,-10,4,3,'#f8e5a1');rect(px,5,4,3,'#be8752');}
  }
  ctx.restore();
}
function drawLoot() {
  for(const l of training?trainingLoot:loot){if(l.x<camera-50||l.x>camera+W+50)continue;const y=l.y+Math.sin(time*3+l.x)*4;
    if(l.type==='ammo'||l.type==='potion')drawItem(l.type,l.x,y);
    else {drawWeapon(l.x-16,y,1,l.type==='upgrade'?0:l.weapon);text(l.type==='upgrade'?'SWORD UPGRADE':l.type==='weapon-upgrade'?`${weapons[l.weapon].name} +`:weapons[l.weapon].name,l.x-35,y-31,10,'#fff0bd');}
  }
}
function drawTitan(e){
  const x=e.x,y=e.y,fire=e.phaseTwo?'#ffe083':'#f5ae65',flicker=Math.floor(time*12)%3;
  rect(x+14,y+16+flicker,20,29,'#b86151');rect(x+74,y+11-flicker,18,31,'#d07750');rect(x+26,y+2,12,31,fire);rect(x+71,y+4,10,30,fire);
  rect(x+19,y+73,31,26,'#332f3a');rect(x+58,y+73,31,26,'#332f3a');rect(x+17,y+95,36,8,'#79605c');rect(x+56,y+95,37,8,'#79605c');
  rect(x+18,y+25,72,56,'#322f3b');rect(x+27,y+29,54,50,'#5a4249');rect(x+35,y+35,38,39,'#8e504c');
  rect(x+2,y+34,24,40,'#443943');rect(x+82,y+34,24,40,'#443943');rect(x,y+67,27,16,'#b76a52');rect(x+81,y+67,27,16,'#b76a52');
  rect(x+9,y+29,33,13,'#9b6258');rect(x+67,y+29,33,13,'#9b6258');rect(x+17,y+36,9,10,'#e49a63');rect(x+84,y+36,8,10,'#e49a63');
  rect(x+35,y+3,39,32,'#2e303a');rect(x+39,y+7,31,26,'#69464a');rect(x+43,y+18,8,6,fire);rect(x+59,y+18,8,6,fire);rect(x+48,y+28,16,4,'#231f2b');
  ctx.fillStyle='#c88057';ctx.beginPath();ctx.moveTo(x+38,y+11);ctx.lineTo(x+21,y-14);ctx.lineTo(x+48,y+4);ctx.moveTo(x+70,y+11);ctx.lineTo(x+87,y-14);ctx.lineTo(x+61,y+4);ctx.fill();
  rect(x+47,y+46,18,23,'#ec935a');rect(x+50,y+49,12,17,fire);rect(x+54,y+52,4,10,'#fff0ae');
  line(x+33,y+49,x+23,y+62,4,fire);line(x+77,y+48,x+89,y+61,4,fire);line(x+36,y+76,x+49,y+83,3,'#cb7758');line(x+73,y+76,x+61,y+83,3,'#cb7758');
  if(e.tell>0){ctx.globalAlpha=.35+.2*Math.sin(time*25);rect(x-8,y-9,e.w+16,e.h+16,e.queuedAttack==='wave'?'#f6ba67':'#ff815c');ctx.globalAlpha=1;}
}
function drawSandjaw(e){
  const x=e.x,y=e.y,blink=Math.floor(time*4)%2,glow=e.phaseTwo?'#f9e69a':'#e7bc7d';
  rect(x+8,y+35,61,23,'#715347');rect(x+14,y+47,14,13,'#4d433d');rect(x+52,y+47,15,13,'#4d433d');
  rect(x+4,y+25,68,26,'#a97655');rect(x+13,y+13,53,29,'#d6a570');rect(x+20,y+7,40,10,'#ebc48c');
  rect(x+1,y+37,25,13,'#794b45');rect(x+51,y+37,24,13,'#794b45');rect(x+6,y+47,18,9,'#c18e62');rect(x+54,y+47,18,9,'#c18e62');
  rect(x+20,y+22,12,8,'#573e3b');rect(x+45,y+22,12,8,'#573e3b');rect(x+24,y+23,blink?5:7,5,glow);rect(x+47,y+23,blink?5:7,5,glow);
  rect(x+28,y+37,23,7,'#432f32');rect(x+30,y+41,20,10,'#f1d2a0');for(let j=0;j<4;j++)rect(x+31+j*5,y+43,3,6,'#fff1ca');
  rect(x+2,y+16,14,7,'#e9be85');rect(x+60,y+16,14,7,'#e9be85');rect(x+9,y+10,10,12,'#b8845c');rect(x+57,y+10,10,12,'#b8845c');
  if(e.tell>0){ctx.globalAlpha=.28+.18*Math.sin(time*24);rect(x-7,y-7,e.w+14,e.h+14,e.queuedAttack==='spray'?'#f6d692':'#fba776');ctx.globalAlpha=1;}
}
function drawEnemy(e) {
  if(e.dummy){if(sprite('training-dummy',e.x-8,e.y+e.h-64,48,64))return;rect(e.x+12,e.y+15,7,31,'#997348');rect(e.x-6,e.y+15,46,6,'#b89a70');rect(e.x+1,e.y+1,e.w-2,28,e.flash>0?'#fff2ba':'#d3b078');rect(e.x+9,e.y+8,14,14,'#9c624e');rect(e.x+14,e.y+12,5,6,'#edd8a5');rect(e.x+3,e.y+43,27,3,'#765a40');return;}
  if(e.boss){const titan=e.type==='titan',sandjaw=e.type==='sandjaw',name=titan?'CINDER TITAN':sandjaw?'SANDJAW':'WARDEN';rect(e.x-8,e.y-27,Math.max(0,e.w+16),8,'#1a2b43');rect(e.x-8,e.y-27,(e.w+16)*e.hp/e.max,8,titan?(e.phaseTwo?'#ffe083':'#f19c68'):sandjaw?(e.phaseTwo?'#f7d394':'#dba66e'):(e.phaseTwo?'#f374be':'#d69cdf'));text(`${name}${e.phaseTwo?' · ENRAGED':''}`,e.x+1,e.y-34,11,'#eff1f7');if(titan){drawTitan(e);return;}if(sandjaw){drawSandjaw(e);return;}if(e.tell>0){const glow=e.queuedAttack==='nova'?'#f77dda':e.queuedAttack==='volley'?'#f6a9e7':'#ffcd8c';ctx.globalAlpha=.32+.25*Math.sin(time*27);rect(e.x-12,e.y-8,e.w+24,e.h+16,glow);ctx.globalAlpha=1;}}
  const spriteName=e.type||'slime';
  const animated=!['slime','bat'].includes(spriteName);
  const nearPlayer=Math.abs(player.x-e.x)<e.w+55&&Math.abs(player.y-e.y)<e.h+55;
  const pose=e.boss?(e.tell>0?2:e.dash>0?3:Math.floor(time*5)%2):nearPlayer?2:(!e.flying&&!e.ground)?3:Math.floor(time*5+e.phase)%2;
  const drawn=animated?animatedSprite(spriteName,e.x-(e.boss?6:5),e.y-(e.boss?5:5),e.w+(e.boss?12:10),e.h+(e.boss?10:10),5,pose):sprite(spriteName,e.x-5,e.y-5,e.w+10,e.h+10);
  if(!drawn){
    if(e.flying){rect(e.x-12,e.y+Math.sin(time*20)*7,14,12,e.color);rect(e.x+28,e.y-Math.sin(time*20)*7,14,12,e.color);}
    rect(e.x,e.y+4,e.w,e.h-4,e.color);rect(e.x+5,e.y,e.w-10,8,e.color);rect(e.x+7,e.y+10,5,5,'#25394c');rect(e.x+22,e.y+10,5,5,'#25394c');
  }
  if(e.flying&&e.flightTell>0){ctx.globalAlpha=.55+.35*Math.sin(time*18);rect(e.x-8,e.y-10,e.w+16,3,'#fff0a5');text('!',e.x+e.w/2-5,e.y-17,20,'#fff4b6');ctx.globalAlpha=1;}
  if(e.slow>0||e.freeze>0){rect(e.x-2,e.y+e.h-3,e.w+4,4,'#8ce2ff');}
  if(e.freeze>0){rect(e.x-3,e.y-3,e.w+6,3,'#d9faff');rect(e.x-3,e.y+3,3,e.h-3,'#8ce2ff');}
  if(e.burn>0){rect(e.x+e.w/2-4,e.y-9,8,8,'#ff9b4e');rect(e.x+e.w/2-2,e.y-13,4,6,'#ffe2a0');}
  if(e.stun>0){text('✦',e.x+e.w/2-7,e.y-14,20,'#ffeb9b');}
  if(e.hp<e.max&&!e.boss){rect(e.x,e.y-10,e.w,4,'#243936');rect(e.x,e.y-10,e.w*e.hp/e.max,4,'#f7a090');}
}
// Weapons use the hand as their local origin, so every swing stays attached.
function drawWeapon(x,y,dir,i,angle=0,scale=1) {
  ctx.save();ctx.translate(x,y);ctx.scale(dir*scale,scale);ctx.rotate(angle);
  const size=weaponSpriteSizes[i];
  if(size&&sprite(weaponSpriteNames[i],-9,-size[1]/2,size[0],size[1])){ctx.restore();return;}
  if(i===0){rect(-6,-3,14,6,'#927049');rect(6,-9,5,18,'#e3bd70');rect(11,-4,43,8,'#c7ebdf');rect(13,-3,41,2,'#f3ffff');ctx.fillStyle='#e5f7f2';ctx.beginPath();ctx.moveTo(54,-4);ctx.lineTo(62,0);ctx.lineTo(54,4);ctx.fill();}
  else if(i===2){rect(-6,-3,49,6,'#ba8e62');rect(33,-17,24,34,'#ab89c8');rect(35,-17,5,34,'#e3cafa');rect(40,-12,14,5,'#c8adde');}
  else if(i===3){rect(-6,-3,54,6,'#bb895b');rect(37,-7,6,14,'#aaa989');ctx.fillStyle='#dde9db';ctx.beginPath();ctx.moveTo(38,-4);ctx.lineTo(46,-23);ctx.lineTo(63,-16);ctx.lineTo(67,0);ctx.lineTo(46,8);ctx.fill();line(62,-14,65,0,3,'#f3fff1');}
  else if(i===1){rect(-5,-7,27,10,'#7b8e94');rect(19,-6,7,7,'#c6d1d0');rect(-3,3,8,12,'#aa7b54');rect(1,-10,5,3,'#c6d1d0');}
  else if(i===4){rect(-10,-7,42,12,'#637873');rect(32,-5,22,6,'#a1afb1');rect(-16,-4,12,14,'#98774f');rect(9,5,10,17,'#45504e');rect(20,-11,7,4,'#bbcaad');}
  else if(i===5){rect(-15,-2,23,9,'#a27a53');rect(5,-7,49,6,'#b8c4c2');rect(5,0,49,5,'#6d7e80');rect(21,3,16,7,'#b28b5d');}
  else if(i===6){rect(-16,-2,28,10,'#a27a53');rect(8,-6,31,10,'#728886');rect(39,-4,29,4,'#aabdbd');rect(14,-14,18,5,'#839c99');rect(19,-9,4,4,'#526765');}
  else if(i===7){rect(-8,-3,40,7,'#785639');rect(24,-11,22,23,'#a77b4b');rect(28,-8,5,16,'#d2a66b');rect(39,-6,4,13,'#5c4234');}
  else if(i===8){rect(-7,-3,35,5,'#a9774b');line(20,-14,28,0,5,'#745340');line(20,14,28,0,5,'#745340');rect(37,-5,11,10,'#b9ae98');rect(41,-2,5,4,'#ece5cf');}
  else if(i===9){rect(-8,-3,55,7,'#8c4d46');rect(34,-8,11,17,'#e4bd78');rect(47,-10,14,21,'#e56d3e');rect(51,-8,7,16,'#ffbc61');rect(59,-4,6,8,'#ffe3a0');}
  else if(i===10){rect(-8,-3,58,6,'#6e8c69');rect(36,-14,18,27,'#72bba5');rect(41,-9,8,17,'#c9f7db');line(56,-14,65,-4,3,'#dcffe5');line(57,0,69,0,3,'#dcffe5');line(56,13,65,4,3,'#dcffe5');}
  else if(i===11){rect(-8,-4,22,8,'#766242');rect(10,-5,7,10,'#d3c08b');line(16,0,52,-7,6,'#568761');line(52,-7,89,-2,4,'#8cc077');line(89,-2,111,-14,3,'#b6d989');rect(58,-12,7,8,'#b5dd91');rect(83,-8,6,7,'#d7e7a4');}
  else if(i===13||i===14||i===15){rect(-8,-3,57,7,i===13?'#527890':i===15?'#71466e':'#695774');rect(34,-7,9,15,'#d6e2d9');rect(45,-11,16,22,i===13?'#7ad9f0':i===15?'#d962ba':'#e5c772');rect(49,-7,8,14,i===13?'#dcfbff':i===15?'#ffe3fa':'#fff3b4');rect(59,-3,6,6,'#f7ffff');}
  else {rect(-7,-3,48,6,'#5e7780');rect(26,-15,15,29,'#a9d9e1');rect(29,-10,5,18,'#ecffff');ctx.fillStyle='#d9f7f8';ctx.beginPath();ctx.moveTo(41,-7);ctx.lineTo(57,0);ctx.lineTo(41,7);ctx.fill();}
  ctx.restore();
}
function weaponPose() {
  const a=player.attack,w=weapons[player.weapon];
  if(!a){let angle=w.gun&&mouse.down?Math.atan2(mouse.y-(player.y+20),(mouse.x+camera-player.x-12)*player.face):w.gun?0:-.45;return {angle,reach:9-(player.recoil>0?4:0)};}
  const p=Math.min(1,a.elapsed/weapons[a.weapon].duration);
  if(w.kind==='thrust')return {angle:0,reach:8+48*Math.sin(Math.PI*Math.max(0,Math.min(1,(p-.12)/.76)))};
  if(w.kind==='sweep'||w.kind==='escape')return {angle:-1.6+3.1*Math.max(0,Math.min(1,(p-.2)/.52)),reach:17};
  return {angle:p<.38?-1.1-p*2.2:p<.64?-1.94+(p-.38)/.26*2.65:.71-(p-.64)*.8,reach:10};
}
function drawPlayer() {
  if(player.inv>0&&Math.floor(time*14)%2===0)return;
  const a=player.attack,face=a?a.face:player.face,p=weaponPose();
  const bob=player.ground?Math.sin(player.walk*2)*1.3:0;
  const stride=player.ground?Math.sin(player.walk)*7:5;
  const lunge=a&&weapons[a.weapon].kind==='thrust'?Math.max(0,p.reach-8)*.6:0;
  const x=player.x+12+face*lunge,y=player.y+bob;
  p.reach-=lunge;
  ctx.save();ctx.translate(x,y);ctx.scale(face,1);
  // Keep the full-size weapon separate in every attack pose. Atlas attack frames
  // have tiny weapons baked in, which made swings appear to shrink their reach.
  const atlas=sprites['player-animations'];
  if(atlas&&!a){const frame=player.ground&&Math.abs(player.vx)>20?2+Math.floor(player.walk/3)%2:Math.floor(time*3)%2;ctx.drawImage(atlas,(frame%4)*96,0,96,80,-48,player.h-70,96,80);}
  else if(!sprite('player-idle',-20,player.h-56,40,56)) {
  line(-5,29,-6+stride,40,7,'#253447');line(5,29,6-stride,40,7,'#344558');
  rect(-10+stride,38,10,5,'#b39163');rect(2-stride,38,10,5,'#b39163');
  rect(-15,17,9,16,'#547e71');rect(-10,15,21,17,'#c88f48');rect(-8,17,5,13,'#e6b16a');rect(-10,29,22,4,'#6e624a');
  rect(-8,2,18,14,'#f3c994');rect(-11,0,22,6,'#664c36');rect(-9,-3,17,5,'#806043');rect(6,8,3,4,'#233c46');
  line(-5,19,-9-stride*.25,29,6,'#d3a96f');
  }
  rect(-9,17,17,12,player.look==='storm'?'#709ac2':player.look==='ember'?'#bd765d':'#5f9a75');
  const handX=p.reach,handY=21; 
  line(3,19,handX,handY,7,'#e4b987');
  drawWeapon(handX,handY,1,player.weapon,p.angle);
  rect(handX-3,handY-3,6,6,'#f4ce9b');ctx.restore();
  if(a&&weapons[a.weapon].kind==='thrust'&&a.elapsed>.1&&a.elapsed<.26){line(x+face*30,y+21,x+face*weapons[a.weapon].range,y+21,2,weapons[a.weapon].color);}
}
function drawHUD() {
  rect(18,18,240,66,'#10272be8');text(player.name.toUpperCase(),32,39,11,'#aac5b7');rect(32,49,176,12,'#3f4e48');rect(32,49,176*player.hp/100,12,player.hp>30?'#a2df7f':'#ed947d');text(String(player.hp),218,61,14);
  if(player.poison>0||player.chilled>0||player.shocked>0)text([player.poison>0?'POISONED':'',player.chilled>0?'CHILLED':'',player.shocked>0?'SHOCKED':''].filter(Boolean).join(' · '),25,97,12,'#ffdc9b');
  rect(749,18,333,66,'#10272be8');text(training?'SAFE PRACTICE CAMP':`${biomes[region].name} · ${stageKills}/${biomes[region].goal} MONSTERS`,764,41,14,'#dceabf');text(training?'Practice with your sword and Ice Staff':biomes[stage]?.boss&&!bossDefeated?`The ${biomes[stage].bossName} guards the exit`:`${player.treasures}/${chestSpots.length} treasures · M opens map`,764,65,12,'#a9c6bb');
  if(training){rect(18,100,350,123,'#10272bdc');text('Try your new moves',32,122,17,'#c8efa7');text(`${lessons.move?'✓':'○'} A / D move   ${lessons.jump?'✓':'○'} Space jump twice`,32,148,13);text(`${lessons.melee?'✓':'○'} J melee    Find stronger gear later`,32,174,13);text('ENTER: open the map →',32,202,13,'#ffdb93');}
  else {rect(334,25,358,7,'#153139');rect(334,25,358*(player.x-stage*LEVEL_LENGTH)/LEVEL_LENGTH,7,biomes[region].grass);text('START',334,51,9,'#d0e1c4');text('MIDPOINT',493,51,9,'#eac49b');text('EXIT GATE',633,51,9,'#b8deef');}
  const currentBoss=enemies.find(e=>e.boss&&e.hp>0);
  if(currentBoss){const name=currentBoss.type==='titan'?'CINDER TITAN':currentBoss.type==='sandjaw'?'SANDJAW':'WARDEN';rect(371,64,358,22,'#10272bea');rect(375,69,350,12,'#41505c');rect(375,69,350*Math.max(0,currentBoss.hp/currentBoss.max),12,currentBoss.type==='warden'?'#c990d6':currentBoss.type==='titan'?'#f2a46f':'#dcb375');text(`${name}  ${Math.ceil(currentBoss.hp)}/${currentBoss.max}`,385,79,10,'#fff2d4');}
  if(currentBoss?.tell>0){rect(406,91,292,31,currentBoss.type==='titan'?'#613a38e8':'#442a50e8');text(currentBoss.type==='titan'?(currentBoss.queuedAttack==='wave'?'TITAN: SHOCKWAVE · JUMP!':currentBoss.queuedAttack==='stomp'?'TITAN: LEAP · MOVE!':'TITAN: FIRE FAN'):currentBoss.type==='sandjaw'?(currentBoss.queuedAttack==='spray'?'SANDJAW: SPRAY · DODGE!':'SANDJAW: POUNCE · MOVE!'):(currentBoss.queuedAttack==='nova'?'WARDEN: NOVA · MOVE!':currentBoss.queuedAttack==='volley'?'WARDEN: CRYSTAL VOLLEY':'WARDEN: CHARGE'),426,112,15,'#ffe2fa');}
  // The active loadout bar contains only collected weapons assigned in Inventory.
  rect(0,603,W,97,'#0e2028');rect(0,603,W,2,'#58756b');
  rect(0,583,W,20,'#203840');
  text(weapons[player.weapon].tip,24,597,12,'#e7e6c6');
  text(training?'TRAINING':`${Math.round((player.x-stage*LEVEL_LENGTH)/LEVEL_LENGTH*100)}% of level`,965,597,11,'#adc8bc');
  const entries=hotbarEntries();
  for(let i=0;i<entries.length;i++) {
    const entry=entries[i],x=18+i*116,selected=entry.kind==='weapon'&&entry.weapon===player.weapon;
    rect(x,614,108,75,selected?'#b6d690':'#284049');rect(x+2,616,104,71,selected?'#345448':'#162f37');
    text(String(i+1),x+7,630,11,selected?'#d9ffaf':'#a7c1b6');
    if(entry.kind==='weapon'){const k=entry.weapon;drawWeapon(x+37,645,1,k,-.15,.8);text(weapons[k].name,x+7,669,9,'#e7f2dc');text(weapons[k].gun?(weapons[k].freeAmmo?'∞ SHOTS':`${player.ammo} AMMO`):weapons[k].damage===0?'ESCAPE':`${weaponDamage(k)} DMG`,x+7,682,8,'#a9c6ab');if(selected&&player.cool>0)rect(x+2,686,104*Math.min(1,player.cool/weapons[k].cool),3,'#f5d18c');}
    else text('EMPTY',x+24,659,10,'#72908b');
  }
  rect(844,614,87,35,'#2f5554');text(`BAR ${activeBar+1}/2`,852,637,13,'#e1f8df');
  rect(844,654,87,35,'#27444d');text('I PACK',852,677,12,'#d5eadb');
  rect(940,614,142,35,'#29474d');text(`E POTIONS  ${player.potions}`,948,637,12,'#f2dce3');
  rect(940,654,142,35,'#29474d');text(`${player.ammo} AMMO`,948,677,12,'#eddeb6');
  rect(706,554,377,30,'#17323be8');text(player.powers.map((id,i)=>`${i?'F':'Q'} ${powers[id].name} ${player.powerCooldowns[id]>0?player.powerCooldowns[id].toFixed(1)+'s':'READY'}`).join('   ·   '),715,575,12,'#e8f7d5');
}
function hotbarEntries(){return player.loadouts[activeBar].map(weapon=>weapon===null?{kind:'empty'}:{kind:'weapon',weapon});}
function drawShipScene(){
  const s=ship;rect(0,0,W,H,'#123a5a');
  for(let i=0;i<58;i++){const x=(i*191+57)%W,y=(i*137+s.scroll*(.55+i%3*.2))%H;rect(x,y,i%5===0?3:2,i%5===0?7:4,i%4===0?'#d5efff':'#8bbbd8');}
  ctx.globalAlpha=.2;for(let i=0;i<8;i++){const x=(i*311+80)%W,y=(i*223+s.scroll*.6)%(H+130)-70;rect(x-40,y,105,18,'#d9edff');rect(x-15,y-12,70,18,'#d9edff');}ctx.globalAlpha=1;
  for(const e of s.enemies){
    const color=e.boss?'#ad5a85':'#d77b68',wing=e.boss?68:26;
    rect(e.x-wing,e.y-4,wing*2,13,'#472f55');rect(e.x-wing+5,e.y-6,wing*2-10,9,color);
    rect(e.x-12,e.y-22,e.boss?24:20,e.boss?66:42,color);rect(e.x-7,e.y-6,14,16,'#ffc7a4');
    rect(e.x-wing+4,e.y+8,14,7,'#e7aa87');rect(e.x+wing-18,e.y+8,14,7,'#e7aa87');
    if(e.boss){rect(e.x-57,e.y-65,114,10,'#1c2b3d');rect(e.x-55,e.y-63,110*e.hp/e.max,6,'#ef96ad');text('SKY ACE',e.x-36,e.y-72,13,'#fff2d9');}
  }
  for(const b of s.shots){rect(b.x-3,b.y-11,6,17,'#ffe8a5');rect(b.x-1,b.y-14,2,7,'#fffaff');}
  for(const b of s.enemyShots){rect(b.x-5,b.y-5,10,10,'#ff966f');rect(b.x-2,b.y-2,4,4,'#ffe2a0');}
  if(s.inv<=0||Math.floor(s.elapsed*12)%2===0){
    const x=s.x,y=s.y,cloak=player.look==='storm'?'#719bbf':player.look==='ember'?'#c78061':'#72aa7b';
    rect(x-40,y+2,80,15,'#264958');rect(x-36,y-2,72,13,'#b6d6d6');rect(x-18,y-25,36,65,'#294b5c');rect(x-12,y-30,24,65,'#d9e6da');
    rect(x-9,y-14,18,22,'#538297');rect(x-7,y-10,14,14,cloak);rect(x-5,y-8,10,9,'#e4bd8d');rect(x-6,y-11,12,4,'#5b463d');
    rect(x-28,y+31,56,9,'#406778');rect(x-9,y-39,18,15,'#ecf2d9');rect(x-13,y+39,26,7,'#97b9c4');
  }
  rect(18,18,330,80,'#0d293ddc');text('SKY RUN · TOP-DOWN FLIGHT',32,42,16,'#e9faff');text(`HULL ${s.hp}    DRONES ${s.kills}/${SKY_GOAL}`,32,70,17,'#d5f1c2');
  if(s.elapsed<5)text('WASD / ARROWS TO FLY · J / SPACE TO SHOOT',360,120,18,'#fff1c7');
  else text(s.bossSpawned?'DEFEAT THE SKY ACE':'CLEAR THE SQUADRON',405,48,16,'#e4f5ff');
  if(mobileHud)mobileHud.textContent=`✈ HULL ${s.hp} · ${s.kills}/${SKY_GOAL} DRONES${s.bossSpawned?' · SKY ACE':''}`;
}
function draw() {
  if(ship&&['ship','ship-pause','win','over'].includes(state)){drawShipScene();return;}
  ctx.imageSmoothingEnabled=false;drawBackground();ctx.save();ctx.beginPath();ctx.rect(0,0,W,583);ctx.clip();ctx.translate(-Math.round(camera),0);
  drawScenery();drawLoot();for(const e of enemies)drawEnemy(e);drawPlayer();
  for(const b of bullets){line(b.x-b.vx*.02,b.y-b.vy*.02,b.x,b.y,b.effect==='laser'?5:b.effect?7:3,b.color||'#ffe1a0');if(b.effect==='freeze')rect(b.x-4,b.y-4,8,8,'#ebffff');if(b.effect==='burn')rect(b.x-3,b.y-3,6,6,'#ffe7a3');if(b.effect==='laser')rect(b.x-3,b.y-3,6,6,'#fff0ff');}
  for(const b of enemyShots){rect(b.x-12,b.y-12,24,24,b.effect==='shock'?'#345d78':b.color?'#8c493f':'#794b99');rect(b.x-9,b.y-9,18,18,b.color||'#d89cea');rect(b.x-4,b.y-4,8,8,b.effect==='shock'?'#f0ffff':b.color?'#ffe3a0':'#fff0ff');}
  for(const w of waves){const r=w.radius*(1-w.life/.38);line(w.x-r,w.y-3,w.x+r,w.y-3,5*w.life/.38,'#dcc1fc');for(let i=-1;i<=1;i+=2)line(w.x+i*r,w.y,w.x+i*(r+8),w.y-12,3,'#f1ddff');}
  for(const s of sparks)rect(s.x,s.y,4,4,s.color);
  for(const l of labels){ctx.globalAlpha=Math.min(1,l.life);text(l.text,l.x,l.y,14,l.color);}ctx.globalAlpha=1;
  if(typeof window.drawLevelEditorGuides==='function')window.drawLevelEditorGuides();
  if(training){text('TRAINING TARGETS',545,FLOOR-68,12,'#ffe8ae');}
  ctx.restore();drawHUD();
  if(mobileHud)mobileHud.textContent=`♥ ${player.hp}   ${weapons[player.weapon].name}   ${player.powers.map((id,i)=>`${i?'F':'Q'} ${powers[id].name}${player.powerCooldowns[id]>0?' '+Math.ceil(player.powerCooldowns[id]):''}`).join(' · ')}`;
}
function pause() {
  if(state==='ship'){state='ship-pause';overlay.innerHTML='<small>SKY RUN PAUSED</small><h2>Take a breather.</h2><p>Press P or click below to keep flying.</p><button id="resume">Keep flying →</button>';overlay.classList.remove('hidden');document.querySelector('#resume').onclick=pause;}
  else if(state==='ship-pause'){state='ship';overlay.classList.add('hidden');canvas.focus();}
  else if(state==='play'){state='pause';overlay.innerHTML='<small>TAKE A BREATHER</small><h2>Adventure paused.</h2><p>Press P or click below to continue.</p><button id="resume">Keep exploring →</button>';overlay.classList.remove('hidden');document.querySelector('#resume').onclick=pause;}
  else if(state==='pause'){state='play';overlay.classList.add('hidden');canvas.focus();}
  keys.clear();mouse.down=false;activeAimPointer=null;mobileAim=null;canvasTouch=null;laserHeld=false;touchGestures.clear();
}
function pointerPosition(e){const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)*W/r.width;mouse.y=(e.clientY-r.top)*H/r.height;}
function hotbarClick(x,y){if(y<614||y>689)return false;if(x>=940){if(y<650)heal();return true;}if(x>=844){if(y<650)switchBar();else openInventory();return true;}const i=Math.floor((x-18)/116);if(i>=0&&i<7)selectHotbarSlot(i);return true;}
function cycleWeapon(direction){const i=player.inventory.indexOf(player.weapon),next=(i+direction+player.inventory.length)%player.inventory.length;equip(player.inventory[next]);}
function bindMobileControls(){
  const controls=document.querySelectorAll('[data-control]');
  for(const button of controls){
    let heldPointer=null,startX=0,startY=0;
    button.addEventListener('pointerdown',e=>{
      if(state!=='play'&&state!=='ship')return;e.preventDefault();e.stopPropagation();heldPointer=e.pointerId;button.setPointerCapture?.(e.pointerId);button.classList.add('pressed');
      const action=button.dataset.control;
      if(state==='ship'){
        if(['left','right','up','down'].includes(action))keys.add({left:'a',right:'d',up:'w',down:'s'}[action]);
        else if(action==='attack'){mouse.down=true;shootShip();}
        else if(action==='pause')pause();
        return;
      }
      if(action==='left'||action==='right'){keys.add(action==='left'?'a':'d');}
      else if(action==='jump')jump();
      else if(action==='attack'){activeAimPointer=e.pointerId;startX=e.clientX;startY=e.clientY;mobileAim={x:player.face*200,y:0};mouse.down=true;attack();}
      else if(action==='heal')heal();
      else if(action==='power1'||action==='power2')castPower(action==='power1'?0:1);
      else if(action==='map'){if(training)beginAdventure();else showMap();}
      else if(action==='inventory')openInventory();
      else if(action==='edit')window.toggleLevelEditor?.();
      else if(action==='bar')switchBar();
      else if(action==='pause')pause();
      else if(action==='prev'||action==='next')cycleWeapon(action==='prev'?-1:1);
    });
    button.addEventListener('pointermove',e=>{if(e.pointerId===heldPointer&&button.dataset.control==='attack'){
      const dx=e.clientX-startX,dy=e.clientY-startY;
      if(Math.hypot(dx,dy)>10)mobileAim={x:dx*4,y:dy*4};
    }});
    const release=e=>{if(e.pointerId!==heldPointer)return;button.classList.remove('pressed');heldPointer=null;
      if(button.dataset.control==='left')keys.delete('a');if(button.dataset.control==='right')keys.delete('d');
      if(button.dataset.control==='up')keys.delete('w');if(button.dataset.control==='down')keys.delete('s');
      if(button.dataset.control==='attack'){mouse.down=false;mobileAim=null;activeAimPointer=null;laserHeld=false;}
    };
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  }
}
function bindInputs() {
  document.querySelector('#start').onclick=start;
  document.querySelector('#sound').onclick=()=>{sound=!sound;document.querySelector('#sound').textContent=`Sound: ${sound?'on':'off'}`;tone(500);};
  window.addEventListener('keydown',e=>{
    const k=e.key.toLowerCase();if([' ','arrowup','arrowleft','arrowright','arrowdown'].includes(k))e.preventDefault();if(e.repeat)return;
    if(state==='ship'||state==='ship-pause'){if(k==='p')pause();else if(state==='ship')keys.add(k);return;}
    if(k==='i'||k==='escape'&&state==='inventory'){if(state==='inventory')closeInventory();else openInventory();return;}
    if(state==='inventory')return;
    keys.add(k);
    if(k===' '||k==='w'||k==='arrowup')jump();if(k==='e')heal();if(k==='q'||k==='f')castPower(k==='q'?0:1);
    if(k==='enter'&&state==='play'&&training)beginAdventure();
    if(/^[1-7]$/.test(k)&&state==='play')selectHotbarSlot(Number(k)-1);
    if(k==='b'&&state==='play')switchBar();
    if(k==='m'&&state==='play'&&!training)showMap();
    if(k==='p')pause();if(k==='r'&&(state==='over'||state==='win'))start();
  });
  window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys.delete(k);if(k==='j'&&!mouse.down)laserHeld=false;if(state==='play'&&[' ','w','arrowup'].includes(k)&&player.vy<-180)player.vy*=.6;});
  window.addEventListener('blur',()=>{if(state==='play'||state==='ship')pause();keys.clear();mouse.down=false;activeAimPointer=null;mobileAim=null;canvasTouch=null;laserHeld=false;touchGestures.clear();});
  // Capture touch gestures before a control button can stop propagation.
  window.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'&&state==='play')touchGestures.set(e.pointerId,{x:e.clientX,y:e.clientY,swiped:!!e.target?.closest?.('[data-control="jump"]')});
  },true);
  window.addEventListener('pointermove',e=>{
    const gesture=touchGestures.get(e.pointerId);
    if(!gesture||gesture.swiped||state!=='play')return;
    const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
    if(dy<=-55&&-dy>Math.abs(dx)*1.25){
      gesture.swiped=true;e.preventDefault();
      if(canvasTouch?.pointerId===e.pointerId){canvasTouch.swiped=true;mouse.down=false;}
      jump();
    }
  },true);
  canvas.addEventListener('pointermove',e=>{if(activeAimPointer===null||activeAimPointer===e.pointerId)pointerPosition(e);});
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||state!=='play'&&state!=='ship')return;e.preventDefault();pointerPosition(e);canvas.focus();if(state==='ship'){activeAimPointer=e.pointerId;canvas.setPointerCapture?.(e.pointerId);mouse.down=true;shootShip();return;}if(hotbarClick(mouse.x,mouse.y))return;activeAimPointer=e.pointerId;canvas.setPointerCapture?.(e.pointerId);
    if(e.pointerType==='touch')canvasTouch={pointerId:e.pointerId,age:0,held:false,swiped:false};
    else mouse.down=true;
  });
  const releaseAim=(e,cancelled=false)=>{
    if(e.pointerId===activeAimPointer){
      if(canvasTouch?.pointerId===e.pointerId&&!cancelled&&!canvasTouch.held&&!canvasTouch.swiped&&state==='play'){
        pointerPosition(e);attack(true);
      }
      mouse.down=false;mobileAim=null;activeAimPointer=null;canvasTouch=null;laserHeld=false;
    }
    touchGestures.delete(e.pointerId);
  };
  window.addEventListener('pointerup',e=>releaseAim(e));window.addEventListener('pointercancel',e=>releaseAim(e,true));
  bindMobileControls();
}
reset();
document.querySelector('.mobile-right')?.insertAdjacentHTML?.('beforeend','<button data-control="power1" aria-label="Cast first magic power">Q Magic</button><button data-control="power2" aria-label="Cast second magic power">F Magic</button>');
document.querySelector('.mobile-left')?.insertAdjacentHTML?.('beforeend','<button data-control="up" aria-label="Fly up">▲</button><button data-control="down" aria-label="Fly down">▼</button>');
bindInputs();showCharacterCreator();
function frame(now){const dt=Math.min((now-last)/1000,.033);last=now;if(state==='play')update(dt);else if(state==='ship')updateShip(dt);draw();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
