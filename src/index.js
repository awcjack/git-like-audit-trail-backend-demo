import _ from "lodash"
import sqlite3 from "sqlite3"
import express from "express"
import bodyParser from "body-parser"
import auditTrail from "git-like-audit-trail"
var cors = require('cors')

var app = express()
var server = app.listen(5000, () => console.log("Listening of localhost:5000"))
app.use(cors())
app.use(bodyParser.json())

let db = new sqlite3.Database('./test.db', (err) => {
    if (err) {
        return console.error(err.message)
    }
    console.log('Connected to the local SQlite database.')
})

async function appendCommitMap({
    categoryId,
    commitHash
}) {
    const currentCommit = await new Promise ((resolve) => {
        db.get('SELECT * FROM currentCommit WHERE categoryId = ?', [categoryId], function (err, row) {
            if (err) {
                console.log("query user current commit error", err.message)
            } else {
                if (row) {
                    console.log(`user awcjack in commit ${row.commitHash}`)
                    resolve({
                        exist: true,
                        current: row.commitHash,
                    })
                    // row already exist --> update
                } else {
                    resolve({
                        exist: false
                    })
                }
            }
        })
    })
    if (currentCommit.exist) {
        db.run('UPDATE currentCommit SET commitHash = ? WHERE categoryId = ?', [commitHash, categoryId], function (err) {
            if (err || this.changes === 0) {
                console.log("update user current commit error", err.message || "No change")
            }
        })
    } else {
        db.run('INSERT INTO currentCommit(categoryId, commitHash) VALUES(?, ?)', [categoryId, commitHash], function (err) {
            if (err) {
                console.log("insert user current commit error", err.message)
            }
        })
    }
    console.log(`user awcjack in commit ${commitHash} now`)

    const currentCommitMap = await new Promise ((resolve) => {
            db.get('SELECT * FROM commitMap WHERE categoryId = ?', [categoryId], function (err, row) {
            if (err) {
                console.log("query commit map error", err.message)
            } else {
                if (row) {
                    console.log("commit map", row.commitHashMap)
                    resolve({
                        exist: true,
                        current: row.commitHashMap
                    })
                } else {
                    resolve({
                        exist: false
                    })
                }
            }
        })
    })

    if (currentCommitMap.exist) {
        if (currentCommit.exist) {
            db.run('UPDATE commitMap SET commitHashMap = ? WHERE categoryId = ?', [_auditTrail.appendCommitMap({
                currentCommitMap: currentCommitMap.current,
                currentCommitHash: currentCommit.current,
                newCommitHash: commitHash
            }), categoryId], function (err) {
                if (err || this.changes === 0) {
                    console.log("update user current commit error", err.message || "No change")
                }
            })
        } else {
            console.log("Consist commit map but not commit hash in user")
            db.run('UPDATE commitMap SET commitHashMap = ? WHERE categoryId = ?', [_auditTrail.appendCommitMap({
                currentCommitMap: currentCommitMap.current,
                currentCommitHash: "",
                newCommitHash: commitHash
            }), categoryId], function (err) {
                if (err || this.changes === 0) {
                    console.log("update user current commit error", err.message || "No change")
                }
            })
        }
    } else {
        if (currentCommit.exist) {
            console.log("Consist currect commit in user without commit map")
            db.run('INSERT INTO commitMap(categoryId, commitHashMap) VALUES (?, ?)', [categoryId, _auditTrail.appendCommitMap({
                currentCommitMap: "{}",
                currentCommitHash: currentCommit.current,
                newCommitHash: commitHash
            })], function (err) {
                if (err || this.changes === 0) {
                    console.log("update user current commit error", err.message || "No change")
                }
            })
        } else {
            db.run('INSERT INTO commitMap(categoryId, commitHashMap) VALUES (?, ?)', [categoryId, _auditTrail.appendCommitMap({
                currentCommitMap: "{}",
                currentCommitHash: "",
                newCommitHash: commitHash
            })], function (err) {
                if (err || this.changes === 0) {
                    console.log("update user current commit error", err.message || "No change")
                }
            })
        }                
    }
}

const databaseAddOneRowFunction = async ({
    data,
    auditTrail = true, // checkout to specific commit shd not create auditTrail
    parentTrail
}) => {
    const result = await new Promise((resolve) => {
        db.run(`INSERT INTO ${data.categoryId}(id, name) VALUES(?, ?)`, [data.dataId, data.name], function (err) {
            if (err) {
                resolve({
                    error: true,
                    err: err.message
                })
            } else {
                resolve({
                    error: false,
                    content: {
                        id: data.dataId,
                        name: data.name
                    }
                })
            }
        })
    })
    if (auditTrail) {
        const trail = await _auditTrail.createData({
            categoryId: data.categoryId,
            userId: "awcjack",
            dataId: data.dataId,
            name: data.name,
            before: {},
            after: result.content,
            action: "CREATE",
            parent: parentTrail
        })
        const { commitHash } = trail
        await appendCommitMap({
            categoryId: data.categoryId,
            userId: "awcjack",
            commitHash
        })
        result.commitHash = commitHash
    }
    return result
}

const databaseDeleteOneRowFunction = async ({
    data,
    auditTrail = true,
    parentTrail
}) => {
    const result = await new Promise((resolve) => {
        db.run(`DELETE FROM ${data.categoryId} WHERE id = ?`, [data.dataId], function (err) {
            if (err) {
                resolve({
                    error: true,
                    err: err.message
                })
            } else {
                resolve({
                    error: false,
                    content: {
                        id: data.dataId,
                        name: data.name
                    }
                })
            }
        })
    })
    if (auditTrail) {
        const trail = await _auditTrail.createData({
            categoryId: data.categoryId,
            userId: "awcjack",
            dataId: data.dataId,
            name: data.name,
            before: result.content,
            after: {},
            action: "DELETE",
            parent: parentTrail
        })
        const { commitHash } = trail
        await appendCommitMap({
            categoryId: data.categoryId,
            userId: "awcjack",
            commitHash
        })
        result.commitHash = commitHash
    }
    return result
}

const databaseUpdateOneRowFunction = async ({
    data,
    changedObj, // sqlite doesn't support putting object into row, so expect changes always is point to string
    addChangedObj,
    deleteChangedObj,
    revert = true,
    auditTrail = true,
    parentTrail
}) => {
    const _data = await new Promise((resolve) => {
        db.get(`SELECT * FROM ${data.categoryId} WHERE id = ?`, [data.dataId], function (err, row) {
            if (err || !row) {
                resolve({
                    error: true,
                    err: err?.message
                })
            } else {
                resolve({
                    error: false,
                    row
                })
            }
        })
    })

    if (!_data.error) {
        const changes = []
        const content = {}
        if (!_.isEmpty(changedObj)) {
            for (const key in changedObj) {
                changes.push(`${key} = '${changedObj[key]}'`)
                content[key] = changedObj[key]
            }
        }
        if (!_.isEmpty(addChangedObj)) {
            for (const key in addChangedObj) {
                if (key !== "id") {
                    if (revert) {
                        changes.push(`${key} = NULL`)
                        content[key] = null
                    } else {
                        changes.push(`${key} = '${addChangedObj[key]}'`)
                        content[key] = addChangedObj[key]
                    }
                }
            }
        }
        if (!_.isEmpty(deleteChangedObj)) {
            for (const key in deleteChangedObj) {
                if (key !== "id") {
                    if (revert) {
                        changes.push(`${key} = '${deleteChangedObj[key]}'`)
                        content[key] = deleteChangedObj[key]
                    } else {
                        changes.push(`${key} = NULL`)
                        content[key] = null
                    }
                }
            }
        }
        const result = await new Promise((resolve) => {
            db.run(`UPDATE ${data.categoryId} SET ${changes.join(", ")} WHERE id = ${data.dataId}`, [], (err) => {
                if (err) {
                    resolve({
                        error: true,
                        err: err.message
                    })
                } else {
                    resolve({
                        error: false,
                        content
                    })
                }
            })
        })
        if (auditTrail) {
            const trail = await _auditTrail.createData({
                categoryId: data.categoryId,
                userId: "awcjack",
                dataId: data.dataId,
                name: data.name,
                before: _data?.row,
                after: result?.content,
                action: "UPDATE",
                parent: parentTrail
            })
            const { commitHash } = trail
            await appendCommitMap({
                categoryId: data.categoryId,
                userId: "awcjack",
                commitHash
            })
            result.commitHash = commitHash
        }
        return result
    }
    return null
}

const _auditTrail = new auditTrail({
    databaseAddOneRowFunction,
    databaseDeleteOneRowFunction,
    databaseUpdateOneRowFunction
})

db.run('CREATE TABLE IF NOT EXISTS testTable (id TEXT PRIMARY KEY,name TEXT)') // target table for CRUD
db.run('CREATE TABLE IF NOT EXISTS currentCommit (categoryId TEXT PRIMARY KEY, commitHash TEXT)') // table for saving user current commit
db.run('CREATE TABLE IF NOT EXISTS commitMap (categoryId TEXT PRIMARY KEY,commitHashMap TEXT)') // table for saving commit map (git tree diagram)

app.get('/', function (req, res) {
    res.send("SQLite CRUD git-like-audit-trail demo")
})

// query one commit id
app.get('/query/git/:hash', async function (req, res) {
    const result = await _auditTrail.queryByCommitHash({
        commitHash: req.params.hash
    })
    res.json(result)
})

// batch query commit id
app.post('/query/git', async function (req, res) {
    const {
        commitHashArray 
    } = req.body
    const result = await _auditTrail.batchQueryByCommitHash({
        commitHashArray
    })
    res.json(result)
})

// construct tree-like commit tree
app.get('/query/git', async function (req, res) {
    const commitHashMap = await new Promise((resolve) => {
        db.get('SELECT * FROM commitMap WHERE categoryId = ?', ["testTable"], function (err, row) {
            if (err || !row) {
                resolve({
                    error: true,
                    err: err?.message
                })
            } else {
                resolve({
                    error: false,
                    commitMap: row.commitHashMap
                })
            }
        })
    })

    const currentCommit = await new Promise((resolve) => {
        db.get('SELECT * FROM currentCommit WHERE categoryId = ?', ["testTable"], function (err, row) {
            if (err || !row) {
                resolve({
                    error: true,
                    err: err?.message
                })
            } else {
                resolve({
                    error: false,
                    commitHash: row.commitHash
                })
            }
        })
    })

    if (commitHashMap.error || currentCommit.error) {
        console.log("Either query commit hash map or user current commit error")
        res.send(`Query error ${commitHashMap.err} ${currentCommit.err}`)
    } else {
        const result = await _auditTrail.query({
            commitHashMap: commitHashMap.commitMap,
            commitHash: currentCommit.commitHash,
            onlyCurrentBranch: false,
            getCommitInfo: true
        })
        res.json(result)
    }
})

function parseD3Tree({
    d3Tree,
    color,
    loadMore = false
}) {
    if (!color) {
        const _tmp = parseInt(d3Tree?.name?.substring(d3Tree?.name?.length - 10), 16)
        color = (_tmp % 16777216).toString(16) // ffffff + 1
    }
    d3Tree.nodeProps = {
        id: d3Tree?.name,
        style: {
            fill: `#${color}`,
            r: 10
        }
    }
    if (!loadMore && d3Tree.currentCommit) {
        d3Tree.nodeProps = {
            id: d3Tree?.name,
            style: {
                fill: `#F3F3FF`,
                stroke: `#${color}`,
                r: 12
            }
        }
    } else if (d3Tree.currentCommit) {
        delete d3Tree.currentCommit
    }
    if (d3Tree.children) {
        for (let i = 0; i < d3Tree.children?.length ?? 0; i++) {
            if (i !== 0) {
                const _tmp = parseInt(d3Tree?.children?.[i]?.name?.substring(d3Tree?.name?.length - 10), 16)
                color = (_tmp % 16777216).toString(16)
            }
            d3Tree.children[i] = parseD3Tree({
                d3Tree: d3Tree?.children?.[i],
                color,
                loadMore
            })
        }
    } else {
        // last level
        d3Tree.lastLevel = true
    }
    return d3Tree
}

// construct d3 tree
app.get('/query/d3', async function (req, res) {
    const commitHashMap = await new Promise((resolve) => {
        db.get('SELECT * FROM commitMap WHERE categoryId = ?', ["testTable"], function (err, row) {
            if (err || !row) {
                resolve({
                    error: true,
                    err: err?.message
                })
            } else {
                resolve({
                    error: false,
                    commitMap: row.commitHashMap
                })
            }
        })
    })

    const currentCommit = await new Promise((resolve) => {
        db.get('SELECT * FROM currentCommit WHERE categoryId = ?', ["testTable"], function (err, row) {
            if (err || !row) {
                resolve({
                    error: true,
                    err: err?.message
                })
            } else {
                resolve({
                    error: false,
                    commitHash: row.commitHash
                })
            }
        })
    })

    if (commitHashMap.error || currentCommit.error) {
        console.log("Either query commit hash map or user current commit error")
        res.send(`Query error ${commitHashMap.err} ${currentCommit.err}`)
    } else {
        let result = await _auditTrail.queryD3({
            commitHashMap: commitHashMap.commitMap,
            commitHash: currentCommit.commitHash,
            onlyCurrentBranch: false,
            getCommitInfo: true,
            ignore: ["parentTrail"],
            format: "text"
        })
        // assign colour
        for (let i = 0; i < result.length; i++) {
            result[i] = parseD3Tree({
                d3Tree: result[i]
            })
        }
        res.json(result)
    }
})

app.post('/d3/loadMore', async function (req, res) {
    const {
        commitHash,
        color,
        before = 0,
        after = 0
    } = req.body
    const commitHashMap = await new Promise((resolve) => {
        db.get('SELECT * FROM commitMap WHERE categoryId = ?', ["testTable"], function (err, row) {
            if (err || !row) {
                resolve({
                    error: true,
                    err: err?.message
                })
            } else {
                resolve({
                    error: false,
                    commitMap: row.commitHashMap
                })
            }
        })
    })
    if (commitHashMap.error) {
        console.log("Query commit hash map error")
        res.send(`Query error ${commitHashMap.err}`)
    } else {
        let result = await _auditTrail.queryD3({
            commitHashMap: commitHashMap.commitMap,
            commitHash,
            before,
            after,
            onlyCurrentBranch: before > 0 ? false : true,
            getCommitInfo: true,
            ignore: ["parentTrail"],
            format: "text"
        })
        // assign colour
        if (result.length !== 0) {
            // must only one root
            if (result[0].currentCommit) {
                delete result[0].currentCommit
            }
            result[0] = parseD3Tree({
                d3Tree: result[0],
                color,
                loadMore: true
            })
        }
        
        res.json(result)
    }
})

// get testTable data
app.get('/query', function (req, res) {
    db.all('SELECT * FROM testTable', [], function (err, row) {
        if (err) {
            console.log("err", err.message)
            res.send(`Query Error, ${err.message}`)
        } else {
            res.json(row)
            console.log(`All row has been queried`)
        }
    })
})

// get current commit table data
app.get('/query/currentCommit', function (req, res) {
    db.all('SELECT * FROM currentCommit', [], function (err, row) {
        if (err) {
            console.log("err", err.message)
            res.send(`Query Error, ${err.message}`)
        } else {
            res.json(row)
            console.log(`All row has been queried`)
        }
    })
})

// get commit map data
app.get('/query/commitMap', function (req, res) {
    db.all('SELECT * FROM commitMap', [], function (err, row) {
        if (err) {
            console.log("err", err.message)
            res.send(`Query Error, ${err.message}`)
        } else {
            res.json(row)
            console.log(`All row has been queried`)
        }
    })
})

app.get('/query/:id', function (req, res) {
    db.get('SELECT * FROM testTable WHERE id = ?', [req.params.id], function (err, row) {
        if (err) {
            console.log("err", err.message)
            res.send(`Query Error, ${err.message}`)
        } else {
            res.json(row)
            console.log(`A row has been queried with rowid ${req.params.id}`)
        }
    })
})

app.delete('/delete', async function (req, res) {
    const {
        idArray
    } = req.body
    
    const oldPromiseArray = []
    const promiseArray = []

    for (var i = 0; i < idArray.length; i++) {
        const index = i
        oldPromiseArray.push(new Promise((resolve) => {
            db.get('SELECT * FROM testTable WHERE id = ?', [idArray[index]], function (err, row) {
                if (err) {
                    resolve({
                        error: true,
                        err: err.message
                    })
                } else {
                    resolve({
                        error: false,
                        content: row
                    })
                }
            })
        }))
        promiseArray.push(new Promise((resolve) => {
            db.run('DELETE FROM testTable WHERE id = ?', [idArray[index]], function (err) {
                if (err || this.changes === 0) {
                    resolve({
                        error: true,
                        err: this.changes === 0 ? "No Change" : err.message 
                    })
                } else {
                    resolve({
                        error: false,
                    })
                }
            })
        }))
    }

    const oldResult = await Promise.all(oldPromiseArray)
    const result = await Promise.all(promiseArray)

    let errorCounter = 0
    if (result) {
        const _parentTrail = await _auditTrail.createData({
            categoryId: "testTable",
            userId: "awcjack",
            dataId: "CUSTOM_ID",
            name: "CUSTOM_NAME",
            before: {},
            after: {},
            action: "BATCH_DELETE" // custom action for specific type
        })
        const { parentTrail } = _parentTrail
        
        const { commitHash } = _parentTrail
        await appendCommitMap({
            categoryId: "testTable",
            userId: "awcjack",
            commitHash
        })

        for (let i = 0; i < result.length; i++) {
            if (result[i].error) {
                console.log(result[i].err)
                errorCounter++
            } else {
                await _auditTrail.createData({
                    categoryId: "testTable",
                    userId: "awcjack",
                    dataId: result[i]?.content?.id,
                    name: result[i]?.content?.name,
                    before: oldResult.error ? {} : oldResult?.[i]?.content,
                    after: {},
                    action: "DELETE",
                    parent: parentTrail
                })
            }
        }
        if (errorCounter > 0) {
            res.send(`Batch delete completed with ${errorCounter} error`)
        } else {
            res.send(`Batch delete completed`)
        }
    } else {
        res.send("Batch delete error")
    }
})

app.get('/delete/:id', async function (req, res) {
    const oldResult = await new Promise((resolve) => {
        db.get('SELECT * FROM testTable WHERE id = ?', [req.params.id], function (err, row) {
            if (err) {
                resolve({
                    error: true,
                    err: err.message
                })
            } else {
                resolve({
                    error: false,
                    content: row
                })
            }
        })
    })

    const result = await new Promise((resolve) => {
        db.run('DELETE FROM testTable WHERE id = ?', [req.params.id], function (err) {
            if (err || this.changes === 0) {
                resolve({
                    error: true,
                    err: this.changes === 0 ? "No Change" : err.message
                })
            } else {
                resolve({
                    error: false,
                })
            }
        })
    })

    if (result) {
        if (result.error) {
            console.log(`Update error: ${result.err}`)
            res.send(result.err)
        } else {
            const trail = await _auditTrail.createData({
                categoryId: "testTable",
                userId: "awcjack",
                dataId: oldResult?.content?.id,
                name: oldResult?.content?.name,
                before: oldResult.error ? {} : oldResult?.content,
                after: {},
                action: "DELETE",
            })

            const { commitHash } = trail
            await appendCommitMap({
                categoryId: "testTable",
                userId: "awcjack",
                commitHash
            })

            res.send("Delete Done")
        }
    } else {
        res.send("Delete Error")
    }
})

app.patch('/update', async function (req, res) {
    const {
        objArray
    } = req.body
    
    const oldPromiseArray = []
    const promiseArray = []

    for (var i = 0; i < objArray.length; i++) {
        const index = i
        oldPromiseArray.push(new Promise((resolve) => {
            db.get('SELECT * FROM testTable WHERE id = ?', [objArray[index].id], function (err, row) {
                if (err) {
                    resolve({
                        error: true,
                        err: err.message
                    })
                } else {
                    resolve({
                        error: false,
                        content: row
                    })
                }
            })
        }))
        promiseArray.push(new Promise((resolve) => {
            db.run('UPDATE testTable SET name = ? WHERE id = ?', [objArray[index].name, objArray[index].id], function (err) {
                if (err || this.changes === 0) {
                    resolve({
                        error: true,
                        err: this.changes === 0 ? "No Change" : err.message 
                    })
                } else {
                    resolve({
                        error: false,
                        content: {
                            id: objArray[index].id,
                            name: objArray[index].name
                        }
                    })
                }
            })
        }))
    }

    const oldResult = await Promise.all(oldPromiseArray)
    const result = await Promise.all(promiseArray)

    let errorCounter = 0
    if (result) {
        const _parentTrail = await _auditTrail.createData({
            categoryId: "testTable",
            userId: "awcjack",
            dataId: "CUSTOM_ID",
            name: "CUSTOM_NAME",
            before: {},
            after: {},
            action: "BATCH_UPDATE" // custom action for specific type
        })
        const { parentTrail } = _parentTrail
        
        for (let i = 0; i < result.length; i++) {
            if (result[i].error) {
                console.log(result[i].err)
                errorCounter++
            } else {
                await _auditTrail.createData({
                    categoryId: "testTable",
                    userId: "awcjack",
                    dataId: result[i]?.content?.id,
                    name: result[i]?.content?.name,
                    before: oldResult.error ? {} : oldResult?.[i]?.content,
                    after: {
                        id: result[i]?.content?.id,
                        name: result[i]?.content?.name,
                    },
                    action: "UPDATE",
                    parent: parentTrail
                })
            }
        }

        const { commitHash } = _parentTrail
        await appendCommitMap({
            categoryId: "testTable",
            userId: "awcjack",
            commitHash
        })

        if (errorCounter > 0) {
            res.send(`Batch update completed with ${errorCounter} error`)
        } else {
            res.send(`Batch update completed`)
        }
    } else {
        res.send("Batch update error")
    }
})

app.get('/update/:id/:name',  async function (req, res) {
    const oldResult = await new Promise((resolve) => {
        db.get('SELECT * FROM testTable WHERE id = ?', [req.params.id], function (err, row) {
            if (err) {
                resolve({
                    error: true,
                    err: err.message
                })
            } else {
                resolve({
                    error: false,
                    content: row
                })
            }
        })
    })
    const result = await new Promise((resolve) => {
        db.run('UPDATE testTable SET name = ? WHERE id = ?', [req.params.name, req.params.id], function (err) {
            if (err || this.changes === 0) {
                resolve({
                    error: true,
                    err: this.changes === 0 ? "No Change" : err.message 
                })
            } else {
                resolve({
                    error: false,
                    content: {
                        id: req.params.id,
                        name: req.params.name
                    }
                })
            }
        })
    })
    if (result) {
        if (result.error) {
            console.log(`Update error: ${result.err}`)
            res.send(result.err)
        } else {
            const trail = await _auditTrail.createData({
                categoryId: "testTable",
                userId: "awcjack",
                dataId: result?.content?.id,
                name: result?.content?.name,
                before: oldResult.error ? {} : oldResult?.content,
                after: {
                    // expected to use the response object if possible but sqlite won't response with request object
                    id: result?.content?.id,
                    name: result?.content?.name,
                },
                action: "UPDATE",
            })

            const { commitHash } = trail
            await appendCommitMap({
                categoryId: "testTable",
                userId: "awcjack",
                commitHash
            })

            res.send("Update Done")
        }
    } else {
        res.send("Update Error")
    }
})

app.post('/add', async function (req, res) {
    const {
        objArray
    } = req.body
    
    const promoiseArray = []

    for (var i = 0; i < objArray.length; i++) {
        const index = i
        promoiseArray.push(new Promise((resolve) => {
            db.run('INSERT INTO testTable(id, name) VALUES(?, ?)', [objArray[i].id, objArray[i].name], function (err) {
                if (err) {
                    resolve({
                        error: true,
                        err: err.message
                    })
                } else {
                    resolve({
                        error: false,
                        content: {
                            id: objArray[index].id,
                            name: objArray[index].name
                        }
                    })
                }
            })
        }))
    }

    const result = await Promise.all(promoiseArray)

    let errorCounter = 0
    if (result) {
        const _parentTrail = await _auditTrail.createData({
            categoryId: "testTable",
            userId: "awcjack",
            dataId: "CUSTOM_ID",
            name: "CUSTOM_NAME",
            before: {},
            after: {},
            action: "BATCH_INSERT" // custom action for specific type
        })
        const { parentTrail } = _parentTrail
        
        for (let i = 0; i < result.length; i++) {
            if (result[i].error) {
                console.log(result[i].err)
                errorCounter++
            } else {
                await _auditTrail.createData({
                    categoryId: "testTable",
                    userId: "awcjack",
                    dataId: result[i]?.content?.id,
                    name: result[i]?.content?.name,
                    before: {},
                    after: {
                        id: result[i]?.content?.id,
                        name: result[i]?.content?.name,
                    },
                    action: "CREATE",
                    parent: parentTrail
                })
            }
        }

        const { commitHash } = _parentTrail
        await appendCommitMap({
            categoryId: "testTable",
            userId: "awcjack",
            commitHash
        })
        if (errorCounter > 0) {
            res.send(`Batch insert completed with ${errorCounter} error`)
        } else {
            res.send(`Batch insert completed`)
        }
    } else {
        res.send("Batch insert error")
    }
})

app.get('/add/:id/:name', async function (req, res) {
    // https://stackoverflow.com/questions/56122812/async-await-sqlite-in-javascript/64734551#64734551
    // await sqlite action with promise
    const result = await new Promise((resolve) => {
        db.run('INSERT INTO testTable(id, name) VALUES(?, ?)', [req.params.id, req.params.name], function (err) {
            if (err) {
                resolve({
                    error: true,
                    err: err.message
                })
            } else {
                resolve({
                    error: false,
                    content: {
                        id: req.params.id,
                        name: req.params.name
                    }
                })
            }
        })
    })
    if (result) {
        if (result.error) {
            console.log(`Insert error: ${result.err}`)
            res.send(result.err)
        } else {
            const trail = await _auditTrail.createData({
                categoryId: "testTable",
                userId: "awcjack",
                dataId: result?.content?.id,
                name: result?.content?.name,
                before: {},
                after: {
                    // expected to use the response object if possible but sqlite won't response with request object
                    id: result?.content?.id,
                    name: result?.content?.name,
                },
                action: "CREATE",
            })
            const { commitHash } = trail
            await appendCommitMap({
                categoryId: "testTable",
                userId: "awcjack",
                commitHash
            })
            
            res.send("Insert Done")
        }
    } else {
        res.send("Insert Error")
    }
})

// revert commit
app.get('/revert/:hash', async function (req, res) {
    const result = await _auditTrail.revertCommit({
        commitHash: req.params.hash,
    })
    console.log("result", result)
    res.json(result)
})

app.get('/cherrypick/:hash', async function (req, res) {
    const result = await _auditTrail.cherryPick({
        commitHash: req.params.hash,
    })
    console.log("result", result)
    res.json(result)
})

app.get('/checkout/:hash', async function (req, res) {
    const commitHashMap = await new Promise((resolve) => {
        db.get('SELECT * FROM commitMap WHERE categoryId = ?', ["testTable"], function(err, row) {
            if (err || !row) {
                resolve({
                    error: true,
                    err: err?.message
                })
            } else {
                resolve({
                    error: false,
                    commitMap: row.commitHashMap
                })
            }
        })
    })
    const currentCommit = await new Promise((resolve) => {
        db.get('SELECT * FROM currentCommit WHERE categoryId = ?', ["testTable"], function(err, row) {
            if (err || !row) {
                resolve({
                    error: true,
                    err: err?.message
                })
            } else {
                resolve({
                    error: false,
                    commitHash: row.commitHash
                })
            }
        })
    })
    console.log("commitHashMap", commitHashMap)
    console.log("currentCommit", currentCommit)
    let result = {
        error: [],
        result: {}
    }
    if (!commitHashMap.error) {
        if (!currentCommit.error) {
            if (req?.params?.hash && typeof req?.params?.hash === "string") {
                result.result = await _auditTrail.checkout({
                    commitHashMap: commitHashMap.commitMap,
                    currentCommit: currentCommit.commitHash,
                    commitHash: req.params.hash,
                })
                result.error = []
                for (const _result of result.result) {
                    const keys = Object.keys(_result)
                    for (const key of keys) {
                        if (_result?.[key]?.error) {
                            result.error.push(_result)
                        }
                    }
                }
            }
        }
    }

    if (result?.error?.length === 0) {
        // no error --> save commit hash in to db
        const _result = await new Promise((resolve) => {
            db.run('UPDATE currentCommit SET commitHash = ? WHERE categoryId = ?', [req.params.hash, "testTable"], function (err) {
                if (err || this.changes === 0) {
                    console.log("update user current commit error", err.message || "No change")
                    resolve({
                        error: true
                    })
                }
                resolve({
                    error: false
                })
            })
        })
        if (!_result.error) {
            result.saved = true
        } else {
            result.saved = false
        }
    }
    res.json(result)
})

app.get('/close', function (req, res) {
    db.close((err) => {
        if (err) {
            return console.error(err.message)
        }
        console.log('Close the database connection.')
    })
    res.send("Server closed")
    server.close()
    process.exit(0)
    
})