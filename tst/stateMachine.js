var SM = require('com.aerieworks.guessingGame/stateMachine.js');

module.exports = {
  'MachineBuilder': {
    'Empty state machine': function (test) {
      var machine = new SM.MachineBuilder().build();
      test.notEqual(machine, null, 'machine should not be null.');
      test.notEqual(machine.states, null, 'machine.states should not be null.');

      var size = 0;
      for (a in machine.states) {
        if (machine.states.hasOwnProperty(a)) {
          size += 1;
        }
      }
      test.equal(size, 0, 'machine.states should be empty.');
      test.equal(machine.onStateChanged, null, 'machine.onStateChanged should be null.');
      test.equal(machine.currentState, null, 'machine.currentState should be null.');
      test.done();
    },

    'onStateChanged is set': function (test) {
      var expected = function () {};
      var machine = new SM.MachineBuilder().withOnStateChanged(expected).build();
      test.equal(machine.onStateChanged, expected, 'machine.onStateChanged should have been set.');
      test.done();
    }
  }
};
