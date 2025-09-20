import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1>Welcome to the Question Manager App</h1>
      <p>This application allows you to manage questions and create tests.</p>
      <nav>
        <ul>
          <li>
            <Link to="/questions">Manage Questions</Link>
          </li>
          <li>
            <Link to="/tests">Create Tests</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Home;