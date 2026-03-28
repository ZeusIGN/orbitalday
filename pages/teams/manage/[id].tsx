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

    function refreshData() {
        if (!id) return;
        privateAxios.get(`/team/${id}`).then(response => {
            const data = response.data;
            setTeamName(data.name);
        }).catch(() => {
        });
        privateAxios.get(`/team/${id}/members`).then(response => {
            const data: Member[] = response.data || [];
            setTeamMembers(data);
            const currentUser = data.find(m => m.username === user?.username);
            const permissions = getPerms(currentUser);
            setUserPermissions(permissions);
            setIsOwner(isTeamOwner(currentUser));
        }).catch(() => {
        });
    }

    useEffect(() => {
        refreshData()
    }, [id, user]);

    if (!id) return null;

    const sidebarItems: SidebarItem[] = [
        {
            id: "members",
            label: "Members",
            component: <MembersSection
                currentUser={user?.username}
                teamMembers={teamMembers}
                teamId={id as string}
                callRefresh={() => refreshData()}
                userPermissions={userPermissions}
                isOwner={isOwner}
                isAdmin={userPermissions["admin"] === true}
            />
        },
        {
            id: "invite",
            label: "Invite",
            requiredPermission: "manage_members",
            component: <InviteSection teamId={id as string}/>
        },
        {
            id: "roles",
            label: "Roles",
            requiredPermission: "manage_permissions",
            component: <RolesSection
                teamId={id as string}
                callRefresh={() => refreshData()}
                isOwner={isOwner}
                isAdmin={userPermissions["admin"] === true}
            />
        },
        {
            id: "settings",
            label: "Settings",
            requiredPermission: "manage_team",
            component: <SettingsSection teamId={id as string} teamName={teamName} setTeamName={setTeamName}/>
        },
        {
            id: "danger",
            label: "Danger Zone",
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

    return (
        <DefaultLayout>
            <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
                <div className="inline-block max-w-xl text-center justify-center">
                    <span className={title({color: "violet"})}>{teamName}&nbsp;</span>
                </div>
            </section>
            <div className="flex flex-row gap-6">
                <Card className="min-w-[200px] h-fit">
                    <CardBody className="flex flex-col gap-2">
                        {visibleItems.map(item => (
                            <Button
                                key={item.id}
                                variant={activeItem?.id === item.id ? "solid" : "bordered"}
                                color={item.id === "danger" ? "danger" : "default"}
                                onPress={() => router.push(`/teams/manage/${id}?section=${item.id}`, undefined, {shallow: true})}
                                className="justify-start"
                            >
                                {item.label}
                            </Button>
                        ))}
                    </CardBody>
                </Card>
                <Card className="flex-1">
                    <CardBody>
                        {activeItem?.component}
                    </CardBody>
                </Card>
            </div>
        </DefaultLayout>
    );
}

function MembersSection(
    {
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
    }){
    const [editingMember, setEditingMember] = useState<string | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [availablePermissions, setAvailablePermissions] = useState<PermissionInfo[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [memberPermissions, setMemberPermissions] = useState<Permissions>({});
    const [refreshing, setRefreshing] = useState(true);

    useEffect(() => {
        if (!teamId) return;
        if (!refreshing) return;
        privateAxios.get(`/team/${teamId}/roles`).then(response => {
            setRoles(response.data || []);
        }).catch(() => {
        });
        privateAxios.get(`/team/permissions`).then(response => {
            setAvailablePermissions(response.data || []);
        }).catch(() => {
        });
        setRefreshing(false);
        callRefresh();
    }, [teamId, refreshing]);

    const startEditing = (member: Member) => {
        setEditingMember(member.username);
        setSelectedRole(member.role || "");
        setMemberPermissions(member.permissions || {});
        setRefreshing(true)
    };

    const cancelEditing = () => {
        setEditingMember(null);
        setSelectedRole("");
        setMemberPermissions({});
        setRefreshing(true)
    };

    const handleUpdateRole = (username: string) => {
        privateAxios.post(`/team/${teamId}/updateRole/${username}`, {role: selectedRole}).then(() => {
            addToast({title: "Role updated"});
            setRefreshing(true)
        }).catch(e => {
            addToast({title: e.response?.data || "Failed to update role"});
        });
    };

    const handleUpdatePermissions = (username: string) => {
        privateAxios.post(`/team/${teamId}/updatePermissions/${username}`, {permissions: memberPermissions}).then(() => {
            addToast({title: "Permissions updated"});
            setRefreshing(true)
        }).catch(e => {
            addToast({title: e.response?.data || "Failed to update permissions"});
        });
    };

    const handleResetPermissions = (username: string) => {
        privateAxios.get(`/team/${teamId}/resetPermissions/${username}`).then(() => {
            addToast({title: "Permissions reset"});
            setRefreshing(true)
        }).catch(e => {
            addToast({title: e.response?.data || "Failed to reset permissions"});
        });
    };

    const togglePermission = (permKey: string) => {
        setMemberPermissions(prev => ({
            ...prev,
            [permKey]: !prev[permKey]
        }));
    };

    const formatPermissionLabel = (perm: string) => {
        return perm
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const canModifyPermission = (perm: PermissionInfo) => {
        if (isOwner) return true;
        if (perm.requirements.ownerOnly) return false;
        if (perm.requirements.adminOnly && !isAdmin) return false;
        return true;
    };

    return (
        <div className="flex flex-row flex-wrap gap-4">
            {Array.isArray(teamMembers) && teamMembers.map((member, index) => (
                <Card key={index} className="w-[300px]">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div className="flex flex-row gap-2 items-center">
                            {member.username}
                            {member.additionalInfo?.teamOwner && (
                                <span className="text-xs text-purple-500">(Owner)</span>
                            )}
                            {member.username === currentUser && (
                                <span className="text-xs text-purple-400">(You)</span>
                            )}
                        </div>
                        {hasPermission(userPermissions, "manage_permissions") && editingMember !== member.username && (
                            <Button size="sm" variant="bordered" onPress={() => startEditing(member)}>
                                Edit
                            </Button>
                        )}
                    </CardHeader>
                    <CardBody>
                        {editingMember === member.username ? (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <p className="text-sm font-semibold mb-2">Role</p>
                                    <select
                                        value={selectedRole}
                                        onChange={e => setSelectedRole(e.target.value)}
                                        className="w-full p-2 rounded-lg bg-default-100"
                                    >
                                        <option value="">No role</option>
                                        {roles.map(role => (
                                            <option key={role.name} value={role.name}>{role.name}</option>
                                        ))}
                                    </select>
                                    <Button size="sm" className="mt-2"
                                            onPress={() => handleUpdateRole(member.username)}>
                                        Save Role
                                    </Button>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold mb-2">Permission Overrides</p>
                                    <div className="flex flex-col gap-2">
                                        {availablePermissions.map(perm => {
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
                                                        {perm.requirements.ownerOnly && <span className="text-xs text-purple-500 ml-1">(Owner Only)</span>}
                                                        {perm.requirements.adminOnly && !perm.requirements.ownerOnly && <span className="text-xs text-yellow-500 ml-1">(Admin Only)</span>}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm" onPress={() => handleUpdatePermissions(member.username)}>
                                            Save Permissions
                                        </Button>
                                        <Button size="sm" variant="bordered" color="warning"
                                                onPress={() => handleResetPermissions(member.username)}>
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <p className="text-sm"><span
                                    className="text-gray-500">Role:</span> {member.role || "No role"}</p>
                                {hasPermission(userPermissions, "manage_permissions") && Object.keys(member.permissions || {}).length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500">Overrides:</p>
                                        {Object.entries(member.permissions || {}).map(([perm, value]) => (
                                            <div key={perm} className="flex items-center gap-2">
                                                <span className={value ? "text-success" : "text-danger"}>
                                                    {value ? "✓" : "✗"}
                                                </span>
                                                <span className="text-xs">{formatPermissionLabel(perm)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardBody>
                    {editingMember === member.username && (
                        <CardFooter>
                            <Button variant="bordered" onPress={cancelEditing}>Back</Button>
                        </CardFooter>
                    )}
                </Card>
            ))}
            {(!teamMembers || teamMembers.length === 0) && (
                <p className="text-gray-500">No members found.</p>
            )}
        </div>
    );
}

function RolesSection({teamId, callRefresh, isOwner, isAdmin}: { teamId: string, callRefresh: () => void, isOwner: boolean, isAdmin: boolean }) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [newRoleName, setNewRoleName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [availablePermissions, setAvailablePermissions] = useState<PermissionInfo[]>([]);
    const [refreshing, setRefreshing] = useState(true);
    const [editingPriority, setEditingPriority] = useState<number>(0);

    useEffect(() => {
        if (!teamId) return;
        if (!refreshing) return;
        fetchRoles();
        fetchPermissions();
        setRefreshing(false);
        callRefresh();
    }, [teamId, refreshing]);

    const fetchPermissions = () => {
        privateAxios.get(`/team/permissions`).then(response => {
            setAvailablePermissions(response.data || []);
        }).catch(() => {
        });
    };

    const fetchRoles = () => {
        privateAxios.get(`/team/${teamId}/roles`).then(response => {
            setRoles(response.data || []);
        }).catch(() => {
        });
    };

    const handleCreateRole = () => {
        if (!newRoleName.trim()) return;
        privateAxios.post(`/team/${teamId}/roles`, {name: newRoleName, permissions: {}, priority: 0}).then(() => {
            addToast({title: "Role created"});
            setNewRoleName("");
            setIsCreating(false);
            setRefreshing(true);
        }).catch(e => {
            addToast({title: e.response?.data || "Failed to create role"});
        });
    };

    const handleUpdateRole = (role: Role) => {
        privateAxios.put(`/team/${teamId}/roles/${role.name}`, {permissions: role.permissions}).then(() => {
            addToast({title: "Role updated"});
            setEditingRole(null);
            setRefreshing(true);
        }).catch(e => {
            addToast({title: e.response?.data || "Failed to update role"});
        });
    };

    const handleUpdatePriority = (roleName: string, priority: number) => {
        privateAxios.post(`/team/${teamId}/roles/${roleName}/priority`, priority, {
            headers: { 'Content-Type': 'application/json' }
        }).then(() => {
            addToast({title: "Priority updated"});
            setRefreshing(true);
        }).catch(e => {
            addToast({title: e.response?.data || "Failed to update priority"});
        });
    };

    const handleDeleteRole = (roleName: string) => {
        privateAxios.delete(`/team/${teamId}/roles/${roleName}`).then(() => {
            addToast({title: "Role deleted"});
            setRefreshing(true);
        }).catch(e => {
            addToast({title: e.response?.data || "Failed to delete role"});
        });
    };

    const togglePermission = (role: Role, permKey: string) => {
        const updated = {
            ...role,
            permissions: {
                ...role.permissions,
                [permKey]: !role.permissions[permKey]
            }
        };
        setEditingRole(updated);
    };

    const formatPermissionLabel = (perm: string) => {
        return perm
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const canModifyPermission = (perm: PermissionInfo) => {
        if (isOwner) return true;
        if (perm.requirements.ownerOnly) return false;
        if (perm.requirements.adminOnly && !isAdmin) return false;
        return true;
    };

    const startEditingRole = (role: Role) => {
        setEditingRole({...role});
        setEditingPriority(role.priority);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center">
                <h3 className="text-lg font-semibold">Roles</h3>
                {!isCreating && (
                    <Button size="sm" onPress={() => setIsCreating(true)}>Create Role</Button>
                )}
            </div>

            {isCreating && (
                <Card className="max-w-[400px]">
                    <CardHeader>Create New Role</CardHeader>
                    <CardBody>
                        <Input
                            label="Role Name"
                            placeholder="Enter role name"
                            value={newRoleName}
                            onChange={e => setNewRoleName(e.target.value)}
                        />
                    </CardBody>
                    <CardFooter className="gap-2">
                        <Button onPress={handleCreateRole}>Create</Button>
                        <Button variant="bordered" onPress={() => {
                            setIsCreating(false);
                            setNewRoleName("");
                        }}>Cancel</Button>
                    </CardFooter>
                </Card>
            )}

            <div className="flex flex-row flex-wrap gap-4">
                {roles.map(role => (
                    <Card key={role.name} className="w-[300px]">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div className="flex flex-col">
                                <span>{role.name}</span>
                                <span className="text-xs text-gray-500">Priority: {role.priority}</span>
                            </div>
                            {editingRole?.name !== role.name && (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="bordered" onPress={() => startEditingRole(role)}>
                                        Edit
                                    </Button>
                                    <Button size="sm" color="danger" variant="bordered"
                                            onPress={() => handleDeleteRole(role.name)}>
                                        Delete
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardBody>
                            {editingRole?.name === role.name ? (
                                <div className="flex flex-col gap-4">
                                    {isAdmin && (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm font-semibold">Priority</p>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Input
                                                    type="number"
                                                    size="sm"
                                                    value={String(editingPriority)}
                                                    onChange={e => setEditingPriority(parseInt(e.target.value) || 0)}
                                                    className="w-24"
                                                />
                                                <Button size="sm" onPress={() => handleUpdatePriority(role.name, editingPriority)}>
                                                    Set
                                                </Button>
                                            </div>
                                            <p className="text-xs text-gray-500">Lower number = higher authority</p>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm font-semibold">Permissions</p>
                                        {availablePermissions.map(perm => {
                                            const canModify = canModifyPermission(perm);
                                            return (
                                                <label key={perm.name} className={`flex items-center gap-2 ${canModify ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editingRole.permissions[perm.name] === true}
                                                        onChange={() => canModify && togglePermission(editingRole, perm.name)}
                                                        disabled={!canModify}
                                                        className="w-4 h-4"
                                                    />
                                                    <span>
                                                        {formatPermissionLabel(perm.name)}
                                                        {perm.requirements.ownerOnly && <span className="text-xs text-purple-500 ml-1">(Owner Only)</span>}
                                                        {perm.requirements.adminOnly && !perm.requirements.ownerOnly && <span className="text-xs text-yellow-500 ml-1">(Admin Only)</span>}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    {availablePermissions.map(perm => (
                                        <div key={perm.name} className="flex items-center gap-2">
                                            <span className={role.permissions[perm.name] ? "text-success" : "text-gray-500"}>
                                                {role.permissions[perm.name] ? "✓" : "✗"}
                                            </span>
                                            <span className="text-sm">{formatPermissionLabel(perm.name)}</span>
                                        </div>
                                    ))}
                                    {availablePermissions.length === 0 && (
                                        <p className="text-gray-500 text-sm">Loading permissions...</p>
                                    )}
                                </div>
                            )}
                        </CardBody>
                        {editingRole?.name === role.name && (
                            <CardFooter className="gap-2">
                                <Button onPress={() => handleUpdateRole(editingRole)}>Save</Button>
                                <Button variant="bordered" onPress={() => setEditingRole(null)}>Cancel</Button>
                            </CardFooter>
                        )}
                    </Card>
                ))}
            </div>

            {roles.length === 0 && !isCreating && (
                <p className="text-gray-500">No roles found. Create one to get started.</p>
            )}
        </div>
    );
}

function InviteSection({teamId}: { teamId: string }) {
    const [inviteUsername, setInviteUsername] = useState("");

    const handleInvite = async () => {
        if (!inviteUsername) return;
        privateAxios.post(`/team/${teamId}/invite`, {username: inviteUsername}).then(response => {
            setInviteUsername("");
            addToast({title: response.data});
        }).catch(e => {
            addToast({title: e.response?.data || "Failed to invite user"});
        });
    };

    return (
        <Card className="max-w-[400px] justify-center items-center text-center">
            <CardHeader>Invite User</CardHeader>
            <CardBody>
                <Input
                    placeholder="Username"
                    value={inviteUsername}
                    onChange={e => setInviteUsername(e.target.value)}
                />
            </CardBody>
            <CardFooter>
                <Button onPress={handleInvite}>Invite</Button>
            </CardFooter>
        </Card>
    );
}

function SettingsSection({teamId, teamName, setTeamName}: {
    teamId: string,
    teamName: string,
    setTeamName: (name: string) => void
}) {
    const [editedName, setEditedName] = useState(teamName);

    useEffect(() => {
        setEditedName(teamName);
    }, [teamName]);

    const handleSave = async () => {
        privateAxios.put(`/team/${teamId}`, {name: editedName}).then(() => {
            setTeamName(editedName);
            addToast({title: "Team name updated"});
        }).catch(e => {
            addToast({title: e.response?.data || "Failed to update team"});
        });
    };

    return (
        <Card className="max-w-[400px]">
            <CardHeader>Team Settings</CardHeader>
            <CardBody>
                <Input
                    label="Team Name"
                    placeholder="Team Name"
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                />
            </CardBody>
            <CardFooter>
                <Button onPress={handleSave}>Save</Button>
            </CardFooter>
        </Card>
    );
}

function DangerZoneSection({teamId}: { teamId: string }) {
    const router = useRouter();

    const handleDelete = async () => {
        privateAxios.delete(`/team/${teamId}`).then(() => {
            addToast({title: "Team deleted"});
            router.push("/teams");
        }).catch(e => {
            addToast({title: e.response?.data || "Failed to delete team"});
        });
    };

    return (
        <Card className="max-w-[400px] border-danger">
            <CardHeader className="text-danger">Danger Zone</CardHeader>
            <CardBody>
                <p className="text-gray-500 mb-4">Deleting this team is irreversible. All data will be lost.</p>
            </CardBody>
            <CardFooter>
                <Button color="danger" onPress={handleDelete}>Delete Team</Button>
            </CardFooter>
        </Card>
    );
}