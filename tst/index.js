module.exports = {
  examples: {
    test1:
      function (test) {
        test.ok(true, 'Assertion should pass.');
        test.done();
      },

    test2:
      function (test) {
        test.equal(1, 1, 'Values should be equal.');
        test.done();
      }
  },

  more_examples: {
    test1:
      function (test) {
        test.ok(true, 'Passes');
        test.done();
      },

    test2:
      function (test) {
        test.ok(true, 'Also passes');
        test.done();
      }
  }
};
