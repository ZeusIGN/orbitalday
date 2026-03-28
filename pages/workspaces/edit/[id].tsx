import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import {privateAxios} from "@/api";

interface Workspace {
    name: string
}

export default function App() {
    const router = useRouter();
    const {id} = router.query;
    if (!id) return null;
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    useEffect(() => {
        fetchWorkspace().then(r => {
        });
    }, []);

    const fetchWorkspace = async () => {
        await privateAxios.get(`/workspace/${id}/info`).then(response => {
            const data: Workspace = response.data;
            setWorkspace(data);
        }).catch(e => {
        });
    }

    return (
        <div className={"p-4"}>
            <h1 className={"text-2xl font-bold mb-4"}>Edit Workspace: {workspace?.name}</h1>
        </div>
    );
}
