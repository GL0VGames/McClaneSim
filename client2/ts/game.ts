import {World, Vector2D, AmmoPile, Weapon, Key, WeaponType, Tile, TileType, AmmoCaliber, Healing, HealingType} from "./worldgen.js";
import { dom } from "./lib.js";

function arrayRemove (item: Object, arr: any[]) {
	arr.splice(arr.indexOf(item),1);
}

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
			arrayRemove(item, this.weapons);
		else if (item instanceof Key)
			arrayRemove(item, this.keys);
		else if (item instanceof Healing)
			arrayRemove(item, this.healing);
	}

	public checkWeapons(type?: WeaponType) {
		if (type) return this.weapons.filter(x => x.type == type);
		else return this.weapons.length;
	}

	public checkAmmo(caliber: AmmoCaliber) {
		return this.ammo[caliber].quantity;
	} 

	public checkKeys() {
		return this.keys.length;
	}

	public checkHealing(type?: HealingType) {
		if (type) return this.healing.filter(x => x.type == type);
		else return this.healing.length;
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

class Actor {
	private location: Tile;
	health: number;
	inventory: Inventory;
	inFight: boolean = false;

	// TurnState helps to distinguish if the the action taken should count as a complete turn
	// Malformed commands obviously do not count and certain actions are free (peaking, searching a room, picking items up, etc.)
	turn(_action:Function, _params:string[]) {console.error("Not Implemented"); return TurnState.done;};

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
		if (this.health < 0)
			this.die();
	}

	public die() {
		this.location.resources.push(...this.inventory.empty());
	}

	constructor(loc: Tile, health = 10) {
		this.location = loc;
		this.health = health;
		this.inventory = new Inventory();
	}
}

//{ "x": 0, "y": 0, "keys": 0, "weapons": null, "weaponClip": 0, "ammo": 0, "health": 10, "stamina": 3, "inFight": false, "turn": false, "locState": "open", "target": null };
class Player extends Actor {
	equippedWeapon: Weapon;
	world: World;

	public setLoc(direction: Vector2D) {
		let location = Vector2D.add(this.getLoc(), direction);
		this.setLocation(this.world.getTile(location) as Tile);
	}

	public turn(action: Function, params: string[]) {
		return action(params);
	};

	constructor(loc: Tile, world: World) {
		super(loc);
		this.world = world;
		let fists = new Weapon(WeaponType.fist);
		this.inventory.add(fists);
		this.equippedWeapon = fists;
	}
}

class Enemy extends Actor {
	public id: number;

	public turn() {
		console.log(`Test enemy ${this.id} turn!`);
		return TurnState.done;
	}
	constructor(loc: Tile, id: number) {
		super(loc);
		this.id = id;
	}
}

class McClaneGame {
	map: World;
	player: Player;
	actors: Actor[];
	private actionManager: ActionManager;
	private turnManager: TurnManager;
	private console: Console;

	constructor() {
		this.map = new World(12, 12);
		this.player = new Player(this.map.startingTile, this.map);
		let testEnemy1 = new Enemy(this.map.getTile(Vector2D.add(this.player.getLoc(), new Vector2D(0,1))) as Tile, 0);
		let testEnemy2 = new Enemy(this.map.getTile(Vector2D.add(this.player.getLoc(), new Vector2D(0,1))) as Tile, 1);
		this.actors = [this.player, testEnemy1, testEnemy2];

		this.console = new Console();
		// Print starting location
		this.console.print(`${this.map.getLocationDesc(this.player.getLoc()) as string}.`);

		// Turn management
		this.turnManager = new TurnManager(this.actors);
		this.actionManager = new ActionManager(this.map, this.player, this.console);

		// Respond to input
		dom.get("#in")!.addEventListener("keydown", (e) => {
			let userInput = "";
			if (e.code == "Enter") {
				userInput = this.console.getUserInput();
				this.console.printUserInput(userInput);
				this.console.clearUserInput();
				let command = this.actionManager.processCommand(userInput);
				if (command)
					this.turnManager.takeTurn(command);
				else
					this.console.unknownCommand(userInput);
			}
			else if (e.code == "ArrowUp") 
				this.console.setLastCommand();
		});
	}
}

enum TurnState {
	incomplete,
	done
}

class TurnManager {
	actors: Actor[] = [];
	currActor: Actor;
	turn: number = 0;

	public addActor(actor: Actor) {
		this.actors.push(actor);
	}

	public takeTurn(command: Command) {
		for (this.currActor of this.actors) {
			let completed = this.currActor.turn(command.command, command.args);
			if (!completed) break;
		}
	}

	constructor(actors: Actor[]) {
		this.actors.push(...actors);
		this.currActor = this.actors[0];
	}
}

interface Commands {
	[name: string]: Function;
}

interface Command {
	command: Function;
	args: string[];
}

class Console {
	private output: HTMLDivElement;
	private input: HTMLInputElement;
	private lastCommand: string = "";

	public getUserInput() {
		return this.input.value;
	}

	public clearUserInput() {
		this.input.value = "";
	}

	public setLastCommand() {
		this.input.value = this.lastCommand;
	}

	public printUserInput(text: string) {
		this.lastCommand = text;
		this.print(`> ${text}`)
	}

	public print(text: string) {
		this.output.innerHTML += `<p>${text}</p>`;
	}

	public unknownCommand(command: string) {
		this.print(`<p>I don't know what you mean: "${command}". Try typing "help" for a list of commands.</p>`);
	}

	constructor() {
		this.output = dom.get("#out") as HTMLDivElement;
		this.input = dom.get("#in") as HTMLInputElement;
	}
}

class ActionManager {
	world: World;
	player: Player;
	console: Console;

	public processCommand(input: string) {
		let parts = input.replace(/\s+/g, " ").split(" ");
        let command = parts[0];
        let args = (parts.length > 1) ? parts.slice(1, parts.length) : [];

		if (this.commands[command])
			return {command: this.commands[command], args} as Command;
		else return undefined;
	}

	public commands: Commands = {
		dev: (param:string[]) => {
			let viewer = dom.get("#worldViewer");
			if (param[0] == "map")
				if (viewer.style.display != "none") {
					viewer.style.display = "none";
					this.console.print("Map hidden");
				}
				else {
					viewer.style.display = "grid";
					this.world.viewWorld();
					this.console.print("Map visible");
				}
			return TurnState.incomplete;
		},
		help: (param: string[]) => {
			let printString = "Type 'help navigation' or 'help combat' for more details on actions.";

			if(param.length >= 1)
			{
				if (param[0] == "navigation")
						printString = "<b>go [left/right]</b>: Navigate between rooms on the same floor <br /><b>go [up/down]</b>: Navigate between floors in the presence of stairs  <br /><b>sneak [left/right/up/down]</b>: enter a room quietly (NOT IMPLEMENTED).  <br /><b>peek [left/right/up/down]</b>: Peek into the next room without entering it  <br /><b>investigate/describe/desc [item/room/myself]</b>: Get more information about an item, the room you're in, or yourself.  <br /><b>pickup</b>: Grab any collectable item in the room  <br /><b>unlock [left/right/up/down]</b>: Use up a key to unlock a door <br /><b>shoot [left/right/up/down]</b>: Use a bullet to loudly shoot out a lock";
				else // "combat"
					printString = "<b>shoot</b>: Fire your gun at an enemy <br /><b>punch</b>: Punch an enemy <br /><b>duck/hide</b>: Take cover to avoid being shot <br /><b>reload</b>: Reload your gun inside or outside of combat <br /><b>run [left/right]</b>: Run from a fight into the specified room";
			}
			this.console.print(printString);
			return TurnState.incomplete;
        },
		greet: (param:string[]) => {
			this.console.print(`Hello ${param[0]}, welcome to McClane Simulator!`);
			return TurnState.incomplete;
		},
		go: (param:string[]) => {return this.direction(param[0])},
		move: (param:string[]) => {return this.direction(param[0])},
		peek: (param:string[]) => {return this.peek(param[0])},
		investigate: (param:string[]) => {return this.investigate(param[0])},
		describe: (param:string[]) => {return this.investigate(param[0])},
		desc: (param:string[]) => {return this.investigate(param[0])},
		pickup: (param:string[]) => {return this.pickup(param[0])},
		_: (param:string[]) => {},
	}

	private direction(direction: string) {
		let playerLocation = this.player.getLoc();
		let tileType = this.player.getLocType();
		let turnState = TurnState.incomplete;
        if (!this.player.inFight) {
            var returnString = "Use 'go [left/right/up/down]' to move in that direction.";
            if (direction == "up" || direction == "u") {
                if (tileType == TileType.stairUp || tileType == TileType.stairUpDown) {
                    this.player.setLoc(new Vector2D(0, 1));
                    returnString = "You go up...";
					turnState = TurnState.done;
                }
                else if (tileType == TileType.stairDown)
                    returnString = "I'm sorry, the building has ceased to up.";
                else
                    returnString = "Unless you can phase through matter, you're not going that way.";
            }
            else if (direction == "down" || direction == "d") {
                if (tileType == TileType.stairDown || tileType == TileType.stairUpDown) {
                    this.player.setLoc(new Vector2D(0, -1));
                    returnString = "You go down...";
					turnState = TurnState.done;
                }
                else if (tileType == TileType.stairUp)
                    returnString = "I'm sorry, the building has ceased to down.";
                else
                    returnString = "Unless you can phase through matter, you're not going that way.";
            }
            else if (direction == "left" || direction == "l") {
				let dir = new Vector2D(-1, 0);
				let attemptLoc = this.world.getTile(Vector2D.add(playerLocation, dir));
				if (attemptLoc) {
					let attemptType = attemptLoc.type;
					if (attemptType !== TileType.locked) {
						this.player.setLoc(dir);
						returnString = "You go left...";
						turnState = TurnState.done;
					} 
					else
						returnString = "That door is locked mate!";
				}
				else
					returnString = "I'm sorry, the building has ceased to left.";
			}
            else if (direction == "right" || direction == "r") {
				let dir = new Vector2D(1, 0);
				let attemptLoc = this.world.getTile(Vector2D.add(playerLocation, dir));
				if (attemptLoc) {
					let attemptType = attemptLoc.type;
					if (attemptType !== TileType.locked) {
						this.player.setLoc(dir);
						returnString = "You go right...";
						turnState = TurnState.done;
					} 
					else
						returnString = "That door is locked.";
				}
				else
                    returnString = "I'm sorry, the building has ceased to right.";
            }

            if (returnString !== null) {
				// Can't use playerLocation here because we updated the player's location in the above code
                this.console.print(`${returnString} ${this.world.getLocationDesc(this.player.getLoc()) as string}.`);
            }

            if (this.player.getLocType() == TileType.hostage) {
                this.console.print("hostage fight trigger. UNIMPLEMENTED")//triggerFight("hostage");
            }
        } else 
            this.console.print("You cannot leisurely walk out of a fight! Try running out instead.");
		return turnState;
    }

	private peek(direction: string) {
		let printString = "Use 'peek [left/right/up/down]' to peek into the next room.";
		let playerLoc = this.player.getLoc();
		let playerType = this.player.getLocType();

		if ((direction == "left" || direction == "l")) {
			let peekTile = this.world.getTile(Vector2D.add(playerLoc, new Vector2D(-1, 0)));
			if (!peekTile) printString = "The building has ceased to left. You stare intently at the wall.";
			else if (peekTile.type == TileType.locked)
				printString = "You stare at a locked door. This would be easier if you unlocked the door.";
			else
				printString = `You peek into ${peekTile.desc}.`;
		}
		else if ((direction == "right" || direction == "r")) {
			let peekTile = this.world.getTile(Vector2D.add(playerLoc, new Vector2D(1, 0)));
			if (!peekTile) printString = "The building has ceased to right. You stare intently at the wall.";
			else if (peekTile.type == TileType.locked)
				printString = "You stare at a locked door. This would be easier if you unlocked the door.";
			else printString = `You peek into ${peekTile.desc}.`;
		}
		else if ((direction == "down" || direction == "d")) {
			let peekTile = this.world.getTile(Vector2D.add(playerLoc, new Vector2D(0, -1)));
			if (peekTile && (playerType == TileType.stairDown || playerType == TileType.stairUpDown))
				printString = `You peek into ${peekTile.desc}.`;
			else if (!peekTile && playerType == TileType.stairUp)
				printString = "The building has ceased to down. You stare intently at the floor.";
			else
				printString = "There are no stairs here. You focus your mind on the floor but nothing happens.";
		}
		else if ((direction == "up" || direction == "u")) {
			let peekTile = this.world.getTile(Vector2D.add(playerLoc, new Vector2D(0, 1)));
			if (peekTile && (playerType == TileType.stairUp || playerType == TileType.stairUpDown))
				printString = `You peek into ${peekTile.desc}.`;
			else if (!peekTile && playerType == TileType.stairDown)
				printString = "The building has ceased to up. You stare intently at the ceiling.";
			else
				printString = "There are no stairs here. You focus your mind on the ceiling but nothing happens.";
		}
		this.console.print(printString);
		return TurnState.incomplete;
	}

	private investigate(param: string) {
		let printString = "Use 'investigate [item/room/myself]' to get more information about an item, the room you're in, or yourself.";
	
		if (param == "room" || param == "location") {
			let location = this.world.getTile(this.player.getLoc()) as Tile;
			printString = `You quickly look around the room. The room has `;
			if (location.resources.length > 0) {
				let weapons = location.checkWeapons().length;
				let ammo = location.checkAmmo().length;
				let keys = location.checkKeys();
				let healing = location.checkHealing().length;
				let total = (!!weapons as any) + (!!ammo as any) + (!!keys as any) + (!!healing as any);
				
				if (weapons) {
					printString += `${weapons} ${weapons == 1 ? "gun" : "guns"}`;
					total--;
					printString += (total > 1) ? ", " : (total ? ", and " : "");
				}
				if (ammo) {
					printString += `${ammo} ${ammo == 1 ? "pile" : "piles"} of ammo`;
					total--;
					printString += (total > 1) ? ", " : (total ? ", and " : "");
				}
				if (keys) {
					printString += `${keys} ${keys == 1 ? "key" : "keys"}`;
					total--;
					printString += (total > 1) ? ", " : (total ? ", and " : "");
				}
				if (healing)
					printString += `${healing} healing ${healing == 1 ? "item" : "items"}`;
				printString += ".";
			}
			else printString += "a decorative plant.";
		}

		else if (param == "player" || param == "p" || param == "me" || param == "m" || param == "myself") {
			let inv = this.player.inventory;
			let [pistol, revolver, rifle, shotgun] = [(inv.checkWeapons(WeaponType.pistol9mm) as Weapon[]).length, (inv.checkWeapons(WeaponType.revolver) as Weapon[]).length, (inv.checkWeapons(WeaponType.rifle) as Weapon[]).length, (inv.checkWeapons(WeaponType.shotgun) as Weapon[]).length];
			let weaponString = (pistol ? `${pistol} pistol(s), ` : "") + 
			(revolver ? `${revolver} revolver(s), ` : "") +
			(rifle ? `${rifle} rifle(s), ` : "") +
			(shotgun ? `${shotgun} shotgun(s), ` : "");

			let [p9mm, p44Mag, r762NATO, sh12gauge] = [inv.checkAmmo(AmmoCaliber.p9mm), inv.checkAmmo(AmmoCaliber.p44Mag), inv.checkAmmo(AmmoCaliber.r762NATO), inv.checkAmmo(AmmoCaliber.sh12gauge)];
			let ammoString = (p9mm ? `${p9mm} pistol rounds, ` : "") + 
			(p44Mag ? `${p44Mag} revolver rounds, ` : "") +
			(r762NATO ? `${r762NATO} rifle rounds, ` : "") +
			(sh12gauge ? `${sh12gauge} shotgun rounds, ` : "");

			let [chips, apples, bars, firstaid] = [(inv.checkHealing(HealingType.chips) as Healing[]).length, (inv.checkHealing(HealingType.apple) as Healing[]).length, (inv.checkHealing(HealingType.bar) as Healing[]).length, (inv.checkHealing(HealingType.firstaid)as Healing[]).length];
			let healingString = (chips ? `${chips} bag(s) of chips, ` : "") + 
			(apples ? `${apples} apple(s), ` : "") +
			(bars ? `${bars} energy bar(s), ` : "") +
			(firstaid ? `${firstaid} FirstAid kit(s), ` : "");

			printString = `You have:<br />
							${this.player.health} health,</br />
							${weaponString}${weaponString.length ? "and your two fists," : "your two fists,"}<br />
							${ammoString.length ? ammoString + "<br />" : ""}
							${healingString.length ? healingString + "<br />" : ""}
							and ${this.player.inventory.checkKeys()} keys.`;
		}

        this.console.print(printString);
		return TurnState.incomplete;
    }

	private pickup(param: string) {
		let printString = "Use 'pickup [guns/ammo/keys/healing items/all]' to collect any guns, ammo, keys, and/or healing items in your current room.";
		let tile = this.world.getTile(this.player.getLoc());
		if (tile?.resources?.length || 0 > 0) {
			printString = "You pickup";
			if (param == "guns" || param == "gun" || param == "all") {
				let guns = tile?.checkWeapons();
				if (typeof guns != "undefined" && guns.length > 0) {
					this.player.inventory.add(guns);
					for (let gun of guns) {
						printString += ` 1 ${gun.name}, `;
						tile?.remove(gun);
					}
				}
				else printString = "Ain't no guns here!";
			}
			if (param == "ammo" || param == "all") {
				let ammo = tile?.checkAmmo();
				if (typeof ammo != "undefined" && ammo.length > 0) {
					this.player.inventory.add(ammo);
					for (let amm of ammo) {
						printString += ` 1 ${amm.desc.split(" ").filter(x=>x!="a").join(" ")} (${amm.name}) with ${amm.quantity} rounds, `;
						tile?.remove(amm);
					}
				}
				else printString = "Ain't no ammo here!";
			}
			if (param == "keys" || param == "key" || param == "all") {
				let keys = tile?.checkKeys(true) as Key[];
				if (typeof keys != "undefined" && keys.length > 0) {
					this.player.inventory.add(keys);
					printString += ` ${keys.length} keys, `;
					for (let key of keys) {
						tile?.remove(key);
					}
				}
				else printString = "Ain't no keys here!";
			}
			if (param == "healing" || param == "all") {
				let healing = tile?.checkHealing();
				if (typeof healing != "undefined" && healing.length > 0) {
					this.player.inventory.add(healing);
					for (let heal of healing) {
						printString += ` 1 ${heal.name}, `; 
						tile?.remove(heal);
					}
				}
				else printString = "Ain't no healing items here!";
			}
			if (!["guns", "gun", "ammo", "keys", "key", "healing", "all"].includes(param))
				printString = "I regret to inform you that you can't take the furniture. Refer to the IKEA catalog to buy your own.";
		}
		else printString = "You grasp at the air.";

		this.console.print(printString);
		return TurnState.incomplete;
	}

	constructor(world: World, player: Player, console: Console) {
		this.world = world;
		this.player = player;
		this.console = console;
	}
}

window.addEventListener('DOMContentLoaded', function() {
	const game = new McClaneGame();
    game.map.viewWorld();
});
