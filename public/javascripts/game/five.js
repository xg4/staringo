$(function () {
    var over = false;
    var me = true;
    var chressBoard = []; //棋盘
    for (var i = 0; i < 15; i++) {
        chressBoard[i] = [];
        for (var j = 0; j < 15; j++) {
            chressBoard[i][j] = 0;
        }
    }

//赢法的统计数组
    var myWin = [];
    var computerWin = [];


//赢法数组
    var wins = [];
    for (var i = 0; i < 15; i++) {
        wins[i] = [];
        for (var j = 0; j < 15; j++) {
            wins[i][j] = [];
        }
    }
    var count = 0; //赢法总数
//横线赢法
    for (var i = 0; i < 15; i++) {
        for (var j = 0; j < 11; j++) {
            for (var k = 0; k < 5; k++) {
                wins[i][j + k][count] = true;
            }
            count++;
        }
    }

//竖线赢法
    for (var i = 0; i < 15; i++) {
        for (var j = 0; j < 11; j++) {
            for (var k = 0; k < 5; k++) {
                wins[j + k][i][count] = true;
            }
            count++;
        }
    }

//正斜线赢法
    for (var i = 0; i < 11; i++) {
        for (var j = 0; j < 11; j++) {
            for (var k = 0; k < 5; k++) {
                wins[i + k][j + k][count] = true;
            }
            count++;
        }
    }

//反斜线赢法
    for (var i = 0; i < 11; i++) {
        for (var j = 14; j > 3; j--) {
            for (var k = 0; k < 5; k++) {
                wins[i + k][j - k][count] = true;
            }
            count++;
        }
    }

    for (var i = 0; i < count; i++) {
        myWin[i] = 0;
        computerWin[i] = 0;
    }


    var c = document.querySelector('#game')
    var ctx = c.getContext('2d')
    var context = ctx

    c.onclick = function (e) {
        if (over) { // 游戏结束
            return;
        }
        if (!me) {
            return;
        }
        var x = e.offsetX;
        var y = e.offsetY;
        var i = Math.floor(x / 30);
        var j = Math.floor(y / 30);
        if (chressBoard[i][j] == 0) {
            step(i, j, 'me');
            chressBoard[i][j] = 1; //我，已占位置

            for (var k = 0; k < count; k++) { // 将可能赢的情况都加1
                if (wins[i][j][k]) {
                    myWin[k]++;

                    computerWin[k] = 6; //这个位置对方不可能赢了
                    if (myWin[k] == 5) {
                        alert('恭喜，你赢了！');
                        over = true;
                    }
                }
            }
            if (!over) {
                me = !me;
                AI();
            }
        }
    }


    var AI = function () {
        var myScore = [];
        var computerScore = [];
        var max = 0;
        var u = 0,
            v = 0;
        for (var i = 0; i < 15; i++) {
            myScore[i] = [];
            computerScore[i] = [];
            for (var j = 0; j < 15; j++) {
                myScore[i][j] = 0;
                computerScore[i][j] = 0;
            }
        }
        for (var i = 0; i < 15; i++) {
            for (var j = 0; j < 15; j++) {
                if (chressBoard[i][j] == 0) {
                    for (var k = 0; k < count; k++) {
                        if (wins[i][j][k]) {
                            if (myWin[k] == 1) {
                                myScore[i][j] += 200;
                            } else if (myWin[k] == 2) {
                                myScore[i][j] += 400;
                            } else if (myWin[k] == 3) {
                                myScore[i][j] += 2000;
                            } else if (myWin[k] == 4) {
                                myScore[i][j] += 10000;
                            }

                            if (computerWin[k] == 1) {
                                computerScore[i][j] += 220;
                            } else if (computerWin[k] == 2) {
                                computerScore[i][j] += 420;
                            } else if (computerWin[k] == 3) {
                                computerScore[i][j] += 2100;
                            } else if (computerWin[k] == 4) {
                                computerScore[i][j] += 20000;
                            }
                        }
                    }

                    if (myScore[i][j] > max) {
                        max = myScore[i][j];
                        u = i;
                        v = j;
                    } else if (myScore[i][j] == max) {
                        if (computerScore[i][j] > computerScore[u][v]) {
                            u = i;
                            v = j;
                        }
                    }

                    if (computerScore[i][j] > max) {
                        max = computerScore[i][j];
                        u = i;
                        v = j;
                    } else if (computerScore[i][j] == max) {
                        if (myScore[i][j] > myScore[u][v]) {
                            u = i;
                            v = j;
                        }
                    }

                }
            }
        }
        step(u, v, 'AI');
        chressBoard[u][v] = 2;
        for (var k = 0; k < count; k++) {
            if (wins[u][v][k]) {
                computerWin[k]++;
                myWin[k] = 6; //这个位置对方不可能赢了
                if (computerWin[k] == 5) {
                    alert('计算机赢了');
                    over = true;
                }
            }
        }
        if (!over) {
            me = !me;
        }
    }

// 画棋盘
    for (var i = 0; i < 15; i++) {
        context.moveTo(15 + i * 30, 15)
        context.lineTo(15 + i * 30, 435)
        context.stroke()
        context.moveTo(15, 15 + i * 30)
        context.lineTo(435, 15 + i * 30)
        context.stroke()
    }

// 落子
    var step = function (i, j, who) {
        context.beginPath();
        context.arc(15 + i * 30, 15 + j * 30, 13, 0, 2 * Math.PI); //画圆
        context.closePath();
        //渐变
        var gradient = context.createRadialGradient(15 + i * 30 + 2, 15 + j * 30 - 2, 13, 15 + i * 30 + 2, 15 +
            j * 30 - 2, 0);

        if (who === 'me') {
            gradient.addColorStop(0, '#0a0a0a');
            gradient.addColorStop(1, '#636766');
        } else if (who === 'AI') {
            gradient.addColorStop(0, '#d1d1d1');
            gradient.addColorStop(1, '#f9f9f9');
        }
        context.fillStyle = gradient;
        context.fill();
    }

    $('#game_replay').on('click', function () {
        window.location.reload();
    });
});