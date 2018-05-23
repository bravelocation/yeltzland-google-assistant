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

app.intent('NextGame', (conv) => {
  return singleGame(true).then(function(result) {
    conv.add(result.speechOutput);
  });
});

app.intent('LastResult', (conv) => {
  return singleGame(false).then(function(result) {
    conv.add(result.speechOutput);
  });
});

app.intent('GameTimeFixture', (conv, params) => {
  var gameTime = params.date;

  return timeBasedData(gameTime).then(function(result) {
    if (result == null || result.speechOutput == "") {
      conv.add("No games found on that day");
    } else {
      conv.add(result.speechOutput);
    }
    
  });
});

app.intent('GameTimeResult', (conv, params) => {
  var gameTime = params.date;

  return timeBasedData(gameTime).then(function(result) {
    if (result == null || result.speechOutput == "") {
      conv.add("No games found on that day");
    } else {
      conv.add(result.speechOutput);
    }
    
  });
});

//**** Helper functions that return promises
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

function singleGame(useFixtures) {
  return new Promise(function(resolve, reject) {
    yeltzlandSpeech.singleGame(useFixtures, function(result) {
      resolve(result);
    });
  });
};

function timeBasedData(gameTime) {
  return new Promise(function(resolve, reject) {
    var parsedDate = parseSingleDate(gameTime);
    if (parsedDate) {
      yeltzlandSpeech.timeBased(parsedDate.startTime, parsedDate.endTime, function(result) {
        resolve(result);
      });
    } else {
      resolve(null);
    }
  });
};

// *** Date parsing function
function parseSingleDate(gameTime) {
  var parseDate = new Date(gameTime);

  // Find start and end of that day
  if (parseDate) {
    return {
      startTime: new Date(parseDate.getFullYear(), parseDate.getMonth(), parseDate.getDate(), 0, 0, 0),
      endTime: new Date(parseDate.getFullYear(), parseDate.getMonth(), parseDate.getDate(), 23, 59, 59)
    };
  } else {
    return null;
  }
}

exports.handler = app;
