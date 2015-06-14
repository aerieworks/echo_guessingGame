var getDb = (function () {
  var db = null;

  return (function _getDb() {
    if (db === null) {
      db = new AWS.DynamoDB({
      region: 'us-east-1',
      accessKeyId: '',
      secretAccessKey: '',
      maxRetries: 5,
      sslEnabled: true,
      logger: console
      });
    }
    return db;
  });
})();

var QuestionTypes = {
  is_a: 'is_a',
  has_a: 'has_a'
};

var tableName = 'twenty_questions';
var firstQuestionId = '6490d3d7-e5ce-41e6-a707-b9d3c379c800';

function Question(data) {
  this.id = data.Item.question_id.S;
  this.type = data.Item.type.S;
  this.value = data.Item.value.S;
  this.if_yes = data.Item.if_yes ? data.Item.if_yes.S : null;
  this.if_no = data.Item.if_no ? data.Item.if_no.S : null;
}

extend(Question.prototype, {
  getQuestionSpeech:
    function getQuestionSpeech() {
      return (this.type == QuestionTypes.is_a ? 'Is it ' : 'Does it have ') + this.value + '?';
    },

  getQuestionReprompt:
    function getQuestionReprompt() {
      return this.getQuestionSpeech();
    },

  isAnswer:
    function isAnswer() {
      return this.if_yes === null;
    }
});
function getQuestion(id, callback) {
  var params = {
    TableName: tableName,
    Key: { question_id: { S: id } },
    ProjectionExpression: 'question_id, #type, #value, if_yes, if_no',
    ExpressionAttributeNames: {
      '#type': 'type',
      '#value': 'value'
    }
  };

  getDb().getItem(params, function (error, data) {
    var question = (error === null) ? new Question(data) : null;
    callback(error, question);
  });
}

exports.firstQuestionId = firstQuestionId;
exports.get = getQuestion;
