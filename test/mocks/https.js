var events = require('events'),
    util = require('util'),
    _ = require('underscore'),
    async = require('async'),
    should = require('should');

var responders = null,
    currentResponder = 0;

exports.request = function (options, done) {
  return new FakeRequest(options, done);
};

exports.setResponders = function (responders_) {
  if(!_.isArray(responders_))
    responders_ = [responders_];

  responders = responders_;
  currentResponder = 0;
};

function FakeRequest(options, resCallback) {
  events.EventEmitter.call(this);

  this.options = options;
  this.resCallback = resCallback;
}

util.inherits(FakeRequest, events.EventEmitter);

FakeRequest.prototype.end = function () {
  should.exist(responders);

  var responder = responders[currentResponder];
  should.exist(responder);
  currentResponder++;

  var response = _.isFunction(responder) ? responder(this.options) : responder,
      res = new FakeResponse(response);

  this.resCallback(res);
  res.simulate();
};

function FakeResponse(response) {
  events.EventEmitter.call(this);

  this.json = response.json;
  this.headers = {
    'content-type': 'application/json'
  };
  this.statusCode = response.statusCode;
}

util.inherits(FakeResponse, events.EventEmitter);

FakeResponse.prototype.simulate = function () {
  var self = this;

  // split the response in several chunks to see if the driver
  // properly reassembles them
  process.nextTick(function () {
    var data = new Buffer(JSON.stringify(self.json)),
        remaining = data.length;

    async.whilst(
      function () {
        return remaining > 0;
      },
      function (done) {
        process.nextTick(function () {
          var chunk = data.slice(0, 20);
          data = data.slice(20);

          remaining = data.length;
          self.emit('data', chunk);
          done();
        });
      }, function () {
        self.emit('end');
      });
  });
};