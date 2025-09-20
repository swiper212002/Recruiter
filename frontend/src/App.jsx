import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Questions from './pages/Questions';
import Tests from './pages/Tests';
import HRQuestions from './pages/HRQuestions';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <div>
        <nav style={{ padding: 8 }}>
          <a href="/">Home</a> | <a href="/questions">Questions</a> | <a href="/tests">Tests</a> | <a href="/admin/questions">HR Admin</a> | <a href="/login">Login</a>
        </nav>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/questions" component={Questions} />
          <Route path="/admin/questions" component={HRQuestions} />
          <Route path="/tests" component={Tests} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;