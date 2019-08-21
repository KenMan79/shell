import React, { Component } from 'react';
import { Normalize } from 'styled-normalize';
import styled, { createGlobalStyle } from 'styled-components';
import Particles from 'react-particles-js';
import { BrowserRouter } from "react-router-dom";

import particles_js_config from "../../partices_js_config.js";
import Routes from "./Routes";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { API, APIContext } from "./API";

import theme from "theme";


const VimMode = styled.div`
    background-color: #000;
    color: #0f0;
    width: 100vw;
    height: 100vh;
    white-space: pre-line;
    font-family: 'Roboto Mono', monospace;
    position: fixed;
    left: 0;
    top: 0; 
    padding: 16px;

    ::after {
        content: "█";
        animation: 1s blink step-end infinite;
      }
      
    @keyframes "blink" {
        from, to {
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
    }
`;

const GlobalStyle = createGlobalStyle`
    * {
        box-sizing: border-box;
    }

    body, html {
        font-family: 'Roboto Mono', monospace;
        background-color: ${theme.bg};
        color: ${theme.fg};
        min-height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
    }

    #root {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        position: relative;
        z-index: 1;
        width: 100%;
        align-items: center;
    }

    a {
        text-decoration: none;
        color: #337ab7;
        margin: 0;
        padding: 0;

        &:hover {
            color: #23527c;
            text-decoration: underline;
        }
    }
`;

const StyledParticles = styled(Particles)`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
`;

const SiteWarning = styled.div`
    position: fixed;
    background-color: #ac1010;
    box-shadow: 5px 0 5px #000;
    top: 60px;
    left: 0;
    width: 100%;
    padding: 10px 20px;
    text-align: center;
`;

const PageWrap = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
`;
const PageBody = styled.div`
    flex-grow: 1;
`;

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            particles_js: false,
            console: false
        }

        this.magic = [27, 16, 186, 81, 16, 49, 13]
        this.current = [];
    }

    _handleKeyDown = (event) => {
        if (event.keyCode === 16 && this.current[this.current.length - 1] === 16)
            return
        this.current.push(event.keyCode);
        if (this.current.length > this.magic.length)
            this.current = this.current.slice(this.current.length - this.magic.length, this.current.length);
        if (JSON.stringify(this.current) === JSON.stringify(this.magic))
            this.setState({console: true});
    }
    componentDidMount(){
        document.addEventListener("keydown", this._handleKeyDown);
    }
    componentWillUnmount() {
        document.removeEventListener("keydown", this._handleKeyDown);
    }

    render() {
        if (this.state.console) return <VimMode>
            <GlobalStyle />
            {`[www-data@ractfhost1 shell]$ npm run build
[www-data@ractfhost1 shell]$ python3.7 -m http.server --directory build 80
Serving HTTP on 0.0.0.0 port 80 (http://0.0.0.0:80/) ...

Keyboard interrupt received, exiting.

[www-data@ractfhost1 shell]$ `}
        </VimMode>;
        return (
            <BrowserRouter>
                <API><APIContext.Consumer>{api => <>
                    {/* TODO: Use api.ready */}

                    {!api.ready ? <SiteWarning>
                        Site operating in offline mode:
                        Failed to connect to the primary servers!<br />
                        Functionality will be limited until service is restored.
                    </SiteWarning> : null}

                    {this.state.particles_js ? <StyledParticles params={particles_js_config} /> : null}
                    <Normalize />
                    <GlobalStyle />
                    <PageWrap>
                        <Header />
                        <PageBody>
                            <Routes />
                        </PageBody>
                        <Footer />
                    </PageWrap>
                </>}</APIContext.Consumer></API>
            </BrowserRouter>
        );
    }
}

export default App;
