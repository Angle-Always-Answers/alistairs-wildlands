// Dependency-free gameplay checks. Run: node test-game.js
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),noop=()=>{};
const handlers={},canvasListeners={};
const buttons=Object.fromEntries(['left','right','up','down','jump','attack','heal','map','pause','inventory','bar','prev','next','power1','power2'].map(control=>[control,{dataset:{control},listeners:{},classList:{add:noop,remove:noop},addEventListener(k,f){this.listeners[k]=f},setPointerCapture:noop}]));
const touch=(control,kind='pointerdown')=>buttons[control].listeners[kind]({pointerId:7,clientX:100,clientY:100,preventDefault:noop,stopPropagation:noop});
const ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
const overlay={classList:{add:noop,remove:noop},querySelectorAll:()=>[]};
const canvas={getContext:()=>ctx,addEventListener:(k,f)=>canvasListeners[k]=f,focus:noop,getBoundingClientRect:()=>({left:0,top:0,width:1100,height:700})};
const creator=Object.fromEntries(['#hero-name','#hero-look','#hero-power-1','#hero-power-2'].map(id=>[id,{value:''}]));
const box={document:{querySelector:s=>s==='#game'?canvas:creator[s]||overlay,querySelectorAll:s=>s==='[data-control]'?Object.values(buttons):[]},window:{addEventListener:(k,f)=>handlers[k]=f},requestAnimationFrame:noop,console,Math};vm.createContext(box);
vm.runInContext(fs.readFileSync(__dirname+'/game.js','utf8'),box);
const run=s=>vm.runInContext(s,box),key=k=>handlers.keydown({key:k,repeat:false,preventDefault:noop});
const pickup=(level,offset)=>run(`player.attack=null;player.cool=0;player.x=${level}*LEVEL_LENGTH+${offset}-12;player.y=528;player.vy=0;player.ground=true;update(.016)`);
const clearLevel=()=>run('spawnTimer=999;enemies=[];for(let i=stageKills;i<biomes[stage].goal;i++){spawnMonster("slime",player.x+180);hit(enemies[enemies.length-1],1000)}if(biomes[stage].boss){spawnMonster(stage===1?"sandjaw":stage===5?"warden":"titan",stage*LEVEL_LENGTH+4200);bossSpawned=true;hit(enemies[enemies.length-1],9999)}player.x=(stage+1)*LEVEL_LENGTH-166;player.y=528;player.vx=0;player.vy=0;player.ground=true;update(.016)');
run('start();draw()');assert.equal(run('training'),true);
assert.equal(run('player.name'),'Alistair');assert.equal(run('player.powers.join(",")'),'ice,dash');
assert.equal(run('player.inventory.join(",")'),'0,13','Ice Staff is available immediately beside the sword');
run('player.cool=0;bullets=[];castPower(0)');assert.equal(run('bullets[0].effect'),'freeze','Ice Orb is available from the start');assert.ok(run('player.powerCooldowns.ice>0'));
run('castPower(1)');assert.ok(run('player.rocketDash>0'),'Rocket Dash is available from the start');
const gesture=(id)=>{const e=y=>({pointerId:id,pointerType:'touch',button:0,clientX:400,clientY:y,preventDefault:noop,stopPropagation:noop});handlers.pointerdown(e(400));canvasListeners.pointerdown(e(400));handlers.pointermove(e(330));canvasListeners.pointermove(e(330));handlers.pointerup(e(330));};
run('player.ground=true;player.jumps=0;player.coyote=0');gesture(1);gesture(2);assert.equal(run('player.jumps'),2,'swipes double jump');
touch('right');assert.equal(run('keys.has("d")'),true);touch('right','pointerup');assert.equal(run('keys.has("d")'),false);
assert.equal(run('trainingLoot.length'),0);key('Enter');assert.equal(run('state'),'map');run('enterLevel(1)');assert.equal(run('state'),'map');run('enterLevel(0)');
assert.equal(run('biomes.length'),10);assert.equal(run('WORLD'),48000);assert.equal(run('platformLayouts.length'),10);
assert.deepEqual(Array.from(run('biomes.map((b,i)=>b.boss?i:null).filter(i=>i!==null)')),[1,5,9]);
assert.ok(run('monsterStats.sandjaw.hp<monsterStats.warden.hp&&monsterStats.warden.hp<monsterStats.titan.hp'));
assert.equal(run('monsterStats.sandjaw.hp'),300);assert.equal(run('monsterStats.sandjaw.damage'),11);
assert.ok(run('biomes.every((_,i)=>loot.filter(l=>["weapon","upgrade","weapon-upgrade"].includes(l.type)&&Math.floor(l.x/LEVEL_LENGTH)===i).length===([5,7,8].includes(i)?3:2))'));
for(const [weapon,stage] of [[1,3],[4,6],[6,7],[2,8]])assert.equal(run(`Math.floor(loot.find(l=>l.type==='weapon'&&l.weapon===${weapon}).x/LEVEL_LENGTH)`),stage);
const frozenTime=run('time');key('i');assert.equal(run('state'),'inventory');run('frame(100)');assert.equal(run('time'),frozenTime);key('i');
touch('inventory');assert.equal(run('state'),'inventory');touch('inventory','pointerup');key('i');
pickup(0,1500);pickup(0,3600);assert.equal(run('player.inventory.length'),4);
run('enemies=[];bullets=[];spawnTimer=999;player.x=1000;player.y=528;player.inv=5;player.weapon=13;player.cool=0;spawnMonster("beetle",player.x+105);attack();update(.15)');assert.ok(run('enemies[0].freeze>0'),'starter Ice Staff freezes a target');
run('player.x=enemies[0].x+8;player.inv=0;const hpNearFrozen=player.hp;update(.016)');assert.equal(run('player.hp'),run('hpNearFrozen'),'a frozen enemy cannot damage the player by touching them');
run('player.weapon=8;player.cool=0;player.attack=null;bullets=[];attack()');assert.ok(run('bullets.length>0'),'pebbles use free ammunition');
run('player.x=2538;player.y=250;player.ground=false;update(.016)');assert.equal(run('camps[0].used'),false);
run('player.x=2538;player.y=528;player.vy=0;player.ground=true;update(.016)');assert.equal(run('camps[0].used'),true);
run('spawnTimer=999;enemies=[];player.x=1000;player.y=528;player.inv=2;spawnMonster("slime",1238);const trapMob=enemies[0];trapMob.ground=true;const trapMobHp=trapMob.hp;update(.016)');
assert.equal(run('trapMob.hp'),run('trapMobHp')-35,'grounded monster takes trap damage');run('update(.016)');assert.equal(run('trapMob.hp'),run('trapMobHp')-35,'trap cooldown prevents instant repeat');
run('enemies=[];spawnMonster("slime",1238);enemies[0].y=FLOOR-150;enemies[0].ground=false;const airborneHp=enemies[0].hp;update(.016)');assert.equal(run('enemies[0].hp'),run('airborneHp'),'floor trap misses airborne monster');
run('enemies=[];player.x=1000;player.y=528;player.inv=100;spawnTimer=0;for(let i=0;i<450;i++)update(.016)');assert.ok(run('enemies.filter(e=>!e.boss).length<=3'),'spawns never form a large pack');
run('enemies=[];spawnTimer=999;player.x=1000;player.y=300;spawnMonster("bat",player.x+125);const bat=enemies[0];bat.flightCooldown=0;bat.y=FLOOR-170;updateFlying(bat,.016);const warnedY=bat.flightTargetY;player.y=140;updateFlying(bat,.016)');
assert.ok(run('bat.flightTell>.8'),'bat warns before diving');assert.equal(run('bat.flightTargetY'),run('warnedY'),'bat aims at the warned position rather than tracking a new jump');assert.ok(run('Math.abs(bat.y-(FLOOR-170))<3'),'bat cruises at a steady height during a jump');
run('enemies=[];enemyShots=[];bullets=[];spawnTimer=999;player.x=1000;player.y=528;player.vx=0;player.inv=0;player.hp=100;player.rocketDash=0;spawnMonster("bat",1125);enemies[0].flightCooldown=0;for(let i=0;i<110&&player.hp===100;i++)update(.016)');assert.ok(run('player.hp<100'),'a bat dive reaches a stationary player');
run('enemies=[];enemyShots=[];spawnTimer=999;player.x=1000;player.y=528;player.inv=0;player.hp=100;spawnMonster("scorpion",1005);update(.016)');assert.ok(run('player.poison>0'),'a scorpion sting applies poison');
run('enemies=[];player.inv=5;const poisonHp=player.hp;update(.8)');assert.ok(run('player.hp<poisonHp'),'poison deals damage over time');
run('player.potions=1;heal()');assert.equal(run('player.poison'),0,'a potion cures poison');
run('enemies=[];enemyShots=[];spawnTimer=999;player.inv=0;spawnMonster("witchbat",player.x+220);enemies[0].lightningCooldown=0;update(.016)');assert.ok(run('enemies[0].lightningTell>0'),'witch bat warns before firing');
run('for(let i=0;i<50;i++)update(.016)');assert.ok(run('enemyShots.some(b=>b.effect==="shock")'),'witch bat fires lightning');
run('enemies=[];enemyShots=[];player.x=1000;player.y=528;player.inv=0;spawnMonster("frostmite",1003);update(.016)');assert.ok(run('player.chilled>0'),'frostmite contact chills movement');
run('enemies=[];enemyShots=[{x:player.x+12,y:player.y+20,vx:0,vy:0,r:8,life:1,damage:8,effect:"shock"}];player.inv=0;update(.016)');assert.ok(run('player.shocked>0'),'lightning briefly jams magic');
run('bullets=[];player.powerCooldowns.ice=0;castPower(0)');assert.equal(run('bullets.length'),0,'shocked player cannot cast');
run('player.shocked=0;player.chilled=0;player.poison=0;enemyShots=[];enemies=[]');
assert.equal(run('monsterStats.bat.speed'),72);assert.equal(run('monsterStats.wisp.speed'),82);
run('enemies=[];player.x=LEVEL_LENGTH-175;const gateSpawned=spawn()');assert.equal(run('gateSpawned'),true,'players can still find monsters near a gate');assert.ok(run('player.x-enemies[0].x>=450'),'gate spawns appear well behind, not on the player');
const finds=[[1500,3600],[1600,3600],[1200,3350],[1450,3420],[1600,3400],[1520,2200,3340],[1540,3380],[1550,2200,3380],[1580,2200,3350],[1620,3400]];
for(let level=0;level<10;level++){
  assert.equal(run('stage'),level);if(level>0)for(const offset of finds[level])pickup(level,offset);
  if(level===1){assert.equal(run('weapons[9].name'),'FIRE STAFF','the Fire Staff replaces the bow');run('enemies=[];bullets=[];spawnTimer=999;player.x=stage*LEVEL_LENGTH+1800;player.y=528;player.inv=9;player.weapon=9;player.cool=0;spawnMonster("beetle",player.x+140);spawnMonster("beetle",player.x+300);for(const e of enemies)e.stun=2;attack();for(let i=0;i<25;i++)update(.016)');assert.ok(run('enemies.every(e=>e.burn>0)'),'fire passes through and burns multiple enemies');assert.ok(run('bullets.some(b=>b.effect==="burn"&&b.life>0)'),'fire continues across the level after hitting');run('const burningHp=enemies[0].hp;for(let i=0;i<35;i++)update(.016)');assert.ok(run('enemies[0].hp<burningHp'),'burning continues to deal damage');run('enemies=[];bullets=[];player.x=stage*LEVEL_LENGTH+100;player.cool=0;attack();for(let i=0;i<350;i++)update(.016)');assert.ok(run('bullets.some(b=>b.effect==="burn"&&b.x>(stage+1)*LEVEL_LENGTH)'),'fire can travel the entire level');}
  if(level===3){assert.equal(run('weapons[11].name'),'THORN WHIP','the Thorn Whip replaces the Spore Sprayer');run('enemies=[];spawnTimer=999;player.x=stage*LEVEL_LENGTH+1700;player.y=528;player.face=1;player.inv=9;player.weapon=11;player.cool=0;player.attack=null;spawnMonster("beetle",player.x+92);enemies[0].stun=2;attack();for(let i=0;i<25;i++)update(.016)');assert.ok(run('enemies[0].slow>0'),'Thorn Whip slows a monster on hit');}
  if(level===1){run('spawnTimer=999;enemies=[];spawnMonster("sandjaw",stage*LEVEL_LENGTH+4058);bossSpawned=true;player.x=stage*LEVEL_LENGTH+3800;player.y=528;player.inv=5;const sandjaw=enemies[0];sandjaw.ground=true;const sandjawHp=sandjaw.hp;update(.016)');assert.equal(run('sandjaw.hp'),run('sandjawHp')-25,'first boss takes trap damage');run('enemyShots=[];sandjaw.phaseTwo=true;sandjawSpray(sandjaw)');assert.equal(run('enemyShots.length'),5);}
  if(level===5){
    assert.equal(run('player.unlocked[13]'),true,'Frost Staff can be collected in Moonstone Ruins');
    run('enemies=[];spawnTimer=999;player.weapon=13;player.cool=0;player.attack=null;bullets=[];spawnMonster("slime",player.x+120);attack();update(.16)');assert.ok(run('enemies[0].freeze>0'),'Ice Staff freezes a monster on hit');
    assert.equal(run('monsterStats.warden.hp'),620);assert.equal(run('monsterStats.warden.damage'),15);
    assert.ok(run('camps.some(c=>c.x===stage*LEVEL_LENGTH+3590)'),'rest stop is available before the Warden');
    assert.equal(run('traps.filter(t=>t.x>stage*LEVEL_LENGTH+3700&&t.x<stage*LEVEL_LENGTH+4600).map(t=>t.x-stage*LEVEL_LENGTH).sort((a,b)=>a-b).join(",")'),'3860,4050,4250,4500','the Warden arena offers traps before, during, and after his starting position');
    run('spawnTimer=999;enemies=[];player.x=stage*LEVEL_LENGTH+3710;player.y=528;player.inv=5;stageKills=0;bossSpawned=false;spawnMonster("slime",player.x+220);update(.016)');assert.equal(run('bossSpawned'),true,'Warden appears on approach without a kill requirement');assert.equal(run('enemies.filter(e=>!e.boss).length'),0,'Warden fight starts without a monster pack');
    run('spawnTimer=999;enemies=[];spawnMonster("warden",stage*LEVEL_LENGTH+4258);bossSpawned=true;player.x=stage*LEVEL_LENGTH+3900;player.y=528;player.inv=5;const warden=enemies[0];warden.ground=true;while(Math.sin((time+.016)*2.5+traps.find(t=>t.x===stage*LEVEL_LENGTH+4250).x)<=-.2)time+=.1;const wardenHp=warden.hp;update(.016)');
    assert.equal(run('warden.hp'),run('wardenHp')-85,'crystal traps deal powerful damage to the Warden');
    run('enemyShots=[];warden.hp=warden.max;wardenVolley(warden)');assert.equal(run('enemyShots.length'),3);assert.equal(run('enemyShots[0].damage'),9);assert.equal(run('enemyShots[0].life'),2.1);assert.ok(run('Math.hypot(enemyShots[0].vx,enemyShots[0].vy)<400'),'volley travels at a dodgeable speed');
    run('enemyShots=[];warden.hp=warden.max*.4;warden.phaseTwo=true;wardenVolley(warden)');assert.equal(run('enemyShots.length'),4);assert.equal(run('enemyShots[0].damage'),12);
    run('enemyShots=[];wardenNova(warden)');assert.equal(run('enemyShots.length'),10);
    run('warden.dash=.016;warden.dashDir=-1;updateWarden(warden,.016)');assert.equal(run('warden.vx'),0,'the Warden stops at the end of a charge');assert.ok(run('warden.recovery>=.65'),'the Warden has an escape window after charging');
    run('updateWarden(warden,.2)');assert.equal(run('warden.vx'),0,'the Warden cannot immediately resume chasing');
    run('enemyShots=[];warden.hp=warden.max;warden.x=stage*LEVEL_LENGTH+4150;warden.y=FLOOR-warden.h;warden.bossCooldown=999;warden.tell=0;warden.dash=0;warden.recovery=0;player.x=stage*LEVEL_LENGTH+3990;player.y=528;player.inv=9;player.weapon=1;player.ammo=100;player.cool=0;player.attack=null;mouse.x=warden.x-camera+warden.w/2;mouse.y=warden.y+warden.h/2;const hpBeforePistol=warden.hp;attack(true);for(let i=0;i<20;i++)update(.016)');
    assert.ok(run('warden.hp<hpBeforePistol'),'the pistol can reliably damage the Warden');
    run('enemyShots=[];player.x=warden.x+15;player.y=warden.y;player.inv=0;warden.bossCooldown=999;const hpBeforeTouch=player.hp;update(.016)');assert.equal(run('player.hp'),run('hpBeforeTouch'),'touching the Warden does not damage the player');
    run('enemyShots=[];const cover=platforms.find(p=>p.level===stage);enemyShots.push({x:cover.x+15,y:cover.y+8,vx:0,vy:0,r:9,life:1,damage:9});update(.016)');
    assert.equal(run('enemyShots.length'),0,'platforms block hostile projectiles');
    run('player.y=180;warden.ground=true;warden.leapCooldown=0;warden.tell=0;warden.dash=0;warden.recovery=0;updateWarden(warden,.016)');assert.ok(run('warden.vy<=-940'),'Warden can still reach elevated players');
  }
  if(level===7){assert.equal(run('player.unlocked[14]'),true,'Storm Staff can be collected in Obsidian Quarry');assert.ok(run('player.loadouts.flat().includes(14)'),'a new pickup replaces a bar slot when both bars are full');run('enemies=[];spawnTimer=999;player.weapon=14;player.cool=0;player.attack=null;bullets=[];spawnMonster("beetle",player.x+120);attack();update(.16)');assert.ok(run('enemies[0].stun>0'),'Storm Staff stuns a monster on hit');}
  if(level===8){assert.equal(run('player.unlocked[15]'),true,'Laser Staff can be collected late in the journey');assert.ok(run('player.loadouts.flat().includes(15)'),'Laser Staff stays available from a weapon bar');assert.equal(run('weapons[15].cool'),0,'Laser Staff has no cooldown');run('enemies=[];bullets=[];spawnTimer=999;player.x=(stage+1)*LEVEL_LENGTH-175;player.vx=0;player.y=528;player.face=1;player.weapon=15;player.cool=0;player.ammo=0;player.inv=5;attack();const laser=bullets[0];update(.25)');assert.equal(run('laser.life'),Infinity,'laser persists for the full level');assert.ok(run('laser.vx<0'),'laser ricochets from the level edge');run('const ledge=platforms.find(p=>p.level===stage);laser.x=ledge.x+20;laser.y=ledge.y+2;laser.vy=640;bounceLaser(laser,laser.x,ledge.y-10)');assert.ok(run('laser.vy<0'),'laser ricochets from platform edges');run('attack();attack();attack()');assert.equal(run('bullets.filter(b=>b.effect==="laser"&&b.life>0).length'),3,'rapid laser shots are capped to three active projectiles');run('bullets=[];laserHeld=false;keys.add("j");update(.016);update(.016);keys.delete("j")');assert.equal(run('bullets.length'),1,'holding attack launches one persistent laser per press');}
  if(level===9){run('spawnTimer=999;enemies=[];spawnMonster("titan",stage*LEVEL_LENGTH+3988);bossSpawned=true;player.x=stage*LEVEL_LENGTH+3800;player.y=528;player.inv=5;const titan=enemies[0];titan.ground=true;const titanHp=titan.hp;update(.016)');assert.equal(run('titan.hp'),run('titanHp')-25,'final boss takes trap damage');run('enemyShots=[];titanShockwave(titan)');assert.equal(run('enemyShots.length'),2);}
  run('draw()');clearLevel();assert.equal(run('state'),level===9?'ship':'map');if(level<9){assert.equal(run('unlockedStage'),level+1);run(`enterLevel(${level+1})`);}
  if(level===8)assert.equal(run('player.unlocked[15]'),true,'Laser Staff remains usable in the next map');
}
assert.equal(run('player.inventory.length'),16,'all distinct weapons are collectible');assert.equal(run('player.loadouts.flat().filter(i=>i!==null).length'),14,'the bars hold fourteen collected weapons at once');
assert.equal(run('ship.hp'),100,'the final gate launches a healthy airplane');run('draw()');
run('const initialShipY=ship.y');touch('up');run('updateShip(.1)');assert.ok(run('ship.y<initialShipY'),'mobile up control steers the airplane');touch('up','pointerup');
run('const initialShipX=ship.x');key('d');run('updateShip(.1)');assert.ok(run('ship.x>initialShipX'),'D steers the airplane right');run('keys.delete("d")');
run('ship.shots=[];ship.fireCooldown=0');touch('attack');assert.ok(run('ship.shots.length===2'),'the mobile attack button fires twin airplane bullets');touch('attack','pointerup');
const skyTime=run('ship.elapsed');key('p');assert.equal(run('state'),'ship-pause');run('frame(100)');assert.equal(run('ship.elapsed'),skyTime,'the airplane pauses');key('p');assert.equal(run('state'),'ship');
run('ship.enemies=[{x:ship.x,y:ship.y-95,hp:1,max:1,boss:false,phase:0,shoot:99}];ship.shots=[{x:ship.x,y:ship.y-80,vy:-760}];ship.spawnTimer=999;const skyKills=ship.kills;updateShip(.016)');assert.equal(run('ship.kills'),run('skyKills')+1,'airplane bullets destroy enemy planes');
run('ship.kills=SKY_GOAL;ship.enemies=[];updateShip(.016)');assert.equal(run('ship.bossSpawned'),true,'the sky ace arrives after enough drones');
run('const ace=ship.enemies.find(e=>e.boss);ace.hp=1;ship.shots=[{x:ace.x,y:ace.y+6,vy:-760}];updateShip(.016)');assert.equal(run('state'),'win','defeating the sky ace completes the game');
run('startSkyRun();ship.hp=9;ship.inv=0;ship.enemyShots=[{x:ship.x,y:ship.y,vx:0,vy:0}];updateShip(.016)');assert.equal(run('state'),'over','enemy fire can defeat the airplane');
run('start();beginAdventure();enterLevel(0);spawnTimer=999;player.x=1958;player.y=528;player.vy=0;player.ground=true;update(.016)');assert.equal(run('player.vy'),0,'walking across a pad does not launch');
run('player.y=495;player.vy=400;player.ground=false;update(.08)');assert.ok(run('player.vy<-700'),'landing on a pad launches');
run('player.x=1230;player.y=433;player.vy=0;player.ground=true;player.inv=0;const safeHp=player.hp;update(.016)');assert.equal(run('player.hp'),run('safeHp'),'floor trap cannot reach platforms');
for(const name of ['mushroom','wolf','beetle','scorpion','wisp','golem','witchbat','frostmite','warden','thorns','spikes','crystal-trap','log-platform','sandstone-platform','ruin-platform'])assert.ok(fs.existsSync(__dirname+'/assets/monsters/'+name+'.png'),name);
run('start();beginAdventure();enterLevel(0);spawnTimer=999;enemies=[];player.x=LEVEL_LENGTH-168;player.y=528;player.ground=true;update(.016)');
assert.equal(run('state'),'map','reaching the exit opens the map without any monster kills');
assert.equal(run('pursuit.length'),3,'skipping the hunt creates pursuers');
run('enterLevel(1)');assert.equal(run('state'),'play');run('spawnTimer=999;enemies=[];pursuitDelay=0;player.inv=5;update(.016)');
assert.ok(run('enemies.some(e=>e.pursuer)'),'an extra monster pursues the player on the next level');
run('enemies=[];enemyShots=[];spawnTimer=999;pursuit=[];spawnMonster("bramble",player.x+260);enemies[0].rangedCooldown=0;update(.016)');assert.ok(run('enemies[0].rangedTell>0'),'bramble telegraphs a seed attack');
run('for(let i=0;i<44;i++)update(.016)');assert.ok(run('enemyShots.some(b=>b.effect==="seed")'),'bramble fires a slowing seed');
for(const [name,effect] of [['stormwing','spark'],['embermoth','ember']]){run(`enemyShots=[];enemies=[];spawnMonster("${name}",player.x+260);enemies[0].rangedTell=.01;updateRanged(enemies[0],.02)`);assert.equal(run('enemyShots[0].effect'),effect,`${name} uses its own ranged attack`);}
run('enemyShots=[{x:player.x+12,y:player.y+20,vx:0,vy:0,r:8,life:1,damage:0,effect:"ember"}];enemies=[];player.inv=0;update(.016)');assert.ok(run('player.burning>0'),'ember moth shots set the player burning');
run('player.potions=1;player.hp=60;heal()');assert.equal(run('player.burning'),0,'a potion puts out burning');
run('enemies=[];enemyShots=[];spawnTimer=999;stageKills=0;bossSpawned=true;bossDefeated=false;spawnMonster("sandjaw",stage*LEVEL_LENGTH+4200);player.x=(stage+1)*LEVEL_LENGTH-168;player.y=FLOOR-player.h;player.ground=true;player.inv=5;update(.016)');
assert.equal(run('state'),'map','a boss can be bypassed at the exit');assert.equal(run('pursuit.length'),4,'bypassing a boss adds a pursuer');
for(const name of ['bramble','stormwing','embermoth'])assert.ok(fs.existsSync(__dirname+'/assets/monsters/'+name+'.png'),name+' sprite exists');
console.log('PASS: open exits, pursuits, new monsters, editor-ready levels, magic weapons, mobile controls, and Sky Run.');
