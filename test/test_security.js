var should = require('should'),
    moquire = require('moquire'),
    sleep = require('sleep');


describe('Algolia Security', function () {
  var Algolia = require('../src/algoliasearch-node');
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

  it('should be able to add a security for client', function (done) {
    var key;
    var keys;
    client.listUserKeys(function(error, content) {
      error.should.eql(false);
      keys = content.keys.length;
      client.addUserKey(['search'], function(error, content) {
        error.should.eql(false);
        key = content.key;
        sleep.sleep(5); // no task ID here
        client.getUserKeyACL(key, function(error, content) {
          error.should.eql(false);
          content.should.have.property('acl').length(1);
          content.acl[0].should.eql('search');
          client.updateUserKey(key, ['addObject'], function(error, content) {
            error.should.eql(false);
            sleep.sleep(5); // no task ID here
            client.getUserKeyACL(key, function(error, content) {
              error.should.eql(false);
              content.should.have.property('acl').length(1);
              content.acl[0].should.eql('addObject');
              client.listUserKeys(function(error, content) {
                error.should.eql(false);
                content.should.have.property('keys').length(keys + 1);
                client.deleteUserKey(key, function(error, content) {
                  error.should.eql(false);
                  sleep.sleep(5); // no task ID here
                  client.listUserKeys(function(error, content) {
                    error.should.have.eql(false);
                    content.should.have.property('keys').length(keys);
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

it('should be able to add a security for index', function (done) {
    var key;
    var keys;
    var index = client.initIndex(safe_index_name('àlgol?à-node'));
    index.saveObject({ name: 'San Francisco', objectID: "à/go/?à" }, function(error, content) {
      should.exist(content.taskID);
      error.should.eql(false);
      index.waitTask(content.taskID, function(error, content) {
        index.listUserKeys(function(error, content) {
          error.should.eql(false);
          keys = content.keys.length;
          index.addUserKey(['search'], function(error, content) {
            error.should.eql(false);
            key = content.key;
            sleep.sleep(5); // no task ID here
            index.getUserKeyACL(key, function(error, content) {
              error.should.eql(false);
              content.should.have.property('acl').length(1);
              content.acl[0].should.eql('search');
              index.updateUserKey(key, ['addObject'], function(error, content) {
                error.should.eql(false);
                sleep.sleep(5); // no task ID here
                index.getUserKeyACL(key, function(error, content) {
                  error.should.eql(false);
                  content.should.have.property('acl').length(1);
                  content.acl[0].should.eql('addObject');
                  index.listUserKeys(function(error, content) {
                    error.should.eql(false);
                    content.should.have.property('keys').length(keys + 1);
                    index.deleteUserKey(key, function(error, content) {
                      error.should.eql(false);
                      sleep.sleep(5); // no task ID here
                      index.listUserKeys(function(error, content) {
                        error.should.have.eql(false);
                        content.should.have.property('keys').length(keys);
                        client.deleteIndex(safe_index_name('àlgol?à-node'));
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
    });
  });

  it('should generate secured api keys', function(done) {
    var crypto = require('crypto');
    '1fd74b206c64fb49fdcd7a5f3004356cd3bdc9d9aba8733656443e64daafc417'.should.eql(crypto.createHmac('sha256', 'my_api_key').update('(public,user1)').digest('hex'));
    key = client.generateSecuredApiKey('my_api_key', '(public,user1)');
    key.should.eql(crypto.createHmac('sha256', 'my_api_key').update('(public,user1)').digest('hex'));
    key = client.generateSecuredApiKey('my_api_key', '(public,user1)', 42);
    key.should.eql(crypto.createHmac('sha256', 'my_api_key').update('(public,user1)42').digest('hex'));
    key = client.generateSecuredApiKey('my_api_key', ['public']);
    key.should.eql(crypto.createHmac('sha256', 'my_api_key').update('public').digest('hex'));
    key = client.generateSecuredApiKey('my_api_key', ['public', ['premium','vip']]);
    key.should.eql(crypto.createHmac('sha256', 'my_api_key').update('public,(premium,vip)').digest('hex'));
    done();
  });

});
