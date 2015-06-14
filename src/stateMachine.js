extend = require('node.extend');

function Machine(stateList, onStateChanged) {
  this.states = {};
  this.onStateChanged = onStateChanged;
  for (var i = 0; i < stateList.length; i++) {
    var state = stateList[i];
    this.states[state.name] = state;

  }
  this.currentState = null;
}

extend(Machine.prototype, {
  run:
    function run(fromState, input, context) {
      console.log('StateMachine: Running, ' + input + '@' + fromState);
      var prevState = this.states[fromState];
      if (prevState) {
        var nextStateName = this.states[fromState].transitions[input];
        if (nextStateName) {
          console.log('StateMachine: Input should transition to ' + nextStateName);
          return this.transtionTo(nextStateName, context);
        }
      }

      console.log('StateMachine: Unknown current state ' + fromState);
      return false;
    },

  transitionTo:
    function transitionTo(stateName, context) {
      console.log('StateMachine: Transitioning to ' + stateName);
      var nextState = this.states[stateName];
      if (nextState) {
        this.onStateChanged.apply(context, [ this, nextState.name ]);
        return !(false === nextState.handler.apply(context, [ this ]));
      }

      console.log('StateMachine: Unknown new state: ' + stateName);
      return false;
    }
});

function MachineBuilder() {
  this.states = [];
  this.currentState = null;
  this.onStateChanged = null;
}

extend(MachineBuilder.prototype, {
  addState:
    function addState(name, handler) {
      console.log('MachineBuilder: Has state ' + name);
      this.currentState = { name: name, handler: handler, transitions: {} };
      this.states.push(this.currentState);
      return this;
    },

  transitionsTo:
    function transitionsTo(input, toStateName) {
      console.log('MachineBuilder: \t[' + this.currentState.name + '] + <' + input + '> = [' + toStateName + ']');
      this.currentState.transitions[input] = toStateName;
      return this;
    },

  withOnStateChanged:
    function withOnStateChanged(handler) {
      this.onStateChanged = handler;
      return this;
    },

  build:
    function build() {
      return new Machine(this.states, this.onStateChanged);
    }
});

exports.MachineBuilder = MachineBuilder;

