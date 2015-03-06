/*
 * Copyright (c) 2013 Algolia
 * http://www.algolia.com/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var _ = require('underscore');
var crypto = require('crypto');
if (typeof Parse === 'undefined') {
  var https = require('https');
}

/**
 * Algolia Search library initialization
 * @param applicationID the application ID you have in your admin interface
 * @param apiKey a valid API key for the service
 * @param hostsArray the list of hosts that you have received for the service
 * @param httpsAgent (optional) an agent to pass to https service (can be agentkeepalive module to minimize latency)
 */
var AlgoliaSearch = function(applicationID, apiKey, httpsAgent, hostsArray) {
    this.applicationID = applicationID;
    this.apiKey = apiKey;
    this.hosts = [];
    this.timeout = 30000;
    this.requestHeaders = {};
    if (_.isUndefined(hostsArray)) {
        hostsArray = [applicationID + '-1.algolia.net',
                      applicationID + '-2.algolia.net',
                      applicationID + '-3.algolia.net'];
    }

    // Add hosts in random order
    for (var i = 0; i < hostsArray.length; ++i) {
        if (Math.random() > 0.5) {
            this.hosts.reverse();
        }
        this.hosts.push(hostsArray[i]);
    }
    if (Math.random() > 0.5) {
        this.hosts.reverse();
    }
    this.httpsAgent = _.isUndefined(httpsAgent) ? null : httpsAgent;
    this.disableRateLimitForward();
    this.disableSecuredAPIKey();
};

/**
 * Version
 */
AlgoliaSearch.version = '1.7.6';

AlgoliaSearch.prototype = {
    /*
     * Delete an index
     *
     * @param indexName the name of index to delete
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer that contains the task ID
     */
    deleteIndex: function(indexName, callback) {
        this._request('DELETE', '/1/indexes/' + encodeURIComponent(indexName), null, callback);
    },
    /**
     * Move an existing index.
     * @param srcIndexName the name of index to copy.
     * @param dstIndexName the new index name that will contains a copy of srcIndexName (destination will be overriten if it already exist).
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer with index list or error description if error is true.
     */
    moveIndex: function(srcIndexName, dstIndexName, callback) {
        this._request('POST', '/1/indexes/' + encodeURIComponent(srcIndexName) + '/operation', {operation: 'move', destination: dstIndexName}, callback);
    },
    /**
     * Copy an existing index.
     * @param srcIndexName the name of index to copy.
     * @param dstIndexName the new index name that will contains a copy of srcIndexName (destination will be overriten if it already exist).
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer with index list or error description if error is true.
     */
    copyIndex: function(srcIndexName, dstIndexName, callback) {
        this._request('POST', '/1/indexes/' + encodeURIComponent(srcIndexName) + '/operation', {operation: 'copy', destination: dstIndexName}, callback);
    },
    /**
     * Return last log entries.
     * @param offset Specify the first entry to retrieve (0-based, 0 is the most recent log entry).
     * @param length Specify the maximum number of entries to retrieve starting at offset. Maximum allowed value: 1000.
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer with index list or error description if error is true.
     */
    getLogs: function(callback, offset, length, type) {
        if (_.isUndefined(offset)) {
            offset = 0;
        }
        if (_.isUndefined(length)) {
            length = 10;
        }
        if (_.isUndefined(type)) {
            type = all;
        }
        if (_.isBoolean(type)) {
            if (type === true) {
                type = 'error';
            } else {
                type = 'all';
            }
        }
        this._request('GET', '/1/logs?offset=' + offset + '&length=' + length + '&type=' + type, null, callback);
    },
    /*
     * This method allows to query multiple indexes with one API call
     */
    multipleQueries: function(queries, indexNameKey, callback) {
        var body = {requests:[]};
        for (var i = 0; i < queries.length; ++i) {
            var indexName = queries[i][indexNameKey];
            delete (queries[i][indexNameKey]);
            query = '';
            for (var key in queries[i]) {
                if (query !== '') {
                    query += '&';
                }
                if (key != null && queries[i].hasOwnProperty(key)) {
                    query += key + '=' + encodeURIComponent(Object.prototype.toString.call(queries[i][key]) === '[object Array]' ? JSON.stringify(queries[i][key]) : queries[i][key]);
                }
            }
            var request = { indexName: indexName,
                            params: query };
            body.requests.push(request);
        }
        this._request('POST', '/1/indexes/*/queries', body, callback);
    },
    /*
     * List all existing indexes
     *
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer with index list or error description if error is true.
     */
    listIndexes: function(callback) {
        this._request('GET', '/1/indexes/', null, callback);
    },
    /*
     * Get the index object initialized
     *
     * @param indexName the name of index
     * @param callback the result callback with one argument (the Index instance)
     */
    initIndex: function(indexName) {
        return new this.Index(this, indexName);
    },
    /*
     * List all existing user keys with their associated ACLs
     *
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer with user keys list or error description if error is true.
     */
    listUserKeys: function(callback) {
        this._request('GET', '/1/keys', null, callback);
    },
    /*
     * Get ACL of a user key
     *
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer with user keys list or error description if error is true.
     */
    getUserKeyACL: function(key, callback) {
        this._request('GET', '/1/keys/' + key, null, callback);
    },
    /*
     * Delete an existing user key
     *
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer with user keys list or error description if error is true.
     */
    deleteUserKey: function(key, callback) {
        this._request('DELETE', '/1/keys/' + key, null, callback);
    },
    /*
     * Add a user key
     *
     * @param acls the list of ACL for this key. Defined by an array of strings that
     * can contains the following values:
     *   - search: allow to search (https and http)
     *   - addObject: allows to add/update an object in the index (https only)
     *   - deleteObject : allows to delete an existing object (https only)
     *   - deleteIndex : allows to delete index content (https only)
     *   - settings : allows to get index settings (https only)
     *   - editSettings : allows to change index settings (https only)
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer with user keys list or error description if error is true.
     */
    addUserKey: function(acls, callback) {
        var aclsObject = {};
        aclsObject.acl = acls;
        this._request('POST', '/1/keys', aclsObject, callback);
    },
    /*
     * Add a user key
     *
     * @param acls the list of ACL for this key. Defined by an array of strings that
     * can contains the following values:
     *   - search: allow to search (https and http)
     *   - addObject: allows to add/update an object in the index (https only)
     *   - deleteObject : allows to delete an existing object (https only)
     *   - deleteIndex : allows to delete index content (https only)
     *   - settings : allows to get index settings (https only)
     *   - editSettings : allows to change index settings (https only)
     * @param validity the number of seconds after which the key will be automatically removed (0 means no time limit for this key)
     * @param maxQueriesPerIPPerHour Specify the maximum number of API calls allowed from an IP address per hour. Defaults to 0 (no rate limit).
     * @param maxHitsPerQuery Specify the maximum number of hits this API key can retrieve in one call. Defaults to 0 (unlimited)
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer with user keys list or error description if error is true.
     */
    addUserKeyWithValidity: function(acls, validity, maxQueriesPerIPPerHour, maxHitsPerQuery, callback) {
        var aclsObject = {};
        aclsObject.acl = acls;
        aclsObject.validity = validity;
        aclsObject.maxQueriesPerIPPerHour = maxQueriesPerIPPerHour;
        aclsObject.maxHitsPerQuery = maxHitsPerQuery;
        this._request('POST', '/1/keys', aclsObjects, callback);
    },
    /*
     * Add a user key
     *
     * @param acls the list of ACL for this key. Defined by an array of strings that
     * can contains the following values:
     *   - search: allow to search (https and http)
     *   - addObject: allows to add/update an object in the index (https only)
     *   - deleteObject : allows to delete an existing object (https only)
     *   - deleteIndex : allows to delete index content (https only)
     *   - settings : allows to get index settings (https only)
     *   - editSettings : allows to change index settings (https only)
     * @param validity the number of seconds after which the key will be automatically removed (0 means no time limit for this key)
     * @param maxQueriesPerIPPerHour Specify the maximum number of API calls allowed from an IP address per hour. (0 means no rate limit).
     * @param maxHitsPerQuery Specify the maximum number of hits this API key can retrieve in one call. (0 means unlimited)
     * @param indexes the list of targeted indexes
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer with user keys list or error description if error is true.
     */
    addUserKeyWithValidityAndIndexes: function(acls, validity, maxQueriesPerIPPerHour, maxHitsPerQuery, indexes, callback) {
        var aclsObject = {};
        aclsObject.acl = acls;
        aclsObject.validity = validity;
        aclsObject.maxQueriesPerIPPerHour = maxQueriesPerIPPerHour;
        aclsObject.maxHitsPerQuery = maxHitsPerQuery;
        aclsObject.indexes = indexes;
        this._request('POST', '/1/keys', aclsObjects, callback);
    },
    /*
     * Update a user key
     *
     * @param acls the list of ACL for this key. Defined by an array of strings that
     * can contains the following values:
     *   - search: allow to search (https and http)
     *   - addObject: allows to add/update an object in the index (https only)
     *   - deleteObject : allows to delete an existing object (https only)
     *   - deleteIndex : allows to delete index content (https only)
     *   - settings : allows to get index settings (https only)
     *   - editSettings : allows to change index settings (https only)
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer with user keys list or error description if error is true.
     */
    updateUserKey: function(key, acls, callback) {
        var aclsObject = {};
        aclsObject.acl = acls;
        this._request('PUT', '/1/keys/' + key, aclsObject, callback);
    },
    /*
     * Update a user key
     *
     * @param acls the list of ACL for this key. Defined by an array of strings that
     * can contains the following values:
     *   - search: allow to search (https and http)
     *   - addObject: allows to add/update an object in the index (https only)
     *   - deleteObject : allows to delete an existing object (https only)
     *   - deleteIndex : allows to delete index content (https only)
     *   - settings : allows to get index settings (https only)
     *   - editSettings : allows to change index settings (https only)
     * @param validity the number of seconds after which the key will be automatically removed (0 means no time limit for this key)
     * @param maxQueriesPerIPPerHour Specify the maximum number of API calls allowed from an IP address per hour. Defaults to 0 (no rate limit).
     * @param maxHitsPerQuery Specify the maximum number of hits this API key can retrieve in one call. Defaults to 0 (unlimited)
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer with user keys list or error description if error is true.
     */
    updateUserKeyWithValidity: function(key, acls, validity, maxQueriesPerIPPerHour, maxHitsPerQuery, callback) {
        var aclsObject = {};
        aclsObject.acl = acls;
        aclsObject.validity = validity;
        aclsObject.maxQueriesPerIPPerHour = maxQueriesPerIPPerHour;
        aclsObject.maxHitsPerQuery = maxHitsPerQuery;
        this._request('PUT', '/1/keys/' + key, aclsObjects, callback);
    },
    /*
     * Update a user key
     *
     * @param acls the list of ACL for this key. Defined by an array of strings that
     * can contains the following values:
     *   - search: allow to search (https and http)
     *   - addObject: allows to add/update an object in the index (https only)
     *   - deleteObject : allows to delete an existing object (https only)
     *   - deleteIndex : allows to delete index content (https only)
     *   - settings : allows to get index settings (https only)
     *   - editSettings : allows to change index settings (https only)
     * @param validity the number of seconds after which the key will be automatically removed (0 means no time limit for this key)
     * @param maxQueriesPerIPPerHour Specify the maximum number of API calls allowed from an IP address per hour. (0 means no rate limit).
     * @param maxHitsPerQuery Specify the maximum number of hits this API key can retrieve in one call. (0 means unlimited)
     * @param indexes the list of targeted indexes
     * @param callback the result callback with two arguments
     *  error: boolean set to true if the request had an error
     *  content: the server answer with user keys list or error description if error is true.
     */
    updateUserKeyWithValidityAndIndexes: function(key, acls, validity, maxQueriesPerIPPerHour, maxHitsPerQuery, indexes, callback) {
        var aclsObject = {};
        aclsObject.acl = acls;
        aclsObject.validity = validity;
        aclsObject.maxQueriesPerIPPerHour = maxQueriesPerIPPerHour;
        aclsObject.maxHitsPerQuery = maxHitsPerQuery;
        aclsObject.indexes = indexes;
        this._request('PUT', '/1/keys/' + key, aclsObjects, callback);
    },
    /*
     * Generate a secured and public API Key from a list of tagFilters and an
     * optional user token identifying the current user
     *
     * @param privateApiKey your private API Key
     * @param tagFilters the list of tags applied to the query (used as security)
     * @param userToken an optional token identifying the current user
     */
    generateSecuredApiKey: function(privateApiKey, tagFilters, userToken) {
        if (Object.prototype.toString.call(tagFilters) === '[object Array]') {
            var strTags = [];
            for (var i = 0; i < tagFilters.length; ++i) {
                if (Object.prototype.toString.call(tagFilters[i]) === '[object Array]') {
                    var oredTags = [];
                    for (var j = 0; j < tagFilters[i].length; ++j) {
                        oredTags.push(tagFilters[i][j]);
                    }
                    strTags.push('(' + oredTags.join(',') + ')');
                } else {
                    strTags.push(tagFilters[i]);
                }
            }
            tagFilters = strTags.join(',');
        }
        return crypto.createHmac('sha256', privateApiKey).update(tagFilters + (userToken || '')).digest('hex');
    },
    /*
     * Index class constructor.
     * You should not use this method directly but use initIndex() function
     */
    Index: function(algoliasearch, indexName) {
        this.indexName = indexName;
        this.as = algoliasearch;
    },

    /*
     * Allow to use IP rate limit when you have a proxy between end-user and Algolia.
     * This option will set the X-Forwarded-For HTTP header with the client IP and the X-Forwarded-API-Key with the API Key having rate limits.
     * @param adminAPIKey the admin API Key you can find in your dashboard
     * @param endUserIP the end user IP (you can use both IPV4 or IPV6 syntax)
     * @param rateLimitAPIKey the API key on which you have a rate limit
     */
    enableRateLimitForward: function(adminAPIKey, endUserIP, rateLimitAPIKey) {
        this.forwardAdminAPIKey = adminAPIKey;
        this.forwardEndUserIP = endUserIP;
        this.forwardLimitAPIKey = rateLimitAPIKey;
    },

    /*
     * Disable IP rate limit enabled with enableRateLimitForward() function
     */
    disableRateLimitForward: function() {
        this.forwardAdminAPIKey = null;
        this.forwardEndUserIP = null;
        this.forwardLimitAPIKey = null;
    },

    /*
     * Specify the securedAPIKey to use with associated information
     */
    useSecuredAPIKey: function(securedAPIKey, securityTags, userToken) {
        this.securedAPIKey = securedAPIKey;
        this.securityTags = securityTags;
        this.userToken = userToken;
    },

    /*
     * If a secured API was used, disable it
     */
    disableSecuredAPIKey : function() {
        this.securedAPIKey = null;
        this.SecurityTags = null;
        this.userToken = null;
    },

   /**
     * Add an extra field to the HTTP request
     *
     * @param key the header field name
     * @param value the header field value
     */
    setExtraHeader: function(key, value) {
        this.requestHeaders[key] = value;
    },

    /**
      * Set the read timeout
      *
      * @param value timeout in millisecond
      */
    setTimeout: function(value) {
      if (typeof Parse !== 'undefined') {
        console.log('The timeout is ignored with Parse');
      }
      this.timeout = value;
    },

    _request: function(method, url, body, callback) {
        this._jsonRequest({ method: method,
                            url: url,
                            body: body,
                            headers: this._computeHeaders(),
                            callback: function(error, res, body) {
            if (!_.isUndefined(callback)) {
                callback(error, body);
            }
        }});
    },
    _requestDerive: function(method, url, body, callback, ClassToDerive) {
        this._jsonRequest({ method: method,
                            url: url,
                            body: body,
                            headers: this._computeHeaders(),
                            callback: function(error, res, body) {
            if (!_.isUndefined(callback)) {
               if (!error && !_.isUndefined(ClassToDerive)) {
                    for (var i in body.hits) {
                        var obj = new ClassToDerive();
                        _.extend(obj, body.hits[i]);
                        body.hits[i] = obj;
                    }
                }
                if (!_.isUndefined(callback)) {
                    callback(error, body);
                }
            }
        }});
    },



    /*
     * Wrapper that try all hosts to maximize the quality of service
     */
    _jsonRequest: function(opts) {
        var self = this;
        var callback = opts.callback;

        var impl = function(position) {
            var idx = 0;
            if (!_.isUndefined(position)) {
                idx = position;
            }
            if (!Array.isArray(self.hosts) || self.hosts.length <= idx) {
                callback(true, null, { message: 'Cannot contact server', httpCode: 0});
                return;
            }
            opts.callback = function(retry, error, res, body) {
                if (retry && error && (idx + 1) < self.hosts.length) {
                    impl(idx + 1);
                } else {
                    body.httpCode = res.statusCode;
                    callback(error, res, body);
                }
            };
            opts.hostname = self.hosts[idx];
            if (typeof Parse !== 'undefined') {
                self._parseJsonRequestByHost(opts);
            } else {
                self._jsonRequestByHost(opts);
            }
        };
        impl();
    },
    _addHeadersRateLimit: function(headers) {
        if (this.forwardAdminAPIKey) {
            headers['X-Algolia-API-Key'] = this.forwardAdminAPIKey;
            headers['X-Forwarded-API-Key'] = this.forwardLimitAPIKey;
            headers['X-Forwarded-For'] = this.forwardEndUserIP;
        }
        return headers;
    },
    _addHeadersSecuredAPIKey: function(headers) {
        if (this.securedAPIKey) {
            headers['X-Algolia-API-Key'] = this.securedAPIKey;
        }
        if (this.securityTags) {
            headers['X-Algolia-TagFilters'] = this.securityTags;
        }
        if (this.userToken) {
            headers['X-Algolia-UserToken'] = this.userToken;
        }
        return headers;
    },
    _basicHeaders: function() {
        return {
            'X-Algolia-Application-Id': this.applicationID,
            'X-Algolia-API-Key': this.apiKey,
            'Connection':'keep-alive',
            'Content-Length': 0,
            'User-Agent': 'Algolia for node.js ' + AlgoliaSearch.version
        };
    },
    _addBodyHeaders: function(headers, length) {
        return _.extend(headers, { 'Content-Type': 'application/json;charset=utf-8',
                                                   'Content-Length': length });
    },
    _computeHeaders: function() {
        var headers = this.requestHeaders;
        _.extend(headers, this._basicHeaders());
        headers = this._addHeadersRateLimit(headers);
        headers = this._addHeadersSecuredAPIKey(headers);
        return headers;
    },
    _parseComputeRequestOptions: function(opts, body) {
        var obj = this;
        var reqOpts = {
          method: opts.method,
          url: 'https://' + opts.hostname + opts.url,
          headers: opts.headers,
          success: function(res) {
            obj._parseJsonRequestByHost_do(opts.callback, res);
          },
          error: function(res) {
            opts.callback(true, true, null, { 'message': res.text, httpCode: 0} );
          }
        };

        if (body != null) {
            var bodyUTF = body.toString('utf8');
            reqOpts.headers = this._addBodyHeaders(reqOpts.headers, bodyUTF.length);
            reqOpts.body = bodyUTF;
        }
        delete reqOpts.headers['Content-Length'];
        return reqOpts;
    },
    _computeRequestOptions: function(opts, body) {
        var reqOpts = {
          method: opts.method,
          hostname: opts.hostname,
          port: 443,
          path: opts.url,
          headers: opts.headers,
          withCredentials: false
        };

        if (opts.hostname.indexOf(':') !== -1) {
            var n = opts.hostname.split(':');
            reqOpts.hostname = n[0];
            reqOpts.port = n[1];
        }
        if (body != null) {
            reqOpts.headers = this._addBodyHeaders(reqOpts.headers, new Buffer(body, 'utf8').length);
        }
        if (this.httpsAgent !== null) {
            reqOpts.agent = this.httpsAgent;
        }
        return reqOpts;
    },
    _haveSucceeded: function(status) {
      return (parseInt(status / 100, 10) === 2);
    },
    _haveFailed: function(status) {
      return (parseInt(status / 100, 10) === 4);
    },
    _parseJsonRequestByHost_do: function(callback, res) {
        var retry = !this._haveFailed(res.status);
        var success = this._haveSucceeded(res.status);
        var body = null;


        if (res && res.headers['Content-Type'] && res.headers['Content-Type'].indexOf('application/json') >= 0) {
            body = JSON.parse(res.text);
        } else {
            body = res.text;
        }
        callback(retry, !success, res, body);
    },
    _jsonRequestByHost_do: function(callback, res) {
        var retry = !this._haveFailed(res.statusCode);
        var success = this._haveSucceeded(res.statusCode);
        var chunks = [];

        res.on('data', function(chunk) {
            chunks.push(new Buffer(chunk));
        });

        res.once('end', function() {
            var body = Buffer.concat(chunks).toString('utf8');

            if (res && res.headers['content-type'] && res.headers['content-type'].toLowerCase().indexOf('application/json') >= 0) {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    success = false;
                    body = { message: 'Cannot parse JSON', httpCode: 0, body: body };
                }
            }

            res.removeAllListeners();
            callback(retry, !success, res, body);
        });
    },
    _parseJsonRequestByHost: function(opts) {
        var body = null;
        if (opts.body != null) {
            body = JSON.stringify(opts.body);
        }
        var reqOpts = this._parseComputeRequestOptions(opts, body);
        Parse.Cloud.httpRequest(reqOpts);
    },
    _jsonRequestByHost: function(opts) {
        var body = null;
        if (opts.body != null) {
            body = JSON.stringify(opts.body);
        }
        var reqOpts = this._computeRequestOptions(opts, body);
        var obj = this;
        var req = https.request(reqOpts, function(res) {
            obj._jsonRequestByHost_do(opts.callback, res);
        });
        req.once('error', function(e) {
            opts.callback(true, true, null, { 'message': e, httpCode: 0} );
        });

        if (body != null) {
            req.write(body, encoding = 'utf8');
        }
        req.end();
    },

    /// internal attributes
    applicationID: null,
    apiKey: null,
    httpsAgent: null,
    hosts: [],
    batch: []
};

/*
 * Contains all the functions related to one index
 * You should use AlgoliaSearch.initIndex(indexName) to retrieve this object
 */
AlgoliaSearch.prototype.Index.prototype = {
        /*
         * Add an object in this index
         *
         * @param content contains the javascript object to add inside the index
         * @param callbackOrObjectID (optional) the result callback with two arguments:
         *  error: boolean set to true if the request had an error
         *  content: the server answer that contains 3 elements: createAt, taskId and objectID
         * @param objectIDOrCallback (optional) an objectID you want to attribute to this object
         * (if the attribute already exist the old object will be overwrite)
         */
        addObject: function(content, callbackOrObjectID, objectIDOrCallback) {
            var callback, objectID;
            if (!_.isUndefined(callbackOrObjectID) && !_.isUndefined(objectIDOrCallback) && !_.isFunction(callbackOrObjectID) && _.isFunction(objectIDOrCallback)) {
                callback = objectIDOrCallback;
                objectID = callbackOrObjectID;
            } else {
                if (_.isFunction(callbackOrObjectID)) {
                    callback = callbackOrObjectID;
                    objectID = objectIDOrCallback;
                } else {
                    callback = objectIDOrCallback;
                    objectID = callbackOrObjectID;
                }
            }
            if (_.isUndefined(objectID)) {
                this.as._request('POST', '/1/indexes/' + encodeURIComponent(this.indexName), content, callback);
            } else {
                this.as._request('PUT', '/1/indexes/' + encodeURIComponent(this.indexName) + '/' + encodeURIComponent(objectID), content, callback);
            }

        },
        /*
         * Add several objects
         *
         * @param objects contains an array of objects to add
         * @param callback (optional) the result callback with two arguments:
         *  error: boolean set to true if the request had an error
         *  content: the server answer that updateAt and taskID
         */
        addObjects: function(objects, callback) {
            this._batch(objects, 'addObject', callback);
        },
        /*
         * Get an object from this index
         *
         * @param objectID the unique identifier of the object to retrieve
         * @param callback (optional) the result callback with two arguments
         *  error: boolean set to true if the request had an error
         *  content: the object to retrieve or the error message if a failure occured
         * @param ClassToDerive (optional) if set, hits will be an instance of this class
         * @param attributes (optional) if set, contains the array of attribute names to retrieve
         */
        getObject: function(objectID, callback, attributes, ClassToDerive) {
            var params = '';
            if (!_.isUndefined(attributes)) {
                params = '?attributes=';
                for (var i = 0; i < attributes.length; ++i) {
                    if (i !== 0) {
                        params += ',';
                    }
                    params += attributes[i];
                }
            }
            this.as._request('GET', '/1/indexes/' + encodeURIComponent(this.indexName) + '/' + encodeURIComponent(objectID) + params, objectID, callback);
        },

        /*
         * Get several objects from this index
         *
         * @param objectIDs the array of unique identifier of objects to retrieve
         */
        getObjects: function(objectIDs, callback) {
          requests = [];
          for (var i = 0; i < objectIDs.length; ++i) {
              requests.push({ 'indexName': this.indexName, 'objectID': objectIDs[i]});
          }
          this.as._request('POST', '/1/indexes/*/objects', { 'requests': requests}, callback);
        },
        /*
         * Update partially an object (only update attributes passed in argument)
         *
         * @param partialObject contains the javascript attributes to override, the
         *  object must contains an objectID attribute
         * @param callback (optional) the result callback with two arguments:
         *  error: boolean set to true if the request had an error
         *  content: the server answer that contains 3 elements: createAt, taskId and objectID
         */
        partialUpdateObject: function(partialObject, callback) {
            this.as._request('POST', '/1/indexes/' + encodeURIComponent(this.indexName) + '/' + encodeURIComponent(partialObject.objectID) + '/partial', partialObject, callback);
        },

        /*
         * Partially Override the content of several objects
         *
         * @param objects contains an array of objects to update (each object must contains a objectID attribute)
         * @param callback (optional) the result callback with two arguments:
         *  error: boolean set to true if the request had an error
         *  content: the server answer that updateAt and taskID
         */
        partialUpdateObjects: function(objects, callback) {
            this._batch(objects, 'partialUpdateObject', callback);
        },

        /*
         * Override the content of object
         *
         * @param object contains the javascript object to save, the object must contains an objectID attribute
         * @param callback (optional) the result callback with two arguments:
         *  error: boolean set to true if the request had an error
         *  content: the server answer that updateAt and taskID
         */
        saveObject: function(object, callback) {
            this.as._request('PUT', '/1/indexes/' + encodeURIComponent(this.indexName) + '/' + encodeURIComponent(object.objectID), object, callback);
        },
        /*
         * Override the content of several objects
         *
         * @param objects contains an array of objects to update (each object must contains a objectID attribute)
         * @param callback (optional) the result callback with two arguments:
         *  error: boolean set to true if the request had an error
         *  content: the server answer that updateAt and taskID
         */
        saveObjects: function(objects, callback) {
            this._batch(objects, 'updateObject', callback);
        },


        batch: function(request, callback) {
            this.as._request('POST', '/1/indexes/' + encodeURIComponent(this.indexName) + '/batch', request, callback);
        },

        /*
         * Delete an object from the index
         *
         * @param objectID the unique identifier of object to delete
         * @param callback (optional) the result callback with two arguments:
         *  error: boolean set to true if the request had an error
         *  content: the server answer that contains 3 elements: createAt, taskId and objectID
         */
        deleteObject: function(objectID, callback) {
            if (!objectID || ('' + objectID) === '') {
                callback(true, { message: 'empty objectID', httpCode: 0});
                return;
            }
            this.as._request('DELETE', '/1/indexes/' + encodeURIComponent(this.indexName) + '/' + encodeURIComponent(objectID), null, callback);
        },
        /*
         * Delete several objects
         *
         * @param objects contains an array of objectID to delete
         * @param callback (optional) the result callback with two arguments:
         *  error: boolean set to true if the request had an error
         *  content: the server answer that updateAt and taskID
         */
        deleteObjects: function(objects, callback) {
            var objectIDs = [];
            objects.forEach(function(value) {
                objectIDs.push({ 'objectID' : value });
            });
            this._batch(objectIDs, 'deleteObject', callback);
        },
        /*
         * Delete all objects matching a query
         *
         * @param query the query string
         * @param params the optional query parameters
         * @param callback (optional) the result callback with no argument:
         */
        deleteByQuery: function(query, params, callback) {
            params = params || {};
            params.attributesToRetrieve = [ 'objectID' ];
            params.hitsPerPage = 1000;
            var index = this;

            this.search(query, function(error, results) {
                if (!error && results.nbHits > 0) {
                    var objectIDs = [];
                    for (var i = 0; i < results.hits.length; ++i) {
                        objectIDs.push(results.hits[i].objectID);
                    }
                    index.deleteObjects(objectIDs, function(error, content) {
                        if (error) {
                            callback && callback(error, content);
                            return;
                        }
                        if (typeof Parse === 'undefined') {
                            index.waitTask(content.taskID, function(error, content) {
                                if (error) {
                                    callback && callback(error, content);
                                    return;
                                }
                                index.deleteByQuery(query, params, callback);
                            });
                        } else if (results.nbHits > 1000) {
                            callback && callback(true, { message: 'Cannot delete more than 1,000 results at a time on Parse.com', httpCode: 0 });
                        } else {
                            callback && callback(false, results);
                        }
                    });
                } else {
                  callback && callback(false, results);
                }
            }, params);
        },
        /*
         * Search inside the index
         *
         * @param query the full text query
         * @param callback the result callback with two arguments:
         *  error: boolean set to true if the request had an error
         *  content: the server answer that contains the list of results
         * @param ClassToDerive (optional) if set, hits will be an instance of this class
         * @param args (optional) if set, contains an object with query parameters:
         * - page: (integer) Pagination parameter used to select the page to retrieve.
         *                   Page is zero-based and defaults to 0. Thus, to retrieve the 10th page you need to set page=9
         * - hitsPerPage: (integer) Pagination parameter used to select the number of hits per page. Defaults to 20.
         * - attributesToRetrieve: a string that contains the list of object attributes you want to retrieve (let you minimize the answer size).
         *   Attributes are separated with a comma (for example "name,address").
         *   You can also use a string array encoding (for example ["name","address"]).
         *   By default, all attributes are retrieved. You can also use '*' to retrieve all values when an attributesToRetrieve setting is specified for your index.
         * - attributesToHighlight: a string that contains the list of attributes you want to highlight according to the query.
         *   Attributes are separated by a comma. You can also use a string array encoding (for example ["name","address"]).
         *   If an attribute has no match for the query, the raw value is returned. By default all indexed text attributes are highlighted.
         *   You can use `*` if you want to highlight all textual attributes. Numerical attributes are not highlighted.
         *   A matchLevel is returned for each highlighted attribute and can contain:
         *      - full: if all the query terms were found in the attribute,
         *      - partial: if only some of the query terms were found,
         *      - none: if none of the query terms were found.
         * - attributesToSnippet: a string that contains the list of attributes to snippet alongside the number of words to return (syntax is `attributeName:nbWords`).
         *    Attributes are separated by a comma (Example: attributesToSnippet=name:10,content:10).
         *    You can also use a string array encoding (Example: attributesToSnippet: ["name:10","content:10"]). By default no snippet is computed.
         * - minWordSizefor1Typo: the minimum number of characters in a query word to accept one typo in this word. Defaults to 3.
         * - minWordSizefor2Typos: the minimum number of characters in a query word to accept two typos in this word. Defaults to 7.
         * - getRankingInfo: if set to 1, the result hits will contain ranking information in _rankingInfo attribute.
         * - aroundLatLng: search for entries around a given latitude/longitude (specified as two floats separated by a comma).
         *   For example aroundLatLng=47.316669,5.016670).
         *   You can specify the maximum distance in meters with the aroundRadius parameter (in meters) and the precision for ranking with aroundPrecision
         *   (for example if you set aroundPrecision=100, two objects that are distant of less than 100m will be considered as identical for "geo" ranking parameter).
         *   At indexing, you should specify geoloc of an object with the _geoloc attribute (in the form {"_geoloc":{"lat":48.853409, "lng":2.348800}})
         * - insideBoundingBox: search entries inside a given area defined by the two extreme points of a rectangle (defined by 4 floats: p1Lat,p1Lng,p2Lat,p2Lng).
         *   For example insideBoundingBox=47.3165,4.9665,47.3424,5.0201).
         *   At indexing, you should specify geoloc of an object with the _geoloc attribute (in the form {"_geoloc":{"lat":48.853409, "lng":2.348800}})
         * - numericFilters: a string that contains the list of numeric filters you want to apply separated by a comma.
         *   The syntax of one filter is `attributeName` followed by `operand` followed by `value`. Supported operands are `<`, `<=`, `=`, `>` and `>=`.
         *   You can have multiple conditions on one attribute like for example numericFilters=price>100,price<1000.
         *   You can also use a string array encoding (for example numericFilters: ["price>100","price<1000"]).
         * - tagFilters: filter the query by a set of tags. You can AND tags by separating them by commas.
         *   To OR tags, you must add parentheses. For example, tags=tag1,(tag2,tag3) means tag1 AND (tag2 OR tag3).
         *   You can also use a string array encoding, for example tagFilters: ["tag1",["tag2","tag3"]] means tag1 AND (tag2 OR tag3).
         *   At indexing, tags should be added in the _tags** attribute of objects (for example {"_tags":["tag1","tag2"]}).
         * - facetFilters: filter the query by a list of facets.
         *   Facets are separated by commas and each facet is encoded as `attributeName:value`.
         *   For example: `facetFilters=category:Book,author:John%20Doe`.
         *   You can also use a string array encoding (for example `["category:Book","author:John%20Doe"]`).
         * - facets: List of object attributes that you want to use for faceting.
         *   Attributes are separated with a comma (for example `"category,author"` ).
         *   You can also use a JSON string array encoding (for example ["category","author"]).
         *   Only attributes that have been added in **attributesForFaceting** index setting can be used in this parameter.
         *   You can also use `*` to perform faceting on all attributes specified in **attributesForFaceting**.
         * - queryType: select how the query words are interpreted, it can be one of the following value:
         *    - prefixAll: all query words are interpreted as prefixes,
         *    - prefixLast: only the last word is interpreted as a prefix (default behavior),
         *    - prefixNone: no query word is interpreted as a prefix. This option is not recommended.
         * - optionalWords: a string that contains the list of words that should be considered as optional when found in the query.
         *   The list of words is comma separated.
         * - distinct: If set to 1, enable the distinct feature (disabled by default) if the attributeForDistinct index setting is set.
         *   This feature is similar to the SQL "distinct" keyword: when enabled in a query with the distinct=1 parameter,
         *   all hits containing a duplicate value for the attributeForDistinct attribute are removed from results.
         *   For example, if the chosen attribute is show_name and several hits have the same value for show_name, then only the best
         *   one is kept and others are removed.
         */
        search: function(query, callback, args, ClassToDerive) {
            var params = 'query=' + encodeURIComponent(query);
            if (!_.isUndefined(args)) {
                params = this._getSearchParams(args, params);
            }
            this.as._requestDerive('POST', '/1/indexes/' + encodeURIComponent(this.indexName) + '/query', {params: params}, callback, ClassToDerive);
        },

        /*
         * Browse all index content
         *
         * @param page Pagination parameter used to select the page to retrieve.
         *             Page is zero-based and defaults to 0. Thus, to retrieve the 10th page you need to set page=9
         * @param hitsPerPage: Pagination parameter used to select the number of hits per page. Defaults to 1000.
         */
        browse: function(page, callback, hitsPerPage, ClassToDerive) {
            var params = '?page=' + page;
            if (!_.isUndefined(hitsPerPage)) {
                params += '&hitsPerPage=' + hitsPerPage;
            }
            this.as._requestDerive('GET', '/1/indexes/' + encodeURIComponent(this.indexName) + '/browse' + params, null, callback, ClassToDerive);
        },

        /*
         * Wait the publication of a task on the server.
         * All server task are asynchronous and you can check with this method that the task is published.
         *
         * @param taskID the id of the task returned by server
         * @param callback the result callback with with two arguments:
         *  error: boolean set to true if the request had an error
         *  content: the server answer that contains the list of results
         */
        waitTask: function(taskID, callback) {
            var indexObj = this;
            this.as._jsonRequest({ method: 'GET',
                                   url: '/1/indexes/' + encodeURIComponent(indexObj.indexName) + '/task/' + taskID,
                                   headers: this.as._computeHeaders(),
                                   callback: function(error, res, body) {
                if (error) {
                    callback(true, body);
                } else {
                    if (body.status === 'published') {
                        callback(false, body);
                    } else {
                        setTimeout(function() {
                            indexObj.waitTask(taskID, callback);
                        }, 100);
                    }
                }
            }});
        },

        /*
         * Get settings of this index
         *
         * @param callback (optional) the result callback with two arguments
         *  error: boolean set to true if the request had an error
         *  content: the settings object or the error message if a failure occured
         */
        getSettings: function(callback) {
            this.as._request('GET', '/1/indexes/' + encodeURIComponent(this.indexName) + '/settings', null, callback);
        },

        /*
         * This function deletes the index content. Settings and index specific API keys are kept untouched.
         *
         * @param callback (optional) the result callback with two arguments
         *  error: boolean set to true if the request had an error
         *  content: the settings object or the error message if a failure occured
         */
        clearIndex: function(callback) {
            this.as._request('POST', '/1/indexes/' + encodeURIComponent(this.indexName) + '/clear', null, callback);
        },

        /*
         * Set settings for this index
         *
         * @param settigns the settings object that can contains :
         * - minWordSizefor1Typo: (integer) the minimum number of characters to accept one typo (default = 3).
         * - minWordSizefor2Typos: (integer) the minimum number of characters to accept two typos (default = 7).
         * - hitsPerPage: (integer) the number of hits per page (default = 10).
         * - attributesToRetrieve: (array of strings) default list of attributes to retrieve in objects.
         *   If set to null, all attributes are retrieved.
         * - attributesToHighlight: (array of strings) default list of attributes to highlight.
         *   If set to null, all indexed attributes are highlighted.
         * - attributesToSnippet**: (array of strings) default list of attributes to snippet alongside the number of words to return (syntax is attributeName:nbWords).
         *   By default no snippet is computed. If set to null, no snippet is computed.
         * - attributesToIndex: (array of strings) the list of fields you want to index.
         *   If set to null, all textual and numerical attributes of your objects are indexed, but you should update it to get optimal results.
         *   This parameter has two important uses:
         *     - Limit the attributes to index: For example if you store a binary image in base64, you want to store it and be able to
         *       retrieve it but you don't want to search in the base64 string.
         *     - Control part of the ranking*: (see the ranking parameter for full explanation) Matches in attributes at the beginning of
         *       the list will be considered more important than matches in attributes further down the list.
         *       In one attribute, matching text at the beginning of the attribute will be considered more important than text after, you can disable
         *       this behavior if you add your attribute inside `unordered(AttributeName)`, for example attributesToIndex: ["title", "unordered(text)"].
         * - attributesForFaceting: (array of strings) The list of fields you want to use for faceting.
         *   All strings in the attribute selected for faceting are extracted and added as a facet. If set to null, no attribute is used for faceting.
         * - attributeForDistinct: (string) The attribute name used for the Distinct feature. This feature is similar to the SQL "distinct" keyword: when enabled
         *   in query with the distinct=1 parameter, all hits containing a duplicate value for this attribute are removed from results.
         *   For example, if the chosen attribute is show_name and several hits have the same value for show_name, then only the best one is kept and others are removed.
         * - ranking: (array of strings) controls the way results are sorted.
         *   We have six available criteria:
         *    - typo: sort according to number of typos,
         *    - geo: sort according to decreassing distance when performing a geo-location based search,
         *    - proximity: sort according to the proximity of query words in hits,
         *    - attribute: sort according to the order of attributes defined by attributesToIndex,
         *    - exact:
         *        - if the user query contains one word: sort objects having an attribute that is exactly the query word before others.
         *          For example if you search for the "V" TV show, you want to find it with the "V" query and avoid to have all popular TV
         *          show starting by the v letter before it.
         *        - if the user query contains multiple words: sort according to the number of words that matched exactly (and not as a prefix).
         *    - custom: sort according to a user defined formula set in **customRanking** attribute.
         *   The standard order is ["typo", "geo", "proximity", "attribute", "exact", "custom"]
         * - customRanking: (array of strings) lets you specify part of the ranking.
         *   The syntax of this condition is an array of strings containing attributes prefixed by asc (ascending order) or desc (descending order) operator.
         *   For example `"customRanking" => ["desc(population)", "asc(name)"]`
         * - queryType: Select how the query words are interpreted, it can be one of the following value:
         *   - prefixAll: all query words are interpreted as prefixes,
         *   - prefixLast: only the last word is interpreted as a prefix (default behavior),
         *   - prefixNone: no query word is interpreted as a prefix. This option is not recommended.
         * - highlightPreTag: (string) Specify the string that is inserted before the highlighted parts in the query result (default to "<em>").
         * - highlightPostTag: (string) Specify the string that is inserted after the highlighted parts in the query result (default to "</em>").
         * - optionalWords: (array of strings) Specify a list of words that should be considered as optional when found in the query.
         * @param callback (optional) the result callback with two arguments
         *  error: boolean set to true if the request had an error
         *  content: the server answer or the error message if a failure occured
         */
        setSettings: function(settings, callback) {
            this.as._request('PUT', '/1/indexes/' + encodeURIComponent(this.indexName) + '/settings', settings, callback);
        },
        /*
         * List all existing user keys associated to this index
         *
         * @param callback the result callback with two arguments
         *  error: boolean set to true if the request had an error
         *  content: the server answer with user keys list or error description if error is true.
         */
        listUserKeys: function(callback) {
            this.as._request('GET', '/1/indexes/' + encodeURIComponent(this.indexName) + '/keys', null, callback);
        },
        /*
         * Get ACL of a user key associated to this index
         *
         * @param callback the result callback with two arguments
         *  error: boolean set to true if the request had an error
         *  content: the server answer with user keys list or error description if error is true.
         */
        getUserKeyACL: function(key, callback) {
            this.as._request('GET', '/1/indexes/' + encodeURIComponent(this.indexName) + '/keys/' + key, null, callback);
        },
        /*
         * Delete an existing user key associated to this index
         *
         * @param callback the result callback with two arguments
         *  error: boolean set to true if the request had an error
         *  content: the server answer with user keys list or error description if error is true.
         */
        deleteUserKey: function(key, callback) {
            this.as._request('DELETE', '/1/indexes/' + encodeURIComponent(this.indexName) + '/keys/' + key, null, callback);
        },
        /*
         * Add an existing user key associated to this index
         *
         * @param acls the list of ACL for this key. Defined by an array of strings that
         * can contains the following values:
         *   - search: allow to search (https and http)
         *   - addObject: allows to add/update an object in the index (https only)
         *   - deleteObject : allows to delete an existing object (https only)
         *   - deleteIndex : allows to delete index content (https only)
         *   - settings : allows to get index settings (https only)
         *   - editSettings : allows to change index settings (https only)
         * @param callback the result callback with two arguments
         *  error: boolean set to true if the request had an error
         *  content: the server answer with user keys list or error description if error is true.
         */
        addUserKey: function(acls, callback) {
            var aclsObject = {};
            aclsObject.acl = acls;
            this.as._request('POST', '/1/indexes/' + encodeURIComponent(this.indexName) + '/keys', aclsObject, callback);
        },
        /*
         * Add an existing user key associated to this index
         *
         * @param acls the list of ACL for this key. Defined by an array of strings that
         * can contains the following values:
         *   - search: allow to search (https and http)
         *   - addObject: allows to add/update an object in the index (https only)
         *   - deleteObject : allows to delete an existing object (https only)
         *   - deleteIndex : allows to delete index content (https only)
         *   - settings : allows to get index settings (https only)
         *   - editSettings : allows to change index settings (https only)
         * @param validity the number of seconds after which the key will be automatically removed (0 means no time limit for this key)
         * @param maxQueriesPerIPPerHour Specify the maximum number of API calls allowed from an IP address per hour.  Defaults to 0 (no rate limit).
         * @param maxHitsPerQuery Specify the maximum number of hits this API key can retrieve in one call. Defaults to 0 (unlimited)
         * @param callback the result callback with two arguments
         *  error: boolean set to true if the request had an error
         *  content: the server answer with user keys list or error description if error is true.
         */
        addUserKeyWithValidity: function(acls, validity, maxQueriesPerIPPerHour, maxHitsPerQuery, callback) {
            var aclsObject = {};
            aclsObject.acl = acls;
            aclsObject.validity = validity;
            aclsObject.maxQueriesPerIPPerHour = maxQueriesPerIPPerHour;
            aclsObject.maxHitsPerQuery = maxHitsPerQuery;
            this.as._request('POST', '/1/indexes/' + encodeURIComponent(this.indexName) + '/keys', aclsObject, callback);
        },
        /*
         * Update an existing user key associated to this index
         *
         * @param acls the list of ACL for this key. Defined by an array of strings that
         * can contains the following values:
         *   - search: allow to search (https and http)
         *   - addObject: allows to add/update an object in the index (https only)
         *   - deleteObject : allows to delete an existing object (https only)
         *   - deleteIndex : allows to delete index content (https only)
         *   - settings : allows to get index settings (https only)
         *   - editSettings : allows to change index settings (https only)
         * @param callback the result callback with two arguments
         *  error: boolean set to true if the request had an error
         *  content: the server answer with user keys list or error description if error is true.
         */
        updateUserKey: function(key, acls, callback) {
            var aclsObject = {};
            aclsObject.acl = acls;
            this.as._request('PUT', '/1/indexes/' + encodeURIComponent(this.indexName) + '/keys/' + key, aclsObject, callback);
        },
        /*
         * Update an existing user key associated to this index
         *
         * @param acls the list of ACL for this key. Defined by an array of strings that
         * can contains the following values:
         *   - search: allow to search (https and http)
         *   - addObject: allows to add/update an object in the index (https only)
         *   - deleteObject : allows to delete an existing object (https only)
         *   - deleteIndex : allows to delete index content (https only)
         *   - settings : allows to get index settings (https only)
         *   - editSettings : allows to change index settings (https only)
         * @param validity the number of seconds after which the key will be automatically removed (0 means no time limit for this key)
         * @param maxQueriesPerIPPerHour Specify the maximum number of API calls allowed from an IP address per hour.  Defaults to 0 (no rate limit).
         * @param maxHitsPerQuery Specify the maximum number of hits this API key can retrieve in one call. Defaults to 0 (unlimited)
         * @param callback the result callback with two arguments
         *  error: boolean set to true if the request had an error
         *  content: the server answer with user keys list or error description if error is true.
         */
        updateUserKeyWithValidity: function(key, acls, validity, maxQueriesPerIPPerHour, maxHitsPerQuery, callback) {
            var aclsObject = {};
            aclsObject.acl = acls;
            aclsObject.validity = validity;
            aclsObject.maxQueriesPerIPPerHour = maxQueriesPerIPPerHour;
            aclsObject.maxHitsPerQuery = maxHitsPerQuery;
            this.as._request('PUT', '/1/indexes/' + encodeURIComponent(this.indexName) + '/keys/' + key, aclsObject, callback);
        },

        /*
         * Perform a search with disjunctive facets generating as many queries as number of disjunctive facets
         *
         * @param query the query
         * @param disjunctiveFacets the array of disjunctive facets
         * @param params a hash representing the regular query parameters
         * @param refinements a hash ("string" -> ["array", "of", "refined", "values"]) representing the current refinements
         *                    ex: { "my_facet1" => ["my_value1", ["my_value2"], "my_disjunctive_facet1" => ["my_value1", "my_value2"] }
         * @param callback the result callback with two arguments
         *  error: boolean set to true if the request had an error
         *  content: the server answer with user keys list or error description if error is true.
         */
        searchDisjunctiveFaceting: function(query, disjunctiveFacets, params, refinements, callback) {
            // extract disjunctive facets & associated refinements
            var disjunctiveRefinements = [];
            for (var r in refinements) {
                if (disjunctiveFacets.indexOf(r) > -1) {
                    disjunctiveRefinements.push(r);
                }
            }

            // build queries
            var queries = [];
            //// hits + regular facets query
            var filters = [];
            for (var k in refinements) {
                var r2 = _.map(refinements[k], function(v) { return k + ':' + v; });
                if (disjunctiveRefinements.indexOf(k) > -1) {
                    // disjucntive refinements are ORed
                    filters.push(r2);
                } else {
                    // regular refinements are ANDed
                    filters = filters.concat(r2);
                }
            }
            queries.push(_.extend({}, params, { indexName: this.indexName, query: query, facetFilters: filters }));

            //// one query per disjunctive facet (use all refinements but the current one + hitsPerPage=1 + single facet)
            for (var di = 0; di < disjunctiveFacets.length; ++di) {
                var filtersD = [];
                for (var k2 in refinements) {
                    if (k2 != disjunctiveFacets[di]) {
                        var rD = _.map(refinements[k2], function(v) { return k2 + ':' + v; });
                        if (disjunctiveRefinements.indexOf(k2) > -1) {
                            // disjucntive refinements are ORed
                            filtersD.push(rD);
                        } else {
                            // regular refinements are ANDed
                            filtersD = filtersD.concat(rD);
                        }
                    }
                }
                queries.push(_.extend({}, params, {
                    indexName: this.indexName,
                    query: query,
                    page: 0,
                    hitsPerPage: 1,
                    attributesToRetrieve: [],
                    attributesToHighlight: [],
                    attributesToSnippet: [],
                    facets: disjunctiveFacets[di],
                    facetFilters: filtersD
                }));
            }

            // aggregate answers
            this.as.multipleQueries(queries, 'indexName', function(error, content) {
                if (error) {
                    if (!_.isUndefined(callback)) {
                        callback(error, content);
                    }
                    return;
                }
                //// first answer stores the hits + regular facets
                var aggregatedAnswer = content.results[0];
                ////others store the disjunctive facets
                aggregatedAnswer.disjunctiveFacets = {};
                for (var i = 0; i < content.results.length; ++i) {
                    if (i === 0) {
                        continue;
                    }
                    aggregatedAnswer.processingTimeMS += content.results[i].processingTimeMS;
                    for (var facet in content.results[i].facets) {
                        //// add the facet to the disjunctive facet hash
                        aggregatedAnswer.disjunctiveFacets[facet] = content.results[i].facets[facet];
                        //// concatenate missing refinements
                        if (disjunctiveRefinements[facet]) {
                            for (var j = 0; k < disjunctiveRefinements[facet].length; ++j) {
                                var r = disjunctiveRefinements[facet][j];
                                if (_.isUndefined(aggregatedAnswer.disjunctiveFacets[facet][r])) {
                                    aggregatedAnswer.disjunctiveFacets[facet][r] = 0;
                                }
                            }
                        }
                    }
                }
                if (!_.isUndefined(callback)) {
                    callback(false, aggregatedAnswer);
                }
            });
        },

        ///
        /// Internal methods only after this line
        ///
        /*
         * Transform search param object in query string
         */
        _getSearchParams: function(args, params) {
            if (_.isUndefined(args) || args == null) {
                return params;
            }
            for (var key in args) {
                if (key != null && args.hasOwnProperty(key)) {
                    params += (params.length === 0) ? '?' : '&';
                    params += key + '=' + encodeURIComponent(Object.prototype.toString.call(args[key]) === '[object Array]' ? JSON.stringify(args[key]) : args[key]);
                }
            }
            return params;
        },
        _batch: function(objects, action, callback) {
            var postObj = {requests:[]};
            for (var i = 0; i < objects.length; ++i) {
                var request = { action: action,
                                body: objects[i] };
                if (!_.isUndefined(objects[i].objectID)) {
                    request.objectID = objects[i].objectID;
                }
                postObj.requests.push(request);
            }
            this.as._request('POST', '/1/indexes/' + encodeURIComponent(this.indexName) + '/batch', postObj, callback);
        },
        // internal attributes
        as: null,
        indexName: null,
        emptyConstructor: function() {}
};

module.exports = AlgoliaSearch;
