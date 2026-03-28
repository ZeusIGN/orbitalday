import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import {privateAxios} from "@/api";
import DefaultLayout from "@/layouts/default";
import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";
import {Button} from "@heroui/button";
import {title} from "@/components/primitives";
import {addToast} from "@heroui/toast";
import {translateServerMessage, useTranslation} from "@/context/TranslationContext";

interface WorkspaceInfo {
    name: string;
    teamId?: number;
}

interface Role {
    name: string;
    permissions: Record<string, boolean>;
    priority: number;
}

export default function WorkspaceEditPage() {
    const router = useRouter();
    const {id} = router.query;
    const {t} = useTranslation();

    const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
    const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
    const [teamRoles, setTeamRoles] = useState<Role[]>([]);
    const [isTeamWorkspace, setIsTeamWorkspace] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        fetchWorkspaceData();
    }, [id]);

    const fetchWorkspaceData = async () => {
        setLoading(true);
        try {
            const infoResponse = await privateAxios.get(`/workspace/${id}/info`);
            const data: WorkspaceInfo = infoResponse.data;
            setWorkspace(data);
            setIsTeamWorkspace(false);
            if (!!data.teamId) throw new Error("Not a team workspace");
            setIsTeamWorkspace(true);
            const [rolesResponse, workspaceRolesResponse] = await Promise.all([
                privateAxios.get(`/team/${data.teamId}/roles`),
                privateAxios.get(`/workspace/${id}/roles`)
            ]);
            setTeamRoles(rolesResponse.data || []);
            setAllowedRoles(workspaceRolesResponse.data || []);
        } catch (e) {
            setIsTeamWorkspace(false);
        }
        setLoading(false);
    };

    const handleAddRole = async (roleName: string) => {
        try {
            await privateAxios.post(`/workspace/${id}/edit`, {roleName});
            addToast({title: t("workspaces.roleAdded")});
            setAllowedRoles([...allowedRoles, roleName]);
        } catch (e: any) {
            addToast({title: translateServerMessage(e.response?.data, t) || t("workspaces.roleAddFailed")});
        }
    };

    const handleRemoveRole = async (roleName: string) => {
        try {
            await privateAxios.delete(`/workspace/${id}/edit`, {data: {roleName}});
            addToast({title: t("workspaces.roleRemoved")});
            setAllowedRoles(allowedRoles.filter(r => r !== roleName));
        } catch (e: any) {
            addToast({title: translateServerMessage(e.response?.data, t) || t("workspaces.roleRemoveFailed")});
        }
    };

    const availableRoles = teamRoles.filter(role => !allowedRoles.includes(role.name));

    const createPageHeader = () => {
        return (
            <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
                <div className="inline-block max-w-xl text-center justify-center">
                    <span className={title({color: "violet"})}>{t("workspaces.editTitle")}&nbsp;</span>
                    <span className={title()}>{workspace?.name}</span>
                </div>
            </section>
        );
    };

    const createLoadingState = () => {
        return (
            <div className="flex justify-center">
                <p className="text-gray-500">{t("common.loading")}</p>
            </div>
        );
    };

    const createNotTeamWorkspaceMessage = () => {
        return (
            <div className="flex justify-center">
                <Card className="max-w-[500px]">
                    <CardBody>
                        <p className="text-gray-500">{t("workspaces.notTeamWorkspace")}</p>
                    </CardBody>
                    <CardFooter />
                </Card>
            </div>
        );
    };

    const createRoleItem = (roleName: string, onRemove: () => void) => {
        return (
            <div key={roleName} className="flex flex-row justify-between items-center p-3 bg-default-100 rounded-lg">
                <span>{roleName}</span>
                <Button size="sm" color="danger" variant="bordered" onPress={onRemove}>
                    {t("workspaces.removeRole")}
                </Button>
            </div>
        );
    };

    const createCurrentRolesCard = () => {
        return (
            <Card className="flex-1">
                <CardHeader>
                    <h3 className="text-lg font-semibold">{t("workspaces.currentRoles")}</h3>
                </CardHeader>
                <CardBody>
                    <p className="text-sm text-gray-500 mb-4">{t("workspaces.allowedRolesDescription")}</p>
                    {allowedRoles.length === 0 ? (
                        <p className="text-gray-500">{t("workspaces.noRolesAssigned")}</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {allowedRoles.map(roleName => createRoleItem(roleName, () => handleRemoveRole(roleName)))}
                        </div>
                    )}
                </CardBody>
            </Card>
        );
    };

    const createAvailableRoleItem = (role: Role) => {
        return (
            <div key={role.name} className="flex flex-row justify-between items-center p-3 bg-default-100 rounded-lg">
                <div className="flex flex-col">
                    <span>{role.name}</span>
                    <span className="text-xs text-gray-500">{t("teams.roles.priority")}: {role.priority}</span>
                </div>
                <Button size="sm" color="primary" variant="bordered" onPress={() => handleAddRole(role.name)}>
                    {t("workspaces.addRole")}
                </Button>
            </div>
        );
    };

    const createAvailableRolesCard = () => {
        return (
            <Card className="flex-1">
                <CardHeader>
                    <h3 className="text-lg font-semibold">{t("workspaces.availableRoles")}</h3>
                </CardHeader>
                <CardBody>
                    {availableRoles.length === 0 ? (
                        <p className="text-gray-500">{t("teams.roles.noRoles")}</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {availableRoles.map(role => createAvailableRoleItem(role))}
                        </div>
                    )}
                </CardBody>
            </Card>
        );
    };

    const createRolesEditor = () => {
        return (
            <div className="flex flex-row gap-6 max-w-[1200px] mx-auto">
                {createCurrentRolesCard()}
                {createAvailableRolesCard()}
            </div>
        );
    };

    const createBackButton = () => {
        return (
            <div className="flex justify-center mt-6">
                <Button variant="bordered" onPress={() => router.push("/workspaces")}>
                    {t("common.back")}
                </Button>
            </div>
        );
    };

    const createMainContent = () => {
        if (loading) return createLoadingState();
        if (!isTeamWorkspace) return createNotTeamWorkspaceMessage();
        return createRolesEditor();
    };

    if (!id) return null;

    return (
        <DefaultLayout>
            {createPageHeader()}
            {createMainContent()}
            {createBackButton()}
        </DefaultLayout>
    );
}
