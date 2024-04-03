import { Button } from "@/components/ui/button";
import { FormEvent, useEffect, useState } from "react";
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://127.0.0.1:3001";
console.log(SOCKET_URL)

function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const socketIo = io(SOCKET_URL, {
            reconnection: true,
            upgrade: true,
            transports: ["websocket", "polling"],
        });


        setSocket(socketIo);

        return function () {
            socketIo.disconnect()
        };
    }, []);

    return socket;
}

// `app/dashboard/page.tsx` is the UI for the `/dashboard` URL
export default function Page() {

    const socket = useSocket();


    useEffect(() => {
        socket?.on('connect', () => {
            console.log("socket connected")
        })
        socket?.on('socketId', () => {
            console.log(socket.id)
        })
        socket?.emit('hellodraft', () => {
        })
    });


    return (
        <main className="flex flex-col p-4 w-full h-screen space-y-0 m-auto max-w-5xl items-center place-content-start bg-slate-600">
            <h1 className="p-2">Draft Page</h1>

            {/* DRAFT HEADER :
            BOX 1 : Blue team name  + blue teams bans (x3)
            BOX 2 : Timer
            BOX 3 : Red team name + red team bans (x3)
            */}

            <div className="draft-header flex p-2 w-full my-2 bg-slate-200 items-center  ">
                <div className="box1 basis-5/12 bg-blue-100 p-1">
                    <div className="team-name  p-1">Blue</div>
                    <div className="team-bans flex bg-slate-50  p-1">
                        <h1>1</h1>
                        <h1>2</h1>
                        <h1>3</h1>
                    </div>
                </div>

                <div className="box2 basis-2/12 flex justify-center p-1"> TIMER </div>

                <div className="box3 basis-5/12 bg-red-100 p-1 ">
                    <div className="team-name flex flex-row-reverse p-1">Red</div>
                    <div className="team-bans flex flex-row-reverse  bg-slate-50 p-1">
                        <h1>1</h1>
                        <h1>2</h1>
                        <h1>3</h1>
                    </div>
                </div>
            </div>

            {/* CORE DRAFT :
            BOX 1 : BLUE TEAM (6 elements : 5 champs square + 1 box for 2 bans)
            BOX 2 : CHAMPION GRID (1 header + 1 big grid)
            BOX 3 : RED TEAM (6 elements)
            */}

            <div className="core-draft h-96 flex flex-nowrap p-2 w-full m-auto bg-slate-500 items-center ">
                <div className="box1 flex flex-col m-1 p-1 h-full justify-around basis-3/12 bg-blue-200">
                    <div className="bp1">BP1</div>
                    <div className="bp2">BP2</div>
                    <div className="bp3">BP3</div>
                    <div className="bans2 flex px-1 gap-1">
                        <div className="bb4">BB4</div>
                        <div className="bb5">BB5</div>
                    </div>
                    <div className="bp4">BP4</div>
                    <div className="bp5">BP5</div>
                </div>
                <div className="box2 h-full w-full m-auto flex flex-col items-center basis-6/12 bg-slate-100">
                    <div className="header flex justify-around w-full bg-slate-400">
                        <div className="flex">
                            <div className="p-1">T</div>
                            <div className="p-1">J</div>
                            <div className="p-1">M</div>
                            <div className="p-1">A</div>
                            <div className="p-1">S</div>
                        </div>
                        <div className="p-1">Search bar</div>
                    </div>
                    <div className="grid gap-2 overflow-y-scroll grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ">
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                        <div>Placeholder</div>
                    </div>
                </div>
                <div className="box1 flex flex-col m-1 p-1 h-full justify-around items-end basis-3/12 bg-red-200">
                    <div className="bp1">BP1</div>
                    <div className="bp2">BP2</div>
                    <div className="bp3">BP3</div>
                    <div className="bans2 flex flex-row-reverse px-1 gap-1">
                        <div className="bb4">BB4</div>
                        <div className="bb5">BB5</div>
                    </div>
                    <div className="bp4">BP4</div>
                    <div className="bp5">BP5</div>
                </div>
            </div>

            {/* DRAFT FOOTER :
            BOX 1 : BUTTON TO VALIDATE THE CURRENT ACTION
            */}

            <div className="draft-footer">
                <Button className="w-24 h-12 p-2 text-lg bg-amber-300 text-slate-950"> Validate </Button>
            </div>

        </main>
    )
}