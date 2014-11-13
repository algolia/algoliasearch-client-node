var should = require('should'),
    moquire = require('moquire');


describe('Algolia Get', function () {
  var Algolia = require('../src/algoliasearch-node');
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

  it('should be able to get', function (done) {
      var index = client.initIndex(safe_index_name('àlgol?à-node'));
      index.clearIndex(function(error, content) {
        index.saveObject({ name: 'San Francisco', objectID: "à/go/?à" }, function(error, content) {
          error.should.eql(false);
          should.exist(content.taskID);
          index.waitTask(content.taskID, function(error, content) {
            error.should.eql(false);
            index.getObject("à/go/?à", function(error, content) {
              error.should.eql(false);
              content.should.have.property('name', 'San Francisco');
              client.deleteIndex(safe_index_name('àlgol?à-node'));
              done();
          });
        });
      });
    });
  });

  it('should be able to get with attr', function (done) {
      var index = client.initIndex(safe_index_name('àlgol?à-node'));
      index.clearIndex(function(error, content) {
        index.saveObject({ name: 'San Francisco', objectID: "à/go/?à" }, function(error, content) {
          error.should.eql(false);
          should.exist(content.taskID);
          index.waitTask(content.taskID, function(error, content) {
            error.should.eql(false);
            index.getObject("à/go/?à", function(error, content) {
              error.should.eql(false);
              content.should.have.property('name', 'San Francisco');
              client.deleteIndex(safe_index_name('àlgol?à-node'));
              done();
          }, ['name', 'objectID']);
        });
      });
    });
  });

  it('should be able to get objects', function (done) {
      var index = client.initIndex(safe_index_name('àlgol?à-node'));
      index.clearIndex(function(error, content) {
        index.saveObjects([{ name: 'San Francisco', objectID: "1" },{ name: 'Los Angeles', objectID: "2"}], function(error, content) {
          error.should.eql(false);
          should.exist(content.taskID);
          index.waitTask(content.taskID, function(error, content) {
            error.should.eql(false);
            index.getObjects(["1", "2"], function(error, content) {
              error.should.eql(false);
              content.results[0].should.have.property('name', 'San Francisco');
              content.results[1].should.have.property('name', 'Los Angeles');
              client.deleteIndex(safe_index_name('àlgol?à-node'));
              done();
          });
        });
      });
    });
  });



});
