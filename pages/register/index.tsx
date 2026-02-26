import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";
import {Input} from "@heroui/input";
import {Button} from "@heroui/button";
import DefaultLayout from "@/layouts/default";
import {title} from "@/components/primitives";
import {useState} from "react";
import {privateAxios} from "@/api";
import {EyeFilledIcon, EyeSlashFilledIcon} from "@/components/icons";

export default function RegisterPage() {
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const toggleVisibility = () => setIsVisible(!isVisible);

    const onSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        if (!username || !password) return;
        setError("");
        setLoading(true);
        privateAxios.post("/user/register", {username, password, displayName, email: ""}).then(response => {
            setLoading(false);
            window.location.href = "/login";
        }).catch(err => {
            if (err.response && err.response.data) {
                const message = err.response.data || "Registration failed";
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
                        <span className={title({color: "violet", size: "usm"})}>Register</span>
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
                                color="default"
                                placeholder="Enter your display name"
                                label="Display Name"
                                onChange={(e) => setDisplayName(e.target.value)}
                                value={displayName}
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