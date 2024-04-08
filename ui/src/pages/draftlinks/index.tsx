import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { FormEvent } from "react";



export default function DraftLinksPage() {
    const router = useRouter()
    const { roomId, blueName, redName } = router.query
    const blueLink = "blue link"
    const redLink = "red link"
    const specLink = "spec link"


    function handleSubmit(e: FormEvent) {
        e.preventDefault()
        router.push({
            pathname: '/',
        })
    }

    const handleClick = async (id: string | string[] | undefined) => {
        await router.push({
            pathname: `/draft/${id}`,
            query: { roomId, blueName, redName }
        })
    }

    return (
        <main className="flex flex-col p-4 h-screen w-full max-w-3xl m-auto bg-slate-700">
            <div className="p-2 mt-28 mb-64 flex content-start justify-center text-8xl text-white hover:text-slate-300">
                <h1>Prodraft.lol</h1>
            </div>
            <form onSubmit={handleSubmit} className="flex justify-center">
                <div className="flex flex-col items-center p-2">
                    <input defaultValue={blueLink}
                        className="p-1 m-1 bg-transparent border border-blue-500 w-full text-white mr-3 py-1 px-2  focus:outline-none focus:ring focus:ring-blue-500"
                        type="text"
                        placeholder="Blue team name"
                        aria-label="Blue Team Name">
                    </input>
                    <input defaultValue={redLink}
                        className="p-1 m-1 bg-transparent border border-red-500 w-full text-white mr-3 py-1 px-2  focus:outline-none focus:ring focus:ring-red-500"
                        type="text"
                        placeholder="Red team name"
                        aria-label="Red Team Name">
                    </input>
                    <input defaultValue={specLink}
                        className="p-1 m-1 bg-transparent border border-slate-500 w-full text-white mr-3 py-1 px-2  focus:outline-none focus:ring focus:ring-slate-500"
                        type="text"
                        placeholder="Red team name"
                        aria-label="Red Team Name">
                    </input>
                    <Button className="flex-shrink-0 bg-amber-500 hover:bg-amber-300 border-amber-500 hover:border-amber-300  border-4 text-slate-900 text-base p-2 m-1 rounded">
                        Remake draft links
                    </Button>
                </div>
            </form>
            <div className="flex flex-col items-center p-2">
                <Button onClick={() => handleClick(roomId)}
                    className="flex-shrink-0 bg-amber-500 hover:bg-amber-300 border-amber-500 hover:border-amber-300  border-4 text-slate-900 text-base p-2 m-1 rounded">
                    TEST
                </Button>
            </div>
        </main>
    )
}