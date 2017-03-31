'use strict';

let quadtile = require('quadtile-index');

function injectNew(source) {
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
                [x, y] = quadtile.indexToXY(opts.index);
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
    return source;
}

function injectOld(source) {
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
    return source;
}

/**
 *
 * @param source A tilelive instance
 */
module.exports = function(source) {
    if (!source ||
        (source.get !== undefined && typeof source.get !== 'function') ||
        (source.getTile !== undefined && typeof source.getTile !== 'function')
    ) {
        throw new Error('Argument is not a valid Tilelive instance');
    }
    if (source.getTile && source.get) {
        // nothing to do
        return source;
    }

    return source.getTile ? injectNew(source) : injectOld(source);
};
