import {World, Vector2D, AmmoPile, Weapon, Key, WeaponType, Tile, TileType, AmmoCaliber, Healing, HealingType, Actor, TurnState, TurnManager, Console, Command, Commands, ActorManager, MovementType} from "./engine.js";
import { dom, utils } from "./lib.js";

//{ "x": 0, "y": 0, "keys": 0, "weapons": null, "weaponClip": 0, "ammo": 0, "health": 10, "stamina": 3, "inFight": false, "turn": false, "locState": "open", "target": null };
class Player extends Actor {
	world: World;

	public setLoc(direction: Vector2D) {
		let location = Vector2D.add(this.getLoc(), direction);
		this.setLocation(this.world.getTile(location) as Tile);
	}

	public equip(weaponType: WeaponType) {
		let pistols = (this.inventory.checkWeapons(WeaponType.pistol9mm) as Weapon[])?.filter(x=>x!=this.equippedWeapon) || [];
		let dualPistols = (this.inventory.checkWeapons(WeaponType.dualPistol9mm) as Weapon[])?.filter(x=>x!=this.equippedWeapon) || [];
		let revolvers = (this.inventory.checkWeapons(WeaponType.revolver) as Weapon[])?.filter(x=>x!=this.equippedWeapon) || [];
		let rifles = (this.inventory.checkWeapons(WeaponType.rifle) as Weapon[])?.filter(x=>x!=this.equippedWeapon) || [];
		let shotguns = (this.inventory.checkWeapons(WeaponType.shotgun) as Weapon[])?.filter(x=>x!=this.equippedWeapon) || [];
		let fists = (this.inventory.checkWeapons(WeaponType.fist) as Weapon[])?.filter(x=>x!=this.equippedWeapon) || [];
		let equippedWeapon;
		// check for dual pistols
		if (weaponType == WeaponType.pistol9mm && this.equippedWeapon.type == WeaponType.pistol9mm && pistols.length >= 1) {
			let dualPistols = this.inventory.createDualPistols(this.equippedWeapon, pistols[0]) as Weapon;
			equippedWeapon = dualPistols;
		}
		else if (weaponType == WeaponType.pistol9mm && pistols.length > 0)
			equippedWeapon = pistols[0];
		else if (weaponType == WeaponType.dualPistol9mm && dualPistols.length > 0)
			equippedWeapon = dualPistols[0];
		else if (weaponType == WeaponType.revolver && revolvers.length > 0)
			equippedWeapon = revolvers[0];
		else if (weaponType == WeaponType.rifle && rifles.length > 0)
			equippedWeapon = rifles[0];
		else if (weaponType == WeaponType.shotgun && shotguns.length > 0)
			equippedWeapon = shotguns[0];
		else if (weaponType == WeaponType.fist) 
			equippedWeapon = fists[0];
		
		if (equippedWeapon)
			this.equippedWeapon = equippedWeapon;
		
		// Sending null indicates that the actor doesn't have the requested weapon	
		return equippedWeapon;
	}

	public turn(action: Function, params: string[], actors: ActorManager) {
		this.ducking = false;
		return action(params);
	};

	constructor(loc: Tile, world: World) {
		super(loc);
		this.world = world;
		this.name = "Player";
		this.health = 20; 
	}
}

class Enemy extends Actor {
	private static names = ["Franco", "Tony", "Alexander", "Marco", "Kristoff", "Eddie", "Uli", "Heinrich", "Fritz", "James", "Theo", "Hans", "Karl"];
	private turnCounter: number;
	private currCount: number;
	private console: Console;
	private map: World;
	private sharing: boolean = false;
	public alerted: boolean = false;

	public setLoc(direction: Vector2D) {
		let location = Vector2D.add(this.getLoc(), direction);
		this.setLocation(this.map.getTile(location) as Tile);
	}

	public turn(_action:Function, _params: string[], actors: ActorManager) {
		this.ducking = false;
		let stationaryActions = ["looks around and picks his nose discretely", "whistles a little ditty to himself", "looks around the room and picks up a penny", "takes out their pistol and points it around saying, \"pew, pew\"", "stands over the table", "leans against the wardrobe and lights up"];
		let currActors = actors.getByLocAndType(this.getLoc(), x => x instanceof Player && !x.sneaking);
		// Shoot at player
		if (currActors.length) {
			this.alerted = true;
			let player = currActors[0];
			if (this.equippedWeapon.clip.currRounds > 0) {
				let hitChance = utils.getRandomInt(0,1);
				if (hitChance) {
					this.equippedWeapon.shoot(player);
					this.console.print(`The terrorist ${this.name} shoots you and deals ${this.equippedWeapon.damage} damage.`);
				}
				else this.console.print(`The terrorist ${this.name} shoots at you but misses.`);
			}
			else {
				if (this.equippedWeapon.type == WeaponType.fist) {
					let hitChance = utils.getRandomInt(0,1);
					if (hitChance) {
						player.damage(this.equippedWeapon.damage);
						this.console.print(`The terrorist ${this.name} punches you and deals ${this.equippedWeapon.damage} damage.`);
					}
					else this.console.print(`The terrorist ${this.name} goes to punch you but you fake ${utils.getRandomInt(0,1) ? "right": "left"} and dodge the attack.`);
				}
				else {
					this.equippedWeapon.reload(this.inventory.getAmmo(this.equippedWeapon.clip.caliber));
					if (this.equippedWeapon.clip.currRounds > 0)
					this.console.print(`The terrorist ${this.name} reloads their gun.`);
					else {
						let printString;
						let weapons = this.inventory.checkWeapons().filter(x => x != this.equippedWeapon);
						this.equippedWeapon = weapons[weapons.length];
						this.equippedWeapon.reload(this.inventory.getAmmo(this.equippedWeapon.clip.caliber));
						printString = `The terrorist ${this.name} swaps to a ${this.equippedWeapon.name}.`;
						if (this.equippedWeapon.clip.currRounds == 0) {
							this.equippedWeapon = weapons.filter(x => x.type == WeaponType.fist)[0] as Weapon;
							printString = `The terrorist ${this.name} holsters their weapon and approaches with fists raised`;
						}
						this.console.print(printString);
					}
				}
			}
		}
		// move
		else if (this.currCount == this.turnCounter) {
			this.alerted = false;
			if (this.name != "Karl" && this.name != "Hans") {
				let direction = utils.getRandomInt(0,1);
				let dirL = new Vector2D(-1, 0);
				let dirR = new Vector2D(1, 0);
				let startActors = actors.getByLocAndType(this.getLoc(), x => x instanceof Player);

				let attemptLoc = this.map.getTile(Vector2D.add(this.getLoc(), direction ? dirL : dirR));
				if (attemptLoc) {
					if (startActors.length) this.sharing = true;
					this.setLoc(direction ? dirL : dirR);

					// Alert player if enemy moves onto their tile
					let newActors = actors.getByLocAndType(this.getLoc(), x => x instanceof Player);
					if (newActors.length) {
						this.console.print(`The terrorist ${this.name} walks into the room but don't seem to notice you!`);
						this.sharing = true;
					}
					else if (newActors.length == 0 && this.sharing) {
						this.console.print(`The terrorist ${this.name} walks out of the room to the ${direction ? "left" : "right"}.`);
						this.sharing = false;
					}
				}
			}
			this.currCount = 0;
		}
		else if (this.currCount >= this.turnCounter)
			this.currCount = 0;
		else {
			this.alerted = false;
			this.currCount++;
			let newActors = actors.getByLocAndType(this.getLoc(), x => x instanceof Player);
			if (newActors.length )
				this.console.print(`The terrorist ${this.name} ${stationaryActions[utils.getRandomIntExc(0, stationaryActions.length)]} but doesn't seem to notice you.`);
		}

		if (dom.get("#worldViewer").style.display = "grid") {
			this.map.viewWorld(actors);
		}

		return TurnState.done;
	}

	static getNamesList() {
		return this.names.map(x => x.toLowerCase());
	}

	constructor(loc: Tile, console: Console, map: World, name?: string) {
		super(loc);
		// Enemy.names.length - 2 to avoid Hans and Karl who are only spawned in the hostage room
		this.name = name || Enemy.names[utils.getRandomIntExc(0, Enemy.names.length-2)];
		
		// Add pistol and ammo
		this.inventory.add(new Key());

		let weapon = new Weapon(WeaponType.pistol9mm);
		weapon.clip.currRounds = weapon.clip.maxRounds;
		this.inventory.add(weapon);
		this.equippedWeapon = weapon;

		let ammo = new AmmoPile(AmmoCaliber.p9mm, true);
		this.inventory.add(ammo);

		// Ensure enemies move randomly instead of all at once
		this.turnCounter = utils.getRandomInt(1,2);
		this.currCount = utils.getRandomInt(0,1);

		this.console = console;
		this.map = map;
	}
}

class McClaneGame {
	map: World;
	player: Player;
	actors: ActorManager;
	private actionManager: ActionManager;
	private turnManager: TurnManager;
	private console: Console;

	public spawnEnemies(total: number) {
		// Patrolling guards
		for (let curr = 0; curr < total; curr++) {
			let randTile = this.map.getTile(new Vector2D(utils.getRandomIntExc(0, this.map.maxX), utils.getRandomIntExc(1, this.map.maxY))) as Tile;
			this.actors.add(new Enemy(randTile, this.console, this.map));
		}

		// Hans
		let hans = new Enemy(this.map.hostageTile, this.console, this.map, "Hans");
		let hansGun = new Weapon(WeaponType.rifle);
		hansGun.clip.currRounds = hansGun.clip.maxRounds;
		hans.inventory.add(hansGun);
		hans.equippedWeapon = hansGun;
		this.actors.add(hans);

		// Karl
		let karl = new Enemy(this.map.hostageTile, this.console, this.map, "Karl");
		let karlGun = new Weapon(WeaponType.rifle);
		karlGun.clip.currRounds = karlGun.clip.maxRounds;
		karl.inventory.add(karlGun);
		karl.equippedWeapon = karlGun;
		this.actors.add(karl);
	}

	public keyDown(e: KeyboardEvent) {
		let userInput = "";
		if (e.code == "Enter") {
			userInput = this.console.getUserInput();
			this.console.printUserInput(userInput);
			this.console.clearUserInput();
			let command = this.actionManager.processCommand(userInput);
			if (command) {
				this.turnManager.takeTurn(command);
				let [playerLoc, hostageLoc] = [this.player.getLoc(), this.map.hostageTile.location];
				let enemies = this.actors.getAll().filter(x => x instanceof Enemy && Vector2D.equals(hostageLoc, x.getLoc()) && x.health > 0) as Enemy[];
				if (Vector2D.equals(playerLoc, hostageLoc) && enemies?.length == 0)
					document.dispatchEvent(new CustomEvent("PlayerWin"));
			}
			else
				this.console.unknownCommand(userInput);
		}
		else if (e.code == "ArrowUp") {
			e.preventDefault();
			e.stopPropagation();
			this.console.setLastCommand();
		}
		else if (e.code == "ArrowDown")
			this.console.setNextCommand();
	}

	constructor() {
		this.console = new Console();
		this.map = new World(8, 12);
		this.player = new Player(this.map.startingTile, this.map);
		this.actors = new ActorManager([this.player]);
		this.spawnEnemies(Math.round(this.map.maxY / 2));

		// Print starting location
		this.console.print(`${this.map.getLocationDesc(this.player.getLoc()) as string}.`);

		// Turn management
		this.turnManager = new TurnManager(this.actors);
		this.actionManager = new ActionManager(this.map, this.player, this.actors, this.console);

		// Respond to input
		dom.get("#in")!.addEventListener("keydown", e => this.keyDown(e)); 

		// Click anywhere to focus on the input
		dom.get("html")!.addEventListener("click", e => {
			dom.get("#in")!.focus();
		});

		// Game over
		document.addEventListener("PlayerDead", e => {
			this.keyDown = () => {};
			(dom.get("#in") as HTMLInputElement).disabled = true;
			this.turnManager = new TurnManager(new ActorManager([]));
			utils.alert("lose");
		});

		// Win
		document.addEventListener("PlayerWin", e => {
			this.keyDown = () => {};
			(dom.get("#in") as HTMLInputElement).disabled = true;
			this.turnManager = new TurnManager(new ActorManager([]));
			utils.alert("win");
		})
	}
}
	
class ActionManager {
	world: World;
	player: Player;
	actors: ActorManager;
	console: Console;

	public processCommand(input: string) {
		let parts = input.toLowerCase().replace(/\s+/g, " ").split(" ");
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
					this.world.viewWorld(this.actors);
					this.console.print("Map visible");
				}
			return TurnState.incomplete;
		},
		help: (param: string[]) => {
			let printString = "Type 'help navigation' or 'help combat' for more details on actions.";

			if(param.length >= 1)
			{
				if (param[0] == "navigation")
					printString = `
						<b>go [left/right]</b>: Navigate between rooms on the same floor <br />
						<b>go [up/down]</b>: Navigate between floors in the presence of stairs  <br />
						<b>sneak/stealth [left/right/up/down]</b>: enter a room quietly. Is broken by shooting your a gun or running <br />
						<b>hide</b>: Take cover before a guard notices you <br />
						<b>peek [left/right/up/down]</b>: Peek into the next room without entering it  <br />
						<b>wait</b>: Wait for one turn <br />
						<b>investigate/describe/desc/search [item/room/myself]</b>: Get more information about an item, the room you're in, or yourself  <br />
						<b>pickup/take [item/all]</b>: Grab any or all collectable items in the current room  <br />
						<b>equip [weapon type]</b>: Equips the specified weapon type<br />
						<b>reload</b>: Refills the weapon's magazine with the appropriate rounds (if you have them)<br />
						<b>unlock [left/right/up/down]</b>: Use up a key to unlock a door <br />
						<b>shoot [left/right/up/down]</b>: Use a bullet to loudly shoot out a lock <br /> 
						<b>eat [food item]</b>: Eat food to regain health <br />
						<b>apply [firstaid]</b>: Apply a FirstAid kit to regain health`;
				else if (param[0] == "combat")
					printString = `
						<b>shoot [guard/terrorist/baddie]</b>: Fire your gun at an enemy. Breaks stealth <br />
						<b>punch/hit [guard/terrorist/baddie]</b>: Punch an enemy <br />
						<b>takedown [guard/terrorist/baddie]</b>: Perform a silent takedown on an enemy if stealthed <br />
						<b>duck</b>: Take cover to avoid being shot <br />
						<b>hide</b>: Take cover before a guard notices you <br />
						<b>reload</b>: Reload your gun inside or outside of combat <br />
						<b>run [left/right/up/down]</b>: Run from a fight into the specified room. Breaks stealth`;
			}
			this.console.print(printString);
			return TurnState.incomplete;
		},
		greet: (param:string[]) => {
			this.console.print(`Hello ${param[0]}, welcome to McClane Simulator!`);
			return TurnState.incomplete;
		},
		go: (param:string[]) => {return this.direction(param[0])},
		wait: (_param: string[]) => {this.console.print("You hunker down and wait for a minute."); return TurnState.done},
		move: (param:string[]) => {return this.direction(param[0])},
		peek: (param:string[]) => {return this.peek(param[0])},
		look: (param:string[]) => {return this.peek(param[0])},
		investigate: (param:string[]) => {return this.investigate(param[0])},
		describe: (param:string[]) => {return this.investigate(param[0])},
		desc: (param:string[]) => {return this.investigate(param[0])},	
		search: (param:string[]) => {return this.investigate(param[0])},	
		pickup: (param:string[]) => {return this.pickup(param[0])},
		take: (param:string[]) => {return this.pickup(param[0])},
		shoot: (param:string[]) => {return this.shoot(param)},
		reload: (param:string[]) => {
			let printString = "";
			let turnState = TurnState.done;
			if (this.player.equippedWeapon.type != WeaponType.fist) {
				let ammoPile = this.player.inventory.getAmmo(this.player.equippedWeapon.clip.caliber);
				let reloaded = this.player.equippedWeapon.reload(ammoPile); 
				printString = `You put ${reloaded} rounds in your ${this.player.equippedWeapon.name}'s magazine.`;
				if (this.player.equippedWeapon.clip.currRounds == this.player.equippedWeapon.clip.maxRounds)
					printString += ` You are fully loaded and ready for combat!  You have ${ammoPile.quantity} rounds left.`;
				else if (ammoPile.quantity == 0 && reloaded > 0) {
					printString += " You are out of spares.";
					turnState = TurnState.incomplete;
				}
				if (reloaded == 0 && this.player.equippedWeapon.clip.currRounds == 0) {
					printString = `You eject your clip but realize you have no spare rounds to reload with. You hope your ${this.player.equippedWeapon.clip.currRounds} rounds will be enough.`;
					turnState = TurnState.incomplete;
				}
			}
			else {
				printString = "You can't reload your fists!";
				turnState = TurnState.incomplete;
			}

			this.console.print(printString);
			return turnState;
		},
		equip: (param:string[]) => {return this.equip(param)},
		duck: (_param:string[]) => {return this.duck()},	
		hide: (_param:string[]) => {
			let locs = ["dive behind a cubicle", "climb into a standing wardrobe", "dive under a table", "stand behind the door", "blend in with the decorative plant", "climb into the drop ceiling", "climb into some boxes"];
			let enemies: Enemy[] = this.actors.getByLocAndType(this.player.getLoc(), x => x instanceof Enemy) as Enemy[];
			let alerted = enemies.filter(x => x.alerted);
			if (alerted.length == 0) {
				this.player.sneaking = true;
				this.console.print(`You ${locs[utils.getRandomIntExc(0, locs.length)]} and feel sufficiently hidden.`);
				return TurnState.done;
			}
			else {
				this.console.print(`Do you really think the terrorists looking at you right now won't notice you suddenly trying to hide?`);
				return TurnState.incomplete;
			}
		},	
		run: (param:string[]) => {return this.run(param[0])},
		punch: (param:string[]) => {return this.punch(param[0])},
		takedown: (param:string[]) => {return this.punch(param[0])},
		takeout: (param:string[]) => {return this.punch(param[0])},
		hit: (param:string[]) => {return this.punch(param[0])},
		unlock: (param:string[]) => {return this.unlock(param)},
		eat: (param:string[]) => {return this.consume(param)},
		consume: (param:string[]) => {return this.consume(param)},
		apply: (param:string[]) => {
			if (["office", "first", "aid", "firstaid"].includes(param[0])) {
				let firstaid = this.player.inventory.checkHealing(HealingType.firstaid) as Healing[];
				if (firstaid.length) {
					this.console.print(`You apply ${firstaid[0].desc} You regain ${firstaid[0].heal} hp.`);
					this.player.heal(firstaid[0].heal);
					this.player.inventory.remove(firstaid[0]);
					return TurnState.done;
				}
				else {
					this.console.print("You don't have any FirstAid kits to apply.");
					return TurnState.incomplete;
				}
			}
		},
		sneak: (param:string[]) => {return this.sneak(param[0])},
		stealth: (param:string[]) => {return this.sneak(param[0])},
		//_: (param:string[]) => {},
	}

	private direction(direction: string, movementType = MovementType.walking) {
		let playerLocation = this.player.getLoc();
		let tileType = this.player.getLocType();
		let turnState = TurnState.incomplete;
		let actors = this.actors.getByLocAndType(this.player.getLoc(), x => x instanceof Enemy);
		let speed = "go";
		if (movementType == MovementType.running)
			speed = "run";
		else if (movementType == MovementType.sneaking)
			speed = "sneak";
		if ((actors.length && (movementType == MovementType.running || movementType == MovementType.sneaking)) || !actors.length) {
			var returnString = "Use 'go [left/right/up/down]' to move in that direction.";
			if (direction == "up" || direction == "u") {
				if (tileType == TileType.stairUp || tileType == TileType.stairUpDown) {
					this.player.setLoc(new Vector2D(0, 1));
					returnString = `You ${speed} up...`;
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
					returnString = `You ${speed} down...`;
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
						returnString = `You ${speed} left...`;
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
						returnString = `You ${speed} right...`;
						turnState = TurnState.done;
					} 
					else
						returnString = "That door is locked.";
				}
				else
					returnString = "I'm sorry, the building has ceased to right.";
			}

			let enemies = this.actors.getByLocAndType(this.player.getLoc(), x => x instanceof Enemy);
			let enemyString = "";
			if (enemies.length)
				enemyString = `There are ${enemies.length} guards in the room.`;

			// Can't use playerLocation here because we updated the player's location in the above code
			this.console.print(`${returnString} ${this.world.getLocationDesc(this.player.getLoc()) as string} ${enemyString}`);

			if (this.player.getLocType() == TileType.hostage) {
				this.console.print("A WILD BUNDLE OF HOSTAGES (and two terrorists) APPEAR!");
			}
		} 
		else
			this.console.print("There are enemies here, you cannot leisurely walk out of a fight! Try running out instead.");
		return turnState;
	}

	private peek(direction: string) {
		let printString = "Use 'peek [left/right/up/down]' to peek into the next room.";
		let playerLoc = this.player.getLoc();
		let playerType = this.player.getLocType();
		let searchEnemies = (x: Actor) => x instanceof Enemy;

		if ((direction == "left" || direction == "l")) {
			let peekTile = this.world.getTile(Vector2D.add(playerLoc, new Vector2D(-1, 0)));
			if (!peekTile) printString = "The building has ceased to left. You stare intently at the wall.";
			else if (peekTile.type == TileType.locked)
			printString = "You stare at a locked door. This would be easier if you unlocked the door.";
			else {
				printString = `You peek into ${peekTile.desc}.`;
				let enemies = this.actors.getByLocAndType(peekTile!.location, searchEnemies);
				if (enemies.length)
					printString += ` There are ${enemies.length} guards in the room.`;
			}
		}
		else if ((direction == "right" || direction == "r")) {
			let peekTile = this.world.getTile(Vector2D.add(playerLoc, new Vector2D(1, 0)));
			if (!peekTile) printString = "The building has ceased to right. You stare intently at the wall.";
			else if (peekTile.type == TileType.locked)
				printString = "You stare at a locked door. This would be easier if you unlocked the door.";
			else {
				printString = `You peek into ${peekTile.desc}.`;
				let enemies = this.actors.getByLocAndType(peekTile!.location, searchEnemies);
				if (enemies.length)
					printString += ` There are ${enemies.length} guards in the room.`;
			}
		}
		else if ((direction == "down" || direction == "d")) {
			let peekTile = this.world.getTile(Vector2D.add(playerLoc, new Vector2D(0, -1)));
			if (peekTile && (playerType == TileType.stairDown || playerType == TileType.stairUpDown))
				printString = `You peek into ${peekTile.desc}.`;
			else if (!peekTile && playerType == TileType.stairUp)
				printString = "The building has ceased to down. You stare intently at the floor.";
			else {
				printString = "There are no stairs here. You focus your mind on the floor but nothing happens.";
				let enemies = this.actors.getByLocAndType(peekTile!.location, searchEnemies);
				if (enemies.length)
					printString += ` There are ${enemies.length} guards in the room.`;
			}		
		}
		else if ((direction == "up" || direction == "u")) {
			let peekTile = this.world.getTile(Vector2D.add(playerLoc, new Vector2D(0, 1)));
			if (peekTile && (playerType == TileType.stairUp || playerType == TileType.stairUpDown))
				printString = `You peek into ${peekTile.desc}.`;
			else if (!peekTile && playerType == TileType.stairDown)
				printString = "The building has ceased to up. You stare intently at the ceiling.";
			else {
				printString = "There are no stairs here. You focus your mind on the ceiling but nothing happens.";
				let enemies = this.actors.getByLocAndType(peekTile!.location, searchEnemies);
				if (enemies.length)
					printString += ` There are ${enemies.length} guards in the room.`;
			}
		}
		this.console.print(printString);
		return TurnState.incomplete;
	}

	private investigate(param: string) {
		let printString = "Use 'investigate [equipped/room/myself]' to get more information about an item, the room you're in, or yourself.";
	
		if (param == "room" || param == "location") {
			let location = this.world.getTile(this.player.getLoc()) as Tile;
			printString = location.type == TileType.empty ? `You quickly look around the room. The room has ` : `You quickly look around. You are in ${location.desc} You see `;
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
			let enemies = this.actors.getByLocAndType(location.location, x => x instanceof Enemy);
			if (enemies.length)
				printString += ` There are ${enemies.length} guards in the room.`;
		}

		else if (param == "player" || param == "p" || param == "me" || param == "m" || param == "myself" || param == "self") {
			let inv = this.player.inventory;
			let [dualPistols, pistol, revolver, rifle, shotgun] = [(inv.checkWeapons(WeaponType.dualPistol9mm) as Weapon[]).length, (inv.checkWeapons(WeaponType.pistol9mm) as Weapon[]).length, (inv.checkWeapons(WeaponType.revolver) as Weapon[]).length, (inv.checkWeapons(WeaponType.rifle) as Weapon[]).length, (inv.checkWeapons(WeaponType.shotgun) as Weapon[]).length];
			let weaponString = (pistol ? `${pistol} pistol(s), ` : "") + 
			(dualPistols ? `${dualPistols} akimbo pistols, `: "") +
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
							${weaponString}${weaponString.length ? "and your two fists," : "your two fists,"} with your ${this.player.equippedWeapon.name} currently equipped <br />
							${ammoString.length ? ammoString + "<br />" : ""}
							${healingString.length ? healingString + "<br />" : ""}
							and ${this.player.inventory.checkKeys()} keys.`;
		}
		else if (["equipped", "gun", "weapon", "item"].includes(param)) {
			let equipped = this.player.equippedWeapon;
			if (equipped.type != WeaponType.fist)
				printString = `Your weapon has ${equipped.clip.currRounds}/${equipped.clip.maxRounds} rounds and deals ${equipped.damage} damage.`;
			else printString = `You look at ${equipped.desc}`;
		}

		this.console.print(printString);
		return TurnState.incomplete;
	}

	private pickup(param: string) {
		let printString = "Use 'pickup/take [guns/ammo/keys/healing items/all]' to collect any guns, ammo, keys, and/or healing items in your current room.";
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
				else if (param != "all") printString = "Ain't no guns here!";
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
				else if (param != "all") printString = "Ain't no ammo here!";
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
				else if (param != "all") printString = "Ain't no keys here!";
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
				else if (param != "all") printString = "Ain't no healing items here!";
			}
			if (!["guns", "gun", "ammo", "keys", "key", "healing", "all"].includes(param))
				printString = "I regret to inform you that you can't take the furniture. Refer to the IKEA catalog to buy your own.";
		}
		else printString = "You grasp at the air.";

		this.console.print(printString);
		return TurnState.incomplete;
	}

	private shoot(param: string[]) {
		let printString = "Use 'shoot [enemy/terrorist/guard]' or 'shoot lock [dir]'";
		let returnState = TurnState.incomplete;
		if (this.player.inventory.checkWeapons().length > 1) {
			if (this.player.equippedWeapon.clip.currRounds > 0) {
				if (Enemy.getNamesList().concat(["terrorist", "enemy", "baddie", "bad", "guard"]).includes(param[0])) {
					let actors = this.actors.getByLocAndType(this.player.getLoc(), x => x instanceof Enemy);
					if (actors.length) {
						this.player.sneaking = false;
						let target = actors[0];
						// 20% chance of missing
						if (utils.getRandomInt(0,4) == 0) {
							this.player.equippedWeapon.shoot();
							let reasons = ["you can't quite get a steady aim", "you miscalculated wind resistance", "you underestimated how puffy their coat is", "you mixed Metric and Imperial units", "you slip on a banana peel", "you sneeze", "you have a tickle in your throat", "the sun was in your eyes", "you saw something shiny", "you couldn't see the North Star"];
							printString = `You shoot at the terrorist ${target.name} but ${reasons[utils.getRandomIntExc(0,reasons.length)]} and your shot misses.`;
						}
						else {
							this.player.equippedWeapon.shoot(target);
							let damage = this.player.equippedWeapon.damage;
							damage = target.ducking ? damage / 2 : damage;
							printString = `You shoot the terrorist ${target.name} and deal ${damage}. `;
							if (target.health <= 0)
								printString += `You kill ${target.name} and he drops several items on the ground.`;
						}
						this.console.print(printString);
						returnState = TurnState.done;
					}
					else {
						this.console.print("You whip your gun out and frantically point it around the empty room. There's no one to shoot. Don't waste your ammo.");
					}
				}
				else if (param[0] == "lock") {
					let currLoc = this.player.getLoc();
					if (["up", "down"].includes(param[1])) {
						this.console.print("There's no lock there. Don't waste your ammo.");
					}
					else if (param[1] == "left") {
						let left = this.world.getTile(Vector2D.add(currLoc, new Vector2D(-1, 0)));
						if (left?.type == TileType.locked) {
							this.player.sneaking = false;
							this.player.equippedWeapon.shoot();
							left.type = TileType.empty;
							this.console.print("With a loud bang you shoot out the lock. The door now swings unimpeded.");
							returnState = TurnState.done;
						}
						else {
							this.console.print("There's no lock there. Don't waste your ammo.");
						}
					}
					else if (param[1] == "right") {
						let right = this.world.getTile(Vector2D.add(currLoc, new Vector2D(1, 0)));
						if (right?.type == TileType.locked) {
							this.player.sneaking = false;
							this.player.equippedWeapon.shoot();
							right.type = TileType.empty;
							this.console.print("With a loud bang you shoot out the lock. The door now swings unimpeded.");
							returnState = TurnState.done;
						}
						else
							this.console.print("There's no lock there. Don't waste your ammo.");
					}
					else
						this.console.print(printString);
				}
				else
					this.console.print(printString);
			}
			else
				this.console.print("You pull the trigger, but nothing happens! Reload or find some bullets to shoot with.");
		}
		else 
			this.console.print("Spitballs are ineffective. Find a gun and bullets to shoot instead.");
		
		return returnState;
	}

	private equip(param: string[]) {
		let printString = "Use 'equip [weapon]' to equip a weapon from your inventory.";
		let weapon;
		if (["pistol", "akimbo", "revolver", "magnum", "rifle", "bullpup", "shotgun", "12", "12gauge", "fists", "fist"].includes(param[0])) {
			if (param[0] == "pistol") weapon = this.player.equip(WeaponType.pistol9mm);
			else if (param[0] == "akimbo") weapon = this.player.equip(WeaponType.dualPistol9mm);
			else if (param[0] == "revolver" || param[0] == "magnum") weapon = this.player.equip(WeaponType.revolver);
			else if (param[0] == "rifle" || param[0] == "bullpup") weapon = this.player.equip(WeaponType.rifle);
			else if (param[0] == "shotgun" || param[0] == "12" || param[0] == "12gauge") weapon = this.player.equip(WeaponType.shotgun);
			else if (param[0] == "fists" || param[0] == "fist") weapon = this.player.equip(WeaponType.fist);
			if (weapon) {
				printString = `You equip ${weapon?.desc}.`;
				if (weapon.type == WeaponType.dualPistol9mm) 
					printString = `You realize you have two pistols and two hands.` + printString;
			}
			else printString = `You fumble around in your pockets before realizing you don't have a spare ${param}.`;
		}
		
		this.console.print(printString);
		return TurnState.incomplete;
	}

	private duck() {
		let actors = this.actors.getByLocAndType(this.player.getLoc(), x => x instanceof Enemy);
		if (actors.length) {
			this.player.ducking = true;
			this.console.print("You dive to the floor out of the way. You feel confident you're a smaller target.");
			return TurnState.done;
		}
		else  {
			this.console.print("... duck goose? There's nobody here...");
			return TurnState.incomplete;
		}
	}

	private run(param: string) {
		if (["up", "u", "right", "r", "down", "d", "left", "l"].includes(param)) {
			let actors = this.actors.getByLocAndType(this.player.getLoc(), x => x instanceof Enemy);
			if (actors.length) {
				this.player.sneaking = false;
				let state = this.direction(param, MovementType.running);
				return state;
			}
			else {
				this.console.print("There's nobody here to run from. Do your exercise later.");
				return TurnState.incomplete;
			}
		}
		else {
			this.console.print("Use 'run [left/right/up/down]' to move in that direction.");
			return TurnState.incomplete;
		}
	}

	private punch(param: string) {
		let printString = "Use 'punch [item/enemy/terrorist/guard]'.";
		let turnState = TurnState.incomplete;
		if (Enemy.getNamesList().concat(["terrorist", "enemy", "baddie", "bad", "guard"]).includes(param)) {
			let actors = this.actors.getByLocAndType(this.player.getLoc(), x => x instanceof Enemy);
			if (actors.length) {
				let target = actors[0];
				let fists = (this.player.inventory.checkWeapons(WeaponType.fist) as Weapon[])[0];
				let hitChance = utils.getRandomInt(0,4);
				if (this.player.sneaking) hitChance++;
				if (hitChance == 0) {
					let reasons = ["you can't quite get a steady aim", "you miscalculated wind resistance", "you underestimated how puffy their coat is", "you mixed Metric and Imperial units", "you slip on a banana peel", "you sneeze", "you have a tickle in your throat", "the sun was in your eyes", "you saw something shiny", "you couldn't see the North Star"];
					printString = `You punch at the terrorist ${target.name} but ${reasons[utils.getRandomIntExc(0,reasons.length)]} and you miss.`;
					turnState = TurnState.done;
				}
				else {
					let damage = this.player.sneaking ? fists.damage * 4 : fists.damage;
					target.damage(damage);
					printString = `You punch the terrorist ${target.name} and deal ${damage} damage.`;
					if (this.player.sneaking) {
						printString = `You quietly sneak up to the terrorist ${target.name}, perform a takedown, and deal ${damage} damage.`;
						this.player.sneaking = false;
					}
					if (target.health <= 0)
						printString += ` You kill ${target.name} and he drops several items on the ground.`;
					turnState = TurnState.done;
				}
			}
			else printString = "Punching the air will not make enemies appear.";
		}
		else if (param == "sofas")
			printString = ("Wow, so soft.");
		else if (param == "chairs")
			printString = ("RESPECT THE CHAIRS, AND THE CHAIRS WILL RESPECT YOU");
		else if (param == "tables")
			printString = ("That's just great. Now where are we supposed to put things?");
		else if (param == "desks")
			printString = ("I'll have you know that those were artisanal.");
		else if (param == "plants")
			printString = ("PLANTS?!");
		else if (param == "potato" || param == "chips")
			printString = ("Crunchy.");
		else if (param == "windows")
			printString = ("Contrary to what you think, glass lacerations are NOT fun.");
		else if (typeof param != "undefined")
			printString = ("You get the feeling that this isn't helping anything.");

		this.console.print(printString);
		return turnState;
	}

	private unlock(param: string[]) {
		let turnState = TurnState.incomplete;
		let printString = "Use 'unlock [left/right/up/down]' to use up a key to unlock a door";
		let playerLocation = this.player.getLoc();
		let tileType = this.player.getLocType();
		let key = this.player.inventory.getKey();
		if (key) {
			if (param[0] == "up" || param[0] == "u") {
				if (tileType == TileType.stairUp || tileType == TileType.stairUpDown)
					printString = "You instinctually try the handle only to find the door unlocked.";
				else if (tileType == TileType.stairDown)
					printString = "I'm sorry, the building has ceased to up.";
				else
					printString = "Unless you can phase through matter, you're not going that way.";
			}
			else if (param[0] == "down" || param[0] == "d") {
				if (tileType == TileType.stairDown || tileType == TileType.stairUpDown)
					printString = "You instinctually try the handle only to find the door unlocked.";
				else if (tileType == TileType.stairUp)
					printString = "I'm sorry, the building has ceased to down.";
				else
					printString = "Unless you can phase through matter, you're not going that way.";
			}
			else if (param[0] == "left" || param[0] == "l") {
				let dir = new Vector2D(-1, 0);
				let attemptLoc = this.world.getTile(Vector2D.add(playerLocation, dir));
				if (attemptLoc) {
					let attemptType = attemptLoc.type;
					if (attemptType !== TileType.locked)
						printString = "That door is already unlocked.";
					else {
						attemptLoc.type = TileType.empty;
						this.player.inventory.remove(key);
						printString = "You use a key and unlock the door.";
					}
				}
				else
					printString = "I'm sorry, the building has ceased to left.";
			}
			else if (param[0] == "right" || param[0] == "r") {
				let dir = new Vector2D(1, 0);
				let attemptLoc = this.world.getTile(Vector2D.add(playerLocation, dir));
				if (attemptLoc) {
					let attemptType = attemptLoc.type;
					if (attemptType !== TileType.locked)
						printString = "That door is already unlocked.";
					else {
						attemptLoc.type = TileType.empty;
						this.player.inventory.remove(key);
						printString = "You use a key and unlock the door.";
					}
				}
				else
					printString = "I'm sorry, the building has ceased to right.";
			}
		}
		else printString = "You dig through you pockets just in case, but you don't have any keys.";
		
		this.console.print(printString);
		return turnState;
	}

	private consume(param: string[]) {
		if (param[0] == "chips" || param[0] == "bag") {
			let chips = this.player.inventory.checkHealing(HealingType.chips) as Healing[];
			if (chips.length) {
				this.console.print(`You eat ${chips[0].desc}. You regain ${chips[0].heal} hp.`);
				this.player.heal(chips[0].heal);
				this.player.inventory.remove(chips[0]);
				return TurnState.done;
			}
			else {
				this.console.print("You don't have any bags of chips to eat!");
				return TurnState.incomplete;
			}
		}
		else if (param[0] == "apple") {
			let apples = this.player.inventory.checkHealing(HealingType.apple) as Healing[];
			if (apples.length) {
				this.console.print(`You eat ${apples[0].desc}. You regain ${apples[0].heal} hp.`);
				this.player.heal(apples[0].heal);
				this.player.inventory.remove(apples[0]);
				return TurnState.done;
			}
			else {
				this.console.print("You don't have any apples to eat!");
				return TurnState.incomplete;
			}
		}
		else if (param[0] == "energy" || param[0] == "bar") {
			let bars = this.player.inventory.checkHealing(HealingType.bar) as Healing[];
			if (bars.length) {
				this.console.print(`You eat ${bars[0].desc}. You regain ${bars[0].heal} hp.`);
				this.player.heal(bars[0].heal);
				this.player.inventory.remove(bars[0]);
				return TurnState.done;
			}
			else {
				this.console.print("You don't have any energy bars to eat!");
				return TurnState.incomplete;
			}
		}
		else {
			this.console.print("Use 'eat [food item]' to eat food and regain health.");
			return TurnState.incomplete
		}
	}

	private sneak(param: string) {
		if (["up", "u", "right", "r", "down", "d", "left", "l"].includes(param)) {
			this.player.sneaking = true;
			return this.direction(param, MovementType.sneaking);
		}
		else {
			this.console.print("Use 'sneak [left/right/up/down]' to move in that direction.");
			return TurnState.incomplete;
		}
	}

	constructor(world: World, player: Player, actors: ActorManager, console: Console) {
		this.world = world;
		this.player = player;
		this.console = console;
		this.actors = actors;
	}
}

window.addEventListener('DOMContentLoaded', function() {
	const game = new McClaneGame();
	game.map.viewWorld(game.actors);
});
