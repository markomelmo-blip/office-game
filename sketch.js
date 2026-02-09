// =====================
// GLOBALS
// =====================
let bgImg;
let mainImg;
let characterImgs = [];
let taskImg;
let beetrootImg;

let mainCharacter;
let characters = [];
let tasks = [];

let TOTAL_TASKS = 30;
let spawnedTasks = 0;
let gameOver = false;
let youWin = false;

// =====================
// PRELOAD
// =====================
function preload() {
  bgImg = loadImage("images/background.png");
  mainImg = loadImage("images/main.png");

  for (let i = 1; i <= 5; i++) {
    characterImgs.push(loadImage(`images/character_${i}.png`));
  }

  taskImg = loadImage("images/task.png");
  beetrootImg = loadImage("images/beetroot.png");
}

// =====================
// SETUP
// =====================
function setup() {
  createCanvas(900, 600);

  mainCharacter = new Character(width / 2, height - 120, mainImg, true);

  let startX = 120;
  for (let i = 0; i < 5; i++) {
    characters.push(
      new Character(
        startX + i * 150,
        120,
        characterImgs[i],
        false
      )
    );
  }
}

// =====================
// DRAW
// =====================
function draw() {
  background(0);

  // --- BACKGROUND ---
  push();
  imageMode(CORNER);
  image(bgImg, 0, 0, width, height);
  pop();

  if (gameOver || youWin) {
    drawEndMessage();
    return;
  }

  // --- SPAWN TASKS ---
  if (spawnedTasks < TOTAL_TASKS && frameCount % 40 === 0) {
    let available = characters.filter(c => !c.hasActiveTask);
    if (available.length > 0) {
      let c = random(available);
      tasks.push(new Task(c.pos.x, c.pos.y + 50));
      c.hasActiveTask = true;
      spawnedTasks++;
    }
  }

  // --- TASKS ---
  for (let i = tasks.length - 1; i >= 0; i--) {
    tasks[i].update();
    tasks[i].draw();

    if (tasks[i].hits(mainCharacter)) {
      mainCharacter.hp -= 20;
      tasks[i].owner.hasActiveTask = false;
      tasks.splice(i, 1);
      if (mainCharacter.hp <= 0) {
        gameOver = true;
      }
    } else if (tasks[i].offscreen()) {
      tasks[i].owner.hasActiveTask = false;
      tasks.splice(i, 1);
    }
  }

  // --- CHARACTERS ---
  mainCharacter.update();
  mainCharacter.draw();

  for (let c of characters) {
    c.draw();
  }

  // --- YOU WIN CHECK ---
  if (spawnedTasks === TOTAL_TASKS && tasks.length === 0 && mainCharacter.hp > 0) {
    youWin = true;
  }
}

// =====================
// END MESSAGE
// =====================
function drawEndMessage() {
  push();
  fill(0, 180);
  rectMode(CORNER);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  textSize(48);
  fill(255);

  if (youWin) {
    text("YOU WIN 🎉", width / 2, height / 2);
  } else {
    text("GAME OVER", width / 2, height / 2);
  }
  pop();
}

// =====================
// MOUSE
// =====================
function mousePressed() {
  for (let t of tasks) {
    if (t.isClicked(mouseX, mouseY)) {
      t.isFood = true;
    }
  }
}

// =====================
// CLASSES
// =====================
class Character {
  constructor(x, y, img, isMain) {
    this.pos = createVector(x, y);
    this.img = img;
    this.isMain = isMain;
    this.hp = isMain ? 100 : null;
    this.hasActiveTask = false;
  }

  update() {
    if (this.isMain) {
      this.pos.x = constrain(mouseX, 60, width - 60);
    }
  }

  draw() {
    push();
    imageMode(CENTER);
    image(this.img, this.pos.x, this.pos.y, 120, 120);
    pop();

    if (this.isMain) {
      push();
      rectMode(CORNER);
      fill(255, 0, 0);
      rect(this.pos.x - 60, this.pos.y + 70, 120, 10);
      fill(0, 255, 0);
      rect(
        this.pos.x - 60,
        this.pos.y + 70,
        map(this.hp, 0, 100, 0, 120),
        10
      );
      pop();
    }
  }
}

class Task {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.speed = 4;
    this.size = 44;
    this.isFood = false;

    this.owner = characters.find(
      c => dist(c.pos.x, c.pos.y, x, y) < 10
    );
  }

  update() {
    this.pos.y += this.speed;
  }

  draw() {
    push();
    imageMode(CENTER);
    if (this.isFood) {
      image(beetrootImg, this.pos.x, this.pos.y, this.size, this.size);
    } else {
      image(taskImg, this.pos.x, this.pos.y, this.size, this.size);
    }
    pop();
  }

  hits(character) {
    return (
      abs(this.pos.x - character.pos.x) < 50 &&
      abs(this.pos.y - character.pos.y) < 50
    );
  }

  offscreen() {
    return this.pos.y > height + 50;
  }

  isClicked(mx, my) {
    return dist(mx, my, this.pos.x, this.pos.y) < this.size / 2;
  }
}
