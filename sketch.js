let bg;
let mainImg, taskImg, beetrootImg;
let characterImgs = [];

let mainCharacter;
let characters = [];
let tasks = [];

const TOTAL_TASKS = 30;
let spawnedTasks = 0;

let gameOver = false;
let youWin = false;
let gameStarted = false;

let activeTasksPerTarget = new Map();

/* ===== PRELOAD ===== */
function preload() {
  bg = loadImage('images/background.png');

  mainImg = loadImage('images/main.png');

  for (let i = 1; i <= 5; i++) {
    characterImgs.push(loadImage(`images/character_${i}.png`));
  }

  taskImg = loadImage('images/task.png');
  beetrootImg = loadImage('images/beetroot.png');
}

/* ===== SETUP ===== */
function setup() {
  createCanvas(1200, 800);
  imageMode(CENTER);
  textAlign(CENTER, CENTER);

  let centerX = width / 2;
  let centerY = height / 2 - 80;
  let radius = 240;

  let npcPositions = [];

  for (let i = 0; i < characterImgs.length; i++) {
    let angle = TWO_PI / characterImgs.length * i;
    npcPositions.push({
      x: centerX + cos(angle) * radius,
      y: centerY + sin(angle) * radius
    });
  }

  // ⬅️ додаткові зсуви
  npcPositions[1].x += 70; // character_2 ще правіше
  npcPositions[1].y -= 20;

  npcPositions[2].x -= 50; // character_3 ще лівіше

  // swap main ↔ character_4 (index 3)
  let swapIndex = 3;
  let mainOldPos = { x: width / 2, y: height - 120 };

  mainCharacter = new Character(
    npcPositions[swapIndex].x,
    npcPositions[swapIndex].y,
    mainImg,
    true
  );
  mainCharacter.jumpHint = true;

  for (let i = 0; i < characterImgs.length; i++) {
    let pos = npcPositions[i];
    if (i === swapIndex) pos = mainOldPos;

    let c = new Character(pos.x, pos.y, characterImgs[i], false, i === 3);
    characters.push(c);
    activeTasksPerTarget.set(c, 0);
  }
}

/* ===== DRAW ===== */
function draw() {
  image(bg, width / 2, height / 2, width, height);

  if (gameOver) {
    drawEndScreen();
    return;
  }

  mainCharacter.update();
  mainCharacter.draw();
  mainCharacter.drawHP();

  for (let c of characters) {
    c.draw();
    c.drawHP();
  }

  if (gameStarted) {
    handleSpawning();
    updateTasks();
    drawProgress();
    checkEndConditions();
  }
}

/* ===== SPAWN ===== */
function handleSpawning() {
  if (spawnedTasks >= TOTAL_TASKS) return;
  if (frameCount % 50 !== 0) return;

  let available = characters.filter(
    c => c.alive && activeTasksPerTarget.get(c) === 0
  );

  if (!available.length) return;

  let target = random(available);

  tasks.push(
    new Task(
      mainCharacter.pos.x,
      mainCharacter.pos.y - 60,
      target
    )
  );

  activeTasksPerTarget.set(target, 1);
  spawnedTasks++;
}

/* ===== TASKS ===== */
function updateTasks() {
  for (let i = tasks.length - 1; i >= 0; i--) {
    let t = tasks[i];
    t.update();
    t.draw();

    if (t.hits(t.target)) {
      if (t.clicked) t.target.heal();
      else t.target.takeDamage();

      activeTasksPerTarget.set(t.target, 0);
      tasks.splice(i, 1);
      continue;
    }

    if (t.offscreen()) {
      activeTasksPerTarget.set(t.target, 0);
      tasks.splice(i, 1);
    }
  }
}

/* ===== INPUT ===== */
function mousePressed() {
  if (!gameStarted) {
    if (dist(mouseX, mouseY, mainCharacter.pos.x, mainCharacter.pos.y) < 40) {
      gameStarted = true;
      mainCharacter.jumpHint = false;
      return;
    }
  }

  for (let t of tasks) {
    if (!t.clicked && t.isClicked(mouseX, mouseY)) {
      t.clicked = true;
      break;
    }
  }
}

/* ===== GAME STATE ===== */
function checkEndConditions() {
  if (!mainCharacter.alive) gameOver = true;

  if (
    spawnedTasks === TOTAL_TASKS &&
    tasks.length === 0 &&
    mainCharacter.alive
  ) {
    youWin = true;
    gameOver = true;
  }
}

function drawEndScreen() {
  fill(0, 180);
  rect(0, 0, width, height);

  fill(255);
  textSize(48);
  text(youWin ? 'YOU WIN 🎉' : 'GAME OVER', width / 2, height / 2);
}

function drawProgress() {
  fill(255);
  textSize(18);
  text(`${spawnedTasks}/${TOTAL_TASKS}`, width - 60, 30);
}

/* ===== CLASSES ===== */
class Character {
  constructor(x, y, img, isMain, isChar4 = false) {
    this.pos = createVector(x, y);
    this.img = img;
    this.isMain = isMain;
    this.isChar4 = isChar4;

    this.maxHP = 3;
    this.hp = 3;
    this.alive = true;

    this.baseWidth = 96;
    this.scale = isChar4 ? 1.15 : 1; // ⬅️ character_4 трохи більший
    this.jumpHint = false;
  }

  update() {
    if (this.jumpHint) {
      this.pos.y += sin(frameCount * 0.15) * 2;
    }
  }

  draw() {
    if (!this.alive) return;

    let ratio = this.img.height / this.img.width;
    let w = this.baseWidth * this.scale;
    image(this.img, this.pos.x, this.pos.y, w, w * ratio);
  }

  drawHP() {
    if (!this.alive) return;

    let w = 50;
    let h = 6;
    let x = this.pos.x - w / 2;
    let y = this.pos.y - 70;

    fill(255, 0, 0);
    rect(x, y, w, h);
    fill(0, 255, 0);
    rect(x, y, w * (this.hp / this.maxHP), h);
  }

  takeDamage() {
    this.hp--;
    if (this.hp <= 0) {
      this.alive = false;
      if (!this.isMain) mainCharacter.takeDamage();
    }
  }

  heal() {
    if (this.hp < this.maxHP) this.hp++;
  }
}

class Task {
  constructor(x, y, target) {
    this.pos = createVector(x, y);
    this.target = target;

    let dir = p5.Vector.sub(target.pos, this.pos).normalize();
    this.velocity = dir.mult(2.6); // ⬅️ ще +0.2 швидкості

    this.size = 48;
    this.clicked = false;
  }

  update() {
    this.pos.add(this.velocity);
  }

  draw() {
    let img = this.clicked ? beetrootImg : taskImg;
    let ratio = img.height / img.width;
    image(img, this.pos.x, this.pos.y, this.size, this.size * ratio);
  }

  hits(character) {
    return dist(this.pos.x, this.pos.y, character.pos.x, character.pos.y) < 45;
  }

  isClicked(mx, my) {
    return dist(mx, my, this.pos.x, this.pos.y) < this.size / 2;
  }

  offscreen() {
    return (
      this.pos.x < -60 || this.pos.x > width + 60 ||
      this.pos.y < -60 || this.pos.y > height + 60
    );
  }
}
