'use strict';
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const mobileHud = document.querySelector('#mobile-hud');
const W = 1100, H = 700, LEVEL_LENGTH = 4800, WORLD = LEVEL_LENGTH * 3, FLOOR = 570;
const keys = new Set();
const mouse = {x:600, y:300, down:false};
let activeAimPointer=null,mobileAim=null,canvasTouch=null;
const touchGestures=new Map();
const weapons = [
  {name:'RUSTY SWORD', damage:18, range:108, cool:.52, duration:.38, kind:'thrust', color:'#c7edf0', tip:'Starter sword · 18 damage. Find upgrades in the levels.'},
  {name:'PISTOL', damage:30, cool:.48, spread:0, gun:true, color:'#f6d086', tip:'Slow and perfectly accurate'},
  {name:'HAMMER', damage:82, range:86, cool:1.1, duration:.85, kind:'slam', color:'#caa4fa', tip:'Heavy ground smash · 82 damage'},
  {name:'AXE', damage:30, range:100, cool:.62, duration:.52, kind:'sweep', color:'#f0b275', tip:'Wide sweeping chop · 30 damage'},
  {name:'MACHINE GUN', damage:12, cool:.085, spread:.17, gun:true, color:'#f6d086', tip:'Fast fire · wider spread'},
  {name:'SHOTGUN', damage:15, cool:.85, spread:.28, pellets:6, gun:true, color:'#f6d086', tip:'Six pellets · wide spread'},
  {name:'SINGLE SHOT', damage:65, cool:1, spread:.015, gun:true, color:'#f6d086', tip:'Powerful, precise single rounds'}
];
const biomes = [
  {name:'FERNWOOD TRAIL', x:0, sky:'#244e60', haze:'#89aa99', soil:'#524238', grass:'#a5ce76', goal:8, monsters:['slime','mushroom','wolf','bat'], description:'Woodland paths, fallen logs, and thorn patches.'},
  {name:'AMBER RIDGE', x:LEVEL_LENGTH, sky:'#66516e', haze:'#c9a081', soil:'#694c46', grass:'#e5b66e', goal:10, monsters:['beetle','scorpion','wolf','bat'], description:'High sandstone shelves and hidden spike beds.'},
  {name:'MOONSTONE RUINS', x:LEVEL_LENGTH*2, sky:'#26375c', haze:'#708a9d', soil:'#41465c', grass:'#83bec1', goal:12, monsters:['wisp','golem','bat','beetle'], description:'Crystal towers, pulse traps, and the Warden.'}
];
const platformLayouts = [
  [[360,465,210],[710,370,180],[1070,475,240],[1440,415,170],[1740,325,200],[2080,250,220],[2350,400,240],[2740,460,250],[3020,365,190],[3360,275,220],[3700,405,260],[4100,330,200],[4440,455,220]],
  [[340,470,210],[680,390,200],[1010,300,200],[1320,390,280],[1720,455,200],[2070,365,180],[2370,265,230],[2720,390,250],[3100,460,210],[3440,350,250],[3820,270,220],[4180,385,280],[4550,460,190]],
  [[330,475,230],[700,385,180],[1010,295,190],[1320,210,250],[1690,335,250],[2060,425,220],[2400,330,200],[2710,235,230],[3060,400,220],[3410,305,180],[3720,220,220],[4070,350,240],[4460,450,210]]
];
const platforms = platformLayouts.flatMap((layout,level)=>layout.map(([x,y,w])=>({x:x+level*LEVEL_LENGTH,y,w,level})));
const springPads = [1970,3650,LEVEL_LENGTH+1750,LEVEL_LENGTH+3300,LEVEL_LENGTH*2+1220,LEVEL_LENGTH*2+2900];
const chestSpots = [{x:790,y:350},{x:2190,y:230},{x:LEVEL_LENGTH+1110,y:280},{x:LEVEL_LENGTH+2470,y:245},{x:LEVEL_LENGTH*2+1430,y:190},{x:LEVEL_LENGTH*2+3820,y:200}];
const traps = [
  {x:1230,kind:'thorns'},{x:2590,kind:'thorns'},{x:3920,kind:'thorns'},
  {x:LEVEL_LENGTH+1500,kind:'spikes'},{x:LEVEL_LENGTH+2880,kind:'spikes'},{x:LEVEL_LENGTH+4050,kind:'spikes'},
  {x:LEVEL_LENGTH*2+900,kind:'crystal-trap'},{x:LEVEL_LENGTH*2+2220,kind:'crystal-trap'},{x:LEVEL_LENGTH*2+3550,kind:'crystal-trap'}
].map(t=>({...t,w:56,h:25}));
const monsterStats={
  slime:{hp:44,w:34,h:28,speed:68,damage:8,color:'#a0d65a'},
  bat:{hp:40,w:34,h:26,speed:105,damage:9,flying:true,color:'#d394ef'},
  mushroom:{hp:58,w:34,h:32,speed:62,damage:9,hop:true,color:'#d57c99'},
  wolf:{hp:78,w:43,h:31,speed:155,damage:12,charge:true,color:'#a6b8b6'},
  beetle:{hp:110,w:42,h:32,speed:72,damage:13,color:'#d5a176'},
  scorpion:{hp:100,w:46,h:29,speed:104,damage:15,charge:true,color:'#dfb36c'},
  wisp:{hp:95,w:35,h:34,speed:128,damage:12,flying:true,color:'#9edfe1'},
  golem:{hp:175,w:52,h:48,speed:53,damage:19,color:'#94aeb5'},
  warden:{hp:900,w:92,h:80,speed:126,damage:24,boss:true,color:'#bddcea'}
};
let training, lessons, player, enemies, bullets, enemyShots, loot, trainingLoot, sparks, labels, waves, chests, camps;
let kills, stageKills, completed, unlockedStage, stage=-1, bossSpawned, bossDefeated, time, spawnTimer, camera, state='title', last=0, sound=false, audio, region=0;
// Optional sprite pack can be plugged in without making offline play depend on it.
const sprites = {};
function loadSprite(name, path) {
  if (typeof Image === 'undefined') return;
  const img = new Image(); img.onload = () => { sprites[name] = img; }; img.src = path;
}
const weaponSpriteNames=['sword','pistol','hammer','axe','machine-gun','shotgun','single-shot'];
const weaponSpriteSizes=[[64,24],[48,32],[64,40],[64,40],[64,32],[64,24],[72,24]];
for(const name of [...weaponSpriteNames,'player-idle','player-animations','slime','bat','training-dummy','potion','ammo','woodland-tree','background-pine','grass-dirt'])loadSprite(name,'assets/starter-pack/'+name+'.png');
for(const name of Object.keys(monsterStats).filter(n=>n!=='slime'&&n!=='bat'))loadSprite(name,'assets/monsters/'+name+'.png');
for(const name of ['thorns','spikes','crystal-trap','log-platform','sandstone-platform','ruin-platform'])loadSprite(name,'assets/monsters/'+name+'.png');
function reset() {
  training=true; lessons={move:false,jump:false,melee:false,shoot:false};
  weapons[0].name='RUSTY SWORD';weapons[0].tip='Starter sword · 18 damage. Find upgrades in the levels.';
  player={x:100,y:FLOOR-42,w:24,h:42,vx:0,vy:0,hp:100,ammo:0,potions:0,
    unlocked:[true,false,false,false,false,false,false],inventory:[0],swordLevel:0,weapon:0,face:1,jumps:0,ground:false,inv:0,cool:0,
    attack:null,recoil:0,walk:0,coyote:0,jumpBuffer:0,padCooldown:0,treasures:0};
  enemies=[{x:565,y:FLOOR-46,w:32,h:46,hp:99999,max:99999,vx:0,vy:0,color:'#d8b178',dummy:true},
    {x:700,y:FLOOR-46,w:32,h:46,hp:99999,max:99999,vx:0,vy:0,color:'#d8b178',dummy:true}];
  bullets=[];enemyShots=[];sparks=[];labels=[];waves=[];kills=0;stageKills=0;completed=[false,false,false];unlockedStage=0;stage=-1;bossSpawned=false;bossDefeated=false;time=0;spawnTimer=3;camera=0;region=0;
  chests=chestSpots.map(c=>({...c,opened:false}));camps=[{x:2500,used:false},{x:LEVEL_LENGTH+2550,used:false},{x:LEVEL_LENGTH*2+2550,used:false}];
  loot=[
    {x:1550,y:FLOOR-25,type:'weapon',weapon:1},{x:1840,y:300,type:'upgrade'},{x:3300,y:FLOOR-25,type:'weapon',weapon:3},
    {x:LEVEL_LENGTH+2100,y:FLOOR-25,type:'weapon',weapon:4},{x:LEVEL_LENGTH+3900,y:FLOOR-25,type:'weapon',weapon:5},
    {x:LEVEL_LENGTH*2+2700,y:FLOOR-25,type:'weapon',weapon:6},{x:LEVEL_LENGTH*2+3900,y:FLOOR-25,type:'weapon',weapon:2},
    {x:LEVEL_LENGTH*2+3800,y:195,type:'upgrade'},
    ...Array.from({length:27},(_,i)=>({x:900+i*480,y:FLOOR-25,type:'ammo'})),
    ...Array.from({length:13},(_,i)=>({x:1200+i*950,y:FLOOR-28,type:'potion'}))
  ];
  // Loaner gear must be picked up in camp and stays there when the map opens.
  trainingLoot=[1,3,4,5,6,2].map((weapon,i)=>({x:290+i*115,y:FLOOR-28,type:'weapon',weapon}));
  keys.clear();mouse.down=false;activeAimPointer=null;mobileAim=null;canvasTouch=null;touchGestures.clear();
}
function start() {reset();state='play';overlay.classList.add('hidden');canvas.focus();}
function beginAdventure() {
  training=false;enemies=[];bullets=[];enemyShots=[];waves=[];sparks=[];labels=[];
  Object.assign(player,{x:100,y:FLOOR-42,vx:0,vy:0,hp:100,ammo:0,potions:0,weapon:0,attack:null,cool:0,jumps:0,
    unlocked:[true,false,false,false,false,false,false],inventory:[0],swordLevel:0});
  stage=0;region=0;camera=0;showMap();
}
function showMap() {
  state='map';keys.clear();mouse.down=false;activeAimPointer=null;mobileAim=null;canvasTouch=null;touchGestures.clear();
  overlay.innerHTML=`<small>THE WILDLANDS MAP</small><h2>Choose your next journey.</h2><p>Each land has its own monsters, hazards, rewards, and exit gate. Gear found in levels carries forward; camp gear is for practice.</p><div class="map-stages">${biomes.map((b,i)=>`<button class="map-stage" data-stage="${i}" ${i>unlockedStage?'disabled':''}><strong>${i+1}. ${b.name}</strong><span>${completed[i]?'✓ CLEARED':i>unlockedStage?'LOCKED':`DEFEAT ${b.goal} MONSTERS${i===2?' + BOSS':''}`}</span><em>${b.description}</em></button>`).join('')}</div><p class="hint">Use M in a level to return to this map.</p>`;
  overlay.classList.remove('hidden');
  overlay.querySelectorAll('[data-stage]').forEach(button=>button.onclick=()=>enterLevel(Number(button.dataset.stage)));
}
function enterLevel(i) {
  if(i>unlockedStage)return;
  stage=i;region=i;stageKills=0;bossSpawned=false;bossDefeated=false;enemies=[];bullets=[];enemyShots=[];waves=[];sparks=[];labels=[];
  Object.assign(player,{x:i*LEVEL_LENGTH+90,y:FLOOR-42,vx:0,vy:0,hp:Math.min(100,player.hp+25),inv:0,attack:null,cool:0,jumps:0,jumpBuffer:0,coyote:0,ground:false,padCooldown:0});
  camera=i*LEVEL_LENGTH;spawnTimer=2;state='play';overlay.classList.add('hidden');canvas.focus();
  message(biomes[i].name+' — reach the far gate',player.x,player.y-55,'#fff2bc');
}
function finishLevel() {
  completed[stage]=true;unlockedStage=Math.max(unlockedStage,Math.min(2,stage+1));
  if(stage===2)end(true);else showMap();
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
  player.potions--;player.hp=Math.min(100,player.hp+45);message('+45 health',player.x,player.y-20,'#a1f7a0');tone(720,.15);
}
function equip(i) {
  if(player.attack)return;
  if(player.unlocked[i]){player.weapon=i;tone(250+i*70);}
  else message('Find that weapon in a level first!');
}
function weaponDamage(i){return i===0?weapons[0].damage+player.swordLevel*18:weapons[i].damage;}
function collectWeapon(i){if(!player.unlocked[i]){player.unlocked[i]=true;player.inventory.push(i);message(`${weapons[i].name} FOUND!`,player.x,player.y-45,'#fff0ae');}if(!player.attack)player.weapon=i;if(weapons[i].gun&&player.ammo===0)player.ammo+=training?0:28;}
function attack(aim=false) {
  if(state!=='play'||player.cool>0||player.attack)return;
  if(aim)player.face=mouse.x+camera>=player.x+player.w/2?1:-1;
  const w=weapons[player.weapon];player.cool=w.cool;
  if(w.gun) {
    if(!training&&player.ammo<=0){message('No ammo — use a melee weapon!');tone(90);return;}
    if(!training)player.ammo--;lessons.shoot=true;player.recoil=.1;
    const x=player.x+12,y=player.y+19;
    const a=aim?Math.atan2(mouse.y-y,mouse.x+camera-x):(player.face===1?0:Math.PI);
    player.face=Math.cos(a)>=0?1:-1;
    for(let n=0;n<(w.pellets||1);n++) {
      const angle=a+(Math.random()-.5)*2*w.spread;
      bullets.push({x,y,vx:Math.cos(angle)*920,vy:Math.sin(angle)*920,life:1.4,damage:w.damage});
    }
    burst(x+Math.cos(a)*37,y+Math.sin(a)*37,'#ffd574',4);tone(150,.045);
  } else {
    lessons.melee=true;
    player.attack={weapon:player.weapon,elapsed:0,face:player.face,hits:new Set(),impacted:false};
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
      hit(e,w.damage);knockback(e,Math.sign(e.x+e.w/2-x),1000,310);a.hits.add(e);
    }
  } else if(w.kind!=='slam') {
    // Sample across the elapsed interval so a fast sweep cannot skip a target.
    for(let t=previous;t<=p+.0001;t+=Math.max(.008,(p-previous)/8)) {
      if(t<.2||t>.72)continue;
      const angle=w.kind==='sweep'?-1.6+((t-.2)/.52)*3.1:0;
      const reach=w.kind==='thrust'?40+76*Math.sin(Math.PI*(t-.2)/.52):w.range;
      for(const e of enemies) {
        if(e.hp<=0||a.hits.has(e))continue;
        const dx=(e.x+e.w/2-ox)*a.face,dy=e.y+e.h/2-oy;
        const along=dx*Math.cos(angle)+dy*Math.sin(angle),side=-dx*Math.sin(angle)+dy*Math.cos(angle);
        const radius=Math.min(e.w,e.h)*.4;
        if(along>=12-radius&&along<=reach+radius&&Math.abs(side)<(w.kind==='thrust'?9:22)+radius) {
          hit(e,weaponDamage(a.weapon));a.hits.add(e);knockback(e,a.face,w.kind==='thrust'?750:960,190);
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
  if(e.hp<=0) {
    if(e.boss){bossDefeated=true;enemyShots=[];message('WARDEN DEFEATED! Reach the gate →',e.x,e.y-35,'#d6ffea');burst(e.x,e.y,'#bfeeff',35);}
    else {kills++;stageKills++;if(kills%2===0)loot.push({x:e.x,y:FLOOR-25,type:'ammo'});if(kills%4===0)loot.push({x:e.x+20,y:FLOOR-25,type:'potion'});
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
  const pool=biomes[stage].monsters,name=pool[Math.floor(Math.random()*pool.length)];
  let x=player.x+(Math.random()<.25?-1:1)*(420+Math.random()*170);
  x=Math.max(stage*LEVEL_LENGTH+70,Math.min((stage+1)*LEVEL_LENGTH-220,x));
  spawnMonster(name,x);
}
function spawnMonster(name,x){const m=monsterStats[name];enemies.push({type:name,x,y:m.flying?FLOOR-170:FLOOR-m.h,w:m.w,h:m.h,hp:m.hp,max:m.hp,vx:0,vy:0,knockVx:0,flying:!!m.flying,phase:Math.random()*8,color:m.color,damage:m.damage,speed:m.speed,hop:m.hop,charge:m.charge,boss:!!m.boss,bossCooldown:1.2,leapCooldown:1.1,tell:0,attackIndex:0,dash:0,phaseTwo:false});}
function wardenVolley(e) {
  const x=e.x+e.w/2,y=e.y+e.h*.37,aim=Math.atan2(player.y+player.h/2-y,player.x+player.w/2-x);
  const furious=e.hp<e.max*.5,count=furious?5:3,speed=furious?495:435;
  for(let i=0;i<count;i++){const angle=aim+(i-(count-1)/2)*.17;enemyShots.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:10,life:3.2,damage:furious?17:14});}
  burst(x,y,'#e5a6f0',16);tone(180,.16);
}
function wardenNova(e) {
  const x=e.x+e.w/2,y=e.y+e.h/2;
  for(let i=0;i<12;i++){const angle=i*Math.PI/6+time*.3;enemyShots.push({x,y,vx:Math.cos(angle)*365,vy:Math.sin(angle)*365,r:11,life:2.8,damage:19});}
  burst(x,y,'#ffd4f8',26);tone(95,.22);
}
function updateWarden(e,dt) {
  const furious=e.hp<e.max*.5,dx=player.x+player.w/2-(e.x+e.w/2);
  if(furious&&!e.phaseTwo){e.phaseTwo=true;e.bossCooldown=.55;message('WARDEN ENRAGED · WATCH FOR NOVA!',e.x,e.y-82,'#ffe0f6');burst(e.x+e.w/2,e.y+e.h/2,'#f4b4ed',30);}
  e.leapCooldown=Math.max(0,e.leapCooldown-dt);
  if(e.tell>0){e.tell=Math.max(0,e.tell-dt);e.vx*=Math.max(0,1-dt*8);if(e.tell===0){if(e.queuedAttack==='volley')wardenVolley(e);else if(e.queuedAttack==='nova')wardenNova(e);else e.dash=.52;e.queuedAttack=null;e.bossCooldown=furious?1.1:1.85;}return;}
  if(e.dash>0){e.dash=Math.max(0,e.dash-dt);e.vx=e.dashDir*(furious?620:500);return;}
  e.bossCooldown=Math.max(0,e.bossCooldown-dt);
  if(e.ground&&e.leapCooldown===0&&player.y+player.h<e.y+25){e.vy=furious?-1010:-940;e.ground=false;e.leapCooldown=furious?2.2:3.2;burst(e.x+e.w/2,e.y+e.h,'#bcecff',10);}
  if(e.bossCooldown===0&&Math.abs(dx)<1350){e.queuedAttack=furious&&e.attackIndex%3===2?'nova':Math.abs(dx)>270||player.y<e.y-55||e.attackIndex%2===0?'volley':'dash';e.attackIndex++;e.tell=e.queuedAttack==='nova'?1.1:e.queuedAttack==='volley'?.72:.55;e.dashDir=Math.sign(dx)||1;message(e.queuedAttack==='nova'?'CRYSTAL NOVA · MOVE!':e.queuedAttack==='volley'?'CRYSTAL VOLLEY!':'WARDEN CHARGE!',e.x,e.y-65,'#ffc5f7');}
  const dir=Math.sign(dx);e.vx+=(dir*e.speed*(furious?1.25:1)-e.vx)*Math.min(1,dt*4);
}
function end(win) {
  state=win?'win':'over';
  overlay.innerHTML=`<small>${win?'FRONTIER HERO':'A NEW ADVENTURE AWAITS'}</small><h2>${win?'You did it, Alistair!':'Back to camp.'}</h2><p>${win?`Three lands explored! ${player.treasures}/6 treasure caches discovered.`:`You defeated ${kills} monsters. Try sword thrusts, axe sweeps, and hammer slams!`}</p><button id="start">Play again →</button><p class="hint">Or press R to restart.</p>`;
  overlay.classList.remove('hidden');document.querySelector('#start').onclick=start;
}
function update(dt) {
  time+=dt;
  if(canvasTouch&&!canvasTouch.swiped&&!canvasTouch.held){
    canvasTouch.age+=dt;
    if(canvasTouch.age>=.16){canvasTouch.held=true;mouse.down=true;}
  }
  for(const k of ['cool','inv','recoil','padCooldown','jumpBuffer'])player[k]=Math.max(0,player[k]-dt);
  player.coyote=player.ground?.1:Math.max(0,player.coyote-dt);
  const input=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
  const target=input*(player.attack&&player.attack.weapon===2?190:315);
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
  if(keys.has('j')||mouse.down)attack(mouse.down);
  tickMelee(dt);
  spawnTimer-=dt;
  if(!training&&spawnTimer<=0&&enemies.filter(e=>!e.boss).length<7&&stageKills<biomes[stage].goal){spawn();spawnTimer=2.0;}
  if(!training&&stage===2&&!bossSpawned&&player.x>stage*LEVEL_LENGTH+3700){spawnMonster('warden',stage*LEVEL_LENGTH+4200);bossSpawned=true;message('THE MOONSTONE WARDEN',player.x,player.y-70,'#eed2ff');}
  for(const e of enemies) {
    if(e.hp<=0)continue;
    if(e.dummy){e.flash=Math.max(0,(e.flash||0)-dt);continue;}
    const dir=Math.sign(player.x-e.x);
    if(e.flying){e.x+=(dir*e.speed+e.knockVx)*dt;e.knockVx*=Math.max(0,1-dt*2.1);e.y+=(player.y-45+Math.sin(time*(e.type==='wisp'?5:3)+e.phase)*40-e.y)*dt*1.7;}
    else {if(e.boss)updateWarden(e,dt);else {const rush=e.charge&&Math.sin(time*1.8+e.phase)>.65?1.65:1;e.vx+=(dir*e.speed*rush-e.vx)*dt*3;if(e.ground&&(e.hop?Math.random()<dt*2.2:Math.random()<dt*.7))e.vy=e.hop?-445:-340;}physics(e,dt);}
    if(overlap(player,e)&&player.inv<=0){player.hp=Math.max(0,player.hp-e.damage);player.inv=1;player.vy=-220;burst(player.x,player.y,'#ffb195');tone(80,.13);}
  }
  for(const b of bullets) {
    const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
    for(const e of enemies) {
      if(e.hp<=0)continue;
      const steps=Math.ceil(Math.hypot(b.x-ox,b.y-oy)/8);let found=false;
      for(let i=0;i<=steps;i++){const f=i/Math.max(1,steps),x=ox+(b.x-ox)*f,y=oy+(b.y-oy)*f;if(x>=e.x&&x<=e.x+e.w&&y>=e.y&&y<=e.y+e.h){found=true;break;}}
      if(found){hit(e,b.damage);knockback(e,Math.sign(b.vx),b.damage*3.3,55);b.life=0;break;}
    }
  }
  for(const b of enemyShots){
    const oldX=b.x,oldY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
    if(player.inv>0||b.life<=0)continue;
    const steps=Math.ceil(Math.hypot(b.x-oldX,b.y-oldY)/7);
    for(let i=0;i<=steps;i++){const f=i/Math.max(1,steps),x=oldX+(b.x-oldX)*f,y=oldY+(b.y-oldY)*f;
      if(x+b.r>player.x&&x-b.r<player.x+player.w&&y+b.r>player.y&&y-b.r<player.y+player.h){player.hp=Math.max(0,player.hp-b.damage);player.inv=.8;player.vy=-170;b.life=0;burst(x,y,'#ffd1ef',12);tone(88,.12);break;}}
  }
  enemies=enemies.filter(e=>e.hp>0&&(e.dummy||e.boss||Math.abs(e.x-player.x)<1600));bullets=bullets.filter(b=>b.life>0);enemyShots=enemyShots.filter(b=>b.life>0);
  const activeLoot=training?trainingLoot:loot;
  const remainingLoot=activeLoot.filter(l=>{
    if(Math.abs(player.x+12-l.x)>31||Math.abs(player.y+22-l.y)>46)return true;
    if(l.type==='weapon')collectWeapon(l.weapon);
    else if(l.type==='upgrade'){player.swordLevel++;weapons[0].name=player.swordLevel===1?'IRON SWORD':'STAR SWORD';weapons[0].tip=`Sword upgrade: +18 damage · ${weaponDamage(0)} total`;message(`SWORD +18 DAMAGE · ${weaponDamage(0)} TOTAL`,l.x,l.y-35,'#c9f8f4');}
    else if(l.type==='ammo'){player.ammo+=20;message('+20 ammo',l.x,l.y-25,'#ffe091');}
    else {player.potions++;message('+1 potion · E to heal',l.x,l.y-25,'#ffb7cd');}
    tone(800,.1);burst(l.x,l.y,'#fff5bb');return false;
  });
  if(training)trainingLoot=remainingLoot;else loot=remainingLoot;
  if(!training) {
    for(const c of chests)if(!c.opened&&Math.abs(player.x+12-c.x)<38&&Math.abs(player.y+22-c.y)<45){c.opened=true;player.treasures++;player.ammo+=40;player.potions++;message('Treasure! +40 ammo +1 potion',c.x,c.y-35,'#ffe49a');burst(c.x,c.y,'#ffe49a',20);tone(940,.2);}
    for(const c of camps)if(!c.used&&player.ground&&player.y+player.h>=FLOOR-1&&Math.abs(player.x+12-c.x)<45){c.used=true;player.hp=100;player.ammo+=30;message('REST STOP · Full health +30 ammo',c.x,player.y-50,'#b8efb2');tone(730,.2);}
    for(const t of traps){if(t.x<stage*LEVEL_LENGTH||t.x>(stage+1)*LEVEL_LENGTH)continue;const armed=t.kind!=='crystal-trap'||Math.sin(time*2.5+t.x)>-.2;
      if(armed&&player.ground&&player.y+player.h>=FLOOR-1&&player.inv<=0&&Math.abs(player.x+12-(t.x+28))<31){player.hp=Math.max(0,player.hp-11);player.inv=.9;player.vy=-260;burst(player.x,player.y+40,'#f7b2a3',8);message('TRAP!',player.x,player.y-20,'#ffd3a8');}}
    const gate=(stage+1)*LEVEL_LENGTH-160,open=completed[stage]||(stageKills>=biomes[stage].goal&&(stage!==2||bossDefeated));
    if(player.x>=gate-8){if(open){finishLevel();return;}player.x=gate-8;player.vx=0;if(Math.random()<dt)message(stage===2&&!bossDefeated?'Defeat the Warden!':`Defeat ${Math.max(0,biomes[stage].goal-stageKills)} more monsters!`);}
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
  const b=biomes[region],sky=ctx.createLinearGradient(0,0,0,FLOOR);sky.addColorStop(0,b.sky);sky.addColorStop(1,b.haze);ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  rect(850,95,48,48,region===2?'#d5e0e4':region===1?'#ffd7aa':'#ecdba5');
  for(let i=-1;i<9;i++){const x=i*210-(camera*.15)%210;ctx.fillStyle=region===2?'#3a5070':'#4f6866';ctx.beginPath();ctx.moveTo(x-180,FLOOR);ctx.lineTo(x+50,170+(i%3)*45);ctx.lineTo(x+250,FLOOR);ctx.fill();}
  for(let i=-1;i<12;i++){const x=i*135-(camera*.4)%135,y=245+(i%4)*22;
    if(region===0&&sprites['background-pine'])sprite('background-pine',x-65,y-30,145,330);
    else if(region===0){rect(x,y,14,330,'#345e59');for(let j=0;j<3;j++)rect(x-44+j*8,y-23+j*35,105-j*16,48,'#3c6e61');}
    else if(region===1){rect(x-35,y+160,95,170,'#806567');rect(x-48,y+154,120,13,'#a47c70');rect(x-12,y+120,46,45,'#9c7770');rect(x-20,y+116,61,9,'#ba8c74');}
    else {rect(x,y,28,330,'#435574');rect(x-9,y,46,13,'#64778f');rect(x+6,y+25,5,220,'#6c8096');rect(x-4,y+70,36,5,'#91aebb');}}
}
function drawScenery() {
  const b=biomes[region],start=training?0:stage*LEVEL_LENGTH;
  rect(start,FLOOR,LEVEL_LENGTH,80,b.soil);rect(start,FLOOR,LEVEL_LENGTH,8,b.grass);rect(start,FLOOR+8,LEVEL_LENGTH,12,region===2?'#527e88':region===1?'#a47555':'#587b45');
  const left=Math.max(0,Math.floor(camera/47)-1),right=Math.ceil((camera+W)/47)+1;
  for(let i=left;i<right;i++){
    const x=i*47,stone=region===2?'#829ca6':region===1?'#ddae7f':'#987961';
    rect(x,FLOOR-8,3,9,region===1?'#dfb66b':'#b4d16c');
    if(i%4===0){rect(x-3,FLOOR-17,9,8,region===2?'#8dddeb':'#e7bf89');rect(x,FLOOR-10,3,10,'#789857');}
    rect(x+8,FLOOR+26+(i%4)*7,11,4,stone);rect(x+24,FLOOR+48+(i%3)*5,17,3,region===2?'#34465d':'#624d40');
    rect(x+2,FLOOR+8,3,4,region===2?'#9ed4d2':region===1?'#f3cd91':'#c6dc91');
    if(i%3===0){rect(x+30,FLOOR+16,10,3,region===2?'#50667c':'#6f5a48');rect(x+35,FLOOR+13,3,3,stone);}
  }
  for(let i=Math.floor(camera/360);i<=Math.ceil((camera+W)/360);i++){
    const x=i*360-80;
    if(region===0)sprite('woodland-tree',x,FLOOR-220,196,220);
    else if(region===1){
      rect(x+79,FLOOR-91,16,91,'#264e4c');rect(x+81,FLOOR-87,12,86,'#4c8272');rect(x+83,FLOOR-84,3,72,'#77a28a');
      rect(x+45,FLOOR-58,13,37,'#2b5750');rect(x+48,FLOOR-55,7,30,'#5d907b');
      rect(x+55,FLOOR-29,33,11,'#2b5750');rect(x+56,FLOOR-28,30,6,'#659782');
      rect(x+92,FLOOR-55,33,11,'#2b5750');rect(x+94,FLOOR-53,29,6,'#659782');
      rect(x+116,FLOOR-55,13,29,'#2b5750');rect(x+119,FLOOR-53,7,25,'#77a28a');
      for(let j=0;j<5;j++){rect(x+76,FLOOR-75+j*15,3,2,'#b7cda1');rect(x+95,FLOOR-80+j*16,3,2,'#b7cda1');}
      rect(x+68,FLOOR-6,38,6,'#b88865');rect(x+73,FLOOR-11,29,5,'#d6a875');
    }
    else {rect(x+55,FLOOR-110,24,110,'#64778f');rect(x+45,FLOOR-115,44,12,'#91a5ab');ctx.fillStyle='#91d9e7';ctx.beginPath();ctx.moveTo(x+110,FLOOR);ctx.lineTo(x+125,FLOOR-95);ctx.lineTo(x+150,FLOOR);ctx.fill();}
  }
  for(const p of platforms){if(p.x+p.w<camera||p.x>camera+W||p.level!==region)continue;
    const name=['log-platform','sandstone-platform','ruin-platform'][region];
    for(let x=p.x;x<p.x+p.w;x+=60)if(!animatedSprite(name,x,p.y-6,Math.min(60,p.x+p.w-x),42,1))rect(x,p.y,Math.min(60,p.x+p.w-x),22,b.soil);
  }
  if(training){rect(30,FLOOR-54,90,54,'#765a44');rect(22,FLOOR-62,106,12,'#a17d54');text('CAMP',50,FLOOR-30,14,'#ffe8b1');rect(952,FLOOR-94,7,94,'#927250');rect(926,FLOOR-94,95,29,'#46675d');text('ENTER →',933,FLOOR-74,12);return;}
  for(const x of springPads){rect(x-27,FLOOR-7,54,8,'#30484f');rect(x-23,FLOOR-14,46,7,'#789c76');rect(x-19,FLOOR-17,38,4,'#d0f5a1');rect(x-24,FLOOR-6,5,4,'#a5c8b6');rect(x+19,FLOOR-6,5,4,'#a5c8b6');for(let j=-1;j<=1;j++)text('↑',x+j*13-5,FLOOR-22,15,'#e1ffbc');}
  for(const c of camps){rect(c.x-16,FLOOR-78,6,78,'#513f3c');rect(c.x-14,FLOOR-77,2,74,'#d2aa7d');rect(c.x-10,FLOOR-75,55,29,c.used?'#64775d':'#d6bf8f');rect(c.x-10,FLOOR-75,55,4,c.used?'#91a389':'#f6dcaa');rect(c.x-10,FLOOR-50,55,4,'#775b4f');text('+',c.x+9,FLOOR-52,20,'#3d6556');rect(c.x-30,FLOOR-12,60,12,'#675347');rect(c.x-26,FLOOR-12,52,3,'#a28462');}
  for(const c of chests){if(c.x<camera-50||c.x>camera+W+50)continue;rect(c.x-18,c.y-10,36,26,c.opened?'#6d6357':'#b97d3f');rect(c.x-18,c.y-10,36,6,'#e7bd63');rect(c.x-3,c.y-3,6,12,'#ffe29b');if(!c.opened){const y=c.y-25+Math.sin(time*3)*4;line(c.x-5,y,c.x+5,y,2,'#ffe79b');line(c.x,y-5,c.x,y+5,2,'#ffe79b');}}
  for(const t of traps)if(t.x>=camera-80&&t.x<=camera+W+80&&Math.floor(t.x/LEVEL_LENGTH)===stage){const armed=t.kind!=='crystal-trap'||Math.sin(time*2.5+t.x)>-.2;
    ctx.globalAlpha=armed?1:.4;animatedSprite(t.kind,t.x,FLOOR-38,t.w,38,3);ctx.globalAlpha=1;}
  const gate=(stage+1)*LEVEL_LENGTH-160,open=completed[stage]||(stageKills>=b.goal&&(stage!==2||bossDefeated));
  rect(gate,FLOOR-124,74,124,'#657c85');rect(gate+8,FLOOR-116,58,116,open?'#7cdbbf':'#466766');rect(gate+17,FLOOR-103,40,103,open?'#c4ffe0':'#254747');
  text(open?'TO MAP →':stage===2&&!bossDefeated?'WARDEN + '+b.goal+' KILLS':`${stageKills}/${b.goal} TO OPEN`,gate-25,FLOOR-140,13,open?'#dcffac':'#d0e1d3');
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
    else {drawWeapon(l.x-16,y,1,l.type==='weapon'?l.weapon:0);text(l.type==='upgrade'?'SWORD UPGRADE':weapons[l.weapon].name,l.x-35,y-31,10,'#fff0bd');}
  }
}
function drawEnemy(e) {
  if(e.dummy){if(sprite('training-dummy',e.x-8,e.y+e.h-64,48,64))return;rect(e.x+12,e.y+15,7,31,'#997348');rect(e.x-6,e.y+15,46,6,'#b89a70');rect(e.x+1,e.y+1,e.w-2,28,e.flash>0?'#fff2ba':'#d3b078');rect(e.x+9,e.y+8,14,14,'#9c624e');rect(e.x+14,e.y+12,5,6,'#edd8a5');rect(e.x+3,e.y+43,27,3,'#765a40');return;}
  if(e.boss){rect(e.x-8,e.y-27,Math.max(0,e.w+16),8,'#1a2b43');rect(e.x-8,e.y-27,(e.w+16)*e.hp/e.max,8,e.phaseTwo?'#f374be':'#d69cdf');text(e.phaseTwo?'WARDEN · ENRAGED':'WARDEN',e.x+1,e.y-34,11,'#eff1f7');if(e.tell>0){const glow=e.queuedAttack==='nova'?'#f77dda':e.queuedAttack==='volley'?'#f6a9e7':'#ffcd8c';ctx.globalAlpha=.32+.25*Math.sin(time*27);rect(e.x-12,e.y-8,e.w+24,e.h+16,glow);ctx.globalAlpha=1;}}
  const spriteName=e.type||'slime';
  const animated=!['slime','bat'].includes(spriteName);
  const nearPlayer=Math.abs(player.x-e.x)<e.w+55&&Math.abs(player.y-e.y)<e.h+55;
  const pose=e.boss?(e.tell>0?2:e.dash>0?3:Math.floor(time*5)%2):nearPlayer?2:(!e.flying&&!e.ground)?3:Math.floor(time*5+e.phase)%2;
  const drawn=animated?animatedSprite(spriteName,e.x-(e.boss?6:5),e.y-(e.boss?5:5),e.w+(e.boss?12:10),e.h+(e.boss?10:10),5,pose):sprite(spriteName,e.x-5,e.y-5,e.w+10,e.h+10);
  if(!drawn){
    if(e.flying){rect(e.x-12,e.y+Math.sin(time*20)*7,14,12,e.color);rect(e.x+28,e.y-Math.sin(time*20)*7,14,12,e.color);}
    rect(e.x,e.y+4,e.w,e.h-4,e.color);rect(e.x+5,e.y,e.w-10,8,e.color);rect(e.x+7,e.y+10,5,5,'#25394c');rect(e.x+22,e.y+10,5,5,'#25394c');
  }
  if(e.hp<e.max&&!e.boss){rect(e.x,e.y-10,e.w,4,'#243936');rect(e.x,e.y-10,e.w*e.hp/e.max,4,'#f7a090');}
}
// Weapons use the hand as their local origin, so every swing stays attached.
function drawWeapon(x,y,dir,i,angle=0,scale=1) {
  ctx.save();ctx.translate(x,y);ctx.scale(dir*scale,scale);ctx.rotate(angle);
  const size=weaponSpriteSizes[i];
  if(sprite(weaponSpriteNames[i],-9,-size[1]/2,size[0],size[1])){ctx.restore();return;}
  if(i===0){rect(-6,-3,14,6,'#927049');rect(6,-9,5,18,'#e3bd70');rect(11,-4,43,8,'#c7ebdf');rect(13,-3,41,2,'#f3ffff');ctx.fillStyle='#e5f7f2';ctx.beginPath();ctx.moveTo(54,-4);ctx.lineTo(62,0);ctx.lineTo(54,4);ctx.fill();}
  else if(i===2){rect(-6,-3,49,6,'#ba8e62');rect(33,-17,24,34,'#ab89c8');rect(35,-17,5,34,'#e3cafa');rect(40,-12,14,5,'#c8adde');}
  else if(i===3){rect(-6,-3,54,6,'#bb895b');rect(37,-7,6,14,'#aaa989');ctx.fillStyle='#dde9db';ctx.beginPath();ctx.moveTo(38,-4);ctx.lineTo(46,-23);ctx.lineTo(63,-16);ctx.lineTo(67,0);ctx.lineTo(46,8);ctx.fill();line(62,-14,65,0,3,'#f3fff1');}
  else if(i===1){rect(-5,-7,27,10,'#7b8e94');rect(19,-6,7,7,'#c6d1d0');rect(-3,3,8,12,'#aa7b54');rect(1,-10,5,3,'#c6d1d0');}
  else if(i===4){rect(-10,-7,42,12,'#637873');rect(32,-5,22,6,'#a1afb1');rect(-16,-4,12,14,'#98774f');rect(9,5,10,17,'#45504e');rect(20,-11,7,4,'#bbcaad');}
  else if(i===5){rect(-15,-2,23,9,'#a27a53');rect(5,-7,49,6,'#b8c4c2');rect(5,0,49,5,'#6d7e80');rect(21,3,16,7,'#b28b5d');}
  else {rect(-16,-2,28,10,'#a27a53');rect(8,-6,31,10,'#728886');rect(39,-4,29,4,'#aabdbd');rect(14,-14,18,5,'#839c99');rect(19,-9,4,4,'#526765');}
  ctx.restore();
}
function weaponPose() {
  const a=player.attack,w=weapons[player.weapon];
  if(!a){let angle=w.gun&&mouse.down?Math.atan2(mouse.y-(player.y+20),(mouse.x+camera-player.x-12)*player.face):w.gun?0:-.45;return {angle,reach:9-(player.recoil>0?4:0)};}
  const p=Math.min(1,a.elapsed/weapons[a.weapon].duration);
  if(a.weapon===0)return {angle:0,reach:8+48*Math.sin(Math.PI*Math.max(0,Math.min(1,(p-.12)/.76)))};
  if(a.weapon===3)return {angle:-1.6+3.1*Math.max(0,Math.min(1,(p-.2)/.52)),reach:17};
  return {angle:p<.38?-1.1-p*2.2:p<.64?-1.94+(p-.38)/.26*2.65:.71-(p-.64)*.8,reach:10};
}
function drawPlayer() {
  if(player.inv>0&&Math.floor(time*14)%2===0)return;
  const a=player.attack,face=a?a.face:player.face,p=weaponPose();
  const bob=player.ground?Math.sin(player.walk*2)*1.3:0;
  const stride=player.ground?Math.sin(player.walk)*7:5;
  const lunge=a&&a.weapon===0?Math.max(0,p.reach-8)*.6:0;
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
  const handX=p.reach,handY=21; 
  line(3,19,handX,handY,7,'#e4b987');
  drawWeapon(handX,handY,1,player.weapon,p.angle);
  rect(handX-3,handY-3,6,6,'#f4ce9b');ctx.restore();
  if(a&&a.weapon===0&&a.elapsed>.1&&a.elapsed<.26){line(x+face*30,y+21,x+face*108,y+21,2,'#e6ffff');}
}
function drawHUD() {
  rect(18,18,240,66,'#10272be8');text('HEALTH',32,39,11,'#aac5b7');rect(32,49,176,12,'#3f4e48');rect(32,49,176*player.hp/100,12,player.hp>30?'#a2df7f':'#ed947d');text(String(player.hp),218,61,14);
  rect(749,18,333,66,'#10272be8');text(training?'SAFE PRACTICE CAMP':`${biomes[region].name} · ${stageKills}/${biomes[region].goal} MONSTERS`,764,41,14,'#dceabf');text(training?'Pick up loaner gear to test it':stage===2&&!bossDefeated?'The Warden guards the exit':`${player.treasures}/6 treasures · M opens map`,764,65,12,'#a9c6bb');
  if(training){rect(18,100,350,123,'#10272bdc');text('Try your new moves',32,122,17,'#c8efa7');text(`${lessons.move?'✓':'○'} A / D move   ${lessons.jump?'✓':'○'} Space jump twice`,32,148,13);text(`${lessons.melee?'✓':'○'} J melee    ${lessons.shoot?'✓':'○'} Pick up a gun and shoot`,32,174,13);text('ENTER: leave loaner gear, open map →',32,202,13,'#ffdb93');}
  else {rect(334,25,358,7,'#153139');rect(334,25,358*(player.x-stage*LEVEL_LENGTH)/LEVEL_LENGTH,7,biomes[region].grass);text('START',334,51,9,'#d0e1c4');text('MIDPOINT',493,51,9,'#eac49b');text('EXIT GATE',633,51,9,'#b8deef');}
  const warden=enemies.find(e=>e.boss&&e.hp>0);
  if(warden?.tell>0){rect(406,91,292,31,'#442a50e8');text(warden.queuedAttack==='nova'?'WARDEN: NOVA · MOVE!':warden.queuedAttack==='volley'?'WARDEN: CRYSTAL VOLLEY':'WARDEN: CHARGE',426,112,15,'#ffe2fa');}
  // Only found weapons and collected supplies occupy the hotbar.
  rect(0,603,W,97,'#0e2028');rect(0,603,W,2,'#58756b');
  rect(0,583,W,20,'#203840');
  text(weapons[player.weapon].tip,24,597,12,'#e7e6c6');
  text(training?'TRAINING':`${Math.round((player.x-stage*LEVEL_LENGTH)/LEVEL_LENGTH*100)}% of level`,965,597,11,'#adc8bc');
  const entries=hotbarEntries();
  for(let i=0;i<entries.length;i++) {
    const entry=entries[i],x=19+i*119,selected=entry.kind==='weapon'&&entry.weapon===player.weapon;
    rect(x,614,110,75,selected?'#b6d690':'#284049');rect(x+2,616,106,71,selected?'#345448':'#162f37');
    text(entry.kind==='weapon'?String(i+1):entry.kind==='potion'?'E':'•',x+7,630,11,selected?'#d9ffaf':'#a7c1b6');
    if(entry.kind==='weapon'){const k=entry.weapon;drawWeapon(x+37,645,1,k,-.15,.8);text(weapons[k].name,x+7,669,9,'#e7f2dc');text(weapons[k].gun?(training?'∞ AMMO':`${player.ammo} AMMO`):`${weaponDamage(k)} DMG`,x+7,682,8,'#a9c6ab');if(selected&&player.cool>0)rect(x+2,686,106*Math.min(1,player.cool/weapons[k].cool),3,'#f5d18c');}
    else {drawItem(entry.kind,x+54,644,.9);text(entry.kind==='potion'?'HEALTH POTION':'AMMO RESERVE',x+7,669,9,'#e7f2dc');text(entry.kind==='potion'?`${player.potions} · CLICK TO HEAL`:`${player.ammo} ROUNDS`,x+7,682,8,'#a9c6ab');}
  }
}
function hotbarEntries(){return [...player.inventory.map(weapon=>({kind:'weapon',weapon})),...(player.potions>0?[{kind:'potion'}]:[]),...(!training&&player.ammo>0?[{kind:'ammo'}]:[])];}
function draw() {
  ctx.imageSmoothingEnabled=false;drawBackground();ctx.save();ctx.beginPath();ctx.rect(0,0,W,583);ctx.clip();ctx.translate(-Math.round(camera),0);
  drawScenery();drawLoot();for(const e of enemies)drawEnemy(e);drawPlayer();
  for(const b of bullets)line(b.x-b.vx*.012,b.y-b.vy*.012,b.x,b.y,3,'#ffe1a0');
  for(const b of enemyShots){rect(b.x-12,b.y-12,24,24,'#794b99');rect(b.x-9,b.y-9,18,18,'#d89cea');rect(b.x-4,b.y-4,8,8,'#fff0ff');}
  for(const w of waves){const r=w.radius*(1-w.life/.38);line(w.x-r,w.y-3,w.x+r,w.y-3,5*w.life/.38,'#dcc1fc');for(let i=-1;i<=1;i+=2)line(w.x+i*r,w.y,w.x+i*(r+8),w.y-12,3,'#f1ddff');}
  for(const s of sparks)rect(s.x,s.y,4,4,s.color);
  for(const l of labels){ctx.globalAlpha=Math.min(1,l.life);text(l.text,l.x,l.y,14,l.color);}ctx.globalAlpha=1;
  if(training){text('TRAINING TARGETS',545,FLOOR-68,12,'#ffe8ae');}
  ctx.restore();drawHUD();
  if(mobileHud)mobileHud.textContent=`♥ ${player.hp}   ${weapons[player.weapon].name}   ${player.ammo} ammo   ${player.potions} potions`;
}
function pause() {
  if(state==='play'){state='pause';overlay.innerHTML='<small>TAKE A BREATHER</small><h2>Adventure paused.</h2><p>Press P or click below to continue.</p><button id="resume">Keep exploring →</button>';overlay.classList.remove('hidden');document.querySelector('#resume').onclick=pause;}
  else if(state==='pause'){state='play';overlay.classList.add('hidden');canvas.focus();}
  keys.clear();mouse.down=false;activeAimPointer=null;mobileAim=null;canvasTouch=null;touchGestures.clear();
}
function pointerPosition(e){const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)*W/r.width;mouse.y=(e.clientY-r.top)*H/r.height;}
function hotbarClick(x,y){if(y<614||y>689)return false;const i=Math.floor((x-19)/119),entry=hotbarEntries()[i];if(!entry)return true;if(entry.kind==='weapon')equip(entry.weapon);else if(entry.kind==='potion')heal();return true;}
function cycleWeapon(direction){const i=player.inventory.indexOf(player.weapon),next=(i+direction+player.inventory.length)%player.inventory.length;equip(player.inventory[next]);}
function bindMobileControls(){
  const controls=document.querySelectorAll('[data-control]');
  for(const button of controls){
    let heldPointer=null,startX=0,startY=0;
    button.addEventListener('pointerdown',e=>{
      if(state!=='play')return;e.preventDefault();e.stopPropagation();heldPointer=e.pointerId;button.setPointerCapture?.(e.pointerId);button.classList.add('pressed');
      const action=button.dataset.control;
      if(action==='left'||action==='right'){keys.add(action==='left'?'a':'d');}
      else if(action==='jump')jump();
      else if(action==='attack'){activeAimPointer=e.pointerId;startX=e.clientX;startY=e.clientY;mobileAim={x:player.face*200,y:0};mouse.down=true;attack();}
      else if(action==='heal')heal();
      else if(action==='map'){if(training)beginAdventure();else showMap();}
      else if(action==='pause')pause();
      else if(action==='prev'||action==='next')cycleWeapon(action==='prev'?-1:1);
    });
    button.addEventListener('pointermove',e=>{if(e.pointerId===heldPointer&&button.dataset.control==='attack'){
      const dx=e.clientX-startX,dy=e.clientY-startY;
      if(Math.hypot(dx,dy)>10)mobileAim={x:dx*4,y:dy*4};
    }});
    const release=e=>{if(e.pointerId!==heldPointer)return;button.classList.remove('pressed');heldPointer=null;
      if(button.dataset.control==='left')keys.delete('a');if(button.dataset.control==='right')keys.delete('d');
      if(button.dataset.control==='attack'){mouse.down=false;mobileAim=null;activeAimPointer=null;}
    };
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  }
}
function bindInputs() {
  document.querySelector('#start').onclick=start;
  document.querySelector('#sound').onclick=()=>{sound=!sound;document.querySelector('#sound').textContent=`Sound: ${sound?'on':'off'}`;tone(500);};
  window.addEventListener('keydown',e=>{
    const k=e.key.toLowerCase();if([' ','arrowup','arrowleft','arrowright','arrowdown'].includes(k))e.preventDefault();if(e.repeat)return;keys.add(k);
    if(k===' '||k==='w'||k==='arrowup')jump();if(k==='e')heal();
    if(k==='enter'&&state==='play'&&training)beginAdventure();
    if(/^[1-7]$/.test(k)&&state==='play'){const i=player.inventory[Number(k)-1];if(i!==undefined)equip(i);}
    if(k==='m'&&state==='play'&&!training)showMap();
    if(k==='p')pause();if(k==='r'&&(state==='over'||state==='win'))start();
  });
  window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys.delete(k);if([' ','w','arrowup'].includes(k)&&player.vy<-180)player.vy*=.6;});
  window.addEventListener('blur',()=>{if(state==='play')pause();keys.clear();mouse.down=false;activeAimPointer=null;mobileAim=null;canvasTouch=null;touchGestures.clear();});
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
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||state!=='play')return;e.preventDefault();pointerPosition(e);canvas.focus();if(hotbarClick(mouse.x,mouse.y))return;activeAimPointer=e.pointerId;canvas.setPointerCapture?.(e.pointerId);
    if(e.pointerType==='touch')canvasTouch={pointerId:e.pointerId,age:0,held:false,swiped:false};
    else mouse.down=true;
  });
  const releaseAim=(e,cancelled=false)=>{
    if(e.pointerId===activeAimPointer){
      if(canvasTouch?.pointerId===e.pointerId&&!cancelled&&!canvasTouch.held&&!canvasTouch.swiped&&state==='play'){
        pointerPosition(e);attack(true);
      }
      mouse.down=false;mobileAim=null;activeAimPointer=null;canvasTouch=null;
    }
    touchGestures.delete(e.pointerId);
  };
  window.addEventListener('pointerup',e=>releaseAim(e));window.addEventListener('pointercancel',e=>releaseAim(e,true));
  bindMobileControls();
}
reset();bindInputs();
function frame(now){const dt=Math.min((now-last)/1000,.033);last=now;if(state==='play')update(dt);draw();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
