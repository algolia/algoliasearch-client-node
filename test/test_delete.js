var should = require('should'),
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

  it('should be able to delete', function (done) {
    var index = client.initIndex(safe_index_name('cities'));
    index.clearIndex(function(error, content) {
      index.saveObject({ name: 'San Francisco', objectID: '42' }, function(error, content) {
        error.should.eql(false);
        should.exist(content.taskID);
        index.waitTask(content.taskID, function(error, content) {
          error.should.eql(false);
          index.deleteObject('42', function(error, content) {
            error.should.eql(false);
            index.search('san f', function(error, content) {
              error.should.eql(false);
              content.should.have.property('hits').length(0);
              done();
            });
          });
        });
      });
    });
  });
});
