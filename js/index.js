document.addEventListener("DOMContentLoaded", event => {
    //#region SETTINGS
    const startVolume = 0.0;
    const tileSize = 48;
    const torchEquipTime = 0.3;
    const ticksPerSecond = 20;
    const messageDelay = 300;
    const messageDuration = 8000;
    const messageFadeDuration = 300;
    const collectableSpawnFactor = 0.4;
    //#endregion SETTINGS

    //#region CHEATS

    const cheatsOn = false;
    const cheatKey = false;
    const cheatWeapon = false;
    const cheatFogOfWar = true;
    const cheatMoney = 0;
    const enemiesAtStart = 0;
    const cheatRedGem = 200;
    const cheatBlueGem = 100;
    const cheatGreenGem = 100;

    //#endregion CHEATS

    //#region VARIABLES

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

    // Zone
    const background = document.getElementById("background");
    const zoneContainer = document.getElementById("zone-container");
    const miniMapContainer = document.getElementById("mini-map");
    const miniMapZoom = document.getElementById("mini-map-enlarger");
    const actions = document.getElementById("actions");
    const settings = document.getElementById("settings");
    const zoneTransitions = document.querySelectorAll(".zone-transition");

    // Start screen elements
    const welcomeScreen = document.getElementById("welcome-screen");
    const startScreen = document.getElementById("start-screen");
    const startForm = document.getElementById("start-form");
    const startFormName = document.getElementById("start-form-name");
    const startFormContinue = document.getElementById("start-form-continue");
    const startFormOptions = document.getElementById("start-form-options");
    const optionsScreen = document.getElementById("options-screen");
    const optionsFormBack = document.getElementById("options-form-back");
    const optionsFormMusic = document.getElementById("options-form-music");
    const optionsFormSfx = document.getElementById("options-form-sfx");
    const optionsFormExit = document.getElementById("options-form-exit");

    // GAME OVER screen
    const gameOverScreen = document.getElementById("game-over-screen");

    // COMBAT
    const battleQueueElement = document.getElementById("battle-queue");
    const menuFlee = document.getElementById("menu-flee");
    const menuEndTurn = document.getElementById("menu-end-turn");

    //Tooltips
    const tooltipContainer = document.getElementById("tooltip-container");

    // GAME MENU
    const gameMenu = document.getElementById("game-menu");
    const menuButtons = document.querySelectorAll(".game-menu-button");
    let menuActive = false;
    let inventoryActive = false;
    let openedInventory = null;
    let gemCraftingActive = false;
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
    let firstDaylight = true;

    //Animation frame tick/timer variables
    const tickTime = 1 / ticksPerSecond;
    let dayTimeTick = 0;
    let tTime = 0;

    //Inventory
    const playerInventory = document.getElementById("inventory");
    const inventoryWindow = document.getElementById("inventory-window");
    const inventoryGrid = document.getElementById("inventory-grid");
    const secondaryInventory = document.getElementById("inventory-secondary");
    const secondaryInventoryGrid = document.getElementById("inventory-secondary-grid");
    const inventoryTakeAll = document.getElementById("inventory-take-all");

    //Gem Crafting
    const gemCrafting = document.getElementById("gem-crafting");
    const gemCraftingWindow = document.getElementById("gem-crafting-window");
    const gemCraftingSpells = document.getElementById("gem-crafting-spells");
    const gemCraftingSpellTitle = document.getElementById("gem-crafting-spell-title");
    const gemRed = document.getElementById("gem-red");
    const gemBlue = document.getElementById("gem-blue");
    const gemGreen = document.getElementById("gem-green");
    const gemRedUI = document.getElementById("gem-red-ui");
    const gemBlueUI = document.getElementById("gem-blue-ui");
    const gemGreenUI = document.getElementById("gem-green-ui");

    let gemCraftingSpellElements = [];
    let gemCraftingSpellSelected;

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
    const openBackpack = document.getElementById("open-backpack");
    const openSpell = document.getElementById("open-spell");

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
        spell: {
            icon: document.getElementById("spell-icon"),
            count: document.getElementById("spell-count"),
            sprite: { x: 2, y: 3 },
        },
    }


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

    const zoneTransitionUp = document.getElementById("zone-transition-up");
    const zoneTransitionDown = document.getElementById("zone-transition-down");
    const zoneTransitionLeft = document.getElementById("zone-transition-left");
    const zoneTransitionRight = document.getElementById("zone-transition-right");

    const attackElements = document.querySelectorAll(".attack-element");

    let playerIsMoving = false;
    let playersTurn = true;
    let battleQueue = [];
    let pathFindingGrid = [];
    let effectTimeouts = [];

    let currentWorld;
    let region;
    let miniMap;
    let currentZone = undefined;
    let dayTime;

    let enemiesInZone = 0;
    let battleInProgress = false;

    //Audio settings
    let sfxVolume = startVolume;

    //#endregion VARIABLES

    //#region OBJECTS used before CLASSES

    let effect = {
        explosion: {
            name: "Explosion",
            class: "explosion",
            duration: 700,
            createHTML: function(tileObj) {
                const element = tileObj.element;
                let fx = document.createElement("DIV");
                fx.classList.add("effect");
                fx.classList.add(this.class);
                fx.classList.add("tile__object");
                fx.style.width = `${tileSize}px`;
                fx.style.height = `${tileSize}px`;
                fx.style.animationDuration = `${this.duration}ms`;
                element.append(fx);
                tileObj.setBusy();
                const effectTimeout = setTimeout(() => {
                    if (fx) {
                        element.removeChild(fx);
                        tileObj.freeBusy();
                    }
                }, this.duration);
                effectTimeouts.push(effectTimeout);
            },
            soundEffect(soundFile) {
                new SFX("./audio/sfx/" + soundFile, sfxVolume);
            }
        },
        timed: {
            name: "Timed",
            class: "timed",
            duration: 1600,
            createHTML: function(character, type, duration) {
                this.element = character.element;
                this.duration = duration;
                this.fx = document.createElement("DIV");
                this.fx.classList.add("effect");
                this.fx.classList.add(this.class);
                this.fx.classList.add(type);
                this.fx.classList.add("tile__object");
                this.fx.style.width = `${tileSize}px`;
                this.fx.style.height = `${tileSize}px`;
                this.fx.style.animationDuration = `${this.duration}ms`;
                this.element.append(this.fx);
                return this.fx;
            },
            removeHTML() {
                if (this.fx) {
                    this.element.removeChild(this.fx);
                }
            },
            soundEffect(soundFile) {
                new SFX("./audio/sfx/" + soundFile, sfxVolume);
            }
        },
        flash: {
            name: "Flash",
            class: "flash",
            duration: 300,
            createHTML: function(tileObj) {
                const element = tileObj.element;
                let fx = document.createElement("DIV");
                fx.classList.add("effect");
                fx.classList.add(this.class);
                fx.classList.add("tile__object");
                fx.style.width = `${tileSize}px`;
                fx.style.height = `${tileSize}px`;
                fx.style.animationDuration = `${this.duration}ms`;
                element.append(fx);
                tileObj.setBusy();
                const effectTimeout = setTimeout(() => {
                    if (fx) {
                        element.removeChild(fx);
                        tileObj.freeBusy();
                    }
                }, this.duration);
                effectTimeouts.push(effectTimeout);
            },
            soundEffect(soundFile) {
                new SFX("./audio/sfx/" + soundFile, sfxVolume);
            }
        },
        floating: {
            name: "Floating number",
            class: "floating-number",
            duration: 1500,
            createHTML: function(tileObj, value) {
                const element = tileObj.element;
                let fx = document.createElement("DIV");
                fx.classList.add("effect");
                fx.classList.add(this.class);
                fx.classList.add("tile__object");
                fx.style.width = `${tileSize}px`;
                fx.style.height = `${tileSize}px`;
                fx.style.cssText += `--floating-start-x:${randomInteger(-8, 8)}px;`;
                fx.style.cssText += `--floating-end-x:${randomInteger(-48, 48)}px;`;
                fx.style.animationDuration = `${this.duration}ms`;
                fx.innerHTML = value;
                element.append(fx);
                tileObj.setBusy();
                const effectTimeout = setTimeout(() => {
                    if (fx) {
                        element.removeChild(fx);
                        tileObj.freeBusy();
                    }
                }, this.duration);
                effectTimeouts.push(effectTimeout);
            },
            soundEffect(soundFile) {
                // new SFX("./audio/sfx/" + soundFile, sfxVolume);
            }
        },
        spell: {
            name: "Spell",
            class: "spell",
            duration: 500,
            createHTML: function(tileObj, type, name, turnLength = 0) {
                const element = tileObj.element;
                let fx = document.createElement("DIV");
                fx.classList.add("effect");
                fx.classList.add(type);
                fx.classList.add(name);
                fx.classList.add("tile__object");
                fx.style.width = `${tileSize}px`;
                fx.style.height = `${tileSize}px`;
                if (turnLength > 0) {
                    this.turnLengthElm = document.createElement("DIV");
                    this.turnLengthElm.classList.add("turn-length");
                    this.turnLengthElm.textContent = turnLength;
                    fx.append(this.turnLengthElm);
                }
                element.append(fx);
                return fx;
            },
            updateTurnLength(turnLength) {
                this.turnLengthElm.textContent = turnLength;
            },
            removeInstantHTML(element, fx) {
                if (fx) {
                    element.removeChild(fx);
                }
            },
            activateHTML(fx, duration) {
                this.duration = duration;
                fx.style.animationDuration = `${this.duration}ms`;
                fx.classList.add(this.class);
            },
            soundEffect(soundFile) {
                new SFX("./audio/sfx/" + soundFile, sfxVolume);
            }
        },
    }

    const enemyType = {
        dummy: {
            name: "Dummy",
            cls: "dummy",
            life: 50,
            strength: 0,
            totalCount: 0,
            moveTime: 200,
            attackTime: 200,
            actionPoints: {
                current: 1,
                start: 1,
                max: 1,
            },
            spcAtckInfo: "None",
            sfxs: ["MONSTER_Ugh_02_mono.ogg", "MONSTER_Ugh_01_mono.ogg", "MONSTER_Ugh_04_mono.ogg"],
            specialAttack: function() {
                //Nothing
            },
            enemyDamage(enemy, damage) {
                const tileObj = enemy.currentTile;
                effect.floating.createHTML(tileObj, damage);
                effect.explosion.createHTML(tileObj);
                effect.explosion.soundEffect("THUD_Bright_03_mono.mp3");
            },
            enemyDeath: function(enemy) {
                enemyKill();
                effect.floating.createHTML(enemy.currentTile, "Arrrgh!");
            }
        },
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
            enemyDamage(enemy, damage) {
                const tileObj = enemy.currentTile;
                effect.floating.createHTML(tileObj, damage);
                effect.explosion.createHTML(tileObj);
                effect.explosion.soundEffect("THUD_Bright_03_mono.mp3");
            },
            enemyDeath: function(enemy) {
                enemyKill();
                effect.floating.createHTML(enemy.currentTile, "Arrrgh!");
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
            enemyDamage(enemy, damage) {
                const tileObj = enemy.currentTile;
                effect.floating.createHTML(tileObj, damage);
                effect.explosion.createHTML(tileObj);
                effect.explosion.soundEffect("THUD_Bright_03_mono.mp3");
            },
            enemyDeath: function(enemy) {
                enemyKill();
                effect.floating.createHTML(enemy.currentTile, "Arrrgh!");
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
            spcAtckInfo: "Chance to steal money",
            sfxs: ["CREATURE_Squeel_05_mono.ogg", "CREATURE_Squeel_03_mono.ogg", "CREATURE_Squeel_04_mono.ogg"],
            specialAttack: function() {
                const coinStealAmount = randomInteger(1, 8);
                const chance = randomInteger(0, 100);
                if (chance > 75) {
                    if (player.hasCoins(coinStealAmount)) {
                        player.removeCoins(coinStealAmount);
                    } else {
                        player.removeCoins(player.coins);
                    }
                }
            },
            enemyDamage(enemy, damage) {
                const tileObj = enemy.currentTile;
                effect.floating.createHTML(tileObj, damage);
                effect.explosion.createHTML(tileObj);
                effect.explosion.soundEffect("THUD_Bright_03_mono.mp3");
            },
            enemyDeath: function(enemy) {
                enemyKill();
                effect.floating.createHTML(enemy.currentTile, "Arrrgh!");
            }
        },
    }

    const worlds = {
        zoneCount(world) {
            const worldHeight = world.size.up + 1 - world.size.down;
            const worldwidth = -world.size.left + 1 + world.size.right;
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

    //#endregion OBJECTS used before CLASSES

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
        setEdgeButtons(edgeButtons) {
            this.edgeButtons = edgeButtons;
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
            this.busy = [];
            this.markEmpty = false;
        }
        setBusy() {
            this.busy.push(0);
        }
        freeBusy() {
            this.busy.pop();
            if (this.busy.length == 0) {
                if (this.markEmpty) {
                    this.setEmpty();
                }
            }
        }
        setEmpty() {
            if (this.busy.length > 0) {
                this.markEmpty = true;
                return;
            }
            this.name = "none";
            this.type = "empty";
            this.object = null;
            this.occupied = false;
            this.markEmpty = false;
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
        constructor(name, type, moveTime, attackTime, life, strength, tileId, apElement, actionPoints, sfxs, inventory, onDamage, onDeath) {
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
            this.apCostElement = this.apElement.querySelector("#attack-cost");
            this.apAttackElement = this.apElement.querySelector("#attack-damage");
            this.apPoints = [];
            this.baseMoveCost = 0;
            this.baseAttackCost = 0;
            this.moveCost = 1;
            this.onDamage = onDamage;
            this.onDeath = onDeath;
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
        apSpellAttack(apCost) {
            if (!this.sufficientAP(apCost)) {
                return -1;
            }
            this.actionPoints -= apCost;
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
        actionPointUse(amount) {
            if (!this.sufficientAP(amount)) {
                return -1;
            }
            this.actionPoints -= amount;
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
                apPoint.classList.remove("deficient");
                let cost = 0;
                if (isAttackAP) {
                    cost = this.totalAttackCost;
                } else {
                    cost = this.totalMoveCost;
                }
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
        actionPointHTMLPreview(cost) {
            for (let i = 0; i < this.apPoints.length; i++) {
                const apPoint = this.apPoints[i];
                apPoint.classList.remove("empty");
                apPoint.classList.remove("cost");
                apPoint.classList.remove("deficient");
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
        beginTurn() {
            if (this.dotCount > 0 && this.dot > 0) {
                this.takeDamage(this.dot);
                this.dotCount--;
                if (this.dotCount == 0) {
                    this.dot = 0;
                    this.element.removeChild(this.statusEffect);
                }
                return true;
            }
            return false;
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
            damage = roundDecimal(damage, 2);
            if (this.onDamage != null) {
                this.onDamage(this, damage);
            }
            this.addLife(-damage);
            if (this.isDead) {
                this.playSFX(this.sfxs[0]);
            } else {
                const rnd = randomInteger(1, this.sfxs.length);
                this.playSFX(this.sfxs[rnd]);
            }
        }
        damageOverTime(damage, count, statusEffect) {
            this.dotCount = count;
            this.dot = damage;
            this.statusEffect = statusEffect;
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
            onDamage,
            onDeath
        ) {
            super(name, type, moveTime, attackTime, life, strength, tileId, apElement, actionPoints, sfxs, inventory, onDamage, onDeath);
            this.armor = armor;
            this.baseArmor = armor;
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
            this.redGems = [];
            this.blueGems = [];
            this.greenGems = [];
            this.isFleeing = false;
            this.fleeCost = this.actionPointStart;
            this.activeSlot = null;
            this.magicArmor = 0;
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
            this.weaponItem.button.update();
            this.setPrimaryWeapon();
            this.updateTooltip();
            return this.weaponItem.button;
        }
        setSlot(spell) {
            if (!this.slots) {
                this.slots = [];
            }
            this.slots.push(spell);
            return spell;
        }
        activateSlot(index) {
            if (this.slots.length < index + 1) {
                return;
            }
            this.resetWeaponButtons();
            this.deactivateSlots();
            this.activeSlot = this.slots[index];
            let spellObj = currentZone.getTileObj(player.tileId);
            if (this.activeSlot.spell.playerAttach) {
                spellObj = player;
            }
            if (!this.slots[index].spellActivate(spellObj)) {
                this.setPrimaryWeapon();
                return;
            }
            this.activeSlot.activate();
            this.apCostElement.textContent = this.activeSlot.spell.cost;
            this.apAttackElement.textContent = this.activeSlot.spell.damage;
        }
        deactivateSlots() {
            if (!this.slots || this.slots.length == 0) {
                return;
            }
            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                slot.deactivate();
                slot.spellDeactivate();
            }
            this.activeSlot = null;
        }
        get spellIsRanged() {
            return this.activeSlot.spell.ranged;
        }
        fireSlotSpell(targetTileObj) {
            if (this.activeSlot == null) {
                return;
            }
            this.activeSlot.cooldown();
            this.activeSlot.spellFire(targetTileObj);
        }
        resetSlotCooldown() {
            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                slot.coolReset();
            }
        }
        setSlotCooldown() {
            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                slot.coolUp();
            }
        }
        setSlotStates() {
            this.weaponItem.button.primaryState(this.actionPoints >= this.weaponItem.primaryCost);
            this.weaponItem.button.secondaryState(this.actionPoints >= this.weaponItem.secondaryCost);
            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                if (slot.isCoolingDown) {
                    slot.state(false);
                } else {
                    slot.state(this.actionPoints >= slot.spell.cost);
                }
                slot.update();
            }
        }
        setSlotStatesAll(enabled) {
            this.weaponItem.button.primaryState(enabled);
            this.weaponItem.button.secondaryState(enabled);
            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                slot.state(enabled);
                slot.update();
            }
        }
        updateSlots() {
            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                slot.update();
            }
        }
        getSlotState(index) {
            return this.slots[index].enabled;
        }
        resetAllSlots() {
            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                slot.reset();
            }
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
        setPrimaryWeapon() {
            this.activeSlot = null;
            this.weaponAttackCost = this.weaponItem.primaryCost;
            this.strength.set(this.weaponItem.primaryDamage);
            this.ui.strength.count.textContent = this.strength.value;
            this.apCostElement.textContent = this.weaponItem.primaryCost;
            this.apAttackElement.textContent = this.strength.value;
            this.resetWeaponButtons();
            this.deactivateSlots();
            this.weaponItem.button.primary();
            this.actionPointHTMLUpdate(true);
            this.updateTooltip();
        }
        setSecondaryWeapon() {
            this.activeSlot = null;
            this.weaponAttackCost = this.weaponItem.secondaryCost;
            this.strength.set(this.weaponItem.secondaryDamage);
            this.ui.strength.count.textContent = this.strength.value;
            this.apCostElement.textContent = this.weaponItem.secondaryCost;
            this.apAttackElement.textContent = this.strength.value;
            this.resetWeaponButtons();
            this.deactivateSlots();
            this.weaponItem.button.secondary();
            this.actionPointHTMLUpdate(true);
            this.updateTooltip();
        }
        resetWeaponButtons() {
            // this.fleeElement.classList.remove("js-active");
            // this.moveElement.classList.remove("js-active");
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
        setMagicArmor(amount) {
            this.magicArmor = amount;
        }
        resetMagicArmor() {
            this.magicArmor = 0;
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
            super.takeDamage(amount - this.armor.value - this.magicArmor);
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
        get redGemCount() {
            return this.redGems.length;
        }
        setRedGem(gem) {
            this.redGem = gem;
        }
        addRedGem(gem) {
            this.inventory.addItem(gem);
            this.redGems.push(gem);
        }
        removeRedGem() {
            if (this.redGemCount === 0) {
                return false;
            }
            this.inventory.removeItem(this.redGems.shift());
            return true;
        }
        get blueGemCount() {
            return this.blueGems.length;
        }
        setBlueGem(gem) {
            this.blueGem = gem;
        }
        addBlueGem(gem) {
            this.inventory.addItem(gem);
            this.blueGems.push(gem);
        }
        removeBlueGem() {
            if (this.blueGemCount === 0) {
                return false;
            }
            this.inventory.removeItem(this.blueGems.shift());
            return true;
        }
        get greenGemCount() {
            return this.greenGems.length;
        }
        setGreenGem(gem) {
            this.greenGem = gem;
        }
        addGreenGem(gem) {
            this.inventory.addItem(gem);
            this.greenGems.push(gem);
        }
        removeGreenGem() {
            if (this.greenGemCount === 0) {
                return false;
            }
            this.inventory.removeItem(this.greenGems.shift());
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
            onDamage,
            onDeath
        ) {
            super(name, type, moveTime, attackTime, life, strength, tileId, apElement, actionPoints, sfxs, inventory, onDamage, onDeath);
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
                tooltipElm("Life: ", roundDecimal(this.life.value, 2)),
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
            this.elmBarText.textContent = `${roundDecimal(this.life.value, 2)} / ${this.life.baseValue}`;
            if (this.life.value <= 0) {
                this.currentTile.removeObject(this.element);
                return true;
            }
            this.updateTooltip();
            return false;
        }
    }

    class WeaponSlot {
        constructor(primaryName, primaryCost, primaryDamage, secondaryName, secondaryCost, secondaryDamage, attackElements) {
            this.primaryName = primaryName;
            this.primaryCost = primaryCost;
            this.primaryDamage = primaryDamage;
            this.secondaryName = secondaryName;
            this.secondaryCost = secondaryCost;
            this.secondaryDamage = secondaryDamage;
            this.attackElements = attackElements;

            this.primaryNameElement = document.getElementById(`combat-primary-name`);
            this.primaryCostElement = document.getElementById(`combat-primary-cost`);
            this.primaryDamageElement = document.getElementById(`combat-primary-damage`);
            this.secondaryNameElement = document.getElementById(`combat-secondary-name`);
            this.secondaryCostElement = document.getElementById(`combat-secondary-cost`);
            this.secondaryDamageElement = document.getElementById(`combat-secondary-damage`);

            this.primaryElement = document.getElementById(`slot-1`);
            this.secondaryElement = document.getElementById(`slot-2`);

            this.primaryNameElement.textContent = this.primaryName;
            this.secondaryNameElement.textContent = this.secondaryName;
        }
        update() {
            this.primaryCostElement.textContent = this.primaryCost;
            this.secondaryCostElement.textContent = this.secondaryCost;
            this.primaryDamageElement.textContent = this.primaryDamage;
            this.secondaryDamageElement.textContent = this.secondaryDamage;
        }
        primaryState(enabled) {
            if (enabled) {
                this.primaryElement.classList.remove("disabled");
            } else {
                this.primaryElement.classList.add("disabled");
            }
        }
        secondaryState(enabled) {
            if (enabled) {
                this.secondaryElement.classList.remove("disabled");
            } else {
                this.secondaryElement.classList.add("disabled");
            }
        }
        primary() {
            this.resetButtons();
            this.primaryElement.classList.add("js-active");
        }
        secondary() {
            this.resetButtons();
            this.secondaryElement.classList.add("js-active");
        }
        resetButtons() {
            for (let i = 0; i < this.attackElements.length; i++) {
                const attackElement = this.attackElements[i];
                attackElement.classList.remove("js-active");
            }
        }
    }

    class Slot {
        constructor(id, spell) {
            this.id = id;
            this.spell = spell;
            this.enabled = false;
            this.currentCooldown = spell.cooldown;
            this.isCoolingDown = false;

            this.element = document.getElementById(this.id);
            this.nameElement = this.element.querySelector(`.title`);
            this.iconElement = this.element.querySelector(`.icon`);
            this.costElement = this.element.querySelector(`.cost`);
            this.damageElement = this.element.querySelector(`.damage`);
            this.armorElement = this.element.querySelector(`.armor`);
            this.cooldownElement = this.element.querySelector(`.cooldown`);

            this.nameElement.textContent = this.spell.name;
            this.iconElement.innerHTML = this.spell.icon;
            this.costElement.textContent = this.spell.cost;
        }
        update() {
            if (this.spell.type == "offense") {
                this.damageElement.textContent = this.spell.damage;
            } else {
                this.damageElement.style.display = "none";
            }
            if (this.spell.type == "defense") {
                this.armorElement.textContent = this.spell.armor;
            } else {
                this.armorElement.style.display = "none";
            }
            this.costElement.textContent = this.spell.cost;
        }
        state(enabled) {
            this.enabled = enabled;
            if (enabled) {
                this.element.classList.remove("disabled");
            } else {
                this.element.classList.add("disabled");
            }
        }
        cooldown() {
            this.currentCooldown = 0;
            this.coolHandler();
        }
        coolReset() {
            this.currentCooldown = this.spell.cooldown;
            this.coolHandler();
        }
        coolUp() {
            if (this.currentCooldown < this.spell.cooldown) {
                this.currentCooldown++;
                this.coolHandler();
            }
            if (this.spell.turnLengthDecline) {
                this.spell.turnLengthDecline();
            }
        }
        coolHandler() {
            const percentage = 100 - this.currentCooldown / this.spell.cooldown * 100;
            this.cooldownElement.style.height = percentage + "%";
            this.isCoolingDown = this.currentCooldown < this.spell.cooldown;
        }
        activate() {
            this.element.classList.add("js-active");
        }
        deactivate() {
            this.element.classList.remove("js-active");
        }
        reset() {
            this.deactivate();
            this.coolReset();
            this.spell.deactivate();
        }
        spellActivate(spellObj) {
            if (this.isCoolingDown) {
                return false;
            }
            return this.spell.activate(spellObj);
        }
        spellDeactivate() {
            if (this.spell.manualDeactivate) {
                return;
            }
            this.spell.deactivate();
        }
        spellFire(targetTileObj) {
            this.spell.fire(targetTileObj);
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
        onCollect(playAudio = true) {
            this.collectable.onCollect(this);
            if (playAudio && this.collectable.collectSFX) {
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
        get tile() {
            return this.tileObj;
        }
        set tile(tileObj) {
            this.tileObj = tileObj;
        }
        onCollect(item) {
            item.onCollect(false);
            return !!this.removeItem(item);
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
            tooltipContainer.append(this.element);
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
        constructor(typeIndex, tileObj, inventory) {
            this.typeIndex = typeIndex;
            this.tileObj = tileObj;
            this.inventory = inventory;
        }
        createHTML() {
            this.element = document.createElement("DIV");
            this.element.classList.add(this.inventory.owner);
            this.element.classList.add("tile__object");
            this.element.style.backgroundPosition = `0 ${this.typeIndex * -100}%`;
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

    class GemCrafting {
        constructor(element, uiElement, collectable) {
            this.element = element;
            this.uiElement = uiElement;
            this.collectable = collectable;
            this.titleElement = this.element.querySelector(".gem-title");
            this.amountElement = this.element.querySelector(".gem-amount");
            this.nextElement = this.element.querySelector(".gem-next");
            this.subtractElement = this.element.querySelector(".gem-subtract");
            this.addElement = this.element.querySelector(".gem-add");

            this.nextCount = 0;
        }
        ui(uiCount) {
            this.uiElement.textContent = uiCount;
        }
        title(text, value) {
            this.titleElement.textContent = `${text} (${value})`;
        }
        amount(amountCount) {
            this.amountElement.textContent = amountCount;
        }
        next(nextCount) {
            this.nextCount = nextCount;
            this.nextElement.textContent = `Next: ${this.nextCount}`;
        }
        lock() {
            this.nextElement.textContent = `Maxed out!`;
        }
        unlock() {
            this.nextElement.textContent = `Next: ${this.nextCount}`;
        }
    }

    class SpellGem {
        constructor(gemCraftingObj) {
            this.red = gemCraftingObj.red;
            this.blue = gemCraftingObj.blue;
            this.green = gemCraftingObj.green;

            this.investedRed = 0;
            this.investedBlue = 0;
            this.investedGreen = 0;

            this.actualRedValue = 0;
            this.actualBlueValue = 0;
            this.actualGreenValue = 0;

            this.nextRedValue = 1;
            this.nextBlueValue = 3;
            this.nextGreenValue = 1;

            this.previousRedValue = 1;
            this.previousBlueValue = 1;
            this.previousGreenValue = 1;

            this.redFactor = 3;
            this.blueFactor = 5;
            this.greenFactor = 2;

            this.blueLocked = false;
            this.greenLocked = false;
        }
        lockBlue() {
            this.blueLocked = true;
            this.blue.lock();
        }
        unlockBlue() {
            this.blueLocked = false;
            this.blue.unlock();
        }
        lockGreen() {
            this.greenLocked = true;
            this.green.lock();
        }
        unlockGreen() {
            this.greenLocked = false;
            this.green.unlock();
        }
        setup() {
            this.redUI();
            this.blueUI();
            this.greenUI();
        }
        redUI() {
            this.red.ui(player.redGemCount);
            this.red.amount(this.investedRed);
            this.red.next(this.nextRedValue);
        }
        blueUI() {
            this.blue.ui(player.blueGemCount);
            this.blue.amount(this.investedBlue);
            this.blue.next(this.nextBlueValue);
            if (this.blueLocked) {
                this.blue.lock();
            } else {
                this.blue.unlock();
            }
        }
        greenUI() {
            this.green.ui(player.greenGemCount);
            this.green.amount(this.investedGreen);
            this.green.next(this.nextGreenValue);
            if (this.greenLocked) {
                this.green.lock();
            } else {
                this.green.unlock();
            }
        }
        get redValue() {
            return this.actualRedValue;
        }
        get blueValue() {
            return this.actualBlueValue;
        }
        get greenValue() {
            return this.actualGreenValue;
        }
        addRed() {
            this.investedRed++;
            this.redNext();
        }
        addBlue() {
            this.investedBlue++;
            this.blueNext();
        }
        addGreen() {
            this.investedGreen++;
            this.greenNext();
        }
        removeRed() {
            if (this.investedRed == 0) {
                return false;
            }
            this.investedRed--;
            this.redPrevious();
            return true;
        }
        removeBlue() {
            if (this.investedBlue == 0) {
                return false;
            }
            this.investedBlue--;
            this.bluePrevious();
            return true;
        }
        removeGreen() {
            if (this.investedGreen == 0) {
                return false;
            }
            this.investedGreen--;
            this.greenPrevious();
            return true;
        }
        redNext() {
            if (this.investedRed == this.nextRedValue) {
                this.nextRedValue += this.redFactor;
                this.previousRedValue = this.nextRedValue - this.redFactor;
                this.actualRedValue++;
                this.redUI();
            }
        }
        redPrevious() {
            if (this.investedRed < this.previousRedValue && this.actualRedValue > 0) {
                this.nextRedValue -= this.redFactor;
                this.previousRedValue = this.nextRedValue - this.redFactor;
                this.actualRedValue--;
                this.redUI();
            }
        }
        blueNext() {
            if (this.investedBlue == this.nextBlueValue) {
                this.nextBlueValue += this.blueFactor;
                this.previousBlueValue = this.nextBlueValue - this.blueFactor;
                this.actualBlueValue++;
                this.blueUI();
            }
        }
        bluePrevious() {
            if (this.investedBlue < this.previousBlueValue && this.actualBlueValue > 0) {
                this.nextBlueValue -= this.blueFactor;
                this.previousBlueValue = this.nextBlueValue - this.blueFactor;
                this.actualBlueValue--;
                this.blueUI();
            }
        }
        greenNext() {
            if (this.investedGreen == this.nextGreenValue) {
                this.nextGreenValue += this.greenFactor;
                this.previousGreenValue = this.nextGreenValue - this.greenFactor;
                this.actualGreenValue++;
                this.greenUI();
            }
        }
        greenPrevious() {
            if (this.investedGreen < this.previousGreenValue && this.actualGreenValue > 0) {
                this.nextGreenValue -= this.greenFactor;
                this.previousGreenValue = this.nextGreenValue - this.greenFactor;
                this.actualGreenValue--;
                this.greenUI();
            }
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

    let spell = {
        fireball: {
            id: "fireball",
            name: "Fireball",
            type: "offense",
            description: "Ranged ball of fire with high damage",
            icon: `<svg viewBox="0 0 24 24"><path d="M17.55,11.2C17.32,10.9 17.05,10.64 16.79,10.38C16.14,9.78 15.39,9.35 14.76,8.72C13.3,7.26 13,4.85 13.91,3C13,3.23 12.16,3.75 11.46,4.32C8.92,6.4 7.92,10.07 9.12,13.22C9.16,13.32 9.2,13.42 9.2,13.55C9.2,13.77 9.05,13.97 8.85,14.05C8.63,14.15 8.39,14.09 8.21,13.93C8.15,13.88 8.11,13.83 8.06,13.76C6.96,12.33 6.78,10.28 7.53,8.64C5.89,10 5,12.3 5.14,14.47C5.18,14.97 5.24,15.47 5.41,15.97C5.55,16.57 5.81,17.17 6.13,17.7C7.17,19.43 9,20.67 10.97,20.92C13.07,21.19 15.32,20.8 16.93,19.32C18.73,17.66 19.38,15 18.43,12.72L18.3,12.46C18.1,12 17.83,11.59 17.5,11.21L17.55,11.2M14.45,17.5C14.17,17.74 13.72,18 13.37,18.1C12.27,18.5 11.17,17.94 10.5,17.28C11.69,17 12.39,16.12 12.59,15.23C12.76,14.43 12.45,13.77 12.32,13C12.2,12.26 12.22,11.63 12.5,10.94C12.67,11.32 12.87,11.7 13.1,12C13.86,13 15.05,13.44 15.3,14.8C15.34,14.94 15.36,15.08 15.36,15.23C15.39,16.05 15.04,16.95 14.44,17.5H14.45Z"></path></svg>`,
            cost: 7,
            baseCost: 7,
            damage: 6,
            baseDamage: 6,
            armor: 0,
            baseArmor: 0,
            cooldown: 9,
            baseCooldown: 9,
            ranged: true,
            source: null,
            fired: false,
            spellGem: null,
            activate(source) {
                if (this.fired) {
                    return false;
                }
                this.source = source;
                this.effect = effect.spell.createHTML(this.source, "ranged", this.id);
                return true;
            },
            deactivate() {
                if (this.source == null || this.effect == null) {
                    return;
                }
                effect.spell.removeInstantHTML(this.source.element, this.effect);
                this.source = null;
                this.effect = null;
                this.fired = false;
            },
            fire(target) {
                if (this.source == null) {
                    return;
                }
                this.fired = true;
                const sourceRect = this.source.element.getBoundingClientRect();
                const targetRect = target.element.getBoundingClientRect();
                const x = targetRect.left - sourceRect.left;
                const y = targetRect.top - sourceRect.top;
                const distance = Math.sqrt(x * x + y * y);
                this.effect.style.cssText += `--spell-x:${x}px;--spell-y:${y}px;`;
                effect.spell.activateHTML(this.effect, distance * 2);
                player.apSpellAttack(this.cost);
                player.setSlotStates();
                setTimeout(() => {
                    this.deactivate();
                    player.setPrimaryWeapon();
                }, effect.spell.duration);
                setTimeout(() => {
                    this.hit([target]);
                    if (player.actionPoints == 0 && enemiesInZone > 0) {
                        nextTurn();
                    }
                }, effect.spell.duration / 10 * 9);
            },
            hit(targets) {
                for (let i = 0; i < targets.length; i++) {
                    const target = targets[i];
                    if (target.type == "enemy") {
                        effect.explosion.createHTML(target);
                        const statusEffect = effect.timed.createHTML(target.object, "burning", 1600);
                        const dmg = this.damage;
                        target.object.damageOverTime(dmg / 4, 3, statusEffect);
                        target.object.takeDamage(dmg);
                    }
                }
            },
        },
        iceNova: {
            id: "ice-nova",
            name: "Ice Nova",
            type: "offense",
            description: "An ice storm surrounds you and damages all nearby enemies",
            icon: `<svg viewBox="0 0 24 24"><path d="M20,15C20,15 18.6,16.3 21.1,17L18.3,19.8H15.5C15.5,19.8 13.6,19.7 15,22H11L9,20C9,20 7.7,18.6 7,21.1L4.2,18.3V15.5C4.2,15.5 4.3,13.6 2,15V11L4,9C4,9 5.4,7.7 2.8,7.1L5.6,4.2H8.5C8.5,4.2 10.4,4.3 9,2H13L15,4C15,4 16.3,5.4 17,2.8L19.8,5.6V8.5C19.8,8.5 19.7,10.4 22,9V13L20,15M14,12A2,2 0 0,0 12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12Z"></path></svg>`,
            cost: 9,
            baseCost: 9,
            damage: 12,
            baseDamage: 12,
            armor: 0,
            baseArmor: 0,
            cooldown: 9,
            baseCooldown: 9,
            ranged: false,
            source: null,
            fired: false,
            spellGem: null,
            activate(source) {
                if (this.fired) {
                    return false;
                }
                this.source = source;
                this.effect = effect.spell.createHTML(this.source, "self", this.id);
                return true;
            },
            deactivate() {
                if (this.source == null || this.effect == null) {
                    return;
                }
                effect.spell.removeInstantHTML(this.source.element, this.effect);
                this.source = null;
                this.effect = null;
                this.fired = false;
            },
            fire(target) {
                if (this.source == null) {
                    return;
                }
                this.fired = true;
                target = this.source;
                effect.spell.activateHTML(this.effect, 800);
                player.apSpellAttack(this.cost);
                player.setSlotStates();
                setTimeout(() => {
                    this.deactivate();
                    player.setPrimaryWeapon();
                    if (player.actionPoints == 0 && enemiesInZone > 0) {
                        nextTurn();
                    }
                }, effect.spell.duration);
                let dmgDuration = 0;
                const iterations = 5;
                for (let i = 0; i < iterations; i++) {
                    dmgDuration += effect.spell.duration / iterations;
                    setTimeout(() => {
                        let targets = [];
                        const upTile = adjacentTile(target, "up");
                        const downTile = adjacentTile(target, "down");
                        const leftTile = adjacentTile(target, "left");
                        const rightTile = adjacentTile(target, "right");
                        let upLeftTile;
                        let upRightTile;
                        let downLeftTile;
                        let downRightTile;
                        if (upTile) {
                            targets.push(upTile);
                            upLeftTile = adjacentTile(upTile, "left");
                            upRightTile = adjacentTile(upTile, "right");
                        }
                        if (downTile) {
                            targets.push(downTile);
                            downLeftTile = adjacentTile(downTile, "left");
                            downRightTile = adjacentTile(downTile, "right");
                        }
                        if (leftTile) {
                            targets.push(leftTile);
                        }
                        if (rightTile) {
                            targets.push(rightTile);
                        }
                        if (upLeftTile) {
                            targets.push(upLeftTile);
                        }
                        if (upRightTile) {
                            targets.push(upRightTile);
                        }
                        if (downLeftTile) {
                            targets.push(downLeftTile);
                        }
                        if (downRightTile) {
                            targets.push(downRightTile);
                        }
                        this.hit(targets);
                    }, dmgDuration);
                }
            },
            hit(targets) {
                for (let i = 0; i < targets.length; i++) {
                    const target = targets[i];
                    if (target.type == "enemy") {
                        const dmg = roundDecimal(this.damage / 5, 2);
                        effect.explosion.createHTML(target);
                        target.object.takeDamage(dmg);
                    }
                }
            },
        },
        domeShield: {
            id: "dome-shield",
            name: "Dome Shield",
            type: "defense",
            description: "Magic shield that protects you from incoming damage",
            icon: `<svg viewBox="0 0 24 24"><path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"></path></svg>`,
            cost: 8,
            baseCost: 8,
            damage: 0,
            baseDamage: 0,
            armor: 1,
            baseArmor: 1,
            cooldown: 9,
            baseCooldown: 9,
            ranged: false,
            source: null,
            fired: false,
            spellGem: null,
            playerAttach: true,
            manualDeactivate: true,
            baseTurnLength: 3,
            activate(source) {
                if (this.fired) {
                    return false;
                }
                this.source = source;
                this.effect = effect.spell.createHTML(this.source, "pulse", this.id, this.baseTurnLength);
                return true;
            },
            deactivate() {
                if (this.source == null || this.effect == null) {
                    return;
                }
                effect.spell.removeInstantHTML(this.source.element, this.effect);
                this.source = null;
                this.effect = null;
                this.fired = false;
                player.resetMagicArmor();
            },
            fire(target) {
                if (this.source == null) {
                    return;
                }
                this.fired = true;
                target = this.source;
                effect.spell.activateHTML(this.effect, 1200);
                player.apSpellAttack(this.cost);
                player.setSlotStates();
                player.setMagicArmor(this.armor);
                player.setPrimaryWeapon();
                this.turnLength = this.baseTurnLength;
                if (player.actionPoints == 0 && enemiesInZone > 0) {
                    nextTurn();
                }
            },
            turnLengthDecline() {
                this.turnLength--;
                if (this.effect) {
                    effect.spell.updateTurnLength(this.turnLength);
                }
                if (this.turnLength == 0) {
                    this.deactivate();
                }
            },
        },
    }

    let collectables = {
        coins: {
            name: "Coin",
            type: "coin",
            spriteCoordinates: { x: 3, y: 3 },
            includeInStartZone: true,
            minValue: 10,
            maxValue: 80,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: false,
            spawnPropability: 100,
            spawnPerZone: 1.2,
            collectSFX: "./audio/sfx/CHAIN_Drop_03_mono.ogg",
            useSFX: "./audio/sfx/CHAIN_Drop_03_mono.ogg",
            attack: null,
            onCollect(item) {
                player.addCoins(item.amount);
            },
            onUse(item, inventory) {
                if (inventory.owner === "chest") {
                    player.addCoins(item.amount);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
            }
        },
        potions: {
            name: "Potion",
            type: "life",
            spriteCoordinates: { x: 3, y: 4 },
            includeInStartZone: false,
            minValue: 10,
            maxValue: 10,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 20,
            spawnPerZone: 1,
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
            minValue: 1,
            maxValue: 1,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 0,
            spawnPerZone: 0,
            collectSFX: "./audio/sfx/LOCK_Metal_Padlock_Unlock_Pop_01_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                player.addKey(item);
            },
            onUse(item, inventory) {
                if (inventory.owner === "chest") {
                    // player.inventory.addItem(item);
                    player.addKey(item);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
            }
        },
        redGems: {
            name: "Red gem",
            type: "gem",
            spriteCoordinates: { x: 0, y: 4 },
            includeInStartZone: true,
            minValue: 1,
            maxValue: 1,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 80,
            spawnPerZone: 1.4,
            collectSFX: "./audio/sfx/LOCK_Metal_Padlock_Unlock_Pop_01_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                player.addRedGem(item);
            },
            onUse(item, inventory) {
                if (inventory.owner === "chest") {
                    player.addRedGem(item);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                } else {
                    hideInventory();
                    gemCraftingShow();
                }
            }
        },
        blueGems: {
            name: "Blue gem",
            type: "gem",
            spriteCoordinates: { x: 5, y: 3 },
            includeInStartZone: true,
            minValue: 1,
            maxValue: 1,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 50,
            spawnPerZone: 0.6,
            collectSFX: "./audio/sfx/LOCK_Metal_Padlock_Unlock_Pop_01_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                player.addBlueGem(item);
            },
            onUse(item, inventory) {
                if (inventory.owner === "chest") {
                    player.addBlueGem(item);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                } else {
                    hideInventory();
                    gemCraftingShow();
                }
            }
        },
        greenGems: {
            name: "Green gem",
            type: "gem",
            spriteCoordinates: { x: 4, y: 3 },
            includeInStartZone: true,
            minValue: 1,
            maxValue: 1,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 20,
            spawnPerZone: 0.7,
            collectSFX: "./audio/sfx/LOCK_Metal_Padlock_Unlock_Pop_01_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                player.addGreenGem(item);
            },
            onUse(item, inventory) {
                if (inventory.owner === "chest") {
                    player.addGreenGem(item);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                } else {
                    hideInventory();
                    gemCraftingShow();
                }
            }
        },
        woodenSword: {
            name: "Wood sword",
            type: "weapon",
            spriteCoordinates: { x: 1, y: 2 },
            includeInStartZone: false,
            minValue: 10,
            maxValue: 10,
            stackable: false,
            equipable: true,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 10,
            spawnPerZone: 0.1,
            collectSFX: "./audio/sfx/BOW_Release_Arrow_mono.ogg",
            useSFX: null,
            attack: new WeaponSlot("Power", 2, 8, "Stab", 1, 3, attackElements),
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
            minValue: 21,
            maxValue: 28,
            stackable: false,
            equipable: true,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 8,
            spawnPerZone: 0.06,
            attack: new WeaponSlot("Power", 2, 14, "Stab", 1, 6, attackElements),
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
            minValue: 45,
            maxValue: 52,
            stackable: false,
            equipable: true,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 4,
            spawnPerZone: 0.04,
            collectSFX: "./audio/sfx/FRICTION_Metal_Bars_02_mono.ogg",
            useSFX: null,
            attack: new WeaponSlot("Power", 3, 24, "Dash", 2, 13, attackElements),
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
            minValue: 2,
            maxValue: 2,
            stackable: false,
            equipable: true,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 8,
            spawnPerZone: 0.08,
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
            minValue: 5,
            maxValue: 5,
            stackable: false,
            equipable: true,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 5,
            spawnPerZone: 0.05,
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
                        if (!player.weaponItem.button.primaryElement.classList.contains("disabled")) {
                            player.setPrimaryWeapon();
                        }
                    }
                    if (evt.key == "2") {
                        if (!player.weaponItem.button.secondaryElement.classList.contains("disabled")) {
                            player.setSecondaryWeapon();
                        }
                    }
                    if (evt.key == "3") {
                        const index = 0;
                        if (player.getSlotState(index)) {
                            player.activateSlot(index);
                        }
                    }
                    if (evt.key == "4") {
                        const index = 1;
                        if (player.getSlotState(index)) {
                            player.activateSlot(index);
                        }
                    }
                    if (evt.key == "5") {
                        const index = 2;
                        if (player.getSlotState(index)) {
                            player.activateSlot(index);
                        }
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
                if (evt.key == "c") {
                    if (!player.inBattle) {
                        gemCraftingToggle();
                    }
                }
                if (evt.key == "t") {
                    player.toggleTorch();
                }
                if (evt.key == "e") {
                    if (inventoryActive) {
                        hideInventory();
                    } else if (miniMap.enlarged) {
                        miniMap.zoomToggle();
                    } else {
                        if (playersTurn && !player.isFleeing) {
                            toggleMenu();
                        }
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
    playerInventory.addEventListener("click", function() {
        hideInventory();
    });
    inventoryWindow.addEventListener("click", function(evt) {
        evt.stopPropagation();
    });
    inventoryTakeAll.addEventListener("click", function() {
        for (let i = 0; i < invBtns.length; i++) {
            const btn = invBtns[i];
            let hasItemAmount = btn.inventory.onCollect(btn.content.item);
            while (hasItemAmount) {
                hasItemAmount = btn.inventory.onCollect(btn.content.item);
            }
        }
        hideInventory(true);
    });
    gemCrafting.addEventListener("click", gemCraftingHide);
    gemCraftingWindow.addEventListener("click", function(evt) {
        evt.stopPropagation();
    });
    openBackpack.addEventListener("click", function() {
        if (playersTurn) {
            showInventory(player.inventory);
        }
    });
    openSpell.addEventListener("click", function() {
        if (playersTurn) {
            gemCraftingShow();
        }
    });

    for (let i = 0; i < zoneTransitions.length; i++) {
        const zoneTransition = zoneTransitions[i];
        zoneTransition.addEventListener("click", function() {
            if (playerIsMoving) {
                return;
            }
            let coordinate = currentZone.getTileObj(player.tileId).coordinates();
            if (this.classList.contains("up")) {
                coordinate.y = 0;
                const id = coordinate.x + "_" + coordinate.y;
                playerAI(currentZone.getTileObj(id), function() {
                    changeZone(0, 1, currentZone.tiles.length - region.zoneSize + coordinate.x);
                });
            }
            if (this.classList.contains("down")) {
                coordinate.y = currentWorld.zoneSize - 1;
                const id = coordinate.x + "_" + coordinate.y;
                playerAI(currentZone.getTileObj(id), function() {
                    changeZone(0, -1, coordinate.x);
                });
            }
            if (this.classList.contains("left")) {
                coordinate.x = 0;
                const id = coordinate.x + "_" + coordinate.y;
                playerAI(currentZone.getTileObj(id), function() {
                    changeZone(-1, 0, coordinate.y * region.zoneSize + region.zoneSize - 1);
                });
            }
            if (this.classList.contains("right")) {
                coordinate.x = currentWorld.zoneSize - 1;
                const id = coordinate.x + "_" + coordinate.y;
                playerAI(currentZone.getTileObj(id), function() {
                    changeZone(1, 0, coordinate.y * region.zoneSize);
                });
            }
        });
    }

    zoneContainer.addEventListener("mouseout", pathsRemove);

    //Combat eventListeners
    menuFlee.addEventListener("click", function(evt) {
        evt.preventDefault();
        player.combatFlee(function(zone) {
            moveToZone(zone.id);
            placePlayer(zone.getRandomTile());
        });
        hideMenu();
    });
    menuEndTurn.addEventListener("click", function(evt) {
        evt.preventDefault();
        nextTurn();
        hideMenu();
    });


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
        if (inventoryActive) {
            hideInventory();
        } else {
            showInventory(player.inventory);
        }
    }

    function showInventory(inventory) {
        inventoryActive = true;
        openedInventory = inventory;
        playerInventory.classList.remove("js-hidden");
        if (openedInventory.owner === "chest") {
            playerInventory.classList.add("two-inventories");
            secondaryInventory.classList.remove("js-hidden");
            inventoryTakeAll.style.display = "unset";
        } else {
            playerInventory.classList.remove("two-inventories");
            secondaryInventory.classList.add("js-hidden");
            inventoryTakeAll.style.display = "none";
        }
        createInventoryItemsUI(openedInventory);
    }

    function hideInventory(destroy = false) {
        inventoryActive = false;
        if (destroy && openedInventory.owner == "chest" && openedInventory.tile) {
            destroyChest(currentZone, openedInventory.tile.object);
            console.log("DESTROY CHEST!");
        }
        openedInventory = null;
        playerInventory.classList.add("js-hidden");
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
        if (player.inBattle) {
            gameMenu.classList.add("js-combat");
            menuFlee.disabled = player.actionPoints < player.fleeCost;
        } else {
            gameMenu.classList.add("js-calm");
        }
        menuActive = true;
        const playerRect = player.element.getBoundingClientRect();
        const gameMenuRect = {
            width: gameMenu.getBoundingClientRect().width,
            height: gameMenu.getBoundingClientRect().height,
        }
        gameMenu.style.top = `${playerRect.top - gameMenuRect.height - 20}px`;
        gameMenu.style.left = `${playerRect.left + playerRect.width / 2 - gameMenuRect.width / 2}px`;
    }

    function hideMenu() {
        gameMenu.classList.remove("js-calm");
        gameMenu.classList.remove("js-combat");
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
        if (inventory.owner == "chest" && inventory.contents.length == 0) {
            hideInventory(true);
            return;
        }
        for (let i = 0; i < inventory.contents.length; i++) {
            const content = inventory.contents[i];
            inventoryGrid.append(inventoryItemButton(inventory, content));
        }
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
            return false;
        }
        invInfo.main.classList.remove("empty");
        invBtns[invBtnSelectedIndex].element.classList.remove("js-active");
        invBtnSelectedIndex = index;
        invBtns[invBtnSelectedIndex].element.classList.add("js-active");
        setInventoryHoverInfo(invBtns[invBtnSelectedIndex].content.item);
        return true;
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

    gemCraftingCreateRows();

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
        player = new Player(playerName, "player", playerAnimTime.move, playerAnimTime.attack, new Attribute(playerStats.health, true), new Attribute(playerStats.strength, false), new Attribute(playerStats.armor, false), ui, null, actions, playerAP, sfxArr, new Inventory("player"), null, gameOver);
        const weaponItemButton = player.setWeaponItem(new Item("start-sword", collectables.woodenSword));
        weaponItemButton.primaryElement.addEventListener("click", function() {
            if (!player.weaponItem.button.primaryElement.classList.contains("disabled")) {
                player.setPrimaryWeapon();
            }
        });
        weaponItemButton.secondaryElement.addEventListener("click", function() {
            if (!player.weaponItem.button.secondaryElement.classList.contains("disabled")) {
                player.setSecondaryWeapon();
            }
        });
        for (let i = 0; i < Object.keys(spell).length; i++) {
            const key = Object.keys(spell)[i];
            const slot = player.setSlot(new Slot("slot-" + (i + 3), spell[key]));
            slot.element.addEventListener("click", function() {
                const index = i;
                if (player.getSlotState(index)) {
                    player.activateSlot(index);
                }
            });
        }
        resetConfirmBox();
        player.setConfirmation(new Confirmation(
            "Flee?",
            "Are you sure you want to flee from the fight?<br>(You will be taken to a random tile in the last known safe area).",
            "Flee?",
            "Cancel",
            player.confirmation,
        ));

        gemCraftingPlayerSetup();

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
            for (let i = 0; i < cheatRedGem; i++) {
                uniqueIndex++;
                const item = new Item("gem-" + uniqueIndex, collectables.redGems);
                player.addRedGem(item);
            }
            for (let i = 0; i < cheatBlueGem; i++) {
                uniqueIndex++;
                const item = new Item("gem-" + uniqueIndex, collectables.blueGems);
                player.addBlueGem(item);
            }
            for (let i = 0; i < cheatGreenGem; i++) {
                uniqueIndex++;
                const item = new Item("gem-" + uniqueIndex, collectables.greenGems);
                player.addGreenGem(item);
            }
        }

        //Pathfinding algorithm test
        // updatePathfindingGrid();
        // console.log(findShortestPath({ x: 0, y: 0 }, { x: 3, y: 3 }, pathFindingGrid));

        gameStarted = true;
        startEngine();
    }

    function gemCraftingToggle() {
        if (gemCraftingActive) {
            gemCraftingHide();
        } else {
            gemCraftingShow();
        }
    }

    function gemCraftingShow() {
        gemCraftingActive = true;
        gemCrafting.classList.remove("js-hidden");
        gemCraftingSpellSelect(gemCraftingSpellElements[0].element, gemCraftingSpellElements[0].spell);
    }

    function gemCraftingHide() {
        gemCraftingActive = false;
        gemCrafting.classList.add("js-hidden");
    }

    function gemCraftingPlayerSetup() {
        const redGemCrafting = new GemCrafting(gemRed, gemRedUI, collectables.redGems);
        const blueGemCrafting = new GemCrafting(gemBlue, gemBlueUI, collectables.blueGems);
        const greenGemCrafting = new GemCrafting(gemGreen, gemGreenUI, collectables.greenGems);

        const gem = {
            red: redGemCrafting,
            blue: blueGemCrafting,
            green: greenGemCrafting,
        }
        gemCraftingSpellSetup(gem);

        redGemCrafting.subtractElement.addEventListener("mousedown", startRemoveRedGemTimer);
        redGemCrafting.addElement.addEventListener("mousedown", startAddRedGemTimer);

        blueGemCrafting.subtractElement.addEventListener("mousedown", startRemoveBlueGemTimer);
        blueGemCrafting.addElement.addEventListener("mousedown", startAddBlueGemTimer);

        greenGemCrafting.subtractElement.addEventListener("mousedown", startRemoveGreenGemTimer);
        greenGemCrafting.addElement.addEventListener("mousedown", startAddGreenGemTimer);

        for (let i = 0; i < Object.keys(gem).length; i++) {
            const key = Object.keys(gem)[i];
            gem[key].addElement.addEventListener("mouseup", cancelGemTimer);
            gem[key].addElement.addEventListener("mouseleave", cancelGemTimer);
            gem[key].subtractElement.addEventListener("mouseup", cancelGemTimer);
            gem[key].subtractElement.addEventListener("mouseleave", cancelGemTimer);
        }
    }

    //#region GEM TIMER
    let gemTimer;
    let gemTimeout;
    let gemTimerActive = false;
    const gemTimerDuration = 25;
    const gemTimeoutDuration = 250;

    function startAddRedGemTimer() {
        gemTimerActive = true;
        addRedGem();
        gemTimeout = setTimeout(() => {
            gemTimer = setInterval(() => {
                addRedGem();
            }, gemTimerDuration);
        }, gemTimeoutDuration);
    }

    function startRemoveRedGemTimer() {
        gemTimerActive = true;
        removeRedGem();
        gemTimeout = setTimeout(() => {
            gemTimer = setInterval(() => {
                removeRedGem();
            }, gemTimerDuration);
        }, gemTimeoutDuration);
    }

    function startAddBlueGemTimer() {
        gemTimerActive = true;
        addBlueGem();
        gemTimeout = setTimeout(() => {
            gemTimer = setInterval(() => {
                addBlueGem();
            }, gemTimerDuration);
        }, gemTimeoutDuration);
    }

    function startRemoveBlueGemTimer() {
        gemTimerActive = true;
        removeBlueGem();
        gemTimeout = setTimeout(() => {
            gemTimer = setInterval(() => {
                removeBlueGem();
            }, gemTimerDuration);
        }, gemTimeoutDuration);
    }

    function startAddGreenGemTimer() {
        gemTimerActive = true;
        addGreenGem();
        gemTimeout = setTimeout(() => {
            gemTimer = setInterval(() => {
                addGreenGem();
            }, gemTimerDuration);
        }, gemTimeoutDuration);
    }

    function startRemoveGreenGemTimer() {
        gemTimerActive = true;
        removeGreenGem();
        gemTimeout = setTimeout(() => {
            gemTimer = setInterval(() => {
                removeGreenGem();
            }, gemTimerDuration);
        }, gemTimeoutDuration);
    }

    function cancelGemTimer() {
        if (!gemTimerActive) {
            return;
        }
        clearTimeout(gemTimeout);
        clearInterval(gemTimer);
        gemTimerActive = false;
    }
    //#endregion GEM TIMER

    function addRedGem() {
        if (!player.removeRedGem()) {
            return;
        }
        gemCraftingSpellSelected.spellGem.addRed();
        if (gemCraftingSpellSelected.type == "defense") {
            gemCraftingSpellSelected.armor = gemCraftingSpellSelected.baseArmor + gemCraftingSpellSelected.spellGem.redValue;
        } else {
            gemCraftingSpellSelected.damage = gemCraftingSpellSelected.baseDamage + gemCraftingSpellSelected.spellGem.redValue;
        }
        gemCraftingUpdateTitle();
    }

    function removeRedGem() {
        if (!gemCraftingSpellSelected.spellGem.removeRed()) {
            return;
        }
        if (gemCraftingSpellSelected.type == "defense") {
            gemCraftingSpellSelected.armor = gemCraftingSpellSelected.baseArmor + gemCraftingSpellSelected.spellGem.redValue;
        } else {
            gemCraftingSpellSelected.damage = gemCraftingSpellSelected.baseDamage + gemCraftingSpellSelected.spellGem.redValue;
        }
        uniqueIndex++;
        player.addRedGem(new Item(collectables.redGems.type + uniqueIndex, collectables.redGems));
        gemCraftingUpdateTitle();
    }

    function addBlueGem() {
        if (gemCraftingSpellSelected.spellGem.blueLocked) {
            return;
        }
        if (!player.removeBlueGem()) {
            return;
        }
        gemCraftingSpellSelected.spellGem.addBlue();
        gemCraftingSpellSelected.cost = gemCraftingSpellSelected.baseCost - gemCraftingSpellSelected.spellGem.blueValue;
        if (gemCraftingSpellSelected.cost == 1) {
            gemCraftingSpellSelected.spellGem.lockBlue();
        }
        gemCraftingUpdateTitle();
    }

    function removeBlueGem() {
        if (!gemCraftingSpellSelected.spellGem.removeBlue()) {
            return;
        }
        gemCraftingSpellSelected.spellGem.unlockBlue();
        gemCraftingSpellSelected.cost = gemCraftingSpellSelected.baseCost - gemCraftingSpellSelected.spellGem.blueValue;
        uniqueIndex++;
        player.addBlueGem(new Item(collectables.blueGems.type + uniqueIndex, collectables.blueGems));
        gemCraftingUpdateTitle();
    }

    function addGreenGem() {
        if (gemCraftingSpellSelected.spellGem.greenLocked) {
            return;
        }
        if (!player.removeGreenGem()) {
            return;
        }
        gemCraftingSpellSelected.spellGem.addGreen();
        gemCraftingSpellSelected.cooldown = gemCraftingSpellSelected.baseCooldown - gemCraftingSpellSelected.spellGem.greenValue;
        if (gemCraftingSpellSelected.cooldown == 1) {
            gemCraftingSpellSelected.spellGem.lockGreen();
        }
        gemCraftingUpdateTitle();
    }

    function removeGreenGem() {
        if (!gemCraftingSpellSelected.spellGem.removeGreen()) {
            return;
        }
        gemCraftingSpellSelected.spellGem.unlockGreen();
        gemCraftingSpellSelected.cooldown = gemCraftingSpellSelected.baseCooldown - gemCraftingSpellSelected.spellGem.greenValue;
        uniqueIndex++;
        player.addGreenGem(new Item(collectables.greenGems.type + uniqueIndex, collectables.greenGems));
        gemCraftingUpdateTitle();
    }

    function gemCraftingUpdateTitle() {
        let title = "Damage";
        let redValue = gemCraftingSpellSelected.damage;
        if (gemCraftingSpellSelected.type == "defense") {
            title = "Armor";
            redValue = gemCraftingSpellSelected.armor;
        }
        gemCraftingSpellSelected.spellGem.red.title(title, redValue);
        gemCraftingSpellSelected.spellGem.blue.title("AP cost", gemCraftingSpellSelected.cost);
        gemCraftingSpellSelected.spellGem.green.title("Cooldown", gemCraftingSpellSelected.cooldown);
        gemCraftingSpellSelected.spellGem.setup();
        player.updateSlots();
    }

    function gemCraftingSpellSetup(gem) {
        for (let i = 0; i < Object.keys(spell).length; i++) {
            const key = Object.keys(spell)[i];
            spell[key].spellGem = new SpellGem(gem);
        }
    }

    function gemCraftingCreateRows() {
        for (let i = 0; i < Object.keys(spell).length; i++) {
            const key = Object.keys(spell)[i];
            const spellObj = spell[key];
            gemCraftingCreateRow(spellObj);
        }
    }

    function gemCraftingCreateRow(spellObj) {
        const rowElement = document.createElement("DIV");
        rowElement.classList.add("gem-crafting-row");

        const iconElement = document.createElement("DIV");
        iconElement.classList.add("spell");
        iconElement.classList.add(spellObj.type);
        iconElement.classList.add("gem-crafting-row-image");
        iconElement.innerHTML = spellObj.icon;

        const contentElement = document.createElement("DIV");
        contentElement.classList.add("gem-crafting-row__content");

        const titleElement = document.createElement("H3");
        titleElement.classList.add("gem-crafting-row__title");
        titleElement.textContent = spellObj.name;

        const textElement = document.createElement("P");
        textElement.classList.add("gem-crafting-row__text");
        textElement.textContent = spellObj.description;

        contentElement.append(titleElement);
        contentElement.append(textElement);

        rowElement.append(iconElement);
        rowElement.append(contentElement);

        gemCraftingSpellElements.push({ element: rowElement, spell: spellObj });

        rowElement.addEventListener("click", function() {
            gemCraftingSpellSelect(this, spellObj);
        });

        gemCraftingSpells.append(rowElement);
    }

    function gemCraftingSpellSelect(element, spellObj) {
        for (let i = 0; i < gemCraftingSpellElements.length; i++) {
            const gemCraftingSpellElement = gemCraftingSpellElements[i].element;
            gemCraftingSpellElement.classList.remove("js-selected");
        }
        gemCraftingSpellSelected = spellObj;
        gemCraftingSpellTitle.textContent = gemCraftingSpellSelected.name + " - Invested gems";
        element.classList.add("js-selected");

        player.setRedGem(gemCraftingSpellSelected.spellGem.red);
        player.setBlueGem(gemCraftingSpellSelected.spellGem.blue);
        player.setGreenGem(gemCraftingSpellSelected.spellGem.green);

        gemCraftingSpellSelected.spellGem.setup();

        gemCraftingUpdateTitle();
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
        player.createTooltip();
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
        if (tooltips.length == 0) {
            return;
        }
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
                edgeButtons(zone, x, y);
            }
        }
        // placeGateways();
        currentWorld.placeGateways();

        if (!isNewMap) {
            return;
        }

        const safeZonePercentage = 15;
        let safeZoneCount = region.zones.length / 100 * safeZonePercentage;
        safeZoneCount = Math.ceil(safeZoneCount);

        region.setSafeZones(safeZoneCount);

        const chestPercentage = 50;
        let chestCount = region.zones.length / 100 * chestPercentage;
        // let chestCount = region.safeZones.length / 100 * chestPercentage;
        chestCount = Math.ceil(chestCount);

        placeChests(chestCount);

        if (region.enemyPercentage > 0) {
            placeEnemies(zoneEnemyCount(region.enemyPercentage));
        }

        //INSERT ENEMIES MANUALLY FOR TESTING PURPOSES
        if (cheatsOn && enemiesAtStart > 0) {
            for (let i = 0; i < enemiesAtStart; i++) {
                const zone = region.getZone("0_0");
                // const tileObj2 = zone.getTileObj("2_2");
                // placeEnemy(tileObj2, enemyType.dummy);
                const tileObj = zone.getRandomTile(true);
                placeEnemy(tileObj, enemyType.dummy);
            }

        }

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
        if (currentWorld != worlds.home) {
            for (let i = 0; i < Object.keys(collectables).length; i++) {
                const key = Object.keys(collectables)[i];
                placeCollectables(collectables[key]);
            }
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
                moveAlongPath(this.id);
            });
            tileObjHTML.addEventListener("mouseover", function() {
                visualizePath(this.id);
            });
        }
        if (currentZone.gateway != undefined) {
            currentZone.gateway.createHTML();
        }
        currentZone.updateHTML();
        setEdgeButton(zoneTransitionUp, currentZone.edgeButtons.up);
        setEdgeButton(zoneTransitionDown, currentZone.edgeButtons.down);
        setEdgeButton(zoneTransitionLeft, currentZone.edgeButtons.left);
        setEdgeButton(zoneTransitionRight, currentZone.edgeButtons.right);
    }

    function moveAlongPath(tileId) {
        if (playerIsMoving || !playersTurn) {
            return;
        }
        let destinationTile = currentZone.getTileObj(tileId);
        if (player.activeSlot != null) {
            if (destinationTile.type == "enemy" || !player.spellIsRanged) {
                player.fireSlotSpell(destinationTile);
            } else {
                player.setPrimaryWeapon();
            }
        } else {
            hideMenu();
            let arr = path(destinationTile);
            const correctedDestTile = arr[arr.length - 1];
            playerAI(correctedDestTile);
        }
    }

    function visualizePath(tileId) {
        if (playerIsMoving || !playersTurn) {
            return;
        }
        const destinationTile = currentZone.getTileObj(tileId);
        let cost = 0;
        if (player.activeSlot != null) {
            cost = player.activeSlot.spell.cost;
        } else {
            cost = path(destinationTile).length;
            if (destinationTile.type == "enemy") {
                cost += player.totalAttackCost - 1;
            }
        }
        player.actionPointHTMLPreview(cost);
    }

    function setEdgeButton(edgeButton, hidden) {
        if (hidden) {
            edgeButton.classList.add("js-hidden");
        } else {
            edgeButton.classList.remove("js-hidden");
        }
    }

    function edgeControl(x, y) {
        let edge = "edge";
        edge += y == region.size.up ? "-up" : "";
        edge += y == region.size.down ? "-down" : "";
        edge += x == region.size.left ? "-left" : "";
        edge += x == region.size.right ? "-right" : "";
        return edge;
    }

    function edgeButtons(zone, x, y) {
        const edgeButton = {
            up: null,
            down: null,
            left: null,
            right: null,
        };
        if (y == region.size.up) {
            edgeButton.up = true;
        } else {
            edgeButton.up = false;
        }
        if (y == region.size.down) {
            edgeButton.down = true;
        } else {
            edgeButton.down = false;
        }
        if (x == region.size.left) {
            edgeButton.left = true;
        } else {
            edgeButton.left = false;
        }
        if (x == region.size.right) {
            edgeButton.right = true;
        } else {
            edgeButton.right = false;
        }
        zone.setEdgeButtons(edgeButton);
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
            calmEvent(true);
        }
    }

    function calmEvent(isSetup = false) {
        if (!isSetup && !battleInProgress) {
            return;
        }
        battleInProgress = false;
        playersTurn = true;
        player.inBattle = false;
        for (let i = 0; i < battleQueue.length; i++) {
            const character = battleQueue[i];
            character.removeCard();
        }
        battleQueue = [];
        player.actionPointHTMLRemove();
        player.resetAllSlots();
        music.crossFade(music.calm);
        background.classList.remove("battle");
        console.log("Calm");
    }

    function combatEvent() {
        battleInProgress = true;
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
        player.resetSlotCooldown();
        music.crossFade(music.combat);
        takeTurn();
    }

    function enemyKill() {
        player.enemyKill();
        enemiesInZone--;
        if (enemiesInZone <= 0) {
            enemiesInZone = 0;
            calmEvent();
        }
    }

    function updateBattleQueue() {
        let order = -1;
        for (let i = 0; i < battleQueue.length; i++) {
            const character = battleQueue[i];
            if (!character.isDead) {
                character.setInactive();
                order++;
                character.updateOrder(order);
            }
        }
        if (order == -1) {
            console.log("Battle is over!");
        }
    }

    function takeTurn() {
        const currentCharacter = battleQueue[0];
        if (currentCharacter.isDead) {
            nextTurn();
            return;
        }
        updateBattleQueue();
        currentCharacter.setActive();
        currentCharacter.actionPointsReset();
        player.setSlotStatesAll(false);
        let dotPause = false;
        setTimeout(() => {
            if (currentCharacter.beginTurn()) {
                // Has taken damage (DOT)
                dotPause = true;
            }
            setTimeout(() => {
                if (currentCharacter.isDead) {
                    nextTurn();
                    return;
                }
                if (currentCharacter == player) {
                    playersTurn = true;
                    player.setSlotCooldown();
                    player.setSlotStates();
                } else {
                    let turnDelay = 300;
                    if (dotPause) {
                        turnDelay = 1000;
                    }
                    setTimeout(() => {
                        enemyTurn(currentCharacter);
                    }, turnDelay);
                }
                updateDaytime();
            }, 300);
        }, 500);
    }

    function nextTurn() {
        if (!battleInProgress) {
            return;
        }
        playersTurn = false;
        hideMenu();
        const endTurnCharacter = battleQueue.shift();
        battleQueue.push(endTurnCharacter);
        if (!endTurnCharacter.isDead) {
            endTurnCharacter.endTurn();
        }
        takeTurn();
    }

    function enemyTurn(enemyObj) {
        updatePathfindingGrid();
        const moveDirection = shortestPathDirection(enemyObj.currentTile, player.currentTile);
        const destinationTileObj = adjacentTile(enemyObj.currentTile, moveDirection);
        setTimeout(() => {
            enemyMove(enemyObj, moveDirection, destinationTileObj);
        }, 25);
    }

    function enemyMove(enemyObj, direction, destinationTileObj) {
        enemyObj.currentTile.element.classList.add("attacking");
        enemyObj.element.classList.add("animation-" + direction);
        if (destinationTileObj == player.currentTile) {
            enemyObj.setAttackTime();
            halfWayMove(enemyObj.element, enemyObj.attackTime, direction, function() {
                effect.explosion.createHTML(destinationTileObj);
                effect.explosion.soundEffect("THUD_Bright_03_mono.mp3");
                destinationTileObj.object.takeDamage(enemyObj.strength.value);
                enemyObj.specialAttack();
            }, function() {
                enemyObj.currentTile.element.classList.remove("attacking");
                if (!destinationTileObj.object.isDead) {
                    enemyAction(enemyObj);
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
        tileObj.placeObject(player, "player", true);
        player.tileId = tileObj.id;
        if (itemInTile) {
            effect.flash.createHTML(tileObj);
        }
        if (enemyInTile) {
            console.log("Enemy in transitioned tile!!!");
        }
    }

    function placeChests(chestCount) {
        //Place and fill each chest
        for (let i = 0; i < chestCount; i++) {
            const zone = region.getRandomZone(true);
            const tileObj = zone.getRandomTile(true);
            let spawnPropability = 0;
            const collectableObjs = Object.keys(collectables);
            let collObjs = [];
            //Filter out collectables that can't be placed in chests and set spawn propability
            for (let keyIndex = 0; keyIndex < collectableObjs.length; keyIndex++) {
                const key = collectableObjs[keyIndex];
                const collectable = collectables[key];
                if (!collectable.inventoryItem && !collectable.type == "coin") {
                    continue;
                }
                spawnPropability += collectable.spawnPropability;
                collObjs.push({ collectable: collectable, spawnPropability: spawnPropability });
            }
            let items = [];
            let minMax = { typeIndex: 0, min: 1, max: 2 }
                //Lucky find (?)
            if (randomBool(4)) {
                minMax.typeIndex = 4;
                minMax.min = 8;
                minMax.max = 12;
            } else if (randomBool(12)) {
                minMax.typeIndex = 3;
                minMax.min = 6;
                minMax.max = 8;
            } else if (randomBool(25)) {
                minMax.typeIndex = 2;
                minMax.min = 4;
                minMax.max = 5;
            } else if (randomBool(50)) {
                minMax.typeIndex = 1;
                minMax.min = 2;
                minMax.max = 3;
            }
            const chest = new Chest(minMax.typeIndex, tileObj, new Inventory("chest"));
            placeChest(zone, chest);
            let itemCount = randomInteger(minMax.min, minMax.max);
            let collectable;
            for (let itemAmount = 0; itemAmount < itemCount; itemAmount++) {
                let rnd = randomInteger(0, spawnPropability);
                for (let collectableObjIndex = 0; collectableObjIndex < collObjs.length; collectableObjIndex++) {
                    const collectableObj = collObjs[collectableObjIndex];
                    if (rnd < collectableObj.spawnPropability) {
                        collectable = collectableObj.collectable;
                        uniqueIndex++;
                        items.push(new Item(collectable.type + "-" + uniqueIndex, collectable));
                        break;
                    }
                }
            }
            fillChest(chest, items);
        }
    }

    function placeChest(zone, chest) {
        chest.tileObj.setEmpty();
        chest.tileObj.placeObject(chest, "chest", true);
        miniMap.tileAddClass(zone.id, "chest");
    }

    function fillChest(chest, items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            chest.inventory.addItem(item);
        }
    }

    function destroyChest(zone, chest) {
        chest.tileObj.setEmpty();
        miniMap.tileRemoveClass(zone.id, "chest");
        effect.explosion.createHTML(chest.tileObj);
        effect.floating.createHTML(chest.tileObj, "Empty");
    }

    function placeEnemies(amount) {
        for (let i = 0; i < amount; i++) {
            const zone = region.getRandomUnsafeZone();
            const tileObj = zone.getRandomTile(true);
            randomEnemy(tileObj);
        }
        //TODO: This needs to be deleted at some point.
        //For now, it is used for adjustments of enemy amount/values
        // for (let i = 0; i < currentWorld.enemyTypes.length; i++) {
        //     const nmeType = currentWorld.enemyTypes[i];
        //     console.log(nmeType.name + "'s: " + nmeType.totalCount);
        // }
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
        const enemy = new Enemy(type.name, "enemy", type.moveTime, type.attackTime, new Attribute(type.life, true), new Attribute(type.strength, false), tileObj.id, actions, type.actionPoints, type.sfxs, new Inventory("enemy"), type, type.enemyDamage, type.enemyDeath);
        tileObj.setEmpty();
        tileObj.placeObject(enemy, "enemy", true);
        type.totalCount++;
    }

    function placeCollectables(collectable) {
        collectable.totalStackAmount = 0;
        const collStacks = Math.round(worlds.zoneCount(currentWorld) * collectable.spawnPerZone * collectableSpawnFactor);
        console.log(collectable.name + " - " + collStacks);
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
        // console.log(collectable.name + "'s total: " + uniqueIndex + ", total value: " + collectable.totalStackAmount);
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
        if (battleInProgress) {
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
        clearEffectTimeouts();
        currentZone.getTileObj(player.tileId).setEmpty();
        areaCoordinates.y += y;
        areaCoordinates.x += x;
        player.setPrevZone(currentZone);
        moveToZone(areaCoordinates.x + "_" + areaCoordinates.y);
        placePlayer(currentZone.getTileObjFromIndex(tileIndex));
    }

    function clearEffectTimeouts() {
        if (effectTimeouts.length > 0) {
            for (let i = 0; i < effectTimeouts.length; i++) {
                const effectTimeout = effectTimeouts[i];
                clearTimeout(effectTimeout);
            }
        }
    }

    function moveToZone(id) {
        miniMapActive(currentZone.id, false);
        buildZone(id);
        miniMapActive(currentZone.id, true);
        setEvent();
    }

    function playerAI(destinationTile, destinationReached = null) {
        if (player.currentTile == destinationTile) {
            if (destinationReached != null) {
                destinationReached();
            }
            return;
        }
        updatePathfindingGrid(true);
        const moveDirection = shortestPathDirection(player.currentTile, destinationTile);
        const destinationType = playerMove(moveDirection);
        playerIsMoving = true;
        setTimeout(() => {
            if (destinationType == "new tile") {
                playerAI(destinationTile, function() {
                    if (destinationReached != null) {
                        destinationReached();
                    }
                });
            } else {
                playerIsMoving = false;
            }
        }, player.moveTime + 10);
    }

    function path(destinationTile) {
        updatePathfindingGrid(true);
        if (player.currentTile == destinationTile) {
            pathsRemove();
            return [];
        }
        let tileObj = player.currentTile;
        const arr = findShortestPath(tileObj.coordinates(), destinationTile.coordinates(), pathFindingGrid);
        let tileArr = [];
        pathsRemove();
        for (let i = 0; i < arr.length; i++) {
            if (player.inBattle && i >= player.actionPoints) {
                break;
            }
            tileObj = adjacentTile(tileObj, arr[i]);
            tileObj.element.classList.add("path");
            tileArr.push(tileObj);
        }
        return tileArr;
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
                destinationTileObj.object.inventory.tile = destinationTileObj;
                showInventory(destinationTileObj.object.inventory);
            });
            return "chest";
        }
        if (player.inBattle) {
            if (destinationTileObj.type == "enemy") {
                const apAttack = player.apAttack();
                if (enemiesInZone > 0 && apAttack == -1) {
                    playerIsMoving = false;
                    return "ap zero";
                }
                player.setAttackTime();
                halfWayMove(player.element, player.attackTime, direction, function() {
                    destinationTileObj.object.takeDamage(player.strength.value);
                }, function() {
                    playerIsMoving = false;
                    player.setSlotStates();
                    if (enemiesInZone > 0) {
                        if (apAttack == 0) {
                            nextTurn();
                        }
                    }
                });
                return "enemy";
            }
        }
        const apMove = player.apMove();
        if (enemiesInZone > 0 && apMove == -1) {
            playerIsMoving = false;
            return "ap zero";
        }
        player.setMoveTime();
        fullMove(player.element, player.moveTime, direction, function() {
            if (destinationTileObj.type == "item") {
                effect.flash.createHTML(destinationTileObj);
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
            player.setSlotStates();
            if (enemiesInZone > 0) {
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

    function randomBool(chance) {
        const rnd = randomInteger(0, 100);
        if (rnd < chance) {
            return true;
        }
        return false;
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

    function roundDecimal(value, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
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
        if (!battleInProgress) {
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
                            case "gem":
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