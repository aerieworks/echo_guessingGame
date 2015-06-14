var AWS = require('aws-sdk');
var SM = require('./stateMachine.js');
var Question = require('./question.js');
var Alexa = require('./alexa.js');

var States = {
  Launch: 'launch',
  WaitingForPlayer: 'waitingForPlayer',
  StartGame: 'startGame',
  LoadQuestion: 'loadQuestion',
  QuestionResponse: 'questionResponse',
  AskQuestion: 'askQuestion',
  GuessAnswer: 'guessAnswer',
  AnswerCorrect: 'answerCorrect',
  AnswerIncorrect: 'answerIncorrect'
};

var theGame = (function () {
  var Intents = {
    ResponseYes: 'ResponseYes',
    ResponseNo: 'ResponseNo',
    DescribeWhatItIs: 'DescribeWhatItIs',
    DescribeWhatItHas: 'DescribeWhatItHas'
  };

  var startPrompt = 'Are you ready to play?';
  return new SM.MachineBuilder()
    .addState(States.Launch, function launchHandler(machine) {
        this.app.buildResponse()
          .speech('Welcome to The Guessing Game.  Think of something, and I will try to figure out what it is by asking you Yes or No questions.  ' + startPrompt)
          .reprompt(startPrompt)
          .send();
      })
      .transitionsTo(Intents.ResponseYes, States.StartGame)
      .transitionsTo(Intents.ResponseNo, States.WaitingForPlayer)

    .addState(States.WaitingForPlayer, function waitingForPlayerHandler(machine) {
        this.buildResponse()
          .speech('OK.  I can give you more time.' + startPrompt)
          .reprompt(startPrompt)
          .send();
      })
      .transitionsTo(Intents.ResponseYes, States.StartGame)
      .transitionsTo(Intents.ResponseNo, States.WaitingForPlayer)

    .addState(States.StartGame, function startGameHandler(machine) {
        this.pushQuestion(Question.firstQuestionId);
        machine.transitionTo(States.LoadQuestion, this);
      })

    .addState(States.LoadQuestion, function loadQuestionHandler(machine) {
        this.getCurrentQuestion(function (question) {
          if (question.isAnswer()) {
            machine.transitionTo(States.GuessAnswer, this);
          } else {
            machine.transitionTo(States.AskQuestion, this);
          }
        });
      })

    .addState(States.AskQuestion, function askQuestionHandler(machine) {
        this.getCurrentQuestion(function (question) {
          this.buildResponse()
            .speech(question.getQuestionSpeech())
            .reprompt(question.getQuestionReprompt())
            .send();
        });
      })
      .transitionsTo(Intents.ResponseYes, States.QuestionResponse)
      .transitionsTo(Intents.ResponseNo, States.QuestionResponse)

    .addState(States.QuestionResponse, function questionResponseHandler(machine) {
        this.getCurrentQuestion(function (question) {
          var intent = this.request.intent.name;
          this.pushQuestion(intent == Intents.ResponseYes ? question.if_yes : question.if_no);
          machine.transitionTo(States.LoadQuestion, this);
        });
      })

    .addState(States.GuessAnswer, function guessAnswerHandler(machine) {
        this.getCurrentQuestion(function (question) {
          this.buildResponse()
            .speech('OK, I think I\'ve got it.  ' + question.getQuestionSpeech())
            .reprompt(question.getQuestionReprompt())
            .send();
        });
      })
      .transitionsTo(Intents.ResponseYes, States.AnswerCorrect)
      .transitionsTo(Intents.ResponseNo, States.AnswerIncorrect)

    .addState(States.AnswerCorrect, function answerCorrectHandler(machine) {
        this.buildResponse()
          .speech('Yay, I win!  That was fun.  We should play again sometime.')
          .shouldEndSession(true)
          .send();
      })

    .addState(States.AnswerIncorrect, function answerIncorrectHandler(machine) {
        this.buildResponse()
          .speech('Oh.  Congratulations, you stumped me!  I guess I\'m not as smart as I thought I was.')
          .shouldEndSession(true)
          .send();
      })

    .withOnStateChanged(
      function onMachineStateChanged(machine, stateName) {
        this.session.state = stateName;
      })
    .build();
})();

exports.handler = Alexa.getRequestHandler({
  applicationId: 'amzn1.echo-sdk-ams.app.d4c25657-d28c-4191-afcc-b9b22f63b940',
  appName: 'The Guessing Game',
  currentQuestion: null,

  launch:
    function () {
      theGame.transitionTo(States.Launch, this);
    },

  handleIntent:
    function (intent) {
      return theGame.run(this.session.state, intent.name, this);
    },

  getCurrentQuestion:
    function getCurrentQuestion(callback) {
      if (this.currentQuestion === null) {
        var questionId = this.session.path[this.session.path.length - 1];
        var self = this;
        Question.get(questionId, function (error, question) {
          if (error) {
            self.respondWithError(error);
          } else {
            self.currentQuestion = quesiton;
            self.getCurrentQuestion(callback);
          }
        });

        return;
      }

      callback.apply(this, [ this.currentQuestion ]);
    },

  pushQuestion:
    function pushQuestion(questionId) {
      this.session.path.push(questionId);
      this.currentQuestion = null;
    }
});
