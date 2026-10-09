// Local playtest editor. It changes the running level and stores layouts in this browser.
(() => {
  'use strict';
  const STORAGE='alistairs-wildlands-editor-v1',VERSION=4;
  const panel=document.querySelector('#level-editor'),frameElement=document.querySelector('.frame');
  panel.querySelector('.editor-head').insertAdjacentHTML('afterend',`<div class="editor-level-jump"><strong>Playtest any level</strong><label>Jump to <select id="editor-jump-level">${biomes.map((b,i)=>`<option value="${i}">${i+1}. ${b.name}</option>`).join('')}</select></label><p>Jumping resets the level view and enemies; your saved edits stay intact.</p></div>`);
  document.querySelector('#editor-goal').parentElement.firstChild.textContent='Pursuit-free hunt target ';
  const $=id=>document.querySelector('#'+id),clone=value=>JSON.parse(JSON.stringify(value));
  const bossFields=document.createElement('div');bossFields.id='editor-boss-fields';bossFields.innerHTML='<label>Boss health <input id="editor-boss-health" type="range" min="50" max="250" step="10"><output id="editor-boss-health-value"></output></label><label>Boss damage <input id="editor-boss-damage" type="range" min="50" max="250" step="10"><output id="editor-boss-damage-value"></output></label>';
  $('editor-monster').parentElement.before(bossFields);
  const speedFields=document.createElement('div');speedFields.id='editor-speed-fields';speedFields.innerHTML='<label>Ground speed <input id="editor-ground-speed" type="range" min="50" max="150" step="10"><output id="editor-ground-speed-value"></output></label><label>Flyer speed <input id="editor-flying-speed" type="range" min="50" max="150" step="10"><output id="editor-flying-speed-value"></output></label>';
  $('editor-monster').parentElement.before(speedFields);
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const inLevel=(x,level)=>x>=level*LEVEL_LENGTH&&x<(level+1)*LEVEL_LENGTH;
  const tools=['select','platform','thorns','spikes','crystal-trap','pad','chest','rest','potion','ammo','weapon'];
  let nextId=0,tool='select',draft=null,selected=null,drag=null,undo=[];
  const freshId=()=>`custom-${Date.now().toString(36)}-${++nextId}`;
  const status=text=>{$('editor-status').textContent=text;};
  const safeId=(value,prefix)=>typeof value==='string'&&/^[a-z0-9-]{1,64}$/i.test(value)?value:`${prefix}-${freshId()}`;

  function tagRuntime(){
    platforms.forEach((item,i)=>item.editorId??=`platform-${i}`);
    traps.forEach((item,i)=>item.editorId??=`trap-${i}`);
    chests.forEach((item,i)=>item.editorId??=`chest-${i}`);
    camps.forEach((item,i)=>item.editorId??=`rest-${i}`);
    loot.forEach((item,i)=>item.editorId??=`loot-${i}`);
  }
  tagRuntime();
  const defaults=biomes.map((biome,level)=>({
    platforms:clone(platforms.filter(p=>p.level===level)),
    traps:clone(traps.filter(t=>inLevel(t.x,level))),
    pads:springPads.filter(x=>inLevel(x,level)).map((x,i)=>({editorId:`pad-${level}-${i}`,x})),
    chests:clone(chests.filter(c=>inLevel(c.x,level))),
    camps:clone(camps.filter(c=>inLevel(c.x,level))),
    loot:clone(loot.filter(l=>inLevel(l.x,level))),
    goal:biome.goal,enemyHpScale:1,enemyDamageScale:1,bossHpScale:1,bossDamageScale:1,groundSpeedScale:1,flyingSpeedScale:1,spawnSeconds:3.6
  }));
  function cleanLevel(level,raw,savedVersion=VERSION){
    if(!raw||typeof raw!=='object')return null;
    const low=level*LEVEL_LENGTH,high=(level+1)*LEVEL_LENGTH-80,source=defaults[level];
    const cleanList=(name,limit,convert)=>Array.isArray(raw[name])?raw[name].slice(0,limit).map((item,i)=>convert(item,i)).filter(Boolean):clone(source[name]);
    const pos=(item)=>clamp(item.x,low+20,high);
    const cleaned={
      platforms:cleanList('platforms',35,(p,i)=>{if(!p||typeof p!=='object')return null;const w=clamp(p.w,80,400);return {editorId:safeId(p.editorId,`platform-${i}`),x:clamp(p.x,low+20,(level+1)*LEVEL_LENGTH-w-20),y:clamp(p.y,150,FLOOR-50),w,level};}),
      traps:cleanList('traps',25,(t,i)=>t&&['thorns','spikes','crystal-trap'].includes(t.kind)?{editorId:safeId(t.editorId,`trap-${i}`),x:pos(t),kind:t.kind,w:56,h:25}:null),
      pads:cleanList('pads',20,(p,i)=>p&&typeof p==='object'?{editorId:safeId(p.editorId,`pad-${i}`),x:pos(p)}:null),
      chests:cleanList('chests',20,(c,i)=>c&&typeof c==='object'?{editorId:safeId(c.editorId,`chest-${i}`),x:pos(c),y:clamp(c.y,170,FLOOR-15),opened:false}:null),
      camps:cleanList('camps',20,(c,i)=>c&&typeof c==='object'?{editorId:safeId(c.editorId,`rest-${i}`),x:pos(c),used:false}:null),
      loot:cleanList('loot',120,(l,i)=>l&&['weapon','weapon-upgrade','upgrade','ammo','potion'].includes(l.type)?{editorId:safeId(l.editorId,`loot-${i}`),x:pos(l),y:clamp(l.y,160,FLOOR-15),type:l.type,weapon:['weapon','weapon-upgrade'].includes(l.type)?clamp(Math.floor(l.weapon),0,weapons.length-1):undefined}:null),
      goal:clamp(raw.goal??source.goal,1,40),enemyHpScale:clamp(raw.enemyHpScale??1,.5,2.5),enemyDamageScale:clamp(raw.enemyDamageScale??1,.5,2.5),bossHpScale:clamp(raw.bossHpScale??1,.5,2.5),bossDamageScale:clamp(raw.bossDamageScale??1,.5,2.5),groundSpeedScale:clamp(raw.groundSpeedScale??1,.5,1.5),flyingSpeedScale:clamp(raw.flyingSpeedScale??1,.5,1.5),spawnSeconds:clamp(raw.spawnSeconds??source.spawnSeconds,.8,5)
    };
    if(savedVersion<2&&level===5&&!cleaned.camps.some(c=>Math.abs(c.x-(5*LEVEL_LENGTH+3590))<45))cleaned.camps.push(clone(source.camps.find(c=>c.x===5*LEVEL_LENGTH+3590)));
    if(savedVersion<3&&level===5)for(const trap of source.traps.filter(t=>[3860,4050,4500].includes(t.x-5*LEVEL_LENGTH)))if(!cleaned.traps.some(t=>Math.abs(t.x-trap.x)<45))cleaned.traps.push(clone(trap));
    if(savedVersion<4&&level===5)for(const item of cleaned.loot)if(item.type==='weapon'&&item.weapon===13&&Math.abs(item.x-(5*LEVEL_LENGTH+2200))<45)item.type='weapon-upgrade';
    if(savedVersion<4&&level===8&&!cleaned.loot.some(item=>item.type==='weapon'&&item.weapon===15))cleaned.loot.push(clone(source.loot.find(item=>item.type==='weapon'&&item.weapon===15)));
    return cleaned;
  }
  let edits={};
  try {const saved=JSON.parse(window.localStorage?.getItem(STORAGE)||'null');if([1,2,3,VERSION].includes(saved?.version)&&saved.levels&&typeof saved.levels==='object')for(let level=0;level<biomes.length;level++)if(saved.levels[level]){const clean=cleanLevel(level,saved.levels[level],saved.version);if(clean)edits[level]=clean;}}catch{}
  const save=()=>{try{window.localStorage?.setItem(STORAGE,JSON.stringify({version:VERSION,levels:edits}));return true;}catch{return false;}};
  const replaceStage=(array,level,predicate,items)=>array.splice(0,array.length,...array.filter(item=>!predicate(item,level)),...clone(items));
  function applyStage(level,data,previous=null){
    replaceStage(platforms,level,(item,i)=>item.level===i,data.platforms);
    replaceStage(traps,level,(item,i)=>inLevel(item.x,i),data.traps);
    replaceStage(springPads,level,(item,i)=>inLevel(item,i),data.pads.map(p=>p.x));
    const oldChests=new Map(chests.filter(c=>inLevel(c.x,level)).map(c=>[c.editorId,c]));
    replaceStage(chests,level,(item,i)=>inLevel(item.x,i),data.chests.map(c=>({...c,opened:oldChests.get(c.editorId)?.opened||false})));
    const oldCamps=new Map(camps.filter(c=>inLevel(c.x,level)).map(c=>[c.editorId,c]));
    replaceStage(camps,level,(item,i)=>inLevel(item.x,i),data.camps.map(c=>({...c,used:oldCamps.get(c.editorId)?.used||false})));
    const visibleIds=new Set(loot.filter(l=>inLevel(l.x,level)&&l.editorId).map(l=>l.editorId));
    const collected=new Set(previous?.loot.filter(l=>!visibleIds.has(l.editorId)).map(l=>l.editorId)||[]);
    loot=loot.filter(l=>!inLevel(l.x,level)||!l.editorId).concat(clone(data.loot.filter(l=>!collected.has(l.editorId))));
    const biome=biomes[level],oldHp=biome.enemyHpScale||1,oldBossHp=biome.bossHpScale||1;
    Object.assign(biome,{goal:data.goal,enemyHpScale:data.enemyHpScale,enemyDamageScale:data.enemyDamageScale,bossHpScale:data.bossHpScale,bossDamageScale:data.bossDamageScale,groundSpeedScale:data.groundSpeedScale,flyingSpeedScale:data.flyingSpeedScale,spawnSeconds:data.spawnSeconds});
    if(!training&&stage===level)for(const enemy of enemies){if(enemy.dummy||enemy.hp<=0)continue;const hpScale=enemy.boss?data.bossHpScale:data.enemyHpScale,damageScale=enemy.boss?data.bossDamageScale:data.enemyDamageScale;
      if((enemy.boss?oldBossHp:oldHp)!==hpScale){const ratio=enemy.hp/enemy.max;enemy.max=Math.max(1,Math.round(monsterStats[enemy.type].hp*hpScale));enemy.hp=Math.max(1,Math.round(enemy.max*ratio));}
      enemy.damage=Math.round(monsterStats[enemy.type].damage*damageScale);
      enemy.speed=monsterStats[enemy.type].speed*(enemy.boss?1:enemy.flying?data.flyingSpeedScale:data.groundSpeedScale);
    }
  }
  window.applySavedLevelEdits=()=>{tagRuntime();for(const [level,value] of Object.entries(edits))applyStage(Number(level),value);};
  window.applySavedLevelEdits();

  function currentObjects(){
    if(!draft)return [];
    return [
      ...draft.loot.map(item=>({kind:'loot',item})),...draft.traps.map(item=>({kind:'traps',item})),
      ...draft.pads.map(item=>({kind:'pads',item})),...draft.chests.map(item=>({kind:'chests',item})),
      ...draft.camps.map(item=>({kind:'camps',item})),...draft.platforms.map(item=>({kind:'platforms',item}))
    ];
  }
  function bounds(entry){const {kind,item}=entry;
    if(kind==='platforms')return {x:item.x,y:item.y-8,w:item.w,h:42};
    if(kind==='traps')return {x:item.x,y:FLOOR-42,w:56,h:42};
    if(kind==='pads')return {x:item.x-28,y:FLOOR-39,w:56,h:39};
    if(kind==='chests')return {x:item.x-23,y:item.y-18,w:46,h:39};
    if(kind==='camps')return {x:item.x-31,y:FLOOR-84,w:62,h:84};
    return {x:item.x-22,y:item.y-30,w:44,h:48};
  }
  const selectedEntry=()=>currentObjects().find(entry=>entry.kind===selected?.kind&&entry.item.editorId===selected.id);
  function setTool(value){tool=value;for(const button of panel.querySelectorAll('[data-editor-tool]'))button.classList.toggle('active',button.dataset.editorTool===value);}
  function refresh(){
    if(!draft)return;
    $('editor-level-name').textContent=`${stage+1}. ${biomes[stage].name}`;
    $('editor-jump-level').value=String(stage);
    const entry=selectedEntry(),item=entry?.item,canY=entry&&['platforms','chests','loot'].includes(entry.kind);
    $('editor-selection').textContent=entry?`${entry.kind==='loot'?item.type:entry.kind.replace(/s$/,'')} selected`:'No object selected';
    $('editor-x').disabled=!entry;$('editor-x').value=item?Math.round(item.x-stage*LEVEL_LENGTH):'';
    $('editor-y').disabled=!canY;$('editor-y').value=canY?Math.round(item.y):'';
    $('editor-width').disabled=entry?.kind!=='platforms';$('editor-width').value=entry?.kind==='platforms'?Math.round(item.w):'';
    $('editor-delete').disabled=!entry;$('editor-undo').disabled=!undo.length;
    if(entry?.kind==='loot'&&item.type==='weapon')$('editor-weapon').value=String(item.weapon);
    $('editor-goal').value=draft.goal;$('editor-health').value=Math.round(draft.enemyHpScale*100);$('editor-damage').value=Math.round(draft.enemyDamageScale*100);$('editor-boss-health').value=Math.round(draft.bossHpScale*100);$('editor-boss-damage').value=Math.round(draft.bossDamageScale*100);$('editor-ground-speed').value=Math.round(draft.groundSpeedScale*100);$('editor-flying-speed').value=Math.round(draft.flyingSpeedScale*100);$('editor-spawn').value=Math.round(draft.spawnSeconds*100);
    $('editor-health-value').textContent=`${Math.round(draft.enemyHpScale*100)}%`;$('editor-damage-value').textContent=`${Math.round(draft.enemyDamageScale*100)}%`;$('editor-boss-health-value').textContent=`${Math.round(draft.bossHpScale*100)}%`;$('editor-boss-damage-value').textContent=`${Math.round(draft.bossDamageScale*100)}%`;$('editor-ground-speed-value').textContent=`${Math.round(draft.groundSpeedScale*100)}%`;$('editor-flying-speed-value').textContent=`${Math.round(draft.flyingSpeedScale*100)}%`;$('editor-spawn-value').textContent=`${draft.spawnSeconds.toFixed(1)}s`;bossFields.hidden=!biomes[stage].boss;
    const monster=$('editor-monster'),value=monster.value;monster.replaceChildren();for(const name of [...biomes[stage].monsters,...(biomes[stage].boss?[stage===1?'sandjaw':stage===5?'warden':'titan']:[])]){const option=document.createElement('option');option.value=name;option.textContent=name.toUpperCase();monster.append(option);}if([...monster.options].some(o=>o.value===value))monster.value=value;
  }
  function commit(before){undo.push(before);if(undo.length>25)undo.shift();applyStage(stage,draft,before);edits[stage]=clone(draft);status(save()?'Saved here. Resume to test the change.':'Change applied, but browser storage is unavailable; export it now.');refresh();}
  function mutate(fn){if(state!=='editor'||!draft)return;const before=clone(draft);fn();commit(before);}
  function open(){
    if(state!=='play'||training||stage<0){const toggle=$('editor-toggle');toggle.textContent='Enter a level first';setTimeout(()=>toggle.textContent='Edit level (F2)',1800);return;}
    state='editor';keys.clear();mouse.down=false;player.attack=null;activeAimPointer=null;mobileAim=null;canvasTouch=null;touchGestures.clear();
    draft=clone(edits[stage]||defaults[stage]);selected=null;undo=[];drag=null;panel.hidden=false;frameElement.classList.add('editor-active');setTool('select');refresh();status('Paused. Pick a tool, then tap the level to place it.');
  }
  function close(){if(state!=='editor')return;drag=null;draft=null;selected=null;state='play';panel.hidden=true;frameElement.classList.remove('editor-active');keys.clear();canvas.focus();}
  window.toggleLevelEditor=()=>state==='editor'?close():open();
  $('editor-toggle').onclick=window.toggleLevelEditor;$('editor-close').onclick=close;$('editor-resume').onclick=close;
  $('editor-jump-level').onchange=()=>{const destination=Number($('editor-jump-level').value);if(state!=='editor'||!Number.isInteger(destination)||destination<0||destination>=biomes.length)return;close();pursuit=[];enterLevel(destination,true);open();status(`Testing ${biomes[destination].name}. Exit the editor to play this level.`);};
  panel.querySelectorAll('[data-editor-tool]').forEach(button=>button.onclick=()=>setTool(button.dataset.editorTool));
  $('editor-weapon').replaceChildren(...weapons.map((weapon,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=weapon.name;return option;}));
  function screenPoint(event){const rect=canvas.getBoundingClientRect();return {x:camera+(event.clientX-rect.left)*W/rect.width,y:(event.clientY-rect.top)*H/rect.height};}
  function place(point){
    const x=clamp(Math.round(point.x/10)*10,stage*LEVEL_LENGTH+20,(stage+1)*LEVEL_LENGTH-80),y=clamp(Math.round(point.y/10)*10,160,FLOOR-45);
    let kind,item;
    if(tool==='platform'){kind='platforms';item={editorId:freshId(),x:Math.min(x,(stage+1)*LEVEL_LENGTH-190),y,w:170,level:stage};}
    else if(['thorns','spikes','crystal-trap'].includes(tool)){kind='traps';item={editorId:freshId(),x,kind:tool,w:56,h:25};}
    else if(tool==='pad'){kind='pads';item={editorId:freshId(),x};}
    else if(tool==='chest'){kind='chests';item={editorId:freshId(),x,y:Math.min(FLOOR-20,y+10),opened:false};}
    else if(tool==='rest'){kind='camps';item={editorId:freshId(),x,used:false};}
    else {kind='loot';item={editorId:freshId(),x,y:tool==='weapon'?FLOOR-25:Math.min(FLOOR-25,y),type:tool==='weapon'?'weapon':tool,weapon:tool==='weapon'?Number($('editor-weapon').value):undefined};}
    mutate(()=>{draft[kind].push(item);selected={kind,id:item.editorId};});setTool('select');
  }
  canvas.addEventListener('pointerdown',event=>{
    if(state!=='editor')return;event.preventDefault();event.stopImmediatePropagation();const point=screenPoint(event);if(point.y>=583)return;
    if(tool!=='select'){place(point);return;}
    const found=currentObjects().find(entry=>{const b=bounds(entry);return point.x>=b.x-6&&point.x<=b.x+b.w+6&&point.y>=b.y-6&&point.y<=b.y+b.h+6;});
    selected=found?{kind:found.kind,id:found.item.editorId}:null;refresh();
    if(found){drag={pointerId:event.pointerId,before:clone(draft),startX:point.x,startY:point.y,originX:found.item.x,originY:found.item.y,moved:false};canvas.setPointerCapture?.(event.pointerId);}
  },true);
  canvas.addEventListener('pointermove',event=>{
    if(state!=='editor')return;event.preventDefault();event.stopImmediatePropagation();if(!drag||drag.pointerId!==event.pointerId)return;
    const point=screenPoint(event),entry=selectedEntry();if(!entry)return;
    const dx=point.x-drag.startX,dy=point.y-drag.startY;if(Math.abs(dx)+Math.abs(dy)<3&&!drag.moved)return;
    drag.moved=true;entry.item.x=clamp(Math.round((drag.originX+dx)/10)*10,stage*LEVEL_LENGTH+20,(stage+1)*LEVEL_LENGTH-(entry.kind==='platforms'?entry.item.w+20:80));
    if(['platforms','chests','loot'].includes(entry.kind))entry.item.y=clamp(Math.round((drag.originY+dy)/10)*10,entry.kind==='platforms'?150:160,entry.kind==='platforms'?FLOOR-50:FLOOR-15);
    applyStage(stage,draft,drag.before);refresh();
  },true);
  window.addEventListener('pointerup',event=>{if(state!=='editor')return;event.preventDefault();event.stopImmediatePropagation();if(drag?.pointerId===event.pointerId){if(drag.moved)commit(drag.before);drag=null;}},true);
  window.addEventListener('pointercancel',event=>{if(state==='editor'&&drag?.pointerId===event.pointerId){if(drag.moved)commit(drag.before);drag=null;}},true);
  window.addEventListener('keydown',event=>{if(event.key==='F2'||state==='editor'&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();window.toggleLevelEditor();return;}if(state==='editor')event.stopImmediatePropagation();},true);
  for(const [id,property] of [['editor-x','x'],['editor-y','y'],['editor-width','w']])$(id).onchange=()=>{const entry=selectedEntry();if(!entry)return;mutate(()=>{entry.item[property]=property==='x'?stage*LEVEL_LENGTH+clamp($(id).value,20,LEVEL_LENGTH-(entry.kind==='platforms'?entry.item.w+20:80)):property==='w'?clamp($(id).value,80,400):clamp($(id).value,150,FLOOR-15);if(property==='w')entry.item.x=Math.min(entry.item.x,(stage+1)*LEVEL_LENGTH-entry.item.w-20);});};
  $('editor-weapon').onchange=()=>{const entry=selectedEntry();if(entry?.kind==='loot'&&entry.item.type==='weapon')mutate(()=>{entry.item.weapon=Number($('editor-weapon').value);});};
  $('editor-delete').onclick=()=>{const entry=selectedEntry();if(!entry)return;mutate(()=>{draft[entry.kind]=draft[entry.kind].filter(item=>item.editorId!==entry.item.editorId);selected=null;});};
  for(const [id,property,scale] of [['editor-goal','goal',1],['editor-health','enemyHpScale',100],['editor-damage','enemyDamageScale',100],['editor-boss-health','bossHpScale',100],['editor-boss-damage','bossDamageScale',100],['editor-ground-speed','groundSpeedScale',100],['editor-flying-speed','flyingSpeedScale',100],['editor-spawn','spawnSeconds',100]])$(id).onchange=()=>mutate(()=>{draft[property]=Number($(id).value)/scale;});
  $('editor-spawn-monster').onclick=()=>{const name=$('editor-monster').value;if(!monsterStats[name])return;spawnMonster(name,Math.min((stage+1)*LEVEL_LENGTH-180,player.x+260));if(monsterStats[name].boss)bossSpawned=true;status(`${name.toUpperCase()} spawned nearby for this playtest.`);};
  $('editor-pan-left').onclick=()=>{camera=clamp(camera-550,stage*LEVEL_LENGTH,(stage+1)*LEVEL_LENGTH-W);};
  $('editor-pan-right').onclick=()=>{camera=clamp(camera+550,stage*LEVEL_LENGTH,(stage+1)*LEVEL_LENGTH-W);};
  $('editor-undo').onclick=()=>{if(!undo.length)return;const before=clone(draft);draft=undo.pop();selected=null;applyStage(stage,draft,before);edits[stage]=clone(draft);save();refresh();status('Last edit undone.');};
  $('editor-reset').onclick=()=>mutate(()=>{draft=clone(defaults[stage]);selected=null;});
  $('editor-export').onclick=()=>{const blob=new Blob([JSON.stringify({version:VERSION,game:'Alistairs Wildlands',levels:edits},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='wildlands-level-edits.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Level edits exported as JSON.');};
  $('editor-import').onchange=async event=>{const file=event.target.files?.[0];if(!file)return;try{const imported=JSON.parse(await file.text());if(![1,2,3,VERSION].includes(imported.version)||!imported.levels||typeof imported.levels!=='object')throw Error('Wrong file format');const next={};for(let level=0;level<biomes.length;level++)if(imported.levels[level]){const cleaned=cleanLevel(level,imported.levels[level],imported.version);if(cleaned)next[level]=cleaned;}const previous=edits;edits=next;for(let level=0;level<biomes.length;level++)applyStage(level,edits[level]||defaults[level],previous[level]||defaults[level]);draft=clone(edits[stage]||defaults[stage]);undo=[];selected=null;save();refresh();status('Edits imported. Resume to try them; pickups in this session may refresh.');}catch{status('Could not import that edits file.');}event.target.value='';};
  window.drawLevelEditorGuides=()=>{
    if(state!=='editor'||!draft)return;
    ctx.save();ctx.lineWidth=3;ctx.font='bold 12px Segoe UI, sans-serif';
    for(const entry of currentObjects()){const b=bounds(entry);if(b.x+b.w<camera||b.x>camera+W)continue;const active=selected?.id===entry.item.editorId;ctx.strokeStyle=active?'#fff1a4':'#88e9ed';ctx.fillStyle=active?'#fff1a4':'#dcffff';ctx.strokeRect(Math.round(b.x),Math.round(b.y),b.w,b.h);if(active)ctx.fillText('DRAG TO MOVE',b.x,b.y-8);}
    ctx.restore();
  };
})();
