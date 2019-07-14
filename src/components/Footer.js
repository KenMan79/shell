import React from "react";
import { Link } from "react-router-dom";
import styled, { css } from 'styled-components';


const Foot = styled.footer`
    width: 100%;
    background-color: #111023bb;
    position: fixed;
    left: 0;
    bottom: 0;
    max-height: 34px;

    padding: 10px 20px;
    padding-top: 0;
    color: #fff;
    font-size: .8em;
    position: relative;

    overflow-y: hidden;
    transition: max-height 500ms ease-in-out;

    &:hover {
        max-height: 250px;
    }
`;

const ColStyle = styled.div`
    flex-shrink: 0;
    flex-grow: 1;
    min-width: 150px;

    ${props => props.right && css`
        text-align: right;
    `}

    >* {
        margin: 5px 10px;
    }
`;

const ColHead = styled.div`
    font-weight: 500;
`;

const FootTop = styled.div`
    height: 34px;
    display: flex;
    align-items: center;
    font-size: 1.1em;

    @media (max-width: 700px) {
        font-size: .8em;
    }
`;

const FootCol = (props) => (
    <ColStyle right={props.right}>
        {props.title
            ? <ColHead>{props.title}</ColHead>
            : null}
        {props.children}
    </ColStyle>
);
const LogoutLink = styled(Link)`
    color: #f00;
`;
const FootMainWrap = styled.div`
    display: flex;
    flex-wrap: wrap;
`;
const FG = styled.div`flex-grow: 1`;


const FootLink = (props) => <p><Link to={props.to}>{props.children}</Link></p>;
const FootText = (props) => <FootTop>
    <span>0% complete | Ranked #0 on leaderboard | 0 hints used | 0 points | 0 challenges solved</span>
    <FG />
    <LogoutLink to={"/logout"}>Logout</LogoutLink>
</FootTop>;
const FootMain = () => <FootMainWrap>
    <FootCol title={"RACFT"}>
        <FootLink to={"/about"}>About</FootLink>
        <FootLink to={"/conduct"}>Code of Conduct</FootLink>
        <FootLink to={"/privacy"}>Privacy Policy</FootLink>
        <FootLink to={"/support"}>Support</FootLink>
    </FootCol>
    <FootCol title={"Social"}>
        <FootLink to={"/discord"}>Discord</FootLink>
    </FootCol>
    <FootCol right>
        <p>&copy; 2019 RACTF Team</p>
    </FootCol>
</FootMainWrap>;

export default () => (
    <Foot>
        <FootText />
        <FootMain />
    </Foot>
);
