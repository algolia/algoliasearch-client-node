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

  it('should be able to add index', function (done) {
    var res;
    var resAfter;
    var index = client.initIndex(safe_index_name('cities'));
    client.deleteIndex(safe_index_name('cities'), function(error, content) {
      setTimeout(function() {
        client.listIndexes(function(error, content) {
          error.should.eql(false);
          res = content;
          content.should.have.property('items');
          index.saveObject({ name: 'San Francisco', objectID: "42" }, function(error, content) {
            error.should.eql(false);
            should.exist(content.taskID);
            index.waitTask(content.taskID, function(error, content) {
              error.should.eql(false);
              client.listIndexes(function(error, content) {
                error.should.eql(false);
                content.should.have.property('items').length(res.items.length + 1);
                done();
              });
            });
          });
        });
      }, 2000);
    });
  });

  it('should be able to delete index', function (done) {
    var res;
    var resAfter;
    var index = client.initIndex(safe_index_name('cities'));
    index.saveObject({ name: 'San Francisco', objectID: "42" }, function(error, content) {
      client.listIndexes(function(error, content) {
        error.should.eql(false);
        res = content;
        content.should.have.property('items');
        client.deleteIndex(safe_index_name('cities'), function(error, content) {
          setTimeout(function() {
            error.should.eql(false);
            should.exist(content.taskID);
            index.waitTask(content.taskID, function(error, content) {
              error.should.eql(false);
              client.listIndexes(function(error, content) {
                error.should.eql(false);
                content.should.have.property('items').length(res.items.length - 1);
                done();
              });
            });
          }, 2000);
        });
      });
    });
  });
});

