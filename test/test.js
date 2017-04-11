'use strict';

let assert = require('assert'),
    tp = require('..');

function Legacy(throwErr) {
    this.throwErr = throwErr;
}
Legacy.prototype.getTile = function (z, x, y, cb) {
    return this.throwErr ? cb(new Error('tile')) : cb(undefined, `tile:${z}:${x}:${y}`, {h: 1});
};
Legacy.prototype.getGrid = function (z, x, y, cb) {
    return this.throwErr ? cb(new Error('grid')) : cb(undefined, `grid:${z}:${x}:${y}`, {h: 1});
};
Legacy.prototype.getInfo = function (cb) {
    return this.throwErr ? cb(new Error('info')) : cb(undefined, 'info');
};

function Modern(throwErr) {
    this._legacy = tp(new Legacy(throwErr));
}
Modern.prototype.getAsync = function(o) {
    return this._legacy.getAsync(o);
};

function testLegacy(inst, expected, func /*, ...args*/) {
    return new Promise((accept, reject) => {
        let args = Array.prototype.slice.call(arguments, 3);
        args.push((err, data, hdrs) => {
            try {
                let res = {};
                if (err) res.err = err.message;
                if (data) res.data = data;
                if (hdrs) res.hdrs = hdrs.h;
                assert.deepStrictEqual(res, expected);
                accept();
            } catch (e) {
                reject(e);
            }
        });
        let inst2 = tp(inst);
        // inst2[func](...args);
        inst2[func].apply(inst2, args);
    });
}

function testModern(inst, expected, opts) {
    let inst2 = tp(inst);
    return inst2.getAsync(opts).then(
        data => assert.deepStrictEqual(data, expected),
        err => assert.deepStrictEqual({err: err.message}, expected)
    );
}


describe('param validation', () => {
    let invalidArg = err => err.message === 'Invalid source argument';
    it('undefined', () => assert.throws(() => tp(), invalidArg));
    it('null', () => assert.throws(() => tp(null), invalidArg));

    function dummy(func, isPrototype) {
        return () => {
            function Dummy() {
            }

            ['getAsync', 'getTile', 'getGrid', 'getInfo']
                .filter(f => f !== func)
                .map(f => Dummy.prototype[f] = () => 42);

            let inst = new Dummy();
            if (isPrototype) {
                Dummy.prototype[func] = 42;
            } else {
                inst[func] = 42;
            }
            return tp(inst);
        };
    }

    let invalidSrc = err => err.message === 'Argument is not a valid Tilelive instance';

    it('getAsync', () => assert.throws(() => tp(new function () {}), invalidSrc));
    it('getAsync', () => assert.throws(dummy('getAsync'), invalidSrc));
    it('getAsync prot', () => assert.throws(dummy('getAsync', true), invalidSrc));
    it('getTile', () => assert.throws(dummy('getTile'), invalidSrc));
    it('getTile prot', () => assert.throws(dummy('getTile', true), invalidSrc));
    it('getGrid', () => assert.throws(dummy('getGrid'), invalidSrc));
    it('getGrid prot', () => assert.throws(dummy('getGrid', true), invalidSrc));
    it('getInfo', () => assert.throws(dummy('getInfo'), invalidSrc));
    it('getInfo prot', () => assert.throws(dummy('getInfo', true), invalidSrc));
});

describe('legacy error calls', () => {
    it('err on legacy getTile() from legacy obj', () => testLegacy(new Legacy(true), {err: 'tile'}, 'getTile', 0, 0, 0));
    it('err on legacy getGrid() from legacy obj', () => testLegacy(new Legacy(true), {err: 'grid'}, 'getGrid', 0, 0, 0));
    it('err on legacy getInfo() from legacy obj', () => testLegacy(new Legacy(true), {err: 'info'}, 'getInfo'));

    it('err on legacy getTile() from modern obj', () => testLegacy(new Modern(true), {err: 'tile'}, 'getTile', 0, 0, 0));
    it('err on legacy getGrid() from modern obj', () => testLegacy(new Modern(true), {err: 'grid'}, 'getGrid', 0, 0, 0));
    it('err on legacy getInfo() from modern obj', () => testLegacy(new Modern(true), {err: 'info'}, 'getInfo'));
});

describe('legacy calls', () => {
    it('legacy getTile() from legacy obj', () => testLegacy(new Legacy(), {data: 'tile:2:1:0', hdrs: 1}, 'getTile', 2, 1, 0));
    it('legacy getGrid() from legacy obj', () => testLegacy(new Legacy(), {data: 'grid:2:1:0', hdrs: 1}, 'getGrid', 2, 1, 0));
    it('legacy getInfo() from legacy obj', () => testLegacy(new Legacy(), {data: 'info'}, 'getInfo'));

    it('legacy getTile() from modern obj', () => testLegacy(new Modern(), {data: 'tile:2:1:0', hdrs: 1}, 'getTile', 2, 1, 0));
    it('legacy getGrid() from modern obj', () => testLegacy(new Modern(), {data: 'grid:2:1:0', hdrs: 1}, 'getGrid', 2, 1, 0));
    it('legacy getInfo() from modern obj', () => testLegacy(new Modern(), {data: 'info'}, 'getInfo'));
});

describe('modern error calls', () => {
    it('err on modern getAsync()     from legacy obj', () => testModern(new Legacy(true), {err: 'tile'}, {z:2, x:1, y:0}));
    it('err on modern getAsync(tile) from legacy obj', () => testModern(new Legacy(true), {err: 'tile'}, {type:'tile', z:2, x:1, y:0}));
    it('err on modern getAsync(grid) from legacy obj', () => testModern(new Legacy(true), {err: 'grid'}, {type:'grid', z:2, x:1, y:0}));
    it('err on modern getAsync(info) from legacy obj', () => testModern(new Legacy(true), {err: 'info'}, {type:'info'}));
    it('err on modern getAsync(bad)  from legacy obj', () => testModern(new Legacy(true), {err: 'Unknown type \"bad\"'}, {type:'bad'}));

    it('err on modern getAsync()     from modern obj', () => testModern(new Modern(true), {err: 'tile'}, {z:2, x:1, y:0}));
    it('err on modern getAsync(tile) from modern obj', () => testModern(new Modern(true), {err: 'tile'}, {type:'tile', z:2, x:1, y:0}));
    it('err on modern getAsync(grid) from modern obj', () => testModern(new Modern(true), {err: 'grid'}, {type:'grid', z:2, x:1, y:0}));
    it('err on modern getAsync(info) from modern obj', () => testModern(new Modern(true), {err: 'info'}, {type:'info'}));
    it('err on modern getAsync(bad)  from modern obj', () => testModern(new Legacy(true), {err: 'Unknown type \"bad\"'}, {type:'bad'}));
});

describe('modern calls', () => {
    it('modern getAsync()     from legacy obj', () => testModern(new Legacy(), {data:'tile:2:1:0', headers:{h:1}}, {z:2, x:1, y:0}));
    it('modern getAsync(tile) from legacy obj', () => testModern(new Legacy(), {data:'tile:2:1:0', headers:{h:1}}, {type:'tile', z:2, x:1, y:0}));
    it('modern getAsync(grid) from legacy obj', () => testModern(new Legacy(), {data:'grid:2:1:0', headers:{h:1}}, {type:'grid', z:2, x:1, y:0}));
    it('modern getAsync(info) from legacy obj', () => testModern(new Legacy(), {data:'info'}, {type:'info'}));

    it('modern getAsync()     from modern obj', () => testModern(new Modern(), {data:'tile:2:1:0', headers:{h:1}}, {z:2, x:1, y:0}));
    it('modern getAsync(tile) from modern obj', () => testModern(new Modern(), {data:'tile:2:1:0', headers:{h:1}}, {type:'tile', z:2, x:1, y:0}));
    it('modern getAsync(grid) from modern obj', () => testModern(new Modern(), {data:'grid:2:1:0', headers:{h:1}}, {type:'grid', z:2, x:1, y:0}));
    it('modern getAsync(info) from modern obj', () => testModern(new Modern(), {data:'info'}, {type:'info'}));

    it('modern getAsync(info, badidx) from legacy obj', () => testModern(new Legacy(), {data:'info'}, {type:'info', index:-10}));
    it('modern getAsync(info, badidx) from legacy obj', () => testModern(new Legacy(), {data:'info'}, {type:'info', index:-10}));

    it('modern getAsync()     w/ idx from legacy obj', () => testModern(new Legacy(), {data:'tile:2:1:3', headers:{h:1}}, {z:2, index:11}));
    it('modern getAsync(tile) w/ idx from legacy obj', () => testModern(new Legacy(), {data:'tile:2:1:3', headers:{h:1}}, {type:'tile', z:2, index:11}));
    it('modern getAsync(grid) w/ idx from legacy obj', () => testModern(new Legacy(), {data:'grid:2:1:3', headers:{h:1}}, {type:'grid', z:2, index:11}));

    it('modern getAsync()     w/ idx from modern obj', () => testModern(new Modern(), {data:'tile:2:1:3', headers:{h:1}}, {z:2, index:11}));
    it('modern getAsync(tile) w/ idx from modern obj', () => testModern(new Modern(), {data:'tile:2:1:3', headers:{h:1}}, {type:'tile', z:2, index:11}));
    it('modern getAsync(grid) w/ idx from modern obj', () => testModern(new Modern(), {data:'grid:2:1:3', headers:{h:1}}, {type:'grid', z:2, index:11}));
});
