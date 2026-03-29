import DefaultLayout from "@/layouts/default";
import {useEffect, useState} from "react";
import {privateAxios} from "@/api";
import {Workspace} from "@/components/workspace";
import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";
import {Dropdown, DropdownItem, DropdownMenu, DropdownTrigger} from "@heroui/dropdown";
import {Input} from "@heroui/input";
import {Button} from "@heroui/button";
import {useRouter} from "next/router";
import {useTranslation} from "@/context/TranslationContext";

interface Team {
    id: number;
    name: string;
}

export default function WorkspacesPage() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [underTeam, setUnderTeam] = useState<number | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const router = useRouter();
    const {t} = useTranslation();

    useEffect(() => {
        fetchTeams();
        fetchWorkspaces();
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await privateAxios.get("/user/teams");
            const data = response.data.teams;
            if (Array.isArray(data) && data.length === 0) return;
            const loadedTeams: Team[] = [];
            for (const key in data) {
                loadedTeams.push({id: parseInt(key), name: data[key]});
            }
            setTeams(loadedTeams);
        } catch (e) {
        }
    };

    const fetchWorkspaces = async () => {
        try {
            const response = await privateAxios.get("/user/workspaces");
            const data = response.data.workspaces;
            if (Array.isArray(data) && data.length === 0) return;

            const loadedWorkspaces: Workspace[] = [];
            for (const key in data) {
                loadedWorkspaces.push({id: key, name: data[key], canEdit: false, teamName: null});
            }

            const workspacesWithPermissions = await Promise.all(
                loadedWorkspaces.map(async (workspace) => {
                    try {
                        const infoResponse = await privateAxios.get(`/workspace/${workspace.id}/info`);
                        const info = infoResponse.data;
                        return {
                            ...workspace, 
                            canEdit: info.canEdit === true,
                            teamName: info.teamName || null
                        };
                    } catch (e) {
                        return workspace;
                    }
                })
            );

            setWorkspaces(workspacesWithPermissions);
        } catch (e) {
        }
    };

    const createWorkspace = async (name: string) => {
        try {
            await privateAxios.post("/workspace/create", {name, teamID: underTeam});
            window.location.reload();
        } catch (e) {
        }
    };

    const swapToWorkspace = async (workspace: Workspace) => {
        await router.push(`/app/${workspace.id}`);
    };

    const handleEditClick = (workspaceId: string) => {
        router.push(`/workspaces/edit/${workspaceId}`);
    };

    const createWorkspaceCard = (workspace: Workspace) => {
        const id = typeof workspace.id === 'object' ? JSON.stringify(workspace.id) : String(workspace.id);
        const name = typeof workspace.name === 'object' ? JSON.stringify(workspace.name) : String(workspace.name);
        const teamDisplay = workspace.teamName || t("workspaces.noTeam");

        return (
            <div key={id} onClick={() => swapToWorkspace(workspace)}>
                <Card className="min-w-[150px] max-w-[300px] mb-4 cursor-pointer">
                    <CardHeader>{name}</CardHeader>
                    <CardFooter className="flex justify-between gap-2">
                        <span>{teamDisplay}</span>
                        {workspace.canEdit && (
                            <div>
                                <Button onPress={() => handleEditClick(id)} size="sm">
                                    {t("common.edit")}
                                </Button>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            </div>
        );
    };

    const createWorkspacesGrid = () => {
        return (
            <div className="flex flex-row gap-4 mb-8 flex-wrap">
                {Array.isArray(workspaces) && workspaces.map(workspace => createWorkspaceCard(workspace))}
            </div>
        );
    };

    const createTeamDropdown = () => {
        const selectedTeamName = underTeam !== null
            ? teams.find(team => team.id === underTeam)?.name || t("common.none")
            : t("workspaces.selectTeam");

        return (
            <Dropdown>
                <DropdownTrigger>
                    <Button>{selectedTeamName}</Button>
                </DropdownTrigger>
                <DropdownMenu>
                    {[
                        <DropdownItem key={-1} onPress={() => setUnderTeam(null)}>
                            {t("common.none")}
                        </DropdownItem>,
                        ...teams.map(team => (
                            <DropdownItem key={team.id} onPress={() => setUnderTeam(team.id)}>
                                {team.name}
                            </DropdownItem>
                        ))
                    ]}
                </DropdownMenu>
            </Dropdown>
        );
    };

    const createNewWorkspaceForm = () => {
        return (
            <Card className="max-w-[300px]">
                <CardHeader className="text-gray-600">
                    {t("workspaces.createWorkspace")}
                </CardHeader>
                <CardBody>
                    <Input
                        placeholder={t("workspaces.enterName")}
                        value={newWorkspaceName}
                        onChange={e => setNewWorkspaceName(e.target.value)}
                        label={t("workspaces.name")}
                    />
                </CardBody>
                <CardFooter className="justify-between">
                    <Button onPress={() => createWorkspace(newWorkspaceName)}>
                        {t("workspaces.createWorkspace")}
                    </Button>
                    {createTeamDropdown()}
                </CardFooter>
            </Card>
        );
    };

    return (
        <DefaultLayout>
            {createWorkspacesGrid()}
            {createNewWorkspaceForm()}
        </DefaultLayout>
    );
}