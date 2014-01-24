var should = require('should'),
    moquire = require('moquire');

/*
 * https is replaced by a mock implementation.
 *
 */
describe('Mocked Algolia', function () {
  var mockHttps = require('./mocks/https'),
    Algolia = moquire('../algoliasearch-node', {
      https: mockHttps
    });

  // we don't have to use real hosts or API keys since we simulate the server
  var hosts = ['ApplicationID-1.algolia.io', 'ApplicationID-2.algolia.io', 'ApplicationID-3.algolia.io'],
      client = new Algolia('ApplicationID', 'API-Key', hosts);

  it('should send search request', function (done) {
    mockHttps.setResponders(function (options) {
      should.exist(options);
      options.should.have.property('method', 'GET');
      options.should.have.property('hostname');
      hosts.should.include(options.hostname);
      options.should.have.property('path', '/1/indexes/cities?query=loz%20anqel');

      return {
        statusCode: 200,
        json: require('./responses/search1.json')
      };
    });

    var index = client.initIndex('cities');
    index.search('loz anqel', function(error, content) {
      error.should.eql(false);
      content.should.have.property('hits').length(1);
      content.hits[0].should.have.property('name', 'Los Angeles');
      content.hits[0].should.have.property('_highlightResult');

      done();
    });
  });

  it('should send search request with 1 server down', function (done) {
    // we make the first request fail, so that the driver will try a second server
    mockHttps.setResponders([{
      statusCode: 503,
      json: { message: 'Fail 1' }
    }, {
      statusCode: 200,
      json: require('./responses/search1.json')
    }]);

    var index = client.initIndex('cities');
    index.search('loz anqel', function(error, content) {
      error.should.eql(false);
      content.should.have.property('hits').length(1);
      content.hits[0].should.have.property('name', 'Los Angeles');
      content.hits[0].should.have.property('_highlightResult');

      done();
    });
  });

    it('should send search request with all servers down', function (done) {
    // we make the first request fail, so that the driver will try a second server
    mockHttps.setResponders([{
      statusCode: 503,
      json: { message: 'Fail 1' }
    }, {
      statusCode: 503,
      json: { message: 'Fail 2' }
    }, {
      statusCode: 503,
      json: { message: 'Fail 3' }
    }]);

    var index = client.initIndex('cities');
    index.search('loz anqel', function(error, content) {
      error.should.eql(true);
      done();
    });
  });
});

describe('Algolia', function () {
  var Algolia = moquire('../algoliasearch-node');

  it('should found environment variables', function(done) {
    should.exist(process.env.ALGOLIA_APPLICATION_ID);
    should.exist(process.env.ALGOLIA_API_KEY);
    done();
  });

  var client = new Algolia(process.env.ALGOLIA_APPLICATION_ID, process.env.ALGOLIA_API_KEY);

  it('should be able to clear/add/search', function (done) {
    var index = client.initIndex('cities');
    index.clearIndex(function(error, content) {
      error.should.eql(false);
      index.addObject({ name: 'San Francisco' }, function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.search('san f', function(error, content) {
            error.should.eql(false);
            content.should.have.property('hits').length(1);
            content.hits[0].should.have.property('name', 'San Francisco');
            done();
          });
        });
      });
    });
  });

  it('should be able to add forcing an objectID 1', function (done) {
    var index = client.initIndex('cities');
    index.clearIndex(function(error, content) {
      error.should.eql(false);
      var index = client.initIndex('cities');
      index.addObject({ name: 'NYC1' }, function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.getObject('id1', function(error, content) {
            error.should.eql(false);
            content.objectID.should.equal('id1');
            content.name.should.equal('NYC1');
            done();
          });
        });
      }, 'id1');
    });
  });

  it('should be able to add forcing an objectID 2', function (done) {
    var index = client.initIndex('cities');
    index.clearIndex(function(error, content) {
      error.should.eql(false);
      var index = client.initIndex('cities');
      index.addObject({ name: 'NYC2' }, 'id2', function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.getObject('id2', function(error, content) {
            error.should.eql(false);
            content.objectID.should.equal('id2');
            content.name.should.equal('NYC2');
            done();
          });
        });
      });
    });
  });

  it('should be able to add forcing an objectID 3', function (done) {
    var index = client.initIndex('cities');
    index.clearIndex(function(error, content) {
      error.should.eql(false);
      var index = client.initIndex('cities');
      index.addObject({ name: 'NYC3' }, 'id3');
      index.addObject({ name: 'NYC4' }, function() { });
      index.addObject({ name: 'NYC5' }, function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.search('nyc', function(error, content) {
            error.should.eql(false);
            content.should.have.property('hits').length(3);
            done();
          });
        });
      });
    });
  });
});
