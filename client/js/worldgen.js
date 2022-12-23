var world = [];
var hostage = { "x": null, "y": null };

function worldgen(x, y, test) {
    // Make empty world
    for (var i = 0; i < x; i++) {
        world[i] = [];
        for (var j = 0; j < y; j++) {
            world[i][j] = {};
            world[i][j].type = null;
            world[i][j].text = null;
            world[i][j].entity = null;
            world[i][j].pathDir = null;
        }
    }

    if (test == 1) {
        console.log("test world gen!");
        // Choose distance, place stairs, choose dir, choose dist, choose up/down, check, move dist until no more options, change dir, check dist until no more options, toggle up/dowm
        var locx = 0;
        var locy = 0;
        // Distance in either direction to go
        var dist = 0;
        // -1:left, 1:right
        var dirx = 1;
        // -1:down, 1:up
        var diry = 1;
        // Path must be at least 50% of map
        var maxPath = Math.round((x * y) * 0.5);
        var pathLen = 0;

        // Choose functions for dirx, diry, dist
        function chooseDirX() {
            if (locx == 0) {
                dirx = 1;
                return;
            }
            dirx = Math.round(Math.random());
            dirx = (dirx == 0) ? -1 : dirx;
        }
        function chooseDirY() {
            if (locy == 0) {
                diry = 1;
                return;
            }
            diry = Math.round(Math.random());
            diry = (diry == 0) ? -1 : diry;
        }
        function chooseDist() {
            // Prevent out of bounds by checking dir and making sure dist doesn't go outside world
            dist = (dirx == -1) ? Math.round(Math.random() * locx) : Math.round(Math.random() * ((x - 1) - locx));
        }

        // Loop to place stairs and path
        while (pathLen <= maxPath) {
            // Choose stuff
            chooseDirX();
            chooseDirY();
            chooseDist();
            var finalx = locx + (dist * dirx);
            var finaly = locy + diry;

            debugger;
            // Check stairs dir == path to skip
            if (world[finalx][finaly].type == "path" && world[finalx][finaly].type == "stairs") {
                // TODO: write checking stuff if no good!
                break;
            } else { // This means that you are able to move up/down without going onto a path that's already there

                // Set type to stairs and pathDir at final loc 
                world[finalx][finaly].type = "stairs";
                world[finalx][finaly].pathDir = (diry == 1) ? "down" : "up";

                // Set everything from start to finalx to path (finalx needs to be stairs)
                while (locx != finalx) {
                    world[locx][locy].type = "path";
                    world[locx][locy].pathDir = (dirx == 1) ? "right": "left";
                    locx += dirx;
                    pathLen++;
                }

                // Set type to stairs and pathDir at fist loc
                world[finalx][locy].pathDir = (diry == -1) ? "down" : "up";
                world[finalx][locy].type = "stairs";
                console.log("Path is: " + pathLen + "/" + maxPath);
            }
        }
    }

    else {
        console.log("old world gen. :(");
        // Random path generation -- no min length
        var prevLoc = [{ "x": 0, "y": 0 }];
        var xSame = 0;
        var ySame = 0;
        var trying = 0;
        var locx = 0;
        var locy = 0;
        var pathLen = 0;
        var maxPath = Math.round((x * y) * 0.75);
        world[0][0].type = "path";

        while (pathLen <= maxPath) {
            var dir = 0;
            if (xSame >= 3) {
                dir = Math.round(Math.random()) + 2;
                trying++;
            } else if (ySame >= 3) {
                dir = Math.round(Math.random());
                trying++;
            } else if (trying >= 1) {
                dir = Math.round(Math.random() * 3);
                trying = xSame = ySame = 0;
            } else {
                dir = Math.round(Math.random() * 3);
            }
            // 0:right, 1:up, 2:left, 3:down
            switch (dir) {
                case 0:
                    locx++;
                    break;
                case 1:
                    locx--;
                    break;
                case 2:
                    locy++;
                    break;
                case 3:
                    locy--;
                    break;
            }

            // If in bounds increase path len
            var previous = prevLoc[prevLoc.length - 1];
            if ((locx >= 0 && locx < x && locy >= 0 && locy < y) && !(locx == previous.x && locy == previous.y)) {// && (locx != prevLoc[prevLoc.length - 1].x && locy != prevlov[prevLoc.length - 1].y) ) {
                if (previous.x == locx) {
                    xSame++;
                    if (locy > previous.y) {
                        world[previous.x][previous.y].pathDir = "up";
                    } else if (locy < previous.y) {
                        world[previous.x][previous.y].pathDir = "down";
                    }
                }
                else if (previous.y == locy) {
                    ySame++;
                    if (locx > previous.x) {
                        world[previous.x][previous.y].pathDir = "right";
                    } else if (locx < previous.x) {
                        world[previous.x][previous.y].pathDir = "left";
                    }
                }
                prevLoc.push({ "x": locx, "y": locy });
                pathLen++;
                world[locx][locy].type = "path";
            } else if (locx == previous.x && locy == previous.y) {
                continue;
            }

            // If out of bounds undo what we did above and move on
            if (locx < 0) {
                trying = 0;
                locx++;
            }
            else if (locx >= x) {
                trying = 0;
                locx--;
            }
            else if (locy < 0) {
                trying = 0;
                locy++;
            }
            else if (locy >= y) {
                trying = 0;
                locy--;
            }
        }
    }
    console.log("pathlen: " + pathLen);
    console.log("maxpath: " + maxPath);

    // Place hostages at end of path
    world[locx][locy].entity = "hostage";
    hostage.x = locx;
    hostage.y = locy;
    console.log("hostage at: " + hostage.x + "," + hostage.y);

    var desc =
    [
      // Sofas: <a href= "www.ikea.com/us/en/catalog/products/S69876003/">
      // Chairs: <a href= "www.ikea.com/us/en/catalog/products/S39902188/">
      // Tables: <a href= "www.ikea.com/us/en/catalog/products/30217526/">
      // Desks: <a href= "www.ikea.com/us/en/catalog/products/60244745/">
      // Plants: <a href= "www.ikea.com/us/en/catalog/products/20282758/">
      // Potato Chips: <a href= "www.ikea.com/us/en/catalog/products/20129672/">
      // Shelves: <a href= "www.ikea.com/us/en/catalog/products/S19929631/">
        "sofas",
        "chairs",
        "tables",
        "desks",
        "plants",
        "multiple IKEA entrances",
        "several bags of potato chips",
        "shelves"
    ];

    var LenY = y;
    var numLocked = 0;

    // Place other stuff in the world
    for(var i = x - 1; i >= 0; i--)
    {
        for(var j = y - 1; j >= 0; j--)
        {
            if (world[i][j].type !== "path" && world[i][j].type !== "stairs") {
                switch (Math.floor(Math.random() * 8)) {
                    case 0:
                    case 1:
                        world[i][j].type = "locked";
                        numLocked++;
                        break;

                    case 2:
                        world[i][j].type = "weapon";
                        break;

                    case 3:
                    case 4:
                        world[i][j].type = "ammo";
                        break;
                }
            }
            else {
                if (world[i][j].pathDir == "up" && !!world[i][j + 1] && (world[i][j + 1].type == "path" || world[i][j + 1].type == "stairs")) {
                    world[i][j].type = "stairs";
                    pathLen--;
                }
                if (world[i][j].pathDir == "down" && !!world[i][j - 1] && (world[i][j - 1].type == "path" || world[i][j - 1].type == "stairs")) {
                    world[i][j].type = "stairs";
                    pathLen--;
                }
            }

            world[i][j].text = "You are in a room where there are " + desc[Math.floor(Math.random() * desc.length)];
        }
    }

    world[hostage.x][hostage.y].text = "A WILD BUNDLE OF HOSTAGES (and a terrorist) APPEARED";

    // Place keys
    for (var i = 0; i < x; i++) {
        for (var j = 0; j < y; j++) {
            if (world[i][j].type == "path" || world[i][j] === null) {
                if ( Math.round(Math.random())*(pathLen/4) === 0 ) {
                      world[i][j].type = "key";
                      numLocked--;
                      if (numLocked <= 0 ) return world;
                }
            }
        }
    }

    // Ensure that starting point has stairs if it's supposed to
    if (world[0][0].pathDir == "up") world[0][0].type = "stairs";

    //world[1][0].type = "weapon";
    //world[2][0].type = "weapon";
    //world[3][0].type = "ammo";

    return world;
}
