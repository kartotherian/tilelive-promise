'use strict';

let quadtile = require('quadtile-index');

function injectAsync(source) {
    source.getAsync = opts => {
        return new Promise((resolve, reject) => {
            let x = opts.x, y = opts.y;
            if (opts.type === 'info') {
                // safety: Handle getInfo() before tile and grid because we don't want
                // to validate index param, just in case it is used in some weird way
                source.getInfo((err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({info: data});
                    }
                });
                return;
            }
            if (opts.index !== undefined && x === undefined && y === undefined) {
                // todo late ode6+ -- [x, y] = ...
                let xy = quadtile.indexToXY(opts.index);
                x = xy[0];
                y = xy[1];
            }
            switch (opts.type) {
                case undefined:
                case 'tile':
                    source.getTile(opts.z, x, y, (err, data, hdrs) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({tile: data, headers: hdrs});
                        }
                    });
                    break;
                case 'grid':
                    source.getGrid(opts.z, x, y, (err, data, hdrs) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({grid: data, headers: hdrs});
                        }
                    });
                    break;
                default:
                    throw new Error(`Unknown type "${opts.type}"`)
            }
        });
    };
}

function injectLegacy(source) {
    source.getTile = (z, x, y, cb) => {
        source.getAsync({z: z, x: x, y: y}).then(
            data => cb(undefined, data.tile, data.headers),
            err => cb(err));
    };
    source.getGrid = (z, x, y, cb) => {
        source.getAsync({type: 'grid', z: z, x: x, y: y}).then(
            data => cb(undefined, data.grid, data.headers),
            err => cb(err));
    };
    source.getInfo = (cb) => {
        source.getAsync({type: 'info'}).then(
            data => cb(undefined, data.info),
            err => cb(err));
    };
}

/**
 *
 * @param source A tilelive instance
 */
module.exports = function(source) {
    if (!source) {
        throw new Error('Invalid source argument');
    }
    const isLegacy =
        typeof source.getTile === 'function' &&
        typeof source.getGrid === 'function' &&
        typeof source.getInfo === 'function';
    const isMissingLegacy =
        source.getTile === undefined &&
        source.getGrid === undefined &&
        source.getInfo === undefined;


    const isAsync = typeof source.getAsync === 'function';
    const isMissingAsync = source.getAsync === undefined;

    if ((isMissingAsync && isMissingLegacy) ||
        (!isLegacy && !isMissingLegacy) ||
        (!isAsync && !isMissingAsync)
    ) {
        throw new Error('Argument is not a valid Tilelive instance');
    }

    if (isMissingLegacy) {
        injectLegacy(source);
    } else if (isMissingAsync) {
        injectAsync(source);
    }
    return source;
};
