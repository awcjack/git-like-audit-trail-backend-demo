'use strict';

var _regeneratorRuntime = require('@babel/runtime/regenerator');
var _asyncToGenerator = require('@babel/runtime/helpers/asyncToGenerator');
var _ = require('lodash');
var sqlite3 = require('sqlite3');
var express = require('express');
var bodyParser = require('body-parser');
var auditTrail = require('git-like-audit-trail');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _regeneratorRuntime__default = /*#__PURE__*/_interopDefaultLegacy(_regeneratorRuntime);
var _asyncToGenerator__default = /*#__PURE__*/_interopDefaultLegacy(_asyncToGenerator);
var ___default = /*#__PURE__*/_interopDefaultLegacy(_);
var sqlite3__default = /*#__PURE__*/_interopDefaultLegacy(sqlite3);
var express__default = /*#__PURE__*/_interopDefaultLegacy(express);
var bodyParser__default = /*#__PURE__*/_interopDefaultLegacy(bodyParser);
var auditTrail__default = /*#__PURE__*/_interopDefaultLegacy(auditTrail);

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var cors = require('cors');

var app = express__default['default']();
var server = app.listen(5000, function () {
  return console.log("Listening of localhost:5000");
});
app.use(cors());
app.use(bodyParser__default['default'].json());
var db = new sqlite3__default['default'].Database('./test.db', function (err) {
  if (err) {
    return console.error(err.message);
  }

  console.log('Connected to the local SQlite database.');
});

function appendCommitMap(_x) {
  return _appendCommitMap.apply(this, arguments);
}

function _appendCommitMap() {
  _appendCommitMap = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee18(_ref) {
    var categoryId, commitHash, currentCommit, currentCommitMap;
    return _regeneratorRuntime__default['default'].wrap(function _callee18$(_context18) {
      while (1) {
        switch (_context18.prev = _context18.next) {
          case 0:
            categoryId = _ref.categoryId, commitHash = _ref.commitHash;
            _context18.next = 3;
            return new Promise(function (resolve) {
              db.get('SELECT * FROM currentCommit WHERE categoryId = ?', [categoryId], function (err, row) {
                if (err) {
                  console.log("query user current commit error", err.message);
                } else {
                  if (row) {
                    console.log("user awcjack in commit ".concat(row.commitHash));
                    resolve({
                      exist: true,
                      current: row.commitHash
                    }); // row already exist --> update
                  } else {
                    resolve({
                      exist: false
                    });
                  }
                }
              });
            });

          case 3:
            currentCommit = _context18.sent;

            if (currentCommit.exist) {
              db.run('UPDATE currentCommit SET commitHash = ? WHERE categoryId = ?', [commitHash, categoryId], function (err) {
                if (err || this.changes === 0) {
                  console.log("update user current commit error", err.message || "No change");
                }
              });
            } else {
              db.run('INSERT INTO currentCommit(categoryId, commitHash) VALUES(?, ?)', [categoryId, commitHash], function (err) {
                if (err) {
                  console.log("insert user current commit error", err.message);
                }
              });
            }

            console.log("user awcjack in commit ".concat(commitHash, " now"));
            _context18.next = 8;
            return new Promise(function (resolve) {
              db.get('SELECT * FROM commitMap WHERE categoryId = ?', [categoryId], function (err, row) {
                if (err) {
                  console.log("query commit map error", err.message);
                } else {
                  if (row) {
                    console.log("commit map", row.commitHashMap);
                    resolve({
                      exist: true,
                      current: row.commitHashMap
                    });
                  } else {
                    resolve({
                      exist: false
                    });
                  }
                }
              });
            });

          case 8:
            currentCommitMap = _context18.sent;

            if (currentCommitMap.exist) {
              if (currentCommit.exist) {
                db.run('UPDATE commitMap SET commitHashMap = ? WHERE categoryId = ?', [_auditTrail.appendCommitMap({
                  currentCommitMap: currentCommitMap.current,
                  currentCommitHash: currentCommit.current,
                  newCommitHash: commitHash
                }), categoryId], function (err) {
                  if (err || this.changes === 0) {
                    console.log("update user current commit error", err.message || "No change");
                  }
                });
              } else {
                console.log("Consist commit map but not commit hash in user");
                db.run('UPDATE commitMap SET commitHashMap = ? WHERE categoryId = ?', [_auditTrail.appendCommitMap({
                  currentCommitMap: currentCommitMap.current,
                  currentCommitHash: "",
                  newCommitHash: commitHash
                }), categoryId], function (err) {
                  if (err || this.changes === 0) {
                    console.log("update user current commit error", err.message || "No change");
                  }
                });
              }
            } else {
              if (currentCommit.exist) {
                console.log("Consist currect commit in user without commit map");
                db.run('INSERT INTO commitMap(categoryId, commitHashMap) VALUES (?, ?)', [categoryId, _auditTrail.appendCommitMap({
                  currentCommitMap: "{}",
                  currentCommitHash: currentCommit.current,
                  newCommitHash: commitHash
                })], function (err) {
                  if (err || this.changes === 0) {
                    console.log("update user current commit error", err.message || "No change");
                  }
                });
              } else {
                db.run('INSERT INTO commitMap(categoryId, commitHashMap) VALUES (?, ?)', [categoryId, _auditTrail.appendCommitMap({
                  currentCommitMap: "{}",
                  currentCommitHash: "",
                  newCommitHash: commitHash
                })], function (err) {
                  if (err || this.changes === 0) {
                    console.log("update user current commit error", err.message || "No change");
                  }
                });
              }
            }

          case 10:
          case "end":
            return _context18.stop();
        }
      }
    }, _callee18);
  }));
  return _appendCommitMap.apply(this, arguments);
}

var databaseAddOneRowFunction = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(_ref2) {
    var data, _ref2$auditTrail, auditTrail, parentTrail, result, trail, commitHash;

    return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            data = _ref2.data, _ref2$auditTrail = _ref2.auditTrail, auditTrail = _ref2$auditTrail === void 0 ? true : _ref2$auditTrail, parentTrail = _ref2.parentTrail;
            _context.next = 3;
            return new Promise(function (resolve) {
              db.run("INSERT INTO ".concat(data.categoryId, "(id, name) VALUES(?, ?)"), [data.dataId, data.name], function (err) {
                if (err) {
                  resolve({
                    error: true,
                    err: err.message
                  });
                } else {
                  resolve({
                    error: false,
                    content: {
                      id: data.dataId,
                      name: data.name
                    }
                  });
                }
              });
            });

          case 3:
            result = _context.sent;

            if (!auditTrail) {
              _context.next = 12;
              break;
            }

            _context.next = 7;
            return _auditTrail.createData({
              categoryId: data.categoryId,
              userId: "awcjack",
              dataId: data.dataId,
              name: data.name,
              before: {},
              after: result.content,
              action: "CREATE",
              parent: parentTrail
            });

          case 7:
            trail = _context.sent;
            commitHash = trail.commitHash;
            _context.next = 11;
            return appendCommitMap({
              categoryId: data.categoryId,
              userId: "awcjack",
              commitHash: commitHash
            });

          case 11:
            result.commitHash = commitHash;

          case 12:
            return _context.abrupt("return", result);

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function databaseAddOneRowFunction(_x2) {
    return _ref3.apply(this, arguments);
  };
}();

var databaseDeleteOneRowFunction = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee2(_ref4) {
    var data, _ref4$auditTrail, auditTrail, parentTrail, result, trail, commitHash;

    return _regeneratorRuntime__default['default'].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            data = _ref4.data, _ref4$auditTrail = _ref4.auditTrail, auditTrail = _ref4$auditTrail === void 0 ? true : _ref4$auditTrail, parentTrail = _ref4.parentTrail;
            _context2.next = 3;
            return new Promise(function (resolve) {
              db.run("DELETE FROM ".concat(data.categoryId, " WHERE id = ?"), [data.dataId], function (err) {
                if (err) {
                  resolve({
                    error: true,
                    err: err.message
                  });
                } else {
                  resolve({
                    error: false,
                    content: {
                      id: data.dataId,
                      name: data.name
                    }
                  });
                }
              });
            });

          case 3:
            result = _context2.sent;

            if (!auditTrail) {
              _context2.next = 12;
              break;
            }

            _context2.next = 7;
            return _auditTrail.createData({
              categoryId: data.categoryId,
              userId: "awcjack",
              dataId: data.dataId,
              name: data.name,
              before: result.content,
              after: {},
              action: "DELETE",
              parent: parentTrail
            });

          case 7:
            trail = _context2.sent;
            commitHash = trail.commitHash;
            _context2.next = 11;
            return appendCommitMap({
              categoryId: data.categoryId,
              userId: "awcjack",
              commitHash: commitHash
            });

          case 11:
            result.commitHash = commitHash;

          case 12:
            return _context2.abrupt("return", result);

          case 13:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function databaseDeleteOneRowFunction(_x3) {
    return _ref5.apply(this, arguments);
  };
}();

var databaseUpdateOneRowFunction = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee3(_ref6) {
    var data, changedObj, addChangedObj, deleteChangedObj, _ref6$revert, revert, _ref6$auditTrail, auditTrail, parentTrail, _data, changes, content, key, _key, _key2, result, trail, commitHash;

    return _regeneratorRuntime__default['default'].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            data = _ref6.data, changedObj = _ref6.changedObj, addChangedObj = _ref6.addChangedObj, deleteChangedObj = _ref6.deleteChangedObj, _ref6$revert = _ref6.revert, revert = _ref6$revert === void 0 ? true : _ref6$revert, _ref6$auditTrail = _ref6.auditTrail, auditTrail = _ref6$auditTrail === void 0 ? true : _ref6$auditTrail, parentTrail = _ref6.parentTrail;
            _context3.next = 3;
            return new Promise(function (resolve) {
              db.get("SELECT * FROM ".concat(data.categoryId, " WHERE id = ?"), [data.dataId], function (err, row) {
                if (err || !row) {
                  resolve({
                    error: true,
                    err: err === null || err === void 0 ? void 0 : err.message
                  });
                } else {
                  resolve({
                    error: false,
                    row: row
                  });
                }
              });
            });

          case 3:
            _data = _context3.sent;

            if (_data.error) {
              _context3.next = 22;
              break;
            }

            changes = [];
            content = {};

            if (!___default['default'].isEmpty(changedObj)) {
              for (key in changedObj) {
                changes.push("".concat(key, " = '").concat(changedObj[key], "'"));
                content[key] = changedObj[key];
              }
            }

            if (!___default['default'].isEmpty(addChangedObj)) {
              for (_key in addChangedObj) {
                if (_key !== "id") {
                  if (revert) {
                    changes.push("".concat(_key, " = NULL"));
                    content[_key] = null;
                  } else {
                    changes.push("".concat(_key, " = '").concat(addChangedObj[_key], "'"));
                    content[_key] = addChangedObj[_key];
                  }
                }
              }
            }

            if (!___default['default'].isEmpty(deleteChangedObj)) {
              for (_key2 in deleteChangedObj) {
                if (_key2 !== "id") {
                  if (revert) {
                    changes.push("".concat(_key2, " = '").concat(deleteChangedObj[_key2], "'"));
                    content[_key2] = deleteChangedObj[_key2];
                  } else {
                    changes.push("".concat(_key2, " = NULL"));
                    content[_key2] = null;
                  }
                }
              }
            }

            _context3.next = 12;
            return new Promise(function (resolve) {
              db.run("UPDATE ".concat(data.categoryId, " SET ").concat(changes.join(", "), " WHERE id = ").concat(data.dataId), [], function (err) {
                if (err) {
                  resolve({
                    error: true,
                    err: err.message
                  });
                } else {
                  resolve({
                    error: false,
                    content: content
                  });
                }
              });
            });

          case 12:
            result = _context3.sent;

            if (!auditTrail) {
              _context3.next = 21;
              break;
            }

            _context3.next = 16;
            return _auditTrail.createData({
              categoryId: data.categoryId,
              userId: "awcjack",
              dataId: data.dataId,
              name: data.name,
              before: _data === null || _data === void 0 ? void 0 : _data.row,
              after: result === null || result === void 0 ? void 0 : result.content,
              action: "UPDATE",
              parent: parentTrail
            });

          case 16:
            trail = _context3.sent;
            commitHash = trail.commitHash;
            _context3.next = 20;
            return appendCommitMap({
              categoryId: data.categoryId,
              userId: "awcjack",
              commitHash: commitHash
            });

          case 20:
            result.commitHash = commitHash;

          case 21:
            return _context3.abrupt("return", result);

          case 22:
            return _context3.abrupt("return", null);

          case 23:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function databaseUpdateOneRowFunction(_x4) {
    return _ref7.apply(this, arguments);
  };
}();

var _auditTrail = new auditTrail__default['default']({
  databaseAddOneRowFunction: databaseAddOneRowFunction,
  databaseDeleteOneRowFunction: databaseDeleteOneRowFunction,
  databaseUpdateOneRowFunction: databaseUpdateOneRowFunction
});

db.run('CREATE TABLE IF NOT EXISTS testTable (id TEXT PRIMARY KEY,name TEXT)'); // target table for CRUD

db.run('CREATE TABLE IF NOT EXISTS currentCommit (categoryId TEXT PRIMARY KEY, commitHash TEXT)'); // table for saving user current commit

db.run('CREATE TABLE IF NOT EXISTS commitMap (categoryId TEXT PRIMARY KEY,commitHashMap TEXT)'); // table for saving commit map (git tree diagram)

app.get('/', function (req, res) {
  res.send("SQLite CRUD git-like-audit-trail demo");
}); // query one commit id

app.get('/query/git/:hash', /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee4(req, res) {
    var result;
    return _regeneratorRuntime__default['default'].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return _auditTrail.queryByCommitHash({
              commitHash: req.params.hash
            });

          case 2:
            result = _context4.sent;
            res.json(result);

          case 4:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function (_x5, _x6) {
    return _ref8.apply(this, arguments);
  };
}()); // batch query commit id

app.post('/query/git', /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee5(req, res) {
    var commitHashArray, result;
    return _regeneratorRuntime__default['default'].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            commitHashArray = req.body.commitHashArray;
            _context5.next = 3;
            return _auditTrail.batchQueryByCommitHash({
              commitHashArray: commitHashArray
            });

          case 3:
            result = _context5.sent;
            res.json(result);

          case 5:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));

  return function (_x7, _x8) {
    return _ref9.apply(this, arguments);
  };
}()); // construct tree-like commit tree

app.get('/query/git', /*#__PURE__*/function () {
  var _ref10 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee6(req, res) {
    var commitHashMap, currentCommit, result;
    return _regeneratorRuntime__default['default'].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return new Promise(function (resolve) {
              db.get('SELECT * FROM commitMap WHERE categoryId = ?', ["testTable"], function (err, row) {
                if (err || !row) {
                  resolve({
                    error: true,
                    err: err === null || err === void 0 ? void 0 : err.message
                  });
                } else {
                  resolve({
                    error: false,
                    commitMap: row.commitHashMap
                  });
                }
              });
            });

          case 2:
            commitHashMap = _context6.sent;
            _context6.next = 5;
            return new Promise(function (resolve) {
              db.get('SELECT * FROM currentCommit WHERE categoryId = ?', ["testTable"], function (err, row) {
                if (err || !row) {
                  resolve({
                    error: true,
                    err: err === null || err === void 0 ? void 0 : err.message
                  });
                } else {
                  resolve({
                    error: false,
                    commitHash: row.commitHash
                  });
                }
              });
            });

          case 5:
            currentCommit = _context6.sent;

            if (!(commitHashMap.error || currentCommit.error)) {
              _context6.next = 11;
              break;
            }

            console.log("Either query commit hash map or user current commit error");
            res.send("Query error ".concat(commitHashMap.err, " ").concat(currentCommit.err));
            _context6.next = 15;
            break;

          case 11:
            _context6.next = 13;
            return _auditTrail.query({
              commitHashMap: commitHashMap.commitMap,
              commitHash: currentCommit.commitHash,
              onlyCurrentBranch: false,
              getCommitInfo: true
            });

          case 13:
            result = _context6.sent;
            res.json(result);

          case 15:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));

  return function (_x9, _x10) {
    return _ref10.apply(this, arguments);
  };
}());

function parseD3Tree(_ref11) {
  var d3Tree = _ref11.d3Tree,
      color = _ref11.color,
      _ref11$loadMore = _ref11.loadMore,
      loadMore = _ref11$loadMore === void 0 ? false : _ref11$loadMore;

  if (!color) {
    var _d3Tree$name, _d3Tree$name2;

    var _tmp = parseInt(d3Tree === null || d3Tree === void 0 ? void 0 : (_d3Tree$name = d3Tree.name) === null || _d3Tree$name === void 0 ? void 0 : _d3Tree$name.substring((d3Tree === null || d3Tree === void 0 ? void 0 : (_d3Tree$name2 = d3Tree.name) === null || _d3Tree$name2 === void 0 ? void 0 : _d3Tree$name2.length) - 10), 16);

    color = (_tmp % 16777216).toString(16); // ffffff + 1
  }

  d3Tree.nodeProps = {
    id: d3Tree === null || d3Tree === void 0 ? void 0 : d3Tree.name,
    style: {
      fill: "#".concat(color),
      r: 10
    }
  };

  if (!loadMore && d3Tree.currentCommit) {
    d3Tree.nodeProps = {
      id: d3Tree === null || d3Tree === void 0 ? void 0 : d3Tree.name,
      style: {
        fill: "#F3F3FF",
        stroke: "#".concat(color),
        r: 12
      }
    };
  } else if (d3Tree.currentCommit) {
    delete d3Tree.currentCommit;
  }

  if (d3Tree.children) {
    for (var i = 0; (_ref12 = i < ((_d3Tree$children = d3Tree.children) === null || _d3Tree$children === void 0 ? void 0 : _d3Tree$children.length)) !== null && _ref12 !== void 0 ? _ref12 : 0; i++) {
      var _ref12, _d3Tree$children, _d3Tree$children3;

      if (i !== 0) {
        var _d3Tree$children2, _d3Tree$children2$i, _d3Tree$children2$i$n, _d3Tree$name3;

        var _tmp2 = parseInt(d3Tree === null || d3Tree === void 0 ? void 0 : (_d3Tree$children2 = d3Tree.children) === null || _d3Tree$children2 === void 0 ? void 0 : (_d3Tree$children2$i = _d3Tree$children2[i]) === null || _d3Tree$children2$i === void 0 ? void 0 : (_d3Tree$children2$i$n = _d3Tree$children2$i.name) === null || _d3Tree$children2$i$n === void 0 ? void 0 : _d3Tree$children2$i$n.substring((d3Tree === null || d3Tree === void 0 ? void 0 : (_d3Tree$name3 = d3Tree.name) === null || _d3Tree$name3 === void 0 ? void 0 : _d3Tree$name3.length) - 10), 16);

        color = (_tmp2 % 16777216).toString(16);
      }

      d3Tree.children[i] = parseD3Tree({
        d3Tree: d3Tree === null || d3Tree === void 0 ? void 0 : (_d3Tree$children3 = d3Tree.children) === null || _d3Tree$children3 === void 0 ? void 0 : _d3Tree$children3[i],
        color: color,
        loadMore: loadMore
      });
    }
  } else {
    // last level
    d3Tree.lastLevel = true;
  }

  return d3Tree;
} // construct d3 tree


app.get('/query/d3', /*#__PURE__*/function () {
  var _ref13 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee7(req, res) {
    var commitHashMap, currentCommit, result, i;
    return _regeneratorRuntime__default['default'].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return new Promise(function (resolve) {
              db.get('SELECT * FROM commitMap WHERE categoryId = ?', ["testTable"], function (err, row) {
                if (err || !row) {
                  resolve({
                    error: true,
                    err: err === null || err === void 0 ? void 0 : err.message
                  });
                } else {
                  resolve({
                    error: false,
                    commitMap: row.commitHashMap
                  });
                }
              });
            });

          case 2:
            commitHashMap = _context7.sent;
            _context7.next = 5;
            return new Promise(function (resolve) {
              db.get('SELECT * FROM currentCommit WHERE categoryId = ?', ["testTable"], function (err, row) {
                if (err || !row) {
                  resolve({
                    error: true,
                    err: err === null || err === void 0 ? void 0 : err.message
                  });
                } else {
                  resolve({
                    error: false,
                    commitHash: row.commitHash
                  });
                }
              });
            });

          case 5:
            currentCommit = _context7.sent;

            if (!(commitHashMap.error || currentCommit.error)) {
              _context7.next = 11;
              break;
            }

            console.log("Either query commit hash map or user current commit error");
            res.send("Query error ".concat(commitHashMap.err, " ").concat(currentCommit.err));
            _context7.next = 16;
            break;

          case 11:
            _context7.next = 13;
            return _auditTrail.queryD3({
              commitHashMap: commitHashMap.commitMap,
              commitHash: currentCommit.commitHash,
              onlyCurrentBranch: false,
              getCommitInfo: true,
              ignore: ["parentTrail"],
              format: "text"
            });

          case 13:
            result = _context7.sent;

            // assign colour
            for (i = 0; i < result.length; i++) {
              result[i] = parseD3Tree({
                d3Tree: result[i]
              });
            }

            res.json(result);

          case 16:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));

  return function (_x11, _x12) {
    return _ref13.apply(this, arguments);
  };
}());
app.post('/d3/loadMore', /*#__PURE__*/function () {
  var _ref14 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee8(req, res) {
    var _req$body, commitHash, color, _req$body$before, before, _req$body$after, after, commitHashMap, result;

    return _regeneratorRuntime__default['default'].wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _req$body = req.body, commitHash = _req$body.commitHash, color = _req$body.color, _req$body$before = _req$body.before, before = _req$body$before === void 0 ? 0 : _req$body$before, _req$body$after = _req$body.after, after = _req$body$after === void 0 ? 0 : _req$body$after;
            _context8.next = 3;
            return new Promise(function (resolve) {
              db.get('SELECT * FROM commitMap WHERE categoryId = ?', ["testTable"], function (err, row) {
                if (err || !row) {
                  resolve({
                    error: true,
                    err: err === null || err === void 0 ? void 0 : err.message
                  });
                } else {
                  resolve({
                    error: false,
                    commitMap: row.commitHashMap
                  });
                }
              });
            });

          case 3:
            commitHashMap = _context8.sent;

            if (!commitHashMap.error) {
              _context8.next = 9;
              break;
            }

            console.log("Query commit hash map error");
            res.send("Query error ".concat(commitHashMap.err));
            _context8.next = 14;
            break;

          case 9:
            _context8.next = 11;
            return _auditTrail.queryD3({
              commitHashMap: commitHashMap.commitMap,
              commitHash: commitHash,
              before: before,
              after: after,
              onlyCurrentBranch: before > 0 ? false : true,
              getCommitInfo: true,
              ignore: ["parentTrail"],
              format: "text"
            });

          case 11:
            result = _context8.sent;

            // assign colour
            if (result.length !== 0) {
              // must only one root
              if (result[0].currentCommit) {
                delete result[0].currentCommit;
              }

              result[0] = parseD3Tree({
                d3Tree: result[0],
                color: color,
                loadMore: true
              });
            }

            res.json(result);

          case 14:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));

  return function (_x13, _x14) {
    return _ref14.apply(this, arguments);
  };
}()); // get testTable data

app.get('/query', function (req, res) {
  db.all('SELECT * FROM testTable', [], function (err, row) {
    if (err) {
      console.log("err", err.message);
      res.send("Query Error, ".concat(err.message));
    } else {
      res.json(row);
      console.log("All row has been queried");
    }
  });
}); // get current commit table data

app.get('/query/currentCommit', function (req, res) {
  db.all('SELECT * FROM currentCommit', [], function (err, row) {
    if (err) {
      console.log("err", err.message);
      res.send("Query Error, ".concat(err.message));
    } else {
      res.json(row);
      console.log("All row has been queried");
    }
  });
}); // get commit map data

app.get('/query/commitMap', function (req, res) {
  db.all('SELECT * FROM commitMap', [], function (err, row) {
    if (err) {
      console.log("err", err.message);
      res.send("Query Error, ".concat(err.message));
    } else {
      res.json(row);
      console.log("All row has been queried");
    }
  });
});
app.get('/query/:id', function (req, res) {
  db.get('SELECT * FROM testTable WHERE id = ?', [req.params.id], function (err, row) {
    if (err) {
      console.log("err", err.message);
      res.send("Query Error, ".concat(err.message));
    } else {
      res.json(row);
      console.log("A row has been queried with rowid ".concat(req.params.id));
    }
  });
});
app["delete"]('/delete', /*#__PURE__*/function () {
  var _ref15 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee9(req, res) {
    var idArray, oldPromiseArray, promiseArray, _loop, i, oldResult, result, errorCounter, _parentTrail, parentTrail, commitHash, _i, _result$_i, _result$_i$content, _result$_i2, _result$_i2$content, _oldResult$_i;

    return _regeneratorRuntime__default['default'].wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            idArray = req.body.idArray;
            oldPromiseArray = [];
            promiseArray = [];

            _loop = function _loop() {
              var index = i;
              oldPromiseArray.push(new Promise(function (resolve) {
                db.get('SELECT * FROM testTable WHERE id = ?', [idArray[index]], function (err, row) {
                  if (err) {
                    resolve({
                      error: true,
                      err: err.message
                    });
                  } else {
                    resolve({
                      error: false,
                      content: row
                    });
                  }
                });
              }));
              promiseArray.push(new Promise(function (resolve) {
                db.run('DELETE FROM testTable WHERE id = ?', [idArray[index]], function (err) {
                  if (err || this.changes === 0) {
                    resolve({
                      error: true,
                      err: this.changes === 0 ? "No Change" : err.message
                    });
                  } else {
                    resolve({
                      error: false
                    });
                  }
                });
              }));
            };

            for (i = 0; i < idArray.length; i++) {
              _loop();
            }

            _context9.next = 7;
            return Promise.all(oldPromiseArray);

          case 7:
            oldResult = _context9.sent;
            _context9.next = 10;
            return Promise.all(promiseArray);

          case 10:
            result = _context9.sent;
            errorCounter = 0;

            if (!result) {
              _context9.next = 35;
              break;
            }

            _context9.next = 15;
            return _auditTrail.createData({
              categoryId: "testTable",
              userId: "awcjack",
              dataId: "CUSTOM_ID",
              name: "CUSTOM_NAME",
              before: {},
              after: {},
              action: "BATCH_DELETE" // custom action for specific type

            });

          case 15:
            _parentTrail = _context9.sent;
            parentTrail = _parentTrail.parentTrail;
            commitHash = _parentTrail.commitHash;
            _context9.next = 20;
            return appendCommitMap({
              categoryId: "testTable",
              userId: "awcjack",
              commitHash: commitHash
            });

          case 20:
            _i = 0;

          case 21:
            if (!(_i < result.length)) {
              _context9.next = 32;
              break;
            }

            if (!result[_i].error) {
              _context9.next = 27;
              break;
            }

            console.log(result[_i].err);
            errorCounter++;
            _context9.next = 29;
            break;

          case 27:
            _context9.next = 29;
            return _auditTrail.createData({
              categoryId: "testTable",
              userId: "awcjack",
              dataId: (_result$_i = result[_i]) === null || _result$_i === void 0 ? void 0 : (_result$_i$content = _result$_i.content) === null || _result$_i$content === void 0 ? void 0 : _result$_i$content.id,
              name: (_result$_i2 = result[_i]) === null || _result$_i2 === void 0 ? void 0 : (_result$_i2$content = _result$_i2.content) === null || _result$_i2$content === void 0 ? void 0 : _result$_i2$content.name,
              before: oldResult.error ? {} : oldResult === null || oldResult === void 0 ? void 0 : (_oldResult$_i = oldResult[_i]) === null || _oldResult$_i === void 0 ? void 0 : _oldResult$_i.content,
              after: {},
              action: "DELETE",
              parent: parentTrail
            });

          case 29:
            _i++;
            _context9.next = 21;
            break;

          case 32:
            if (errorCounter > 0) {
              res.send("Batch delete completed with ".concat(errorCounter, " error"));
            } else {
              res.send("Batch delete completed");
            }

            _context9.next = 36;
            break;

          case 35:
            res.send("Batch delete error");

          case 36:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9);
  }));

  return function (_x15, _x16) {
    return _ref15.apply(this, arguments);
  };
}());
app.get('/delete/:id', /*#__PURE__*/function () {
  var _ref16 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee10(req, res) {
    var oldResult, result, _oldResult$content, _oldResult$content2, trail, commitHash;

    return _regeneratorRuntime__default['default'].wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.next = 2;
            return new Promise(function (resolve) {
              db.get('SELECT * FROM testTable WHERE id = ?', [req.params.id], function (err, row) {
                if (err) {
                  resolve({
                    error: true,
                    err: err.message
                  });
                } else {
                  resolve({
                    error: false,
                    content: row
                  });
                }
              });
            });

          case 2:
            oldResult = _context10.sent;
            _context10.next = 5;
            return new Promise(function (resolve) {
              db.run('DELETE FROM testTable WHERE id = ?', [req.params.id], function (err) {
                if (err || this.changes === 0) {
                  resolve({
                    error: true,
                    err: this.changes === 0 ? "No Change" : err.message
                  });
                } else {
                  resolve({
                    error: false
                  });
                }
              });
            });

          case 5:
            result = _context10.sent;

            if (!result) {
              _context10.next = 21;
              break;
            }

            if (!result.error) {
              _context10.next = 12;
              break;
            }

            console.log("Update error: ".concat(result.err));
            res.send(result.err);
            _context10.next = 19;
            break;

          case 12:
            _context10.next = 14;
            return _auditTrail.createData({
              categoryId: "testTable",
              userId: "awcjack",
              dataId: oldResult === null || oldResult === void 0 ? void 0 : (_oldResult$content = oldResult.content) === null || _oldResult$content === void 0 ? void 0 : _oldResult$content.id,
              name: oldResult === null || oldResult === void 0 ? void 0 : (_oldResult$content2 = oldResult.content) === null || _oldResult$content2 === void 0 ? void 0 : _oldResult$content2.name,
              before: oldResult.error ? {} : oldResult === null || oldResult === void 0 ? void 0 : oldResult.content,
              after: {},
              action: "DELETE"
            });

          case 14:
            trail = _context10.sent;
            commitHash = trail.commitHash;
            _context10.next = 18;
            return appendCommitMap({
              categoryId: "testTable",
              userId: "awcjack",
              commitHash: commitHash
            });

          case 18:
            res.send("Delete Done");

          case 19:
            _context10.next = 22;
            break;

          case 21:
            res.send("Delete Error");

          case 22:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10);
  }));

  return function (_x17, _x18) {
    return _ref16.apply(this, arguments);
  };
}());
app.patch('/update', /*#__PURE__*/function () {
  var _ref17 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee11(req, res) {
    var objArray, oldPromiseArray, promiseArray, _loop2, i, oldResult, result, errorCounter, _parentTrail, parentTrail, _i2, _result$_i3, _result$_i3$content, _result$_i4, _result$_i4$content, _oldResult$_i2, _result$_i5, _result$_i5$content, _result$_i6, _result$_i6$content, commitHash;

    return _regeneratorRuntime__default['default'].wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            objArray = req.body.objArray;
            oldPromiseArray = [];
            promiseArray = [];

            _loop2 = function _loop2() {
              var index = i;
              oldPromiseArray.push(new Promise(function (resolve) {
                db.get('SELECT * FROM testTable WHERE id = ?', [objArray[index].id], function (err, row) {
                  if (err) {
                    resolve({
                      error: true,
                      err: err.message
                    });
                  } else {
                    resolve({
                      error: false,
                      content: row
                    });
                  }
                });
              }));
              promiseArray.push(new Promise(function (resolve) {
                db.run('UPDATE testTable SET name = ? WHERE id = ?', [objArray[index].name, objArray[index].id], function (err) {
                  if (err || this.changes === 0) {
                    resolve({
                      error: true,
                      err: this.changes === 0 ? "No Change" : err.message
                    });
                  } else {
                    resolve({
                      error: false,
                      content: {
                        id: objArray[index].id,
                        name: objArray[index].name
                      }
                    });
                  }
                });
              }));
            };

            for (i = 0; i < objArray.length; i++) {
              _loop2();
            }

            _context11.next = 7;
            return Promise.all(oldPromiseArray);

          case 7:
            oldResult = _context11.sent;
            _context11.next = 10;
            return Promise.all(promiseArray);

          case 10:
            result = _context11.sent;
            errorCounter = 0;

            if (!result) {
              _context11.next = 35;
              break;
            }

            _context11.next = 15;
            return _auditTrail.createData({
              categoryId: "testTable",
              userId: "awcjack",
              dataId: "CUSTOM_ID",
              name: "CUSTOM_NAME",
              before: {},
              after: {},
              action: "BATCH_UPDATE" // custom action for specific type

            });

          case 15:
            _parentTrail = _context11.sent;
            parentTrail = _parentTrail.parentTrail;
            _i2 = 0;

          case 18:
            if (!(_i2 < result.length)) {
              _context11.next = 29;
              break;
            }

            if (!result[_i2].error) {
              _context11.next = 24;
              break;
            }

            console.log(result[_i2].err);
            errorCounter++;
            _context11.next = 26;
            break;

          case 24:
            _context11.next = 26;
            return _auditTrail.createData({
              categoryId: "testTable",
              userId: "awcjack",
              dataId: (_result$_i3 = result[_i2]) === null || _result$_i3 === void 0 ? void 0 : (_result$_i3$content = _result$_i3.content) === null || _result$_i3$content === void 0 ? void 0 : _result$_i3$content.id,
              name: (_result$_i4 = result[_i2]) === null || _result$_i4 === void 0 ? void 0 : (_result$_i4$content = _result$_i4.content) === null || _result$_i4$content === void 0 ? void 0 : _result$_i4$content.name,
              before: oldResult.error ? {} : oldResult === null || oldResult === void 0 ? void 0 : (_oldResult$_i2 = oldResult[_i2]) === null || _oldResult$_i2 === void 0 ? void 0 : _oldResult$_i2.content,
              after: {
                id: (_result$_i5 = result[_i2]) === null || _result$_i5 === void 0 ? void 0 : (_result$_i5$content = _result$_i5.content) === null || _result$_i5$content === void 0 ? void 0 : _result$_i5$content.id,
                name: (_result$_i6 = result[_i2]) === null || _result$_i6 === void 0 ? void 0 : (_result$_i6$content = _result$_i6.content) === null || _result$_i6$content === void 0 ? void 0 : _result$_i6$content.name
              },
              action: "UPDATE",
              parent: parentTrail
            });

          case 26:
            _i2++;
            _context11.next = 18;
            break;

          case 29:
            commitHash = _parentTrail.commitHash;
            _context11.next = 32;
            return appendCommitMap({
              categoryId: "testTable",
              userId: "awcjack",
              commitHash: commitHash
            });

          case 32:
            if (errorCounter > 0) {
              res.send("Batch update completed with ".concat(errorCounter, " error"));
            } else {
              res.send("Batch update completed");
            }

            _context11.next = 36;
            break;

          case 35:
            res.send("Batch update error");

          case 36:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11);
  }));

  return function (_x19, _x20) {
    return _ref17.apply(this, arguments);
  };
}());
app.get('/update/:id/:name', /*#__PURE__*/function () {
  var _ref18 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee12(req, res) {
    var oldResult, result, _result$content, _result$content2, _result$content3, _result$content4, trail, commitHash;

    return _regeneratorRuntime__default['default'].wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.next = 2;
            return new Promise(function (resolve) {
              db.get('SELECT * FROM testTable WHERE id = ?', [req.params.id], function (err, row) {
                if (err) {
                  resolve({
                    error: true,
                    err: err.message
                  });
                } else {
                  resolve({
                    error: false,
                    content: row
                  });
                }
              });
            });

          case 2:
            oldResult = _context12.sent;
            _context12.next = 5;
            return new Promise(function (resolve) {
              db.run('UPDATE testTable SET name = ? WHERE id = ?', [req.params.name, req.params.id], function (err) {
                if (err || this.changes === 0) {
                  resolve({
                    error: true,
                    err: this.changes === 0 ? "No Change" : err.message
                  });
                } else {
                  resolve({
                    error: false,
                    content: {
                      id: req.params.id,
                      name: req.params.name
                    }
                  });
                }
              });
            });

          case 5:
            result = _context12.sent;

            if (!result) {
              _context12.next = 21;
              break;
            }

            if (!result.error) {
              _context12.next = 12;
              break;
            }

            console.log("Update error: ".concat(result.err));
            res.send(result.err);
            _context12.next = 19;
            break;

          case 12:
            _context12.next = 14;
            return _auditTrail.createData({
              categoryId: "testTable",
              userId: "awcjack",
              dataId: result === null || result === void 0 ? void 0 : (_result$content = result.content) === null || _result$content === void 0 ? void 0 : _result$content.id,
              name: result === null || result === void 0 ? void 0 : (_result$content2 = result.content) === null || _result$content2 === void 0 ? void 0 : _result$content2.name,
              before: oldResult.error ? {} : oldResult === null || oldResult === void 0 ? void 0 : oldResult.content,
              after: {
                // expected to use the response object if possible but sqlite won't response with request object
                id: result === null || result === void 0 ? void 0 : (_result$content3 = result.content) === null || _result$content3 === void 0 ? void 0 : _result$content3.id,
                name: result === null || result === void 0 ? void 0 : (_result$content4 = result.content) === null || _result$content4 === void 0 ? void 0 : _result$content4.name
              },
              action: "UPDATE"
            });

          case 14:
            trail = _context12.sent;
            commitHash = trail.commitHash;
            _context12.next = 18;
            return appendCommitMap({
              categoryId: "testTable",
              userId: "awcjack",
              commitHash: commitHash
            });

          case 18:
            res.send("Update Done");

          case 19:
            _context12.next = 22;
            break;

          case 21:
            res.send("Update Error");

          case 22:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12);
  }));

  return function (_x21, _x22) {
    return _ref18.apply(this, arguments);
  };
}());
app.post('/add', /*#__PURE__*/function () {
  var _ref19 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee13(req, res) {
    var objArray, promoiseArray, _loop3, i, result, errorCounter, _parentTrail, parentTrail, _i3, _result$_i7, _result$_i7$content, _result$_i8, _result$_i8$content, _result$_i9, _result$_i9$content, _result$_i10, _result$_i10$content, commitHash;

    return _regeneratorRuntime__default['default'].wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            objArray = req.body.objArray;
            promoiseArray = [];

            _loop3 = function _loop3() {
              var index = i;
              promoiseArray.push(new Promise(function (resolve) {
                db.run('INSERT INTO testTable(id, name) VALUES(?, ?)', [objArray[i].id, objArray[i].name], function (err) {
                  if (err) {
                    resolve({
                      error: true,
                      err: err.message
                    });
                  } else {
                    resolve({
                      error: false,
                      content: {
                        id: objArray[index].id,
                        name: objArray[index].name
                      }
                    });
                  }
                });
              }));
            };

            for (i = 0; i < objArray.length; i++) {
              _loop3();
            }

            _context13.next = 6;
            return Promise.all(promoiseArray);

          case 6:
            result = _context13.sent;
            errorCounter = 0;

            if (!result) {
              _context13.next = 31;
              break;
            }

            _context13.next = 11;
            return _auditTrail.createData({
              categoryId: "testTable",
              userId: "awcjack",
              dataId: "CUSTOM_ID",
              name: "CUSTOM_NAME",
              before: {},
              after: {},
              action: "BATCH_INSERT" // custom action for specific type

            });

          case 11:
            _parentTrail = _context13.sent;
            parentTrail = _parentTrail.parentTrail;
            _i3 = 0;

          case 14:
            if (!(_i3 < result.length)) {
              _context13.next = 25;
              break;
            }

            if (!result[_i3].error) {
              _context13.next = 20;
              break;
            }

            console.log(result[_i3].err);
            errorCounter++;
            _context13.next = 22;
            break;

          case 20:
            _context13.next = 22;
            return _auditTrail.createData({
              categoryId: "testTable",
              userId: "awcjack",
              dataId: (_result$_i7 = result[_i3]) === null || _result$_i7 === void 0 ? void 0 : (_result$_i7$content = _result$_i7.content) === null || _result$_i7$content === void 0 ? void 0 : _result$_i7$content.id,
              name: (_result$_i8 = result[_i3]) === null || _result$_i8 === void 0 ? void 0 : (_result$_i8$content = _result$_i8.content) === null || _result$_i8$content === void 0 ? void 0 : _result$_i8$content.name,
              before: {},
              after: {
                id: (_result$_i9 = result[_i3]) === null || _result$_i9 === void 0 ? void 0 : (_result$_i9$content = _result$_i9.content) === null || _result$_i9$content === void 0 ? void 0 : _result$_i9$content.id,
                name: (_result$_i10 = result[_i3]) === null || _result$_i10 === void 0 ? void 0 : (_result$_i10$content = _result$_i10.content) === null || _result$_i10$content === void 0 ? void 0 : _result$_i10$content.name
              },
              action: "CREATE",
              parent: parentTrail
            });

          case 22:
            _i3++;
            _context13.next = 14;
            break;

          case 25:
            commitHash = _parentTrail.commitHash;
            _context13.next = 28;
            return appendCommitMap({
              categoryId: "testTable",
              userId: "awcjack",
              commitHash: commitHash
            });

          case 28:
            if (errorCounter > 0) {
              res.send("Batch insert completed with ".concat(errorCounter, " error"));
            } else {
              res.send("Batch insert completed");
            }

            _context13.next = 32;
            break;

          case 31:
            res.send("Batch insert error");

          case 32:
          case "end":
            return _context13.stop();
        }
      }
    }, _callee13);
  }));

  return function (_x23, _x24) {
    return _ref19.apply(this, arguments);
  };
}());
app.get('/add/:id/:name', /*#__PURE__*/function () {
  var _ref20 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee14(req, res) {
    var result, _result$content5, _result$content6, _result$content7, _result$content8, trail, commitHash;

    return _regeneratorRuntime__default['default'].wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            _context14.next = 2;
            return new Promise(function (resolve) {
              db.run('INSERT INTO testTable(id, name) VALUES(?, ?)', [req.params.id, req.params.name], function (err) {
                if (err) {
                  resolve({
                    error: true,
                    err: err.message
                  });
                } else {
                  resolve({
                    error: false,
                    content: {
                      id: req.params.id,
                      name: req.params.name
                    }
                  });
                }
              });
            });

          case 2:
            result = _context14.sent;

            if (!result) {
              _context14.next = 18;
              break;
            }

            if (!result.error) {
              _context14.next = 9;
              break;
            }

            console.log("Insert error: ".concat(result.err));
            res.send(result.err);
            _context14.next = 16;
            break;

          case 9:
            _context14.next = 11;
            return _auditTrail.createData({
              categoryId: "testTable",
              userId: "awcjack",
              dataId: result === null || result === void 0 ? void 0 : (_result$content5 = result.content) === null || _result$content5 === void 0 ? void 0 : _result$content5.id,
              name: result === null || result === void 0 ? void 0 : (_result$content6 = result.content) === null || _result$content6 === void 0 ? void 0 : _result$content6.name,
              before: {},
              after: {
                // expected to use the response object if possible but sqlite won't response with request object
                id: result === null || result === void 0 ? void 0 : (_result$content7 = result.content) === null || _result$content7 === void 0 ? void 0 : _result$content7.id,
                name: result === null || result === void 0 ? void 0 : (_result$content8 = result.content) === null || _result$content8 === void 0 ? void 0 : _result$content8.name
              },
              action: "CREATE"
            });

          case 11:
            trail = _context14.sent;
            commitHash = trail.commitHash;
            _context14.next = 15;
            return appendCommitMap({
              categoryId: "testTable",
              userId: "awcjack",
              commitHash: commitHash
            });

          case 15:
            res.send("Insert Done");

          case 16:
            _context14.next = 19;
            break;

          case 18:
            res.send("Insert Error");

          case 19:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee14);
  }));

  return function (_x25, _x26) {
    return _ref20.apply(this, arguments);
  };
}()); // revert commit

app.get('/revert/:hash', /*#__PURE__*/function () {
  var _ref21 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee15(req, res) {
    var result;
    return _regeneratorRuntime__default['default'].wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            _context15.next = 2;
            return _auditTrail.revertCommit({
              commitHash: req.params.hash
            });

          case 2:
            result = _context15.sent;
            console.log("result", result);
            res.json(result);

          case 5:
          case "end":
            return _context15.stop();
        }
      }
    }, _callee15);
  }));

  return function (_x27, _x28) {
    return _ref21.apply(this, arguments);
  };
}());
app.get('/cherrypick/:hash', /*#__PURE__*/function () {
  var _ref22 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee16(req, res) {
    var result;
    return _regeneratorRuntime__default['default'].wrap(function _callee16$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:
            _context16.next = 2;
            return _auditTrail.cherryPick({
              commitHash: req.params.hash
            });

          case 2:
            result = _context16.sent;
            console.log("result", result);
            res.json(result);

          case 5:
          case "end":
            return _context16.stop();
        }
      }
    }, _callee16);
  }));

  return function (_x29, _x30) {
    return _ref22.apply(this, arguments);
  };
}());
app.get('/checkout/:hash', /*#__PURE__*/function () {
  var _ref23 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee17(req, res) {
    var _result$error;

    var commitHashMap, currentCommit, result, _req$params, _req$params2, _iterator, _step, _result, keys, _i4, _keys, _result$key, key, _result2;

    return _regeneratorRuntime__default['default'].wrap(function _callee17$(_context17) {
      while (1) {
        switch (_context17.prev = _context17.next) {
          case 0:
            _context17.next = 2;
            return new Promise(function (resolve) {
              db.get('SELECT * FROM commitMap WHERE categoryId = ?', ["testTable"], function (err, row) {
                if (err || !row) {
                  resolve({
                    error: true,
                    err: err === null || err === void 0 ? void 0 : err.message
                  });
                } else {
                  resolve({
                    error: false,
                    commitMap: row.commitHashMap
                  });
                }
              });
            });

          case 2:
            commitHashMap = _context17.sent;
            _context17.next = 5;
            return new Promise(function (resolve) {
              db.get('SELECT * FROM currentCommit WHERE categoryId = ?', ["testTable"], function (err, row) {
                if (err || !row) {
                  resolve({
                    error: true,
                    err: err === null || err === void 0 ? void 0 : err.message
                  });
                } else {
                  resolve({
                    error: false,
                    commitHash: row.commitHash
                  });
                }
              });
            });

          case 5:
            currentCommit = _context17.sent;
            console.log("commitHashMap", commitHashMap);
            console.log("currentCommit", currentCommit);
            result = {
              error: [],
              result: {}
            };

            if (commitHashMap.error) {
              _context17.next = 18;
              break;
            }

            if (currentCommit.error) {
              _context17.next = 18;
              break;
            }

            if (!(req !== null && req !== void 0 && (_req$params = req.params) !== null && _req$params !== void 0 && _req$params.hash && typeof (req === null || req === void 0 ? void 0 : (_req$params2 = req.params) === null || _req$params2 === void 0 ? void 0 : _req$params2.hash) === "string")) {
              _context17.next = 18;
              break;
            }

            _context17.next = 14;
            return _auditTrail.checkout({
              commitHashMap: commitHashMap.commitMap,
              currentCommit: currentCommit.commitHash,
              commitHash: req.params.hash
            });

          case 14:
            result.result = _context17.sent;
            result.error = [];
            _iterator = _createForOfIteratorHelper(result.result);

            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                _result = _step.value;
                keys = Object.keys(_result);

                for (_i4 = 0, _keys = keys; _i4 < _keys.length; _i4++) {
                  key = _keys[_i4];

                  if (_result !== null && _result !== void 0 && (_result$key = _result[key]) !== null && _result$key !== void 0 && _result$key.error) {
                    result.error.push(_result);
                  }
                }
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }

          case 18:
            if (!((result === null || result === void 0 ? void 0 : (_result$error = result.error) === null || _result$error === void 0 ? void 0 : _result$error.length) === 0)) {
              _context17.next = 23;
              break;
            }

            _context17.next = 21;
            return new Promise(function (resolve) {
              db.run('UPDATE currentCommit SET commitHash = ? WHERE categoryId = ?', [req.params.hash, "testTable"], function (err) {
                if (err || this.changes === 0) {
                  console.log("update user current commit error", err.message || "No change");
                  resolve({
                    error: true
                  });
                }

                resolve({
                  error: false
                });
              });
            });

          case 21:
            _result2 = _context17.sent;

            if (!_result2.error) {
              result.saved = true;
            } else {
              result.saved = false;
            }

          case 23:
            res.json(result);

          case 24:
          case "end":
            return _context17.stop();
        }
      }
    }, _callee17);
  }));

  return function (_x31, _x32) {
    return _ref23.apply(this, arguments);
  };
}());
app.get('/close', function (req, res) {
  db.close(function (err) {
    if (err) {
      return console.error(err.message);
    }

    console.log('Close the database connection.');
  });
  res.send("Server closed");
  server.close();
  process.exit(0);
});
