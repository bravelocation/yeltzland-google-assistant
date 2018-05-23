'use strict';
 
var yeltzlandSpeech = require("./yeltzland-speech").yeltzlandSpeech;
var Promise = require('promise');

const {
  dialogflow,
  Image,
} = require('actions-on-google');

// Create an app instance

const app = dialogflow();

app.intent('Default Welcome Intent', conv => {
  conv.ask(yeltzlandSpeech.welcomeText)
});

app.intent('Default Fallback Intent', conv => {
  conv.ask("I didn't understand. Can you tell me something else?")
});

app.intent('BestTeam', conv => {
  conv.ask("The best team is Halesowen Town")
});

app.intent('WorstTeam', conv => {
  conv.ask("The best team is Stourbridge Town")
});

app.intent('Fixture', (conv, params) => {
  var team = params.Team;

  return teamBased(true, team).then(function(result) {
    conv.add(result.speechOutput);
  });
});

app.intent('Result', (conv, params) => {
  var team = params.Team;

  return teamBased(false, team).then(function(result) {
    conv.add(result.speechOutput);
  });
});

app.intent('GameScore', (conv) => {
  return gameScore().then(function(result) {
    conv.add(result.speechOutput);
  });
});


function teamBased(useFixtures, team) {
  return new Promise(function(resolve, reject) {
    yeltzlandSpeech.teamBased(useFixtures, team, function(result) {
      resolve(result);
    });
  });
};

function gameScore() {
  return new Promise(function(resolve, reject) {
    yeltzlandSpeech.gameScore(function(result) {
      resolve(result);
    });
  });
};

exports.handler = app;
