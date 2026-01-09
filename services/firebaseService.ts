import { initializeApp } from "firebase/app";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    onSnapshot,
    Timestamp,
    runTransaction
} from "firebase/firestore";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    updatePassword,
    User
} from "firebase/auth";
import { SyncedAppState, Customer, ServiceOrder, Staff } from "../types";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase initialized", app);
const db = getFirestore(app);
const auth = getAuth(app);

// Test Firestore connection
getDoc(doc(db, "appState", "main")).then(docSnap => {
    console.log("Firestore test read:", docSnap.exists() ? docSnap.data() : "No document found");
}).catch(err => {
    console.error("Firestore test error:", err);
});

// Use a separate app instance for admin actions to avoid session conflicts
const adminApp = initializeApp(firebaseConfig, "adminApp");
const adminAuth = getAuth(adminApp);


const stateDocRef = doc(db, "appState", "main");

// Helper to convert Firestore Timestamps to JS Dates recursively
const convertTimestampsToDates = (data: any): any => {
    if (data instanceof Timestamp) {
        return data.toDate();
    }
    if (Array.isArray(data)) {
        return data.map(convertTimestampsToDates);
    }
    if (data !== null && typeof data === 'object' && Object.getPrototypeOf(data) === Object.prototype) {
        return Object.keys(data).reduce((acc, key) => {
            acc[key] = convertTimestampsToDates(data[key]);
            return acc;
        }, {} as { [key: string]: any });
    }
    return data;
};

// Helper to remove undefined values before saving to Firestore
const cleanForFirebase = (data: any): any => {
    if (Array.isArray(data)) {
        return data.map(item => cleanForFirebase(item));
    }
    if (data !== null && typeof data === 'object' && !(data instanceof Date) && !(data instanceof Timestamp)) {
        const cleanedObject: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (value !== undefined) {
                    cleanedObject[key] = cleanForFirebase(value);
                }
            }
        }
        return cleanedObject;
    }
    return data;
};


export const firebaseService = {
    onAuthStateChanged: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    },
    
    signIn: async (email: string, pass: string) => {
        return signInWithEmailAndPassword(auth, email, pass);
    },
    
    signOut: async () => {
        return signOut(auth);
    },
    
    createStaffUser: async (email: string, pass: string) => {
        // Use the separate auth instance for creating users
        return createUserWithEmailAndPassword(adminAuth, email, pass);
    },

    changeStaffPassword: async (email: string, currentPassword: string, newPassword: string) => {
        // Sign in with admin auth using current password to get the user
        const userCredential = await signInWithEmailAndPassword(adminAuth, email, currentPassword);
        // Update the password
        await updatePassword(userCredential.user, newPassword);
        // Sign out from admin auth
        await signOut(adminAuth);
    },

    bootstrapAdminAndData: async (email: string, pass: string, initialState: SyncedAppState) => {
        try {
            await createUserWithEmailAndPassword(auth, email, pass);
            console.log("Admin auth user created successfully.");
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                console.warn("Admin auth user already exists. Proceeding to set database state.");
            } else {
                console.error("Fatal error during admin user creation:", error);
                throw error;
            }
        }

        try {
            await setDoc(stateDocRef, cleanForFirebase(initialState));
            console.log("Initial database state saved successfully.");
        } catch (error) {
            console.error("Fatal error during database state initialization:", error);
            throw error;
        }
    },

    async getInitialState(): Promise<SyncedAppState | null> {
        try {
            const docSnap = await getDoc(stateDocRef);
            if (docSnap.exists()) {
                return convertTimestampsToDates(docSnap.data()) as SyncedAppState;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching initial state from Firebase:", error);
            return null;
        }
    },

    async saveState(state: SyncedAppState) {
        try {
            await setDoc(stateDocRef, cleanForFirebase(state));
        } catch (error) {
            console.error("Error saving state to Firebase:", error);
            throw error;
        }
    },
    
    async addUnconfirmedOrder(orderData: Omit<ServiceOrder, 'id' | 'isGoogleSynced' | 'title' | 'status' | 'customerId' | 'createdById' | 'confirmedById' | 'attendedById' | 'isCheckupOnly' | 'archiveReason' | 'serviceOrderNumber' | 'cancellationReason' | 'createdAt' | 'history' | 'cancelledById' | 'rescheduledCount'> & { customerEmail: string }) {
        try {
            await runTransaction(db, async (transaction) => {
                const stateDoc = await transaction.get(stateDocRef);
                if (!stateDoc.exists()) {
                    throw "App state document does not exist!";
                }
                const currentState = convertTimestampsToDates(stateDoc.data()) as SyncedAppState;
                
                let customerId: string;
                let newCustomers = [...currentState.customers];
                let existingCustomer = currentState.customers.find(c => c.phone === orderData.customerPhone);
                
                if (existingCustomer) {
                    customerId = existingCustomer.id;
                } else {
                    const newCustomerId = `cust${Date.now()}`;
                    const newCustomer: Customer = {
                      id: newCustomerId,
                      name: orderData.customerName,
                      phone: orderData.customerPhone,
                      email: orderData.customerEmail,
                      address: orderData.customerAddress,
                      serviceHistory: [],
                    };
                    if (orderData.latitude !== undefined) newCustomer.latitude = orderData.latitude;
                    if (orderData.longitude !== undefined) newCustomer.longitude = orderData.longitude;
                    newCustomers.push(newCustomer);
                    customerId = newCustomerId;
                }
    
                const newOrderNumber = currentState.lastServiceOrderNumber + 1;
                const formattedOrderNumber = `OS-${String(newOrderNumber).padStart(4, '0')}`;

                const { latitude, longitude, ...restOfOrderData } = orderData;
    
                const newOrder: ServiceOrder = {
                    ...(restOfOrderData as any),
                    id: `so${Date.now()}`,
                    serviceOrderNumber: formattedOrderNumber,
                    title: `${orderData.applianceType} - ${orderData.customerName}`,
                    isGoogleSynced: false,
                    customerId,
                    status: 'Por Confirmar',
                    createdAt: new Date(),
                    history: [{
                        action: 'Creado',
                        timestamp: new Date(),
                        userId: 'public_form',
                        details: 'Cita creada desde formulario público.'
                    }]
                };

                if (latitude !== undefined) newOrder.latitude = latitude;
                if (longitude !== undefined) newOrder.longitude = longitude;

                const finalCustomers = newCustomers.map(c => 
                    c.id === customerId ? { ...c, serviceHistory: [...c.serviceHistory, newOrder.id!] } : c
                );
    
                const newState: SyncedAppState = {
                    ...currentState,
                    customers: finalCustomers,
                    serviceOrders: [...currentState.serviceOrders, newOrder],
                    lastServiceOrderNumber: newOrderNumber,
                };
    
                transaction.set(stateDocRef, cleanForFirebase(newState));
            });
            console.log("Unconfirmed order added successfully via transaction.");
        } catch (error) {
            console.error("Error adding unconfirmed order:", error);
            throw error;
        }
    },

    listenToStateChanges(callback: (state: SyncedAppState) => void) {
        const unsubscribe = onSnapshot(stateDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = convertTimestampsToDates(docSnap.data()) as SyncedAppState;
                callback(data);
            }
        }, (error) => {
            console.error("Error listening to state changes:", error);
        });
        return unsubscribe;
    }
};