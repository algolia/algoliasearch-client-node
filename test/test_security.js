var should = require('should'),
    moquire = require('moquire');


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

  it('should be able to add a security', function (done) {
    var key;
    var keys;
    client.listUserKeys(function(error, content) {
      error.should.eql(false);
      keys = content.keys.length;
      client.addUserKey(['search'], function(error, content) {
        error.should.eql(false);
        key = content.key;
        client.getUserKeyACL(key, function(error, content) {
          error.should.eql(false);
          content.should.have.property('acl').length(1);
          content.acl[0].should.eql('search');
          client.listUserKeys(function(error, content) {
            error.should.eql(false);
            content.should.have.property('keys').length(keys + 1);
            client.deleteUserKey(key, function(error, content) {
              error.should.eql(false);
              client.listUserKeys(function(error, content) {
                error.should.have.eql(false);
                content.should.have.property('keys').length(keys);
              done();
              })
            });
          });
        });
      });
    });
  });
});