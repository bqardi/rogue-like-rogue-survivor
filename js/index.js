document.addEventListener("DOMContentLoaded", event => {
    //#region GRID
    const grid = document.getElementById("grid");

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

    let playerTileObj;
    let inventory = {
        apple: {
            count: 0,
            element: document.getElementById("apple-count"),
        },
        key: {
            count: 0,
            element: document.getElementById("key-count"),
        },
    };

    const gridWidth = 7;
    const gridHeight = 7;
    const tileSize = 64;

    newGame();

    function newGame() {
        grid.style.gridTemplateColumns = `repeat(${gridWidth}, ${tileSize}px)`;
        // createCollectable("apple", true);
        // createCollectable("key", true);
        buildGrid("0_0");
        createPlayer(getCenterTileIndex());
        addPlayerControls();
    }

    function newGrid(id) {
        currentGridArea = new Object();
        currentGridArea.id = id;
        currentGridArea.tiles = [];
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                let tileObj = newTile(x, y);
                if (x > 0 && x < gridWidth - 2 && y > 0 && y < gridHeight - 2) {
                    const rnd = randomInteger(0, 1000);
                    if (rnd < 10) {
                        tileObj.type = "collectable";
                        tileObj.class = "apple";
                    } else if (rnd < 100) {
                        tileObj.type = "obstacle";
                        tileObj.class = "tree";
                    } else if (rnd < 200) {
                        tileObj.type = "obstacle";
                        tileObj.class = "rock";
                    }
                }
                currentGridArea.tiles.push(tileObj);
            }
        }
        const biom = bioms[randomInteger(0, bioms.length)];
        setBiom(biom);
        currentGridArea.biom = biom;
        gridAreas.push(currentGridArea);
    }

    function setBiom(biomClass) {
        for (let i = 0; i < bioms.length; i++) {
            const biom = bioms[i];
            grid.classList.remove(biom);
        }
        grid.classList.add(biomClass);
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
            if (tileObj.type == "obstacle") {
                tileElm.innerHTML = `<div class="tooltip">Hello</div>`;
            }
        }
    }

    function newTile(x, y) {
        let tileObj = new Object();
        tileObj.id = `${x}_${y}`;
        tileObj.type = "empty";
        tileObj.class = "";
        tileObj.required = false;
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
        let player = new Object();
        player.name = "Player One";
        player.element = document.createElement("DIV");
        player.element.classList.add("player");
        player.element.classList.add("player__one");
        tileObj.object = player;
        tileObj.element.append(tileObj.object.element);
        playerTileObj = tileObj;
    }

    function setTileEmpty(tileObj) {
        tileObj.type = "empty";
        tileObj.class = "";
        tileObj.required = false;
    }

    function addPlayerControls() {
        document.addEventListener("keydown", function(evt) {
            if (evt.repeat) {
                return
            }
            if (evt.key == "w") {
                move(currentGridArea, 0, -1);
            }
            if (evt.key == "s") {
                move(currentGridArea, 0, 1);
            }
            if (evt.key == "a") {
                move(currentGridArea, -1, 0);
            }
            if (evt.key == "d") {
                move(currentGridArea, 1, 0);
            }
        })
    }

    function move(gridObj, moveX, moveY) {
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
        destinationTileObj.object = playerTileObj.object;
        playerTileObj = destinationTileObj;
        if (playerTileObj.type == "collectable") {
            collect(playerTileObj);
        }
        playerTileObj.element.append(playerTileObj.object.element);
    }

    function splitId(id) {
        let coordinate = id.split("_");
        let obj = new Object();
        obj.x = parseInt(coordinate[0]);
        obj.y = parseInt(coordinate[1]);
        return obj;
    }

    function collect(tileObj) {
        const elm = inventory[tileObj.class];
        elm.count++;
        elm.element.textContent = elm.count;
        tileObj.element.className = "grid__tile grid__empty";
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

    function createCollectable(collectableClass, required) {
        let tileObj = positionObject(currentGridArea, -1);
        tileObj.type = "collectable";
        tileObj.class = collectableClass;
        tileObj.required = required;
    }

    function positionObject(gridObj, tileIndex) {
        let index = tileIndex;
        const tilesLength = gridObj.tiles.length;
        if (index < 0 || index >= tilesLength) {
            index = randomInteger(0, tilesLength);
            while (gridObj.tiles[index].required || gridObj.tiles[index].object != undefined) {
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
});