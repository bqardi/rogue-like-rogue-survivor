document.addEventListener("DOMContentLoaded", event => {
    //#region SETTINGS
    const START_VOLUME = 0.0;
    const TILE_SIZE = 48;
    const TORCH_EQUIP_TIME = 0.3;
    const TICKS_PER_SECOND = 20;
    const MESSAGE_DELAY = 300;
    const MESSAGE_DURATION = 8000;
    const MESSAGE_FADE_DURATION = 300;
    const COLLECTABLE_SPAWN_FACTOR = 0.4;
    //#endregion SETTINGS

    //#region CHEATS

    const CHEATS_ON = true;
    const CHEAT_KEY = false;
    const CHEAT_WEAPON = false;
    const CHEAT_FOG_OF_WAR = true;
    const ENEMIES_AT_START = 0;
    const CHEAT_COLLECTABLES = true;
    const CHEAT_SPELL_DAMAGE = 99;
    const CHEAT_MONEY = 9999;

    const cheatCollectables = [
        { key: "ironAxe", amount: 1, inventory: true },
        { key: "pouch", amount: 5, inventory: true },
        { key: "largeShield", amount: 1, inventory: true },
        { key: "redGems", amount: 2011, inventory: true },
        { key: "blueGems", amount: 6318, inventory: true },
        { key: "greenGems", amount: 768, inventory: true },
    ];

    //#endregion CHEATS

    //#region VARIABLES

    // Quests
    let questID = 0;
    let chainID = 0;
    let questOverviewActive = false;
    const questOverview = document.getElementById("quest-overview");
    const questOverviewParent = questOverview.querySelector(".content");

    // Minimum dayDuration + nightDuration = 72, (55, 17) = 1 ticks per minute and change to nighttime at 18:19
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
    const tickTime = 1 / TICKS_PER_SECOND;
    let dayTimeTick = 0;
    let tTime = 0;

    //Inventory
    const playerInventory = document.getElementById("inventory");
    const inventoryWindow = document.getElementById("inventory-window");
    const inventoryGrid = document.getElementById("inventory-grid");
    const secondaryInventory = document.getElementById("inventory-secondary");
    const secondaryInventoryGrid = document.getElementById("inventory-secondary-grid");
    const inventoryTakeAll = document.getElementById("inventory-take-all");
    const invPrice = document.getElementById("inv-price");
    const invPriceText = invPrice.querySelector(".price");
    const inventoryPlayerMerchantToggle = document.getElementById("inventory-toggle");

    let merchantObj = {
        active: false,
        playerActive: false,
        inventory: null,
        buyFactor: 0.8,
        sellFactor: 1.2,
        activate(inventory) {
            this.active = true;
            this.playerActive = false;
            this.inventory = inventory;
        },
        deactivate() {
            this.active = false;
            this.playerActive = false;
            this.inventory = null;
        },
        itemPrice(item, buyFromPlayer) {
            let price = Math.round(item.price * this.sellFactor);
            if (buyFromPlayer) {
                price = Math.round(item.price * this.buyFactor);
            }
            return price;
        }
    };

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
    const openQuest = document.getElementById("open-quest");
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
        quest: {
            icon: document.getElementById("quest-icon"),
            count: document.getElementById("quest"),
            sprite: { x: 0, y: 0 },
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
        move: 140,
        attack: 120,
    }

    const playerStats = {
        health: 60,
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
    let sfxVolume = START_VOLUME;

    //#endregion VARIABLES

    //#region OBJECTS used before CLASSES

    let effect = {
        simple: {
            name: "Simple",
            createHTML: function(tileObj, type, duration) {
                const element = tileObj.element;
                let fx = document.createElement("DIV");
                fx.classList.add("effect");
                fx.classList.add(type);
                fx.classList.add("tile__object");
                fx.style.width = `${TILE_SIZE}px`;
                fx.style.height = `${TILE_SIZE}px`;
                fx.style.animationDuration = `${duration}ms`;
                element.append(fx);
                tileObj.setBusy();
                const effectTimeout = {
                    timeout: setTimeout(() => {
                        if (fx) {
                            element.removeChild(fx);
                            tileObj.freeBusy();
                        }
                    }, duration),
                    callback() {}
                }
                effectTimeouts.push(effectTimeout);
                return fx;
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
                this.fx.style.width = `${TILE_SIZE}px`;
                this.fx.style.height = `${TILE_SIZE}px`;
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
                fx.style.width = `${TILE_SIZE}px`;
                fx.style.height = `${TILE_SIZE}px`;
                fx.style.animationDuration = `${this.duration}ms`;
                element.append(fx);
                tileObj.setBusy();
                const effectTimeout = {
                    timeout: setTimeout(() => {
                        if (fx) {
                            element.removeChild(fx);
                            tileObj.freeBusy();
                        }
                    }, this.duration),
                    callback() {}
                }
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
                fx.style.width = `${TILE_SIZE}px`;
                fx.style.height = `${TILE_SIZE}px`;
                fx.style.cssText += `--floating-start-x:${randomInteger(-8, 8)}px;`;
                fx.style.cssText += `--floating-end-x:${randomInteger(-48, 48)}px;`;
                fx.style.animationDuration = `${this.duration}ms`;
                fx.innerHTML = value;
                element.append(fx);
                tileObj.setBusy();
                const effectTimeout = {
                    timeout: setTimeout(() => {
                        if (fx) {
                            element.removeChild(fx);
                            tileObj.freeBusy();
                        }
                    }, this.duration),
                    callback() {}
                }
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
            createHTML: function(tileObj, type, name, preActive, turnLength = 0) {
                this.preActive = preActive;
                const element = tileObj.element;
                let fx = document.createElement("DIV");
                fx.classList.add("effect");
                fx.classList.add(type);
                if (this.preActive) {
                    fx.classList.add("pre-active");
                }
                fx.classList.add("tile__object");
                fx.style.width = `${TILE_SIZE}px`;
                fx.style.height = `${TILE_SIZE}px`;
                if (turnLength > 0) {
                    this.turnLengthElm = document.createElement("DIV");
                    this.turnLengthElm.classList.add("turn-length");
                    this.turnLengthElm.textContent = turnLength;
                    fx.append(this.turnLengthElm);
                }
                this.gfx = document.createElement("DIV");
                this.gfx.classList.add("icon");
                this.gfx.classList.add(name);
                if (this.preActive) {
                    this.gfx.classList.add(preActive);
                }
                fx.append(this.gfx);
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
                if (this.preActive) {
                    fx.classList.remove("pre-active");
                    this.gfx.classList.remove(this.preActive);
                }
            },
            soundEffect(soundFile) {
                new SFX("./audio/sfx/" + soundFile, sfxVolume);
            }
        },
        zoomTo: {
            name: "Zoom to",
            createHTML(tileObj, targetElement, type, spritePos, callback = null) {
                const element = document.body;
                let fx = document.createElement("DIV");
                fx.classList.add("effect");
                fx.classList.add("zoom-to");
                fx.classList.add(type);
                fx.classList.add("tile__object");
                fx.style.width = `${TILE_SIZE}px`;
                fx.style.height = `${TILE_SIZE}px`;

                const icon = document.createElement("DIV");
                icon.classList.add("zoom-icon");
                icon.style.backgroundPosition = `-${spritePos.x * 100}% -${spritePos.y * 100}%`;

                const sourceRect = tileObj.element.getBoundingClientRect();
                const targetRect = targetElement.getBoundingClientRect();
                const duration = cssMoveVarsFixed(fx, sourceRect, targetRect) * 1.1;
                icon.style.animationDuration = `${duration}ms`;
                fx.style.animationDuration = `${duration}ms`;

                fx.appendChild(icon);
                element.appendChild(fx);

                setTimeout(() => {
                    if (callback) {
                        callback();
                    }
                    element.removeChild(fx);
                }, duration);

                return fx;
            },
            soundEffect(soundFile) {
                new SFX("./audio/sfx/" + soundFile, sfxVolume);
            }
        }
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
                effect.simple.createHTML(tileObj, "explosion", 700);
                effect.simple.soundEffect("THUD_Bright_03_mono.mp3");
            },
            enemyDeath: function(enemy) {
                enemyKill(enemy);
                enemyDrop(enemy);
            }
        },
        skeleton: {
            name: "Skeleton",
            cls: "skeleton",
            life: 20,
            strength: 15,
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
                effect.simple.createHTML(tileObj, "explosion", 700);
                effect.simple.soundEffect("THUD_Bright_03_mono.mp3");
            },
            enemyDeath: function(enemy) {
                enemyKill(enemy);
                enemyDrop(enemy);
            }
        },
        orc: {
            name: "Orc",
            cls: "orc",
            life: 50,
            strength: 24,
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
                effect.simple.createHTML(tileObj, "explosion", 700);
                effect.simple.soundEffect("THUD_Bright_03_mono.mp3");
            },
            enemyDeath: function(enemy) {
                enemyKill(enemy);
                enemyDrop(enemy);
            }
        },
        goblin: {
            name: "Goblin",
            cls: "goblin",
            life: 12,
            strength: 6,
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
                effect.simple.createHTML(tileObj, "explosion", 700);
                effect.simple.soundEffect("THUD_Bright_03_mono.mp3");
            },
            enemyDeath: function(enemy) {
                enemyKill(enemy);
                enemyDrop(enemy);
            }
        },
    }

    const enemyBossType = {
        fireElemental: {
            name: "Fire Elemental",
            cls: "fire-elemental",
            world: "outdoor",
            zoneID: "-1_0",
            life: 250,
            strength: 54,
            totalCount: 0,
            moveTime: 500,
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
                effect.simple.createHTML(tileObj, "explosion", 700);
                effect.simple.soundEffect("THUD_Bright_03_mono.mp3");
            },
            enemyDeath: function(enemy) {
                enemyKill(enemy);
                enemyDrop(enemy);
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
        updateQuestObjectives(world) {
            if (world.questObjectives.length > 0) {
                for (let i = 0; i < world.questObjectives.length; i++) {
                    const objective = world.questObjectives[i];
                    const merchant = objective.merchant;
                    const minimapTile = miniMap.getTile(objective.zoneID);
                    if (getQuestState(merchant)) {
                        minimapTile.classList.add("quest-active");
                        objective.tooltip.setActive(true);
                    } else {
                        minimapTile.classList.remove("quest-active");
                        objective.tooltip.setActive(false);
                    }
                }
            }
        },
        removeManagers(world, chainID) {
            if (world.questObjectives.length > 0) {
                for (let i = world.questObjectives.length - 1; i >= 0; i--) {
                    const objective = world.questObjectives[i];
                    if (objective.merchant.questManager) {
                        if (objective.merchant.questManager.chainID == chainID) {
                            objective.merchant.removeManager();
                        }
                    } else {
                        world.questObjectives.splice(i, 1);
                    }
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
            questObjectives: [],
        },
        outdoor: {
            name: "La La Land",
            type: "outdoor",
            locked: false,
            bioms: ["forest", "desert", "snow"],
            obstacles: [{ type: "tree", health: 100, resource: "wood" }, { type: "rock", health: 300, resource: "stone" }],
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
            questObjectives: [],
        },
        kartansLair: {
            name: "Kartans Lair",
            type: "dungeon",
            locked: true,
            bioms: ["dungeon"],
            obstacles: [{ type: "pillar", health: 400, resource: "stone" }, { type: "barrel", health: 50, resource: "wood" }],
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
            questObjectives: [],
        },
        dungeonOfMachlain: {
            name: "The Dungeon of Machlain",
            type: "dungeon",
            locked: true,
            bioms: ["dungeon"],
            obstacles: [{ type: "pillar", health: 400, resource: "stone" }, { type: "barrel", health: 50, resource: "wood" }],
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
            questObjectives: [],
        },
        orchsCave: {
            name: "Orchs cave",
            type: "dungeon",
            locked: true,
            bioms: ["dungeon"],
            obstacles: [{ type: "pillar", health: 400, resource: "stone" }, { type: "barrel", health: 50, resource: "wood" }],
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
            questObjectives: [],
        },
        piratesLair: {
            name: "Pirates Lair",
            type: "dungeon",
            locked: true,
            bioms: ["dungeon"],
            obstacles: [{ type: "pillar", health: 400, resource: "stone" }, { type: "barrel", health: 50, resource: "wood" }],
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
            questObjectives: [],
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

            this.health = null;
            this.healthTimer = null;
            this.healthType = null;
        }
        addHealthObj(healthObj, type) {
            this.health = healthObj;
            this.healthType = type;
        }
        createHealthHTML() {
            if (this.health) {
                this.healthElement = document.createElement("DIV");
                this.healthElement.classList.add("tile-health");
                this.healthElement.classList.add("js-hidden");
                this.healthBarElement = document.createElement("DIV");
                this.healthBarElement.classList.add("tile-health__bar");

                this.healthElement.appendChild(this.healthBarElement);
                this.element.appendChild(this.healthElement);
                const percentage = (this.health.value / this.health.maxValue) * 100;
                this.healthBarElement.style.width = `${percentage}%`;
            }
        }
        updateHealthBar() {
            if (this.healthElement) {
                if (this.healthTimer) {
                    clearTimeout(this.healthTimer);
                }
                this.healthElement.classList.remove("js-hidden");
                const percentage = (this.health.value / this.health.maxValue) * 100;
                this.healthBarElement.style.width = `${percentage}%`;
                this.healthTimer = setTimeout(() => {
                    this.healthElement.classList.add("js-hidden");
                }, 3000);
            }
        }
        takeDamage(amount) {
            if (this.health && this.health.value > 0) {
                const healthLeft = this.health.remove(amount);
                effect.floating.createHTML(this, roundDecimal(amount, 2));
                if (healthLeft == 0) {
                    effect.simple.createHTML(this, "explosion", 700);
                    this.element.className = "zone__tile zone__empty";
                    this.setEmpty();
                }
                this.updateHealthBar();
                return healthLeft;
            }
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
        getTile(id) {
            const miniMapTile = document.getElementById("minimap_" + id);
            return miniMapTile;
        }
    }

    class MiniTooltip {
        constructor(parent, title, text) {
            this.parent = parent;
            this.title = title;
            this.text = text;
            this.createHTML();
        }
        createHTML() {
            this.element = document.createElement("DIV");
            this.element.classList.add("mini-tooltip");
            this.titleElement = document.createElement("H3");
            this.titleElement.classList.add("mini-tooltip__title");
            this.titleElement.textContent = this.title;
            this.textElement = document.createElement("P");
            this.textElement.classList.add("mini-tooltip__text");
            this.textElement.textContent = this.text;
            this.element.appendChild(this.titleElement);
            this.element.appendChild(this.textElement);
            this.parent.appendChild(this.element);
        }
        setActive(isActive) {
            if (this.element) {
                if (isActive) {
                    this.element.classList.add("js-active");
                } else {
                    this.element.classList.remove("js-active");
                }
            }
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
            this.element.addEventListener("mouseenter", function(evt) {
                evt.currentTarget.classType.showTooltip();
            });
            this.element.addEventListener("mouseleave", function(evt) {
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
        constructor(name, type, moveTime, attackTime, health, strength, tileId, apElement, actionPoints, sfxs, inventory, onDamage, onDeath) {
            this.name = name;
            this.lcaseName = toFileName(this.name);
            this.type = type;
            this.moveTime = moveTime;
            this.attackTime = attackTime;
            this.health = health;
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
            this.styleOpacity = 1;
            if (this.type == "player") {
                this.lcaseName = "spritesheet";
            }
        }
        get currentTile() {
            return currentZone.getTileObj(this.tileId);
        }
        get opacity() {
            return this.styleOpacity;
        }
        set opacity(value) {
            this.styleOpacity = value;
            this.element.style.opacity = this.styleOpacity;
        }
        createTooltip() {
            this.tooltip = new Tooltip(this.name, this.texts, this.element);
            this.element.classType = this;
            this.element.addEventListener("mouseenter", (evt) => this.showTooltip(evt));
            this.element.addEventListener("mouseleave", (evt) => this.tooltip.hide(evt));
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
            this.apImage.src = `./images/${this.type}-${this.lcaseName}.png`;
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
                    this.removeStatusEffect();
                }
                return true;
            }
            return false;
        }
        endTurn() {
            this.actionPointsTransfer = this.actionPoints;
        }
        damageOverTime(damage, count, statusEffect) {
            this.dotCount = count;
            this.dot = damage;
            if (this.statusEffect) {
                this.removeStatusEffect();
            }
            this.statusEffect = statusEffect;
        }
        removeStatusEffect() {
            this.dot = 0;
            if (this.element && this.statusEffect) {
                if (this.element.contains(this.statusEffect)) {
                    this.element.removeChild(this.statusEffect);
                }
            }
        }
        setMoveTime() {
            this.element.style.animationDuration = `${this.moveTime}ms`;
        }
        setAttackTime() {
            this.element.style.animationDuration = `${this.attackTime}ms`;
        }
        addLife(amount) {
            if (this.isDead || amount == 0) {
                return;
            }
            let healthLeft = 0;
            if (amount < 0) {
                healthLeft = this.health.remove(-amount);
            } else {
                healthLeft = this.health.add(amount);
            }
            if (healthLeft == 0) {
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
        playSFX(sfxFile) {
            new SFX("./audio/sfx/" + sfxFile, sfxVolume);
        }
        createCardHTML(parent) {
            const titleImage = `
                <h3 class="character-card__title">${this.name}</h3>
                <img class="character-card__image" src="./images/${this.type}-${this.lcaseName}.png" alt="${this.name}">
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
                this.cardHealthBar.style.width = `${this.health.value / this.health.maxValue * 100}%`
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
            health,
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
            super(name, type, moveTime, attackTime, health, strength, tileId, apElement, actionPoints, sfxs, inventory, onDamage, onDeath);
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
            this.quests = [];
            this.questRows = [];
            this.fleeElement = document.getElementById("combat-flee");
            this.fleeCostElement = document.getElementById("combat-flee-cost");
            this.moveElement = document.getElementById("combat-move");
            this.moveCostElement = document.getElementById(`combat-move-cost`);
            this.initialize();
        }
        initialize() {
            this.ui.life.count.textContent = this.health.value;
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
        addQuest(quest) {
            this.quests.push(quest);
        }
        removeQuest(quest) {
            for (let i = this.quests.length - 1; i >= 0; i--) {
                const thisQuest = this.quests[i];
                if (thisQuest.id == quest.id) {
                    this.quests.splice(i, 1);
                    return true;
                }
            }
            return false;
        }
        removeQuests(chainID) {
            for (let i = this.quests.length - 1; i >= 0; i--) {
                const foundQuest = this.quests[i];
                if (foundQuest.chainID == chainID) {
                    this.quests.splice(i, 1);
                }
            }
        }
        addQuestRow(row, chainID) {
            this.questRows.push({ row, chainID });
        }
        updateQuestRow(chainID) {
            let exists = false;
            for (let i = 0; i < this.questRows.length; i++) {
                const questRow = this.questRows[i];
                if (questRow.chainID == chainID) {
                    questRow.row.setPending();
                    exists = true;
                    break;
                }
            }
            return exists;
        }
        lastQuestRow(chainID) {
            for (let i = 0; i < this.questRows.length; i++) {
                const questRow = this.questRows[i];
                if (questRow.chainID == chainID) {
                    questRow.row.setComplete();
                    return;
                }
            }
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
                tooltipElm("Life: ", this.health.value),
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
            this.ui.life.count.textContent = this.health.value;
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
            let spellObj = player.currentTile;
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
        get spellTargetEmpty() {
            return this.activeSlot.spell.canTargetEmpty;
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
        enemyKill(enemy) {
            this.killCount++;
            for (let i = 0; i < this.quests.length; i++) {
                const quest = this.quests[i];
                if (quest.objective.detail.countUp) {
                    if (quest.objective.detail.countUp(quest.objective, enemy.name)) {
                        for (let merchants = 0; merchants < currentWorld.questObjectives.length; merchants++) {
                            const objective = currentWorld.questObjectives[merchants];
                            const merchant = objective.merchant;
                            if (objective.zoneID == currentZone.id) {
                                console.log("Getting quest state")
                                merchant.setQuestState(getQuestState(merchant));
                            }
                        }
                        worlds.updateQuestObjectives(currentWorld);
                    }
                }
            }
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
            health,
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
            super(name, type, moveTime, attackTime, health, strength, tileId, apElement, actionPoints, sfxs, inventory, onDamage, onDeath);
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
                tooltipElm("Life: ", roundDecimal(this.health.value, 2)),
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
            this.element = document.createElement("DIV");
            this.element.classList.add("enemy");
            this.element.style.backgroundImage = `url(./images/enemy-${this.lcaseName}.png)`;
            this.element.classList.add("animation");
            this.element.classList.add("tile__object");
            this.element.style.animationDuration = `${this.animationTime}ms`;
            this.element.append(this.healthBarHTML());
            this.createTooltipContent();
            this.createTooltip();
            return this.element;
        }
        healthBarHTML(healthClass = "") {
            let healthbar = document.createElement("DIV");
            healthbar.classList.add("healthbar");
            if (healthClass != "") {
                healthbar.classList.add(healthClass);
            }

            this.elmBar = document.createElement("DIV");
            this.elmBar.classList.add("bar");
            this.elmBar.style.width = `${this.health.value / this.health.maxValue * 100}%`;

            this.elmBarText = document.createElement("SPAN");
            this.elmBarText.classList.add("bar__text");
            this.elmBarText.textContent = `${this.health.value} / ${this.health.maxValue}`;

            healthbar.append(this.elmBar);
            healthbar.append(this.elmBarText);

            return healthbar;
        }
        addLife(amount) {
            super.addLife(amount);
            if (this.health.value <= 0) {
                this.tooltip.remove();
            }
        }
        takeDamage(damage) {
            super.takeDamage(damage);
            this.elmBar.style.width = `${this.health.value / this.health.maxValue * 100}%`;
            this.elmBarText.textContent = `${roundDecimal(this.health.value, 2)} / ${this.health.maxValue}`;
            if (this.health.value <= 0) {
                this.currentTile.removeObject(this.element);
                return true;
            }
            this.updateTooltip();
            return false;
        }
    }

    class EnemyBoss extends Enemy {
        constructor(
            name,
            type,
            moveTime,
            attackTime,
            health,
            strength,
            tileId,
            apElement,
            actionPoints,
            sfxs,
            inventory,
            typeObj,
            spell,
            onDamage,
            onDeath
        ) {
            super(name, type, moveTime, attackTime, health, strength, tileId, apElement, actionPoints, sfxs, inventory, typeObj, onDamage, onDeath);
            this.spell = spell;
        }
        createHTML() {
            this.element = document.createElement("DIV");
            this.element.classList.add("enemy");
            this.element.classList.add("boss");
            this.element.classList.add("animation");
            this.element.classList.add("tile__object");
            this.element.style.animationDuration = `${this.animationTime}ms`;
            this.spriteElement = document.createElement("DIV");
            this.spriteElement.classList.add("boss-icon");
            this.spriteElement.style.backgroundImage = `url(./images/enemy-${this.lcaseName}.png)`;
            this.element.append(this.spriteElement);
            this.element.append(super.healthBarHTML("boss-healthbar"));
            this.createTooltipContent();
            this.createTooltip();
            return this.element;
        }
        spellFire(targetTileObj) {
            this.spell.fire(this.currentTile, targetTileObj, this.strength.value / 2, function(spellObj) {
                console.log("Fireball hit the player");
            });
        }
    }

    class Health {
        constructor(health, maxHealth = -1) {
            this.value = health;
            this.maxValue = maxHealth;
            this.initialize();
        }
        initialize() {
            if (this.maxValue === -1) {
                this.maxValue = this.value;
            }
        }
        add(amount) {
            this.value += amount;
            if (this.value > this.maxValue) {
                this.value = this.maxValue;
            }
            return this.value;
        }
        remove(amount) {
            this.value -= amount;
            if (this.value <= 0) {
                this.value = 0;
            }
            return this.value;
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
            if (this.spell.selfDeactivate) {
                this.spell.selfDeactivate();
            }
        }
        spellActivate(spellObj) {
            if (this.isCoolingDown) {
                return false;
            }
            return this.spell.activate(spellObj);
        }
        spellDeactivate() {
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
            this.price = collectable.price;
            this.apMoveCost = collectable.apMoveCost;
            this.equipped = false;
            this.isQuestItem = false;
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
            this.questItems = [];
        }
        addQuestItem(item) {
            item.isQuestItem = true;
            this.questItems.push(item);
            return this.addItem(item);
        }
        removeQuestItem(item) {
            let index = -1;
            for (let i = 0; i < this.questItems.length; i++) {
                const questItem = this.questItems[i];
                if (questItem.id == item.id) {
                    index = i;
                }
            }
            if (index == -1) {
                return false;
            }
            this.questItems.splice(index, 1);
            return this.removeItem(item);
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
            const obj = { item: item, count: 1 };
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
            this.delay = 500;
            this.timer = null;
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
            if (this.timer) {
                clearTimeout(this.timer);
            }
            this.timer = setTimeout(() => {
                let boundElmObj = this.boundElement.getBoundingClientRect();
                const top = boundElmObj.top - this.rect.height - this.offset;
                const left = boundElmObj.left + (boundElmObj.width / 2) - (this.rect.width / 2);
                this.element.style.top = top + "px";
                this.element.style.left = left + "px";
                this.element.classList.add("js-active");
            }, this.delay);
        }
        showBelow() {
            if (this.timer) {
                clearTimeout(this.timer);
            }
            this.timer = setTimeout(() => {
                let boundElmObj = this.boundElement.getBoundingClientRect();
                const top = boundElmObj.top + boundElmObj.height + this.offset;
                const left = boundElmObj.left + (boundElmObj.width / 2) - (this.rect.width / 2);
                this.element.style.top = top + "px";
                this.element.style.left = left + "px";
                this.element.classList.add("js-active");
            }, this.delay);
        }
        hide() {
            if (this.timer) {
                clearTimeout(this.timer);
            }
            this.element.classList.remove("js-active");
        }
        remove() {
            if (this.timer) {
                clearTimeout(this.timer);
            }
            if (this.element) {
                this.element.parentNode.removeChild(this.element);
            }
        }
    }

    class Chest {
        constructor(spritePos, inventory) {
            this.spritePos = spritePos;
            this.inventory = inventory;
        }
        createHTML() {
            this.element = document.createElement("DIV");
            this.element.classList.add(this.inventory.owner);
            this.element.classList.add("tile__object");
            this.element.style.backgroundPosition = `0 ${this.spritePos * -100}%`;
            return this.element;
        }
    }

    class Merchant extends Chest {
        constructor(name, spritePos, inventory) {
            super(spritePos, inventory);
            this.name = name;
            this.questManager = null;
            this.questState = false;
        }
        createHTML() {
            this.element = document.createElement("DIV");
            this.element.classList.add(this.inventory.owner);
            this.element.classList.add("tile__object");
            this.element.style.backgroundPosition = `0 ${this.spritePos * -100}%`;
            return this.element;
        }
        addManager(questManager) {
            this.questManager = questManager;
        }
        removeManager() {
            this.questManager = null;
        }
        setQuestState(hasActiveQuest) {
            if (hasActiveQuest) {
                if (this.element) {
                    this.element.classList.add("quest-active");
                }
                this.questState = true;
            } else {
                if (this.element) {
                    this.element.classList.remove("quest-active");
                }
                this.questState = false;
            }
        }
        get isQuestManager() {
            return this.questManager != null;
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
        constructor(gemCraftingObj, increaseRate, startIncrease) {
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
            this.nextBlueValue = 2;
            this.nextGreenValue = 2;

            this.previousRedValue = 1;
            this.previousBlueValue = 1;
            this.previousGreenValue = 1;

            this.blueFactor = 3;
            this.greenFactor = 2;

            this.blueLocked = false;
            this.greenLocked = false;

            this.increaseRate = increaseRate;
            this.startIncrease = startIncrease;
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
            this.getRedLevel();
            this.redUI();
        }
        redPrevious() {
            this.getRedLevel();
            this.redUI();
        }
        blueNext() {
            if (this.investedBlue == this.nextBlueValue) {
                this.nextBlueValue *= this.blueFactor;
                this.previousBlueValue = this.nextBlueValue / this.blueFactor;
                this.actualBlueValue++;
                this.blueUI();
            }
        }
        bluePrevious() {
            if (this.investedBlue < this.previousBlueValue && this.actualBlueValue > 0) {
                this.nextBlueValue /= this.blueFactor;
                this.previousBlueValue = this.nextBlueValue / this.blueFactor;
                this.actualBlueValue--;
                this.blueUI();
            }
        }
        greenNext() {
            if (this.investedGreen == this.nextGreenValue) {
                this.nextGreenValue *= this.greenFactor;
                this.previousGreenValue = this.nextGreenValue / this.greenFactor;
                this.actualGreenValue++;
                this.greenUI();
            }
        }
        greenPrevious() {
            if (this.investedGreen < this.previousGreenValue && this.actualGreenValue > 0) {
                this.nextGreenValue /= this.greenFactor;
                this.previousGreenValue = this.nextGreenValue / this.greenFactor;
                this.actualGreenValue--;
                this.greenUI();
            }
        }
        getRedLevel() {
            if (this.investedRed == 0) {
                this.nextRedValue = 1;
                this.actualRedValue = 0;
                return
            }
            let counterIncrease = this.startIncrease;
            let counter = counterIncrease;
            let adder = 1;
            let i = 0;
            let pressOn = true;
            while (pressOn) {
                counter--;
                if (counter == 0) {
                    if (adder % this.increaseRate == 0) {
                        counterIncrease++;
                    }
                    counter = counterIncrease;
                    adder++;
                    if (this.investedRed < i) {
                        this.nextRedValue = i;
                        pressOn = false;
                    }
                }
                if (this.investedRed == i) {
                    this.actualRedValue = adder;
                }
                i++;
            }
        }
    }

    class QuestUI {
        constructor() {
            this.element = document.getElementById("quest");
            this.imageElement = this.element.querySelector(".image");
            this.titleElement = this.element.querySelector(".title");
            this.descriptionElement = this.element.querySelector(".description");
            this.cancelElement = this.element.querySelector(".cancel");
            this.acceptElement = this.element.querySelector(".accept");
            this.nextElement = this.element.querySelector(".next");

            this.cancelElement.addEventListener("click", evt => this.cancel(evt));
            this.acceptElement.addEventListener("click", evt => this.confirm(evt));
            this.nextElement.addEventListener("click", evt => this.nextDialog(evt));

            this.quest = null;
            this.dialog = null;
            this.showCancel = true;
        }
        showDialog(quest, dialog, showConfirm, showCancel, showNext) {
            this.quest = quest;
            this.dialog = dialog;
            this.showCancel = showCancel;
            this.element.classList.remove("js-hidden");
            this.imageElement.style.backgroundPosition = `0 -${this.dialog.spritePos * 100}%`;
            this.titleElement.textContent = this.dialog.title;
            this.descriptionElement.textContent = this.dialog.description;
            if (showConfirm) {
                this.acceptElement.style.display = "block";
            } else {
                this.acceptElement.style.display = "none";
            }
            if (this.showCancel) {
                this.cancelElement.style.display = "block";
            } else {
                this.cancelElement.style.display = "none";
            }
            if (showNext) {
                this.nextElement.style.display = "block";
            } else {
                this.nextElement.style.display = "none";
            }
        }
        reset() {
            this.element.classList.add("js-hidden");
            this.quest.reset();
            this.dialog.reset();
            this.quest = null;
            this.dialog = null;
            this.showCancel = true;
        }
        cancel() {
            this.quest.cancel();
            this.reset();
        }
        confirm() {
            this.quest.confirm();
            this.reset();
        }
        nextDialog() {
            if (this.dialog.next()) {
                this.showDialog(this.quest, this.dialog, false, this.showCancel, true);
            } else {
                this.showDialog(this.quest, this.dialog, true, this.showCancel, false);
            }
        }
    }

    class QuestDialog {
        constructor(title, spritePos, descriptions) {
            this.title = title;
            this.spritePos = spritePos;
            this.descriptions = descriptions;
            this.descriptionIndex = 0;
        }
        reset() {
            this.descriptionIndex = 0;
        }
        next() {
            this.descriptionIndex++;
            if (this.descriptionIndex == this.descriptions.length - 1) {
                return false;
            }
            return true;
        }
        get hasNext() {
            return this.descriptions.length > 1;
        }
        get description() {
            return this.descriptions[this.descriptionIndex];
        }
    }

    class QuestObjective {
        constructor(detail, type, dialog) {
            this.detail = detail;
            this.type = type;
            this.dialog = dialog;
            this.state = "inactive";
        }
        setActive() {
            this.state = "active";
            this.detail.onBegin();
        }
        setComplete() {
            this.state = "complete";
            this.detail.onEnd();
        }
    }

    class Quest {
        constructor(id, orderID, chainID, ui, objective, previousQuestID) {
            this.id = id;
            this.orderID = orderID;
            this.chainID = chainID;
            this.ui = ui;
            this.objective = objective;
            this.previousQuestID = previousQuestID;
            this.questManager = null;
            this.currentQuest = null;
            this.item = null;
            this.pending = false;
        }
        begin(questManager, currentQuest, callback) {
            this.callback = callback;
            let showConfirm;
            let canCancel;
            let showNext;
            let dialog;
            if (this.previousQuestID != null && currentQuest != null && this.previousQuestID == currentQuest.id) {
                this.currentQuest = currentQuest;
                //In the quest chain, only when the "next assignment" is accepted (confirm()),
                //will the current one be given the status of "completed".
            }
            switch (this.objective.state) {
                case "inactive":
                    if (this.currentQuest == null && this.orderID != 0) {
                        return false;
                    } else {
                        dialog = this.objective.dialog.begin;
                        showConfirm = !dialog.hasNext;
                        canCancel = true;
                        showNext = dialog.hasNext;
                        this.questManager = questManager;
                        break;
                    }
                case "active":
                    if (questManager && questManager.id == this.questManager.id) {
                        dialog = this.objective.dialog.pending;
                        showConfirm = false;
                        canCancel = true;
                        showNext = dialog.hasNext;
                        this.pending = true;
                    }
                    break;

                default:
                    return false;
            }
            this.ui.showDialog(this, dialog, showConfirm, canCancel, showNext);
            return true;
        }
        confirm() {
            if (this.currentQuest) {
                this.currentQuest.objective.setComplete();
            }
            this.objective.setActive();
            if (this.callback) {
                this.callback(this);
            }
            this.reset();
        }
        cancel() {
            if (this.pending) {
                if (this.callback) {
                    this.callback(this);
                }
                this.pending = false;
            }
            this.reset();
        }
        reset() {
            this.isRecievingManager = null;
            this.currentQuest = null;
        }
        setItem(item) {
            this.item = item;
        }
        getItem() {
            const item = this.item;
            this.item = null;
            return item;
        }
    }

    class QuestManager {
        constructor(id, chainID, spritePos) {
            this.id = id;
            this.chainID = chainID;
            this.spritePos = spritePos;
            this.quests = [];
            this.depleted = false;
            this.merchant = false;
        }
        get quest() {
            if (this.quests.length == 0) {
                this.depleted = true;
                return null;
            }
            return this.quests[0];
        }
        get hasMerchant() {
            return this.merchant;
        }
        set hasMerchant(value) {
            this.merchant = value;
        }
        addQuest(quest) {
            this.quests.push(quest);
        }
        getQuest() {
            if (this.quest == null) {
                return null;
            }
            const quest = this.quests.shift();
            if (this.quests.length == 0) {
                this.depleted = true;
            }
            return quest;
        }
        isPending(quest) {
            return this.id == quest.questManager.id;
        }
        compareChainID(chainID) {
            // for (let i = 0; i < this.quests.length; i++) {
            //     const quest = this.quests[i];
            //     if (quest.chainID == chainID) {
            //         return true;
            //     }
            // }
            if (chainID == this.chainID) {
                return true;
            }
            return false;
        }
    }

    class QuestRow {
        constructor(parent, title) {
            this.parent = parent;
            this.title = title;
            this.createHTML();
        }
        createHTML() {
            this.element = document.createElement("DIV");
            this.element.classList.add("quest-overview__row");
            this.titleElement = document.createElement("P");
            this.titleElement.classList.add("quest-overview__row-title");
            this.titleElement.textContent = this.title;
            this.statusElement = document.createElement("P");
            this.statusElement.classList.add("quest-overview__row-status");
            this.element.appendChild(this.titleElement);
            this.element.appendChild(this.statusElement);
            this.parent.appendChild(this.element);
        }
        setPending() {
            this.element.classList.add("pending");
        }
        setComplete() {
            this.element.classList.add("complete");
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

    //#region VARIABLES class dependant
    const questUI = new QuestUI();
    //#endregion VARIABLES class dependant

    //#region OBJECTS

    let spell = {
        fireball: {
            id: "fireball",
            name: "Fireball",
            type: "offense",
            description: "Ranged ball of fire with high damage",
            icon: `<div class="spell-icon" style="background-position: -600% 0;">`,
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
            increaseRate: 7,
            startIncrease: 3,
            spellGem: null,
            activate(source) {
                if (this.fired) {
                    return false;
                }
                this.source = source;
                this.effect = effect.spell.createHTML(this.source, "ranged", this.id, null);
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
                const distance = cssMoveVars(this.effect, sourceRect, targetRect);
                effect.spell.activateHTML(this.effect, distance * 0.8);
                player.apSpellAttack(this.cost);
                player.setSlotStates();
                player.setSlotStatesAll(false);
                setTimeout(() => {
                    player.setSlotStatesAll(true);
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
                let dmg = this.damage;
                for (let i = 0; i < targets.length; i++) {
                    const target = targets[i];
                    if (target.type == "enemy" || target.type == "player") {
                        effect.simple.createHTML(target, "explosion", 700);
                        const statusEffect = effect.timed.createHTML(target.object, "burning", 1600);
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
            icon: `<div class="spell-icon" style="background-position: -500% -200%;">`,
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
            increaseRate: 3,
            startIncrease: 4,
            spellGem: null,
            activate(source) {
                if (this.fired) {
                    return false;
                }
                this.source = source;
                this.effect = effect.spell.createHTML(this.source, "self", this.id, "ring");
                this.effect.style.transform = `scale(3)`;
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
                player.setSlotStatesAll(false);
                setTimeout(() => {
                    player.setSlotStatesAll(true);
                    this.deactivate();
                    player.setPrimaryWeapon();
                    if (player.actionPoints == 0 && enemiesInZone > 0) {
                        nextTurn();
                    }
                }, effect.spell.duration);
                let dmgDuration = 0;
                const iterations = 5;
                for (let i = 0; i < iterations; i++) {
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
                    dmgDuration += effect.spell.duration / iterations;
                }
            },
            hit(targets) {
                for (let i = 0; i < targets.length; i++) {
                    const target = targets[i];
                    if (target.type == "enemy") {
                        const dmg = roundDecimal(this.damage / 5, 2);
                        effect.simple.createHTML(target, "explosion", 700);
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
            icon: `<div class="spell-icon" style="background-position: -200% -100%;">`,
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
            increaseRate: 1,
            startIncrease: 6,
            spellGem: null,
            playerAttach: true,
            manualDeactivate: true,
            baseTurnLength: 3,
            activate(source) {
                if (this.fired) {
                    return false;
                }
                this.source = source;
                this.effect = effect.spell.createHTML(this.source, "pulse", this.id, null, this.baseTurnLength);
                return true;
            },
            deactivate() {
                if (this.source == null || this.effect == null || this.fired) {
                    return;
                }
                effect.spell.removeInstantHTML(this.source.element, this.effect);
                this.source = null;
                this.effect = null;
                this.fired = false;
                player.resetMagicArmor();
            },
            selfDeactivate() {
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
                    this.selfDeactivate();
                }
            },
        },
        teleport: {
            id: "teleport",
            name: "Teleport",
            type: "offense",
            description: "Teleport to any tile in the battle area",
            icon: `<div class="spell-icon" style="background-position: -300% -100%;">`,
            cost: 7,
            baseCost: 7,
            damage: 0,
            baseDamage: 0,
            armor: 0,
            baseArmor: 0,
            cooldown: 9,
            baseCooldown: 9,
            ranged: true,
            source: null,
            fired: false,
            increaseRate: 7,
            startIncrease: 3,
            spellGem: null,
            canTargetEmpty: true,
            activate(source) {
                if (this.fired) {
                    return false;
                }
                this.source = source;
                this.effect = effect.spell.createHTML(this.source, "ranged", this.id, null);
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
                if (this.source == null || (target.type != "empty" && target.type != "item")) {
                    return;
                }
                this.fired = true;
                playerIsMoving = true;
                const sourceRect = this.source.element.getBoundingClientRect();
                const targetRect = target.element.getBoundingClientRect();
                const x = targetRect.left - sourceRect.left;
                const y = targetRect.top - sourceRect.top;
                const distance = Math.sqrt(x * x + y * y);
                this.effect.style.cssText += `--spell-x:${x}px;--spell-y:${y}px;`;
                effect.spell.activateHTML(this.effect, distance * 0.8);
                player.apSpellAttack(this.cost);
                player.setSlotStates();
                player.setSlotStatesAll(false);
                setTimeout(() => {
                    effect.simple.createHTML(this.source, "explosion", 700);
                    this.deactivate();
                    player.setPrimaryWeapon();
                }, effect.spell.duration);
                setTimeout(() => {
                    this.hit([target]);
                    player.opacity = 0;
                    if (player.actionPoints == 0 && enemiesInZone > 0) {
                        nextTurn();
                    }
                }, effect.spell.duration / 10 * 9);
            },
            hit(targets) {
                const target = targets[0];
                setTimeout(() => {
                    effect.simple.createHTML(target, "burst", 900);
                    setTimeout(() => {
                        player.opacity = 1;
                        if (target.type == "item") {
                            effect.flash.createHTML(target);
                            player.collect(target.object);
                            target.removeObject(target.object.element);
                        }
                        effect.simple.createHTML(target, "explosion", 700);
                        playerToTile(target);
                        playerIsMoving = false;
                        player.setSlotStatesAll(true);
                    }, 700);
                }, 200);
            },
        },
    }

    let enemySpell = {
        fireball: {
            id: "fireball",
            name: "Fireball",
            type: "offense",
            description: "Ranged ball of fire with high damage",
            icon: `<div class="spell-icon" style="background-position: -600% 0;">`,
            ranged: true,
            deactivate() {
                if (this.source == null || this.effect == null) {
                    return;
                }
                effect.spell.removeInstantHTML(this.source.element, this.effect);
                this.source = null;
                this.effect = null;
            },
            fire(source, target, damage, onHit) {
                this.source = source;
                this.target = target;
                this.damage = roundDecimal(damage, 2);
                this.effect = effect.spell.createHTML(this.source, "ranged", this.id, null);
                const sourceRect = this.source.element.getBoundingClientRect();
                const targetRect = target.element.getBoundingClientRect();
                const distance = cssMoveVars(this.effect, sourceRect, targetRect);
                effect.spell.activateHTML(this.effect, distance * 0.8);
                setTimeout(() => {
                    this.deactivate();
                }, effect.spell.duration);
                setTimeout(() => {
                    this.hit(target);
                    onHit(this);
                }, effect.spell.duration / 10 * 9);
            },
            hit() {
                effect.simple.createHTML(this.target, "explosion", 700);
                const statusEffect = effect.timed.createHTML(this.target.object, "burning", 1600);
                this.target.object.takeDamage(this.damage);
                this.target.object.damageOverTime(this.damage / 4, 3, statusEffect);
            },
        },
    }

    let collectables = {
        coins: {
            name: "Coin",
            type: "coin",
            spriteCoordinates: { x: 3, y: 3 },
            includeInStartZone: true,
            minValue: 1,
            maxValue: 1,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: false,
            spawnPropability: 100,
            spawnPerZone: 4.2,
            merchantCountMin: 0,
            merchantCountMax: 0,
            price: 0,
            collectSFX: "./audio/sfx/CHAIN_Drop_03_mono.ogg",
            useSFX: "./audio/sfx/CHAIN_Drop_03_mono.ogg",
            attack: null,
            onCollect(item) {
                itemCollectAnimation(item, ui.coins.icon, function() {
                    player.addCoins(item.amount);
                });
            },
            onUse(item, inventory) {
                if (inventory.owner === "chest") {
                    item.onCollect(true);
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
            merchantCountMin: 5,
            merchantCountMax: 10,
            price: 40,
            collectSFX: "./audio/sfx/EAT_Swallow_mono.ogg",
            useSFX: "./audio/sfx/EAT_Swallow_mono.ogg",
            attack: null,
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.inventory.addItem(item);
                });
            },
            onUse(item, inventory) {
                if (inventory.owner === "player") {
                    if (merchantObj.playerActive) {
                        player.addCoins(merchantObj.itemPrice(item, true));
                        merchantObj.inventory.addItem(item);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    } else {
                        if (player.health.value < player.health.maxValue) {
                            player.addLife(item.amount);
                            if (!player.inventory.removeItem(item)) {
                                createInventoryItemsUI(player.inventory);
                            }
                        }
                    }
                }
                if (inventory.owner === "chest") {
                    item.onCollect(true);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
                if (inventory.owner === "merchant") {
                    const itemPrice = merchantObj.itemPrice(item, true);
                    if (player.hasCoins(itemPrice)) {
                        item.onCollect(true);
                        player.removeCoins(itemPrice);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
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
            merchantCountMin: 0,
            merchantCountMax: 0,
            price: 2960,
            collectSFX: "./audio/sfx/LOCK_Metal_Padlock_Unlock_Pop_01_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.addKey(item);
                });
            },
            onUse(item, inventory) {
                if (inventory.owner === "chest") {
                    item.onCollect(true);
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
            merchantCountMin: 1,
            merchantCountMax: 4,
            price: 200,
            collectSFX: "./audio/sfx/LOCK_Metal_Padlock_Unlock_Pop_01_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.addRedGem(item);
                });
            },
            onUse(item, inventory) {
                if (inventory.owner === "merchant") {
                    const itemPrice = merchantObj.itemPrice(item, true);
                    if (player.hasCoins(itemPrice)) {
                        item.onCollect(true);
                        player.removeCoins(itemPrice);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    }
                } else if (inventory.owner === "chest") {
                    item.onCollect(true);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                } else {
                    if (merchantObj.playerActive) {
                        player.addCoins(merchantObj.itemPrice(item, true));
                        merchantObj.inventory.addItem(item);
                        if (player.removeRedGem()) {
                            createInventoryItemsUI(inventory);
                        }
                    } else {
                        hideInventory();
                        gemCraftingShow();
                    }
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
            merchantCountMin: 0,
            merchantCountMax: 2,
            price: 320,
            collectSFX: "./audio/sfx/LOCK_Metal_Padlock_Unlock_Pop_01_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.addBlueGem(item);
                });
            },
            onUse(item, inventory) {
                if (inventory.owner === "merchant") {
                    const itemPrice = merchantObj.itemPrice(item, true);
                    if (player.hasCoins(itemPrice)) {
                        item.onCollect(true);
                        player.removeCoins(itemPrice);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    }
                } else if (inventory.owner === "chest") {
                    item.onCollect(true);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                } else {
                    if (merchantObj.playerActive) {
                        player.addCoins(merchantObj.itemPrice(item, true));
                        merchantObj.inventory.addItem(item);
                        if (player.removeBlueGem()) {
                            createInventoryItemsUI(inventory);
                        }
                    } else {
                        hideInventory();
                        gemCraftingShow();
                    }
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
            merchantCountMin: 0,
            merchantCountMax: 2,
            price: 280,
            collectSFX: "./audio/sfx/LOCK_Metal_Padlock_Unlock_Pop_01_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.addGreenGem(item);
                });
            },
            onUse(item, inventory) {
                if (inventory.owner === "merchant") {
                    const itemPrice = merchantObj.itemPrice(item, true);
                    if (player.hasCoins(itemPrice)) {
                        item.onCollect(true);
                        player.removeCoins(itemPrice);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    }
                } else if (inventory.owner === "chest") {
                    item.onCollect(true);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                } else {
                    if (merchantObj.playerActive) {
                        player.addCoins(merchantObj.itemPrice(item, true));
                        merchantObj.inventory.addItem(item);
                        if (player.removeGreenGem()) {
                            createInventoryItemsUI(inventory);
                        }
                    } else {
                        hideInventory();
                        gemCraftingShow();
                    }
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
            merchantCountMin: 1,
            merchantCountMax: 1,
            price: 80,
            collectSFX: "./audio/sfx/BOW_Release_Arrow_mono.ogg",
            useSFX: null,
            attack: new WeaponSlot("Power", 2, 8, "Stab", 1, 3, attackElements),
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.inventory.addItem(item);
                });
            },
            onUse(item, inventory) {
                if (inventory.owner === "player") {
                    if (merchantObj.playerActive) {
                        player.addCoins(merchantObj.itemPrice(item, true));
                        merchantObj.inventory.addItem(item);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    } else {
                        player.setWeaponItem(item);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    }
                }
                if (inventory.owner === "chest") {
                    item.onCollect(true);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
                if (inventory.owner === "merchant") {
                    const itemPrice = merchantObj.itemPrice(item, true);
                    if (player.hasCoins(itemPrice)) {
                        item.onCollect(true);
                        player.removeCoins(itemPrice);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
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
            merchantCountMin: 0,
            merchantCountMax: 1,
            price: 380,
            attack: new WeaponSlot("Power", 2, 14, "Stab", 1, 6, attackElements),
            collectSFX: "./audio/sfx/FRICTION_Metal_Bars_05_mono.ogg",
            useSFX: null,
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.inventory.addItem(item);
                });
            },
            onUse(item, inventory) {
                if (inventory.owner === "player") {
                    if (merchantObj.playerActive) {
                        player.addCoins(merchantObj.itemPrice(item, true));
                        merchantObj.inventory.addItem(item);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    } else {
                        player.setWeaponItem(item);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    }
                }
                if (inventory.owner === "chest") {
                    item.onCollect(true);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
                if (inventory.owner === "merchant") {
                    const itemPrice = merchantObj.itemPrice(item, true);
                    if (player.hasCoins(itemPrice)) {
                        item.onCollect(true);
                        player.removeCoins(itemPrice);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
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
            merchantCountMin: 0,
            merchantCountMax: 1,
            price: 810,
            collectSFX: "./audio/sfx/FRICTION_Metal_Bars_02_mono.ogg",
            useSFX: null,
            attack: new WeaponSlot("Power", 3, 24, "Dash", 2, 13, attackElements),
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.inventory.addItem(item);
                });
            },
            onUse(item, inventory) {
                if (inventory.owner === "player") {
                    if (merchantObj.playerActive) {
                        player.addCoins(merchantObj.itemPrice(item, true));
                        merchantObj.inventory.addItem(item);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    } else {
                        player.setWeaponItem(item);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    }
                }
                if (inventory.owner === "chest") {
                    item.onCollect(true);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
                if (inventory.owner === "merchant") {
                    const itemPrice = merchantObj.itemPrice(item, true);
                    if (player.hasCoins(itemPrice)) {
                        item.onCollect(true);
                        player.removeCoins(itemPrice);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
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
            merchantCountMin: 0,
            merchantCountMax: 1,
            price: 480,
            collectSFX: "./audio/sfx/TOOL_Toolbox_Close_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.inventory.addItem(item);
                });
            },
            onUse(item, inventory) {
                if (inventory.owner === "player") {
                    if (merchantObj.playerActive) {
                        player.addCoins(merchantObj.itemPrice(item, true));
                        merchantObj.inventory.addItem(item);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    } else {
                        player.setArmor(item);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    }
                }
                if (inventory.owner === "chest") {
                    item.onCollect(true);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
                if (inventory.owner === "merchant") {
                    const itemPrice = merchantObj.itemPrice(item, true);
                    if (player.hasCoins(itemPrice)) {
                        item.onCollect(true);
                        player.removeCoins(itemPrice);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
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
            merchantCountMin: 0,
            merchantCountMax: 1,
            price: 970,
            collectSFX: "./audio/sfx/TOOL_Toolbox_Close_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.inventory.addItem(item);
                });
            },
            onUse(item, inventory) {
                if (inventory.owner === "player") {
                    if (merchantObj.playerActive) {
                        player.addCoins(merchantObj.itemPrice(item, true));
                        merchantObj.inventory.addItem(item);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    } else {
                        player.setArmor(item);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    }
                }
                if (inventory.owner === "chest") {
                    item.onCollect(true);
                    if (!inventory.removeItem(item)) {
                        createInventoryItemsUI(inventory);
                    }
                }
                if (inventory.owner === "merchant") {
                    const itemPrice = merchantObj.itemPrice(item, true);
                    if (player.hasCoins(itemPrice)) {
                        item.onCollect(true);
                        player.removeCoins(itemPrice);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    }
                }
            }
        },
        pouch: {
            name: "Pouch",
            type: "container",
            spriteCoordinates: { x: 6, y: 4 },
            includeInStartZone: false,
            minValue: 1,
            maxValue: 1,
            stackable: false,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 5,
            spawnPerZone: 0.05,
            merchantCountMin: 0,
            merchantCountMax: 0,
            price: 100,
            collectSFX: "./audio/sfx/TOOL_Toolbox_Close_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.inventory.addItem(item);
                });
            },
            onUse(item, inventory) {
                if (!item.isQuestItem) {
                    if (inventory.owner === "player") {
                        if (merchantObj.playerActive) {
                            player.addCoins(merchantObj.itemPrice(item, true));
                            merchantObj.inventory.addItem(item);
                            if (!inventory.removeItem(item)) {
                                createInventoryItemsUI(inventory);
                            }
                        } else {
                            if (!inventory.removeItem(item)) {
                                createInventoryItemsUI(inventory);
                            }
                            const rnd = randomInteger(8, 20);
                            let delay = 20;
                            for (let i = 0; i < rnd; i++) {
                                setTimeout(() => {
                                    createRandomItem(true).onCollect(i == rnd - 1);
                                }, delay);
                                delay += randomInteger(50, 100);
                            }
                            hideInventory();
                        }
                    }
                    if (inventory.owner === "chest") {
                        item.onCollect(true);
                        if (!inventory.removeItem(item)) {
                            createInventoryItemsUI(inventory);
                        }
                    }
                    if (inventory.owner === "merchant") {
                        const itemPrice = merchantObj.itemPrice(item, true);
                        if (player.hasCoins(itemPrice)) {
                            item.onCollect(true);
                            player.removeCoins(itemPrice);
                            if (!inventory.removeItem(item)) {
                                createInventoryItemsUI(inventory);
                            }
                        }
                    }
                }
            }
        },
        wood: {
            name: "Wood",
            type: "resource",
            spriteCoordinates: { x: 6, y: 5 },
            includeInStartZone: false,
            minValue: 1,
            maxValue: 1,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 0,
            spawnPerZone: 0,
            merchantCountMin: 0,
            merchantCountMax: 0,
            price: 2,
            collectSFX: "./audio/sfx/TOOL_Toolbox_Close_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.inventory.addItem(item);
                });
            },
            onUse(item, inventory) {

            }
        },
        stone: {
            name: "Stone",
            type: "resource",
            spriteCoordinates: { x: 6, y: 6 },
            includeInStartZone: false,
            minValue: 1,
            maxValue: 1,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 0,
            spawnPerZone: 0,
            merchantCountMin: 0,
            merchantCountMax: 0,
            price: 2,
            collectSFX: "./audio/sfx/TOOL_Toolbox_Close_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.inventory.addItem(item);
                });
            },
            onUse(item, inventory) {

            }
        },
        iron: {
            name: "Iron",
            type: "resource",
            spriteCoordinates: { x: 0, y: 7 },
            includeInStartZone: false,
            minValue: 1,
            maxValue: 1,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 0,
            spawnPerZone: 0,
            merchantCountMin: 0,
            merchantCountMax: 0,
            price: 2,
            collectSFX: "./audio/sfx/TOOL_Toolbox_Close_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.inventory.addItem(item);
                });
            },
            onUse(item, inventory) {

            }
        },
        gold: {
            name: "Gold",
            type: "resource",
            spriteCoordinates: { x: 1, y: 7 },
            includeInStartZone: false,
            minValue: 1,
            maxValue: 1,
            stackable: true,
            equipable: false,
            apMoveCost: 0,
            inventoryItem: true,
            spawnPropability: 0,
            spawnPerZone: 0,
            merchantCountMin: 0,
            merchantCountMax: 0,
            price: 2,
            collectSFX: "./audio/sfx/TOOL_Toolbox_Close_mono.ogg",
            useSFX: null,
            attack: null,
            onCollect(item) {
                itemCollectAnimation(item, openBackpack, function() {
                    player.inventory.addItem(item);
                });
            },
            onUse(item, inventory) {

            }
        },
    }

    let music = {
        current: null,
        menu: new Music("./audio/fantasy_title.ogg", START_VOLUME),
        calm: new Music("./audio/medieval_market_LOOP.ogg", START_VOLUME),
        combat: new Music("./audio/enemy_territory_LOOP.ogg", START_VOLUME),
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

    let quest = {
        initialize() {
            for (let chainIndex = 0; chainIndex < this.chains.length; chainIndex++) {
                for (let i = 0; i < this.chains[chainIndex].details.length; i++) {
                    const detail = this.chains[chainIndex].details[i];
                    detail.id = questID;
                    detail.orderID = i;
                    detail.chainID = chainID;
                    questID++;
                }
                chainID++;
            }
        },
        managers() {
            let managers = [];
            for (let chainIndex = 0; chainIndex < this.chains.length; chainIndex++) {
                for (let i = 0; i < this.chains[chainIndex].details.length; i++) {
                    const detail = this.chains[chainIndex].details[i];
                    const quest = new Quest(
                        detail.id,
                        detail.orderID,
                        detail.chainID,
                        questUI,
                        new QuestObjective(
                            detail,
                            detail.type,
                            this.createDialogues(detail)),
                        i == 0 ? null : detail.id - 1);
                    let manager = null;
                    for (let managerIndex = 0; managerIndex < managers.length; managerIndex++) {
                        const mngr = managers[managerIndex].manager;
                        if (mngr.id == detail.managerID) {
                            mngr.addQuest(quest);
                            manager = mngr;
                            break;
                        }
                    }
                    if (manager == null) {
                        manager = new QuestManager(detail.managerID, detail.chainID);
                        manager.addQuest(quest);
                        managers.push({
                            manager,
                            name: detail.name,
                            title: detail.title,
                            spritePos: detail.spritePos,
                            world: detail.world,
                            zoneID: detail.zoneID,
                        });
                    }
                }
            }
            return managers;
        },
        createDialogues(detail) {
            return {
                begin: new QuestDialog(detail.title, detail.spritePos, detail.dialog.begin),
                pending: new QuestDialog(detail.title, detail.spritePos, detail.dialog.pending),
            }
        },
        chains: [{
                details: [{
                        name: "Linda",
                        title: "Package delivery",
                        spritePos: 2,
                        managerID: "package-delivery-0",
                        world: worlds.outdoor,
                        zoneID: "0_0",
                        type: "delivery",
                        dialog: {
                            begin: [
                                "Hi, stranger. Could you please help me with something?",
                                "I need this package delivered at the Pink Merchant...",
                                "If you deliver this for me, I will reward you with nice things..."
                            ],
                            pending: [
                                "Have you made the delivery yet?",
                            ]
                        },
                        getQuestItem() {
                            return "pouch";
                        },
                        onBegin() {
                            console.log("Begin quest");
                        },
                        onEnd() {
                            console.log("End 0");
                        },
                    },
                    {
                        name: "Pink Merchant",
                        title: "Package delivery - Return",
                        spritePos: 5,
                        managerID: "package-delivery-1",
                        world: worlds.outdoor,
                        zoneID: "1_2",
                        type: "",
                        dialog: {
                            begin: [
                                "Is this... Is this the package I've been looking for?",
                                "It is indeed...!",
                                "I've been looking for this, like a crazy person! Thank you so much, for bringing it to me.",
                            ],
                            pending: [
                                "Go back and get your reward!",
                            ]
                        },
                        onBegin() {
                            console.log("Begin 1");
                        },
                        onEnd() {
                            console.log("End 1");
                        },
                    },
                    {
                        name: "Linda",
                        title: "Get reward",
                        spritePos: 2,
                        managerID: "package-delivery-0",
                        world: worlds.outdoor,
                        zoneID: "0_0",
                        type: "reward",
                        dialog: {
                            begin: [
                                "I can't imagine what the Pink Merchant would do without the package!",
                                "Here is something for your trouble...",
                            ],
                            pending: []
                        },
                        onBegin() {
                            console.log("Begin 2");
                        },
                        onEnd() {
                            console.log("End quest");
                        },
                        getReward() {
                            return [{ type: "coins", amount: 3 }, { type: "potions", amount: 2 }, { type: "redGems", amount: 2 }, { type: "blueGems", amount: 1 }];
                        },
                        questChainEnd() {
                            return this.chainID;
                        }
                    },
                ],
            },
            {
                details: [{
                        name: "Genevive",
                        title: "Annoying little beasts",
                        spritePos: 3,
                        managerID: "little-beasts-0",
                        world: worlds.outdoor,
                        zoneID: "1_-2",
                        type: "world",
                        counter: 2,
                        countType: "Goblin",
                        dialog: {
                            begin: [
                                "Oh, Goblin's! I hate those annoying little beasts?",
                                "Could you perhaps kill 2 of those for me?",
                            ],
                            pending: [
                                "Have you killed them yet?",
                            ]
                        },
                        onBegin() {
                            console.log("Begin quest");
                        },
                        countUp(objective, type) {
                            if (!this.counter || !this.countType) {
                                return false;
                            }
                            if (type != this.countType || objective.state == "complete") {
                                return false;
                            }
                            this.counter--;
                            if (this.counter <= 0) {
                                objective.setComplete();
                                return true;
                            }
                            return false;
                        },
                        onEnd() {
                            console.log("End 0");
                        },
                    },
                    {
                        name: "Genevive",
                        title: "Get reward",
                        spritePos: 3,
                        managerID: "little-beasts-0",
                        world: worlds.outdoor,
                        zoneID: "1_-2",
                        type: "reward",
                        dialog: {
                            begin: [
                                "You are the man!",
                                "Here is something for your trouble...",
                            ],
                            pending: []
                        },
                        onBegin() {
                            console.log("Begin 2");
                        },
                        onEnd() {
                            console.log("End quest");
                        },
                        getReward() {
                            return [{ type: "ironSword", amount: 1 }];
                        },
                        questChainEnd() {
                            return this.chainID;
                        }
                    },
                ],
            },
        ],
    }

    //#endregion OBJECTS

    //#region EVENT LISTENERS
    welcomeScreen.addEventListener("click", function() {
        this.classList.add("js-hidden");
        startFormName.focus();
        optionsFormMusic.value = START_VOLUME * 100;
        optionsFormSfx.value = START_VOLUME * 100;
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
        let delay = 100;
        for (let i = 0; i < invBtns.length; i++) {
            const btn = invBtns[i];
            let hasItemAmount = btn.inventory.onCollect(btn.content.item);
            delay += randomInteger(50, 100);
            setTimeout(() => {
                while (hasItemAmount) {
                    hasItemAmount = btn.inventory.onCollect(btn.content.item);
                }
            }, delay);
        }
        hideInventory(true);
    });
    gemCrafting.addEventListener("click", gemCraftingHide);
    gemCraftingWindow.addEventListener("click", function(evt) {
        evt.stopPropagation();
    });
    questOverview.addEventListener("click", function() {
        hideQuestOverview();
    });
    openQuest.addEventListener("click", function() {
        if (playersTurn && !player.inBattle) {
            showQuestOverview();
        }
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
    inventoryPlayerMerchantToggle.addEventListener("click", function() {
        if (merchantObj.inventory == null) {
            merchantObj.activate(openedInventory);
        }
        if (merchantObj.active) {
            merchantObj.active = false;
            merchantObj.playerActive = true;
            this.textContent = "Show Merchant inventory";
            this.classList.add("players-inventory");
            showInventory(player.inventory);
        } else {
            merchantObj.active = true;
            merchantObj.playerActive = false;
            this.textContent = "Show Player inventory";
            this.classList.remove("players-inventory");
            showInventory(merchantObj.inventory);
        }
    });

    for (let i = 0; i < zoneTransitions.length; i++) {
        const zoneTransition = zoneTransitions[i];
        let obj;
        const directions = ["up", "down", "left", "right"];
        zoneTransition.addEventListener("click", function() {
            if (playerIsMoving) {
                return;
            }
            playerAI(currentZone.getTileObj(obj.id), function() {
                changeZone(obj.x, obj.y, obj.tileIndex);
            });
        });
        zoneTransition.addEventListener("mouseenter", function() {
            if (playerIsMoving) {
                return;
            }
            for (let i = 0; i < directions.length; i++) {
                const direction = directions[i];
                if (this.classList.contains(direction)) {
                    obj = zoneTransitionObj(direction);
                    visualizePath(obj.id);
                    return;
                }
            }
        });
    }

    function zoneTransitionObj(direction) {
        let coordinate = currentZone.getTileObj(player.tileId).coordinates();
        let obj = { id: "", x: 0, y: 0, tileIndex: null, direction: direction }
        if (direction == "up") {
            coordinate.y = 0;
            obj.id = coordinate.x + "_" + coordinate.y;
            obj.x = 0;
            obj.y = 1;
            obj.tileIndex = currentZone.tiles.length - region.zoneSize + coordinate.x;
        }
        if (direction == "down") {
            coordinate.y = currentWorld.zoneSize - 1;
            obj.id = coordinate.x + "_" + coordinate.y;
            obj.x = 0;
            obj.y = -1;
            obj.tileIndex = coordinate.x;
        }
        if (direction == "left") {
            coordinate.x = 0;
            obj.id = coordinate.x + "_" + coordinate.y;
            obj.x = -1;
            obj.y = 0;
            obj.tileIndex = coordinate.y * region.zoneSize + region.zoneSize - 1;
        }
        if (direction == "right") {
            coordinate.x = currentWorld.zoneSize - 1;
            obj.id = coordinate.x + "_" + coordinate.y;
            obj.x = 1;
            obj.y = 0;
            obj.tileIndex = coordinate.y * region.zoneSize;
        }
        return obj;
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
            inventoryPlayerMerchantToggle.style.display = "none";
        } else {
            playerInventory.classList.remove("two-inventories");
            secondaryInventory.classList.add("js-hidden");
            inventoryTakeAll.style.display = "none";
            if (openedInventory.owner === "merchant") {
                inventoryPlayerMerchantToggle.style.display = "unset";
            } else if (!merchantObj.playerActive) {
                inventoryPlayerMerchantToggle.style.display = "none";
            }
        }
        createInventoryItemsUI(openedInventory);
    }

    function hideInventory(destroy = false) {
        inventoryActive = false;
        if (!openedInventory) {
            return;
        }
        if (destroy && openedInventory.owner == "chest" && openedInventory.tile) {
            destroyChest(openedInventory.tile);
        }
        openedInventory = null;
        playerInventory.classList.add("js-hidden");
        inventoryPlayerMerchantToggle.textContent = "Show Player inventory";
        inventoryPlayerMerchantToggle.classList.remove("players-inventory");
        merchantObj.deactivate();
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
        if (inventory.owner == "merchant" || (inventory.owner == "player" && merchantObj.playerActive)) {
            invPrice.style.display = "flex";
        } else {
            invPrice.style.display = "none";
        }
        let questButtons = [];
        for (let i = 0; i < inventory.contents.length; i++) {
            const content = inventory.contents[i];
            const btn = inventoryItemButton(inventory, content);
            if (btn.classList.contains("quest-item")) {
                questButtons.push(btn);
            } else {
                inventoryGrid.append(btn);
            }
        }
        if (questButtons.length > 0) {
            for (let i = 0; i < questButtons.length; i++) {
                const questButton = questButtons[i];
                inventoryGrid.append(questButton);
            }
        }
        buttonsUpdate();
        if (inventory.contents.length > 0) {
            setInventoryHoverInfo(inventory.contents[0].item);
        }
    }

    function inventoryItemButton(inventory, content) {
        const x = content.item.posX / 100 * 64;
        const y = content.item.posY / 100 * 64;
        const button = document.createElement("BUTTON");
        button.classList.add("inventory__item");
        if (content.item.isQuestItem) {
            button.classList.add("quest-item");
        }
        button.setAttribute("aria-label", "Inventory item");
        button.style.backgroundPosition = `-${x}px -${y}px`;
        buttonInnerContent(button, inventory, content);

        button.addEventListener("click", function() {
            clickInventoryButton(this, inventory, content);
        });
        button.addEventListener("mouseenter", function() {
            const rows = setInventoryHoverInfo(content.item);
            invPriceText.textContent = content.item.price;
            invInfo.content.innerHTML = rows;
        });

        invBtns.push({ element: button, inventory: inventory, content: content });
        return button;
    }

    function buttonsUpdate() {
        if (invBtns.length == 0) {
            return;
        }
        if (invBtns[0].inventory.owner == "merchant") {
            for (let i = 0; i < invBtns.length; i++) {
                const invBtn = invBtns[i];
                let itemPrice = merchantObj.itemPrice(invBtn.content.item, false);
                if (player.hasCoins(itemPrice)) {
                    invBtn.element.classList.remove("too-expensive");
                } else {
                    invBtn.element.classList.add("too-expensive");
                }
            }
        }
    }

    function clickInventoryButton(button, inventory, content) {
        inventory.onUse(content.item);
        buttonInnerContent(button, inventory, content);
    }

    function buttonInnerContent(button, inventory, content) {
        let innerButtonContent = "";
        if (content.item.stackable) {
            innerButtonContent += `<span class="inventory__amount">${content.count}</span>`;
        }
        if (inventory.owner == "merchant") {
            let itemPrice = merchantObj.itemPrice(content.item, false);
            innerButtonContent += `<span class="inventory__price">${itemPrice}</span>`;
        }
        if (inventory.owner == "player" && merchantObj.playerActive) {
            let itemPrice = merchantObj.itemPrice(content.item, true);
            innerButtonContent += `<span class="inventory__price">${itemPrice}</span>`;
        }
        if (innerButtonContent != "") {
            button.innerHTML = innerButtonContent;
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
        return rows;
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

    //#region QUEST overview
    function toggleQuestOverview() {
        if (questOverviewActive) {
            hideQuestOverview();
        } else {
            showQuestOverview();
        }
    }

    function showQuestOverview() {
        questOverviewActive = true;
        questOverview.classList.remove("js-hidden");
    }

    function hideQuestOverview() {
        questOverviewActive = false;
        questOverview.classList.add("js-hidden");
    }
    //#endregion QUEST overview

    //#region GEM CRAFTING
    gemCraftingCreateRows();

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
    let gemTimerCounter = 0;
    let gemTimerFactor = 1;
    const gemTimerDuration = 25;
    const gemTimeoutDuration = 250;

    function startAddRedGemTimer() {
        gemTimerActive = true;
        addRedGem();
        gemTimeout = setTimeout(() => {
            gemTimer = setInterval(() => {
                for (let i = 0; i < gemTimerFactor; i++) {
                    addRedGem();
                    gemTimerFactorIncrease();
                }
            }, gemTimerDuration);
        }, gemTimeoutDuration);
    }

    function startRemoveRedGemTimer() {
        gemTimerActive = true;
        removeRedGem();
        gemTimeout = setTimeout(() => {
            gemTimer = setInterval(() => {
                for (let i = 0; i < gemTimerFactor; i++) {
                    removeRedGem();
                    gemTimerFactorIncrease();
                }
            }, gemTimerDuration);
        }, gemTimeoutDuration);
    }

    function startAddBlueGemTimer() {
        gemTimerActive = true;
        addBlueGem();
        gemTimeout = setTimeout(() => {
            gemTimer = setInterval(() => {
                for (let i = 0; i < gemTimerFactor; i++) {
                    addBlueGem();
                    gemTimerFactorIncrease();
                }
            }, gemTimerDuration);
        }, gemTimeoutDuration);
    }

    function startRemoveBlueGemTimer() {
        gemTimerActive = true;
        removeBlueGem();
        gemTimeout = setTimeout(() => {
            gemTimer = setInterval(() => {
                for (let i = 0; i < gemTimerFactor; i++) {
                    removeBlueGem();
                    gemTimerFactorIncrease();
                }
            }, gemTimerDuration);
        }, gemTimeoutDuration);
    }

    function startAddGreenGemTimer() {
        gemTimerActive = true;
        addGreenGem();
        gemTimeout = setTimeout(() => {
            gemTimer = setInterval(() => {
                for (let i = 0; i < gemTimerFactor; i++) {
                    addGreenGem();
                    gemTimerFactorIncrease();
                }
            }, gemTimerDuration);
        }, gemTimeoutDuration);
    }

    function startRemoveGreenGemTimer() {
        gemTimerActive = true;
        removeGreenGem();
        gemTimeout = setTimeout(() => {
            gemTimer = setInterval(() => {
                for (let i = 0; i < gemTimerFactor; i++) {
                    removeGreenGem();
                    gemTimerFactorIncrease();
                }
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
        gemTimerCounter = 0;
        gemTimerFactor = 1;
    }

    function gemTimerFactorIncrease() {
        gemTimerCounter++;
        if (gemTimerCounter % 25 == 0) {
            gemTimerFactor++;
        }
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
        gemCraftingUpdate();
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
        player.addRedGem(createItem(collectables.redGems));
        gemCraftingUpdate();
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
        gemCraftingUpdate();
    }

    function removeBlueGem() {
        if (!gemCraftingSpellSelected.spellGem.removeBlue()) {
            return;
        }
        gemCraftingSpellSelected.spellGem.unlockBlue();
        gemCraftingSpellSelected.cost = gemCraftingSpellSelected.baseCost - gemCraftingSpellSelected.spellGem.blueValue;
        player.addBlueGem(createItem(collectables.blueGems));
        gemCraftingUpdate();
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
        gemCraftingUpdate();
    }

    function removeGreenGem() {
        if (!gemCraftingSpellSelected.spellGem.removeGreen()) {
            return;
        }
        gemCraftingSpellSelected.spellGem.unlockGreen();
        gemCraftingSpellSelected.cooldown = gemCraftingSpellSelected.baseCooldown - gemCraftingSpellSelected.spellGem.greenValue;
        player.addGreenGem(createItem(collectables.greenGems));
        gemCraftingUpdate();
    }

    function gemCraftingUpdate() {
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
        player.setSlotStates();
    }

    function gemCraftingSpellSetup(gem) {
        for (let i = 0; i < Object.keys(spell).length; i++) {
            const key = Object.keys(spell)[i];
            spell[key].spellGem = new SpellGem(gem, spell[key].increaseRate, spell[key].startIncrease);
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

        gemCraftingUpdate();
    }
    //#endregion GEM CRAFTING

    //#region GAME FUNCTIONS

    function newGame(playerName) {
        music.crossFade(music.calm);
        currentWorld = worlds.home;
        dayTime = new Daytime(TICKS_PER_SECOND, dayTimeControls.dayDuration, dayTimeControls.nightDuration, dayTimeControls.transitDuration, background, function(t) {
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
        const gameDayDuration = (dayTime.dayDuration + dayTime.nightDuration) * TICKS_PER_SECOND;
        const ticksPerGameMinute = gameDayDuration / 1440; // 24 * 60 = 1440 (game minutes per day)
        timeControls.ticksPerGameMinute = ticksPerGameMinute;
        region = new Region(currentWorld, background, zoneContainer, TILE_SIZE);
        miniMap = new MiniMap(region, miniMapContainer, miniMapZoom);
        playerName = playerName == "" ? "Player 1" : playerName;
        const hurtVoices = ["VOICE_Girl_4yo_Hurt_Long_01_mono.ogg", "VOICE_Girl_4yo_Hurt_Short_01_mono.ogg", "VOICE_Girl_4yo_Hurt_Short_04_mono.ogg", "VOICE_Girl_4yo_Hurt_Short_05_mono.ogg"];
        player = new Player(
            playerName,
            "player",
            playerAnimTime.move,
            playerAnimTime.attack,
            new Health(playerStats.health),
            new Attribute(playerStats.strength, false),
            new Attribute(playerStats.armor, false),
            ui,
            null,
            actions,
            playerAP,
            hurtVoices,
            new Inventory("player"),
            null,
            gameOver);
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
        if (CHEATS_ON && CHEAT_SPELL_DAMAGE > 0) {
            for (let i = 0; i < Object.keys(spell).length; i++) {
                const key = Object.keys(spell)[i];
                spell[key].cost = 1;
                spell[key].cooldown = 1;
                if (spell[key].damage == 0) {
                    spell[key].armor = CHEAT_SPELL_DAMAGE;
                } else {
                    spell[key].damage = CHEAT_SPELL_DAMAGE;
                }
            }
        }
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

        quest.initialize();

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
        if (CHEATS_ON) {
            player.addCoins(CHEAT_MONEY);
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
            region = new Region(world, background, zoneContainer, TILE_SIZE);
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
        worlds.updateQuestObjectives(currentWorld);

        if (!isNewMap) {
            return;
        }

        const safeZonePercentage = 5;
        let safeZoneCount = region.zones.length / 100 * safeZonePercentage;
        safeZoneCount = Math.ceil(safeZoneCount);

        region.setSafeZones(safeZoneCount);

        // placeMerchants();

        const chestPercentage = 50;
        let chestCount = region.zones.length / 100 * chestPercentage;
        // let chestCount = region.safeZones.length / 100 * chestPercentage;
        chestCount = Math.ceil(chestCount);
        placeChests(chestCount);

        if (region.enemyPercentage > 0) {
            placeEnemies(zoneEnemyCount(region.enemyPercentage));
        }

        const bossType = enemyBossType.fireElemental;
        if (currentWorld == worlds[bossType.world]) {
            const bossZone = region.getZone(bossType.zoneID);
            const bossTileObj = bossZone.getCenterTile();
            placeEnemyBoss(bossTileObj, bossType);
        }

        //QUEST MANAGERS
        const managers = quest.managers();
        for (let i = 0; i < managers.length; i++) {
            const managerObj = managers[i];
            if (managerObj.world == currentWorld && !managerObj.hasMerchant) {
                const zone = region.getZone(managerObj.zoneID);
                const tileObj = zone.getRandomTile(true);
                const merchant = createMerchant(managerObj.name, managerObj.spritePos);
                merchant.addManager(managerObj.manager);
                placeMerchant(zone, tileObj, merchant);
                managerObj.hasMerchant = true;
                const minimapTile = miniMap.getTile(zone.id);
                currentWorld.questObjectives.push({
                    merchant: merchant,
                    zoneID: zone.id,
                    tileObj: tileObj,
                    tooltip: new MiniTooltip(minimapTile, managerObj.name, managerObj.title),
                });
            }
        }
        worlds.updateQuestObjectives(currentWorld);


        //INSERT ENEMIES MANUALLY FOR TESTING PURPOSES
        if (CHEATS_ON && ENEMIES_AT_START > 0) {
            for (let i = 0; i < ENEMIES_AT_START; i++) {
                const zone = region.getZone("0_0");
                // const tileObj2 = zone.getTileObj("2_2");
                // placeEnemy(tileObj2, enemyType.dummy);
                const tileObj = zone.getRandomTile(true);
                placeEnemy(tileObj, enemyType.dummy);
            }
        }

        //INSERT COLLECTABLES MANUALLY FOR TESTING PURPOSES
        if (CHEATS_ON && CHEAT_COLLECTABLES && cheatCollectables.length > 0) {
            if (currentWorld == worlds.home) {
                for (let i = 0; i < cheatCollectables.length; i++) {
                    const collectableObj = cheatCollectables[i];
                    const collectable = collectables[cheatCollectables[i].key];
                    for (let amount = 0; amount < collectableObj.amount; amount++) {
                        const item = createItem(collectable);
                        if (collectableObj.inventory) {
                            player.inventory.addItem(item);
                        } else {
                            const tileObj = region.getZone("0_0").getRandomTile();
                            tileObj.placeObject(item, "item", true);
                        }
                    }
                }
            }
        }
        //INSERT KEY MANUALLY FOR TESTING PURPOSES
        if (CHEATS_ON && CHEAT_KEY) {
            const tileObj = region.getZone("0_0").getRandomTile();
            const key = new Item("cheat-key", collectables.keys);
            tileObj.placeObject(key, "item", true);
        }
        //INSERT WEAPON MANUALLY FOR TESTING PURPOSES
        if (CHEATS_ON && CHEAT_WEAPON) {
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
                            tileObj.setType(currentWorld.obstacles[rnd].type, "obstacle", true);
                            tileObj.addHealthObj(new Health(currentWorld.obstacles[rnd].health), currentWorld.obstacles[rnd].resource);
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
            tileObj.createHealthHTML();
            region.element.append(tileObjHTML);
            if (tileObj.object != null) {
                if (tileObj.type == "enemy") {
                    tileObj.placeHTML(tileObj.object.createHTML());
                    battleQueue.push(tileObj.object);
                    enemiesInZone++;
                }
                if (tileObj.type == "merchant") {
                    const merchant = tileObj.object;
                    tileObj.placeHTML(merchant.createHTML());
                    setQuestState(merchant);
                }
                if (tileObj.type == "chest") {
                    tileObj.placeHTML(tileObj.object.createHTML());
                }
                if (tileObj.type == "item") {
                    tileObj.placeHTML(tileObj.object.createHTML());
                }

            }
            tileObjHTML.addEventListener("click", function() {
                if (player.inBattle && !playersTurn) {
                    return;
                }
                if (player.currentTile == currentZone.getTileObj(this.id)) {
                    toggleMenu();
                    return;
                }
                moveAlongPath(this.id);
            });
            tileObjHTML.addEventListener("mouseenter", function() {
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

    function setQuestState(merchant) {
        merchant.setQuestState(getQuestState(merchant));
        worlds.updateQuestObjectives(currentWorld);
    }

    function getQuestState(merchant) {
        let isActive = false;
        if (merchant.isQuestManager) {
            if (merchant.questManager.depleted) {
                isActive = false;
            } else {
                let playerQuest = null;
                if (player.quests.length > 0) {
                    for (let i = 0; i < player.quests.length; i++) {
                        const qst = player.quests[i];
                        if (merchant.questManager.compareChainID(qst.chainID)) {
                            playerQuest = qst;
                            break;
                        }
                    }
                }
                if (playerQuest) {
                    isActive = !merchant.questManager.isPending(playerQuest);
                    if (!isActive && playerQuest.objective.type == "world") {
                        isActive = playerQuest.objective.state == "complete";
                    }
                } else {
                    const orderID = merchant.questManager.quests[0].orderID;
                    isActive = orderID == 0;
                }
            }
        }
        return isActive;
    }

    function moveAlongPath(tileId) {
        if (playerIsMoving || !playersTurn) {
            return;
        }
        let destinationTile = currentZone.getTileObj(tileId);
        if (player.activeSlot != null) {
            if (destinationTile.type == "enemy" || !player.spellIsRanged || player.spellTargetEmpty) {
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
        playerIsMoving = false;
        for (let i = 0; i < battleQueue.length; i++) {
            const character = battleQueue[i];
            character.removeCard();
        }
        battleQueue = [];
        player.actionPointHTMLRemove();
        player.resetAllSlots();
        player.removeStatusEffect();
        music.crossFade(music.calm);
        background.classList.remove("battle");
        openQuest.classList.remove("js-hidden");
    }

    function combatEvent() {
        battleInProgress = true;
        playersTurn = false;
        background.classList.add("battle");
        openQuest.classList.add("js-hidden");
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

    function enemyKill(enemy) {
        player.enemyKill(enemy);
        enemiesInZone--;
        if (enemiesInZone <= 0) {
            enemiesInZone = 0;
            playerIsMoving = true;
            setTimeout(() => {
                calmEvent();
            }, 1000);
        }
    }

    function enemyDrop(enemy) {
        const tileObj = enemy.currentTile;
        const collectable = collectables.coins;
        const item = createItem(collectable);
        setTimeout(() => {
            tileObj.placeObject(item, "item", true);
            tileObj.placeHTML(tileObj.object.createHTML());
        }, 400);
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
                        let spellPause = false;
                        if (currentCharacter.spellFire) {
                            currentCharacter.spellFire(player.currentTile);
                            spellPause = true;
                        }
                        if (spellPause) {
                            setTimeout(() => {
                                enemyTurn(currentCharacter);
                            }, 300);
                        } else {
                            enemyTurn(currentCharacter);
                        }
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
                effect.simple.createHTML(destinationTileObj, "explosion", 700);
                effect.simple.soundEffect("THUD_Bright_03_mono.mp3");
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
        if (CHEATS_ON && CHEAT_FOG_OF_WAR) {
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
                let miniMapSection = document.getElementById("minimap_" + id)
                if (setActive) {
                    miniMapSection.classList.remove("fog-of-war");
                    miniMapSection.classList.add("active");
                    currentZone.explore();
                } else {
                    miniMapSection.classList.remove("active");
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

    function placeMerchants() {
        //Place and fill each merchants inventory
        for (let i = 0; i < region.safeZones.length; i++) {
            const zone = region.safeZones[i];
            const tileObj = zone.getRandomTile(true);
            // const spritePos = randomInteger(0, 7);
            const merchant = createMerchant(0);
            placeMerchant(zone, tileObj, merchant);
        }
    }

    function createMerchant(name, spritePos) {
        let filteredCollectables = getCollectables();
        let items = [];
        for (let collectableObjIndex = 0; collectableObjIndex < filteredCollectables.length; collectableObjIndex++) {
            const collectable = filteredCollectables[collectableObjIndex];
            const itemCount = randomInteger(collectable.merchantCountMin, collectable.merchantCountMax + 1);
            for (let count = 0; count < itemCount; count++) {
                items.push(createItem(collectable));
            }
        }
        const merchant = new Merchant(name, spritePos, new Inventory("merchant"));
        fillInventory(merchant.inventory, items);
        return merchant;
    }

    function getCollectables(inventoryItem = true) {
        let inventoryCollectables = [];
        const collectableObjs = Object.keys(collectables);
        for (let keyIndex = 0; keyIndex < collectableObjs.length; keyIndex++) {
            const key = collectableObjs[keyIndex];
            const collectable = collectables[key];
            if (inventoryItem) {
                if (collectable.inventoryItem) {
                    inventoryCollectables.push(collectable);
                }
            } else {
                inventoryCollectables.push(collectable);
            }
        }
        return inventoryCollectables;
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
                if (collectable.inventoryItem || collectable.type == "coin") {
                    spawnPropability += collectable.spawnPropability;
                    collObjs.push({ collectable: collectable, spawnPropability: spawnPropability });
                }
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
            const chest = new Chest(minMax.typeIndex, new Inventory("chest"));
            placeChest(tileObj, chest);
            let itemCount = randomInteger(minMax.min, minMax.max);
            let collectable;
            for (let itemAmount = 0; itemAmount < itemCount; itemAmount++) {
                let rnd = randomInteger(0, spawnPropability);
                for (let collectableObjIndex = 0; collectableObjIndex < collObjs.length; collectableObjIndex++) {
                    const collectableObj = collObjs[collectableObjIndex];
                    if (rnd < collectableObj.spawnPropability) {
                        collectable = collectableObj.collectable;
                        items.push(createItem(collectable));
                        break;
                    }
                }
            }
            fillInventory(chest.inventory, items);
        }
    }

    function getRandomCollectable(inventoryItem = true) {
        let allCollectables = getCollectables(inventoryItem);
        let total = 0;
        let propabilities = [];
        for (let i = 0; i < allCollectables.length; i++) {
            const collectable = allCollectables[i];
            total += collectable.spawnPropability;
            propabilities.push({ total, collectable });
        }
        const rnd = randomInteger(0, total);
        for (let i = 0; i < propabilities.length; i++) {
            const propability = propabilities[i];
            if (rnd < propability.total) {
                return propability.collectable;
            }
        }
        return null;
    }

    function createRandomItem(inventoryItem = true) {
        const collectable = getRandomCollectable(inventoryItem);
        return createItem(collectable);
    }

    function createItem(collectable) {
        uniqueIndex++;
        let newItem = new Item(collectable.type + "-" + uniqueIndex, collectable);
        return newItem;
    }

    function placeMerchant(zone, tileObj, merchant) {
        tileObj.setEmpty();
        tileObj.placeObject(merchant, "merchant", true);
        miniMap.tileAddClass(zone.id, "merchant");
    }

    function placeChest(tileObj, chest) {
        tileObj.setEmpty();
        tileObj.placeObject(chest, "chest", true);
    }

    function fillInventory(inventory, items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            inventory.addItem(item);
        }
    }

    function destroyChest(tileObj) {
        tileObj.setEmpty();
        effect.simple.createHTML(tileObj, "explosion", 700);
        effect.floating.createHTML(tileObj, "Empty");
    }

    function placeEnemies(amount) {
        for (let i = 0; i < amount; i++) {
            const zone = region.getRandomUnsafeZone();
            const tileObj = zone.getRandomTile(true);
            randomEnemy(tileObj);
        }
    }

    function randomEnemy(tileObj) {
        let type = getRandomArrayItem(currentWorld.enemyTypes);
        placeEnemy(tileObj, type);
    }

    function placeEnemy(tileObj, type) {
        const enemy = new Enemy(type.name, "enemy", type.moveTime, type.attackTime, new Health(type.life), new Attribute(type.strength, false), tileObj.id, actions, type.actionPoints, type.sfxs, new Inventory("enemy"), type, type.enemyDamage, type.enemyDeath);
        tileObj.setEmpty();
        tileObj.placeObject(enemy, "enemy", true);
        type.totalCount++;
    }

    function placeEnemyBoss(tileObj, type) {
        const enemyBoss = new EnemyBoss(type.name, "enemy", type.moveTime, type.attackTime, new Health(type.life), new Attribute(type.strength, false), tileObj.id, actions, type.actionPoints, type.sfxs, new Inventory("enemy"), type, enemySpell.fireball, type.enemyDamage, type.enemyDeath);
        tileObj.setEmpty();
        tileObj.placeObject(enemyBoss, "enemy", true);
        type.totalCount++;
    }

    function placeCollectables(collectable) {
        collectable.totalStackAmount = 0;
        const collStacks = Math.round(worlds.zoneCount(currentWorld) * collectable.spawnPerZone * COLLECTABLE_SPAWN_FACTOR);
        for (let i = 0; i < collStacks; i++) {
            const zone = region.getRandomZone();
            const tileObj = zone.getRandomTile();
            const item = createItem(collectable);
            tileObj.placeObject(item, "item", true);
            collectable.totalStackAmount += item.amount;
        }
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
                clearTimeout(effectTimeout.timeout);
                effectTimeout.callback();
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
            player.setInteractTime();
            halfWayMove(player.element, player.moveTime, direction, function() {
                let collectAmount = roundDecimal(player.strength.value / 4, 0);
                const health = destinationTileObj.takeDamage(player.strength.value);
                if (health) {
                    let collectable = collectables[destinationTileObj.healthType];
                    if (destinationTileObj.name == "rock" && randomBool(8)) {
                        collectable = collectables.iron;
                        collectAmount = roundDecimal(player.strength.value / 12, 0);
                    }
                    if (collectAmount < 1) {
                        collectAmount = 1;
                    }
                    for (let i = 0; i < collectAmount; i++) {
                        const item = createItem(collectable);
                        item.onCollect(true);
                    }
                }
            }, function() {
                playerIsMoving = false;
            });
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
        if (destinationTileObj.type == "merchant") {
            player.setInteractTime();
            halfWayMove(player.element, player.moveTime, direction, null, function() {
                playerIsMoving = false;
                const merchant = destinationTileObj.object;
                let hasQuest = false;
                if (merchant.isQuestManager) {
                    let playerQuest = null;
                    if (player.quests.length > 0) {
                        for (let i = 0; i < player.quests.length; i++) {
                            const qst = player.quests[i];
                            if (merchant.questManager.compareChainID(qst.chainID)) {
                                playerQuest = qst;
                                break;
                            }
                        }
                    }
                    if (playerQuest && merchant.questManager.isPending(playerQuest) && playerQuest.objective.state != "complete") {
                        hasQuest = playerQuest.begin(merchant.questManager, null, function() {
                            merchant.inventory.tile = destinationTileObj;
                            showInventory(merchant.inventory);
                        });
                    } else if (!merchant.questManager.depleted) {
                        hasQuest = merchant.questManager.quest.begin(merchant.questManager, playerQuest, function() {
                            const newQuest = merchant.questManager.getQuest();
                            if (player.quests.length > 0) {
                                for (let i = 0; i < player.quests.length; i++) {
                                    const qst = player.quests[i];
                                    if (qst.objective.detail.getQuestItem) {
                                        player.inventory.removeQuestItem(qst.getItem());
                                        break;
                                    }
                                }
                            }
                            if (newQuest) {
                                player.addQuest(newQuest)
                                if (!player.updateQuestRow(newQuest.chainID)) {
                                    const newRow = new QuestRow(questOverviewParent, newQuest.objective.dialog.begin.title);
                                    player.addQuestRow(newRow, newQuest.chainID);
                                }
                                if (playerQuest && playerQuest.objective.state == "complete") {
                                    player.removeQuest(playerQuest);
                                }
                                const detail = newQuest.objective.detail;
                                if (detail.getReward) {
                                    const collectableTypes = detail.getReward();
                                    for (let i = 0; i < collectableTypes.length; i++) {
                                        for (let amount = 0; amount < collectableTypes[i].amount; amount++) {
                                            const collectable = collectables[collectableTypes[i].type];
                                            const item = createItem(collectable);
                                            item.onCollect(false);
                                        }
                                    }
                                }
                                if (detail.getQuestItem) {
                                    const collectable = collectables[detail.getQuestItem()];
                                    const item = createItem(collectable);
                                    player.inventory.addQuestItem(item);
                                    newQuest.setItem(item);
                                }
                                if (detail.questChainEnd) {
                                    const chainID = detail.questChainEnd();
                                    worlds.removeManagers(currentWorld, chainID);
                                    player.removeQuests(chainID);
                                    player.lastQuestRow(chainID);
                                }
                            }
                            setQuestState(merchant);
                        });
                    }
                }
                if (!hasQuest) {
                    merchant.inventory.tile = destinationTileObj;
                    showInventory(merchant.inventory);
                }
            });
            return "merchant";
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
            playerToTile(destinationTileObj);
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

    function itemCollectAnimation(item, targetElement, onAnimDone) {
        const effectTimeout = {
            timeout: setTimeout(() => {
                const spriteCoordinates = {
                    x: item.posX / 100,
                    y: item.posY / 100,
                }
                effect.zoomTo.createHTML(player.currentTile, targetElement, item.type, spriteCoordinates, function() {
                    onAnimDone();
                });
            }, 20),
            callback() {
                onAnimDone();
            }
        }
        effectTimeouts.push(effectTimeout);
    }

    function playerToTile(destinationTileObj) {
        const prevTileObj = player.currentTile;
        player.tileId = destinationTileObj.id;
        destinationTileObj.placeObject(player, "player", true);
        destinationTileObj.element.append(player.element);
        prevTileObj.object = null;
        prevTileObj.type = "empty";
        prevTileObj.occupied = false;
        prevTileObj.setElementClassType();
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
        obj.msgElm.style.transition = `opacity ${MESSAGE_FADE_DURATION}ms, visibility ${MESSAGE_FADE_DURATION}ms`;
        obj.msgElm.textContent = msg;
        infoCenter.prepend(obj.msgElm);
        obj.delay = setTimeout(() => {
            obj.msgElm.classList.add("js-active");
            obj.duration = setTimeout(() => {
                obj.msgElm.classList.remove("js-active");
                obj.fade = setTimeout(() => {
                    messagePool.shift();
                    infoCenter.removeChild(obj.msgElm);
                }, MESSAGE_FADE_DURATION);
            }, MESSAGE_DURATION);
        }, MESSAGE_DELAY);
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

    function toFileName(str) {
        str = str.replace(/\s+/g, '-').toLowerCase();
        return str;
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

    function cssMoveVars(element, sourceRect, targetRect) {
        const x = targetRect.left - sourceRect.left;
        const y = targetRect.top - sourceRect.top;
        element.style.cssText += `--move-x:${x}px;--move-y:${y}px;`;
        const distance = Math.sqrt(x * x + y * y);
        return distance;
    }

    function cssMoveVarsFixed(element, sourceRect, targetRect) {
        const x = targetRect.left - sourceRect.left;
        const y = targetRect.top - sourceRect.top;
        element.style.top = `${sourceRect.top}px`;
        element.style.left = `${sourceRect.left}px`;
        element.style.cssText += `--move-x:${x}px;--move-y:${y}px;`;
        const distance = Math.sqrt(x * x + y * y);
        return distance;
    }

    //#endregion REUSABLE FUNCTIONS

    //#region ANIMATION FRAME

    //Torch:
    function equipTorch() {
        if (torchEquipping) {
            player.setNightOverlayOpacity(1 - (1 / TORCH_EQUIP_TIME * torchEquipTimeCurrent))
            torchEquipTimeCurrent += deltaTime;
            if (torchEquipTimeCurrent >= TORCH_EQUIP_TIME) {
                torchEquipTimeCurrent = 0;
                torchEquipping = false;
            }
        }
    }

    function unEquipTorch() {
        if (torchUnEquipping) {
            player.setNightOverlayOpacity(1 / TORCH_EQUIP_TIME * torchEquipTimeCurrent)
            torchEquipTimeCurrent += deltaTime;
            if (torchEquipTimeCurrent >= TORCH_EQUIP_TIME) {
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