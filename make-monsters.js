// Builds four-frame pixel sprites locally. Run with: node make-monsters.js <path-to-@napi-rs/canvas>
const fs = require('node:fs');
const path = require('node:path');
const { createCanvas } = require(process.argv[2] || '@napi-rs/canvas');
const out = path.join(__dirname, 'assets', 'monsters');
fs.mkdirSync(out, { recursive: true });

const recipes = {
  mushroom(p, f) {
    const bob = f ? 1 : 0;
    p.rect(13, 16 + bob, 10, 7, '#e6caa3');
    p.rect(10, 18 + bob, 4, 5, '#ae745f'); p.rect(21, 18 + bob, 4, 5, '#ae745f');
    p.rect(12, 13 + bob, 13, 8, '#442c48'); p.rect(14, 15 + bob, 9, 6, '#edd8b2');
    p.rect(14, 16 + bob, 2, 2, '#30283d'); p.rect(21, 16 + bob, 2, 2, '#30283d');
    p.poly([[7,12+bob],[9,7+bob],[14,3+bob],[22,3+bob],[28,7+bob],[30,13+bob],[26,15+bob],[11,15+bob]], '#342b46');
    p.poly([[8,11+bob],[11,6+bob],[16,4+bob],[22,4+bob],[27,7+bob],[29,12+bob],[24,13+bob],[11,13+bob]], '#c75b78');
    p.rect(13, 6+bob, 4, 2, '#f6b9a2'); p.rect(22, 8+bob, 3, 2, '#f4b6a1');
    p.rect(17, 10+bob, 3, 2, '#e78d96');
    if (f) { p.rect(6, 18, 3, 2, '#a3c7a0'); p.rect(27, 17, 3, 2, '#a3c7a0'); }
  },
  wolf(p, f) {
    const step=f?2:0;
    p.poly([[7,13],[3,8],[2,5],[5,7],[11,12]], '#2a3541');
    p.poly([[8,13],[3,8],[5,7],[13,13]], '#71848a');
    p.rect(9, 10, 17, 9, '#263644'); p.rect(10, 10, 15, 7, '#7c9292');
    p.rect(15, 12, 8, 5, '#aebbb3'); p.rect(11, 16, 10, 2, '#5a6f73');
    p.rect(10+step, 17, 3, 6-step, '#2a3541'); p.rect(21-step, 17, 3, 6, '#2a3541');
    p.poly([[23,12],[24,6],[27,8],[30,12],[30,16],[24,18],[21,15]], '#273444');
    p.poly([[23,12],[24,7],[26,10],[28,10],[29,14],[25,16],[22,14]], '#9fac9f');
    p.rect(26, 12, 2, 2, '#f1d08c'); p.rect(29, 15, 2, 2, '#273444');
    p.rect(24, 16, 5, 2, '#d5c7aa');
  },
  beetle(p, f) {
    const lift=f?1:0;
    p.rect(8, 19, 4, 3, '#40344d'); p.rect(22, 19, 4, 3, '#40344d');
    p.rect(6, 16, 5, 5, '#6e4d5d'); p.rect(24, 16, 5, 5, '#6e4d5d');
    p.poly([[7,15-lift],[9,8-lift],[17,5-lift],[25,8-lift],[29,14-lift],[26,19-lift],[9,19-lift]], '#312e48');
    p.poly([[8,14-lift],[10,9-lift],[17,6-lift],[25,9-lift],[28,14-lift],[25,18-lift],[9,18-lift]], '#b87965');
    p.poly([[17,7-lift],[23,8-lift],[26,12-lift],[22,15-lift],[17,15-lift]], '#dc9b70');
    p.rect(16, 6-lift, 2, 12, '#503951'); p.rect(11, 9-lift, 5, 2, '#e4ad7a');
    p.rect(26, 11-lift, 4, 5, '#4a3b52'); p.rect(28, 12-lift, 2, 2, '#f3dd98');
    p.rect(26, 7-lift, 2, 4, '#574051'); p.rect(29, 7-lift, 2, 5, '#574051');
  },
  scorpion(p, f) {
    const claw=f?2:0;
    p.rect(10, 14, 18, 7, '#402d48'); p.rect(11, 13, 16, 6, '#d1a761');
    p.rect(16, 15, 10, 2, '#f0ca7e'); p.rect(12, 21, 3, 3, '#77505a'); p.rect(23, 21, 3, 3, '#77505a');
    p.rect(7, 10, 5, 5, '#644354'); p.rect(4-claw, 8, 5, 5, '#e1b169');
    p.rect(25, 10, 5, 5, '#644354'); p.rect(29+claw, 8, 5, 5, '#e1b169');
    p.poly([[13,14],[10,8],[10,4],[14,2],[19,4],[18,6],[14,6],[13,10]], '#55344b');
    p.poly([[13,12],[11,7],[11,4],[14,3],[18,4],[16,6],[14,6]], '#e8bd71');
    p.rect(16, 4, 3, 3, '#7d4350'); p.rect(25, 14, 2, 2, '#fff0b6');
  },
  wisp(p, f) {
    const bob=f?2:0;
    p.poly([[17,2-bob],[21,7-bob],[19,10-bob],[25,13-bob],[27,18-bob],[22,22-bob],[12,22-bob],[7,18-bob],[11,12-bob],[12,7-bob]], '#26334f');
    p.poly([[17,4-bob],[19,9-bob],[18,12-bob],[24,15-bob],[24,18-bob],[21,20-bob],[12,20-bob],[10,17-bob],[14,11-bob]], '#77d4d3');
    p.rect(13, 12-bob, 9, 7, '#b9f1e1'); p.rect(15, 13-bob, 2, 3, '#26475e');
    p.rect(20, 13-bob, 2, 3, '#26475e'); p.rect(11, 21-bob, 2, 2, '#a5f3df');
    p.rect(23, 20-bob, 2, 2, '#a5f3df'); p.rect(5, 13+bob, 2, 2, '#baf3ec');
    p.rect(29, 9-bob, 2, 2, '#baf3ec');
  },
  golem(p, f) {
    const step=f?2:0;
    p.rect(5, 12, 7, 9, '#283947'); p.rect(6, 13, 6, 7, '#728995');
    p.rect(26, 12, 7, 9, '#283947'); p.rect(26, 13, 6, 7, '#728995');
    p.rect(10+step, 19, 7, 5, '#324252'); p.rect(21-step, 19, 7, 5, '#324252');
    p.poly([[11,9],[16,5],[26,5],[30,10],[29,20],[11,20]], '#263746');
    p.poly([[12,10],[17,6],[25,6],[28,10],[28,18],[12,18]], '#8499a4');
    p.rect(15, 8, 10, 4, '#a7b8bb'); p.rect(19, 12, 4, 6, '#506c74');
    p.rect(15, 13, 3, 3, '#baf8dc'); p.rect(24, 13, 3, 3, '#baf8dc');
    p.rect(17, 2, 3, 3, '#a6d8d0'); p.rect(20, 0, 2, 4, '#a6d8d0');
  },
  warden(p, f) {
    const stride=f===1?2:0,charge=f===2,dash=f===3,glow=charge?'#ffd0f2':'#a7eff7';
    // A horned armored guardian with a visible face, crystal chest, gauntlets and boots.
    p.poly([[5,7],[2,0],[8,4],[11,8]],'#1b253b');p.poly([[27,7],[31,0],[26,4],[23,8]],'#1b253b');
    p.poly([[5,5],[3,1],[9,5],[11,8]],'#92b9c9');p.poly([[27,5],[30,1],[25,5],[23,8]],'#92b9c9');
    p.rect(9+stride,18,7,6,'#1b2d44');p.rect(22-stride,18,7,6,'#1b2d44');
    p.rect(9+stride,21,8,3,'#8baabd');p.rect(22-stride,21,8,3,'#8baabd');
    p.poly([[8,8],[14,5],[25,5],[31,9],[30,20],[9,20]],'#17263e');
    p.poly([[10,9],[14,6],[25,6],[29,9],[28,18],[11,18]],'#647d98');
    p.rect(13,8,14,4,'#1e334d');p.rect(15,9,3,2,glow);p.rect(23,9,3,2,glow);
    p.rect(18,11,5,2,'#b8d8da');p.rect(13,14,14,5,'#283f59');
    p.poly([[18,13],[22,13],[25,16],[22,19],[18,19],[15,16]],charge?'#f7b9e9':'#8edce7');
    p.rect(19,15,3,3,'#e8f9f5');p.rect(11,12,2,7,'#a6c3cb');p.rect(27,12,2,7,'#a6c3cb');
    const armY=charge?5:dash?13:11;
    p.rect(2,armY,6,8,'#253b55');p.rect(3,armY+1,5,5,'#7999aa');
    p.rect(26,armY,6,8,'#253b55');p.rect(27,armY+1,5,5,'#7999aa');
    p.rect(1,armY+5,5,5,charge?'#d69bde':'#a9ccda');p.rect(28,armY+5,4,5,charge?'#d69bde':'#a9ccda');
    if(charge){p.rect(1,1,3,3,'#fadcf7');p.rect(29,1,3,3,'#fadcf7');p.rect(18,1,5,3,'#f4c0ec');}
    if(dash){p.rect(1,19,5,2,'#b8ecf4');p.rect(5,22,4,2,'#b8ecf4');}
  },
  thorns(p, f) {
    p.rect(1,21,31,3,'#314d3c');p.rect(3,20,27,2,'#6a8855');
    for(let i=0;i<7;i++){const x=2+i*5,h=12-(i%3)*3-(f&&i%2?2:0);p.poly([[x,21],[x+2,h],[x+5,21]],'#244b3d');p.poly([[x+2,h+2],[x+4,20],[x+2,19]],'#a5d47d');p.rect(x+3,18,1,2,'#d8ec9d');}
  },
  spikes(p, f) {
    p.rect(0,20,32,4,'#56434a');p.rect(0,20,32,2,'#a07764');
    for(let i=0;i<6;i++){const x=i*6;p.poly([[x,20],[x+3,7+(f&&i%2?2:0)],[x+6,20]],'#70828a');p.poly([[x+2,15],[x+3,7+(f&&i%2?2:0)],[x+4,18]],'#edf0d7');p.rect(x+1,20,2,2,'#d6aa7e');}
  },
  'crystal-trap'(p, f) {
    p.rect(0,21,32,3,'#2f455c');p.rect(2,20,28,2,'#87b3bf');
    for(let i=0;i<5;i++){const x=i*7,top=8-(f?3:0);p.poly([[x,21],[x+2,top],[x+5,21]],f?'#ad67bd':'#507f93');p.poly([[x+2,top],[x+3,top+4],[x+3,19]],f?'#ffe4fa':'#c6f0ef');p.rect(x+3,16,2,4,f?'#f5a5e0':'#88c6d0');}
  },
  'log-platform'(p) {
    p.rect(0,4,32,19,'#423a34');p.rect(0,5,32,5,'#718a56');p.rect(1,10,30,11,'#986b4c');
    p.rect(2,12,15,2,'#c69463');p.rect(19,17,10,2,'#684b3d');p.rect(0,21,32,3,'#5b493b');
    p.rect(4,5,3,2,'#b8d68d');p.rect(13,5,5,2,'#b8d68d');p.rect(25,6,4,2,'#b8d68d');
    p.rect(7,15,4,2,'#d5a271');p.rect(23,12,3,2,'#d5a271');p.rect(15,20,2,3,'#382d2c');
  },
  'sandstone-platform'(p) {
    p.rect(0,4,32,20,'#59454f');p.rect(0,4,32,5,'#d0a373');p.rect(0,9,32,13,'#ac795c');
    p.rect(2,12,12,2,'#e5b88c');p.rect(18,17,14,2,'#78565a');p.rect(0,21,32,3,'#604d52');
    p.rect(4,5,8,2,'#f4cc94');p.rect(20,5,7,2,'#f4cc94');p.rect(11,10,2,6,'#7d5956');
    p.rect(3,17,7,2,'#d09a71');p.rect(23,12,5,2,'#dfaa7e');p.rect(25,20,2,3,'#493c48');
  },
  'ruin-platform'(p) {
    p.rect(0,4,32,20,'#334a5c');p.rect(0,4,32,5,'#8fb9bc');p.rect(0,9,32,13,'#68798b');
    p.rect(4,11,10,2,'#9bb6bf');p.rect(19,16,13,2,'#42596b');p.rect(0,21,32,3,'#3d5365');
    p.rect(3,5,7,2,'#c2dde0');p.rect(18,5,10,2,'#c2dde0');p.rect(13,10,2,8,'#40596c');
    p.rect(5,16,7,2,'#799aaa');p.rect(22,12,4,2,'#a9cbd0');p.rect(26,20,2,3,'#293e50');
  }
};

for (const [name, recipe] of Object.entries(recipes)) {
  const canvas=createCanvas(256,48),g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
  for(let frame=0;frame<4;frame++) {
    g.save();g.translate(frame*64,0);g.scale(2,2);
    const p={rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h);},poly(points,c){g.fillStyle=c;g.beginPath();g.moveTo(...points[0]);for(const point of points.slice(1))g.lineTo(...point);g.closePath();g.fill();}};
    if(name==='warden')recipe(p,frame);
    else {
      if(frame===3)g.translate(0,-1);
      recipe(p,frame%2);
      if(frame===2){
        if(name==='mushroom'){p.rect(11,6,4,2,'#fff0c5');p.rect(24,7,3,2,'#fff0c5');p.rect(15,17,7,2,'#3b273d');}
        if(name==='wolf'){p.rect(26,16,5,3,'#1d293a');p.rect(27,16,2,3,'#fff1d1');p.rect(12,9,5,2,'#d9eee6');}
        if(name==='beetle'){p.poly([[9,8],[17,2],[25,8],[22,11],[17,9]],'#e8b789');p.rect(24,15,5,3,'#f0d4a1');}
        if(name==='scorpion'){p.poly([[11,5],[10,1],[18,2],[18,5]],'#f1cd83');p.rect(2,8,6,3,'#f5d793');p.rect(29,8,3,3,'#f5d793');}
        if(name==='wisp'){p.rect(12,9,12,10,'#d5fff0');p.rect(16,13,2,3,'#26475e');p.rect(21,13,2,3,'#26475e');}
        if(name==='golem'){p.rect(4,5,7,8,'#95abb1');p.rect(26,5,6,8,'#95abb1');p.rect(18,11,6,7,'#c7f7e7');}
      }
      if(frame===3&&!name.includes('platform')&&!['thorns','spikes','crystal-trap'].includes(name)){p.rect(5,22,5,2,'#c9e9dc');p.rect(25,21,5,2,'#c9e9dc');}
    }
    g.restore();
  }
  fs.writeFileSync(path.join(out,`${name}.png`),canvas.toBuffer('image/png'));
}
console.log(`Built ${Object.keys(recipes).length} four-frame monster sprites.`);
