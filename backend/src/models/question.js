const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question_text: String,
  question_type: String,
  difficulty_level: String,
  category: String,
  tags: [String],
  options: [
    {
      option_text: String,
      is_correct: Boolean
    }
  ],
  explanation: String
});

module.exports = mongoose.model('Question', QuestionSchema);
