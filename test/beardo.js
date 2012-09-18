
var beardo = require('../')
  , path = require('path')
  , assert = require('assert')
  , http = require('http')
  , request = require('request')

describe('beardo', function(){
  it('require returns a beardo instance', function(){
    assert.ok(beardo, 'beardo is undefined. WTF?')
    assert.ok(beardo.directory, 'Missing `directory` property')
    assert.equal(typeof beardo.read, 'function', 'Missing `read` method')
  })
})

describe('beardo.directory', function(){
  it('defaults to `process.cwd()`', function(){
    assert.equal(beardo.directory, path.resolve('templates'))
  })

  it('is writeable', function(){
    beardo.directory = path.join(__dirname, './templates')

    assert.equal(beardo.directory, path.join(__dirname, './templates'))
  })
})

describe('beardo.read', function(){
  before(function(){
    beardo.directory = path.join(__dirname, './templates')
  })

  it('reads templates', function(done){
    beardo.read('basic', function(err, template){
      if (err) return done(err)

      assert.ok(template, 'Missing `template` argument')
      assert.equal(template.render({ text: 'foo' }), 'basic tom fooery')

      done()
    })
  })

  it('reads templates with partials', function(done){
    beardo.read('has-partial', function(err, template){
      if (err) return done(err)

      assert.ok(template, 'Missing `template` argument')
      assert.equal(template.render(), 'partial! w007')

      done()
    })
  })

  it('reads templates with nested partials', function(done){
    beardo.read('has-nested-partials', function(err, tpl){
      if (err) return done(err)

      assert.ok(tpl, 'Missing `template` argument')
      assert.equal(tpl.render(), 'A dream, within a dream, within a dream')

      done()
    })
  })

  it('errs on non-existing templates', function(done){
    beardo.read('bogus', function(err, template){
      assert.ok(err, 'Missing `error`')
      assert.equal(err.code, 'ENOENT', 'Bad `error.code`')
      assert.equal(template, undefined, '`template` should be `undefined`')

      done()
    })
  })
})

describe('beardo.layouts', function(){
  before(function(){
    beardo.directory = path.join(__dirname, './templates')
  })

  it('reads the layouts dir', function(done){
    beardo.layouts(function(err, layouts){
      if (err) return done(err)

      assert.ok(layouts)
      assert.ok(layouts['layouts/default'])
      assert.equal(layouts['layouts/default'].render(), '===  ===')

      done()
    })
  })

  it('allows templates with layouts', function(done){
    beardo.layouts(function(err, layouts){
      if (err) return done(err)

      beardo.read('needs-layout', function(err, tpl){
        if (err) return done(err)

        assert.ok(tpl, 'Missing `template` argument')
        assert.equal(tpl.render({ layout: 'default' }), '=== gimme danger ===')

        done()
      })
    })
  })
})

describe('beard.handler', function(){
  var options = { directory: path.join(__dirname, './templates') }
    , port = process.env.PORT || 1337
    , server
    , get

  server = http.createServer(function(req, res) {
    var headers = JSON.stringify(req.headers)

    res.template = beardo.handler(req, res, options)

    switch (req.url) {
      case '/heyo':
        return res.template('heyo', { headers: headers, layout: 'html' })

      default:
        res.statusCode = 404
        return res.end()
    }
  })

  get = function get(url, callback){
    var url = 'http://localhost:' + port + url

    request(url, callback)
  }

  it('exists', function(){
    assert.equal(typeof beardo.handler, 'function', 'Missing `handle` method')
  })

  describe('responding with templates', function(){
    before(function(done){
      server.listen(port, done)
    })

    it('responds with rendered content', function(done){
      get('/heyo', function(err, res, body){
        if (err) return done(err)

        var headers = { host: 'localhost:' + (process.env.PORT || 1337)
            , connection: 'keep-alive'
            }

        assert.equal(res.statusCode, 200, 'Response is NOT 200 OK')
        assert.ok(res.headers.etag, 'Missing etag')
        assert.equal(res.headers['content-type'], 'text/html')
        assert.ok(res.headers['date'], 'Missing date header')
        assert.equal(res.headers['connection'], 'keep-alive')
        assert.equal(res.headers['transfer-encoding'], 'chunked')
        assert.equal(res.body, [ '<html>'
        , '<body>'
        , '<h1>HEYO</h1>'
        , '<pre>' + JSON.stringify(headers) + '</pre>'
        , '</body>'
        , '</html>'
        ].join('\n'))

        done()
      })
    })

    it('responds to cache requests')
    // * 304
    // * no body

    it('responds to cache requests with changed content')
    // * 200
    // * has e-tag
    // * content-type === 'text/html'
    // * date
    // * connection === 'keep-alive'
    // * transfer-encoding === 'chunked'
    // * rendered body

    it('does NOT override headers')
    // * 200
    // * has e-tag
    // * content-type === 'text/plain'
    // * date
    // * connection === 'keep-alive'
    // * transfer-encoding === 'chunked'
    // * rendered body
  })

  describe('responding with non-exisiting template', function(){
    it('responds with not-found page')
    // * 400
    // * has e-tag
    // * content-type === 'text/plain'
    // * date
    // * connection === 'keep-alive'
    // * transfer-encoding === 'chunked'
    // * rendered body
  })
})
