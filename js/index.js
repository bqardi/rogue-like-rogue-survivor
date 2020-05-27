document.addEventListener("DOMContentLoaded", event => {
    //#region GRID
    const grid = document.getElementById("grid");

    let player;
    let playerTileObj;
    let playerAnimationTime = 100;
    let playerIsMoving = false;

    const gridWidth = 7;
    const gridHeight = 7;
    const tileSize = 64;
    let worldKeys = 4;

    let gridAreas = [];

    let currentGridArea = {
        id: "",
        biom: "",
        tiles: [],
    }
    let bioms = [
        "forest",
        "desert",
        "snow",
    ]

    let enemyType = {
        skeleton: {
            name: "Skeleton",
            class: "skeleton",
            propability: 5,
            min: 0,
            max: 3,
            createHTML: function() {
                let element = document.createElement("DIV");
                element.classList.add("enemy");
                element.classList.add(this.class);
                element.classList.add("animation");
                element.style.animationDuration = `${playerAnimationTime}ms`;
                element.innerHTML = `<div class="tooltip">${this.name}</div>`;
                return element;
            }
        },
    }

    let effect = {
        explosion: {

        }
    }

    let stats = {
        life: {
            count: 100,
            element: document.getElementById("life-count"),
            add: function(amount) {
                this.count += amount;
                this.element.textContent = this.count;
            }
        },
        strength: {
            count: 10,
            element: document.getElementById("strength-count"),
            add: function(amount) {
                this.count += amount;
                this.element.textContent = this.count;
            }
        },
        armor: {
            count: 10,
            element: document.getElementById("armor-count"),
            add: function(amount) {
                this.count += amount;
                this.element.textContent = this.count;
            }
        },
    };
    let inventory = {
        apple: {
            count: 0,
            stackable: true,
            element: document.getElementById("apple-count"),
        },
        key: {
            count: 0,
            stackable: true,
            element: document.getElementById("key-count"),
        },
        map: {
            count: 0,
            stackable: false,
            element: document.getElementById("map"),
        },
    };

    newGame();

    function newGame() {
        grid.style.gridTemplateColumns = `repeat(${gridWidth}, ${tileSize}px)`;
        // createCollectable("apple", true);
        // createCollectable("key", true);
        stats.life.add(0);
        stats.strength.add(0);
        stats.armor.add(0);
        buildGrid("0_0");
        createPlayer(getCenterTileIndex());
        addPlayerControls();
        placeEnemies(enemyType.skeleton);
    }

    function newGrid(id) {
        currentGridArea = new Object();
        currentGridArea.id = id;
        currentGridArea.tiles = [];
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                let tileObj = newTile(x, y);
                if (x > 0 && x < gridWidth - 2 && y > 0 && y < gridHeight - 2) {
                    const rnd = Math.random() * 100;
                    if (rnd < 1) {
                        if (worldKeys > 0) {
                            tileObj.type = "collectable";
                            tileObj.class = "key";
                            tileObj.occupied = true;
                            tileObj.tooltip = "Key - Use to gain access to Dungeons!";
                            worldKeys--;
                        }
                    } else if (rnd < 2) {
                        tileObj.type = "collectable";
                        tileObj.class = "apple";
                        tileObj.occupied = true;
                        tileObj.tooltip = "Apple - Use to gain health";
                    } else if (rnd < 18) {
                        tileObj.type = "obstacle";
                        tileObj.class = "tree";
                        tileObj.occupied = true;
                        tileObj.tooltip = "Tree - Steer around!";
                    } else if (rnd < 28) {
                        tileObj.type = "obstacle";
                        tileObj.class = "rock";
                        tileObj.occupied = true;
                        tileObj.tooltip = "Rock - Don't bump into these!";
                    }
                }
                currentGridArea.tiles.push(tileObj);
            }
        }
        setBiom(bioms[randomInteger(0, bioms.length)]);
        gridAreas.push(currentGridArea);
    }

    function setBiom(biomClass) {
        for (let i = 0; i < bioms.length; i++) {
            const biom = bioms[i];
            grid.classList.remove(biom);
        }
        grid.classList.add(biomClass);
        currentGridArea.biom = biomClass;
    }

    function buildGrid(id) {
        grid.innerHTML = "";
        currentGridArea = undefined;
        for (let i = 0; i < gridAreas.length; i++) {
            if (gridAreas[i].id == id) {
                currentGridArea = gridAreas[i];
                break;
            }
        }
        if (currentGridArea == undefined) {
            newGrid(id);
        }
        setBiom(currentGridArea.biom);
        for (let i = 0; i < currentGridArea.tiles.length; i++) {
            const tileObj = currentGridArea.tiles[i];
            const tileElm = buildTile(tileObj);
            if (tileObj.tooltip != "") {
                tileElm.innerHTML = `<div class="tooltip">${tileObj.tooltip}</div>`;
            }
        }
    }

    function newTile(x, y) {
        let tileObj = new Object();
        tileObj.id = `${x}_${y}`;
        setTileEmpty(tileObj)
        return tileObj;
    }

    function buildTile(tileObj) {
        let tileElm = document.createElement("DIV");
        tileElm.id = tileObj.id;
        tileElm.classList.add("grid__tile");
        tileElm.classList.add(`grid__${tileObj.type}`);
        if (tileObj.class != "") {
            tileElm.classList.add(`grid__${tileObj.class}`);
        }
        tileObj.element = tileElm;
        grid.append(tileElm);
        return tileElm;
    }

    function getCenterTileIndex() {
        if (currentGridArea.tiles.length == 0) {
            console.log("Something is very wrong!");
            return;
        }
        return Math.floor(currentGridArea.tiles.length / 2);
    }

    function createPlayer(tileIndex) {
        let tileObj = positionObject(currentGridArea, tileIndex);
        if (tileObj.element == undefined) {
            console.log("No element attached to tileObj!");
            return;
        }
        setTileEmpty(tileObj);
        tileObj.element.innerHTML = "";
        player = new Object();
        player.name = "Player One";
        player.element = document.createElement("DIV");
        player.element.classList.add("player");
        player.element.classList.add("player__one");
        player.element.classList.add("animation");
        player.element.style.animationDuration = `${playerAnimationTime}ms`;
        player.element.innerHTML = `<div class="tooltip">Player 1</div>`;
        tileObj.object = player;
        tileObj.element.append(tileObj.object.element);
        playerTileObj = tileObj;
    }

    function placeEnemies(enemy) {
        // if (currentGridArea.id != "0_0") {
        //     const propability = isPropable(enemy.propability);
        //     let tileObj = positionObject(currentGridArea);
        //     if (tileObj.element == undefined) {
        //         console.log("No element attached to tileObj!");
        //         return;
        //     }
        //     placeEnemy(tileObj, enemy);
        // }
        let tileObj = positionObject(currentGridArea);
        if (tileObj.element == undefined) {
            console.log("No element attached to tileObj!");
            return;
        }
        placeEnemy(tileObj, enemy);
    }

    function placeEnemy(tileObj, enemyObj) {
        let element = enemyObj.createHTML();
        tileObj.element.append(element);
        tileObj.object = enemyObj;
        tileObj.type = "enemy";
        tileObj.occupied = true;
    }

    function setTileEmpty(tileObj) {
        tileObj.type = "empty";
        tileObj.tooltip = "";
        tileObj.class = "";
        tileObj.occupied = false;
        if (tileObj.element) {
            tileObj.element.className = "grid__tile grid__empty";
        }
    }

    function addPlayerControls() {
        document.addEventListener("keydown", function(evt) {
            if (evt.repeat || playerIsMoving) {
                return
            }
            if (evt.key == "w" || evt.key == "ArrowUp") {
                move(currentGridArea, 0, -1, "0 -192px", "up");
            }
            if (evt.key == "s" || evt.key == "ArrowDown") {
                move(currentGridArea, 0, 1, "0 0", "down");
            }
            if (evt.key == "a" || evt.key == "ArrowLeft") {
                move(currentGridArea, -1, 0, "0 -64px", "left");
            }
            if (evt.key == "d" || evt.key == "ArrowRight") {
                move(currentGridArea, 1, 0, "0 -128px", "right");
            }
        })
    }

    function playerMove() {

    }

    function move(gridObj, moveX, moveY, spritePos, direction) {
        let coordinate = splitId(playerTileObj.id);
        coordinate.x += moveX;
        coordinate.y += moveY;
        if (coordinate.y < 0) {
            let areaCoordinates = splitId(currentGridArea.id);
            areaCoordinates.y += 1;
            buildGrid(areaCoordinates.x + "_" + areaCoordinates.y);
            createPlayer(currentGridArea.tiles.length - gridWidth + coordinate.x);
            return;
        }
        if (coordinate.y >= gridHeight) {
            let areaCoordinates = splitId(currentGridArea.id);
            areaCoordinates.y -= 1;
            buildGrid(areaCoordinates.x + "_" + areaCoordinates.y);
            createPlayer(coordinate.x);
            return;
        }
        if (coordinate.x < 0) {
            let areaCoordinates = splitId(currentGridArea.id);
            areaCoordinates.x += 1;
            buildGrid(areaCoordinates.x + "_" + areaCoordinates.y);
            createPlayer(coordinate.y * gridWidth + gridWidth - 1);
            return;
        }
        if (coordinate.x >= gridWidth) {
            let areaCoordinates = splitId(currentGridArea.id);
            areaCoordinates.x -= 1;
            buildGrid(areaCoordinates.x + "_" + areaCoordinates.y);
            createPlayer(coordinate.y * gridWidth);
            return;
        }
        let destinationTileObj = getTile(gridObj, coordinate.x + "_" + coordinate.y);
        if (destinationTileObj.type == "obstacle") {
            return;
        }
        playerIsMoving = true;
        player.element.style.backgroundPosition = spritePos;
        player.element.classList.add("animation-" + direction);
        if (destinationTileObj.type == "enemy") {
            setTimeout(() => {
                player.element.classList.add("attack");
                spawnEffect(effect.explosion, destinationTileObj);
                setTimeout(() => {
                    player.element.classList.remove("attack");
                    player.element.classList.remove("animation-" + direction);
                    playerIsMoving = false;
                }, playerAnimationTime / 2);
            }, playerAnimationTime / 2);
            return;
        }
        setTimeout(() => {
            destinationTileObj.object = playerTileObj.object;
            playerTileObj = destinationTileObj;
            if (playerTileObj.type == "collectable") {
                collect(playerTileObj);
            }
            playerTileObj.element.append(playerTileObj.object.element);
            player.element.classList.remove("animation-" + direction);
            playerIsMoving = false;
        }, playerAnimationTime);
    }

    function spawnEffect(effect, tileObj) {

    }

    function splitId(id) {
        let coordinate = id.split("_");
        let obj = new Object();
        obj.x = parseInt(coordinate[0]);
        obj.y = parseInt(coordinate[1]);
        return obj;
    }

    function collect(tileObj) {
        const collectableObj = inventory[tileObj.class];
        collectableObj.count++;
        collectableObj.element.textContent = collectableObj.count;
        setTileEmpty(tileObj);
    }

    function getTile(gridObj, id) {
        for (let i = 0; i < gridObj.tiles.length; i++) {
            const obj = gridObj.tiles[i];
            if (obj.id == id) {
                return obj;
            }
        }
    }

    function createCollectable(collectableClass, occupied) {
        let tileObj = positionObject(currentGridArea);
        tileObj.type = "collectable";
        tileObj.class = collectableClass;
        tileObj.occupied = occupied;
    }

    function positionObject(gridObj, tileIndex = -1) {
        let index = tileIndex;
        const tilesLength = gridObj.tiles.length;
        if (index < 0 || index >= tilesLength) {
            index = randomInteger(0, tilesLength);
            while (gridObj.tiles[index].occupied || gridObj.tiles[index].object != undefined) {
                index = randomInteger(0, tilesLength);
            }
        }
        let tileObj = gridObj.tiles[index];
        return tileObj;
    }
    //#endregion GRID

    function randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function isPropable(propabilityPercentage) {
        return propabilityPercentage > randomInteger(0, 100);
    }
});