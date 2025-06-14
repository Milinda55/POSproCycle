import {Link} from "react-router-dom";

function LoginPage() {
    return (
        // <div className="bg-amber-200 w-[100%] h-dvh flex flex-col sm:flex-row justify-center items-center gap-4">
        //     <div className="w-60 py-18 text-5xl bg-blue-300 rounded-2xl
        //     hover:scale-[101%] hover:shadow hover:shadow-black text-center">Harigala Shop</div>
        //     <div className="w-60 py-18 text-5xl bg-blue-300 rounded-2xl
        //     hover:scale-[101%] hover:shadow hover:shadow-black text-center">Boyagama Shop</div>
        //
        // </div>
                <div className="min-h-dvh bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col items-center justify-center p-4">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold text-amber-800 mb-2">Welcome to</h1>
                        <div className="text-5xl font-extrabold bg-gradient-to-r from-amber-600 to-amber-800 text-transparent bg-clip-text">
                            POS System
                        </div>
                        <p className="text-amber-600 mt-4">Please select your shop location</p>
                    </div>

                    {/* Shop Cards Container */}
                    <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
                        {/* Harigala Shop Card */}
                        <Link className="flex-1 group" to={"harigala"}>
                            <div className="relative h-full bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                                <div className="relative p-6 h-full flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Harigala</h2>
                                    <p className="text-gray-600 text-center mb-4">Main Branch</p>
                                    <button className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors duration-300">
                                        Enter Shop
                                    </button>
                                </div>
                            </div>
                        </Link>

                        {/* Boyagama Shop Card */}
                        <Link className="flex-1 group" to={"boyagama"}>
                            <div className="relative h-full bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                                <div className="relative p-6 h-full flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Boyagama</h2>
                                    <p className="text-gray-600 text-center mb-4">Second Branch</p>
                                    <button className="px-6 py-2 bg-amber-600 text-white rounded-full font-medium hover:bg-amber-700 transition-colors duration-300">
                                        Enter Shop
                                    </button>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-amber-700 text-sm">
                        <p>Need help? Contact support at support@possystem.com</p>
                    </div>
                </div>
    );
}

export default LoginPage;