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

  it('should be able to add', function (done) {
    var index = client.initIndex(safe_index_name('cities'));
    index.clearIndex(function(error, content) {
      index.addObject({ name: 'San Francisco' }, function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.search('san f', function(error, content) {
            error.should.eql(false);
            content.should.have.property('hits').length(1);
            content.hits[0].should.have.property('name', 'San Francisco');
            done();
          });
        });
      });
    });
  });

  it('should be able to save', function (done) {
    var index = client.initIndex(safe_index_name('cities'));
    index.clearIndex(function(error, content) {
      index.saveObject({ name: 'San Francisco', objectID: "42" }, function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.search('san f', function(error, content) {
            error.should.eql(false);
            content.should.have.property('hits').length(1);
            content.hits[0].should.have.property('name', 'San Francisco');
            done();
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
            index.partialUpdateObject({ name: 'Los Angeles', objectID: "42"}, function(error, content) {
              error.should.eql(false);
              index.search('los a', function(error, content) {
                error.should.eql(false);
                content.should.have.property('hits').length(1);
                content.hits[0].should.have.property('name', 'Los Angeles');
                done();
            });
          });
        });
      });
    });
  });
});
