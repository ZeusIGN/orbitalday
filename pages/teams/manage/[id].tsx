import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";
import DefaultLayout from "@/layouts/default";
import {Button} from "@heroui/button";
import {privateAxios} from "@/api";
import {ReactNode, useEffect, useState} from "react";
import {Input} from "@heroui/input";
import {useRouter} from "next/router";
import {title} from "@/components/primitives";
import {addToast} from "@heroui/toast";
import {useAuth} from "@/context/AuthContext";
import {translateServerMessage, useTranslation} from "@/context/TranslationContext";

interface SidebarItem {
    id: string;
    label: string;
    icon?: ReactNode;
    requiredPermission?: keyof Permissions;
    requiresOwner?: boolean;
    component: ReactNode;
}

interface Permissions {
    canEditTeam?: boolean;
    canManageMembers?: boolean;
    [key: string]: boolean | undefined;
}

interface AdditionalInfo {
    teamOwner?: boolean | undefined;
    [key: string]: boolean | undefined;
}

interface Role {
    name: string;
    permissions: Permissions;
    priority: number;
}

interface PermissionInfo {
    name: string;
    requirements: {
        adminOnly: boolean;
        ownerOnly: boolean;
    };
}

interface Member {
    username: string;
    role: string;
    permissions: Permissions;
    additionalInfo: AdditionalInfo;
}

const defaultPermissions: Permissions = {};

function getPerms(member: Member | undefined): Permissions {
    if (!member) return defaultPermissions;
    const merged: Permissions = {...defaultPermissions};
    if (!member.permissions) return defaultPermissions;
    for (const permKey in member.permissions) {
        merged[permKey] = member.permissions[permKey];
    }
    return merged;
}

function isTeamOwner(member: Member | undefined): boolean {
    if (!member) return false;
    return member.additionalInfo?.teamOwner === true;
}

function hasPermission(permissions: Permissions, required?: keyof Permissions): boolean {
    if (!required) return true;
    if (permissions["admin"] === true) return true;
    return permissions[required] === true;
}

export default function TeamManagePage() {
    const router = useRouter();
    const {id, section} = router.query;
    const {user} = useAuth();
    const {t} = useTranslation();

    const [teamName, setTeamName] = useState("");
    const [teamMembers, setTeamMembers] = useState<Member[]>([]);
    const [activeSection, setActiveSection] = useState("members");
    const [userPermissions, setUserPermissions] = useState<Permissions>(defaultPermissions);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        if (section && typeof section === "string") {
            setActiveSection(section);
        }
    }, [section]);

    const refreshData = () => {
        if (!id) return;
        privateAxios.get(`/team/${id}`).then(response => {
            setTeamName(response.data.name);
        }).catch(() => {});
        privateAxios.get(`/team/${id}/members`).then(response => {
            const data: Member[] = response.data || [];
            setTeamMembers(data);
            const currentUser = data.find(m => m.username === user?.username);
            setUserPermissions(getPerms(currentUser));
            setIsOwner(isTeamOwner(currentUser));
        }).catch(() => {});
    };

    useEffect(() => {
        refreshData();
    }, [id, user]);

    if (!id) return null;

    const sidebarItems: SidebarItem[] = [
        {
            id: "members",
            label: t("teams.sidebar.members"),
            component: <MembersSection
                currentUser={user?.username}
                teamMembers={teamMembers}
                teamId={id as string}
                callRefresh={refreshData}
                userPermissions={userPermissions}
                isOwner={isOwner}
                isAdmin={userPermissions["admin"] === true}
            />
        },
        {
            id: "invite",
            label: t("teams.sidebar.invite"),
            requiredPermission: "manage_members",
            component: <InviteSection teamId={id as string}/>
        },
        {
            id: "roles",
            label: t("teams.sidebar.roles"),
            requiredPermission: "manage_permissions",
            component: <RolesSection
                teamId={id as string}
                callRefresh={refreshData}
                isOwner={isOwner}
                isAdmin={userPermissions["admin"] === true}
            />
        },
        {
            id: "settings",
            label: t("teams.sidebar.settings"),
            requiredPermission: "manage_team",
            component: <SettingsSection teamId={id as string} teamName={teamName} setTeamName={setTeamName}/>
        },
        {
            id: "danger",
            label: t("teams.sidebar.dangerZone"),
            requiresOwner: true,
            component: <DangerZoneSection teamId={id as string}/>
        }
    ];

    const visibleItems = sidebarItems.filter(item => {
        if (isOwner) return true;
        if (item.requiresOwner) return false;
        return hasPermission(userPermissions, item.requiredPermission);
    });

    const activeItem = visibleItems.find(item => item.id === activeSection) || visibleItems[0];

    const createPageHeader = () => {
        return (
            <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
                <div className="inline-block max-w-xl text-center justify-center">
                    <span className={title({color: "violet"})}>{teamName}&nbsp;</span>
                </div>
            </section>
        );
    };

    const createSidebarButton = (item: SidebarItem) => {
        return (
            <Button
                key={item.id}
                variant={activeItem?.id === item.id ? "solid" : "bordered"}
                color={item.id === "danger" ? "danger" : "default"}
                onPress={() => router.push(`/teams/manage/${id}?section=${item.id}`, undefined, {shallow: true})}
                className="justify-start"
            >
                {item.label}
            </Button>
        );
    };

    const createSidebar = () => {
        return (
            <Card className="min-w-[200px] h-fit">
                <CardBody className="flex flex-col gap-2">
                    {visibleItems.map(item => createSidebarButton(item))}
                </CardBody>
            </Card>
        );
    };

    const createMainContent = () => {
        return (
            <Card className="flex-1">
                <CardBody>
                    {activeItem?.component}
                </CardBody>
            </Card>
        );
    };

    return (
        <DefaultLayout>
            {createPageHeader()}
            <div className="flex flex-row gap-6">
                {createSidebar()}
                {createMainContent()}
            </div>
        </DefaultLayout>
    );
}

function MembersSection({
    currentUser,
    teamMembers,
    teamId,
    callRefresh,
    userPermissions,
    isOwner,
    isAdmin
}: {
    currentUser?: string,
    teamMembers: Member[],
    teamId: string,
    callRefresh: () => void,
    userPermissions: Permissions,
    isOwner: boolean,
    isAdmin: boolean
}) {
    const {t} = useTranslation();
    const [editingMember, setEditingMember] = useState<string | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [availablePermissions, setAvailablePermissions] = useState<PermissionInfo[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [memberPermissions, setMemberPermissions] = useState<Permissions>({});
    const [refreshing, setRefreshing] = useState(true);

    useEffect(() => {
        if (!teamId || !refreshing) return;
        privateAxios.get(`/team/${teamId}/roles`).then(response => {
            setRoles(response.data || []);
        }).catch(() => {});
        privateAxios.get(`/team/permissions`).then(response => {
            setAvailablePermissions(response.data || []);
        }).catch(() => {});
        setRefreshing(false);
        callRefresh();
    }, [teamId, refreshing]);

    const startEditing = (member: Member) => {
        setEditingMember(member.username);
        setSelectedRole(member.role || "");
        setMemberPermissions(member.permissions || {});
        setRefreshing(true);
    };

    const cancelEditing = () => {
        setEditingMember(null);
        setSelectedRole("");
        setMemberPermissions({});
        setRefreshing(true);
    };

    const handleUpdateRole = (username: string) => {
        privateAxios.post(`/team/${teamId}/updateRole/${username}`, {role: selectedRole}).then(() => {
            addToast({title: t("teams.members.roleUpdated")});
            setRefreshing(true);
        }).catch(e => {
            addToast({title: translateServerMessage(e.response?.data, t) || t("teams.members.roleUpdateFailed")});
        });
    };

    const handleUpdatePermissions = (username: string) => {
        privateAxios.post(`/team/${teamId}/updatePermissions/${username}`, {permissions: memberPermissions}).then(() => {
            addToast({title: t("teams.members.permissionsUpdated")});
            setRefreshing(true);
        }).catch(e => {
            addToast({title: translateServerMessage(e.response?.data, t) || t("teams.members.permissionsUpdateFailed")});
        });
    };

    const handleResetPermissions = (username: string) => {
        privateAxios.get(`/team/${teamId}/resetPermissions/${username}`).then(() => {
            addToast({title: t("teams.members.permissionsReset")});
            setRefreshing(true);
        }).catch(e => {
            addToast({title: translateServerMessage(e.response?.data, t) || t("teams.members.permissionsResetFailed")});
        });
    };

    const togglePermission = (permKey: string) => {
        setMemberPermissions(prev => ({...prev, [permKey]: !prev[permKey]}));
    };

    const formatPermissionLabel = (perm: string) => {
        const key = `permissions.${perm}`;
        const translated = t(key);
        if (translated !== key) return translated;
        return perm.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const canModifyPermission = (perm: PermissionInfo) => {
        if (isOwner) return true;
        if (perm.requirements.ownerOnly) return false;
        return !(perm.requirements.adminOnly && !isAdmin);
    };

    const createMemberHeader = (member: Member) => {
        return (
            <CardHeader className="flex flex-row justify-between items-center">
                <div className="flex flex-row gap-2 items-center">
                    {member.username}
                    {member.additionalInfo?.teamOwner && (
                        <span className="text-xs text-purple-500">{t("teams.members.owner")}</span>
                    )}
                    {member.username === currentUser && (
                        <span className="text-xs text-purple-400">{t("teams.members.you")}</span>
                    )}
                </div>
                {hasPermission(userPermissions, "manage_permissions") && editingMember !== member.username && (
                    <Button size="sm" variant="bordered" onPress={() => startEditing(member)}>
                        {t("common.edit")}
                    </Button>
                )}
            </CardHeader>
        );
    };

    const createRoleSelector = (username: string) => {
        return (
            <div>
                <p className="text-sm font-semibold mb-2">{t("teams.members.role")}</p>
                <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    className="w-full p-2 rounded-lg bg-default-100"
                >
                    <option value="">{t("teams.members.noRole")}</option>
                    {roles.map(role => (
                        <option key={role.name} value={role.name}>{role.name}</option>
                    ))}
                </select>
                <Button size="sm" className="mt-2" onPress={() => handleUpdateRole(username)}>
                    {t("teams.members.saveRole")}
                </Button>
            </div>
        );
    };

    const createPermissionCheckbox = (perm: PermissionInfo) => {
        const canModify = canModifyPermission(perm);
        return (
            <label key={perm.name} className={`flex items-center gap-2 ${canModify ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                <input
                    type="checkbox"
                    checked={memberPermissions[perm.name] === true}
                    onChange={() => canModify && togglePermission(perm.name)}
                    disabled={!canModify}
                    className="w-4 h-4"
                />
                <span className="text-sm">
                    {formatPermissionLabel(perm.name)}
                    {perm.requirements.ownerOnly && <span className="text-xs text-purple-500 ml-1">{t("permissions.ownerOnly")}</span>}
                    {perm.requirements.adminOnly && !perm.requirements.ownerOnly && <span className="text-xs text-yellow-500 ml-1">{t("permissions.adminOnly")}</span>}
                </span>
            </label>
        );
    };

    const createPermissionOverrides = (username: string) => {
        return (
            <div>
                <p className="text-sm font-semibold mb-2">{t("teams.members.permissionOverrides")}</p>
                <div className="flex flex-col gap-2">
                    {availablePermissions.map(perm => createPermissionCheckbox(perm))}
                </div>
                <div className="flex gap-2 mt-2">
                    <Button size="sm" onPress={() => handleUpdatePermissions(username)}>
                        {t("teams.members.savePermissions")}
                    </Button>
                    <Button size="sm" variant="bordered" color="warning" onPress={() => handleResetPermissions(username)}>
                        {t("common.reset")}
                    </Button>
                </div>
            </div>
        );
    };

    const createEditingBody = (member: Member) => {
        return (
            <div className="flex flex-col gap-4">
                {createRoleSelector(member.username)}
                {createPermissionOverrides(member.username)}
            </div>
        );
    };

    const createPermissionOverrideDisplay = (member: Member) => {
        if (!hasPermission(userPermissions, "manage_permissions")) return null;
        if (Object.keys(member.permissions || {}).length === 0) return null;

        return (
            <div>
                <p className="text-sm text-gray-500">{t("teams.members.overrides")}</p>
                {Object.entries(member.permissions || {}).map(([perm, value]) => (
                    <div key={perm} className="flex items-center gap-2">
                        <span className={value ? "text-success" : "text-danger"}>
                            {value ? "✓" : "✗"}
                        </span>
                        <span className="text-xs">{formatPermissionLabel(perm)}</span>
                    </div>
                ))}
            </div>
        );
    };

    const createViewBody = (member: Member) => {
        return (
            <div className="flex flex-col gap-2">
                <p className="text-sm">
                    <span className="text-gray-500">{t("teams.members.role")}:</span> {member.role || t("teams.members.noRole")}
                </p>
                {createPermissionOverrideDisplay(member)}
            </div>
        );
    };

    const createMemberCard = (member: Member, index: number) => {
        const isEditing = editingMember === member.username;
        return (
            <Card key={index} className="w-[300px]">
                {createMemberHeader(member)}
                <CardBody>
                    {isEditing ? createEditingBody(member) : createViewBody(member)}
                </CardBody>
                {isEditing && (
                    <CardFooter>
                        <Button variant="bordered" onPress={cancelEditing}>{t("common.back")}</Button>
                    </CardFooter>
                )}
            </Card>
        );
    };

    const createEmptyState = () => {
        return <p className="text-gray-500">{t("teams.members.noMembers")}</p>;
    };

    return (
        <div className="flex flex-row flex-wrap gap-4">
            {Array.isArray(teamMembers) && teamMembers.length > 0
                ? teamMembers.map((member, index) => createMemberCard(member, index))
                : createEmptyState()
            }
        </div>
    );
}

function RolesSection({teamId, callRefresh, isOwner, isAdmin}: {
    teamId: string,
    callRefresh: () => void,
    isOwner: boolean,
    isAdmin: boolean
}) {
    const {t} = useTranslation();
    const [roles, setRoles] = useState<Role[]>([]);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [newRoleName, setNewRoleName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [availablePermissions, setAvailablePermissions] = useState<PermissionInfo[]>([]);
    const [refreshing, setRefreshing] = useState(true);
    const [editingPriority, setEditingPriority] = useState<number>(0);

    useEffect(() => {
        if (!teamId || !refreshing) return;
        fetchRoles();
        fetchPermissions();
        setRefreshing(false);
        callRefresh();
    }, [teamId, refreshing]);

    const fetchPermissions = () => {
        privateAxios.get(`/team/permissions`).then(response => {
            setAvailablePermissions(response.data || []);
        }).catch(() => {});
    };

    const fetchRoles = () => {
        privateAxios.get(`/team/${teamId}/roles`).then(response => {
            setRoles(response.data || []);
        }).catch(() => {});
    };

    const handleCreateRole = () => {
        if (!newRoleName.trim()) return;
        privateAxios.post(`/team/${teamId}/roles`, {name: newRoleName, permissions: {}, priority: 0}).then(() => {
            addToast({title: t("teams.roles.roleCreated")});
            setNewRoleName("");
            setIsCreating(false);
            setRefreshing(true);
        }).catch(e => {
            addToast({title: translateServerMessage(e.response?.data, t) || t("teams.roles.roleCreateFailed")});
        });
    };

    const handleUpdateRole = (role: Role) => {
        privateAxios.put(`/team/${teamId}/roles/${role.name}`, {permissions: role.permissions}).then(() => {
            addToast({title: t("teams.roles.roleUpdated")});
            setEditingRole(null);
            setRefreshing(true);
        }).catch(e => {
            addToast({title: translateServerMessage(e.response?.data, t) || t("teams.roles.roleUpdateFailed")});
        });
    };

    const handleUpdatePriority = (roleName: string, priority: number) => {
        privateAxios.post(`/team/${teamId}/roles/${roleName}/priority`, priority, {
            headers: {'Content-Type': 'application/json'}
        }).then(() => {
            addToast({title: t("teams.roles.priorityUpdated")});
            setRefreshing(true);
        }).catch(e => {
            addToast({title: translateServerMessage(e.response?.data, t) || t("teams.roles.priorityUpdateFailed")});
        });
    };

    const handleDeleteRole = (roleName: string) => {
        privateAxios.delete(`/team/${teamId}/roles/${roleName}`).then(() => {
            addToast({title: t("teams.roles.roleDeleted")});
            setRefreshing(true);
        }).catch(e => {
            addToast({title: translateServerMessage(e.response?.data, t) || t("teams.roles.roleDeleteFailed")});
        });
    };

    const togglePermission = (role: Role, permKey: string) => {
        setEditingRole({
            ...role,
            permissions: {...role.permissions, [permKey]: !role.permissions[permKey]}
        });
    };

    const startEditingRole = (role: Role) => {
        setEditingRole({...role});
        setEditingPriority(role.priority);
    };

    const formatPermissionLabel = (perm: string) => {
        const key = `permissions.${perm}`;
        const translated = t(key);
        if (translated !== key) return translated;
        return perm.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const canModifyPermission = (perm: PermissionInfo) => {
        if (isOwner) return true;
        if (perm.requirements.ownerOnly) return false;
        return !(perm.requirements.adminOnly && !isAdmin);
    };

    const createHeader = () => {
        return (
            <div className="flex flex-row justify-between items-center">
                <h3 className="text-lg font-semibold">{t("teams.roles.title")}</h3>
                {!isCreating && (
                    <Button size="sm" onPress={() => setIsCreating(true)}>{t("teams.roles.createRole")}</Button>
                )}
            </div>
        );
    };

    const createNewRoleForm = () => {
        if (!isCreating) return null;
        return (
            <Card className="max-w-[400px]">
                <CardHeader>{t("teams.roles.createNewRole")}</CardHeader>
                <CardBody>
                    <Input
                        label={t("teams.roles.roleName")}
                        placeholder={t("teams.roles.enterRoleName")}
                        value={newRoleName}
                        onChange={e => setNewRoleName(e.target.value)}
                    />
                </CardBody>
                <CardFooter className="gap-2">
                    <Button onPress={handleCreateRole}>{t("common.create")}</Button>
                    <Button variant="bordered" onPress={() => { setIsCreating(false); setNewRoleName(""); }}>
                        {t("common.cancel")}
                    </Button>
                </CardFooter>
            </Card>
        );
    };

    const createRoleCardHeader = (role: Role) => {
        return (
            <CardHeader className="flex flex-row justify-between items-center">
                <div className="flex flex-col">
                    <span>{role.name}</span>
                    <span className="text-xs text-gray-500">{t("teams.roles.priority")}: {role.priority}</span>
                </div>
                {editingRole?.name !== role.name && (
                    <div className="flex gap-2">
                        <Button size="sm" variant="bordered" onPress={() => startEditingRole(role)}>
                            {t("common.edit")}
                        </Button>
                        <Button size="sm" color="danger" variant="bordered" onPress={() => handleDeleteRole(role.name)}>
                            {t("common.delete")}
                        </Button>
                    </div>
                )}
            </CardHeader>
        );
    };

    const createPriorityEditor = (roleName: string) => {
        if (!isAdmin) return null;
        return (
            <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">{t("teams.roles.priority")}</p>
                <div className="flex flex-row gap-2 items-center">
                    <Input
                        type="number"
                        size="sm"
                        value={String(editingPriority)}
                        onChange={e => setEditingPriority(parseInt(e.target.value) || 0)}
                        className="w-24"
                    />
                    <Button size="sm" onPress={() => handleUpdatePriority(roleName, editingPriority)}>
                        {t("common.set")}
                    </Button>
                </div>
                <p className="text-xs text-gray-500">{t("teams.roles.priorityHint")}</p>
            </div>
        );
    };

    const createPermissionCheckbox = (role: Role, perm: PermissionInfo) => {
        const canModify = canModifyPermission(perm);
        return (
            <label key={perm.name} className={`flex items-center gap-2 ${canModify ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                <input
                    type="checkbox"
                    checked={role.permissions[perm.name] === true}
                    onChange={() => canModify && togglePermission(role, perm.name)}
                    disabled={!canModify}
                    className="w-4 h-4"
                />
                <span>
                    {formatPermissionLabel(perm.name)}
                    {perm.requirements.ownerOnly && <span className="text-xs text-purple-500 ml-1">{t("permissions.ownerOnly")}</span>}
                    {perm.requirements.adminOnly && !perm.requirements.ownerOnly && <span className="text-xs text-yellow-500 ml-1">{t("permissions.adminOnly")}</span>}
                </span>
            </label>
        );
    };

    const createPermissionsEditor = (role: Role) => {
        return (
            <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">{t("teams.roles.permissions")}</p>
                {availablePermissions.map(perm => createPermissionCheckbox(role, perm))}
            </div>
        );
    };

    const createEditingBody = (role: Role) => {
        return (
            <div className="flex flex-col gap-4">
                {createPriorityEditor(role.name)}
                {createPermissionsEditor(editingRole!)}
            </div>
        );
    };

    const createPermissionDisplay = (role: Role, perm: PermissionInfo) => {
        return (
            <div key={perm.name} className="flex items-center gap-2">
                <span className={role.permissions[perm.name] ? "text-success" : "text-gray-500"}>
                    {role.permissions[perm.name] ? "✓" : "✗"}
                </span>
                <span className="text-sm">{formatPermissionLabel(perm.name)}</span>
            </div>
        );
    };

    const createViewBody = (role: Role) => {
        return (
            <div className="flex flex-col gap-1">
                {availablePermissions.map(perm => createPermissionDisplay(role, perm))}
                {availablePermissions.length === 0 && (
                    <p className="text-gray-500 text-sm">{t("teams.roles.loadingPermissions")}</p>
                )}
            </div>
        );
    };

    const createRoleCard = (role: Role) => {
        const isEditing = editingRole?.name === role.name;
        return (
            <Card key={role.name} className="w-[300px]">
                {createRoleCardHeader(role)}
                <CardBody>
                    {isEditing ? createEditingBody(role) : createViewBody(role)}
                </CardBody>
                {isEditing && (
                    <CardFooter className="gap-2">
                        <Button onPress={() => handleUpdateRole(editingRole!)}>{t("common.save")}</Button>
                        <Button variant="bordered" onPress={() => setEditingRole(null)}>{t("common.cancel")}</Button>
                    </CardFooter>
                )}
            </Card>
        );
    };

    const createRolesGrid = () => {
        return (
            <div className="flex flex-row flex-wrap gap-4">
                {roles.map(role => createRoleCard(role))}
            </div>
        );
    };

    const createEmptyState = () => {
        if (roles.length > 0 || isCreating) return null;
        return <p className="text-gray-500">{t("teams.roles.noRoles")}</p>;
    };

    return (
        <div className="flex flex-col gap-4">
            {createHeader()}
            {createNewRoleForm()}
            {createRolesGrid()}
            {createEmptyState()}
        </div>
    );
}

function InviteSection({teamId}: { teamId: string }) {
    const {t} = useTranslation();
    const [inviteUsername, setInviteUsername] = useState("");

    const handleInvite = async () => {
        if (!inviteUsername) return;
        privateAxios.post(`/team/${teamId}/invite`, {username: inviteUsername}).then(response => {
            setInviteUsername("");
            addToast({title: translateServerMessage(response.data, t)});
        }).catch(e => {
            addToast({title: translateServerMessage(e.response?.data, t) || t("teams.invite.failed")});
        });
    };

    return (
        <Card className="max-w-[400px] justify-center items-center text-center">
            <CardHeader>{t("teams.invite.title")}</CardHeader>
            <CardBody>
                <Input
                    placeholder={t("teams.invite.placeholder")}
                    value={inviteUsername}
                    onChange={e => setInviteUsername(e.target.value)}
                />
            </CardBody>
            <CardFooter>
                <Button onPress={handleInvite}>{t("common.invite")}</Button>
            </CardFooter>
        </Card>
    );
}

function SettingsSection({teamId, teamName, setTeamName}: {
    teamId: string,
    teamName: string,
    setTeamName: (name: string) => void
}) {
    const {t} = useTranslation();
    const [editedName, setEditedName] = useState(teamName);

    useEffect(() => {
        setEditedName(teamName);
    }, [teamName]);

    const handleSave = async () => {
        privateAxios.put(`/team/${teamId}`, {name: editedName}).then(() => {
            setTeamName(editedName);
            addToast({title: t("teams.settings.teamNameUpdated")});
        }).catch(e => {
            addToast({title: translateServerMessage(e.response?.data, t) || t("teams.settings.teamNameUpdateFailed")});
        });
    };

    return (
        <Card className="max-w-[400px]">
            <CardHeader>{t("teams.settings.title")}</CardHeader>
            <CardBody>
                <Input
                    label={t("teams.teamName")}
                    placeholder={t("teams.teamName")}
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                />
            </CardBody>
            <CardFooter>
                <Button onPress={handleSave}>{t("common.save")}</Button>
            </CardFooter>
        </Card>
    );
}

function DangerZoneSection({teamId}: { teamId: string }) {
    const router = useRouter();
    const {t} = useTranslation();

    const handleDelete = async () => {
        privateAxios.delete(`/team/${teamId}`).then(() => {
            addToast({title: t("teams.danger.teamDeleted")});
            router.push("/teams");
        }).catch(e => {
            addToast({title: translateServerMessage(e.response?.data, t) || t("teams.danger.teamDeleteFailed")});
        });
    };

    return (
        <Card className="max-w-[400px] border-danger">
            <CardHeader className="text-danger">{t("teams.danger.title")}</CardHeader>
            <CardBody>
                <p className="text-gray-500 mb-4">{t("teams.danger.warning")}</p>
            </CardBody>
            <CardFooter>
                <Button color="danger" onPress={handleDelete}>{t("teams.danger.deleteTeam")}</Button>
            </CardFooter>
        </Card>
    );
}