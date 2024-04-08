import { Button } from "@/components/ui/button";
import { FormEvent, useEffect, useState } from "react";
import { Router, useRouter } from "next/router";
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://127.0.0.1:3001";

export interface Champion {
    lol_id: string;
    name: string;
    alt_name: string;
    tags: string;
    champ_sq: string;
    champ_ct: string;
    pick_v: string;
    ban_v: string;
}

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


export default function DraftPage() {
    const router = useRouter();
    const socket = useSocket();
    const [champdata, setChampdata] = useState<{ [key: string]: Champion }>({});


    useEffect(() => {
        socket?.on('connect', () => {
            console.log("socket connected")
        })
        socket?.emit('draftpage')

        const updateChampData = (data: { [key: string]: Champion }) => {
            setChampdata(data)
        }
        socket?.on('champdata', updateChampData)

        return () => {
            socket?.off('champdata', updateChampData)
        }
    }, [socket]); // This socket unsure to run the effect on socket change only.


    const bannerClick = async () => {
        await router.push(`/`)
    }


    return (
        <main className="flex flex-col p-0 w-full h-screen space-y-0 m-auto max-w-5xl items-center place-content-start bg-slate-700">
            <div className="p-2 mt-8 mb-8 flex content-start justify-center text-4xl text-white hover:text-slate-300">
                <h1 onClick={() => bannerClick()}>Prodraft.lol</h1>
            </div>

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

                        {Object.entries(champdata).length > 0 ? (
                            Object.entries(champdata).map(([championName, champion]) => (
                                <div key={championName}>
                                    <h2>{champion.name}</h2>
                                    <img src={champion.champ_sq} alt={champion.name} />
                                </div>
                            ))
                        ) : (
                            <h1>Loading...</h1> // Show a loading message while waiting for data
                        )}


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
                <Button className="w-24 h-12 p-2 m-1 text-lg flex-shrink-0 bg-amber-500 hover:bg-amber-300 border-amber-500 hover:border-amber-300  border-4 text-slate-900 rounded"> Validate </Button>
            </div>

        </main>
    )
}