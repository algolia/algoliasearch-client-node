var should = require('should'),
    moquire = require('moquire');


describe('Algolia Index', function () {
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

  it('should be able to copy an index', function (done) {
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    var index2 = client.initIndex(safe_index_name('àlgol?à2-node'));
    index.clearIndex(function(error, content) {
      client.deleteIndex(safe_index_name('àlgol?à-node'), function(error, content) {
        setTimeout(function() {
          index.addObject({ name: 'San Francisco' }, 42, function(error, content) {
            error.should.eql(false);
            should.exist(content.taskID);
            index.waitTask(content.taskID, function(error, content) {
              error.should.eql(false);
              client.copyIndex(safe_index_name('àlgol?à-node'), safe_index_name('àlgol?à2-node'), function(error, content) {
                if (error == true)
                  {console.log(content.message)}
                error.should.eql(false);
                should.exist(content.taskID);
                index.waitTask(content.taskID, function(error, content) {
                  error.should.eql(false);
                  index2.search('san f', function(error, content) {
                    error.should.eql(false);
                    content.should.have.property('hits').length(1);
                    content.hits[0].should.have.property('name', 'San Francisco');
                    client.deleteIndex(safe_index_name('àlgol?à-node'));
                    client.deleteIndex(safe_index_name('àlgol?à2-node'));
                    done();
                  });
                });
              });
            });
          });
        }, 2000);
      });
    });
  });

   it('should be able to move an index', function (done) {
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    var index2 = client.initIndex(safe_index_name('àlgol?à2-node'));
    index.clearIndex(function(error, content) {
      client.deleteIndex(safe_index_name('àlgol?à2-node'), function(error, content) {
        setTimeout(function() {
          index.addObject({ name: 'San Francisco' }, function(error, content) {
            error.should.eql(false);
            should.exist(content.taskID);
            index.waitTask(content.taskID, function(error, content) {
              error.should.eql(false);
              client.moveIndex(safe_index_name('àlgol?à-node'), safe_index_name('àlgol?à2-node'), function(error, content) {
              if (error == true)
                  {console.log(content.message)}
                error.should.eql(false);
                should.exist(content.taskID);
                index.waitTask(content.taskID, function(error, content) {
                  error.should.eql(false);
                  index2.search('san f', function(error, content) {
                    error.should.eql(false);
                    content.should.have.property('hits').length(1);
                    content.hits[0].should.have.property('name', 'San Francisco');
                    index.search('', function(error, content) {
                      error.should.eql(true);
                      client.deleteIndex(safe_index_name('àlgol?à2-node'));
                      done();
                    });
                  });
                });
              });
            });
          }, 42);
        }, 2000);
      });
    });
  });

  it('should be able to browse', function (done) {
      var index = client.initIndex(safe_index_name('àlgol?à-node'));
      index.clearIndex(function(error, content) {
        index.saveObject({ name: 'San Francisco', objectID: "42" }, function(error, content) {
          error.should.eql(false);
          should.exist(content.taskID);
          index.waitTask(content.taskID, function(error, content) {
            error.should.eql(false);
            index.browse(0, function(error, content) {
              error.should.eql(false);
              content.should.have.property('hits').length(1);
              content.hits[0].should.have.property('name', 'San Francisco');
              client.deleteIndex(safe_index_name('àlgol?à-node'));
              done();
          });
        });
      });
    });
  });

  it('should be able to browse with args', function (done) {
      var index = client.initIndex(safe_index_name('àlgol?à-node'));
      index.clearIndex(function(error, content) {
        index.saveObject({ name: 'San Francisco', objectID: "42" }, function(error, content) {
          error.should.eql(false);
          should.exist(content.taskID);
          index.waitTask(content.taskID, function(error, content) {
            error.should.eql(false);
            index.browse(0, function(error, content) {
              error.should.eql(false);
              content.should.have.property('hits').length(1);
              content.hits[0].should.have.property('name', 'San Francisco');
              client.deleteIndex(safe_index_name('àlgol?à-node'));
              done();
          }, 1);
        });
      });
    });
  });

  it('should be able to get log', function (done) {
      var index = client.initIndex(safe_index_name('àlgol?à-node'));
      index.clearIndex(function(error, content) {
        index.saveObject({ name: 'San Francisco', objectID: "42" }, function(error, content) {
          error.should.eql(false);
          should.exist(content.taskID);
          index.waitTask(content.taskID, function(error, content) {
            error.should.eql(false);
            client.getLogs(function(error, content) {
              error.should.eql(false);
              content.should.have.property('logs');
              done();
          });
        });
      });
    });
  });
});
