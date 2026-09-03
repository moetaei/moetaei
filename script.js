let frame = 0;
let slowFactor = 0.1;  // to slow all animations ~10x

const navLinks = document.querySelectorAll('.nav a');
const navPageLinks = document.querySelectorAll('.nav-pages a');
const pageSections = document.querySelectorAll('.section[id]');
const pageObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navPageLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
  });
}, { threshold: 0.58 });
pageSections.forEach(section => pageObserver.observe(section));
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
  });
}, { threshold: .14 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

const canvases = document.querySelectorAll('.bgCanvas');
canvases.forEach(canvas => {
  const ctx = canvas.getContext('2d');
  let width, height;
  const bgType = canvas.dataset.bgtype;

  // World-space offset for the mountain layers. This moves at the exact
  // same speed as the districts, so the mountains are part of the scene
  // rather than a stationary backdrop.
  let mountainScroll = 0;

  function resize(){
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // We'll increment 'frame' more slowly:
  function slowFrame(){ 
    frame += slowFactor; 
  }

  // 1) retrowaveIntro => slower grid + sun
  function drawRetrowaveIntro(){
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0,0,width,height);

    // Big slow-moving sun
    const sunRadius = height*0.2;
    const sunY = height*0.4;
    ctx.beginPath();
    ctx.arc(width/2, sunY, sunRadius, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255, 0, 128, 0.3)';
    ctx.fill();

    // horizon lines slower
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
    for(let i=0;i<6;i++){
      let lineY = sunY + i*40;
      let wave = Math.sin((frame*0.005)+i)*20;
      ctx.beginPath();
      ctx.moveTo(0,lineY);
      ctx.lineTo(width,lineY + wave);
      ctx.stroke();
    }

    // neon grid, slower
    ctx.strokeStyle = 'rgba(0,255,255,0.4)';
    for(let row=0; row<20; row++){
      let y = (height*0.6) + (row*20);
      ctx.beginPath();
      ctx.moveTo(0,y);
      for(let x=0;x<=width;x+=20){
        let wave = Math.sin((x+frame*1 + row*30)*0.01)*10;
        ctx.lineTo(x,y - wave);
      }
      ctx.stroke();
    }
    slowFrame();
  }

  // 2) quarterNeonWaves => from mid-screen
  function drawQuarterNeonWaves(){
    ctx.fillStyle='#000';
    ctx.fillRect(0,0,width,height);
    let startY = height*0.75; // from halfway down instead of 0.75
    for(let i=0;i<5;i++){
      ctx.beginPath();
      ctx.moveTo(0,height);
      for(let x=0;x<=width;x+=10){
        let wave = Math.sin((x+frame*3 + i*30)*0.02)*30;
        ctx.lineTo(x, startY+(i*40)+wave);
      }
      ctx.lineTo(width,height);
      ctx.closePath();
      ctx.fillStyle=(i%2===0)?'rgba(255,0,255,0.4)':'rgba(0,255,255,0.4)';
      ctx.fill();
    }
    slowFrame();
  }

  // 3) fastAurora => but also slowed a bit
  let auroraParticles = [];
  for(let i=0;i<120;i++){
    auroraParticles.push({
      x: Math.random()*1000,
      y: Math.random()*800,
      vx: (Math.random()*2-1)*0.2,
      vy: (Math.random()*2-1)*0.2
    });
  }
  const skyClouds = Array.from({length: 8}, (_, i) => ({
    x: (i / 8) * 1.15 + Math.random() * .18,
    y: .11 + Math.random() * .34,
    scale: .6 + Math.random() * .75,
    speed: .018 + Math.random() * .018
  }));
  const skyBirds = Array.from({length: 14}, (_, i) => ({
    x: Math.random(), y: .10 + Math.random() * .34, speed: .000035 + Math.random() * .000025,
    scale: .55 + Math.random() * .7, phase: Math.random() * Math.PI * 2
  }));

  function drawCloud(x, y, scale, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const grad = ctx.createLinearGradient(0, -34, 0, 34);
    grad.addColorStop(0, `rgba(233,238,255,${alpha * .95})`);
    grad.addColorStop(1, `rgba(154,161,195,${alpha * .52})`);
    ctx.fillStyle = grad;
    ctx.shadowColor = `rgba(134,145,196,${alpha * .22})`;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-54, 18);
    ctx.bezierCurveTo(-54, 3, -42, -7, -25, -7);
    ctx.bezierCurveTo(-17, -27, 4, -37, 23, -24);
    ctx.bezierCurveTo(29, -36, 49, -37, 61, -22);
    ctx.bezierCurveTo(72, -21, 80, -13, 82, 0);
    ctx.bezierCurveTo(94, 2, 101, 9, 101, 19);
    ctx.bezierCurveTo(101, 30, 92, 35, 80, 35);
    ctx.lineTo(-35, 35);
    ctx.bezierCurveTo(-48, 35, -54, 29, -54, 18);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(255,255,255,${alpha * .11})`;
    ctx.beginPath();
    ctx.ellipse(10, -14, 42, 9, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBird(x, y, scale, flap) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = 'rgba(20,24,34,.78)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-2, flap ? -5 : -2, 0, 0);
    ctx.quadraticCurveTo(2, flap ? -5 : -2, 6, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawStoryTower(baseX, groundY, s) {
    ctx.save();
    ctx.translate(baseX, groundY);
    ctx.scale(s, s);

    // Rocky point / cliff the lighthouse stands on.
    ctx.fillStyle='rgba(7,10,15,.98)';
    ctx.beginPath();
    ctx.moveTo(-96,18); ctx.lineTo(-84,-5); ctx.lineTo(-67,-20); ctx.lineTo(-45,-15);
    ctx.lineTo(-28,-28); ctx.lineTo(-2,-15); ctx.lineTo(26,-26); ctx.lineTo(54,-9);
    ctx.lineTo(77,-15); ctx.lineTo(96,16); ctx.closePath(); ctx.fill();

    // Classic tapered lighthouse tower.
    const towerGrad=ctx.createLinearGradient(-26,-210,26,0);
    towerGrad.addColorStop(0,'rgba(205,211,214,.95)');
    towerGrad.addColorStop(.48,'rgba(124,133,141,.95)');
    towerGrad.addColorStop(1,'rgba(53,61,68,.98)');
    ctx.fillStyle=towerGrad;
    ctx.beginPath();
    ctx.moveTo(-24,0); ctx.lineTo(-17,-152); ctx.lineTo(-14,-178);
    ctx.lineTo(14,-178); ctx.lineTo(17,-152); ctx.lineTo(24,0); ctx.closePath(); ctx.fill();

    // Dark gallery trim.
    ctx.fillStyle='rgba(12,16,20,.98)';
    ctx.fillRect(-21,-182,42,7);
    ctx.fillRect(-20,-175,40,4);

    // Lantern room with windows and roof.
    ctx.fillStyle='rgba(9,13,18,.98)';
    ctx.fillRect(-16,-207,32,24);
    ctx.strokeStyle='rgba(231,234,238,.42)'; ctx.lineWidth=2;
    for(let x=-10;x<=10;x+=10){ctx.beginPath();ctx.moveTo(x,-205);ctx.lineTo(x,-185);ctx.stroke();}
    ctx.fillStyle='rgba(25,30,36,.98)';
    ctx.beginPath();ctx.moveTo(-21,-208);ctx.lineTo(0,-219);ctx.lineTo(21,-208);ctx.closePath();ctx.fill();

    // Warm beacon.
    ctx.fillStyle='#ffe36e';ctx.shadowColor='#ffe36e';ctx.shadowBlur=18;
    ctx.beginPath();ctx.arc(0,-196,4.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;

    // Small door + windows.
    ctx.fillStyle='rgba(16,21,26,.98)';ctx.fillRect(-7,-40,14,40);
    ctx.fillStyle='rgba(255,223,120,.34)';
    for(let y=-118;y>-18;y+=34){ ctx.fillRect(-5,y,10,7); }

    // Narrow rail around the gallery.
    ctx.strokeStyle='rgba(230,232,235,.42)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(-23,-180);ctx.lineTo(23,-180);ctx.stroke();
    for(let x=-18;x<=18;x+=6){ctx.beginPath();ctx.moveTo(x,-180);ctx.lineTo(x,-174);ctx.stroke();}
    ctx.restore();
  }

  function drawFastAurora(){
    const day = frame * 0.000055;
    const cycle = (Math.sin(day) + 1) * 0.5;
    const topHue = 226 + cycle * 20;
    const lowerHue = 258 + cycle * 8;
    const grad = ctx.createLinearGradient(0,0,0,height);
    grad.addColorStop(0, `hsl(${topHue}, 48%, ${11 + cycle*5}%)`);
    grad.addColorStop(.48, `hsl(${topHue+8}, 52%, ${17 + cycle*5}%)`);
    grad.addColorStop(.74, `hsl(${lowerHue}, 42%, ${27 + cycle*7}%)`);
    grad.addColorStop(1, `hsl(${lowerHue+10}, 35%, ${18 + cycle*5}%)`);
    ctx.fillStyle=grad; ctx.fillRect(0,0,width,height);

    for(let i=0;i<3;i++){
      ctx.beginPath();
      ctx.moveTo(0,height*(.23+i*.095));
      for(let x=0;x<=width;x+=18){
        const y=height*(.23+i*.095)+Math.sin(x*.0031+frame*.0018+i)*24+Math.sin(x*.0014+frame*.0009)*11;
        ctx.lineTo(x,y);
      }
      ctx.strokeStyle=`hsla(${200+i*26},65%,78%,.055)`; ctx.lineWidth=20; ctx.stroke();
    }

    for(let i=0;i<62;i++){
      const sx=(i*137.37)%width, sy=(i*51.17)%(height*.47), tw=.35+.35*Math.sin(frame*.006+i);
      ctx.fillStyle=`rgba(255,252,246,${.14+tw*.34})`;
      ctx.beginPath();ctx.arc(sx,sy,1.05,0,Math.PI*2);ctx.fill();
    }

    const mx=width*.79,my=height*.18,mr=Math.min(width,height)*.055;
    const moonGlow=ctx.createRadialGradient(mx,my,0,mx,my,mr*2.8);
    moonGlow.addColorStop(0,'rgba(255,222,133,.14)');
    moonGlow.addColorStop(1,'rgba(255,222,133,0)');
    ctx.fillStyle=moonGlow;ctx.fillRect(mx-mr*3,my-mr*3,mr*6,mr*6);
    ctx.fillStyle='#ead27d';ctx.shadowColor='#ead27d';ctx.shadowBlur=12;
    ctx.beginPath();ctx.arc(mx,my,mr,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='rgba(111,91,52,.13)';
    for(let i=0;i<6;i++){const ang=i*1.7;ctx.beginPath();ctx.arc(mx+Math.cos(ang)*mr*.32,my+Math.sin(ang)*mr*.28,mr*.10,0,Math.PI*2);ctx.fill();}

    skyClouds.forEach(c=>{
      c.x+=c.speed*0.00018;
      if(c.x>1.18)c.x=-.18;
      drawCloud(c.x*width,c.y*height,c.scale*.88,.045);
    });

    skyBirds.forEach((b,i)=>{
      b.x+=b.speed;
      if(b.x>1.15)b.x=-.08;
      drawBird(b.x*width,b.y*height,b.scale*.72,.5+.5*Math.sin(frame*.012+i));
    });

    // Distant coast, dark water, and a rocky lighthouse point.
    const horizon=height*.755;
    ctx.fillStyle='rgba(6,11,18,.97)';
    ctx.fillRect(0,horizon,width,height-horizon);

    // Far coastline silhouette.
    ctx.fillStyle='rgba(16,21,29,.98)';
    ctx.beginPath();ctx.moveTo(0,horizon);
    for(let x=0;x<=width;x+=18){
      const y=horizon-24-Math.sin(x*.0037)*18-Math.sin(x*.0091)*8;
      ctx.lineTo(x,y);
    }
    ctx.lineTo(width,horizon+12);ctx.lineTo(0,horizon+12);ctx.closePath();ctx.fill();

    // Slow, subtle ocean texture.
    ctx.strokeStyle='rgba(112,152,184,.15)';ctx.lineWidth=1;
    for(let r=0;r<12;r++){
      const yy=horizon+24+r*18;
      ctx.beginPath();
      for(let x=0;x<=width;x+=20){
        const y=yy + Math.sin(x*.007+r+frame*.00035)*2.2 + Math.sin(x*.0021+r*.8)*1.2;
        if(x===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }

    // Gentle moon-path reflection.
    const mx2=width*.79;
    ctx.strokeStyle='rgba(255,225,130,.11)';ctx.lineWidth=2;
    for(let i=0;i<7;i++){
      const yy=horizon+34+i*15;
      const span=34+i*9;
      ctx.beginPath();ctx.moveTo(mx2-span,yy);ctx.quadraticCurveTo(mx2,yy-2,mx2+span,yy);ctx.stroke();
    }

    drawStoryTower(width*.22,height*.86,1.12);
    const towerX = width*.22, towerY = height*.86-219*1.12;
    ctx.save();
    ctx.translate(towerX,towerY);
    // Slow lighthouse sweep.
    ctx.rotate(frame*0.00032);
    const beam = ctx.createLinearGradient(0,0,width*.46,0);
    beam.addColorStop(0,'rgba(255,226,126,.12)');
    beam.addColorStop(1,'rgba(255,226,126,0)');
    ctx.fillStyle=beam;
    ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(width*.46,-14);ctx.lineTo(width*.46,14);ctx.closePath();ctx.fill();
    ctx.restore();

    for(let i=0;i<9;i++){
      const hx=(i+.3)/9*width;
      const hy=horizon + 8 + (i%3)*3;
      ctx.fillStyle='rgba(255,207,116,.24)';ctx.fillRect(hx,hy,2,2);
    }
    slowFrame();
  }


// === Synth City / Mountain Landscape ===
// The skyline is made from scrolling "districts". Some districts are
// urban, while others are mountain/lake areas with cabins and trees.
// Buildings retain the original simple window and roof treatment.

const DISTRICT_MIN = 400;
const DISTRICT_MAX = 680;
const CITY_SPEED = 0.5;
let districts = [];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makeCityBuilding(localX, districtWidth) {
  const w = rand(90, 175);
  const h = height * rand(0.34, 0.68);
  const rowSpacing = 40;
  const colSpacing = 21;
  const rows = Math.max(1, Math.floor((h - 12) / rowSpacing));
  const cols = Math.max(1, Math.floor((w - 20) / colSpacing));
  const windows = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      windows.push({
        xOffset: 10 + c * colSpacing,
        yOffset: 16 + r * rowSpacing,
        color: Math.random() < 0.9 ? '#fff' : '#000',
        blinkTimer: 60 + Math.floor(Math.random() * 180),
        isOn: true
      });
    }
  }

  return {
    x: localX,
    w,
    h,
    windows,
    // A small original-style roof lip, not a new neon decoration.
    roof: Math.random() < 0.45
  };
}

// Fixed, seamless mountain world.
// IMPORTANT: these values never change while the page is running.
const MOUNTAIN_STEP = 90;
const MOUNTAIN_WORLD_WIDTH = 5400;

function buildMountainPoints(seed, min, max) {
  const points = [];
  const count = MOUNTAIN_WORLD_WIDTH / MOUNTAIN_STEP;

  for (let i = 0; i < count; i++) {
    const x = i * MOUNTAIN_STEP;
    const value =
      min +
      Math.abs(Math.sin(seed + x * 0.011)) * (max - min) * 0.72 +
      Math.abs(Math.sin(seed * 0.63 + x * 0.0047)) * (max - min) * 0.28;

    points.push(value);
  }

  return points;
}

const FAR_MOUNTAINS = buildMountainPoints(1.7, 48, 123);
const NEAR_MOUNTAINS = buildMountainPoints(2.2, 30, 90);

// Returns the stable foreground mountain surface at a world X.
// Cabins use this so they can never float above the mountain silhouette.
function mountainSurface(worldX) {
  const wrapped = ((worldX % MOUNTAIN_WORLD_WIDTH) +
                   MOUNTAIN_WORLD_WIDTH) % MOUNTAIN_WORLD_WIDTH;

  const i = Math.floor(wrapped / MOUNTAIN_STEP);
  const next = (i + 1) % NEAR_MOUNTAINS.length;
  const t = (wrapped % MOUNTAIN_STEP) / MOUNTAIN_STEP;

  const peak =
    NEAR_MOUNTAINS[i] * (1 - t) +
    NEAR_MOUNTAINS[next] * t;

  return height * 0.70 - peak;
}

function makeDistrict(x, forceType = null) {
  const type = forceType || (Math.random() < 0.62 ? 'city' : 'nature');
  const widthD = type === 'nature'
    ? rand(1150, 1650)
    : rand(DISTRICT_MIN, DISTRICT_MAX);
  const district = {
    x,
    w: widthD,
    type,
    buildings: [],
    trees: [],
    cabins: [],
    mountainSeed: Math.random() * 1000
  };

  if (type === 'city') {
    let bx = rand(-20, 30);
    while (bx < widthD - 40) {
      const b = makeCityBuilding(bx, widthD);
      district.buildings.push(b);
      bx += b.w + rand(8, 20);
    }
  } else {
    // Dense hillside settlement.
    // Homes are positioned from the actual mountain surface rather than
    // arbitrary screen-space Y values. This keeps them IN the landscape.
    const rows = [
      { count: 9, depth: 0, scale: [0.20, 0.26], lift: 92 },
      { count: 9, depth: 1, scale: [0.24, 0.30], lift: 68 },
      { count: 8, depth: 2, scale: [0.28, 0.35], lift: 44 },
      { count: 7, depth: 3, scale: [0.32, 0.40], lift: 22 }
    ];

    rows.forEach((row, rowIndex) => {
      const spacing = widthD / (row.count + 1);

      for (let i = 0; i < row.count; i++) {
        const stagger = rowIndex % 2 ? spacing * 0.42 : 0;

        const xPos = Math.min(
          widthD - 70,
          Math.max(
            30,
            spacing * (i + 1) +
            stagger +
            rand(-spacing * 0.22, spacing * 0.22)
          )
        );

        const scale = rand(row.scale[0], row.scale[1]);

        // Use world X because this terrain scrolls with the scene.
        const terrainY = mountainSurface(x + xPos);

        // Push homes down from the ridge line into the valley.
        // Far homes sit higher/smaller, foreground homes lower/larger.
        const baseY = Math.max(
          terrainY + row.lift,
          height * (0.62 + rowIndex * 0.055)
        );

        district.cabins.push({
          x: xPos,
          y: baseY / height,
          scale,
          depth: row.depth,
          lights: [
            { on: Math.random() > 0.10, timer: 45 + Math.floor(Math.random() * 180) },
            { on: Math.random() > 0.10, timer: 70 + Math.floor(Math.random() * 220) }
          ]
        });
      }
    });

    // Small secondary homes fill the hills without creating a straight row.
    district.cabins
      .filter((_, i) => i % 4 === 1)
      .forEach(home => {
        const offset = rand(28, 62);
        const xPos = Math.min(widthD - 50, home.x + offset);
        const terrainY = mountainSurface(x + xPos);

        district.cabins.push({
          x: xPos,
          y: Math.max(terrainY + rand(35, 70), height * 0.72) / height,
          scale: home.scale * rand(0.55, 0.72),
          depth: home.depth + 0.2,
          lights: [
            { on: Math.random() > 0.12, timer: 80 + Math.floor(Math.random() * 180) },
            { on: Math.random() > 0.12, timer: 100 + Math.floor(Math.random() * 220) }
          ]
        });
      });

    // Trees form irregular clusters around the homes.
    const treeCount = Math.floor(rand(38, 58));
    for (let i = 0; i < treeCount; i++) {
      const tx = rand(10, widthD - 10);
      const terrainY = mountainSurface(x + tx);

      district.trees.push({
        x: tx,
        scale: rand(0.16, 0.34),
        y: Math.max(terrainY + rand(18, 70), height * 0.70) / height
      });
    }
  }

  return district;
}

function rebuildDistricts() {
  districts = [];
  let x = -DISTRICT_MAX;

  // Start with a mixture so the first viewport is already broken up.
  const initialTypes = ['city', 'nature', 'city', 'city', 'nature', 'city', 'nature'];
  let i = 0;

  while (x < width + DISTRICT_MAX * 2) {
    const d = makeDistrict(x, initialTypes[i % initialTypes.length]);
    districts.push(d);
    x += d.w;
    i++;
  }
}

rebuildDistricts();

function drawMountains(d) {
  const horizon = height * 0.72;
  const seed = d.mountainSeed;

  // Distant range.
  ctx.fillStyle = '#16002b';
  ctx.beginPath();
  ctx.moveTo(d.x, horizon + 30);
  const step = 90;
  for (let px = 0; px <= d.w + step; px += step) {
    const peak = 28 + Math.abs(Math.sin(seed + px * 0.013)) * 82;
    ctx.lineTo(d.x + px, horizon - peak);
  }
  ctx.lineTo(d.x + d.w, height * 0.82);
  ctx.closePath();
  ctx.fill();

  // Foreground range.
  ctx.fillStyle = '#080014';
  ctx.beginPath();
  ctx.moveTo(d.x, horizon + 75);
  for (let px = 0; px <= d.w + step; px += step) {
    const peak = 18 + Math.abs(Math.sin(seed * 1.7 + px * 0.019)) * 58;
    ctx.lineTo(d.x + px, horizon - peak);
  }
  ctx.lineTo(d.x + d.w, height * 0.84);
  ctx.closePath();
  ctx.fill();
}

function drawTree(x, baseY, scale) {
  const trunkH = 16 * scale;

  ctx.fillStyle = '#070707';
  ctx.fillRect(x - 1.5 * scale, baseY - trunkH, 3 * scale, trunkH);

  ctx.fillStyle = '#05050b';
  for (let i = 0; i < 3; i++) {
    const y = baseY - trunkH - i * 11 * scale;
    const half = (11 - i * 2.5) * scale;
    ctx.beginPath();
    ctx.moveTo(x, y - 16 * scale);
    ctx.lineTo(x - half, y);
    ctx.lineTo(x + half, y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCabin(x, baseY, scale, lights) {
  const w = 118 * scale;
  const h = 62 * scale;
  const y = baseY - h;

  // Small glow behind the cabin so distant homes remain readable.
  ctx.fillStyle = 'rgba(255, 0, 255, 0.10)';
  ctx.shadowColor = 'rgba(255, 0, 255, 0.30)';
  ctx.shadowBlur = 8 * scale;
  ctx.fillRect(x - 4 * scale, y - 4 * scale, w + 8 * scale, h + 8 * scale);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#090909';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = 'rgba(255,0,255,0.72)';
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.strokeRect(x, y, w, h);

  // Roof.
  ctx.fillStyle = '#060606';
  ctx.beginPath();
  ctx.moveTo(x - 10 * scale, y);
  ctx.lineTo(x + w * 0.50, y - 32 * scale);
  ctx.lineTo(x + w + 10 * scale, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Door.
  ctx.fillStyle = '#111';
  ctx.fillRect(x + w * 0.44, y + h * 0.48, 12 * scale, h * 0.52);

  const lampData = lights || [
    { on: true, timer: 100 },
    { on: true, timer: 140 }
  ];

  const positions = [
    [16, 21],
    [w / scale - 30, 21]
  ];

  lampData.forEach((lamp, i) => {
    lamp.timer--;
    if (lamp.timer <= 0) {
      lamp.on = Math.random() > 0.18;
      lamp.timer = 90 + Math.floor(Math.random() * 260);
    }

    if (lamp.on) {
      ctx.fillStyle = '#ff0';
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 5;
      ctx.fillRect(
        x + positions[i][0] * scale,
        y + positions[i][1] * scale,
        14 * scale,
        16 * scale
      );
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#333';
      ctx.fillRect(
        x + positions[i][0] * scale,
        y + positions[i][1] * scale,
        14 * scale,
        16 * scale
      );
    }
  });
}

function drawNatureDistrict(d) {
  const left = Math.max(0, d.x);
  const right = Math.min(width, d.x + d.w);
  if (right <= left) return;

  // Lake stays low and behind the settlement.
  const lakeY = height * 0.90;
  ctx.fillStyle = '#040013';
  ctx.fillRect(left, lakeY, right - left, height - lakeY);

  ctx.strokeStyle = 'rgba(255,0,255,0.30)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, lakeY);
  ctx.lineTo(right, lakeY);
  ctx.stroke();

  // Draw distant homes first, then closer homes.
  const homes = d.cabins.slice().sort((a, b) => a.depth - b.depth);

  homes.forEach(c => {
    const cx = d.x + c.x;
    const terrainY = height * c.y;

    if (cx > -120 && cx < width + 120) {
      drawCabin(cx, terrainY, c.scale, c.lights);
    }
  });

  // Trees remain behind the homes and are scattered through the scene.
  d.trees.forEach(t => {
    const tx = d.x + t.x;
    if (tx > -40 && tx < width + 40) {
      const treeY = height * t.y;
      drawTree(tx, treeY, t.scale);
    }
  });

  // Small docks only at the lake edge.
  if (d.cabins.length) {
    const nearest = d.cabins.reduce((a, b) =>
      a.depth > b.depth ? a : b
    );
    const dockX = d.x + nearest.x + 28;
    const dockY = lakeY + 4;

    if (dockX < width && dockX + 70 > 0) {
      ctx.fillStyle = '#090909';
      ctx.fillRect(dockX, dockY, 70, 6);
      ctx.fillRect(dockX + 9, dockY, 6, 22);
      ctx.fillRect(dockX + 55, dockY, 6, 22);
    }
  }
}

function drawCityDistrict(d) {
  d.buildings.forEach(b => {
    const x = d.x + b.x;
    const top = height - b.h;

    ctx.fillStyle = '#000';
    ctx.fillRect(x, top, b.w, b.h);

    b.windows.forEach(win => {
      win.blinkTimer--;
      if (win.blinkTimer <= 0) {
        const palette = ['#fff', '#ff0', '#000', '#999'];
        win.color = palette[Math.floor(Math.random() * palette.length)];
        win.blinkTimer = 1500 + Math.floor(Math.random() * 1200);
      }

      const wx = x + win.xOffset;
      const wy = top + win.yOffset;

      if (wx + 15 <= x + b.w - 4 && wy + 20 <= height) {
        ctx.fillStyle = win.color;
        ctx.fillRect(wx, wy, 15, 20);
      }
    });

    // Keep the original simple magenta roof/building treatment.
    ctx.strokeStyle = 'magenta';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, top, b.w, b.h);

    if (b.roof) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x + b.w, top);
      ctx.stroke();
    }
  });
}

function drawSynthCity() {
  // One continuous sky. Districts only control the foreground content,
  // so there can never be horizontal seams between district types.
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, 'rgba(255,0,255,0.30)');
  skyGrad.addColorStop(1, 'rgba(0,0,50,0.70)');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Move the complete landscape strip.
  districts.forEach(d => d.x -= CITY_SPEED);

  // Mountains are a FIXED world, not regenerated from screen coordinates.
  // mountainScroll only changes where that already-created terrain appears.
  mountainScroll = (mountainScroll + CITY_SPEED) % MOUNTAIN_WORLD_WIDTH;

  const horizon = height * 0.70;
  const mountainOffset = mountainScroll;

  function drawMountainLayer(points, fill, baseY) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, baseY);

    const step = MOUNTAIN_STEP;
    const startWorld = Math.floor(mountainOffset / step) * step - step * 2;

    for (let worldX = startWorld;
         worldX <= mountainOffset + width + step * 2;
         worldX += step) {
      const screenX = worldX - mountainOffset;
      const index = Math.floor((((worldX % MOUNTAIN_WORLD_WIDTH) +
                                 MOUNTAIN_WORLD_WIDTH) %
                                MOUNTAIN_WORLD_WIDTH) / step);

      const peak = points[index % points.length];
      ctx.lineTo(screenX, horizon - peak);
    }

    ctx.lineTo(width, baseY);
    ctx.lineTo(0, baseY);
    ctx.closePath();
    ctx.fill();
  }

  // The two arrays are generated once below, so the silhouette physically
  // translates instead of morphing every frame.
  drawMountainLayer(FAR_MOUNTAINS, '#16002b', horizon + 40);
  drawMountainLayer(NEAR_MOUNTAINS, '#080014', horizon + 85);

  // Continuous dark ground plane. This removes the hard horizontal
  // district edges that were creating the visible "lines".
  const groundY = height * 0.84;
  ctx.fillStyle = '#05000f';
  ctx.fillRect(0, groundY, width, height - groundY);

  // Nature districts add their lakes, cabins, trees, and docks.
  // Lakes stay inside the ground plane and do not paint over mountains.
  districts.forEach(d => {
    if (d.type !== 'nature') return;

    const left = Math.max(0, d.x);
    const right = Math.min(width, d.x + d.w);
    if (right <= left) return;

    // Lake sits in the lower part of the scene.
    const lakeY = height * 0.89;
    ctx.fillStyle = '#040013';
    ctx.fillRect(left, lakeY, right - left, height - lakeY);

    // Very subtle shoreline, clipped to this district.
    ctx.strokeStyle = 'rgba(255,0,255,0.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, lakeY);
    ctx.lineTo(right, lakeY);
    ctx.stroke();

    // Background trees use their own terrain height.
    d.trees.forEach(t => {
      const tx = d.x + t.x;
      if (tx > -40 && tx < width + 40) {
        drawTree(tx, height * t.y, t.scale);
      }
    });

    // Homes are rendered at their individual terrace elevations.
    const homes = d.cabins.slice().sort((a, b) => a.depth - b.depth);

    homes.forEach(c => {
      const cx = d.x + c.x;
      if (cx > -120 && cx < width + 120) {
        drawCabin(cx, height * c.y, c.scale, c.lights);
      }
    });

    if (d.cabins.length) {
      const dockX = d.x + d.cabins[0].x + 30;
      const dockY = lakeY + 4;
      if (dockX < width && dockX + 82 > 0) {
        ctx.fillStyle = '#090909';
        ctx.fillRect(dockX, dockY, 82, 6);
        ctx.fillRect(dockX + 10, dockY, 6, 25);
        ctx.fillRect(dockX + 66, dockY, 6, 25);
      }
    }
  });

  // Buildings are always drawn after mountains/nature, guaranteeing
  // they remain the foreground layer.
  districts.forEach(d => {
    if (d.type === 'city') drawCityDistrict(d);
  });

  // UFO Easter egg.
  const ufoX = ((frame * 0.18) % (width + 180)) - 90;
  const ufoY = height * 0.22 + Math.sin(frame * 0.01) * 10;
  ctx.fillStyle = 'rgba(255,0,255,0.78)';
  ctx.beginPath();
  ctx.ellipse(ufoX, ufoY, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.ellipse(ufoX, ufoY - 3, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tiny cats hidden around the mountain homes.
  districts.forEach((d, di) => {
    if (d.type !== 'nature') return;

    d.cabins.forEach((c, ci) => {
      // About half the homes get a cat.
      if ((di * 5 + ci) % 3 !== 0) return;

      const cx = d.x + c.x + c.scale * 56;
      const cy = height * c.y - c.scale * 58 - 2;

      if (cx < -30 || cx > width + 30) return;

      const s = Math.max(0.7, c.scale * 1.65);
      const catColor = (di + ci) % 3 === 0 ? '#ff66ff' : '#d36cff';

      ctx.fillStyle = catColor;
      ctx.fillRect(cx - 4*s, cy - 6*s, 8*s, 7*s);

      ctx.beginPath();
      ctx.moveTo(cx - 4*s, cy - 5*s);
      ctx.lineTo(cx - 6*s, cy - 11*s);
      ctx.lineTo(cx - 1*s, cy - 8*s);
      ctx.moveTo(cx + 4*s, cy - 5*s);
      ctx.lineTo(cx + 6*s, cy - 11*s);
      ctx.lineTo(cx + 1*s, cy - 8*s);
      ctx.fill();

      ctx.fillStyle = '#ff0';
      ctx.fillRect(cx - 2.5*s, cy - 3*s, 1.5*s, 1.5*s);
      ctx.fillRect(cx + 1*s, cy - 3*s, 1.5*s, 1.5*s);
    });
  });

  // Recycle districts off-screen to the right.
  let rightEdge = Math.max(...districts.map(d => d.x + d.w));
  districts.forEach(d => {
    if (d.x + d.w < -20) {
      d.x = rightEdge + rand(0, 14);
      const fresh = makeDistrict(
        d.x,
        Math.random() < 0.62 ? 'city' : 'nature'
      );

      d.w = fresh.w;
      d.type = fresh.type;
      d.buildings = fresh.buildings;
      d.trees = fresh.trees;
      d.cabins = fresh.cabins;
      d.mountainSeed = fresh.mountainSeed;

      rightEdge = d.x + d.w;
    }
  });

  slowFrame();
}
  
  // 5) contact => floatingPolys (unchanged, maybe slower)
  let floatPolys=[];
  const contactLights = Array.from({length: 18}, (_, i) => ({
    x: Math.random(), y: .12 + Math.random()*.75, r: 1.5 + Math.random()*2.5, drift: .08 + Math.random()*.18, phase: Math.random()*Math.PI*2, kind: i%3
  }));
  for(let i=0;i<18;i++){
    floatPolys.push({x:Math.random()*width,y:Math.random()*height,vx:(Math.random()*2-1)*.28,vy:(Math.random()*2-1)*.20,size:18+Math.random()*28,hue:270+Math.random()*100,rot:Math.random()*6});
  }
  function drawFloatingPolys(){
    const grad=ctx.createLinearGradient(0,0,width,height);
    grad.addColorStop(0,'#05030c');grad.addColorStop(.5,'#0b0820');grad.addColorStop(1,'#03040d');
    ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);

    // Fine constellation grid.
    ctx.strokeStyle='rgba(160,130,255,.045)';ctx.lineWidth=1;
    for(let x=0;x<width;x+=110){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
    for(let y=0;y<height;y+=90){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}

    contactLights.forEach((light,i)=>{
      light.x += Math.cos(frame*.006*light.drift + light.phase)*0.00008;
      if(light.x>1.04)light.x=-.04;if(light.x<-.04)light.x=1.04;
      const x=light.x*width,y=(light.y+Math.sin(frame*.004+light.phase)*.018)*height;
      const glow=ctx.createRadialGradient(x,y,0,x,y,26);glow.addColorStop(0,'rgba(255,224,107,.32)');glow.addColorStop(1,'rgba(255,224,107,0)');
      ctx.fillStyle=glow;ctx.fillRect(x-26,y-26,52,52);
      ctx.fillStyle='#ffe36c';ctx.beginPath();ctx.arc(x,y,light.r,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.translate(x,y);ctx.rotate(frame*.002+light.phase);ctx.strokeStyle='rgba(255,255,255,.24)';ctx.lineWidth=1;
      if(light.kind===0){ctx.strokeRect(-7,-7,14,14);}
      else if(light.kind===1){ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(8,0);ctx.lineTo(0,9);ctx.lineTo(-8,0);ctx.closePath();ctx.stroke();}
      else {ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(4,0);ctx.stroke();}
      ctx.restore();
    });

    floatPolys.forEach(poly=>{
      poly.x+=poly.vx;poly.y+=poly.vy;poly.rot+=.002;
      if(poly.x<-50)poly.x=width+50;if(poly.x>width+50)poly.x=-50;if(poly.y<-50)poly.y=height+50;if(poly.y>height+50)poly.y=-50;
      ctx.save();ctx.translate(poly.x,poly.y);ctx.rotate(poly.rot);
      ctx.strokeStyle=`hsla(${poly.hue},75%,68%,.12)`;ctx.lineWidth=1;
      ctx.beginPath();for(let s=0;s<5;s++){const a=Math.PI*2*s/5;const xx=poly.size*Math.cos(a),yy=poly.size*Math.sin(a);if(!s)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.closePath();ctx.stroke();ctx.restore();
    });
    slowFrame();
  }

  // main animation loop
  function animate(){
    ctx.clearRect(0,0,width,height);

    switch(bgType){
      case 'retrowaveIntro': drawRetrowaveIntro(); break;
      case 'quarterNeonWaves': drawQuarterNeonWaves(); break;
      case 'fastAurora': drawFastAurora(); break;
      case 'storybookSky': drawFastAurora(); break;
      case 'synthCity': drawSynthCity(); break;
      case 'floatingPolys': drawFloatingPolys(); break;
      default:
        // fallback
        ctx.fillStyle='#000';
        ctx.fillRect(0,0,width,height);
    }
    requestAnimationFrame(animate);
  }
  animate();
});

// Hidden star tunnel: dense gold field, smooth motion, simple left/right controls.
const tunnelCanvas = document.getElementById('tunnelCanvas');
if (tunnelCanvas) {
  const ctx = tunnelCanvas.getContext('2d');
  let w = 0, h = 0;
  let speed = 18;
  let targetSpeed = 18;
  let lastTime = performance.now();
  const dots = [];
  const COUNT = 3600;

  function resizeTunnel() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = tunnelCanvas.clientWidth;
    h = tunnelCanvas.clientHeight;
    tunnelCanvas.width = Math.floor(w * dpr);
    tunnelCanvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeTunnel, { passive: true });
  resizeTunnel();

  function seed(dot, far = false) {
    dot.x = (Math.random() - 0.5) * w * 1.15;
    dot.y = (Math.random() - 0.5) * h * 1.15;
    dot.z = far ? w * (0.75 + Math.random() * 0.5) : Math.random() * w;
    dot.size = 0.25 + Math.random() * 1.6;
    dot.phase = Math.random() * Math.PI * 2;
    dot.twinkle = 0.35 + Math.random() * 0.65;
  }

  for (let i = 0; i < COUNT; i++) {
    const dot = {};
    seed(dot);
    dots.push(dot);
  }

  function setTarget(delta) {
    targetSpeed = Math.max(5, Math.min(48, targetSpeed + delta));
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setTarget(-7); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setTarget(7); }
  }, { passive: false });

  document.querySelectorAll('[data-tunnel-control]').forEach(btn => {
    const direction = btn.dataset.tunnelControl === 'slow' ? -7 : 7;
    let pressed = false;
    const activate = () => setTarget(direction);
    const start = (e) => {
      if (e) e.preventDefault();
      if (pressed) return;
      pressed = true;
      activate();
      btn.__tunnelTimer = window.setInterval(activate, 140);
    };
    const release = () => {
      pressed = false;
      if (btn.__tunnelTimer) {
        window.clearInterval(btn.__tunnelTimer);
        btn.__tunnelTimer = null;
      }
    };
    btn.addEventListener('pointerdown', start, {passive:false});
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') start(e);
    });
    btn.addEventListener('keyup', (e) => {
      if (e.key === 'Enter' || e.key === ' ') release();
    });
  });

  function drawTunnel(now) {
    const dt = Math.min(32, Math.max(8, now - lastTime));
    lastTime = now;
    speed += (targetSpeed - speed) * Math.min(1, dt * 0.0045);

    ctx.fillStyle = 'rgba(2,4,8,1)';
    ctx.fillRect(0, 0, w, h);

    const centerX = w * 0.5;
    const centerY = h * 0.5;
    const focal = Math.min(w, h) * 1.32;
    const move = speed * (dt / 16.67);
    const time = now * 0.001;

    for (const dot of dots) {
      dot.z -= move;
      if (dot.z < 1) seed(dot, true);

      const inv = focal / dot.z;
      const px = dot.x * inv + centerX;
      const py = dot.y * inv + centerY;
      if (px < -30 || px > w + 30 || py < -30 || py > h + 30) continue;

      const depth = 1 - dot.z / (w * 1.25);
      const size = dot.size * (0.45 + depth * 2.7);
      const twinkle = 0.72 + Math.sin(time * 1.8 + dot.phase) * 0.18 * dot.twinkle;
      const alpha = Math.min(1, 0.12 + depth * 0.95) * twinkle;

      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.35, size), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(246,207,105,${alpha.toFixed(3)})`;
      ctx.fill();
    }

    requestAnimationFrame(drawTunnel);
  }
  requestAnimationFrame(drawTunnel);
}
