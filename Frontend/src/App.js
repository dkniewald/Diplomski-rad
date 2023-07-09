import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/header/header.component.jsx';
import Homepage from './pages/homepage/homepage.component.jsx';
import Excel from './pages/excel/excel.component.jsx';
import Footer from "./components/footer/footer.component.jsx";
import Geoparsetext from './pages/geoparsetext/geoparsetext.component.jsx';
import Placelookup from './pages/placelookup/placelookup.component.jsx';

class App extends React.Component {

  constructor() {
    super()
    this.state = {
      backendURL: "http://localhost:5000" 
    }
  }

  render() {
    return (
      <Router>
        <div className="App">
          <div className="app-container">
            <Header/>
            <div className='page-container'>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/excel" element={<Excel backendURL={this.state.backendURL}/>} />
                <Route path="/geoparsetext" element={<Geoparsetext backendURL={this.state.backendURL}/>} />
                <Route path="/placelookup" element={<Placelookup backendURL={this.state.backendURL}/>} />
              </Routes>
            </div>
            <Footer/>
          </div>
        </div>
      </Router>
    )
  }
  
  
}

export default App;
