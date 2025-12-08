/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DevicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [device, setDevice] = useState<any>(null);

    useEffect(() => {
        const ref = doc(db, 'wearables', 'wearable-' + id);

        const unsubscribe = onSnapshot(ref, (snapshot) => {
            if (snapshot.exists()) {
                setDevice(snapshot.data());
            }
            else 
            {
                setDevice(null);
            }
        });

        return () => unsubscribe();
    }, [id]);

    if (!device) {
        return <div>Loading device data for wearable {id}</div>;
    }

    return (
        <div>
            <h1>Device: {id}</h1>
            <pre>{JSON.stringify(device, null, 2)}</pre>
        </div>
    );
}