// Optional offscreen visual QA: node render-preview.js <path-to-@napi-rs/canvas>
// This renders the actual game drawing code; it is not a browser interaction test.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createCanvas,loadImage}=require(process.argv[2]||'@napi-rs/canvas');
(async()=>{
  const canvas=createCanvas(1100,700);canvas.focus=()=>{};canvas.addEventListener=()=>{};
  const element={classList:{add(){},remove(){}},focus(){},querySelectorAll(){return []}};
  const box={document:{querySelector:s=>s==='#game'?canvas:element,querySelectorAll(){return []}},window:{addEventListener(){}},requestAnimationFrame(){},console,Math};
  vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(__dirname,'game.js'),'utf8'),box);
  box.loaded={};for(const file of fs.readdirSync(path.join(__dirname,'assets/starter-pack')))if(file.endsWith('.png')&&!file.includes('source')&&!file.includes('sheet'))box.loaded[file.slice(0,-4)]=await loadImage(path.join(__dirname,'assets/starter-pack',file));
  for(const file of fs.readdirSync(path.join(__dirname,'assets/monsters')))if(file.endsWith('.png'))box.loaded[file.slice(0,-4)]=await loadImage(path.join(__dirname,'assets/monsters',file));
  const run=s=>vm.runInContext(s,box);run('Object.assign(sprites,loaded);start();draw()');
  const dir=path.join(__dirname,'previews');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'practice.png'),canvas.toBuffer('image/png'));
  run('beginAdventure();unlockedStage=9');
  for(const [index,name,monster] of [[0,'fernwood','slime'],[1,'amber-ridge','sandjaw'],[2,'mirewood','mushroom'],[3,'whisperwood','bat'],[4,'frostglass','golem'],[5,'moonstone','warden'],[6,'stormbreak','wolf'],[7,'obsidian','golem'],[8,'sunflare','scorpion'],[9,'ember-citadel','titan']]){
    const boss=[1,5,9].includes(index),offset=boss?3900:1800;
    run(`enterLevel(${index});player.x=${index}*LEVEL_LENGTH+${offset};player.y=528;camera=${index}*LEVEL_LENGTH+${offset-400};spawnMonster('${monster}',player.x+300);draw()`);
    fs.writeFileSync(path.join(dir,name+'.png'),canvas.toBuffer('image/png'));
  }
  const sheet=createCanvas(1100,630),sctx=sheet.getContext('2d');
  for(let row=0;row<3;row++)for(let col=0;col<4;col++){
    const weapon=[0,3,2][row];run(`start();player.x=410;player.y=528;player.weapon=${weapon};attack();player.attack.elapsed=weapons[${weapon}].duration*${[.12,.38,.62,.82][col]};draw()`);
    sctx.drawImage(canvas,340,455,180,125,col*275,row*210+25,270,187);sctx.fillStyle='#fff';sctx.font='14px sans-serif';sctx.fillText(['Sword','Axe','Hammer'][row]+' '+[12,38,62,82][col]+'%',col*275+12,row*210+20);
  }
  fs.writeFileSync(path.join(dir,'melee-animation.png'),sheet.toBuffer('image/png'));
  const names=['mushroom','wolf','beetle','scorpion','wisp','golem','warden','thorns','spikes','crystal-trap'];
  const roster=createCanvas(900,490),rctx=roster.getContext('2d');rctx.fillStyle='#162c36';rctx.fillRect(0,0,900,490);
  rctx.fillStyle='#e8f3e7';rctx.font='bold 26px sans-serif';rctx.fillText('Wildlands: new creatures and hazards',28,42);
  for(let i=0;i<names.length;i++){const name=names[i],x=25+(i%5)*175,y=68+Math.floor(i/5)*205;
    rctx.fillStyle='#28434b';rctx.fillRect(x,y,160,185);rctx.drawImage(box.loaded[name],0,0,64,48,x+15,y+20,130,98);
    rctx.fillStyle='#e8f3e7';rctx.font='bold 16px sans-serif';rctx.fillText(name.toUpperCase().replace('-',' '),x+11,y+148);
  }
  fs.writeFileSync(path.join(dir,'monster-roster.png'),roster.toBuffer('image/png'));
  console.log('Rendered practice, regions, melee animation, and monster roster to previews/.');
})().catch(e=>{console.error(e);process.exitCode=1;});
