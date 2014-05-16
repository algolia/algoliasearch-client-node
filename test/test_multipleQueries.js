var should = require('should'),
    moquire = require('moquire'),
    _ = require('underscore');


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

  it('should handle disjunctive faceting', function(done) {
    var index = client.initIndex(safe_index_name('test_hotels-node'));
    index.setSettings({ attributesForFaceting: ['city', 'stars', 'facilities'] }, function(error, content) {
      error.should.eql(false);
      index.clearIndex(function(error, content) {
        error.should.eql(false);
        var objects = [
          { name: 'Hotel A', stars: '*', facilities: ['wifi', 'bath', 'spa'], city: 'Paris' },
          { name: 'Hotel B', stars: '*', facilities: ['wifi'], city: 'Paris' },
          { name: 'Hotel C', stars: '**', facilities: ['bath'], city: 'San Francisco' },
          { name: 'Hotel D', stars: '****', facilities: ['spa'], city: 'Paris' },
          { name: 'Hotel E', stars: '****', facilities: ['spa'], city: 'New York' }
        ];
        index.addObjects(objects, function(error, content) {
          error.should.eql(false);
          index.waitTask(content.taskID, function(error, content) {
            error.should.eql(false);
            index.searchDisjunctiveFaceting('h', ['stars', 'facilities'], { facets: 'city' }, {}, function(error, content) {
              error.should.eql(false);
              content['nbHits'].should.eql(5);
              _.size(content['facets']).should.eql(1);
              _.size(content['disjunctiveFacets']).should.eql(2);

              index.searchDisjunctiveFaceting('h', ['stars', 'facilities'], { facets: 'city' }, { stars: ['*'] }, function(error, content) {
                error.should.eql(false);
                content['nbHits'].should.eql(2);
                _.size(content['facets']).should.eql(1);
                _.size(content['disjunctiveFacets']).should.eql(2);
                content['disjunctiveFacets']['stars']['*'].should.eql(2);
                content['disjunctiveFacets']['stars']['**'].should.eql(1);
                content['disjunctiveFacets']['stars']['****'].should.eql(2);

                index.searchDisjunctiveFaceting('h', ['stars', 'facilities'], { facets: 'city' }, { stars: ['*'], city: ['Paris'] }, function(error, content) {
                  error.should.eql(false);
                  content['nbHits'].should.eql(2);
                  _.size(content['facets']).should.eql(1);
                  _.size(content['disjunctiveFacets']).should.eql(2);
                  content['disjunctiveFacets']['stars']['*'].should.eql(2);
                  content['disjunctiveFacets']['stars']['****'].should.eql(1);

                  index.searchDisjunctiveFaceting('h', ['stars', 'facilities'], { facets: 'city' }, { stars: ['*', '****'], city: ['Paris'] }, function(error, content) {
                    error.should.eql(false);
                    content['nbHits'].should.eql(3);
                    _.size(content['facets']).should.eql(1);
                    _.size(content['disjunctiveFacets']).should.eql(2);
                    content['disjunctiveFacets']['stars']['*'].should.eql(2);
                    content['disjunctiveFacets']['stars']['****'].should.eql(1);

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
