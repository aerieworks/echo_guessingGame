var extend = require('node.extend');
var UUID = require('uuid');

function Context(event) {
  this.event = event;
}

function succeed(response) {
  this.event.application.sessions[this.event.payload.session.sessionId] = response.sessionAttributes;
  console.log('alexaMock.Context.succeed() [' + this.event.payload.request.requestId + '] ' + JSON.stringify(response));
}

function fail(error) {
  console.log('alexaMock.Context.fail() [' + this.event.payload.request.requestId + '] ' + JSON.stringify(error));
}

extend(Context.prototype, {
  fail: fail,
  succeed: succeed
});


function Event(application, payload) {
  this.application = application;
  this.payload = payload;
}

function sendTo(handler) {
  handler(this.payload, new Context(this));
}

extend(Event.prototype, {
  sendTo: sendTo
});


function Application(applicationId) {
  this.applicationId = applicationId;
  this.sessions = {};
}

function buildRequest(request) {
  if (typeof request == 'string') {
    request = { type: request };
  }

  if (request.requestId == null) {
    request.requestId = UUID.v4();
  }

  return request;
}

function buildSession(session) {
  if (typeof session == 'string' || session == null) {
    session = { sessionId: session };
    if (session.sessionId == null) {
      session.sessionId = UUID.v4();
    }

    session.attributes = this.sessions[session.sessionId];
    if (session.attributes == null) {
      session.attributes = {};
      session['new'] = true;
    } else {
      session['new'] = false;
    }
  }

  this.sessions[session.sessionId] = session.attributes;
  return extend({}, session, {
    application: { applicationId: this.applicationId },
    user: { userId: null }
  });
}

function createEvent(request, session) {
  return new Event(this, {
    "version": "1.0",
    "session": this.buildSession(session),
    "request": this.buildRequest(request)
  });
}

function createLaunchEvent() {
  return this.createEvent({ type: 'LaunchRequest' });
}

function createIntentEvent(name, slots, session) {
  var request = {
    type: 'IntentRequest',
    intent: {
      name: name,
      slots: slots
    }
  };

  return this.createEvent(request, session);
}

extend(Application.prototype, {
  buildRequest: buildRequest,
  buildSession: buildSession,
  createEvent: createEvent,
  createLaunchEvent: createLaunchEvent,
  createIntentEvent: createIntentEvent
});

exports.Application = Application;
