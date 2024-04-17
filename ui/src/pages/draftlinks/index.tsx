import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { FormEvent, useRef, useState } from "react";


const PAGE_URL = process.env.NEXT_PUBLIC_PAGE_URL || "http://localhost:3000";


export default function DraftLinksPage() {
    const [copiedLink, setCopiedLink] = useState<string | null>(null);

    const router = useRouter()

    const { ROOM_ID, blueName, redName } = router.query as { ROOM_ID: string; blueName: string; redName: string; }
    const blueLink = `${PAGE_URL}/draft/${ROOM_ID}/blue`
    const redLink = `${PAGE_URL}/draft/${ROOM_ID}/red`
    const specLink = `${PAGE_URL}/draft/${ROOM_ID}`
    const linkRef = useRef(null)


    const handleCopy = (link: string) => {
        const tempInput = document.createElement('input');
        tempInput.value = link;
        document.body.appendChild(tempInput);

        tempInput.select();
        tempInput.setSelectionRange(0, 99999);

        document.execCommand('copy')

        document.body.removeChild(tempInput);

        setCopiedLink(link);
        setTimeout(() => {
            setCopiedLink(null);
        }, 1000);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault()
        router.push({
            pathname: '/',
        })
    }

    const specClick = async (id: string) => {
        const url = `/draft/${id}`
        const queryString = new URLSearchParams({ ROOM_ID, blueName, redName }).toString();
        const fullUrl = `${url}?${queryString}`;
        window.open(fullUrl, '_blank'); // Open link in new tab
    }

    const blueClick = async (id: string) => {
        const url = `/draft/${id}/blue`
        const queryString = new URLSearchParams({ ROOM_ID, blueName, redName }).toString();
        const fullUrl = `${url}?${queryString}`;
        window.open(fullUrl, '_blank'); // Open link in new tab
    }

    const redClick = async (id: string) => {
        const url = `/draft/${id}/red`
        const queryString = new URLSearchParams({ ROOM_ID, blueName, redName }).toString();
        const fullUrl = `${url}?${queryString}`;
        window.open(fullUrl, '_blank'); // Open link in new tab
    }

    return (
        <main className="flex flex-col p-4 h-screen w-full m-auto items-center bg-slate-700">
            <div className="p-2 md:mt-28 md:mb-64 md:text-8xl mt-14 mb-14 text-5xl flex  justify-center  text-white hover:text-slate-300">
                <h1>Prodraft.lol</h1>
            </div>
            <form onSubmit={handleSubmit} className="flex justify-center  min-w-3xl max-w-3xl">
                <div className="flex flex-col  ">
                    <div className="flex items-center p-2 my-2 border border-blue-500 w-full text-white   hover:outline-none hover:ring hover:ring-blue-500">
                        <input defaultValue={blueLink}
                            onClick={() => blueClick(ROOM_ID)}
                            className="w-11/12 bg-transparent focus:outline-none "
                            type="text"
                            placeholder="Blue team name"
                            aria-label="Blue Team Name">
                        </input>
                        <svg onClick={() => handleCopy(blueLink)}
                            className="w-auto" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">  <path stroke="none" d="M0 0h24v24H0z" />  <rect x="8" y="8" width="12" height="12" rx="2" />  <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></svg>
                        {copiedLink === blueLink &&
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        }
                    </div>
                    <div className="flex items-center p-2 my-2 w-full text-white border border-red-500 hover:outline-none hover:ring hover:ring-red-500">
                        <input defaultValue={redLink}
                            onClick={() => redClick(ROOM_ID)}
                            className="w-11/12 bg-transparent focus:outline-none"
                            type="text"
                            placeholder="Red team name"
                            aria-label="Red Team Name">
                        </input>
                        <svg onClick={() => handleCopy(redLink)}
                            className="w-auto " width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">  <path stroke="none" d="M0 0h24v24H0z" />  <rect x="8" y="8" width="12" height="12" rx="2" />  <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></svg>
                        {copiedLink === redLink &&
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        }
                    </div>
                    <div className="flex items-center p-2 my-2 w-full border border-slate-500 text-white  hover:outline-none hover:ring hover:ring-slate-500">
                        <input defaultValue={specLink}
                            onClick={() => specClick(ROOM_ID)}
                            className="w-11/12 bg-transparent focus:outline-none"
                            type="text"
                            placeholder="Red team name"
                            aria-label="Red Team Name">
                        </input>
                        <svg onClick={() => handleCopy(specLink)}
                            className="w-auto" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">  <path stroke="none" d="M0 0h24v24H0z" />  <rect x="8" y="8" width="12" height="12" rx="2" />  <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></svg>
                        {copiedLink === specLink &&
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        }
                    </div>
                    <Button className="flex-shrink-0 bg-amber-500 hover:bg-amber-300 border-amber-500 hover:border-amber-300  border-4 text-slate-900 text-base p-2 m-2 rounded">
                        Remake draft links
                    </Button>
                </div>
            </form>
        </main>
    )
}