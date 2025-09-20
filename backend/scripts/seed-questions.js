const path = require('path');
// Ensure we load environment variables same as the app
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { Question, QuestionOption, Test, TestQuestion, sequelize } = require('../src/models');

async function seed() {
  await sequelize.authenticate();
  console.log('DB authenticated for seeding');

  const transaction = await sequelize.transaction();
  try {
    // HR-focused questions (Tiếng Việt)
    const questions = [];

    const q1 = await Question.create({
      question_text: 'Hãy giới thiệu ngắn gọn về bản thân và kinh nghiệm liên quan đến vị trí này.',
      question_type: 'TEXT',
      difficulty_level: 'EASY',
      is_active: true,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
    questions.push(q1);

    const q2 = await Question.create({
      question_text: 'Bạn đã từng gặp xung đột trong nhóm chưa? Mô tả tình huống và cách bạn xử lý.',
      question_type: 'TEXT',
      difficulty_level: 'MEDIUM',
      is_active: true,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
    questions.push(q2);

    const q3 = await Question.create({
      question_text: 'Cho ví dụ về một dự án bạn đã chủ động giải quyết vấn đề — bạn làm gì và kết quả ra sao?',
      question_type: 'TEXT',
      difficulty_level: 'MEDIUM',
      is_active: true,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
    questions.push(q3);

    const q4 = await Question.create({
      question_text: 'Trong 30 ngày đầu nhận việc, bạn sẽ ưu tiên làm gì để nhanh chóng đóng góp cho nhóm?',
      question_type: 'TEXT',
      difficulty_level: 'MEDIUM',
      is_active: true,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
    questions.push(q4);

    const q5 = await Question.create({
      question_text: 'Bạn thích làm việc nhóm hay làm việc độc lập hơn?',
      question_type: 'SINGLE_CHOICE',
      difficulty_level: 'EASY',
      is_active: true,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
    // options for q5
    await QuestionOption.bulkCreate([
      { question_id: q5.question_id, option_text: 'Ưa thích làm việc nhóm', is_correct: false },
      { question_id: q5.question_id, option_text: 'Ưa thích làm việc độc lập', is_correct: false },
      { question_id: q5.question_id, option_text: 'Cân nhắc theo nhiệm vụ', is_correct: false }
    ], { transaction });
    questions.push(q5);

    const q6 = await Question.create({
      question_text: 'Viết một hàm (pseudo/JavaScript) đảo chuỗi (reverse string). Mô tả ý tưởng và độ phức tạp.',
      question_type: 'CODING',
      difficulty_level: 'MEDIUM',
      is_active: true,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
    questions.push(q6);

    const q7 = await Question.create({
      question_text: 'Tình huống: Khách hàng phàn nàn về lỗi nghiêm trọng; bạn là người xử lý — mô tả quy trình bạn làm.',
      question_type: 'TEXT',
      difficulty_level: 'MEDIUM',
      is_active: true,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
    questions.push(q7);

    const q8 = await Question.create({
      question_text: 'Bạn mong chờ điều gì từ người quản lý trực tiếp của mình?',
      question_type: 'TEXT',
      difficulty_level: 'EASY',
      is_active: true,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
    questions.push(q8);

    // Create a sample HR test including all seeded questions
    const t = await Test.create({
      test_name: 'HR - Interview Questions',
      description: 'Bộ câu hỏi phỏng vấn kỹ năng mềm và kỹ thuật cơ bản',
      duration_minutes: 60,
      passing_score: 0,
      is_active: true,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });

    const testQuestions = questions.map((q, idx) => ({
      test_id: t.test_id,
      question_id: q.question_id,
      question_order: idx + 1,
      score_weight: 1
    }));

    await TestQuestion.bulkCreate(testQuestions, { transaction });

    await transaction.commit();
    console.log('Seeding complete. Created test_id:', t.test_id);
  } catch (err) {
    await transaction.rollback();
    console.error('Seeding failed:', err.message || err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
