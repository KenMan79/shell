// Copyright (C) 2020 Really Awesome Technology Ltd
//
// This file is part of RACTF.
//
// RACTF is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// RACTF is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with RACTF.  If not, see <https://www.gnu.org/licenses/>.

import React, { useState, useContext, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import {
    Button, Input, TextBlock, Form, FormError, PageHead, Link, Row, FlashText,
    Markdown, Badge, Page
} from "@ractf/ui-kit";
import { useHint, attemptFlag, reloadAll } from "@ractf/api";
import { appContext, plugins } from "ractf";
import http from "@ractf/http";

import Split from "./Split";
import File from "./File";
import Hint from "./Hint";

import "./Challenge.scss";
import { useConfig } from "@ractf/util";


export default ({ challenge, category, rightComponent }) => {
    const [flagValid, setFlagValid] = useState(false);
    const [message, setMessage] = useState(null);
    const [locked, setLocked] = useState(false);
    const onFlagResponse = useRef();

    const flag_prefix = useConfig("flag_prefix", "flag");
    const user = useSelector(state => state.user);
    const app = useContext(appContext);

    const { t } = useTranslation();

    const escape = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flagRegex = () => {
        let regex = challenge.challenge_metadata.flag_regex;
        let partial = challenge.challenge_metadata.flag_partial_regex;
        let format_string;
        if (!regex || !partial) {
            regex = new RegExp("^" + escape(flag_prefix) + "{.+}$");
            partial = "";
            for (let i = 0; i < flag_prefix.length; i++) {
                partial += "(?:" + escape(flag_prefix[i]) + "|$)";
            }
            partial = new RegExp("^" + partial + "(?:{|$)(?:[^}]+|$)(?:}|$)$");
            format_string = flag_prefix + "{...}";
        } else {
            format_string = regex.toString();
        }
        return [regex, partial, format_string];
    };
    const [regex, partial, format_string] = flagRegex();

    const changeFlag = (flag) => {
        if (challenge.challenge_type === "freeform" || challenge.challenge_type === "longText")
            return setFlagValid(!!flag);
        setFlagValid(regex.test(flag));
    };

    const promptHint = (hint) => {
        return () => {
            if (hint.used) return app.alert(hint.name + ":\n" + hint.text);

            const msg = <>
                Are you sure you want to use a hint?<br /><br />
                This hint will deduct {hint.penalty} points from this challenge.
            </>;
            app.promptConfirm({ message: msg, small: true }).then(() => {
                useHint(hint.id).then(body =>
                    app.alert(hint.name + ":\n" + body.text)
                ).catch(e =>
                    app.alert("Error using hint:\n" + http.getError(e))
                );
            }).catch(() => { });
        };
    };

    const tryFlag = challenge => {
        return ({ flag }) => {
            setLocked(true);
            attemptFlag(flag, challenge).then(resp => {
                if (resp.correct) {
                    app.alert("Flag correct!");
                    if (onFlagResponse.current)
                        onFlagResponse.current(true);
                    challenge.solved = true;

                    // NOTE: This is potentially very slow. If there are performance issues in production, this is
                    // where to look first!
                    reloadAll();
                    /*  // This is the start of what would be the code to rebuild the local cache
                    api.challenges.forEach(group => group.chals.forEach(chal => {
                        if (chal.deps.indexOf(challenge.id) !== -1) {
                            chal.lock = false;
                        }
                    }));
                    */
                } else {
                    app.alert("Incorrect flag");
                }
                setLocked(false);
            }).catch(e => {
                setMessage(http.getError(e));
                if (onFlagResponse.current)
                    onFlagResponse.current(false, http.getError(e));
                setLocked(false);
            });
        };
    };

    let flagInput = null;
    switch (challenge.challenge_type) {
        case "code":
            break;
        case "map":
            break;
        case "freeform":
            flagInput = <Input placeholder="Flag"
                name={"flag"} onChange={changeFlag}
                light monospace autoFocus
                center width={"80%"} />;
            break;
        case "longText":
            flagInput = <Input rows={5} placeholder="Flag text"
                format={partial} name={"flag"} autoFocus
                onChange={changeFlag} light monospace
                center width={"80%"} />;
            break;
        default:
            flagInput = <Input placeholder={"Flag format: " + format_string}
                format={partial} name={"flag"} autoFocus
                onChange={changeFlag} light monospace
                center width={"80%"} />;
            break;
    }

    const challengeMods = [];
    Object.keys(plugins.challengeMod).forEach(key => {
        const i = plugins.challengeMod[key];
        if (!i.check || i.check(challenge, category)) {
            challengeMods.push(React.createElement(i.component, {
                challenge: challenge, category: category, key: key,
            }));
        }
    });

    let rightSide = null;
    if (rightComponent)
        rightSide = React.createElement(rightComponent, { challenge: challenge });

    const chalContent = <>
        {challengeMods}
        <Row>
            <TextBlock>
                <Markdown source={challenge.description} />
            </TextBlock>
        </Row>

        {challenge.files && !!challenge.files.length && <div className={"challengeLinkGroup"}>
            {challenge.files.map(file =>
                file && <File name={file.name} url={file.url} size={file.size} key={file.id} id={file.id} />
            )}
        </div>}
        {user.team && challenge.hints && !!challenge.hints.length && <div className={"challengeLinkGroup"}>
            {challenge.hints && !challenge.solved && challenge.hints.map((hint, n) => {
                return <Hint name={hint.name} onClick={promptHint(hint)} hintUsed={hint.used}
                    points={hint.penalty} id={hint.id} key={hint.id} />;
            })}
        </div>}

        {challenge.solved ? <Row>
            {t("challenge.already_solved")}
        </Row> : user.team ? <Row>
            <Form handle={tryFlag(challenge)} locked={locked}>
                {flagInput && <>
                    {flagInput}
                    {message && <FormError>{message}</FormError>}
                    <Row>
                        <Button disabled={!flagValid} submit>{t("challenge.attempt")}</Button>
                    </Row>
                </>}
            </Form>
        </Row> : <FlashText danger title={t("challenge.no_team")}>
                    <Row>
                        <Button to={"/team/new"}>{t("join_a_team")}</Button>
                        <Button to={"/team/new"}>{t("create_a_team")}</Button>
                    </Row>
                </FlashText>}
    </>;

    const tags = <>
        <Badge pill primary>{category.name}</Badge>
        <Badge pill primary>{challenge.author}</Badge>
    </>;

    const solveMsg = (challenge.first_blood_name
        ? t("challenge.has_solve", { name: challenge.first_blood_name, count: challenge.solve_count })
        : t("challenge.no_solve"));

    const leftSide = <Page>
        <PageHead
            subTitle={<>{t("point_count", { count: challenge.score })} - {solveMsg}</>}
            back={<Link className={"backToChals"} to={".."}>{t("back_to_chal")}</Link>}
            title={challenge.name} tags={tags}
        />
        <Row style={{ position: "absolute", top: 16, right: 32 }} right>
            <Button to="#edit" danger>{t("edit")}</Button>
        </Row>
        {chalContent}
    </Page>;

    if (!rightSide) return leftSide;

    return <Page title={challenge ? challenge.name : "Challenges"} noWrap={!!rightSide}>
        <Split submitFlag={tryFlag(challenge)} onFlagResponse={onFlagResponse}>
            {leftSide}
            {rightSide}
        </Split>
    </Page>;
};
