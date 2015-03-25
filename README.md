# Algolia Search API Client for Node.js



[Algolia Search](http://www.algolia.com) is a hosted full-text, numerical, and faceted search engine capable of delivering realtime results from the first keystroke.

Our Node.js client lets you easily use the [Algolia Search API](https://www.algolia.com/doc/rest_api) from your backend. It wraps the [Algolia Search REST API](http://www.algolia.com/doc/rest_api).


[![Build Status](https://travis-ci.org/algolia/algoliasearch-client-node.svg?branch=master)](https://travis-ci.org/algolia/algoliasearch-client-node) [![NPM version](https://badge.fury.io/js/algolia-search.svg)](http://badge.fury.io/js/algolia-search) [![Code Climate](https://codeclimate.com/github/algolia/algoliasearch-client-node.svg)](https://codeclimate.com/github/algolia/algoliasearch-client-node) [![Coverage Status](https://coveralls.io/repos/algolia/algoliasearch-client-node/badge.png?branch=master)](https://coveralls.io/r/algolia/algoliasearch-client-node?branch=master)




Table of Contents
=================
**Getting Started**

1. [Setup](#setup)
1. [Setup with parse](#setup-with-parse)
1. [Quick Start](#quick-start)
1. [Callback convention](#callback-convention)
1. [Online documentation](#documentation)
1. [Tutorials](#tutorials)

**Commands Reference**

1. [Add a new object](#add-a-new-object-in-the-index)
1. [Update an object](#update-an-existing-object-in-the-index)
1. [Search](#search)
1. [Get an object](#get-an-object)
1. [Delete an object](#delete-an-object)
1. [Delete by query](#delete-by-query)
1. [Index settings](#index-settings)
1. [List indices](#list-indices)
1. [Delete an index](#delete-an-index)
1. [Clear an index](#clear-an-index)
1. [Wait indexing](#wait-indexing)
1. [Batch writes](#batch-writes)
1. [Security / User API Keys](#security--user-api-keys)
1. [Copy or rename an index](#copy-or-rename-an-index)
1. [Backup / Retrieve all index content](#backup--retrieve-all-index-content)
1. [Logs](#logs)





Setup
-------------
To setup your project, follow these steps:




 Install algolia-search by running 
```
npm install algolia-search
```
 Initialize the client with your ApplicationID and API-Key. You can find all of them on [your Algolia account](http://www.algolia.com/users/edit).

**Initialization without keep-alive**
```javascript
var Algolia = require('algolia-search');
var client = new Algolia('YourApplicationID', 'YourAPIKey');
```

**Initialization with keep-alive enabled**
```javascript
var HttpsAgent = require('agentkeepalive').HttpsAgent;
var Algolia = require('algolia-search');

var keepaliveAgent = new HttpsAgent({
    maxSockets: 1,
    maxKeepAliveRequests: 0, // no limit on max requests per keepalive socket
    maxKeepAliveTime: 30000 // keepalive for 30 seconds
});

var client = new Algolia('YourApplicationID', 'YourAPIKey', keepaliveAgent);
```
Note: if you are using keep-alive in a command-line tool, your program will exit after the keep-alive timeout is expired. You should use a connection without keep-alive in a command-line tool.

**Initialization with an HTTP proxy**

You must replace `localhost` and `8080`by your proxy host and port:
```javascript
var tunnel = require('tunnel');
var Algolia = require('algolia-search');

var tunnelingAgent = tunnel.httpsOverHttp({
  rejectUnauthorized: false,
  proxy: {
    host: 'localhost',
    port: 8080
  }
});
var client = new Algolia('YourApplicationID', 'YourAPIKey', tunnelingAgent);
```






Setup with Parse
--------------------
To setup your project with Parse, follow these steps:


 Add Algolia Search by copying `src/algoliasearch-node.js` into your cloud directory. 
```
cp $PATH_TO/src/algoliasearch-node.js $PATH_TO_MYPROJECT/cloud/
```
 Initialize the client with your Application ID and API Key. You can find them on [your Algolia account](http://www.algolia.com/users/edit).

```javascript
var Algolia = require('cloud/algoliasearch-node');
var client = new Algolia('YourApplicationID', 'YourAPIKey');
```




Quick Start
-------------

In 30 seconds, this quick start tutorial will show you how to index and search objects.

Without any prior configuration, you can start indexing [500 contacts](https://github.com/algolia/algoliasearch-client-csharp/blob/master/contacts.json) in the ```contacts``` index using the following code:
```javascript
var index = client.initIndex('contacts');
var fileJSON = require('./contacts.json');
index.addObjects(fileJSON, function(error, content) {
  if (error) console.error("ERROR: %s", content.message);
});
```

You can now search for contacts using firstname, lastname, company, etc. (even with typos):
```javascript
// search by firstname
index.search('jimmie', function(error, content) {
  console.log(content.hits);
});
// search a firstname with typo
index.search('jimie', function(error, content) {
  console.log(content.hits);
});
// search for a company
index.search('california paint', function(error, content) {
  console.log(content.hits);
});
// search for a firstname & company
index.search('jimmie paint', function(error, content) {
  console.log(content.hits);
});
```

Settings can be customized to tune the search behavior. For example, you can add a custom sort by number of followers to the already great built-in relevance:
```javascript
index.setSettings({'customRanking': ['desc(followers)']});
```

You can also configure the list of attributes you want to index by order of importance (first = most important):
```javascript
index.setSettings({'attributesToIndex': ['lastname', 'firstname', 'company', 
                                         'email', 'city', 'address']});
```

Since the engine is designed to suggest results as you type, you'll generally search by prefix. In this case the order of attributes is very important to decide which hit is the best:
```javascript
index.search('or', function(error, content) {
  console.log(content.hits);
});
index.search('jim', function(error, content) {
  console.log(content.hits);
});
```


**Notes:** If you are building a web application, you may be more interested in using our [JavaScript client](https://github.com/algolia/algoliasearch-client-js) to perform queries. It brings two benefits:
  * Your users get a better response time by not going through your servers
  * It will offload unnecessary tasks from your servers

```html
<script src="//cdn.jsdelivr.net/algoliasearch/3/algoliasearch.min.js"></script>
<script>
var client = algoliasearch('ApplicationID', 'Search-Only-API-Key');
var index = client.initIndex('indexName');

// perform query "jim"
index.search('jim', searchCallback);

// the last optional argument can be used to add search parameters
index.search(
  'jim', {
    hitsPerPage: 5,
    facets: '*',
    maxValuesPerFacet: 10
  },
  searchCallback
);

function searchCallback(err, content) {
  if (err) {
    console.error(err);
    return;
  }

  console.log(content);
}
</script>
```





Callback convention
-------------

All API calls will return the result in a callback that takes two arguments:

 1. **error**: a boolean that is set to true when an error occurs.
 2. **content**: the object containing the answer (if an error was found, you can retrieve the error message in `content.message`)




Documentation
================

Check our [online documentation](http://www.algolia.com/doc/guides/node):
 * [Initial Import](http://www.algolia.com/doc/guides/node#InitialImport)
 * [Ranking &amp; Relevance](http://www.algolia.com/doc/guides/node#RankingRelevance)
 * [Indexing](http://www.algolia.com/doc/guides/node#Indexing)
 * [Search](http://www.algolia.com/doc/guides/node#Search)
 * [Sorting](http://www.algolia.com/doc/guides/node#Sorting)
 * [Filtering](http://www.algolia.com/doc/guides/node#Filtering)
 * [Faceting](http://www.algolia.com/doc/guides/node#Faceting)
 * [Geo-Search](http://www.algolia.com/doc/guides/node#Geo-Search)
 * [Security](http://www.algolia.com/doc/guides/node#Security)
 * [REST API](http://www.algolia.com/doc/rest)


Tutorials
================

Check out our [tutorials](http://www.algolia.com/doc/tutorials):
 * [Search bar with autocomplete menu](http://www.algolia.com/doc/tutorials/auto-complete)
 * [Search bar with multi category autocomplete menu](http://www.algolia.com/doc/tutorials/multi-auto-complete)
 * [Instant search result pages](http://www.algolia.com/doc/tutorials/instant-search)



Commands Reference
==================





Add a new object to the Index
-------------

Each entry in an index has a unique identifier called `objectID`. There are two ways to add en entry to the index:

 1. Using automatic `objectID` assignment. You will be able to access it in the answer.
 2. Supplying your own `objectID`.

You don't need to explicitly create an index, it will be automatically created the first time you add an object.
Objects are schema less so you don't need any configuration to start indexing. If you wish to configure things, the settings section provides details about advanced settings.

Example with automatic `objectID` assignment:

```javascript
index.addObject({'firstname': 'Jimmie', 
                 'lastname': 'Barninger'}, function(error, content) {
  console.log('objectID=' + content.objectID);
});
```

Example with manual `objectID` assignment:

```javascript
index.addObject({'firstname': 'Jimmie', 
                 'lastname': 'Barninger'}, function(error, content) {
  console.log('objectID=' + content.objectID);
}, 'myID');
```

Update an existing object in the Index
-------------

You have three options when updating an existing object:

 1. Replace all its attributes.
 2. Replace only some attributes.
 3. Apply an operation to some attributes.

Example on how to replace all attributes of an existing object:

```javascript
index.saveObject({'firstname': 'Jimmie', 
                  'lastname': 'Barninger',
                  'city': 'New York',
                  'objectID': 'myID'});
```

You have many ways to update an object's attributes:

 1. Set the attribute value
 2. Add an element to an array
 3. Remove an element from an array
 4. Add an element to an array if it doesn't exist
 5. Increment an attribute
 6. Decrement an attribute

Example to update only the city attribute of an existing object:

```javascript
index.partialUpdateObject({'city': 'San Francisco',
                           'objectID': 'myID'});
```

Example to add a tag:

```javascript
index.partialUpdateObject({'_tags': {'value': 'MyTag', '_operation':'Add'},
                           'objectID': 'myID'});
```

Example to remove a tag:

```javascript
index.partialUpdateObject({'_tags': {'value': 'MyTag', '_operation':'Remove'},
                           'objectID': 'myID'});
```

Example to add a tag if it doesn't exist:

```javascript
index.partialUpdateObject({'_tags': {'value': 'MyTag', '_operation':'AddUnique'},
                           'objectID': 'myID'});
```

Example to increment a numeric value:

```javascript
index.partialUpdateObject({'price': {'value': 42, '_operation':'Increment'},
                           'objectID': 'myID'});
```

Example to decrement a numeric value:

```javascript
index.partialUpdateObject({'price': {'value': 42, '_operation':'Decrement'},
                           'objectID': 'myID'});
```



Search
-------------

**Notes:** If you are building a web application, you may be more interested in using our [JavaScript client](https://github.com/algolia/algoliasearch-client-js) to perform queries. It brings two benefits:
  * Your users get a better response time by not going through your servers
  * It will offload unnecessary tasks from your servers.


To perform a search, you only need to initialize the index and perform a call to the search function.

You can use the following optional arguments:

### Query Parameters

#### Full Text Search Parameters

 * **query**: (string) The instant search query string. All words of the query are interpreted as prefixes (for example "John Mc" will match "John Mccamey" and "Johnathan Mccamey"). If no query parameter is set all objects are retrieved.
 * **queryType**: Selects how the query words are interpreted. It can be one of the following values:
  * **prefixAll**: All query words are interpreted as prefixes.
  * **prefixLast**: Only the last word is interpreted as a prefix (default behavior).
  * **prefixNone**: No query word is interpreted as a prefix. This option is not recommended.
 * **removeWordsIfNoResults**: This option is used to select a strategy in order to avoid having an empty result page. There are three different options:
  * **lastWords**: When a query does not return any results, the last word will be added as optional. The process is repeated with n-1 word, n-2 word, ... until there are results.
  * **firstWords**: When a query does not return any results, the first word will be added as optional. The process is repeated with second word, third word, ... until there are results.
  * **allOptional**: When a query does not return any results, a second trial will be made with all words as optional. This is equivalent to transforming the AND operand between query terms to an OR operand. 
  * **none**: No specific processing is done when a query does not return any results (default behavior).
 * **minWordSizefor1Typo**: The minimum number of characters in a query word to accept one typo in this word.<br/>Defaults to 4.
 * **minWordSizefor2Typos**: The minimum number of characters in a query word to accept two typos in this word.<br/>Defaults to 8.
 * **allowTyposOnNumericTokens**: If set to false, it disables typo tolerance on numeric tokens (numbers). Defaults to false.
 * **typoTolerance**: This option allows you to control the number of typos in the result set:
  * **true**: The typo tolerance is enabled and all matching hits are retrieved (default behavior).
  * **false**: The typo tolerance is disabled. For example, if one result matches without typos, then all results with typos will be hidden.
  * **min**: Only keep results with the minimum number of typos.
  * **strict**: Hits matching with 2 typos are not retrieved if there are some matching without typos. This option is useful if you want to avoid false positives as much as possible.
 * **allowTyposOnNumericTokens**: If set to false, disables typo tolerance on numeric tokens (numbers). Defaults to true.
 * **ignorePlural**: If set to true, plural won't be considered as a typo. For example, car and cars will be considered as equals. Defaults to false.
 * **restrictSearchableAttributes** List of attributes you want to use for textual search (must be a subset of the `attributesToIndex` index setting). Attributes are separated with a comma such as `"name,address"`. You can also use JSON string array encoding such as `encodeURIComponent("[\"name\",\"address\"]")`. By default, all attributes specified in `attributesToIndex` settings are used to search.
 * **advancedSyntax**: Enables the advanced query syntax. Defaults to 0 (false).
    * **Phrase query**: A phrase query defines a particular sequence of terms. A phrase query is built by Algolia's query parser for words surrounded by `"`. For example, `"search engine"` will retrieve records having `search` next to `engine` only. Typo tolerance is _disabled_ on phrase queries.
    * **Prohibit operator**: The prohibit operator excludes records that contain the term after the `-` symbol. For example, `search -engine` will retrieve records containing `search` but not `engine`.
 * **analytics**: If set to false, this query will not be taken into account in the analytics feature. Defaults to true.
 * **synonyms**: If set to false, this query will not use synonyms defined in the configuration. Defaults to true.
 * **replaceSynonymsInHighlight**: If set to false, words matched via synonym expansion will not be replaced by the matched synonym in the highlight results. Defaults to true.
 * **optionalWords**: A string that contains the comma separated list of words that should be considered as optional when found in the query.

#### Pagination Parameters

 * **page**: (integer) Pagination parameter used to select the page to retrieve.<br/>Page is zero based and defaults to 0. Thus, to retrieve the 10th page you need to set `page=9`.
 * **hitsPerPage**: (integer) Pagination parameter used to select the number of hits per page. Defaults to 20.

#### Geo-search Parameters

 * **aroundLatLng**: Search for entries around a given latitude/longitude (specified as two floats separated by a comma).<br/>For example, `aroundLatLng=47.316669,5.016670`.<br/>You can specify the maximum distance in meters with the **aroundRadius** parameter and the precision for ranking with **aroundPrecision**. For example, if you set aroundPrecision=100, two objects that are a distance of less than 100 meters will be considered as identical for the "geo" ranking parameter).<br/>At indexing, you should specify the geo location of an object with the `_geoloc` attribute in the form `{"_geoloc":{"lat":48.853409, "lng":2.348800}}`.

 * **aroundLatLngViaIP**: Search for entries around a given latitude/longitude automatically computed from user IP address.<br/>For example, `aroundLatLng=47.316669,5.016670`.<br/>You can specify the maximum distance in meters with the **aroundRadius** parameter and the precision for ranking with **aroundPrecision**. For example, if you set aroundPrecision=100, two objects that are a distance of less than 100 meters will be considered as identical for the "geo" ranking parameter.<br/>At indexing, you should specify the geo location of an object with the `_geoloc` attribute in the form `{"_geoloc":{"lat":48.853409, "lng":2.348800}}`.


 * **insideBoundingBox**: Search entries inside a given area defined by the two extreme points of a rectangle (defined by 4 floats: p1Lat,p1Lng,p2Lat,p2Lng).<br/>For example, `insideBoundingBox=47.3165,4.9665,47.3424,5.0201`).<br/>At indexing, you should specify the geo location of an object with the _geoloc attribute in the form `{"_geoloc":{"lat":48.853409, "lng":2.348800}}`.

#### Parameters to Control Results Content

 * **attributesToRetrieve**: A string that contains the list of object attributes you want to retrieve in order to minimize the answer size.<br/> Attributes are separated with a comma (for example `"name,address"`). You can also use a string array encoding (for example `["name","address"]` ). By default, all attributes are retrieved. You can also use `*` to retrieve all values when an **attributesToRetrieve** setting is specified for your index.
 * **attributesToHighlight**: A string that contains the list of attributes you want to highlight according to the query. Attributes are separated by commas. You can also use a string array encoding (for example `["name","address"]`). If an attribute has no match for the query, the raw value is returned. By default all indexed text attributes are highlighted. You can use `*` if you want to highlight all textual attributes. Numerical attributes are not highlighted. A matchLevel is returned for each highlighted attribute and can contain:
  * **full**: If all the query terms were found in the attribute.
  * **partial**: If only some of the query terms were found.
  * **none**: If none of the query terms were found.
 * **attributesToSnippet**: A string that contains the list of attributes to snippet alongside the number of words to return (syntax is `attributeName:nbWords`). Attributes are separated by commas (Example: `attributesToSnippet=name:10,content:10`). <br/>You can also use a string array encoding (Example: `attributesToSnippet: ["name:10","content:10"]`). By default, no snippet is computed.
 * **getRankingInfo**: If set to 1, the result hits will contain ranking information in the **_rankingInfo** attribute.
 

#### Numeric Search Parameters
 * **numericFilters**: A string that contains the comma separated list of numeric filters you want to apply. The filter syntax is `attributeName` followed by `operand` followed by `value`. Supported operands are `<`, `<=`, `=`, `>` and `>=`.

You can easily perform range queries via the `:` operator. This is equivalent to combining a `>=` and `<=` operand. For example, `numericFilters=price:10 to 1000`.

You can also mix OR and AND operators. The OR operator is defined with a parenthesis syntax. For example, `(code=1 AND (price:[0-100] OR price:[1000-2000]))` translates to `encodeURIComponent("code=1,(price:0 to 10,price:1000 to 2000)")`.

You can also use a string array encoding (for example `numericFilters: ["price>100","price<1000"]`).

#### Category Search Parameters
 * **tagFilters**: Filter the query by a set of tags. You can AND tags by separating them with commas. To OR tags, you must add parentheses. For example, `tags=tag1,(tag2,tag3)` means *tag1 AND (tag2 OR tag3)*. You can also use a string array encoding. For example, `tagFilters: ["tag1",["tag2","tag3"]]` means *tag1 AND (tag2 OR tag3)*.<br/>At indexing, tags should be added in the **_tags** attribute of objects. For example `{"_tags":["tag1","tag2"]}`.

#### Faceting Parameters
 * **facetFilters**: Filter the query with a list of facets. Facets are separated by commas and is encoded as `attributeName:value`. To OR facets, you must add parentheses. For example: `facetFilters=(category:Book,category:Movie),author:John%20Doe`. You can also use a string array encoding. For example, `[["category:Book","category:Movie"],"author:John%20Doe"]`.
 * **facets**: List of object attributes that you want to use for faceting. <br/>Attributes are separated with a comma. For example, `"category,author"`. You can also use JSON string array encoding. For example, `["category","author"]`. Only the attributes that have been added in **attributesForFaceting** index setting can be used in this parameter. You can also use `*` to perform faceting on all attributes specified in **attributesForFaceting**.
 * **maxValuesPerFacet**: Limit the number of facet values returned for each facet. For example, `maxValuesPerFacet=10` will retrieve a maximum of 10 values per facet.

#### Distinct Parameter
 * **distinct**: If set to 1, enables the distinct feature, disabled by default, if the `attributeForDistinct` index setting is set. This feature is similar to the SQL "distinct" keyword. When enabled in a query with the `distinct=1` parameter, all hits containing a duplicate value for the attributeForDistinct attribute are removed from results. For example, if the chosen attribute is `show_name` and several hits have the same value for `show_name`, then only the best one is kept and the others are removed.
**Note**: This feature is disabled if the query string is empty and there aren't any `tagFilters`, `facetFilters`, nor `numericFilters` parameters.

```javascript
index = client.initIndex('contacts');
index.search('query string', function(error, content) {
    for (var h in content.hits) {
        console.log('Hit(' + content.hits[h].objectID + '): ' + content.hits[h].toString());
    }
});

index.search('query string', function(error, content) {
    for (var h in content.hits) {
        console.log('Hit(' + content.hits[h].objectID + '): ' + content.hits[h].toString());
    }
}, {'attributesToRetrieve': 'firstname,lastname', 'hitsPerPage': 50});
```

The server response will look like:

```json
{
  "hits": [
    {
      "firstname": "Jimmie",
      "lastname": "Barninger",
      "objectID": "433",
      "_highlightResult": {
        "firstname": {
          "value": "<em>Jimmie</em>",
          "matchLevel": "partial"
        },
        "lastname": {
          "value": "Barninger",
          "matchLevel": "none"
        },
        "company": {
          "value": "California <em>Paint</em> & Wlpaper Str",
          "matchLevel": "partial"
        }
      }
    }
  ],
  "page": 0,
  "nbHits": 1,
  "nbPages": 1,
  "hitsPerPage": 20,
  "processingTimeMS": 1,
  "query": "jimmie paint",
  "params": "query=jimmie+paint&attributesToRetrieve=firstname,lastname&hitsPerPage=50"
}
```


Multiple queries
--------------

You can send multiple queries with a single API call using a batch of queries:

```js
// perform 3 queries in a single API call:
//  - 1st query targets index `categories`
//  - 2nd and 3rd queries target index `products`
client.multipleQueries([{indexName: "categories", query: myQueryString, hitsPerPage: 3},
    {indexName: "products", query: myQueryString, hitsPerPage: 3, tagFilters: "promotion"},
    {indexName: "products", query: myQueryString, hitsPerPage: 10}], "indexName", function(error, content) {
  if (success) {
    var categories = content.results[0];
    for (var i = 0; i < categories.hits.length; ++i) {
      console.log(categories.hits[i]);
    }

    var products_promotion = content.results[1];
    for (var i = 0; i < products_promotion.hits.length; ++i) {
      console.log(products_promotion.hits[i]);
    }

    var products = content.results[2];
    for (var i = 0; i < products.hits.length; ++i) {
      console.log(products.hits[i]);
    }
  }
});
```



Get an object
-------------

You can easily retrieve an object using its `objectID` and optionally specify a comma separated list of attributes you want:

```javascript
// Retrieves all attributes
idx.getObject('myID', function(error, content) {
  console.log(content.objectID + ": " + content.toString());
});
// Retrieves firstname and lastname attributes
idx.getObject('myID', function(error, content) {
  console.log(content.objectID + ": " + content.toString());
}, "firstname,lastname");
// Retrieves only the firstname attribute
idx.getObject('myID', function(error, content) {
  console.log(content.objectID + ": " + content.toString());
}, "firstname");
```

You can also retrieve a set of objects:


```javascript
idx.getObjects(['myObj1', 'myObj2'], function(error, content) {
 // iterate over content
});
```






Delete an object
-------------

You can delete an object using its `objectID`:

```javascript
index.deleteObject('myID');
```


Delete by query
-------------

You can delete all objects matching a single query with the following code. Internally, the API client performs the query, deletes all matching hits, and waits until the deletions have been applied.

```javascript
var params = {};
index.deleteByQuery('John', params);
```


Index Settings
-------------

You can retrieve all settings using the `getSettings` function. The result will contain the following attributes:


#### Indexing parameters
 * **attributesToIndex**: (array of strings) The list of fields you want to index.<br/>If set to null, all textual and numerical attributes of your objects are indexed. Be sure to update it to get optimal results.<br/>This parameter has two important uses:
  * *Limit the attributes to index*.<br/>For example, if you store a binary image in base64, you want to store it and be able to retrieve it, but you don't want to search in the base64 string.
  * *Control part of the ranking*.<br/>(see the ranking parameter for full explanation) Matches in attributes at the beginning of the list will be considered more important than matches in attributes further down the list. In one attribute, matching text at the beginning of the attribute will be considered more important than text after. You can disable this behavior if you add your attribute inside `unordered(AttributeName)`. For example, `attributesToIndex: ["title", "unordered(text)"]`.
**Notes**: All numerical attributes are automatically indexed as numerical filters. If you don't need filtering on some of your numerical attributes, please consider sending them as strings to speed up the indexing.<br/>
You can decide to have the same priority for two attributes by passing them in the same string using a comma as a separator. For example `title` and `alternative_title` have the same priority in this example, which is different than text priority: `attributesToIndex:["title,alternative_title", "text"]`.
 * **attributesForFaceting**: (array of strings) The list of fields you want to use for faceting. All strings in the attribute selected for faceting are extracted and added as a facet. If set to null, no attribute is used for faceting.
 * **attributeForDistinct**: The attribute name used for the `Distinct` feature. This feature is similar to the SQL "distinct" keyword. When enabled in queries with the `distinct=1` parameter, all hits containing a duplicate value for this attribute are removed from results. For example, if the chosen attribute is `show_name` and several hits have the same value for `show_name`, then only the best one is kept and others are removed. **Note**: This feature is disabled if the query string is empty and there aren't any `tagFilters`, `facetFilters`, nor `numericFilters` parameters.
 * **ranking**: (array of strings) Controls the way results are sorted.<br/>We have nine available criteria:
  * **typo**: Sort according to number of typos.
  * **geo**: Sort according to decreasing distance when performing a geo location based search.
  * **words**: Sort according to the number of query words matched by decreasing order. This parameter is useful when you use the `optionalWords` query parameter to have results with the most matched words first.
  * **proximity**: Sort according to the proximity of the query words in hits.
  * **attribute**: Sort according to the order of attributes defined by attributesToIndex.
  * **exact**:
    * If the user query contains one word: sort objects having an attribute that is exactly the query word before others. For example, if you search for the TV show "V", you want to find it with the "V" query and avoid getting all popular TV shows starting by the letter V before it.
    * If the user query contains multiple words: sort according to the number of words that matched exactly (not as a prefix).
  * **custom**: Sort according to a user defined formula set in the **customRanking** attribute.
  * **asc(attributeName)**: Sort according to a numeric attribute using ascending order. **attributeName** can be the name of any numeric attribute in your records (integer, double or boolean).
  * **desc(attributeName)**: Sort according to a numeric attribute using descending order. **attributeName** can be the name of any numeric attribute in your records (integer, double or boolean). <br/>The standard order is ["typo", "geo", "words", "proximity", "attribute", "exact", "custom"].
 * **customRanking**: (array of strings) Lets you specify part of the ranking.<br/>The syntax of this condition is an array of strings containing attributes prefixed by the asc (ascending order) or desc (descending order) operator. For example, `"customRanking" => ["desc(population)", "asc(name)"]`.
 * **queryType**: Select how the query words are interpreted. It can be one of the following values:
  * **prefixAll**: All query words are interpreted as prefixes.
  * **prefixLast**: Only the last word is interpreted as a prefix (default behavior).
  * **prefixNone**: No query word is interpreted as a prefix. This option is not recommended.
 * **separatorsToIndex**: Specify the separators (punctuation characters) to index. By default, separators are not indexed. Use `+#` to be able to search Google+ or C#.
 * **slaves**: The list of indices on which you want to replicate all write operations. In order to get response times in milliseconds, we pre-compute part of the ranking during indexing. If you want to use different ranking configurations depending of the use case, you need to create one index per ranking configuration. This option enables you to perform write operations only on this index and automatically update slave indices with the same operations.
 * **unretrievableAttributes**: The list of attributes that cannot be retrieved at query time. This feature allows you to have attributes that are used for indexing and/or ranking but cannot be retrieved. Defaults to null.
 * **allowCompressionOfIntegerArray**: Allows compression of big integer arrays. We recommended enabling this feature and then storing the list of user IDs or rights as an integer array. When enabled, the integer array is reordered to reach a better compression ratio. Defaults to false.

#### Query expansion
 * **synonyms**: (array of array of words considered as equals). For example, you may want to retrieve the **black ipad** record when your users are searching for **dark ipad**, even if the word **dark** is not part of the record. To do this, you need to configure **black** as a synonym of **dark**. For example, `"synomyms": [ [ "black", "dark" ], [ "small", "little", "mini" ], ... ]`.
 * **placeholders**: (hash of array of words). This is an advanced use case to define a token substitutable by a list of words without having the original token searchable. It is defined by a hash associating placeholders to lists of substitutable words. For example, `"placeholders": { "<streetnumber>": ["1", "2", "3", ..., "9999"]}` would allow it to be able to match all street numbers. We use the `< >` tag syntax to define placeholders in an attribute. For example:
  * Push a record with the placeholder: `{ "name" : "Apple Store", "address" : "&lt;streetnumber&gt; Opera street, Paris" }`.
  * Configure the placeholder in your index settings: `"placeholders": { "<streetnumber>" : ["1", "2", "3", "4", "5", ... ], ... }`.
 * **disableTypoToleranceOn**: (string array) Specify a list of words on which automatic typo tolerance will be disabled.
 * **altCorrections**: (object array) Specify alternative corrections that you want to consider. Each alternative correction is described by an object containing three attributes:
  * **word**: The word to correct.
  * **correction**: The corrected word.
  * **nbTypos** The number of typos (1 or 2) that will be considered for the ranking algorithm (1 typo is better than 2 typos).

  For example `"altCorrections": [ { "word" : "foot", "correction": "feet", "nbTypos": 1 }, { "word": "feet", "correction": "foot", "nbTypos": 1 } ]`.

#### Default query parameters (can be overwritten by queries)
 * **minWordSizefor1Typo**: (integer) The minimum number of characters needed to accept one typo (default = 4).
 * **minWordSizefor2Typos**: (integer) The minimum number of characters needed to accept two typos (default = 8).
 * **hitsPerPage**: (integer) The number of hits per page (default = 10).
 * **attributesToRetrieve**: (array of strings) Default list of attributes to retrieve in objects. If set to null, all attributes are retrieved.
 * **attributesToHighlight**: (array of strings) Default list of attributes to highlight. If set to null, all indexed attributes are highlighted.
 * **attributesToSnippet**: (array of strings) Default list of attributes to snippet alongside the number of words to return (syntax is 'attributeName:nbWords').<br/>By default, no snippet is computed. If set to null, no snippet is computed.
 * **highlightPreTag**: (string) Specify the string that is inserted before the highlighted parts in the query result (defaults to "&lt;em&gt;").
 * **highlightPostTag**: (string) Specify the string that is inserted after the highlighted parts in the query result (defaults to "&lt;/em&gt;").
 * **optionalWords**: (array of strings) Specify a list of words that should be considered optional when found in the query.

You can easily retrieve settings or update them:

```javascript
index.getSettings(function(error, content) {
  console.log(content);
});
```

```javascript
index.setSettings({'customRanking': ['desc(followers)']});
```

List indices
-------------
You can list all your indices along with their associated information (number of entries, disk size, etc.) with the `listIndexes` method:

```javascript
client.listIndexes(function(error, content) {
  console.log(content);
});
```

Delete an index
-------------
You can delete an index using its name:

```javascript
client.deleteIndex("contacts", function(error, content) {
  console.log(content);
});
```

Clear an index
-------------
You can delete the index contents without removing settings and index specific API keys by using the clearIndex command:

```javascript
index.clearIndex(function(error, content) {
  console.log(content);
});

```

Wait indexing
-------------

All write operations return a `taskID` when the job is securely stored on our infrastructure but not when the job is published in your index. Even if it's extremely fast, you can easily ensure indexing is complete using the `waitTask` method on the `taskID` returned by a write operation.

For example, to wait for indexing of a new object:
```javascript
index.addObject({'firstname': 'Jimmie', 
                 'lastname': 'Barninger'}, function(error, content) {
  index.waitTask(content.taskID, function() {
    console.log("object " + content.objectID + " indexed");
  });
});
```


If you want to ensure multiple objects have been indexed, you only need check the biggest taskID.

Batch writes
-------------

You may want to perform multiple operations with one API call to reduce latency.
We expose three methods to perform batch operations:
 * `addObjects`: Add an array of objects using automatic `objectID` assignment.
 * `saveObjects`: Add or update an array of objects that contains an `objectID` attribute.
 * `deleteObjects`: Delete an array of objectIDs.
 * `partialUpdateObjects`: Partially update an array of objects that contain an `objectID` attribute (only specified attributes will be updated).

Example using automatic `objectID` assignment:
```javascript
index.addObjects([{"firstname": "Jimmie", 
                   "lastname": "Barninger"},
                  {"firstname": "Warren",
                   "lastname": "Speach"}], function(error, content) {
  console.log(content);
});
```

Example with user defined `objectID` (add or update):
```javascript
index.saveObjects([{"firstname": "Jimmie", 
                    "lastname": "Barninger",
                    "objectID": "myID1"},
                   {"firstname": "Warren",
                   "lastname": "Speach",
                    "objectID": "myID2"}], function(error, content) {
  console.log(content);
});
```

Example that deletes a set of records:
```javascript
index.deleteObjects(["myID1", "myID2"], function(error, content) {
  console.log(content);
});
```

Example that updates only the `firstname` attribute:
```javascript
index.partialUpdateObjects([{"firstname": "Jimmie", 
                             "objectID": "myID1"},
                            {"firstname": "Warren",
                             "objectID": "myID2"}], function(error, content) {
  console.log(content);
});

```



Security / User API Keys
-------------

The admin API key provides full control of all your indices.
You can also generate user API keys to control security.
These API keys can be restricted to a set of operations or/and restricted to a given index.

To list existing keys, you can use `listUserKeys` method:
```javascript
// Lists global API Keys
client.listUserKeys(function(error, content) {
    console.log(content);
});
// Lists API Keys that can access only to this index
index.listUserKeys(function(error, content) {
    console.log(content);
});
```

Each key is defined by a set of permissions that specify the authorized actions. The different permissions are:
 * **search**: Allowed to search.
 * **browse**: Allowed to retrieve all index contents via the browse API.
 * **addObject**: Allowed to add/update an object in the index.
 * **deleteObject**: Allowed to delete an existing object.
 * **deleteIndex**: Allowed to delete index content.
 * **settings**: allows to get index settings.
 * **editSettings**: Allowed to change index settings.
 * **analytics**: Allowed to retrieve analytics through the analytics API.
 * **listIndexes**: Allowed to list all accessible indexes.

Example of API Key creation:
```javascript
// Creates a new global API key that can only perform search actions
client.addUserKey(["search"], function(error, content) {
    console.log("Key:" + content['key']);
});
// Creates a new API key that can only perform search action on this index
index.addUserKey(["search"], function(error, content) {
    console.log("Key:" + content['key']);
});
```

You can also create an API Key with advanced restrictions:

 * Add a validity period. The key will be valid for a specific period of time (in seconds).
 * Specify the maximum number of API calls allowed from an IP address per hour. Each time an API call is performed with this key, a check is performed. If the IP at the source of the call did more than this number of calls in the last hour, a 403 code is returned. Defaults to 0 (no rate limit). This parameter can be used to protect you from attempts at retrieving your entire index contents by massively querying the index.

  Note: If you are sending the query through your servers, you must use the `enableRateLimitForward("TheAdminAPIKey", "EndUserIP", "APIKeyWithRateLimit")` function to enable rate-limit.

 * Specify the maximum number of hits this API key can retrieve in one call. Defaults to 0 (unlimited). This parameter can be used to protect you from attempts at retrieving your entire index contents by massively querying the index.
 * Specify the list of targeted indices. You can target all indices starting with a prefix or ending with a suffix using the '*' character. For example, "dev_*" matches all indices starting with "dev_" and "*_dev" matches all indices ending with "_dev". Defaults to all indices if empty or blank.

```javascript
// Creates a new global API key that is valid for 300 seconds
client.addUserKeyWithValidity(["search"], 300, 0, 0, function(error, content) {
    console.log("Key:" + content['key']);
});
// Creates a new index specific API key valid for 300 seconds, with a rate limit of 100 calls per hour per IP and a maximum of 20 hits
index.addUserKeyWithValidity(["search"], 300, 100, 20, function(error, content) {
    console.log("Key:" + content['key']);
});
```

Update the permissions of an existing key:
```javascript
// Update an existing global API key that is valid for 300 seconds
client.updateUserKeyWithValidity("myAPIKey", ["search"], 300, 0, 0, function(error, content) {
    console.log("Key:" + content['key']);
});
// Update an existing index specific API key valid for 300 seconds, with a rate limit of 100 calls per hour per IP and a maximum of 20 hits
index.updateUserKeyWithValidity("myAPIKey", ["search"], 300, 100, 20, function(error, content) {
    console.log("Key:" + content['key']);
});
```
Get the permissions of a given key:
```javascript
// Gets the rights of a global key
client.getUserKeyACL("7f2615414bc619352459e09895d2ebda", function(error, content) {
    console.log(content);
});
// Gets the rights of an index specific key
index.getUserKeyACL("9b9335cb7235d43f75b5398c36faabcd", function(error, content) {
    console.log(content);
});
```

Delete an existing key:
```javascript
// Deletes a global key
client.deleteUserKey("7f2615414bc619352459e09895d2ebda", function(error, content) {
    console.log(content);
});
// Deletes an index specific key
index.deleteUserKey("9b9335cb7235d43f75b5398c36faabcd", function(error, content) {
    console.log(content);
});
```



You may have a single index containing per user data. In that case, all records should be tagged with their associated user_id in order to add a `tagFilters=(public,user_42)` filter at query time to retrieve only what a user has access to. If you're using the [JavaScript client](http://github.com/algolia/algoliasearch-client-js), it will result in a security breach since the user is able to modify the `tagFilters` you've set by modifying the code from the browser. To keep using the JavaScript client (recommended for optimal latency) and target secured records, you can generate a secured API key from your backend:

```js
// generate a public API key for user 42. Here, records are tagged with:
//  - 'public' if they are visible by all users
//  - 'user_XXXX' if they are visible by user XXXX
var public_key = client.generateSecuredApiKey('YourSearchOnlyApiKey', '(public,user_42)');
```

This public API key can then be used in your JavaScript code as follow:

```javascript
<script type="text/javascript">
var client = algoliasearch('YourApplicationID', '<%= public_api_key %>');
client.setSecurityTags('(public,user_42)'); // must be same than those used at generation-time

var index = client.initIndex('indexName')

index.search('something', function(err, content) {
  if (err) {
    console.error(err);
    return;
  }

  console.log(content);
});
</script>
```

You can mix rate limits and secured API keys by setting an extra `user_token` attribute both at API key generation time and query time. When set, a unique user will be identified by her `IP + user_token` instead of only by her `IP`. This allows you to restrict a single user to performing a maximum of `N` API calls per hour, even if she shares her `IP` with another user.

```js
// generate a public API key for user 42. Here, records are tagged with:
//  - 'public' if they are visible by all users
//  - 'user_XXXX' if they are visible by user XXXX
var public_key = client.generateSecuredApiKey('YourRateLimitedApiKey', '(public,user_42)', 'user_42');
```

This public API key can then be used in your JavaScript code as follow:

```javascript
<script type="text/javascript">
var client = algoliasearch('YourApplicationID', '<%= public_api_key %>');

// must be same than those used at generation-time
client.setSecurityTags('(public,user_42)');

// must be same than the one used at generation-time
client.setUserToken('user_42');

var index = client.initIndex('indexName')

index.search('another query', function(err, content) {
  if (err) {
    console.error(err);
    return;
  }

  console.log(content);
});
</script>
```



Copy or rename an index
-------------

You can easily copy or rename an existing index using the `copy` and `move` commands.
**Note**: Move and copy commands overwrite the destination index.

```javascript
// Rename MyIndex in MyIndexNewName
client.moveIndex("MyIndex", "MyIndexNewName", function(error, content) {
  console.log(content);
});
// Copy MyIndex in MyIndexCopy
client.copyIndex("MyIndex", "MyIndexCopy", function(error, content) {
  console.log(content);
});
```

The move command is particularly useful if you want to update a big index atomically from one version to another. For example, if you recreate your index `MyIndex` each night from a database by batch, you only need to:
 1. Import your database into a new index using [batches](#batch-writes). Let's call this new index `MyNewIndex`.
 1. Rename `MyNewIndex` to `MyIndex` using the move command. This will automatically override the old index and new queries will be served on the new one.

```javascript
// Rename MyNewIndex in MyIndex (and overwrite it)
client.moveIndex("MyNewIndex", "MyIndex", function(error, content) {
  console.log(content);
});
```

Backup / Retrieve of all index content
-------------

You can retrieve all index content for backup purposes or for SEO using the browse method.
This method retrieves 1,000 objects via an API call and supports pagination.

```javascript
// Get first page
index.browse(0, function(error, content) {
  console.log(content);
});
// Get second page
index.browse(1, function(error, content) {
  console.log(content);
```

Logs
-------------

You can retrieve the latest logs via this API. Each log entry contains:
 * Timestamp in ISO-8601 format
 * Client IP
 * Request Headers (API Key is obfuscated)
 * Request URL
 * Request method
 * Request body
 * Answer HTTP code
 * Answer body
 * SHA1 ID of entry

You can retrieve the logs of your last 1,000 API calls and browse them using the offset/length parameters:
 * ***offset***: Specify the first entry to retrieve (0-based, 0 is the most recent log entry). Defaults to 0.
 * ***length***: Specify the maximum number of entries to retrieve starting at the offset. Defaults to 10. Maximum allowed value: 1,000.
 * ***onlyErrors***: Retrieve only logs with an HTTP code different than 200 or 201. (deprecated)
 * ***type***: Specify the type of logs to retrieve:
  * ***query***: Retrieve only the queries.
  * ***build***: Retrieve only the build operations.
  * ***error***: Retrieve only the errors (same as ***onlyErrors*** parameters).

```javascript
// Get last 10 log entries
client.getLogs(function(error, content) {
  console.log(content);
});
// Get last 100 log entries
client.getLogs(function(error, content) {
  console.log(content);
}, 0, 100);
```





