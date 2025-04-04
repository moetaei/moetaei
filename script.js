let frame = 0;
let slowFactor = 0.1;  // to slow all animations ~10x

const navLinks = document.querySelectorAll('.nav a');
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
  function drawFastAurora(){
    ctx.fillStyle='#000';
    ctx.fillRect(0,0,width,height);

    let grad=ctx.createRadialGradient(width/2,height/2,10, width/2,height/2,width*0.8);
    let colorShift=frame*0.015; // slower
    grad.addColorStop(0, `hsla(${200+colorShift},100%,50%,0.4)`);
    grad.addColorStop(1, `hsla(${280+colorShift},100%,50%,0.2)`);
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,width,height);

    auroraParticles.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=width;if(p.x>width)p.x=0;
      if(p.y<0)p.y=height;if(p.y>height)p.y=0;
      ctx.beginPath();
      ctx.arc(p.x,p.y,2,0,Math.PI*2);
      ctx.fillStyle='#fff';
      ctx.fill();
    });
    slowFrame();
  }

// === Initialization Code ===
// This code sets up the buildings and their windows.
let buildingCount = 12;
let buildings = [];

for (let i = 0; i < buildingCount; i++) {
  let w = 600;
  let h = 800 + Math.random() * 100;
  let x = i * (w + 10); // consistent rooftop spacing

  // Create an array of windows for this building
  let rowSpacing = 40;
  let colSpacing = 21;
  let windowW = 15;
  let windowH = 20;
  let rows = Math.floor(h / rowSpacing);
  let cols = Math.floor(w / colSpacing);

  let windows = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let xOffset = 10 + c * colSpacing;
      let yOffset = 16 + r * rowSpacing;

      // Random initial color (50% white, 50% black)
      let color = (Math.random() < 0.9) ? '#fff' : '#000';
      // Set a smaller initial blink timer (60 to 240 frames ~1-4 seconds at 60fps)
      let blinkTimer = 60 + Math.floor(Math.random() * 180);

      windows.push({
        xOffset,
        yOffset,
        color,
        blinkTimer,
        isOn: true
      });
    }
  }

  buildings.push({ x, w, h, windows });
}

// === Drawing/Animation Code ===
function drawSynthCity() {
  // Gradient sky background
  let skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, 'rgba(255,0,255,0.3)');
  skyGrad.addColorStop(1, 'rgba(0,0,50,0.7)');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  buildings.forEach(b => {
    b.x -= 0.5;

    // Wrap around when fully off screen
    if (b.x + b.w < 0) {
      b.x = getRightmostBuildingX() + b.w + 10;
    }

    // Draw building base
    ctx.fillStyle = '#000';
    ctx.fillRect(b.x, height - b.h, b.w, b.h);

    // Process each window in the building
    b.windows.forEach(win => {
      win.blinkTimer--;  // Decrement timer each frame

      if (win.blinkTimer <= 0) {
        // Randomly pick a new color from the palette including white, yellow, black, and gray.
        let palette = ['#fff', '#ff0', '#000', '#999'];
        win.color = palette[Math.floor(Math.random() * palette.length)];
        // Reset the blink timer to a longer duration (1200 to 2400 frames: 20-40 seconds at 60fps)
        win.blinkTimer = 1500 + Math.floor(Math.random() * 1200);
      }

      if (win.isOn) {
        let wx = b.x + win.xOffset;
        let wy = height - b.h + win.yOffset;
        ctx.fillStyle = win.color;
        ctx.fillRect(wx, wy, 15, 20);
      }
    });

    // Draw building outline
    ctx.strokeStyle = 'magenta';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, height - b.h, b.w, b.h);
  });

  slowFrame(); // Your animation/frame update function
}

function getRightmostBuildingX() {
  return Math.max(...buildings.map(b => b.x));
}



  
  // 5) contact => floatingPolys (unchanged, maybe slower)
  let floatPolys=[];
  for(let i=0;i<30;i++){
    floatPolys.push({
      x: Math.random()*800,
      y: Math.random()*600,
      vx:(Math.random()*2-1)*0.5,
      vy:(Math.random()*2-1)*0.5,
      size:20+Math.random()*30,
      hue:Math.random()*360
    });
  }
  function drawFloatingPolys(){
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.fillRect(0,0,width,height);

    floatPolys.forEach(poly=>{
      poly.x+=poly.vx; poly.y+=poly.vy;
      if(poly.x<-50) poly.x=width+50;
      if(poly.x>width+50) poly.x=-50;
      if(poly.y<-50) poly.y=height+50;
      if(poly.y>height+50) poly.y=-50;
      poly.hue=(poly.hue+0.1)%360;

      ctx.save();
      ctx.translate(poly.x, poly.y);
      ctx.beginPath();
      for(let s=0;s<6;s++){
        let angle=(Math.PI*2)*(s/6);
        let xx=poly.size*Math.cos(angle);
        let yy=poly.size*Math.sin(angle);
        if(s===0) ctx.moveTo(xx,yy);
        else ctx.lineTo(xx,yy);
      }
      ctx.closePath();
      ctx.strokeStyle=`hsla(${poly.hue},80%,60%,0.7)`;
      ctx.lineWidth=2;
      ctx.stroke();
      ctx.restore();
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

// EASTER EGG => star tunnel => faster with button holds
const tunnelCanvas = document.getElementById('tunnelCanvas');
if (tunnelCanvas) {
  const ctx = tunnelCanvas.getContext('2d');
  let w, h, speed = 1.5; // starting speed
  function resize() {
    w = tunnelCanvas.width = tunnelCanvas.offsetWidth;
    h = tunnelCanvas.height = tunnelCanvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  let dots = [];
  for (let i = 0; i < 4000; i++) {
    dots.push({
      x: (Math.random() - 0.5) * w,
      y: (Math.random() - 0.5) * h,
      z: Math.random() * w
    });
  }

  // Flags to track button holding
  let increaseSpeed = false;
  let decreaseSpeed = false;

  tunnelCanvas.addEventListener('mousedown', (e) => {
    // Left button (button 0) speeds up (max out fast)
    if (e.button === 0) {
      increaseSpeed = true;
    }
    // Right button (button 2) slows down (max out slow)
    else if (e.button === 2) {
      decreaseSpeed = true;
    }
  });
  tunnelCanvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      increaseSpeed = false;
      // Optionally reset speed when released:
      // speed = 1.5;
    } else if (e.button === 2) {
      decreaseSpeed = false;
      // Optionally reset speed when released:
      // speed = 1.5;
    }
  });
  tunnelCanvas.addEventListener('mouseleave', () => {
    increaseSpeed = false;
    decreaseSpeed = false;
  });
  // Prevent right-click context menu so the right button works as intended.
  tunnelCanvas.addEventListener('contextmenu', e => {
    e.preventDefault();
  });

  function tunnelDraw() {
    // Use a high acceleration so the tunnel quickly maxes out:
    const acceleration = 0.1; // change per frame when button held
    const maxSpeed = 100;       // maximum speed when accelerating
    const minSpeed = 0.5;      // minimum speed

    if (increaseSpeed) {
      speed += acceleration;
      if (speed > maxSpeed) speed = maxSpeed;
    }
    if (decreaseSpeed) {
      speed -= acceleration;
      if (speed < minSpeed) speed = minSpeed;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, w, h);
    dots.forEach(dot => {
      dot.z -= speed;
      if (dot.z < 1) {
        dot.z = w;
        dot.x = (Math.random() - 0.5) * w;
        dot.y = (Math.random() - 0.5) * h;
      }
      let px = (dot.x / dot.z) * 8000 + w / 2;
      let py = (dot.y / dot.z) * 8000 + h / 2;
      let size = (1 - dot.z / w) * 20;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fillStyle = '#f0f';
      ctx.fill();
    });
    requestAnimationFrame(tunnelDraw);
  }
  tunnelDraw();
}