import React, { useEffect, useState } from 'react';
import { auth } from "../utils/firebase.js";
import { onAuthStateChanged } from "firebase/auth";

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [uname, setUname] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setUname(currentUser?.displayName || currentUser?.email || 'User');
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700/50">
            <div className="max-w-4xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z"/>
                            </svg>
                        </div>
                        <a href="/app"><span>PlayListify</span></a>
                    </h1>
                    
                    <div className="flex items-center space-x-4">
                        
                        <a href="/profile" className="flex-shrink-0">
                            <img
                                src={`https://avatar.iran.liara.run/username?username=${user?.displayName || 'User'}`}
                                alt="Profile"
                                className="w-10 h-10 rounded-full border-2 border-green-500 hover:border-green-400 transition-colors"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;