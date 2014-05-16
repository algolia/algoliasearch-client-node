var should = require('should'),
    moquire = require('moquire');


describe('Algolia Batch', function () {
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

  it('should be able to adds', function (done) {
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    index.clearIndex(function(error, content) {
      index.addObjects([{ "name": 'San Francisco' }, { "name": 'San Diego'}], function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.search('san', function(error, content) {
            error.should.eql(false);
            content.should.have.property('hits').length(2);
            client.deleteIndex(safe_index_name('àlgol?à-node'));
            done();
          });
        });
      });
    });
  });

  it('should be able to saves', function (done) {
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    index.clearIndex(function(error, content) {
      index.saveObjects([{ name: 'San Francisco', objectID: "à/go/?à" }, { name: 'San Diego', objectID: '43'}], function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.search('san', function(error, content) {
            error.should.eql(false);
            content.should.have.property('hits').length(2);
            client.deleteIndex(safe_index_name('àlgol?à-node'));
            done();
          });
        });
      });
    });
  });

  it('should be able to partial updates', function (done) {
      var index = client.initIndex(safe_index_name('àlgol?à-node'));
      index.clearIndex(function(error, content) {
        index.saveObjects([{ name: 'San Francisco', objectID: "à/go/?à" }, { name: 'San Diego', objectID: '43'}], function(error, content) {
          error.should.eql(false);
          should.exist(content.taskID);
          index.waitTask(content.taskID, function(error, content) {
            error.should.eql(false);
            index.partialUpdateObjects([{ name: 'Los Angeles', objectID: "à/go/?à"}, { name: 'Los Santos', objectID: '43'}], function(error, content) {
              error.should.eql(false);
              index.search('los', function(error, content) {
                error.should.eql(false);
                content.should.have.property('hits').length(2);
                client.deleteIndex(safe_index_name('àlgol?à-node'));
                done();
            });
          });
        });
      });
    });
  });

it('should be able to deletes', function (done) {
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    index.clearIndex(function(error, content) {
      index.addObjects([{ "name": 'San Francisco', "objectID": "à/go/?à"}, { "name": 'San Diego', "objectID": "à/go/?à2"}], function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.deleteObjects(["à/go/?à", "à/go/?à2"], function(error, content) {
            error.should.eql(false);
            should.exist(content.taskID);
            index.waitTask(content.taskID, function(error, content) {
              error.should.eql(false);
              index.search('san', function(error, content) {
                error.should.eql(false);
                content.should.have.property('hits').length(0);
                client.deleteIndex(safe_index_name('àlgol?à-node'));
                done();
              });
            });
          });
        });
      });
    });
  });

it('should be able to custom batch', function (done) {
      var index = client.initIndex(safe_index_name('àlgol?à-node'));
    index.clearIndex(function(error, content) {
      index.batch({ requests:[ {action: 'addObject', body: { "name": 'San Francisco' }}, {action: 'addObject', body:{ "name": 'San Diego'}}]}, function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.search('san', function(error, content) {
            error.should.eql(false);
            content.should.have.property('hits').length(2);
            client.deleteIndex(safe_index_name('àlgol?à-node'));
            done();
          });
        });
      });
    });
  });
});
