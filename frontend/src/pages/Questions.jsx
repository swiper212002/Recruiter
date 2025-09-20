import React, { useEffect, useState } from 'react';
import QuestionForm from '../components/QuestionForm';
import QuestionList from '../components/QuestionList';

const Questions = () => {
  const [questions, setQuestions] = useState([]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/public/questions');
      const data = await response.json();
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleQuestionAdded = (newQuestion) => {
    setQuestions((prevQuestions) => [...prevQuestions, newQuestion]);
  };

  return (
    <div>
      <h1>Manage Questions</h1>
      <QuestionForm onQuestionAdded={handleQuestionAdded} />
      <QuestionList questions={questions} />
    </div>
  );
};

export default Questions;
