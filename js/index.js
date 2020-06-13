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

    // BATTLE QUEUE screen
    const battleQueueElement = document.getElementById("battle-queue");

    const tileSize = 48;

    gameStarted = false;

    let player;
    let playerIsMoving = false;
    let playersTurn = true;
    let battleQueue = [];
    let pathFindingGrid = [];

    let currentWorld;
    let region;
    let miniMap;
    let currentZone = undefined;

    let enemiesInZone = 0;
    let zoneLocked = false;



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
            this.element.style.gridTemplateColumns = `repeat(${this.region.width}, ${this.region.zoneSize}px)`;
            this.element.style.gridAutoRows = `${this.region.zoneSize}px`;
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
        createHTML() {
            let gate = document.createElement("DIV");
            gate.classList.add("gate");
            gate.classList.add(this.cls);
            if (this.locked) {
                gate.classList.add("locked");
                gate.style.backgroundPosition = "0 0";
            }
            gate.classList.add("tile__object");
            let enemyTypeHTML = `<div><h4>Enemytypes:</h4><ul class="item-list">`;
            for (let i = 0; i < this.world.enemyTypes.length; i++) {
                const enemyType = this.world.enemyTypes[i];
                enemyTypeHTML += `<li>${enemyType.name}</li>`;
            }
            enemyTypeHTML += "</ul></div>";
            const tooltipObj = createTooltipObj(`
                <h3>${this.cls}: <span class="title">${this.id}</span></h3>
                ${enemyTypeHTML}
            `);
            gate.append(tooltipObj.element);
            tooltipPlacement(this.tileObj, tooltipObj.element, tooltipObj.height);
            this.element = gate;
            this.tileObj.element.append(this.element);
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
        constructor(name, type, moveTime, attackTime, life, strength, currentTile, onDeath) {
            this.name = name;
            this.type = type;
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
            this.updateHealthBar();
        }
        takeDamage(damage) {
            if (damage <= 0) {
                return;
            }
            this.addLife(-damage);
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
        constructor(name, type, moveTime, attackTime, life, strength, armor, lifeElm, strengthElm, armorElm, currentTile, onDeath) {
            super(name, type, moveTime, attackTime, life, strength, currentTile, onDeath);
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
            this.updateTooltip(false);
        }
        updateTooltip(placeTooltip = true) {
            if (this.tooltip) {
                this.element.removeChild(this.tooltip);
            }
            const tooltipObj = createTooltipObj(`
                <h3>${this.name}</h3>
                <p>Life: ${this.life}</p>
                <p>Damage: ${this.strength}</p>
                <p>Armor: ${this.armor}</p>
                <p>Movement speed: ${this.moveTime}</p>
                <p>Attack speed: ${this.attackTime}</p>
            `);
            this.tooltip = tooltipObj.element;
            this.tooltipHeight = tooltipObj.height;
            this.element.append(this.tooltip);
            if (placeTooltip) {
                tooltipPlacement(this.currentTile, this.tooltip, this.tooltipHeight);
            }
        }
        setInteractTime() {
            this.element.style.animationDuration = `${this.interactTime}ms`;
            this.updateTooltip();
        }
        addLife(amount) {
            super.addLife(amount);
            this.lifeElm.textContent = this.life;
            this.updateTooltip();
        }
        addStrength(amount) {
            this.strength += amount;
            this.strengthElm.textContent = this.strength;
            this.updateTooltip();
        }
        setStrength(amount) {
            this.strength = amount;
            this.strengthElm.textContent = this.strength;
            this.updateTooltip();
        }
        addArmor(amount) {
            this.armor += amount;
            this.armorElm.textContent = this.armor;
            this.updateTooltip();
        }
        setArmor(amount) {
            this.armor = amount;
            this.armorElm.textContent = this.armor;
            this.updateTooltip();
        }
        enemyKill() {
            this.killCount++;
        }
        takeDamage(amount) {
            super.takeDamage(amount - this.armor);
        }
    }

    class Enemy extends Character {
        constructor(name, type, moveTime, attackTime, life, strength, cls, currentTile, onDeath) {
            super(name, type, moveTime, attackTime, life, strength, currentTile, onDeath);
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
            this.element = enemyHTML;
            this.elmBar = bar;
            this.elmBarText = barText;
            this.updateTooltip();
            return enemyHTML;
        }
        updateTooltip() {
            if (this.tooltip) {
                this.element.removeChild(this.tooltip);
            }
            const tooltipObj = createTooltipObj(`
                <h3>${this.name}</h3>
            `);
            this.tooltip = tooltipObj.element;
            this.tooltipHeight = tooltipObj.height;
            this.element.append(this.tooltip);
            tooltipPlacement(this.currentTile, this.tooltip, this.tooltipHeight);
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
        constructor(amount, pos, equipable, callback) {
            this.amount = amount;
            this.posX = pos.x * 100;
            this.posY = pos.y * 100;
            this.callback = callback;
            this.equipable = equipable;
            this.equipped = false;
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

    let enemyType = {
        skeleton: {
            name: "Skeleton",
            cls: "skeleton",
            life: 20,
            strength: 5,
            totalCount: 0,
            moveTime: 500,
            attackTime: 300,
        },
        orc: {
            name: "Orc",
            cls: "orc",
            life: 50,
            strength: 8,
            totalCount: 0,
            moveTime: 1000,
            attackTime: 400,
        }
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
            enemyTypes: [enemyType.skeleton, enemyType.orc],
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
            enemyTypes: [enemyType.skeleton, enemyType.orc],
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
            enemyTypes: [enemyType.skeleton, enemyType.orc],
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
            enemyTypes: [enemyType.skeleton, enemyType.orc],
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
            enemyTypes: [enemyType.skeleton, enemyType.orc],
        }
    }

    // let enemyTypes = [{
    //         name: "Skeleton",
    //         cls: "skeleton",
    //         life: 20,
    //         strength: 5,
    //         totalCount: 0,
    //         moveTime: 500,
    //         attackTime: 300,
    //     },
    //     {
    //         name: "Orc",
    //         cls: "orc",
    //         life: 50,
    //         strength: 8,
    //         totalCount: 0,
    //         moveTime: 1000,
    //         attackTime: 400,
    //     },
    // ]

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
            type: "coin",
            count: 0,
            spriteCoordinates: { x: 3, y: 3 },
            includeInStartZone: true,
            stacks: 100,
            minStackAmount: 10,
            maxStackAmount: 30,
            equipable: false,
            equipped: null,
            iconElement: document.getElementById("coin-icon"),
            element: document.getElementById("coin-count"),
            onCollect: function(item) {
                collectables.coins.count += item.amount;
                collectables.coins.element.textContent = collectables.coins.count;
            }
        },
        keys: {
            type: "key",
            count: 0,
            spriteCoordinates: { x: 6, y: 0 },
            includeInStartZone: false,
            stacks: 6,
            minStackAmount: 1,
            maxStackAmount: 1,
            equipable: false,
            equipped: null,
            iconElement: document.getElementById("key-icon"),
            element: document.getElementById("key-count"),
            onCollect: function(item) {
                collectables.keys.count += item.amount;
                collectables.keys.element.textContent = collectables.keys.count;
            }
        },
        woodenSword: {
            type: "weapon",
            count: 0,
            spriteCoordinates: { x: 1, y: 2 },
            includeInStartZone: false,
            stacks: 30,
            minStackAmount: 10,
            maxStackAmount: 10,
            equipable: true,
            equipped: true,
            iconElement: document.getElementById("strength-icon"),
            element: document.getElementById("strength-count"),
            onCollect: function(item) {
                player.setStrength(item.amount);
                setEquipable(collectables.woodenSword);
            }
        },
        ironSword: {
            type: "weapon",
            count: 0,
            spriteCoordinates: { x: 3, y: 2 },
            includeInStartZone: false,
            stacks: 40,
            minStackAmount: 12,
            maxStackAmount: 12,
            equipable: true,
            equipped: false,
            iconElement: document.getElementById("strength-icon"),
            element: document.getElementById("strength-count"),
            onCollect: function(item) {
                player.setStrength(item.amount);
                setEquipable(collectables.ironSword);
            }
        },
        ironAxe: {
            type: "weapon",
            count: 0,
            spriteCoordinates: { x: 2, y: 0 },
            includeInStartZone: false,
            stacks: 40,
            minStackAmount: 15,
            maxStackAmount: 15,
            equipable: true,
            equipped: false,
            iconElement: document.getElementById("strength-icon"),
            element: document.getElementById("strength-count"),
            onCollect: function(item) {
                player.setStrength(item.amount);
                setEquipable(collectables.ironAxe);
            }
        },
        smallShield: {
            type: "armor",
            count: 0,
            spriteCoordinates: { x: 5, y: 0 },
            includeInStartZone: false,
            stacks: 40,
            minStackAmount: 1,
            maxStackAmount: 1,
            equipable: true,
            equipped: true,
            iconElement: document.getElementById("armor-icon"),
            element: document.getElementById("armor-count"),
            onCollect: function(item) {
                player.setArmor(item.amount);
                setEquipable(collectables.smallShield);
            }
        },
        largeShield: {
            type: "armor",
            count: 0,
            spriteCoordinates: { x: 4, y: 0 },
            includeInStartZone: false,
            stacks: 30,
            minStackAmount: 3,
            maxStackAmount: 3,
            equipable: true,
            equipped: false,
            iconElement: document.getElementById("armor-icon"),
            element: document.getElementById("armor-count"),
            onCollect: function(item) {
                player.setArmor(item.amount);
                setEquipable(collectables.largeShield);
            }
        },
        potions: {
            type: "life",
            count: 0,
            spriteCoordinates: { x: 3, y: 4 },
            includeInStartZone: false,
            stacks: 300,
            minStackAmount: 10,
            maxStackAmount: 50,
            equipable: false,
            equipped: null,
            iconElement: document.getElementById("life-icon"),
            element: document.getElementById("life-count"),
            onCollect: function(item) {
                player.addLife(item.amount);
            }
        },
    }

    function setEquipable(collectable) {
        resetEquipable(collectable.type);
        collectable.equipped = true;
        uiIcon(collectable);
    }

    function resetEquipable(type) {
        for (let i = 0; i < Object.keys(collectables).length; i++) {
            const collectable = Object.keys(collectables)[i];
            if (collectable.type == type) {
                collectable.equipped = false;
            }
        }
    }

    // let startFormLabelText = "";
    startForm.addEventListener("submit", function(evt) {
        evt.preventDefault();
        const startFormName = startForm.querySelector("#start-form-name");
        // const startFormLabel = startForm.querySelector("#start-form-label");
        // if (startFormLabelText == "") {
        //     startFormLabelText = startFormLabel.textContent;
        // }
        // if (startFormName.value == "") {
        //     startFormLabel.textContent = startFormLabelText + " - Please fill out!";
        //     startFormLabel.classList.add("js-invalid");
        //     startFormName.addEventListener("keyup", keyListen);

        //     function keyListen() {
        //         startFormLabel.textContent = startFormLabelText;
        //         startFormLabel.classList.remove("js-invalid");
        //         startFormName.removeEventListener("keyup", keyListen);
        //     }
        //     return false;
        // }
        newGame(startFormName.value);
        startScreen.classList.add("js-hidden");
    });
    document.addEventListener("keyup", function(evt) {
        if (gameStarted && evt.key == "m") {
            miniMap.zoomToggle();
        }
    });

    function newGame(playerName) {
        currentWorld = worlds.outdoor;
        region = new Region(worlds.outdoor, background, zoneContainer, tileSize);
        miniMap = new MiniMap(region, miniMapContainer, miniMapZoom);
        const lifeUIElm = collectables.potions.element;
        const strengthUIElm = collectables.woodenSword.element;
        const armorUIElm = collectables.smallShield.element;
        playerName = playerName == "" ? "Player 1" : playerName;
        player = new Player(playerName, "player", 150, 150, 100, 10, 0, lifeUIElm, strengthUIElm, armorUIElm, null, gameOver);
        for (let i = 0; i < Object.values(collectables).length; i++) {
            const collectable = Object.values(collectables)[i];
            uiIcon(collectable);
            if (collectable.equipable && collectable.equipped) {
                collectable.element.textContent = collectable.minStackAmount;
            }
        }
        battleQueueElement.innerHTML = "";
        buildMap();
        buildZone("0_0");
        placePlayer(getCenterTileIndex());
        addPlayerControls();
        setEvent();

        //Manual placement of dungeon
        // const tileObj = currentZone.getRandomTile();
        // placeDungeon(currentWorld.gateWaysTo()[0], currentZone, tileObj);

        //Pathfinding algorithm test
        // updatePathfindingGrid();
        // console.log(findShortestPath({ x: 0, y: 0 }, { x: 3, y: 3 }, pathFindingGrid));

        gameStarted = true;
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

    function uiIcon(collectable) {
        if (collectable.equipable && !collectable.equipped) {
            return;
        }
        const x = collectable.spriteCoordinates.x * 64;
        const y = collectable.spriteCoordinates.y * 64;
        collectable.iconElement.style.backgroundPosition = `-${x}px -${y}px`;
    }

    function gameOver(playerObj) {
        gameOverScreen.classList.remove("js-hidden");
        setTimeout(() => {
            gameOverScreen.classList.add("js-hidden");
            startScreen.classList.remove("js-hidden");
        }, 3000);
        calmEvent();
    }

    function enterGate(gate) {
        if (gate.locked) {
            if (collectables.keys.count > 0) {
                collectables.keys.count--;
                collectables.keys.element.textContent = collectables.keys.count;
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

        //INSERT KEYS MANUALLY FOR TESTING PURPOSES
        collectables.keys.count++;
        collectables.keys.element.textContent = collectables.keys.count;

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
                    tooltipPlacement(tileObj, tileObj.object.tooltip, tileObj.object.tooltipHeight);
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
        turnIndex = -1;
        battleQueue = [];
        background.classList.remove("battle");
        player.removeCard();
    }

    function combatEvent() {
        zoneLocked = true;
        playersTurn = false;
        turnIndex = -1;
        background.classList.add("battle");
        battleQueue.push(player);
        shuffleArray(battleQueue);
        for (let i = 0; i < battleQueue.length; i++) {
            const character = battleQueue[i];
            character.createCardHTML(battleQueueElement);
        }
        nextTurn();
    }

    function nextTurn() {
        for (let i = battleQueue.length - 1; i >= 0; i--) {
            const character = battleQueue[i];
            if (character.isDead) {
                battleQueue.splice(i, 1);
            }
        }
        const first = battleQueue.shift();
        battleQueue.push(first);
        for (let i = 0; i < battleQueue.length; i++) {
            const character = battleQueue[i];
            // if (i == 0) {
            //     character.card.style.position = "absolute";
            //     character.card.style.transition = "transform 500ms";
            //     character.card.style.transform = `translate(${64 * battleQueue.length - 1}px)`;
            // } else {
            //     character.card.removeAttribute("style");
            //     character.card.classList.add("js-left");
            // }
            // setTimeout(() => {
            //     character.card.removeAttribute("style");
            //     character.card.classList.remove("js-left");
            // }, 500);
            if (i == 0) {
                character.setActive();
            } else {
                character.setInactive();
            }
            character.updateOrder(i);
        }
        if (battleQueue[0] == player) {
            playersTurn = true;
        } else {
            playersTurn = false;
            enemyTurn(battleQueue[0]);
        }
    }

    function enemyTurn(enemyObj) {
        if (battleQueue.length > 0) {
            updatePathfindingGrid();
            const moveDirection = shortestPathDirection(enemyObj.currentTile, player.currentTile);
            const destinationTileObj = adjacentTile(enemyObj.currentTile, moveDirection);
            enemyMove(enemyObj, moveDirection, destinationTileObj);
        }
    }

    function shortestPathDirection(from, to) {
        let fromObj = from.coordinates();
        let toObj = to.coordinates();
        return findShortestPath(fromObj, toObj, pathFindingGrid)[0];
    }

    function enemyMove(enemyObj, direction, destinationTileObj) {
        enemyObj.currentTile.element.classList.add("attacking");
        setTimeout(() => {
            enemyObj.element.classList.add("animation-" + direction);
            if (destinationTileObj == player.currentTile) {
                enemyObj.setAttackTime();
                halfWayMove(enemyObj.element, enemyObj.attackTime, direction, function() {
                    effect.explosion.createHTML(destinationTileObj, 700);
                    destinationTileObj.object.takeDamage(enemyObj.strength);
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
                    enemyObj.currentTile = destinationTileObj;
                    destinationTileObj.placeObject(enemyObj, "enemy", true);
                    destinationTileObj.placeHTML(enemyObj.element);
                    currentTile.setEmpty();
                }, function() {
                    enemyObj.element.classList.remove("animation-" + direction);
                    enemyObj.currentTile.element.classList.remove("attacking");
                    tooltipPlacement(enemyObj.currentTile, enemyObj.tooltip, enemyObj.tooltipHeight);
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
        tooltipPlacement(player.currentTile, player.tooltip, player.tooltipHeight);
    }

    function placeEnemies(amount) {
        for (let i = 0; i < amount; i++) {
            const zone = region.getRandomZone();
            const tileObj = zone.getRandomTile();
            randomEnemy(tileObj);
        }
        console.log("Skeletons: " + currentWorld.enemyTypes[0].totalCount + ", Orcs: " + currentWorld.enemyTypes[1].totalCount);
    }

    function placeCollectables(collectable) {
        collectable.totalStackAmount = 0;
        for (let i = 0; i < collectable.stacks; i++) {
            const zone = region.getRandomZone(collectable.includeInStartZone);
            const tileObj = zone.getRandomTile();
            const rndAmount = randomInteger(collectable.minStackAmount, collectable.maxStackAmount);
            const item = new Item(rndAmount, collectable.spriteCoordinates, collectable.equipable, collectable.onCollect);
            item.equip(collectable.equipped);
            tileObj.placeObject(item, "item", true);
            collectable.totalStackAmount += rndAmount;
        }
        //This needs to be deleted at some point.
        //For now, it is used to adjust collectables-values, to create balance in the game
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
        const enemy = new Enemy(type.name, "enemy", type.moveTime, type.attackTime, type.life, type.strength, type.cls, tileObj, enemyDeath);
        tileObj.setEmpty();
        tileObj.placeObject(enemy, "enemy", true);
        type.totalCount++;
    }

    function enemyDeath(enemy) {
        console.log("Enemy: " + enemy.name + " died.");
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
                player.element.style.backgroundPosition = "0 -33.3333%";
            }
            if (evt.key == "s" || evt.key == "ArrowDown") {
                moveSuccess = playerMove(0, 1, player.element, "down");
                player.element.style.backgroundPosition = "0 0";
            }
            if (evt.key == "a" || evt.key == "ArrowLeft") {
                moveSuccess = playerMove(-1, 0, player.element, "left");
                player.element.style.backgroundPosition = "0 -100%";
            }
            if (evt.key == "d" || evt.key == "ArrowRight") {
                moveSuccess = playerMove(1, 0, player.element, "right");
                player.element.style.backgroundPosition = "0 -66.6667%";
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
        let coordinate = player.currentTile.coordinates();
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
            tooltipPlacement(player.currentTile, player.tooltip, player.tooltipHeight);
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

    function createTooltipObj(content) {
        const tooltip = document.createElement("DIV");
        tooltip.classList.add("golden-background");
        tooltip.innerHTML = content;
        document.body.append(tooltip);
        const height = tooltip.offsetHeight;
        tooltip.classList.add("tooltip");
        const obj = {};
        obj.element = tooltip;
        obj.height = height;
        return obj;
    }

    function tooltipPlacement(tileObj, tooltip, height) {
        const offset = 10;
        tooltip.style.top = "";
        tooltip.style.bottom = "";
        if (tileObj.coordinates().y < Math.floor((region.zoneSize - 1) / 2)) {
            tooltip.style.top = `calc(100% + ${offset}px)`;
        } else {
            tooltip.style.top = `-${height + offset}px`;
        }
    }

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

    // *********************************************************************************************
    // *********************************************************************************************
    // ************************** PATHFIDING Breadth-First Search algorithm ************************
    // *********************************************************************************************
    // *********************************************************************************************

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