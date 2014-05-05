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
      options.should.have.property('path', '/1/indexes/%C3%A0lgol%3F%C3%A0-node?query=loz%20anqel');

      return {
        statusCode: 200,
        json: require('./responses/search1.json')
      };
    });

    var index = client.initIndex('àlgol?à-node');
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

    var index = client.initIndex('àlgol?à-node');
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

    var index = client.initIndex('àlgol?à-node');
    index.search('loz anqel', function(error, content) {
      error.should.eql(true);
      done();
    });
  });
});

describe('Algolia', function () {
  var Algolia = require('../algoliasearch-node');

  function safe_index_name(name) {
    if (!process.env.TRAVIS)
    {  return name}
    var id = process.env.TRAVIS_JOB_NUMBER.split('.').pop();
    return name + "_travis-" + id;
  }

  it('should found environment variables', function(done) {
    should.exist(process.env.ALGOLIA_APPLICATION_ID);
    should.exist(process.env.ALGOLIA_API_KEY);
    done();
  });

  var client = new Algolia(process.env.ALGOLIA_APPLICATION_ID, process.env.ALGOLIA_API_KEY);

  it('should be able to set settings', function (done) {
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    index.clearIndex(function(error, content) {
      index.addObject({ name: 'San Francisco' }, function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.setSettings({'attributesToRetrieve': ['name']}, function(error, content) {
            error.should.eql(false);
            index.getSettings(function(error, content) {
              error.should.eql(false);
              content.should.have.property('attributesToRetrieve').length(1);
              content.attributesToRetrieve[0].should.eql('name');
              client.deleteIndex(safe_index_name('àlgol?à-node'));
              done();
            });
          });
        });
      });
    });
  });

  it('should perform queries forwarding a rate-limited API Key', function (done) {
    client.enableRateLimitForward(process.env.ALGOLIA_API_KEY, '127.0.0.1', process.env.ALGOLIA_API_KEY);
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    index.setSettings({}, function(error, content) { // ensure index is created
      error.should.eql(false, content);
      index.search('', function(error, content) {
        error.should.eql(false);
        client.deleteIndex(safe_index_name('àlgol?à-node'));
        done();
      });
      client.disableRateLimitForward();
    });
  });

});
