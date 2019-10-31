import { withRouter } from "react-router-dom";
import React, { Component } from "react";
import axios from "axios";

import { APIContext } from "./Contexts";


class APIClass extends Component {
    DOMAIN = process.env.REACT_APP_API_DOMAIN;
    API_BASE = process.env.REACT_APP_API_BASE;
    BASE_URL = this.DOMAIN + this.API_BASE;
    ENDPOINTS = {
        REGISTER: "/auth/register",
        LOGIN: "/auth/login",
        ADD_2FA: "/auth/add_2fa",
        VERIFY_2FA: "/auth/verify_2fa",
        VERIFY: "/auth/verify",

        CHALLENGES: "/challenges/",
        FLAG_TEST: "/challenges/<uuid>/attempt",

        USER_SELF: "/members/self",
        USER: "/members/id/",

        TEAM_CREATE: "/teams/create",
        TEAM_JOIN: "/teams/join",
        TEAM_SELF: "/teams/self",
        TEAM: "/teams/",
    };

    constructor() {
        super();
        
        let userData, challenges, teamData;
        try {
            userData = JSON.parse(localStorage.getItem("userData"));
        } catch (e) {
            userData = undefined;
        }

        try {
            challenges = JSON.parse(localStorage.getItem("challenges"));
        } catch (e) {
            challenges = [];
        }

        try {
            teamData = JSON.parse(localStorage.getItem("teamData"));
        } catch (e) {
            teamData = {};
        }

        this.state = {
            ready: false,
            authenticated: !!userData,
            user: userData,
            challenges: challenges,
            team: teamData,

            login: this.login,
            logout: this.logout,
            verify: this.verify,
            add_2fa: this.add_2fa,
            register: this.register,
            verify_2fa: this.verify_2fa,
            modifyUser: this.modifyUser,
            createTeam: this.createTeam,
            joinTeam: this.joinTeam,
            attemptFlag: this.attemptFlag,

            getError: this.getError,

            _reloadCache: this._reloadCache,
        };
    }

    async componentWillMount() {
        let token = localStorage.getItem('token');
        if (token) {
            this._reloadCache();
        } else {
            this.setState({
                ready: true,
            });
        }
    }

    getError = e => {
        if (e.response && e.response.data) {
            // We got a response from the server, but it wasn't happy with something
            if (e.response.data.m)
                return e.response.data.m;
            return e.response.data.toString();
        } else if (e.message) {
            // We didn't get a response from the server, but the browser is happy to tell us why
            return e.message;
        }
        // TITSUP!
        return "Unknown error occured.";
    };

    get = url => {
        return new Promise((resolve, reject) => {
            axios({
                url: this.BASE_URL + url,
                method: "get",
                headers: this._getHeaders(),
            }).then(response => {
                resolve(response.data);
            }).catch(reject);
        });
    };

    post = (url, data) => {
        return new Promise((resolve, reject) => {
            axios({
                url: this.BASE_URL + url,
                method: "post",
                data: data,
                headers: this._getHeaders(),
            }).then(response => {
                resolve(response.data);
            }).catch(reject);
        });
    };

    _getHeaders = () => {
        let headers = {};
        if (localStorage.getItem("token"))
            headers.Authorization = localStorage.getItem("token");
        return headers;
    };

    _getChallenges = () => this.get(this.ENDPOINTS.CHALLENGES);

    _reloadCache = async () => {
        let userData, teamData, challenges, ready = true;
        try {
            userData = (await this.getUser("self")).d;
        } catch (e) {
            if (e.response && e.response.data)
                return this.logout();
            ready = false;
            this.setState({ ready: false });
        }

        try {
            teamData = (await this.getTeam("self")).d;
        } catch (e) {
            if (e.request && e.request.status === 404) {
                teamData = null;
            } else {
                if (e.response && e.response.data)
                    return this.logout();
                ready = false;
                this.setState({ ready: false });
            }
        }

        try {
            challenges = (await this._getChallenges()).d;
        } catch (e) {
            if (e.response && e.response.data)
                return this.logout();
            ready = false;
        }

        let newState = { ready: ready, authenticated: true };
        if (ready) {
            localStorage.setItem("userData", JSON.stringify(userData));
            localStorage.setItem("teamData", JSON.stringify(teamData));
            localStorage.setItem("challenges", JSON.stringify(challenges));

            newState.user = userData;
            newState.team = teamData;
            newState.challenges = challenges;
        }
        this.setState(newState);
    };

    _postLogin = async token => {
        localStorage.setItem("token", token);
        await this._reloadCache();

        this.props.history.push("/home");
    };

    modifyUser = ({ oPass = null, nPass = null }) => {
        return new Promise((resolve, reject) => {
            reject("Nope.");
        })
    }

    getUser = (id) => {
        return this.get(id === "self" ? this.ENDPOINTS.USER_SELF : this.ENDPOINTS.USER + id);
    };

    getTeam = (id) => {
        return this.get(id === "self" ? this.ENDPOINTS.TEAM_SELF : this.ENDPOINTS.TEAM + id);
    };

    createTeam = (name, password) => {
        return new Promise((resolve, reject) => {
            this.post(this.ENDPOINTS.TEAM_CREATE, { name: name, password: password }
            ).then(async data => {
                let team = (await this.getTeam("self")).d
                this.setState({ team: team });
                localStorage.setItem("teamData", team);

                resolve(data);
            }).catch(reject);
        });
    };

    joinTeam = (name, password) => {
        return new Promise((resolve, reject) => {
            this.post(this.ENDPOINTS.TEAM_JOIN, { name: name, password: password }
            ).then(async data => {
                let team = (await this.getTeam("self")).d
                this.setState({ team: team });
                localStorage.setItem("teamData", team);

                resolve(data);
            }).catch(reject);
        });
    };

    logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('challenges');
        this.setState({
            authenticated: false,
            user: null,
            ready: true,
            challenges: [],
        })
    };

    login = (username, password, otp = null) => {
        let payload = { username: username, password: password }
        if (otp) payload.otp = otp;

        return new Promise((resolve, reject) => {
            this.post(this.ENDPOINTS.LOGIN, payload
            ).then(data => {
                this._postLogin(data.d.token);
                resolve();
            }).catch(reject);
        });
    };

    add_2fa = () => this.post(this.ENDPOINTS.ADD_2FA);
    verify_2fa = (otp) => this.post(this.ENDPOINTS.VERIFY_2FA, { otp: otp });
    verify = (uuid) => this.post(this.ENDPOINTS.VERIFY, { uuid: uuid });

    register = (username, password, email) => {
        return new Promise((resolve, reject) => {
            this.post(this.ENDPOINTS.REGISTER,
                { username: username, password: password, email: email }
            ).then(response => {
                this.props.history.push("/register/email");
                resolve();
                return;
            }).catch(reject)
        });
    };

    attemptFlag = (flag, challenge) => this.post(
        this.ENDPOINTS.FLAG_TEST.replace('<uuid>', challenge.uuid),
        { flag: flag }
    );

    render() {
        return <APIContext.Provider value={this.state}>{this.props.children}</APIContext.Provider>;
    }
}

export const API = withRouter(APIClass);
