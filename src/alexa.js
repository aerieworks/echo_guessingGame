var extend = require('node.extend');

function addSetterTo(obj, fieldName) {
  obj[fieldName] = function setter(value) {
    this[fieldName] = value;
    return this;
  };
}

var ResponseBuilder = (function () {
  function ResponseBuilder(context) {
    this.app = app;
    this.speech(null).reprompt(null).cardTitle(null).cardContent(null).shouldEndSession(false);
  }

  function send() {
    var response = {
      shouldEndSession: !!this.shouldEndSession
    };
    if (this.speech !== null) {
      response.outputSpeech = {
        type: 'PlainText',
        text: this.speech
      };
    }
    if (this.cardTitle !== null || this.cardContent !== null) {
      response.card = {
        type: 'Simple',
        title: this.cardTitle,
        content: this.cardContent
      };
    }
    if (this.reprompt !== null) {
      response.reprompt = {
        type: 'PlainText',
        text: this.reprompt
      };
    }

    this.app.context.succeed({
      version: "1.0",
      sessionAttributes: this.app.session,
      response: response
    });
  }

  var proto = ResponseBuilder.prototype;
  addSetterTo(proto, 'speech');
  addSetterTo(proto, 'reprompt');
  addSetterTo(proto, 'cardTitle');
  addSetterTo(proto, 'cardContent');
  addSetterTo(proto, 'shouldEndSession');
  proto.send = send;
  return ResponseBuilder;
})();

function App(definition, event, context) {
  extend(this, {
    applicationId: null,
    appName: 'Alexa App',
  }, definition);

  this.request = null;
  this.session = null;
  this.context = null;
}

function buildResponse() {
  return new ResponseBuilder(this);
}

function sendErrorResponse(error) {
  console.log('Error: ' + error.toString());
  this.buildResponse()
    .speech('Sorry, something went wrong.')
    .cardTitle(this.appName + ' - Error')
    .cardContent(error.toString())
    .shouldEndSession(true)
    .send();
}

function handleRequest(app, event, context) {
  var applicationId = event.session.application.applicationId;
  console.log('Handling request from application ' + applicationId);

  // Sanity check that calling application is allowed to invoke us.
  if (app.applicationId !== null) {
    if (applicationId !== app.applicationId) {
      context.fail('Invalid application ID: ' + applicationId);
    }
  }

  this.request = event.request;
  this.session = event.session;
  this.context = context;

  if (this.session.new) {
    console.log('Alexa: Initializing new session.');
    app.initializeSession();
  }

  console.log('Alexa: Session state: ' + JSON.stringify(app.session));
  if (this.request.type === 'LaunchRequest') {
    console.log('Alexa: New app launch.');
    app.launch();
  } else if (this.request.type === 'IntentRequest') {
    console.log('Alexa: Handling intent <' + this.request.intent.name + '>');
    app.handleIntent(this.request.intent);
  } else if (this.request.type === 'SessionEndedRequest') {
    console.log('Alexa: Ending session.');
    app.end();
  }
}

extend(App.prototype, {
  initializeSession: function def_initializeSession() { },
  launch: function def_launch() { },
  handleIntent: function def_handleIntent(intent) { return false; },
  end: function def_end() { this.context.succeed(); },

  handleRequest: handleRequest,
  buildResponse: buildResponse,
  sendErrorResponse: sendErrorResponse
});

function getRequestHandler(appDefinition) {
  return function handleRequest(event, context) {
    try {
      var app = new App(appDefinition);
      app.handleRequest(event, context);
    } catch (e) {
      context.fail('Exception: ' + e);
    }
  };
}

exports.getRequestHandler = getRequestHandler;
