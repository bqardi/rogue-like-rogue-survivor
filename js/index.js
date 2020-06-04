document.addEventListener("DOMContentLoaded", event => {
    //#region GRID
    const gridContainer = document.getElementById("grid-container");
    const miniMapContainer = document.getElementById("mini-map");
    const miniMapZoom = document.getElementById("mini-map-enlarger");

    let player;
    let playerTileObj;
    let playerAnimationTime = 100;
    let playerIsMoving = false;

    let region;
    let miniMap;
    let currentZone = undefined;

    // const zonesUp = 7;
    // const zonesDown = -7;
    // const zonesLeft = -9;
    // const zonesRight = 9;
    // const sectionWidth = 7;
    // const sectionHeight = 7;
    // const tileSize = 64;
    const worldKeys = 4;

    class Region {
        constructor(name, type, element, size, zoneSize, tileSize, bioms) {
            this.name = name;
            this.type = type;
            this.bioms = bioms;
            this.zones = [];
            this.enemies = [];
            this.element = element;
            this.size = size;
            this.zoneSize = zoneSize;
            this.tileSize = tileSize;
            this.initialize();
        }
        initialize() {
            this.size.down = -Math.abs(this.size.down);
            this.size.left = -Math.abs(this.size.left);
            this.element.style.gridTemplateColumns = `repeat(${this.zoneSize.width}, ${this.tileSize}px)`;
        }
        get width() {
            return this.size.right + 1 - this.size.left;
        }
        get height() {
            return this.size.up + 1 - this.size.down;
        }
        addZone(zone) {
            this.zones.push(zone);
        }
        getZone(id) {
            for (let i = 0; i < this.zones.length; i++) {
                const zone = this.zones[i];
                if (zone.id == id) {
                    return zone;
                }
            }
        }
        getRandomZone() {
            if (this.zones.length == 0) {
                return null;
            }
            const rnd = randomInteger(0, this.zones.length);
            return this.zones[rnd];
        }
        addEnemy(enemy) {
            this.enemies.push(enemy);
        }
        setRandomBiom() {
            if (this.bioms.length == 0) {
                return null;
            }
            const rnd = randomInteger(0, this.bioms.length);
            this.setBiom(this.bioms[rnd]);
        }
        setBiom(biomClass) {
            for (let i = 0; i < this.bioms.length; i++) {
                const biom = this.bioms[i];
                this.element.classList.remove(biom);
            }
            this.element.classList.add(biomClass);
            this.biom = biomClass;
        }
        getRandomEnemy() {
            if (this.enemies.length == 0) {
                return null;
            }
            const rnd = randomInteger(0, this.enemies.length);
            return enemies[rnd];
        }
    }

    class Zone {
        constructor(id, explored, biom) {
            this.id = id;
            this.explored = explored;
            this.biom = biom;
            this.tiles = [];
            this.initialize();
        }
        initialize() {
            if (this.id == "0_0") {
                this.explore();
            }
        }
        explore() {
            this.explored = true;
        }
        addTile(tile) {
            this.tiles.push(tile);
        }
        getTileObj(id) {
            for (let i = 0; i < this.tiles.length; i++) {
                const tileObj = this.tiles[i];
                if (tileObj.id == id) {
                    return tileObj;
                }
            }
        }
        getRandomTile() {
            if (this.tiles.length == 0) {
                return null;
            }
            let rnd = randomInteger(0, this.tiles.length);
            while (this.tiles[rnd].occupied) {
                rnd = randomInteger(0, this.tiles.length);
            }
            return this.tiles[rnd];
        }
        coordinates() {
            let coordinate = this.id.split("_");
            let obj = new Object();
            obj.x = parseInt(coordinate[0]);
            obj.y = parseInt(coordinate[1]);
            return obj;
        }
    }

    class Tile {
        constructor(id) {
            this.id = id;
            this.name = "none";
            this.type = "empty";
            this.object = null;
            this.occupied = false;
            this.objectHTML = null;
        }
        setEmpty() {
            this.name = "none";
            this.type = "empty";
            this.object = null;
            this.occupied = false;
            if (this.element) {
                this.element.className = "grid__tile grid__empty";
                this.element.innerHTML = "";
            }
        }
        setType(name, type, occupied) {
            this.name = name;
            this.type = type;
            this.occupied = occupied;
        }
        createHTML() {
            let tileElm = document.createElement("DIV");
            tileElm.id = this.id;
            tileElm.classList.add("grid__tile");
            tileElm.classList.add(`grid__${this.type}`);
            tileElm.classList.add(`grid__${this.name}`);
            this.element = tileElm;
            // if (this.objectHTML) {
            //     this.element.append(this.objectHTML);
            // }
            return tileElm;
        }
        placeObject(object, type, occupied) {
            this.type = type;
            this.object = object;
            this.occupied = occupied;
        }
        placeHTML(objectHTML) {
            this.element.append(objectHTML);
        }
        removeObject(objectElement) {
            this.element.removeChild(objectElement);
            this.object = null;
            this.type = "empty";
            this.occupied = false;
        }
    }

    class MiniMap {
        constructor(region, element, zoomElm) {
            this.region = region;
            this.element = element;
            this.zoomElm = zoomElm;
            this.initialize();
        }
        initialize() {
            const height = 70;
            const gridHeight = this.region.size.up + 1 - this.region.size.down;
            const gridWidth = this.region.size.right + 1 - this.region.size.left;
            const width = height / gridHeight * gridWidth;
            this.zoomedInHeight = height / gridHeight;
            this.zoomedInWidth = width / gridWidth;
            this.zoomOut();
        }
        reset() {
            this.element.innerHTML = "";
        }
        zoomIn() {
            this.element.style.gridTemplateColumns = `repeat(${this.region.width}, ${this.zoomedInWidth}vh)`;
            this.element.style.gridAutoRows = `${this.zoomedInHeight}vh`;
        }
        zoomOut() {
            this.element.style.gridTemplateColumns = `repeat(${this.region.width}, ${this.region.zoneSize.width}px)`;
            this.element.style.gridAutoRows = `${this.region.zoneSize.height}px`;
        }
        zoomToggle() {
            this.zoomElm.classList.toggle("enlarged");
            const minimapLocation = this.element.querySelector(".active");
            minimapLocation.classList.toggle("transparent");
            if (this.zoomElm.classList.contains("enlarged")) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        }
        tileAddClass(id, cls) {
            const miniMapTile = document.getElementById("minimap_" + id);
            miniMapTile.classList.add(cls);
        }
    }

    class Gate {
        constructor(id, cls, locked, tileObj) {
            this.id = id;
            this.cls = cls;
            this.locked = locked;
            this.tileObj = tileObj;
            this.initialize();
        }
        initialize() {
            this.tileObj.object = this;
            this.tileObj.type = "gate";
            this.tileObj.occupied = true;
        }
        createHTML() {
            let gate = document.createElement("DIV");
            gate.classList.add("gate");
            gate.classList.add(this.cls);
            if (this.locked) {
                gate.classList.add("locked");
                gate.style.backgroundPosition = "0 0";
            }
            gate.classList.add("tile__object");
            this.element = gate;
            this.tileObj.element.append(gate);
        }
        unlock() {
            if (this.locked) {
                this.locked = false;
                let counter = 0;
                let interval = setInterval(() => {
                    counter -= 64;
                    this.element.style.backgroundPosition = `0 ${counter}px`;
                    if (counter <= -192) {
                        clearInterval(interval);
                    }
                }, 100);
            }
            return !this.locked;
        }
    }

    class Player {
        constructor(name, life, lifeElm, strength, strengthElm, armor, armorElm) {
            this.name = name;
            this.life = life;
            this.lifeElm = lifeElm;
            this.strength = strength;
            this.strengthElm = strengthElm;
            this.armor = armor;
            this.armorElm = armorElm;
            this.initialize();
            this.killCount = 0;
        }
        initialize() {
            this.lifeElm.textContent = this.life;
            this.strengthElm.textContent = this.strength;
            this.armorElm.textContent = this.armor;
            this.element = document.createElement("DIV");
            this.element.classList.add("player");
            this.element.classList.add("animation");
            this.element.classList.add("tile__object");
            this.element.style.animationDuration = `${playerAnimationTime}ms`;
            this.element.innerHTML = `<div class="tooltip">Player</div>`;
        }
        addLife(amount) {
            this.life += amount;
            if (this.life <= 0) {
                this.life = 0;
                this.lifeElm.textContent = 0;
                this.die();
            }
            this.lifeElm.textContent = this.life;
        }
        addStrength(amount) {
            this.strength += amount;
            this.strengthElm.textContent = this.strength;
        }
        addArmor(amount) {
            this.armor += amount;
            this.armorElm.textContent = this.armor;
        }
        enemyKill() {
            this.killCount++;
        }
        takeDamage(amount) {
            let dmg = amount - this.armor;
            if (dmg <= 0) {
                return;
            }
            this.addLife(-dmg);
        }
        die() {
            console.log(this.name + " died!");
        }
    }

    class Enemy {
        constructor(name, cls, life, strength, currentTile) {
            this.name = name;
            this.cls = cls;
            this.life = life;
            this.strength = strength;
            this.currentLife = life;
            this.currentTile;
            this.elm;
            this.elmBar;
            this.elmBarText;
            this.currentTile = currentTile;
        }

        createHTML() {
            let enemyHTML = document.createElement("DIV");
            enemyHTML.classList.add("enemy");
            enemyHTML.classList.add(this.cls);
            enemyHTML.classList.add("animation");
            enemyHTML.classList.add("tile__object");
            enemyHTML.style.animationDuration = `${playerAnimationTime}ms`;
            let healthbar = document.createElement("DIV");
            let bar = document.createElement("DIV");
            let barText = document.createElement("SPAN");
            healthbar.classList.add("healthbar");
            bar.classList.add("bar");
            bar.style.width = `${this.currentLife / this.life * 100}%`;
            barText.classList.add("bar__text");
            barText.textContent = `${this.currentLife} / ${this.life}`;
            healthbar.append(bar);
            healthbar.append(barText);
            enemyHTML.append(healthbar);
            enemyHTML.insertAdjacentHTML("beforeend", `<div class="tooltip">${this.name}</div>`);
            this.elm = enemyHTML;
            this.elmBar = bar;
            this.elmBarText = barText;
            return enemyHTML;
        }

        takeDamage(dmgAmount) {
            this.currentLife -= dmgAmount;
            this.elmBar.style.width = `${this.currentLife / this.life * 100}%`;
            this.elmBarText.textContent = `${this.currentLife} / ${this.life}`;
            if (this.currentLife <= 0) {
                this.currentTile.removeObject(this.elm);
                return true;
            }
            return false;
        }
    }

    class Item {
        constructor(amount, cls, posX, posY) {
            this.amount = amount;
            this.cls = cls;
            this.posX = posX * 48;
            this.posY = posY * 48;
        }
        createHTML() {
            let item = document.createElement("DIV");
            item.classList.add("item");
            // item.classList.add(this.cls);
            item.style.backgroundPosition = `-${this.posX}px -${this.posY}px`;
            item.classList.add("tile__object");
            return item;
        }
    }

    class Currency {
        constructor(nextAt = 0, nextCurrency = null) {
            this.amount = 0;
            this.nextAt = nextAt;
            this.nextCurrency = nextCurrency;
        }
        add(amount) {
            this.amount += amount;
            let tmpAmount = this.amount;
            if (this.nextCurrency != null) {
                tmpAmount = this.amount % this.nextAt;
                this.nextCurrency.add((this.amount - tmpAmount) / this.nextAt);
            }
            this.amount = tmpAmount;
        }
        remove(amount) {
            let tmpAmount = this.amount - amount;
            if (tmpAmount < 0) {
                const mod = tmpAmount % this.nextAt;
                let tmpNextAmount = this.nextAt + mod;
                if (this.nextCurrency != null) {
                    if (!this.nextCurrency.remove((tmpNextAmount - tmpAmount) / this.nextAt)) {
                        return false;
                    }
                } else {
                    return false;
                }
                tmpAmount = tmpNextAmount;
            }
            this.amount = tmpAmount;
            return true;
        }
    }

    class Direction {
        constructor(up, right, down, left) {
            this.up = up;
            this.right = right;
            this.down = down;
            this.left = left;
        }
    }

    class Dimension {
        constructor(width, height) {
            this.width = width;
            this.height = height;
        }
    }

    // let platinum = new Currency();
    // let gold = new Currency(100, platinum);
    // let silver = new Currency(100, gold);
    // gold.add(10);
    // silver.add(12);
    // if (!silver.remove(11)) {
    //     console.log("Can't do that!");
    // }
    // platinum.add(152);
    // silver.remove(21512);
    // console.log("Platinum: " + platinum.amount + ", Gold: " + gold.amount + ", silver: " + silver.amount);

    const worlds = {
        home: {
            name: "Home",
            type: "outdoors",
            locked: false,
            bioms: ["forest", "desert", "snow"],
        },
        kartansLair: {
            name: "Kartans Lair",
            type: "dungeon",
            locked: true,
            bioms: ["floor"],
        },
        dungeonOfMachlain: {
            name: "The Dungeon of Machlain",
            type: "dungeon",
            locked: true,
            bioms: ["floor"],
        },
        orchsCave: {
            name: "Orchs cave",
            type: "dungeon",
            locked: true,
            bioms: ["floor"],
        },
        piratesLair: {
            name: "Pirates Lair",
            type: "dungeon",
            locked: true,
            bioms: ["floor"],
        }
    }

    let dungeons = [
        worlds.kartansLair,
        worlds.dungeonOfMachlain,
        worlds.orchsCave,
        worlds.piratesLair,
    ]

    // let gridAreas = [];

    // let bioms = ["forest", "desert", "snow"]
    let enemyTypes = [{
            name: "Skeleton",
            cls: "skeleton",
            life: 20,
            strength: 8,
        },
        {
            name: "Orc",
            cls: "orc",
            life: 50,
            strength: 18,
        },
    ]

    let effect = {
        explosion: {
            name: "Explosion",
            class: "explosion",
            speed: 20,
            createHTML: function(tileObj, duration) {
                let effect = document.createElement("DIV");
                effect.classList.add("effect");
                effect.classList.add(this.class);
                effect.classList.add("tile__object");
                effect.style.animationDuration = `${duration}ms`;
                tileObj.element.append(effect);
                setTimeout(() => {
                    tileObj.element.removeChild(effect);
                }, duration);
            }
        }
    }

    let inventory = {
        coin: {
            count: 0,
            stackable: true,
            active: true,
            element: document.getElementById("coin-count"),
        },
        key: {
            count: 0,
            stackable: true,
            active: false,
            element: document.getElementById("key-count"),
        },
        map: {
            count: 0,
            stackable: false,
            active: false,
            element: document.getElementById("map"),
        },
    };
    let loot = [{
            cls: "coin",
            position: {
                column: 7,
                row: 3,
            },
            max: -1,
            maxStack: 20,
            active: true,
        },
        {
            cls: "map",
            position: {
                column: 9,
                row: 3,
            },
            max: 1,
            maxStack: 1,
            active: false,
        },
    ]

    newGame();

    document.addEventListener("keyup", function(evt) {
        if (evt.key == "m") {
            miniMap.zoomToggle();
        }
    });

    function newGame() {
        const regionSize = new Direction(11, 14, 11, 14);
        const zoneSize = new Dimension(7, 7);
        region = new Region("home", "outdoor", gridContainer, regionSize, zoneSize, 64, worlds.home.bioms);
        miniMap = new MiniMap(region, miniMapContainer, miniMapZoom);

        // createCollectable("apple", true);
        // createCollectable("key", true);

        for (let i = 0; i < loot.length; i++) {
            const itemType = loot[i];
            if (itemType.max > 0) {
                itemType.max++;
            }
        }
        buildMap();
        buildZone("0_0");
        createPlayer(getCenterTileIndex());
        addPlayerControls();

        //CHEATS!!!
        inventory.key.count++;
        inventory.key.element.textContent = inventory.key.count;
    }

    function enterGate(areaObj) {
        if (areaObj.locked) {
            if (inventory.key.count > 0) {
                inventory.key.count--;
                inventory.key.element.textContent = inventory.key.count;
                areaObj.unlock();
            } else {
                console.log("Key is missing!");
            }
        } else {
            console.log("Transitioning to " + areaObj.id);
        }
    }

    function buildMap() {
        miniMap.reset();
        for (let y = region.size.up; y >= region.size.down; y--) {
            for (let x = region.size.left; x <= region.size.right; x++) {
                newZone(x + "_" + y);
                miniMapHTML(x + "_" + y, currentZone.biom);
            }
        }
        placeDungeons();
        placeKeys();
    }

    function miniMapHTML(id, biom) {
        // let activeClass = "fog-of-war";
        let activeClass = "";
        if (id == "0_0") {
            activeClass = "active";
        }
        const miniMapSection = `
            <div id="minimap_${id}" class="mini-map__tile ${biom} ${activeClass}"></div>
        `;
        miniMapContainer.insertAdjacentHTML("beforeend", miniMapSection);
    }

    // function miniMapTileAddClass(id, cls) {
    //     const miniMapTile = document.getElementById("minimap_" + id);
    //     miniMapTile.classList.add(cls);
    // }

    function miniMapTileRemoveClass(id, cls) {
        const miniMapTile = document.getElementById("minimap_" + id);
        miniMapTile.classList.remove(cls);
    }

    function miniMapTileInnerHTML(id, htmlStr) {
        const miniMapTile = document.getElementById("minimap_" + id);
        miniMapTile.innerHTML = htmlStr;
    }

    function miniMapActive(id, setActive) {
        for (let i = 0; i < region.zones.length; i++) {
            const zone = region.zones[i];
            if (zone.id == id) {
                if (setActive) {
                    let miniMapSection = document.getElementById("minimap_" + id)
                    miniMapSection.classList.remove("fog-of-war");
                    miniMapSection.classList.add("active");
                    currentZone.explore();
                } else {
                    document.getElementById("minimap_" + id).classList.remove("active");
                }
            }
        }
    }

    function newZone(id) {
        region.setRandomBiom();
        currentZone = new Zone(id, false, region.biom);
        for (let y = 0; y < region.zoneSize.height; y++) {
            for (let x = 0; x < region.zoneSize.width; x++) {
                let tileObj = new Tile(`${x}_${y}`);
                if (x > 0 && x < region.zoneSize.width - 2 && y > 0 && y < region.zoneSize.height - 2) {
                    const rnd = Math.random() * 100;
                    if (rnd < 10) {
                        tileObj.setType("tree", "obstacle", true);
                    } else if (rnd < 20) {
                        tileObj.setType("rock", "obstacle", true);
                    }
                }
                currentZone.tiles.push(tileObj);
            }
        }
        if (id != "0_0") {
            placeEnemies();
            placeLoot();
        }
        region.addZone(currentZone);
        // playerStats.exploredNew(5, function() {
        //     itemTypes[1].active = true;
        // });
        // playerStats.exploredNew(8, function() {
        //     itemTypes[2].active = true;
        // });
    }

    function buildZone(id) {
        region.element.innerHTML = "";
        currentZone = region.getZone(id);
        region.setBiom(currentZone.biom);
        for (let i = 0; i < currentZone.tiles.length; i++) {
            const tileObj = currentZone.tiles[i];
            region.element.append(tileObj.createHTML());
            if (tileObj.object != null) {
                if (tileObj.type == "enemy" || tileObj.type == "item") {
                    tileObj.placeHTML(tileObj.object.createHTML());
                }
            }
        }
        if (currentZone.areaTransition != undefined) {
            if (currentZone.areaTransition.cls == "dungeon") {
                currentZone.areaTransition.createHTML();
            }
        }
    }

    function getCenterTileIndex() {
        if (currentZone.tiles.length == 0) {
            console.log("Something is very wrong!");
            return;
        }
        return Math.floor(currentZone.tiles.length / 2);
    }

    function createPlayer(tileIndex) {
        let tileObj = getIndexedTileObj(currentZone, tileIndex);
        if (tileObj.element == undefined) {
            console.log("No element attached to tileObj!");
            return;
        }
        tileObj.setEmpty();
        tileObj.element.innerHTML = "";
        const lifeUIElm = document.getElementById("life-count");
        const strengthUIElm = document.getElementById("strength-count");
        const armorUIElm = document.getElementById("armor-count");
        player = new Player("Player 1", 100, lifeUIElm, 10, strengthUIElm, 0, armorUIElm);
        tileObj.object = player;
        tileObj.element.append(tileObj.object.element);
        playerTileObj = tileObj;
    }

    function placeEnemies() {
        let amount = 0;
        const amountChance = randomInteger(0, 100);
        if (amountChance > 25) {
            amount++;
            if (amountChance > 80) {
                amount++;
            }
            if (amountChance > 90) {
                amount++;
            }
            if (amountChance > 95) {
                amount++;
            }
            if (amountChance > 99) {
                amount++;
            }
        }
        for (let i = 0; i < amount; i++) {
            const tileObj = currentZone.getRandomTile();
            randomEnemy(tileObj);
        }
    }

    function placeLoot() {
        let amount = 0;
        const amountChance = randomInteger(0, 100);
        if (amountChance > 25) {
            amount++;
            if (amountChance > 80) {
                amount++;
            }
            if (amountChance > 90) {
                amount++;
            }
            if (amountChance > 95) {
                amount++;
            }
            if (amountChance > 99) {
                amount++;
            }
        }
        for (let i = 0; i < amount; i++) {
            const tileObj = currentZone.getRandomTile();
            randomItem(tileObj);
        }
    }

    function placeDungeons() {
        for (let i = 0; i < dungeons.length; i++) {
            const dungeon = dungeons[i];
            const zone = region.getRandomZone();
            while (zone.id == "0_0") {
                zone = region.getRandomZone();
            }
            const tileObj = zone.getRandomTile();
            let dungeonObj = new Gate(dungeon.name, dungeon.type, dungeon.locked, tileObj);
            zone.areaTransition = dungeonObj;
            miniMap.tileAddClass(zone.id, dungeon.type);
        }
    }

    function placeKeys() {
        let amount = 250;
        for (let i = 0; i < amount; i++) {
            let zone = region.getRandomZone();
            while (zone.id == "0_0") {
                zone = region.getRandomZone();
            }
            const tileObj = zone.getRandomTile();
            const key = new Item(1, "key", 11, 3);
            tileObj.placeObject(key, "item", true);
        }
    }

    function randomEnemy(tileObj) {
        let type = getRandomArrayItem(enemyTypes);
        if (type == null) {
            console.log("Array is empty!");
            return;
        }
        const enemy = new Enemy(type.name, type.cls, type.life, type.strength, tileObj);
        tileObj.placeObject(enemy, "enemy", true);
    }

    function getRandomArrayItem(arr) {
        if (arr.length == 0) {
            return null;
        }
        let rnd = randomInteger(0, arr.length);
        return arr[rnd];
    }

    function randomItem(tileObj) {
        let collectable = getRandomArrayItem(loot);
        if (collectable == null) {
            console.log("Array is empty!");
            return;
        }
        while (!collectable.active) {
            collectable = getRandomArrayItem(loot);
        }
        if (collectable.max == 0) {
            collectable.active = false;
        } else {
            collectable.max--;
        }
        const rndAmount = randomInteger(1, collectable.maxStack);
        const item = new Item(rndAmount, collectable.cls, collectable.position.column, collectable.position.row);
        tileObj.placeObject(item, "item", true);
    }

    function collectItem(tileObj) {
        const collectableObj = inventory[tileObj.object.cls];
        collectableObj.count += tileObj.object.amount;
        collectableObj.element.textContent = collectableObj.count;
        tileObj.setEmpty();
    }

    function addPlayerControls() {
        document.addEventListener("keydown", function(evt) {
            if (evt.repeat || playerIsMoving) {
                return;
            }
            if (evt.key == "w" || evt.key == "ArrowUp") {
                move(currentZone, 0, -1, "0 -192px", "up");
            }
            if (evt.key == "s" || evt.key == "ArrowDown") {
                move(currentZone, 0, 1, "0 0", "down");
            }
            if (evt.key == "a" || evt.key == "ArrowLeft") {
                move(currentZone, -1, 0, "0 -64px", "left");
            }
            if (evt.key == "d" || evt.key == "ArrowRight") {
                move(currentZone, 1, 0, "0 -128px", "right");
            }
        })
    }

    function changeZone(x, y, playerPos) {
        let areaCoordinates = currentZone.coordinates();
        // let areaCoordinates = splitId(currentZone.id);
        if (areaCoordinates.y + y > region.size.up) {
            return;
        }
        if (areaCoordinates.y + y < region.size.down) {
            return;
        }
        if (areaCoordinates.x + x < region.size.left) {
            return;
        }
        if (areaCoordinates.x + x > region.size.right) {
            return;
        }
        areaCoordinates.y += y;
        areaCoordinates.x += x;
        miniMapActive(currentZone.id, false);
        buildZone(areaCoordinates.x + "_" + areaCoordinates.y);
        miniMapActive(currentZone.id, true);
        createPlayer(playerPos);
    }

    function move(gridObj, moveX, moveY, spritePos, direction) {
        let coordinate = splitId(playerTileObj.id);
        coordinate.x += moveX;
        coordinate.y += moveY;
        if (coordinate.y < 0) {
            changeZone(0, 1, currentZone.tiles.length - region.zoneSize.width + coordinate.x);
            return;
        }
        if (coordinate.y >= region.zoneSize.height) {
            changeZone(0, -1, coordinate.x);
            return;
        }
        if (coordinate.x < 0) {
            changeZone(-1, 0, coordinate.y * region.zoneSize.width + region.zoneSize.width - 1);
            return;
        }
        if (coordinate.x >= region.zoneSize.width) {
            changeZone(1, 0, coordinate.y * region.zoneSize.width);
            return;
        }
        let destinationTileObj = currentZone.getTileObj(coordinate.x + "_" + coordinate.y);
        if (destinationTileObj.type == "obstacle") {
            return;
        }
        playerIsMoving = true;
        player.element.style.backgroundPosition = spritePos;
        player.element.classList.add("animation-" + direction);
        if (destinationTileObj.type == "gate") {
            if (destinationTileObj.object.locked) {
                setTimeout(() => {
                    player.element.classList.add("attack");
                    setTimeout(() => {
                        player.element.classList.remove("attack");
                        player.element.classList.remove("animation-" + direction);
                        playerIsMoving = false;
                    }, playerAnimationTime / 2);
                }, playerAnimationTime / 2);
            }
            enterGate(destinationTileObj.object);
            return;
        }
        if (destinationTileObj.type == "enemy") {
            setTimeout(() => {
                player.element.classList.add("attack");
                effect.explosion.createHTML(destinationTileObj, 700);
                const enemyKilled = destinationTileObj.object.takeDamage(player.strength);
                if (enemyKilled) {
                    player.enemyKill();
                }
                setTimeout(() => {
                    player.element.classList.remove("attack");
                    player.element.classList.remove("animation-" + direction);
                    playerIsMoving = false;
                }, playerAnimationTime / 2);
            }, playerAnimationTime / 2);
            return;
        }
        setTimeout(() => {
            if (destinationTileObj.type == "item") {
                collectItem(destinationTileObj);
            }
            destinationTileObj.object = playerTileObj.object;
            playerTileObj = destinationTileObj;
            playerTileObj.element.append(playerTileObj.object.element);
            player.element.classList.remove("animation-" + direction);
            playerIsMoving = false;
        }, playerAnimationTime);
    }

    function splitId(id) {
        let coordinate = id.split("_");
        let obj = new Object();
        obj.x = parseInt(coordinate[0]);
        obj.y = parseInt(coordinate[1]);
        return obj;
    }

    // function getTileObj(gridObj, id) {
    //     for (let i = 0; i < gridObj.tiles.length; i++) {
    //         const obj = gridObj.tiles[i];
    //         if (obj.id == id) {
    //             return obj;
    //         }
    //     }
    // }

    function getIndexedTileObj(gridObj, tileIndex) {
        let index = tileIndex;
        const tilesLength = gridObj.tiles.length;
        if (index < 0 || index >= tilesLength) {
            return gridObj.tiles[0];
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