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
        <nav style={{ padding: 8 }}>
          <a href="/">Home</a> | <a href="/questions">Questions</a> | <a href="/tests">Tests</a> | <a href="/admin/questions">HR Admin</a> | <a href="/take-test">Take Test</a> | <a href="/quiz">Quiz</a>
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