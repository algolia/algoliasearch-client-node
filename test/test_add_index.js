var should = require('should'),
    sleep = require('sleep'),
    moquire = require('moquire');


describe('Algolia', function () {
  var Algolia = moquire('../algoliasearch-node');

  function safe_index_name(name) {
    if (!process.env.TRAVIS)
    {  return name}
    id = process.env.TRAVIS_JOB_NUMBER.split('.')[-1]
    return "%s_travis-%s" % (name, id)
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
      sleep.sleep(2)
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
          sleep.sleep(2)
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
        });
      });
    });
  });
});

