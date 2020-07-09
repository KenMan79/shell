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

import React, { useContext } from "react";
import { useTranslation } from "react-i18next";

import {
    Form, Input, Row, Checkbox, Button, Select, HR, PageHead, Link, Tab,
    TabbedView, FlashText, FormGroup, Spoiler
} from "@ractf/ui-kit";
import { plugins, appContext } from "ractf";
import { newHint, newFile } from "@ractf/api";
import http from "@ractf/http";

import File from "./File";
import Hint from "./Hint";


const MetadataEditor = ({ challenge, category, save }) => {
    const fields = [];
    const generateFields = (fields, key = "", n = 0) => {
        const retFields = [];

        fields.forEach(field => {
            switch (field.type) {
                case "multiline":
                case "code":
                case "text":
                case "number":
                    const val = challenge.challenge_metadata[field.name];
                    const format = field.type === "number" ? /\d+/ : /.+/;
                    retFields.push(<FormGroup htmlFor={field.name} label={field.label} key={key + (n++)}>
                        <Input val={val !== undefined ? val.toString() : undefined} name={field.name}
                            placeholder={field.label} format={format}
                            rows={field.type === "multiline" || field.type === "code" ? 5 : ""}
                            monospace={field.type === "code"} />
                    </FormGroup>);
                    break;
                case "select":
                    const idx = field.options.map(i => i.key).indexOf(challenge.challenge_metadata[field.name]);
                    retFields.push(<FormGroup key={key + (n++)} htmlFor={field.name} label={field.label}>
                        <Select name={field.name} options={field.options}
                            initial={idx !== -1 ? idx : 0} />
                    </FormGroup>);
                    break;
                case "label":
                    retFields.push(<div key={key + (n++)}>{field.label}</div>);
                    break;
                case "hr":
                    retFields.push(<HR key={key + (n++)} />);
                    break;
                case "group":
                    retFields.push(<Spoiler key={key + (n++)} title={field.label}>
                        {generateFields(field.children)}
                    </Spoiler>);
                    break;
                default:
                    retFields.push(<div key={key + (n++)}>Unknown field type: {field.type}</div>);
                    break;
            }
        });
        return retFields;
    };

    Object.keys(plugins.challengeMetadata).forEach(key => {
        const i = plugins.challengeMetadata[key];
        if (!i.check || i.check(challenge, category)) {
            fields.push(...generateFields(i.fields, key, fields.length));
        }
    });
    const saveEdit = (changes) => {
        save({
            ...challenge, challenge_metadata: {
                ...challenge.challenge_metadata,
                ...changes
            }
        });
    };

    return <div style={{ width: "100%" }}><Form handle={saveEdit}>
        {fields}
        <Row>
            <Button submit>Save Edit</Button>
        </Row>
    </Form></div>;
};

const HintEditor = ({ challenge }) => {
    const app = useContext(appContext);

    const addHint = () => {
        app.promptConfirm({ message: "New hint" },
            [{ name: "name", placeholder: "Hint name", label: "Name" },
            { name: "cost", placeholder: "Hint cost", label: "Cost", format: /\d+/ },
            { name: "body", placeholder: "Hint text", label: "Message", rows: 5 }]
        ).then(({ name, cost, body }) => {

            if (!cost.match(/\d+/)) return app.alert("Invalid file size!");

            newHint(challenge.id, name, cost, body).then(() =>
                app.alert("New hint added!")
            ).catch(e =>
                app.alert("Error creating new hint:\n" + http.getError(e))
            );
        });
    };

    return <>
        <div className={"challengeLinkGroup"}>
            {!challenge.hints || challenge.hints.length === 0
                ? <FlashText danger>No hints added yet!</FlashText>
                : challenge.hints.map(hint =>
                    <Hint key={hint.id} points={hint.penalty} name={hint.name} id={hint.id} body={hint.text} isEdit />
                )
            }
        </div>

        <Row>
            <Button onClick={addHint}>Add Hint</Button>
        </Row>
    </>;
};

const FileEditor = ({ challenge }) => {
    const app = useContext(appContext);

    const addFile = () => {
        app.promptConfirm({ message: "New file", },
            [{ name: "name", placeholder: "File name", label: "Name" },
            { name: "url", placeholder: "File URL", label: "URL" },
            { name: "size", placeholder: "File size", label: "Size (bytes)", format: /\d+/ }]
        ).then(({ name, url, size }) => {
            if (!size.match(/\d+/)) return app.alert("Invalid file size!");

            newFile(challenge.id, name, url, size).then((id) => {
                challenge.files.push(id);
                app.alert("New file added!");
            }).catch(e =>
                app.alert("Error creating new file:\n" + http.getError(e))
            );
        });
    };

    return <>
        <div className={"challengeLinkGroup"}>
            {!challenge.files || challenge.files.length === 0
                ? <FlashText danger>No files added yet!</FlashText>
                : challenge.files.map(file =>
                    file && <File key={file.id} name={file.name} url={file.url} id={file.id} size={file.size} isEdit />
                )
            }
        </div>

        <Row>
            <Button onClick={addFile}>Add File</Button>
        </Row>
    </>;
};


const Editor = ({ challenge, category, isCreator, saveEdit, removeChallenge }) => {
    const { t } = useTranslation();

    return <>
        <PageHead
            title={isCreator ? <>New challenge</> : <>Editing: {challenge.name}</>}
            back={<Link className={"backToChals"} to={"..#edit"}>{t("back_to_chal")}</Link>}
        />
        <TabbedView>
            <Tab label={t("editor.challenge")}>
                <Form handle={saveEdit}>
                    <FormGroup htmlFor={"name"} label={t("editor.chal_name")}>
                        <Input val={challenge.name} name={"name"} placeholder={t("editor.chal_name")} />
                    </FormGroup>
                    <FormGroup htmlFor={"score"} label={t("editor.chal_points")}>
                        <Input val={challenge.score !== undefined ? challenge.score.toString() : undefined}
                            name={"score"} placeholder={t("editor.chal_points")} format={/\d+/} />
                    </FormGroup>
                    <FormGroup htmlFor={"author"} label={t("editor.chal_author")}>
                        <Input val={challenge.author} name={"author"} placeholder={t("editor.chal_author")} />
                    </FormGroup>
                    <FormGroup htmlFor={"description"} label={t("editor.chal_brief")}>
                        <Input rows={5} val={challenge.description} name={"description"}
                            placeholder={t("editor.chal_brief")} />
                    </FormGroup>

                    <Row>
                        <Checkbox val={challenge.hidden} name={"hidden"}>
                            {t("editor.hide_challenge")}
                        </Checkbox>
                        <Checkbox val={challenge.auto_unlock} name={"autoUnlock"}>
                            {t("editor.auto_unlock")}
                        </Checkbox>
                    </Row>

                    <FormGroup htmlFor={"challenge_type"} label={t("editor.chal_type")}>
                        <Select options={Object.keys(plugins.challengeType).map(i => ({ key: i, value: i }))}
                            initial={Object.keys(plugins.challengeType).indexOf(challenge.challenge_type)}
                            name={"challenge_type"} />
                    </FormGroup>

                    <FormGroup htmlFor={"flag_type"} label={t("editor.chal_flag_type")}>
                        <Input placeholder={t("editor.chal_flag_type")} name={"flag_type"} monospace
                            val={challenge.flag_type} />
                    </FormGroup>
                    <FormGroup htmlFor={"flag_metadata"} label={t("editor.chal_flag")}>
                        <Input placeholder={t("editor.chal_flag")}
                            name={"flag_metadata"} monospace format={{
                                test: i => { try { JSON.parse(i); return true; } catch (e) { return false; } }
                            }}
                            val={JSON.stringify(challenge.flag_metadata)} />
                    </FormGroup>

                    <Row>
                        {!isCreator && <Button onClick={removeChallenge} danger>{t("editor.remove")}</Button>}
                        <Button submit>{isCreator ? t("editor.create") : t("editor.save")}</Button>
                    </Row>
                </Form>
            </Tab>
            <Tab label={t("editor.files")}>
                {isCreator
                    ? <FlashText danger>Cannot add files to non-existant challenge.</FlashText>
                    : <FileEditor challenge={challenge} />}
            </Tab>
            <Tab label={t("editor.hints")}>
                {isCreator
                    ? <FlashText danger>Cannot add hints to non-existant challenge.</FlashText>
                    : <HintEditor challenge={challenge} />}
            </Tab>
            <Tab label={t("editor.metadata")}>
                <MetadataEditor category={category} challenge={challenge} save={saveEdit} />
            </Tab>
        </TabbedView>
    </>;
};
export default Editor;
