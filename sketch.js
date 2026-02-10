let bgImg;
let mainImg;
let charImgs = [];
let taskImg;
let foodImg;

let mainChar;
let chars = [];
let items = [];

let gameStarted = false;
let spawnedItems = 0;
const MAX_ITEMS = 30;

function preload() {
  bgImg = loadImage("images/background.png");
  mainImg = loadImage("images/main.png");

  for (let i = 1; i <= 5; i++) {
    charImgs.push(loadImage(`images/character_${i}.png`));
  }

  taskImg = loadImage("images/task.png");
  foodImg = loadImage("images/beetroot.png");
}

function setup() {
  createCanvas(800, 600);
  imageMode(CENTER);

  mainChar = new Character(width / 2, height / 2, mainImg, true);

  const radius = 200;
  for (let i = 0; i < 5; i++) {
    let angle = TWO_PI * i / 5;
    let x = width / 2 + cos(angle) * radius;
    let y = height / 2 + sin(angle) * radius;

    // ручні корекції
    if (i === 1) { x += 30; y -= 20; } // character_2
    if (i === 2) { x -= 15; }          // character_3
    if (i === 3) { /* character_4 — без змін */ }

    chars.push(new Character(x, y, charImgs[i]));
  }
}

function draw() {
  background(0);

  // ФОН — як у попередній стабільній версії
  image(bgImg, width / 2, height / 2, width, height);

  if (mainChar.hp <= 0) {
    drawCenterText("GAME OVER");
    return;
  }

  if (spawnedItems >= MAX_ITEMS && mainChar.hp > 0) {
    drawCenterText("YOU WIN 🎉");
    return;
  }

  drawProgressText();

  mainChar.update();
  mainChar.draw();

  chars.forEach(c => c.draw());

  // спавн тасків
  if (
    gameStarted &&
    spawnedItems < MAX_ITEMS &&
    frameCount % 40 === 0
  ) {
    let target = random(chars);
    items.push(new Item(mainChar.pos.x, mainChar.pos.y, target));
    spawnedItems++;
  }

  items.forEach(item => {
    item.update();
    item.draw();

    chars.forEach(c => {
      if (!item.dead && item.hits(c)) {
        c.hp = min(100, c.hp + (item.isFood ? 10 : -10));
        item.dead = true;
      }
    });
  });

  items = items.filter(i => !i.dead);
}

function mousePressed() {
  // старт гри
  if (
    !gameStarted &&
    dist(mouseX, mouseY, mainChar.pos.x, mainChar.pos.y) < 40
  ) {
    gameStarted = true;
    mainChar.jumpHint = false;
    return;
  }

  // клік по таску → їжа
  items.forEach(item => {
    if (item.isHovered()) item.isFood = true;
  });
}

/* ===== UI ===== */

function drawProgressText() {
  fill(255);
  textSize(18);
  textAlign(RIGHT, TOP);
  text(`${spawnedItems}/${MAX_ITEMS}`, width - 10, 10);
}

function drawCenterText(txt) {
  fill(255);
  textSize(36);
  textAlign(CENTER, CENTER);
  text(txt, width / 2, height / 2);
}

/* ===== CLASSES ===== */

class Character {
  constructor(x, y, img, isMain = false) {
    this.basePos = createVector(x, y);
    this.pos = this.basePos.copy();
    this.img = img;
    this.hp = 100;
    this.isMain = isMain;
    this.jumpHint = isMain;
    this.size = isMain ? 90 : 80;
  }

  update() {
    if (this.jumpHint) {
      this.pos.y = this.basePos.y + sin(frameCount * 0.15) * 10;
    }
  }

  draw() {
    const ratio = this.img.width / this.img.height;
    const h = this.size;
    const w = h * ratio;

    image(this.img, this.pos.x, this.pos.y, w, h);

    // HP
    fill(0, 255, 0);
    rect(this.pos.x - 30, this.pos.y - h / 2 - 10, map(this.hp, 0, 100, 0, 60), 5);
  }
}

class Item {
  constructor(x, y, target) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.sub(target.pos, this.pos)
      .setMag(2.2);
    this.target = target;
    this.isFood = false;
    this.dead = false;
    this.size = 36;
  }

  update() {
    this.pos.add(this.vel);
  }

  draw() {
    const img = this.isFood ? foodImg : taskImg;
    const ratio = img.width / img.height;
    image(img, this.pos.x, this.pos.y, this.size * ratio, this.size);
  }

  hits(char) {
    return dist(this.pos.x, this.pos.y, char.pos.x, char.pos.y) < 30;
  }

  isHovered() {
    return dist(mouseX, mouseY, this.pos.x, this.pos.y) < this.size / 2;
  }
}
