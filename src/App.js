// LIBRARIES
import React from "react";
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom";

// ASSETS
import avatarImage from './assets/images/ralph.jpg';

// COMPONENTS
import Login from './components/login/login.js';
import Home from './components/home/home.js';
import Profile from './components/profile/profile.js';
import Collegesearch from './components/collegesearch/collegesearch.js';
import keyIndex from 'react-key-index';
import { logDOM } from "@testing-library/react";
import Modal from './components/modal/modal.js';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
          popups: [],
          showMenu: false,
          showModal: false,
          modalOps: null,
          modalCallback: null
        }

        //localStorage.clear();

        this.createPopup = this.createPopup.bind(this);
        this.removePopup = this.removePopup.bind(this);
        this.handleMenu = this.handleMenu.bind(this);
        this.handleSignout = this.handleSignout.bind(this);
        this.shiftPopup = this.shiftPopup.bind(this);
        this.showModal = this.showModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.handleScrapeRankings = this.handleScrapeRankings.bind(this);
        this.handleImportProfiles = this.handleImportProfiles.bind(this);
        this.handleImportScorecard = this.handleImportScorecard.bind(this);
        this.handleDeleteProfiles = this.handleDeleteProfiles.bind(this);
        this.handleScrapeData = this.handleScrapeData.bind(this);
    }

    componentDidMount() {
      this.interval = setInterval(function() {
        if(localStorage.getItem("popups") != "[]" && localStorage.getItem("popups")) {
          var popups = JSON.parse(localStorage.getItem("popups"));
          var timestamps = JSON.parse(localStorage.getItem("popups_timestamps"));
          for (var x = 0; x < popups.length; x++) {
            timestamps[x] -= 500;
          }
          var set = false;
          while(timestamps[0] <= 0) {
            popups.shift();
            timestamps.shift();
            set = true;
          }
          localStorage.setItem("popups", JSON.stringify(popups))
          localStorage.setItem("popups_timestamps", JSON.stringify(timestamps));
          if(set) {
            this.setState({popups: []});
          }
          // if(timestamps[0] <= 0) {
          //   popups.shift();
          //   timestamps.shift();
          //   localStorage.setItem("popups", JSON.stringify(popups))
          //   localStorage.setItem("popups_timestamps", JSON.stringify(timestamps));
          //   this.setState({popups: []});
          // } else {
          //   localStorage.setItem("popups", JSON.stringify(popups))
          //   localStorage.setItem("popups_timestamps", JSON.stringify(timestamps));
          // }
        }
      }.bind(this), 500);
    }

    shiftPopup() {
      // if(localStorage.getItem("popups") != "[]") {
      //   localStorage.setItem("shifting", "yes");
      //   clearTimeout(parseInt(localStorage.getItem("id")));
      //   const id = setTimeout(function() {
      //       var array = [...(localStorage.getItem("popups") ? JSON.parse(localStorage.getItem("popups")) : [])];
      //       array.shift();
      //       localStorage.setItem("popups", JSON.stringify(array))
      //       this.setState({
      //         popups: array
      //       });
      //       this.shiftPopup();
      //   }.bind(this), 5000);
      //   localStorage.setItem("id", id.toString());
      // } else {
      //   localStorage.setItem("shifting", "");
      // }
    }

    handleSignout() {
      this.createPopup({
        title: "SIGNING OUT",
        content: "Thank you for using C4ME. Come back soon!"
      })
      localStorage.setItem("user", "");
      this.setState({showMenu: false});
    }

    createPopup(ops) {
      var array = [...(localStorage.getItem("popups") ? JSON.parse(localStorage.getItem("popups")) : [])];
      array.push(ops);
      localStorage.setItem("popups", JSON.stringify(array));
      if (!localStorage.getItem("shifting")) {
        this.shiftPopup();
      }
      var timestamps = [...(localStorage.getItem("popups_timestamps") ? JSON.parse(localStorage.getItem("popups_timestamps")) : [])];
      timestamps.push(5000);
      localStorage.setItem("popups_timestamps", JSON.stringify(timestamps));
      this.setState({showMenu: this.state.showMenu});
    }

    removePopup(key) {
      this.setState({popups: this.state.popups.splice(key, 1)});
    }

    handleMenu() {
      this.setState({
        showMenu: !this.state.showMenu
      });
    }

    showModal(ops, callback) {
      this.setState({
        showModal: true,
        modalOps: ops,
        modalCallback: callback
      });
    }

    closeModal() {
      this.setState({
        showModal: false
      });
    }

    handleScrapeRankings() {
      this.createPopup({
          title: "SCRAPE COLLEGE RANKINGS",
          content: "The request to scrape college rankings has been sent."
      });
      const requestOptions = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      };
      fetch('https://chads4us.herokuapp.com/scraperankings', requestOptions)
      .then(data => {
          if(data.status != 200) {
              data.json().then(res => {
                  this.props.createPopup({
                      title: "ADMIN ERROR",
                      content: "Error: " + res.error
                  });
              });
          } else {
              this.createPopup({
                  title: "SCRAPED COLLEGE RANKINGS",
                  content: "College rankings have ben scraped."
              });
          }
      });
    }

    handleImportScorecard() {
      const requestOptions = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      };
      fetch('https://chads4us.herokuapp.com/importscorecard', requestOptions)
      .then(data => {
          if(data.status != 200) {
              data.json().then(res => {
                  this.props.createPopup({
                      title: "PROFILE ERROR",
                      content: "No such user exists."
                  });
              });
          } else {
              data.json().then(res => {
                  this.setState({
                      userInfo: res,
                      old_userInfo: res
                  });
              });
          }
      });
    }

    handleScrapeData() {
      this.createPopup({
          title: "SCRAPE COLLEGE DATA",
          content: "The request to scrape college data has been sent."
      });
      const requestOptions = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      };
      fetch('https://chads4us.herokuapp.com/scrapecollegedata', requestOptions)
      .then(data => {
          if(data.status != 200) {
              data.json().then(res => {
                  this.props.createPopup({
                      title: "ADMIN ERROR",
                      content: "Error: " + res.error
                  });
              });
          } else {
            this.createPopup({
                title: "SCRAPED COLLEGE DATA",
                content: "The request to scrape college rankings has been sent."
            });
          }
      });
    }

    handleDeleteProfiles() {
      this.createPopup({
          title: "DELETING PROFILES",
          content: "The request for deleting profiles has been sent."
      });
      const requestOptions = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      };
      fetch('https://chads4us.herokuapp.com/deleteprofiles', requestOptions)
      .then(data => {
          if(data.status != 200) {
              data.json().then(res => {
                  this.props.createPopup({
                      title: "ADMIN ERROR",
                      content: "Error: " + res.error
                  });
              });
          } else {
            this.createPopup({
                title: "DELETED PROFILES",
                content: "All student profiles have been deleted."
            });
          }
      });
    }

    handleImportProfiles() {
      this.createPopup({
          title: "IMPORT PROFILES",
          content: "The request to import student profiles has been sent."
      });
      const requestOptions = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      };
      fetch('https://chads4us.herokuapp.com/importprofiles', requestOptions)
      .then(data => {
          if(data.status != 200) {
              data.json().then(res => {
                  this.props.createPopup({
                      title: "ADMIN ERROR",
                      content: "Error: " + res.error
                  });
              });
          } else {
            this.createPopup({
                title: "IMPORTED PROFILES",
                content: "All student profiles have been imported."
            });
          }
      });
    }

    componentWillUnmount() {
      clearInterval(this.interval);
    }

    render() {
      if(localStorage.getItem("popups")) {
        this.shiftPopup();
      }
      var arr = [];
      var pops = JSON.parse(localStorage.getItem("popups")) ? JSON.parse(localStorage.getItem("popups")) : [];
      for(var i = 0; i < pops.length; i++) {
        arr.push({
          id: i,
          value: pops[i]
        })
      }
      const popups = arr.map((e) =>
        <div key={e.id} className="popup">
        <i className="popup-icon fas fa-times"></i>
        <div className="popup-title">{e.value.title}</div>
        <div className="popup-content">
          {e.value.content}
        </div>
        </div> 
      );
      var adminPanel="";

      if(true) {
        adminPanel= [
          <div key="1a" onClick={() => this.showModal({
            title: "Confirm Admin Action",
            content: "Are you sure you want to scrape the college rankings?"
          }, this.handleScrapeRankings)} className={`menu-btn ${this.state.showMenu ? 'menu-btn-active' : ''}`}>
            <i className="fas fa-database"></i>
          </div>,
          <div key="1b" onClick={() => this.showModal({
            title: "Confirm Admin Action",
            content: "Are you sure you want to scrape the college data?"
          }, this.handleScrapeData)} className={`menu-btn ${this.state.showMenu ? 'menu-btn-active' : ''}`}>
            <i className="fas fa-table"></i>
          </div>,
          <div key="1c" onClick={() => this.showModal({
            title: "Confirm Admin Action",
            content: "Are you sure you want to delete all student profiles?"
          }, this.handleDeleteProfiles)} className={`menu-btn ${this.state.showMenu ? 'menu-btn-active' : ''}`}>
            <i className="fas fa-user-minus"></i>
          </div>,
          <div key="1d" onClick={() => this.showModal({
            title: "Confirm Admin Action",
            content: "Are you sure you want to import all student profiles?"
          }, this.handleImportProfiles)} className={`menu-btn ${this.state.showMenu ? 'menu-btn-active' : ''}`}>
            <i className="fas fa-user-plus"></i>
          </div>
        ]
        
      }

      var re = '';
      if(!localStorage.getItem("user")) {
        re = <Redirect to="/login" />
      }
        return(
            <div>
              <Modal onClose={this.closeModal} show={this.state.showModal} ops={this.state.modalOps} callback={this.state.modalCallback}/>
              <div className="popups">
                {popups}
              </div>
              <Router>
                {re}
                <div>
                  <div className="root">
                    <div className={`header ${localStorage.getItem("user") ? '' : 'notLoggedIn'}`}>
                      <div className={`avatar-wrapper ${this.state.showMenu ? 'avatar-wrapper-menu' : ''}`} onClick={this.handleMenu}>
                        <div className={`avatar ${this.state.showMenu ? 'avatar-menu' : ''}`}></div>
                      </div>
                        <Link to="/profile" className={`menu-btn ${this.state.showMenu ? 'menu-btn-active' : ''}`}>
                          <i className="far fa-user"></i>
                        </Link>
                        <Link to="/" className={`menu-btn ${this.state.showMenu ? 'menu-btn-active' : ''}`}>
                          <i className="fas fa-university"></i>
                        </Link>
                        <Link to="/collegesearch" className={`menu-btn ${this.state.showMenu ? 'menu-btn-active' : ''}`}>
                          <i className="fas fa-chalkboard"></i>
                        </Link>
                        <div onClick={this.handleSignout} className={`menu-btn ${this.state.showMenu ? 'menu-btn-active' : ''}`}>
                          <i className="fas fa-sign-out-alt"></i>
                        </div>    
                        {adminPanel}             
                    </div>
                  </div>

                  <div className="content">
                    <Switch>
                      <Route exact path="/">
                        <Home />
                      </Route>
                      <Route path="/login">
                        <Login createPopup={this.createPopup}/>
                      </Route>
                      <Route path="/profile">
                        <Profile createPopup={this.createPopup}/>
                      </Route>
                      <Route path="/collegesearch">
                        <Collegesearch createPopup={this.createPopup}/>
                      </Route>
                    </Switch>
                  </div>
                </div>
              </Router>
            </div>
        );
    }
}

export default App;


// You can think of these components as "pages"
// in your app.

function HomeComponent() {
  return (
    <Home />
  );
}

function LoginComponent(props) {
  return (
    <Login />
  );
}

function ProfileComponent() {
  return (
    <Profile />
  )
}

function CollegesearchComponent() {
  return (
    <Collegesearch />
  )
}