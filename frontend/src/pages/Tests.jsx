import React, { useEffect, useState } from 'react';
import TestCreator from '../components/TestCreator';

const Tests = () => {
  const [tests, setTests] = useState([]);

  const fetchTests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/public/tests');
      const data = await response.json();
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  useEffect(() => { fetchTests(); }, []);

  return (
    <div>
      <h1>Manage Tests</h1>
      <TestCreator />
      <h2>Existing Tests</h2>
      <ul>
        {tests.map((test) => (
          <li key={test.test_id}>{test.test_name} ({test.duration_minutes} min)</li>
        ))}
      </ul>
    </div>
  );
};

export default Tests;