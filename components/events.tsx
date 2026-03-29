export interface Label {
    id: number;
    name: string;
    color: string;
}

export interface DateEvent {
    id: number;
    title: string;
    description: string;
    setDate: Date | null;
    dateDue: Date | null;
    attendees: number[];
    label: string;
    editable: boolean;
}

export const sampleEvents: DateEvent[] = [
    {
        id: 1,
        title: "Project Meeting",
        description: "Discuss project milestones and deliverables.",
        setDate: null,
        dateDue: new Date(2026, 1, 10, 15, 0),
        attendees: [0, 1],
        label: "",
        editable: false
    },
    {
        id: 2,
        title: "Team Lunch",
        description: "Team lunch at the local restaurant.",
        setDate: null,
        dateDue: null,
        attendees: [0],
        label: "",
        editable: true
    }
];