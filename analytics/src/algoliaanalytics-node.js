var Algolia = require('algolia-search');
var Buffers = require('buffers');
var https = require('https');

var AlgoliaAnalytics = function(applicationID, apiKey) {
  this.applicationID = applicationID;
  this.apiKey = apiKey;
  this.host = "analytics.algolia.com";
};


/**
 * Version Beta
 */
AlgoliaAnalytics.version = '0.0.1';

AlgoliaAnalytics.prototype = {

    /*
     * Test if the server is alive
     */
    isAlive: function(callback) {
      this._request({
          method: 'GET',
          hostname: this.host,
          port: 443,
          path: '/1/isalive'
        }, callback);
    },

    /*
     * Get popular searches
     * @param index
     * @param contains optionnal parameters (size, startAt, endAt, tags, country)
     */
    popularSearches: function(index, params, callback) {
      this._request({
          method: 'GET',
          hostname: this.host,
          port: 443,
          path: '/1/searches/' + encodeURIComponent(index) + '/popular' + (Object.keys(params).length > 0 ? ('?' + this._objectToURLParam(params)) : "")
        }, callback);
    },

    /*
     * Bench a new indexes with popular searches
     * Note: It costs up to 10k algolia operations
     * @param prodIndex used to fetch analytics data
     * @param devIndex used by the bench
     * @param params contains optionnal parameters (size, startAt, endAt, tags, country)
     */
    benchPopularSearches: function(prodIndex, devIndex, params, callback) {
      var self = this;
      this.popularSearches(prodIndex, params, function(success, content) {
        if (!success) {
          callback(false, content);
          return;
        }
        self._bench(content, devIndex, callback);
      });
    },

    /*
     * Get searches with 0 results
     * @param index
     * @param contains optionnal parameters (size, startAt, endAt, tags)
     */
    searchesWithoutResults: function(index, params, callback) {
      this._request({
          method: 'GET',
          hostname: this.host,
          port: 443,
          path: '/1/searches/' + encodeURIComponent(index) + '/noresults' + (Object.keys(params).length > 0 ? ('?' + this._objectToURLParam(params)) : "")
        }, callback);
    },

    /*
     * Bench a new indexes with searches with 0 results
     * Note: It costs up to 10k algolia operations
     * @param prodIndex used to fetch analytics data
     * @param devIndex used by the bench
     * @param params contains optionnal parameters (size, startAt, endAt, tags)
     */
    benchNoResults: function(prodIndex, devIndex, params, callback) {
      var self = this;
      this.searchesWithoutResults(prodIndex, params, function(success, content) {
        if (!success) {
          callback(false, content);
          return;
        }
        self._bench(content, devIndex, callback);
      });
    },

    /*
     * Get trend of a word
     */
    /*trend: function(index, params, callback) {
       this._request({
          method: 'GET',
          hostname: this.host,
          port: 443,
          path: '/1/trend/' + encodeURIComponent(index) + (Object.keys(params).length > 0 ? ('?' + this._objectToURLParam(params)) : "")
        }, callback);

      
    },*/

    /*
     * Get analytics used by dashboard
     */
    dashboard: function(index, params, callback) {
       this._request({
          method: 'GET',
          hostname: this.host,
          port: 443,
          path: '/1/dashboard/' + encodeURIComponent(index) + (Object.keys(params).length > 0 ? ('?' + this._objectToURLParam(params)) : "")
        }, callback);

    },

    /*
     * Bench an index with analytics data
     * @param analytics raw answer
     * @param devIndex used by the bench
     */
    _bench: function(analytics, devIndex, callback) {
      var queries = [];
      var self = this;
      for (var i = 0; i < (analytics.topSearchesNoResuls || analytics.topSearches).length; ++i) {
        var noResults = (analytics.topSearchesNoResuls || analytics.topSearches)[i];
        queries.push({indexName: devIndex, query: noResults.query, hitsPerPage: 10, analytics: 0, getRankingInfo: 1});
      }
      var client = new Algolia(this.applicationID, this.apiKey);
      client.multipleQueries(queries, "indexName", function(error, answer) {
        if (error) {
          callback(false, answer);
          return;
        }
        callback(true, self._compareAnalytics(analytics, answer));
      });
    },

    /*
     * Compare analytics with new queries
     * @param the raw analytics request
     * @param the raw multiple queries request
     */
    _compareAnalytics: function(analytics, answer) {
      var report = {};
      report.score = 0;
      report.searches = [];
      for (var i = 0; i < (analytics.topSearchesNoResuls || analytics.topSearches).length; ++i) {
        var noResults = (analytics.topSearchesNoResuls || analytics.topSearches)[i];
        var search = answer.results[i];
        var withoutTypo = 10; //hitsPerPage
        for (var hitIdx = 0; hitIdx < search.hits.length; ++hitIdx) {
          var hit = search.hits[hitIdx];
          withoutTypo -= hit._rankingInfo.nbTypos;
        }
        report.searches.push({query: noResults.query, improvement: (search.nbHits - (noResults.avgHitCount || 0) > 0), nbHits: search.nbHits, revelance: withoutTypo});
        report.score += withoutTypo
      }
      return report;
    },

    /*
     * Compute request
     */
    _computeRequest: function(opts) {
      opts.headers = {}
      opts.headers['X-Algolia-API-Key'] = this.apiKey;
      opts.headers['X-Algolia-Application-Id'] = this.applicationID;
      opts.headers['User-Agent'] = 'Algolia analytics for node.js ' + AlgoliaAnalytics.version
    },

    /*
     * Convert object to URL parameter
     */
    _objectToURLParam: function(param) {
      var strParams = [];
      for(var p in param) {
        if (param.hasOwnProperty(p)) {
          strParams.push(encodeURIComponent(p) + "=" + encodeURIComponent(param[p]));
        }
      }
      return strParams.join("&");
    },

    /*
     * Get the answer
     */
    _getAnswer: function(callback, res) {
      if (res.statusCode != 200) {
        callback(false, "status code: " + res.statusCode);
        return;
      }
      var chunks = new Buffers()

      res.on('data', function(chunk) {
        chunks.push(chunk);
      });

      res.once('end', function() {
        var body = chunks.toString('utf8');
        var body = JSON.parse(body);
        res.removeAllListeners();
        callback(true, body);
      });
    },

    /*
     * Execute the request
     */
    _request: function(opt, callback) {
      this._computeRequest(opt);
      var self = this;
      var req = https.request(opt, function(res) {
        self._getAnswer(callback, res);
        });

      req.once('error', function(e) {
        callback(false, e);
      });

      req.end();
    }

};

module.exports = AlgoliaAnalytics
