'use strict';
 
var yeltzlandSpeech = require("./yeltzland-speech").yeltzlandSpeech;
var Promise = require('promise');

const {
  dialogflow,
  Image,
  BasicCard,
  SimpleResponse,
  Table
} = require('actions-on-google');

// Create an app instance

const app = dialogflow();

app.intent('Default Welcome Intent', conv => {
  // Only place we should .ask() as we are expecting a response
  conv.ask(yeltzlandSpeech.welcomeText);

  if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
    // Create a basic card
    conv.add(new BasicCard({
      text: "",
      title: "Halesowen Town",
      image: new Image({
        url: 'https://s3-eu-west-1.amazonaws.com/yeltzland-alexa-images/htfc_logo_small.png',
        alt: 'Halesowen Town FC'
      })
    }));
  }

  conv.expectUserResponse = true;
});

app.intent('Default Fallback Intent', conv => {
  generateSimpleOutput(conv, yeltzlandSpeech.fallbackText, false)
});

app.intent('Finish', (conv) => {
  conv.close(yeltzlandSpeech.finishText);
});

app.intent('actions.intent.CANCEL', (conv) => {
  conv.close(yeltzlandSpeech.finishText);
});

app.intent('BestTeam', conv => {
  generateSpeechOutput(conv, yeltzlandSpeech.bestTeamSpeak, yeltzlandSpeech.bestTeamText, "Halesowen Town", "Halesowen Town")
});

app.intent('WorstTeam', conv => {
  generateSpeechOutput(conv, yeltzlandSpeech.worstTeamSpeak, yeltzlandSpeech.worstTeamText, "Stourbridge Town", "Stourbridge")
});

app.intent('Fixture', (conv, params) => {
  var team = params.Team;

  return teamBased(true, team).then(function(result) {
    generateMatchesOutput(conv, result.speechOutput, 'Games vs ' + team, result.matches, team);
  });
});

app.intent('Result', (conv, params) => {
  var team = params.Team;

  return teamBased(false, team).then(function(result) {
    generateMatchesOutput(conv, result.speechOutput, 'Games vs ' + team, result.matches, team);
  });
});

app.intent('GameScore', (conv) => {
  return gameScore().then(function(result) {
    generateSingleGameOutput(conv, result.speechOutput, 'Latest score', result.matches);
  });
});

app.intent('NextGame', (conv) => {
  return singleGame(true).then(function(result) {
    generateSingleGameOutput(conv, result.speechOutput, 'Next game', result.matches);
  });
});

app.intent('LastResult', (conv) => {
  return singleGame(false).then(function(result) {
    generateSingleGameOutput(conv, result.speechOutput, 'Result', result.matches);
  });
});

app.intent('GameTimeFixture', (conv, params) => {
  return timeBasedData(params).then(function(result) {
    if (result == null || result.speechOutput == "") {
      generateSimpleOutput(conv, "No games found then.", true);
    } else {
      generateMatchesOutput(conv, result.speechOutput, 'Games', result.matches);
    }
  });
});

app.intent('GameTimeResult', (conv, params) => {
  return timeBasedData(params).then(function(result) {
    if (result == null || result.speechOutput == "") {
      generateSimpleOutput(conv, "No games found then.", true);
    } else {
      generateMatchesOutput(conv, result.speechOutput, 'Results', result.matches);
    }
  });
});

//*** Output generation
function generateSimpleOutput(conv, mainText, promptForAnother) {
  conv.add(mainText);

  if (promptForAnother) {
    addContinuation(conv);
  }
}

function generateSpeechOutput(conv, ssml, mainText, title, teamName) {
  conv.add(new SimpleResponse({
    speech: ssml,
    text: mainText,
  }));

  if (title && conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
    var imageUrl = 'https://s3-eu-west-1.amazonaws.com/yeltzland-alexa-images/htfc_logo_small.png';
    var altName = 'Halesowen Town FC';
  
    if (teamName) {
      imageUrl = yeltzlandSpeech.teamImageUrl(teamName);
      altName = yeltzlandSpeech.titleCase(teamName);
    }

    conv.add(new BasicCard({
      text: "",
      title: title,
      image: new Image({
        url: imageUrl,
        alt: altName
      })
    }));    
  }
}

function generateSingleGameOutput(conv, mainText, title, matches) {
  // Send the simple response first
  conv.add(mainText);

  if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
    // Create a table
    var match = matches.length > 0 ? matches[0] : null;
    if (match) {
      var matchRows = [];

      var home = (match.Home == "1");

      var homeRow = [];
      homeRow.push(home ? "Halesowen Town" : match.Opponent);
      homeRow.push(home ? match.TeamScore : match.OpponentScore);    
      matchRows.push(homeRow);

      var awayRow = [];
      awayRow.push(!home ? "Halesowen Town" : match.Opponent);
      awayRow.push(!home ? match.TeamScore : match.OpponentScore);    
      matchRows.push(awayRow);
        
      conv.add(new Table({
        dividers: true,
        columns: [{header:'Team', align: 'LEADING'}, {header:'Score', align: 'TRAILING'}],
        rows: matchRows,
        title: title,
        image: new Image({
          url: yeltzlandSpeech.teamImageUrl(match.Opponent),
          alt: match.Opponent
        })
      }));
    }
  }

  if (matches.length == 0) {
    addContinuation(conv);
  } 
}

function generateMatchesOutput(conv, mainText, title, matches, teamName) {
  conv.add(mainText);
  
  // Add table if we have any matches
  if (conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT') && matches.length > 0) {
    var matchRows = [];
    for (var i = 0; i < matches.length; i++) {
      var match = matches[i];

      var newMatchRow = []; 
      newMatchRow.push(match.Opponent); 
      newMatchRow.push((match.Home == "1") ?  "H" : "A");

      var fixture = (match.TeamScore == null) || (match.OpponentScore == null); 
      if (fixture) {
        newMatchRow.push(yeltzlandSpeech.displayDate(match.MatchDateTime));
      }
      else {
        newMatchRow.push(match.TeamScore + '-' + match.OpponentScore);
      }
      
      matchRows.push(newMatchRow);
    }

    var imageUrl = 'https://s3-eu-west-1.amazonaws.com/yeltzland-alexa-images/htfc_logo_small.png';
    var altName = 'Halesowen Town FC';
  
    if (teamName) {
      imageUrl = yeltzlandSpeech.teamImageUrl(teamName);
      altName = yeltzlandSpeech.titleCase(teamName);
    }

    conv.add(new Table({
      dividers: true,
      columns: [{header:'Opponent', align: 'LEADING'}, {header:'Home', align: 'CENTER'}, {header:'Date or Score', align: 'TRAILING'}],
      rows: matchRows,
      title: title,
      image: new Image({
        url: imageUrl,
        alt: altName
      })
    }));
  }

  if (matches.length == 0) {
    addContinuation(conv);
  }
}

function addContinuation(conv) {
  // If we are continuing, add a prompt!
  var prompt = " " + yeltzlandSpeech.prompts[Math.floor(Math.random()*yeltzlandSpeech.prompts.length)];
  conv.add(prompt)

  conv.expectUserResponse = true;
}

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
