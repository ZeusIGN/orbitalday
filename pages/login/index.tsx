import React, {useEffect, useState} from "react";
import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";
import {Input} from "@heroui/input";
import {Button} from "@heroui/button";
import {title} from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import {privateAxios, setAccessToken} from "@/api";
import {useAuth} from "@/context/AuthContext";
import {useRouter} from "next/router";
import {EyeFilledIcon, EyeSlashFilledIcon} from "@/components/icons";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const {login, user} = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) return;
        router.push("/app").then(r => {});
    }, [user]);

    const toggleVisibility = () => setIsVisible(!isVisible);

    const handleError = (message: string) => {
        setError(message);
        setLoading(false);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;
        setError("");
        setLoading(true);
        try {
            const response = await privateAxios.post("/user/login", {username, password});
            const status = response.status;
            if (status !== 200) {
                const message = (response.data && response.data.body && response.data.body.errorMessage) || "Login failed";
                handleError(message);
                return;
            }
            const body = response.data.body || response.data;
            const accessToken = body.accessToken as string | undefined;
            if (accessToken) {
                setAccessToken(accessToken);
                if (typeof window !== "undefined") window.localStorage.setItem("accessToken", accessToken);
            }
            const returnedUsername = (body.username as string | undefined) || username;
            if (returnedUsername) login({username: returnedUsername});
            setLoading(false);
            await router.push("/app");
        } catch (err: any) {
            if (err.response && err.response.data) {
                const message = (err.response.data.body && err.response.data.body.errorMessage) || err.response.data.message || "Login failed";
                handleError(message);
                return;
            }
            handleError("Unable to login. Please try again.");
        }
    };

    return (
        <DefaultLayout>
            <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <span className={title({color: "violet", size: "usm"})}>Login</span>
                </CardHeader>
                <CardBody>
                    <form onSubmit={onSubmit} className="flex flex-col">
                        <Input
                            isRequired
                            className="mb-4"
                            color="default"
                            placeholder="Enter your username or email"
                            label="Username"
                            onChange={(e) => setUsername(e.target.value)}
                            value={username}
                        />
                        <Input
                            isRequired
                            className="mb-4"
                            placeholder="Enter your password"
                            label="Password"
                            endContent={
                                <button
                                    aria-label="toggle password visibility"
                                    className="focus:outline-solid outline-transparent"
                                    type="button"
                                    onClick={toggleVisibility}
                                >
                                    {isVisible ? (
                                        <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                    ) : (
                                        <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                    )}
                                </button>
                            }
                            type={isVisible ? "text" : "password"}
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                        />
                        <Button color="default" type="submit" isDisabled={loading} isLoading={loading}>
                            Submit
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