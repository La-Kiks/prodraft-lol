import { useRouter } from "next/router";

export default function ErrorPage() {
    const router = useRouter();

    // Redirect to the base page
    const bannerClick = async () => {
        await router.push(`/`)
    }

    return (
        <main className="flex flex-col p-4 h-screen w-full items-center  m-auto bg-slate-800">
            <div className="p-2 mt-28 mb-64 flex content-start justify-center text-8xl text-white hover:text-slate-300">
                <h1 onClick={() => bannerClick()}>Prodraft.lol</h1>
            </div>
            <div onClick={() => bannerClick()}
                className="flex flex-col p-2  max-w-3xl content-start items-center justify-center text-4xl text-white hover:text-slate-300">
                <svg className="h-32 w-32" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">  <path stroke="none" d="M0 0h24v24H0z" />  <circle cx="12" cy="12" r="9" />  <line x1="9" y1="10" x2="9.01" y2="10" />  <line x1="15" y1="10" x2="15.01" y2="10" />  <line x1="9" y1="15" x2="15" y2="15" /></svg>
                <h1 className="p-1 m-1">There was an error...</h1>
                <h1 className="p-1 m-1">Sorry ! Try again !</h1>
            </div>

        </main>
    )
}