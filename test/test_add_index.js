var should = require('should'),
    moquire = require('moquire');


describe('Algolia Add Index', function () {
  var Algolia = require('../src/algoliasearch-node');

  function safe_index_name(name) {
    if (!process.env.TRAVIS)
    {  return name}
    var id = process.env.TRAVIS_JOB_NUMBER.split('.').pop();
    return name + "_travis-" + id;
  }

  function include(tab, attrName, value) {
    var res = false;
    tab.forEach(function(elt) {
                res = res || (elt[attrName] == value);
            });
    return res;
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
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    client.deleteIndex(safe_index_name('àlgol?à-node'), function(error, content) {
      setTimeout(function() {
        client.listIndexes(function(error, content) {
          error.should.eql(false);
          res = content;
          content.should.have.property('items');
          include(content.items, "name", safe_index_name('àlgol?à-node')).should.eql(false);
          index.saveObject({ name: 'San Francisco', objectID: "à/go/?à" }, function(error, content) {
            error.should.eql(false);
            should.exist(content.taskID);
            index.waitTask(content.taskID, function(error, content) {
              error.should.eql(false);
              client.listIndexes(function(error, content) {
                error.should.eql(false);
                include(content.items, "name", safe_index_name('àlgol?à-node')).should.eql(true);
                client.deleteIndex(safe_index_name('àlgol?à-node'), function(error, content) {
                  done();
                });
              });
            });
          });
        });
      }, 5000);
    });
  });

  it('should be able to delete index', function (done) {
    var res;
    var resAfter;
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    index.saveObject({ name: 'San Francisco', objectID: "à/go/?à" }, function(error, content) {
      should.exist(content.taskID);
      error.should.eql(false);
      index.waitTask(content.taskID, function(error, content) {
        task = content;
        error.should.eql(false);
        client.listIndexes(function(error, content) {
          error.should.eql(false);
          res = content;
          content.should.have.property('items');
          include(res.items, "name", safe_index_name('àlgol?à-node')).should.eql(true);
          client.deleteIndex(safe_index_name('àlgol?à-node'), function(error, content) {
            error.should.eql(false);
            should.exist(content.taskID);
            index.waitTask(content.taskID, function(error, content) {
              error.should.eql(false);
              client.listIndexes(function(error, content) {
              error.should.eql(false);
              content.should.have.property('items');
              include(content.items, "name", safe_index_name('àlgol?à-node')).should.eql(false);
              done();
             });
           });
          });
        });
      });
    });
  });
});

