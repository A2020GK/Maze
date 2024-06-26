function generateMazeOld(rows, cols) {
    // Создание сетки со всеми стенами изначально нетронутыми
    const maze = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
            top: true,
            right: true,
            bottom: true,
            left: true,
            visited: false,
        }))
    );

    // Установка стартовой ячейки
    const startRow = Math.floor(Math.random() * rows);
    const startCol = Math.floor(Math.random() * cols);
    let currentCell = { row: startRow, col: startCol };

    // Алгоритм создания лабиринта
    const stack = [currentCell];
    maze[currentCell.row][currentCell.col].visited = true;

    while (stack.length > 0) {
        const neighbors = [];

        // Поиск непосещённых соседей
        if (currentCell.row > 0 && !maze[currentCell.row - 1][currentCell.col].visited)
            neighbors.push({ row: currentCell.row - 1, col: currentCell.col });
        if (currentCell.row < rows - 1 && !maze[currentCell.row + 1][currentCell.col].visited)
            neighbors.push({ row: currentCell.row + 1, col: currentCell.col });
        if (currentCell.col > 0 && !maze[currentCell.row][currentCell.col - 1].visited)
            neighbors.push({ row: currentCell.row, col: currentCell.col - 1 });
        if (currentCell.col < cols - 1 && !maze[currentCell.row][currentCell.col + 1].visited)
            neighbors.push({ row: currentCell.row, col: currentCell.col + 1 });

        if (neighbors.length > 0) {
            // Выборка случайного соседа
            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];

            // Снятие стенки между текущей ячейкой и выбранным соседом
            if (randomNeighbor.row === currentCell.row - 1) {
                maze[currentCell.row][currentCell.col].top = false;
                maze[randomNeighbor.row][randomNeighbor.col].bottom = false;
            } else if (randomNeighbor.row === currentCell.row + 1) {
                maze[currentCell.row][currentCell.col].bottom = false;
                maze[randomNeighbor.row][randomNeighbor.col].top = false;
            } else if (randomNeighbor.col === currentCell.col - 1) {
                maze[currentCell.row][currentCell.col].left = false;
                maze[randomNeighbor.row][randomNeighbor.col].right = false;
            } else if (randomNeighbor.col === currentCell.col + 1) {
                maze[currentCell.row][currentCell.col].right = false;
                maze[randomNeighbor.row][randomNeighbor.col].left = false;
            }

            // Отметка избранного соседа как посещённого и отправка его в стек
            maze[randomNeighbor.row][randomNeighbor.col].visited = true;
            stack.push(randomNeighbor);
            currentCell = randomNeighbor;
        } else {
            // Нет неосвобожденных соседей, текущая ячейка равна последнему (удалённому элементу стека)
            currentCell = stack.pop();
        }
    }

    // Возврат сгенерированный лабиринт и его размеры
    return {
        maze: maze,
        rows: rows,
        cols: cols,
    };
}

function convertMaze(maze) {
    maze = maze.maze
    let lenY = maze.length * 2 + 1;
    let lenX = maze[0].length * 2 + 1;
    let newMaze = Array.from({ length: lenY }, () => Array.from({ length: lenX }, () => (1)));

    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            let cellY = y * 2 + 1;
            let cellX = x * 2 + 1;

            let rCell = maze[y][x];

            if (rCell.top) {
                newMaze[cellY - 1][cellX - 1] = 2;
                newMaze[cellY - 1][cellX] = 2;
                newMaze[cellY - 1][cellX + 1] = 2;
            }
            if (rCell.right) {
                newMaze[cellY + 1][cellX + 1] = 2;
                newMaze[cellY][cellX + 1] = 2;
                newMaze[cellY - 1][cellX + 1] = 2;
            }
            if (rCell.bottom) {
                newMaze[cellY + 1][cellX - 1] = 2;
                newMaze[cellY + 1][cellX] = 2;
                newMaze[cellY + 1][cellX + 1] = 2;
            }
            if (rCell.left) {
                newMaze[cellY + 1][cellX - 1] = 2;
                newMaze[cellY][cellX - 1] = 2;
                newMaze[cellY - 1][cellX - 1] = 2;
            }
        }
    }

    return newMaze;
}

function solveMaze(maze, xStart, yStart, xEnd, yEnd) {

    let locMaze = [];

    for (let y = 0; y < maze.length; y++) {
        locMaze[y] = [];
        for (let x = 0; x < maze[0].length; x++) {
            let wall = maze[y][x];
            locMaze[y][x] = {
                x: x,
                y: y,
                isWall: wall == 2 ? true : false,
                marker: null
            }
        }
    }

    let currentCell = locMaze[yStart][xStart];

    function recursionMark(startCell) {
        let pointMarker = 0;
        let queue = [startCell];
        startCell.marker = pointMarker;

        while (queue.length > 0) {
            let currentCell = queue.shift();
            pointMarker++;

            let neighbors = [];
            if ((currentCell.x - 1) >= 0) if (!locMaze[currentCell.y][currentCell.x - 1].isWall && locMaze[currentCell.y][currentCell.x - 1].marker === null)
                neighbors.push(locMaze[currentCell.y][currentCell.x - 1]);
            if ((currentCell.x + 1) < locMaze[0].length) if (!locMaze[currentCell.y][currentCell.x + 1].isWall && locMaze[currentCell.y][currentCell.x + 1].marker === null)
                neighbors.push(locMaze[currentCell.y][currentCell.x + 1]);
            if (currentCell.y - 1 >= 0) if (!locMaze[currentCell.y - 1][currentCell.x].isWall && locMaze[currentCell.y - 1][currentCell.x].marker === null)
                neighbors.push(locMaze[currentCell.y - 1][currentCell.x]);
            if (currentCell.y + 1 < locMaze.length) if (!locMaze[currentCell.y + 1][currentCell.x].isWall && locMaze[currentCell.y + 1][currentCell.x].marker === null)
                neighbors.push(locMaze[currentCell.y + 1][currentCell.x]);

            for (let neighbor of neighbors) {
                neighbor.marker = pointMarker;
                queue.push(neighbor);
            }

            if (currentCell.x === xEnd && currentCell.y === yEnd) {
                break; // target reached
            }
        }

        return locMaze;
    }

    recursionMark(currentCell);

    currentCell = locMaze[yEnd][xEnd];

    let path = [];

    function backtrace(endCell) {
        let currentCell = endCell;
        let path = [currentCell];

        while (currentCell.marker !== 0) {
            let neighbors = [];
            if ((currentCell.x - 1) >= 0) if (!locMaze[currentCell.y][currentCell.x - 1].isWall && locMaze[currentCell.y][currentCell.x - 1].marker < currentCell.marker)
                neighbors.push(locMaze[currentCell.y][currentCell.x - 1]);
            if ((currentCell.x + 1) < locMaze[0].length) if (!locMaze[currentCell.y][currentCell.x + 1].isWall && locMaze[currentCell.y][currentCell.x + 1].marker < currentCell.marker)
                neighbors.push(locMaze[currentCell.y][currentCell.x + 1]);
            if (currentCell.y - 1 >= 0) if (!locMaze[currentCell.y - 1][currentCell.x].isWall && locMaze[currentCell.y - 1][currentCell.x].marker < currentCell.marker)
                neighbors.push(locMaze[currentCell.y - 1][currentCell.x]);
            if (currentCell.y + 1 < locMaze.length) if (!locMaze[currentCell.y + 1][currentCell.x].isWall && locMaze[currentCell.y + 1][currentCell.x].marker < currentCell.marker)
                neighbors.push(locMaze[currentCell.y + 1][currentCell.x]);

            if (neighbors.length > 0) {
                currentCell = neighbors[0];
                path.unshift(currentCell);
            } else {
                break;
            }
        }

        return path;
    }
    path=backtrace(currentCell);

    return path;

}
async function sleep(secs) {
    await new Promise((resolve,reject)=>setTimeout(resolve,secs*1000));
}
