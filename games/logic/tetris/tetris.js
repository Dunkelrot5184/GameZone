function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 32;
const tetrominoSequence = [];
let tetromino = null;
const playfield = [];

for (let row = -2; row < 20; row++) {
  playfield[row] = [];
  for (let col = 0; col < 10; col++) {
    playfield[row][col] = 0;
  }
}

const tetrominos = {
  'I': [
    [0,0,0,0],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0],
  ],
  'J': [
    [1,0,0],
    [1,1,1],
    [0,0,0],
  ],
  'L': [
    [0,0,1],
    [1,1,1],
    [0,0,0],
  ],
  'O': [
    [1,1],
    [1,1],
  ],
  'S': [
    [0,1,1],
    [1,1,0],
    [0,0,0],
  ],
  'Z': [
    [1,1,0],
    [0,1,1],
    [0,0,0],
  ],
  'T': [
    [0,1,0],
    [1,1,1],
    [0,0,0],
  ],
};

const colors = {
  'I': 'cyan',
  'J': 'blue',
  'L': 'orange',
  'O': 'yellow',
  'S': 'green',
  'Z': 'red',
  'T': 'purple',
};

let score = 0;
let level = 1;
let isPaused = false;
let speed = 35;
let count = 0;
let rAF = null;
let gameOver = false;

document.getElementById('score').innerText = 'Score: ' + score;
document.getElementById('level').innerText = 'Level: ' + level;

function generateSequence() {
  const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  while (sequence.length) {
    const randIndex = getRandomInt(0, sequence.length - 1);
    const name = sequence.splice(randIndex, 1)[0];
    tetrominoSequence.push(name);
  }
}

function getNextTetromino() {
  if (tetrominoSequence.length === 0) {
    generateSequence();
  }
  const name = tetrominoSequence.shift();
  const matrix = tetrominos[name];
  const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
  const row = name === 'I' ? -1 : -2;
  return {
    name: name,
    matrix: matrix,
    row: row,
    col: col,
  };
}

function rotate(matrix) {
  const N = matrix.length - 1;
  const result = matrix.map((row, i) =>
    row.map((val, j) => matrix[N - j][i])
  );
  return result;
}

function isValidMove(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col]) {
        const newRow = cellRow + row;
        const newCol = cellCol + col;
        if (newCol < 0 || newCol >= playfield[0].length || newRow >= playfield.length || playfield[newRow][newCol]) {
          return false;
        }
      }
    }
  }
  return true;
}

function placeTetromino() {
    for (let row = 0; row < tetromino.matrix.length; row++) {
        for (let col = 0; col < tetromino.matrix[row].length; col++) {
            if (tetromino.matrix[row][col]) {
                if (playfield[tetromino.row + row] === undefined || playfield[tetromino.row + row][tetromino.col + col] !== 0) {
                    return showGameOver(); // Game over condition or handling
                }
                playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
            }
        }
    }
    // Proceed with clearing lines and setting up the next tetromino
    clearLines();
    tetromino = getNextTetromino();
}


function clearLines() {
    let linesCleared = 0;
    for (let row = playfield.length - 1; row >= 0; row--) {
        if (playfield[row].every(cell => cell !== 0)) {
            linesCleared++;
            for (let r = row; r > 0; r--) {
                playfield[r] = playfield[r - 1].slice();
            }
            row++; // Adjust because we just removed a line
        }
    }
    if (linesCleared > 0) {
        updateScore(linesCleared);
    }
}

function updateScore(linesCleared) {
    const scoring = [100, 300, 500, 800]; // Example scoring for 1, 2, 3, 4 lines cleared
    score += scoring[linesCleared - 1] || 0;
    document.getElementById('score').innerText = 'Score: ' + score;

    // Optionally update level based on score or lines cleared
    updateLevel();
}

function updateLevel() {
    // Example: Increase level for every 1000 points scored
    const newLevel = Math.floor(score / 1000) + 1;
    if (newLevel > level) {
        level = newLevel;
        document.getElementById('level').innerText = 'Level: ' + level;
    }
}

function showGameOver() {
  cancelAnimationFrame(rAF);
  gameOver = true;
  context.fillStyle = 'black';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
  context.globalAlpha = 1;
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
}

function togglePause() {
  if (!gameOver) {
    isPaused = !isPaused;
    if (!isPaused) {
      loop();
    } else {
      cancelAnimationFrame(rAF);
    }
  }
}

document.getElementById('reset-button').addEventListener('click', resetGame);

function resetGame() {
  // Clear the playfield
  for (let row = -2; row < 20; row++) {
    playfield[row] = [];
    for (let col = 0; col < 10; col++) {
      playfield[row][col] = 0;
    }
  }

  // Reset score and level
  score = 0;
  level = 1;
  document.getElementById('score').innerText = 'Score: ' + score;
  document.getElementById('level').innerText = 'Level: ' + level;

  // Restart the game loop
  if (gameOver) {
    gameOver = false; // Reset gameOver flag
  }
  if (!isPaused) {
    cancelAnimationFrame(rAF); // Stop the current game loop
    loop(); // Start a new game loop
  }

  // Reset other game state variables as necessary
  // This might include resetting the speed, count, and generating a new tetromino
  speed = 35;
  count = 0;
  tetromino = getNextTetromino();
}


document.addEventListener('keydown', function(e) {
  if (e.keyCode === 80) { // 'P' for pause
    togglePause();
  } else if (!isPaused && !gameOver) {
    if (e.which === 37 || e.which === 39) {
      const col = e.which === 37 ? tetromino.col - 1 : tetromino.col + 1;
      if (isValidMove(tetromino.matrix, tetromino.row, col)) {
        tetromino.col = col;
      }
    } else if (e.which === 38) {
      const matrix = rotate(tetromino.matrix);
      if (isValidMove(matrix, tetromino.row, tetromino.col)) {
        tetromino.matrix = matrix;
      }
    } else if (e.which === 40) { // Down arrow key
        moveTetrominoDown();
    } else if (e.which === 32) { // Space bar for instant drop
        instantDrop();
    } else if (e.which === 82) { // 'R' for Reset
        resetGame();
    }
  }
});

function shakeCanvas(duration = 500, magnitude = 5) {
    const canvas = document.getElementById('game');
    const startTime = Date.now();

    function shake() {
        const elapsedTime = Date.now() - startTime;
        const remaining = duration - elapsedTime;
        if (remaining > 0) {
            const randomAngle = Math.random() * Math.PI * 2;
            const x = Math.cos(randomAngle) * magnitude;
            const y = Math.sin(randomAngle) * magnitude;

            canvas.style.transform = `translate(${x}px, ${y}px)`;

            requestAnimationFrame(shake);
        } else {
            canvas.style.transform = 'translate(0, 0)'; // Reset position
        }
    }

    shake();
}

function instantDrop() {
  while (isValidMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) {
    tetromino.row++;
  }
  placeTetromino();
  shakeCanvas();
}


function moveTetrominoDown() {
    tetromino.row++;
    if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
        tetromino.row--; // Move back up
        placeTetromino(); // Place tetromino since it can't move down further
    }
}

function loop() {
  if (!isPaused) {
    rAF = requestAnimationFrame(loop);
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        if (playfield[row][col]) {
          const name = playfield[row][col];
          context.fillStyle = colors[name];
          context.fillRect(col * grid, row * grid, grid-1, grid-1);
        }
      }
    }

    if (tetromino) {
      if (++count > speed) {
        tetromino.row++;
        count = 0;
        if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
          tetromino.row--;
          placeTetromino();
        }
      }

      context.fillStyle = colors[tetromino.name];
      for (let row = 0; row < tetromino.matrix.length; row++) {
        for (let col = 0; col < tetromino.matrix[row].length; col++) {
          if (tetromino.matrix[row][col]) {
            context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid - 1, grid - 1);
          }
        }
      }
    }
  }
}

tetromino = getNextTetromino(); // Initialize the first tetromino
loop(); // Start the game loop
