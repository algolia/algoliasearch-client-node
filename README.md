Algolia Search API Client for Node.js
==================

This Node.js client let you easily use the Algolia Search API from your backend.
The service is currently in Beta, you can request an invite on our [website](http://www.algolia.com/pricing/).

Setup
-------------
To setup your project, follow these steps:

 1. install algolia-search by running 

```
npm install algolia-search
```

 2. Initialize the client with your ApplicationID, API-Key and list of hostnames (you can find all of them on your Algolia account)
 
Initialization without keep-alive:
```javascript
var Algolia = require('./algoliasearch-node');
var client = new Algolia('ApplicationID', 'API-Key', 
                         ['user-1.algolia.io', 'user-2.algolia.io', 'user-3.algolia.io']);
```

Initialization with keep-alive enabled:
```javascript
var HttpsAgent = require('agentkeepalive').HttpsAgent;
var Algolia = require('./algoliasearch-node');

var keepaliveAgent = new HttpsAgent({
    maxSockets: 1,
    maxKeepAliveRequests: 0, // no limit on max requests per keepalive socket
    maxKeepAliveTime: 30000 // keepalive for 30 seconds
});

var client = new Algolia('ApplicationID', 'API-Key', 
                         ['user-1.algolia.io', 'user-2.algolia.io', 'user-3.algolia.io'],
                         keepaliveAgent);
```
Note: if you are using keep-alive in a command-line tool, your program will exit after the keep-alive timeout is expired. You should use a connection without keep-alive in a command-line tool.

Quick Start
-------------
This quick start is a 30 seconds tutorial where you can discover how to index and search objects.

Without any prior-configuration, you can index the 1000 world's biggest cities in the ```cities``` index with the following code:
```javascript
var index = client.initIndex('cities');
var fileJSON = require('./1000-cities.json');
index.addObjects(fileJSON['objects']);
```
The [1000-cities.json](https://github.com/algolia/algoliasearch-client-node/blob/master/1000-cities.json) file contains city names extracted from [Geonames](http://www.geonames.org) and formated in our [batch format](http://docs.algoliav1.apiary.io/#post-%2F1%2Findexes%2F%7BindexName%7D%2Fbatch). The ```body```attribute contains the user-object that can be any valid JSON.

You can then start to search for a city name (even with typos):
```javascript
index.search('san fran', function(success, content) {
  console.log(content.hits);
});
index.search('loz anqel', function(success, content) {
  console.log(content.hits);
});
```

Settings can be customized to tune the index behavior. For example you can add a custom sort by population to the already good out-of-the-box relevance to raise bigger cities above smaller ones. To update the settings, use the following code:
```javascript
index.setSettings({'customRanking': ['desc(population)', 'asc(name)']});
```

And then search for all cities that start with an "s":
```javascript
index.search('s', function(success, content) {
  console.log(content.hits);
});
```

General Principle
-------------

All API calls will return the result in a callback that takes two arguments:

 1. **success**: a boolean that is set to false when an error was found.
 2. **content**: the object containing the answer (if an error was found, you can retrieve the error message in `content.message`)

Search 
-------------
-------------
> **Opening note:** If you are building a web application, you may be more interested in using our [javascript client](https://github.com/algolia/algoliasearch-client-js) to send queries. It brings two benefits: (i) your users get a better response time by avoiding to go threw your servers, and (ii) it will offload your servers of unnecessary tasks.

To perform a search, you just need to initialize the index and perform a call to the search function.<br/>
You can use the following optional arguments:

 * **attributes**: a string that contains the names of attributes to retrieve separated by a comma.<br/>By default all attributes are retrieved.
 * **attributesToHighlight**: a string that contains the names of attributes to highlight separated by a comma.<br/>By default all textual attributes are highlighted.
 * **minWordSizeForApprox1**: the minimum number of characters in a query word to accept one typo in this word.<br/>Defaults to 3.
 * **minWordSizeForApprox2**: the minimum number of characters in a query word to accept two typos in this word.<br/>Defaults to 7.
 * **getRankingInfo**: if set to 1, the result hits will contain ranking information in _rankingInfo attribute.
 * **page**: *(pagination parameter)* page to retrieve (zero base).<br/>Defaults to 0.
 * **hitsPerPage**: *(pagination parameter)* number of hits per page.<br/>Defaults to 10.
 * **aroundLatLng**: search for entries around a given latitude/longitude (specified as two floats separated by a comma).<br/>For example `aroundLatLng=47.316669,5.016670`).<br/>You can specify the maximum distance in meters with the **aroundRadius** parameter (in meters).<br/>At indexing, you should specify geoloc of an object with the _geoloc attribute (in the form `{"_geoloc":{"lat":48.853409, "lng":2.348800}}`)
 * **insideBoundingBox**: search entries inside a given area defined by the two extreme points of a rectangle (defined by 4 floats: p1Lat,p1Lng,p2Lat,p2Lng).<br/>For example `insideBoundingBox=47.3165,4.9665,47.3424,5.0201`).<br/>At indexing, you should specify geoloc of an object with the _geoloc attribute (in the form `{"_geoloc":{"lat":48.853409, "lng":2.348800}}`)
 * **tags**: filter the query by a set of tags. You can AND tags by separating them by commas. To OR tags, you must add parentheses. For example, `tags=tag1,(tag2,tag3)` means *tag1 AND (tag2 OR tag3)*.<br/>At indexing, tags should be added in the _tags attribute of objects (for example `{"_tags":["tag1","tag2"]}` )

```javascript
index = client.initIndex('MyIndexName');
index.search('query string', function(success, content) {
    for (var h in content.hits) {
        console.log('Hit(' + content.hits[h].objectID + '): ' + content.hits[h].toString());
    }
});

index.search('query string', function(success, content) {
    for (var h in content.hits) {
        console.log('Hit(' + content.hits[h].objectID + '): ' + content.hits[h].toString());
    }
}, {'attributes': 'population,name', 'hitsPerPage': 50});
```

The server response will look like:

```javascript
{
    "hasError": false,
    "errorMsg": null,
    "answer":
            { "hits":[
                        { "name": "Betty Jane Mccamey",
                          "company": "Vita Foods Inc.",
                          "email": "betty@mccamey.com",
                          "objectID": "6891Y2usk0",
                          "_highlightResult": {"name": {"value": "Betty <em>Jan</em>e Mccamey", "matchLevel": "full"}, 
                                               "company": {"value": "Vita Foods Inc.", "matchLevel": "none"},
                                               "email": {"value": "betty@mccamey.com", "matchLevel": "none"} }
                        },
                        { "name": "Gayla Geimer Dan", 
                          "company": "Ortman Mccain Co", 
                          "email": "gayla@geimer.com", 
                          "objectID": "ap78784310" 
                          "_highlightResult": {"name": {"value": "Gayla Geimer <em>Dan</em>", "matchLevel": "full" },
                                               "company": {"value": "Ortman Mccain Co", "matchLevel": "none" },
                                               "email": {"highlighted": "gayla@geimer.com", "matchLevel": "none" } }
                        }],
                "page":0,
                "nbHits":2,
                "nbPages":1,
                "hitsPerPage:":20,
                "processingTimeMS":1,
                "query":"jan"
            }
}
```

Add a new object in the Index
-------------

Each entry in an index has a unique identifier called `objectID`. You have two ways to add en entry in the index:

 1. Using automatic `objectID` assignement, you will be able to retrieve it in the answer.
 2. Passing your own `objectID`

You don't need to explicitely create an index, it will be automatically created the first time you add an object.
Objects are schema less, you don't need any configuration to start indexing. The settings section provide details about advanced settings.

Example with automatic `objectID` assignement:

```javascript
index.addObject({'name': 'San Francisco', 
                 'population': 805235}, function(success, content) {
  console.log('objectID=' + content.objectID);
});
```

Example with manual `objectID` assignement:
```javascript
index.addObject({'name': 'San Francisco', 
                 'population': 805235}, function(success, content) {
  console.log('objectID=' + content.objectID);
}, 'myID');
```


Update an existing object in the Index
-------------


You have two options to update an existing object:

 1. Replace all its attributes.
 2. Replace only some attributes.

Example to replace all the content of an existing object:

```javascript
index.saveObject({'name': 'Los Angeles', 
                  'population': 3792621,
                  'objectID': 'myID'});
```

Example to update only the population attribute of an existing object:

```javascript
index.partialUpdateObject({'population': 3792621,
                           'objectID': 'myID'});
```

Get an object
-------------

You can easily retrieve an object using its `objectID` and optionnaly a list of attributes you want to retrieve (using comma as separator):

```javascript
// Retrieves all attributes
idx.getObject('myID', function(success, content) {
  console.log(content.objectID + ": " + content.toString());
});
// Retrieves name and population attributes
idx.getObject('myID', function(success, content) {
  console.log(content.objectID + ": " + content.toString());
}, "name,population");
// Retrieves only the name attribute
idx.getObject('myID', function(success, content) {
  console.log(content.objectID + ": " + content.toString());
}, "name");
```

Delete an object
-------------

You can delete an object using its `objectID`:

```javascript
index.deleteObject('myID');
```

Index Settings
-------------

You can retrieve all settings using the `getSettings` function. The result will contains the following attributes:

 * **minWordSizeForApprox1**: (integer) the minimum number of characters to accept one typo (default = 3).
 * **minWordSizeForApprox2**: (integer) the minimum number of characters to accept two typos (default = 7).
 * **hitsPerPage**: (integer) the number of hits per page (default = 10).
 * **attributesToRetrieve**: (array of strings) default list of attributes to retrieve in objects.
 * **attributesToHighlight**: (array of strings) default list of attributes to highlight
 * **attributesToIndex**: (array of strings) the list of fields you want to index.<br/>By default all textual attributes of your objects are indexed, but you should update it to get optimal results.<br/>This parameter has two important uses:
 * *Limit the attributes to index*.<br/>For example if you store a binary image in base64, you want to store it and be able to retrieve it but you don't want to search in the base64 string.
 * *Control part of the ranking*.<br/>Matches in attributes at the beginning of the list will be considered more important than matches in attributes further down the list. 
 * **ranking**: (array of strings) controls the way results are sorted.<br/>We have four available criteria: 
 * **typo**: sort according to number of typos,
 * **geo**: sort according to decreassing distance when performing a geo-location based search,
 * **position**: sort according to the matching attribute, 
 * **custom**: sort according to a user defined formula.<br/>The standard order is ["typo", "geo", position", "custom"]
 * **customRanking**: (array of strings) lets you specify part of the ranking.<br/>The syntax of this condition is an array of strings containing attributes prefixed by asc (ascending order) or desc (descending order) operator.
 For example `"customRanking" => ["desc(population)", "asc(name)"]`

You can easily retrieve settings or update them:

```javascript
index.getSettings(function(success, content) {
  console.log(content);
});
```

```javascript
index.setSettings({'customRanking': ['desc(population)', 'asc(name)']});
```
