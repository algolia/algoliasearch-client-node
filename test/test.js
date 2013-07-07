var should = require('should'),
    moquire = require('moquire'),
    mockHttps = require('./mocks/https'),
    Algolia = moquire('../algoliasearch-node', {
      https: mockHttps
    });

/*
 * https is replaced by a mock implementation.
 *
 */
describe('Algolia', function () {
  // we don't have to use real hosts or API keys since we simulate the server
  var hosts = ['YourHostname-1.algolia.io', 'YourHostname-2.algolia.io', 'YourHostname-3.algolia.io'],
      client = new Algolia('ApplicationID', 'API-Key', hosts);

  it('should send search request', function (done) {
    mockHttps.setResponders(function (options) {
      should.exist(options);
      options.should.have.property('method', 'GET');
      options.should.have.property('hostname');
      hosts.should.include(options.hostname);

      // Wait, this is weird, the spce should be escaped. I'll open an issue
      options.should.have.property('path', '/1/indexes/cities?query=loz anqel');

      return {
        statusCode: 200,
        json: require('./responses/search1.json')
      };
    });

    var index = client.initIndex('cities');
    index.search('loz anqel', function(success, content) {
      success.should.eql(true);
      content.should.have.property('hits').with.lengthOf(1);
      content.hits[0].should.have.property('name', 'Los Angeles');
      content.hits[0].should.have.property('_highlightResult');

      done();
    });
  });

  it('should send search request with 1 server down', function (done) {
    // we make the first request fail, so that the driver will try a second server
    mockHttps.setResponders([{
      statusCode: 500,
      json: null
    }, {
      statusCode: 200,
      json: require('./responses/search1.json')
    }]);

    var index = client.initIndex('cities');
    index.search('loz anqel', function(success, content) {
      success.should.eql(true);
      content.should.have.property('hits').with.lengthOf(1);
      content.hits[0].should.have.property('name', 'Los Angeles');
      content.hits[0].should.have.property('_highlightResult');

      done();
    });
  });

    it('should send search request with all servers down', function (done) {
    // we make the first request fail, so that the driver will try a second server
    mockHttps.setResponders([{
      statusCode: 500,
      json: null
    }, {
      statusCode: 500,
      json: null
    }, {
      statusCode: 500,
      json: null
    }]);

    var index = client.initIndex('cities');
    index.search('loz anqel', function(success, content) {
      success.should.eql(false);
      done();
    });
  });  
});