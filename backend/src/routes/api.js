const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Test = require('../models/Test');

// Lấy danh sách câu hỏi
router.get('/questions', async (req, res) => {
  const questions = await Question.find();
  res.json(questions);
});

// Thêm câu hỏi mới
router.post('/questions', async (req, res) => {
  const question = new Question(req.body);
  await question.save();
  res.json(question);
});

// Lấy danh sách bài test
router.get('/tests', async (req, res) => {
  const tests = await Test.find().populate('questionIds');
  res.json(tests);
});

// Tạo bài test mới
router.post('/tests', async (req, res) => {
  const test = new Test(req.body);
  await test.save();
  res.json(test);
});

module.exports = router;