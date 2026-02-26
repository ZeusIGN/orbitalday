import DefaultLayout from "@/layouts/default";
import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";
import {useEffect, useState} from "react";
import {DateEvent} from "@/components/events";
import {Button} from "@heroui/button";
import {useAuth} from "@/context/AuthContext";
import {useRouter} from "next/router";
import {Input} from "@heroui/input";
import {privateAxios} from "@/api";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getOrdinalSuffix(day: number) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}

export default function App() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [editOpen, setEditOpen] = useState(false);
    const [editDate, setEditDate] = useState<number | null>(null);
    const [events, setEvents] = useState<{ [key: number]: DateEvent[] }>({});
    const [unsetEvents, setUnsetEvents] = useState<DateEvent[]>([]);
    const [draggedEvent, setDraggedEvent] = useState<DateEvent | null>(null);
    const [editingEvent, setEditingEvent] = useState<DateEvent | null>(null);
    const {user, currentWorkspace} = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) return;
        router.push("/login").then(r => {
        });
    }, [user]);

    useEffect(() => {
        fetchEvents().then(r => {
        })
    }, [currentWorkspace])

    const handlePrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
            return;
        }
        setSelectedMonth(selectedMonth - 1);
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
            return;
        }
        setSelectedMonth(selectedMonth + 1);
    };

    const handleDateClick = (date: number) => {
        setEditDate(date);
        setEditOpen(true);
    };

    const handleCloseEdit = () => {
        setEditOpen(false);
        setEditDate(null);
    };

    const handleDragStart = (event: DateEvent) => {
        setDraggedEvent(event);
    };

    const handleDragEnd = () => {
        setDraggedEvent(null);
    };

    const handleCurrEditDrop = () => {
        if (!draggedEvent || editDate == null) return;
        if (hasEvent(editDate) && events[editDate].some(e => e.id === draggedEvent.id)) return;
        draggedEvent.setDate = createDate(editDate, selectedMonth, selectedYear);
        const newEvents = {...events};
        if (!newEvents[editDate]) newEvents[editDate] = [];
        newEvents[editDate].push(draggedEvent);
        const newUnset = unsetEvents.filter(e => e.id !== draggedEvent.id);
        setUnsetEvents(newUnset);
        setEvents(newEvents);
        setDraggedEvent(null);
    };

    const handleSidebarDrop = () => {
        if (!draggedEvent) return;
        const newEvents = {...events};
        draggedEvent.setDate = null;
        if (editDate != null && unsetEvents.some(e => e.id === draggedEvent.id)) return;
        if (editDate != null && newEvents[editDate]) {
            newEvents[editDate] = newEvents[editDate].filter(e => e.id !== draggedEvent.id);
        }
        setEvents(newEvents);
        setUnsetEvents([...unsetEvents, draggedEvent]);
        setDraggedEvent(null);
    }

    const createDateCell = (date: number | null, key: string, month?: number, year?: number) => {
        if (date === null) return <div key={key} className="w-[180px] h-[120px]"/>;
        return (
            <div key={key} className={"w-[160px] h-[120px] cursor-pointer"} onClick={() => handleDateClick(date)}>
                <Card className="w-full h-full flex flex-col hover:bg-gray-600">
                    <CardHeader className={"flex justify-between"}>
                        <span>{date}</span>
                        <span
                            className={"text-gray-400"}>{((month && year && createDate(date, month, year).toString() == todayNoTime().toString()) ? "Today" : "")}</span>
                    </CardHeader>
                    <CardBody>
                        <div
                            className="text-sm text-gray-500">{hasEvent(date) ? eventCount(date) + " Event" + (eventCount(date) == 1 ? "" : "s") : "No Events"}</div>
                    </CardBody>
                </Card>
            </div>
        );
    };

    const createMonthGrid = (month: number, year: number) => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDay; i++) {
            cells.push(createDateCell(null, `empty-start-${i}`));
        }
        for (let day = 1; day <= daysInMonth; day++) {
            cells.push(createDateCell(day, `day-${day}`, month, year));
        }
        while (cells.length % 7 !== 0) {
            cells.push(createDateCell(null, `empty-end-${cells.length}`));
        }
        return (
            <div className="grid grid-cols-7 gap-4">
                {cells}
            </div>
        );
    };

    const createHeader = () => {
        return (
            <div>
                <div className="flex items-center justify-center w-full mb-2">
                    <button onClick={handlePrevMonth}
                            className="text-lg px-2 py-1 rounded hover:bg-gray-600">&#8592;</button>
                    <div className="text-lg font-medium text-gray-700 text-center w-full">
                        {new Date(selectedYear, selectedMonth).toLocaleString('default', {month: 'long'})}
                        <span className="text-sm text-gray-500"> {selectedYear}</span>
                    </div>
                    <button onClick={handleNextMonth}
                            className="text-lg px-2 py-1 rounded hover:bg-gray-600">&#8594;</button>
                </div>
                <div className="grid grid-cols-7 w-full">
                    {dayNames.map((name, idx) => (
                        <div
                            className="w-[180px] h-[32px] text-center text-xs font-semibold text-gray-600 flex items-center justify-center"
                            key={idx}>{name}</div>
                    ))}
                </div>
            </div>)
    }

    const editScreen = () => {
        return (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-64">
                {editScreenSidePanel()}
                {editingEvent && editEventScreen()}
                <Card className="p-2" onDrop={handleCurrEditDrop} onDragOver={e => e.preventDefault()}>
                    <CardHeader className="flex items-center justify-between">
                        {new Date(selectedYear, selectedMonth).toLocaleString('default', {month: 'long'})} {editDate}{getOrdinalSuffix(editDate!)}
                        <button onClick={handleCloseEdit} className="text-xl px-1 py-0 rounded hover:bg-gray-600">
                            &times;
                        </button>
                    </CardHeader>
                    <CardBody className="justify-between flex-col gap-4">
                        {!hasEvent(editDate!) && <p className="text-gray-500">No events for this day.</p>}
                        {hasEvent(editDate!) && events[editDate!].map(ev => (
                            createEventElement(ev)
                        ))}
                    </CardBody>
                </Card>
            </div>
        );
    }

    const editScreenSidePanel = () => {
        return (
            <div className="fixed inset-y-0 right-0 z-50 w-1/4 p-4">
                <Card onDrop={handleSidebarDrop} onDragOver={e => e.preventDefault()} className="h-full">
                    <CardHeader className="flex items-center justify-between">
                        <span className="text-lg font-medium text-gray-600">Available Events</span>
                        <Button onPress={e => createUnsetEvent()}>Create Event</Button>
                    </CardHeader>
                    <CardBody>
                        {getUnsetEvents() && getUnsetEvents().length == 0 &&
                            <p className="text-gray-500">No events!</p>}
                        {Array.isArray(getUnsetEvents()) && getUnsetEvents().map(event => createEventElement(event))}
                    </CardBody>
                    <CardFooter>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const editEventScreen = () => {
        return (
            <div className="fixed bottom-1/2 left-1/8 z-50 w-1/4 p-4">
                <Card className="p-4">
                    <CardHeader>
                        <Input
                            defaultValue={editingEvent?.title}
                            labelPlacement={"outside"}
                            placeholder={"Set title"}
                            label={"Title"}
                            onChange={e => setEditingEvent({...editingEvent!, title: e.target.value})}
                        />
                    </CardHeader>
                    <CardBody>
                        <Input
                            labelPlacement={"outside"}
                            placeholder={"Set due date"}
                            label={"Due date"}
                            onChange={e => setEditingEvent({...editingEvent!, dateDue: new Date(e.target.value)})}
                            type={"datetime-local"}
                        />
                        <textarea defaultValue={editingEvent?.description}
                                  onChange={e => setEditingEvent({...editingEvent!, description: e.target.value})}
                                  className="w-full h-32 p-2 border-1 border-gray-500 rounded-s mt-4"/>
                    </CardBody>
                    <CardFooter className="flex gap-2">
                        <Button onPress={e => saveCurrentEdit()}>Save</Button>
                        <Button onPress={e => setEditingEvent(null)}>Close</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const createEventElement = (event: DateEvent) => {
        return (
            <Card
                key={event.id} className="p-2 border rounded mb-2"
                draggable
                onDragStart={() => handleDragStart(event)}
                onDragEnd={handleDragEnd}
            >
                <CardHeader className="text-gray-300 flex items-center justify-between gap-2">
                    {event.title}
                    {event.editable ?
                        <Button onPress={() => setEditingEvent(event)}>Edit</Button>
                        : ""}
                </CardHeader>
                <CardBody>
                    {event.description}
                </CardBody>
                <CardFooter>
                    {event.dateDue && <span className="text-sm text-gray-500">
                        Due: {event.dateDue?.toLocaleDateString()} {event.dateDue?.toLocaleTimeString()}
                    </span>}
                </CardFooter>
            </Card>
        );
    };

    const createUnsetEvent = async () => {
        await privateAxios.get("/workspace/" + currentWorkspace + "/createEvent").then(res => {
            fetchEvents()
        }).catch(e => {
        });
    }

    const fetchEvents = async () => {
        await privateAxios.get("/workspace/" + currentWorkspace + "/events")
            .then(res => {
                const eventsData: DateEvent[] = res.data.events;
                const newEvents: { [key: number]: DateEvent[] } = {};
                const newUnset: DateEvent[] = [];
                Object.values(eventsData).forEach(event => {
                    const dateDue = event.dateDue ? new Date(event.dateDue) : null;
                    const setDate = event.setDate ? new Date(event.setDate) : null;
                    const dateKey = setDate ? setDate.getDate() : null;
                    const eventObj: DateEvent = {
                        id: event.id,
                        title: event.title,
                        description: event.description,
                        dateDue: dateDue,
                        setDate: setDate,
                        attendees: event.attendees,
                        editable: event.editable
                    };
                    if (dateKey) {
                        if (!newEvents[dateKey]) newEvents[dateKey] = [];
                        newEvents[dateKey].push(eventObj);
                    } else {
                        newUnset.push(eventObj);
                    }
                });
                setEvents(newEvents);
                setUnsetEvents(newUnset);
            })
            .catch(e => {
            });
    }

    const saveCurrentEdit = () => {
        if (!editingEvent) return;
        replaceEvent(editingEvent.id, editingEvent);
        setEditingEvent(null);
    }

    const replaceEvent = (id: number, newEvent: DateEvent) => {
        const newEvents = {...events};
        for (const date in newEvents) {
            newEvents[date] = newEvents[date].map(e => e.id === id ? newEvent : e);
        }
        setEvents(newEvents);
        if (unsetEvents.some(e => e.id === id)) {
            setUnsetEvents(unsetEvents.map(e => e.id === id ? newEvent : e));
        }
    }

    const getUnsetEvents = () => {
        if (!unsetEvents) return [] as DateEvent[];
        if (!Array.isArray(unsetEvents)) return unsetEvents as DateEvent[];
        return unsetEvents.filter(e => {
            return e.dateDue == null || (currDate().getTime() < e.dateDue?.getTime());
        });
    }

    const createDate = (day: number, month: number, year: number) => {
        return new Date(year, month, day);
    }

    const todayNoTime = () => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    const currDate = () => {
        return new Date(selectedYear, selectedMonth, editDate!);
    }

    const hasEvent = (date: number) => {
        return events && events[date] && events[date].length > 0;
    }

    const eventCount = (date: number) => {
        if (!events || !events[date]) return 0;
        return events[date].length;
    }

    return (
        <DefaultLayout>
            {editOpen && editScreen()}
            <div className="flex flex-col items-center justify-center gap-4 max-w-[1500px] mx-auto">
                {createHeader()}
                {createMonthGrid(selectedMonth, selectedYear)}
            </div>
        </DefaultLayout>
    );
}