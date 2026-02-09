let mainCharImg;
let charImgs = [];
let itemImg;
let foodImg;
let bgImg;

let mainChar;
let chars = [];
let items = [];

let gameStarted = false;

const TOTAL_CHARS = 5;
const ITEMS_PER_CHAR = 6;
const TOTAL_ITEMS = TOTAL_CHARS * ITEMS_PER_CHAR;

let spawnedItems = 0;
let deadChars = 0;
let spawnTimer = 0;
const SPAWN_INTERVAL = 30;

function preload() {
  bgImg = loadImage('images/background.png');
  mainCharImg = loadImage('images/main.png');
  for (let i = 1; i <= TOTAL_CHARS; i++) {
    charImgs.push(loadImage(`images/character_${i}.png`));
  }
  itemImg = loadImage('images/task.png');
  foodImg = loadImage('images/beetroot.png');
}

function setup() {
  createCanvas(800, 600);
  mainChar = new Character(width / 2, height / 2, true, mainCharImg);

  for (let i = 0; i < TOTAL_CHARS; i++) {
    let angle = TWO_PI * i / TOTAL_CHARS;
    chars.push(new Character(
      width / 2 + cos(angle) * 200,
      height / 2 + sin(angle) * 200,
      false,
      charImgs[i]
    ));
  }
}

function draw() {
  image(bgImg, 0, 0, width, height);
  drawProgressText();

  if (mainChar.hp <= 0 || deadChars >= 3) {
    drawCenterText("GAME OVER");
    noLoop();
    return;
  }

  mainChar.update();
  mainChar.draw();
  chars.forEach(c => c.draw());

  if (gameStarted && spawnedItems < TOTAL_ITEMS) {
    spawnTimer++;
    if (spawnTimer >= SPAWN_INTERVAL) {
      spawnTimer = 0;
      spawnItem();
    }
  }

  items.forEach(item => {
    item.update();
    item.draw();

    if (!item.dead && item.hits(item.target)) {
      if (item.isFood) {
        item.target.healHit();
      } else {
        item.target.takeHit();
      }
      item.dead = true;
    }
  });

  items = items.filter(i => !i.dead);

  if (spawnedItems >= TOTAL_ITEMS && mainChar.hp > 0 && items.length === 0) {
    drawCenterText("YOU WIN 🎉");
    noLoop();
    return;
  }
}

function mousePressed() {
  if (!gameStarted && dist(mouseX, mouseY, mainChar.pos.x, mainChar.pos.y) < 30) {
    gameStarted = true;
    mainChar.jumpHint = false;
    return;
  }

  items.forEach(item => {
    if (item.isHovered()) item.isFood = true;
  });
}

function spawnItem() {
  let busyChars = items.map(i => i.target);
  let possibleTargets = chars.filter(c => !busyChars.includes(c));
  let target = possibleTargets.length > 0 ? random(possibleTargets) : random(chars);

  items.push(new Item(mainChar.pos.x, mainChar.pos.y, target));
  spawnedItems++;
}

function drawProgressText() {
  let remaining = TOTAL_ITEMS - spawnedItems;
  textSize(20);
  textAlign(RIGHT, TOP);
  stroke(0);
  strokeWeight(2);
  fill(255);
  text(`${remaining}/${TOTAL_ITEMS}`, width - 10, 10);
}

function drawCenterText(txt) {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  text(txt, width / 2, height / 2);
}

class Character {
  constructor(x, y, isMain = false, img) {
    this.basePos = createVector(x, y);
    this.pos = this.basePos.copy();
    this.hp = 100;
    this.isMain = isMain;
    this.img = img;
    this.jumpHint = isMain;
    this.jumpOffset = 0;
    this.hitCounter = 0;
    this.dead = false;
  }

  update() {
    if (this.jumpHint) {
      this.jumpOffset = sin(frameCount * 0.15) * 10;
      this.pos.y = this.basePos.y + this.jumpOffset;
    }
  }

  draw() {
    if (this.dead) return;
    imageMode(CENTER);
    image(this.img, this.pos.x, this.pos.y, 60, 60);
    fill(0, 255, 0);
    rect(this.pos.x - 30, this.pos.y - 45, map(this.hp, 0, 100, 0, 60), 5);
  }

  takeHit() {
    if (this.dead) return;
    this.hitCounter++;
    this.hp = max(0, 100 - this.hitCounter * 33.33);
    if (this.hitCounter >= 3) {
      this.dead = true;
      deadChars++;
      mainChar.hp = max(0, mainChar.hp - 33.33);
    }
  }

  healHit() {
    if (this.dead) return;
    this.hitCounter = max(0, this.hitCounter - 1);
    this.hp = min(100, 100 - this.hitCounter * 33.33);
  }
}

class Item {
  constructor(x, y, target) {
    this.pos = createVector(x, y);
    this.target = target;
    this.vel = p5.Vector.sub(target.pos, this.pos).setMag(2.2);
    this.dead = false;
    this.isFood = false;
  }

  update() {
    this.pos.add(this.vel);
  }

  draw() {
    imageMode(CENTER);
    if (this.isFood) {
      image(foodImg, this.pos.x, this.pos.y, 22, 22);
    } else {
      image(itemImg, this.pos.x, this.pos.y, 22, 22);
    }
  }

  hits(char) {
    return !char.dead && dist(this.pos.x, this.pos.y, char.pos.x, char.pos.y) < 30;
  }

  isHovered() {
    return dist(mouseX, mouseY, this.pos.x, this.pos.y) < 12;
  }
}
