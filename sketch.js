let bg;
let mainImg, taskImg, beetrootImg;
let characterImgs = [];

let mainCharacter;
let characters = [];
let tasks = [];

const TOTAL_TASKS = 30;
let spawnedTasks = 0;

let gameStarted = false;
let gameOver = false;
let youWin = false;

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

  // зсуви для конкретних персонажів
  npcPositions[1].x += 60;  // character_2 → правіше
  npcPositions[1].y -= 40;  // і вище
  npcPositions[2].x -= 30;  // character_3 → трохи лівіше

  // міняємо місцями main і character_4 (index 3)
  let swapIndex = 3;
  let mainOldPos = { x: width / 2, y: height - 120 };

  mainCharacter = new Character(
    npcPositions[swapIndex].x,
    npcPositions[swapIndex].y,
    mainImg,
    true
  );

  for (let i = 0; i < characterImgs.length; i++) {
    let pos = npcPositions[i];
    if (i === swapIndex) pos = mainOldPos;

    let c = new Character(pos.x, pos.y, characterImgs[i], false);
    characters.push(c);
    activeTasksPerTarget.set(c, 0);
  }
}

/* ===== DRAW ===== */

function draw() {
  drawBackground();

  if (gameOver) {
    drawEndScreen();
    return;
  }

  if (!gameStarted) {
    mainCharacter.jumpHint();
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

/* ===== BACKGROUND ===== */

function drawBackground() {
  let canvasRatio = width / height;
  let imgRatio = bg.width / bg.height;

  let w, h;
  if (canvasRatio > imgRatio) {
    w = width;
    h = width / imgRatio;
  } else {
    h = height;
    w = height * imgRatio;
  }

  image(bg, width / 2, height / 2, w, h);
}

/* ===== INPUT ===== */

function mousePressed() {
  if (!gameStarted) {
    if (dist(mouseX, mouseY, mainCharacter.pos.x, mainCharacter.pos.y) < 60) {
      gameStarted = true;
      mainCharacter.stopJump();
    }
    return;
  }

  for (let t of tasks) {
    if (!t.clicked && t.isClicked(mouseX, mouseY)) {
      t.clicked = true;
      break;
    }
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

/* ===== TASK UPDATE ===== */

function updateTasks() {
  for (let i = tasks.length - 1; i >= 0; i--) {
    let t = tasks[i];
    t.update();
    t.draw();

    if (t.hits(t.target)) {
      t.clicked ? t.target.heal() : t.target.takeDamage();
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
  constructor(x, y, img, isMain) {
    this.basePos = createVector(x, y);
    this.pos = this.basePos.copy();
    this.img = img;
    this.isMain = isMain;

    this.maxHP = 3;
    this.hp = 3;
    this.alive = true;

    this.displayWidth = 96;

    this.jumpPhase = 0;
    this.jumping = false;
  }

  update() {
    if (this.jumping) {
      this.jumpPhase += 0.08;
      this.pos.y = this.basePos.y + sin(this.jumpPhase) * 12;
    }
  }

  jumpHint() {
    this.jumping = true;
  }

  stopJump() {
    this.jumping = false;
    this.pos.y = this.basePos.y;
  }

  draw() {
    if (!this.alive) return;
    let ratio = this.img.height / this.img.width;
    image(
      this.img,
      this.pos.x,
      this.pos.y,
      this.displayWidth,
      this.displayWidth * ratio
    );
  }

  drawHP() {
    if (!this.alive) return;
    let w = 50, h = 6;
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
    this.velocity = dir.mult(2.4); // ⬅️ пришвидшено

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
      this.pos.x < -80 || this.pos.x > width + 80 ||
      this.pos.y < -80 || this.pos.y > height + 80
    );
  }
}
