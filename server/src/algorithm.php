<?php
function generateMazeOld(int $rows, int $cols)
{
    // Создание сетки со всеми стенами изначально нетронутыми
    $maze = array();
    for ($i = 0; $i < $rows; $i++) {
        $maze[$i] = array();
        for ($j = 0; $j < $cols; $j++) {
            $maze[$i][$j] = array(
                'top' => true,
                'right' => true,
                'bottom' => true,
                'left' => true,
                'visited' => false
            );
        }
    }

    // Установка стартовой ячейку
    $startRow = floor(rand(0, $rows - 1));
    $startCol = floor(rand(0, $cols - 1));
    $currentCell = array('row' => $startRow, 'col' => $startCol);

    // Алгоритм глубокого поиска для создания лабиринта
    $stack = array($currentCell);
    $maze[$currentCell['row']][$currentCell['col']]['visited'] = true;

    while (count($stack) > 0) {
        $neighbors = array();

        // Поиск непосещённых соседей
        if ($currentCell['row'] > 0 && !$maze[$currentCell['row'] - 1][$currentCell['col']]['visited']) {
            $neighbors[] = array('row' => $currentCell['row'] - 1, 'col' => $currentCell['col']);
        }
        if ($currentCell['row'] < $rows - 1 && !$maze[$currentCell['row'] + 1][$currentCell['col']]['visited']) {
            $neighbors[] = array('row' => $currentCell['row'] + 1, 'col' => $currentCell['col']);
        }
        if ($currentCell['col'] > 0 && !$maze[$currentCell['row']][$currentCell['col'] - 1]['visited']) {
            $neighbors[] = array('row' => $currentCell['row'], 'col' => $currentCell['col'] - 1);
        }
        if ($currentCell['col'] < $cols - 1 && !$maze[$currentCell['row']][$currentCell['col'] + 1]['visited']) {
            $neighbors[] = array('row' => $currentCell['row'], 'col' => $currentCell['col'] + 1);
        }

        if (count($neighbors) > 0) {
            // Выборка случайного соседа
            $randomNeighbor = $neighbors[floor(rand(0, count($neighbors) - 1))];

            // Снятие стенки между текущей ячейкой и выбранным соседом
            if ($randomNeighbor['row'] === $currentCell['row'] - 1) {
                $maze[$currentCell['row']][$currentCell['col']]['top'] = false;
                $maze[$randomNeighbor['row']][$randomNeighbor['col']]['bottom'] = false;
            } else if ($randomNeighbor['row'] === $currentCell['row'] + 1) {
                $maze[$currentCell['row']][$currentCell['col']]['bottom'] = false;
                $maze[$randomNeighbor['row']][$randomNeighbor['col']]['top'] = false;
            } else if ($randomNeighbor['col'] === $currentCell['col'] - 1) {
                $maze[$currentCell['row']][$currentCell['col']]['left'] = false;
                $maze[$randomNeighbor['row']][$randomNeighbor['col']]['right'] = false;
            } else if ($randomNeighbor['col'] === $currentCell['col'] + 1) {
                $maze[$currentCell['row']][$currentCell['col']]['right'] = false;
                $maze[$randomNeighbor['row']][$randomNeighbor['col']]['left'] = false;
            }

            // Отметка избранного соседа как посещённого и отправка его в стек
            $maze[$randomNeighbor['row']][$randomNeighbor['col']]['visited'] = true;
            array_push($stack, $randomNeighbor);
            $currentCell = $randomNeighbor;
        } else {
            // Нет неосвобожденных соседей, текущая ячейка равна последнему (удалённому элементу стека)
            $currentCell = array_pop($stack);
        }
    }

    // Возврат сгенерированный лабиринт и его размеры
    return array(
        'maze' => $maze,
        'rows' => $rows,
        'cols' => $cols
    );
}
function convertMaze($maze)
{
    $maze = $maze['maze'];
    $lenY = count($maze) * 2 + 1;
    $lenX = count($maze[0]) * 2 + 1;
    $newMaze = array();
    for ($i = 0; $i < $lenY; $i++) {
        $newMaze[$i] = array();
        for ($j = 0; $j < $lenX; $j++) {
            $newMaze[$i][$j] = 1;
        }
    }

    for ($y = 0; $y < count($maze); $y++) {
        for ($x = 0; $x < count($maze[$y]); $x++) {
            $cellY = $y * 2 + 1;
            $cellX = $x * 2 + 1;

            $rCell = $maze[$y][$x];

            if ($rCell['top']) {
                $newMaze[$cellY - 1][$cellX - 1] = 2;
                $newMaze[$cellY - 1][$cellX] = 2;
                $newMaze[$cellY - 1][$cellX + 1] = 2;
            }
            if ($rCell['right']) {
                $newMaze[$cellY + 1][$cellX + 1] = 2;
                $newMaze[$cellY][$cellX + 1] = 2;
                $newMaze[$cellY - 1][$cellX + 1] = 2;
            }
            if ($rCell['bottom']) {
                $newMaze[$cellY + 1][$cellX - 1] = 2;
                $newMaze[$cellY + 1][$cellX] = 2;
                $newMaze[$cellY + 1][$cellX + 1] = 2;
            }
            if ($rCell['left']) {
                $newMaze[$cellY + 1][$cellX - 1] = 2;
                $newMaze[$cellY][$cellX - 1] = 2;
                $newMaze[$cellY - 1][$cellX - 1] = 2;
            }
        }
    }

    return $newMaze;
}
