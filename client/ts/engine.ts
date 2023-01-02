import { dom, utils } from "./lib.js";

// Basic 2D vector with accompanying helpers
export class Vector2D {
	x: number;
	y: number;
	static add(a: Vector2D, b: Vector2D) {
		return new Vector2D(a.x + b.x, a.y + b.y);
	}
	static random(xMax: number, yMax: number) {
		return new Vector2D(utils.getRandomIntExc(0, xMax), utils.getRandomIntExc(0, yMax));
	}
	static equals(a: Vector2D, b: Vector2D) {
		return a.x == b.x && a.y == b.y;
	}
	public toString() {
		return `{${this.x},${this.y}}`;
	}
	constructor(_x: number, _y: number) {
		[this.x, this.y] = [_x,_y];
	}
}

// Base class for all pickups: weapons, ammo, healing
class Resource {
	name: string = "";
	desc: string = "";
	type: any;
	constructor() {}
}

// Generally dumb, any key opens any door
export class Key extends Resource {
	private types = [
		{name:"Rusty Key",desc:"a rusty key which seems to have been long forgotten"}, 
		{name:"Good Key",desc:"a steel key in good condition"}, 
		{name:"Worn Key",desc:"a worn key - hopefully it still works"}
	];
	constructor() {
		super();
		let type = this.types[utils.getRandomIntExc(0, this.types.length)]
		this.name = type.name;
		this.desc = type.desc;
	}
}

export enum HealingType {
	chips,
	apple,
	bar,
	firstaid
}

// Chips, apples, and energy bars spawn around the building randomly, First Aid only spawns in storage rooms
export class Healing extends Resource {
	heal: number;
	private types = {
		[HealingType.chips]: {name:"chips",heal:2,desc:"a small package of low fat, baked chips"},
		[HealingType.apple]:{name:"apple",heal:3,desc:"a firm, mostly red, medium-sized apple"},
		[HealingType.bar]:{name:"energy bar",heal:4,desc:"a sealed energy bar, high in protein and sugar"},
		[HealingType.firstaid]:{name:"office First Aid kit", heal:10, desc:"a small First Aid kit for office-type emergencies - it's nothing fancy, but the pack of gauze and adrenaline shot are helpful"}
	};
	constructor(_type?: HealingType) {
		super();
		// first aid only spawns in storage rooms
		let healingType = _type || utils.getRandomIntExc(0, Object.keys(this.types).length - 1) as HealingType;
		let type = this.types[healingType];
		this.type = healingType;
		this.name = type.name;
		this.heal = type.heal;
		this.desc = type.desc;
	}
}

export enum WeaponType {
	dualPistol9mm,
	pistol9mm,
	revolver,
	shotgun,
	rifle,
	fist
}

export enum AmmoCaliber {
	p9mm,
	p44Mag,
	sh12gauge,
	r762NATO,
	fist
}

// Only exist as part of a weapon
export class Clip {
	caliber: AmmoCaliber;
	maxRounds: number;
	currRounds: number;

	constructor(caliber: AmmoCaliber, maxRounds: number) {
		this.caliber = caliber;
		this.maxRounds = maxRounds;
		this.currRounds = utils.getRandomIntExc(0, this.maxRounds / 2);
	}
}

// Pistols are found around the building, rifles and shotguns only in storage rooms
export class Weapon extends Resource {
	ammoCaliber: AmmoCaliber;
	damage: number;
	clip: Clip;
	type: WeaponType;

	public reload(ammo: AmmoPile) {
		if (ammo.caliber == this.ammoCaliber) {
			let missing = this.clip.maxRounds - this.clip.currRounds;
			let reloaded = 0;
			if (ammo.quantity >= missing) {
				reloaded = missing;
				this.clip.currRounds += missing;
				ammo.quantity -= missing;
			}
			else {
				reloaded = ammo.quantity;
				this.clip.currRounds += ammo.quantity;
				ammo.quantity = 0
			}
			return reloaded;
		}
		else return 0;
	}

	public shoot(actor?: Actor) {
		if (this.clip.currRounds > 0) {
			if (actor && !actor.ducking) actor.damage(this.damage);
			else if (actor && actor.ducking) actor.damage(this.damage / 2);
			this.clip.currRounds--;
		}
	}
	
	constructor(type: WeaponType) {
		super();
		this.type = type;
		if (this.type == WeaponType.dualPistol9mm) {
			this.name = "akimbo pistols";
			this.ammoCaliber = AmmoCaliber.p9mm;
			this.damage = 10;
			this.clip = new Clip(this.ammoCaliber, 20);
			this.desc = "two small but dependable 9mm pistols, one for each hand"
		}
		else if (this.type == WeaponType.pistol9mm) {
			this.name = "pistol";
			this.ammoCaliber = AmmoCaliber.p9mm;
			this.damage = 5;
			this.clip = new Clip(this.ammoCaliber, 10);
			this.desc = "a small but dependable 9mm pistol"
		}
		else if (this.type == WeaponType.revolver) {
			this.name = "magnum revolver";
			this.ammoCaliber = AmmoCaliber.p44Mag;
			this.damage = 10;
			this.clip = new Clip(this.ammoCaliber, 6);
			this.desc = "a powerful magnum revolver"
		}
		else if (this.type == WeaponType.rifle) {
			this.name = "bullpup rifle";
			this.ammoCaliber = AmmoCaliber.r762NATO;
			this.damage = 8;
			this.clip = new Clip(this.ammoCaliber, 20);
			this.desc = "a bullpup style rife, solid and dependable"
		}
		else if (this.type == WeaponType.shotgun) {
			this.name = "12 gauge shotgun";
			this.ammoCaliber = AmmoCaliber.sh12gauge;
			this.damage = 15;
			this.clip = new Clip(this.ammoCaliber, 2);
			this.desc = "a powerful, twin barrel shotgun"
		}
		else {//if (type == Weapons.fist) {
			this.name = "angry fists";
			this.damage = 3;
			this.desc = "your own two fists";
			this.ammoCaliber = AmmoCaliber.fist;
			this.clip = new Clip(this.ammoCaliber, -1);
		}
	}
}

// Multi-purpose class, spawned around building randomly, also used as part of actor's inventories
export class AmmoPile extends Resource {
	caliber: AmmoCaliber;
	quantity: number = 0;

	constructor(type?: AmmoCaliber, resource: boolean = true) {
		super();
		this.caliber = type || utils.getRandomInt(0, 3) as AmmoCaliber;
		if (type == AmmoCaliber.p9mm) {
			this.name = "pistol ammo";
			if (resource) this.quantity = utils.getRandomInt(5, 10);
			else this.quantity = 0;
			this.desc = "a pile of 9mm ammunition";
		}
		else if (type == AmmoCaliber.p44Mag) {
			this.name = "magnum revolver ammo";
			if (resource) this.quantity = utils.getRandomInt(3, 5);
			else this.quantity = 0;
			this.desc = "a pile of .44 Magnum ammunition";
		}
		else if (type == AmmoCaliber.r762NATO) {
			this.name = "rifle ammo";
			if (resource) this.quantity = utils.getRandomInt(4, 8);
			else this.quantity = 0;
			this.desc = "a pile of 7.62x51mm NATO ammunition";
		}
		else if (type == AmmoCaliber.sh12gauge) {
			this.name = "shotgun ammo";
			if (resource) this.quantity = utils.getRandomInt(2, 4);
			else this.quantity = 0;
			this.desc = "a pile of 12 gauge ammunition";
		}
		else if (type == AmmoCaliber.fist) {
			this.name = "fists";
			this.quantity = 2;
			this.desc = "your own two fists";
		}
	}
}

export enum TileType {
	empty = 1,
	stairUp,
	stairDown,
	stairUpDown,
	storage,
	hostage,
	locked
}

// Representation of a map tile, does not track actors on it
export class Tile {
	locked: boolean = false;
	resources: (Key | Weapon | AmmoPile | Healing)[];
	type: TileType;
	location: Vector2D;
	desc: string;

	private randItems: string[] = [
		"tables and plants",
		"sofas and chairs",
		"water machines and copiers",
		"desks and shelves",
	];
	private getRandItems() {
		return this.randItems[utils.getRandomIntExc(0,4)];
	}
	private randDescriptions = [
		`a small room with ${this.getRandItems()}`, 
		`a medium room with ${this.getRandItems()}`, 
		`a large meeting room with ${this.getRandItems()}`, 
		`a lounge with ping-pong tables, a mini bar, and some ${this.getRandItems()}`
	];

	public checkWeapons(type?: WeaponType) {
		if (typeof type != "undefined") return this.resources.filter(x => x instanceof Weapon && x.type == type) as Weapon[];
		return this.resources.filter(x => x instanceof Weapon) as Weapon[];
	}

	public checkAmmo(caliber?: AmmoCaliber) {
		if (typeof caliber != "undefined") return this.resources.filter(x => x instanceof AmmoPile && x.caliber == caliber) as AmmoPile[];
		else return this.resources.filter(x => x instanceof AmmoPile) as AmmoPile[];
	} 

	public checkKeys(arr: boolean = false) {
		let keyArr = this.resources.filter(x => x instanceof Key);
		if (arr) return keyArr;
		else return keyArr.length;
	}

	public checkHealing(type?: HealingType) {
		if (typeof type != "undefined") return this.resources.filter(x => x instanceof Healing && x.type == type) as Healing[];
		else return this.resources.filter(x => x instanceof Healing) as Healing[];
	}

	public remove(item: Weapon | AmmoPile | Key | Healing) {
		this.resources.splice(this.resources.indexOf(item), 1);
	}

	constructor(position: Vector2D) {
		this.location = position;
		this.type = TileType.empty;
		this.desc = this.randDescriptions[utils.getRandomIntExc(0,this.randDescriptions.length)];
		this.resources = [];
	}
}

// All actors have an inventory
class Inventory {
	private ammo: {[name:string]: AmmoPile};
	private weapons: Weapon[] = [];
	private keys: Key[] = [];
	private healing: Healing[] =[];

	public add(item: AmmoPile | Weapon | Key | Healing | (AmmoPile | Weapon | Key | Healing)[]) {
		if (item instanceof AmmoPile)
			this.ammo[item.caliber].quantity += item.quantity;
		else if (item instanceof Weapon)
			this.weapons.push(item);
		else if (item instanceof Key)
			this.keys.push(item);
		else if (item instanceof Healing)
			this.healing.push(item);
		else if (item.length) {
			for (let thing of item) {
				if (thing instanceof AmmoPile)
					this.ammo[thing.caliber].quantity += thing.quantity;
				else if (thing instanceof Weapon)
					this.weapons.push(thing);
				else if (thing instanceof Key)
					this.keys.push(thing);
				else if (thing instanceof Healing)
					this.healing.push(thing);
			}
		}
	}

	public remove(item: AmmoPile | Weapon | Key | Healing) {
		if (item instanceof AmmoPile)
		this.ammo[item.caliber].quantity -= item.quantity;
		else if (item instanceof Weapon)
			utils.arrayRemove(item, this.weapons);
		else if (item instanceof Key)
			utils.arrayRemove(item, this.keys);
		else if (item instanceof Healing)
			utils.arrayRemove(item, this.healing);
	}

	public checkWeapons(type?: WeaponType) {
		if (typeof type != "undefined") return this.weapons.filter(x => x.type == type);
		else return this.weapons;
	}

	public checkAmmo(caliber: AmmoCaliber) {
		return this.ammo[caliber].quantity;
	} 

	public getAmmo(caliber: AmmoCaliber) {
		return this.ammo[caliber];
	}

	public checkKeys() {
		return this.keys.length;
	}

	public getKey() {
		if (this.keys.length)
			return this.keys[0];
;	}

	public checkHealing(type?: HealingType) {
		if (typeof type != "undefined") return this.healing.filter(x => x.type == type);
		else return this.healing.length;
	}

	public createDualPistols(pistolA: Weapon, pistolB: Weapon) {
		if (pistolA.type == WeaponType.pistol9mm && pistolB.type == WeaponType.pistol9mm) {
			let chamberedRounds = pistolA.clip.currRounds + pistolB.clip.currRounds;
			this.remove(pistolA);
			this.remove(pistolB);
			let dualPistols = new Weapon(WeaponType.dualPistol9mm);
			dualPistols.clip.currRounds = chamberedRounds;
			this.add(dualPistols);
			return dualPistols;
		}
	}

	public empty() {
		let arr: (AmmoPile | Weapon | Key | Healing)[] = ([this.ammo[AmmoCaliber.p9mm],this.ammo[AmmoCaliber.p44Mag],this.ammo[AmmoCaliber.r762NATO],this.ammo[AmmoCaliber.sh12gauge]] as any).concat(this.weapons, this.keys, this.healing);
		this.setupAmmo();
		this.weapons = [];
		this.keys = [];
		this.healing = [];
		return arr;
	}

	public setupAmmo() {
		this.ammo = {};
		this.ammo[AmmoCaliber.p9mm] = new AmmoPile(AmmoCaliber.p9mm, false);
		this.ammo[AmmoCaliber.p44Mag] = new AmmoPile(AmmoCaliber.p44Mag, false);
		this.ammo[AmmoCaliber.r762NATO] = new AmmoPile(AmmoCaliber.r762NATO, false);
		this.ammo[AmmoCaliber.sh12gauge] = new AmmoPile(AmmoCaliber.sh12gauge, false);
	}

	constructor() {
		this.ammo = {};
		this.setupAmmo();
	}
}

export enum MovementType {
	walking,
	running,
	sneaking
}

// Base class for everything that moves in the game
export class Actor {
	private location: Tile;
	name: string;
	health: number;
	inventory: Inventory;
	equippedWeapon: Weapon;
	ducking: boolean = false;
	sneaking: boolean = false;

	// TurnState helps to distinguish if the the action taken should count as a complete turn
	// Malformed commands obviously do not count and certain actions are free (peaking, searching a room, picking items up, etc.)
	turn(_action:Function, _params:string[], _actors:ActorManager) {console.error("Not Implemented"); return TurnState.done;};

	public getLoc() {
		return this.location.location;
	}

	public getLocType() {
		return this.location.type;
	}

	public setLocation(tile: Tile) {
		this.location = tile;
	}

	public heal(health: number) {
		this.health += health;
	}

	public damage(damage: number) {
		this.health -= damage;
		if (this.health <= 0)
			this.die();
	}

	public die() {
		this.ducking = false;
		this.sneaking = false;
		this.location.resources.push(...this.inventory.empty().filter(x => x.type != WeaponType.fist));
		if (this.name == "Player")
			document.dispatchEvent(new CustomEvent("PlayerDead"));
	}

	constructor(loc: Tile, health = 10, name: string = "placeholder") {
		this.location = loc;
		this.health = health;
		this.inventory = new Inventory();
		let fists = new Weapon(WeaponType.fist);
		this.inventory.add(fists);
		this.equippedWeapon = fists;
		this.name = name;
	}
}

// The actual array of tiles representing the world
export class World {
	public map: Tile[][] = [];
	public startingTile: Tile;
	public hostageTile!: Tile;
	public maxX: number;
	public maxY: number;
	private maxWeapons: number;
	private maxAmmo: number;
	private maxHealing: number;

	public getLocationDesc(loc: Vector2D) {
		let tile = this.getTile(loc);
		let str = "You are in ";
		if (tile)
			return str + tile.desc;
		return console.error(`Bad tile: ${loc.toString()}`);
	}

	public getTile(x: number | Vector2D, y?:number) {
		if (x instanceof Vector2D) {
			if (x.x < 0 || x.y < 0 || x.x >= this.map.length || x.y >= this.map[0].length)
				return null;
			return this.map[x.x][x.y];
		}
		else if (typeof y == "number") {
			if (x < 0 || y < 0 || x >= this.map.length || y >= this.map[0].length)
				return null;
			return this.map[x][y];
		}
		return null;
	}
	
	public createWorld(): Tile[][] {
		// Empty world
		for (let x = 0; x < this.maxX; x++) {
			this.map[x] = [];
			for (let y = 0; y < this.maxY; y++) {
				this.map[x][y] = new Tile(new Vector2D(x, y));
			}
		}

		// Resources
		// Weapons
		let max = Math.round((this.maxX + this.maxY) / 2);
		let randMaxWeapons = this.maxWeapons + utils.getRandomInt(-2, max);
		for (let max = 0; max < randMaxWeapons; max++) {
			let newTile = this.getTile(Vector2D.random(this.maxX, this.maxY));
			// Only pistols spawn randomly
			newTile?.resources.push(new Weapon(utils.getRandomInt(WeaponType.pistol9mm,WeaponType.revolver)));
		}

		// Ammo
		let randMaxAmmo = this.maxAmmo + utils.getRandomInt(-2, max);
		for (let max = 0; max < randMaxAmmo; max++) {
			this.getTile(Vector2D.random(this.maxX, this.maxY))?.resources.push(new AmmoPile(utils.getRandomInt(AmmoCaliber.p9mm,AmmoCaliber.r762NATO)));
		}

		// Healing
		let randMaxHealing = this.maxHealing + utils.getRandomInt(-2, max);
		for (let x = 0; x < randMaxHealing; x++) {
			this.getTile(Vector2D.random(this.maxX, this.maxY))?.resources.push(new Healing());
		}

		// Hostages
		let hostageTile: Tile;
		let neighbors: (Tile | null)[];
		let fail: boolean;
		do {
			fail = false;
			let halfY = Math.floor(this.maxY/2);
			let randX = utils.getRandomIntExc(0, this.maxX);
			let randY = utils.getRandomIntExc(0, halfY) + halfY;
			hostageTile = this.getTile(randX, randY) as Tile;
			neighbors = [this.getTile(Vector2D.add(hostageTile.location, new Vector2D(-1,0))), this.getTile(Vector2D.add(hostageTile.location, new Vector2D(1,0)))];
			if (hostageTile.type != TileType.empty) fail = true;
			//else if (neighbors[0] == null && neighbors[1]?.type != TileType.empty) fail = true;
			//else if (neighbors[1] == null && neighbors[0]?.type != TileType.empty) fail = true;
			else if (neighbors[0]?.type != TileType.empty || neighbors[1]?.type != TileType.empty) fail = true;
		}
		while (fail)

		let locks = 0;
		hostageTile.type = TileType.hostage;
		hostageTile.desc = "a well barricaded room.";
		this.hostageTile = hostageTile;
		for (let neighbor of neighbors)
			if (neighbor instanceof Tile && neighbor.type == TileType.empty) {
				neighbor.type = TileType.locked;
				locks++;
			}
		let hostageTiles = [hostageTile.location.x-1, hostageTile.location.x, hostageTile.location.x+1];

		// Stairs
		let stairWells = 0;
		if (this.maxX < 5)
			stairWells = 1;
		else if (this.maxX <= 10)
			stairWells = 2;
		else if (this.maxX > 10)
			stairWells = 3;

		for (let counter = 0; counter < stairWells; counter++) {
			let tile: Tile;
			let loc: Vector2D;
			do {
				if (stairWells == 1) {
					tile = this.getTile(utils.getRandomIntExc(0, this.maxX), 0) as Tile;
				}
				else if (stairWells == 2) {
					let half = Math.floor(this.maxX/2);
					if (counter == 0)
						tile = this.getTile(utils.getRandomIntExc(0, half), 0) as Tile;
					else 
						tile = this.getTile(utils.getRandomIntExc(half, this.maxX), 0) as Tile;
				}
				else {
					let third = Math.floor(this.maxX/3);
					if (counter == 0)
						tile = this.getTile(utils.getRandomIntExc(0, third), 0) as Tile;
					else if (counter == 1)
						tile = this.getTile(utils.getRandomIntExc(third, third * 2), 0) as Tile;
					else 
						tile = this.getTile(utils.getRandomIntExc(third * 2, this.maxX), 0) as Tile;
				}
				loc = tile.location;
			}
			while (tile.type != TileType.empty || hostageTiles.includes(tile.location.x));
			
			tile.type = TileType.stairUp; 
			tile.desc = "a stairwell with stairs leading up.";
			for (let y = 1; y < this.maxY - 1; y++) {
				let newTile = this.getTile(loc.x, y);
				newTile!.type = TileType.stairUpDown;
				newTile!.desc = "a stairwell with stairs going up and down.";
			}
			let newTile = this.getTile(loc.x, this.maxY-1);
			newTile!.type = TileType.stairDown;
			newTile!.desc = "a stairwell with stairs going down.";
		}

		// Additional locked doors and keys
		let lockedDoors = locks;
		let tile: Tile;
		if (this.maxX < 5)
			lockedDoors += 0;
		else if (this.maxX <= 10)
			lockedDoors += 2;
		else if (this.maxX > 10)
			lockedDoors += 3;
		
		for (let x = locks; x < lockedDoors; x++) {
			do {
				tile = this.getTile(utils.getRandomIntExc(0, this.maxX), utils.getRandomIntExc(0, this.maxY)) as Tile;
			}
			while (tile?.type != TileType.empty)

			tile.type = TileType.locked;
		}

		for (let x = 0; x < lockedDoors; x++) {
			do {
				tile = this.getTile(utils.getRandomIntExc(0, this.maxX), utils.getRandomIntExc(0, this.maxY)) as Tile;
			}
			while (tile?.type == TileType.locked)

			tile.resources.push(new Key());
		}

		// Storage
		let maxStorage = 0;
		if (this.maxX < 5)
			maxStorage = 1;
		else if (this.maxX <= 10)
			maxStorage = 2;
		else if (this.maxX > 10)
			maxStorage = 3;
		for (let max = 0; max < maxStorage; max++) {
			let tile: Tile;
			do (tile = this.getTile(Vector2D.random(this.maxX, this.maxY)) as Tile)
			while (tile.type != TileType.empty)
			tile.type = TileType.storage;

			// 1 big weapon
			tile?.resources.push(new Weapon(utils.getRandomInt(WeaponType.shotgun,WeaponType.rifle)));
			// 2 keys
			tile?.resources.push(new Key());
			tile?.resources.push(new Key());
			// 2 Healing
			tile?.resources.push(new Healing(HealingType.firstaid));
			tile?.resources.push(new Healing(utils.getRandomInt(HealingType.bar,HealingType.firstaid) as HealingType));
			// 4 ammo
			tile?.resources.push(new AmmoPile(utils.getRandomInt(AmmoCaliber.p9mm,AmmoCaliber.r762NATO)));
			tile?.resources.push(new AmmoPile(utils.getRandomInt(AmmoCaliber.p9mm,AmmoCaliber.r762NATO)));
			tile?.resources.push(new AmmoPile(utils.getRandomInt(AmmoCaliber.p9mm,AmmoCaliber.r762NATO)));
			tile?.resources.push(new AmmoPile(utils.getRandomInt(AmmoCaliber.p9mm,AmmoCaliber.r762NATO)));

			tile.desc = "a storage room, there look to be lots of useful items here!";
		}
		
		return this.map;
	}

	public viewWorld(actors: ActorManager): void {
		dom.get("#worldViewer")!.style.gridTemplateColumns = `repeat(${this.maxX}, 2fr)`;
        dom.get("#worldViewer")!.textContent = "";
        for (var y: number = this.maxY - 1; y >= 0; y--) {
            var outP: string = "";
            for (var x: number = 0; x < this.maxX; x++) {
				let tile = this.map[x][y];
				let currActors = actors.getAll().filter(x => Vector2D.equals(x.getLoc(), tile.location));
				let player = "tileType07";
				let enemy = "tileType06";
				let type = tile.type;
				let classList = currActors.filter(x => x.name != "Player").length ? enemy : "";
				classList += currActors.filter(x => x.name == "Player").length ? ` ${player}` : "";
				let content = "__";
				if (type == TileType.empty) {
					classList += " tileType01";
					if (tile.resources.length > 0) {
						let str = "";
						for (let resource of tile.resources) {
							if (resource instanceof Weapon)
								str += "W";
							else if (resource instanceof AmmoPile)
								str += "A";
							else if (resource instanceof Key)
								str += "K";
							else if (resource instanceof Healing)
								str += "H";
						}
						// To keep spacing accurate, we only show 2
						if (str.length >= 2)
							content = str.slice(0, 2);
						else 
							content = `${str}_`;
					}
				}
				else if (type == TileType.storage) {
					classList += " tileType02";
					content = "SS";
				}
				else if (type == TileType.hostage) {
					classList += " tileType05";
					content = "HH";
				}
				else if (type == TileType.locked) {
					classList += " tileType04";
					content = "LL";
				}
				else {
					classList += " tileType03";
					content = "ST";
				}
				outP += `<span class="${classList}">${content}</span>`;
            }
            dom.append("#worldViewer", outP);
        }
		// 00 == wall; 01 == empty (black); 02 == storage (#0055ba); 03 == stairs (#ffc480); 04 == locked; 05 == hostage (#cf000f)
    }
	constructor(x: number, y: number) {
		let max = Math.round((x + y) / 2);
		this.maxAmmo = max;
		this.maxHealing = max * 2;
		this.maxWeapons = max;
		[this.maxX, this.maxY] = [x, y];
		this.createWorld();
		this.startingTile = this.getTile(utils.getRandomIntExc(0,this.maxX), 0) as Tile;
	}
}

export interface Commands {
	[name: string]: Function;
}

export interface Command {
	command: Function;
	args: string[];
}

export enum TurnState {
	incomplete,
	done
}

// Handles giving each actor their turn
// Rounds start with the player
// Rounds are initiated with the user hits enter and a valid instruction is given
export class TurnManager {
	actors: ActorManager;
	currActor: Actor;
	turn: number = 0;

	private resetTurn(actors: ActorManager) {
		for (let actor of actors.getAll()) {
			actor.ducking = false;
		}
	}

	public takeTurn(command: Command) {
		for (this.currActor of this.actors.getAll()) {
			if (this.currActor.health <= 0 && this.currActor.name == "Player") {
				this.actors.removeAll();
				break;
			}
			else if (this.currActor.health <= 0 && this.currActor.name != "Player") {
				this.actors.remove(this.currActor);
				continue;
			}
			
			let completed = this.currActor.turn(command.command, command.args, this.actors);
			if (!completed) break;
		}
		this.resetTurn(this.actors); 
	}

	constructor(actors: ActorManager) {
		this.actors = actors;
		this.currActor = this.actors.getAll()[0];
	}
}

// Keeps track of all actors in the game
export class ActorManager {
	private actors: Actor[];

	public getAll() {
		return this.actors;
	}

	public getByLocAndType(loc: Vector2D, isType: (x:Actor)=>Boolean) {
		return this.actors.filter(x => isType(x) && Vector2D.equals(x.getLoc(), loc));
	}

	public add(actor: Actor) {
		this.actors.push(actor);
	}

	public remove(actor: Actor) {
		utils.arrayRemove(actor, this.actors);
	}

	public removeAll() {
		this.actors = [];
	}

	constructor(actors: Actor[]) {
		this.actors = actors;
	}
}

// Handles input and output for the game
export class Console {
	private output: HTMLDivElement;
	private input: HTMLInputElement;
	private lastCommand: string[] = [];
	private lastCommandIndex: number = 0;

	public getUserInput() {
		return this.input.value;
	}

	public clearUserInput() {
		this.input.value = "";
	}

	public setLastCommand() {
		this.lastCommandIndex--;
		if (this.lastCommandIndex < this.lastCommand.length * -1)
			this.lastCommandIndex = -1;
		this.input.value = this.lastCommand.at(this.lastCommandIndex) as string;
		this.input.setSelectionRange(this.input.value.length, this.input.value.length);
	}

	public setNextCommand() {
		this.lastCommandIndex++;
		if (this.lastCommandIndex > 0)
			this.lastCommandIndex = (this.lastCommand.length - 1) * -1;
		this.input.value = this.lastCommand.at(this.lastCommandIndex) as string;
		this.input.setSelectionRange(this.input.value.length, this.input.value.length);
	}

	public printUserInput(text: string) {
		if (this.lastCommand.at(-1) != text)
			this.lastCommand.push(text);
		this.lastCommandIndex = 0;
		this.print(`> ${text}`)
	}

	public print(text: string) {
		this.output.innerHTML += `<p>${text}</p>`;
	}

	public unknownCommand(command: string) {
		this.print(`<p>I don't know what you mean: "${command}". Try typing "help" for a list of commands.</p>`);
	}

	public hardClear() {
		this.output.innerHTML = "";
		this.input.value = "";
		this.lastCommand = [];
		this.lastCommandIndex = 0;
	}

	constructor() {
		this.output = dom.get("#out") as HTMLDivElement;
		this.input = dom.get("#in") as HTMLInputElement;
	}
}