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

let activeTasksPerTarget = new Map();

function preload() {
  bg = loadImage('images/background.png');

  mainImg = loadImage('images/main.png');
  taskImg = loadImage('images/task.png');
  beetrootImg = loadImage('images/beetroot.png');

  for (let i = 1; i <= 5; i++) {
    characterImgs.push(loadImage(`images/character_${i}.png`));
  }
}

function setup() {
  createCanvas(1200, 800);
  imageMode(CENTER);
  textAlign(CENTER, CENTER);

  mainCharacter = new Character(width / 2, height - 120, mainImg, true);

  let centerX = width / 2;
  let centerY = height / 2 - 80;
  let radius = 240;

  for (let i = 0; i < characterImgs.length; i++) {
    let angle = TWO_PI / characterImgs.length * i;
    let x = centerX + cos(angle) * radius;
    let y = centerY + sin(angle) * radius;

    let c = new Character(x, y, characterImgs[i], false);
    characters.push(c);
    activeTasksPerTarget.set(c, 0);
  }
}

function draw() {
  image(bg, width / 2, height / 2, width, height);

  if (gameOver) {
    showEndScreen();
    return;
  }

  mainCharacter.draw();
  mainCharacter.drawHP();

  for (let c of characters) {
    c.draw();
    c.drawHP();
  }

  handleSpawning();
  updateTasks();
  drawProgress();

  checkWinCondition();
}

function handleSpawning() {
  if (spawnedTasks >= TOTAL_TASKS) return;
  if (frameCount % 50 !== 0) return;

  let available = characters.filter(
    c => c.alive && activeTasksPerTarget.get(c) === 0
  );

  if (available.length === 0) return;

  let target = random(available);

  let task = new Task(
    mainCharacter.pos.x,
    mainCharacter.pos.y - 60,
    target
  );

  tasks.push(task);
  activeTasksPerTarget.set(target, 1);
  spawnedTasks++;
}

function updateTasks() {
  for (let i = tasks.length - 1; i >= 0; i--) {
    let t = tasks[i];
    t.update();
    t.draw();

    if (!t.clicked && t.hits(t.target)) {
      t.target.takeDamage();
      activeTasksPerTarget.set(t.target, 0);
      tasks.splice(i, 1);
      continue;
    }

    if (t.clicked && t.timer-- <= 0) {
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

function mousePressed() {
  for (let t of tasks) {
    if (!t.clicked && t.isClicked(mouseX, mouseY)) {
      t.clicked = true;
      t.timer = 25;
      t.target.heal();
      break;
    }
  }
}

function checkWinCondition() {
  if (
    spawnedTasks === TOTAL_TASKS &&
    tasks.length === 0 &&
    mainCharacter.alive
  ) {
    youWin = true;
    gameOver = true;
  }

  if (!mainCharacter.alive) {
    gameOver = true;
  }
}

function showEndScreen() {
  fill(0, 180);
  rect(0, 0, width, height);

  fill(255);
  textSize(48);

  if (youWin) {
    text('YOU WIN 🎉', width / 2, height / 2);
  } else {
    text('GAME OVER', width / 2, height / 2);
  }
}

function drawProgress() {
  fill(255);
  textSize(18);
  text(`${spawnedTasks}/${TOTAL_TASKS}`, width - 60, 30);
}

/* ===== CLASSES ===== */

class Character {
  constructor(x, y, img, isMain) {
    this.pos = createVector(x, y);
    this.img = img;
    this.isMain = isMain;

    this.maxHP = 3;
    this.hp = 3;
    this.alive = true;

    this.size = 96;
  }

  draw() {
    if (!this.alive) return;
    image(this.img, this.pos.x, this.pos.y, this.size, this.size);
  }

  drawHP() {
    if (!this.alive) return;
    let w = 50;
    let h = 6;
    let x = this.pos.x - w / 2;
    let y = this.pos.y - this.size / 2 - 12;

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
    this.velocity = dir.mult(2.2);

    this.size = 48;
    this.clicked = false;
    this.timer = 0;
  }

  update() {
    this.pos.add(this.velocity);
  }

  draw() {
    let img = this.clicked ? beetrootImg : taskImg;
    image(img, this.pos.x, this.pos.y, this.size, this.size);
  }

  hits(character) {
    return dist(
      this.pos.x,
      this.pos.y,
      character.pos.x,
      character.pos.y
    ) < 40;
  }

  isClicked(mx, my) {
    return dist(mx, my, this.pos.x, this.pos.y) < this.size / 2;
  }

  offscreen() {
    return (
      this.pos.x < -50 || this.pos.x > width + 50 ||
      this.pos.y < -50 || this.pos.y > height + 50
    );
  }
}
