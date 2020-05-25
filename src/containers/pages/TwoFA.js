import React, { useContext, useState } from "react";
import { useTranslation } from 'react-i18next';
import QRCode from "qrcode.react";

import {
    Page, Row, Button, Spinner, TextBlock, FormError, H2
} from "@ractf/ui-kit";
import { apiContext, apiEndpoints, appContext } from "ractf";


export default () => {
    const endpoints = useContext(apiEndpoints);
    const api = useContext(apiContext);
    const app = useContext(appContext);
    const [page, setPage] = useState(0);
    const [secret, setSecret] = useState('');
    const [message, setMessage] = useState(null);

    const { t } = useTranslation();

    const startFlow = () => {
        setPage(1);

        endpoints.add_2fa().then(resp => {
            setSecret(resp.d.totp_secret);
            setPage(2);
        }).catch(() => {
            setPage(-1);
        });

        setTimeout(() => {
            setPage(2);
        }, 500);
    };

    const faPrompt = () => {
        app.promptConfirm({ message: t("2fa.required"), small: true },
            [{ name: 'pin', placeholder: t("2fa.code_prompt"), format: /^\d{6}$/, limit: 6 }]).then(({ pin }) => {
                if (pin.length !== 6) return faPrompt();

                endpoints.verify_2fa(pin).then(async resp => {
                    if (resp.d.valid) {
                        await endpoints._reloadCache();
                        setPage(3);
                    } else {setMessage(t("2fa.validation_fail"));}
                }).catch(e => {
                    console.error(e);
                    setMessage(t("2fa.validation_fail"));
                });
            }).catch(() => {
                setMessage(t("2fa.unable_to_active"));
            });
    };

    const buildURI = sec => {
        return `otpauth://totp/RACTF:${api.user.username}?secret=${sec}&issuer=RACTF`;
    };

    const formatSecret = sec => {
        return (
            sec.substring(0, 4) + " " + sec.substring(4, 8) + " " +
            sec.substring(8, 12) + " " + sec.substring(12, 16)
        );
    };

    return <Page title={t("2fa.2fa")} vCentre>
        {page === 0 ? <>
            <Row>
                {api.user.totp_status === 2 ? t("2fa.replace_prompt") : t("2fa.add_prompt")}
            </Row>
            <Row>
                <b>{t("2fa.no_remove_warning")}</b>
            </Row>

            <Row>
                <Button to={"/settings"} lesser>{t("2fa.nevermind")}</Button>
                <Button click={startFlow}>{t("2fa.enable_2fa")}</Button>
            </Row>
        </> : page === 1 ? <>
            {t("2fa.enabling")}
            <Spinner />
        </> : page === 2 ? <>
            <Row>
                <H2>{t("2fa.finalise")}</H2>
            </Row>
            <Row>
                {t("2fa.please_scan_qr")}
            </Row>
            <Row>
                <QRCode renderAs={"svg"} size={128} fgColor={"#161422"} value={buildURI(secret)} includeMargin />
            </Row>
            <Row>
                {t("2fa.unable_to_qr")}
            </Row>
            <Row>
                <TextBlock>
                    {formatSecret(secret)}
                </TextBlock>
            </Row>

            {message && <Row><FormError>{message}</FormError></Row>}

            <Row>
                <Button click={faPrompt}>{t("2fa.got_it")}</Button>
            </Row>
        </> : page === 3 ? <>
            <Row>
                <H2>{t("2fa.congratulations")}</H2>
            </Row>
            <Row>
                {t("2fa.setup")}
            </Row>
            <Row>
                <Button to={"/"}>Yay!</Button>
            </Row>
        </> : <>
            <Row>
                {t("2fa.error")}
            </Row>
            <Row>
                <Button click={() => setPage(0)}>{t("2fa.restart")}</Button>
            </Row>
        </>}
    </Page>;
};
