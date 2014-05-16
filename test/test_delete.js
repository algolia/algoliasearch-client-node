var should = require('should'),
    moquire = require('moquire');


describe('Algolia Delete', function () {
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

  it('should be able to delete', function (done) {
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    index.clearIndex(function(error, content) {
      index.saveObject({ name: 'San Francisco', objectID: 'à/go/?à' }, function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.deleteObject('à/go/?à', function(error, content) {
            error.should.eql(false);
            should.exist(content.taskID);
            index.waitTask(content.taskID, function(error, content) {
              error.should.eql(false);
              index.search('san f', function(error, content) {
                error.should.eql(false);
                content.should.have.property('hits').length(0);
                done();
              }, null);
            });
          });
        });
      });
    });
  });

it('should be able to delete with error', function (done) {
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    index.clearIndex(function(error, content) {
      index.saveObject({ name: 'San Francisco', objectID: '42' }, function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.deleteObject(null, function(error, content) {
            error.should.eql(true);
            index.search('san f', function(error, content) {
              error.should.eql(false);
              content.should.have.property('hits').length(1);
              content.hits[0].should.have.property('name').eql('San Francisco');
              client.deleteIndex(safe_index_name('àlgol?à-node'));
              done();
            }, { 'attributesToRetrieve' : 'name'});
          });
        });
      });
    });
  });

it('should be able to delete "" with error', function (done) {
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    index.clearIndex(function(error, content) {
      index.saveObject({ name: 'San Francisco', objectID: '42' }, function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.deleteObject("", function(error, content) {
            error.should.eql(true);
            index.search('san f', function(error, content) {
              error.should.eql(false);
              content.should.have.property('hits').length(1);
              content.hits[0].should.have.property('name').eql('San Francisco');
              client.deleteIndex(safe_index_name('àlgol?à-node'));
              done();
            }, { 'attributesToRetrieve' : 'name'});
          });
        });
      });
    });
  });

it('should be able to delete [] with error', function (done) {
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    index.clearIndex(function(error, content) {
      index.saveObject({ name: 'San Francisco', objectID: '42' }, function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.deleteObject([], function(error, content) {
            error.should.eql(true);
            index.search('san f', function(error, content) {
              error.should.eql(false);
              content.should.have.property('hits').length(1);
              content.hits[0].should.have.property('name').eql('San Francisco');
              client.deleteIndex(safe_index_name('àlgol?à-node'));
              done();
            }, { 'attributesToRetrieve' : 'name'});
          });
        });
      });
    });
  });


});
