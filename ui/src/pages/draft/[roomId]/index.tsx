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
    const [champdata, setChampdata] = useState<{ [key: string]: Champion }>({});
    const [selectedChamp, setSelectedChamp] = useState<{ [key: string]: string }>({
        BB1: '', RB1: '',
        BB2: '', RB2: '',
        BB3: '', RB3: '',

        BP1: '',
        RP1: '', RP2: '',
        BP2: '', BP3: '',
        RP3: '',

        RB4: '', BB4: '',
        RB5: '', BB5: '',

        RP4: '',
        BP4: '', BP5: '',
        RP5: ''
    });
    const [slotIndex, setSlotIndex] = useState(0)
    const [timer, setTimer] = useState(60)

    useEffect(() => {
        const countdown = setTimeout(() => {
            if (timer > 0) {
                setTimer(prevTimer => prevTimer - 1);
            } else {
                handleValidate();  // Reset timer to 60 seconds included in handleValidate()

            }
        }, 1000); // Update timer every second

        return () => clearTimeout(countdown); // Cleanup timer on component unmount
    }, [timer])

    const slotNames = Object.keys(selectedChamp);

    const champSelected = (champUrl: string) => {
        const slotName = slotNames[slotIndex]
        setSelectedChamp({ ...selectedChamp, [slotName]: champUrl });
    }

    const handleValidate = () => {
        setSlotIndex(prevIndex => {
            const nextIndex = prevIndex + 1;
            return nextIndex >= slotNames.length ? 0 : nextIndex; // Reset to 0 if outside range
        });
        setTimer(60);
    }

    const helmetUrl = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/icon-helmet.png"

    const router = useRouter();
    const { roomId, blueName, redName } = router.query

    const socket = useSocket();

    useEffect(() => {
        socket?.on('connect', () => {
            console.log("socket connected")
        })
        socket?.emit('draftpage', roomId)

        const updateChampData = (data: { [key: string]: Champion }) => {
            setChampdata(data)
        }
        socket?.on('champdata', updateChampData)

        return () => {
            socket?.off('champdata', updateChampData)
        }
    }, [socket]); // This socket insure to run the effect on socket change only.


    const bannerClick = async () => {
        await router.push(`/`)
    }


    return (
        <main className="flex flex-col p-0 w-full minh600px h-screen space-y-0 m-auto max-w-5xl items-center place-content-start bg-slate-700">
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
                    <div className="team-bans p-1 flex bg-slate-50">
                        {selectedChamp['BB1'] ? (
                            <img className="p-1 max-w-20 max-h-20" src={selectedChamp['BB1']} alt="" />
                        ) : (
                            <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {selectedChamp['BB2'] ? (
                            <img className="p-1 max-w-20 max-h-20" src={selectedChamp['BB2']} alt="" />
                        ) : (
                            <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {selectedChamp['BB3'] ? (
                            <img className="p-1 max-w-20 max-h-20" src={selectedChamp['BB3']} alt="" />
                        ) : (
                            <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                    </div>
                </div>

                <div className="box2 basis-2/12 flex justify-center p-1"> {timer} </div>

                <div className="box3 basis-5/12 bg-red-100 p-1 ">
                    <div className="team-name flex flex-row-reverse p-1">Red</div>
                    <div className="team-bans flex flex-row-reverse  bg-slate-50 p-1">
                        {selectedChamp['RB1'] ? (
                            <img className="p-1 max-w-20 max-h-20" src={selectedChamp['RB1']} alt="" />
                        ) : (
                            <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {selectedChamp['RB2'] ? (
                            <img className="p-1 max-w-20 max-h-20" src={selectedChamp['RB2']} alt="" />
                        ) : (
                            <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {selectedChamp['RB3'] ? (
                            <img className="p-1 max-w-20 max-h-20" src={selectedChamp['RB3']} alt="" />
                        ) : (
                            <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                    </div>
                </div>
            </div>

            {/* CORE DRAFT :
            BOX 1 : BLUE TEAM (6 elements : 5 champs square + 1 box for 2 bans)
            BOX 2 : CHAMPION GRID (1 header + 1 big grid)
            BOX 3 : RED TEAM (6 elements)
            */}

            <div className="core-draft need504pxMinHeight min-h-96 flex flex-nowrap p-2 w-full m-auto bg-slate-500 items-center ">

                <div className="box1 overflow-auto flex flex-col m-0 p-1 h-full justify-around basis-1/3 md:basis-3/12 bg-blue-200">

                    {selectedChamp['BP1'] ? (
                        <img className="p-1 max-w-20 max-h-20" src={selectedChamp['BP1']} alt="" />
                    ) : (
                        <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                    )}
                    {selectedChamp['BP2'] ? (
                        <img className="p-1 max-w-20 max-h-20" src={selectedChamp['BP2']} alt="" />
                    ) : (
                        <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                    )}
                    {selectedChamp['BP3'] ? (
                        <img className="p-1 max-w-20 max-h-20" src={selectedChamp['BP3']} alt="" />
                    ) : (
                        <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                    )}

                    <div className="bans2 flex px-1 gap-1 ml-2  ">

                        {selectedChamp['BB4'] ? (
                            <img className="p-1 max-w-20 max-h-20" src={selectedChamp['BB4']} alt="" />
                        ) : (
                            <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {selectedChamp['BB5'] ? (
                            <img className="p-1 max-w-20 max-h-20" src={selectedChamp['BB5']} alt="" />
                        ) : (
                            <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                        )}

                    </div>

                    {selectedChamp['BP4'] ? (
                        <img className="p-1 max-w-20 max-h-20" src={selectedChamp['BP4']} alt="" />
                    ) : (
                        <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                    )}
                    {selectedChamp['BP5'] ? (
                        <img className="p-1 max-w-20 max-h-20" src={selectedChamp['BP5']} alt="" />
                    ) : (
                        <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                    )}

                </div>

                <div className="box2 h-full w-auto m-auto flex flex-col items-center basis-1/3 md:basis-6/12 bg-slate-700">
                    <div className="header flex flex-wrap justify-around w-full bg-slate-400">
                        <div className="flex">
                            <img className="p-1 max-w-20 max-h-20"
                                src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/svg/position-top.svg"
                                alt="Toplaners" />
                            <img className="p-1 max-w-20 max-h-20"
                                src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/svg/position-jungle.svg"
                                alt="Junglers" />
                            <img className="p-1 max-w-20 max-h-20"
                                src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/svg/position-middle.svg"
                                alt="Midlaners" />
                            <img className="p-1 max-w-20 max-h-20"
                                src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/svg/position-lane.svg"
                                alt="Botlaners" />
                            <img className="p-1 max-w-20 max-h-20"
                                src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/svg/position-utility.svg"
                                alt="Support" />
                        </div>
                        <div className="p-1">
                            <input
                                type="search"
                                className=" m-0 block w-full rounded border border-solid border-neutral-200 bg-transparent bg-clip-padding px-3 py-[0.25rem] text-base font-normal leading-[1.6] text-surface outline-none transition duration-200 ease-in-out placeholder:text-neutral-500 focus:z-[3] focus:border-primary focus:shadow-inset focus:outline-none motion-reduce:transition-none dark:border-white/10 dark:text-white dark:placeholder:text-neutral-200 dark:autofill:shadow-autofill dark:focus:border-primary"
                                placeholder="Search"
                                aria-label="Search"
                                id="exampleFormControlInput4" />
                        </div>
                    </div>
                    <div className="grid gap-0 overflow-y-scroll grid-cols-1 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-6  ">

                        {Object.entries(champdata).length > 0 ? (
                            Object.entries(champdata).map(([championName, champion]) => (
                                <div key={championName}>
                                    <img className="max-w-20 max-h-20 p-1"
                                        src={champion.champ_sq} alt={champion.name}
                                        onClick={() => champSelected(champion.champ_sq)} />
                                </div>
                            ))
                        ) : (
                            <h1>Loading...</h1> // Show a loading message while waiting for data
                        )}


                    </div>
                </div>

                <div className="box1 flex flex-col m-1 p-1 h-full justify-around items-end basis-1/3 md:basis-3/12 bg-red-200">

                    {selectedChamp['RP1'] ? (
                        <img className="p-1 max-w-20 max-h-20" src={selectedChamp['RP1']} alt="" />
                    ) : (
                        <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                    )}
                    {selectedChamp['RP2'] ? (
                        <img className="p-1 max-w-20 max-h-20" src={selectedChamp['RP2']} alt="" />
                    ) : (
                        <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                    )}
                    {selectedChamp['RP3'] ? (
                        <img className="p-1 max-w-20 max-h-20" src={selectedChamp['RP3']} alt="" />
                    ) : (
                        <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                    )}

                    <div className="bans2 flex flex-row-reverse px-1 gap-1">

                        {selectedChamp['RB4'] ? (
                            <img className="p-1 max-w-20 max-h-20" src={selectedChamp['RB4']} alt="" />
                        ) : (
                            <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {selectedChamp['RB5'] ? (
                            <img className="p-1 max-w-20 max-h-20" src={selectedChamp['RB5']} alt="" />
                        ) : (
                            <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                        )}

                    </div>

                    {selectedChamp['RP4'] ? (
                        <img className="p-1 max-w-20 max-h-20" src={selectedChamp['RP4']} alt="" />
                    ) : (
                        <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                    )}
                    {selectedChamp['RP5'] ? (
                        <img className="p-1 max-w-20 max-h-20" src={selectedChamp['RP5']} alt="" />
                    ) : (
                        <img className="p-1 max-w-20 max-h-20" src={helmetUrl} alt="Helmet placeholder" />
                    )}

                </div>
            </div>

            {/* DRAFT FOOTER :
            BOX 1 : BUTTON TO VALIDATE THE CURRENT ACTION
            */}

            <div className="draft-footer">
                <Button className="w-24 h-12 p-2 mt-12 mb-24 text-lg flex-shrink-0 bg-amber-500 hover:bg-amber-300 border-amber-500 hover:border-amber-300  border-4 text-slate-900 rounded"
                    onClick={handleValidate}> Validate </Button>
            </div>

        </main>
    )
}