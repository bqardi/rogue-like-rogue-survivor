document.addEventListener("DOMContentLoaded", event => {
    //#region CHEATS/TEST SETTINGS
    const cheatsOn = true;
    const cheatKey = true;
    const cheatWeapon = true;
    const cheatMoney = 99999;
    const startVolume = 0.0;
    //#endregion CHEATS/TEST SETTINGS

    //#region ZONE
    const background = document.getElementById("background");
    const zoneContainer = document.getElementById("zone-container");
    const miniMapContainer = document.getElementById("mini-map");
    const miniMapZoom = document.getElementById("mini-map-enlarger");
    const actions = document.getElementById("actions");
    const settings = document.getElementById("settings");
    const nightOverlay = document.getElementById("night-overlay");

    // Start screen elements
    const welcomeScreen = document.getElementById("welcome-screen");
    const startScreen = document.getElementById("start-screen");
    const startForm = document.getElementById("start-form");
    const startFormName = document.getElementById("start-form-name");
    const startFormContinue = document.getElementById("start-form-continue");
    const startFormOptions = document.getElementById("start-form-options");
    const optionsScreen = document.getElementById("options-screen");
    // const optionsForm = document.getElementById("options-form");
    const optionsFormBack = document.getElementById("options-form-back");
    const optionsFormMusic = document.getElementById("options-form-music");
    const optionsFormSfx = document.getElementById("options-form-sfx");
    const optionsFormExit = document.getElementById("options-form-exit");

    // GAME OVER screen
    const gameOverScreen = document.getElementById("game-over-screen");

    // BATTLE QUEUE screen
    const battleQueueElement = document.getElementById("battle-queue");

    // GAME MENU
    const gameMenu = document.getElementById("game-menu");
    const menuButtons = document.querySelectorAll(".game-menu-button");
    gameMenu.style.display = "flex";
    const gameMenuRect = {
        width: gameMenu.getBoundingClientRect().width,
        height: gameMenu.getBoundingClientRect().height,
    }
    gameMenu.style.display = "";
    let menuActive = false;
    let inventoryActive = false;
    let menuButtonIndex = 0;

    //Animation frame variables
    let lastTime;
    let animFrame;
    let deltaTime;
    let engineActive = true;
    let torchEquipping = false;
    let torchUnEquipping = false;
    let torchEquipTimeCurrent = 0;
    const torchEquipTime = 0.3;

    //Animation frame tick/timer variables
    const ticksPerSecond = 10;
    const tickTime = 1 / ticksPerSecond;
    let tick = 0;
    let tTime = 0;

    //Inventory
    const inventory = document.getElementById("inventory");
    const inventoryGrid = document.getElementById("inventory-grid");

    //UI
    const ui = {
        life: {
            icon: document.getElementById("life-icon"),
            count: document.getElementById("life-count"),
            sprite: { x: 3, y: 4 },
        },
        strength: {
            icon: document.getElementById("strength-icon"),
            count: document.getElementById("strength-count"),
            sprite: { x: 1, y: 2 },
        },
        armor: {
            icon: document.getElementById("armor-icon"),
            count: document.getElementById("armor-count"),
            sprite: { x: 1, y: 3 },
        },
        coins: {
            icon: document.getElementById("coin-icon"),
            count: document.getElementById("coin-count"),
            sprite: { x: 3, y: 3 },
        },
        backpack: {
            icon: document.getElementById("backpack-icon"),
            count: document.getElementById("backpack"),
            sprite: { x: 2, y: 1 },
        },
    }

    const tileSize = 48;

    gameStarted = false;

    let player;

    const actionPoints = {
        current: 5,
        start: 5,
        max: 10,
    }

    let playerIsMoving = false;
    let playersTurn = true;
    let battleQueue = [];
    let pathFindingGrid = [];

    let currentWorld;
    let region;
    let miniMap;
    let currentZone = undefined;
    let dayTime;

    let enemiesInZone = 0;
    let zoneLocked = false;

    //Audio settings
    let sfxVolume = startVolume;

    let enemyType = {
        skeleton: {
            name: "Skeleton",
            cls: "skeleton",
            life: 20,
            strength: 5,
            totalCount: 0,
            moveTime: 200,
            attackTime: 200,
            actionPoints: {
                current: 3,
                start: 3,
                max: 5,
            },
            spcAtckInfo: "None",
            sfxs: ["MONSTER_Ugh_02_mono.ogg", "MONSTER_Ugh_01_mono.ogg", "MONSTER_Ugh_04_mono.ogg"],
            specialAttack: function() {
                //Nothing
            },
            enemyDeath: function(enemy) {
                //Nothing
            }
        },
        orc: {
            name: "Orc",
            cls: "orc",
            life: 50,
            strength: 8,
            totalCount: 0,
            moveTime: 300,
            attackTime: 200,
            actionPoints: {
                current: 2,
                start: 2,
                max: 4,
            },
            spcAtckInfo: "None",
            sfxs: ["MONSTER_Ugh_02_mono.ogg", "MONSTER_Grunt_Short_02_mono.ogg"],
            specialAttack: function() {
                //Nothing
            },
            enemyDeath: function(enemy) {
                //Nothing
            }
        },
        goblin: {
            name: "Goblin",
            cls: "goblin",
            life: 12,
            strength: 2,
            totalCount: 0,
            moveTime: 150,
            attackTime: 180,
            actionPoints: {
                current: 4,
                start: 4,
                max: 7,
            },
            spcAtckInfo: "Steal money or double damage",
            sfxs: ["CREATURE_Squeel_05_mono.ogg", "CREATURE_Squeel_03_mono.ogg", "CREATURE_Squeel_04_mono.ogg"],
            specialAttack: function() {
                if (player.hasCoins(5)) {
                    player.removeCoins(5);
                } else {
                    player.takeDamage(this.strength);
                }
            },
            enemyDeath: function(enemy) {
                //Nothing
            }
        },
    }

    const worlds = {
        outdoor: {
            name: "La La Land",
            type: "outdoor",
            locked: false,
            bioms: ["forest", "desert", "snow"],
            obstacles: ["tree", "rock"],
            region: null,
            miniMap: null,
            size: {
                up: 11,
                right: 14,
                down: 11,
                left: 14,
            },
            zoneSize: 7,
            gateWaysTo: function() {
                return [worlds.kartansLair, worlds.dungeonOfMachlain, worlds.orchsCave, worlds.piratesLair]
            },
            enemyPercentage: 50,
            enemyTypes: [enemyType.skeleton, enemyType.orc, enemyType.goblin],
        },
        kartansLair: {
            name: "Kartans Lair",
            type: "dungeon",
            locked: true,
            bioms: ["floor"],
            obstacles: ["pillar", "barrel"],
            region: null,
            miniMap: null,
            size: {
                up: 5,
                right: 5,
                down: 5,
                left: 5,
            },
            zoneSize: 7,
            gateWaysTo: function() {
                return [worlds.outdoor]
            },
            enemyPercentage: 75,
            enemyTypes: [enemyType.skeleton, enemyType.orc, enemyType.goblin],
        },
        dungeonOfMachlain: {
            name: "The Dungeon of Machlain",
            type: "dungeon",
            locked: true,
            bioms: ["floor"],
            obstacles: ["pillar", "barrel"],
            region: null,
            miniMap: null,
            size: {
                up: 5,
                right: 5,
                down: 5,
                left: 5,
            },
            zoneSize: 7,
            gateWaysTo: function() {
                return [worlds.outdoor]
            },
            enemyPercentage: 65,
            enemyTypes: [enemyType.skeleton, enemyType.orc, enemyType.goblin],
        },
        orchsCave: {
            name: "Orchs cave",
            type: "dungeon",
            locked: true,
            bioms: ["floor"],
            obstacles: ["pillar", "barrel"],
            region: null,
            miniMap: null,
            size: {
                up: 5,
                right: 5,
                down: 5,
                left: 5,
            },
            zoneSize: 7,
            gateWaysTo: function() {
                return [worlds.outdoor]
            },
            enemyPercentage: 70,
            enemyTypes: [enemyType.orc],
        },
        piratesLair: {
            name: "Pirates Lair",
            type: "dungeon",
            locked: true,
            bioms: ["floor"],
            obstacles: ["pillar", "barrel"],
            region: null,
            miniMap: null,
            size: {
                up: 5,
                right: 5,
                down: 5,
                left: 5,
            },
            zoneSize: 7,
            gateWaysTo: function() {
                return [worlds.outdoor]
            },
            enemyPercentage: 75,
            enemyTypes: [enemyType.skeleton, enemyType.goblin],
        }
    }

    class SFX {
        constructor(audioFile, volume, playInstantly = true) {
            this.audioFile = audioFile;
            this.initialize(volume, playInstantly);
        }
        initialize(volume, playInstantly) {
            this.audio = new Audio(this.audioFile);
            this.audio.volume = volume;
            if (playInstantly) {
                this.play();
            }
        }
        play() {
            this.audio.play();
            this.audio.onended = function() {
                this.audio = null;
            }
        }
    }

    class Music {
        constructor(audioFile, volume) {
            this.audioFile = audioFile;
            this.volume = volume;
            this.initialize();
        }
        initialize() {
            this.audio = new Audio(this.audioFile);
            this.audio.volume = this.volume;
            this.audio.loop = true;
        }
        play() {
            this.audio.play();
        }
        pause() {
            this.audio.pause();
        }
        stop() {
            this.pause();
            this.audio.currentTime = 0;
        }
        setVolume(volume) {
            this.volume = volume;
            this.audio.volume = this.volume;
        }
        fadeIn(onFaded) {
            let volume = 0;
            this.audio.volume = volume;
            this.play();
            let interval = setInterval(() => {
                volume += 0.05;
                if (volume >= this.volume) {
                    volume = this.volume;
                    this.audio.volume = volume;
                    clearInterval(interval);
                    if (onFaded) {
                        onFaded();
                    }
                    return;
                }
                this.audio.volume = volume;
            }, 50);
        }
        fadeOut(onFaded) {
            let volume = this.audio.volume;
            let interval = setInterval(() => {
                volume -= 0.05;
                if (volume <= 0) {
                    this.audio.volume = 0;
                    this.stop();
                    clearInterval(interval);
                    if (onFaded) {
                        onFaded();
                    }
                    return;
                }
                this.audio.volume = volume;
            }, 50);
        }
    }

    class Region {
        constructor(world, backgroundElement, element, tileSize) {
            this.name = world.name;
            this.type = world.type;
            this.bioms = world.bioms;
            this.enemyPercentage = world.enemyPercentage;
            this.zones = [];
            this.enemies = [];
            this.backgroundElement = backgroundElement;
            this.element = element;
            this.size = world.size;
            this.zoneSize = world.zoneSize;
            this.tileSize = tileSize;
            this.initialize();
        }
        initialize() {
            this.size.down = -Math.abs(this.size.down);
            this.size.left = -Math.abs(this.size.left);
            this.element.style.gridTemplateColumns = `repeat(${this.zoneSize}, ${this.tileSize}px)`;
            this.element.style.gridAutoRows = `${this.tileSize}px`;
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
        setBiom(biomClass, updateHTML) {
            if (updateHTML) {
                this.removeBiomHTML();
            }
            this.backgroundElement.classList.add(biomClass);
            this.biom = biomClass;
        }
        removeBiomHTML() {
            for (let i = 0; i < this.bioms.length; i++) {
                const biom = this.bioms[i];
                this.backgroundElement.classList.remove(biom);
            }
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
        constructor(id, element, explored, biom) {
            this.id = id;
            this.element = element;
            this.explored = explored;
            this.biom = biom;
            this.tiles = [];
            this.initialize();
            this.edgeClass = null;
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
        getRandomTile(onlyAtCenter = false) {
            if (this.tiles.length == 0) {
                return null;
            }
            let rnd = randomInteger(0, this.tiles.length);
            if (onlyAtCenter) {
                while (this.tiles[rnd].occupied || !this.centerTile(this.tiles[rnd])) {
                    rnd = randomInteger(0, this.tiles.length);
                }
            } else {
                while (this.tiles[rnd].occupied) {
                    rnd = randomInteger(0, this.tiles.length);
                }
            }
            return this.tiles[rnd];
        }
        centerTile(tileObj) {
            const coordinate = tileObj.coordinates();
            if (coordinate.y == 0) {
                return false;
            }
            if (coordinate.x == 0) {
                return false;
            }
            if (coordinate.y == currentWorld.zoneSize - 1) {
                return false;
            }
            if (coordinate.x == currentWorld.zoneSize - 1) {
                return false;
            }
            return true;
        }
        coordinates() {
            let coordinate = this.id.split("_");
            let obj = new Object();
            obj.x = parseInt(coordinate[0]);
            obj.y = parseInt(coordinate[1]);
            return obj;
        }
        addEdge(edgeClass) {
            this.edgeClass = edgeClass;
        }
        updateHTML() {
            this.element.className = "zone";
            if (this.edgeClass != null) {
                this.element.classList.add(this.edgeClass);
            }
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
            this.enlarged = false;
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
            this.enlarged = true;
        }
        zoomOut() {
            this.element.style.gridTemplateColumns = `repeat(${this.region.width}, ${this.region.zoneSize}px)`;
            this.element.style.gridAutoRows = `${this.region.zoneSize}px`;
            this.enlarged = false;
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
        constructor(world, tileObj) {
            this.world = world;
            this.id = world.name;
            this.cls = world.type;
            this.locked = world.locked;
            this.tileObj = tileObj;
            this.initialize();
        }
        initialize() {
            this.tileObj.object = this;
            this.tileObj.type = "gate";
            this.tileObj.occupied = true;
        }
        createTooltip() {
            const texts = [
                tooltipElm("Type: ", proper(this.cls)),
                tooltipElm("Enemy types: ", ""),
            ];
            for (let i = 0; i < this.world.enemyTypes.length; i++) {
                const enemyType = this.world.enemyTypes[i];
                texts.push(tooltipElm(enemyType.name, "", "list"));
            }
            this.tooltip = new Tooltip(this.id, texts, this.element);
            this.element.classType = this;
            this.element.addEventListener("mouseover", function(evt) {
                evt.currentTarget.classType.showTooltip();
            });
            this.element.addEventListener("mouseout", function(evt) {
                evt.currentTarget.classType.tooltip.hide();
            });
        }
        showTooltip() {
            this.tooltip.showAbove();
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
            this.tileObj.element.append(this.element);
            this.createTooltip();
        }
        unlock() {
            if (this.locked) {
                this.locked = false;
                let counter = 0;
                let interval = setInterval(() => {
                    counter -= 100;
                    this.element.style.backgroundPosition = `0 ${counter}%`;
                    if (counter <= -300) {
                        clearInterval(interval);
                    }
                }, 100);
            }
            return !this.locked;
        }
    }

    class Character {
        constructor(name, type, moveTime, attackTime, life, strength, tileId, apElement, actionPoints, sfxs, inventory, onDeath) {
            this.name = name;
            this.type = type;
            this.moveTime = moveTime;
            this.attackTime = attackTime;
            this.life = life;
            this.totalLife = life;
            this.strength = strength;
            this.tileId = tileId;
            this.actionPoints = actionPoints.current;
            this.actionPointStart = actionPoints.start;
            this.actionPointMax = actionPoints.max;
            this.actionPointsTransfer = 0;
            this.sfxs = sfxs;
            this.inventory = inventory;
            this.element = null;
            this.isDead = false;
            this.apElement = apElement;
            this.ap = this.apElement.querySelector("#ap");
            this.apImage = this.apElement.querySelector("#ap-image");
            this.apPoints = [];
            this.onDeath = onDeath;
        }
        get currentTile() {
            return currentZone.getTileObj(this.tileId);
        }
        createTooltip() {
            this.tooltip = new Tooltip(this.name, this.texts, this.element);
            this.element.classType = this;
            this.element.addEventListener("mouseover", function(evt) {
                evt.currentTarget.classType.showTooltip();
            });
            this.element.addEventListener("mouseout", function(evt) {
                evt.currentTarget.classType.tooltip.hide();
            });
        }
        updateTooltip() {
            this.tooltip.setContent(this.texts);
        }
        showTooltip() {
            this.tooltip.showAbove();
        }
        apMove() {
            if (this.actionPoints == 0) {
                return -1;
            }
            const apCost = 1 + this.apMoveCost;
            if ((this.actionPoints - apCost) < 0) {
                return -1;
            }
            this.actionPoints -= apCost;
            this.actionPointHTMLUpdate();
            return this.actionPoints;
        }
        apAttack() {
            if (this.actionPoints == 0) {
                return -1;
            }
            const apCost = 1 + this.apAttackCost;
            if ((this.actionPoints - apCost) < 0) {
                return -1;
            }
            this.actionPoints -= apCost;
            this.actionPointHTMLUpdate();
            return this.actionPoints;
        }
        get apMoveCost() {
            let weaponCost = 0;
            let armorCost = 0;
            if (this.weaponItem) {
                weaponCost = this.weaponItem.apMoveCost;
            }
            if (this.armorItem) {
                armorCost = this.armorItem.apMoveCost;
            }
            return weaponCost + armorCost;
        }
        get apAttackCost() {
            let weaponCost = 0;
            let armorCost = 0;
            if (this.weaponItem) {
                weaponCost = this.weaponItem.apAttackCost;
            }
            if (this.armorItem) {
                armorCost = this.armorItem.apAttackCost;
            }
            return weaponCost + armorCost;
        }
        actionPointAdd(amount) {
            this.actionPoints += amount;
            if (this.actionPoints > this.actionPointMax) {
                this.actionPoints = this.actionPointMax;
            }
            this.actionPointHTMLUpdate();
            return this.actionPoints;
        }
        actionPointsReset() {
            this.actionPoints = this.actionPointStart + this.actionPointsTransfer;
            if (this.actionPoints > this.actionPointMax) {
                this.actionPoints = this.actionPointMax;
            }
            this.actionPointsTransfer = 0;
            this.apPoints = [];
            this.actionPointHTML();
        }
        actionPointHTML() {
            this.actionPointHTMLRemove();
            this.apElement.classList.add("js-active");
            let lcaseName = this.name.toLowerCase();
            if (this.type == "player") {
                lcaseName = "spritesheet";
            }
            this.apImage.src = `./images/${this.type}-${lcaseName}.png`;
            this.apImage.alt = this.name;
            for (let i = 0; i < this.actionPointMax; i++) {
                let apPoint = document.createElement("DIV");
                apPoint.classList.add("ap-point");
                if (i < this.actionPoints) {
                    let apPointFill = document.createElement("DIV");
                    apPointFill.classList.add("fill");
                    apPoint.append(apPointFill);
                }
                this.ap.append(apPoint);
                this.apPoints.push(apPoint);
            }
            this.actionPointHTMLUpdate();
        }
        actionPointHTMLRemove() {
            this.ap.innerHTML = "";
            this.apElement.classList.remove("js-active");
        }
        actionPointHTMLUpdate() {
            for (let i = 0; i < this.apPoints.length; i++) {
                const apPoint = this.apPoints[i];
                if (i >= this.actionPoints) {
                    apPoint.classList.add("empty");
                }
            }
        }
        endTurn() {
            this.actionPointsTransfer = this.actionPoints;
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
                this.tooltip.remove();
                this.onDeath(this);
            }
            if (this.life > this.totalLife) {
                this.life = this.totalLife;
            }
            this.updateHealthBar();
        }
        takeDamage(damage) {
            if (damage <= 0) {
                return;
            }
            this.addLife(-damage);
            if (this.isDead) {
                this.playSFX(this.sfxs[0]);
            } else {
                const rnd = randomInteger(1, this.sfxs.length);
                this.playSFX(this.sfxs[rnd]);
            }
        }
        playSFX(sfxFile) {
            new SFX("./audio/sfx/" + sfxFile, sfxVolume);
        }
        createCardHTML(parent) {
            let lcaseName = this.name.toLowerCase();
            if (this.type == "player") {
                lcaseName = "spritesheet";
            }
            const titleImage = `
                <h3 class="character-card__title">${this.name}</h3>
                <img class="character-card__image" src="./images/${this.type}-${lcaseName}.png" alt="${this.name}">
            `;
            let card = document.createElement("DIV");
            let cardHealth = document.createElement("DIV");
            let cardHealthBar = document.createElement("DIV");
            card.classList.add("character-card");
            card.classList.add("golden-background");
            card.classList.add(`character-${this.type}`);
            cardHealth.classList.add("character-card__health");
            cardHealthBar.classList.add("character-card__health-bar");
            card.innerHTML = titleImage;
            card.append(cardHealth);
            cardHealth.append(cardHealthBar);
            parent.append(card);
            this.cardParent = parent;
            this.card = card;
            this.cardHealthBar = cardHealthBar;
            this.updateHealthBar();
        }
        removeCard() {
            if (this.card) {
                this.cardParent.removeChild(this.card);
                this.card = undefined;
            }
        }
        updateHealthBar() {
            if (this.card === undefined) {
                return;
            }
            if (this.isDead) {
                this.removeCard();
            } else {
                this.cardHealthBar.style.width = `${this.life / this.totalLife * 100}%`
            }
        }
        setActive() {
            if (!this.isDead) {
                this.card.classList.add("js-active");
            }
        }
        setInactive() {
            if (!this.isDead) {
                this.card.classList.remove("js-active");
            }
        }
        updateOrder(order) {
            if (!this.isDead) {
                this.card.style.order = order;
            }
        }
    }

    class Player extends Character {
        constructor(
            name,
            type,
            moveTime,
            attackTime,
            life,
            strength,
            armor,
            uiObj,
            tileId,
            apElement,
            actionPoints,
            sfxs,
            inventory,
            onDeath
        ) {
            super(name, type, moveTime, attackTime, life, strength, tileId, apElement, actionPoints, sfxs, inventory, onDeath);
            this.armor = armor;
            this.coins = 0;
            this.ui = uiObj;
            this.killCount = 0;
            this.inBattle = false;
            this.torchEquipped = false;
            this.overlay;
            this.torchOverlay;
            this.nightOverlay;
            this.tooltip;
            this.keys = [];
            this.initialize();
        }
        initialize() {
            this.ui.life.count.textContent = this.life;
            this.ui.strength.count.textContent = this.strength;
            this.ui.armor.count.textContent = this.armor;
            this.element = document.createElement("DIV");
            this.element.classList.add("player");
            this.element.classList.add("animation");
            this.element.classList.add("tile__object");

            //Overlay container
            this.overlay = document.createElement("DIV");
            this.overlay.classList.add("night-time-overlay");

            //Torch overlay
            this.torchOverlay = document.createElement("IMG");
            this.torchOverlay.src = "./images/torch-light.png";
            this.torchOverlay.alt = "Torch light";
            this.torchOverlay.classList.add("torch-overlay");
            this.overlay.append(this.torchOverlay);

            //Night overlay
            this.nightOverlay = document.createElement("DIV");
            this.nightOverlay.classList.add("night-overlay");
            this.overlay.append(this.nightOverlay);

            this.element.append(this.overlay);
            this.createTooltipContent();
            this.createTooltip();
            this.updateUI();
        }
        setTorch(equip) {
            if (equip) {
                if (torchEquipping || torchUnEquipping) {
                    return;
                }
                this.torchEquipped = true;
                torchEquipping = true;
            } else {
                if (torchEquipping || torchUnEquipping) {
                    return;
                }
                this.torchEquipped = false;
                torchUnEquipping = true;
            }
        }
        toggleTorch() {
            this.setTorch(!this.torchEquipped);
        }
        setOverlayOpacity(opacity) {
            this.overlay.style.opacity = opacity;
        }
        setTorchOverlayOpacity(opacity) {
            this.torchOverlay.style.opacity = opacity;
        }
        setNightOverlayOpacity(opacity) {
            this.nightOverlay.style.opacity = opacity;
        }
        updateUI() {
            for (let i = 0; i < Object.keys(this.ui).length; i++) {
                const uiObj = this.ui[Object.keys(this.ui)[i]];
                const x = uiObj.sprite.x * 100;
                const y = uiObj.sprite.y * 100;
                uiObj.icon.style.backgroundPosition = `-${x}% -${y}%`;
            }
        }
        createTooltipContent() {
            this.texts = [
                tooltipElm("Life: ", this.life),
                tooltipElm("Damage: ", this.strength),
                tooltipElm("Armor: ", this.armor),
                tooltipElm("Movement speed: ", this.moveTime),
                tooltipElm("Action points: ", ""),
                tooltipElm("Move cost: ", 1 + this.apMoveCost, "list"),
                tooltipElm("Attack cost: ", 1 + this.apAttackCost, "list"),
                tooltipElm("Start: ", this.actionPointStart, "list"),
                tooltipElm("Max: ", this.actionPointMax, "list"),
            ];
        }
        updateTooltip() {
            this.createTooltipContent();
            this.tooltip.setContent(this.texts);
            super.updateTooltip();
        }
        setInteractTime() {
            this.element.style.animationDuration = `${this.interactTime}ms`;
            this.updateTooltip();
        }
        addLife(amount) {
            super.addLife(amount);
            this.ui.life.count.textContent = this.life;
            this.updateTooltip();
        }
        setStrength(item) {
            if (this.weaponItem != undefined) {
                this.inventory.addItem(this.weaponItem);
            }
            this.weaponItem = item;
            this.strength = item.amount;
            this.ui.strength.icon.style.backgroundPosition = `-${item.posX}% -${item.posY}%`;
            this.ui.strength.count.textContent = this.strength;
            this.updateTooltip();
        }
        setArmor(item) {
            if (this.armorItem != undefined) {
                this.inventory.addItem(this.armorItem);
            }
            this.armorItem = item;
            this.armor = item.amount;
            this.ui.armor.icon.style.backgroundPosition = `-${item.posX}% -${item.posY}%`;
            this.ui.armor.count.textContent = this.armor;
            this.updateTooltip();
        }
        hasCoins(amount) {
            if (this.coins >= amount) {
                return true;
            }
            return false;
        }
        addCoins(amount) {
            this.coins += amount;
            this.ui.coins.count.textContent = this.coins;
        }
        removeCoins(amount) {
            this.coins -= amount;
            this.ui.coins.count.textContent = this.coins;
        }
        enemyKill() {
            this.killCount++;
        }
        takeDamage(amount) {
            super.takeDamage(amount - this.armor);
        }
        addKey(key) {
            this.inventory.addItem(key);
            this.keys.push(key);
        }
        removeKey() {
            if (this.keys.length === 0) {
                return false;
            }
            this.inventory.removeItem(this.keys.shift());
            return true;
        }
        collect(item) {
            item.onCollect(item);
        }
        use(item) {
            item.onUse(item);
        }
    }

    class Enemy extends Character {
        constructor(
            name,
            type,
            moveTime,
            attackTime,
            life,
            strength,
            tileId,
            apElement,
            actionPoints,
            sfxs,
            inventory,
            typeObj,
            onDeath
        ) {
            super(name, type, moveTime, attackTime, life, strength, tileId, apElement, actionPoints, sfxs, inventory, onDeath);
            this.totalLife = life;
            this.cls = typeObj.cls;
            this.elmBar;
            this.elmBarText;
            this.spcAtckInfo = typeObj.spcAtckInfo
            this.specialAttack = typeObj.specialAttack;
            this.initialize();
        }
        initialize() {
            if (this.spcAtckInfo != "None") {
                this.spcAtckInfoHTML = `<p>Special:</p><span class="special-attack-info">${this.spcAtckInfo}</span>`;
            } else {
                this.spcAtckInfoHTML = "";
            }
        }
        createTooltipContent() {
            this.texts = [
                tooltipElm("Life: ", this.life),
                tooltipElm("Damage: ", this.strength),
                tooltipElm("Movement speed: ", this.moveTime),
                tooltipElm("AP start: ", this.actionPointStart),
                tooltipElm("AP max: ", this.actionPointMax),
            ];
        }
        updateTooltip() {
            this.createTooltipContent();
            this.tooltip.setContent(this.texts);
            super.updateTooltip();
        }
        createHTML() {
            let enemyHTML = document.createElement("DIV");
            enemyHTML.classList.add("enemy");
            enemyHTML.style.backgroundImage = `url(./images/enemy-${this.cls}.png)`;
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
            this.element = enemyHTML;
            this.elmBar = bar;
            this.elmBarText = barText;
            this.createTooltipContent();
            this.createTooltip();
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
            this.updateTooltip();
            return false;
        }
    }

    class Item {
        constructor(id, collectable) {
            this.id = id;
            this.name = collectable.name;
            this.amount;
            this.posX = collectable.spriteCoordinates.x * 100;
            this.posY = collectable.spriteCoordinates.y * 100;
            this.equipable = collectable.equipable;
            this.stackable = collectable.stackable;
            this.onCollect = collectable.onCollect;
            this.onUse = collectable.onUse;
            this.apMoveCost = collectable.apMoveCost;
            this.apAttackCost = collectable.apAttackCost;
            this.equipped = false;
            this.initialize(collectable.minStackAmount, collectable.maxStackAmount);
        }
        initialize(minStackAmount, maxStackAmount) {
            this.amount = randomInteger(minStackAmount, maxStackAmount);
        }
        createHTML() {
            let item = document.createElement("DIV");
            item.classList.add("item");
            item.style.backgroundPosition = `-${this.posX}% -${this.posY}%`;
            item.classList.add("tile__object");
            return item;
        }
        equip(isEquipped) {
            if (this.equipable) {
                this.equipped = isEquipped;
            }
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

    class Inventory {
        constructor() {
            this.contents = [];
        }
        addItem(item) {
            let content = null;
            if (item.stackable) {
                content = this.getItemContent(item);
                if (content === null) {
                    this.createContent(item);
                } else {
                    content.count++;
                }
            } else {
                content = this.createContent(item);
            }
            return content;
        }
        removeItem(item) {
            let content = this.getItemContent(item);
            if (content === null) {
                return false;
            } else {
                content.count--;
                if (content.count === 0) {
                    this.removeContent(item);
                    return false;
                }
            }
            return content;
        }
        createContent(item) {
            const obj = new Object();
            obj.item = item;
            obj.count = 1;
            this.contents.push(obj);
            return obj;
        }
        removeContent(item) {
            const index = this.getItemIndex(item);
            this.contents.splice(index, 1);
        }
        getItemContent(item) {
            const index = this.getItemIndex(item);
            if (index === -1) {
                return null;
            }
            return this.contents[index];
        }
        getItemIndex(item) {
            for (let i = 0; i < this.contents.length; i++) {
                const content = this.contents[i];
                if (content.item.id === item.id) {
                    return i;
                }
            }
            return -1;
        }
    }

    class Daytime {
        constructor(ticksPerSecond, dayDuration, nightDuration, transitDuration, element, onTransit, onDay, onNight) {
            this.ticksPerSecond = ticksPerSecond;
            this.dayDuration = dayDuration;
            this.nightDuration = nightDuration;
            this.transitDuration = transitDuration;
            this.onDay = onDay;
            this.onNight = onNight;
            this.element = element;
            this.onTransit = onTransit;
            this.isNight = false;
            this.bckImages = document.querySelectorAll(".biom-image");
            this.initialize();
        }
        initialize() {
            this.element.style.transition = `filter ${this.transitDuration}s`;
        }
        dayTimeControl(tick) {
            const dayDuration = this.dayDuration * this.ticksPerSecond;
            const nightDuration = this.nightDuration * this.ticksPerSecond;
            if (this.isNight && tick >= nightDuration) {
                this.isNight = false;
                this.setDayTime();
                return true;
            } else if (!this.isNight && tick >= dayDuration) {
                this.isNight = true;
                this.setNightTime();
                return true;
            }
            if (tick <= this.transitDuration * this.ticksPerSecond) {
                this.onTransit(tick);
                const minBrightness = 0.25;
                for (let i = 0; i < this.bckImages.length; i++) {
                    const bckImage = this.bckImages[i];
                    const brightness = (1 - minBrightness) / (this.transitDuration * this.ticksPerSecond) * tick;
                    if (this.isNight) {
                        bckImage.style.filter = `brightness(${1 - brightness})`;
                    } else {
                        bckImage.style.filter = `brightness(${brightness + minBrightness})`;
                    }
                }
            }
            return false;
        }
        setDayTime() {
            this.element.classList.remove("night-time");
            this.onDay();
        }
        setNightTime() {
            this.element.classList.add("night-time");
            this.onNight();
        }
    }

    class Tooltip {
        constructor(title, texts, boundElement) {
            this.title = `<h3 class="title">${title}</h3>`;
            this.boundElement = boundElement;
            this.offset = 10;
            this.initialize(texts);
        }
        initialize(texts) {
            this.element = document.createElement("DIV");
            this.element.classList.add("golden-background");
            this.element.classList.add("tooltip");
            document.body.append(this.element);
            this.setContent(texts);
        }
        setTexts(texts) {
            this.texts = texts;
        }
        setContent(texts) {
            let content = this.title;
            for (let i = 0; i < texts.length; i++) {
                const text = texts[i];
                content += text;
            }
            this.element.innerHTML = content;
            this.element.style.display = "flex";
            this.rect = this.element.getBoundingClientRect();
            this.element.style.display = "";
        }
        showAbove() {
            let boundElmObj = this.boundElement.getBoundingClientRect();
            const top = boundElmObj.top - this.rect.height - this.offset;
            const left = boundElmObj.left + (boundElmObj.width / 2) - (this.rect.width / 2);
            this.element.style.top = top + "px";
            this.element.style.left = left + "px";
            this.element.classList.add("js-active");
        }
        showBelow() {
            let boundElmObj = this.boundElement.getBoundingClientRect();
            const top = boundElmObj.top + boundElmObj.height + this.offset;
            const left = boundElmObj.left + (boundElmObj.width / 2) - (this.rect.width / 2);
            this.element.style.top = top + "px";
            this.element.style.left = left + "px";
            this.element.classList.add("js-active");
        }
        hide() {
            this.element.classList.remove("js-active");
        }
        remove() {
            this.element.parentNode.removeChild(this.element);
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

    // *********************************************************************************************
    // *********************************************************************************************
    // ************************ TODO: CHANGE TO CLASS (INSTEAD OF AN OBJECT) ***********************
    // *********************************************************************************************
    // *********************************************************************************************

    //#region OBJECTS
    let effect = {
        explosion: {
            name: "Explosion",
            class: "explosion",
            speed: 20,
            duration: 700,
            createHTML: function(element) {
                let fx = document.createElement("DIV");
                fx.classList.add("effect");
                fx.classList.add(this.class);
                fx.classList.add("tile__object");
                fx.style.animationDuration = `${this.duration}ms`;
                element.append(fx);
                setTimeout(() => {
                    element.removeChild(fx);
                }, this.duration);
            },
            soundEffect(soundFile) {
                new SFX("./audio/sfx/" + soundFile, sfxVolume);
            }
        },
        flash: {
            name: "Flash",
            class: "flash",
            speed: 20,
            duration: 300,
            createHTML: function(element) {
                let fx = document.createElement("DIV");
                fx.classList.add("effect");
                fx.classList.add(this.class);
                fx.classList.add("tile__object");
                fx.style.animationDuration = `${this.duration}ms`;
                element.append(fx);
                setTimeout(() => {
                    element.removeChild(fx);
                }, this.duration);
            },
            soundEffect(soundFile) {
                new SFX("./audio/sfx/" + soundFile, sfxVolume);
            }
        },
    }

    let collectables = {
        coins: {
            name: "Coin",
            type: "coin",
            spriteCoordinates: { x: 3, y: 3 },
            includeInStartZone: true,
            stacks: 100,
            minStackAmount: 10,
            maxStackAmount: 30,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            apAttackCost: 0,
            onCollect: function(item) {
                new SFX("./audio/sfx/CHAIN_Drop_03_mono.ogg", sfxVolume);
                player.addCoins(item.amount);
            },
            onUse: function(item) {

            }
        },
        potions: {
            name: "Potion",
            type: "life",
            spriteCoordinates: { x: 3, y: 4 },
            includeInStartZone: false,
            stacks: 300,
            minStackAmount: 10,
            maxStackAmount: 50,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            apAttackCost: 0,
            onCollect: function(item) {
                new SFX("./audio/sfx/EAT_Swallow_mono.ogg", sfxVolume);
                player.inventory.addItem(item);
            },
            onUse: function(item) {
                player.addLife(item.amount);
                if (!player.inventory.removeItem(item)) {
                    createInventoryItemsUI();
                }
            }
        },
        keys: {
            name: "Key",
            type: "key",
            spriteCoordinates: { x: 6, y: 0 },
            includeInStartZone: false,
            stacks: 6,
            minStackAmount: 1,
            maxStackAmount: 1,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            apAttackCost: 0,
            onCollect: function(item) {
                new SFX("./audio/sfx/LOCK_Metal_Padlock_Unlock_Pop_01_mono.ogg", sfxVolume);
                player.addKey(item);
            },
            onUse: function(item) {

            }
        },
        woodenSword: {
            name: "Wood sword",
            type: "weapon",
            spriteCoordinates: { x: 1, y: 2 },
            includeInStartZone: false,
            stacks: 30,
            minStackAmount: 10,
            maxStackAmount: 10,
            stackable: false,
            equipable: true,
            apMoveCost: 0,
            apAttackCost: 0,
            onCollect: function(item) {
                new SFX("./audio/sfx/BOW_Release_Arrow_mono.ogg", sfxVolume);
                player.inventory.addItem(item);
            },
            onUse: function(item) {
                player.setStrength(item);
                player.inventory.removeItem(item);
                createInventoryItemsUI();
            }
        },
        ironSword: {
            name: "Iron sword",
            type: "weapon",
            spriteCoordinates: { x: 3, y: 2 },
            includeInStartZone: false,
            stacks: 40,
            minStackAmount: 21,
            maxStackAmount: 28,
            stackable: false,
            equipable: true,
            apMoveCost: 0,
            apAttackCost: 1,
            onCollect: function(item) {
                new SFX("./audio/sfx/FRICTION_Metal_Bars_05_mono.ogg", sfxVolume);
                player.inventory.addItem(item);
            },
            onUse: function(item) {
                player.setStrength(item);
                player.inventory.removeItem(item);
                createInventoryItemsUI();
            }
        },
        ironAxe: {
            name: "Iron axe",
            type: "weapon",
            spriteCoordinates: { x: 2, y: 0 },
            includeInStartZone: false,
            stacks: 40,
            minStackAmount: 45,
            maxStackAmount: 52,
            stackable: false,
            equipable: true,
            apMoveCost: 1,
            apAttackCost: 1,
            onCollect: function(item) {
                new SFX("./audio/sfx/FRICTION_Metal_Bars_02_mono.ogg", sfxVolume);
                player.inventory.addItem(item);
            },
            onUse: function(item) {
                player.setStrength(item);
                player.inventory.removeItem(item);
                createInventoryItemsUI();
            }
        },
        smallShield: {
            name: "Small shield",
            type: "armor",
            spriteCoordinates: { x: 5, y: 0 },
            includeInStartZone: false,
            stacks: 40,
            minStackAmount: 2,
            maxStackAmount: 2,
            stackable: false,
            equipable: true,
            apMoveCost: 0,
            apAttackCost: 1,
            onCollect: function(item) {
                new SFX("./audio/sfx/TOOL_Toolbox_Close_mono.ogg", sfxVolume);
                player.inventory.addItem(item);
            },
            onUse: function(item) {
                player.setArmor(item);
                player.inventory.removeItem(item);
                createInventoryItemsUI();
            }
        },
        largeShield: {
            name: "Large shield",
            type: "armor",
            spriteCoordinates: { x: 4, y: 0 },
            includeInStartZone: false,
            stacks: 30,
            minStackAmount: 5,
            maxStackAmount: 5,
            stackable: false,
            equipable: true,
            apMoveCost: 1,
            apAttackCost: 1,
            onCollect: function(item) {
                new SFX("./audio/sfx/TOOL_Toolbox_Close_mono.ogg", sfxVolume);
                player.inventory.addItem(item);
            },
            onUse: function(item) {
                player.setArmor(item);
                player.inventory.removeItem(item);
                createInventoryItemsUI();
            }
        },
    }

    let music = {
            current: null,
            menu: new Music("./audio/fantasy_title.ogg", startVolume),
            calm: new Music("./audio/medieval_market_LOOP.ogg", startVolume),
            combat: new Music("./audio/enemy_territory_LOOP.ogg", startVolume),
            setCurrent: function(musicObj) {
                this.current = musicObj;
            },
            setVolume: function(volume) {
                this.menu.setVolume(volume);
                this.calm.setVolume(volume);
                this.combat.setVolume(volume);
            },
            crossFade: function(toMusicObj) {
                if (this.current === toMusicObj) {
                    return;
                }
                toMusicObj.fadeIn();
                if (this.current != null) {
                    this.current.fadeOut(function() {
                        music.setCurrent(toMusicObj);
                    });
                }
            }
        }
        //#endregion OBJECTS

    //#region EVENT LISTENERS
    welcomeScreen.addEventListener("click", function() {
        this.classList.add("js-hidden");
        startFormName.focus();
        optionsFormMusic.value = startVolume * 100;
        optionsFormSfx.value = startVolume * 100;
        music.setCurrent(music.menu);
        music.current.fadeIn();
    })
    settings.addEventListener("click", function() {
        optionsScreen.classList.remove("js-hidden");
        enableButton(optionsFormExit);
    });
    startFormContinue.addEventListener("click", function(evt) {
        evt.preventDefault();
        console.log("Continue");
    });
    startFormOptions.addEventListener("click", function(evt) {
        evt.preventDefault();
        optionsScreen.classList.remove("js-hidden");
        disableButton(optionsFormExit);
    });
    optionsFormMusic.addEventListener("input", function() {
        music.setVolume(this.value / 100);
    });
    optionsFormSfx.addEventListener("input", function() {
        sfxVolume = this.value / 100;
    });
    optionsFormSfx.addEventListener("change", function() {
        new SFX("./audio/sfx/CHAIN_Drop_03_mono.ogg", sfxVolume);
    });
    optionsFormBack.addEventListener("click", function(evt) {
        evt.preventDefault();
        optionsScreen.classList.add("js-hidden");
    });
    optionsFormExit.addEventListener("click", function(evt) {
        evt.preventDefault();
        startScreen.classList.remove("js-hidden");
        optionsScreen.classList.add("js-hidden");
        music.crossFade(music.menu);
        stopEngine();
    });

    startForm.addEventListener("submit", function(evt) {
        evt.preventDefault();
        newGame(startFormName.value);
        startScreen.classList.add("js-hidden");
    });

    document.addEventListener("keyup", function(evt) {
        if (gameStarted) {
            if (evt.key == "m") {
                miniMap.zoomToggle();
            }
            if (evt.key == "i") {
                toggleInventory();
            }
            if (evt.key == "t") {
                player.toggleTorch();
            }
            if (evt.key == "e") {
                if (player.inBattle) {
                    if (playersTurn) {
                        nextTurn();
                    }
                } else {
                    if (menuActive) {
                        menuButtonPressed();
                    }
                    toggleMenu();
                }
            }
            if (evt.key == "Escape") {
                hideMenu();
                hideInventory();
                if (miniMap.enlarged) {
                    miniMap.zoomToggle();
                }
            }
        } else {
            welcomeScreen.classList.add("js-hidden");
            startFormName.focus();
        }
    });

    function addPlayerControls() {
        document.addEventListener("keydown", function(evt) {
            if (evt.repeat || !playersTurn || playerIsMoving) {
                return;
            }
            if (evt.key == "w" || evt.key == "ArrowUp") {
                if (menuActive) {
                    console.log("UP");
                } else {
                    moveSuccess = playerMove(0, -1, player.element, "up");
                    player.element.style.backgroundPosition = "0 -33.3333%";
                }
            }
            if (evt.key == "s" || evt.key == "ArrowDown") {
                if (menuActive) {
                    console.log("DOWN");
                } else {
                    moveSuccess = playerMove(0, 1, player.element, "down");
                    player.element.style.backgroundPosition = "0 0";
                }
            }
            if (evt.key == "a" || evt.key == "ArrowLeft") {
                if (menuActive) {
                    menuPrev();
                } else {
                    moveSuccess = playerMove(-1, 0, player.element, "left");
                    player.element.style.backgroundPosition = "0 -100%";
                }
            }
            if (evt.key == "d" || evt.key == "ArrowRight") {
                if (menuActive) {
                    menuNext();
                } else {
                    moveSuccess = playerMove(1, 0, player.element, "right");
                    player.element.style.backgroundPosition = "0 -66.6667%";
                }
            }
        })
    }
    //#endregion EVENT LISTENERS

    function toggleInventory() {
        inventoryActive = !inventoryActive;
        if (inventoryActive) {
            showInventory();
        } else {
            hideInventory();
        }
    }

    function showInventory() {
        inventory.classList.remove("js-hidden");
        inventoryActive = true;
        createInventoryItemsUI();
    }

    function hideInventory() {
        inventory.classList.add("js-hidden");
        inventoryActive = false;
    }

    function toggleMenu() {
        menuActive = !menuActive;
        if (menuActive) {
            showMenu();
        } else {
            hideMenu();
        }
    }

    function showMenu() {
        gameMenu.classList.add("js-active");
        menuActive = true;
        const playerRect = player.element.getBoundingClientRect();
        gameMenu.style.top = `${playerRect.top - gameMenuRect.height - 10}px`;
        gameMenu.style.left = `${playerRect.left + playerRect.width / 2 - gameMenuRect.width / 2}px`;
    }

    function hideMenu() {
        gameMenu.classList.remove("js-active");
        menuActive = false;
    }

    function menuPrev() {
        menuButtons[menuButtonIndex].classList.remove("js-active");
        menuButtonIndex--;
        if (menuButtonIndex < 0) {
            menuButtonIndex = menuButtons.length - 1;
        }
        menuButtons[menuButtonIndex].classList.add("js-active");
    }

    function menuNext() {
        menuButtons[menuButtonIndex].classList.remove("js-active");
        menuButtonIndex++;
        if (menuButtonIndex >= menuButtons.length) {
            menuButtonIndex = 0;
        }
        menuButtons[menuButtonIndex].classList.add("js-active");
    }

    function menuButtonPressed() {
        switch (menuButtons[menuButtonIndex].id) {
            case "menu-inventory":
                toggleInventory();
                break;
            case "menu-map":
                miniMap.zoomToggle();
                break;
            case "menu-torch":
                player.toggleTorch();
                break;

            default:
                break;
        }
    }

    function createInventoryItemsUI() {
        inventoryGrid.innerHTML = "";
        for (let i = 0; i < player.inventory.contents.length; i++) {
            const content = player.inventory.contents[i];
            inventoryItemButton(content);
        }
    }

    function inventoryItemButton(content) {
        const x = content.item.posX / 100 * 64;
        const y = content.item.posY / 100 * 64;
        const button = document.createElement("BUTTON");
        button.classList.add("inventory__item");
        button.setAttribute("aria-label", "Inventory item");
        button.style.backgroundPosition = `-${x}px -${y}px`;
        if (content.item.stackable) {
            button.innerHTML = `<span class="inventory__amount">${content.count}</span>`;
        }

        button.addEventListener("click", function() {
            player.use(content.item);
            if (content.item.stackable) {
                button.innerHTML = `<span class="inventory__amount">${content.count}</span>`;
            }
        });

        inventoryGrid.append(button);
    }

    function disableButton(button) {
        button.classList.add("js-disabled");
        button.disabled = true;
    }

    function enableButton(button) {
        button.classList.remove("js-disabled");
        button.disabled = false;
    }

    function newGame(playerName) {
        music.crossFade(music.calm);
        currentWorld = worlds.outdoor;
        dayTime = new Daytime(ticksPerSecond, 120, 60, 20, background, function(t) {
            let opacity = 1 / (this.transitDuration * this.ticksPerSecond) * t;
            if (this.isNight) {
                player.setOverlayOpacity(opacity);
            } else {
                player.setOverlayOpacity(1 - opacity);
            }
        }, function() {
            if (player.torchEquipped) {
                const delay = this.transitDuration * 1000 / 3 * 2;
                setTimeout(() => {
                    player.setTorch(false);
                }, delay);
            }
            console.log("Day");
        }, function() {
            console.log("Night");
        });
        region = new Region(worlds.outdoor, background, zoneContainer, tileSize);
        miniMap = new MiniMap(region, miniMapContainer, miniMapZoom);
        playerName = playerName == "" ? "Player 1" : playerName;
        const sfxArr = ["VOICE_Girl_4yo_Hurt_Long_01_mono.ogg", "VOICE_Girl_4yo_Hurt_Short_01_mono.ogg", "VOICE_Girl_4yo_Hurt_Short_04_mono.ogg", "VOICE_Girl_4yo_Hurt_Short_05_mono.ogg"];
        player = new Player(playerName, "player", 150, 150, 100, 10, 0, ui, null, actions, actionPoints, sfxArr, new Inventory(), nightOverlay, gameOver);
        player.setStrength(new Item("start-sword", collectables.woodenSword));
        battleQueueElement.innerHTML = "";
        buildMap();
        buildZone("0_0");
        placePlayer(getCenterTileIndex());
        addPlayerControls();
        setEvent();

        //Manual placement of dungeon
        // const tileObj = currentZone.getRandomTile();
        // placeDungeon(currentWorld.gateWaysTo()[0], currentZone, tileObj);
        if (cheatsOn) {
            player.addCoins(cheatMoney);
        }

        //Pathfinding algorithm test
        // updatePathfindingGrid();
        // console.log(findShortestPath({ x: 0, y: 0 }, { x: 3, y: 3 }, pathFindingGrid));

        gameStarted = true;
        startEngine();
    }

    function enterRegion(world) {
        //IMPORTANT! CLEAN UP HTML - Must be removed BEFORE setting the new world:
        region.removeBiomHTML();
        //IMPORTANT! CLEAN UP HTML
        if (world.region == null) {
            currentWorld.region = region;
            currentWorld.miniMap = miniMap;
            region = new Region(world, background, zoneContainer, tileSize);
            miniMap = new MiniMap(region, miniMapContainer, miniMapZoom);
            currentWorld = world;
            battleQueueElement.innerHTML = "";
            buildMap();
            buildZone("0_0");
            placePlayer(getCenterTileIndex());
            setEvent();
            gameStarted = true;
        } else {
            region = world.region;
            miniMap = world.miniMap;
        }
    }

    function gameOver(playerObj) {
        music.current.stop();
        gameOverScreen.classList.remove("js-hidden");
        setTimeout(() => {
            new SFX("./audio/sfx/losing.ogg", sfxVolume);
            setTimeout(() => {
                gameOverScreen.classList.add("js-hidden");
                startScreen.classList.remove("js-hidden");
                stopEngine();
            }, 3000);
        }, 100);
    }

    function enterGate(gate) {
        if (gate.locked) {
            if (player.removeKey()) {
                gate.unlock();
            } else {
                console.log("Key is missing!");
            }
        } else {
            console.log("Transitioning to " + gate.id);
            enterRegion(gate.world);
            playerIsMoving = false;
        }
    }

    function buildMap() {
        miniMap.reset();
        for (let y = region.size.up; y >= region.size.down; y--) {
            for (let x = region.size.left; x <= region.size.right; x++) {
                const zone = newZone(x + "_" + y);
                region.addZone(zone);
                miniMapHTML(x + "_" + y, zone.biom);
                const edge = edgeControl(x, y);
                if (edge != "edge") {
                    zone.addEdge(edge);
                }
            }
        }
        placeDungeons();
        placeEnemies(zoneEnemyCount(region.enemyPercentage));

        //INSERT ENEMIES MANUALLY FOR TESTING PURPOSES
        // const zone = region.getZone("0_0");
        // const tileObj2 = zone.getTileObj("2_2");
        // placeEnemy(tileObj2, enemyTypes[1]);
        // const tileObj = zone.getTileObj("2_1");
        // placeEnemy(tileObj, enemyTypes[1]);

        //INSERT KEY MANUALLY FOR TESTING PURPOSES
        if (cheatsOn && cheatKey) {
            const tileObj = region.getZone("0_0").getRandomTile();
            const key = new Item("cheat-key", collectables.keys);
            tileObj.placeObject(key, "item", true);
        }
        //INSERT WEAPON MANUALLY FOR TESTING PURPOSES
        if (cheatsOn && cheatWeapon) {
            const tileObj1 = region.getZone("0_0").getRandomTile();
            const weapon1 = new Item("cheat-weapon-1", collectables.ironSword);
            tileObj1.placeObject(weapon1, "item", true);
            const tileObj2 = region.getZone("0_0").getRandomTile();
            const weapon2 = new Item("cheat-weapon-2", collectables.ironAxe);
            tileObj2.placeObject(weapon2, "item", true);
        }

        //Loop through all items and place them randomly in the world (Coins, Keys, Weapons, Armors, Potions, etc.)
        for (let i = 0; i < Object.keys(collectables).length; i++) {
            const key = Object.keys(collectables)[i];
            placeCollectables(collectables[key]);
        }
    }

    function zoneEnemyCount(percentage) {
        let zoneCount = region.width * region.height;
        zoneCount * percentage / 100;
        zoneCount = Math.floor(zoneCount);
        return zoneCount;
    }

    function edgeControl(x, y) {
        let edge = "edge";
        edge += y == region.size.up ? "-up" : "";
        edge += y == region.size.down ? "-down" : "";
        edge += x == region.size.left ? "-left" : "";
        edge += x == region.size.right ? "-right" : "";
        return edge;
    }

    function newZone(id) {
        const rnd = randomInteger(0, currentWorld.bioms.length);
        region.setBiom(currentWorld.bioms[rnd], false);
        const zone = new Zone(id, zoneContainer, false, region.biom);
        for (let y = 0; y < region.zoneSize; y++) {
            for (let x = 0; x < region.zoneSize; x++) {
                let tileObj = new Tile(`${x}_${y}`);
                if (x > 0 && x < region.zoneSize - 2 && y > 0 && y < region.zoneSize - 2) {
                    const rnd = Math.random() * 100;
                    if (rnd < 20) {
                        const rnd = randomInteger(0, currentWorld.obstacles.length);
                        tileObj.setType(currentWorld.obstacles[rnd], "obstacle", true);
                    }
                }
                zone.tiles.push(tileObj);
            }
        }
        return zone;
    }

    function buildZone(id) {
        region.element.innerHTML = "";
        currentZone = region.getZone(id);
        region.setBiom(currentZone.biom, true);
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
        currentZone.updateHTML();
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
        battleQueue = [];
        background.classList.remove("battle");
        player.removeCard();
        player.actionPointHTMLRemove();
        player.inBattle = false;
        music.crossFade(music.calm);
    }

    function combatEvent() {
        zoneLocked = true;
        playersTurn = false;
        background.classList.add("battle");
        battleQueue.push(player);
        shuffleArray(battleQueue);
        for (let i = 0; i < battleQueue.length; i++) {
            const character = battleQueue[i];
            character.createCardHTML(battleQueueElement);
        }
        player.inBattle = true;
        music.crossFade(music.combat);
        takeTurn();
    }

    function takeTurn() {
        for (let i = 0; i < battleQueue.length; i++) {
            const character = battleQueue[i];
            character.setInactive();
            character.updateOrder(i);
        }
        const currentCharacter = battleQueue[0];
        currentCharacter.setActive();
        currentCharacter.actionPointsReset();
        if (currentCharacter == player) {
            playersTurn = true;
        } else {
            playersTurn = false;
            enemyTurn(currentCharacter);
        }
        updateDaytime();
    }

    function nextTurn() {
        for (let i = battleQueue.length - 1; i >= 0; i--) {
            const character = battleQueue[i];
            if (character.isDead) {
                battleQueue.splice(i, 1);
            }
        }
        const endTurnCharacter = battleQueue.shift();
        battleQueue.push(endTurnCharacter);
        endTurnCharacter.endTurn();
        takeTurn();
    }

    function enemyTurn(enemyObj) {
        if (battleQueue.length > 0) {
            updatePathfindingGrid();
            const moveDirection = shortestPathDirection(enemyObj.currentTile, player.currentTile);
            const destinationTileObj = adjacentTile(enemyObj.currentTile, moveDirection);
            enemyMove(enemyObj, moveDirection, destinationTileObj);
        }
    }

    function enemyMove(enemyObj, direction, destinationTileObj) {
        enemyObj.currentTile.element.classList.add("attacking");
        setTimeout(() => {
            enemyObj.element.classList.add("animation-" + direction);
            if (destinationTileObj == player.currentTile) {
                enemyObj.setAttackTime();
                halfWayMove(enemyObj.element, enemyObj.attackTime, direction, function() {
                    effect.explosion.createHTML(destinationTileObj.element);
                    effect.explosion.soundEffect("THUD_Bright_03_mono.mp3");
                    destinationTileObj.object.takeDamage(enemyObj.strength);
                    enemyObj.specialAttack();
                }, function() {
                    enemyObj.currentTile.element.classList.remove("attacking");
                    if (!destinationTileObj.object.isDead) {
                        enemyAction(enemyObj)
                    }
                });
            } else {
                enemyObj.setMoveTime();
                fullMove(enemyObj.element, enemyObj.moveTime, direction, function() {
                    const currentTile = enemyObj.currentTile;
                    enemyObj.tileId = destinationTileObj.id;
                    destinationTileObj.placeObject(enemyObj, "enemy", true);
                    destinationTileObj.placeHTML(enemyObj.element);
                    currentTile.setEmpty();
                }, function() {
                    enemyObj.element.classList.remove("animation-" + direction);
                    enemyObj.currentTile.element.classList.remove("attacking");
                    enemyAction(enemyObj);
                });
            }
        }, 500);
    }

    function enemyAction(enemyObj) {
        if (enemyObj.apMove() == 0) {
            setTimeout(() => {
                enemyObj.endTurn();
                nextTurn();
            }, 300);
        } else {
            enemyTurn(enemyObj);
        }
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
        if (cheatsOn) {
            activeClass = "";
        }
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
        let itemInTile = false;
        let enemyInTile = false;
        if (tileObj.object != null) {
            if (tileObj.type == "item") {
                itemInTile = true;
                player.collect(tileObj.object);
            }
            if (tileObj.type == "enemy") {
                enemyInTile = true;
            }
        }
        tileObj.setEmpty();
        tileObj.element.innerHTML = "";
        tileObj.object = player;
        tileObj.element.append(tileObj.object.element);
        player.tileId = tileObj.id;
        if (itemInTile) {
            effect.flash.createHTML(player.element);
        }
        if (enemyInTile) {
            console.log("Enemy");
        }
    }

    function placeEnemies(amount) {
        for (let i = 0; i < amount; i++) {
            const zone = region.getRandomZone();
            const tileObj = zone.getRandomTile(true);
            randomEnemy(tileObj);
        }
        //This needs to be deleted at some point.
        //For now, it is used for adjustments of enemy amount/values
        for (let i = 0; i < currentWorld.enemyTypes.length; i++) {
            const nmeType = currentWorld.enemyTypes[i];
            console.log(nmeType.name + "'s: " + nmeType.totalCount);
        }
    }

    function placeCollectables(collectable) {
        collectable.totalStackAmount = 0;
        for (let i = 0; i < collectable.stacks; i++) {
            const zone = region.getRandomZone(collectable.includeInStartZone);
            const tileObj = zone.getRandomTile();
            const item = new Item(collectable.type + "-" + i, collectable);
            tileObj.placeObject(item, "item", true);
            collectable.totalStackAmount += item.amount;
        }
        //This needs to be deleted at some point.
        //For now, it is used for adjustments of collectables- amount/values
        console.log(collectable.type + "'s total: " + collectable.totalStackAmount);
    }

    function placeDungeons() {
        for (let i = 0; i < currentWorld.gateWaysTo().length; i++) {
            const zone = region.getRandomZone();
            const tileObj = zone.getRandomTile();
            placeDungeon(currentWorld.gateWaysTo()[i], zone, tileObj);
        }
    }

    function placeDungeon(gateWay, zone, tileObj) {
        let gateWayObj = new Gate(gateWay, tileObj);
        zone.areaTransition = gateWayObj;
        miniMap.tileAddClass(zone.id, gateWay.type);
    }

    function randomEnemy(tileObj) {
        let type = getRandomArrayItem(currentWorld.enemyTypes);
        placeEnemy(tileObj, type);
    }

    function placeEnemy(tileObj, type) {
        if (type == null) {
            console.log("Array is empty!");
            return;
        }
        const enemy = new Enemy(type.name, "enemy", type.moveTime, type.attackTime, type.life, type.strength, tileObj.id, actions, type.actionPoints, type.sfxs, new Inventory(), type, type.enemyDeath);
        tileObj.setEmpty();
        tileObj.placeObject(enemy, "enemy", true);
        type.totalCount++;
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
        const idObj = currentTileObj.coordinates();
        let x = idObj.x;
        let y = idObj.y;
        switch (direction) {
            case "up":
                y--;
                if (y < 0) {
                    return false;
                }
                break;
            case "down":
                y++;
                if (y >= region.zoneSize) {
                    return false;
                }
                break;
            case "right":
                x++;
                if (x >= region.zoneSize) {
                    return false;
                }
                break;
            case "left":
                x--;
                if (x < 0) {
                    return false;
                }
                break;

            default:
                break;
        }
        return currentZone.getTileObj(x + "_" + y);
    }

    function playerMove(moveX, moveY, element, direction) {
        let coordinate = currentZone.getTileObj(player.tileId).coordinates();
        coordinate.x += moveX;
        coordinate.y += moveY;
        if (coordinate.y < 0) {
            changeZone(0, 1, currentZone.tiles.length - region.zoneSize + coordinate.x);
            return false;
        }
        if (coordinate.y >= region.zoneSize) {
            changeZone(0, -1, coordinate.x);
            return false;
        }
        if (coordinate.x < 0) {
            changeZone(-1, 0, coordinate.y * region.zoneSize + region.zoneSize - 1);
            return false;
        }
        if (coordinate.x >= region.zoneSize) {
            changeZone(1, 0, coordinate.y * region.zoneSize);
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
            const apAttack = player.apAttack();
            if (battleQueue.length > 0 && apAttack == -1) {
                playerIsMoving = false;
                return false;
            }
            player.setAttackTime();
            halfWayMove(element, player.attackTime, direction, function() {
                effect.explosion.createHTML(destinationTileObj.element);
                effect.explosion.soundEffect("THUD_Bright_03_mono.mp3");
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
                    if (apAttack == 0) {
                        nextTurn();
                    }
                }
            });
            return false;
        }
        const apMove = player.apMove();
        if (battleQueue.length > 0 && apMove == -1) {
            playerIsMoving = false;
            return false;
        }
        player.setMoveTime();
        fullMove(element, player.moveTime, direction, function() {
            if (destinationTileObj.type == "item") {
                effect.flash.createHTML(player.element);
                player.collect(destinationTileObj.object);
                destinationTileObj.setEmpty();
            }
            destinationTileObj.object = player;
            player.tileId = destinationTileObj.id;
            destinationTileObj.element.append(player.element);
        }, function() {
            playerIsMoving = false;
            if (battleQueue.length > 0) {
                if (apMove == 0) {
                    nextTurn();
                }
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

    //#region REUSABLE FUNCTIONS
    function randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function getRandomArrayItem(arr) {
        if (arr.length == 0) {
            return null;
        }
        let rnd = randomInteger(0, arr.length);
        return arr[rnd];
    }

    function tooltipElm(title, content, cls = "standard") {
        if (title != "") {
            title = `<span class="title">${title}</span>`;
        }
        if (content != "" || content === 0) {
            content = `<span class="content">${content}</span>`;
        }
        return `<p class="tooltip-${cls}">${title}${content}</p>`;
    }

    function proper(str) {
        const firstLetter = str.slice(0, 1).toUpperCase();
        const theRest = str.slice(1, str.length);
        return firstLetter + theRest;
    }
    //#endregion REUSABLE FUNCTIONS

    // *********************************************************************************************
    // *********************************************************************************************
    // ************************************** ANIMATION FRAME **************************************
    // *********************************************************************************************
    // *********************************************************************************************

    //Torch:
    function equipTorch() {
        if (torchEquipping) {
            player.setNightOverlayOpacity(1 - (1 / torchEquipTime * torchEquipTimeCurrent))
            torchEquipTimeCurrent += deltaTime;
            if (torchEquipTimeCurrent >= torchEquipTime) {
                torchEquipTimeCurrent = 0;
                torchEquipping = false;
            }
        }
    }

    function unEquipTorch() {
        if (torchUnEquipping) {
            player.setNightOverlayOpacity(1 / torchEquipTime * torchEquipTimeCurrent)
            torchEquipTimeCurrent += deltaTime;
            if (torchEquipTimeCurrent >= torchEquipTime) {
                torchEquipTimeCurrent = 0;
                torchUnEquipping = false;
            }
        }
    }

    function updateDaytime() {
        tick++;
        if (dayTime.dayTimeControl(tick)) {
            tick = 0;
        }
    }

    //NEVER call update() manually! Use startEngine() and stopEngine().
    function update() {
        if (!zoneLocked) {
            if (tTime < tickTime) {
                tTime += deltaTime;
            } else {
                tTime = 0;
                updateDaytime();
            }
        }
        equipTorch();
        unEquipTorch();
    }

    function startEngine() {
        engineActive = true;
        lastTime = 0;
        engine();
    }

    function stopEngine() {
        engineActive = false;
        cancelAnimationFrame(animFrame);
    }

    function engine(timeStamp) {
        if (engineActive) {
            if (lastTime) {
                //deltaTime is the calculated time between frames (browser-repaints)
                //Example usage (pseudocode bulletObj.move(from, to)):
                //To get a bullet moving smoothly across the screen, use deltaTime to calculate
                //the distance the bullet must move for one (current) frame:
                //bulletObj.move(currentPosition, speed * direction * deltaTime);
                deltaTime = (timeStamp - lastTime) / 1000;
                update(); // call update just before a repaint in the browser occurs
            }
            lastTime = timeStamp;
            //requestAnimationFrame runs engine function recursively
            animFrame = requestAnimationFrame(engine);
        }
    }

    // *********************************************************************************************
    // *********************************************************************************************
    // ************************** PATHFIDING Breadth-First Search algorithm ************************
    // *********************************************************************************************
    // *********************************************************************************************

    function updatePathfindingGrid() {
        for (let x = 0; x < region.zoneSize; x++) {
            pathFindingGrid[x] = [];
            for (let y = 0; y < region.zoneSize; y++) {
                if (currentZone.getTileObj(x + "_" + y).occupied) {
                    pathFindingGrid[x][y] = 'Obstacle';
                } else {
                    pathFindingGrid[x][y] = 'Empty';
                }
            }
        }
    }

    function shortestPathDirection(from, to) {
        let fromObj = from.coordinates();
        let toObj = to.coordinates();
        return findShortestPath(fromObj, toObj, pathFindingGrid)[0];
    }

    // Start location will be in the following format:
    // [distanceFromTop, distanceFromLeft]
    function findShortestPath(from, to, grid) {
        //Define the Start position and the Goal position
        grid[from.x][from.y] = "Start";
        grid[to.x][to.y] = "Goal";

        // Each "location" will store its coordinates
        // and the shortest path required to arrive there
        var location = {
            x: from.x,
            y: from.y,
            path: [],
            status: 'Start'
        };

        // Initialize the queue with the start location already inside
        var queue = [location];

        // Loop through the grid searching for the goal
        let counter = 0;
        while (queue.length > 0 && counter < 10000) {
            // Take the first location off the queue
            var currentLocation = queue.shift();

            // Explore North
            var newLocation = exploreInDirection(currentLocation, 'up', grid);
            if (newLocation.status === 'Goal') {
                return newLocation.path;
            } else if (newLocation.status === 'Valid') {
                queue.push(newLocation);
            }

            // Explore East
            var newLocation = exploreInDirection(currentLocation, 'right', grid);
            if (newLocation.status === 'Goal') {
                return newLocation.path;
            } else if (newLocation.status === 'Valid') {
                queue.push(newLocation);
            }

            // Explore South
            var newLocation = exploreInDirection(currentLocation, 'down', grid);
            if (newLocation.status === 'Goal') {
                return newLocation.path;
            } else if (newLocation.status === 'Valid') {
                queue.push(newLocation);
            }

            // Explore West
            var newLocation = exploreInDirection(currentLocation, 'left', grid);
            if (newLocation.status === 'Goal') {
                return newLocation.path;
            } else if (newLocation.status === 'Valid') {
                queue.push(newLocation);
            }
        }
        return false;
    };

    // This function will check a location's status
    // (a location is "valid" if it is on the grid, is not an "obstacle",
    // and has not yet been visited by our algorithm)
    // Returns "Valid", "Invalid", "Blocked", or "Goal"
    function locationStatus(location, grid) {
        var gridWidth = grid.length;
        var gridHeight = grid[0].length;
        var x = location.x;
        var y = location.y;

        if (location.x < 0 ||
            location.x >= gridWidth ||
            location.y < 0 ||
            location.y >= gridHeight) {

            // location is not on the grid--return false
            return 'Invalid';
        } else if (grid[x][y] === 'Goal') {
            return 'Goal';
        } else if (grid[x][y] !== 'Empty') {
            // location is either an obstacle or has been visited
            return 'Blocked';
        } else {
            return 'Valid';
        }
    };


    // Explores the grid from the given location in the given
    // direction
    function exploreInDirection(currentLocation, direction, grid) {
        var newPath = currentLocation.path.slice();
        newPath.push(direction);

        var x = currentLocation.x;
        var y = currentLocation.y;

        if (direction === 'up') {
            y -= 1;
        } else if (direction === 'right') {
            x += 1;
        } else if (direction === 'down') {
            y += 1;
        } else if (direction === 'left') {
            x -= 1;
        }

        var newLocation = {
            x: x,
            y: y,
            path: newPath,
            status: 'Unknown'
        };
        newLocation.status = locationStatus(newLocation, grid);

        // If this new location is valid, mark it as 'Visited'
        if (newLocation.status === 'Valid') {
            grid[newLocation.x][newLocation.y] = 'Visited';
        }

        return newLocation;
    };
});