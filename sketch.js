let bgImg;
let mainImg;
let foodImg;
let characters = [];
let foods = [];

let gameStarted = false;
let hp = 0;

const CENTER = { x: 400, y: 400 };
const BASE_RADIUS = 230;
let foodSpeedMultiplier = 1.2;

function preload() {
  bgImg = loadImage("background.png");
  mainImg = loadImage("main.png");
  foodImg = loadImage("food.png");

  characters.push(loadImage("character_2.png"));
  characters.push(loadImage("character_3.png"));
  characters.push(loadImage("character_4.png"));
}

function setup() {
  createCanvas(800, 800);
  imageMode(CENTER);

  setupCharacters();
}

function setupCharacters() {
  let angles = [0, TWO_PI / 3, (2 * TWO_PI) / 3];

  characters = characters.map((img, i) => {
    let r = BASE_RADIUS;
    let x = CENTER.x + cos(angles[i]) * r;
    let y = CENTER.y + sin(angles[i]) * r;

    // Індивідуальні правки позицій
    if (i === 0) { // character_2.png
      x += 40;
      y -= 30;
    }
    if (i === 1) { // character_3.png
      x -= 15;
    }

    return {
      img,
      x,
      y,
      scale: i === 2 ? 1.1 : 1 // character_4 трохи більший
    };
  });
}

function draw() {
  drawBackground();

  drawCharacters();
  drawMain();

  if (!gameStarted) {
    idleBounce();
    return;
  }

  updateFoods();
  drawFoods();
}

function drawBackground() {
  let size = min(bgImg.width, bgImg.height);
  image(
    bgImg,
    width / 2,
    height / 2,
    width,
    height,
    (bgImg.width - size) / 2,
    (bgImg.height - size) / 2,
    size,
    size
  );
}

function drawMain() {
  let h = 120;
  let w = (mainImg.width / mainImg.height) * h;
  image(mainImg, CENTER.x, CENTER.y, w, h);
}

function drawCharacters() {
  characters.forEach(c => {
    let h = 100 * c.scale;
    let w = (c.img.width / c.img.height) * h;
    image(c.img, c.x, c.y, w, h);
  });
}

let bounceOffset = 0;
function idleBounce() {
  bounceOffset = sin(frameCount * 0.08) * 8;
  translate(0, bounceOffset);
}

function mousePressed() {
  if (!gameStarted) {
    let d = dist(mouseX, mouseY, CENTER.x, CENTER.y);
    if (d < 60) {
      gameStarted = true;
      spawnFood();
    }
  }
}

function spawnFood() {
  foods.push({
    x: CENTER.x,
    y: CENTER.y,
    angle: random(TWO_PI),
    speed: random(1.5, 2.2) * foodSpeedMultiplier
  });
}

function updateFoods() {
  foods.forEach(f => {
    f.x += cos(f.angle) * f.speed;
    f.y += sin(f.angle) * f.speed;
  });

  foods = foods.filter(f => {
    let d = dist(f.x, f.y, CENTER.x, CENTER.y);
    if (d < 50) {
      hp += 1;
      return false;
    }
    return true;
  });

  if (frameCount % 90 === 0) spawnFood();
}

function drawFoods() {
  foods.forEach(f => {
    let h = 40;
    let w = (foodImg.width / foodImg.height) * h;
    image(foodImg, f.x, f.y, w, h);
  });
}
