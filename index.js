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
  return timeBasedData(params).then(function(result) {
    if (result == null || result.speechOutput == "") {
      conv.add("No games found then");
    } else {
      conv.add(result.speechOutput);
    }
  });
});

app.intent('GameTimeResult', (conv, params) => {
  return timeBasedData(params).then(function(result) {
    if (result == null || result.speechOutput == "") {
      conv.add("No games found then");
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

function timeBasedData(params) {
  return new Promise(function(resolve, reject) {
    var parsedDate = parseDateParameters(params);
    if (parsedDate) {
      yeltzlandSpeech.timeBased(parsedDate.startTime, parsedDate.endTime, function(result) {
        resolve(result);
      });
    } else {
      resolve(null);
    }
  });
};

// *** Date parameter parsing function
function parseDateParameters(params) {
  var gameTime = params.date;
  var datePeriod = params["date-period"];

  // Use the single date if possible
  if (gameTime && gameTime != "") {
    // Find start and end of that day
    var parseDate = new Date(gameTime);
    if (parseDate) {
      return {
        startTime: new Date(parseDate.getFullYear(), parseDate.getMonth(), parseDate.getDate(), 0, 0, 0),
        endTime: new Date(parseDate.getFullYear(), parseDate.getMonth(), parseDate.getDate(), 23, 59, 59)
      };
    }
  }

  if (datePeriod) {
    var parseStartDate = new Date(datePeriod.startDate);
    var parseEndDate = new Date(datePeriod.endDate);
  
    // Find start and end of that day
    if (parseStartDate && parseEndDate) {
      return {
        startTime: new Date(parseStartDate.getFullYear(), parseStartDate.getMonth(), parseStartDate.getDate(), 0, 0, 0),
        endTime: new Date(parseEndDate.getFullYear(), parseEndDate.getMonth(), parseEndDate.getDate(), 23, 59, 59)
      };
    }
  }

  return null;
}

exports.handler = app;
