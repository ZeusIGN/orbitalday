import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";
import DefaultLayout from "@/layouts/default";
import {Button} from "@heroui/button";
import {privateAxios} from "@/api";
import {useEffect, useState} from "react";
import {Input} from "@heroui/input";
import {useRouter} from "next/router";
import {useTranslation} from "@/context/TranslationContext";

export default function TeamsPage() {
    const [teams, setTeams] = useState<{ teamName: string, teamID: number }[]>([]);
    const [invites, setInvites] = useState<{ teamName: string, teamID: number }[]>([]);
    const [creatingTeamName, setCreatingTeamName] = useState("");
    const router = useRouter();
    const {t} = useTranslation();

    useEffect(() => {
        fetchTeams();
        fetchInvites();
    }, []);

    const acceptInvite = (teamID: number) => {
        privateAxios.get("/team/" + teamID + "/join").then(response => {
            window.location.reload();
        }).catch(e => {
        });
    }

    const fetchInvites = () => {
        privateAxios.get("/user/teamInvites").then(response => {
            const data = response.data.invites;
            const loadedInvites: { teamName: string, teamID: number }[] = [];
            for (const id in data) {
                loadedInvites.push({teamName: data[id], teamID: parseInt(id)});
            }
            setInvites(loadedInvites);
        }).catch(e => {
        });
    }

    const fetchTeams = () => {
        privateAxios.get("/user/teams").then(response => {
            const data = response.data.teams;
            const loadedTeams: { teamName: string, teamID: number }[] = [];
            if (Array.isArray(data) && data.length === 0) return;
            for (const id in data) {
                loadedTeams.push({teamName: data[id], teamID: parseInt(id)});
            }
            setTeams(loadedTeams);
        }).catch(e => {
        });
    }

    const createTeam = () => {
        if (!creatingTeamName) return;
        privateAxios.post("/team/register", {name: creatingTeamName}).then(response => {
            setCreatingTeamName("");
            fetchTeams();
        }).catch(e => {
        });
    }

    const createTeamCard = (teamName: string, teamID: number) => {
        return (
            <div onClick={e => router.push("/teams/manage/" + teamID)}>
                <Card className={"max-w-[300px] min-w-[100px] mb-4 cursor-pointer"}>
                    <CardHeader>{teamName}</CardHeader>
                    <CardFooter>{t("common.id")}: {teamID}</CardFooter>
                </Card>
            </div>
        )
    }

    const createNewTeamCard = () => {
        return (
            <Card className={"max-w-[300px] mb-4 cursor-pointer"}>
                <CardHeader className={"text-gray-600"}>{t("teams.createNewTeam")}</CardHeader>
                <CardBody>
                    <Input
                        placeholder={t("teams.enterTeamName")}
                        label={t("teams.teamName")}
                        value={creatingTeamName}
                        onChange={e => setCreatingTeamName(e.target.value)}
                    />
                </CardBody>
                <CardFooter>
                    <Button disabled={!creatingTeamName} onPress={e => createTeam()}>{t("teams.createTeam")}</Button>
                </CardFooter>
            </Card>
        )
    }

    const createInviteCard = (teamName: string, teamID: number) => {
        return (
            <Card className={"max-w-[300px] mb-4cursor-pointer"}>
                <CardHeader className={"text-gray-600"}>{t("teams.invitedTo").replace("{teamName}", teamName)}</CardHeader>
                <CardBody>
                    <p className={"text-gray-500"}>{t("teams.joinTeamDescription")}</p>
                </CardBody>
                <CardFooter>
                    <Button onPress={e => acceptInvite(teamID)}>{t("common.join")} {teamName}</Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <DefaultLayout>
            <div className={"flex flex-row gap-4 mb-4"}>
                {Array.isArray(invites) && invites.map(invite => createInviteCard(invite.teamName, invite.teamID))}
            </div>
            <div className={"flex flex-row gap-4 mb-4 justify-start"}>
                {Array.isArray(teams) && teams.map(team => createTeamCard(team.teamName, team.teamID))}
            </div>
            {createNewTeamCard()}
        </DefaultLayout>
    );
}