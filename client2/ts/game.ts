import {World, Vector2D, AmmoPile, Weapon, Key, Weapons, Tile, TileType} from "./worldgen.js";
import { dom } from "./lib.js";

function arrayRemove (item: Object, arr: any[]) {
	arr.splice(arr.indexOf(item),1);
}

class Inventory {
	private ammo: AmmoPile[] = [];
	private weapons: Weapon[] = [];
	private keys: Key[] = [];

	public add(item: AmmoPile | Weapon | Key) {
		if (item instanceof AmmoPile)
			this.ammo.push(item);
		else if (item instanceof Weapon)
			this.weapons.push(item);
		else if (item instanceof Key)
			this.keys.push(item);
	}

	public remove(item: AmmoPile | Weapon | Key) {
		if (item instanceof AmmoPile)
			arrayRemove(item, this.ammo);
		else if (item instanceof Weapon)
			arrayRemove(item, this.weapons);
		else if (item instanceof Key)
			arrayRemove(item, this.keys);
	}

	public empty() {
		let arr: (AmmoPile | Weapon | Key)[] = (this.ammo as any[]).concat(this.weapons, this.keys);
		this.ammo = [];
		this.weapons = [];
		this.keys = [];
		return arr;
	}

	constructor() {}
}

class Actor {
	private location: Tile;
	health: number;
	inventory: Inventory;
	inFight: boolean = false;

	turn(_action:Function, _params:string[]) {console.error("Not Implemented")};

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
		action(params);
	};

	constructor(loc: Tile, world: World) {
		super(loc);
		this.world = world;
		let fists = new Weapon(Weapons.fist);
		this.inventory.add(fists);
		this.equippedWeapon = fists;
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
		this.actors = [this.player];

		this.console = new Console();
		this.turnManager = new TurnManager(this.player);
		this.actionManager = new ActionManager(this.map, this.player, this.console);

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

			if (e.code == "Enter" || e.code == "ArrowUp") {
				
			}
		})
	}
}

class TurnManager {
	actors: Actor[] = [];
	currActor: Actor;
	turn: number = 0;

	public takeTurn(command: Command) {
		for (this.currActor of this.actors) {
			this.currActor.turn(command.command, command.args);
		}
	}

	constructor(player: Player) {
		this.actors.push(player);
		this.currActor = player;
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
		help: (param: string[]) => {
			let printString = "Type 'help navigation' or 'help combat' for more details on actions.";

			if(param.length >= 1)
			{
				if (param[0] == "navigation")
						printString = "<b>go [left/right]</b>: Navigate between rooms on the same floor <br /><b>go [up/down]</b>: Navigate between floors in the prescence of stairs  <br /><b>sneak [left/right/up/down]</b>: enter a room quietly (NOT IMPLEMENTED).  <br /><b>investigate/describe/desc [left/right]</b>: to peek into the next room without entering it  <br /><b>pickup</b>: Grab any collectable item in the room  <br /><b>unlock [left/right/up/down]</b>: Use up a key to unlock a door <br /><b>shoot [left/right/up/down]</b>: Use a bullet to loudly shoot out a lock";
				else // "combat"
					printString = "<b>shoot</b>: Fire your gun at an enemy <br /><b>punch</b>: Punch an enemy <br /><b>duck/hide</b>: Take cover to avoid being shot <br /><b>reload</b>: Reload your gun inside or outside of combat <br /><b>run [left/right]</b>: Run from a fight into the specified room";
			}
			this.console.print(printString);
        },
		greet: (param:string[]) => {
			this.console.print(`Hello ${param[0]}, welcome to McClane Simulator!`);
		},
		go: (param:string[]) => {this.direction(param[0])},
		move: (param:string[]) => {this.direction(param[0])},
		dev: (param:string[]) => {
			let viewer = dom.get("#worldViewer");
			if (param[0] == "map")
				if (viewer.style.display != "none") {
					viewer.style.display = "none";
					this.console.print("Map hidden");
				}
				else {
					viewer.style.display = "grid";
					this.console.print("Map visible");
				}
		},
		_: (param:string[]) => {},
	}

	private direction(direction: string) {
		let playerLocation = this.player.getLoc();
		let tileType = this.player.getLocType();
        if (!this.player.inFight) {
            var returnString = "Use 'go [left/right/up/down]' to move in that direction.";
            if (direction == "up" || direction == "u") {
                if (tileType == TileType.stairUp || tileType == TileType.stairUpDown) {
                    this.player.setLoc(new Vector2D(0, 1));
                    returnString = "You go up...";
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
					} 
					else
						returnString = "That door is locked.";
				}
				else
                    returnString = "I'm sorry, the building has ceased to right.";
            }

            if (returnString !== null) {
				// Can't use playerLocation here because we updated the player's location in the above code
                this.console.print(`${returnString} ${this.world.getLocationDesc(this.player.getLoc()) as string}`);
            }

            if (this.player.getLocType() == TileType.hostage) {
                this.console.print("hostage fight trigger. UNIMPLEMENTED")//triggerFight("hostage");
            }
        } else {
            this.console.print("You cannot leisurely walk out of a fight! Try running out instead.");
        }
		console.log(this.player.getLoc().toString());
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
