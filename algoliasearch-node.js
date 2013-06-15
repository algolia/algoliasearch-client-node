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
var https = require('https');
var Buffers = require('buffers');

/**
 * Algolia Search library initialization
 * @param applicationID the application ID you have in your admin interface
 * @param apiKey a valid API key for the service
 * @param hostsArray the list of hosts that you have received for the service
 * @param httpsAgent (optional) an agent to pass to https service (can be agentkeepalive module to minimize latency)
 */
var AlgoliaSearch = function(applicationID, apiKey, hostsArray, httpsAgent) {
    this.applicationID = applicationID;
    this.apiKey = apiKey;
    // Add hosts in random order
    for (var i = 0; i < hostsArray.length; ++i) {
        if (Math.random() > 0.5)
            this.hosts.reverse();
        this.hosts.push(hostsArray[i]);
    }
    if (Math.random() > 0.5)
        this.hosts.reverse();
    this.httpsAgent = _.isUndefined(httpsAgent) ? null : httpsAgent;
};

AlgoliaSearch.prototype = {
    /*
     * Delete an index
     *
     * @param indexName the name of index to delete
     * @param callback the result callback with two arguments
     *  success: boolean set to true if the request was successfull
     *  content: the server answer that contains the task ID
     */
    deleteIndex: function(indexName, callback) {
        var indexObj = this;
        this._jsonRequest({ method: 'DELETE',
                            url: '/1/indexes/' + indexName,
                            callback: function(success, res, body) {
            if (!_.isUndefined(callback))
                callback(success, body);
        }});
    },

    /*
     * List all existing indexes
     *
     * @param callback the result callback with two arguments
     *  success: boolean set to true if the request was successfull
     *  content: the server answer with index list or error description if success is false.
     */
    listIndexes: function(callback) {
        var indexObj = this;
        this._jsonRequest({ method: 'GET',
                            url: '/1/indexes/',
                            callback: function(success, res, body) {
            if (!_.isUndefined(callback))
                callback(success, body);
        }});
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
     *  success: boolean set to true if the request was successfull
     *  content: the server answer with user keys list or error description if success is false.
     */
    listUserKeys: function(callback) {
        var indexObj = this;
        this._jsonRequest({ method: 'GET',
                            url: '/1/keys',
                            callback: function(success, res, body) {
            if (!_.isUndefined(callback))
                callback(success, body);
        }});
    },
    /*
     * Get ACL of a user key
     *
     * @param callback the result callback with two arguments
     *  success: boolean set to true if the request was successfull
     *  content: the server answer with user keys list or error description if success is false.
     */
    getUserKeyACL: function(key, callback) {
        var indexObj = this;
        this._jsonRequest({ method: 'GET',
                            url: '/1/keys/' + key,
                            callback: function(success, res, body) {
            if (!_.isUndefined(callback))
                callback(success, body);
        }});
    },
    /*
     * Delete an existing user key
     *
     * @param callback the result callback with two arguments
     *  success: boolean set to true if the request was successfull
     *  content: the server answer with user keys list or error description if success is false.
     */
    deleteUserKey: function(key, callback) {
        var indexObj = this;
        this._jsonRequest({ method: 'DELETE',
                            url: '/1/keys/' + key,
                            callback: function(success, res, body) {
            if (!_.isUndefined(callback))
                callback(success, body);
        }});
    },
    /*
     * Add an existing user key
     *
     * @param acls the list of ACL for this key. Defined by an array of strings that
     * can contains the following values:
     *   - search: allow to search (https and http)
     *   - addObject: allows to add a new object in the index (https only)
     *   - updateObject : allows to change content of an existing object (https only)
     *   - deleteObject : allows to delete an existing object (https only)
     *   - deleteIndex : allows to delete index content (https only)
     *   - settings : allows to get index settings (https only)
     *   - editSettings : allows to change index settings (https only)
     * @param callback the result callback with two arguments
     *  success: boolean set to true if the request was successfull
     *  content: the server answer with user keys list or error description if success is false.
     */
    addUserKey: function(acls, callback) {
        var indexObj = this;
        var aclsObject = new Object();
        aclsObject.acl = acls;
        this._jsonRequest({ method: 'POST',
                            url: '/1/keys',
                            body: aclsObject,
                            callback: function(success, res, body) {
            if (!_.isUndefined(callback))
                callback(success, body);
        }});
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
     * Wrapper that try all hosts to maximize the quality of service
     */
    _jsonRequest: function(opts) {
        var self = this;
        var callback = opts.callback;

        var impl = function(position) {
            var idx = 0;
            if (!_.isUndefined(position))
                idx = position;
            if (!Array.isArray(self.hosts) || self.hosts.length <= idx) {
                callback(false, null, { message: "Cannot contact server"});
                return;
            }
            opts.callback = function(success, res, body) {
                if (!success && (idx + 1) < self.hosts.length) {
                    impl(idx + 1);
                } else {
                    callback(success, res, body);
                }
            };
            opts.hostname = self.hosts[idx];
            self._jsonRequestByHost(opts)
        };
        impl();
    },

    _jsonRequestByHost: function(opts) {
        var body = null;
        if (!_.isUndefined(opts.body)) {
            body = JSON.stringify(opts.body);
        }
        var reqOpts = {
          method: opts.method,
          hostname: opts.hostname,
          port: 443,
          path: opts.url,
          headers: {
            'X-Algolia-Application-Id': this.applicationID,
            'X-Algolia-API-Key': this.apiKey,
            'Connection':'keep-alive',
            'Content-Length': 0
          }
        };
        if (opts.hostname.indexOf(':') !== -1) {
            var n = opts.hostname.split(":")
            reqOpts.hostname = n[0];
            reqOpts.port = n[1];
        }
        if (body !== null) {
            reqOpts.headers = _.extend(reqOpts.headers, { 'Content-Type': 'application/json',
                                                          'Content-Length': new Buffer(body, 'utf8').length });
        }
        if (this.httpsAgent !== null) {
            reqOpts.agent = this.httpsAgent;
        }
        var req = https.request(reqOpts, function(res) {
            res.setEncoding('utf8');

            var success = (res.statusCode === 200 || res.statusCode === 201),
                chunks = new Buffers();

            res.on('data', function(chunk) {
                chunks.push(chunk);
            });

            res.on('end', function() {
                var body = chunks.toBuffer();

                if (res && res.headers['content-type'].toLowerCase().indexOf('application/json') >= 0) {
                    body = JSON.parse(body);

                }
                opts.callback(success, res, body);
            });
        });
        req.on('error', function(e) {
            opts.callback(false, null, { 'message': e} );
        });

        if (body !== null) {
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
         * @param callback (optional) the result callback with two arguments:
         *  success: boolean set to true if the request was successfull
         *  content: the server answer that contains 3 elements: createAt, taskId and objectID
         * @param objectID (optional) an objectID you want to attribute to this object
         * (if the attribute already exist the old object will be overwrite)
         */
        addObject: function(content, callback, objectID) {
            var indexObj = this;
            if (_.isUndefined(objectID)) {
                this.as._jsonRequest({ method: 'POST',
                                       url: '/1/indexes/' + encodeURIComponent(indexObj.indexName),
                                       body: content,
                                       callback: function(success, res, body) {
                    if (!_.isUndefined(callback))
                        callback(success, body);
                }});
            } else {
                this.as._jsonRequest({ method: 'PUT',
                                       url: '/1/indexes/' + encodeURIComponent(indexObj.indexName) + "/" + objectID,
                                       body: content,
                                       callback: function(success, res, body) {
                    if (!_.isUndefined(callback))
                        callback(success, body);
                }});
            }

        },
        /*
         * Add several objects
         *
         * @param objects contains an array of objects to add
         * @param callback (optional) the result callback with two arguments:
         *  success: boolean set to true if the request was successfull
         *  content: the server answer that updateAt and taskID
         */
        addObjects: function(objects, callback) {
            var indexObj = this;
            var postObj = {requests:[]};
            for (var i = 0; i < objects.length; ++i) {
                var request = { action: 'addObject',
                                body: objects[i] };
                postObj.requests.push(request);
            }
            this.as._jsonRequest({ method: 'POST',
                                   url: '/1/indexes/' + encodeURIComponent(indexObj.indexName) + "/batch",
                                   body: postObj,
                                   callback: function(success, res, body) {
                if (!_.isUndefined(callback))
                    callback(success, body);
            }});
        },
        /*
         * Get an object from this index
         *
         * @param objectID the unique identifier of the object to retrieve
         * @param callback (optional) the result callback with two arguments
         *  success: boolean set to true if the request was successfull
         *  content: the object to retrieve or the error message if a failure occured
         * @param classToDerive (optional) if set, hits will be an instance of this class
         * @param attributes (optional) if set, contains the array of attribute names to retrieve
         */
        getObject: function(objectID, callback, attributes, classToDerive) {
            var indexObj = this;
            var params = "";
            if (!_.isUndefined(attributes)) {
                params = "?attributes=";
                for (var i = 0; i < attributes.length; ++i) {
                    if (i != 0)
                        params += ',';
                    params += attributes[i];
                }
            }
            this.as._jsonRequest({ method: 'GET',
                                   url: '/1/indexes/' + encodeURIComponent(indexObj.indexName) + "/" + objectID + params,
                                   callback: function(success, res, body) {
                if (!_.isUndefined(classToDerive)) {
                    var obj = new classToDerive();
                    _.extend(obj, body);
                    body = obj;
                }
                if (!_.isUndefined(callback))
                    callback(success, body);
            }});
        },

        /*
         * Update partially an object (only update attributes passed in argument)
         *
         * @param partialObject contains the javascript attributes to override, the
         *  object must contains an objectID attribute
         * @param callback (optional) the result callback with two arguments:
         *  success: boolean set to true if the request was successfull
         *  content: the server answer that contains 3 elements: createAt, taskId and objectID
         */
        partialUpdateObject: function(partialObject, callback) {
            var indexObj = this;
            this.as._jsonRequest({ method: 'POST',
                                   url: '/1/indexes/' + encodeURIComponent(indexObj.indexName) + "/" + encodeURIComponent(partialObject.objectID) + "/partial",
                                   body: partialObject,
                                   callback: function(success, res, body) {
                if (!_.isUndefined(callback))
                    callback(success, body);
            }});
        },

        /*
         * Override the content of object
         *
         * @param object contains the javascript object to save, the object must contains an objectID attribute
         * @param callback (optional) the result callback with two arguments:
         *  success: boolean set to true if the request was successfull
         *  content: the server answer that updateAt and taskID
         */
        saveObject: function(object, callback) {
            var indexObj = this;
            this.as._jsonRequest({ method: 'PUT',
                                   url: '/1/indexes/' + encodeURIComponent(indexObj.indexName) + "/" + encodeURIComponent(object.objectID),
                                   body: object,
                                   callback: function(success, res, body) {
                if (!_.isUndefined(callback))
                    callback(success, body);
            }});
        },
        /*
         * Override the content of several objects
         *
         * @param objects contains an array of objects to update (each object must contains a objectID attribute)
         * @param callback (optional) the result callback with two arguments:
         *  success: boolean set to true if the request was successfull
         *  content: the server answer that updateAt and taskID
         */
        saveObjects: function(objects, callback) {
            var indexObj = this;
            var postObj = {requests:[]};
            for (var i = 0; i < objects.length; ++i) {
                var request = { action: 'updateObject',
                                objectID: encodeURIComponent(objects[i].objectID),
                                body: objects[i] };
                postObj.requests.push(request);
            }
            this.as._jsonRequest({ method: 'POST',
                                   url: '/1/indexes/' + encodeURIComponent(indexObj.indexName) + "/batch",
                                   body: postObj,
                                   callback: function(success, res, body) {
                if (!_.isUndefined(callback))
                    callback(success, body);
            }});
        },
        /*
         * Delete an object from the index
         *
         * @param objectID the unique identifier of object to delete
         * @param callback (optional) the result callback with two arguments:
         *  success: boolean set to true if the request was successfull
         *  content: the server answer that contains 3 elements: createAt, taskId and objectID
         */
        deleteObject: function(objectID, callback) {
            var indexObj = this;
            this.as._jsonRequest({ method: 'DELETE',
                                   url: '/1/indexes/' + encodeURIComponent(indexObj.indexName) + "/" + objectID,
                                   callback: function(success, res, body) {
                if (!_.isUndefined(callback))
                    callback(success, body);
            }});
        },
        /*
         * Search inside the index
         *
         * @param query the full text query
         * @param callback the result callback with two arguments:
         *  success: boolean set to true if the request was successfull
         *  content: the server answer that contains the list of results
         * @param classToDerive (optional) if set, hits will be an instance of this class
         * @param args (optional) if set, contains an object with query parameters:
         *  - attributes: a string that contains attribute names to retrieve separated by a comma.
         *    By default all attributes are retrieved.
         *  - attributesToHighlight: a string that contains attribute names to highlight separated by a comma.
         *    By default indexed attributes are highlighted.
         *  - minWordSizeForApprox1: the minimum number of characters to accept one typo.
         *     Defaults to 3.
         *  - minWordSizeForApprox2: the minimum number of characters to accept two typos.
         *     Defaults to 7.
         *  - getRankingInfo: if set, the result hits will contain ranking information in
         *     _rankingInfo attribute
         *  - page: (pagination parameter) page to retrieve (zero base). Defaults to 0.
         *  - hitsPerPage: (pagination parameter) number of hits per page. Defaults to 10.
         *  - aroundLatLng let you search for entries around a given latitude/longitude (two float separated
         *    by a ',' for example aroundLatLng=47.316669,5.016670).
         *    You can specify the maximum distance in meters with aroundRadius parameter (in meters).
         *    At indexing, geoloc of an object should be set with _geoloc attribute containing lat and lng attributes (for example {"_geoloc":{"lat":48.853409, "lng":2.348800}})
         *  - insideBoundingBox let you search entries inside a given area defined by the two extreme points of
         *    a rectangle (defined by 4 floats: p1Lat,p1Lng,p2Lat, p2Lng.
         *    For example insideBoundingBox=47.3165,4.9665,47.3424,5.0201).
         *    At indexing, geoloc of an object should be set with _geoloc attribute containing lat and lng attributes (for example {"_geoloc":{"lat":48.853409, "lng":2.348800}})
         *  - tags filter the query by a set of tags. You can AND tags by separating them by commas. To OR tags, you must add parentheses. For example, tags=tag1,(tag2,tag3) means tag1 AND (tag2 OR tag3).
         *    At indexing, tags should be added in the _tags attribute of objects (for example {"_tags":["tag1","tag2"]} )
         */
        search: function(query, callback, args, classToDerive) {
            var indexObj = this;
            var params = "?query=" + query;
            if (!_.isUndefined(args)) {
                params = this._getSearchParams(args, params);
            }
            this.as._jsonRequest({ method: 'GET',
                                   url: '/1/indexes/' + encodeURIComponent(indexObj.indexName) + params,
                                   callback: function(success, res, body) {
                if (success && !_.isUndefined(classToDerive)) {
                    for (var i in body.hits) {
                        var obj = new classToDerive();
                        _.extend(obj, body.hits[i]);
                        body.hits[i] = obj;
                    }
                }
                if (!_.isUndefined(callback)) {
                    callback(success, body);
                }
            }});
        },

        /*
         * Wait the publication of a task on the server.
         * All server task are asynchronous and you can check with this method that the task is published.
         *
         * @param taskID the id of the task returned by server
         * @param callback the result callback with with two arguments:
         *  success: boolean set to true if the request was successfull
         *  content: the server answer that contains the list of results
         */
        waitTask: function(taskID, callback) {
            var indexObj = this;
            this.as._jsonRequest({ method: 'GET',
                                   url: '/1/indexes/' + encodeURIComponent(indexObj.indexName) + "/task/" + taskID,
                                   callback: function(success, res, body) {
                if (success && body.status === "published") {
                    callback(true, body);
                } else if (success && body.pendingTask) {
                    return indexObj.waitTask(taskID, callback);
                } else {
                    callback(false, body);
                }
            }});
        },

        /*
         * Get settings of this index
         *
         * @param callback (optional) the result callback with two arguments
         *  success: boolean set to true if the request was successfull
         *  content: the settings object or the error message if a failure occured
         */
        getSettings: function(callback) {
            var indexObj = this;
            this.as._jsonRequest({ method: 'GET',
                                   url: '/1/indexes/' + encodeURIComponent(indexObj.indexName) + "/settings",
                                   callback: function(success, res, body) {
                if (!_.isUndefined(callback))
                    callback(success, body);
            }});
        },

        /*
         * Set settings for this index
         *
         * @param settigns the settings object that can contains :
         *  - minWordSizeForApprox1 (integer) the minimum number of characters to accept one typo (default = 3)
         *  - minWordSizeForApprox2: (integer) the minimum number of characters to accept two typos (default = 7)
         *  - hitsPerPage: (integer) the number of hits per page (default = 10)
         *  - attributesToRetrieve: (array of strings) default list of attributes to retrieve for objects
         *  - attributesToHighlight: (array of strings) default list of attributes to highlight
         *  - attributesToIndex: (array of strings) the list of fields you want to index.
         *    By default all textual attributes of your objects are indexed, but you should update it to get optimal
         *    results. This parameter has two important uses:
         *       - Limit the attributes to index.
         *         For example if you store a binary image in base64, you want to store it in the index but you
         *         don't want to use the base64 string for search.
         *       - Control part of the ranking (see the ranking parameter for full explanation).
         *         Matches in attributes at the beginning of the list will be considered more important than matches
         *         in attributes further down the list.
         *  - ranking: (array of strings) controls the way results are sorted.
         *     We have three available criteria:
         *       - typo (sort according to number of typos),
         *       - position (sort according to the matching attribute),
         *       - custom which is user defined
         *     (the standard order is ["typo", "position", "custom"])
         *  - customRanking: (array of strings) lets you specify part of the ranking.
         *    The syntax of this condition is an array of strings containing attributes prefixed
         *    by asc (ascending order) or desc (descending order) operator.
         * @param callback (optional) the result callback with two arguments
         *  success: boolean set to true if the request was successfull
         *  content: the server answer or the error message if a failure occured
         */
        setSettings: function(settings, callback) {
            var indexObj = this;
            this.as._jsonRequest({ method: 'PUT',
                                   url: '/1/indexes/' + indexObj.indexName + "/settings",
                                   body: settings,
                                   callback: function(success, res, body) {
                if (!_.isUndefined(callback))
                    callback(success, body);
            }});
        },


        ///
        /// Internal methods only after this line
        ///
        /*
         * Transform search param object in query string
         *
         * Attributes are:
         *  - attributes: an array of object attribute names to retrieve
         *     (if not set all attributes are retrieve)
         *  - attributesToHighlight: an array of object attribute names to highlight
         *     (if not set indexed attributes are highlighted)
         *  - minWordSizeForApprox1: the minimum number of characters to accept one typo.
         *     Defaults to 3.
         *  - minWordSizeForApprox2: the minimum number of characters to accept two typos.
         *     Defaults to 7.
         *  - getRankingInfo: if set, the result hits will contain ranking information in
         *     _rankingInfo attribute
         *  - page: (pagination parameter) page to retrieve (zero base). Defaults to 0.
         *  - hitsPerPage: (pagination parameter) number of hits per page. Defaults to 10.
         */
        _getSearchParams: function(args, params) {
            if (_.isUndefined(args) || args == null) {
                return params;
            }
            for (var key in args) {
                if (key != null && args.hasOwnProperty(key)) {
                    params += (params.length == 0) ? '?' : '&';
                    params += key + "=" + encodeURIComponent(args[key]);
                }
            }
            return params;
        },

        // internal attributes
        as: null,
        indexName: null,
        emptyConstructor: function() {}
};

module.exports = AlgoliaSearch;
