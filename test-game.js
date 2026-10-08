// Dependency-free gameplay checks. Run: node test-game.js
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),noop=()=>{};
const handlers={},canvasListeners={};
const buttons=Object.fromEntries(['left','right','jump','attack','heal','map','pause','inventory','bar','prev','next'].map(control=>[control,{dataset:{control},listeners:{},classList:{add:noop,remove:noop},addEventListener(k,f){this.listeners[k]=f},setPointerCapture:noop}]));
const touch=(control,kind='pointerdown')=>buttons[control].listeners[kind]({pointerId:7,clientX:100,clientY:100,preventDefault:noop,stopPropagation:noop});
const ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
const overlay={classList:{add:noop,remove:noop},querySelectorAll:()=>[]};
const canvas={getContext:()=>ctx,addEventListener:(k,f)=>canvasListeners[k]=f,focus:noop,getBoundingClientRect:()=>({left:0,top:0,width:1100,height:700})};
const box={document:{querySelector:s=>s==='#game'?canvas:overlay,querySelectorAll:s=>s==='[data-control]'?Object.values(buttons):[]},window:{addEventListener:(k,f)=>handlers[k]=f},requestAnimationFrame:noop,console,Math};vm.createContext(box);
vm.runInContext(fs.readFileSync(__dirname+'/game.js','utf8'),box);
const run=s=>vm.runInContext(s,box),key=k=>handlers.keydown({key:k,repeat:false,preventDefault:noop});
const pickup=(level,offset)=>run(`player.attack=null;player.cool=0;player.x=${level}*LEVEL_LENGTH+${offset}-12;player.y=528;player.vy=0;player.ground=true;update(.016)`);
const clearLevel=()=>run('spawnTimer=999;enemies=[];for(let i=stageKills;i<biomes[stage].goal;i++){spawnMonster("slime",player.x+180);hit(enemies[enemies.length-1],1000)}if(biomes[stage].boss){spawnMonster(stage===1?"sandjaw":stage===5?"warden":"titan",stage*LEVEL_LENGTH+4200);bossSpawned=true;hit(enemies[enemies.length-1],9999)}player.x=(stage+1)*LEVEL_LENGTH-166;player.y=528;player.vx=0;player.vy=0;player.ground=true;update(.016)');
run('start();draw()');assert.equal(run('training'),true);
const gesture=(id)=>{const e=y=>({pointerId:id,pointerType:'touch',button:0,clientX:400,clientY:y,preventDefault:noop,stopPropagation:noop});handlers.pointerdown(e(400));canvasListeners.pointerdown(e(400));handlers.pointermove(e(330));canvasListeners.pointermove(e(330));handlers.pointerup(e(330));};
run('player.ground=true;player.jumps=0;player.coyote=0');gesture(1);gesture(2);assert.equal(run('player.jumps'),2,'swipes double jump');
touch('right');assert.equal(run('keys.has("d")'),true);touch('right','pointerup');assert.equal(run('keys.has("d")'),false);
assert.equal(run('trainingLoot.length'),0);key('Enter');assert.equal(run('state'),'map');run('enterLevel(1)');assert.equal(run('state'),'map');run('enterLevel(0)');
assert.equal(run('biomes.length'),10);assert.equal(run('WORLD'),48000);assert.equal(run('platformLayouts.length'),10);
assert.deepEqual(Array.from(run('biomes.map((b,i)=>b.boss?i:null).filter(i=>i!==null)')),[1,5,9]);
assert.ok(run('monsterStats.sandjaw.hp<monsterStats.warden.hp&&monsterStats.warden.hp<monsterStats.titan.hp'));
assert.ok(run('biomes.every((_,i)=>loot.filter(l=>["weapon","upgrade","weapon-upgrade"].includes(l.type)&&Math.floor(l.x/LEVEL_LENGTH)===i).length===2)'));
for(const [weapon,stage] of [[1,3],[4,6],[6,7],[2,8]])assert.equal(run(`Math.floor(loot.find(l=>l.type==='weapon'&&l.weapon===${weapon}).x/LEVEL_LENGTH)`),stage);
const frozenTime=run('time');key('i');assert.equal(run('state'),'inventory');run('frame(100)');assert.equal(run('time'),frozenTime);key('i');
touch('inventory');assert.equal(run('state'),'inventory');touch('inventory','pointerup');key('i');
pickup(0,1500);pickup(0,3600);assert.equal(run('player.inventory.length'),3);
run('player.weapon=8;player.cool=0;player.attack=null;bullets=[];attack()');assert.ok(run('bullets.length>0'),'pebbles use free ammunition');
run('player.x=2538;player.y=250;player.ground=false;update(.016)');assert.equal(run('camps[0].used'),false);
run('player.x=2538;player.y=528;player.vy=0;player.ground=true;update(.016)');assert.equal(run('camps[0].used'),true);
run('spawnTimer=999;enemies=[];player.x=1000;player.y=528;player.inv=2;spawnMonster("slime",1238);const trapMob=enemies[0];trapMob.ground=true;const trapMobHp=trapMob.hp;update(.016)');
assert.equal(run('trapMob.hp'),run('trapMobHp')-35,'grounded monster takes trap damage');run('update(.016)');assert.equal(run('trapMob.hp'),run('trapMobHp')-35,'trap cooldown prevents instant repeat');
run('enemies=[];spawnMonster("slime",1238);enemies[0].y=FLOOR-150;enemies[0].ground=false;const airborneHp=enemies[0].hp;update(.016)');assert.equal(run('enemies[0].hp'),run('airborneHp'),'floor trap misses airborne monster');
const finds=[[1500,3600],[1600,3600],[1200,3350],[1450,3420],[1600,3400],[1520,3340],[1540,3380],[1550,3380],[1580,3350],[1620,3400]];
for(let level=0;level<10;level++){
  assert.equal(run('stage'),level);if(level>0)for(const offset of finds[level])pickup(level,offset);
  if(level===1){run('spawnTimer=999;enemies=[];spawnMonster("sandjaw",stage*LEVEL_LENGTH+4058);bossSpawned=true;player.x=stage*LEVEL_LENGTH+3800;player.y=528;player.inv=5;const sandjaw=enemies[0];sandjaw.ground=true;const sandjawHp=sandjaw.hp;update(.016)');assert.equal(run('sandjaw.hp'),run('sandjawHp')-25,'first boss takes trap damage');run('enemyShots=[];sandjaw.phaseTwo=true;sandjawSpray(sandjaw)');assert.equal(run('enemyShots.length'),5);}
  if(level===5){run('spawnTimer=999;enemies=[];spawnMonster("warden",stage*LEVEL_LENGTH+4258);bossSpawned=true;player.x=stage*LEVEL_LENGTH+3900;player.y=528;player.inv=5;const warden=enemies[0];warden.ground=true;while(Math.sin((time+.016)*2.5+traps.find(t=>t.x===stage*LEVEL_LENGTH+4250).x)<=-.2)time+=.1;const wardenHp=warden.hp;update(.016)');assert.equal(run('warden.hp'),run('wardenHp')-25,'Warden takes crystal trap damage');run('enemyShots=[];warden.phaseTwo=true;wardenNova(warden)');assert.equal(run('enemyShots.length'),12);}
  if(level===9){run('spawnTimer=999;enemies=[];spawnMonster("titan",stage*LEVEL_LENGTH+3988);bossSpawned=true;player.x=stage*LEVEL_LENGTH+3800;player.y=528;player.inv=5;const titan=enemies[0];titan.ground=true;const titanHp=titan.hp;update(.016)');assert.equal(run('titan.hp'),run('titanHp')-25,'final boss takes trap damage');run('enemyShots=[];titanShockwave(titan)');assert.equal(run('enemyShots.length'),2);}
  run('draw()');clearLevel();assert.equal(run('state'),level===9?'win':'map');if(level<9){assert.equal(run('unlockedStage'),level+1);run(`enterLevel(${level+1})`);}
}
assert.equal(run('player.inventory.length'),13,'all distinct weapons are collectible');assert.equal(run('player.loadouts.flat().filter(i=>i!==null).length'),13);
run('start();beginAdventure();enterLevel(0);spawnTimer=999;player.x=1958;player.y=528;player.vy=0;player.ground=true;update(.016)');assert.equal(run('player.vy'),0,'walking across a pad does not launch');
run('player.y=495;player.vy=400;player.ground=false;update(.08)');assert.ok(run('player.vy<-700'),'landing on a pad launches');
run('player.x=1230;player.y=433;player.vy=0;player.ground=true;player.inv=0;const safeHp=player.hp;update(.016)');assert.equal(run('player.hp'),run('safeHp'),'floor trap cannot reach platforms');
for(const name of ['mushroom','wolf','beetle','scorpion','wisp','golem','warden','thorns','spikes','crystal-trap','log-platform','sandstone-platform','ruin-platform'])assert.ok(fs.existsSync(__dirname+'/assets/monsters/'+name+'.png'),name);
console.log('PASS: ten lands, three escalating bosses, trap damage, staged gear, inventory, mobile controls, and victory.');
