// Import models
const Role = require('./role.model');
const User = require('./user.model');
const Permission = require('./permission.model');
const RolePermission = require('./rolePermission.model');
const SystemLog = require('./systemLog.model');
const Candidate = require('./candidate.model');
const QuestionCategory = require('./questionCategory.model');
const Question = require('./question.model');
const QuestionOption = require('./questionOption.model');
const CodingQuestionTemplate = require('./codingQuestionTemplate.model');
const Test = require('./test.model');
const TestQuestion = require('./testQuestion.model');
const CandidateResume = require('./candidateResume.model');
const JobPosition = require('./jobPosition.model');
const CandidateJobApplication = require('./candidateJobApplication.model');
const Interview = require('./interview.model');
const InterviewParticipant = require('./interviewParticipant.model');
const InterviewFeedback = require('./interviewFeedback.model');
const CandidateTest = require('./candidateTest.model');
const CandidateTestAnswer = require('./candidateTestAnswer.model');
const TestFraudLog = require('./testFraudLog.model');
const CandidateTestResult = require('./candidateTestResult.model');
const RecruitmentReport = require('./recruitmentReport.model');

// Define associations

// Diagnostic checks removed - keep models exports clean for production


// User and Role
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

// Role and Permission
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', otherKey: 'permission_id' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', otherKey: 'role_id' });

// User and SystemLog
User.hasMany(SystemLog, { foreignKey: 'user_id' });
SystemLog.belongsTo(User, { foreignKey: 'user_id' });

// User and Candidate
User.hasOne(Candidate, { foreignKey: 'user_id' });
Candidate.belongsTo(User, { foreignKey: 'user_id' });

// Candidate and CandidateResume
Candidate.hasMany(CandidateResume, { foreignKey: 'candidate_id' });
CandidateResume.belongsTo(Candidate, { foreignKey: 'candidate_id' });

// User and Question
User.hasMany(Question, { foreignKey: 'created_by', as: 'CreatedQuestions' });
Question.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

// QuestionCategory and Question
QuestionCategory.hasMany(Question, { foreignKey: 'category_id' });
Question.belongsTo(QuestionCategory, { foreignKey: 'category_id' });

// Question and QuestionOption
Question.hasMany(QuestionOption, { foreignKey: 'question_id' });
QuestionOption.belongsTo(Question, { foreignKey: 'question_id' });

// Question and CodingQuestionTemplate
Question.hasMany(CodingQuestionTemplate, { foreignKey: 'question_id' });
CodingQuestionTemplate.belongsTo(Question, { foreignKey: 'question_id' });

// User and Test
User.hasMany(Test, { foreignKey: 'created_by', as: 'CreatedTests' });
Test.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

// Test and Question
Test.belongsToMany(Question, { through: TestQuestion, foreignKey: 'test_id', otherKey: 'question_id' });
Question.belongsToMany(Test, { through: TestQuestion, foreignKey: 'question_id', otherKey: 'test_id' });

// User and JobPosition
User.hasMany(JobPosition, { foreignKey: 'created_by', as: 'CreatedPositions' });
JobPosition.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

// Candidate and CandidateJobApplication
Candidate.hasMany(CandidateJobApplication, { foreignKey: 'candidate_id' });
CandidateJobApplication.belongsTo(Candidate, { foreignKey: 'candidate_id' });

// JobPosition and CandidateJobApplication
JobPosition.hasMany(CandidateJobApplication, { foreignKey: 'position_id' });
CandidateJobApplication.belongsTo(JobPosition, { foreignKey: 'position_id' });

// User and CandidateJobApplication
User.hasMany(CandidateJobApplication, { foreignKey: 'recruiter_id', as: 'RecruitedApplications' });
CandidateJobApplication.belongsTo(User, { foreignKey: 'recruiter_id', as: 'Recruiter' });

// CandidateJobApplication and Interview
CandidateJobApplication.hasMany(Interview, { foreignKey: 'application_id' });
Interview.belongsTo(CandidateJobApplication, { foreignKey: 'application_id' });

// User and Interview
User.hasMany(Interview, { foreignKey: 'created_by', as: 'CreatedInterviews' });
Interview.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

// Interview and InterviewParticipant
Interview.hasMany(InterviewParticipant, { foreignKey: 'interview_id' });
InterviewParticipant.belongsTo(Interview, { foreignKey: 'interview_id' });

// User and InterviewParticipant
User.hasMany(InterviewParticipant, { foreignKey: 'user_id' });
InterviewParticipant.belongsTo(User, { foreignKey: 'user_id' });

// Interview and InterviewFeedback
Interview.hasMany(InterviewFeedback, { foreignKey: 'interview_id' });
InterviewFeedback.belongsTo(Interview, { foreignKey: 'interview_id' });

// User and InterviewFeedback
User.hasMany(InterviewFeedback, { foreignKey: 'reviewer_id', as: 'GivenFeedbacks' });
InterviewFeedback.belongsTo(User, { foreignKey: 'reviewer_id', as: 'Reviewer' });

// Candidate and CandidateTest
Candidate.hasMany(CandidateTest, { foreignKey: 'candidate_id' });
CandidateTest.belongsTo(Candidate, { foreignKey: 'candidate_id' });

// Test and CandidateTest
Test.hasMany(CandidateTest, { foreignKey: 'test_id' });
CandidateTest.belongsTo(Test, { foreignKey: 'test_id' });

// CandidateJobApplication and CandidateTest
CandidateJobApplication.hasMany(CandidateTest, { foreignKey: 'application_id' });
CandidateTest.belongsTo(CandidateJobApplication, { foreignKey: 'application_id' });

// CandidateTest and CandidateTestAnswer
CandidateTest.hasMany(CandidateTestAnswer, { foreignKey: 'candidate_test_id' });
CandidateTestAnswer.belongsTo(CandidateTest, { foreignKey: 'candidate_test_id' });

// Question and CandidateTestAnswer
Question.hasMany(CandidateTestAnswer, { foreignKey: 'question_id' });
CandidateTestAnswer.belongsTo(Question, { foreignKey: 'question_id' });

// CandidateTest and TestFraudLog
CandidateTest.hasMany(TestFraudLog, { foreignKey: 'candidate_test_id' });
TestFraudLog.belongsTo(CandidateTest, { foreignKey: 'candidate_test_id' });

// CandidateTest and CandidateTestResult
CandidateTest.hasOne(CandidateTestResult, { foreignKey: 'candidate_test_id' });
CandidateTestResult.belongsTo(CandidateTest, { foreignKey: 'candidate_test_id' });

// User and CandidateTestResult
User.hasMany(CandidateTestResult, { foreignKey: 'reviewed_by', as: 'ReviewedResults' });
CandidateTestResult.belongsTo(User, { foreignKey: 'reviewed_by', as: 'Reviewer' });

// User and RecruitmentReport
User.hasMany(RecruitmentReport, { foreignKey: 'created_by', as: 'CreatedReports' });
RecruitmentReport.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

// Export models
const sequelize = require('../config/database');

module.exports = {
  Role,
  User,
  Permission,
  RolePermission,
  SystemLog,
  Candidate,
  QuestionCategory,
  Question,
  QuestionOption,
  CodingQuestionTemplate,
  Test,
  TestQuestion,
  CandidateResume,
  JobPosition,
  CandidateJobApplication,
  Interview,
  InterviewParticipant,
  InterviewFeedback,
  CandidateTest,
  CandidateTestAnswer,
  TestFraudLog,
  CandidateTestResult,
  RecruitmentReport
};

// also export sequelize instance for transactional operations - include it directly on the exported object
module.exports.sequelize = sequelize;
// For convenience, also attach sequelize to the main export object
module.exports = Object.assign(module.exports, { sequelize });
