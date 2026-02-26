import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";
import DefaultLayout from "@/layouts/default";
import {Button} from "@heroui/button";
import {privateAxios} from "@/api";
import {useEffect, useState} from "react";
import {Input} from "@heroui/input";
import {useRouter} from "next/router";
import {title} from "@/components/primitives";
import {Alert} from "@heroui/alert";

export default function TeamManagePage() {
    const router = useRouter();
    const {id} = router.query;
    if (!id) return null;

    const [teamName, setTeamName] = useState("");
    const [inviteUsername, setInviteUsername] = useState("");
    const [teamMembers, setTeamMembers] = useState<string[]>([]);
    const [alertMsg, setAlertMsg] = useState("");

    const updateAlert = (msg: string) => {
        setAlertMsg(msg);
        setTimeout(() => {
            setAlertMsg("");
        }, 3000);
    }

    useEffect(() => {
        privateAxios.get(`/team/${id}`).then(response => {
            const data = response.data;
            const members = data.members || [];
            setTeamMembers(members);
            setTeamName(data.name);
        }).catch(e => {
        });
    }, [id]);

    const handleInvite = async () => {
        if (!inviteUsername) return;
        privateAxios.post(`/team/${id}/invite`, {username: inviteUsername}).then(response => {
            setInviteUsername("");
            updateAlert(response.data)
        }).catch(e => {
            updateAlert(e.response.data);
        });
    }

    const createMemberCard = (username: string) => {
        return (
            <Card className={"max-w-[200px] mb-4"}>
                <CardHeader>Member: </CardHeader>
                <CardBody>{username}</CardBody>
            </Card>
        );
    }

    const createInviteCard = () => {
        return (
            <Card className={"max-w-[400px] mb-4"}>
                <CardHeader>Invite User</CardHeader>
                <CardBody>
                    <Input placeholder={"Username"} value={inviteUsername}
                           onChange={e => setInviteUsername(e.target.value)}/>
                </CardBody>
                <CardFooter>
                    <Button onPress={handleInvite}>Invite</Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <DefaultLayout>
            {alertMsg &&
                <div className="top-0.5 items-center justify-center w-full">
                    <Alert title={alertMsg}/>
                </div>}
            <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
                <div className="inline-block max-w-xl text-center justify-center">
                    <span className={title({color: "violet"})}>{teamName}&nbsp;</span><br/>
                </div>
            </section>
            <div className={"flex flex-row gap-4 mb-4"}>
                {Array.isArray(teamMembers) && teamMembers.map(member => createMemberCard(member))}
            </div>
            {createInviteCard()}
        </DefaultLayout>
    );
}