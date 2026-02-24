import {useAuth} from "@/context/AuthContext";
import {useEffect} from "react";
import {useRouter} from "next/router";
import {privateAxios, setAccessToken} from "@/api";

export default function LogoutPage() {
    const {logout} = useAuth();
    const router = useRouter();

    useEffect(() => {
        const doLogout = async () => {
            try {
                await privateAxios.get("/user/logout");
            } catch (e) {}
            logout();
            await router.push("/login");
        };
        doLogout().then(r => {});
    }, [logout, router]);

    return (<div></div>);
}