document.addEventListener("DOMContentLoaded", event => {
    //#region ZONE
    const background = document.getElementById("background");
    const zoneContainer = document.getElementById("zone-container");
    const miniMapContainer = document.getElementById("mini-map");
    const miniMapZoom = document.getElementById("mini-map-enlarger");

    // Start screen elements
    const startScreen = document.getElementById("start-screen");
    const startForm = document.getElementById("start-form");

    // GAME OVER screen
    const gameOverScreen = document.getElementById("game-over-screen");

    gameStarted = false;

    let player;
    let playerIsMoving = false;
    let playersTurn = true;
    let battleQueue = [];
    let turnIndex = 0;

    let region;
    let miniMap;
    let currentZone = undefined;

    let enemiesInZone = 0;
    let zoneLocked = false;

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
        getRandomZone(includeStartZone = false) {
            if (this.zones.length == 0) {
                return null;
            }
            let rnd = randomInteger(0, this.zones.length);
            if (!includeStartZone) {
                while (this.zones[rnd].id == "0_0") {
                    rnd = randomInteger(0, this.zones.length);
                }
            }
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
        getTileObjFromIndex(index) {
            if (index < 0 || index >= this.tiles.length) {
                return this.tiles[0];
            }
            return this.tiles[index];
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
                this.element.className = "zone__tile zone__empty";
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
            tileElm.classList.add("zone__tile");
            tileElm.classList.add(`zone__${this.type}`);
            if (this.name != "none") {
                tileElm.classList.add(`zone__${this.name}`);
            }
            this.element = tileElm;
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
            if (this.element) {
                this.element.className = "zone__tile zone__empty";
            }
        }
        coordinates() {
            let coordinate = this.id.split("_");
            let obj = new Object();
            obj.x = parseInt(coordinate[0]);
            obj.y = parseInt(coordinate[1]);
            return obj;
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
            const zoneHeight = this.region.size.up + 1 - this.region.size.down;
            const zoneWidth = this.region.size.right + 1 - this.region.size.left;
            const width = height / zoneHeight * zoneWidth;
            this.zoomedInHeight = height / zoneHeight;
            this.zoomedInWidth = width / zoneWidth;
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

    class Character {
        constructor(name, moveTime, attackTime, life, strength, currentTile, onDeath) {
            this.name = name;
            this.moveTime = moveTime;
            this.attackTime = attackTime;
            this.life = life;
            this.totalLife = life;
            this.strength = strength;
            this.currentTile = currentTile;
            this.element = null;
            this.isDead = false;
            this.onDeath = onDeath;
        }
        setMoveTime() {
            this.element.style.animationDuration = `${this.moveTime}ms`;
        }
        setAttackTime() {
            this.element.style.animationDuration = `${this.attackTime}ms`;
        }
        addLife(amount) {
            this.life += amount;
            if (this.life <= 0) {
                this.life = 0;
                this.isDead = true;
                this.onDeath(this);
            }
            if (this.life > this.totalLife) {
                this.life = this.totalLife;
            }
        }
        takeDamage(damage) {
            if (damage <= 0) {
                return;
            }
            this.addLife(-damage);
        }
    }

    class Player extends Character {
        constructor(name, moveTime, attackTime, life, strength, armor, lifeElm, strengthElm, armorElm, currentTile, onDeath) {
            super(name, moveTime, attackTime, life, strength, currentTile, onDeath);
            this.armor = armor;
            this.lifeElm = lifeElm;
            this.strengthElm = strengthElm;
            this.armorElm = armorElm;
            this.killCount = 0;
            this.initialize();
        }
        initialize() {
            this.lifeElm.textContent = this.life;
            this.strengthElm.textContent = this.strength;
            this.armorElm.textContent = this.armor;
            this.element = document.createElement("DIV");
            this.element.classList.add("player");
            this.element.classList.add("animation");
            this.element.classList.add("tile__object");
            this.element.innerHTML = `<div class="tooltip">${this.name}</div>`;
        }
        setInteractTime() {
            this.element.style.animationDuration = `${this.interactTime}ms`;
        }
        addLife(amount) {
            super.addLife(amount);
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
            super.takeDamage(amount - this.armor);
        }
    }

    class Enemy extends Character {
        constructor(name, moveTime, attackTime, life, strength, cls, currentTile, onDeath) {
            super(name, moveTime, attackTime, life, strength, currentTile, onDeath);
            this.totalLife = life;
            this.cls = cls;
            this.elmBar;
            this.elmBarText;
        }

        createHTML() {
            let enemyHTML = document.createElement("DIV");
            enemyHTML.classList.add("enemy");
            enemyHTML.classList.add(this.cls);
            enemyHTML.classList.add("animation");
            enemyHTML.classList.add("tile__object");
            enemyHTML.style.animationDuration = `${this.animationTime}ms`;
            let healthbar = document.createElement("DIV");
            let bar = document.createElement("DIV");
            let barText = document.createElement("SPAN");
            healthbar.classList.add("healthbar");
            bar.classList.add("bar");
            bar.style.width = `${this.life / this.totalLife * 100}%`;
            barText.classList.add("bar__text");
            barText.textContent = `${this.life} / ${this.totalLife}`;
            healthbar.append(bar);
            healthbar.append(barText);
            enemyHTML.append(healthbar);
            enemyHTML.insertAdjacentHTML("beforeend", `<div class="tooltip">${this.name}</div>`);
            this.element = enemyHTML;
            this.elmBar = bar;
            this.elmBarText = barText;
            return enemyHTML;
        }

        takeDamage(damage) {
            super.takeDamage(damage);
            this.elmBar.style.width = `${this.life / this.totalLife * 100}%`;
            this.elmBarText.textContent = `${this.life} / ${this.totalLife}`;
            if (this.life <= 0) {
                this.currentTile.removeObject(this.element);
                return true;
            }
            return false;
        }
    }

    class Item {
        constructor(amount, cls, posX, posY, callback) {
            this.amount = amount;
            this.cls = cls;
            this.posX = posX * 64;
            this.posY = posY * 64;
            this.callback = callback;
        }
        createHTML() {
            let item = document.createElement("DIV");
            item.classList.add("item");
            // item.classList.add(this.cls);
            item.style.backgroundPosition = `-${this.posX}px -${this.posY}px`;
            item.classList.add("tile__object");
            return item;
        }
        collect(tileObj) {
            tileObj.setEmpty();
            this.callback(this);
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

    let enemyTypes = [{
            name: "Skeleton",
            cls: "skeleton",
            life: 20,
            strength: 5,
            totalCount: 0,
            moveTime: 500,
            attackTime: 300,
        },
        {
            name: "Orc",
            cls: "orc",
            life: 50,
            strength: 8,
            totalCount: 0,
            moveTime: 1000,
            attackTime: 400,
        },
    ]

    // *********************************************************************************************
    // *********************************************************************************************
    // ************************ TODO: CHANGE TO CLASS (INSTEAD OF AN OBJECT) ***********************
    // *********************************************************************************************
    // *********************************************************************************************

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

    let collectables = {
        coins: {
            name: "coin",
            count: 0,
            spriteCoordinates: { x: 3, y: 3 },
            includeInStartZone: true,
            stacks: 100,
            maxStackAmount: 30,
            totalStackAmount: 0,
            iconElement: document.getElementById("coin-icon"),
            element: document.getElementById("coin-count"),
            onCollect: function(item) {
                console.log(this);
                collectables.coins.count += item.amount;
                collectables.coins.element.textContent = collectables.coins.count;
            }
        },
        keys: {
            name: "key",
            count: 0,
            spriteCoordinates: { x: 6, y: 0 },
            includeInStartZone: false,
            stacks: 6,
            maxStackAmount: 1,
            iconElement: document.getElementById("key-icon"),
            element: document.getElementById("key-count"),
            onCollect: function(item) {
                collectables.keys.count += item.amount;
                collectables.keys.element.textContent = collectables.keys.count;
            }
        },
        weapons: {
            name: "strength",
            count: 0,
            spriteCoordinates: { x: 1, y: 2 },
            includeInStartZone: false,
            stacks: 40,
            maxStackAmount: 3,
            iconElement: document.getElementById("strength-icon"),
            element: document.getElementById("strength-count"),
            onCollect: function(item) {
                player.addStrength(item.amount);
            }
        },
        armors: {
            name: "armor",
            count: 0,
            spriteCoordinates: { x: 5, y: 0 },
            includeInStartZone: false,
            stacks: 40,
            maxStackAmount: 3,
            iconElement: document.getElementById("armor-icon"),
            element: document.getElementById("armor-count"),
            onCollect: function(item) {
                player.addArmor(item.amount);
            }
        },
        potions: {
            name: "life",
            count: 0,
            spriteCoordinates: { x: 3, y: 4 },
            includeInStartZone: false,
            stacks: 300,
            maxStackAmount: 50,
            iconElement: document.getElementById("life-icon"),
            element: document.getElementById("life-count"),
            onCollect: function(item) {
                player.addLife(item.amount);
            }
        },
    }

    let startFormLabelText = "";
    startForm.addEventListener("submit", function(evt) {
        evt.preventDefault();
        const startFormName = startForm.querySelector("#start-form-name");
        const startFormLabel = startForm.querySelector("#start-form-label");
        if (startFormLabelText == "") {
            startFormLabelText = startFormLabel.textContent;
        }
        if (startFormName.value == "") {
            startFormLabel.textContent = startFormLabelText + " - Please fill out!";
            startFormLabel.classList.add("js-invalid");
            startFormName.addEventListener("keyup", keyListen);

            function keyListen() {
                startFormLabel.textContent = startFormLabelText;
                startFormLabel.classList.remove("js-invalid");
                console.log("hello")
                startFormName.removeEventListener("keyup", keyListen);
            }
            return false;
        }
        newGame(startFormName.value);
        startScreen.classList.add("js-hidden");
    });
    document.addEventListener("keyup", function(evt) {
        if (gameStarted && evt.key == "m") {
            miniMap.zoomToggle();
        }
    });

    function uiIcon(collectable) {
        const x = collectable.spriteCoordinates.x * 64;
        const y = collectable.spriteCoordinates.y * 64;
        console.log(collectable.spriteCoordinates)
        collectable.iconElement.style.backgroundPosition = `-${x}px -${y}px`;
    }

    function newGame(playerName) {
        const regionSize = new Direction(11, 14, 11, 14);
        const zoneSize = new Dimension(7, 7);
        region = new Region("home", "outdoor", zoneContainer, regionSize, zoneSize, 64, worlds.home.bioms);
        miniMap = new MiniMap(region, miniMapContainer, miniMapZoom);
        const lifeUIElm = collectables.potions.element;
        const strengthUIElm = collectables.weapons.element;
        const armorUIElm = collectables.armors.element;
        player = new Player(playerName, 150, 150, 100, 10, 0, lifeUIElm, strengthUIElm, armorUIElm, null, gameOver);
        for (let i = 0; i < Object.values(collectables).length; i++) {
            const value = Object.values(collectables)[i];
            uiIcon(value);
        }
        buildMap();
        buildZone("0_0");
        placePlayer(getCenterTileIndex());
        addPlayerControls();
        setEvent();
        gameStarted = true;

        //CHEATS!!!
        // ui.key.count++;
        // ui.key.element.textContent = ui.key.count;
    }

    function gameOver(playerObj) {
        gameOverScreen.classList.remove("js-hidden");
        setTimeout(() => {
            gameOverScreen.classList.add("js-hidden");
            startScreen.classList.remove("js-hidden");
        }, 3000);
        calmEvent();
    }

    function enterGate(areaObj) {
        if (areaObj.locked) {
            if (collectables.keys.count > 0) {
                collectables.keys.count--;
                collectables.keys.element.textContent = collectables.keys.count;
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
        placeEnemies();

        //INSERT ENEMIES MANUALLY FOR TESTING PURPOSES
        // const zone = region.getZone("0_0");
        // const tileObj2 = zone.getTileObj("2_2");
        // placeEnemy(tileObj2, enemyTypes[1]);
        // const tileObj = zone.getTileObj("2_1");
        // placeEnemy(tileObj, enemyTypes[1]);

        //Loop through all items and place them randomly in the world (Coins, Keys, Weapons, Armors, Potions, etc.)
        for (let i = 0; i < Object.keys(collectables).length; i++) {
            const key = Object.keys(collectables)[i];
            placeCollectables(collectables[key]);
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
        region.addZone(currentZone);
    }

    function buildZone(id) {
        region.element.innerHTML = "";
        currentZone = region.getZone(id);
        region.setBiom(currentZone.biom);
        for (let i = 0; i < region.bioms.length; i++) {
            const biom = region.bioms[i];
            background.classList.remove(biom);
        }
        background.classList.add(currentZone.biom);
        enemiesInZone = 0;
        for (let i = 0; i < currentZone.tiles.length; i++) {
            const tileObj = currentZone.tiles[i];
            region.element.append(tileObj.createHTML());
            if (tileObj.object != null) {
                if (tileObj.type == "enemy") {
                    tileObj.placeHTML(tileObj.object.createHTML());
                    battleQueue.push(tileObj.object);
                    enemiesInZone++;
                }
                if (tileObj.type == "item") {
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

    function setEvent() {
        if (enemiesInZone > 0) {
            combatEvent();
        } else {
            calmEvent();
        }
    }

    function calmEvent() {
        zoneLocked = false;
        playersTurn = true;
        turnIndex = -1;
        battleQueue = [];
        background.classList.remove("battle");
    }

    function combatEvent() {
        zoneLocked = true;
        playersTurn = false;
        turnIndex = -1;
        background.classList.add("battle");
        battleQueue.push(player.currentTile.object);
        shuffleArray(battleQueue);
        nextTurn();
    }

    function nextTurn() {
        turnIndex++;
        if (turnIndex >= battleQueue.length) {
            turnIndex = 0;
        }
        if (battleQueue[turnIndex] == player.currentTile.object) {
            playersTurn = true;
            console.log("Players turn");
        } else {
            playersTurn = false;
            enemyTurn(battleQueue[turnIndex]);
        }
    }

    function enemyTurn(enemyObj) {
        console.log("Enemys turn");
        if (battleQueue.length > 0) {
            if (enemyObj.life == 0) {
                nextTurn();
                return;
            }
            const moveDirection = getMoveDirection(enemyObj, player);
            const destinationTileObj = adjacentTile(enemyObj.currentTile, moveDirection);
            enemyMove(enemyObj, moveDirection, destinationTileObj);
        } else {
            console.log("Battle ended");
        }
    }

    //Enemy AI movement
    function getMoveDirection(sourceObj, targetObj) {
        const sourceTile = sourceObj.currentTile;
        const targetTile = targetObj.currentTile;
        const sourceCoordinates = sourceTile.coordinates();
        const targetCoordinates = targetTile.coordinates();
        let moveDirection;

        if (targetCoordinates.x > sourceCoordinates.x) {
            moveDirection = "right";
        } else if (targetCoordinates.y > sourceCoordinates.y) {
            moveDirection = "down";
        }
        if (targetCoordinates.x < sourceCoordinates.x) {
            moveDirection = "left";
        } else if (targetCoordinates.y < sourceCoordinates.y) {
            moveDirection = "up";
        }
        return moveDirection;
    }

    function enemyMove(enemyObj, direction, destinationTileObj) {
        enemyObj.currentTile.element.classList.add("attacking");
        setTimeout(() => {
            enemyObj.element.classList.add("animation-" + direction);
            if (destinationTileObj == player.currentTile) {
                enemyObj.setAttackTime();
                halfWayMove(enemyObj.element, enemyObj.attackTime, direction, function() {
                    effect.explosion.createHTML(destinationTileObj, 700);
                    const playerKilled = destinationTileObj.object.takeDamage(enemyObj.strength);
                    if (playerKilled) {
                        console.log("Player is very dead!!!");
                    }
                }, function() {
                    if (!destinationTileObj.object.isDead) {
                        nextTurn();
                    }
                    enemyObj.currentTile.element.classList.remove("attacking");
                });
            } else {
                enemyObj.setMoveTime();
                fullMove(enemyObj.element, enemyObj.moveTime, direction, function() {
                    const currentTile = enemyObj.currentTile;
                    // destinationTileObj.object = enemyObj;
                    enemyObj.currentTile = destinationTileObj;
                    // enemyObj.currentTile.element.append(enemyObj.element);
                    destinationTileObj.placeObject(enemyObj, "enemy", true);
                    destinationTileObj.placeHTML(enemyObj.element);
                    currentTile.setEmpty();
                }, function() {
                    enemyObj.element.classList.remove("animation-" + direction);
                    enemyObj.currentTile.element.classList.remove("attacking");
                    setTimeout(() => {
                        nextTurn();
                    }, 500);
                });
            }
        }, 500);
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = randomInteger(0, arr.length);
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }

    function miniMapHTML(id, biom) {
        let activeClass = "fog-of-war";
        // let activeClass = "";
        if (id == "0_0") {
            activeClass = "active";
        }
        const miniMapSection = `
            <div id="minimap_${id}" class="mini-map__tile ${biom} ${activeClass}"></div>
        `;
        miniMapContainer.insertAdjacentHTML("beforeend", miniMapSection);
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

    function getCenterTileIndex() {
        if (currentZone.tiles.length == 0) {
            console.log("Something is very wrong!");
            return;
        }
        return Math.floor(currentZone.tiles.length / 2);
    }

    function placePlayer(tileIndex) {
        let tileObj = currentZone.getTileObjFromIndex(tileIndex);
        if (tileObj.element == undefined) {
            console.log("No element attached to tileObj!");
            return;
        }
        tileObj.setEmpty();
        tileObj.element.innerHTML = "";
        tileObj.object = player;
        tileObj.element.append(tileObj.object.element);
        player.currentTile = tileObj;
    }

    function placeEnemies() {
        let amount = 500;
        for (let i = 0; i < amount; i++) {
            const zone = region.getRandomZone();
            const tileObj = zone.getRandomTile();
            randomEnemy(tileObj);
        }
        console.log("Skeletons: " + enemyTypes[0].totalCount + ", Orcs: " + enemyTypes[1].totalCount);
    }

    function placeCollectables(collectable) {
        collectable.totalStackAmount = 0;
        for (let i = 0; i < collectable.stacks; i++) {
            const zone = region.getRandomZone(collectable.includeInStartZone);
            const tileObj = zone.getRandomTile();
            const rndAmount = randomInteger(1, collectable.maxStackAmount);
            const coin = new Item(rndAmount, collectable.name, collectable.spriteCoordinates.x, collectable.spriteCoordinates.y, collectable.onCollect);
            tileObj.placeObject(coin, "item", true);
            collectable.totalStackAmount += rndAmount;
        }
        console.log(collectable.name + "'s total: " + collectable.totalStackAmount);
    }

    function placeDungeons() {
        for (let i = 0; i < dungeons.length; i++) {
            const dungeon = dungeons[i];
            const zone = region.getRandomZone();
            const tileObj = zone.getRandomTile();
            let dungeonObj = new Gate(dungeon.name, dungeon.type, dungeon.locked, tileObj);
            zone.areaTransition = dungeonObj;
            miniMap.tileAddClass(zone.id, dungeon.type);
        }
    }

    function randomEnemy(tileObj) {
        let type = getRandomArrayItem(enemyTypes);
        placeEnemy(tileObj, type);
    }

    function placeEnemy(tileObj, type) {
        if (type == null) {
            console.log("Array is empty!");
            return;
        }
        const enemy = new Enemy(type.name, type.moveTime, type.attackTime, type.life, type.strength, type.cls, tileObj, enemyDeath);
        tileObj.setEmpty();
        tileObj.placeObject(enemy, "enemy", true);
        type.totalCount++;
    }

    function enemyDeath(enemy) {
        console.log("Enemy: " + enemy.name);
    }

    function getRandomArrayItem(arr) {
        if (arr.length == 0) {
            return null;
        }
        let rnd = randomInteger(0, arr.length);
        return arr[rnd];
    }

    function addPlayerControls() {
        document.addEventListener("keydown", function(evt) {
            if (evt.repeat || !playersTurn || playerIsMoving) {
                return;
            }
            let moveSuccess;
            if (evt.key == "w" || evt.key == "ArrowUp") {
                moveSuccess = playerMove(0, -1, player.element, "up");
                player.element.style.backgroundPosition = "0 -192px";
            }
            if (evt.key == "s" || evt.key == "ArrowDown") {
                moveSuccess = playerMove(0, 1, player.element, "down");
                player.element.style.backgroundPosition = "0 0";
            }
            if (evt.key == "a" || evt.key == "ArrowLeft") {
                moveSuccess = playerMove(-1, 0, player.element, "left");
                player.element.style.backgroundPosition = "0 -64px";
            }
            if (evt.key == "d" || evt.key == "ArrowRight") {
                moveSuccess = playerMove(1, 0, player.element, "right");
                player.element.style.backgroundPosition = "0 -128px";
            }
        })
    }

    function changeZone(x, y, playerPos) {
        if (zoneLocked) {
            return;
        }
        let areaCoordinates = currentZone.coordinates();
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
        placePlayer(playerPos);
        setEvent();
    }

    function adjacentTile(currentTileObj, direction) {
        let idObj = currentTileObj.coordinates();
        switch (direction) {
            case "up":
                idObj.y--;
                if (idObj.y < 0) {
                    return false;
                }
                break;
            case "down":
                idObj.y++;
                if (idObj.y >= region.zoneSize.height) {
                    return false;
                }
                break;
            case "right":
                idObj.x++;
                if (idObj.x >= region.zoneSize.width) {
                    return false;
                }
                break;
            case "left":
                idObj.x--;
                if (idObj.x < 0) {
                    return false;
                }
                break;

            default:
                break;
        }
        return currentZone.getTileObj(idObj.x + "_" + idObj.y);
    }

    function playerMove(moveX, moveY, element, direction) {
        let coordinate = player.currentTile.coordinates();
        coordinate.x += moveX;
        coordinate.y += moveY;
        if (coordinate.y < 0) {
            changeZone(0, 1, currentZone.tiles.length - region.zoneSize.width + coordinate.x);
            return false;
        }
        if (coordinate.y >= region.zoneSize.height) {
            changeZone(0, -1, coordinate.x);
            return false;
        }
        if (coordinate.x < 0) {
            changeZone(-1, 0, coordinate.y * region.zoneSize.width + region.zoneSize.width - 1);
            return false;
        }
        if (coordinate.x >= region.zoneSize.width) {
            changeZone(1, 0, coordinate.y * region.zoneSize.width);
            return false;
        }
        let destinationTileObj = currentZone.getTileObj(coordinate.x + "_" + coordinate.y);
        if (destinationTileObj.type == "obstacle") {
            return false;
        }
        playerIsMoving = true;
        if (destinationTileObj.type == "gate") {
            player.setInteractTime();
            if (destinationTileObj.object.locked) {
                halfWayMove(element, player.interactTime, direction, null, function() {
                    playerIsMoving = false;
                });
            }
            enterGate(destinationTileObj.object);
            return true;
        }
        if (destinationTileObj.type == "enemy") {
            player.setAttackTime();
            halfWayMove(element, player.attackTime, direction, function() {
                effect.explosion.createHTML(destinationTileObj, 700);
                const enemyKilled = destinationTileObj.object.takeDamage(player.strength);
                if (enemyKilled) {
                    player.enemyKill();
                    enemiesInZone--;
                    if (enemiesInZone <= 0) {
                        enemiesInZone = 0;
                        calmEvent();
                    }
                }
            }, function() {
                playerIsMoving = false;
                if (battleQueue.length > 0) {
                    nextTurn();
                }
            });
            return false;
        }
        player.setMoveTime();
        fullMove(element, player.moveTime, direction, function() {
            if (destinationTileObj.type == "item") {
                destinationTileObj.object.collect(destinationTileObj);
            }
            destinationTileObj.object = player.currentTile.object;
            player.currentTile = destinationTileObj;
            player.currentTile.element.append(player.currentTile.object.element);
        }, function() {
            playerIsMoving = false;
            if (battleQueue.length > 0) {
                nextTurn();
            }
        });
        return true;
    }

    function fullMove(element, animationTime, direction, beforeDestinationReach, destinationReached) {
        element.classList.add("animation-" + direction);
        setTimeout(() => {
            if (beforeDestinationReach) {
                beforeDestinationReach();
            }
            element.classList.remove("animation-" + direction);
            if (destinationReached) {
                destinationReached();
            }
        }, animationTime);
    }

    function halfWayMove(element, animationTime, direction, halfWayThere, destinationReached) {
        element.classList.add("animation-" + direction);
        setTimeout(() => {
            element.classList.add("animation-revert");
            if (halfWayThere) {
                halfWayThere();
            }
            setTimeout(() => {
                element.classList.remove("animation-revert");
                element.classList.remove("animation-" + direction);
                if (destinationReached) {
                    destinationReached();
                }
            }, animationTime / 2);
        }, animationTime / 2);
    }
    //#endregion ZONE

    function randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
});