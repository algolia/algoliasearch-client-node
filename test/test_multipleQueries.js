var should = require('should'),
    moquire = require('moquire');


describe('Algolia Multiple Queries', function () {
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

  it('should be able to search on multiple queries', function (done) {
      var index = client.initIndex(safe_index_name('àlgol?à-node'));
      index.clearIndex(function(error, content) {
        index.saveObject({ name: 'San Francisco', objectID: "a\go\?à" }, function(error, content) {
          error.should.eql(false);
          should.exist(content.taskID);
          index.waitTask(content.taskID, function(error, content) {
            error.should.eql(false);
            client.multipleQueries([{indexName: safe_index_name('àlgol?à-node'), query: ""}], "indexName", function(error, content) {
              error.should.eql(false);
              content.should.have.property('results');
              content.results[0].should.have.property('hits');
              content.results[0].hits[0].should.have.property('name', "San Francisco");
              client.deleteIndex(safe_index_name('àlgol?à-node'));

              done();
          });
        });
      });
    });
  });


});
