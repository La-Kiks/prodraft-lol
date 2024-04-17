import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://127.0.0.1:3001";
const PLAYER = 'red'


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

type DraftPayload = {
    ROOM_ID: string,
    phase: string,
    pturn: string,
    idx: number,
    champs: { [key: string]: string }
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


export default function RedDraftPage() {
    // useState declarations :
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
    const [selectTracker, setSelectTracker] = useState<boolean>(true)
    const [slotIndex, setSlotIndex] = useState(0)
    const [timer, setTimer] = useState(69)
    const [ready, setReady] = useState<boolean>(false)
    const [confirmButton, setConfirmButton] = useState<string>('Ready')
    const [gamePhase, setGamePhase] = useState<string>('WAITING')
    const [turn, setTurn] = useState('')

    // Other declarations
    const router = useRouter();
    const { ROOM_ID, blueName, redName } = router.query as { ROOM_ID: string; blueName: string; redName: string; }
    const socket = useSocket();
    const helmetUrl = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/icon-helmet.png"
    const slotNames = Object.keys(selectedChamp);


    // Functions : 
    // INITIALIZE STEP 0 - champ grid + waiting room + not ready
    // F5
    useEffect(() => {
        socket?.on('connect', () => {
            console.log("Socket connected")
            socket?.emit('draftpage', (data: { [key: string]: Champion }) => setChampdata(data))
            socket?.emit('new:room', ROOM_ID)

            socket?.on(`state:${ROOM_ID}`, (draftData: DraftPayload) => {
                if (draftData) {
                    const { ROOM_ID, phase, pturn, idx, champs } = draftData
                    setGamePhase(phase)
                    setTurn(pturn)
                    setSlotIndex(idx)
                    setSelectedChamp(champs)
                }
            })

            socket?.on(`timer:${ROOM_ID}`, (time: number) => {
                setTimeout(() => {
                    setTimer(time)
                }, 500)

                console.log("time :", time)
            })
        })

    }, [ROOM_ID]);



    socket?.on(`start:${ROOM_ID}`, () => {
        setGamePhase('PLAYING')
        setTurn('blue')
    })


    socket?.on(`click:blue:${ROOM_ID}`, (slotName, slotUrl) => {
        setSelectedChamp({ ...selectedChamp, [slotName]: slotUrl })
    })


    // CHAMPION CLICK
    let champSelected = (champUrl: string) => {
        if (gamePhase == 'PLAYING') {
            if (turn == PLAYER) {
                const slotName = slotNames[slotIndex]
                setSelectedChamp({ ...selectedChamp, [slotName]: champUrl })
                setSelectTracker(!selectTracker)
            }
        }
    }

    useEffect(() => {
        const slotName = slotNames[slotIndex]
        const slotUrl = selectedChamp[slotName]
        const clickObject = { ROOM_ID, slotName, slotUrl }
        socket?.emit(`click:red`, clickObject)
    }, [selectTracker])         // Send champion on click

    // DRAFT GAMES & TURNS
    socket?.on(`validate:${ROOM_ID}`, (payload: DraftPayload) => {
        if (payload) {
            const { ROOM_ID, phase, pturn, idx, champs } = payload
            setGamePhase(phase)
            setTurn(pturn)
            setSlotIndex(idx)
            setSelectedChamp(champs)
        } else {
            console.log('error receiving validation')
        }
    })

    // timer logc
    useEffect(() => {
        if (gamePhase == 'PLAYING') {
            const countdown = setTimeout(() => {
                if (timer > 0) {
                    setTimer(prevTimer => prevTimer - 1);
                } else {
                    handleValidate();
                }
            }, 1000);
            return () => clearTimeout(countdown)
        }
    }, [timer])

    // Reset timer on new idx (new pick/ban)
    useEffect(() => {
        if (gamePhase == 'PLAYING') {
            setTimer(60)
        }
    }, [slotIndex])

    // Redirect to the base page
    const bannerClick = async () => {
        await router.push(`/`)
    }

    // Ready check
    useEffect(() => {
        socket?.emit(`ready:${PLAYER}`, ({ ROOM_ID, ready }))
    }, [ready])

    // Change button content with gamephase
    useEffect(() => {
        if (gamePhase == 'PLAYING') {
            setConfirmButton('Confirm')
            setTimer(60)
        } else if (gamePhase == 'OVER') {
            setConfirmButton('New draft')
        }
    }, [gamePhase])

    // change validate button behaviors
    const handleValidate = () => {
        if (gamePhase == 'WAITING') {
            setReady(!ready)
        }
        if (gamePhase == 'PLAYING') {
            if (turn == `${PLAYER}`) {
                const payload: DraftPayload = {
                    ROOM_ID: ROOM_ID,               // string 
                    phase: gamePhase,               // waiting, playing, over
                    pturn: turn,                     // blue/red
                    idx: slotIndex,                 // Would be the turn from 0 to 20 
                    champs: selectedChamp           // The whole table
                }
                socket?.emit(`validate:red`, payload)
            }
        }
        if (gamePhase == 'OVER') {
            bannerClick()
        }
    }


    // Return the page view :
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
            <div className="m-2 p-2 text-white">
                <h3>{PLAYER}</h3>
                <h3>{gamePhase}</h3>
                <h3>{turn}</h3>
            </div>

            <div className="draft-header flex p-2 w-full my-2 bg-slate-200 items-center  ">
                <div className="box1 basis-5/12 bg-blue-100 p-1">
                    <div className="team-name  p-1"><h1>{blueName}</h1></div>
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
                    <div className="team-name flex flex-row-reverse p-1"><h1>{redName}</h1></div>
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
                    onClick={handleValidate}> {confirmButton} </Button>
            </div>

        </main>
    )
}