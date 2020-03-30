import React from 'react';
import './login.css';
import LoginLogoTop from '../../assets/images/college.png';
import LoginLogoBot from '../../assets/images/book.png';
import HandLogo from '../../assets/images/women_hand.png';
import AbstractLogo from '../../assets/images/abstrakt-design-03.png';
import { Redirect } from 'react-router-dom';
import Parallax from 'parallax-js';

class Login extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showLogin: true,
            starWidths: ["", "", ""],
            starAngles: ["", "", ""],
            new_username: '',
            new_password: '',
            confirm_password: '',
            signup_error: '',
            username: '',
            password: '',
            login_error: '',
            loggedIn: false
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleNewUsername = this.handleNewUsername.bind(this);
        this.handleNewPassword = this.handleNewPassword.bind(this);
        this.handleConfirmPassword = this.handleConfirmPassword.bind(this);
        this.handleUsername = this.handleUsername.bind(this);
        this.handlePassword = this.handlePassword.bind(this);
        this.handleLogin = this.handleLogin.bind(this);
    }

    componentDidMount() {
        window.addEventListener('resize', this.updateStar);
        this.updateStar();
        //new Parallax(this.refs.scene);
    }

    // FRONT END LOGIC
    shift = () => {
        this.setState({
            showLogin: !this.state.showLogin
        })
    }

    updateStar = () => {
        var stars = document.getElementsByClassName("shooting-star");
        var starWidths = [];
        var starAngles = [];
        for (var i = 0; i < stars.length; i++) {
            var w = stars[i].offsetWidth;
            var h = stars[i].offsetHeight;
            var d = Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2));
            var a = 90 - Math.acos(h/d) * (180 / Math.PI);
            starWidths.push((d*0.9).toString() + "px");
            starAngles.push(a.toString() + "deg")
        }
        this.setState({
            starWidths: starWidths,
            starAngles: starAngles
        });
    }

    // FORM LOGIC

    handleSubmit(event) {
        if(this.state.new_password != this.state.confirm_password) {
            this.setState({signup_error: "Your passwords do not match."});
        } else {
            this.props.createPopup({
                title: "CREATING ACCOUNT",
                content: "Our server is currently performing a first-time creation of your account."
            });
            const requestOptions = {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username: this.state.new_username, 
                    password: this.state.new_password
                })
            };
            fetch('https://chads4us.herokuapp.com/register', requestOptions)
                .then(data => {
                    if(data.status != 200) {
                        data.json().then(res => {
                            this.setState({signup_error: res.error});
                        });
                    } else {
                        this.setState({
                            new_username: "",
                            new_password: "",
                            confirm_password: ""
                        });
                        this.props.createPopup({
                            title: "ACCOUNT REGISTERED",
                            content: "Success! Your account has been created."
                        });
                    }
                });
        }
        event.preventDefault();
    }

    handleNewUsername(event) {
        this.setState({new_username: event.target.value});
    }

    handleNewPassword(event) {
        this.setState({new_password: event.target.value});
    }

    handleConfirmPassword(event) {
        this.setState({confirm_password: event.target.value});
    }

    handleLogin(event) {
        this.props.createPopup({
            title: "LOGGING IN",
            content: "Contacting server to validate your credentials."
        });
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                username: this.state.username, 
                password: this.state.password
            })
        };
        fetch('https://chads4us.herokuapp.com/login', requestOptions)
            .then(data => {
                if(data.status != 200) {
                    data.json().then(res => {
                        this.setState({login_error: res.error});
                    });
                } else {
                    var user = this.state.username;
                    this.setState({
                        username: "",
                        password: ""
                    });
                    this.props.createPopup({
                        title: "LOGIN SUCCESSFUL",
                        content: "You will be redirected to home page in a bit."
                    });
                    setTimeout(function() {
                        localStorage.setItem("user", user);
                        document.getElementsByClassName("header")[0].classList = "header";
                        this.setState({
                            loggedIn: true
                        });
                    }.bind(this), 2000);
                }
            });
        event.preventDefault();
    }

    handleUsername(event) {
        this.setState({username: event.target.value});
    }

    handlePassword(event) {
        this.setState({password: event.target.value});
    }

    render() {
        if (localStorage.getItem("user") || this.state.loggedIn == true) {
            return <Redirect to="/profile" />
        }
        const showLeft = this.state.showLogin ? 'showing' : '';
        const showInfo = this.state.showLogin ? 'showingInfo' : '';
        const showStar1 = this.state.showLogin ? 'showingStar-1' : '';
        const showStar2 = this.state.showLogin ? 'showingStar-2' : '';
        const showStar3 = this.state.showLogin ? 'showingStar-3' : '';
        const showRight = this.state.showLogin ? '' : 'showing';
        const hideLeft = this.state.showLogin ? '' : 'showRight';
        const showLogo = this.state.showLogin ? '' : 'showingLogo';
        return(
            <div className="login-container">
                <div className={`login-left ${showLeft}`}>
                    <div className="star-show">
                        <div className="stars">
                            <div className={`shooting-star star-1 ${showStar1}`}>
                                <div className="trail" style={{width: this.state.starWidths[0], transform: `rotate(${this.state.starAngles[0]})`}}>
                                </div>
                                <i className="fas fa-star star"></i>
                            </div>
                            <div className={`shooting-star star-2 ${showStar2}`}>
                                <div className="trail" style={{width: this.state.starWidths[1], transform: `rotate(${this.state.starAngles[1]})`}}>
                                </div>
                                <i className="fas fa-star star"></i>
                            </div>
                            <div className={`shooting-star star-3 ${showStar3}`}>
                                <div className="trail" style={{width: this.state.starWidths[2], transform: `rotate(${this.state.starAngles[2]})`}}>
                                </div>
                                <i className="fas fa-star star"></i>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={this.handleSubmit} className={`main ${showInfo}`}>
                        <div className="login-subtitle-2">
                            YOUR DREAM COLLEGE
                        </div>
                        <div className="login-info">
                            ONE SEARCH AT A TIME
                        </div>
                        <div className="sign-up">
                            <div className="sign-up-field-top sign-up-top-ovr">
                                USERNAME
                                <br />
                                <input className="sign-up-input" type="text" value={this.state.new_username} onChange={this.handleNewUsername} />
                            </div>
                            <div className="sign-up-field">
                                PASSWORD
                                <br />
                                <input type="password" value={this.state.new_password} onChange={this.handleNewPassword} className="sign-up-input" />
                            </div>
                            <div className="sign-up-field">
                                CONFIRM PASSWORD
                                <br />
                                <input type="password" value={this.state.confirm_password} onChange={this.handleConfirmPassword} className="sign-up-input" />
                            </div>
                        </div>
                        <div className="sign-up-subtitle-top subtitle">
                            WHAT AM I SIGNING UP FOR&nbsp;
                            <i className="fas fa-angle-right"></i>
                            <i className="fas fa-angle-right"></i>
                        </div>
                        <div className="sign-up-subtitle-bottom subtitle">
                            ASK US ANYTHING&nbsp;
                            <i className="fas fa-angle-right"></i>
                            <i className="fas fa-angle-right"></i>
                        </div>
                        <div className="btn-subtitle">
                            <span>CONTINUE YOUR JOURNEY&nbsp;</span>
                            <i className="fas fa-angle-right"></i>
                            <i className="fas fa-angle-right"></i>
                            <i className="fas fa-angle-right"></i>
                        </div>
                        <div className="signup-error">{this.state.signup_error}</div>
                        <input disabled={this.state.new_username.trim() == '' || this.state.new_password.trim() == '' || this.state.confirm_password.trim() == ''} className="sign-up-btn" type="submit" value="SIGN UP" />
                    </form>
                    <div className="login-logo">
                        <img className={`login-logo-img-top ${showLogo}`} alt="login" src={LoginLogoTop} />
                        <img className={`login-logo-img-bottom ${showLogo}`} alt="login" src={LoginLogoBot} />
                    </div>
                    <div className={`land ${showInfo}`}>
                        <img alt="hand" src={HandLogo} />
                    </div>
                    <div className={`login-footer ${showInfo}`}>
                        <div className="login-footer-wide">
                            <i className="far fa-copyright"></i> CHADS <span className="login-footer-wide-small">made with react</span>
                        </div>
                        <div className="login-footer-thin">
                            <i className="fab fa-facebook-f"></i>
                        </div>
                        <div className="login-footer-thin">
                            <i className="fab fa-twitter"></i>
                        </div>
                        <div className="login-footer-thin">
                            <i className="fab fa-instagram"></i>
                        </div>
                    </div>
                </div>
                <div className="login-shift">
                    <div className="shift-btn" onClick={this.shift}>
                        <i className="shift-icon far fa-star"></i>
                    </div>
                </div>
                <div className={`login-right ${showRight}`}>
                    <div className={`login-panel  ${hideLeft}`}>
                        <div className="login-banner">
                            <div className="login-logo">
                                <img src={AbstractLogo} />
                                <div className="login-title">C4ME</div>
                            </div>
                            <div className="login-banner-info">
                                <ul>
                                    <li>
                                        Empower yourself.
                                    </li>
                                    <li>
                                        Be collaborative.
                                    </li>
                                    <li>
                                        <strong>Find your future.</strong>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <form onSubmit={this.handleLogin} className="login-form">
                            <h1 className="login-form-title">Login</h1>
                            <p>USERNAME</p>
                            <input className="login-username" type="text" onChange={this.handleUsername} value={this.state.username}/>
                            <p>PASSWORD</p>
                            <div className="password-wrapper">
                                <i className="fas fa-eye"></i>
                                <input className="login-password" type="password" onChange={this.handlePassword} value={this.state.password}/>
                            </div>
                            <div className="login-form-err">{this.state.login_error}</div>
                            <input disabled={this.state.username.trim() == '' || this.state.password.trim() == ''} className="login-form-btn" type="submit" value="LET'S GO"/>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

export default Login;