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