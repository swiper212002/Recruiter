import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1>Welcome to the Question Manager App</h1>
      <p>This application allows you to manage questions and create tests.</p>
      <nav className="app-nav" aria-label="Main navigation">
        <ul className="nav-list">
          <li className="nav-item"><Link className="nav-link" to="/questions"><span className="btn ghost">Manage Questions</span></Link></li>
          <li className="nav-item"><Link className="nav-link" to="/tests"><span className="btn primary">Create Tests</span></Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default Home;