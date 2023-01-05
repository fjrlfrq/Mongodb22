const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb')
const moment = require('moment');

module.exports = function (db) {

  const user = db.collection('users');

  router.get('/', async function (req, res, next) {
    try {
      // sort
      const fiturSort = {}
      const sortBY = req.query.sortBy || '_id'
      const sortMode = req.query.sortMode || 'asc'
      fiturSort[sortBY] = sortMode == 'asc' ? 1 : -1

      // pagination
      const sorting = {}
      const url = req.url == '/' ? '/?page=1&sortBy=_id&sortMode=asc' : req.url
      const page = req.query.page || 1
      const limit = 3
      const offset = (page - 1) * limit
      sorting[sortBY] = sortMode == 'asc' ? 1 : -1

      //searching
      const wheres = {}

      if (req.query.string && req.query.stringc) {
        wheres['string'] = new RegExp(`${req.query.string}`, 'i')
      }

      if (req.query.integer && req.query.integerc) {
        wheres['integer'] = parseInt(`${req.query.integer}`)
      }

      if (req.query.float && req.query.floatc) {
        wheres['float'] = parseFloat(`${req.query.float}`)
      }

      if (req.query.daten && req.query.datenc) {
        wheres['daten'] = new Date(`${req.query.daten}`)
      }

      if (req.query.boolean && req.query.booleanc) {
        wheres['boolean'] = JSON.parse(`${req.query.boolean}`)
      }

      const result = await user.find(wheres).toArray()
      let total = result.length
      const pages = Math.ceil(total / limit)

      const users = await user.find(wheres).limit(limit).skip(offset).sort(sorting).toArray()

      res.render('index', { data: users, moment, page, pages, offset, query: req.query, url })
    } catch (err) {
      console.log(`list error`, err);
    }
  });
  
    // router add
    router.get('/add', async function (req, res, next) {
      try { 
        res.render('add')
      } catch (err) {
        console.log(`add error`, err);
      }
    });
  
    // add
    router.post('/add', async function (req, res, next) {
      try {
        await user.insertOne({
          string: req.body.string,
          integer: Number(req.body.integer),
          float: parseFloat(req.body.float),
          date: new Date(req.body.daten),
          boolean: JSON.parse(req.body.boolean)
        })
        res.redirect('/')
      } catch (err) {
        res.json({ err })
      }
    });
    
    // router edit
  router.get('/edit/:id', async function (req, res, next) {
    try {
      const users = await user.find({ _id: ObjectId(req.params.id) }).toArray()
      res.render('edit', { data: users[0] })
    } catch (err) {
      console.log(`edit error`, err);
    }
  });

  // edit
  router.post('/edit/:id', async function (req, res, next) {
    try {
      const result = await user.findOneAndUpdate({
        "_id": ObjectId(`${req.params.id}`)
      }, {
        $set: {
          string: req.body.string,
          integer: Number(req.body.integer),
          float: parseFloat(req.body.float),
          date: new Date(req.body.daten),
          boolean: JSON.parse(req.body.boolean)
        }
      }, {
        returnOriginal: false
      })
      res.redirect('/');
    } catch (err) {
      console.log(`add error`, err);
    }
  });

  // DELETE
  router.get('/delete/:id', async function (req, res, next) {
    try {
      const result = await user.findOneAndDelete({
        _id: ObjectId(req.params.id)
      })
      res.redirect('/')
    } catch (err) {
      console.log(`delete error`, err);
    }
  });

  return router;
}
