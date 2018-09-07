# jsborg
JavaScript reader and explorer for [CYBERWORLD](http://wayback.archive.org/web/20030202000627/http://www.cyberworldcorp.com/) QBORGs, first started on November 8, 2016

This project makes use of [three.js](https://github.com/mrdoob/three.js/).

The [main viewer](qborgprototype.html) only works with local files, and depends on a hardcoded path defined at the top of [jsborg.js](scripts/jsborg.js).

I have no actual relation with CYBERWORLD International Corporation. I wrote this QBORG explorer while discovering the structure of the relevant files through trial and error from experimenting with outputs of [CYBERWORLD's authoring tools](http://web.archive.org/web/20030204221240/http://www.cwarp.com:80/downloads/index.html)

This has been tested with
* [Pokemon 2000 Adventure Game](http://web.archive.org/web/20061105053936/http://p2kmovie.warnerbros.com/worlds.html)
* [Zeta Quest 3D](http://web.archive.org/web/20020706213551/http://www2.warnerbros.com/web/zeta-kids/quest.jsp)
* [The Olympiad](http://web.archive.org/web/20021204151916/http://www.cyberworldcorp.com:80/new/featureworlds/featworlds_cs_olympiad.asp)

## How to use
1. Extract the contents somewhere
2. Download the files of a QBORG project like any of the above and place them somewhere in the jsborg folder, with folders intact
3. Go into `jsborg.js` and change the `borgPath` variable to point to the main folder of the QBORG project
4. Open up `qborgprototype.html`
5. Select the desired .borg file

QBORG &copy; 1999-2003 CYBERWORLD International Corporation