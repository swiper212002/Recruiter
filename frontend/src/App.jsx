import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Questions from './pages/Questions';
import Tests from './pages/Tests';
import HRQuestions from './pages/HRQuestions';
// Login page removed from nav — keep file if needed later
import TakeTest from './pages/TakeTest';
import AutoSubmit from './pages/AutoSubmit';
import Quiz from './pages/Quiz';

function App() {
  return (
    <Router>
      <div>
        <nav className="app-nav">
          <ul className="nav-list">
            <li className="nav-item"><a className="nav-link" href="/"><span className="btn ghost">Home</span></a></li>
            <li className="nav-item"><a className="nav-link" href="/questions"><span className="btn ghost">Questions</span></a></li>
            <li className="nav-item"><a className="nav-link" href="/tests"><span className="btn primary">Tests</span></a></li>
            <li className="nav-item"><a className="nav-link" href="/admin/questions"><span className="btn ghost">HR Admin</span></a></li>
            <li className="nav-item"><a className="nav-link" href="/take-test"><span className="btn ghost">Take Test</span></a></li>
            <li className="nav-item"><a className="nav-link" href="/quiz"><span className="btn ghost">Quiz</span></a></li>
          </ul>
        </nav>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/questions" component={Questions} />
          <Route path="/admin/questions" component={HRQuestions} />
          <Route path="/tests" component={Tests} />
          <Route path="/take-test" component={TakeTest} />
          <Route path="/auto-submit" component={AutoSubmit} />
          <Route path="/quiz" component={Quiz} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;