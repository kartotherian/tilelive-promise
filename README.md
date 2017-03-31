[![Build Status](https://travis-ci.org/kartotherian/tilelive-promise.svg?branch=master)](https://travis-ci.org/kartotherian/tilelive-promise)

# tilelive-promise
Adds an extended Promise-based interface to the existing tilelive components, or exposes new components to older tilelive systems.

This module supplies either a modern or a legacy wrapper for the tilelive ([TileSource](https://github.com/mapbox/tilelive/blob/master/API.md)) object.

For sources that implement `getTile()`, `getGrid()` and `getInfo()`, creates a new `getAsync()` generic function.

For sources that implement `getAsync()`, supplies the callback-based `getTile()`, `getGrid()` and `getInfo()`.

If both `getTile()` and `getAsync()` are present, the instance is returned unmodified.


# Promise&lt;object> getAsync(options)

The new function allows to treat `get*()` as promises,
 permits additional parameter passing with each request (e.g. scaling, format, language),
 and allow non-tile data to be retrieved through the same system.

Both `tile` and `grid` requests via `GetAsync()` may also use an `index` parameter instead of (x,y) coordinates. Index is a single 56bit [quadtile integer](https://github.com/kartotherian/quadtile-index#quadtile-index), allowing up to zoom 26. 

`getAsync()` returns a Promise that resolves to an object. The content of the object depends on the type.

## Legacy vs New interface

| `get*()` tilelive API   | `getAsync()` API  |
|-----------------------|-------------------|
|`getTile(z, x, y, callback(err, tile, headers))`|`Promise{tile, headers} getAsync({z, x, y})` or <br>`Promise{tile, headers} getAsync({type:'tile', z, x, y})`|
|`getGrid(z, x, y, callback(err, grid, headers))`|`Promise{grid, headers} getAsync({type:'grid', z, x, y})`|
|`getInfo(callback(err, info))`         |`Promise{info} getAsync({type:'info'})`|
