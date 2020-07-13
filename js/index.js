document.addEventListener("DOMContentLoaded", event => {
    //#region VARIABLES

    //#region CHEATS/SETTINGS

    const cheatsOn = true;
    const cheatKey = false;
    const cheatWeapon = false;
    const cheatFogOfWar = true;
    const cheatMoney = 0;
    const startVolume = 0.0;

    //Minimum dayDuration + nightDuration = 72, (55, 17) = 1 ticks per minute and change to nighttime at 18:19
    const dayTimeControls = {
        dayDuration: 550,
        nightDuration: 170,
        transitDuration: 60,
    }

    let timeControls = {
        day: 1,
        hour: 0,
        minute: 0,
        totalMinutes: 0,
        tick: 0,
        ticksPerGameMinute: 0,
        dayElement: document.getElementById("day"),
        timeElement: document.getElementById("time"),
        addTick() {
            this.tick++;
            if (this.tick >= this.ticksPerGameMinute) {
                this.tick = 0;
                this.minute++;
                this.totalMinutes++;
                if (this.minute >= 60) {
                    this.hour++;
                    this.minute = 0;
                    if (this.hour >= 24) {
                        this.nextDay();
                    }
                }
                this.dayElement.textContent = this.day;
                this.timeElement.textContent = this.formatTime;
            }
        },
        nextDay() {
            this.day++;
            this.hour = 0;
            this.minute = 0;
            this.tick = 0;
            this.totalMinutes = 0;
        },
        get formatHour() {
            return ("0" + this.hour).slice(-2);
        },
        get formatMinute() {
            return ("0" + this.minute).slice(-2);
        },
        get formatTime() {
            return this.formatHour + ":" + this.formatMinute;
        },
    }

    //#endregion CHEATS/SETTINGS

    // Zone
    const background = document.getElementById("background");
    const zoneContainer = document.getElementById("zone-container");
    const miniMapContainer = document.getElementById("mini-map");
    const miniMapZoom = document.getElementById("mini-map-enlarger");
    const actions = document.getElementById("actions");
    const settings = document.getElementById("settings");

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

    // Sun
    const sun = document.getElementById("sun");
    let cycleDaylight = true;

    //Animation frame variables
    let lastTime;
    let animFrame;
    let deltaTime;
    let engineActive = true;
    let torchEquipping = false;
    let torchUnEquipping = false;
    let torchEquipTimeCurrent = 0;
    const torchEquipTime = 0.3;
    let firstDaylight = true;

    //Animation frame tick/timer variables
    const ticksPerSecond = 20;
    const tickTime = 1 / ticksPerSecond;
    let dayTimeTick = 0;
    let tTime = 0;

    //Inventory
    const playerInventory = document.getElementById("inventory");
    const inventoryGrid = document.getElementById("inventory-grid");
    const secondaryInventory = document.getElementById("inventory-secondary");
    const secondaryInventoryGrid = document.getElementById("inventory-secondary-grid");

    const invInfo = {
        main: document.getElementById("inv-info"),
        image: document.getElementById("inv-info-image"),
        title: document.getElementById("inv-info-title"),
        content: document.getElementById("inv-info-content"),
    }

    let invBtns = [];
    let invBtnSelectedIndex = 0;
    let inv2ndBtns = [];
    let inv2ndBtnSelectedIndex = 0;
    let uniqueIndex = -1;

    //UI
    const infoCenter = document.getElementById("info-center");
    const messageDelay = 300;
    const messageDuration = 18000;
    const messageFadeDuration = 300;

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

    const playerAnimTime = {
        move: 150,
        attack: 150,
    }

    const playerStats = {
        health: 30,
        strength: 0,
        armor: 0,
    }

    const playerAP = {
        current: 5,
        start: 5,
        max: 10,
    }

    const attackElements = document.querySelectorAll(".attack-element");

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

    //#endregion VARIABLES

    //#region OBJECTS used in CLASSES

    const enemyType = {
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
                    player.removeCoins(player.coins);
                    // player.takeDamage(this.strength.value); // Damage is done on the classes, and this line gives an extra amount of damage.
                }
            },
            enemyDeath: function(enemy) {
                //Nothing
            }
        },
    }

    const worlds = {
        zoneCount(world) {
            const worldHeight = world.size.up + 1 + world.size.down;
            const worldwidth = world.size.left + 1 + world.size.right;
            return worldwidth * worldHeight;
        },
        tileCount(world) {
            return world.zoneSize * world.zoneSize;
        },
        reset(world) {
            world.region = null;
            world.miniMap = null;
            world.gatewayObjs = [];
        },
        resetAll() {
            for (let i = 0; i < Object.keys(this).length; i++) {
                const key = Object.keys(this)[i];
                if (this[key].gatewayObjs !== undefined) {
                    this.reset(this[key]);
                }
            }
        },
        home: {
            name: "Home",
            type: "indoor",
            locked: false,
            bioms: ["building"],
            obstacles: [],
            region: null,
            miniMap: null,
            size: {
                up: 0,
                right: 0,
                down: 0,
                left: 0,
            },
            zoneSize: 7,
            startZoneId: "0_0",
            gatewayObjs: [],
            placeGateways: function() {
                if (this.gatewayObjs.length > 0) {
                    for (let i = 0; i < this.gatewayObjs.length; i++) {
                        const gatewayObj = this.gatewayObjs[i];
                        replaceGateway(gatewayObj.gate, gatewayObj.gateway, gatewayObj.zone);
                    }
                    return;
                }
                const zone = region.getZone(this.startZoneId);
                const x = Math.floor(this.zoneSize / 2);
                const y = this.zoneSize - 1;
                const tileId = x + "_" + y;
                const gate = placeGateway(worlds.outdoor, zone, zone.getTileObj(tileId), { x: 0, y: -1 });
                this.gatewayObjs.push({ gate: gate, gateway: worlds.outdoor, zone: zone });
            },
            enemyPercentage: 0,
            enemyTypes: [],
            daylightCycle: false,
            darkness: 0,
        },
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
            zoneSize: 9,
            startZoneId: "0_0",
            gatewayObjs: [],
            placeGateways: function() {
                if (this.gatewayObjs.length > 0) {
                    for (let i = 0; i < this.gatewayObjs.length; i++) {
                        const gatewayObj = this.gatewayObjs[i];
                        replaceGateway(gatewayObj.gate, gatewayObj.gateway, gatewayObj.zone);
                    }
                    return;
                }
                const gateWays = [worlds.kartansLair, worlds.dungeonOfMachlain, worlds.orchsCave, worlds.piratesLair];
                for (let i = 0; i < gateWays.length; i++) {
                    const zone = region.getRandomZone();
                    const tileObj = zone.getRandomTile();
                    const gate = placeGateway(gateWays[i], zone, tileObj, { x: 0, y: 1 });
                    this.gatewayObjs.push({ gate: gate, gateway: gateWays[i], zone: zone });
                }
                const zone = region.getZone(this.startZoneId);
                const x = Math.floor(this.zoneSize / 2);
                const y = x - 1;
                const gate = placeGateway(worlds.home, zone, zone.getTileObj(x + "_" + y), { x: 0, y: 1 });
                this.gatewayObjs.push({ gate: gate, gateway: worlds.home, zone: zone });
            },
            enemyPercentage: 50,
            enemyTypes: [enemyType.skeleton, enemyType.orc, enemyType.goblin],
            daylightCycle: true,
            darkness: 0,
        },
        kartansLair: {
            name: "Kartans Lair",
            type: "dungeon",
            locked: true,
            bioms: ["dungeon"],
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
            startZoneId: "0_0",
            gatewayObjs: [],
            placeGateways: function() {
                if (this.gatewayObjs.length > 0) {
                    for (let i = 0; i < this.gatewayObjs.length; i++) {
                        const gatewayObj = this.gatewayObjs[i];
                        replaceGateway(gatewayObj.gate, gatewayObj.gateway, gatewayObj.zone);
                    }
                    return;
                }
                // const gateWays = [];
                // for (let i = 0; i < gateWays.length; i++) {
                //     const zone = region.getZone(this.startZoneId);
                //     const tileObj = zone.getRandomTile();
                //     const gate = placeGateway(gateWays[i], zone, tileObj, { x: 0, y: 1 });
                //     this.gatewayObjs.push({ gate: gate, gateway: gateWays[i], zone: zone });
                // }
                const zone = region.getZone(this.startZoneId);
                const tileObj = zone.getRandomTile();
                const gate = placeGateway(worlds.outdoor, zone, tileObj, { x: 0, y: 1 });
                this.gatewayObjs.push({ gate: gate, gateway: worlds.outdoor, zone: zone });
            },
            enemyPercentage: 75,
            enemyTypes: [enemyType.skeleton, enemyType.orc, enemyType.goblin],
            daylightCycle: false,
            darkness: 0.75,
        },
        dungeonOfMachlain: {
            name: "The Dungeon of Machlain",
            type: "dungeon",
            locked: true,
            bioms: ["dungeon"],
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
            startZoneId: "0_0",
            gatewayObjs: [],
            placeGateways: function() {
                if (this.gatewayObjs.length > 0) {
                    for (let i = 0; i < this.gatewayObjs.length; i++) {
                        const gatewayObj = this.gatewayObjs[i];
                        replaceGateway(gatewayObj.gate, gatewayObj.gateway, gatewayObj.zone);
                    }
                    return;
                }
                // const gateWays = [];
                // for (let i = 0; i < gateWays.length; i++) {
                //     const zone = region.getZone(this.startZoneId);
                //     const tileObj = zone.getRandomTile();
                //     const gate = placeGateway(gateWays[i], zone, tileObj, { x: 0, y: 1 });
                //     this.gatewayObjs.push({ gate: gate, gateway: gateWays[i], zone: zone });
                // }
                const zone = region.getZone(this.startZoneId);
                const tileObj = zone.getRandomTile();
                const gate = placeGateway(worlds.outdoor, zone, tileObj, { x: 0, y: 1 });
                this.gatewayObjs.push({ gate: gate, gateway: worlds.outdoor, zone: zone });
            },
            enemyPercentage: 65,
            enemyTypes: [enemyType.skeleton, enemyType.orc, enemyType.goblin],
            daylightCycle: false,
            darkness: 0.75,
        },
        orchsCave: {
            name: "Orchs cave",
            type: "dungeon",
            locked: true,
            bioms: ["dungeon"],
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
            startZoneId: "0_0",
            gatewayObjs: [],
            placeGateways: function() {
                if (this.gatewayObjs.length > 0) {
                    for (let i = 0; i < this.gatewayObjs.length; i++) {
                        const gatewayObj = this.gatewayObjs[i];
                        replaceGateway(gatewayObj.gate, gatewayObj.gateway, gatewayObj.zone);
                    }
                    return;
                }
                // const gateWays = [];
                // for (let i = 0; i < gateWays.length; i++) {
                //     const zone = region.getZone(this.startZoneId);
                //     const tileObj = zone.getRandomTile();
                //     const gate = placeGateway(gateWays[i], zone, tileObj, { x: 0, y: 1 });
                //     this.gatewayObjs.push({ gate: gate, gateway: gateWays[i], zone: zone });
                // }
                const zone = region.getZone(this.startZoneId);
                const tileObj = zone.getRandomTile();
                const gate = placeGateway(worlds.outdoor, zone, tileObj, { x: 0, y: 1 });
                this.gatewayObjs.push({ gate: gate, gateway: worlds.outdoor, zone: zone });
            },
            enemyPercentage: 70,
            enemyTypes: [enemyType.orc],
            daylightCycle: false,
            darkness: 0.75,
        },
        piratesLair: {
            name: "Pirates Lair",
            type: "dungeon",
            locked: true,
            bioms: ["dungeon"],
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
            startZoneId: "0_0",
            gatewayObjs: [],
            placeGateways: function() {
                if (this.gatewayObjs.length > 0) {
                    for (let i = 0; i < this.gatewayObjs.length; i++) {
                        const gatewayObj = this.gatewayObjs[i];
                        replaceGateway(gatewayObj.gate, gatewayObj.gateway, gatewayObj.zone);
                    }
                    return;
                }
                // const gateWays = [];
                // for (let i = 0; i < gateWays.length; i++) {
                //     const zone = region.getZone(this.startZoneId);
                //     const tileObj = zone.getRandomTile();
                //     const gate = placeGateway(gateWays[i], zone, tileObj, { x: 0, y: 1 });
                //     this.gatewayObjs.push({ gate: gate, gateway: gateWays[i], zone: zone });
                // }
                const zone = region.getZone(this.startZoneId);
                const tileObj = zone.getRandomTile();
                const gate = placeGateway(worlds.outdoor, zone, tileObj, { x: 0, y: 1 });
                this.gatewayObjs.push({ gate: gate, gateway: worlds.outdoor, zone: zone });
            },
            enemyPercentage: 75,
            enemyTypes: [enemyType.skeleton, enemyType.goblin],
            daylightCycle: false,
            darkness: 0.75,
        }
    }

    //#endregion OBJECTS used in CLASSES

    //#region CLASSES

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
            this.safeZones = [];
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
        setSafeZones(amount) {
            const startZone = this.getZone("0_0");
            startZone.setSafe();
            this.safeZones.push(startZone);
            for (let i = 0; i < amount; i++) {
                if (this.zones.length == 0) {
                    return null;
                }
                let rnd = randomInteger(0, this.zones.length);
                if (this.zones.length > 1 && this.zones[rnd].id != "0_0") {
                    rnd = randomInteger(0, this.zones.length);
                }
                this.zones[rnd].setSafe();
                this.safeZones.push(this.zones[rnd]);
            }
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
            if (!includeStartZone && this.zones.length > 1) {
                while (this.zones[rnd].id == "0_0") {
                    rnd = randomInteger(0, this.zones.length);
                }
            }
            return this.zones[rnd];
        }
        getRandomSafeZone(includeStartZone = false) {
            if (this.safeZones.length == 0) {
                return null;
            }
            let rnd = randomInteger(0, this.safeZones.length);
            if (!includeStartZone && this.safeZones.length > 1) {
                while (this.safeZones[rnd].id == "0_0") {
                    rnd = randomInteger(0, this.safeZones.length);
                }
            }
            return this.safeZones[rnd];
        }
        getRandomUnsafeZone() {
            if (this.zones.length == 0) {
                return null;
            }
            let rnd = randomInteger(0, this.zones.length);
            if (this.zones.length > 1) {
                while (this.zones[rnd].safe) {
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
        reset() {
            this.zones = [];
            this.safeZones = [];
            this.enemies = [];
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
            this.gateway;
            this.safe = false;
        }
        initialize() {
            if (this.id == "0_0") {
                this.explore();
            }
        }
        explore() {
            this.explored = true;
        }
        setSafe() {
            this.safe = true;
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
        getCenterTile() {
            if (currentZone.tiles.length == 0) {
                return null;
            }
            const tileObj = this.getTileObjFromIndex(Math.floor(currentZone.tiles.length / 2));
            return tileObj;
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
            this.setElementClassType();
        }
        placeHTML(objectHTML) {
            this.element.append(objectHTML);
        }
        setElementClassType() {
            if (this.element) {
                this.element.className = `zone__tile zone__${this.type}`;
            }
        }
        removeObject(objectElement) {
            this.element.removeChild(objectElement);
            this.object = null;
            this.type = "empty";
            this.occupied = false;
            this.setElementClassType();
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
        tileRemoveClass(id, cls) {
            const miniMapTile = document.getElementById("minimap_" + id);
            miniMapTile.classList.remove(cls);
        }
    }

    class Gate {
        constructor(world, tileObj, offsetObj) {
            this.world = world;
            this.id = world.name;
            this.cls = world.type;
            this.locked = world.locked;
            this.tileObj = tileObj;
            this.exitTileId;
            this.initialize(offsetObj);
        }
        initialize(offsetObj) {
            this.tileObj.object = this;
            this.tileObj.type = "gate";
            this.tileObj.occupied = true;
            this.setGateway(offsetObj.x, offsetObj.y);
        }
        setGateway(offsetX, offsetY) {
            const obj = this.tileObj.coordinates();
            this.exitTileId = (obj.x + offsetX) + "_" + (obj.y + offsetY);
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
            this.element = document.createElement("DIV");
            this.element.classList.add("gate");
            this.element.classList.add(this.cls);
            if (this.locked) {
                this.element.classList.add("locked");
                this.element.style.backgroundPosition = "0 0";
            } else {
                this.element.style.backgroundPosition = "0 -300%";
            }
            this.element.classList.add("tile__object");
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
            // this.totalLife = life;
            this.strength = strength;
            // this.baseStrength = strength;
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
            // this.apMoveElement = this.apElement.querySelector("#ap-move");
            // this.apAttackElement = this.apElement.querySelector("#ap-attack");
            this.apAttackElement = this.apElement.querySelector("#attack-damage");
            this.apPoints = [];
            this.onDeath = onDeath;
            this.baseMoveCost = 0;
            this.baseAttackCost = 0;
            this.moveCost = 1;
        }
        get currentTile() {
            return currentZone.getTileObj(this.tileId);
        }
        createTooltip() {
            this.tooltip = new Tooltip(this.name, this.texts, this.element);
            this.element.classType = this;
            this.element.addEventListener("mouseover", (evt) => this.showTooltip(evt));
            this.element.addEventListener("mouseout", (evt) => this.tooltip.hide(evt));
        }
        updateTooltip() {
            this.tooltip.setContent(this.texts);
        }
        showTooltip() {
            this.tooltip.showAbove();
        }
        sufficientAP(apCost) {
            if (this.actionPoints == 0) {
                return false;
            }
            if ((this.actionPoints - apCost) < 0) {
                return false;
            }
            return true;
        }
        apMove() {
            if (!this.sufficientAP(this.totalMoveCost)) {
                return -1;
            }
            this.actionPoints -= this.totalMoveCost;
            this.actionPointHTMLUpdate();
            return this.actionPoints;
        }
        apAttack() {
            if (!this.sufficientAP(this.totalAttackCost)) {
                return -1;
            }
            this.actionPoints -= this.totalAttackCost;
            this.actionPointHTMLUpdate();
            return this.actionPoints;
        }
        get totalMoveCost() {
            let armorCost = 0;
            if (this.armorItem) {
                armorCost = this.armorItem.apMoveCost;
            }
            return armorCost + this.baseMoveCost + this.moveCost;
        }
        get totalAttackCost() {
            return this.baseAttackCost + this.weaponAttackCost;
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
                // if (i < this.actionPoints) {
                //     let apPointFill = document.createElement("DIV");
                //     apPointFill.classList.add("fill");
                //     apPoint.append(apPointFill);
                // }
                let apPointFill = document.createElement("DIV");
                apPointFill.classList.add("fill");
                apPoint.append(apPointFill);

                this.ap.append(apPoint);
                this.apPoints.push(apPoint);
            }
            this.actionPointHTMLUpdate();
            // this.apCostUpdate();
        }
        actionPointHTMLRemove() {
            this.ap.innerHTML = "";
            this.apElement.classList.remove("js-active");
        }
        actionPointHTMLUpdate(isAttackAP = false) {
            for (let i = 0; i < this.apPoints.length; i++) {
                const apPoint = this.apPoints[i];
                apPoint.classList.remove("empty");
                apPoint.classList.remove("cost");
                let cost = 0;
                if (isAttackAP) {
                    cost = this.totalAttackCost;
                } else {
                    cost = this.totalMoveCost;
                }
                // this.apAttackElement.textContent = cost;
                const extraPoints = this.actionPoints - cost;
                if (i >= this.actionPoints) {
                    apPoint.classList.add("empty");
                } else if (extraPoints < 0) {
                    apPoint.classList.add("deficient");
                } else if (i >= extraPoints) {
                    apPoint.classList.add("cost");
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
            if (this.isDead) {
                return;
            }
            this.life.add(amount);
            if (this.life.value <= 0) {
                this.isDead = true;
                this.onDeath(this);
            }
            this.updateHealthBar();
        }
        takeDamage(damage) {
            if (this.isDead || damage <= 0) {
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
                this.cardHealthBar.style.width = `${this.life.value / this.life.baseValue * 100}%`
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
            this.torchSize = 20;
            this.overlay;
            this.torchOverlay;
            this.nightOverlay;
            this.tooltip;
            this.keys = [];
            this.isFleeing = false;
            this.fleeCost = this.actionPointStart;
            this.fleeElement = document.getElementById("combat-flee");
            this.fleeCostElement = document.getElementById("combat-flee-cost");
            this.moveElement = document.getElementById("combat-move");
            this.moveCostElement = document.getElementById(`combat-move-cost`);
            this.initialize();
        }
        initialize() {
            this.ui.life.count.textContent = this.life.value;
            this.ui.strength.count.textContent = this.strength.value;
            this.ui.armor.count.textContent = this.armor.value;
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

            this.setTorchSize();
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
        increaseTorchSize() {
            this.torchSize += 5;
            this.setTorchSize();
            return this.torchSize;
        }
        setTorchSize() {
            this.torchOverlay.style.transform = `scale(${this.torchSize})`;
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
                tooltipElm("Life: ", this.life.value),
                tooltipElm("Damage: ", this.strength.value),
                tooltipElm("Armor: ", this.armor.value),
                tooltipElm("Movement speed: ", this.moveTime),
                tooltipElm("Action points: ", ""),
                tooltipElm("Move cost: ", this.totalMoveCost, "list"),
                tooltipElm("Attack cost: ", this.totalAttackCost, "list"),
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
            this.element.style.animationDuration = `${this.moveTime}ms`;
            this.updateTooltip();
        }
        addLife(amount) {
            super.addLife(amount);
            this.ui.life.count.textContent = this.life.value;
            this.updateTooltip();
        }
        setWeaponItem(item) {
            if (this.weaponItem != undefined) {
                this.inventory.addItem(this.weaponItem);
            }
            this.weaponItem = item;
            this.ui.strength.icon.style.backgroundPosition = `-${item.posX}% -${item.posY}%`;
            // this.fleeCost = this.weaponItem.fleeCost;
            this.fleeCostElement.textContent = this.fleeCost;
            this.weaponItem.button.update();
            this.setPrimaryWeapon();
            this.updateTooltip();
            // this.apCostUpdate();
        }
        setPrevZone(zone) {
            this.zone = zone;
        }
        setConfirmation(fleeConfirm) {
            this.fleeConfirm = fleeConfirm;
        }
        confirmation(caller, confirmed) {
            caller.isFleeing = false;
            if (confirmed) {
                caller.fleeSuccessCallback(caller.zone);
            }
            caller.fleeConfirm.hide();
        }
        confirmToggleButton() {
            this.fleeConfirm.toggleButtons();
        }
        confirmationPressed() {
            this.fleeConfirm.buttonPressed();
        }
        combatFlee(fleeSuccessCallback) {
            if (!this.sufficientAP(this.fleeCost)) {
                return;
            }
            this.fleeSuccessCallback = fleeSuccessCallback;
            this.isFleeing = true;
            this.fleeConfirm.show(this);
        }
        setMove() {
            // this.moveCost = this.weaponItem.moveCost;
            this.resetWeaponButtons();
            this.moveElement.classList.add("js-active");
            this.actionPointHTMLUpdate();
            this.moveCostElement.textContent = this.totalMoveCost;
        }
        setPrimaryWeapon() {
            this.weaponAttackCost = this.weaponItem.primaryCost;
            this.strength.set(this.weaponItem.primaryDamage);
            this.ui.strength.count.textContent = this.strength.value;
            this.apAttackElement.textContent = this.strength.value;
            this.resetWeaponButtons();
            this.weaponItem.button.primary();
            this.actionPointHTMLUpdate(true);
            this.updateTooltip();
        }
        setSecondaryWeapon() {
            this.weaponAttackCost = this.weaponItem.secondaryCost;
            this.strength.set(this.weaponItem.secondaryDamage);
            this.ui.strength.count.textContent = this.strength.value;
            this.apAttackElement.textContent = this.strength.value;
            this.weaponItem.button.secondary();
            this.resetWeaponButtons();
            this.actionPointHTMLUpdate(true);
            this.updateTooltip();
        }
        resetWeaponButtons() {
            this.fleeElement.classList.remove("js-active");
            this.moveElement.classList.remove("js-active");
            this.weaponItem.button.resetButtons();
        }
        setArmor(item) {
            if (this.armorItem != undefined) {
                this.inventory.addItem(this.armorItem);
            }
            this.armorItem = item;
            this.armor.set(item.amount);
            this.ui.armor.icon.style.backgroundPosition = `-${item.posX}% -${item.posY}%`;
            this.ui.armor.count.textContent = this.armor.value;
            this.updateTooltip();
            // this.apCostUpdate();
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
            super.takeDamage(amount - this.armor.value);
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
            item.onCollect();
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
                tooltipElm("Life: ", this.life.value),
                tooltipElm("Damage: ", this.strength.value),
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
            bar.style.width = `${this.life.value / this.life.baseValue * 100}%`;
            barText.classList.add("bar__text");
            barText.textContent = `${this.life.value} / ${this.life.baseValue}`;
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
        addLife(amount) {
            super.addLife(amount);
            if (this.life.value <= 0) {
                this.tooltip.remove();
            }
        }
        takeDamage(damage) {
            super.takeDamage(damage);
            this.elmBar.style.width = `${this.life.value / this.life.baseValue * 100}%`;
            this.elmBarText.textContent = `${this.life.value} / ${this.life.baseValue}`;
            if (this.life.value <= 0) {
                this.currentTile.removeObject(this.element);
                return true;
            }
            this.updateTooltip();
            return false;
        }
    }

    class WeaponButton {
        constructor(primaryName, primaryCost, primaryDamage, secondaryName, secondaryCost, secondaryDamage, attackElements) {
            // this.fleeCost = fleeCost;
            // this.moveCost = moveCost;
            // this.totalMoveCost = this.moveCost;
            this.primaryName = primaryName;
            this.primaryCost = primaryCost;
            this.primaryDamage = primaryDamage;
            this.secondaryName = secondaryName;
            this.secondaryCost = secondaryCost;
            this.secondaryDamage = secondaryDamage;
            this.attackElements = attackElements;

            // this.fleeCostElement = document.getElementById("combat-flee-cost");
            this.primaryNameElement = document.getElementById(`combat-primary-name`);
            this.primaryCostElement = document.getElementById(`combat-primary-cost`);
            this.primaryDamageElement = document.getElementById(`combat-primary-damage`);
            this.secondaryNameElement = document.getElementById(`combat-secondary-name`);
            this.secondaryCostElement = document.getElementById(`combat-secondary-cost`);
            this.secondaryDamageElement = document.getElementById(`combat-secondary-damage`);

            // this.moveElement = document.getElementById("combat-move");
            // this.moveCostElement = document.getElementById(`combat-move-cost`);
            // this.moveCostElement.textContent = this.moveCost;

            // this.fleeElement = document.getElementById("combat-flee");
            this.primaryElement = document.getElementById(`combat-primary`);
            this.secondaryElement = document.getElementById(`combat-secondary`);

            this.primaryNameElement.textContent = this.primaryName;
            this.secondaryNameElement.textContent = this.secondaryName;
        }
        update() {
                this.primaryCostElement.textContent = this.primaryCost;
                this.secondaryCostElement.textContent = this.secondaryCost;
                this.primaryDamageElement.textContent = this.primaryDamage;
                this.secondaryDamageElement.textContent = this.secondaryDamage;
            }
            // move() {
            //     this.currentFnc = this.move;
            //     this.setElementState(this.moveElement);
            // }
        primary() {
            // this.currentFnc = this.primary;
            this.resetButtons();
            this.primaryElement.classList.add("js-active");
            this.primaryElement.classList.add("js-selected");
            this.secondaryElement.classList.remove("js-selected");
        }
        secondary() {
            // this.currentFnc = this.secondary;
            this.resetButtons();
            this.secondaryElement.classList.add("js-active");
            this.secondaryElement.classList.add("js-selected");
            this.primaryElement.classList.remove("js-selected");
        }
        resetButtons() {
            // this.fleeElement.classList.remove("js-active");
            // this.moveElement.classList.remove("js-active");
            for (let i = 0; i < this.attackElements.length; i++) {
                const attackElement = this.attackElements[i];
                attackElement.classList.remove("js-active");
            }
        }
    }

    class Confirmation {
        constructor(title, text, buttonConfirmText, buttonCancelText, callback) {
            this.callback = callback;
            this.element = document.getElementById("confirm-box");
            this.titleElement = document.getElementById("confirm-title");
            this.textElement = document.getElementById("confirm-text");
            this.confirmButtonElement = document.getElementById("confirm");
            this.cancelButtonElement = document.getElementById("cancel");

            this.titleElement.textContent = title;
            this.textElement.innerHTML = text;
            this.confirmButtonElement.textContent = buttonConfirmText;
            this.cancelButtonElement.textContent = buttonCancelText;

            this.confirmButtonElement.addEventListener("click", evt => this.confirm(evt));
            this.cancelButtonElement.addEventListener("click", evt => this.cancel(evt));
        }
        show(caller) {
            this.caller = caller;
            this.element.classList.remove("js-hidden");
        }
        hide() {
            this.element.classList.add("js-hidden");
        }
        toggleButtons() {
            this.confirmButtonElement.classList.toggle("js-active");
            this.cancelButtonElement.classList.toggle("js-active");
        }
        buttonPressed() {
            if (this.confirmButtonElement.classList.contains("js-active")) {
                this.confirm();
            } else {
                this.cancel();
            }
        }
        confirm() {
            this.hide();
            this.callback(this.caller, true);
        }
        cancel() {
            this.hide();
            this.callback(this.caller, false);
        }
    }

    // class AttackSword extends Attack{
    //     constructor(type, fleeCost, swingCost, swingDamage, stabCost, stabDamage){
    //         super(fleeCost);
    //         this.swingElement = document.getElementById("combat-primary");
    //         this.swingDamageElement = document.getElementById("combat-primary-damage");
    //         this.stabElement = document.getElementById("combat-secondary");
    //         this.stabDamageElement = document.getElementById("combat-secondary-damage");
    //         this.setSwingCost(swingCost);
    //         this.setSwingDamage(swingDamage);
    //         this.setStabCost(stabCost);
    //         this.setStabDamage(stabDamage);
    //     }
    //     setSwingCost(cost){
    //         this.swingCost = cost;
    //         this.swingElement.textContent = this.swingCost;
    //     }
    //     setSwingDamage(damage){
    //         this.swingDamage = damage;
    //         this.swingDamageElement.textContent = this.swingDamage;
    //     }
    //     setStabCost(cost){
    //         this.stabCost = cost;
    //         this.stabElement.textContent = this.stabCost;
    //     }
    //     setStabDamage(damage){
    //         this.stabDamage = damage;
    //         this.stabDamageElement.textContent = this.stabDamage;
    //     }
    // }

    class Item {
        constructor(id, collectable) {
            this.id = id;
            this.collectable = collectable;
            this.type = collectable.type;
            this.name = collectable.name;
            this.amount;
            this.button = collectable.attack;
            if (this.button != null) {
                this.primaryName = this.button.primaryName;
                this.primaryDamage = this.button.primaryDamage;
                this.primaryCost = this.button.primaryCost;
                this.secondaryName = this.button.secondaryName;
                this.secondaryDamage = this.button.secondaryDamage;
                this.secondaryCost = this.button.secondaryCost;
            }
            this.posX = collectable.spriteCoordinates.x * 100;
            this.posY = collectable.spriteCoordinates.y * 100;
            this.equipable = collectable.equipable;
            this.stackable = collectable.stackable;
            this.apMoveCost = collectable.apMoveCost;
            this.equipped = false;
            this.initialize(collectable.minValue, collectable.maxValue);
        }
        initialize(minValue, maxValue) {
            this.amount = randomInteger(minValue, maxValue);
        }
        createHTML() {
            this.element = document.createElement("DIV");
            this.element.classList.add("item");
            this.element.style.backgroundPosition = `-${this.posX}% -${this.posY}%`;
            this.element.classList.add("tile__object");
            return this.element;
        }
        equip(isEquipped) {
            if (this.equipable) {
                this.equipped = isEquipped;
            }
        }
        onCollect() {
            this.collectable.onCollect(this);
            if (this.collectable.collectSFX) {
                new SFX(this.collectable.collectSFX, sfxVolume);
            }
        }
        onUse(inventory) {
            this.collectable.onUse(this, inventory);
            if (this.collectable.useSFX) {
                new SFX(this.collectable.useSFX, sfxVolume);
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
        constructor(owner) {
            this.owner = owner;
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
                if (content.item.stackable) {
                    if (content.item.name === item.name) {
                        return i;
                    }
                } else {
                    if (content.item.id === item.id) {
                        return i;
                    }
                }
            }
            return -1;
        }
        onUse(item) {
            item.onUse(this);
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
            if (this.element) {
                this.element.parentNode.removeChild(this.element);
            }
        }
    }

    class Chest {
        constructor(tileObj, inventory) {
            this.tileObj = tileObj;
            this.inventory = inventory;
        }
        createHTML() {
            this.element = document.createElement("DIV");
            this.element.classList.add(this.inventory.owner);
            this.element.classList.add("tile__object");
            return this.element;
        }
    }

    class Attribute {
        constructor(value, isRange) {
            this.value = value;
            this.isRange = isRange;
            this.baseValue = value;
            this.temp;
        }
        set(value) {
            this.value = value;
            if (this.isRange && this.value > this.baseValue) {
                this.reset();
            }
            if (this.isRange && this.value < 0) {
                this.set(0);
            }
        }
        add(amount = 1) {
            let value = this.value;
            value += amount;
            this.set(value);
        }
        remove(amount = 1) {
            this.add(-amount);
        }
        save() {
            this.temp = this.value;
        }
        recall() {
            this.value = this.temp;
        }
        reset() {
            this.value = this.baseValue;
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

    //#endregion CLASSES

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
        floating: {
            name: "Floating number",
            class: "floating-number",
            speed: 20,
            duration: 1500,
            createHTML: function(element, value) {
                let fx = document.createElement("DIV");
                fx.classList.add("effect");
                fx.classList.add(this.class);
                fx.classList.add("tile__object");
                fx.style.animationDuration = `${this.duration}ms`;
                fx.innerHTML = value;
                element.append(fx);
                setTimeout(() => {
                    element.removeChild(fx);
                }, this.duration);
            },
            soundEffect(soundFile) {
                // new SFX("./audio/sfx/" + soundFile, sfxVolume);
            }
        },
    }

    let collectables = {
        coins: {
            name: "Coin",
            type: "coin",
            spriteCoordinates: { x: 3, y: 3 },
            includeInStartZone: true,
            stacks: 15,
            minValue: 10,
            maxValue: 30,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: false,
            spawnPropability: 40,
            collectSFX: "./audio/sfx/CHAIN_Drop_03_mono.ogg",
            useSFX: "./audio/sfx/CHAIN_Drop_03_mono.ogg",
            attack: null,
            onCollect(item) {
                player.addCoins(item.amount);
            },
            onUse(item, inventory) {

            }
        },
        potions: {
            name: "Potion",
            type: "life",
            spriteCoordinates: { x: 3, y: 4 },
            includeInStartZone: false,
            stacks: 10,
            minValue: 10,
            maxValue: 10,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 20,
            collectSFX: "./audio/sfx/EAT_Swallow_mono.ogg",
            useSFX: "./audio/sfx/EAT_Swallow_mono.ogg",
            attack: null,
            onCollect(item) {
                player.inventory.addItem(item);
            },
            onUse(item, inventory) {
                if (inventory.owner === "player") {
                    if (player.life.value < player.life.baseValue) {
                        player.addLife(item.amount);
                        if (!player.inventory.removeItem(item)) {
                            createInventoryItemsUI(player.inventory);
                        }
                    }
                }
                if (inventory.owner === "chest") {
                    player.inventory.addItem(item);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
            }
        },
        keys: {
            name: "Key",
            type: "key",
            spriteCoordinates: { x: 6, y: 0 },
            includeInStartZone: false,
            stacks: 0.4,
            minValue: 1,
            maxValue: 1,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 0,
            collectSFX: "./audio/sfx/LOCK_Metal_Padlock_Unlock_Pop_01_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                player.addKey(item);
            },
            onUse(item, inventory) {
                if (inventory.owner === "chest") {
                    player.inventory.addItem(item);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
            }
        },
        woodenSword: {
            name: "Wood sword",
            type: "weapon",
            spriteCoordinates: { x: 1, y: 2 },
            includeInStartZone: false,
            stacks: 2,
            minValue: 10,
            maxValue: 10,
            stackable: false,
            equipable: true,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 10,
            collectSFX: "./audio/sfx/BOW_Release_Arrow_mono.ogg",
            useSFX: null,
            attack: new WeaponButton("Power", 2, 8, "Stab", 1, 3, attackElements),
            onCollect(item) {
                player.inventory.addItem(item);
            },
            onUse(item, inventory) {
                if (inventory.owner === "player") {
                    player.setWeaponItem(item);
                    player.inventory.removeItem(item);
                    createInventoryItemsUI(player.inventory);
                }
                if (inventory.owner === "chest") {
                    player.inventory.addItem(item);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
            }
        },
        ironSword: {
            name: "Iron sword",
            type: "weapon",
            spriteCoordinates: { x: 3, y: 2 },
            includeInStartZone: false,
            stacks: 1.6,
            minValue: 21,
            maxValue: 28,
            stackable: false,
            equipable: true,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 8,
            attack: new WeaponButton("Power", 2, 14, "Stab", 1, 6, attackElements),
            collectSFX: "./audio/sfx/FRICTION_Metal_Bars_05_mono.ogg",
            useSFX: null,
            onCollect(item) {
                player.inventory.addItem(item);
            },
            onUse(item, inventory) {
                if (inventory.owner === "player") {
                    player.setWeaponItem(item);
                    player.inventory.removeItem(item);
                    createInventoryItemsUI(player.inventory);
                }
                if (inventory.owner === "chest") {
                    player.inventory.addItem(item);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
            }
        },
        ironAxe: {
            name: "Iron axe",
            type: "weapon",
            spriteCoordinates: { x: 2, y: 0 },
            includeInStartZone: false,
            stacks: 1.2,
            minValue: 45,
            maxValue: 52,
            stackable: false,
            equipable: true,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 4,
            collectSFX: "./audio/sfx/FRICTION_Metal_Bars_02_mono.ogg",
            useSFX: null,
            attack: new WeaponButton("Power", 3, 24, "Dash", 2, 13, attackElements),
            onCollect(item) {
                player.inventory.addItem(item);
            },
            onUse(item, inventory) {
                if (inventory.owner === "player") {
                    player.setWeaponItem(item);
                    player.inventory.removeItem(item);
                    createInventoryItemsUI(player.inventory);
                }
                if (inventory.owner === "chest") {
                    player.inventory.addItem(item);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
            }
        },
        smallShield: {
            name: "Small shield",
            type: "armor",
            spriteCoordinates: { x: 5, y: 0 },
            includeInStartZone: false,
            stacks: 1.5,
            minValue: 2,
            maxValue: 2,
            stackable: false,
            equipable: true,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 8,
            collectSFX: "./audio/sfx/TOOL_Toolbox_Close_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                player.inventory.addItem(item);
            },
            onUse(item, inventory) {
                if (inventory.owner === "player") {
                    player.setArmor(item);
                    player.inventory.removeItem(item);
                    createInventoryItemsUI(player.inventory);
                }
                if (inventory.owner === "chest") {
                    player.inventory.addItem(item);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
            }
        },
        largeShield: {
            name: "Large shield",
            type: "armor",
            spriteCoordinates: { x: 4, y: 0 },
            includeInStartZone: false,
            stacks: 1,
            minValue: 5,
            maxValue: 5,
            stackable: false,
            equipable: true,
            apMoveCost: 1,
            inventoryItem: true,
            spawnPropability: 5,
            collectSFX: "./audio/sfx/TOOL_Toolbox_Close_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                player.inventory.addItem(item);
            },
            onUse(item, inventory) {
                if (inventory.owner === "player") {
                    player.setArmor(item);
                    player.inventory.removeItem(item);
                    createInventoryItemsUI(player.inventory);
                }
                if (inventory.owner === "chest") {
                    player.inventory.addItem(item);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
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
            if (!player.isFleeing) {
                if (player.inBattle && playersTurn) {
                    if (evt.key == "1") {
                        player.combatFlee(function(zone) {
                            moveToZone(zone.id);
                            placePlayer(zone.getRandomTile());
                        });
                    }
                    if (evt.key == "2") {
                        player.setMove();
                    }
                    if (evt.key == "3") {
                        player.setPrimaryWeapon();
                    }
                    if (evt.key == "4") {
                        player.setSecondaryWeapon();
                    }
                }
                if (evt.key == "m") {
                    miniMap.zoomToggle();
                }
                if (evt.key == "i") {
                    if (!player.inBattle) {
                        togglePlayerInventory();
                    }
                }
                if (evt.key == "t") {
                    player.toggleTorch();
                }
                if (evt.key == "e") {
                    if (player.inBattle) {
                        if (playersTurn) {
                            nextTurn();
                        }
                    } else if (inventoryActive) {
                        hideInventory();
                    } else if (miniMap.enlarged) {
                        miniMap.zoomToggle();
                    } else {
                        toggleMenu();
                    }
                }
            }
            if (evt.key == "Enter") {
                if (menuActive) {
                    menuButtonPressed();
                    hideMenu();
                } else if (inventoryActive && invBtns.length > 0) {
                    clickInventoryButton(invBtns[invBtnSelectedIndex].element, invBtns[invBtnSelectedIndex].inventory, invBtns[invBtnSelectedIndex].content);
                } else if (player.isFleeing) {
                    player.confirmationPressed();
                }
            }
            if (evt.key == "Escape") {
                hideMenu();
                hideInventory();
                if (miniMap.enlarged) {
                    miniMap.zoomToggle();
                }
                if (player.isFleeing) {
                    player.confirmation(player, false);
                }
            }
        } else {
            welcomeScreen.classList.add("js-hidden");
            startFormName.focus();
        }
    });

    zoneContainer.addEventListener("mouseout", pathsRemove);

    function addPlayerControls() {
        document.addEventListener("keydown", function(evt) {
            if (evt.repeat || !playersTurn || playerIsMoving) {
                return;
            }
            if (evt.key == "w" || evt.key == "ArrowUp") {
                if (menuActive) {
                    console.log("UP");
                } else if (inventoryActive) {
                    selectInventoryButtonUp();
                } else {
                    playerMove("up");
                }
            }
            if (evt.key == "s" || evt.key == "ArrowDown") {
                if (menuActive) {
                    console.log("DOWN");
                } else if (inventoryActive) {
                    selectInventoryButtonDown();
                } else {
                    playerMove("down");
                }
            }
            if (evt.key == "a" || evt.key == "ArrowLeft") {
                if (menuActive) {
                    menuPrev();
                } else if (inventoryActive) {
                    selectInventoryButtonPrev();
                } else if (player.isFleeing) {
                    player.confirmToggleButton();
                } else {
                    playerMove("left");
                }
            }
            if (evt.key == "d" || evt.key == "ArrowRight") {
                if (menuActive) {
                    menuNext();
                } else if (inventoryActive) {
                    selectInventoryButtonNext();
                } else if (player.isFleeing) {
                    player.confirmToggleButton();
                } else {
                    playerMove("right");
                }
            }
        });
    }
    //#endregion EVENT LISTENERS

    //#region MENU FUNCTIONS
    function togglePlayerInventory() {
        inventoryActive = !inventoryActive;
        if (inventoryActive) {
            showInventory(player.inventory);
        } else {
            hideInventory();
        }
    }

    function showInventory(inventory) {
        playerInventory.classList.remove("js-hidden");
        inventoryActive = true;
        if (inventory.owner === "chest") {
            playerInventory.classList.add("two-inventories");
            secondaryInventory.classList.remove("js-hidden");
        } else {
            playerInventory.classList.remove("two-inventories");
            secondaryInventory.classList.add("js-hidden");
        }
        createInventoryItemsUI(inventory);
    }

    function hideInventory() {
        playerInventory.classList.add("js-hidden");
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
                togglePlayerInventory();
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
    //TODO: Secondary inventory (secondaryInventoryGrid)
    function createInventoryItemsUI(inventory) {
        invBtns = [];
        invBtnSelectedIndex = 0;
        inv2ndBtns = [];
        inv2ndBtnSelectedIndex = 0;
        inventoryGrid.innerHTML = "";
        secondaryInventoryGrid.innerHTML = "";
        for (let i = 0; i < inventory.contents.length; i++) {
            const content = inventory.contents[i];
            inventoryGrid.append(inventoryItemButton(inventory, content));
        }
        selectInventoryButton(0);
    }

    function inventoryItemButton(inventory, content) {
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
            clickInventoryButton(this, inventory, content);
        });
        button.addEventListener("mouseover", function() {
            setInventoryHoverInfo(content.item);
        });

        invBtns.push({ element: button, inventory: inventory, content: content });
        return button;
    }

    function clickInventoryButton(button, inventory, content) {
        inventory.onUse(content.item);
        if (content.item.stackable) {
            button.innerHTML = `<span class="inventory__amount">${content.count}</span>`;
        }
    }

    function selectInventoryButton(index) {
        if (invBtns.length === 0) {
            invInfo.main.classList.add("empty");
            return;
        }
        invInfo.main.classList.remove("empty");
        invBtns[invBtnSelectedIndex].element.classList.remove("js-active");
        invBtnSelectedIndex = index;
        invBtns[invBtnSelectedIndex].element.classList.add("js-active");
        setInventoryHoverInfo(invBtns[invBtnSelectedIndex].content.item);
    }

    function selectInventoryButtonPrev() {
        let index = invBtnSelectedIndex - 1;
        if (index < 0) {
            index = invBtns.length - 1;
        }
        selectInventoryButton(index);
    }

    function selectInventoryButtonNext() {
        let index = invBtnSelectedIndex + 1;
        if (index >= invBtns.length) {
            index = 0;
        }
        selectInventoryButton(index);
    }

    function selectInventoryButtonUp() {
        let index = invBtnSelectedIndex - 5;
        if (index < 0) {
            index = 0;
        }
        selectInventoryButton(index);
    }

    function selectInventoryButtonDown() {
        let index = invBtnSelectedIndex + 5;
        if (index >= invBtns.length) {
            index = invBtns.length - 1;
        }
        selectInventoryButton(index);
    }

    function setInventoryHoverInfo(item) {
        invInfo.image.style.backgroundPosition = `-${item.posX}% -${item.posY}%`;
        invInfo.title.textContent = item.name;
        let rows = `
            <div class="inventory-info__row">
                <p class="inventory-info__heading">Type:</p>
                <span class="inventory-info__text">${item.type}</span>
            </div>
        `;
        switch (item.type) {
            case "weapon":
                rows += `
                    <div class="inventory-info__row">
                        <p class="inventory-info__heading">${item.primaryName}:</p>
                        <span class="inventory-info__text">${item.primaryDamage} / ${item.primaryCost} AP</span>
                    </div>
                    <div class="inventory-info__row">
                        <p class="inventory-info__heading">${item.secondaryName}:</p>
                        <span class="inventory-info__text">${item.secondaryDamage} / ${item.secondaryCost} AP</span>
                    </div>
                `;
                break;
            case "armor":
                rows += `
                    <div class="inventory-info__row">
                        <p class="inventory-info__heading">Defense:</p>
                        <span class="inventory-info__text">${item.amount}</span>
                    </div>
                    <div class="inventory-info__row">
                        <p class="inventory-info__heading">Base move cost:</p>
                        <span class="inventory-info__text">${player.baseMoveCost}</span>
                    </div>
                    <div class="inventory-info__row">
                        <p class="inventory-info__heading">Base attack cost:</p>
                        <span class="inventory-info__text">${player.baseAttackCost}</span>
                    </div>
                    <div class="inventory-info__row">
                        <p class="inventory-info__heading">Move cost:</p>
                        <span class="inventory-info__text">${item.apMoveCost}</span>
                    </div>
                    <div class="inventory-info__row">
                        <p class="inventory-info__heading">Attack cost:</p>
                        <span class="inventory-info__text">${item.apAttackCost}</span>
                    </div>
                `;
                break;
            case "life":
                rows += `
                    <div class="inventory-info__row">
                        <p class="inventory-info__heading">Health amount:</p>
                        <span class="inventory-info__text">${item.amount}</span>
                    </div>
                `;
                break;

            default:
                value = "Amount";
                break;
        }
        invInfo.content.innerHTML = rows;
    }

    //#region START MENU FUNCTIONS
    function disableButton(button) {
        button.classList.add("js-disabled");
        button.disabled = true;
    }

    function enableButton(button) {
        button.classList.remove("js-disabled");
        button.disabled = false;
    }
    //#endregion START MENU FUNCTIONS

    //#endregion MENU FUNCTIONS

    //#region GAME FUNCTIONS

    function newGame(playerName) {
        music.crossFade(music.calm);
        currentWorld = worlds.home;
        dayTime = new Daytime(ticksPerSecond, dayTimeControls.dayDuration, dayTimeControls.nightDuration, dayTimeControls.transitDuration, background, function(t) {
                const sunUpPos = -40;
                if (cycleDaylight) {
                    if (firstDaylight) {
                        sun.style.display = "";
                        player.setOverlayOpacity(0);
                        sun.style.top = sunUpPos + "%";
                    } else {
                        let opacity = 1 / (this.transitDuration * this.ticksPerSecond) * t;
                        if (this.isNight) {
                            player.setOverlayOpacity(opacity);
                            sun.style.top = lerp(sunUpPos, 100, opacity) + "%";
                        } else {
                            player.setOverlayOpacity(1 - opacity);
                            sun.style.top = lerp(sunUpPos, 100, 1 - opacity) + "%";
                            if (player.torchEquipped && opacity > 0.8) {
                                player.setTorch(false);
                            }
                        }
                    }
                } else if (firstDaylight) {
                    sun.style.display = "none";
                }
            }, function() {
                if (cycleDaylight) {
                    sun.style.display = "";
                } else {
                    sun.style.display = "none";
                }
                console.log("Day, time: " + timeControls.formatTime);
            },
            function() {
                firstDaylight = false;
                if (cycleDaylight) {
                    sun.style.display = "";
                } else {
                    sun.style.display = "none";
                }
                console.log("Night, time: " + timeControls.formatTime);
            });
        const gameDayDuration = (dayTime.dayDuration + dayTime.nightDuration) * ticksPerSecond;
        const ticksPerGameMinute = gameDayDuration / 1440; // 24 * 60 = 1440 (game minutes per day)
        timeControls.ticksPerGameMinute = ticksPerGameMinute;
        region = new Region(currentWorld, background, zoneContainer, tileSize);
        miniMap = new MiniMap(region, miniMapContainer, miniMapZoom);
        playerName = playerName == "" ? "Player 1" : playerName;
        const sfxArr = ["VOICE_Girl_4yo_Hurt_Long_01_mono.ogg", "VOICE_Girl_4yo_Hurt_Short_01_mono.ogg", "VOICE_Girl_4yo_Hurt_Short_04_mono.ogg", "VOICE_Girl_4yo_Hurt_Short_05_mono.ogg"];
        player = new Player(playerName, "player", playerAnimTime.move, playerAnimTime.attack, new Attribute(playerStats.health, true), new Attribute(playerStats.strength, false), new Attribute(playerStats.armor, false), ui, null, actions, playerAP, sfxArr, new Inventory("player"), gameOver);
        player.setWeaponItem(new Item("start-sword", collectables.woodenSword));
        resetConfirmBox();
        player.setConfirmation(new Confirmation(
            "Flee?",
            "Are you sure you want to flee from the fight?<br>(You will be taken to a random tile in the last known safe area).",
            "Flee?",
            "Cancel",
            player.confirmation,
        ));
        battleQueueElement.innerHTML = "";
        buildMap(true);
        buildZone("0_0");
        placePlayer(currentZone.getCenterTile());
        addPlayerControls();
        setEvent();

        //Manual placement of dungeon
        // const tileObj = currentZone.getRandomTile();
        // placeDungeon(currentWorld.placeGateways()[0], currentZone, tileObj);
        if (cheatsOn) {
            player.addCoins(cheatMoney);
        }

        //Pathfinding algorithm test
        // updatePathfindingGrid();
        // console.log(findShortestPath({ x: 0, y: 0 }, { x: 3, y: 3 }, pathFindingGrid));

        gameStarted = true;
        startEngine();
    }

    function resetConfirmBox() {
        let oldConfirmBox = document.getElementById("confirm-box");
        let newConfirmBox = oldConfirmBox.cloneNode(true);
        oldConfirmBox.parentNode.replaceChild(newConfirmBox, oldConfirmBox);
    }

    function enterRegion(world) {
        //IMPORTANT! CLEAN UP HTML - Must be removed BEFORE setting the new world:
        region.removeBiomHTML();
        const tooltips = document.querySelectorAll(".tooltip");
        for (let i = tooltips.length - 1; i >= 0; i--) {
            const tooltip = tooltips[i];
            tooltip.parentNode.removeChild(tooltip);
        }
        battleQueueElement.innerHTML = "";
        //IMPORTANT! CLEAN UP HTML
        currentWorld.region = region;
        currentWorld.miniMap = miniMap;
        currentWorld.startZoneId = currentZone.id;
        if (world.region == null) {
            region = new Region(world, background, zoneContainer, tileSize);
            miniMap = new MiniMap(region, miniMapContainer, miniMapZoom);
            currentWorld = world;
            if (currentWorld.daylightCycle) {
                cycleDaylight = true;
                sun.style.display = "";
            } else {
                cycleDaylight = false;
                sun.style.display = "none";
            }
            player.setOverlayOpacity(currentWorld.darkness);
            buildMap(true);
            buildZone(currentWorld.startZoneId);
            placePlayer(currentZone.getTileObj(currentZone.gateway.exitTileId));
            setEvent();
        } else {
            region = world.region;
            region.initialize();
            miniMap = world.miniMap;
            miniMap.initialize();
            currentWorld = world;
            if (currentWorld.daylightCycle) {
                cycleDaylight = true;
                sun.style.display = "";
            } else {
                cycleDaylight = false;
                sun.style.display = "none";
            }
            player.setOverlayOpacity(currentWorld.darkness);
            buildMap(false);
            buildZone(currentWorld.startZoneId);
            placePlayer(currentZone.getTileObj(currentZone.gateway.exitTileId));
            setEvent();
        }
        message(`You have now entered: ${currentWorld.name}.`);
        gameStarted = true;
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
                resetGame();
            }, 3000);
        }, 100);
    }

    function resetGame() {
        battleQueue = [];
        worlds.resetAll();
        const tooltips = document.querySelectorAll(".tooltip");
        const tooltipParent = tooltips[0].parentNode;
        for (let i = tooltips.length - 1; i >= 0; i--) {
            const tooltip = tooltips[i];
            tooltipParent.removeChild(tooltip);
        }
    }

    function buildMap(isNewMap) {
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
        // placeGateways();
        currentWorld.placeGateways();

        if (!isNewMap) {
            return;
        }

        const safeZonePercentage = 5;
        let safeZoneCount = region.zones.length / 100 * safeZonePercentage;
        safeZoneCount = Math.ceil(safeZoneCount);

        region.setSafeZones(safeZoneCount);

        const shopPercentage = 50;
        let shopCount = region.safeZones.length / 100 * shopPercentage;
        shopCount = Math.ceil(shopCount);

        placeChests(shopCount);

        if (region.enemyPercentage > 0) {
            placeEnemies(zoneEnemyCount(region.enemyPercentage));
        }

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
                        if (currentWorld.obstacles.length > 0) {
                            const rnd = randomInteger(0, currentWorld.obstacles.length);
                            tileObj.setType(currentWorld.obstacles[rnd], "obstacle", true);
                        }
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
            const tileObjHTML = tileObj.createHTML();
            region.element.append(tileObjHTML);
            if (tileObj.object != null) {
                if (tileObj.type == "enemy") {
                    tileObj.placeHTML(tileObj.object.createHTML());
                    battleQueue.push(tileObj.object);
                    enemiesInZone++;
                }
                if (tileObj.type == "chest") {
                    tileObj.placeHTML(tileObj.object.createHTML());
                }
                if (tileObj.type == "item") {
                    tileObj.placeHTML(tileObj.object.createHTML());
                }
            }
            tileObjHTML.addEventListener("click", function() {
                if (playerIsMoving) {
                    return;
                }
                const destinationTile = currentZone.getTileObj(this.id);
                playerAI(destinationTile);
            });
            tileObjHTML.addEventListener("mouseover", function() {
                if (playerIsMoving) {
                    return;
                }
                const destinationTile = currentZone.getTileObj(this.id);
                path(destinationTile);
            });
        }
        if (currentZone.gateway != undefined) {
            currentZone.gateway.createHTML();
        }
        currentZone.updateHTML();
    }

    function edgeControl(x, y) {
        let edge = "edge";
        edge += y == region.size.up ? "-up" : "";
        edge += y == region.size.down ? "-down" : "";
        edge += x == region.size.left ? "-left" : "";
        edge += x == region.size.right ? "-right" : "";
        return edge;
    }

    function enterGate(gate) {
        if (gate.locked) {
            if (player.removeKey()) {
                gate.unlock();
                miniMap.tileRemoveClass(currentZone.id, "locked");
                miniMap.tileAddClass(currentZone.id, "unlocked");
            } else {
                console.log("Key is missing!");
            }
        } else {
            enterRegion(gate.world);
            playerIsMoving = false;
        }
    }

    function zoneEnemyCount(percentage) {
        let zoneCount = region.width * region.height;
        zoneCount * percentage / 100;
        zoneCount = Math.floor(zoneCount);
        return zoneCount;
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
        player.inBattle = false;
        for (let i = 0; i < battleQueue.length; i++) {
            const character = battleQueue[i];
            character.removeCard();
        }
        battleQueue = [];
        player.actionPointHTMLRemove();
        music.crossFade(music.calm);
        background.classList.remove("battle");
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
        player.setPrimaryWeapon();
        player.setMove();
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
            player.setMove();
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
        updatePathfindingGrid();
        const moveDirection = shortestPathDirection(enemyObj.currentTile, player.currentTile);
        const destinationTileObj = adjacentTile(enemyObj.currentTile, moveDirection);
        enemyMove(enemyObj, moveDirection, destinationTileObj);
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
                    destinationTileObj.object.takeDamage(enemyObj.strength.value);
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

    function miniMapHTML(id, biom) {
        let activeClass = "fog-of-war";
        if (cheatsOn && cheatFogOfWar) {
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

    function placePlayer(tileObj) {
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
        tileObj.element.append(player.element);
        tileObj.object = player;
        player.tileId = tileObj.id;
        if (itemInTile) {
            effect.flash.createHTML(player.element);
        }
        if (enemyInTile) {
            console.log("Enemy");
        }
    }

    function placeChests(amount) {
        for (let i = 0; i < amount; i++) {
            const zone = region.getRandomSafeZone(true);
            const tileObj = zone.getRandomTile(true);
            const chest = new Chest(tileObj, new Inventory("chest"));
            placeChest(zone, chest);
            let spawnPropability = 0;
            const collectableObjs = Object.keys(collectables);
            let collObjs = [];
            for (let keyIndex = 0; keyIndex < collectableObjs.length; keyIndex++) {
                const key = collectableObjs[keyIndex];
                const collectable = collectables[key];
                if (!collectable.inventoryItem) {
                    continue;
                }
                spawnPropability += collectable.spawnPropability;
                collObjs.push({ collectable: collectable, spawnPropability: spawnPropability });
            }
            let items = [];
            let itemCount = randomInteger(1, 5);
            let collectable;
            for (let amount = 0; amount < itemCount; amount++) {
                let rnd = randomInteger(0, spawnPropability);
                for (let collectableObjIndex = 0; collectableObjIndex < collObjs.length; collectableObjIndex++) {
                    const collectableObj = collObjs[collectableObjIndex];
                    if (rnd < collectableObj.spawnPropability) {
                        collectable = collectableObj.collectable;
                        uniqueIndex++;
                        const item = new Item(collectable.type + "-" + uniqueIndex, collectable);
                        items.push(item);
                        break;
                    }
                }
            }
            // for (let keyIndex = 0; keyIndex < collectableObjs.length; keyIndex++) {
            //     const key = collectableObjs[keyIndex];
            //     const collectable = collectables[key];
            //     if (!collectable.inventoryItem) {
            //         continue;
            //     }
            //     let rnd = randomInteger(0, spawnPropability);
            //     for (let itemIndex = 0; itemIndex < 5; itemIndex++) {
            //         uniqueIndex++;
            //         const item = new Item(collectable.type + "-" + uniqueIndex, collectable);
            //         items.push(item);
            //     }
            // }
            fillChest(chest, items);
        }
    }

    function fillChest(chest, items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            chest.inventory.addItem(item);
        }
    }

    function placeChest(zone, chest) {
        chest.tileObj.setEmpty();
        chest.tileObj.placeObject(chest, "chest", true);
        miniMap.tileAddClass(zone.id, "chest");
    }

    function placeEnemies(amount) {
        for (let i = 0; i < amount; i++) {
            const zone = region.getRandomUnsafeZone();
            const tileObj = zone.getRandomTile(true);
            randomEnemy(tileObj);
        }
        //TODO: This needs to be deleted at some point.
        //For now, it is used for adjustments of enemy amount/values
        for (let i = 0; i < currentWorld.enemyTypes.length; i++) {
            const nmeType = currentWorld.enemyTypes[i];
            console.log(nmeType.name + "'s: " + nmeType.totalCount);
        }
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
        const enemy = new Enemy(type.name, "enemy", type.moveTime, type.attackTime, new Attribute(type.life, true), new Attribute(type.strength, false), tileObj.id, actions, type.actionPoints, type.sfxs, new Inventory("enemy"), type, type.enemyDeath);
        tileObj.setEmpty();
        tileObj.placeObject(enemy, "enemy", true);
        type.totalCount++;
    }

    function placeCollectables(collectable) {
        collectable.totalStackAmount = 0;
        const collStacks = worlds.zoneCount(currentWorld) * collectable.stacks / 100;
        for (let i = 0; i < collStacks; i++) {
            const zone = region.getRandomZone();
            const tileObj = zone.getRandomTile();
            uniqueIndex++;
            const item = new Item(collectable.type + "-" + uniqueIndex, collectable);
            tileObj.placeObject(item, "item", true);
            collectable.totalStackAmount += item.amount;
        }
        //TODO: This needs to be deleted at some point.
        //For now, it is used for adjustments of collectables- amount/values
        console.log(collectable.name + "'s total: " + uniqueIndex + ", total value: " + collectable.totalStackAmount);
    }

    function placeGateway(gateway, zone, tileObj, exitOffset) {
        let gatewayObj = new Gate(gateway, tileObj, exitOffset);
        zone.gateway = gatewayObj;
        miniMap.tileAddClass(zone.id, gateway.type + "-entrance");
        if (gatewayObj.locked) {
            miniMap.tileAddClass(zone.id, "locked");
        } else {
            miniMap.tileAddClass(zone.id, "unlocked");
        }
        return gatewayObj;
    }

    function replaceGateway(gatewayObj, gateway, zone) {
        zone.gateway = gatewayObj;
        miniMap.tileAddClass(zone.id, gateway.type + "-entrance");
        if (gatewayObj.locked) {
            miniMap.tileAddClass(zone.id, "locked");
        } else {
            miniMap.tileAddClass(zone.id, "unlocked");
        }
    }

    function changeZone(x, y, tileIndex) {
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
        player.setPrevZone(currentZone);
        moveToZone(areaCoordinates.x + "_" + areaCoordinates.y);
        placePlayer(currentZone.getTileObjFromIndex(tileIndex));
    }

    function moveToZone(id) {
        miniMapActive(currentZone.id, false);
        buildZone(id);
        miniMapActive(currentZone.id, true);
        setEvent();
    }

    function playerAI(destinationTile) {
        if (player.currentTile == destinationTile) {
            return;
        }
        updatePathfindingGrid(true);
        const moveDirection = shortestPathDirection(player.currentTile, destinationTile);
        const destinationType = playerMove(moveDirection);
        playerIsMoving = true;
        setTimeout(() => {
            if (destinationType == "new tile") {
                playerAI(destinationTile);
            } else {
                playerIsMoving = false;
            }
        }, player.moveTime + 25);
    }

    function path(destinationTile) {
        updatePathfindingGrid(true);
        if (player.currentTile == destinationTile) {
            pathsRemove();
            return;
        }
        let tileObj = player.currentTile;
        const arr = findShortestPath(tileObj.coordinates(), destinationTile.coordinates(), pathFindingGrid);
        pathsRemove();
        for (let i = 0; i < arr.length; i++) {
            if (player.inBattle && i >= player.actionPoints) {
                break;
            }
            const tileDir = arr[i];
            tileObj = adjacentTile(tileObj, tileDir);
            tileObj.element.classList.add("path");
        }
    }

    function pathsRemove() {
        const paths = document.querySelectorAll(".path");
        for (let i = 0; i < paths.length; i++) {
            const pathElement = paths[i];
            pathElement.classList.remove("path");
        }
    }

    function playerMove(direction) {
        let coordinate = currentZone.getTileObj(player.tileId).coordinates();
        if (direction == "up") {
            coordinate.y -= 1;
            player.element.style.backgroundPosition = "0 -33.3333%";
        }
        if (direction == "down") {
            coordinate.y += 1;
            player.element.style.backgroundPosition = "0 0";
        }
        if (direction == "right") {
            coordinate.x += 1;
            player.element.style.backgroundPosition = "0 -66.6667%";
        }
        if (direction == "left") {
            coordinate.x -= 1;
            player.element.style.backgroundPosition = "0 -100%";
        }
        if (coordinate.y < 0) {
            changeZone(0, 1, currentZone.tiles.length - region.zoneSize + coordinate.x);
            return "new zone";
        }
        if (coordinate.y >= region.zoneSize) {
            changeZone(0, -1, coordinate.x);
            return "new zone";
        }
        if (coordinate.x < 0) {
            changeZone(-1, 0, coordinate.y * region.zoneSize + region.zoneSize - 1);
            return "new zone";
        }
        if (coordinate.x >= region.zoneSize) {
            changeZone(1, 0, coordinate.y * region.zoneSize);
            return "new zone";
        }
        let destinationTileObj = currentZone.getTileObj(coordinate.x + "_" + coordinate.y);
        if (destinationTileObj.type == "obstacle") {
            return "obstacle";
        }
        playerIsMoving = true;
        if (destinationTileObj.type == "gate") {
            player.setInteractTime();
            if (destinationTileObj.object.locked) {
                halfWayMove(player.element, player.moveTime, direction, function() {
                    enterGate(destinationTileObj.object);
                }, function() {
                    playerIsMoving = false;
                });
            } else {
                fullMove(player.element, player.moveTime, direction, null, function() {
                    enterGate(destinationTileObj.object);
                });
            }
            return "gate";
        }
        if (destinationTileObj.type == "chest") {
            player.setInteractTime();
            halfWayMove(player.element, player.moveTime, direction, null, function() {
                playerIsMoving = false;
                showInventory(destinationTileObj.object.inventory);
            });
            return "chest";
        }
        if (player.inBattle) {
            if (destinationTileObj.type == "enemy") {
                const apAttack = player.apAttack();
                if (battleQueue.length > 0 && apAttack == -1) {
                    playerIsMoving = false;
                    return "ap zero";
                }
                player.setAttackTime();
                halfWayMove(player.element, player.attackTime, direction, function() {
                    effect.floating.createHTML(destinationTileObj.element, player.strength.value);
                    effect.explosion.createHTML(destinationTileObj.element);
                    effect.explosion.soundEffect("THUD_Bright_03_mono.mp3");
                    const enemyKilled = destinationTileObj.object.takeDamage(player.strength.value);
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
                return "enemy";
            }
        }
        const apMove = player.apMove();
        if (battleQueue.length > 0 && apMove == -1) {
            playerIsMoving = false;
            return "ap zero";
        }
        player.setMove();
        player.setMoveTime();
        fullMove(player.element, player.moveTime, direction, function() {
            if (destinationTileObj.type == "item") {
                effect.flash.createHTML(destinationTileObj.element);
                player.collect(destinationTileObj.object);
                destinationTileObj.removeObject(destinationTileObj.object.element);
            }
            const prevTileObj = player.currentTile;
            player.tileId = destinationTileObj.id;
            destinationTileObj.placeObject(player, "player", true);
            destinationTileObj.element.append(player.element);
            prevTileObj.object = null;
            prevTileObj.type = "empty";
            prevTileObj.occupied = false;
            prevTileObj.setElementClassType();
        }, function() {
            playerIsMoving = false;
            if (battleQueue.length > 0) {
                if (apMove == 0) {
                    nextTurn();
                }
            }
        });
        return "new tile";
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

    //#endregion GAME FUNCTIONS

    //#region REUSABLE FUNCTIONS
    let messagePool = [];

    function message(msg) {
        let obj = {}
        obj.msgElm = document.createElement("P");
        obj.msgElm.classList.add("info-center__message");
        obj.msgElm.style.transition = `opacity ${messageFadeDuration}ms, visibility ${messageFadeDuration}ms`;
        obj.msgElm.textContent = msg;
        infoCenter.prepend(obj.msgElm);
        obj.delay = setTimeout(() => {
            obj.msgElm.classList.add("js-active");
            obj.duration = setTimeout(() => {
                obj.msgElm.classList.remove("js-active");
                obj.fade = setTimeout(() => {
                    messagePool.shift();
                    infoCenter.removeChild(obj.msgElm);
                }, messageFadeDuration);
            }, messageDuration);
        }, messageDelay);
        // if (messagePool.length === 4) {
        //     clearTimeout(messagePool[0].delay);
        //     clearTimeout(messagePool[0].duration);
        //     clearTimeout(messagePool[0].fade);
        //     infoCenter.removeChild(messagePool[0].msgElm);
        //     messagePool.shift();
        // }
        messagePool.push(obj);
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = randomInteger(0, arr.length);
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }

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

    function lerp(from, to, t) {
        const range = to - from;
        const current = range * t + from;
        return current;
    }

    //#endregion REUSABLE FUNCTIONS

    //#region ANIMATION FRAME

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
        dayTimeTick++;
        if (dayTime.dayTimeControl(dayTimeTick)) {
            dayTimeTick = 0;
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
                timeControls.addTick();
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

    //#endregion ANIMATION FRAME

    //#region PATHFIDING Breadth-First Search algorithm

    function updatePathfindingGrid(ignoreCollectables = false) {
        for (let x = 0; x < region.zoneSize; x++) {
            pathFindingGrid[x] = [];
            for (let y = 0; y < region.zoneSize; y++) {
                const tileObj = currentZone.getTileObj(x + "_" + y);
                if (tileObj.occupied) {
                    if (ignoreCollectables && tileObj.object) {
                        switch (tileObj.object.type) {
                            case "coin":
                                pathFindingGrid[x][y] = 'Empty';
                                break;
                            case "life":
                                pathFindingGrid[x][y] = 'Empty';
                                break;
                            case "key":
                                pathFindingGrid[x][y] = 'Empty';
                                break;
                            case "weapon":
                                pathFindingGrid[x][y] = 'Empty';
                                break;
                            case "armor":
                                pathFindingGrid[x][y] = 'Empty';
                                break;

                            default:
                                pathFindingGrid[x][y] = 'Obstacle';
                                break;
                        }
                    } else {
                        pathFindingGrid[x][y] = 'Obstacle';
                    }
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
        }

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
    }

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
    }


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
    }

    //#endregion PATHFIDING Breadth-First Search algorithm
});