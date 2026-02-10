let bgImg;
let mainImg;
let characterImgs = [];
let foodImg;

let mainChar;
let characters = [];
let foods = [];

let gameStarted = false;
let bounceOffset = 0;
let bounceDir = 1;

let HP = 0;
const BASE_SPEED = 1.2;

// ---------- preload ----------
function preload() {
  bgImg = loadImage('background.png'); // ФОН З МИНУЛОЇ ВЕРСІЇ
  mainImg = loadImage('main.png');

  characterImgs[0] = loadImage('character_1.png');
  characterImgs[1] = loadImage('character_2.png');
  characterImgs[2] = loadImage('character_3.png');
  characterImgs[3] = loadImage('character_4.png');

  foodImg = loadImage('food.png');
}

// ---------- setup ----------
function setup() {
  createCanvas(800, 600);
  imageMode(CENTER);

  mainChar = {
    x: width / 2,
    y: height / 2,
    size: 90
  };

  setupCharacters();
  setupFood();
}

// ---------- helpers ----------
function drawProportional(img, x, y, targetSize) {
  const ratio = img.width / img.height;
  let w, h;

  if (ratio > 1) {
    w = targetSize;
    h = targetSize / ratio;
  } else {
    h = targetSize;
    w = targetSize * ratio;
  }

  image(img, x, y, w, h);
}

function setupCharacters() {
  characters = [];
  const radius = 180;

  for (let i = 0; i < 4; i++) {
    let angle = (TWO_PI / 4) * i;
    let x = width / 2 + cos(angle) * radius;
    let y = height / 2 + sin(angle) * radius;

    // Індивідуальні корекції
    if (i === 1) { // character_2
      x += 40;
      y -= 20;
    }
    if (i === 2) { // character_3
      x -= 15;
    }

    characters.push({
      x,
      y,
      img: characterImgs[i],
      size: 70
    });
  }
}

function setupFood() {
  foods = [];
  for (let i = 0; i < 6; i++) {
    foods.push({
      x: random(width),
      y: random(height),
      size: 40,
      vx: random(-1, 1) * BASE_SPEED,
      vy: random(-1, 1) * BASE_SPEED,
      active: true
    });
  }
}

// ---------- draw ----------
function draw() {
  drawProportional(bgImg, width / 2, height / 2, max(width, height));

  if (!gameStarted) {
    bounceOffset += bounceDir * 0.6;
    if (bounceOffset > 10 || bounceOffset < -10) bounceDir *= -1;
  }

  drawFood();
  drawCharacters();
  drawMainCharacter();

  fill(255);
  textSize(18);
  text(`HP: ${HP}`, 20, 30);
}

// ---------- entities ----------
function drawMainCharacter() {
  let y = mainChar.y + (gameStarted ? 0 : bounceOffset);
  drawProportional(mainImg, mainChar.x, y, mainChar.size);
}

function drawCharacters() {
  characters.forEach(c => {
    drawProportional(c.img, c.x, c.y, c.size);
  });
}

function drawFood() {
  foods.forEach(f => {
    if (!f.active) return;

    f.x += f.vx;
    f.y += f.vy;

    if (f.x < 0 || f.x > width) f.vx *= -1;
    if (f.y < 0 || f.y > height) f.vy *= -1;

    drawProportional(foodImg, f.x, f.y, f.size);

    // Контакт з головним персонажем
    if (
      dist(f.x, f.y, mainChar.x, mainChar.y) <
      (f.size + mainChar.size) / 2
    ) {
      f.active = false;
      HP += 1;
    }
  });
}

// ---------- input ----------
function mousePressed() {
  if (!gameStarted) {
    if (
      dist(mouseX, mouseY, mainChar.x, mainChar.y) <
      mainChar.size / 2
    ) {
      gameStarted = true;
    }
  }
}
