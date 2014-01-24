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

  it('should be able to copy an index', function (done) {
    var index = client.initIndex(safe_index_name('cities'));
    var index2 = client.initIndex(safe_index_name('towns'));
    index.clearIndex(function(error, content) {
      client.deleteIndex(safe_index_name('towns'), function(error, content) {
        sleep.sleep(2)
        index.addObject({ name: 'San Francisco' }, function(error, content) {
          error.should.eql(false);
          should.exist(content.taskID);
          index.waitTask(content.taskID, function(error, content) {
            error.should.eql(false);
            client.copyIndex(safe_index_name('cities'), safe_index_name('towns'), function(error, content) {
              error.should.eql(false);
              should.exist(content.taskID);
              index.waitTask(content.taskID, function(error, content) {
                error.should.eql(false);
                index2.search('san f', function(error, content) {
                  error.should.eql(false);
                  content.should.have.property('hits').length(1);
                  content.hits[0].should.have.property('name', 'San Francisco');
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

   it('should be able to move an index', function (done) {
    var index = client.initIndex(safe_index_name('cities'));
    var index2 = client.initIndex(safe_index_name('towns'));
    index.clearIndex(function(error, content) {
      client.deleteIndex(safe_index_name('towns'), function(error, content) {
        sleep.sleep(2)
        index.addObject({ name: 'San Francisco' }, function(error, content) {
          error.should.eql(false);
          should.exist(content.taskID);
          index.waitTask(content.taskID, function(error, content) {
            error.should.eql(false);
            client.moveIndex(safe_index_name('cities'), safe_index_name('towns'), function(error, content) {
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
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('should be able to partial update', function (done) {
      var index = client.initIndex(safe_index_name('cities'));
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
              done();
          });
        });
      });
    });
  });

  it('should be able to get log', function (done) {
      var index = client.initIndex(safe_index_name('cities'));
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
