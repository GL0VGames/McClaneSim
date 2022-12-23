var enemy = {};
var guards = { "move": null, "arr": [] };
var guardPosY = [];

$(function () {
    var COMMANDS = [
        {
            name: "help",
            handler: help
        },

        {
            name: "greet",
            handler: function (args) {
                outputToConsole("Hello " + args[0] + ", welcome to Console.");
            }
        },
        {
            name: "go",
            handler: direction
        },
        {
            name: "move",
            handler: direction
        },
        {
            name: "describe",
            handler: investigate
        },
        {
            name: "desc",
            handler: investigate
        },
        {
            name: "pickup",
            handler: pickup
        },
        {
            name: "shoot",
            handler: shoot
        },
        {
            name: "duck",
            handler: duck
        },
        {
            name: "hide",
            handler: duck
        },
        {
            name: "reload",
            handler: reload
        },
        {
            name: "run",
            handler: run
        },
        {
            name: "investigate",
            handler: investigate
        },
        {
            name: "punch",
            handler: punch
        },
        {
            name: "unlock",
            handler: unlock
        },
        {
            name: "test",
            handler: test
        },
    ];

    var pId = 1;
    var x;
    var y;
    var hostageTime = 0;
    var winning = false;
    var guardMoveTime = 0;

    x = Math.round(Math.random() * 10) + 3;
    y = (x >= 9) ? 13 - x : Math.round(Math.random() * 10) + 3;
    y += (y == 2) ? 1 : ((y == 1) ? 2 : ((y === 0) ? 3 : 0));
    console.log("world is: " + x + "," + y);

    world = worldgen(x, y, 0);
    var playa = { "x": 0, "y": 0, "keys": 0, "weapons": null, "weaponClip": 0, "ammo": 0, "health": 10, "stamina": 3, "inFight": false, "turn": false, "locState": "open", "target": null };
    enemy = {
        "health": 30, "stamina": 3, "weapon": "pistol", "locState": "open",
        "turn": function () {
            if (Math.random() > 0.6) {
                outputToConsole("They take a shot at you!");
                shootPlayer(playa);
                if (playa.health <= 0) {
                    outputToConsole("You lose. Next time, try to avoid running out of health.");
                    outputToConsole = function () {};
                }
            }
            else {
                hide(this);
            }
        }
    };

    function test(param) {
        if (param == 1 || param == 0) {
            playa = { "x": 0, "y": 0, "keys": 0, "weapons": null, "weaponClip": 0, "ammo": 0, "health": 10, "stamina": 3, "inFight": false, "turn": false, "locState": "open", "target": null };
            if (param == 1)
                outputToConsole("Testing new world gen....");
            else
                outputToConsole("Running old world gen....")
            try {world = worldgen(x, y, param)}
            catch(err) {
                outputToConsole("Failed: " + err + "  <br /> Running old world gen....");
                world = worldgen(x, y, 0);
            }
            outputToConsole("Done!");
            outputToConsole(whereAmI(playa.x, playa.y, null, world));
        } else {
            outputToConsole("This command can seriously mess with your game, only mess with it if you are a dev and know what you're doing please!");
        }
    }

    function makeGuard(newx, newy) {
        function checkGuardY(posy) {
            for (var i = 0; i < guardPosY.length; i++) {
                if (guardPosY[i] == posy) return false;
            }
            return true;
        }
        if (!(!!newx && !!newy) && newx !== 0 && newy !== 0 ) {
            var posy = 0;
            if (!!!guardPosY[guardPosY.length - 1]) {
                posy = Math.floor(Math.random() * y);
                guardPosY.push(posy);
            } else {
                posy = Math.floor(Math.random() * y);
                while (!checkGuardY(posy)) {
                    posy = Math.floor(Math.random() * y);
                }
            }

            var posx = Math.floor(Math.random() * (x - 1));
        } else {
            var posx = newx;
            var posy = newy;
            outputToConsole("That was loud, I hope no one noticed...");
        }

        var newGuard =
        {
            "x": posx,
            "y": posy,
            "health": 20,
            "stamina": 3,
            "weapon": "pistol",
            "locState": "open",
            "dir": Math.random() < 0.5 ? -1 : 1,
            "inFight": false,
            "attackedYet": false
        };

        console.log("guard at: " + newGuard.x + "," + newGuard.y);

        if ((!!newx && !!newy) || newx === 0 || newy === 0) {
            playa.target = newGuard;
            debugger;
            newGuard.inFight = true;
            triggerFight("guard");
        }

        guards.arr.push(newGuard);
    }

    guards.move = function () {
        var tempx;
        for (var i = 0; i <= guards.arr.length; i++) {
            if (!!guards.arr[i] && !guards.arr[i].inFight) {
                tempx = guards.arr[i].x;
                guards.arr[i].x += guards.arr[i].dir;
                if (guards.arr[i].x >= x || guards.arr[i].x < 0) {
                    guards.arr[i].dir *= -1;
                    guards.arr[i].x = (tempx + guards.arr[i].dir);
                } else if (world[guards.arr[i].x][guards.arr[i].y].entity != "hostage") {
                    world[guards.arr[i].x][guards.arr[i].y].entity = "guard";

                } else if (world[guards.arr[i].x][guards.arr[i].y].entity == "hostage") {
                    guards.arr[i].x += guards.arr[i].dir;
                    if (guards.arr[i].x >= x || guards.arr[i].x < 0) {
                        guards.arr[i].dir *= -1;
                        guards.arr[i].x = (tempx + guards.arr[i].dir);
                    }
                }

                if (guards.arr[i].x === playa.x && guards.arr[i].y === playa.y && guards.arr[i].health > 0) {
                    playa.target = guards.arr[i];
                    guards.arr[i].inFight = true;
                    triggerFight("guard");
                }
            }
        }
    };

    makeGuard();
    makeGuard();

    //  world[i] = level, world[][j] = room

    var w = undefined;
    var message;
    function startWorker() {
        if (typeof (Worker) !== "undefined") {
            if (typeof (w) == "undefined") {
                w = new Worker("webWorker.js"); //defining file that will run on new thread
                w.onmessage = function (event) {
                    message = JSON.parse(event.data);
                    if (playa.stamina < 3) {
                        playa.stamina += message.stamina;
                    }
                    if (playa.target == enemy) {
                        hostageTime += message.stamina;
                        if (hostageTime == 1) {
                            outputToConsole("You have 30 seconds before the hostages are killed!");
                        }
                        if (hostageTime == 30 && winning === false) {
                            playa.health = 0;
                            outputToConsole("You lose, the terrorists killed the hostages before you could save them!");
                        }
                    }
                    guardMoveTime++;
                    if (guardMoveTime == 5) {
                        guards.move();
                        guardMoveTime = 0;
                    }
                };
            }
            return 0;
        }
        else {
            outputToConsole("Sorry, your browser does not support Web Workers...  Please use the latest version of Chrome, Internet Explorer, or Firefox.");
            return 1;
        }
    }

    startWorker();

    var lastInput = [];

    outputToConsole(whereAmI(playa.x, playa.y, null, world));
    if (playa.x == hostage.x && playa.y == hostage.y) {
        triggerFight("hostage");
    }

    function whereAmI(wx, wy, delay, world) {

        if (hostage.x === wx && hostage.y === wy)
            return world[wx][wy].text;// + " IN THE NEXT ROOM!";

        return world[wx][wy].text + ((world[wx][wy].type === null || world[wx][wy].type === "path") ? "." : " and " + ((world[wx][wy].type === "ammo" || world[wx][wy].type === "stairs") ? "" : "a ") + world[wx][wy].type + ".");
    }

    function outputToConsole(text) {
        $("#out").append("<p id = 'block" + pId + "'>" + text + "</p>");
        pId = pId + 1;
        updateOut();
    }

    function help(param) {
        var printString = "Type 'help navigation' or 'help combat' for more details on actions.";

        if(param.length >= 1)
        {
            switch(param[0])
            {
                case "navigation":
                    printString = "<b>go [left/right]</b>: Navigate between rooms on the same floor <br /><b>go [up/down]</b>: Navigate between floors in the prescence of stairs  <br /><b>sneak [left/right/up/down]</b>: enter a room quietly (NOT IMPLEMENTED).  <br /><b>investigate/describe/desc [left/right]</b>: to peek into the next room without entering it  <br /><b>pickup</b>: Grab any collectable item in the room  <br /><b>unlock [left/right/up/down]</b>: Use up a key to unlock a door <br /><b>shoot [left/right/up/down]</b>: Use a bullet to loudly shoot out a lock";
                    break;

                case "combat":
                printString = "<b>shoot</b>: Fire your gun at an enemy <br /><b>punch</b>: Punch an enemy <br /><b>duck/hide</b>: Take cover to avoid being shot <br /><b>reload</b>: Reload your gun inside or outside of combat <br /><b>run [left/right]</b>: Run from a fight into the specified room";
                    break;
            }
        }

        outputToConsole(printString);
    }

    function canGoHere(newX, newY)
    {
        if(newX < 0 || newX >= x || newY < 0 || newY >= y || world[newX][newY].type === "locked")
            return false;

        if(newY !== playa.y && newX === playa.x && !(world[newX][newY].type === "stair" && world[playa.x][playa.y].type == "stair"))
            return false;

        return true;
    }

    function investigate(param)
    {
        var printString = "Use 'investigate [left/right]' to investigate a room that you're not in.";

        if (param.length >= 1) {
            var inRange = false;
            var cur = param[0];

            if ((cur == "left" || cur == "l") && playa.x > 0) {
                if (canGoHere(playa.x - 1, playa.y)) {
                    printString = whereAmI(playa.x - 1, playa.y, null, world);
                    inRange = true;
                }
            }

            else if ((cur == "right" || cur == "r") && playa.x < x - 1) {
                if (canGoHere(playa.x + 1, playa.y)) {
                    printString = whereAmI(playa.x + 1, playa.y, null, world);
                    inRange = true;
                }
            }

            else if ((cur == "down" || cur == "d") && playa.y > 0) {
                if (canGoHere(playa.x, playa.y - 1)) {
                    printString = whereAmI(playa.x, playa.y - 1, null, world);
                    inRange = true;
                }
            }

            else if ((cur == "up" || cur == "u") && playa.y < y - 1) {
                if (canGoHere(playa.x, playa.y + 1)) {
                    printString = whereAmI(playa.x, playa.y + 1, null, world);
                    inRange = true;
                }
            }

            else if ((cur == "gun" || cur == "pistol" || cur == "revolver" || cur == "weapon" || cur == "g" || cur == "w" || cur == "dual")) {
                cur = (cur == "dual") ? "dual pistols" : cur;
                printString = (playa.weapons === null) ? "You don't have a " + cur + " other than your fists!" : "You have " + playa.weaponClip + " rounds in your clip and " + playa.ammo + " spares.";
                inRange = true;
            }

            else if (cur == "player" || cur == "p" || cur == "me" || cur == "m" || cur == "myself") {
                printString = "You " + ((playa.weapons === null) ? "don't have a pistol but" : (playa.weapons === "pistol") ? "have a pistol and" : "have dual pistols and") + "you always have your fists.  <br />You have " + playa.health + " health points.  <br />You have " + playa.keys + " keys.  <br />You have " + playa.stamina + " stamina.";
                inRange = true;
            }

            if (!inRange)
                printString = "There's no room there.";
        }

        outputToConsole(printString);
    }

    function pickup(param) {
        var printString = null;

        if(world[playa.x][playa.y].type === "weapon")
        {
            if (playa.weapons === "pistol") {
                playa.weapons = "dual pistols";
                printString = "You realize that you have two guns and two hands.";
            }

            else if (playa.weapons === null) {
                printString = "You have acquired a revolver.";
                playa.weapons = "pistol";
            }
        }

        else if(world[playa.x][playa.y].type === "ammo")
        {
            var rounds = (Math.round(Math.random() * 5) + 1);
            printString = "You acquired " + rounds + " bullets.";
            playa.ammo += rounds;
        }

        else if (world[playa.x][playa.y].type === "key") {
            playa.keys++;
            printString = "You got a key! You now have a total of " + playa.keys + " keys.";
        }

        if(printString !== null)
            world[playa.x][playa.y].type = null;

        if(printString === null)
            printString = "I regret to inform you that you can't take the furniture. Refer to the IKEA catalog to buy your own.";

        outputToConsole(printString);
        outputToConsole(whereAmI(playa.x, playa.y, null, world));
    }

    function desc() {
        outputToConsole(world[playa.x][playa.y].text);
    }

    function direction(direction) {
        if (!playa.inFight) {
            var returnString = "Use 'go [left/right/up/down]' to move in that direction";
            if (direction == "up" || direction == "u") {
                if (playa.y < y - 1 && (world[playa.x][playa.y].type == "stairs" && world[playa.x][playa.y + 1].type == "stairs" && world[playa.x][playa.y].pathDir == "up")) {
                    playa.y++;
                    returnString = "You go up.";
                }
                else if (playa.y >= y - 1) {
                    returnString = "I'm sorry, the building has ceased to up.";
                }
                else if (!(world[playa.x][playa.y].type == "stairs" && world[playa.x][playa.y + 1].type == "stairs" && world[playa.x][playa.y].pathDir == "up")) {
                    returnString = "Unless you can phase through matter, you're not going that way.";
                }
            }
            else if (direction == "down" || direction == "d") {
                if (playa.y > 0 && (world[playa.x][playa.y].type == "stairs" && world[playa.x][playa.y - 1].type == "stairs" && world[playa.x][playa.y - 1].pathDir == "up")) {
                    playa.y--;
                    returnString = "You go down.";
                }
                else if (playa.y <= 0) {
                    returnString = "I'm sorry, the building has ceased to down.";
                }
                else if (!(world[playa.x][playa.y].type == "stairs" && world[playa.x][playa.y - 1].type == "stairs" && world[playa.x][playa.y - 1].pathDir == "up")) {
                    returnString = "Unless you can phase through matter, you're not going that way.";
                }
            }
            else if (direction == "left" || direction == "l") {
                if (playa.x > 0 && world[playa.x - 1][playa.y].type !== "locked") {
                    playa.x--;
                    returnString = "You go left.";
                } else if (playa.x > 0 && world[playa.x - 1][playa.y].type == "locked") {
                    returnString = "That door is locked mate!";
                }
                else {
                    returnString = "I'm sorry, the building has ceased to left.";
                }
            }
            else if (direction == "right" || direction == "r") {
                if (playa.x < x - 1 && world[playa.x + 1][playa.y].type !== "locked") {
                    playa.x++;
                    returnString = "You go right.";
                } else if (playa.x < x - 1 && world[playa.x + 1][playa.y].type == "locked") {
                    returnString = "That door is locked.";
                } else {
                    returnString = "I'm sorry, the building has ceased to right.";
                }
            }

            if (returnString !== null) {
                outputToConsole(returnString);
                outputToConsole(whereAmI(playa.x, playa.y, null, world));
            }

            if (playa.x == hostage.x && playa.y == hostage.y) {
                triggerFight("hostage");
            }
        } else {
            outputToConsole("You cannot leisurely walk out of a fight! Try running out instead.");
        }
    }

    function unlock(param) {
        var returnString;
        if (playa.keys > 0) {
            if (param != "right" && param != "left" && param != "up" && param != "down") {
                returnString = "I don't know what direction that's supposed to be!  Try using 'unlock [right/left/up/down]'.";
            } else {
                var xdir = 0;
                var ydir = 0;
                xdir += (param == "right") ? 1 : (param == "left") ? -1 : 0;
                ydir += (param == "up") ? 1 : (param == "down") ? -1 : 0;
                if (world[playa.x + xdir][playa.y + ydir].type == "locked") {
                    var health = Math.round(Math.random() * 5);
                    returnString = "You use up a key to enter the room and find a roll of bandages with painkillers.  You heal " + health + " hp!";
                    playa.health += health;
                    world[playa.x + xdir][playa.y + ydir].type = null;
                    playa.x += xdir;
                    playa.y += ydir;
                    outputToConsole(whereAmI(playa.x, playa.y, null, world));
                } else {
                    returnString = "That door isn't locked!";
                }
            }

        } else {
            returnString = "You don't have any keys!";
        }
        outputToConsole(returnString);
    }

    function punch(param) {
        console.log(hostageTime);
        if (world[playa.x][playa.y].entity == "hostage") {
            playa.target = enemy;
            playa.inFight = true;
        }
        if (playa.target !== null) {
            outputToConsole("It's your turn brah");
            var damage = Math.round(Math.random() * 10);
            playa.stamina -= (damage <= 3) ? 1 : (damage <= 6) ? 2 : 3;
            if (playa.stamina >= 0) {
                playa.target.health -= damage;
                if (damage === 0) {
                    outputToConsole("You missed!");
                }
                else {
                    outputToConsole("You dealt " + damage + " damage.");
                }
            } else {
                outputToConsole("You need more stamina to keep punching like that.");
            }

            var string = (playa.target == enemy) ? "hostage" : "guard";
            triggerFight(string);
        } else if (param == "sofas") {
            outputToConsole("Wow, so soft.");
        } else if (param == "chairs") {
            outputToConsole("RESPECT THE CHAIRS, AND THE CHAIRS WILL RESPECT YOU");
        } else if (param == "tables") {
            outputToConsole("That's just great. Now where are we supposed to put things?");
        } else if (param == "desks") {
            outputToConsole("I'll have you know that those were artisanal.");
        } else if (param == "plants") {
            outputToConsole("PLANTS?!");
        } else if (param == "several potato chips") {
            outputToConsole("Crunchy.");
        } else if (param == "windows") {
            outputToConsole("Contrary to what you think, glass lacerations are NOT fun.");
        } else {
            outputToConsole("Punching the air will not make enemies appear.");
        }
    }


    // shootPlayer(ACTUAL INSTANCE OF OBJECT)
    // Extrem: 2, Chest: 5, Head: 10
    function shootPlayer(curr) {
        var damage;
        var standing = (curr.locState == "open") ? (Math.random() < 0.85) : (Math.random() < 0.05);
        if (standing) {
            var rand = Math.round(Math.random() * 100);
            damage = (rand < 10) ? 10 : (rand < 50) ? 5 : 2;
            curr.health -= damage;
        } else {
            damage = 0;
        }
        if (damage === 0) {
            var string = (curr == playa) ? "They" : "You";
            outputToConsole(string + " missed!");
        }
        else {
            var string = (curr == playa) ? "They" : "You";
            outputToConsole(string + " dealt " + damage + " damage.");
        }
    }

    function hide(curr) {
        curr.locState = "hiding";
        var string = (curr == playa) ? "You" : "They";
        outputToConsole(string + " hide.");
    }

    function shoot(param) {
        if (playa.weapons !== null) {
            if (playa.weaponClip !== 0) {
                if (param[0] == "lock") {
                    if (param[1] != "right" && param[1] != "left" && param[1] != "up" && param[1] != "down") {
                        outputToConsole("I don't know what direction that's supposed to be!  Try using 'shoot [right/left/up/down]'.");
                        return;
                    } else {
                        var xdir = 0;
                        var ydir = 0;
                        xdir += (param[1] == "right") ? 1 : (param[1] == "left") ? -1 : 0;
                        ydir += (param[1] == "up") ? 1 : (param[1] == "down") ? -1 : 0;
                        if (world[playa.x + xdir][playa.y + ydir].type == "locked") {
                            playa.weaponClip--;
                            var health = Math.round(Math.random() * 5);
                            outputToConsole("You shoot the lock out to enter the room and find a roll of bandages with painkillers.  You heal " + health + " hp!");
                            playa.health += health;
                            world[playa.x + xdir][playa.y + ydir].type = null;
                            playa.x += xdir;
                            playa.y += ydir;
                            outputToConsole(whereAmI(playa.x, playa.y, null, world));
                            makeGuard(playa.x, playa.y);

                            return;
                        }
                    }
                }

                playa.weaponClip--;
                // If you start on hostages
                if (world[playa.x][playa.y].entity == "hostage") {
                    playa.target = enemy;
                    playa.inFight = true;
                } else if (playa.target === null) {
                    outputToConsole("There's nobody to shoot. Don't waste your ammo.");
                    return;
                }
                outputToConsole("It's your turn.");
                shootPlayer(playa.target);
                if (playa.weapons === "dual pistols") {
                    shootPlayer(playa.target);
                }
                var string = (playa.target == enemy) ? "hostage" : "guard";
                triggerFight(string);
            } else {
                outputToConsole("You don't have any bullets to shoot with!");
            }
        } else {
            outputToConsole("Spitballs are ineffective. Find a gun and bullets to shoot instead.");
        }
    }

    // duck(ACTUAL INSTANCE OF OBJECT)
    function duck(param) {
        if (playa.target !== null || world[playa.x][playa.y].entity == "hostage") {
            outputToConsole("It's your turn.");
            hide(playa);
            var string = (playa.target == enemy) ? "hostage" : "guard";
            triggerFight(string);
        } else {
            outputToConsole("... duck goose? There's nobody here...");
        }
    }

    function reload(param) {
        if (playa.weapons !== null) {
            if ((playa.weaponClip + playa.ammo) >= ( (playa.weapons == "pistol") ? 6 : ( (playa.weapons == "dual pistols") ? 12 : 0 ) )) {
                var temp = playa.weaponClip;
                playa.weaponClip = ( (playa.weapons == "pistol") ? 6 : ((playa.weapons == "dual pistols") ? 12 : 0) );
                playa.ammo -= ((playa.weapons == "pistol") ? 6 : (playa.weapons == "dual pistols") ? 12 : 0) - temp;
                outputToConsole("Fully loaded and ready for combat.  You have " + playa.ammo + " rounds left,");
            } else {
                playa.weaponClip += playa.ammo;
                outputToConsole("You reloaded " + playa.ammo + " rounds, and now you're out of spares!");
                playa.ammo = 0;
            }
            var string = (playa.target == enemy) ? "hostage" : "guard";
            if(playa.target !== null) triggerFight(string);
        } else {
            outputToConsole("You can't reload your fists!");
        }
    }

    function run(dir) {
        if (playa.inFight) {
            playa.inFight = false;
            playa.turn = false;
            if (!!playa.target.attackedYet) {
                playa.target.inFight = false;
                playa.target.attackedYet = false;
                playa.target.locState = "open";
            }
            playa.target = null;
            playa.locState = "open";
            direction(dir);
        } else {
            outputToConsole("There's nobody here to run from. Do your exercise later.");
        }
    }

    function triggerFight(type) {
        if (type == "hostage" && !playa.inFight) {
            playa.target = enemy;
        }
        if (playa.target.health <= 0) {
            outputToConsole("You killed the " + ((type == "hostage") ? "terrorist" : "guard") + "!");
            if (type == "hostage") {
                outputToConsole("You win!");
                winning = true;
                outputToConsole = function () { };
            } else {
                playa.inFight = false;
                playa.target = null;
                playa.locState = "open";
                playa.turn = false;
            }
            return;
        }

        if (type == "guard" && playa.target.attackedYet === false) {
            outputToConsole("A terrorist guard enters the room!");
            playa.target.attackedYet = true;
        }
        playa.turn = false;//(!playa.inFight) ? ((Math.random() > .5) ? false : true) : !playa.turn; //TODO: WHAT THE HECK DOES THIS EVEN MEAN WHY DOES THIS WORK IT REALLY SHOULDN"T WORK THIS WAY WHYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY!
        turnString = (playa.turn) ? "your" : "their";

        if (!playa.inFight || !playa.turn)
            outputToConsole("It's " + turnString + " turn.");
        playa.inFight = true;



        if (turnString == "their") {
            enemy.turn();
        }
    }

    function preprocessCommand(command, args) {
        if (command == "right") {
            command = "go";
            args[0] = "right";
        }
        else if (command == "left") {
            command = "go";
            args[0] = "left";
        }
        else if (command == "up") {
            command = "go";
            args[0] = "up";
        }
        else if (command == "down") {
            command = "go";
            args[0] = "down";
        }

        return [command, args];
    }

    function processCommand() {
        var inField = $("#in");
        var input = inField.val();
        var parts = input.replace(/\s+/g, " ").split(" ");
        var command = parts[0];
        var args = (parts.length > 1) ? parts.slice(1, parts.length) : [];
        var temp = preprocessCommand(command, args);
        command = temp[0];
        args = temp[1];

        lastInput = input;

        inField.val("");

        for (var i = 0; i < COMMANDS.length; i++) {
            if (command === COMMANDS[i].name) {
                COMMANDS[i].handler(args);
                return;
            }
        }

        outputToConsole("I don't know what you mean: " + command + ".  Try typing 'help' for a list of valid commands.");
    }

    $("#in").keydown(function (e) {

        if (e.which === 13) {
            processCommand();
        }
        else if (e.which === 38) {
            $("#in").val(lastInput);
        }
    });

    $(window).resize(function() { updateOut(); });

    function updateOut()
    {
        document.getElementById("out").style.bottom = (document.getElementById("in").clientHeight) + "px";
    }
});
