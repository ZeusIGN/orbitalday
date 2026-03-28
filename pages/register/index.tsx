import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";
import {Input} from "@heroui/input";
import {Button} from "@heroui/button";
import DefaultLayout from "@/layouts/default";
import {title} from "@/components/primitives";
import {useState} from "react";
import {privateAxios} from "@/api";
import {EyeFilledIcon, EyeSlashFilledIcon} from "@/components/icons";
import {translateServerMessage, useTranslation} from "@/context/TranslationContext";

export default function RegisterPage() {
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const {t} = useTranslation();

    const toggleVisibility = () => setIsVisible(!isVisible);
    const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

    const passwordsMatch = password === confirmPassword;

    const onSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        if (!username || !password) return;
        if (!passwordsMatch) {
            setError(t("auth.passwordsDoNotMatch"));
            return;
        }
        setError("");
        setLoading(true);
        privateAxios.post("/user/register", {username, password, displayName, email: ""}).then(response => {
            setLoading(false);
            window.location.href = "/login";
        }).catch(err => {
            if (err.response && err.response.data) {
                const message = translateServerMessage(err.response.data, t) || t("auth.registrationFailed");
                setError(message);
            }
            setLoading(false);
        });
    }

    return (
        <DefaultLayout>
            <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <span className={title({color: "violet", size: "usm"})}>{t("auth.register")}</span>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={onSubmit} className="flex flex-col">
                            <Input
                                isRequired
                                className="mb-4"
                                color="default"
                                placeholder={t("auth.enterUsername")}
                                label={t("auth.username")}
                                onChange={(e) => setUsername(e.target.value)}
                                value={username}
                            />
                            <Input
                                isRequired
                                className="mb-4"
                                color="default"
                                placeholder={t("auth.enterDisplayName")}
                                label={t("auth.displayName")}
                                onChange={(e) => setDisplayName(e.target.value)}
                                value={displayName}
                            />
                            <Input
                                isRequired
                                className="mb-4"
                                placeholder={t("auth.enterPassword")}
                                label={t("auth.password")}
                                endContent={
                                    <button
                                        aria-label={t("auth.togglePasswordVisibility")}
                                        className="focus:outline-solid outline-transparent"
                                        type="button"
                                        onClick={toggleVisibility}
                                    >
                                        {isVisible ? (
                                            <EyeSlashFilledIcon
                                                className="text-2xl text-default-400 pointer-events-none"/>
                                        ) : (
                                            <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none"/>
                                        )}
                                    </button>
                                }
                                type={isVisible ? "text" : "password"}
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                            />
                            <Input
                                isRequired
                                className="mb-4"
                                placeholder={t("auth.confirmPasswordPlaceholder")}
                                label={t("auth.confirmPassword")}
                                isInvalid={confirmPassword.length > 0 && !passwordsMatch}
                                errorMessage={confirmPassword.length > 0 && !passwordsMatch ? t("auth.passwordsDoNotMatch") : ""}
                                endContent={
                                    <button
                                        aria-label={t("auth.togglePasswordVisibility")}
                                        className="focus:outline-solid outline-transparent"
                                        type="button"
                                        onClick={toggleConfirmVisibility}
                                    >
                                        {isConfirmVisible ? (
                                            <EyeSlashFilledIcon
                                                className="text-2xl text-default-400 pointer-events-none"/>
                                        ) : (
                                            <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none"/>
                                        )}
                                    </button>
                                }
                                type={isConfirmVisible ? "text" : "password"}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                value={confirmPassword}
                            />
                            <Button color="default" type="submit" isDisabled={loading || !passwordsMatch} isLoading={loading}>
                                {t("common.submit")}
                            </Button>
                        </form>
                    </CardBody>
                    <CardFooter>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </CardFooter>
                </Card>
            </section>
        </DefaultLayout>
    );
}