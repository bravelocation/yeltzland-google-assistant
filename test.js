'use strict';
var yeltzlandSpeech = require("./yeltzland-speech").yeltzlandSpeech;
var Promise = require('promise');

describe('Intent Tests', function() {
    it('Test of harness', function(done) {
        singleGame(true).then(function(result) {
            if (result.matches && result.matches.length > 0) {
                done();
            } else {
                done('No matched found');
            }
        });
    });
});

function singleGame(useFixtures) {
    return new Promise(function(resolve, reject) {
      yeltzlandSpeech.singleGame(useFixtures, function(result) {
        resolve(result);
      });
    });
  };