const express = require('express');
const router = express.Router();
const { Question, QuestionOption, Test, TestQuestion } = require('../models');
const sequelize = require('../config/database');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

// Public endpoints for Questions and Tests (no authentication) - useful for FE recruiter pages

// Get list of questions
router.get('/questions', async (req, res) => {
  try {
    const questions = await Question.findAll({
      include: [
        {
          model: QuestionOption,
          attributes: ['option_id', 'option_text', 'is_correct']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(questions);
  } catch (error) {
    logger.error(`Public get questions error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách câu hỏi' });
  }
});

// Create a question (public - for quick recruiter workflows). created_by will be null.
// Validation for creating question
const createQuestionValidators = [
  body('question_text').isString().notEmpty().withMessage('question_text is required'),
  body('question_type').isString().notEmpty().withMessage('question_type is required'),
  body('difficulty_level').optional().isString(),
  body('options').optional().isArray(),
  body('options.*.option_text').optional().isString().withMessage('option_text must be string'),
  body('options.*.is_correct').optional().isBoolean()
];

router.post('/questions', createQuestionValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  let transaction;
  try {
    // acquire transaction here to avoid unhandled promise rejection if sequelize is undefined
    transaction = await sequelize.transaction();

    const { question_text, question_type, difficulty_level, category_id, options, explanation } = req.body;

    const newQuestion = await Question.create({
      question_text,
      question_type,
      difficulty_level,
      category_id: category_id || null,
      explanation: explanation || null,
      is_active: true,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });

    if (options && Array.isArray(options) && options.length > 0) {
      await Promise.all(options.map(opt => {
        return QuestionOption.create({
          question_id: newQuestion.question_id,
          option_text: opt.option_text,
          is_correct: !!opt.is_correct
        }, { transaction });
      }));
    }

    await transaction.commit();

    const created = await Question.findByPk(newQuestion.question_id, {
      include: [{ model: QuestionOption, attributes: ['option_id', 'option_text', 'is_correct'] }]
    });

    return res.status(201).json(created);
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error(`Public create question error: ${error.message}\n${error.stack}`);
    return res.status(500).json({ success: false, message: 'Lỗi khi tạo câu hỏi' });
  }
});

// Get list of tests with their questions
router.get('/tests', async (req, res) => {
  try {
    const tests = await Test.findAll({
      include: [
        {
          model: Question,
          through: { attributes: ['question_order', 'score_weight'] },
          include: [{ model: QuestionOption, attributes: ['option_id', 'option_text', 'is_correct'] }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(tests);
  } catch (error) {
    logger.error(`Public get tests error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách bài test' });
  }
});

// Create a test (public). created_by will be null.
// Validation for creating test
const createTestValidators = [
  body('test_name').isString().notEmpty().withMessage('test_name is required'),
  body('duration_minutes').optional().isInt({ gt: 0 }).withMessage('duration_minutes must be integer > 0'),
  body('questions').optional().isArray(),
  body('questions.*.question_id').optional().isInt().withMessage('question_id must be integer')
];

router.post('/tests', createTestValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  let transaction;
  try {
    transaction = await sequelize.transaction();

    const { test_name, description, duration_minutes, passing_score, questions } = req.body;

    if (!test_name) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Tên bài test là bắt buộc' });
    }

    const newTest = await Test.create({
      test_name,
      description: description || null,
      duration_minutes: duration_minutes || 0,
      passing_score: passing_score || null,
      is_active: true,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });

    const warnings = [];
    // strict mode: ?strict=true or X-Strict-Mode: true
    const strictQuery = (req.query.strict === 'true') || (req.get('X-Strict-Mode') === 'true');

    if (questions && Array.isArray(questions) && questions.length > 0) {
      // Detect duplicates in the incoming payload
      const seenIds = new Set();
      const duplicates = new Set();
      const uniqList = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q || typeof q.question_id === 'undefined' || q.question_id === null) continue;
        if (seenIds.has(q.question_id)) {
          duplicates.add(q.question_id);
          continue;
        }
        seenIds.add(q.question_id);
        uniqList.push(q);
      }

        if (duplicates.size > 0) {
          const dupArray = Array.from(duplicates);
          if (strictQuery) {
            // rollback and return 400 with duplicates
            if (transaction) await transaction.rollback();
            return res.status(400).json({ success: false, error: 'Duplicate question ids present', duplicates: dupArray });
          }
          warnings.push({ type: 'duplicate_question_id', question_ids: dupArray, action: 'ignored' });
        }

      // Validate existence of each unique question_id
      if (uniqList.length > 0) {
        const ids = uniqList.map(q => q.question_id);
        const existing = await Question.findAll({ where: { question_id: ids }, attributes: ['question_id'] });
        const existingIds = new Set(existing.map(e => e.question_id));
        const missing = ids.filter(id => !existingIds.has(id));
        if (missing.length > 0) {
          if (transaction) await transaction.rollback();
          return res.status(400).json({ success: false, error: 'Some question_ids do not exist', missing });
        }

        const rows = uniqList.map((q, idx) => ({
          test_id: newTest.test_id,
          question_id: q.question_id,
          question_order: q.question_order || idx + 1,
          score_weight: q.score_weight || 1
        }));

        if (rows.length > 0) {
          try {
            // Use ignoreDuplicates to avoid crashing if the composite PK (test_id, question_id)
            // already exists for any row. This is a safe, idempotent behavior for public
            // test creation (we already dedupe the incoming payload).
            await TestQuestion.bulkCreate(rows, { transaction, ignoreDuplicates: true });
          } catch (insertErr) {
            // If the dialect doesn't support ignoreDuplicates or another unique constraint
            // error bubbles up, convert it to a warning instead of failing the whole request.
            if (insertErr && insertErr.name === 'SequelizeUniqueConstraintError') {
              warnings.push({ type: 'db_duplicate', message: 'Some question links already existed and were ignored' });
            } else {
              // rethrow unknown errors to be handled by outer catch
              throw insertErr;
            }
          }
        }
      }
    }

    await transaction.commit();

    const created = await Test.findByPk(newTest.test_id, {
      include: [
        {
          model: Question,
          through: { attributes: ['question_order', 'score_weight'] },
          include: [{ model: QuestionOption, attributes: ['option_id', 'option_text', 'is_correct'] }]
        }
      ]
    });

  const responseBody = { success: true, data: { test: created } };
  if (warnings.length > 0) responseBody.warnings = warnings;

  return res.status(201).json(responseBody);
  } catch (error) {
    if (transaction) await transaction.rollback();
    // Log detailed Sequelize error info for debugging
    try {
      const info = {
        message: error.message,
        name: error.name,
        errors: error.errors,
        parent: error.parent && (error.parent.sqlMessage || error.parent.sql || error.parent.message),
        stack: error.stack
      };
      logger.error('Public create test error: ' + JSON.stringify(info, Object.getOwnPropertyNames(info)));
    } catch (logErr) {
      logger.error(`Public create test error: ${error.message}\n${error.stack}`);
    }

    return res.status(500).json({ success: false, message: 'Lỗi khi tạo bài test' });
  }
});

module.exports = router;
