import DefaultLayout from "@/layouts/default";
import {useEffect, useState} from "react";
import {privateAxios} from "@/api";
import {Workspace} from "@/components/workspace";
import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";
import {Input} from "@heroui/input";
import {Button} from "@heroui/button";
import {useAuth} from "@/context/AuthContext";
import {useRouter} from "next/router";

export default function WorkspacesPage() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const {currentWorkspace, setCurrentWorkspace} = useAuth();
    const router = useRouter();

    useEffect(() => {
        privateAxios.get("/user/workspaces")
            .then(response => {
                const data = response.data.workspaces;
                const loadedWorkspaces: Workspace[] = [];
                if (Array.isArray(data) && data.length === 0) return;
                for (const key in data) {
                    loadedWorkspaces.push({id: key, name: data[key]});
                }
                setWorkspaces(loadedWorkspaces);
            }).catch(e => {
        });
    }, []);

    const createWorkspace = async (name: string) => {
        privateAxios.post("/workspace/create", {
            name: name,
            teamID: null
        }).then(response => {
            window.location.reload();
        }).catch(e => {
        });
    }

    const workspaceElement = (workspace: Workspace) => {
        const id = typeof workspace.id === 'object' ? JSON.stringify(workspace.id) : String(workspace.id);
        const name = typeof workspace.name === 'object' ? JSON.stringify(workspace.name) : String(workspace.name);
        return (
            <div onClick={e => swapToWorkspace(workspace)}>
                <Card className={"max-w-[300px] mb-4 cursor-pointer"}>
                    <CardHeader>{name}</CardHeader>
                    <CardFooter>{id}</CardFooter>
                </Card>
            </div>
        )
    }

    const swapToWorkspace = async (workspace: Workspace) => {
        setCurrentWorkspace(workspace.id);
        await router.push("/app").then(r => {
        });
    }

    return (
        <DefaultLayout>
            <div className={"flex flex-row gap-4 mb-8"}>
                {Array.isArray(workspaces) && workspaces.map(workspace => workspaceElement(workspace))}
            </div>
            <Card className={"max-w-[300px]"}>
                <CardHeader className={"text-gray-600"}>Create Workspace</CardHeader>
                <CardBody>
                    <div>
                        <Input
                            placeholder="Workspace Name"
                            value={newWorkspaceName}
                            onChange={e => setNewWorkspaceName(e.target.value)}
                            label={"Name"}
                        />
                    </div>
                </CardBody>
                <CardFooter>
                    <Button onPress={e => createWorkspace(newWorkspaceName)}>Create Workspace</Button>
                </CardFooter>
            </Card>
        </DefaultLayout>
    );
}